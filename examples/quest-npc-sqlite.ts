/**
 * @fileoverview Advanced quest NPC with SQLite state
 *
 * Demonstrates persistent quest tracking:
 * - The NPC remembers how many times a player has talked to them.
 * - A one-time quest gives a reward only on the first visit.
 * - A recurring interaction counts visits and changes dialogue.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import fs from 'node:fs';
import { DialogBuilder, LuaEmitter, SqliteState, Hooks, HOOK_RESULT } from '../src/index.js';

// 1. Set up the SQLite state module
const db = new SqliteState({
  dbPath: '/StarMade/server-database/npc_state.db',
});

db.defineTable('visits', {
  player:    'TEXT PRIMARY KEY',
  count:     'INTEGER DEFAULT 0',
});
db.defineTable('quests', {
  player:    'TEXT PRIMARY KEY',
  starter_done: 'INTEGER DEFAULT 0',
  reward_claimed: 'INTEGER DEFAULT 0',
});

// 2. Define custom hooks that use the DB
const countVisitsHook = Hooks.custom('countVisitsHook', [
  'local player = dialogObject:getOwnName()',
  ...(db.linesIncrement('visits', 'count', 'player')),
  'return 0',
]);

const checkQuestDoneHook = Hooks.custom('checkQuestDoneHook', [
  'local player = dialogObject:getOwnName()',
  `local done = ${db.exprGet('quests', 'starter_done', 'player', '"0"')}`,
  'if done == "1" then return 0 end',
  'return -1',
]);

const claimRewardHook = Hooks.custom('claimRewardHook', [
  'local player = dialogObject:getOwnName()',
  `local claimed = ${db.exprGet('quests', 'reward_claimed', 'player', '"0"')}`,
  'if claimed == "1" then return -1 end',
  ...db.linesSet('quests', 'reward_claimed', '"1"', 'player'),
  // Give 10 Sertise Crystals (block type 283) as reward
  'local res = dialogObject:giveType(283, 10)',
  'return res',
]);

const markQuestStartedHook = Hooks.custom('markQuestStartedHook', [
  'local player = dialogObject:getOwnName()',
  ...db.linesSet('quests', 'starter_done', '"1"', 'player'),
  'return 0',
]);

// 3. Build the dialog
const script = new DialogBuilder({
  name: 'advanced-quest-npc',
  description: 'Quest NPC with persistent SQLite state',
  db,
})
  .greeting('Welcome, traveller {name}.\n\nI have been waiting for someone like you.')
  .addChoice('Tell me about your quest.', b => {
    b.customHook(countVisitsHook, {
      [HOOK_RESULT.SUCCESS]: (() => {
        // This pattern requires manual wiring — use the low-level API
        // for complex multi-node reactions; this is a simplified demo
        return { varName: 'questInfoNode', text: 'Good. I need you to...' } as any;
      })(),
    });
  })
  .addChoice('I completed your mission!', b => {
    b.customHook(checkQuestDoneHook, {
      [HOOK_RESULT.SUCCESS]:            { varName: 'claimNode', text: 'Excellent! Let me give you your reward.' } as any,
      [HOOK_RESULT.NOT_ENOUGH_CREDITS]: { varName: 'notDoneNode', text: 'You haven\'t finished yet!' } as any,
    });
  })
  .addChoice('Goodbye.')
  .build();

// Register extra hooks
script.registerHook(claimRewardHook);
script.registerHook(markQuestStartedHook);

const lua = LuaEmitter.emit(script);
fs.writeFileSync('examples/quest-npc.lua', lua, 'utf8');
console.log('→ Written to examples/quest-npc.lua');
console.log('\nGenerated Lua:\n');
console.log(lua);
