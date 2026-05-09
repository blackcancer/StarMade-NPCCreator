# Developer Guide — StarMade NPC Creator Library

> How to use the TypeScript `DialogBuilder` / `NodeBuilder` API to generate StarMade NPC Lua scripts programmatically.

---

## Table of contents

- [Installation and setup](#installation-and-setup)
- [Core concepts](#core-concepts)
- [Building a dialog tree](#building-a-dialog-tree)
- [Reactions and branching](#reactions-and-branching)
- [Custom hooks](#custom-hooks)
- [Persistent state with SqliteState](#persistent-state-with-sqlitestate)
- [Working with HOOK_RESULT codes](#working-with-hook_result-codes)
- [Emitting Lua](#emitting-lua)
- [Low-level API: DialogNode and ScriptDefinition](#low-level-api-dialognode-and-scriptdefinition)
- [Patterns and best practices](#patterns-and-best-practices)

---

## Installation and setup

```bash
npm install starmade-npccreator
```

The library is pure TypeScript with no runtime dependencies. It generates Lua strings — it does not execute Lua or connect to any game server.

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'my_npc' })
  .greeting('Hello {name}!')
  .addChoice('Hire me', b => b.hire(50_000))
  .addChoice('Goodbye.', b => b.goBack())
  .done();

const lua = LuaEmitter.emit(script);
// Write lua to a file, send it via SSH, or log it for copy-paste.
```

---

## Core concepts

### The dialog state machine

StarMade NPC dialogs are **state machines**. Each state is a `TextEntry` node:

- It displays text to the player for a configurable duration.
- If it has a **hook** (`DialogTextEntryHookLua`), the hook runs on entry and returns an integer code.
- The code routes the player to a different node via **reactions** (`addReaction`).
- If it has no hook, it presents **choices** (`add`) the player can click.

### What the library builds

```
DialogBuilder
  → ScriptDefinition (tree of DialogNodes + HookDefinitions)
    → LuaEmitter.emit()
      → Lua string
```

`DialogBuilder` is the high-level fluent API. `ScriptDefinition` and `DialogNode` are the model. `LuaEmitter` converts the model to a Lua string.

### Hook return codes

Every hook function must return an integer. The library provides `HOOK_RESULT` constants matching the StarMade Java source:

```ts
import { HOOK_RESULT } from 'starmade-npccreator';

HOOK_RESULT.SUCCESS             //  0
HOOK_RESULT.NOT_ENOUGH_CREDITS  // -1
HOOK_RESULT.INVENTORY_FULL      // -2
HOOK_RESULT.REFUSED             // -3
HOOK_RESULT.DESTROY_SUCCESS     //  1  ← destroyShip returns 1, not 0
```

---

## Building a dialog tree

### Minimal script

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'simple_merchant' })
  .greeting("Greetings {name}! I am {partner} of {faction}.")
  .addChoice("Hire me (50 000 cr)", b => b.hire(50_000))
  .addChoice("Buy a laser (100 000 cr)", b => b.sell('laser', 100_000))
  .addChoice("Goodbye.", b => b.goBack("Safe travels!"))
  .done();

process.stdout.write(LuaEmitter.emit(script));
```

### Nested choices (sub-menus)

Use `.addChoice()` inside a node builder callback to create sub-menus:

```ts
builder.addChoice("What do you sell?", outer => {
  outer
    .addChoice("Weapons", weapons => {
      weapons
        .addChoice("Laser pistol (100 000 cr)", b => b.sell('laser', 100_000))
        .addChoice("Sniper rifle (150 000 cr)", b => b.sell('sniper', 150_000))
        .addChoice("Back.", b => b.goBack())
    })
    .addChoice("Gear", gear => {
      gear
        .addChoice("Helmet (50 000 cr)", b => b.sell('helmet', 50_000))
        .addChoice("Back.", b => b.goBack())
    })
    .addChoice("Back.", b => b.goBack())
})
```

### Conversation state markers

Tag a node with `.mark(name)` for `setConversationState()` jumps from other dialog scripts or from hooks:

```ts
outer.mark('weapon_shop')
```

Generates `entry:setEntryMarking("weapon_shop")` in Lua.

---

## Reactions and branching

Most `NodeBuilder` action methods wire reactions automatically. For example, `.hire()` creates four reaction nodes internally:

```
hired (0)           → "I'm honoured to work with you!"
not enough credits (unrelated for hire, -2 = crew full)
crew full (-2)      → "Sorry, your inventory is full!"
refused (-3)        → "I'm not doing that."
```

To customise the reaction texts, pass them as parameters:

```ts
b.hire(50_000, "Welcome to the team, Commander!")
```

For full control, use `.customHook()` with explicit `DialogNode` targets:

```ts
import { DialogNode, HOOK_RESULT } from 'starmade-npccreator';

const success  = new DialogNode('entryHired', 'Great, you are now crew!');
const crewFull = new DialogNode('entryCFull', 'My ship is full. Come back later.');
const refused  = new DialogNode('entryRef',   'I will not serve a rival faction.');

b.customHook(
  {
    funcName: 'hireHookFunc_50000',
    body: ['return dialogObject:hireConverationPartner();'],
  },
  {
    [HOOK_RESULT.SUCCESS]:            success,
    [HOOK_RESULT.CREW_FULL_OR_IN_TEAM]: crewFull,
    [HOOK_RESULT.FACTION_MISMATCH]:   refused,
  }
)
```

---

## Custom hooks

### Simple custom hook

```ts
b.customHook(
  {
    funcName: 'openGateHook',
    body: [
      'local ok = dialogObject:activateBlock(10, 0, 5, true)',
      'if ok == 0 then return 0 end',
      'return -1',
    ],
  },
  {
    0:  new DialogNode('entryGateOpen', 'The gate is now open.'),
    [-1]: new DialogNode('entryGateFail', 'Gate could not be opened.'),
  }
)
```

### Using the Hooks factory directly

```ts
import { Hooks, HOOK_RESULT } from 'starmade-npccreator';

b.customHook(
  Hooks.destroyShip('ENTITY_SHIP_hostile_01'),
  {
    [HOOK_RESULT.DESTROY_SUCCESS]: new DialogNode('entryDone', 'Target destroyed!'),
    [HOOK_RESULT.NOT_FOUND]:       new DialogNode('entryMiss', 'Target not found.'),
  }
)
```

### Multi-code hook (custom quest logic)

```ts
b.customHook(
  {
    funcName: 'questStatusCheck',
    body: [
      'local player = dialogObject:getOwnName()',
      'local val = (_dbGet("SELECT status FROM npc_quests WHERE player=?", player) or "none")',
      'if val == "complete" then return 2 end',
      'if val == "active"   then return 1 end',
      'return 0',
    ],
  },
  {
    0: new DialogNode('entryOffer',    'Will you take this mission?'),
    1: new DialogNode('entryActive',   'You already have this quest active.'),
    2: new DialogNode('entryComplete', 'You have already completed this mission.'),
  }
)
```

---

## Persistent state with SqliteState

StarMade ships with HSQLDB (`lib/hsqldb.jar`) — no external JDBC driver is needed.

### Setup

```ts
import { DialogBuilder, LuaEmitter, SqliteState } from 'starmade-npccreator';

const db = new SqliteState({
  dbPath: './server-database/world1/npc_data/npc_state',
  // driverClass defaults to 'org.hsqldb.jdbc.JDBCDriver'
  // connVar defaults to '_npcDb'
});

db.defineTable('npc_quests', {
  player:   'VARCHAR(255) NOT NULL',
  quest_id: 'VARCHAR(255) NOT NULL',
  status:   "VARCHAR(32) NOT NULL DEFAULT 'none'",
  step:     'INTEGER NOT NULL DEFAULT 0',
});

const script = new DialogBuilder({
  name:     'quest_npc',
  db,                         // injects db.emitInit() as preamble automatically
  description: 'Quest giver',
})
```

### Reading state in hook bodies

Use `db.exprGet()` to embed a DB read inside a hook body:

```ts
b.customHook(
  {
    funcName: 'checkQuestHook',
    body: [
      'local player = dialogObject:getOwnName()',
      `local status = ${db.exprGet('npc_quests', 'status', 'player', '"none"')}`,
      'if status == "complete" then return 1 end',
      'if status == "active"   then return 2 end',
      'return 0',
    ],
  },
  { /* reactions */ }
)
```

### Writing state in hook bodies

Use `db.linesSet()` to embed DB writes:

```ts
body: [
  'local player = dialogObject:getOwnName()',
  ...db.linesSet('npc_quests', 'status', '"active"', 'player'),
  ...db.linesSet('npc_quests', 'step', '1', 'player'),
  'return 0',
]
```

### One-time interactions

`db.bodyCheckAndSet()` generates a complete idempotent hook body — reads, checks, sets:

```ts
body: db.bodyCheckAndSet('npc_quests', 'status', 'complete', 'dialogObject:getOwnName()')
```

### Incrementing counters

```ts
body: [
  'local player = dialogObject:getOwnName()',
  ...db.linesIncrement('interactions', 'count', 'player'),
  'return 0',
]
```

### Raw preamble (without db option)

If you prefer managing the DB init yourself:

```ts
const script = new DialogBuilder({
  name:     'my_npc',
  preamble: [db.emitInit()],
})
```

---

## Working with HOOK_RESULT codes

Always use `HOOK_RESULT` constants instead of magic numbers. This protects against StarMade API quirks:

```ts
import { HOOK_RESULT } from 'starmade-npccreator';

// WRONG — destroyShip returns 1 on success, not 0
node.addReaction(0, successNode)

// CORRECT
node.addReaction(HOOK_RESULT.DESTROY_SUCCESS, successNode)  // 1
node.addReaction(HOOK_RESULT.NOT_FOUND, failNode)            // -1
```

Full list of confirmed codes — see [API.md → HOOK_RESULT](./API.md#hook_result).

---

## Emitting Lua

```ts
import { LuaEmitter } from 'starmade-npccreator';

const lua = LuaEmitter.emit(script);

// Write to file
import { writeFileSync } from 'fs';
writeFileSync('my_npc.lua', lua, 'utf8');
```

### Generated Lua structure

```lua
--[[
  NPC dialog script: my_npc
  Generated by StarMade-NPCCreator
--]]

-- (preamble / HSQLDB init if db was provided)

-- Hook functions
function hireHookFunc_50000(dialogObject)
  return dialogObject:hireConverationPartner();
end

function create(dialogObject, bindings)

  local dSys    = luajava.newInstance("...DialogSystem", dialogObject)
  local factory = dSys:getFactory(bindings)

  -- Hook instances
  local hook_hireHookFunc_50000 = luajava.newInstance("...DialogTextEntryHookLua", "hireHookFunc_50000", {})

  -- Dialog nodes
  local entry        = luajava.newInstance("...TextEntry", dialogObject:format("Hello!"), 2000)
  local entryHired   = luajava.newInstance("...TextEntry", dialogObject:format("Welcome aboard!"), 2000)
  -- …

  -- Root entry
  factory:setRootEntry(entry)

  -- Attach hooks
  entry:setHook(hook_hireHookFunc_50000)

  -- Hook reactions
  entry:addReaction(hook_hireHookFunc_50000, 0, entryHired)

  -- Player choices
  entry:add(entryHired, dialogObject:format("Hire me"))

  dSys:add(factory)
  return dSys

end
```

---

## Low-level API: DialogNode and ScriptDefinition

For advanced cases where the `DialogBuilder` fluent API is too constraining, build the tree directly.

### Building nodes manually

```ts
import { DialogNode, ScriptDefinition, LuaEmitter } from 'starmade-npccreator';

const script = new ScriptDefinition({ name: 'manual_npc' });

const root = new DialogNode('entry', "Hello {name}! What can I do for you?");

const hireNode    = new DialogNode('entryHire',    'Please wait...');
const successNode = new DialogNode('entrySuccess', 'Welcome aboard!');
const failNode    = new DialogNode('entryFail',    'Could not hire you.');

const hireHook = script.registerHook({
  funcName: 'hireHookFunc_50000',
  body: ['return dialogObject:hireConverationPartner();'],
});

hireNode.setHook(hireHook);
hireNode.addReaction(0,  successNode);
hireNode.addReaction(-2, failNode);
hireNode.addReaction(-3, failNode);

root.addChoice('Hire me (50 000 cr)', hireNode);
root.addChoice('Goodbye.',             new DialogNode('entryBye', 'Safe travels!'));

script.root = root;

const lua = LuaEmitter.emit(script);
```

### Shared nodes (back-links)

```ts
// entryRoot is reused as the "go back" target for sub-menus
const entryRoot = new DialogNode('entry', 'What else do you need?');
entryRoot.addChoice('Back to top', entryRoot); // self-reference allowed
```

The emitter deduplicates nodes by `varName` during the DFS walk.

---

## Patterns and best practices

### Pattern: credit-gated action

```ts
b.customHook(
  {
    funcName: 'creditGate5000',
    body: [
      'local ps = dialogObject:getEntity()',
      'if ps == nil then return -1 end',
      'if ps:getCredits() < 5000 then return -1 end',
      'ps:setCredits(ps:getCredits() - 5000)',
      'return 0',
    ],
  },
  {
    0:   new DialogNode('entryAccess', 'Gate opened. Access granted.'),
    [-1]: new DialogNode('entryDeny',  'You need 5 000 credits for access.'),
  }
)
```

### Pattern: one-time quest flag (with SqliteState)

```ts
body: [
  'local player = dialogObject:getOwnName()',
  `local done = ${db.exprGet('flags', 'value', 'player', '"0"')}`,
  'if done == "1" then return 1 end',
  ...db.linesSet('flags', 'value', '"1"', 'player'),
  'return 0',
]
// Reactions: 0 = first time, 1 = already done
```

### Pattern: daily cooldown (raw Lua in preamble)

```ts
const preamble = [
  db.emitInit(),
  '',
  'local function _isCooldownExpired(player, action, durationMs)',
  '  local now = luajava.bindClass("java.lang.System").currentTimeMillis()',
  `  local last = ${db.exprGet('cooldowns', 'last_time', 'player', '0')}`,
  '  return (now - (tonumber(last) or 0)) >= durationMs',
  'end',
];
```

### Pattern: custom hook with multiple result codes

```ts
b.customHook(
  {
    funcName: 'repCheck',
    body: [
      'local player = dialogObject:getOwnName()',
      `local rep = ${db.exprGet('reputation', 'score', 'player', '0')}`,
      'rep = tonumber(rep) or 0',
      'if rep >= 200 then return 2 end',
      'if rep >= 50  then return 1 end',
      'return 0',
    ],
  },
  {
    0: new DialogNode('entryStranger', 'You are unknown to us.'),
    1: new DialogNode('entryMember',   'Welcome, member.'),
    2: new DialogNode('entryCommander','Welcome, Commander. The vault is open.'),
  }
)
```

### Pattern: chaining actions

Actions that always succeed (return `0`) can be chained by nesting builders:

```ts
b.addChoice("Pay and open gate", outer => {
  outer.customHook(
    {
      funcName: 'deductAndOpen',
      body: [
        'local ps = dialogObject:getEntity()',
        'if ps:getCredits() < 5000 then return -1 end',
        'ps:setCredits(ps:getCredits() - 5000)',
        'dialogObject:activateBlock(10, 0, 5, true)',
        'return 0',
      ],
    },
    {
      0:   outer._node, // stay on same node after action
      [-1]: new DialogNode('entryNoCr', "You don't have enough credits."),
    }
  )
})
```

### Pattern: generate and write to file (Node.js)

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';
import { writeFileSync, mkdirSync } from 'fs';

function buildScript(): string {
  const script = new DialogBuilder({ name: 'trading_npc' })
    .greeting('Hello {name}!')
    .addChoice('Hire me', b => b.hire(50_000))
    .addChoice('Goodbye.', b => b.goBack())
    .done();

  return LuaEmitter.emit(script);
}

mkdirSync('dist', { recursive: true });
writeFileSync('dist/trading_npc.lua', buildScript(), 'utf8');
console.log('Generated: dist/trading_npc.lua');
```

### Pattern: building scripts from data

```ts
interface ShopItem {
  label: string;
  item:  Parameters<NodeBuilder['sell']>[0];
  price: number;
}

function buildShopScript(name: string, greeting: string, items: ShopItem[]): string {
  const builder = new DialogBuilder({ name }).greeting(greeting);

  for (const { label, item, price } of items) {
    builder.addChoice(label, b => b.sell(item, price));
  }
  builder.addChoice('Goodbye.', b => b.goBack());

  return LuaEmitter.emit(builder.done());
}

const lua = buildShopScript(
  'weapon_shop',
  'Welcome to the weapon shop, {name}!',
  [
    { label: 'Buy laser pistol (100 000 cr)', item: 'laser',  price: 100_000 },
    { label: 'Buy sniper rifle (150 000 cr)', item: 'sniper', price: 150_000 },
    { label: 'Buy helmet (50 000 cr)',         item: 'helmet', price:  50_000 },
  ]
);
```
