/**
 * @fileoverview Built-in Blockly workspace examples.
 *
 * Each example lives in its own module.
 * Difficulty: Basic (2) → Intermediate (1) → Advanced (2) → Very Advanced (1).
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { welcomeKiosk } from './welcome_kiosk.js';
import { tollBooth } from './toll_booth.js';
import { crewRecruiter } from './crew_recruiter.js';
import { deliveryQuest } from './delivery_quest.js';
import { reputationShop } from './reputation_shop.js';
import { guildFactionHub } from './guild_faction_hub.js';

// =============================================================================
// EXAMPLE REGISTRY
// =============================================================================

export const examples = {
  welcome_kiosk: welcomeKiosk,
  toll_booth: tollBooth,
  crew_recruiter: crewRecruiter,
  delivery_quest: deliveryQuest,
  reputation_shop: reputationShop,
  guild_faction_hub: guildFactionHub,
};
