/**
 * @fileoverview Lua generator coordinator for StarMade NPC Creator.
 *
 * This module owns the generation state plumbing and delegates concrete block
 * families to small action modules. The section layout mirrors the structured
 * style used in StarMade-DB: clear file purpose, explicit sections, and concise
 * comments at orchestration boundaries.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { _state } from './state.js';
import { buildConditionExpression } from './conditions.js';
import {
  textExpr,
  luaStringLiteral,
  luaVarLiteral,
  readBlockData,
  enrichSerializedBlock,
  reactionText,
  sanitizeIdentPart,
  getOptionalVarName,
  serializedVarRef,
  attachVarRefInput,
  collectDeclaredVariablesFromBlocks,
  hashCode,
  escapeRegExp,
  resolveLuaNumeric,
} from './helpers.js';
import {
  VAR_SYNC_BINDINGS,
  getMissingConnectedVariables,
  syncVariableDisplays,
  updateVariableReferenceWarnings,
} from '../varSync.js';
import { genCrewAction } from './actions/crew.js';
import { genWorldAction } from './actions/world.js';
import { genSequenceAction } from './actions/sequences.js';
import { genBranchAction } from './actions/branches.js';
import { genItemAction } from './actions/items.js';
import { genPersistenceAction } from './actions/persistence.js';
import { genQuestAction } from './actions/quests.js';
import { genReputationAction } from './actions/reputation.js';
import { genCooldownAction } from './actions/cooldowns.js';
import { genStockAction } from './actions/stock.js';
import { genWorldStateAction } from './actions/worldstate.js';
import { genAdvancedAction } from './actions/advanced.js';
import { genDialogAction } from './actions/dialog.js';

// =============================================================================
// GENERATION METADATA
// =============================================================================

/**
 * Metadata copied from the current Blockly block.
 *
 * `registerHook()` reads it without consuming it because hooks are often
 * registered before the first node is created. `makeNode()` consumes it once so
 * comments/disabled state attach to the primary generated TextEntry.
 */
let _pendingBlockMeta = { comment: null, disabled: false };

/**
 * Subtree-level disabled context.
 *
 * Set to `true` when processing actions inside a disabled `npc_choice` or
 * `npc_goback` block. Causes ALL nodes and hooks generated in that subtree
 * (including chained getNextBlock() blocks) to be marked disabled, even if
 * the inner blocks themselves have isEnabled() = true.
 *
 * Saved and restored around each disabled-choice subtree in processChoices().
 */
let _subtreeDisabled = false;

// =============================================================================
// CORE STATE HELPERS
// =============================================================================

/**
 * Allocate the next generated Lua variable name for a dialog node.
 *
 * @param {string} prefix Variable prefix, usually `entry`.
 * @returns {string} Unique Lua variable name.
 */
function nextVar(prefix = 'entry') {
  return `${prefix}${++_state.nodeCounter}`;
}

/**
 * Create a dialog TextEntry node in generator state.
 *
 * The first node created for a Blockly action inherits the pending comment and
 * disabled state so Lua round-trips can restore Blockly metadata.
 */
function makeNode(text, ms = 2000, opts = {}) {
  const vn = nextVar();
  const comment  = opts.comment  ?? _pendingBlockMeta.comment;
  const disabled = opts.disabled ?? _pendingBlockMeta.disabled;
  _pendingBlockMeta = { comment: null, disabled: false };
  _state.nodes.push({
    varName: vn,
    text,
    ms,
    hook: null,
    reactions: [],
    choices: [],
    comment,
    disabled,
  });
  return vn;
}

/**
 * Resolve a generated node by Lua variable name.
 *
 * @param {string} vn Node variable name.
 * @returns {Object|undefined} Matching generator node.
 */
function getNode(vn) {
  return _state.nodes.find(n => n.varName === vn);
}

/**
 * Register a hook function body and preserve Blockly metadata.
 *
 * Hook registration commonly happens before `makeNode()`, so this function must
 * also see pending block metadata. Reused hooks stay active if at least one
 * active block still references them.
 */
function registerHook(funcName, bodyLines, opts = {}) {
  const disabled = opts.disabled ?? _pendingBlockMeta.disabled ?? false;
  const comment  = opts.comment  ?? _pendingBlockMeta.comment  ?? null;
  if (!_state.hooks.has(funcName)) {
    _state.hooks.set(funcName, { body: bodyLines, disabled, comment });
  } else {
    const hook = _state.hooks.get(funcName);
    if (!Array.isArray(hook)) {
      hook.disabled = hook.disabled && disabled;
      if (!hook.comment && comment) hook.comment = comment;
    }
  }
}

// =============================================================================
// SHARED ACTION BUILDERS
// =============================================================================

/**
 * Build a hook-backed binary condition node with fixed success/failure text.
 *
 * @returns {string} Root wait-node variable name.
 */
function makeBinaryConditionAction(hookFn, bodyLines, waitText, successText, failText) {
  registerHook(hookFn, bodyLines);
  const waitVn    = makeNode(waitText || 'Checking...');
  const successVn = makeNode(successText || 'Condition met.');
  const failVn    = makeNode(failText || 'Condition failed.');
  const waitNode  = getNode(waitVn);
  waitNode.hook = hookFn;
  waitNode.reactions = [
    { code: 0,  target: successVn },
    { code: -1, target: failVn },
  ];
  return waitVn;
}

/**
 * Build a hook-backed branch action using Blockly THEN/ELSE inputs.
 *
 * @returns {string} Root wait-node variable name.
 */
function makeBranchAction(hookFn, bodyLines, block, waitText) {
  registerHook(hookFn, bodyLines);
  const waitVn   = makeNode(waitText || 'Checking...');
  const waitNode = getNode(waitVn);
  waitNode.hook  = hookFn;
  const thenVn = processActions(block, 'THEN', waitVn);
  const elseVn = processActions(block, 'ELSE', waitVn);
  waitNode.reactions = [
    { code: 0,  target: thenVn || makeNode('Done.') },
    { code: -1, target: elseVn || makeNode('Condition not met.') },
  ];
  return waitVn;
}

// =============================================================================
// FLOW PROCESSING
// =============================================================================

/**
 * Convert a chain of Choice/Go Back blocks into generator choice metadata.
 *
 * @returns {Array<{label:string,targetVarName:string}>} Generated choices.
 */
function processChoices(block, inputName, parentVarName) {
  const choices = [];
  let child = block.getInputTargetBlock(inputName);
  while (child) {
    // Respect the Blockly disabled state of each choice/go-back block.
    const choiceDisabled = typeof child.isEnabled === 'function' ? !child.isEnabled() : false;
    if (child.type === 'npc_choice') {
      const label  = child.getFieldValue('LABEL');
      // If the choice block is disabled, propagate that to the pending metadata
      // so that any action nodes generated inside also carry the disabled flag.
      // Also set _subtreeDisabled so all actions in the chain inherit it.
      const prevSubtree = _subtreeDisabled;
      if (choiceDisabled) {
        _subtreeDisabled = true;
        _pendingBlockMeta = { comment: _pendingBlockMeta.comment, disabled: true };
      }
      const action = processActions(child, 'ACTIONS', parentVarName);
      _subtreeDisabled = prevSubtree;
      choices.push({ label, targetVarName: action || makeNode(label), disabled: choiceDisabled });
    } else if (child.type === 'npc_goback') {
      const label = child.getFieldValue('LABEL');
      choices.push({ label, targetVarName: '__BACK__' + parentVarName, disabled: choiceDisabled });
    }
    child = child.getNextBlock();
  }
  return choices;
}

/**
 * Convert the first action connected to a statement input into dialog state.
 *
 * @returns {string|null} Generated root node variable name.
 */
function processActions(block, inputName, parentVarName) {
  const child = block.getInputTargetBlock(inputName);
  if (!child) return null;

  if (child.type === 'npc_choice' || child.type === 'npc_goback') {
    const meta = readBlockData(block);
    const nodeText = meta.nodeText || block.getFieldValue('LABEL') || '...';
    const nodeMs   = Number(meta.nodeMs) || 2000;
    const vn   = makeNode(nodeText, nodeMs);
    const node = getNode(vn);
    const choices = processChoices(block, inputName, parentVarName);
    for (const c of choices) {
      node.choices.push({
        label: c.label,
        targetVarName: c.targetVarName?.startsWith('__BACK__') ? parentVarName : c.targetVarName,
        disabled: c.disabled,
      });
    }
    return vn;
  }

  return processActionBlock(child, parentVarName);
}

// =============================================================================
// ACTION DISPATCH
// =============================================================================

/**
 * Convert a Blockly action block into one or more Lua dialog nodes/hooks.
 *
 * The dispatch intentionally calls category modules first. Remaining inline
 * cases are legacy groups that will be extracted progressively.
 */
function processActionBlock(block, parentVarName) {
  if (!block) return null;
  const blockComment  = (typeof block.getCommentText === 'function' ? block.getCommentText() : null) || null;
  // Block is disabled if either the block itself is disabled OR it lives inside
  // a disabled choice subtree (_subtreeDisabled flag set by processChoices).
  const blockDisabled = _subtreeDisabled || (typeof block.isEnabled === 'function' ? !block.isEnabled() : false);
  _pendingBlockMeta = { comment: blockComment, disabled: blockDisabled };

  const meta = readBlockData(block);

  // Dependency bundle passed to category modules. Keeping this explicit makes
  // action files easy to read/test without importing mutable generator state.
  const actionCtx = {
    getOptionalVarName,
    sanitizeIdentPart,
    registerHook,
    makeNode,
    getNode,
    processActions,
    processChoices,
    processActionBlock,
    processGreeting,
    processCondGreeting,
    genSayValue,
    genConfirm,
    buildConditionExpression,
    makeBranchAction,
    hashCode,
    luaStringLiteral,
  };

  const crewResult = genCrewAction(block, actionCtx);
  if (crewResult !== undefined) return crewResult;
  const worldResult = genWorldAction(block, actionCtx);
  if (worldResult !== undefined) return worldResult;
  const sequenceResult = genSequenceAction(block, actionCtx);
  if (sequenceResult !== undefined) return sequenceResult;
  const branchResult = genBranchAction(block, actionCtx);
  if (branchResult !== undefined) return branchResult;
  const itemResult = genItemAction(block, actionCtx);
  if (itemResult !== undefined) return itemResult;
  const persistenceResult = genPersistenceAction(block, actionCtx);
  if (persistenceResult !== undefined) return persistenceResult;
  const questResult = genQuestAction(block, actionCtx);
  if (questResult !== undefined) return questResult;
  const reputationResult = genReputationAction(block, actionCtx);
  if (reputationResult !== undefined) return reputationResult;
  const cooldownResult = genCooldownAction(block, actionCtx);
  if (cooldownResult !== undefined) return cooldownResult;
  const stockResult = genStockAction(block, actionCtx);
  if (stockResult !== undefined) return stockResult;
  const worldStateResult = genWorldStateAction(block, actionCtx);
  if (worldStateResult !== undefined) return worldStateResult;
  const advancedResult = genAdvancedAction(block, actionCtx);
  if (advancedResult !== undefined) return advancedResult;
  const dialogResult = genDialogAction(block, actionCtx);
  if (dialogResult !== undefined) return dialogResult;

  return null;
}

// =============================================================================
// DIALOG ROOTS
// =============================================================================

/**
 * Generate the root dialog entry from a Greeting block.
 *
 * @returns {string} Root node variable name.
 */
function processGreeting(block) {
  const text = block.getFieldValue('TEXT');
  const ms   = parseInt(block.getFieldValue('MS')) || 2000;
  const vn   = block.type === 'npc_greeting' ? 'entry' : nextVar();
  if (vn === 'entry') _state.rootVar = 'entry';
  _state.nodes.push({ varName: vn, text, ms, hook: null, reactions: [], choices: [] });
  const choices = processChoices(block, 'CHOICES', vn);
  const node = _state.nodes.find(n => n.varName === vn);
  for (const c of choices) {
    if (c.targetVarName && c.targetVarName.startsWith('__BACK__')) {
      node.choices.push({ label: c.label, targetVarName: vn, disabled: c.disabled });
    } else {
      node.choices.push({ label: c.label, targetVarName: c.targetVarName, disabled: c.disabled });
    }
  }
  return vn;
}

// npc_cond_greeting: conditional root — evaluates expression, branches to THEN or ELSE greeting
/**
 * Generate a conditional root that routes to THEN/ELSE greetings.
 *
 * @returns {string} Root node variable name.
 */
function processCondGreeting(block) {
  const condBlock  = block.getInputTargetBlock('COND');
  const expr       = buildConditionExpression(condBlock);
  const hookFn     = `condGreetingHook_${Math.abs(hashCode(expr))}`;
  registerHook(hookFn, [
    `local _c = ${expr}`,
    `if _c then return 0 end`,
    `return -1`,
  ]);

  // Root wait node (very short — just evaluates the condition)
  const rootVn   = 'entry';
  _state.rootVar = 'entry';
  _state.nodes.push({ varName: rootVn, text: '...', ms: 100, hook: hookFn, reactions: [], choices: [] });
  const rootNode = _state.nodes.find(n => n.varName === rootVn);

  // THEN branch — new greeting node
  const thenText = block.getFieldValue('TEXT_THEN') || '...';
  const thenMs   = parseInt(block.getFieldValue('MS_THEN')) || 2000;
  const thenVn   = nextVar('then');
  _state.nodes.push({ varName: thenVn, text: thenText, ms: thenMs, hook: null, reactions: [], choices: [] });
  const thenNode = _state.nodes.find(n => n.varName === thenVn);
  const thenChoices = processChoices(block, 'CHOICES_THEN', thenVn);
  for (const c of thenChoices) {
    thenNode.choices.push({
      label: c.label,
      targetVarName: c.targetVarName?.startsWith('__BACK__') ? thenVn : c.targetVarName,
      disabled: c.disabled,
    });
  }

  // ELSE branch — new greeting node
  const elseText = block.getFieldValue('TEXT_ELSE') || '...';
  const elseMs   = parseInt(block.getFieldValue('MS_ELSE')) || 2000;
  const elseVn   = nextVar('else');
  _state.nodes.push({ varName: elseVn, text: elseText, ms: elseMs, hook: null, reactions: [], choices: [] });
  const elseNode = _state.nodes.find(n => n.varName === elseVn);
  const elseChoices = processChoices(block, 'CHOICES_ELSE', elseVn);
  for (const c of elseChoices) {
    elseNode.choices.push({
      label: c.label,
      targetVarName: c.targetVarName?.startsWith('__BACK__') ? elseVn : c.targetVarName,
      disabled: c.disabled,
    });
  }

  rootNode.reactions = [
    { code:  0, target: thenVn },
    { code: -1, target: elseVn },
  ];
  return rootVn;
}

// npc_say_value: say text with a live player value interpolated
// =============================================================================
// INLINE DIALOG HELPERS
// =============================================================================

/**
 * Generate a live-value Say node backed by a stat-reading hook.
 *
 * @returns {string} Generated node variable name.
 */
function genSayValue(block) {
  const valueType = block.getFieldValue('VALUE_TYPE');
  const text      = block.getFieldValue('TEXT') || '%s';
  const ms        = parseInt(block.getFieldValue('MS')) || 2000;
  const hookFn    = `sayValueHook_${valueType}_${Math.abs(hashCode(text))}`;
  const valueExprMap = {
    credits:   'ps:getCredits()',
    health:    'math.floor(ps:getHealth())',
    maxHealth: 'math.floor(ps:getMaxHealth())',
    factionId: 'ps:getFactionId()',
    sectorId:  'ps:getCurrentSectorId()',
    convState: 'tostring(dialogObject:getConversationState())',
  };
  const valExpr = valueExprMap[valueType] || 'ps:getCredits()';
  const needsPs = valueType !== 'convState';
  const body = needsPs ? [
    `local ps = dialogObject:getEntity()`,
    `if ps == nil then return 0 end`,
    `local _val = tostring(${valExpr})`,
    `return 0`,
  ] : [
    `local _val = ${valExpr}`,
    `return 0`,
  ];
  registerHook(hookFn, body);
  // Build text node — %s will show '...' in editor but the hook sets the actual value at runtime
  const displayText = text.replace('%s', '(live)');
  const vn   = makeNode(displayText, ms);
  const node = getNode(vn);
  node.hook  = hookFn;
  const nextBlock = block.getNextBlock();
  const nextVn    = nextBlock ? processActionBlock(nextBlock, vn) : null;
  if (nextVn) node.reactions = [{ code: 0, target: nextVn }];
  return vn;
}

// npc_confirm: generic yes/no confirmation
/**
 * Generate a yes/no confirmation dialog node.
 *
 * @returns {string} Generated node variable name.
 */
function genConfirm(block) {
  const text     = block.getFieldValue('TEXT')     || 'Are you sure?';
  const ms       = parseInt(block.getFieldValue('MS')) || 2000;
  const yesLabel = block.getFieldValue('YES_LABEL') || 'Yes, proceed.';
  const noLabel  = block.getFieldValue('NO_LABEL')  || 'No, cancel.';
  const vn   = makeNode(text, ms);
  const node = getNode(vn);
  const yesVn = processActions(block, 'YES', vn) || makeNode('Done.');
  const noVn  = processActions(block, 'NO',  vn) || makeNode('Cancelled.');
  node.choices = [
    { label: yesLabel, targetVarName: yesVn },
    { label: noLabel,  targetVarName: noVn  },
  ];
  return vn;
}

// =============================================================================
// PUBLIC API
// =============================================================================

export {
  processGreeting,
  processCondGreeting,
  processActionBlock,
  processActions,
  processChoices,
  buildConditionExpression,
  makeBranchAction,
  makeNode,
  getNode,
  registerHook,
  nextVar,
  hashCode,
  luaStringLiteral,
  sanitizeIdentPart,
  textExpr,
  getOptionalVarName,
  enrichSerializedBlock,
  reactionText,
  attachVarRefInput,
  serializedVarRef,
  collectDeclaredVariablesFromBlocks,
  getMissingConnectedVariables,
  luaVarLiteral,
  escapeRegExp,
  resolveLuaNumeric,
  syncVariableDisplays,
  updateVariableReferenceWarnings,
  VAR_SYNC_BINDINGS,
};
