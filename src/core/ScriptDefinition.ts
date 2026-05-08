/**
 * @fileoverview Script Definition
 *
 * Top-level container for an NPC Lua script.
 * Holds the root dialog node, all hook definitions, optional SQLite state,
 * and optional arbitrary Lua preamble.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { DialogNode } from './DialogNode.js';
import { HookDefinition } from './Hook.js';
import { SqliteState } from '../db/SqliteState.js';

export interface ScriptOptions {
  /**
   * The script name (used as file name without extension).
   * Must match the name in npcConfig.xml.
   */
  name: string;

  /** Optional description / JSDoc for the generated file. */
  description?: string;

  /** Optional SQLite state module. If provided, generates the DB init block. */
  db?: SqliteState;

  /**
   * Optional Lua lines added at the top of the file (after DB init),
   * before any hook functions. Useful for global constants and utilities.
   */
  preamble?: string[];
}

/**
 * A complete NPC Lua script definition.
 *
 * Use DialogBuilder to construct one, then call toLua() to emit the script.
 */
export class ScriptDefinition {
  readonly name: string;
  readonly description: string;
  readonly db: SqliteState | null;
  readonly preamble: string[];

  /** Root dialog node. */
  root: DialogNode | null = null;

  /** All hook definitions collected during build. */
  readonly hooks = new Map<string, HookDefinition>();

  constructor(options: ScriptOptions) {
    this.name = options.name;
    this.description = options.description ?? `NPC dialog script: ${options.name}`;
    this.db = options.db ?? null;
    this.preamble = options.preamble ?? [];
  }

  /**
   * Register a hook definition (deduplicates by funcName).
   * Returns the hook for chaining.
   */
  registerHook(hook: HookDefinition): HookDefinition {
    if (!this.hooks.has(hook.funcName)) {
      this.hooks.set(hook.funcName, hook);
    }
    return hook;
  }
}
