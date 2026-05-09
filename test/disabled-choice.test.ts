/**
 * @fileoverview Generator tests — disabled choice and go-back Lua output.
 *
 * Verifies that disabling a npc_choice or npc_goback block via isEnabled()
 * causes the corresponding :add() line to be emitted as a -- [DISABLED] comment
 * in the generated Lua, while active choices remain active.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { assert } from 'chai';
import { resetState } from '../ui/src/generator/state.js';
import { processGreeting } from '../ui/src/generator/core.js';
import { emitLua } from '../ui/src/generator/emitter.js';

// =============================================================================
// MOCK HELPERS
// =============================================================================

/**
 * Build a minimal mock Blockly block used by the generator.
 *
 * @param {string} type Block type id.
 * @param {Object} fields Field name → value map.
 * @param {boolean} enabled Whether the block is enabled (default true).
 * @param {Object} inputs Input name → block map.
 * @param {Object|null} next Optional next sibling block.
 * @returns {Object} Mock block.
 */
function mockBlock(type, fields = {}, enabled = true, inputs = {}, next = null) {
  return {
    type,
    getFieldValue: (name) => fields[name] ?? null,
    getInputTargetBlock: (name) => inputs[name] ?? null,
    getNextBlock: () => next,
    isEnabled: () => enabled,
    getCommentText: () => '',
  };
}

/**
 * Generate Lua from a mock greeting block.
 *
 * @param {Object} greetingBlock Mock greeting block with CHOICES input.
 * @returns {string} Generated Lua script.
 */
function generateFromGreeting(greetingBlock) {
  resetState();
  processGreeting(greetingBlock);
  return emitLua('test');
}

// =============================================================================
// TESTS
// =============================================================================

describe('Disabled choice/goback Lua output', () => {

  it('disabled npc_choice produces -- [DISABLED] :add() line', () => {
    const actionBlock = mockBlock('npc_say', { TEXT: 'Hello', MS: 2000 }, true);
    const disabledChoice = mockBlock('npc_choice', { LABEL: 'Disabled option' }, false, { ACTIONS: actionBlock });
    const activeChoice   = mockBlock('npc_choice', { LABEL: 'Active option' },   true,  { ACTIONS: mockBlock('npc_say', { TEXT: 'Active', MS: 2000 }) });
    // chain: disabledChoice → activeChoice
    Object.assign(disabledChoice, { getNextBlock: () => activeChoice });

    const greeting = mockBlock('npc_greeting', { TEXT: 'Hello!', MS: 2000 }, true, { CHOICES: disabledChoice });
    const lua = generateFromGreeting(greeting);

    assert.match(lua,    /-- \[DISABLED\].*:add\(.*Disabled option.*\)/,
      'disabled choice must produce a commented :add() line');
    assert.notMatch(lua, /^\s+\w+:add\(.*Disabled option.*\)/m,
      'disabled choice must NOT produce an active :add() line');
    assert.match(lua,    /^\s+\w+:add\(.*Active option.*\)/m,
      'active choice must produce an active :add() line');
  });

  it('disabled npc_goback produces -- [DISABLED] :add() line', () => {
    const goBack        = mockBlock('npc_goback', { LABEL: 'Go back (disabled)' }, false);
    const activeChoice  = mockBlock('npc_choice', { LABEL: 'Keep talking' }, true,
      { ACTIONS: mockBlock('npc_say', { TEXT: 'Sure', MS: 2000 }) });
    Object.assign(goBack, { getNextBlock: () => activeChoice });

    const greeting = mockBlock('npc_greeting', { TEXT: 'Hi!', MS: 2000 }, true, { CHOICES: goBack });
    const lua = generateFromGreeting(greeting);

    assert.match(lua,    /-- \[DISABLED\].*:add\(.*Go back.*\)/,
      'disabled goback must produce a commented :add() line');
    assert.match(lua,    /^\s+\w+:add\(.*Keep talking.*\)/m,
      'active choice must remain active');
  });

  it('all active choices when none disabled', () => {
    const choice1 = mockBlock('npc_choice', { LABEL: 'Option A' }, true,
      { ACTIONS: mockBlock('npc_say', { TEXT: 'A', MS: 2000 }) });
    const choice2 = mockBlock('npc_choice', { LABEL: 'Option B' }, true,
      { ACTIONS: mockBlock('npc_say', { TEXT: 'B', MS: 2000 }) });
    Object.assign(choice1, { getNextBlock: () => choice2 });

    const greeting = mockBlock('npc_greeting', { TEXT: 'Hello', MS: 2000 }, true, { CHOICES: choice1 });
    const lua = generateFromGreeting(greeting);

    assert.notMatch(lua, /-- \[DISABLED\]/,
      'no [DISABLED] markers expected when all choices are active');
  });

});
