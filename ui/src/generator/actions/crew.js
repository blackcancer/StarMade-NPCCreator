/**
 * @fileoverview Crew action generators.
 *
 * Handles hire, dismiss and spawn crew action blocks.
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
export function genCrewAction(block, ctx) {
  const {
    getOptionalVarName,
    sanitizeIdentPart,
    registerHook,
    makeNode,
    getNode,
    processActions,
  } = ctx;

  switch (block.type) {
    case 'npc_hire': {
      const price   = getOptionalVarName(block, 'PRICE_VAR') || block.getFieldValue('PRICE');
      const hookFn  = 'hireHookFunc_' + sanitizeIdentPart(price);
      registerHook(hookFn, ['return dialogObject:hireConverationPartner();']);
      const waitVn  = makeNode('Please wait...');
      const node    = getNode(waitVn);
      node.hook     = hookFn;
      node.reactions = [
        { code:  0, target: processActions(block, 'HIRED',     waitVn) || makeNode("I'm honoured!") },
        { code: -2, target: processActions(block, 'CREW_FULL', waitVn) || makeNode('Crew full or already in team.') },
        { code: -3, target: processActions(block, 'REFUSED',   waitVn) || makeNode("Different faction — I won't follow you.") },
      ];
      return waitVn;
    }
    case 'npc_unhire': {
      registerHook('unhireHookFunc', ['return dialogObject:unhireConverationPartner();']);
      const waitVn = makeNode('Please wait...');
      const node   = getNode(waitVn);
      node.hook    = 'unhireHookFunc';
      node.reactions = [
        { code:  0, target: processActions(block, 'SUCCESS', waitVn) || makeNode('Yes, commander!') },
        { code: -1, target: processActions(block, 'FAIL',    waitVn) || makeNode('No, commander!') },
      ];
      return waitVn;
    }
    case 'npc_spawn_crew': {
      const price  = getOptionalVarName(block, 'PRICE_VAR') || block.getFieldValue('PRICE');
      const hookFn = 'spawnCrewHook_' + sanitizeIdentPart(price);
      registerHook(hookFn, ['return dialogObject:spawnCrew(' + price + ');']);
      const waitVn = makeNode('Please wait...');
      const node   = getNode(waitVn);
      node.hook    = hookFn;
      node.reactions = [
        { code:  0, target: processActions(block, 'SUCCESS',    waitVn) || makeNode('Welcome!') },
        { code: -1, target: processActions(block, 'NO_CREDITS', waitVn) || makeNode("You don't have enough money!") },
        { code: -2, target: processActions(block, 'CREW_FULL',  waitVn) || makeNode("You can't have more crew!") },
      ];
      return waitVn;
    }
    default:
      return undefined;
  }
}
