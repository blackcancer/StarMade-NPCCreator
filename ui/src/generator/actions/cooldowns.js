/**
 * @fileoverview Cooldown action generators.
 *
 * Handles cooldown mutation, display and branch checks.
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
export function genCooldownAction(block, ctx) {
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
    case 'npc_cooldown_set': {

      const actionId = block.getFieldValue('ACTION_ID');
      const durMs    = Number(block.getFieldValue('DURATION_SEC') || 86400) * 1000;
      const hookFn   = 'cooldownSetHook_' + sanitizeIdentPart(actionId);
      registerHook(hookFn, ['local player = dialogObject:getOwnName()', '_cooldownSet(player, ' + luaStringLiteral(actionId) + ', ' + durMs + ')', 'return 0']);
      const waitVn = makeNode('Starting cooldown...');
      const n = getNode(waitVn); n.hook = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      n.reactions = [{ code: 0, target: nextVn || makeNode('Cooldown started.') }];
      return waitVn;
    }

    case 'npc_check_cooldown': {
      const actionId = block.getFieldValue('ACTION_ID');
      const state    = block.getFieldValue('STATE') || 'expired';
      const hookFn   = `checkCooldownHook_${sanitizeIdentPart(actionId)}_${state}`;
      const cond     = state === 'expired'
        ? `not _cooldownActive(player, ${luaStringLiteral(actionId)})`
        : `_cooldownActive(player, ${luaStringLiteral(actionId)})`;
      return makeBranchAction(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `if ${cond} then return 0 end`,
        `return -1`,
      ], block, 'Checking cooldown...');
    }

    case 'npc_get_cooldown_remaining': {
      const actionId = block.getFieldValue('ACTION_ID');
      const text     = block.getFieldValue('TEXT') || 'Come back in %s seconds.';
      const hookFn   = `getCooldownHook_${sanitizeIdentPart(actionId)}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `local rem = math.ceil(_cooldownRemaining(player, ${luaStringLiteral(actionId)}) / 1000)`,
        `return 0`,
      ]);
      const waitVn   = makeNode(text.replace('%s', '...'));
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      return waitVn;
    }

    case 'npc_cooldown_clear': {
      const actionId = block.getFieldValue('ACTION_ID');
      const success  = block.getFieldValue('SUCCESS') || 'Cooldown cleared.';
      const hookFn   = `cooldownClearHook_${sanitizeIdentPart(actionId)}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_dbExec("DELETE FROM npc_cooldowns WHERE player=? AND action_id=?", player, ${luaStringLiteral(actionId)})`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Clearing cooldown...');
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
