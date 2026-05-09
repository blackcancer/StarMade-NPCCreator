// blocks/index.js — Register all Blockly block definitions by category

import { registerDialogBlocks } from './dialog.js';
import { registerVariablesBlocks } from './variables.js';
import { registerCrewBlocks } from './crew.js';
import { registerItemsBlocks } from './items.js';
import { registerWorldBlocks } from './world.js';
import { registerSequencesBlocks } from './sequences.js';
import { registerPersistenceBlocks } from './persistence.js';
import { registerQuestsBlocks } from './quests.js';
import { registerReputationBlocks } from './reputation.js';
import { registerCooldownsBlocks } from './cooldowns.js';
import { registerStockBlocks } from './stock.js';
import { registerFlagsBlocks } from './flags.js';
import { registerWorldstateBlocks } from './worldstate.js';
import { registerBranchesBlocks } from './branches.js';
import { registerExpressionsBlocks } from './expressions.js';
import { registerAdvancedBlocks } from './advanced.js';

export function registerAllBlocks(Blockly) {
  registerDialogBlocks(Blockly);
  registerVariablesBlocks(Blockly);
  registerCrewBlocks(Blockly);
  registerItemsBlocks(Blockly);
  registerWorldBlocks(Blockly);
  registerSequencesBlocks(Blockly);
  registerPersistenceBlocks(Blockly);
  registerQuestsBlocks(Blockly);
  registerReputationBlocks(Blockly);
  registerCooldownsBlocks(Blockly);
  registerStockBlocks(Blockly);
  registerFlagsBlocks(Blockly);
  registerWorldstateBlocks(Blockly);
  registerBranchesBlocks(Blockly);
  registerExpressionsBlocks(Blockly);
  registerAdvancedBlocks(Blockly);
}
