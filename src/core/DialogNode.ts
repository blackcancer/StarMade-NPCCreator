/**
 * @fileoverview Dialog Node
 *
 * Represents a single TextEntry node in the NPC dialog tree.
 * A node has a text message, optional hook, reactions, and child choices.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { HookDefinition } from './Hook.js';

/** A named reaction: hook result code → destination node */
export interface Reaction {
  code: number;
  target: DialogNode;
}

/**
 * A single node in the dialog state machine.
 *
 * Corresponds to Java `TextEntry` + its `add()` and `addReaction()` calls.
 */
export class DialogNode {
  /** Variable name used in generated Lua code (e.g. `entry`, `entry1`, `entryCrewSuccess`). */
  readonly varName: string;

  /** Text displayed to the player. Supports {name}, {faction}, {owner} placeholders. */
  readonly text: string;

  /** Display duration in milliseconds (default 2000). */
  readonly displayMs: number;

  /** Optional hook attached to this node (called when the node is entered). */
  hook: HookDefinition | null = null;

  /** Reactions: hook result code → next node. */
  readonly reactions: Reaction[] = [];

  /**
   * Choices presented to the player.
   * Each entry is { label, target } — corresponds to entry:add(target, label).
   */
  readonly choices: Array<{ label: string; target: DialogNode }> = [];

  /** Optional entryMarking for setConversationState() jumps. */
  marking: string | null = null;

  constructor(varName: string, text: string, displayMs = 2000) {
    this.varName = varName;
    this.text = text;
    this.displayMs = displayMs;
  }

  /** Add a player-visible choice that transitions to `target`. */
  addChoice(label: string, target: DialogNode): this {
    this.choices.push({ label, target });
    return this;
  }

  /** Add a hook reaction: when the hook returns `code`, go to `target`. */
  addReaction(code: number, target: DialogNode): this {
    this.reactions.push({ code, target });
    return this;
  }

  /** Attach a hook to this node. */
  setHook(hook: HookDefinition): this {
    this.hook = hook;
    return this;
  }

  /** Mark this node with a name for setConversationState() jumps. */
  setMarking(name: string): this {
    this.marking = name;
    return this;
  }
}
