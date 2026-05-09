/**
 * @fileoverview Reputation action generators.
 *
 * Handles reputation mutation, display and branch checks.
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
export function genReputationAction(block, ctx) {
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
    case 'npc_rep_add': {

      const npcId  = block.getFieldValue('NPC_ID');
      const delta  = Number(block.getFieldValue('DELTA') || 10);
      const hookFn = 'repAddHook_' + sanitizeIdentPart(npcId) + '_' + (delta < 0 ? 'n' + Math.abs(delta) : delta);
      registerHook(hookFn, ['local player = dialogObject:getOwnName()', '_repAdd(player, ' + luaStringLiteral(npcId) + ', ' + delta + ')', 'return 0']);
      const waitVn = makeNode('Updating reputation...');
      const n = getNode(waitVn); n.hook = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      n.reactions = [{ code: 0, target: nextVn || makeNode('Reputation updated.') }];
      return waitVn;
    }

    case 'npc_rep_set': {

      const npcId  = block.getFieldValue('NPC_ID');
      const value  = Number(block.getFieldValue('VALUE') || 0);
      const hookFn = 'repSetHook_' + sanitizeIdentPart(npcId) + '_' + value;
      registerHook(hookFn, ['local player = dialogObject:getOwnName()', '_repSet(player, ' + luaStringLiteral(npcId) + ', ' + value + ')', 'return 0']);
      const waitVn = makeNode('Setting reputation...');
      const n = getNode(waitVn); n.hook = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      n.reactions = [{ code: 0, target: nextVn || makeNode('Reputation set.') }];
      return waitVn;
    }

    case 'npc_check_rep': {
      const npcId  = block.getFieldValue('NPC_ID');
      const op     = block.getFieldValue('OP') || '>=';
      const value  = Number(block.getFieldValue('VALUE') || 0);
      const hookFn = `checkRepHook_${sanitizeIdentPart(npcId)}_${String(op).replace(/\W/g,'_')}_${value}`;
      return makeBranchAction(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `if _repGet(player, ${luaStringLiteral(npcId)}) ${op} ${value} then return 0 end`,
        `return -1`,
      ], block, 'Checking reputation...');
    }

    case 'npc_get_rep': {
      const npcId  = block.getFieldValue('NPC_ID');
      const text   = block.getFieldValue('TEXT') || 'Your reputation: %s';
      const hookFn = `getRepHook_${sanitizeIdentPart(npcId)}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `local val = _repGet(player, ${luaStringLiteral(npcId)})`,
        `return 0`,
      ]);
      const waitVn   = makeNode(text.replace('%s', '...'));
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      return waitVn;
    }

    case 'npc_rep_reset': {
      const npcId   = block.getFieldValue('NPC_ID');
      const success = block.getFieldValue('SUCCESS') || 'Reputation reset.';
      const hookFn  = `repResetHook_${sanitizeIdentPart(npcId)}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_repSet(player, ${luaStringLiteral(npcId)}, 0)`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Resetting reputation...');
      const successVn = makeNode(success);
      const waitNode  = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
