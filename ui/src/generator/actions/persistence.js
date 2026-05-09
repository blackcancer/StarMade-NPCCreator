/**
 * @fileoverview Persistence action generators.
 *
 * Handles generated HSQLDB/SQLite-style memory and table helper actions.
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
export function genPersistenceAction(block, ctx) {
  const {
    getOptionalVarName,
    luaStringLiteral,
    registerHook,
    makeNode,
    getNode,
  } = ctx;

  switch (block.type) {
    case 'npc_sqlite_get': {
      const table = block.getFieldValue('TABLE');
      const col   = block.getFieldValue('COL');
      const def   = block.getFieldValue('DEFAULT');
      const varN  = block.getFieldValue('VAR');
      const hookFn = `sqliteGetHook_${table}_${col}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `local ${varN} = (_dbGet("SELECT ${col} FROM ${table} WHERE player = ?", player) or ${def})`,
        `return 0`,
      ]);
      const waitVn = makeNode('...');
      const successVn = makeNode(`Read: ${varN}`);
      const waitNode = getNode(waitVn);
      waitNode.hook = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    case 'npc_sqlite_set': {
      const table = block.getFieldValue('TABLE');
      const col   = block.getFieldValue('COL');
      const value = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE');
      const hookFn = `sqliteSetHook_${table}_${col}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_dbUpsert("${table}", "player", player, "${col}", ${value})`,
        `return 0`,
      ]);
      const waitVn = makeNode('Saving...');
      const successVn = makeNode('Saved!');
      const waitNode = getNode(waitVn);
      waitNode.hook = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    case 'npc_sqlite_increment': {
      const table  = block.getFieldValue('TABLE');
      const col    = block.getFieldValue('COL');
      const amount = getOptionalVarName(block, 'AMOUNT_VAR') || block.getFieldValue('AMOUNT');
      const hookFn = `sqliteIncrHook_${table}_${col}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_dbIncrement("${table}", "player", player, "${col}", ${amount})`,
        `return 0`,
      ]);
      const waitVn = makeNode('...');
      const successVn = makeNode('Done!');
      const waitNode = getNode(waitVn);
      waitNode.hook = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    case 'npc_memory_set': {
      const key   = block.getFieldValue('KEY');
      const mode  = block.getFieldValue('MODE');
      const value = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE');
      const hookFn = `memorySetHook_${String(key).replace(/\W/g,'_')}`;
      const usingVar = !!getOptionalVarName(block, 'VALUE_VAR');
      const luaVal = usingVar ? String(value || 'nil')
                   : mode === 'text' ? luaStringLiteral(value)
                   : mode === 'number' ? String(Number(value) || 0)
                   : String(value || 'nil');
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_memSet(player, ${luaStringLiteral(key)}, ${luaVal})`,
        `return 0`,
      ]);
      const waitVn = makeNode('Saving memory...');
      const successVn = makeNode('Memory updated.');
      const waitNode = getNode(waitVn);
      waitNode.hook = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    case 'npc_memory_increment': {
      const key    = block.getFieldValue('KEY');
      const amount = getOptionalVarName(block, 'AMOUNT_VAR') || block.getFieldValue('AMOUNT');
      const hookFn = `memoryIncrHook_${String(key).replace(/\W/g,'_')}`;
      registerHook(hookFn, [
        `local player = dialogObject:getOwnName()`,
        `_memIncrement(player, ${luaStringLiteral(key)}, ${amount})`,
        `return 0`,
      ]);
      const waitVn = makeNode('Updating memory...');
      const successVn = makeNode('Memory counter updated.');
      const waitNode = getNode(waitVn);
      waitNode.hook = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
