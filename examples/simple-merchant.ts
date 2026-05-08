/**
 * @fileoverview Simple merchant example
 *
 * Demonstrates the DialogBuilder fluent API to create a basic merchant NPC.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import fs from 'node:fs';
import { DialogBuilder, LuaEmitter } from '../src/index.js';

const script = new DialogBuilder({ name: 'simple-merchant', description: 'Trading Guild merchant NPC' })
  .greeting(
    'Greetings, {name}!\n\nI\'m {partner} of {faction}.\nWhat can I do for you today?'
  )
  .addChoice('I want to join your team.', b => b.hire(50_000))
  .addChoice('I need a weapon.', b => {
    b.addChoice('Laser Pistol (100 000 credits)', c => c.sell('laser', 100_000))
     .addChoice('Sniper Rifle (500 000 credits)', c => c.sell('sniper', 500_000))
     .addChoice('Rocket Launcher (1 000 000 credits)', c => c.sell('rocket', 1_000_000))
     .addChoice('Never mind.', () => {});
  })
  .addChoice('I need equipment.', b => {
    b.addChoice('Helmet (50 000 credits)', c => c.sell('helmet', 50_000))
     .addChoice('Grapple Beam (100 000 credits)', c => c.sell('grapple', 100_000))
     .addChoice('Flashlight (3 000 credits)', c => c.sell('flashlight', 3_000))
     .addChoice('Never mind.', () => {});
  })
  .addChoice('Goodbye.')
  .build();

const lua = LuaEmitter.emit(script);
console.log(lua);

// Write to disk
fs.writeFileSync('examples/simple-merchant.lua', lua, 'utf8');
console.log('\n→ Written to examples/simple-merchant.lua');
