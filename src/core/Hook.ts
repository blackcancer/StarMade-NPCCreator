/**
 * @fileoverview Hook Definition
 *
 * Defines Lua hook functions (DialogTextEntryHookLua) and the callback
 * body that executes when the hook is triggered by the game engine.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

/**
 * A hook is a Lua function + a DialogTextEntryHookLua Java object.
 *
 * When the game calls the hook, it passes `dialogObject` and any
 * bound parameters. The function must return an integer code:
 *   0   = success
 *  -1   = not enough credits
 *  -2   = inventory full / limit reached
 *  -3   = NPC refuses
 *
 * Custom codes (e.g. -10, -20) are also supported for custom logic.
 */
export interface HookDefinition {
  /** Lua function name (must be globally unique in the script). */
  funcName: string;

  /**
   * Lua function body lines (without `function` declaration).
   * The parameters are always `(dialogObject, ...)`.
   * Must end with a `return <int>` statement.
   *
   * @example
   * ```ts
   * body: ['return dialogObject:hireConverationPartner();']
   * ```
   */
  body: string[];

  /**
   * Extra bound parameters passed to the hook (Lua table literal).
   * Defaults to `{}`.
   * @example `['price', '50000']` → `{price, 50000}` bound parameters
   */
  params?: string[];
}

/** Built-in hooks for common dialogObject actions. */
export const Hooks = {
  /** Hire the conversation partner as crew. */
  hire(): HookDefinition {
    return {
      funcName: 'hireHookFunc',
      body: ['return dialogObject:hireConverationPartner();'],
    };
  },

  /** Dismiss the conversation partner from the crew. */
  unhire(): HookDefinition {
    return {
      funcName: 'unhireHookFunc',
      body: ['return dialogObject:unhireConverationPartner();'],
    };
  },

  /** Spawn a crew member for a given price. */
  spawnCrew(price: number): HookDefinition {
    return {
      funcName: `spawnCrewHookFunc_${price}`,
      body: [`return dialogObject:spawnCrew(${price});`],
    };
  },

  /** Give the player a laser weapon at a given price. */
  giveLaser(price: number): HookDefinition {
    return {
      funcName: `giveLaserHookFunc_${price}`,
      body: [`return dialogObject:giveLaserWeapon(${price});`],
    };
  },

  giveSniperRifle(price: number): HookDefinition {
    return { funcName: `giveSniperHookFunc_${price}`, body: [`return dialogObject:giveSniperRifle(${price});`] };
  },
  giveRocketLauncher(price: number): HookDefinition {
    return { funcName: `giveRocketHookFunc_${price}`, body: [`return dialogObject:giveRocketLauncher(${price});`] };
  },
  giveHealingBeam(price: number): HookDefinition {
    return { funcName: `giveHealingHookFunc_${price}`, body: [`return dialogObject:giveHealingBeam(${price});`] };
  },
  givePowerSupplyBeam(price: number): HookDefinition {
    return { funcName: `givePowerHookFunc_${price}`, body: [`return dialogObject:givePowerSupplyBeam(${price});`] };
  },
  giveMarkerBeam(price: number): HookDefinition {
    return { funcName: `giveMarkerHookFunc_${price}`, body: [`return dialogObject:giveMarkerBeam(${price});`] };
  },
  giveTransporterBeacon(price: number): HookDefinition {
    return { funcName: `giveTransporterHookFunc_${price}`, body: [`return dialogObject:giveTransporterMarkerBeam(${price});`] };
  },
  giveGrappleBeam(price: number): HookDefinition {
    return { funcName: `giveGrappleHookFunc_${price}`, body: [`return dialogObject:giveGrappleBeam(${price});`] };
  },
  giveTorchBeam(price: number): HookDefinition {
    return { funcName: `giveTorchHookFunc_${price}`, body: [`return dialogObject:giveTorchBeam(${price});`] };
  },
  giveBuildProhibiter(price: number): HookDefinition {
    return { funcName: `giveBuildProhibHookFunc_${price}`, body: [`return dialogObject:giveBuildProhibiter(${price});`] };
  },
  giveFlashLight(price: number): HookDefinition {
    return { funcName: `giveFlashHookFunc_${price}`, body: [`return dialogObject:giveFlashLight(${price});`] };
  },
  giveHelmet(price: number): HookDefinition {
    return { funcName: `giveHelmetHookFunc_${price}`, body: [`return dialogObject:giveHelmet(${price});`] };
  },

  /** Give any block type by ID. */
  giveType(typeId: number, count: number): HookDefinition {
    return {
      funcName: `giveTypeHookFunc_${typeId}_${count}`,
      body: [`return dialogObject:giveType(${typeId}, ${count});`],
    };
  },

  /** Activate a block. */
  activateBlock(x: number, y: number, z: number, active: boolean): HookDefinition {
    return {
      funcName: `activateBlockHookFunc_${x}_${y}_${z}`,
      body: [`return dialogObject:activateBlock(${x}, ${y}, ${z}, ${active});`],
    };
  },

  /** Toggle a block. */
  activateBlockSwitch(x: number, y: number, z: number): HookDefinition {
    return {
      funcName: `activateSwitchHookFunc_${x}_${y}_${z}`,
      body: [`return dialogObject:activateBlockSwitch(${x}, ${y}, ${z});`],
    };
  },

  /** Move NPC to coordinates. */
  moveTo(x: number, y: number, z: number): HookDefinition {
    return {
      funcName: `moveToHookFunc_${x}_${y}_${z}`,
      body: [`return dialogObject:moveTo(${x}, ${y}, ${z});`],
    };
  },

  /** Trigger a tutorial. */
  callTutorial(name: string): HookDefinition {
    return {
      funcName: `callTutorialHookFunc_${name.replace(/\W/g, '_')}`,
      body: [`return dialogObject:callTutorial("${name}");`],
    };
  },

  /** Jump to a named conversation state. */
  setConversationState(stateName: string): HookDefinition {
    return {
      funcName: `setStateHookFunc_${stateName.replace(/\W/g, '_')}`,
      body: [`return dialogObject:setConversationState("${stateName}");`],
    };
  },

  /**
   * Custom hook — write arbitrary Lua body lines.
   * Always end with a `return <int>` statement.
   *
   * @example
   * ```ts
   * Hooks.custom('checkQuestHook', [
   *   'local db = require("sqlite")',
   *   'local row = db.query("SELECT done FROM quests WHERE player=? LIMIT 1", dialogObject:getOwnName())',
   *   'if row and row.done == 1 then return 0 end',
   *   'return -1',
   * ])
   * ```
   */
  custom(funcName: string, body: string[]): HookDefinition {
    return { funcName, body };
  },

  // ── World actions ──────────────────────────────────────────────────────────────────

  /**
   * Destroy an entity by UID prefix.
   * Returns 1 on success (Java source confirmed — NOT 0), -1 if not found.
   */
  destroyShip(uid: string): HookDefinition {
    return {
      funcName: `destroyShipHook_${uid.replace(/\W/g, '_')}`,
      body: [`return dialogObject:destroyShip("${uid}");`],
    };
  },

  /**
   * Enable or disable gravity for the player.
   * Returns 0 (success), 1 (already in target state), -1 (failed).
   */
  giveGravity(active: boolean): HookDefinition {
    return {
      funcName: `giveGravityHook_${active ? 'on' : 'off'}`,
      body: [`return dialogObject:giveGravity(${active});`],
    };
  },

  /**
   * Trigger a named tutorial sequence. Returns 0 always.
   * (duplicate removed — kept original at line ~148)
   */

  /**
   * Spawn a new crew NPC for a credit cost.
   * Returns 0 (success), -1 (not enough credits), -2 (crew full).
   * (duplicate removed — kept original at line ~66 with funcName spawnCrewHookFunc_N)
   */

  /**
   * Give the player a meta-item (non-block item) at a credit cost.
   * @param metaType  MetaObjectType enum name (e.g. 'WEAPON', 'HELMET')
   * @param subType   Sub-type ID
   * @param cost      Credit cost (3rd param is cost, NOT count — Java API confirmed)
   * Returns 0 (success), -1 (not enough credits), -2 (inventory full).
   */
  giveMetaItem(metaType: string, subType: number, cost: number): HookDefinition {
    const cls = 'org.schema.game.common.data.element.meta.MetaObjectManager$MetaObjectType';
    return {
      funcName: `giveMetaItemHook_${metaType}_${subType}`,
      body: [
        `local MetaType = luajava.bindClass("${cls}")`,
        `return dialogObject:giveMetaItem(MetaType.${metaType}, ${subType}, ${cost});`,
      ],
    };
  },

  /**
   * Send a HUD message to the player.
   * Uses org.schema.schine.network.server.ServerMessage (correct package).
   * Type: 0=simple, 1=info, 2=warning, 3=error.
   * Always returns 0.
   */
  sendMessage(
    text: string,
    type: 'simple' | 'info' | 'warn' | 'error' = 'info',
  ): HookDefinition {
    const typeMap = { simple: 0, info: 1, warn: 2, error: 3 };
    const typeCode = typeMap[type] ?? 1;
    const escaped  = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const smClass  = 'org.schema.schine.network.server.ServerMessage';
    return {
      funcName: `sendMsgHook_${type}_${Math.abs(text.split('').reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0))}`,
      body: [
        `local ps = dialogObject:getEntity()`,
        `if ps ~= nil then`,
        `  local SM = luajava.bindClass("${smClass}")`,
        `  ps:sendServerMessage(luajava.newInstance("${smClass}", dialogObject:format("${escaped}"), ${typeCode}, ps:getId()))`,
        `end`,
        `return 0`,
      ],
    };
  },

  /**
   * Store a named conversation state on the NPC.
   * Uses dialogObject:setConversationState(name).
   * Returns 0 (success), -1 (NPC is not an AIPlayer).
   * (duplicate removed — kept original at line ~156)
   */

  /**
   * Check if the player is standing at block coordinates.
   * Returns 0 if at block, -1 if not.
   * Note: isAtBlock() returns boolean in Java; we convert to int.
   */
  isAtBlock(x: number, y: number, z: number): HookDefinition {
    return {
      funcName: `isAtBlockHook_${x}_${y}_${z}`,
      body: [
        `if dialogObject:isAtBlock(${x}, ${y}, ${z}) then return 0 end`,
        `return -1`,
      ],
    };
  },

};
