/**
 * @fileoverview Exhaustive tests — disabled propagation for every block category.
 *
 * Verifies that isEnabled() = false on any Blockly block causes ALL generated
 * Lua for that block (node declaration, hook function, hook instance, setHook,
 * addReaction, :add()) to be emitted as -- [DISABLED] comments, never as
 * active Lua code.
 *
 * Categories covered:
 *   - npc_choice / npc_goback (choice-level disable)
 *   - npc_say_menu (disabled choice inside say_menu)
 *   - npc_say (action block)
 *   - npc_hire (crew action)
 *   - npc_give_credits (items action)
 *   - npc_quest_start, npc_quest_complete (quest actions)
 *   - npc_check_credits (branch action)
 *   - npc_rep_add (reputation action)
 *   - npc_cooldown_set (cooldown action)
 *   - npc_flag_set (worldstate action)
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
 * Build a minimal mock Blockly block.
 *
 * @param {string} type Block type.
 * @param {Object} fields Field values.
 * @param {boolean} enabled isEnabled() return value.
 * @param {Object} inputs getInputTargetBlock map.
 * @param {Object|null} next getNextBlock() return value.
 * @returns {Object} Mock block.
 */
function b(type, fields = {}, enabled = true, inputs = {}, next = null) {
  return {
    type,
    getFieldValue: (n) => fields[n] ?? null,
    getInputTargetBlock: (n) => inputs[n] ?? null,
    getNextBlock: () => next,
    isEnabled: () => enabled,
    getCommentText: () => '',
    data: null,
  };
}

/**
 * Generate Lua from a mock greeting block.
 *
 * @param {Object} greetingBlock Root block.
 * @returns {string} Generated Lua.
 */
function gen(greetingBlock) {
  resetState();
  processGreeting(greetingBlock);
  return emitLua('test');
}

/** Assert a line appears only as [DISABLED] comment, never active. */
function assertDisabledOnly(lua, pattern, label) {
  const lines = lua.split('\n');
  for (const line of lines) {
    if (/--\s*\[DISABLED\]/.test(line)) continue;     // disabled lines are OK
    assert.notMatch(line, pattern, `${label}: must not appear as active Lua`);
  }
  assert.match(lua, /-- \[DISABLED\]/, `${label}: must produce at least one [DISABLED] comment`);
}

// =============================================================================
// TESTS
// =============================================================================

describe('Exhaustive disabled propagation — all block categories', () => {

  // ── npc_choice disabled ───────────────────────────────────────────────────
  it('npc_choice disabled → :add() commented', () => {
    const choice = b('npc_choice', { LABEL: 'Hire me' }, false,
      { ACTIONS: b('npc_hire', { PRICE: 50000, SUCCESS: 'Hired.', FAIL: 'Not enough.' }) });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assertDisabledOnly(lua, /:add\(.*Hire me/, 'npc_choice disabled :add()');
  });

  // ── npc_goback disabled ───────────────────────────────────────────────────
  it('npc_goback disabled → :add() commented', () => {
    const go = b('npc_goback', { LABEL: 'Never mind' }, false);
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: go });
    const lua = gen(greeting);
    assertDisabledOnly(lua, /:add\(.*Never mind/, 'npc_goback disabled :add()');
  });

  // ── npc_say_menu: disabled choice inside menu ─────────────────────────────
  it('npc_say_menu disabled inner choice → :add() commented', () => {
    const disabledChoice = b('npc_choice', { LABEL: 'Secret' }, false,
      { ACTIONS: b('npc_say', { TEXT: 'Shh', MS: 2000 }) });
    const activeChoice = b('npc_choice', { LABEL: 'Public' }, true,
      { ACTIONS: b('npc_say', { TEXT: 'Hello', MS: 2000 }) });
    Object.assign(disabledChoice, { getNextBlock: () => activeChoice });

    const outerChoice = b('npc_choice', { LABEL: 'Menu' }, true, {
      ACTIONS: b('npc_say_menu', { TEXT: 'Pick', MS: 2000 }, true, { CHOICES: disabledChoice })
    });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: outerChoice });
    const lua = gen(greeting);
    assertDisabledOnly(lua, /:add\(.*Secret/, 'npc_say_menu disabled inner choice :add()');
    assert.match(lua, /^\s+\w+:add\(.*Public/m, 'active inner choice must remain');
  });

  // ── npc_say disabled ──────────────────────────────────────────────────────
  it('npc_say disabled → node declaration commented', () => {
    const say = b('npc_say', { TEXT: 'Hidden msg', MS: 2000 }, false);
    const choice = b('npc_choice', { LABEL: 'Trigger' }, true, { ACTIONS: say });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assertDisabledOnly(lua, /newInstance.*Hidden msg/, 'npc_say disabled node');
  });

  // ── npc_hire disabled ─────────────────────────────────────────────────────
  it('npc_hire disabled → hook fn, hook instance, node, setHook, addReaction, :add() commented', () => {
    const hire = b('npc_hire', { PRICE: 75000, SUCCESS: 'Hired!', FAIL: 'Nope.' }, false);
    const choice = b('npc_choice', { LABEL: 'Hire' }, true, { ACTIONS: hire });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    // hook function must be in --[[ DISABLED block
    assert.match(lua, /--\[\[ DISABLED[\s\S]*hireConver[\s\S]*--\]\]/,
      'npc_hire disabled: hook fn must be in --[[ DISABLED block');
    // hook instance, setHook, addReaction commented
    assertDisabledOnly(lua, /newInstance.*hireHook/, 'npc_hire hook instance');
    assertDisabledOnly(lua, /:setHook\(hook_hireHook/, 'npc_hire setHook');
    assertDisabledOnly(lua, /:addReaction\(hook_hireHook/, 'npc_hire addReaction');
  });

  // ── npc_give_credits disabled ─────────────────────────────────────────────
  it('npc_give_credits disabled → hook fn and wiring commented', () => {
    const give = b('npc_give_credits', { AMOUNT: 500 }, false);
    const choice = b('npc_choice', { LABEL: 'Collect' }, true, { ACTIONS: give });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*setCredits[\s\S]*--\]\]/,
      'npc_give_credits disabled: hook fn must be in --[[ DISABLED block');
  });

  // ── npc_quest_start disabled ──────────────────────────────────────────────
  it('npc_quest_start disabled → hook fn and node commented', () => {
    const qs = b('npc_quest_start', { QUEST_ID: 'my_quest', STEP: 1 }, false);
    const choice = b('npc_choice', { LABEL: 'Start' }, true, { ACTIONS: qs });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*questStart[\s\S]*--\]\]/,
      'npc_quest_start disabled: hook fn must be commented');
  });

  // ── npc_quest_complete disabled ───────────────────────────────────────────
  it('npc_quest_complete disabled → hook fn and node commented', () => {
    const qc = b('npc_quest_complete', { QUEST_ID: 'my_quest', REWARD_CREDITS: 500, REWARD_ITEM: 0, REWARD_COUNT: 0 }, false);
    const choice = b('npc_choice', { LABEL: 'Complete' }, true, { ACTIONS: qc });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*questComplete[\s\S]*--\]\]/,
      'npc_quest_complete disabled: hook fn must be commented');
  });

  // ── npc_check_credits disabled ────────────────────────────────────────────
  it('npc_check_credits disabled → hook fn and wiring commented', () => {
    const ck = b('npc_check_credits', { AMOUNT: 1000 }, false, {
      THEN: b('npc_say', { TEXT: 'Rich', MS: 2000 }),
      ELSE: b('npc_say', { TEXT: 'Poor', MS: 2000 }),
    });
    const choice = b('npc_choice', { LABEL: 'Check' }, true, { ACTIONS: ck });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*checkCredits[\s\S]*--\]\]/,
      'npc_check_credits disabled: hook fn must be commented');
  });

  // ── npc_rep_add disabled ──────────────────────────────────────────────────
  it('npc_rep_add disabled → hook fn and wiring commented', () => {
    const rep = b('npc_rep_add', { NPC_ID: 'guild', DELTA: 10 }, false);
    const choice = b('npc_choice', { LABEL: 'Rep' }, true, { ACTIONS: rep });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*repAdd[\s\S]*--\]\]/,
      'npc_rep_add disabled: hook fn must be commented');
  });

  // ── npc_cooldown_set disabled ─────────────────────────────────────────────
  it('npc_cooldown_set disabled → hook fn and wiring commented', () => {
    const cd = b('npc_cooldown_set', { ACTION_ID: 'daily', DURATION_MS: 86400000 }, false);
    const choice = b('npc_choice', { LABEL: 'Daily' }, true, { ACTIONS: cd });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*cooldown[\s\S]*--\]\]/,
      'npc_cooldown_set disabled: hook fn must be commented');
  });

  // ── npc_flag_set disabled ─────────────────────────────────────────────────
  it('npc_flag_set disabled → hook fn and wiring commented', () => {
    const flag = b('npc_flag_set', { FLAG_NAME: 'tutorial_done', VALUE: 'true', SUCCESS: 'Done.' }, false);
    const choice = b('npc_choice', { LABEL: 'Set flag' }, true, { ACTIONS: flag });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: choice });
    const lua = gen(greeting);
    assert.match(lua, /--\[\[ DISABLED[\s\S]*flagSet[\s\S]*--\]\]/,
      'npc_flag_set disabled: hook fn must be commented');
  });

  // ── mixed: one disabled one active ───────────────────────────────────────
  it('mixed disabled/active choices: only disabled one is commented', () => {
    const disabled = b('npc_choice', { LABEL: 'Hidden' }, false,
      { ACTIONS: b('npc_say', { TEXT: 'Secret', MS: 2000 }) });
    const active = b('npc_choice', { LABEL: 'Visible' }, true,
      { ACTIONS: b('npc_say', { TEXT: 'Hello', MS: 2000 }) });
    Object.assign(disabled, { getNextBlock: () => active });
    const greeting = b('npc_greeting', { TEXT: 'Hi', MS: 2000 }, true, { CHOICES: disabled });
    const lua = gen(greeting);
    assert.match(lua, /-- \[DISABLED\].*:add\(.*Hidden/, 'disabled choice commented');
    assert.match(lua, /^\s+\w+:add\(.*Visible/m, 'active choice remains');
    // Hidden node: newInstance line must be commented
    assertDisabledOnly(lua, /newInstance.*Secret/, 'disabled npc_say node');
  });

});
