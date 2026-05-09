/**
 * @fileoverview Branch/check action generators.
 *
 * Turns Blockly check blocks into hook-backed THEN/ELSE Lua flows.
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
export function genBranchAction(block, ctx) {
  const {
    getOptionalVarName,
    sanitizeIdentPart,
    hashCode,
    buildConditionExpression,
    registerHook,
    makeNode,
    getNode,
    makeBranchAction,
    processActions,
  } = ctx;

  switch (block.type) {
    case 'npc_check_credits': {
      const amount = getOptionalVarName(block, 'AMOUNT_VAR') || block.getFieldValue('AMOUNT');
      return makeBranchAction(`checkCreditsHook_${sanitizeIdentPart(amount)}`, [
        'local ps = dialogObject:getEntity()',
        'if ps ~= nil and ps:getCredits() >= ' + amount + ' then return 0 end',
        'return -1',
      ], block, 'Checking credits...');
    }
    case 'npc_check_player_value': {
      const valueType = block.getFieldValue('VALUE_TYPE');
      const op = block.getFieldValue('OP');
      const value = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE');
      const expr = buildConditionExpression({ type: 'npc_cond_player_value', getFieldValue: (n) => ({ VALUE_TYPE:valueType, OP:op, VALUE:value }[n]), getInputTargetBlock: () => null });
      return makeBranchAction(`checkValueHook_${valueType}_${String(op).replace(/\W/g,'_')}_${sanitizeIdentPart(value)}`,
        [`if ${expr} then return 0 end`, 'return -1'], block, 'Checking...');
    }
    case 'npc_check_flag': {
      const flag = block.getFieldValue('FLAG');
      const expect = block.getFieldValue('EXPECT') === 'true' ? 'true' : 'false';
      const expr = flag === 'creative'
        ? `(dialogObject:getEntity() ~= nil and dialogObject:getEntity():isCreativeModeEnabled() == ${expect})`
        : `(dialogObject:isConverationPartnerInTeam() == ${expect})`;
      return makeBranchAction(`checkFlagHook_${flag}_${expect}`, [`if ${expr} then return 0 end`, 'return -1'], block, 'Checking flag...');
    }
    case 'npc_check_custom_condition': {
      const expr = block.getFieldValue('EXPR') || 'false';
      return makeBranchAction(`customConditionHook_${Math.abs(hashCode(expr))}`, [`if (${expr}) then return 0 end`, 'return -1'], block, 'Checking...');
    }
    case 'npc_if_condition': {
      const expr = buildConditionExpression(block.getInputTargetBlock('COND'));
      return makeBranchAction(`ifConditionHook_${Math.abs(hashCode(expr))}`, [`if ${expr} then return 0 end`, 'return -1'], block, 'Checking...');
    }
    case 'npc_is_at_block': {
      const x = getOptionalVarName(block, 'X_VAR') || block.getFieldValue('X');
      const y = getOptionalVarName(block, 'Y_VAR') || block.getFieldValue('Y');
      const z = getOptionalVarName(block, 'Z_VAR') || block.getFieldValue('Z');
      const success = block.getFieldValue('SUCCESS');
      const fail    = block.getFieldValue('FAIL');
      const hookFn  = `isAtBlockHook_${sanitizeIdentPart(x)}_${sanitizeIdentPart(y)}_${sanitizeIdentPart(z)}`;
      registerHook(hookFn, [
        `if dialogObject:isAtBlock(${x}, ${y}, ${z}) then return 0 end`,
        `return -1`,
      ]);
      const waitVn = makeNode('Checking position...');
      const successVn = processActions(block, 'THEN', waitVn) || makeNode(success || 'You are here.');
      const failVn    = processActions(block, 'ELSE', waitVn) || makeNode(fail || 'Not there yet.');
      const waitNode = getNode(waitVn);
      waitNode.hook = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }, { code: -1, target: failVn }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
