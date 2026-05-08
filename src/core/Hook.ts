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
};
