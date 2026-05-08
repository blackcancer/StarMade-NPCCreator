/**
 * @fileoverview DialogObject API
 *
 * Complete typed interface matching the Java AICreatureDialogAI class
 * exposed as `dialogObject` in StarMade NPC Lua scripts.
 *
 * Source: org.schema.game.common.data.player.dialog.AICreatureDialogAI
 *
 * @author InitSysRev
 * @version 1.0.0
 */

/**
 * All methods available on the `dialogObject` parameter passed to
 * the Lua `create(dialogObject, bindings)` function.
 *
 * Return codes for hook functions:
 *   0   = success
 *  -1   = not enough credits
 *  -2   = inventory full / crew limit reached
 *  -3   = NPC refuses (e.g. not in same faction)
 */
export interface DialogObject {
  // ── NPC identity ────────────────────────────────────────────────────────────

  /** Display name of the NPC character. */
  getConverationParterName(): string;

  /** Faction affinity string of the NPC. */
  getConverationPartnerAffinity(): string;

  /** Faction name the NPC belongs to. */
  getConverationPartnerFactionName(): string;

  /** Name of the NPC's current owner / commander. */
  getConverationPartnerOwnerName(): string;

  /** Name of the player character initiating the conversation. */
  getOwnName(): string;

  /** Lua script name used to load this NPC's dialog. */
  getScriptName(): string;

  // ── Conversation state ───────────────────────────────────────────────────────

  /** Jump to a named conversation state by entryMarking. Returns 0 on success. */
  setConversationState(stateName: string): number;

  /** Returns the current conversation state's entryMarking. */
  getConversationState(): string;

  // ── Crew management ──────────────────────────────────────────────────────────

  /** Whether the NPC is already in the player's crew team. */
  isConverationPartnerInTeam(): boolean;

  /**
   * Hire the NPC as crew for the given credit cost.
   * Returns: 0=success, -1=not enough credits, -2=crew limit reached, -3=NPC refuses
   */
  hireConverationPartner(): number;

  /**
   * Dismiss the NPC from the player's crew.
   * Returns: 0=success, -1=not in team
   */
  unhireConverationPartner(): number;

  /**
   * Spawn a crew NPC for the given credit price.
   * Returns: 0=success, -1=not enough credits, -2=crew limit reached
   */
  spawnCrew(price: number): number;

  // ── Item / equipment giving ──────────────────────────────────────────────────

  /**
   * Give the player a laser pistol (random color).
   * @param price Credit cost (0 = free)
   * Returns: 0=success, -1=not enough credits, -2=inventory full
   */
  giveLaserWeapon(price: number): number;

  /** Give the player a sniper rifle. */
  giveSniperRifle(price: number): number;

  /** Give the player a rocket launcher. */
  giveRocketLauncher(price: number): number;

  /** Give the player a healing beam tool. */
  giveHealingBeam(price: number): number;

  /** Give the player a power supply beam tool. */
  givePowerSupplyBeam(price: number): number;

  /** Give the player a marker beam. */
  giveMarkerBeam(price: number): number;

  /** Give the player a transporter marker beacon. */
  giveTransporterMarkerBeam(price: number): number;

  /** Give the player a grapple beam. */
  giveGrappleBeam(price: number): number;

  /** Give the player a torch beam tool. */
  giveTorchBeam(price: number): number;

  /** Give the player a build prohibiter tool. */
  giveBuildProhibiter(price: number): number;

  /** Give the player a flashlight. */
  giveFlashLight(price: number): number;

  /** Give the player a space helmet. */
  giveHelmet(price: number): number;

  /**
   * Give the player any item by block type ID and count.
   * @param type  Block/item type ID (short)
   * @param count Number of items
   * Returns: 0=success, -1=not enough credits, -2=inventory full
   */
  giveType(type: number, count: number): number;

  /**
   * Give the player a meta item (weapon, tool, etc.) of a specific MetaObjectType.
   * @param metaType  Java MetaObjectManager.MetaObjectType ordinal
   * @param type      Item sub-type
   * @param count     Count
   */
  giveMetaItem(metaType: number, type: number, count: number): number;

  // ── World interaction ─────────────────────────────────────────────────────────

  /**
   * Check whether the player is at the given block coordinate.
   * @param x Local X
   * @param y Local Y
   * @param z Local Z
   */
  isAtBlock(x: number, y: number, z: number): boolean;

  /**
   * Move the NPC to the given block coordinate.
   * Returns: 0=success, -1=unreachable
   */
  moveTo(x: number, y: number, z: number): number;

  /**
   * Activate or deactivate a block at the given coordinate.
   * @param active true=activate, false=deactivate
   */
  activateBlock(x: number, y: number, z: number, active: boolean): number;

  /** Toggle a block's activation state at the given coordinate. */
  activateBlockSwitch(x: number, y: number, z: number): number;

  /**
   * Set or remove gravity for the player.
   * @param enabled true=normal gravity, false=zero-g
   */
  giveGravity(enabled: boolean): number;

  /**
   * Destroy a ship entity by its unique ID string.
   * Returns: 0=success, -1=entity not found
   */
  destroyShip(uniqueId: string): number;

  // ── Tutorial system ───────────────────────────────────────────────────────────

  /**
   * Trigger a tutorial step by name.
   * Returns: 0=success, -1=unknown tutorial
   */
  callTutorial(tutorialName: string): number;

  // ── Text formatting ───────────────────────────────────────────────────────────

  /**
   * Format a string with NPC-context variable substitution.
   * Supports %s placeholders resolved against player/NPC context.
   * Returns an Object[] suitable for passing to TextEntry constructor.
   */
  format(text: string): unknown[];
  format(text: string, arg1: unknown): unknown[];
  format(text: string, arg1: unknown, arg2: unknown): unknown[];
  format(text: string, arg1: unknown, arg2: unknown, arg3: unknown): unknown[];
  format(text: string, arg1: unknown, arg2: unknown, arg3: unknown, arg4: unknown): unknown[];
  format(text: string, arg1: unknown, arg2: unknown, arg3: unknown, arg4: unknown, arg5: unknown): unknown[];
}

/**
 * Java class names used with luajava.bindClass() and luajava.newInstance().
 */
export const JAVA_CLASSES = {
  DialogSystem:                'org.schema.game.common.data.player.dialog.DialogSystem',
  DialogStateMachineFactory:   'org.schema.game.common.data.player.dialog.DialogStateMachineFactory',
  DialogStateMachineFactoryEntry: 'org.schema.game.common.data.player.dialog.DialogStateMachineFactoryEntry',
  TextEntry:                   'org.schema.game.common.data.player.dialog.TextEntry',
  DialogTextEntryHookLua:      'org.schema.game.common.data.player.dialog.DialogTextEntryHookLua',
} as const;

/** Return code constants from dialogObject methods. */
export const HOOK_RESULT = {
  SUCCESS:         0,
  NOT_ENOUGH_CREDITS: -1,
  INVENTORY_FULL:  -2,
  REFUSED:         -3,
} as const;
