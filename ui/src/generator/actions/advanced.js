/**
 * @fileoverview Advanced action generators.
 *
 * Handles player info, raw custom hooks and conversation state actions.
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
export function genAdvancedAction(block, ctx) {
  const {
    getOptionalVarName,
    sanitizeIdentPart,
    hashCode,
    luaStringLiteral,
    registerHook,
    makeNode,
    getNode,
    makeBranchAction,
    processActions,
    processActionBlock,
  } = ctx;

  switch (block.type) {
    case 'npc_get_info': {
      const type = block.getFieldValue('INFO_TYPE');
      const text = block.getFieldValue('TEXT') || '%s';
      const exprMap = {
        credits: 'ps:getCredits()', health: 'math.floor(ps:getHealth())', maxHealth: 'math.floor(ps:getMaxHealth())',
        factionId: 'ps:getFactionId()', creative: 'tostring(ps:isCreativeModeEnabled())', sectorId: 'ps:getCurrentSectorId()',
      };
      const hookFn = `getInfoHook_${type}_${Math.abs(hashCode(text))}`;
      registerHook(hookFn, ['local ps = dialogObject:getEntity()', 'if ps == nil then return 0 end', `local val = ${exprMap[type] || 'ps:getCredits()'}`, 'return 0']);
      const waitVn = makeNode(text.replace('%s', '...'));
      const node = getNode(waitVn);
      node.hook = hookFn;
      return waitVn;
    }

    case 'npc_custom_hook': {

      const name = block.getFieldValue('NAME');
      const body = block.getFieldValue('BODY');
      registerHook(name, [body]);
      const waitVn = makeNode('Please wait...');
      const n = getNode(waitVn); n.hook = name;
      n.reactions = [
        { code:  0, target: processActions(block, 'SUCCESS', waitVn) || makeNode('Done!') },
        { code: -1, target: processActions(block, 'FAIL',    waitVn) || makeNode('Something went wrong.') },
      ];
      return waitVn;
    }

    case 'npc_set_conv_state': {
      const state  = block.getFieldValue('STATE');
      const hookFn = `setConvStateHook_${sanitizeIdentPart(state)}`;
      registerHook(hookFn, [
        `return dialogObject:setConversationState(${luaStringLiteral(state)});`,
      ]);
      const waitVn   = makeNode('...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode('State set.') }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
