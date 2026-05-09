/**
 * @fileoverview Flag and world-state action generators.
 *
 * Handles named flags and persistent world-state values.
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
export function genWorldStateAction(block, ctx) {
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
    case 'npc_flag_set': {
      const flagName = block.getFieldValue('FLAG_NAME');
      const value    = block.getFieldValue('VALUE') === 'true';
      const success  = block.getFieldValue('SUCCESS') || 'Flag updated.';
      const hookFn   = `flagSetHook_${sanitizeIdentPart(flagName)}_${value ? 't' : 'f'}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_flagSet(player, ${luaStringLiteral(flagName)}, ${value})`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Updating flag...');
      const successVn = makeNode(success);
      const waitNode  = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }

    case 'npc_world_set': {
      const key     = block.getFieldValue('KEY');
      const value   = block.getFieldValue('VALUE');
      const success = block.getFieldValue('SUCCESS') || 'World state updated.';
      const hookFn  = `worldSetHook_${sanitizeIdentPart(key)}`;
      registerHook(hookFn, [
        `_worldSet(${luaStringLiteral(key)}, ${luaStringLiteral(value)})`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Updating world state...');
      const successVn = makeNode(success);
      const waitNode  = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }

    case 'npc_world_get': {
      const key     = block.getFieldValue('KEY');
      const defVal  = block.getFieldValue('DEFAULT') || '';
      const success = (block.getFieldValue('SUCCESS') || 'Valeur: {world_val}').replace('{world_val}', `%s`);
      const hookFn  = `worldGetHook_${sanitizeIdentPart(key)}`;
      registerHook(hookFn, [
        `local v = _worldGet(${luaStringLiteral(key)}, ${luaStringLiteral(defVal)})`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Reading world state...');
      const successVn = makeNode(success.replace('%s', `"+_worldGet(${JSON.stringify(key)},${JSON.stringify(defVal)})+"`));
      const waitNode  = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }

    case 'npc_check_flag_db': {
      const flagName = block.getFieldValue('FLAG_NAME');
      const value    = block.getFieldValue('VALUE') || 'true';
      const hookFn   = `checkFlagDbHook_${sanitizeIdentPart(flagName)}_${value}`;
      return makeBranchAction(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `if _flagGet(player, ${luaStringLiteral(flagName)}) == ${value} then return 0 end`,
        `return -1`,
      ], block, 'Checking flag...');
    }

    case 'npc_check_world': {
      const key    = block.getFieldValue('KEY');
      const op     = block.getFieldValue('OP') || '==text';
      const value  = block.getFieldValue('VALUE') || 'true';
      const hookFn = `checkWorldHook_${sanitizeIdentPart(key)}`;
      let condLine;
      if (op.endsWith('text')) {
        const luaOp = op.replace('text', '').trim();
        condLine = `if _worldGet(${luaStringLiteral(key)}, "") ${luaOp} ${luaStringLiteral(value)} then return 0 end`;
      } else {
        const luaOp = op.replace('num', '').trim();
        condLine = `if _worldGetNumber(${luaStringLiteral(key)}, 0) ${luaOp} ${Number(value)||0} then return 0 end`;
      }
      return makeBranchAction(hookFn, [condLine, `return -1`], block, 'Checking world state...');
    }

    case 'npc_get_world': {
      const key    = block.getFieldValue('KEY');
      const defVal = block.getFieldValue('DEFAULT') || '';
      const text   = block.getFieldValue('TEXT') || 'Current event: %s';
      const hookFn = `getWorldHook_${sanitizeIdentPart(key)}`;
      registerHook(hookFn, [
        `local val = _worldGet(${luaStringLiteral(key)}, ${luaStringLiteral(defVal)})`,
        `return 0`,
      ]);
      const waitVn   = makeNode(text.replace('%s', '...'));
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      return waitVn;
    }
    default:
      return undefined;
  }
}
