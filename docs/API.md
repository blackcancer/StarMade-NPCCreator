# API Reference — StarMade NPC Creator Library

> TypeScript fluent API for generating StarMade NPC Lua dialog scripts.  
> Package: `starmade-npccreator` · Version: `1.0.0`

---

## Table of contents

- [Installation](#installation)
- [DialogBuilder](#dialogbuilder)
- [NodeBuilder](#nodebuilder)
  - [Dialog flow](#dialog-flow)
  - [Crew actions](#crew-actions)
  - [Item actions](#item-actions)
  - [World actions](#world-actions)
  - [Communication](#communication)
  - [Advanced](#advanced)
- [LuaEmitter](#luaemitter)
- [ScriptDefinition](#scriptdefinition)
- [DialogNode](#dialognode)
- [HookDefinition · Hooks](#hookdefinition--hooks)
- [HOOK\_RESULT](#hook_result)
- [JAVA\_CLASSES](#java_classes)
- [SqliteState](#sqlitestate)
- [DialogObject interface](#dialogobject-interface)

---

## Installation

```bash
npm install starmade-npccreator
```

```ts
import {
  DialogBuilder,
  LuaEmitter,
  SqliteState,
  Hooks,
  HOOK_RESULT,
  JAVA_CLASSES,
} from 'starmade-npccreator';
```

---

## DialogBuilder

Root entry point. Builds a complete NPC dialog tree.

### Constructor

```ts
new DialogBuilder(options: ScriptOptions)
```

**ScriptOptions**

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | `string` | ✓ | Script identifier used in the Lua file header |
| `description` | `string` | | Human-readable description for the header comment |
| `db` | `SqliteState` | | SQLite state module (generates DB init Lua) |
| `preamble` | `string[]` | | Raw Lua lines inserted before hook functions |

### Methods

#### `.greeting(text, displayMs?)`

Set the root dialog node text. Must be called before `.addChoice()`.

```ts
builder.greeting("Hello {name}! I am {partner} of {faction}.")
```

**Text placeholders**

| Placeholder | Resolved to |
|---|---|
| `{name}` | `dialogObject:getConverationParterName()` |
| `{partner}` | `dialogObject:getConverationPartnerAffinity()` |
| `{faction}` | `dialogObject:getConverationPartnerFactionName()` |
| `{owner}` | `dialogObject:getConverationPartnerOwnerName()` |
| `{self}` | `dialogObject:getOwnName()` |

#### `.addChoice(label, build?)`

Add a top-level player-visible choice button on the root node.

```ts
builder
  .addChoice("Hire me (50 000 cr)", b => b.hire(50_000))
  .addChoice("Buy a laser", b => b.sell('laser', 100_000))
  .addChoice("Goodbye.", b => b.goBack())
```

#### `.build()`

Return the completed `ScriptDefinition`. Throws if `greeting()` was not called.

#### `.done()`

Alias for `.build()`.

---

## NodeBuilder

Returned by every `.addChoice()` callback. All methods return `this` for chaining.

### Dialog flow

#### `.addChoice(label, build)`

Add a sub-choice from this node.

```ts
b.addChoice("Tell me more", sub => {
  sub.addChoice("Go back", s => s.goBack())
})
```

#### `.goBack(label?)`

Add a "go back" choice that returns the player to the parent node.

```ts
b.goBack("Actually, never mind.")
```

#### `.displayMs(ms)`

Override the display duration for this node.

```ts
b.displayMs(3000) // show for 3 seconds
```

Default: `2000` ms.

#### `.mark(name)`

Tag this node with an `entryMarking` for `setConversationState()` jumps.

```ts
b.mark('mission_hub')
```

---

### Crew actions

#### `.hire(price, successText?)`

Hire the NPC as a crew member. Deducts `price` credits.

```ts
b.hire(50_000, "Welcome aboard, Commander!")
```

**Reactions wired automatically**

| Return code | Constant | Default text |
|---|---|---|
| `0` | `HOOK_RESULT.SUCCESS` | `"I'm honoured to work with you, commander!"` |
| `-2` | `HOOK_RESULT.CREW_FULL_OR_IN_TEAM` | `"Sorry, your inventory is full!"` |
| `-3` | `HOOK_RESULT.FACTION_MISMATCH` | `"I'm not doing that."` |

#### `.unhire(successText?, failText?)`

Dismiss the NPC from the crew.

```ts
b.unhire("Yes, commander!", "No, commander!")
```

| Return code | Constant | Meaning |
|---|---|---|
| `0` | `SUCCESS` | Dismissed |
| `-1` | `NOT_ENOUGH_CREDITS` | NPC not in crew |

#### `.spawnCrew(cost, successText?, noCreditsText?, crewFullText?)`

Spawn a new crew NPC at the given credit cost.

```ts
b.spawnCrew(25_000)
```

| Return code | Constant | Meaning |
|---|---|---|
| `0` | `SUCCESS` | Spawned |
| `-1` | `NOT_ENOUGH_CREDITS` | Not enough credits |
| `-2` | `INVENTORY_FULL` | Crew limit reached |

---

### Item actions

#### `.sell(item, price, successText?)`

Sell a built-in item type to the player.

```ts
b.sell('laser', 100_000, "Here is your laser pistol!")
```

**`item` values**

`'laser'` `'sniper'` `'rocket'` `'helmet'` `'healing'` `'power'`  
`'marker'` `'transporter'` `'grapple'` `'torch'` `'prohibiter'` `'flashlight'`

| Return code | Constant | Meaning |
|---|---|---|
| `0` | `SUCCESS` | Sold |
| `-1` | `NOT_ENOUGH_CREDITS` | Not enough credits |
| `-2` | `INVENTORY_FULL` | Inventory full |
| `-3` | `REFUSED` | NPC refuses |

#### `.giveType(typeId, count, price?, successText?)`

Give any item by numeric block type ID.

```ts
b.giveType(424, 5)          // 5× Fatanium Ore, free
b.giveType(424, 5, 1_000)   // 5× Fatanium Ore, 1 000 cr
```

| Return code | Constant | Meaning |
|---|---|---|
| `0` | `SUCCESS` | Given |
| `-1` | `NOT_ENOUGH_CREDITS` | Not enough credits |
| `-2` | `INVENTORY_FULL` | Inventory full |

#### `.giveMetaItem(metaType, subType, cost, successText?, noCreditsText?, invFullText?)`

Give a meta item (ship blueprint, special entity). Charges `cost` credits.

> **Note:** the third parameter is the **cost in credits**, not a count — confirmed from Java source.

```ts
b.giveMetaItem('WEAPON', 0, 500_000)
```

| Return code | Meaning |
|---|---|
| `0` | Given |
| `-1` | Not enough credits |
| `-2` | Inventory full |

---

### World actions

#### `.activateBlock(x, y, z, active?)`

Activate or deactivate a block switch at coordinates `(x, y, z)`.

```ts
b.activateBlock(10, 0, 5, true)   // switch ON
b.activateBlock(10, 0, 5, false)  // switch OFF
```

#### `.activateBlockSwitch(x, y, z)`

Toggle the block switch state (equivalent to player right-click).

#### `.moveTo(x, y, z)`

Move the NPC to block coordinates.

```ts
b.moveTo(8, 0, 12)
```

#### `.destroyShip(uid, successText?, failText?)`

Destroy a ship entity by UID.

```ts
b.destroyShip('ENTITY_SHIP_target_01')
```

> **Note:** `destroyShip` returns `1` (not `0`) on success — StarMade Java confirmed.

| Return code | Constant | Meaning |
|---|---|---|
| `1` | `HOOK_RESULT.DESTROY_SUCCESS` | Destroyed |
| `-1` | `HOOK_RESULT.NOT_FOUND` | Entity not found |

#### `.giveGravity(enabled, successText?, alreadySetText?, failText?)`

Enable or disable personal gravity for the player.

```ts
b.giveGravity(true)
b.giveGravity(false, "Gravity disabled.")
```

| Return code | Constant | Meaning |
|---|---|---|
| `0` | `SUCCESS` | Changed |
| `1` | `GRAVITY_ALREADY_SET` | Already in that state |
| `-1` | `GRAVITY_FAILED` | Failed |

#### `.callTutorial(name, successText?)`

Trigger a StarMade tutorial step by name.

```ts
b.callTutorial('intro_step_1')
```

---

### Communication

#### `.sendMessage(text, type?)`

Send a server HUD notification to the player. The message persists after the dialog closes.

```ts
b.sendMessage('Quest updated!', 'info')
b.sendMessage('Warning: sector under siege!', 'warn')
```

| `type` | HUD appearance |
|---|---|
| `'info'` (default) | Blue |
| `'warn'` | Yellow |
| `'error'` | Red |

Uses `org.schema.schine.network.server.ServerMessage` — correct package confirmed from Java source.

#### `.isAtBlock(x, y, z, inPositionText?, notThereText?)`

Branch based on whether the player is standing at block coordinates.

```ts
b.isAtBlock(10, 0, 5, "You are in position!", "You need to go to the marker.")
```

| Return code | Meaning |
|---|---|
| `0` | Player is at the block |
| `-1` | Not there |

#### `.setConversationState(state, successText?, failText?)`

Persist a named conversation state on the NPC. Survives dialog close and re-open.

```ts
b.setConversationState('on_mission_step_2')
```

Retrieve in a hook body with `dialogObject:getConversationState()`.

---

### Advanced

#### `.customHook(hook, reactions)`

Attach a raw `HookDefinition` with explicit reaction nodes.

```ts
import { DialogNode } from 'starmade-npccreator';

const success = new DialogNode('entryOk',   'Condition met!');
const fail    = new DialogNode('entryFail', 'Condition not met.');

b.customHook(
  {
    funcName: 'myConditionHook',
    body: [
      'local ps = dialogObject:getEntity()',
      'if ps ~= nil and ps:getCredits() >= 1000 then return 0 end',
      'return -1',
    ],
  },
  { 0: success, [-1]: fail }
)
```

---

## LuaEmitter

Converts a `ScriptDefinition` into a complete StarMade Lua script.

```ts
import { LuaEmitter } from 'starmade-npccreator';

const lua = LuaEmitter.emit(script);
```

### `LuaEmitter.emit(script)`

Returns the full Lua script as a `string`. The output structure:

1. File header comment (`--[[ … --]]`)
2. SQLite init block (if `db` was provided in `ScriptOptions`)
3. Preamble lines
4. Hook function definitions
5. `create(dialogObject, bindings)` containing:
   - Hook instance declarations (`luajava.newInstance(DialogTextEntryHookLua, …)`)
   - TextEntry node declarations
   - `factory:setRootEntry()`
   - `setHook()` · `addReaction()` · `:add()` wiring

Throws if `ScriptDefinition.root` is `null`.

### `LuaEmitter.toLua(script)`

Alias for `emit()`.

---

## ScriptDefinition

Container for the complete script. Built by `DialogBuilder.build()`.

```ts
import { ScriptDefinition } from 'starmade-npccreator';
```

| Property | Type | Description |
|---|---|---|
| `name` | `string` | Script identifier |
| `description` | `string` | Header comment text |
| `root` | `DialogNode \| null` | Root dialog node |
| `hooks` | `Map<string, HookDefinition>` | All registered hooks |
| `db` | `SqliteState \| null` | SQLite state module |
| `preamble` | `string[]` | Pre-`create()` Lua lines |

### `.registerHook(hook)`

Add a `HookDefinition` to the registry (deduplicates by `funcName`). Returns the hook.

---

## DialogNode

A single node in the dialog state machine. Corresponds to Java `TextEntry`.

```ts
import { DialogNode } from 'starmade-npccreator';
```

### Constructor

```ts
new DialogNode(varName: string, text: string, displayMs?: number)
```

| Parameter | Description |
|---|---|
| `varName` | Unique Lua variable name (e.g. `'entry'`, `'entrySuccess'`) |
| `text` | Text displayed to the player. Supports `{name}` `{faction}` etc. |
| `displayMs` | Display duration in ms (default `2000`) |

### Methods

| Method | Description |
|---|---|
| `.addChoice(label, target)` | Add a player-visible choice button |
| `.addReaction(code, target)` | Add a hook reaction by return code |
| `.setHook(hook)` | Attach a `HookDefinition` to this node |
| `.setMarking(name)` | Set `entryMarking` for `setConversationState()` jumps |

---

## HookDefinition · Hooks

### HookDefinition interface

```ts
interface HookDefinition {
  funcName: string;    // globally unique Lua function name
  body:     string[];  // Lua lines (without function declaration)
  params?:  string[];  // extra bound parameters
}
```

The hook function receives `dialogObject` (and any `params`). It must return an integer code:

| Code | Meaning |
|---|---|
| `0` | Success |
| `-1` | Not enough credits / failure |
| `-2` | Inventory full / crew limit |
| `-3` | NPC refuses (faction mismatch) |
| Any | Custom code for `.customHook()` reactions |

### Hooks factory

```ts
import { Hooks } from 'starmade-npccreator';
```

| Method | Generated Lua body |
|---|---|
| `Hooks.hire(price)` | `return dialogObject:hireConverationPartner();` |
| `Hooks.unhire()` | `return dialogObject:unhireConverationPartner();` |
| `Hooks.giveLaser(price)` | `return dialogObject:giveLaserWeapon(price);` |
| `Hooks.giveSniperRifle(price)` | `return dialogObject:giveSniperRifle(price);` |
| `Hooks.giveRocketLauncher(price)` | `return dialogObject:giveRocketLauncher(price);` |
| `Hooks.giveHelmet(price)` | `return dialogObject:giveHelmet(price);` |
| `Hooks.giveHealingBeam(price)` | `return dialogObject:giveHealingBeam(price);` |
| `Hooks.givePowerSupplyBeam(price)` | `return dialogObject:givePowerSupplyBeam(price);` |
| `Hooks.giveMarkerBeam(price)` | `return dialogObject:giveMarkerBeam(price);` |
| `Hooks.giveTransporterBeacon(price)` | `return dialogObject:giveTransporterMarkerBeam(price);` |
| `Hooks.giveGrappleBeam(price)` | `return dialogObject:giveGrappleBeam(price);` |
| `Hooks.giveTorchBeam(price)` | `return dialogObject:giveTorchBeam(price);` |
| `Hooks.giveBuildProhibiter(price)` | `return dialogObject:giveBuildProhibiter(price);` |
| `Hooks.giveFlashLight(price)` | `return dialogObject:giveFlashLight(price);` |
| `Hooks.giveType(typeId, count)` | `return dialogObject:giveType(typeId, count);` |
| `Hooks.giveMetaItem(type, sub, cost)` | `return dialogObject:giveMetaItem(type, sub, cost);` |
| `Hooks.activateBlock(x, y, z, state)` | `return dialogObject:activateBlock(x, y, z, state);` |
| `Hooks.activateBlockSwitch(x, y, z)` | `return dialogObject:activateBlockSwitch(x, y, z);` |
| `Hooks.moveTo(x, y, z)` | `return dialogObject:moveTo(x, y, z);` |
| `Hooks.destroyShip(uid)` | `return dialogObject:destroyShip("uid");` |
| `Hooks.giveGravity(enabled)` | `return dialogObject:giveGravity(enabled);` |
| `Hooks.spawnCrew(cost)` | `return dialogObject:spawnCrew(cost);` |
| `Hooks.sendMessage(text, type)` | ServerMessage instantiation |
| `Hooks.isAtBlock(x, y, z)` | `if dialogObject:isAtBlock(…) then return 0 end; return -1` |
| `Hooks.setConversationState(state)` | `return dialogObject:setConversationState("state");` |
| `Hooks.callTutorial(name)` | `return dialogObject:callTutorial("name");` |

---

## HOOK\_RESULT

Typed constants for hook return codes, sourced from the StarMade Java source  
(`org.schema.game.common.data.player.dialog.AICreatureDialogAI`).

```ts
import { HOOK_RESULT } from 'starmade-npccreator';
```

| Constant | Value | Applies to |
|---|---|---|
| `SUCCESS` | `0` | All actions |
| `NOT_ENOUGH_CREDITS` | `-1` | sell, giveType, giveMetaItem, spawnCrew |
| `INVENTORY_FULL` | `-2` | sell, giveType, giveMetaItem |
| `REFUSED` | `-3` | sell, hire |
| `CREW_FULL_OR_IN_TEAM` | `-2` | hire, spawnCrew |
| `FACTION_MISMATCH` | `-3` | hire |
| `DESTROY_SUCCESS` | `1` | destroyShip — **not 0**, Java confirmed |
| `NOT_FOUND` | `-1` | destroyShip, isAtBlock |
| `GRAVITY_ALREADY_SET` | `1` | giveGravity |
| `GRAVITY_FAILED` | `-1` | giveGravity |
| `META_NO_CREDITS` | `-1` | giveMetaItem |
| `META_INV_FULL` | `-2` | giveMetaItem |

---

## JAVA\_CLASSES

Java class name strings used in generated `luajava.newInstance()` calls.

```ts
import { JAVA_CLASSES } from 'starmade-npccreator';
```

| Constant | Java class |
|---|---|
| `JAVA_CLASSES.TextEntry` | `org.schema.game.common.data.player.dialog.TextEntry` |
| `JAVA_CLASSES.DialogTextEntryHookLua` | `org.schema.game.common.data.player.dialog.DialogTextEntryHookLua` |
| `JAVA_CLASSES.DialogSystem` | `org.schema.game.common.data.player.dialog.DialogSystem` |
| `JAVA_CLASSES.ServerMessage` | `org.schema.schine.network.server.ServerMessage` |

---

## SqliteState

Generates Lua helper code for persistent NPC state backed by HSQLDB  
(bundled in `lib/hsqldb.jar` with every StarMade installation — no external JDBC driver needed).

```ts
import { SqliteState } from 'starmade-npccreator';
```

### Constructor

```ts
new SqliteState({
  dbPath:      string,           // path relative to StarMade server root
  driverClass?: string,          // default: 'org.hsqldb.jdbc.JDBCDriver'
  connVar?:     string,          // default: '_npcDb'
})
```

**Recommended `dbPath`:**

```
./server-database/<worldname>/npc_data/npc_state
```

HSQLDB creates several companion files (`.script`, `.data`, `.properties`) alongside the path.

### `.defineTable(name, schema)`

Declare a table. The table is created with `CREATE TABLE IF NOT EXISTS` on first script load.

```ts
db.defineTable('npc_quests', {
  player:   'VARCHAR(255) NOT NULL',
  quest_id: 'VARCHAR(255) NOT NULL',
  status:   "VARCHAR(32) NOT NULL DEFAULT 'none'",
  step:     'INTEGER NOT NULL DEFAULT 0',
})
```

Returns `this` for chaining.

### `.emitInit()`

Returns the complete Lua initialization block as a `string`:

- Loads HSQLDB JDBC driver via `luajava.bindClass()`
- Opens the connection via `DriverManager.getConnection()`
- Creates all declared tables
- Defines `_dbExec()`, `_dbGet()`, `_dbUpsert()`, `_dbIncrement()` helpers

Pass the result to `ScriptOptions.preamble`:

```ts
new DialogBuilder({
  name:     'my_npc',
  preamble: [db.emitInit()],
})
```

### `.exprGet(table, col, keyExpr, defaultExpr?)`

Returns a Lua **expression** that reads a value from the DB (for use inside hook bodies).

```ts
const val = db.exprGet('npc_quests', 'status', 'dialogObject:getOwnName()', '"none"');
// → (_dbGet("SELECT status FROM npc_quests WHERE player = ?", dialogObject:getOwnName()) or "none")
```

### `.linesSet(table, col, valExpr, keyExpr)`

Returns Lua **lines** that upsert a value.

```ts
const lines = db.linesSet('npc_quests', 'status', '"active"', 'dialogObject:getOwnName()');
// → ['_dbUpsert("npc_quests", "player", dialogObject:getOwnName(), "status", "active")']
```

### `.linesIncrement(table, col, keyExpr, amount?)`

Returns Lua **lines** that increment a numeric column.

```ts
const lines = db.linesIncrement('interactions', 'count', 'dialogObject:getOwnName()');
```

### `.bodyCheckAndSet(table, col, successValue, keyExpr)`

Returns a complete Lua hook body that:
1. Reads the current value
2. If already `successValue`, returns `0` immediately (idempotent)
3. Otherwise sets the value and returns `0`

```ts
body: db.bodyCheckAndSet('npc_quests', 'status', 'complete', 'dialogObject:getOwnName()')
```

---

## DialogObject interface

Full TypeScript interface for `dialogObject` — the parameter passed by StarMade to every NPC hook.

Source: `org.schema.game.common.data.player.dialog.AICreatureDialogAI`

```ts
import type { DialogObject } from 'starmade-npccreator';
```

### NPC identity

| Method | Returns | Description |
|---|---|---|
| `getConverationParterName()` | `string` | NPC display name |
| `getConverationPartnerAffinity()` | `string` | NPC affinity string |
| `getConverationPartnerFactionName()` | `string` | NPC faction name |
| `getConverationPartnerOwnerName()` | `string` | NPC owner/commander name |
| `getOwnName()` | `string` | Player character name |
| `getScriptName()` | `string` | Lua script filename |

### Conversation state

| Method | Returns | Description |
|---|---|---|
| `setConversationState(name)` | `number` | Jump to named state. `0` = ok, `-1` = not found |
| `getConversationState()` | `string` | Current `entryMarking` state |

### Crew

| Method | Returns | Description |
|---|---|---|
| `isConverationPartnerInTeam()` | `boolean` | NPC already in player's crew? |
| `hireConverationPartner()` | `number` | Hire: `0` / `-2` crew full / `-3` faction mismatch |
| `unhireConverationPartner()` | `number` | Dismiss: `0` / `-1` not in crew |
| `spawnCrew(price)` | `number` | Spawn: `0` / `-1` credits / `-2` crew full |

### Items

| Method | Returns | Description |
|---|---|---|
| `giveLaserWeapon(price)` | `number` | Give laser pistol |
| `giveSniperRifle(price)` | `number` | Give sniper rifle |
| `giveRocketLauncher(price)` | `number` | Give rocket launcher |
| `giveHelmet(price)` | `number` | Give space helmet |
| `giveHealingBeam(price)` | `number` | Give healing beam |
| `givePowerSupplyBeam(price)` | `number` | Give power supply beam |
| `giveMarkerBeam(price)` | `number` | Give marker beam |
| `giveTransporterMarkerBeam(price)` | `number` | Give transporter beacon |
| `giveGrappleBeam(price)` | `number` | Give grapple beam |
| `giveTorchBeam(price)` | `number` | Give torch |
| `giveBuildProhibiter(price)` | `number` | Give build prohibiter |
| `giveFlashLight(price)` | `number` | Give flashlight |
| `giveType(typeId, count)` | `number` | Give any block type by ID |
| `giveMetaItem(metaType, subType, cost)` | `number` | Give meta item |

All give/sell methods: `0` = success, `-1` = no credits, `-2` = inventory full, `-3` = refuses.

### World

| Method | Returns | Description |
|---|---|---|
| `activateBlock(x, y, z, state)` | `number` | Set block switch state |
| `activateBlockSwitch(x, y, z)` | `number` | Toggle block switch |
| `moveTo(x, y, z)` | `number` | Move NPC to position |
| `destroyShip(uid)` | `number` | Destroy ship: `1` = done, `-1` = not found |
| `giveGravity(enabled)` | `number` | Toggle gravity: `0` / `1` already set / `-1` failed |
| `isAtBlock(x, y, z)` | `boolean` | Is player at position? |
| `callTutorial(name)` | `number` | Trigger tutorial step |

### Player entity

Accessed via `dialogObject:getEntity()`.

| Method | Returns | Description |
|---|---|---|
| `getCredits()` | `number` | Current credits |
| `setCredits(n)` | `void` | Set credits |
| `getHealth()` | `number` | Current HP |
| `getMaxHealth()` | `number` | Max HP |
| `getFactionId()` | `number` | Faction ID |
| `getCurrentSectorId()` | `number` | Current sector ID |
| `isCreativeModeEnabled()` | `boolean` | Creative mode active? |
| `getInventory()` | `InventoryProxy` | Inventory access |

### Format

| Method | Returns | Description |
|---|---|---|
| `format(text, ...args)` | `string` | Format dialog text with `%s` substitutions |
