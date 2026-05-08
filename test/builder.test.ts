/**
 * @fileoverview Dialog Builder Tests
 *
 * Tests for the fluent DialogBuilder API, LuaEmitter, Hooks, and SqliteState.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { assert } from 'chai';
import { DialogBuilder, LuaEmitter, Hooks, SqliteState, HOOK_RESULT, JAVA_CLASSES } from '../src/index.js';

// ── DialogBuilder ─────────────────────────────────────────────────────────────

describe('DialogBuilder — basic', () => {

  it('build() throws without greeting()', () => {
    assert.throws(() => new DialogBuilder({ name: 'x' }).build(), /greeting/);
  });

  it('produces a root node from greeting()', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .build();
    assert.isNotNull(script.root);
    assert.equal(script.root!.text, 'Hello!');
    assert.equal(script.root!.varName, 'entry');
  });

  it('addChoice adds children to root', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Option A', () => {})
      .addChoice('Option B', () => {})
      .build();
    assert.equal(script.root!.choices.length, 2);
    assert.equal(script.root!.choices[0].label, 'Option A');
    assert.equal(script.root!.choices[1].label, 'Option B');
  });

  it('hire() attaches a hook with 4 reactions', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Hire me', b => b.hire(50_000))
      .build();

    const hireNode = script.root!.choices[0].target;
    assert.isNotNull(hireNode.hook);
    assert.include(hireNode.hook!.funcName, 'hireHookFunc');
    assert.equal(hireNode.reactions.length, 4);
    assert.equal(hireNode.reactions[0].code, HOOK_RESULT.SUCCESS);
    assert.equal(hireNode.reactions[1].code, HOOK_RESULT.NOT_ENOUGH_CREDITS);
    assert.equal(hireNode.reactions[2].code, HOOK_RESULT.INVENTORY_FULL);
    assert.equal(hireNode.reactions[3].code, HOOK_RESULT.REFUSED);
  });

  it('sell() attaches a hook with 3 reactions', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Buy laser', b => b.sell('laser', 100_000))
      .build();

    const sellNode = script.root!.choices[0].target;
    assert.isNotNull(sellNode.hook);
    assert.include(sellNode.hook!.funcName, 'giveLaserHookFunc');
    assert.equal(sellNode.reactions.length, 3);
    assert.equal(sellNode.reactions[0].code, HOOK_RESULT.SUCCESS);
    assert.equal(sellNode.reactions[1].code, HOOK_RESULT.NOT_ENOUGH_CREDITS);
    assert.equal(sellNode.reactions[2].code, HOOK_RESULT.INVENTORY_FULL);
  });

  it('registerHook deduplicates hooks', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Buy laser', b => b.sell('laser', 100_000))
      .addChoice('Buy laser again', b => b.sell('laser', 100_000))
      .build();

    // Same price → same funcName → deduplicated
    const laserHooks = [...script.hooks.values()].filter(h => h.funcName.includes('giveLaser'));
    assert.equal(laserHooks.length, 1);
  });
});

// ── LuaEmitter ───────────────────────────────────────────────────────────────

describe('LuaEmitter — output', () => {

  it('emits valid Lua with create() function', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, 'function create(dialogObject, bindings)');
    assert.include(lua, 'end');
  });

  it('emits root entry and factory:setRootEntry', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello {name}!')
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, 'factory:setRootEntry(entry)');
    assert.include(lua, 'getConverationParterName()');
  });

  it('emits hook functions before create()', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Hire me', b => b.hire(50_000))
      .build();
    const lua = LuaEmitter.emit(script);

    const hirePos   = lua.indexOf('function hireHookFunc');
    const createPos = lua.indexOf('function create(');
    assert.isAbove(hirePos, 0, 'hireHookFunc function should exist');
    assert.isBelow(hirePos, createPos, 'hook function should come before create()');
  });

  it('emits entry:add() choices', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Option A', () => {})
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, ':add(');
    assert.include(lua, 'Option A');
  });

  it('emits entry:addReaction() calls', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Hire me', b => b.hire(50_000))
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, ':addReaction(');
    assert.include(lua, ', 0,');   // SUCCESS
    assert.include(lua, ', -1,');  // NOT_ENOUGH_CREDITS
  });

  it('emits hook:setHook() call for hooked nodes', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .addChoice('Hire me', b => b.hire(50_000))
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, ':setHook(');
  });

  it('emits dSys:add(factory) and return dSys', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, 'dSys:add(factory)');
    assert.include(lua, 'return dSys');
  });

  it('emits all Java class references', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, JAVA_CLASSES.DialogSystem);
    assert.include(lua, JAVA_CLASSES.TextEntry);
  });

  it('toLua() is alias for emit()', () => {
    const script = new DialogBuilder({ name: 'test' })
      .greeting('Hello!')
      .build();
    assert.equal(LuaEmitter.toLua(script), LuaEmitter.emit(script));
  });

  it('emits throws without root node', () => {
    const def = new (class { root = null; hooks = new Map(); preamble = []; db = null; name = 'x'; description = ''; })();
    assert.throws(() => LuaEmitter.emit(def as any), /root node/);
  });
});

// ── Hooks ─────────────────────────────────────────────────────────────────────

describe('Hooks — built-in factory', () => {
  it('hire hook has correct body', () => {
    const h = Hooks.hire();
    assert.include(h.body[0], 'hireConverationPartner');
    assert.equal(h.funcName, 'hireHookFunc');
  });

  it('sell hooks have correct body for each item', () => {
    const items = [
      { fn: () => Hooks.giveLaser(100), check: 'giveLaserWeapon' },
      { fn: () => Hooks.giveHelmet(50), check: 'giveHelmet' },
      { fn: () => Hooks.giveGrappleBeam(100), check: 'giveGrappleBeam' },
      { fn: () => Hooks.giveHealingBeam(100), check: 'giveHealingBeam' },
      { fn: () => Hooks.giveTorchBeam(100), check: 'giveTorchBeam' },
      { fn: () => Hooks.giveFlashLight(100), check: 'giveFlashLight' },
    ] as const;

    for (const { fn, check } of items) {
      const h = fn();
      assert.include(h.body[0], check, `expected body to contain ${check}`);
    }
  });

  it('moveTo hook includes coordinates', () => {
    const h = Hooks.moveTo(10, 20, 30);
    assert.include(h.body[0], '10');
    assert.include(h.body[0], '20');
    assert.include(h.body[0], '30');
    assert.include(h.body[0], 'moveTo');
  });

  it('activateBlock hook includes state', () => {
    const h = Hooks.activateBlock(1, 2, 3, true);
    assert.include(h.body[0], 'activateBlock');
    assert.include(h.body[0], 'true');
  });

  it('custom hook preserves body lines', () => {
    const h = Hooks.custom('myHook', ['local x = 1', 'return x']);
    assert.equal(h.funcName, 'myHook');
    assert.equal(h.body.length, 2);
    assert.equal(h.body[0], 'local x = 1');
  });

  it('callTutorial hook references tutorial name', () => {
    const h = Hooks.callTutorial('intro');
    assert.include(h.body[0], '"intro"');
    assert.include(h.body[0], 'callTutorial');
  });

  it('setConversationState hook references state name', () => {
    const h = Hooks.setConversationState('quest_accepted');
    assert.include(h.body[0], '"quest_accepted"');
    assert.include(h.body[0], 'setConversationState');
  });
});

// ── SqliteState ───────────────────────────────────────────────────────────────

describe('SqliteState — Lua code generation', () => {
  const db = new SqliteState({ dbPath: '/tmp/test.db' });
  db.defineTable('quests', { player: 'TEXT PRIMARY KEY', done: 'INTEGER DEFAULT 0' });

  it('emitInit() generates CREATE TABLE IF NOT EXISTS', () => {
    const init = db.emitInit();
    assert.include(init, 'CREATE TABLE IF NOT EXISTS quests');
    assert.include(init, 'player TEXT PRIMARY KEY');
    assert.include(init, 'done INTEGER DEFAULT 0');
  });

  it('emitInit() generates helper functions', () => {
    const init = db.emitInit();
    assert.include(init, 'function _dbGet(');
    assert.include(init, 'function _dbExec(');
    assert.include(init, 'function _dbUpsert(');
    assert.include(init, 'function _dbIncrement(');
  });

  it('emitInit() opens the JDBC connection', () => {
    const init = db.emitInit();
    assert.include(init, 'jdbc:sqlite:/tmp/test.db');
    assert.include(init, 'DriverManager');
  });

  it('exprGet() returns a _dbGet call', () => {
    const expr = db.exprGet('quests', 'done', 'dialogObject:getOwnName()', '"0"');
    assert.include(expr, '_dbGet');
    assert.include(expr, '"SELECT done FROM quests WHERE player = ?"');
    assert.include(expr, 'getOwnName()');
    assert.include(expr, '"0"');
  });

  it('linesSet() returns _dbUpsert call', () => {
    const lines = db.linesSet('quests', 'done', '"1"', 'dialogObject:getOwnName()');
    assert.equal(lines.length, 1);
    assert.include(lines[0], '_dbUpsert');
    assert.include(lines[0], '"quests"');
    assert.include(lines[0], '"done"');
  });

  it('linesIncrement() returns _dbIncrement call', () => {
    const lines = db.linesIncrement('visits', 'count', 'dialogObject:getOwnName()', 2);
    assert.equal(lines.length, 1);
    assert.include(lines[0], '_dbIncrement');
    assert.include(lines[0], '"visits"');
    assert.include(lines[0], '"count"');
    assert.include(lines[0], '2');
  });

  it('bodyCheckAndSet() produces expected lines', () => {
    const lines = db.bodyCheckAndSet('quests', 'done', '1', 'dialogObject:getOwnName()');
    const joined = lines.join('\n');
    assert.include(joined, '_dbGet');
    assert.include(joined, '_dbUpsert');
    assert.include(joined, 'return 0');
    assert.isAbove(lines.length, 3);
  });

  it('ScriptDefinition with db emits init block in LuaEmitter', () => {
    const script = new DialogBuilder({ name: 'db-test', db })
      .greeting('Hello!')
      .build();
    const lua = LuaEmitter.emit(script);
    assert.include(lua, 'SQLite persistent state');
    assert.include(lua, 'CREATE TABLE IF NOT EXISTS quests');
    // Init block must come before create()
    const initPos   = lua.indexOf('SQLite persistent state');
    const createPos = lua.indexOf('function create(');
    assert.isBelow(initPos, createPos);
  });
});

// ── Full round-trip ───────────────────────────────────────────────────────────

describe('Full round-trip — merchant script', () => {
  it('generates a compilable merchant Lua script', () => {
    const script = new DialogBuilder({ name: 'merchant' })
      .greeting('Greetings {name}, I\'m {partner} of {faction}.')
      .addChoice('Hire me', b => b.hire(50_000))
      .addChoice('Buy laser', b => b.sell('laser', 100_000))
      .addChoice('Buy helmet', b => b.sell('helmet', 50_000))
      .addChoice('Goodbye.')
      .build();

    const lua = LuaEmitter.emit(script);

    // Structure checks
    assert.include(lua, 'function create(dialogObject, bindings)');
    assert.include(lua, 'factory:setRootEntry(entry)');
    assert.include(lua, 'dSys:add(factory)');
    assert.include(lua, 'return dSys');

    // Hook functions
    assert.include(lua, 'function hireHookFunc');
    assert.include(lua, 'function giveLaserHookFunc');
    assert.include(lua, 'function giveHelmetHookFunc');

    // Java classes
    assert.include(lua, 'org.schema.game.common.data.player.dialog.DialogSystem');
    assert.include(lua, 'org.schema.game.common.data.player.dialog.TextEntry');
    assert.include(lua, 'org.schema.game.common.data.player.dialog.DialogTextEntryHookLua');

    // Choices
    assert.include(lua, 'Hire me');
    assert.include(lua, 'Buy laser');
    assert.include(lua, 'Goodbye');

    // Placeholder resolution
    assert.include(lua, 'getConverationParterName()');
    assert.include(lua, 'getConverationPartnerFactionName()');
    assert.include(lua, 'getConverationPartnerAffinity()');

    console.log('    Generated script length:', lua.length, 'chars');
    console.log('    Line count:', lua.split('\n').length);
  });
});
