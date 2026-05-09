/**
 * @fileoverview Dialog Builder
 *
 * Fluent API for constructing StarMade NPC dialog trees.
 * Produces a ScriptDefinition ready for Lua emission.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { DialogNode } from './DialogNode.js';
import { HookDefinition, Hooks } from './Hook.js';
import { ScriptDefinition, ScriptOptions } from './ScriptDefinition.js';
import { HOOK_RESULT, MetaObjectType } from './DialogObject.js';

/** Counter for unique variable names. */
let _nodeCounter = 0;
function nextVar(prefix = 'entry'): string {
  return `${prefix}${++_nodeCounter}`;
}
function resetCounter(): void { _nodeCounter = 0; }

// ── Standard reaction nodes (shared) ─────────────────────────────────────────

/** Creates the standard "not enough credits" failure node. */
function makeFailed(script: ScriptDefinition): DialogNode {
  return new DialogNode(nextVar('entryFailed'), 'You don\'t have enough money!');
}

/** Creates the standard "inventory full" failure node. */
function makeFailed2(script: ScriptDefinition): DialogNode {
  return new DialogNode(nextVar('entryFailed2'), 'Sorry, your inventory is full!');
}

/** Creates the standard "NPC refuses" failure node. */
function makeFailed3(script: ScriptDefinition): DialogNode {
  return new DialogNode(nextVar('entryFailed3'), 'I\'m not doing that.');
}

/** Creates the standard "success" confirmation node. */
function makeSuccess(script: ScriptDefinition, text = 'Here you go!'): DialogNode {
  return new DialogNode(nextVar('entrySuccess'), text);
}

// ── NodeBuilder ───────────────────────────────────────────────────────────────

/**
 * Fluent builder for a single dialog node.
 *
 * Returned by DialogBuilder.addChoice() and DialogBuilder.greeting().
 */
export class NodeBuilder {
  private readonly _node: DialogNode;
  private readonly _script: ScriptDefinition;
  private readonly _parent: DialogBuilder | NodeBuilder | null;

  constructor(
    script: ScriptDefinition,
    varName: string,
    text: string,
    displayMs = 2000,
    parent: DialogBuilder | NodeBuilder | null = null,
  ) {
    this._script = script;
    this._node   = new DialogNode(varName, text, displayMs);
    this._parent = parent;
  }

  get node(): DialogNode { return this._node; }

  /**
   * Add a player-visible choice.
   * @param label  Button label shown to the player
   * @param build  Builder callback that configures the target node
   */
  addChoice(label: string, build: (b: NodeBuilder) => void): this {
    const child = new NodeBuilder(this._script, nextVar(), label, 2000, this);
    build(child);
    this._node.addChoice(label, child.node);
    return this;
  }

  /**
   * Add a "go back" choice that returns to this node's parent.
   * Only works when the parent is a NodeBuilder with a resolved node.
   */
  goBack(label = 'Actually, never mind.'): this {
    if (this._parent instanceof NodeBuilder) {
      this._node.addChoice(label, this._parent.node);
    }
    return this;
  }

  /** Set the display duration in milliseconds. */
  displayMs(ms: number): this {
    (this._node as any).displayMs = ms;
    return this;
  }

  /** Mark this node for setConversationState() jumps. */
  mark(name: string): this {
    this._node.setMarking(name);
    return this;
  }

  // ── Hire / unhire ──────────────────────────────────────────────────────────

  /**
   * Hire the NPC for a given price.
   * Adds a processing node + success/failure reactions automatically.
   */
  hire(price: number, successText = 'I\'m honoured to work with you, commander!'): this {
    const hook = this._script.registerHook({
      funcName: `hireHookFunc_${price}`,
      body: [`return dialogObject:hireConverationPartner();`],
    });
    const success = makeSuccess(this._script, successText);
    const failed  = makeFailed(this._script);
    const failed2 = makeFailed2(this._script);
    const failed3 = makeFailed3(this._script);

    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success)
      .addReaction(HOOK_RESULT.NOT_ENOUGH_CREDITS, failed)
      .addReaction(HOOK_RESULT.INVENTORY_FULL, failed2)
      .addReaction(HOOK_RESULT.REFUSED, failed3);
    return this;
  }

  /** Dismiss the NPC from the crew. */
  unhire(successText = 'Yes, commander!', failText = 'No, commander!'): this {
    const hook = this._script.registerHook({
      funcName: 'unhireHookFunc',
      body: [`return dialogObject:unhireConverationPartner();`],
    });
    const success = makeSuccess(this._script, successText);
    const failed  = new DialogNode(nextVar('entryUnhireFailed'), failText);

    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success)
      .addReaction(HOOK_RESULT.NOT_ENOUGH_CREDITS, failed);
    return this;
  }

  // ── Sell items ─────────────────────────────────────────────────────────────

  /**
   * Sell a built-in item to the player.
   * @param item   Item key (laser, sniper, rocket, helmet, healing, power, marker,
   *               transporter, grapple, torch, prohibiter, flashlight)
   * @param price  Credit cost
   */
  sell(
    item:
      | 'laser' | 'sniper' | 'rocket' | 'helmet' | 'healing' | 'power'
      | 'marker' | 'transporter' | 'grapple' | 'torch' | 'prohibiter' | 'flashlight',
    price: number,
    successText = 'Thank you!',
  ): this {
    const hookMap: Record<string, () => HookDefinition> = {
      laser:       () => Hooks.giveLaser(price),
      sniper:      () => Hooks.giveSniperRifle(price),
      rocket:      () => Hooks.giveRocketLauncher(price),
      helmet:      () => Hooks.giveHelmet(price),
      healing:     () => Hooks.giveHealingBeam(price),
      power:       () => Hooks.givePowerSupplyBeam(price),
      marker:      () => Hooks.giveMarkerBeam(price),
      transporter: () => Hooks.giveTransporterBeacon(price),
      grapple:     () => Hooks.giveGrappleBeam(price),
      torch:       () => Hooks.giveTorchBeam(price),
      prohibiter:  () => Hooks.giveBuildProhibiter(price),
      flashlight:  () => Hooks.giveFlashLight(price),
    };
    const hook = this._script.registerHook(hookMap[item]());
    const success = makeSuccess(this._script, successText);
    const failed  = makeFailed(this._script);
    const failed2 = makeFailed2(this._script);

    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success)
      .addReaction(HOOK_RESULT.NOT_ENOUGH_CREDITS, failed)
      .addReaction(HOOK_RESULT.INVENTORY_FULL, failed2);
    return this;
  }

  /**
   * Give a block/item by type ID.
   * @param typeId  Block type ID
   * @param count   Count
   * @param price   Credit cost (0 = free)
   */
  giveType(typeId: number, count: number, price = 0, successText = 'Here you go!'): this {
    const hook = this._script.registerHook(Hooks.giveType(typeId, count));
    const success = makeSuccess(this._script, successText);
    const failed  = makeFailed(this._script);
    const failed2 = makeFailed2(this._script);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success)
      .addReaction(HOOK_RESULT.NOT_ENOUGH_CREDITS, failed)
      .addReaction(HOOK_RESULT.INVENTORY_FULL, failed2);
    return this;
  }

  // ── World interaction ──────────────────────────────────────────────────────

  /** Activate a block when this node is entered. */
  activateBlock(x: number, y: number, z: number, active = true): this {
    const hook = this._script.registerHook(Hooks.activateBlock(x, y, z, active));
    const success = new DialogNode(nextVar(), 'Done!');
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success);
    return this;
  }

  /** Toggle a block state. */
  activateBlockSwitch(x: number, y: number, z: number): this {
    const hook = this._script.registerHook(Hooks.activateBlockSwitch(x, y, z));
    const success = new DialogNode(nextVar(), 'Done!');
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success);
    return this;
  }

  /** Move the NPC to coordinates. */
  moveTo(x: number, y: number, z: number): this {
    const hook = this._script.registerHook(Hooks.moveTo(x, y, z));
    this._node.setHook(hook);
    return this;
  }

  // ── World actions (new) ─────────────────────────────────────────────────

  /**
   * Destroy an entity by UID prefix.
   * SUCCESS returns code 1 (Java confirmed), -1 = not found.
   */
  destroyShip(
    uid: string,
    successText = 'Done!',
    failText    = 'Entity not found.',
  ): this {
    const hook    = this._script.registerHook(Hooks.destroyShip(uid));
    const success = new DialogNode(nextVar('entryDestroyed'), successText);
    const fail    = new DialogNode(nextVar('entryDestroyFail'), failText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.DESTROY_SUCCESS, success)   // 1 = success
      .addReaction(HOOK_RESULT.NOT_FOUND, fail);            // -1 = not found
    return this;
  }

  /**
   * Enable or disable player gravity.
   * Returns 0 (success), 1 (already set), -1 (failed).
   */
  giveGravity(
    active: boolean,
    successText = active ? 'Gravity enabled.' : 'Gravity disabled.',
    alreadySetText = 'Already in that state.',
    failText = 'Could not change gravity.',
  ): this {
    const hook      = this._script.registerHook(Hooks.giveGravity(active));
    const success   = new DialogNode(nextVar('entryGravOk'),   successText);
    const alreadySet= new DialogNode(nextVar('entryGravSet'),  alreadySetText);
    const fail      = new DialogNode(nextVar('entryGravFail'), failText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS,            success)
      .addReaction(HOOK_RESULT.GRAVITY_ALREADY_SET, alreadySet) // 1
      .addReaction(HOOK_RESULT.GRAVITY_FAILED,      fail);       // -1
    return this;
  }

  /**
   * Start a tutorial sequence.
   * Always returns 0.
   */
  callTutorial(name: string, successText = 'Tutorial started!'): this {
    const hook    = this._script.registerHook(Hooks.callTutorial(name));
    const success = new DialogNode(nextVar('entryTutorial'), successText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS, success);
    return this;
  }

  /**
   * Spawn a new crew NPC for a credit cost.
   * Returns 0 (success), -1 (no credits), -2 (crew full).
   */
  spawnCrew(
    cost: number,
    successText    = 'Welcome!',
    noCreditsText  = "You don't have enough money!",
    crewFullText   = "You can't have more crew!",
  ): this {
    const hook     = this._script.registerHook(Hooks.spawnCrew(cost));
    const success  = new DialogNode(nextVar('entrySpawnOk'),   successText);
    const noCredit = new DialogNode(nextVar('entrySpawnNoC'),  noCreditsText);
    const crewFull = new DialogNode(nextVar('entrySpawnFull'), crewFullText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS,            success)
      .addReaction(HOOK_RESULT.NOT_ENOUGH_CREDITS, noCredit)
      .addReaction(HOOK_RESULT.INVENTORY_FULL,     crewFull);
    return this;
  }

  /**
   * Give the player a meta-item.
   * @param metaType  MetaObjectType name ('WEAPON', 'HELMET', etc.)
   * @param subType   Sub-type ID
   * @param cost      Credit cost (NOT count — Java API confirmed)
   * Returns 0 (success), -1 (no credits), -2 (inventory full).
   */
  giveMetaItem(
    metaType: MetaObjectType,
    subType: number,
    cost: number,
    successText  = 'Here you go!',
    noCreditsText = "You don't have enough credits.",
    invFullText  = 'Inventory full.',
  ): this {
    const hook     = this._script.registerHook(Hooks.giveMetaItem(metaType, subType, cost));
    const success  = makeSuccess(this._script, successText);
    const noCredit = new DialogNode(nextVar('entryMetaNoC'),  noCreditsText);
    const invFull  = new DialogNode(nextVar('entryMetaFull'), invFullText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS,         success)
      .addReaction(HOOK_RESULT.META_NO_CREDITS, noCredit)
      .addReaction(HOOK_RESULT.META_INV_FULL,   invFull);
    return this;
  }

  /**
   * Send a HUD message to the player (outside the dialog).
   * Uses org.schema.schine.network.server.ServerMessage (correct package).
   * Always returns 0 — no branch needed, chain with next node below.
   */
  sendMessage(
    text: string,
    type: 'simple' | 'info' | 'warn' | 'error' = 'info',
  ): this {
    const hook = this._script.registerHook(Hooks.sendMessage(text, type));
    this._node.setHook(hook);
    return this;
  }

  /**
   * Store a named conversation state on the NPC (no DB required).
   * Persists between dialog openings. Returns 0 / -1.
   */
  setConversationState(
    state: string,
    successText = 'State set.',
    failText    = 'Could not set state.',
  ): this {
    const hook    = this._script.registerHook(Hooks.setConversationState(state));
    const success = new DialogNode(nextVar('entryConvOk'),   successText);
    const fail    = new DialogNode(nextVar('entryConvFail'), failText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS,   success)
      .addReaction(HOOK_RESULT.NOT_FOUND, fail);
    return this;
  }

  /**
   * Branch based on whether the player is standing at block coordinates.
   * Returns 0 (at block) / -1 (not there).
   */
  isAtBlock(
    x: number,
    y: number,
    z: number,
    inPositionText  = 'You are in position!',
    notThereText    = 'You need to go to the marker.',
  ): this {
    const hook        = this._script.registerHook(Hooks.isAtBlock(x, y, z));
    const inPosition  = new DialogNode(nextVar('entryAtBlock'),  inPositionText);
    const notThere    = new DialogNode(nextVar('entryNotThere'), notThereText);
    this._node
      .setHook(hook)
      .addReaction(HOOK_RESULT.SUCCESS,   inPosition)
      .addReaction(HOOK_RESULT.NOT_FOUND, notThere);
    return this;
  }

  // ── Custom hook ────────────────────────────────────────────────────────────

  /**
   * Attach a fully custom hook to this node.
   *
   * @example
   * ```ts
   * node.customHook(Hooks.custom('myHook', [
   *   'local val = _dbGet("SELECT done FROM quests WHERE player = ?", dialogObject:getOwnName())',
   *   'if val == "1" then return 0 end',
   *   'return -1',
   * ]), {
   *   0:  successNode,
   *   [-1]: failNode,
   * })
   * ```
   */
  customHook(
    hook: HookDefinition,
    reactions: Record<number, DialogNode>,
  ): this {
    this._script.registerHook(hook);
    this._node.setHook(hook);
    for (const [code, target] of Object.entries(reactions)) {
      this._node.addReaction(Number(code), target);
    }
    return this;
  }
}

// ── DialogBuilder ─────────────────────────────────────────────────────────────

/**
 * Root-level fluent builder for a complete NPC dialog script.
 *
 * @example
 * ```ts
 * const script = new DialogBuilder({ name: 'my-merchant' })
 *   .greeting("Hello {name}! I'm {partner}, of {faction}.")
 *   .addChoice("Hire me", b => b.hire(50_000))
 *   .addChoice("Buy a laser", b => b.sell('laser', 100_000))
 *   .addChoice("Goodbye.")
 *   .build();
 *
 * console.log(LuaEmitter.emit(script));
 * ```
 */
export class DialogBuilder {
  private readonly _script: ScriptDefinition;
  private _root: NodeBuilder | null = null;
  private readonly _choices: Array<{ label: string; build: (b: NodeBuilder) => void }> = [];

  constructor(options: ScriptOptions) {
    resetCounter();
    this._script = new ScriptDefinition(options);
  }

  /**
   * Set the NPC's opening greeting text.
   * Supports placeholders: {name} → NPC name, {partner} → partner name,
   * {faction} → faction name, {owner} → owner name.
   */
  greeting(text: string, displayMs = 2000): this {
    this._root = new NodeBuilder(this._script, 'entry', text, displayMs, null);
    return this;
  }

  /**
   * Add a top-level player choice from the root node.
   * @param label  Choice button label
   * @param build  Optional builder callback for the target node
   */
  addChoice(label: string, build?: (b: NodeBuilder) => void): this {
    this._choices.push({ label, build: build ?? (() => {}) });
    return this;
  }

  /**
   * Build the ScriptDefinition from the current configuration.
   */
  build(): ScriptDefinition {
    if (!this._root) {
      throw new Error('DialogBuilder: call greeting() before build()');
    }

    // Attach top-level choices to root
    for (const { label, build } of this._choices) {
      const child = new NodeBuilder(
        this._script, nextVar(), `[${label}]`, 2000, this._root
      );
      build(child);
      this._root.node.addChoice(label, child.node);
    }

    this._script.root = this._root.node;
    return this._script;
  }
}
