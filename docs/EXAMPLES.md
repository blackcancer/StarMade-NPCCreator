# Examples — StarMade NPC Creator Library

> Worked examples using the TypeScript `DialogBuilder` / `NodeBuilder` API.

All examples produce a Lua string via `LuaEmitter.emit()`. Write it to a file,  
copy-paste it, or stream it to the server.

---

## Table of contents

- [1 — Minimal NPC](#1--minimal-npc)
- [2 — Merchant with weapons and gear](#2--merchant-with-weapons-and-gear)
- [3 — Crew recruiter with confirm](#3--crew-recruiter-with-confirm)
- [4 — Credit-gated gate guard](#4--credit-gated-gate-guard)
- [5 — Inventory quest (take item, give reward)](#5--inventory-quest-take-item-give-reward)
- [6 — Daily reward with SqliteState cooldown](#6--daily-reward-with-sqlitestate-cooldown)
- [7 — Multi-code reputation check](#7--multi-code-reputation-check)
- [8 — Quest tracker (multi-step, SqliteState)](#8--quest-tracker-multi-step-sqlitestate)
- [9 — Dynamic shop from data](#9--dynamic-shop-from-data)
- [10 — Full faction hub (all features)](#10--full-faction-hub-all-features)

---

## 1 — Minimal NPC

The smallest valid script: one greeting, one hire, one goodbye.

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'minimal_npc' })
  .greeting("Hello {name}! I am {partner} of {faction}.")
  .addChoice("Hire me (50 000 cr)", b => b.hire(50_000))
  .addChoice("Goodbye.",            b => b.goBack("Safe travels!"))
  .done();

process.stdout.write(LuaEmitter.emit(script));
```

**Generated structure:**

```
entry → "Hello …"
  [Hire me] → hireHookFunc_50000
                0  → "I'm honoured!"
                -2 → "Crew full."
                -3 → "I won't."
  [Goodbye] → "Safe travels!"
```

---

## 2 — Merchant with weapons and gear

Nested sub-menus for weapons and gear categories.

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'weapon_merchant' })
  .greeting("Welcome to my shop, {name}! I carry fine equipment.")
  .addChoice("Browse weapons", outer => {
    outer
      .addChoice("Laser pistol (100 000 cr)",    b => b.sell('laser',  100_000))
      .addChoice("Sniper rifle (150 000 cr)",     b => b.sell('sniper', 150_000))
      .addChoice("Rocket launcher (200 000 cr)", b => b.sell('rocket', 200_000))
      .addChoice("Back.",                         b => b.goBack())
  })
  .addChoice("Browse gear", outer => {
    outer
      .addChoice("Space helmet (50 000 cr)",      b => b.sell('helmet',  50_000))
      .addChoice("Healing beam (75 000 cr)",      b => b.sell('healing', 75_000))
      .addChoice("Back.",                         b => b.goBack())
  })
  .addChoice("Give me ore (5× free)", b => b.giveType(424, 5))
  .addChoice("Goodbye.",              b => b.goBack("Come back soon!"))
  .done();

const lua = LuaEmitter.emit(script);
```

---

## 3 — Crew recruiter with confirm

A crew management NPC: hire, dismiss (with confirmation), spawn.

```ts
import { DialogBuilder, LuaEmitter, DialogNode, HOOK_RESULT } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'crew_recruiter' })
  .greeting("Greetings {name}! I'm {partner}, crew recruitment officer.")
  .addChoice("Hire you (50 000 cr)", b => {
    b.hire(50_000, "Welcome aboard, Commander!")
  })
  .addChoice("Dismiss you", b => {
    // Confirm dialog before dismissal
    const yesNode = new DialogNode('entryDismissed', 'Dismissed. Farewell.');
    const noNode  = new DialogNode('entryKept',      'As you wish, I will stay.');

    b.customHook(
      {
        funcName: 'confirmDismiss',
        body: [
          'return 0', // always show the confirm prompt (0 = YES branch, -1 = NO)
        ],
      },
      { 0: yesNode, [-1]: noNode }
    )
    yesNode.setHook({ funcName: 'dismissHook', body: ['return dialogObject:unhireConverationPartner();'] })
    yesNode.addReaction(HOOK_RESULT.SUCCESS,   new DialogNode('entryDone', 'You have been dismissed.'))
    yesNode.addReaction(HOOK_RESULT.NOT_ENOUGH_CREDITS, new DialogNode('entryNotCrew', 'You are not in my crew.'))
  })
  .addChoice("Spawn new crew (25 000 cr)", b => {
    b.spawnCrew(25_000, "New crew member dispatched!")
  })
  .addChoice("Goodbye.", b => b.goBack())
  .done();
```

> **Tip:** For a simpler confirm pattern without raw nodes, use two nested choices: `"Are you sure?" → Yes / No`.

---

## 4 — Credit-gated gate guard

Opens a block switch at coordinates (10, 0, 5) when the player pays 5 000 credits.

```ts
import { DialogBuilder, LuaEmitter, DialogNode } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'toll_gate' })
  .greeting("Halt! Access to this area costs 5 000 credits.")
  .addChoice("Pay the toll (5 000 cr)", b => {
    b.customHook(
      {
        funcName: 'tollPayHook',
        body: [
          'local ps = dialogObject:getEntity()',
          'if ps == nil or ps:getCredits() < 5000 then return -1 end',
          'ps:setCredits(ps:getCredits() - 5000)',
          'dialogObject:activateBlock(10, 0, 5, true)',
          'return 0',
        ],
      },
      {
        0:   new DialogNode('entryOpen',    'Gate open. You may proceed.'),
        [-1]: new DialogNode('entryDenied', 'Insufficient funds. The toll is 5 000 credits.'),
      }
    )
  })
  .addChoice("Where is the gate?", b => {
    b.customHook(
      { funcName: 'showGate', body: ['return 0'] },
      { 0: new DialogNode('entryInfo', 'The gate is at coordinates 10, 0, 5.') }
    )
  })
  .addChoice("Farewell.", b => b.goBack())
  .done();
```

---

## 5 — Inventory quest (take item, give reward)

Take 5 ore from the player's inventory and give 10 000 credits in return.

```ts
import { DialogBuilder, LuaEmitter, DialogNode } from 'starmade-npccreator';

const FATANIUM_ORE_ID = 424;

const script = new DialogBuilder({ name: 'ore_collector' })
  .greeting("Greetings {name}! Do you have ore samples for me?")
  .addChoice("Here are 5 ore samples.", b => {
    b.customHook(
      {
        funcName: 'takeOreHook',
        body: [
          `local inv = dialogObject:getEntity():getInventory()`,
          `if inv == nil then return -1 end`,
          `local total = 0`,
          `for i = 0, inv:getActiveSlotsMax() - 1 do`,
          `  if inv:getType(i) == ${FATANIUM_ORE_ID} then`,
          `    total = total + inv:getCount(i, ${FATANIUM_ORE_ID})`,
          `  end`,
          `end`,
          `if total < 5 then return -1 end`,
          `local rem = 5`,
          `for i = 0, inv:getActiveSlotsMax() - 1 do`,
          `  if rem <= 0 then break end`,
          `  if inv:getType(i) == ${FATANIUM_ORE_ID} then`,
          `    local c = inv:getCount(i, ${FATANIUM_ORE_ID})`,
          `    if c <= rem then`,
          `      inv:decrementOrUpdateSlot(i, ${FATANIUM_ORE_ID}, c, true)`,
          `      rem = rem - c`,
          `    else`,
          `      inv:decrementOrUpdateSlot(i, ${FATANIUM_ORE_ID}, rem, true)`,
          `      rem = 0`,
          `    end`,
          `  end`,
          `end`,
          `local ps = dialogObject:getEntity()`,
          `if ps ~= nil then ps:setCredits(ps:getCredits() + 10000) end`,
          `return 0`,
        ],
      },
      {
        0:   new DialogNode('entryThank', 'Thank you! Here are 10 000 credits.'),
        [-1]: new DialogNode('entryNeed',  'You need 5× Fatanium Ore (item type 424).'),
      }
    )
  })
  .addChoice("I need more time.", b => {
    b.customHook(
      { funcName: 'needMoreTime', body: ['return 0'] },
      { 0: new DialogNode('entryWait', 'Bring me 5× Fatanium Ore (type 424) when you are ready.') }
    )
  })
  .addChoice("Goodbye.", b => b.goBack())
  .done();
```

---

## 6 — Daily reward with SqliteState cooldown

Uses HSQLDB to gate a daily credit bonus behind a 24-hour cooldown.

```ts
import { DialogBuilder, LuaEmitter, SqliteState, DialogNode } from 'starmade-npccreator';

const db = new SqliteState({
  dbPath: './server-database/world1/npc_data/npc_state',
});

db.defineTable('daily_bonus', {
  player:     'VARCHAR(255) NOT NULL PRIMARY KEY',
  last_claim: 'BIGINT NOT NULL DEFAULT 0',
});

const script = new DialogBuilder({
  name: 'daily_npc',
  db,
  description: 'Daily bonus NPC',
})
  .greeting("Hello {name}! Come back every day for your loyalty bonus.")
  .addChoice("Claim my daily bonus", b => {
    b.customHook(
      {
        funcName: 'dailyBonusHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local now    = luajava.bindClass("java.lang.System").currentTimeMillis()`,
          `local last   = ${db.exprGet('daily_bonus', 'last_claim', 'player', '0')}`,
          `last = tonumber(last) or 0`,
          `if (now - last) < 86400000 then return -1 end`,  // 24 h cooldown
          ...db.linesSet('daily_bonus', 'last_claim', 'now', 'player'),
          `local ps = dialogObject:getEntity()`,
          `if ps ~= nil then ps:setCredits(ps:getCredits() + 10000) end`,
          `return 0`,
        ],
      },
      {
        0:   new DialogNode('entryBonus',  'Bonus received! +10 000 credits.'),
        [-1]: new DialogNode('entryWait',  'You have already claimed today. Come back tomorrow!'),
      }
    )
  })
  .addChoice("Goodbye.", b => b.goBack())
  .done();

const lua = LuaEmitter.emit(script);
```

---

## 7 — Multi-code reputation check

Returns a different branch based on the player's reputation level.

```ts
import { DialogBuilder, LuaEmitter, SqliteState, DialogNode } from 'starmade-npccreator';

const db = new SqliteState({ dbPath: './server-database/world1/npc_data/npc_state' });

db.defineTable('reputation', {
  player: 'VARCHAR(255) NOT NULL PRIMARY KEY',
  score:  'INTEGER NOT NULL DEFAULT 0',
});

const script = new DialogBuilder({ name: 'guildmaster', db })
  .greeting("Welcome, {name}. Your standing determines what I offer you.")
  .addChoice("What can you offer me?", b => {
    b.customHook(
      {
        funcName: 'repBranchHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local rep    = ${db.exprGet('reputation', 'score', 'player', '0')}`,
          `rep = tonumber(rep) or 0`,
          `if rep >= 200 then return 2 end`,
          `if rep >= 50  then return 1 end`,
          `return 0`,
        ],
      },
      {
        0: new DialogNode('entryStranger',
              "You are unknown to us. Complete public missions to earn reputation."),
        1: new DialogNode('entryMember',
              "Welcome, member. I can offer you daily missions and basic supplies."),
        2: new DialogNode('entryCommander',
              "Welcome, Commander. The full arsenal and the faction vault are open to you."),
      }
    )
  })
  .addChoice("Goodbye.", b => b.goBack())
  .done();
```

---

## 8 — Quest tracker (multi-step, SqliteState)

A quest with offer, step advancement, and completion — all persistent via HSQLDB.

```ts
import { DialogBuilder, LuaEmitter, SqliteState, DialogNode } from 'starmade-npccreator';

const db = new SqliteState({ dbPath: './server-database/world1/npc_data/npc_state' });

db.defineTable('npc_quests', {
  player:   'VARCHAR(255) NOT NULL',
  quest_id: 'VARCHAR(255) NOT NULL',
  status:   "VARCHAR(32) NOT NULL DEFAULT 'none'",
  step:     'INTEGER NOT NULL DEFAULT 0',
});

const QUEST_ID = 'ore_delivery';

const statusExpr = (player: string) =>
  db.exprGet('npc_quests', 'status', player, '"none"');
const stepExpr = (player: string) =>
  db.exprGet('npc_quests', 'step',   player, '0');

const script = new DialogBuilder({ name: 'quest_giver', db })
  .greeting("Greetings {name}! I need ore delivered to sector 7.")
  .addChoice("Tell me about the mission.", b => {
    b.customHook(
      {
        funcName: 'offerQuestHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local status = ${db.exprGet('npc_quests', 'status', 'player', '"none"')}`,
          `if status == "complete" then return 2 end`,
          `if status == "active"   then return 1 end`,
          `return 0`,
        ],
      },
      {
        0: new DialogNode('entryOffer', 'Deliver 3 crates to sector 7. Reward: 25 000 credits. Accept?'),
        1: new DialogNode('entryActive', 'You already have this mission. Deliver the crates to sector 7!'),
        2: new DialogNode('entryDone', 'You have already completed this mission. Thank you!'),
      }
    )
  })
  .addChoice("Accept the mission.", b => {
    b.customHook(
      {
        funcName: 'acceptQuestHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local status = ${db.exprGet('npc_quests', 'status', 'player', '"none"')}`,
          `if status ~= "none" then return -1 end`,
          `_dbExec("INSERT INTO npc_quests(player,quest_id,status,step) VALUES(?,?,?,?)",`,
          `        player, "${QUEST_ID}", "active", 1)`,
          `return 0`,
        ],
      },
      {
        0:   new DialogNode('entryAccepted', 'Great! Collect the crates and fly to sector 7.'),
        [-1]: new DialogNode('entryAlready',  'You already have this mission active.'),
      }
    )
  })
  .addChoice("I have delivered the crates.", b => {
    b.customHook(
      {
        funcName: 'completeQuestHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local status = ${db.exprGet('npc_quests', 'status', 'player', '"none"')}`,
          `local step   = ${db.exprGet('npc_quests', 'step',   'player', '0')}`,
          `step = tonumber(step) or 0`,
          `if status ~= "active" then return -1 end`,
          `if step < 2 then return -2 end`,  // not yet advanced to delivery step
          `_dbExec("UPDATE npc_quests SET status='complete' WHERE player=? AND quest_id=?",`,
          `        player, "${QUEST_ID}")`,
          `local ps = dialogObject:getEntity()`,
          `if ps ~= nil then ps:setCredits(ps:getCredits() + 25000) end`,
          `return 0`,
        ],
      },
      {
        0:   new DialogNode('entryReward',  'Excellent! Here are your 25 000 credits.'),
        [-1]: new DialogNode('entryNoQuest','You do not have an active mission.'),
        [-2]: new DialogNode('entryNotYet', 'The crates have not been delivered yet. Fly to sector 7 first.'),
      }
    )
  })
  .addChoice("Goodbye.", b => b.goBack())
  .done();
```

---

## 9 — Dynamic shop from data

Build scripts from configuration arrays — useful for tooling or automated generation.

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';
import type { NodeBuilder } from 'starmade-npccreator';

type WeaponKey = Parameters<NodeBuilder['sell']>[0];

interface ShopItem {
  label: string;
  item:  WeaponKey;
  price: number;
}

interface ShopConfig {
  scriptName: string;
  greeting:   string;
  items:      ShopItem[];
}

function buildShopScript(config: ShopConfig): string {
  const builder = new DialogBuilder({ name: config.scriptName })
    .greeting(config.greeting);

  for (const { label, item, price } of config.items) {
    builder.addChoice(label, b => b.sell(item, price));
  }
  builder.addChoice('Goodbye.', b => b.goBack('Come back soon!'));

  return LuaEmitter.emit(builder.done());
}

// Usage
const lua = buildShopScript({
  scriptName: 'weapon_shop_alpha',
  greeting:   'Welcome to Alpha Station Armory, {name}!',
  items: [
    { label: 'Laser pistol (100 000 cr)',    item: 'laser',  price: 100_000 },
    { label: 'Sniper rifle (150 000 cr)',     item: 'sniper', price: 150_000 },
    { label: 'Rocket launcher (200 000 cr)', item: 'rocket', price: 200_000 },
    { label: 'Space helmet (50 000 cr)',      item: 'helmet', price:  50_000 },
  ],
});

import { writeFileSync } from 'fs';
writeFileSync('weapon_shop_alpha.lua', lua, 'utf8');
```

---

## 10 — Full faction hub (all features)

A comprehensive faction hub NPC combining: hire, sell, giveType, sendMessage, SqliteState cooldown, reputation check, quest with multi-step tracking, meta item in vault, and conversation state.

```ts
import {
  DialogBuilder, LuaEmitter, SqliteState, DialogNode, Hooks, HOOK_RESULT
} from 'starmade-npccreator';
import { writeFileSync } from 'fs';

// ── Database setup ────────────────────────────────────────────────────────────
const db = new SqliteState({ dbPath: './server-database/world1/npc_data/npc_state' });

db.defineTable('npc_quests', {
  player:   'VARCHAR(255) NOT NULL',
  quest_id: 'VARCHAR(255) NOT NULL',
  status:   "VARCHAR(32) NOT NULL DEFAULT 'none'",
  step:     'INTEGER NOT NULL DEFAULT 0',
});
db.defineTable('daily_bonus', {
  player: 'VARCHAR(255) NOT NULL PRIMARY KEY',
  last:   'BIGINT NOT NULL DEFAULT 0',
});
db.defineTable('reputation', {
  player: 'VARCHAR(255) NOT NULL PRIMARY KEY',
  score:  'INTEGER NOT NULL DEFAULT 0',
});

// ── Script ────────────────────────────────────────────────────────────────────
const script = new DialogBuilder({
  name:        'guild_faction_hub',
  description: 'Guild faction hub — demo of all NodeBuilder features',
  db,
})
  .greeting("Welcome, {name}. I am {partner}, hub officer for {faction}.")

  // ── Hire ─────────────────────────────────────────────────────────────────
  .addChoice("Hire you (50 000 cr)", b => {
    b.hire(50_000, "Welcome aboard, Commander! You now have guild crew.")
  })

  // ── Sell items ───────────────────────────────────────────────────────────
  .addChoice("Browse the armory", outer => {
    outer
      .addChoice("Laser pistol (100 000 cr)", b => b.sell('laser', 100_000))
      .addChoice("Sniper rifle (200 000 cr)", b => b.sell('sniper', 200_000))
      .addChoice("Free ore sample",           b => b.giveType(424, 1))
      .addChoice("Back.",                     b => b.goBack())
  })

  // ── Daily bonus ──────────────────────────────────────────────────────────
  .addChoice("[Daily] Collect bonus", b => {
    b.customHook(
      {
        funcName: 'dailyBonusHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local now    = luajava.bindClass("java.lang.System").currentTimeMillis()`,
          `local last   = ${db.exprGet('daily_bonus', 'last', 'player', '0')}`,
          `if (now - (tonumber(last) or 0)) < 86400000 then return -1 end`,
          ...db.linesSet('daily_bonus', 'last', 'now', 'player'),
          `local ps = dialogObject:getEntity()`,
          `if ps ~= nil then ps:setCredits(ps:getCredits() + 10000) end`,
          `return 0`,
        ],
      },
      {
        0:   new DialogNode('entryBonus', 'Daily bonus: +10 000 credits!'),
        [-1]: new DialogNode('entryWait',  'Already claimed. Come back in 24 hours.'),
      }
    )
  })

  // ── Quest ────────────────────────────────────────────────────────────────
  .addChoice("The ore survey mission", b => {
    b.customHook(
      {
        funcName: 'oreQuestHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local s = ${db.exprGet('npc_quests', 'status', 'player', '"none"')}`,
          `local t = ${db.exprGet('npc_quests', 'step',   'player', '0')}`,
          `t = tonumber(t) or 0`,
          `if s == "complete" then return 3 end`,
          `if s == "active" and t >= 2 then return 2 end`,
          `if s == "active" then return 1 end`,
          `_dbExec("INSERT INTO npc_quests(player,quest_id,status,step) VALUES(?,?,?,?)",`,
          `        player, "ore_survey", "active", 1)`,
          `dialogObject:setConversationState("on_ore_survey")`,
          `return 0`,
        ],
      },
      {
        0: new DialogNode('entryQuestAccepted', 'Mission started! Fly to sector 12, scan the ore field, then return.'),
        1: new DialogNode('entryQuestActive',   'You are on the survey mission. Go scan sector 12!'),
        2: (() => {
          // Complete and reward
          const node = new DialogNode('entryQuestComplete', '...');
          node.setHook(script.registerHook({
            funcName: 'completeOreHook',
            body: [
              `local player = dialogObject:getOwnName()`,
              `_dbExec("UPDATE npc_quests SET status='complete' WHERE player=? AND quest_id=?",`,
              `        player, "ore_survey")`,
              `local ps = dialogObject:getEntity()`,
              `if ps ~= nil then ps:setCredits(ps:getCredits() + 15000) end`,
              `dialogObject:setConversationState("none")`,
              `return 0`,
            ],
          }));
          node.addReaction(0, new DialogNode('entryQuestDone', 'Survey complete! +15 000 credits. Well done!'));
          return node;
        })(),
        3: new DialogNode('entryQuestAlreadyDone', 'You have already completed the ore survey. Thank you!'),
      }
    )
  })

  // ── Vault (reputation-gated + meta item) ─────────────────────────────────
  .addChoice("Access the vault", b => {
    b.customHook(
      {
        funcName: 'vaultGateHook',
        body: [
          `local player = dialogObject:getOwnName()`,
          `local rep    = ${db.exprGet('reputation', 'score', 'player', '0')}`,
          `rep = tonumber(rep) or 0`,
          `if rep < 200 then return -1 end`,
          `return 0`,
        ],
      },
      {
        0: (() => {
          const vaultNode = new DialogNode('entryVault', 'The vault is open to you, Commander.');
          vaultNode.addChoice('Buy Meta Blueprint (1 000 000 cr)',
            (() => {
              const buyNode = new DialogNode('entryMetaBuy', 'Please wait...');
              buyNode.setHook(script.registerHook(
                Hooks.giveMetaItem('SHIP', 0, 1_000_000)
              ));
              buyNode.addReaction(HOOK_RESULT.SUCCESS,
                new DialogNode('entryMetaOk', 'Blueprint acquired!'));
              buyNode.addReaction(HOOK_RESULT.META_NO_CREDITS,
                new DialogNode('entryMetaNoCr', 'You need 1 000 000 credits.'));
              buyNode.addReaction(HOOK_RESULT.META_INV_FULL,
                new DialogNode('entryMetaFull', 'Your inventory is full.'));
              return buyNode;
            })()
          );
          vaultNode.addChoice('Leave vault.', new DialogNode('entryVaultBack', "Come back when you're ready."));
          return vaultNode;
        })(),
        [-1]: new DialogNode('entryVaultDenied',
          'The vault requires 200 reputation. You have not yet proven yourself.'),
      }
    )
  })

  // ── World state event notification ────────────────────────────────────────
  .addChoice("Send sector alert", b => {
    b.sendMessage("WARNING: Sector 7 is under siege! All ships report to dock immediately.", 'warn')
  })

  // ── Activate gate ─────────────────────────────────────────────────────────
  .addChoice("Open the supply gate", b => {
    b.activateBlock(10, 0, 5, true)
  })

  // ── Position check ────────────────────────────────────────────────────────
  .addChoice("Am I at the marker?", b => {
    b.isAtBlock(10, 0, 5, "You are at the marker!", "You are not at the marker yet.")
  })

  .addChoice("Goodbye.", b => b.goBack("Safe travels, Commander!"))

  .done();

const lua = LuaEmitter.emit(script);
writeFileSync('guild_faction_hub.lua', lua, 'utf8');
console.log(`Generated: guild_faction_hub.lua (${lua.split('\n').length} lines)`);
```
