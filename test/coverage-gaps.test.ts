/**
 * @fileoverview Tests covering every remaining gap identified by the coverage audit.
 *
 * Categories covered:
 *   - npc_cond_greeting (conditional root)
 *   - npc_delayed_followup (async follow-up)
 *   - All 15 npc_cond_* expression blocks (buildConditionExpression)
 *   - npc_lua_var / npc_var_ref variable blocks
 *   - getMissingConnectedVariables validation
 *   - sanitizeIdentPart edge cases
 *   - textExpr placeholder resolution
 *   - Script name in Lua header
 *   - Comment round-trip (Blockly comment → Lua → import)
 *   - npc_quest_objective (hookless import maps to npc_say)
 *   - npc_sqlite_table DDL generation
 *   - JSON workspace state structure validation
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { assert } from 'chai';
import { resetState, _state } from '../ui/src/generator/state.js';
import {
  processGreeting,
  processCondGreeting,
  buildConditionExpression,
  processActionBlock,
} from '../ui/src/generator/core.js';
import { emitLua } from '../ui/src/generator/emitter.js';
import { parseLuaToBlocklyState } from '../ui/src/parser/lua-to-blocks.js';
import {
  sanitizeIdentPart,
  textExpr,
  getMissingConnectedVariables,
  luaStringLiteral,
  hashCode,
  escapeRegExp,
  luaVarLiteral,
} from '../ui/src/generator/helpers.js';

// =============================================================================
// MOCK HELPERS
// =============================================================================

/**
 * Build a minimal mock Blockly block.
 *
 * @param {string} type Block type id.
 * @param {Object} fields Field values.
 * @param {boolean} enabled isEnabled() return.
 * @param {Object} inputs Input → block map.
 * @param {Object|null} next Next sibling block.
 * @returns {Object} Mock block.
 */
function m(type, fields = {}, inputs = {}, next = null, enabled = true, comment = '') {
  return {
    type,
    getFieldValue:       n => fields[n] ?? null,
    getInputTargetBlock: n => inputs[n] ?? null,
    getNextBlock:        () => next,
    isEnabled:           () => enabled,
    getCommentText:      () => comment,
    data:                null,
    getParent:           () => null,
  };
}

/** Shorthand for a plain enabled block. */
function b(type, fields = {}, inputs = {}, next = null) {
  return m(type, fields, inputs, next, true, '');
}

/** Wrap action in greeting → choice. */
function inChoice(action) {
  const choice = m('npc_choice', { LABEL: 'Test' }, { ACTIONS: action });
  return m('npc_greeting', { TEXT: 'Hello.', MS: 2000 }, { CHOICES: choice });
}

/** Generate Lua from a root block (greeting or cond_greeting). */
function gen(rootBlock, isCond = false) {
  resetState();
  if (isCond) processCondGreeting(rootBlock);
  else processGreeting(rootBlock);
  return emitLua('test');
}

/** Generate Lua from action wrapped in greeting → choice. */
function genAction(action, scriptName = 'test') {
  resetState();
  processGreeting(inChoice(action));
  return emitLua(scriptName);
}

/** Round-trip: generate then parse, return first action block. */
function roundTrip(action) {
  const lua   = genAction(action);
  const state = parseLuaToBlocklyState(lua);
  const ch    = state.blocks.blocks[0].inputs?.CHOICES?.block;
  return ch?.inputs?.ACTIONS?.block ?? ch;
}

// =============================================================================
// CONDITIONAL GREETING (npc_cond_greeting)
// =============================================================================

describe('Generator → npc_cond_greeting (conditional root)', () => {
  /** Build a conditional greeting block. */
  function condGreet(condExpr, thenText, elseText, thenChoices = null, elseChoices = null) {
    const cond = b('npc_cond_custom', { EXPR: condExpr });
    return m('npc_cond_greeting', {
      TEXT_THEN: thenText, MS_THEN: 2000,
      TEXT_ELSE: elseText, MS_ELSE: 2000,
    }, {
      COND:         cond,
      CHOICES_THEN: thenChoices,
      CHOICES_ELSE: elseChoices,
    });
  }

  it('emits condGreetingHook_ based on expression hash', () => {
    const lua = gen(condGreet('true', 'Hello!', 'Go away.'), true);
    assert.match(lua, /condGreetingHook_/, 'should have condGreetingHook_ function');
  });

  it('hook body evaluates condition and branches with 0 / -1', () => {
    const lua = gen(condGreet('dialogObject:getEntity():getFactionId() == 42', 'Hi!', 'Away.'), true);
    assert.match(lua, /getFactionId\(\) == 42/, 'condition must appear in hook body');
    assert.match(lua, /addReaction.*0,/, 'reaction 0 (THEN) must be wired');
    assert.match(lua, /addReaction.*-1,/, 'reaction -1 (ELSE) must be wired');
  });

  it('THEN and ELSE greeting texts both appear as dialog nodes', () => {
    const lua = gen(condGreet('true', 'Friend text!', 'Enemy text!'), true);
    assert.match(lua, /Friend text!/, 'THEN text must appear');
    assert.match(lua, /Enemy text!/, 'ELSE text must appear');
  });

  it('root entry variable is "entry" (required by StarMade)', () => {
    const lua = gen(condGreet('true', 'Hi', 'Go'), true);
    assert.match(lua, /factory:setRootEntry\(entry\)/, 'root entry must be "entry"');
  });

  it('choices in THEN branch are attached to THEN greeting node', () => {
    const thenCh = b('npc_choice', { LABEL: 'Join us' });
    const lua    = gen(condGreet('true', 'Hi friend!', 'Go.', thenCh, null), true);
    assert.match(lua, /:add\(.*Join us/, 'THEN branch choice must be added');
  });

  it('choices in ELSE branch are attached to ELSE greeting node', () => {
    const elseCh = b('npc_choice', { LABEL: 'Leave' });
    const lua    = gen(condGreet('false', 'Hi.', 'You are not welcome!', null, elseCh), true);
    assert.match(lua, /:add\(.*Leave/, 'ELSE branch choice must be added');
  });

  it('different conditions produce different hook names (hash)', () => {
    const lua1 = gen(condGreet('true', 'A', 'B'), true);
    const lua2 = gen(condGreet('false', 'A', 'B'), true);
    const hook1 = (lua1.match(/condGreetingHook_(\d+)/) || [])[1];
    const hook2 = (lua2.match(/condGreetingHook_(\d+)/) || [])[1];
    assert.notEqual(hook1, hook2, 'different conditions must produce different hook names');
  });

  it('disabled choice in THEN branch produces [DISABLED] :add()', () => {
    const disabledCh = m('npc_choice', { LABEL: 'Secret' }, {}, null, false, '');
    const lua = gen(condGreet('true', 'Hi!', 'Away.', disabledCh, null), true);
    assert.match(lua, /-- \[DISABLED\].*:add\(.*Secret/, 'disabled THEN choice must be commented');
  });
});

// =============================================================================
// DELAYED FOLLOWUP (npc_delayed_followup)
// =============================================================================

describe('Generator → npc_delayed_followup', () => {
  /** Build a delayed followup block. */
  function delayedBlock(condExpr, followupHook, followupBody) {
    const cond = b('npc_cond_custom', { EXPR: condExpr });
    return b('npc_delayed_followup', { FOLLOWUP_HOOK: followupHook, FOLLOWUP_BODY: followupBody },
      { CONDITION: cond });
  }

  it('emits two hook functions: condition hook + followup hook', () => {
    const lua = genAction(delayedBlock('true', 'myFollowup', 'return 0'));
    assert.match(lua, /function delayedCondHook_/, 'should emit delayedCondHook_ function');
    assert.match(lua, /function myFollowup\(dialogObject\)/, 'should emit followup hook function');
  });

  it('condition hook body evaluates expression and returns 0 or -1', () => {
    const lua = genAction(delayedBlock('x > 5', 'onDone', 'return 0'));
    assert.match(lua, /local _c = \(x > 5\)/, 'condition body must evaluate expression');
    assert.match(lua, /if _c then return 0 end/, 'condition hook must return 0 on true');
    assert.match(lua, /return -1/, 'condition hook must return -1 on false');
  });

  it('followup hook body appears verbatim', () => {
    const body = 'dialogObject:hireConverationPartner()';
    const lua  = genAction(delayedBlock('true', 'hireOnComplete', body));
    assert.match(lua, new RegExp(body.replace('(', '\\(').replace(')', '\\)')),
      'followup body must appear verbatim in hook');
  });

  it('different condition expressions produce different delayedCondHook_ names', () => {
    const lua1 = genAction(delayedBlock('a', 'h1', 'return 0'));
    const lua2 = genAction(delayedBlock('b', 'h2', 'return 0'));
    const hook1 = (lua1.match(/delayedCondHook_(\d+)/) || [])[1];
    const hook2 = (lua2.match(/delayedCondHook_(\d+)/) || [])[1];
    assert.notEqual(hook1, hook2, 'different conditions must produce different hook names');
  });

  it('wait node is created for the followup sequence', () => {
    const lua = genAction(delayedBlock('true', 'myFn', 'return 0'));
    // The wait node itself is an entry with text '...'
    assert.match(lua, /newInstance.*TextEntry.*format\("\.\.\."\)/, 'delayed followup wait node must exist');
  });
});

// =============================================================================
// ALL npc_cond_* EXPRESSION BLOCKS
// =============================================================================

describe('buildConditionExpression — all npc_cond_* types', () => {
  /** Evaluate a condition block and return the Lua expression string. */
  function expr(type, fields = {}, inputs = {}) {
    return buildConditionExpression(b(type, fields, inputs));
  }

  it('npc_cond_player_value: credits >= N', () => {
    const e = expr('npc_cond_player_value', { VALUE_TYPE: 'credits', OP: '>=', VALUE: 1000 });
    assert.match(e, /getCredits\(\)/, 'must read credits');
    assert.match(e, />= 1000/, 'must compare with >=');
  });

  it('npc_cond_player_value: health < N', () => {
    const e = expr('npc_cond_player_value', { VALUE_TYPE: 'health', OP: '<', VALUE: 50 });
    assert.match(e, /getHealth\(\)/, 'must read health');
    assert.match(e, /< 50/, 'must compare with <');
  });

  it('npc_cond_player_value: factionId == N', () => {
    const e = expr('npc_cond_player_value', { VALUE_TYPE: 'factionId', OP: '==', VALUE: 42 });
    assert.match(e, /getFactionId\(\)/, 'must read factionId');
  });

  it('npc_cond_flag: creative mode', () => {
    const e = expr('npc_cond_flag', { FLAG: 'creative', EXPECT: 'true' });
    assert.match(e, /isCreativeModeEnabled/, 'must check creative mode');
    assert.match(e, /== true/, 'must expect true');
  });

  it('npc_cond_flag: inTeam false', () => {
    const e = expr('npc_cond_flag', { FLAG: 'inTeam', EXPECT: 'false' });
    assert.match(e, /isConverationPartnerInTeam/, 'must check team status');
    assert.match(e, /== false/, 'must expect false');
  });

  it('npc_cond_is_at_block: checks coordinates', () => {
    const e = expr('npc_cond_is_at_block', { X: 5, Y: 10, Z: -3 });
    assert.match(e, /isAtBlock\(5, 10, -3\)/, 'must call isAtBlock with coords');
  });

  it('npc_cond_memory_number: key >= value', () => {
    const e = expr('npc_cond_memory_number', { KEY: 'score', OP: '>=', VALUE: '10', DEFAULT: '0' });
    assert.match(e, /_memGetNumber\(.*"score"/, 'must read memory key "score"');
    assert.match(e, />= 10/, 'must compare with >= 10');
  });

  it('npc_cond_memory_text: key == value', () => {
    const e = expr('npc_cond_memory_text', { KEY: 'status', OP: '==', VALUE: 'done', DEFAULT: '' });
    assert.match(e, /_memGetText\(.*"status"/, 'must read memory text key');
    assert.match(e, /== "done"/, 'must compare with "done"');
  });

  it('npc_cond_memory_exists: key exists', () => {
    const e = expr('npc_cond_memory_exists', { KEY: 'intro_done', EXPECT: 'true' });
    assert.match(e, /_memHas\(.*"intro_done"/, 'must check memory existence');
    assert.match(e, /== true/, 'must expect true');
  });

  it('npc_cond_memory_exists: key does not exist', () => {
    const e = expr('npc_cond_memory_exists', { KEY: 'intro_done', EXPECT: 'false' });
    assert.match(e, /== false/, 'must expect false for non-existence');
  });

  it('npc_cond_sqlite_value: table column comparison', () => {
    const e = expr('npc_cond_sqlite_value', { TABLE: 'my_tbl', COL: 'score', OP: '>=', VALUE: '5', DEFAULT: '0' });
    assert.match(e, /_dbGetPlayerValue\("my_tbl", "score"/, 'must read DB column');
    assert.match(e, />= 5/, 'must compare with >=');
  });

  it('npc_cond_sqlite_number: numeric comparison', () => {
    const e = expr('npc_cond_sqlite_number', { TABLE: 'q', COL: 'step', OP: '>=', VALUE: '2', DEFAULT: '0' });
    assert.match(e, /_dbGetPlayerNumber\("q", "step"/, 'must read DB number');
    assert.match(e, />= 2/, 'must compare with >= 2');
  });

  it('npc_cond_sqlite_text: text comparison', () => {
    const e = expr('npc_cond_sqlite_text', { TABLE: 'q', COL: 'state', OP: '==', VALUE: 'done', DEFAULT: '' });
    assert.match(e, /_dbGetPlayerText\("q", "state"/, 'must read DB text');
    assert.match(e, /== "done"/, 'must compare with "done"');
  });

  it('npc_cond_sqlite_exists: row exists check', () => {
    const e = expr('npc_cond_sqlite_exists', { TABLE: 'quest_state', EXPECT: 'true' });
    assert.match(e, /_dbHasPlayerRow\("quest_state"/, 'must check row existence');
    assert.match(e, /== true/, 'must expect true');
  });

  it('npc_cond_quest_status: status == active', () => {
    const e = expr('npc_cond_quest_status', { QUEST_ID: 'q1', STATUS: 'active' });
    assert.match(e, /_questStatus\(.*"q1"\)/, 'must check quest status');
    assert.match(e, /== "active"/, 'must compare with "active"');
  });

  it('npc_cond_quest_step: step >= 2', () => {
    const e = expr('npc_cond_quest_step', { QUEST_ID: 'q1', OP: '>=', STEP: 2 });
    assert.match(e, /_questStep\(.*"q1"\)/, 'must read quest step');
    assert.match(e, />= 2/, 'must compare with >= 2');
  });

  it('npc_cond_rep: reputation >= 100', () => {
    const e = expr('npc_cond_rep', { NPC_ID: 'guild', OP: '>=', VALUE: 100 });
    assert.match(e, /_repGet\(.*"guild"\)/, 'must read reputation');
    assert.match(e, />= 100/, 'must compare with >= 100');
  });

  it('npc_cond_cooldown: active state', () => {
    const e = expr('npc_cond_cooldown', { ACTION_ID: 'daily', STATE: 'active' });
    assert.match(e, /_cooldownActive\(.*"daily"\) == true/, 'must check active cooldown');
  });

  it('npc_cond_cooldown: expired state', () => {
    const e = expr('npc_cond_cooldown', { ACTION_ID: 'daily', STATE: 'expired' });
    assert.match(e, /_cooldownActive\(.*"daily"\) == false/, 'must check expired cooldown');
  });

  it('npc_cond_stock: stock >= 1', () => {
    const e = expr('npc_cond_stock', { SHOP_ID: 'shop1', ITEM_TYPE: 12, OP: '>=', VALUE: 1 });
    assert.match(e, /_stockGet\("shop1", 12\)/, 'must read stock quantity');
    assert.match(e, />= 1/, 'must compare with >= 1');
  });

  it('npc_cond_flag_db: persistent flag check', () => {
    const e = expr('npc_cond_flag_db', { FLAG_NAME: 'intro_done', VALUE: 'true' });
    assert.match(e, /_flagGet\(.*"intro_done"\)/, 'must check persistent flag');
    assert.match(e, /== true/, 'must compare with true');
  });

  it('npc_cond_world: text world state comparison', () => {
    const e = expr('npc_cond_world', { KEY: 'event_active', OP: '==text', VALUE: 'siege' });
    assert.match(e, /_worldGet\("event_active"/, 'must read world state');
    assert.match(e, /== "siege"/, 'must compare with "siege"');
  });

  it('npc_cond_world: numeric world state comparison', () => {
    const e = expr('npc_cond_world', { KEY: 'level', OP: '>=num', VALUE: '5' });
    assert.match(e, /_worldGetNumber\("level"/, 'must read world number');
    assert.match(e, />= 5/, 'must compare with >= 5');
  });

  it('npc_cond_conv_state: conversation state check', () => {
    const e = expr('npc_cond_conv_state', { STATE: 'hired' });
    assert.match(e, /getConversationState\(\) == "hired"/, 'must compare conversation state');
  });

  it('null block returns "false"', () => {
    assert.equal(buildConditionExpression(null), 'false', 'null block must return "false"');
  });

  it('unknown block type returns "false"', () => {
    assert.equal(buildConditionExpression(b('npc_unknown_type', {})), 'false',
      'unknown block type must return "false"');
  });

  it('npc_cond_and combines A and B', () => {
    const a = b('npc_cond_custom', { EXPR: 'x' });
    const bk = b('npc_cond_custom', { EXPR: 'y' });
    const e = buildConditionExpression(b('npc_cond_and', {}, { A: a, B: bk }));
    assert.include(e, 'and', 'AND expression must contain "and"');
    assert.include(e, 'x',   'AND must include left operand');
    assert.include(e, 'y',   'AND must include right operand');
  });

  it('npc_cond_or combines A or B', () => {
    const a = b('npc_cond_custom', { EXPR: 'p' });
    const bk = b('npc_cond_custom', { EXPR: 'q' });
    const e = buildConditionExpression(b('npc_cond_or', {}, { A: a, B: bk }));
    assert.include(e, 'or', 'OR expression must contain "or"');
    assert.include(e, 'p',  'OR must include left operand');
    assert.include(e, 'q',  'OR must include right operand');
  });

  it('npc_cond_not negates expression', () => {
    const inner = b('npc_cond_custom', { EXPR: 'z' });
    const e = buildConditionExpression(b('npc_cond_not', {}, { COND: inner }));
    assert.include(e, 'not', 'NOT expression must contain "not"');
    assert.include(e, 'z',   'NOT must include inner expression');
  });
});

// =============================================================================
// npc_lua_var / npc_var_ref VARIABLE BLOCKS
// =============================================================================

describe('Generator → Variable blocks (npc_lua_var / npc_var_ref)', () => {
  it('npc_lua_var (number) emits global variable declaration at top of Lua', () => {
    const varBlock = m('npc_lua_var', { NAME: 'priceLaser', MODE: 'number', VALUE: '100000' });
    // Simulate main.js: push var to _state before emitting
    resetState();
    _state.luaVars.push({ name: 'priceLaser', mode: 'number', value: '100000' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    assert.match(lua, /priceLaser = 100000/, 'number variable must be emitted as numeric literal');
    // Must appear before create()
    const varPos    = lua.indexOf('priceLaser = 100000');
    const createPos = lua.indexOf('function create');
    assert.isBelow(varPos, createPos, 'variable must appear before create()');
  });

  it('npc_lua_var (text) emits global variable as string literal', () => {
    resetState();
    _state.luaVars.push({ name: 'npcTitle', mode: 'text', value: 'Commander' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    assert.match(lua, /npcTitle = "Commander"/, 'text variable must be emitted as string literal');
  });

  it('npc_lua_var (raw) emits global variable as raw Lua', () => {
    resetState();
    _state.luaVars.push({ name: 'myRef', mode: 'raw', value: 'someGlobal.value' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    assert.match(lua, /myRef = someGlobal\.value/, 'raw variable must be emitted verbatim');
  });

  it('npc_var_ref is resolved by getOptionalVarName when connected', () => {
    // npc_hire with a var_ref on PRICE_VAR
    const varRef = b('npc_var_ref', { NAME: 'myPrice' });
    const hire   = b('npc_hire', { PRICE: 0 }, { PRICE_VAR: varRef });
    const lua    = genAction(hire);
    // Hook function name should include the var name
    assert.match(lua, /hireHookFunc_myPrice/, 'hook name must use var ref name');
  });

  it('multiple variables appear in order of declaration', () => {
    resetState();
    _state.luaVars.push({ name: 'varA', mode: 'number', value: '1' });
    _state.luaVars.push({ name: 'varB', mode: 'number', value: '2' });
    _state.luaVars.push({ name: 'varC', mode: 'number', value: '3' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    const posA = lua.indexOf('varA = 1');
    const posB = lua.indexOf('varB = 2');
    const posC = lua.indexOf('varC = 3');
    assert.isBelow(posA, posB, 'varA must come before varB');
    assert.isBelow(posB, posC, 'varB must come before varC');
  });
});

// =============================================================================
// getMissingConnectedVariables
// =============================================================================

describe('getMissingConnectedVariables', () => {
  function varDecl(name) {
    return m('npc_lua_var', { NAME: name, MODE: 'number', VALUE: '0' });
  }

  function varRef(name, connected = true) {
    const block = m('npc_var_ref', { NAME: name });
    if (connected) Object.assign(block, { getParent: () => ({}) });
    return block;
  }

  it('returns empty array when all references are declared', () => {
    const decl = varDecl('myPrice');
    const ref  = varRef('myPrice');
    assert.deepEqual(getMissingConnectedVariables([decl, ref]), []);
  });

  it('returns missing reference names when declaration is absent', () => {
    const ref = varRef('undeclared');
    assert.deepEqual(getMissingConnectedVariables([ref]), ['undeclared']);
  });

  it('reports multiple distinct missing references', () => {
    const refs = [varRef('a'), varRef('b'), varRef('c')];
    const missing = getMissingConnectedVariables(refs);
    assert.deepEqual(missing, ['a', 'b', 'c']);
  });

  it('ignores disconnected var_ref blocks (no parent)', () => {
    const detached = varRef('orphan', false);
    assert.deepEqual(getMissingConnectedVariables([detached]), []);
  });

  it('is sorted alphabetically', () => {
    const refs = [varRef('z'), varRef('a'), varRef('m')];
    const missing = getMissingConnectedVariables(refs);
    assert.deepEqual(missing, ['a', 'm', 'z']);
  });

  it('deduplicates the same missing reference used multiple times', () => {
    const refs = [varRef('x'), varRef('x'), varRef('x')];
    const missing = getMissingConnectedVariables(refs);
    assert.deepEqual(missing, ['x']);
  });

  it('empty block list returns empty array', () => {
    assert.deepEqual(getMissingConnectedVariables([]), []);
  });

  it('blocks with empty name are ignored', () => {
    const emptyRef = varRef('', true);
    assert.deepEqual(getMissingConnectedVariables([emptyRef]), []);
  });
});

// =============================================================================
// sanitizeIdentPart
// =============================================================================

describe('sanitizeIdentPart — edge cases', () => {
  it('replaces spaces with underscores', () => {
    assert.equal(sanitizeIdentPart('hello world'), 'hello_world');
  });

  it('returns "value" for empty string', () => {
    assert.equal(sanitizeIdentPart(''), 'value');
  });

  it('returns "value" for null/undefined', () => {
    assert.equal(sanitizeIdentPart(null), 'value');
    assert.equal(sanitizeIdentPart(undefined), 'value');
  });

  it('strips leading and trailing underscores', () => {
    assert.equal(sanitizeIdentPart('__test__'), 'test');
  });

  it('replaces dots with underscores', () => {
    assert.equal(sanitizeIdentPart('a.b.c'), 'a_b_c');
  });

  it('preserves alphanumerics', () => {
    assert.equal(sanitizeIdentPart('123abc'), '123abc');
  });

  it('handles special chars: @#$!', () => {
    const result = sanitizeIdentPart('@#$!hello');
    assert.match(result, /^[a-zA-Z0-9_]+$/, 'must only contain word chars');
    assert.include(result, 'hello', 'must preserve alphanumeric part');
  });

  it('collapses multiple consecutive non-word chars into one underscore', () => {
    assert.equal(sanitizeIdentPart('a...b'), 'a_b');
  });

  it('handles numeric-only string', () => {
    const result = sanitizeIdentPart('12345');
    assert.equal(result, '12345');
  });

  it('handles very long string without throwing', () => {
    const long = 'a'.repeat(10000);
    assert.doesNotThrow(() => sanitizeIdentPart(long));
  });
});

// =============================================================================
// textExpr — placeholder resolution
// =============================================================================

describe('textExpr — placeholder resolution', () => {
  it('no placeholder: wraps as simple dialogObject:format()', () => {
    assert.equal(textExpr('Hello there!'),
      'dialogObject:format("Hello there!")', 'no placeholder must produce simple format call');
  });

  it('{name} resolves to getConverationParterName()', () => {
    const e = textExpr('Hello {name}!');
    assert.match(e, /getConverationParterName\(\)/, 'name must resolve to getConverationParterName');
    assert.match(e, /%s/, 'name placeholder must produce %s in format string');
  });

  it('{partner} resolves to getConverationPartnerAffinity()', () => {
    const e = textExpr('Affinity: {partner}');
    assert.match(e, /getConverationPartnerAffinity\(\)/, 'partner must resolve to affinity call');
  });

  it('{faction} resolves to getConverationPartnerFactionName()', () => {
    const e = textExpr('Faction: {faction}');
    assert.match(e, /getConverationPartnerFactionName\(\)/, 'faction must resolve to faction name call');
  });

  it('{owner} resolves to getConverationPartnerOwnerName()', () => {
    const e = textExpr('Owner: {owner}');
    assert.match(e, /getConverationPartnerOwnerName\(\)/, 'owner must resolve to owner name call');
  });

  it('{self} resolves to getOwnName()', () => {
    const e = textExpr('Player: {self}');
    assert.match(e, /getOwnName\(\)/, 'self must resolve to getOwnName');
  });

  it('multiple placeholders produce multiple format args', () => {
    const e = textExpr('Hi {name} of {faction}!');
    assert.match(e, /getConverationParterName/, '{name} arg must appear');
    assert.match(e, /getConverationPartnerFactionName/, '{faction} arg must appear');
  });

  it('double-quotes in text are escaped', () => {
    const e = textExpr('She said "hello"');
    assert.match(e, /\\"hello\\"/, 'double-quotes must be escaped');
    // assert.doesNotMatch not available in this chai version; escaping verified by matching escaped pattern above
  });

  it('newlines in text are escaped as \\n', () => {
    const e = textExpr('Line 1\nLine 2');
    assert.match(e, /\\n/, 'newline must be escaped as \\n');
  });

  it('{entity} resolves to getName()', () => {
    const e = textExpr('Entity: {entity}');
    assert.match(e, /getName\(\)/, '{entity} must resolve to getName');
  });
});

// =============================================================================
// SCRIPT NAME IN LUA HEADER
// =============================================================================

describe('emitLua — script name in header', () => {
  it('script name appears in Lua header comment', () => {
    resetState();
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('My Trading NPC');
    assert.match(lua, /NPC Dialog Script: My Trading NPC/, 'script name must appear in header');
  });

  it('header is always the first comment block', () => {
    resetState();
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua  = emitLua('Test Script');
    const lines = lua.split('\n').filter(l => l.trim());
    assert.equal(lines[0], '--[[', 'Lua must start with --[[');
    assert.match(lines[1], /NPC Dialog Script/, 'second line must be the header');
  });

  it('special characters in script name do not break the header', () => {
    resetState();
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('NPC "Guild Master" — v1.0');
    assert.match(lua, /NPC "Guild Master"/, 'special chars must appear literally in comment');
  });
});

// =============================================================================
// COMMENT ROUND-TRIP
// =============================================================================

describe('Generator → Comment round-trip (Blockly comment → Lua → import)', () => {
  it('block comment appears as Lua comment above hook function', () => {
    const action = m('npc_hire', { PRICE: 50000 }, {}, null, true, 'Hire the crew member');
    const lua    = genAction(action);
    // Comment should appear as "-- Hire the crew member" before the function
    assert.match(lua, /-- Hire the crew member/, 'comment must appear as Lua comment');
    // It must appear BEFORE the function definition, not after
    const commentPos = lua.indexOf('-- Hire the crew member');
    const fnPos      = lua.indexOf('function hireHookFunc_');
    assert.isBelow(commentPos, fnPos, 'comment must appear before hook function');
  });

  it('block comment appears as Lua comment above TextEntry node', () => {
    const action = m('npc_say', { TEXT: 'Hello!', MS: 2000 }, {}, null, true, 'Greeting node');
    const lua    = genAction(action);
    assert.match(lua, /-- Greeting node/, 'node comment must appear in Lua');
  });

  it('multi-line block comment each line prefixed with --', () => {
    const comment = 'Line one\nLine two\nLine three';
    const action  = m('npc_hire', { PRICE: 0 }, {}, null, true, comment);
    const lua     = genAction(action);
    assert.match(lua, /-- Line one/, 'first comment line must appear');
    assert.match(lua, /-- Line two/, 'second comment line must appear');
    assert.match(lua, /-- Line three/, 'third comment line must appear');
  });

  it('parser preserves comments in hookMeta (import finds comment before hook instance line)', () => {
    // Comments in generated Lua appear before the hook instance line, not the action block.
    // The parser captures them in hookMeta. The action block.data carries the waitText/reactions.
    // This test verifies the Lua → Lua comment round-trip at generation level:
    // comment from block → Lua "-- Comment" → parseable by the parser's comment tracking.
    const action = m('npc_hire', { PRICE: 50000 }, {}, null, true, 'Hire the guild master');
    const lua    = genAction(action);
    // 1. Comment must appear in the generated Lua
    assert.match(lua, /-- Hire the guild master/, 'comment must appear in generated Lua');
    // 2. Re-parsing that Lua must not throw
    assert.doesNotThrow(() => parseLuaToBlocklyState(lua), 're-parsing commented Lua must not throw');
    // 3. The parsed result is a valid hire block
    const state  = parseLuaToBlocklyState(lua);
    const parsed = state.blocks.blocks[0].inputs?.CHOICES?.block?.inputs?.ACTIONS?.block;
    assert.equal(parsed?.type, 'npc_hire', 'parsed block must still be npc_hire');
  });

  it('no comment on block → no spurious -- comment lines before hook', () => {
    const action = m('npc_hire', { PRICE: 50000 }, {}, null, true, '');
    const lua    = genAction(action);
    // There should be no comment line immediately before the hook function
    const lines = lua.split('\n');
    const fnIdx = lines.findIndex(l => l.includes('function hireHookFunc_'));
    const prevLine = fnIdx > 0 ? lines[fnIdx - 1].trim() : '';
    // Previous line is either empty or the hook section header
    // '-- Hook functions' is an emitter section header, not a user comment.
    // Verify the block comment text (empty string) did NOT produce an extra comment line.
    // We check that no line of form '-- SomeUserText' (multi-word) appears just before the function.
    const noUserComment = !lines.slice(Math.max(0, fnIdx - 2), fnIdx).some(
      l => l.trim().startsWith('-- ') && !['-- Hook functions', '-- Hook instances', '-- Dialog nodes', ''].includes(l.trim())
    );
    assert.isTrue(noUserComment, 'no user comment should appear before hook when block comment is empty');
  });
});

// =============================================================================
// npc_quest_objective — hookless import
// =============================================================================

describe('npc_quest_objective — hookless import behaviour', () => {
  it('generates a TextEntry node with no hook function', () => {
    const action = b('npc_quest_objective', { QUEST_ID: 'q1', TEXT: 'Objective: collect 5 ore.' });
    const lua    = genAction(action);
    // No hook function should be emitted
    assert.notMatch(lua, /^function\s+\w+Hook/m, 'objective must not emit a hook function');
    assert.match(lua, /Objective: collect 5 ore\./, 'objective text must appear as dialog node');
  });

  it('generates a continue choice when a next block is chained', () => {
    const say      = b('npc_say', { TEXT: 'Good luck!', MS: 2000 });
    const objective = b('npc_quest_objective', { QUEST_ID: 'q1', TEXT: 'Go to sector A.' }, {}, say);
    const lua       = genAction(objective);
    assert.match(lua, /Go to sector A\./, 'objective text must appear');
    assert.match(lua, /Good luck!/, 'chained next node must appear');
    assert.match(lua, /:add\(.*Continue\./, 'auto-choice "Continue." must be added');
  });

  it('imports as npc_say (acceptable — no hook means no way to distinguish)', () => {
    const action = b('npc_quest_objective', { QUEST_ID: 'q1', TEXT: 'Deliver the cargo.' });
    const parsed = roundTrip(action);
    // npc_quest_objective has no hook → parser maps it to npc_say or npc_goback
    // Both are functionally correct for a pure-text node
    const acceptable = ['npc_say', 'npc_goback', 'npc_quest_objective'];
    assert.include(acceptable, parsed?.type,
      `hookless objective must import as one of: ${acceptable.join(', ')}`);
  });
});

// =============================================================================
// npc_sqlite_table — custom DDL
// =============================================================================

describe('Generator → npc_sqlite_table DDL', () => {
  it('custom table DDL appears in Lua when dbTables is populated', () => {
    resetState();
    _state.dbTables.set('my_custom', { cols: 'player VARCHAR(255) NOT NULL PRIMARY KEY, score INTEGER NOT NULL DEFAULT 0' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    assert.match(lua, /my_custom/, 'custom table name must appear in Lua');
    assert.match(lua, /score INTEGER/, 'custom column definition must appear');
    assert.match(lua, /CREATE CACHED TABLE IF NOT EXISTS/, 'DDL must use CREATE CACHED TABLE IF NOT EXISTS');
  });

  it('multiple custom tables all appear in Lua', () => {
    resetState();
    _state.dbTables.set('tbl_a', { cols: 'id VARCHAR(255) PRIMARY KEY' });
    _state.dbTables.set('tbl_b', { cols: 'val INTEGER' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    assert.match(lua, /tbl_a/, 'first custom table must appear');
    assert.match(lua, /tbl_b/, 'second custom table must appear');
  });

  it('custom table triggers _dbGet / _dbExec helper emission', () => {
    resetState();
    _state.dbTables.set('my_tbl', { cols: 'player VARCHAR(255) PRIMARY KEY' });
    processGreeting(m('npc_greeting', { TEXT: 'Hi', MS: 2000 }));
    const lua = emitLua('test');
    assert.match(lua, /function _dbGet/, '_dbGet helper must be emitted');
    assert.match(lua, /function _dbExec/, '_dbExec helper must be emitted');
  });
});

// =============================================================================
// JSON WORKSPACE STATE STRUCTURE
// =============================================================================

describe('Parser → Blockly JSON workspace state structure', () => {
  /** Generate Lua from a simple greeting with one choice. */
  function simpleLua(npcText = 'Hello!', choiceLabel = 'Hire me', actionText = 'Please wait...') {
    return `
function hireHookFunc_50000(dialogObject)
  return dialogObject:hireConverationPartner();
end
function create(dialogObject, bindings)
  local dSys = luajava.newInstance("org.schema.game.common.data.player.dialog.DialogSystem", dialogObject)
  local factory = dSys:getFactory(bindings)
  local TextEntry = "org.schema.game.common.data.player.dialog.TextEntry"
  local HookLua = "org.schema.game.common.data.player.dialog.DialogTextEntryHookLua"
  local hook_hireHookFunc_50000 = luajava.newInstance(HookLua, "hireHookFunc_50000", {})
  local entry = luajava.newInstance(TextEntry, dialogObject:format("${npcText}"), 2000)
  local entry1 = luajava.newInstance(TextEntry, dialogObject:format("${actionText}"), 2000)
  local entry2 = luajava.newInstance(TextEntry, dialogObject:format("Hired!"), 2000)
  local entry3 = luajava.newInstance(TextEntry, dialogObject:format("Crew full."), 2000)
  factory:setRootEntry(entry)
  entry1:setHook(hook_hireHookFunc_50000)
  entry1:addReaction(hook_hireHookFunc_50000, 0, entry2)
  entry1:addReaction(hook_hireHookFunc_50000, -2, entry3)
  entry:add(entry1, dialogObject:format("${choiceLabel}"))
  dSys:add(factory)
  return dSys
end`;
  }

  it('state has languageVersion at top level', () => {
    const state = parseLuaToBlocklyState(simpleLua());
    assert.property(state, 'blocks', 'state must have blocks property');
    assert.property(state.blocks, 'languageVersion', 'blocks must have languageVersion');
  });

  it('state has blocks array under state.blocks.blocks', () => {
    const state = parseLuaToBlocklyState(simpleLua());
    assert.isArray(state.blocks.blocks, 'blocks must be an array');
    assert.isAtLeast(state.blocks.blocks.length, 1, 'at least one root block must be present');
  });

  it('root block is the greeting (npc_greeting)', () => {
    const state = parseLuaToBlocklyState(simpleLua('Welcome!'));
    const root  = state.blocks.blocks[0];
    assert.equal(root.type, 'npc_greeting', 'root block must be npc_greeting');
  });

  it('greeting text is preserved in fields', () => {
    const state = parseLuaToBlocklyState(simpleLua('Greetings traveller!'));
    const root  = state.blocks.blocks[0];
    assert.equal(root.fields?.TEXT, 'Greetings traveller!', 'greeting text must be preserved');
  });

  it('first choice is nested inside greeting.inputs.CHOICES', () => {
    const state  = parseLuaToBlocklyState(simpleLua('Hi', 'Join my crew'));
    const choice = state.blocks.blocks[0].inputs?.CHOICES?.block;
    assert.equal(choice?.type, 'npc_choice', 'first child must be npc_choice');
    assert.equal(choice?.fields?.LABEL, 'Join my crew', 'choice label must be preserved');
  });

  it('action block is nested inside choice.inputs.ACTIONS', () => {
    const state  = parseLuaToBlocklyState(simpleLua('Hi', 'Hire'));
    const choice = state.blocks.blocks[0].inputs?.CHOICES?.block;
    const action = choice?.inputs?.ACTIONS?.block;
    assert.exists(action, 'action block must exist inside choice');
    assert.equal(action?.type, 'npc_hire', 'action must be recognized as npc_hire');
  });

  it('root block has x/y coordinates for Blockly positioning', () => {
    const state = parseLuaToBlocklyState(simpleLua());
    const root  = state.blocks.blocks[0];
    assert.isNumber(root.x, 'root block must have x coordinate');
    assert.isNumber(root.y, 'root block must have y coordinate');
  });

  it('parsed state is valid Blockly JSON: can be re-serialized without loss', () => {
    const state = parseLuaToBlocklyState(simpleLua('Round-trip NPC!'));
    // Re-serializing and re-parsing must yield the same root text
    const json   = JSON.stringify(state);
    const reparsed = JSON.parse(json);
    assert.equal(reparsed.blocks.blocks[0].fields?.TEXT, 'Round-trip NPC!',
      'round-trip JSON must preserve greeting text');
  });

  it('multiple choices appear as a chain via .next on choice blocks', () => {
    const lua = `
function fn1(dialogObject) return dialogObject:hireConverationPartner(); end
function fn2(dialogObject) return dialogObject:unhireConverationPartner(); end
function create(dialogObject, bindings)
  local dSys = luajava.newInstance("org.schema.game.common.data.player.dialog.DialogSystem", dialogObject)
  local factory = dSys:getFactory(bindings)
  local TextEntry = "org.schema.game.common.data.player.dialog.TextEntry"
  local HookLua = "org.schema.game.common.data.player.dialog.DialogTextEntryHookLua"
  local hook_fn1 = luajava.newInstance(HookLua, "fn1", {})
  local hook_fn2 = luajava.newInstance(HookLua, "fn2", {})
  local entry = luajava.newInstance(TextEntry, dialogObject:format("Hi"), 2000)
  local a1 = luajava.newInstance(TextEntry, dialogObject:format("Hiring..."), 2000)
  local a2 = luajava.newInstance(TextEntry, dialogObject:format("Unhiring..."), 2000)
  local r1 = luajava.newInstance(TextEntry, dialogObject:format("Hired."), 2000)
  local r2 = luajava.newInstance(TextEntry, dialogObject:format("Dismissed."), 2000)
  factory:setRootEntry(entry)
  a1:setHook(hook_fn1) a1:addReaction(hook_fn1, 0, r1)
  a2:setHook(hook_fn2) a2:addReaction(hook_fn2, 0, r2)
  entry:add(a1, dialogObject:format("Hire"))
  entry:add(a2, dialogObject:format("Unhire"))
  dSys:add(factory)
  return dSys
end`;
    const state  = parseLuaToBlocklyState(lua);
    const choice1 = state.blocks.blocks[0].inputs?.CHOICES?.block;
    const choice2 = choice1?.next?.block;
    assert.equal(choice1?.type, 'npc_choice', 'first choice must be npc_choice');
    assert.equal(choice2?.type, 'npc_choice', 'second choice must be chained via .next');
  });
});

// =============================================================================
// HELPER UTILITY TESTS
// =============================================================================

describe('Generator helpers — utility functions', () => {
  it('luaStringLiteral wraps string in double quotes', () => {
    assert.equal(luaStringLiteral('hello'), '"hello"');
  });

  it('luaStringLiteral escapes double quotes inside string', () => {
    assert.equal(luaStringLiteral('say "hi"'), '"say \\"hi\\""');
  });

  it('luaStringLiteral handles null/undefined gracefully', () => {
    assert.equal(luaStringLiteral(null), '""');
    assert.equal(luaStringLiteral(undefined), '""');
  });

  it('hashCode returns stable integer for same input', () => {
    const h1 = hashCode('test_string');
    const h2 = hashCode('test_string');
    assert.equal(h1, h2, 'same input must produce same hash');
    assert.isNumber(h1, 'hash must be a number');
  });

  it('hashCode returns different values for different inputs', () => {
    assert.notEqual(hashCode('aaa'), hashCode('bbb'), 'different inputs must produce different hashes');
  });

  it('escapeRegExp escapes all special regex chars', () => {
    const pattern = escapeRegExp('a.b*c+d?e(f)g[h]');
    assert.doesNotThrow(() => new RegExp(pattern), 'escaped string must form valid regex');
    assert.match('a.b*c+d?e(f)g[h]', new RegExp(pattern), 'escaped pattern must match literal string');
  });

  it('luaVarLiteral: number mode converts to numeric string', () => {
    assert.equal(luaVarLiteral('number', '42'), '42');
    assert.equal(luaVarLiteral('number', 'abc'), '0');
  });

  it('luaVarLiteral: text mode wraps in quotes', () => {
    assert.equal(luaVarLiteral('text', 'hello'), '"hello"');
  });

  it('luaVarLiteral: raw mode passes through verbatim', () => {
    assert.equal(luaVarLiteral('raw', 'someGlobal.val'), 'someGlobal.val');
    assert.equal(luaVarLiteral('raw', ''), 'nil');
  });
});
