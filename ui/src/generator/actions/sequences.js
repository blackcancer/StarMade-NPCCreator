/**
 * @fileoverview Sequence and follow-up action generators.
 *
 * Handles auto sequences, polling waits and delayed follow-up hooks.
 * Modules follow the StarMade-DB documentation style: file purpose first,
 * section separators, and small generator functions with explicit dependencies.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

// =============================================================================
// ACTION GENERATOR
// =============================================================================

/**
 * Try to generate Lua state for a block owned by this category.
 *
 * @param {Object} block Blockly block instance.
 * @param {Object} ctx Explicit generator dependencies from core.js.
 * @returns {string|undefined} Root node variable name when handled; undefined otherwise.
 */
export function genSequenceAction(block, ctx) {
  const {
    sanitizeIdentPart,
    hashCode,
    buildConditionExpression,
    registerHook,
    makeNode,
    getNode,
    processActions,
    processActionBlock,
  } = ctx;

  switch (block.type) {
    case 'npc_auto_sequence': {
      const name = sanitizeIdentPart(block.getFieldValue('NAME'));
      const body = String(block.getFieldValue('BODY') || 'return 0').split(';').map(s => s.trim()).filter(Boolean);
      const hookFn = `sequenceHook_${name}`;
      registerHook(hookFn, body.length ? body : ['return 0']);
      const waitVn = makeNode('...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [{ code: 0, target: processActionBlock(block.getNextBlock(), waitVn) || makeNode('Done!') }];
      return waitVn;
    }
    case 'npc_wait_until': {
      const expr = buildConditionExpression(block.getInputTargetBlock('COND'));
      const hookFn = `waitUntilHook_${Math.abs(hashCode(expr))}`;
      registerHook(hookFn, [`local _c = ${expr}`, 'if _c then return 0 end', 'return -1']);
      const waitVn = makeNode(block.getFieldValue('WAIT') || 'Please wait...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [
        { code: 0,  target: processActions(block, 'DONE', waitVn) || makeNode('Done!') },
        { code: -1, target: waitVn },
      ];
      return waitVn;
    }
    case 'npc_delayed_followup': {
      const condBlock    = block.getInputTargetBlock('CONDITION');
      const condExpr     = buildConditionExpression(condBlock);
      const followupHook = block.getFieldValue('FOLLOWUP_HOOK');
      const followupBody = block.getFieldValue('FOLLOWUP_BODY');
      const condHookFn   = `delayedCondHook_${Math.abs(hashCode(condExpr))}`;
      registerHook(condHookFn, [
        `local _c = ${condExpr}`,
        `if _c then return 0 end`,
        `return -1`,
      ]);
      registerHook(followupHook, [followupBody]);
      const waitVn   = makeNode('...');
      const waitNode = getNode(waitVn);
      waitNode._delayedFollowup = { condHookFn, followupHook };
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode('Done.') }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
