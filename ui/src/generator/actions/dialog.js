/**
 * @fileoverview Dialog action generators.
 *
 * Handles root greetings, text nodes, menus and confirmation prompts. The helper
 * implementations still live in core.js while the central dispatch is being
 * reduced.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

// =============================================================================
// ACTION GENERATOR
// =============================================================================

/**
 * Try to generate Lua state for a dialog block.
 *
 * @param {Object} block Blockly block instance.
 * @param {Object} ctx Explicit generator dependencies from core.js.
 * @returns {string|undefined} Root node variable name when handled; undefined otherwise.
 */
export function genDialogAction(block, ctx) {
  const {
    hashCode,
    registerHook,
    makeNode,
    getNode,
    processChoices,
    processActionBlock,
    processGreeting,
    processCondGreeting,
    genSayValue,
    genConfirm,
  } = ctx;

  switch (block.type) {
    case 'npc_greeting': {
      return processGreeting(block);
    }
    case 'npc_cond_greeting': {
      return processCondGreeting(block);
    }
    case 'npc_say': {
      const text = block.getFieldValue('TEXT');
      const ms   = parseInt(block.getFieldValue('MS')) || 2000;
      const vn   = makeNode(text, ms);
      const nextBlock = block.getNextBlock();
      if (nextBlock) {
        const hookFn = `sayAutoHook_${Math.abs(hashCode(text + vn))}`;
        registerHook(hookFn, ['return 0']);
        const node = getNode(vn);
        node.hook = hookFn;
        const nextVn = processActionBlock(nextBlock, vn);
        if (nextVn) node.reactions = [{ code: 0, target: nextVn }];
      }
      return vn;
    }
    case 'npc_say_menu': {
      const text = block.getFieldValue('TEXT');
      const ms   = parseInt(block.getFieldValue('MS')) || 2000;
      const vn   = makeNode(text, ms);
      const node = getNode(vn);
      const choices = processChoices(block, 'CHOICES', vn);
      for (const c of choices) {
        node.choices.push({
          label: c.label,
          targetVarName: c.targetVarName?.startsWith('__BACK__') ? vn : c.targetVarName,
          disabled: c.disabled,
        });
      }
      return vn;
    }
    case 'npc_say_value': {
      return genSayValue(block);
    }
    case 'npc_confirm': {
      return genConfirm(block);
    }
    default:
      return undefined;
  }
}
