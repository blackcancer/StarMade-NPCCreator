/**
 * @fileoverview World action generators.
 *
 * Handles world/NPC/ship actions such as movement, gravity and tutorials.
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
export function genWorldAction(block, ctx) {
  const {
    getOptionalVarName,
    sanitizeIdentPart,
    luaStringLiteral,
    registerHook,
    makeNode,
    getNode,
    processActions,
    processActionBlock,
  } = ctx;

  switch (block.type) {
    case 'npc_activate_block': {
      const x = getOptionalVarName(block, 'X_VAR') || block.getFieldValue('X');
      const y = getOptionalVarName(block, 'Y_VAR') || block.getFieldValue('Y');
      const z = getOptionalVarName(block, 'Z_VAR') || block.getFieldValue('Z');
      const st = block.getFieldValue('STATE');
      const hookFn = `activateBlockHook_${sanitizeIdentPart(x)}_${sanitizeIdentPart(y)}_${sanitizeIdentPart(z)}`;
      registerHook(hookFn, [st === 'toggle'
        ? `return dialogObject:activateBlockSwitch(${x}, ${y}, ${z});`
        : `return dialogObject:activateBlock(${x}, ${y}, ${z}, ${st});`]);
      const waitVn = makeNode('Please wait...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [{ code: 0, target: processActionBlock(block.getNextBlock(), waitVn) || makeNode('Done!') }];
      return waitVn;
    }
    case 'npc_move_to': {
      const x = getOptionalVarName(block, 'X_VAR') || block.getFieldValue('X');
      const y = getOptionalVarName(block, 'Y_VAR') || block.getFieldValue('Y');
      const z = getOptionalVarName(block, 'Z_VAR') || block.getFieldValue('Z');
      const hookFn = `moveToHook_${sanitizeIdentPart(x)}_${sanitizeIdentPart(y)}_${sanitizeIdentPart(z)}`;
      registerHook(hookFn, [`return dialogObject:moveTo(${x}, ${y}, ${z});`]);
      const waitVn = makeNode('Moving...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [{ code: 0, target: processActionBlock(block.getNextBlock(), waitVn) || makeNode('Done!') }];
      return waitVn;
    }
    case 'npc_destroy_ship': {
      const uid    = block.getFieldValue('UID');
      const hookFn = 'destroyShipHook_' + sanitizeIdentPart(uid);
      registerHook(hookFn, ['return dialogObject:destroyShip("' + String(uid).replace(/"/g, '\\"') + '");']);
      const waitVn = makeNode('...');
      const node   = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [
        { code: 0,  target: processActions(block, 'SUCCESS', waitVn) || makeNode('Done!') },
        { code: -1, target: processActions(block, 'FAIL',    waitVn) || makeNode('Entity not found.') },
      ];
      return waitVn;
    }
    case 'npc_give_gravity': {
      const state = block.getFieldValue('STATE') || 'true';
      const hookFn = `gravityHook_${state}`;
      registerHook(hookFn, [`return dialogObject:giveGravity(${state});`]);
      const waitVn = makeNode('...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [{ code: 0, target: processActionBlock(block.getNextBlock(), waitVn) || makeNode('Done!') }];
      return waitVn;
    }
    case 'npc_call_tutorial': {
      const name = block.getFieldValue('NAME');
      const hookFn = `tutorialHook_${sanitizeIdentPart(name)}`;
      registerHook(hookFn, [`return dialogObject:callTutorial(${luaStringLiteral(name)});`]);
      const waitVn = makeNode('...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [{ code: 0, target: processActionBlock(block.getNextBlock(), waitVn) || makeNode('Done!') }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
