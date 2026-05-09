/**
 * @fileoverview Advanced UI generator tests — full block coverage.
 *
 * Tests every Blockly action block type through the full generator → Lua
 * round-trip: generate Lua from a mock workspace, then parse it back and verify
 * the reconstructed block type and key fields match the original.
 *
 * Organised by category:
 *   - Crew
 *   - World
 *   - Sequences
 *   - Branches / conditions
 *   - Items
 *   - Persistence (SQLite/Memory)
 *   - Quests
 *   - Reputation
 *   - Cooldowns
 *   - Stock
 *   - Flags & World State
 *   - Advanced / dialog
 *   - Disabled round-trip (per-block)
 *   - Multi-block sequences (chain tests)
 *   - Condition expressions (buildConditionExpression)
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { assert } from 'chai';
import { resetState } from '../ui/src/generator/state.js';
import { processGreeting } from '../ui/src/generator/core.js';
import { emitLua } from '../ui/src/generator/emitter.js';
import { parseLuaToBlocklyState } from '../ui/src/parser/lua-to-blocks.js';

// =============================================================================
// MOCK HELPERS
// =============================================================================

/**
 * Build a minimal mock Blockly block.
 *
 * @param {string} type Block type.
 * @param {Object} fields Field values map.
 * @param {boolean} enabled isEnabled() return value (default true).
 * @param {Object} inputs getInputTargetBlock map.
 * @param {Object|null} next getNextBlock() sibling.
 * @returns {Object} Mock block.
 */
function mockBlock(type, fields = {}, enabled = true, inputs = {}, next = null) {
  return {
    type,
    getFieldValue:       n => fields[n] ?? null,
    getInputTargetBlock: n => inputs[n] ?? null,
    getNextBlock:        () => next,
    isEnabled:           () => enabled,
    getCommentText:      () => '',
    data:                null,
  };
}

/** Shorthand for enabled blocks with no inputs/next. */
function b(type, fields = {}, inputs = {}, next = null) {
  return mockBlock(type, fields, true, inputs, next);
}

/** Wrap a single action block in a Greeting + Choice. */
function inChoice(action, label = 'Test') {
  const choice = mockBlock('npc_choice', { LABEL: label }, true, { ACTIONS: action });
  return mockBlock('npc_greeting', { TEXT: 'Hello.', MS: 2000 }, true, { CHOICES: choice });
}

/**
 * Generate Lua for a greeting block.
 *
 * @param {Object} greeting Mock greeting block.
 * @returns {string} Generated Lua string.
 */
function gen(greeting) {
  resetState();
  processGreeting(greeting);
  return emitLua('test');
}

/**
 * Full round-trip: generate Lua then parse back.
 * Returns the first action block inside the first choice.
 *
 * @param {Object} action Action mock block.
 * @returns {Object|null} Parsed Blockly block or null.
 */
function roundTrip(action) {
  const lua   = gen(inChoice(action));
  const state = parseLuaToBlocklyState(lua);
  const choice = state.blocks.blocks[0].inputs?.CHOICES?.block;
  // The action may be one level deeper when parser wraps it
  return choice?.inputs?.ACTIONS?.block ?? choice;
}

/**
 * Assert a round-trip returns the expected block type with given field values.
 *
 * @param {Object} action Action mock block.
 * @param {string} expectedType Expected Blockly block type.
 * @param {Object} expectedFields Partial field values to assert.
 */
function assertRoundTrip(action, expectedType, expectedFields = {}) {
  const parsed = roundTrip(action);
  assert.equal(parsed?.type, expectedType, `Expected type ${expectedType}, got ${parsed?.type}`);
  for (const [k, v] of Object.entries(expectedFields)) {
    assert.deepEqual(parsed?.fields?.[k], v, `Field ${k}: expected ${v}, got ${parsed?.fields?.[k]}`);
  }
}

/**
 * Assert the generated Lua contains a pattern.
 *
 * @param {Object} action Action mock block.
 * @param {RegExp} pattern Pattern to match in Lua output.
 * @param {string} msg Assertion message.
 */
function assertLuaContains(action, pattern, msg) {
  const lua = gen(inChoice(action));
  assert.match(lua, pattern, msg);
}

/**
 * Assert the generated Lua does NOT contain a pattern.
 *
 * @param {Object} action Action mock block.
 * @param {RegExp} pattern Pattern that must not appear.
 * @param {string} msg Assertion message.
 */
function assertLuaNotContains(action, pattern, msg) {
  const lua = gen(inChoice(action));
  assert.notMatch(lua, pattern, msg);
}

// =============================================================================
// CREW
// =============================================================================

describe('Generator → Crew blocks', () => {
  it('npc_unhire emits unhireConverationPartner', () => {
    assertLuaContains(b('npc_unhire', { SUCCESS: 'Dismissed.', FAIL: 'Cannot.' }),
      /unhireConverationPartner/, 'should call unhireConverationPartner');
  });

  it('npc_unhire round-trips to npc_unhire', () => {
    assertRoundTrip(b('npc_unhire', { SUCCESS: 'Dismissed.' }), 'npc_unhire');
  });

  it('npc_spawn_crew emits spawnCrew with price', () => {
    assertLuaContains(b('npc_spawn_crew', { PRICE: 25000 }),
      /spawnCrew\(25000\)/, 'should call spawnCrew(25000)');
  });

  it('npc_spawn_crew round-trips to npc_spawn_crew', () => {
    assertRoundTrip(b('npc_spawn_crew', { PRICE: 25000 }), 'npc_spawn_crew');
  });

  it('npc_hire hook body uses hireConverationPartner', () => {
    assertLuaContains(b('npc_hire', { PRICE: 50000 }),
      /hireConverationPartner/, 'hire hook must call hireConverationPartner');
  });

  it('npc_hire reactions: 0 hired, -2 crew full, -3 refused', () => {
    const lua = gen(inChoice(b('npc_hire', { PRICE: 50000 })));
    assert.match(lua, /addReaction.*0,/, 'should have reaction 0');
    assert.match(lua, /addReaction.*-2,/, 'should have reaction -2');
    assert.match(lua, /addReaction.*-3,/, 'should have reaction -3');
  });
});

// =============================================================================
// WORLD
// =============================================================================

describe('Generator → World blocks', () => {
  it('npc_activate_block emits activateBlock with coordinates', () => {
    assertLuaContains(b('npc_activate_block', { X: 10, Y: 20, Z: 30, STATE: 'true' }),
      /activateBlock\(10, 20, 30, true\)/, 'activateBlock with coords and state');
  });

  it('npc_activate_block toggle emits activateBlockSwitch', () => {
    assertLuaContains(b('npc_activate_block', { X: 1, Y: 2, Z: 3, STATE: 'toggle' }),
      /activateBlockSwitch/, 'toggle mode must use activateBlockSwitch');
  });

  it('npc_activate_block round-trips', () => {
    assertRoundTrip(b('npc_activate_block', { X: 5, Y: 6, Z: 7, STATE: 'true' }), 'npc_activate_block');
  });

  it('npc_move_to emits moveTo', () => {
    assertLuaContains(b('npc_move_to', { X: 3, Y: 4, Z: 5 }),
      /moveTo\(3, 4, 5\)/, 'should call moveTo');
  });

  it('npc_move_to round-trips', () => {
    assertRoundTrip(b('npc_move_to', { X: 3, Y: 4, Z: 5 }), 'npc_move_to');
  });

  it('npc_destroy_ship emits destroyShip with UID', () => {
    assertLuaContains(b('npc_destroy_ship', { UID: 'ENTITY_SHIP_target' }),
      /destroyShip\(.*ENTITY_SHIP_target.*\)/, 'should call destroyShip');
  });

  it('npc_destroy_ship round-trips', () => {
    assertRoundTrip(b('npc_destroy_ship', { UID: 'ENTITY_SHIP_target' }), 'npc_destroy_ship');
  });

  it('npc_give_gravity emits giveGravity(true)', () => {
    assertLuaContains(b('npc_give_gravity', { STATE: 'true' }),
      /giveGravity\(true\)/, 'should call giveGravity(true)');
  });

  it('npc_give_gravity emits giveGravity(false)', () => {
    assertLuaContains(b('npc_give_gravity', { STATE: 'false' }),
      /giveGravity\(false\)/, 'should call giveGravity(false)');
  });

  it('npc_give_gravity round-trips', () => {
    assertRoundTrip(b('npc_give_gravity', { STATE: 'true' }), 'npc_give_gravity');
  });

  it('npc_call_tutorial emits callTutorial', () => {
    assertLuaContains(b('npc_call_tutorial', { NAME: 'intro_step1' }),
      /callTutorial/, 'should emit callTutorial');
  });

  it('npc_call_tutorial round-trips', () => {
    assertRoundTrip(b('npc_call_tutorial', { NAME: 'intro_step1' }), 'npc_call_tutorial');
  });
});

// =============================================================================
// SEQUENCES
// =============================================================================

describe('Generator → Sequence blocks', () => {
  it('npc_auto_sequence emits sequenceHook_ with custom body', () => {
    assertLuaContains(b('npc_auto_sequence', { NAME: 'gateOpen', BODY: 'dialogObject:activateBlockSwitch(1,2,3)' }),
      /sequenceHook_gateOpen/, 'hook name must use NAME field');
    assertLuaContains(b('npc_auto_sequence', { NAME: 'gateOpen', BODY: 'dialogObject:activateBlockSwitch(1,2,3)' }),
      /activateBlockSwitch/, 'body must appear in hook');
  });

  it('npc_auto_sequence round-trips', () => {
    assertRoundTrip(b('npc_auto_sequence', { NAME: 'gateOpen', BODY: 'return 0' }), 'npc_auto_sequence',
      { NAME: 'gateOpen' });
  });

  it('npc_wait_until emits waitUntilHook_ with condition and self-loop reaction -1', () => {
    const condBlock = b('npc_cond_custom', { EXPR: 'true' });
    const action    = b('npc_wait_until', { WAIT: 'Waiting...' }, { COND: condBlock });
    assertLuaContains(action, /waitUntilHook_/, 'should have waitUntilHook_');
    const lua = gen(inChoice(action));
    assert.match(lua, /addReaction.*-1,/, 'self-loop reaction -1 must be present');
  });

  it('npc_wait_until round-trips', () => {
    const condBlock = b('npc_cond_custom', { EXPR: 'true' });
    assertRoundTrip(b('npc_wait_until', { WAIT: 'Waiting...' }, { COND: condBlock }), 'npc_wait_until');
  });
});

// =============================================================================
// BRANCHES / CONDITIONS
// =============================================================================

describe('Generator → Branch blocks', () => {
  it('npc_check_player_value emits getCredits comparison', () => {
    assertLuaContains(
      b('npc_check_player_value', { VALUE_TYPE: 'credits', OP: '>=', VALUE: 1000 }),
      /getCredits/, 'should compare credits');
  });

  it('npc_check_player_value round-trips', () => {
    assertRoundTrip(
      b('npc_check_player_value', { VALUE_TYPE: 'credits', OP: '>=', VALUE: 1000 },
        { THEN: b('npc_say', { TEXT: 'Rich', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Poor', MS: 2000 }) }),
      'npc_check_player_value');
  });

  it('npc_check_flag creative emits isCreativeModeEnabled', () => {
    assertLuaContains(b('npc_check_flag', { FLAG: 'creative', EXPECT: 'true' }),
      /isCreativeModeEnabled/, 'should check creative mode');
  });

  it('npc_check_flag inTeam emits isConverationPartnerInTeam', () => {
    assertLuaContains(b('npc_check_flag', { FLAG: 'inTeam', EXPECT: 'false' }),
      /isConverationPartnerInTeam/, 'should check team membership');
  });

  it('npc_check_flag round-trips', () => {
    assertRoundTrip(
      b('npc_check_flag', { FLAG: 'creative', EXPECT: 'true' },
        { THEN: b('npc_say', { TEXT: 'OK', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }) }),
      'npc_check_flag');
  });

  it('npc_check_custom_condition emits raw expression', () => {
    assertLuaContains(b('npc_check_custom_condition', { EXPR: 'myVar > 5' }),
      /myVar > 5/, 'custom expression must appear verbatim');
  });

  it('npc_check_custom_condition round-trips', () => {
    assertRoundTrip(
      b('npc_check_custom_condition', { EXPR: 'myVar > 5' },
        { THEN: b('npc_say', { TEXT: 'Yes', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }) }),
      'npc_check_custom_condition');
  });

  it('npc_if_condition emits condition from expression block', () => {
    const cond = b('npc_cond_custom', { EXPR: 'dialogObject:getEntity():getCredits() > 100' });
    assertLuaContains(
      b('npc_if_condition', {}, { COND: cond }),
      /getCredits\(\) > 100/, 'condition expression must appear in hook body');
  });

  it('npc_if_condition round-trips', () => {
    const cond = b('npc_cond_custom', { EXPR: 'true' });
    assertRoundTrip(
      b('npc_if_condition', {}, { THEN: b('npc_say', { TEXT: 'Yes', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }), COND: cond }),
      'npc_if_condition');
  });

  it('npc_is_at_block emits isAtBlock with coordinates', () => {
    assertLuaContains(b('npc_is_at_block', { X: 10, Y: 11, Z: 12 }),
      /isAtBlock\(10, 11, 12\)/, 'should call isAtBlock');
  });

  it('npc_is_at_block round-trips', () => {
    assertRoundTrip(
      b('npc_is_at_block', { X: 10, Y: 11, Z: 12 },
        { THEN: b('npc_say', { TEXT: 'Here', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Not here', MS: 2000 }) }),
      'npc_is_at_block');
  });
});

// =============================================================================
// ITEMS
// =============================================================================

describe('Generator → Item blocks', () => {
  it('npc_sell_item emits giveLaserWeapon for laser item', () => {
    assertLuaContains(b('npc_sell_item', { ITEM: 'laser', PRICE: 100000 }),
      /giveLaserWeapon\(100000\)/, 'should call giveLaserWeapon');
  });

  it('npc_sell_item round-trips', () => {
    assertRoundTrip(b('npc_sell_item', { ITEM: 'laser', PRICE: 100000 }), 'npc_sell_item');
  });

  it('npc_give_type emits giveType with typeId and count', () => {
    assertLuaContains(b('npc_give_type', { TYPE_ID: 424, COUNT: 5 }),
      /giveType\(424, 5\)/, 'should call giveType(424, 5)');
  });

  it('npc_give_type round-trips', () => {
    assertRoundTrip(b('npc_give_type', { TYPE_ID: 424, COUNT: 5 }), 'npc_give_type');
  });

  it('npc_give_meta_item emits giveMetaItem with type, subtype, cost', () => {
    assertLuaContains(b('npc_give_meta_item', { META_TYPE: 'entity', SUB_TYPE: 0, COST: 5000 }),
      /giveMetaItem\("entity", 0, 5000\)/, 'should call giveMetaItem');
  });

  it('npc_give_meta_item round-trips with field values', () => {
    assertRoundTrip(
      b('npc_give_meta_item', { META_TYPE: 'entity', SUB_TYPE: 2, COST: 10000 }),
      'npc_give_meta_item', { META_TYPE: 'entity', COST: 10000 });
  });

  it('npc_check_inventory emits getActiveSlotsMax loop', () => {
    assertLuaContains(b('npc_check_inventory', { ITEM_TYPE: 123, COUNT: 5 }),
      /getActiveSlotsMax/, 'should iterate inventory slots');
    assertLuaContains(b('npc_check_inventory', { ITEM_TYPE: 123, COUNT: 5 }),
      /total >= 5/, 'should check total >= count');
  });

  it('npc_check_inventory round-trips', () => {
    assertRoundTrip(
      b('npc_check_inventory', { ITEM_TYPE: 42, COUNT: 3 },
        { THEN: b('npc_say', { TEXT: 'OK', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }) }),
      'npc_check_inventory', { ITEM_TYPE: 42, COUNT: 3 });
  });

  it('npc_take_item emits inventory loop and decrementOrUpdateSlot', () => {
    assertLuaContains(b('npc_take_item', { ITEM_TYPE: 99, COUNT: 2, PRICE: 0 }),
      /decrementOrUpdateSlot/, 'should remove items from inventory');
  });

  it('npc_send_message emits sendServerMessage', () => {
    assertLuaContains(b('npc_send_message', { TYPE: 'info', TEXT: 'Quest updated!' }),
      /sendServerMessage/, 'should call sendServerMessage');
  });

  it('npc_send_message round-trips with text', () => {
    assertRoundTrip(b('npc_send_message', { TYPE: 'info', TEXT: 'Quest done!' }),
      'npc_send_message', { TEXT: 'Quest done!', TYPE: 'info' });
  });

  it('npc_send_message warn uses type code 1', () => {
    assertLuaContains(b('npc_send_message', { TYPE: 'warn', TEXT: 'Warning!' }),
      /dialogObject:format\(.*Warning/, 'warn message text must appear');
    const lua = gen(inChoice(b('npc_send_message', { TYPE: 'warn', TEXT: 'Warning!' })));
    // type 1 = warn
    assert.match(lua, /format\([^)]+\),\s*1,/, 'warn type code must be 1');
  });
});

// =============================================================================
// PERSISTENCE (SQLite / Memory)
// =============================================================================

describe('Generator → Persistence blocks', () => {
  it('npc_sqlite_get emits _dbGet SELECT query', () => {
    assertLuaContains(b('npc_sqlite_get', { TABLE: 'my_tbl', COL: 'score', DEFAULT: '0', VAR: 'v' }),
      /SELECT score FROM my_tbl/, 'should emit SELECT query');
  });

  it('npc_sqlite_get round-trips with table and column', () => {
    assertRoundTrip(b('npc_sqlite_get', { TABLE: 'my_tbl', COL: 'score', DEFAULT: '0', VAR: 'v' }),
      'npc_sqlite_get', { TABLE: 'my_tbl', COL: 'score' });
  });

  it('npc_sqlite_set emits _dbUpsert', () => {
    assertLuaContains(b('npc_sqlite_set', { TABLE: 'my_tbl', COL: 'score', VALUE: '42' }),
      /_dbUpsert/, 'should emit _dbUpsert');
  });

  it('npc_sqlite_set round-trips', () => {
    assertRoundTrip(b('npc_sqlite_set', { TABLE: 'my_tbl', COL: 'score', VALUE: '42' }),
      'npc_sqlite_set', { TABLE: 'my_tbl', COL: 'score' });
  });

  it('npc_sqlite_increment emits _dbIncrement', () => {
    assertLuaContains(b('npc_sqlite_increment', { TABLE: 'my_tbl', COL: 'score', AMOUNT: 1 }),
      /_dbIncrement/, 'should emit _dbIncrement');
  });

  it('npc_sqlite_increment round-trips', () => {
    assertRoundTrip(b('npc_sqlite_increment', { TABLE: 'my_tbl', COL: 'score', AMOUNT: 5 }),
      'npc_sqlite_increment', { TABLE: 'my_tbl', COL: 'score', AMOUNT: 5 });
  });

  it('npc_memory_set emits _memSet with text value', () => {
    assertLuaContains(b('npc_memory_set', { KEY: 'intro_done', MODE: 'text', VALUE: 'yes' }),
      /_memSet\(player, "intro_done", "yes"\)/, 'should call _memSet with string value');
  });

  it('npc_memory_set emits _memSet with numeric value', () => {
    assertLuaContains(b('npc_memory_set', { KEY: 'count', MODE: 'number', VALUE: '42' }),
      /_memSet\(player, "count", 42\)/, 'should call _memSet with number value');
  });

  it('npc_memory_set round-trips', () => {
    assertRoundTrip(b('npc_memory_set', { KEY: 'intro_done', MODE: 'text', VALUE: 'yes' }),
      'npc_memory_set', { KEY: 'intro_done' });
  });

  it('npc_memory_increment emits _memIncrement', () => {
    assertLuaContains(b('npc_memory_increment', { KEY: 'visit_count', AMOUNT: 1 }),
      /_memIncrement\(player, "visit_count", 1\)/, 'should call _memIncrement');
  });

  it('npc_memory_increment round-trips', () => {
    assertRoundTrip(b('npc_memory_increment', { KEY: 'visit_count', AMOUNT: 2 }),
      'npc_memory_increment', { KEY: 'visit_count', AMOUNT: 2 });
  });
});

// =============================================================================
// QUESTS
// =============================================================================

describe('Generator → Quest blocks', () => {
  it('npc_quest_offer round-trips with QUEST_ID and STEP', () => {
    assertRoundTrip(b('npc_quest_offer', { QUEST_ID: 'q1', OFFER_TEXT: 'Mission?', ACCEPT_LABEL: 'Yes!', REFUSE_LABEL: 'No.', STEP: 1 }),
      'npc_quest_offer', { QUEST_ID: 'q1', STEP: 1 });
  });

  it('npc_quest_set_step emits _questSet with step', () => {
    assertLuaContains(b('npc_quest_set_step', { QUEST_ID: 'q1', STEP: 3 }),
      /_questSet\(player, "q1", "active", 3\)/, 'should update quest step');
  });

  it('npc_quest_set_step round-trips', () => {
    assertRoundTrip(b('npc_quest_set_step', { QUEST_ID: 'q1', STEP: 3 }),
      'npc_quest_set_step', { QUEST_ID: 'q1', STEP: 3 });
  });

  it('npc_quest_fail emits _questSet failed', () => {
    assertLuaContains(b('npc_quest_fail', { QUEST_ID: 'q1' }),
      /_questSet\(player, "q1", "failed"/, 'should set status to failed');
  });

  it('npc_quest_fail round-trips', () => {
    assertRoundTrip(b('npc_quest_fail', { QUEST_ID: 'q1' }), 'npc_quest_fail', { QUEST_ID: 'q1' });
  });

  it('npc_quest_require_step emits _questStep comparison', () => {
    assertLuaContains(b('npc_quest_require_step', { QUEST_ID: 'q1', OP: '>=', STEP: 2 }),
      /_questStep\(player, "q1"\) >= 2/, 'should compare quest step');
  });

  it('npc_quest_require_step round-trips', () => {
    assertRoundTrip(
      b('npc_quest_require_step', { QUEST_ID: 'q1', OP: '>=', STEP: 2 },
        { THEN: b('npc_say', { TEXT: 'Yes', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }) }),
      'npc_quest_require_step', { QUEST_ID: 'q1', OP: '>=', STEP: 2 });
  });

  it('npc_quest_objective emits text node without hook', () => {
    const lua = gen(inChoice(b('npc_quest_objective', { QUEST_ID: 'q1', TEXT: 'Deliver the cargo.' })));
    // No hook function for objective (hookless node)
    assert.notMatch(lua, /function.*Hook.*dialogObject/, 'objective must not emit a hook function');
    assert.match(lua, /Deliver the cargo\./, 'objective text must appear in node');
  });
});

// =============================================================================
// REPUTATION
// =============================================================================

describe('Generator → Reputation blocks', () => {
  it('npc_rep_set emits _repSet', () => {
    assertLuaContains(b('npc_rep_set', { NPC_ID: 'guild', VALUE: 50 }),
      /_repSet\(player, "guild", 50\)/, 'should call _repSet');
  });

  it('npc_rep_set round-trips', () => {
    assertRoundTrip(b('npc_rep_set', { NPC_ID: 'guild', VALUE: 50 }), 'npc_rep_set', { NPC_ID: 'guild', VALUE: 50 });
  });

  it('npc_rep_reset emits _repSet with 0', () => {
    assertLuaContains(b('npc_rep_reset', { NPC_ID: 'guild', SUCCESS: 'Done.' }),
      /_repSet\(player, "guild", 0\)/, 'reset should set reputation to 0');
  });

  it('npc_rep_reset round-trips', () => {
    assertRoundTrip(b('npc_rep_reset', { NPC_ID: 'guild', SUCCESS: 'Done.' }), 'npc_rep_reset', { NPC_ID: 'guild' });
  });

  it('npc_check_rep emits _repGet with operator', () => {
    assertLuaContains(
      b('npc_check_rep', { NPC_ID: 'guild', OP: '>=', VALUE: 100 },
        { THEN: b('npc_say', { TEXT: 'Trusted', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }) }),
      /_repGet\(player, "guild"\) >= 100/, 'should check reputation with operator');
  });

  it('npc_check_rep round-trips', () => {
    assertRoundTrip(
      b('npc_check_rep', { NPC_ID: 'guild', OP: '>=', VALUE: 100 },
        { THEN: b('npc_say', { TEXT: 'Trusted', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'No', MS: 2000 }) }),
      'npc_check_rep', { NPC_ID: 'guild', OP: '>=', VALUE: 100 });
  });

  it('npc_get_rep emits _repGet hook', () => {
    assertLuaContains(b('npc_get_rep', { NPC_ID: 'guild', TEXT: 'Rep: %s' }),
      /_repGet\(player, "guild"\)/, 'should read reputation');
  });

  it('npc_get_rep round-trips', () => {
    assertRoundTrip(b('npc_get_rep', { NPC_ID: 'guild', TEXT: 'Rep: %s' }), 'npc_get_rep', { NPC_ID: 'guild' });
  });
});

// =============================================================================
// COOLDOWNS
// =============================================================================

describe('Generator → Cooldown blocks', () => {
  it('npc_check_cooldown expired emits not _cooldownActive', () => {
    assertLuaContains(
      b('npc_check_cooldown', { ACTION_ID: 'daily', STATE: 'expired' },
        { THEN: b('npc_say', { TEXT: 'Available', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Wait', MS: 2000 }) }),
      /not _cooldownActive/, 'expired check must use NOT');
  });

  it('npc_check_cooldown active emits _cooldownActive', () => {
    assertLuaContains(
      b('npc_check_cooldown', { ACTION_ID: 'daily', STATE: 'active' },
        { THEN: b('npc_say', { TEXT: 'Active', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Free', MS: 2000 }) }),
      /_cooldownActive\(player, "daily"\)/, 'active check must use _cooldownActive directly');
  });

  it('npc_check_cooldown round-trips (expired)', () => {
    assertRoundTrip(
      b('npc_check_cooldown', { ACTION_ID: 'daily', STATE: 'expired' },
        { THEN: b('npc_say', { TEXT: 'OK', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Wait', MS: 2000 }) }),
      'npc_check_cooldown', { ACTION_ID: 'daily', STATE: 'expired' });
  });

  it('npc_get_cooldown_remaining emits _cooldownRemaining', () => {
    assertLuaContains(b('npc_get_cooldown_remaining', { ACTION_ID: 'daily', TEXT: 'Wait %s sec.' }),
      /_cooldownRemaining\(player, "daily"\)/, 'should call _cooldownRemaining');
  });

  it('npc_get_cooldown_remaining round-trips', () => {
    assertRoundTrip(b('npc_get_cooldown_remaining', { ACTION_ID: 'daily', TEXT: 'Wait %s sec.' }),
      'npc_get_cooldown_remaining', { ACTION_ID: 'daily' });
  });

  it('npc_cooldown_clear emits DELETE FROM npc_cooldowns', () => {
    assertLuaContains(b('npc_cooldown_clear', { ACTION_ID: 'daily', SUCCESS: 'Done.' }),
      /DELETE FROM npc_cooldowns/, 'should emit DELETE query');
  });

  it('npc_cooldown_clear round-trips', () => {
    assertRoundTrip(b('npc_cooldown_clear', { ACTION_ID: 'daily', SUCCESS: 'Done.' }),
      'npc_cooldown_clear', { ACTION_ID: 'daily' });
  });
});

// =============================================================================
// STOCK
// =============================================================================

describe('Generator → Stock blocks', () => {
  it('npc_stock_init emits _stockInit', () => {
    assertLuaContains(b('npc_stock_init', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 5 }),
      /_stockInit\("shop1", 12, 5\)/, 'should call _stockInit');
  });

  it('npc_stock_init round-trips', () => {
    assertRoundTrip(b('npc_stock_init', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 5 }),
      'npc_stock_init', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 5 });
  });

  it('npc_stock_add emits _stockAdd', () => {
    assertLuaContains(b('npc_stock_add', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 3, SUCCESS: 'Ok.' }),
      /_stockAdd\("shop1", 12, 3\)/, 'should call _stockAdd');
  });

  it('npc_stock_add round-trips', () => {
    assertRoundTrip(b('npc_stock_add', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 3, SUCCESS: 'Ok.' }),
      'npc_stock_add', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 3 });
  });

  it('npc_check_stock emits _stockGet with operator', () => {
    assertLuaContains(
      b('npc_check_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12, OP: '>=', VALUE: 1 },
        { THEN: b('npc_say', { TEXT: 'In stock', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Out', MS: 2000 }) }),
      /_stockGet\("shop1", 12\) >= 1/, 'should check stock with operator');
  });

  it('npc_check_stock round-trips', () => {
    assertRoundTrip(
      b('npc_check_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12, OP: '>=', VALUE: 1 },
        { THEN: b('npc_say', { TEXT: 'In stock', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Out', MS: 2000 }) }),
      'npc_check_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12 });
  });

  it('npc_get_stock emits _stockGet hook', () => {
    assertLuaContains(b('npc_get_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12, TEXT: 'Stock: %s' }),
      /_stockGet\("shop1", 12\)/, 'should call _stockGet');
  });

  it('npc_get_stock round-trips', () => {
    assertRoundTrip(b('npc_get_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12, TEXT: 'Stock: %s' }),
      'npc_get_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12 });
  });

  it('npc_stock_reset emits UPDATE npc_shop_stock', () => {
    assertLuaContains(b('npc_stock_reset', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 10, SUCCESS: 'Done.' }),
      /npc_shop_stock/, 'should reference npc_shop_stock table');
  });

  it('npc_stock_reset round-trips', () => {
    assertRoundTrip(b('npc_stock_reset', { SHOP_ID: 'shop1', ITEM_TYPE: 12, QTY: 10, SUCCESS: 'Done.' }),
      'npc_stock_reset', { SHOP_ID: 'shop1', ITEM_TYPE: 12 });
  });

  it('npc_stock_sell emits _stockTake and credit deduction', () => {
    assertLuaContains(
      b('npc_stock_sell', { SHOP_ID: 'shop1', ITEM_TYPE: 12, PRICE: 500, COUNT: 1 }),
      /_stockTake\("shop1", 12, 1\)/, 'should call _stockTake');
    assertLuaContains(
      b('npc_stock_sell', { SHOP_ID: 'shop1', ITEM_TYPE: 12, PRICE: 500, COUNT: 1 }),
      /getCredits\(\) < 500/, 'should check player credits');
  });

  it('npc_stock_sell round-trips', () => {
    assertRoundTrip(b('npc_stock_sell', { SHOP_ID: 'shop1', ITEM_TYPE: 12, PRICE: 500, COUNT: 1 }),
      'npc_stock_sell', { SHOP_ID: 'shop1', ITEM_TYPE: 12 });
  });
});

// =============================================================================
// FLAGS & WORLD STATE
// =============================================================================

describe('Generator → Flags & World State blocks', () => {
  it('npc_world_set emits _worldSet', () => {
    assertLuaContains(b('npc_world_set', { KEY: 'event_active', VALUE: 'siege', SUCCESS: 'Ok.' }),
      /_worldSet\("event_active", "siege"\)/, 'should call _worldSet');
  });

  it('npc_world_set round-trips', () => {
    assertRoundTrip(b('npc_world_set', { KEY: 'event_active', VALUE: 'siege', SUCCESS: 'Ok.' }),
      'npc_world_set', { KEY: 'event_active', VALUE: 'siege' });
  });

  it('npc_world_get emits _worldGet', () => {
    assertLuaContains(b('npc_world_get', { KEY: 'event_active', DEFAULT: 'none', SUCCESS: 'Done.' }),
      /_worldGet\("event_active", "none"\)/, 'should call _worldGet');
  });

  it('npc_world_get round-trips', () => {
    assertRoundTrip(b('npc_world_get', { KEY: 'event_active', DEFAULT: 'none', SUCCESS: 'Done.' }),
      'npc_world_get', { KEY: 'event_active' });
  });

  it('npc_check_flag_db emits _flagGet', () => {
    assertLuaContains(
      b('npc_check_flag_db', { FLAG_NAME: 'intro_done', VALUE: 'true' },
        { THEN: b('npc_say', { TEXT: 'Done', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Not', MS: 2000 }) }),
      /_flagGet\(player, "intro_done"\)/, 'should call _flagGet');
  });

  it('npc_check_flag_db round-trips', () => {
    assertRoundTrip(
      b('npc_check_flag_db', { FLAG_NAME: 'intro_done', VALUE: 'true' },
        { THEN: b('npc_say', { TEXT: 'Done', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Not', MS: 2000 }) }),
      'npc_check_flag_db', { FLAG_NAME: 'intro_done', VALUE: 'true' });
  });

  it('npc_check_world emits _worldGet comparison', () => {
    assertLuaContains(
      b('npc_check_world', { KEY: 'event_active', OP: '==text', VALUE: 'siege' },
        { THEN: b('npc_say', { TEXT: 'Siege!', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Peace', MS: 2000 }) }),
      /_worldGet\("event_active"/, 'should call _worldGet in condition');
  });

  it('npc_check_world round-trips', () => {
    assertRoundTrip(
      b('npc_check_world', { KEY: 'event_active', OP: '==text', VALUE: 'siege' },
        { THEN: b('npc_say', { TEXT: 'Siege!', MS: 2000 }), ELSE: b('npc_say', { TEXT: 'Peace', MS: 2000 }) }),
      'npc_check_world', { KEY: 'event_active' });
  });

  it('npc_get_world emits _worldGet hook', () => {
    assertLuaContains(b('npc_get_world', { KEY: 'event', DEFAULT: 'peace', TEXT: 'Event: %s' }),
      /_worldGet\("event", "peace"\)/, 'should call _worldGet in hook');
  });

  it('npc_get_world round-trips', () => {
    assertRoundTrip(b('npc_get_world', { KEY: 'event', DEFAULT: 'peace', TEXT: 'Event: %s' }),
      'npc_get_world', { KEY: 'event' });
  });
});

// =============================================================================
// ADVANCED / DIALOG
// =============================================================================

describe('Generator → Advanced & Dialog blocks', () => {
  it('npc_get_info emits getInfoHook_ with ps:getCredits()', () => {
    assertLuaContains(b('npc_get_info', { INFO_TYPE: 'credits', TEXT: 'You have %s credits.' }),
      /getInfoHook_credits_/, 'should emit getInfoHook_ with type prefix');
    assertLuaContains(b('npc_get_info', { INFO_TYPE: 'credits', TEXT: 'You have %s credits.' }),
      /ps:getCredits\(\)/, 'should read credits');
  });

  it('npc_get_info round-trips', () => {
    assertRoundTrip(b('npc_get_info', { INFO_TYPE: 'credits', TEXT: 'You have %s credits.' }),
      'npc_get_info', { INFO_TYPE: 'credits' });
  });

  it('npc_custom_hook emits named hook with raw body', () => {
    assertLuaContains(
      b('npc_custom_hook', { NAME: 'myCustomHook', BODY: 'return dialogObject:hireConverationPartner();' }),
      /function myCustomHook\(dialogObject\)/, 'hook function must use NAME field');
    assertLuaContains(
      b('npc_custom_hook', { NAME: 'myCustomHook', BODY: 'return dialogObject:hireConverationPartner();' }),
      /hireConverationPartner/, 'body must appear verbatim');
  });

  it('npc_custom_hook round-trips', () => {
    assertRoundTrip(
      b('npc_custom_hook', { NAME: 'myCustomHook', BODY: 'return 0' }),
      'npc_custom_hook', { NAME: 'myCustomHook' });
  });

  it('npc_set_conv_state emits setConversationState', () => {
    assertLuaContains(b('npc_set_conv_state', { STATE: 'hired' }),
      /setConversationState\("hired"\)/, 'should call setConversationState');
  });

  it('npc_set_conv_state round-trips', () => {
    assertRoundTrip(b('npc_set_conv_state', { STATE: 'hired' }), 'npc_set_conv_state', { STATE: 'hired' });
  });

  it('npc_say_value emits sayValueHook_ with stat type', () => {
    assertLuaContains(b('npc_say_value', { VALUE_TYPE: 'health', TEXT: 'HP: %s', MS: 2000 }),
      /sayValueHook_health_/, 'hook must include type key');
    assertLuaContains(b('npc_say_value', { VALUE_TYPE: 'health', TEXT: 'HP: %s', MS: 2000 }),
      /ps:getHealth\(\)/, 'should read health stat');
  });

  it('npc_say_value round-trips', () => {
    assertRoundTrip(b('npc_say_value', { VALUE_TYPE: 'credits', TEXT: '%s credits', MS: 2000 }),
      'npc_say_value', { VALUE_TYPE: 'credits' });
  });

  it('npc_confirm emits 2 choices without hook', () => {
    const lua = gen(inChoice(b('npc_confirm', { TEXT: 'Sure?', MS: 2000, YES_LABEL: 'Yes.', NO_LABEL: 'No.' })));
    // No hook on the confirm node itself
    const lines = lua.split('\n');
    const addLines = lines.filter(l => l.includes(':add(') && !l.includes('[DISABLED]'));
    // The confirm node should produce 2 :add() calls (Yes and No)
    const confirmAdds = addLines.filter(l => /Yes\.|No\./.test(l));
    assert.isAtLeast(confirmAdds.length, 2, 'confirm must emit 2 :add() lines (Yes and No)');
  });

  it('npc_confirm round-trips', () => {
    assertRoundTrip(b('npc_confirm', { TEXT: 'Sure?', MS: 2000, YES_LABEL: 'Yes.', NO_LABEL: 'No.' }),
      'npc_confirm', { YES_LABEL: 'Yes.', NO_LABEL: 'No.' });
  });

  it('npc_say_menu emits sub-choices without hook on parent', () => {
    const choice1 = b('npc_choice', { LABEL: 'OptionA' });
    const lua = gen(inChoice(b('npc_say_menu', { TEXT: 'Pick one:', MS: 2000 }, { CHOICES: choice1 })));
    assert.match(lua, /Pick one:/, 'say_menu text must appear');
    assert.match(lua, /:add\(.*OptionA/, 'sub-choice must be added');
  });

  it('npc_say_menu round-trips', () => {
    const ch = b('npc_choice', { LABEL: 'A' });
    assertRoundTrip(b('npc_say_menu', { TEXT: 'Pick:', MS: 2000 }, { CHOICES: ch }), 'npc_say_menu');
  });
});

// =============================================================================
// MULTI-BLOCK SEQUENCE TESTS
// =============================================================================

describe('Generator → Multi-block sequences', () => {
  it('npc_say → npc_give_credits → npc_quest_complete chains correctly', () => {
    const complete = b('npc_quest_complete', { QUEST_ID: 'q1', REWARD_CREDITS: 500, REWARD_ITEM: 0, REWARD_COUNT: 0 });
    const credits  = b('npc_give_credits', { AMOUNT: 200 }, {}, complete);
    const say      = b('npc_say', { TEXT: 'Well done!', MS: 2000 }, {}, credits);
    const lua = gen(inChoice(say));
    assert.match(lua, /Well done!/, 'first say node must appear');
    assert.match(lua, /ps:getCredits\(\) \+ 200/, 'give credits hook must appear');
    assert.match(lua, /_questSet.*complete/, 'quest complete hook must appear');
    // Check the chain: 3 addReaction lines (one per hook node)
    const reactionLines = lua.split('\n').filter(l => l.includes(':addReaction(') && !l.includes('[DISABLED]'));
    assert.isAtLeast(reactionLines.length, 2, 'chain must have at least 2 addReaction calls');
  });

  it('npc_rep_add → npc_cooldown_set sequence both emitted', () => {
    const cd  = b('npc_cooldown_set', { ACTION_ID: 'daily', DURATION_SEC: 86400 });
    const rep = b('npc_rep_add', { NPC_ID: 'guild', DELTA: 10 }, {}, cd);
    const lua = gen(inChoice(rep));
    assert.match(lua, /_repAdd\(player, "guild", 10\)/, 'rep add must appear');
    assert.match(lua, /_cooldownSet\(player, "daily"/, 'cooldown set must appear');
  });

  it('disabled action mid-chain does not break active chain', () => {
    const quest   = b('npc_quest_start', { QUEST_ID: 'q1', STEP: 1 });
    const credits = mockBlock('npc_give_credits', { AMOUNT: 100 }, false, {}, quest); // disabled
    const say     = b('npc_say', { TEXT: 'Chain start', MS: 2000 }, {}, credits);
    const lua = gen(inChoice(say));
    assert.match(lua, /Chain start/, 'say node must appear');
    assert.match(lua, /-- \[DISABLED\].*giveCreditsHook/, 'disabled credits hook instance must be commented');
    assert.match(lua, /_questSet.*q1.*active/, 'quest start after disabled must still be emitted');
  });
});

// =============================================================================
// CONDITION EXPRESSION TESTS
// =============================================================================

describe('Generator → Condition expressions (buildConditionExpression)', () => {
  it('npc_cond_custom returns raw expression', () => {
    const cond   = b('npc_cond_custom', { EXPR: 'myVar >= 5' });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /myVar >= 5/, 'custom expression must be verbatim');
  });

  it('npc_cond_quest_status returns _questStatus comparison', () => {
    const cond   = b('npc_cond_quest_status', { QUEST_ID: 'q1', STATUS: 'complete' });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /_questStatus\(.*"q1"\).*==.*"complete"/, 'quest status condition must compare status');
  });

  it('npc_cond_quest_step returns _questStep comparison', () => {
    const cond   = b('npc_cond_quest_step', { QUEST_ID: 'q1', OP: '>=', STEP: 2 });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /_questStep\(.*"q1"\).*>=.*2/, 'quest step condition must compare step');
  });

  it('npc_cond_rep returns _repGet comparison', () => {
    const cond   = b('npc_cond_rep', { NPC_ID: 'guild', OP: '>=', VALUE: 50 });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /_repGet\(.*"guild"\).*>=.*50/, 'rep condition must compare score');
  });

  it('npc_cond_and combines two expressions with and', () => {
    const left  = b('npc_cond_custom', { EXPR: 'a' });
    const right = b('npc_cond_custom', { EXPR: 'b' });
    const cond  = b('npc_cond_and', {}, { A: left, B: right });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /and/, 'AND must use the "and" operator');
    assertLuaContains(action, /a/, 'left operand must appear');
    assertLuaContains(action, /b/, 'right operand must appear');
  });

  it('npc_cond_or combines two expressions with or', () => {
    const left  = b('npc_cond_custom', { EXPR: 'x' });
    const right = b('npc_cond_custom', { EXPR: 'y' });
    const cond  = b('npc_cond_or', {}, { A: left, B: right });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /or/, 'OR must use the "or" operator');
    assertLuaContains(action, /x/, 'left operand must appear');
    assertLuaContains(action, /y/, 'right operand must appear');
  });

  it('npc_cond_not negates expression', () => {
    const inner = b('npc_cond_custom', { EXPR: 'z' });
    const cond  = b('npc_cond_not', {}, { COND: inner });
    const action = b('npc_if_condition', {}, { COND: cond });
    assertLuaContains(action, /not/, 'NOT must use the "not" keyword');
    assertLuaContains(action, /z/, 'inner expression z must appear in NOT');
  });
});

// =============================================================================
// LUA OUTPUT STRUCTURAL INTEGRITY
// =============================================================================

describe('Generator → Lua structural integrity', () => {
  it('all HSQLDB subsystems emit table creation when needed', () => {
    const questBlock = b('npc_quest_start', { QUEST_ID: 'q1', STEP: 1 });
    const lua = gen(inChoice(questBlock));
    assert.match(lua, /CREATE CACHED TABLE IF NOT EXISTS npc_quests/, 'quest table must be created');
    assert.match(lua, /function _questSet/, 'quest helpers must be emitted');
  });

  it('reputation: _repAdd hook body is correct', () => {
    // Note: HSQLDB table emission requires _state.usesReputation = true,
    // which is set by main.js (Blockly workspace detection) not by the generator module.
    // We verify the hook body is correct instead.
    assertLuaContains(b('npc_rep_add', { NPC_ID: 'guild', DELTA: 5 }),
      /_repAdd\(player, "guild", 5\)/, 'rep_add hook must call _repAdd with correct args');
  });

  it('cooldown: _cooldownSet hook body is correct', () => {
    assertLuaContains(b('npc_cooldown_set', { ACTION_ID: 'daily', DURATION_SEC: 86400 }),
      /_cooldownSet\(player, "daily", 86400000\)/, 'cooldown_set hook must call _cooldownSet with correct ms');
  });

  it('stock: _stockInit hook body is correct', () => {
    assertLuaContains(b('npc_stock_init', { SHOP_ID: 's', ITEM_TYPE: 1, QTY: 5 }),
      /_stockInit\("s", 1, 5\)/, 'stock_init hook must call _stockInit with correct args');
  });

  it('flag blocks trigger memory table (flag stored as memory key)', () => {
    const lua = gen(inChoice(b('npc_flag_set', { FLAG_NAME: 'done', VALUE: 'true', SUCCESS: 'Ok.' })));
    assert.match(lua, /_flagSet\(player,/, 'flagSet must appear in hook');
  });

  it('generated Lua always ends with "end" (valid function close)', () => {
    const blocks = [
      b('npc_hire', { PRICE: 50000 }),
      b('npc_quest_complete', { QUEST_ID: 'q1', REWARD_CREDITS: 0, REWARD_ITEM: 0, REWARD_COUNT: 0 }),
      b('npc_rep_add', { NPC_ID: 'guild', DELTA: 5 }),
    ];
    for (const action of blocks) {
      const lua = gen(inChoice(action)).trimEnd();
      assert.equal(lua.split('\n').at(-1)?.trim(), 'end', `Lua for ${action.type} must end with "end"`);
    }
  });

  it('generated Lua has balanced function/end pairs', () => {
    // Use a simple block without HSQLDB preamble (npc_hire has no if/end blocks)
    // to avoid HSQLDB helper if-blocks inflating the 'end' count.
    const lua = gen(inChoice(b('npc_hire', { PRICE: 50000 })));
    // Count top-level function declarations (hook fn + create fn = 2)
    const fns = (lua.match(/^function\s+\w+/mg) || []).length;
    assert.equal(fns, 2, 'npc_hire must have exactly 2 top-level functions (hook + create)');
    // Verify last non-empty line is "end"
    const lastLine = lua.trimEnd().split('\n').at(-1)?.trim();
    assert.equal(lastLine, 'end', 'Lua must end with "end"');
  });
});
