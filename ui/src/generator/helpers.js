/**
 * @fileoverview Shared utilities for StarMade NPC Creator Lua generation.
 *
 * Contains pure formatting helpers plus lightweight generator-state helpers used
 * by parser and action modules. Public helpers are intentionally grouped by
 * responsibility for easier maintenance.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { _state } from './state.js';

// =============================================================================
// NODE HELPERS
// =============================================================================

/** Allocate a unique generated Lua variable name. */
export function nextVar(prefix = 'entry') {
  return `${prefix}${++_state.nodeCounter}`;
}

/** Create a basic dialog node in generator state. */
export function makeNode(text, ms = 2000) {
  const vn = nextVar();
  _state.nodes.push({ varName: vn, text, ms, hook: null, reactions: [], choices: [] });
  return vn;
}

/** Find a generated node by Lua variable name. */
export function getNode(vn) {
  return _state.nodes.find(n => n.varName === vn);
}

/** Register a Lua hook body if it has not been registered yet. */
export function registerHook(funcName, bodyLines) {
  if (!_state.hooks.has(funcName)) {
    _state.hooks.set(funcName, bodyLines);
  }
}

// =============================================================================
// TEXT / LUA LITERAL HELPERS
// =============================================================================

/** Convert editor placeholders into Lua format-string placeholders. */
export function resolvePlaceholders(text) {
  return text
    .replace(/\{name\}/g,    '%s')
    .replace(/\{partner\}/g, '%s')
    .replace(/\{faction\}/g, '%s')
    .replace(/\{owner\}/g,   '%s')
    .replace(/\{self\}/g,    '%s')
    .replace(/\{entity\}/g,  '%s');
}

/** Build dialogObject arguments required by placeholders in text. */
export function formatArgs(text) {
  const args = [];
  if (/\{name\}/.test(text))    args.push('dialogObject:getConverationParterName()');
  if (/\{partner\}/.test(text)) args.push('dialogObject:getConverationPartnerAffinity()');
  if (/\{faction\}/.test(text)) args.push('dialogObject:getConverationPartnerFactionName()');
  if (/\{owner\}/.test(text))   args.push('dialogObject:getConverationPartnerOwnerName()');
  if (/\{self\}/.test(text))    args.push('dialogObject:getOwnName()');
  if (/\{entity\}/.test(text))  args.push('dialogObject:getEntity():getName()');
  return args;
}

/** Convert editor text into a dialogObject:format(...) Lua expression. */
export function textExpr(text) {
  const resolved = resolvePlaceholders(text).replace(/"/g, '\\"').replace(/\n/g, '\\n');
  const args = formatArgs(text);
  if (args.length === 0) return `dialogObject:format("${resolved}")`;
  return `dialogObject:format("${resolved}", ${args.join(', ')})`;
}

/** Escape a JavaScript value as a Lua string literal. */
export function luaStringLiteral(s) {
  return `"${String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

/** Sanitize arbitrary text into a safe Lua identifier segment. */
export function sanitizeIdentPart(value) {
  return String(value || '').replace(/\W+/g, '_').replace(/^_+|_+$/g, '') || 'value';
}

/** Produce a stable integer hash for generated hook names. */
export function hashCode(s) {
  s = String(s || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return h;
}

/** Escape text for safe insertion into a RegExp pattern. */
export function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Resolve a Lua numeric token from literals, local assignments or constants. */
export function resolveLuaNumeric(token, body, constVals) {
  token = String(token || '').trim().replace(/;$/, '');
  if (!token) return 0;
  if (/^-?\d+(?:\.\d+)?$/.test(token)) return Number(token);
  const localRe = new RegExp(`(?:^|\\r?\\n)\\s*(?:local\\s+)?${escapeRegExp(token)}\\s*=\\s*(-?\\d+(?:\\.\\d+)?)\\s*;?`, 'm');
  const localM = String(body || '').match(localRe);
  if (localM) return Number(localM[1]);
  if (constVals && Object.prototype.hasOwnProperty.call(constVals, token)) {
    return Number(constVals[token]) || 0;
  }
  return 0;
}

// =============================================================================
// BLOCK SERIALIZATION METADATA
// =============================================================================

/** Parse JSON metadata stored in Blockly block.data. */
export function readBlockData(block) {
  if (!block?.data) return {};
  try { return JSON.parse(block.data) || {}; } catch { return {}; }
}

/** Attach parser metadata to a serialized Blockly block. */
export function enrichSerializedBlock(block, data) {
  if (data && Object.keys(data).length > 0) block.data = JSON.stringify(data);
  return block;
}

/** Resolve a reaction target text by return code, with fallback. */
export function reactionText(meta, code, fallback) {
  const reactions = Array.isArray(meta?.reactions) ? meta.reactions : [];
  const hit = reactions.find(r => Number(r.code) === Number(code));
  return hit?.text || fallback;
}

// =============================================================================
// VARIABLE REFERENCES
// =============================================================================

/** Read a connected Var Reference block name from an optional value input. */
export function getOptionalVarName(block, inputName) {
  const child = block?.getInputTargetBlock ? block.getInputTargetBlock(inputName) : null;
  if (!child || child.type !== 'npc_var_ref') return '';
  return String(child.getFieldValue('NAME') || '').trim();
}

/** Build serialized Blockly state for a Var Reference block. */
export function serializedVarRef(varName) {
  if (!varName) return null;
  return { block: { type: 'npc_var_ref', fields: { NAME: varName } } };
}

/** Attach a serialized Var Reference input to a serialized block. */
export function attachVarRefInput(block, inputName, varName) {
  if (!varName) return block;
  block.inputs = block.inputs || {};
  block.inputs[inputName] = serializedVarRef(varName);
  return block;
}

/** Collect floating Variable block declarations from a workspace block list. */
export function collectDeclaredVariablesFromBlocks(blocks) {
  const vars = new Map();
  for (const b of blocks || []) {
    if (b.type !== 'npc_lua_var') continue;
    const name = String(b.getFieldValue('NAME') || '').trim();
    if (!name) continue;
    vars.set(name, {
      value: String(b.getFieldValue('VALUE') || ''),
      mode: b.getFieldValue('MODE') || 'raw',
    });
  }
  return vars;
}

/** List connected Var References that have no matching declaration. */
export function getMissingConnectedVariables(allBlocks) {
  const vars = collectDeclaredVariablesFromBlocks(allBlocks);
  const missing = new Set();
  for (const b of allBlocks) {
    if (b.type !== 'npc_var_ref') continue;
    if (!(b.getParent && b.getParent())) continue;
    const name = String(b.getFieldValue('NAME') || '').trim();
    if (name && !vars.has(name)) missing.add(name);
  }
  return Array.from(missing).sort((a, b) => a.localeCompare(b));
}

/** Convert a Variable block value into the correct Lua literal/raw text. */
export function luaVarLiteral(mode, value) {
  if (mode === 'text')   return luaStringLiteral(value || '');
  if (mode === 'number') return String(Number(value) || 0);
  return String(value || 'nil');
}

// =============================================================================
// LEGACY FLOW HELPERS
// =============================================================================

/** Legacy branch helper retained for modules still importing helpers.js directly. */
export function makeBranchAction(hookFn, bodyLines, block, waitText) {
  registerHook(hookFn, bodyLines);
  const waitVn   = makeNode(waitText || 'Checking...');
  const waitNode = getNode(waitVn);
  waitNode.hook  = hookFn;
  const thenVn = processActions(block, 'THEN', waitVn);
  const elseVn = processActions(block, 'ELSE', waitVn);
  waitNode.reactions = [
    { code:  0, target: thenVn  || makeNode('Done.') },
    { code: -1, target: elseVn  || makeNode('Condition not met.') },
  ];
  return waitVn;
}

// =============================================================================
// LEGACY CHOICE PROCESSING
// =============================================================================

/** Legacy choice-chain processor retained for older generator modules. */
export function processChoices(block, inputName, parentVarName) {
  const choices = [];
  let child = block.getInputTargetBlock(inputName);
  while (child) {
    if (child.type === 'npc_choice') {
      const label  = child.getFieldValue('LABEL');
      const action = processActions(child, 'ACTIONS', parentVarName);
      choices.push({ label, targetVarName: action || makeNode(label) });
    } else if (child.type === 'npc_goback') {
      const label = child.getFieldValue('LABEL');
      choices.push({ label, targetVarName: '__BACK__' + parentVarName });
    }
    child = child.getNextBlock();
  }
  return choices;
}

/** Legacy action processor retained for older generator modules. */
export function processActions(block, inputName, parentVarName) {
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
      });
    }
    return vn;
  }

  return processActionBlock(child, parentVarName);
}


// Forward declaration — filled by generator/blocks/index.js
export let processActionBlock = (_block, _parentVarName) => null;

/** Inject the current processActionBlock implementation to avoid circular imports. */
export function setProcessActionBlock(fn) {
  processActionBlock = fn;
}
