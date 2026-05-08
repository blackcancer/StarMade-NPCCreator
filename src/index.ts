/**
 * @fileoverview StarMade-NPCCreator Public API
 *
 * Fluent TypeScript API for generating StarMade NPC Lua dialog scripts.
 * Covers all dialogObject methods exposed by the Java AICreatureDialogAI class,
 * supports SQLite persistent state, and emits production-ready .lua files.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

// Core
export type { DialogObject } from './core/DialogObject.js';
export { JAVA_CLASSES, HOOK_RESULT } from './core/DialogObject.js';

export { DialogNode } from './core/DialogNode.js';
export type { Reaction } from './core/DialogNode.js';

export type { HookDefinition } from './core/Hook.js';
export { Hooks } from './core/Hook.js';

export { ScriptDefinition } from './core/ScriptDefinition.js';
export type { ScriptOptions } from './core/ScriptDefinition.js';

export { DialogBuilder, NodeBuilder } from './core/DialogBuilder.js';

// Emitter
export { LuaEmitter } from './emitter/LuaEmitter.js';

// SQLite state
export { SqliteState } from './db/SqliteState.js';
export type { TableSchema, SqliteStateOptions } from './db/SqliteState.js';
