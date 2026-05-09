/**
 * @fileoverview Lua expression builder for composable Blockly conditions.
 *
 * Converts green expression blocks into Lua boolean expressions used by branch,
 * wait and delayed follow-up actions. Kept separate from `core.js` to mirror the
 * modular organization used in StarMade-DB.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { getOptionalVarName, luaStringLiteral } from './helpers.js';

// =============================================================================
// CONDITION EXPRESSION DISPATCH
// =============================================================================

/**
 * Build a Lua boolean expression from a composable condition block.
 *
 * @param {Object|null} block Blockly condition block.
 * @returns {string} Lua expression safe to embed inside `if <expr> then`.
 */
export function buildConditionExpression(block) {
  if (!block) return 'false';
  switch (block.type) {
    case 'npc_cond_player_value': {
      const valueType = block.getFieldValue('VALUE_TYPE');
      const op        = block.getFieldValue('OP');
      const value     = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE');
      const valueExprMap = {
        credits:   'dialogObject:getEntity():getCredits()',
        health:    'dialogObject:getEntity():getHealth()',
        maxHealth: 'dialogObject:getEntity():getMaxHealth()',
        factionId: 'dialogObject:getEntity():getFactionId()',
        sectorId:  'dialogObject:getEntity():getCurrentSectorId()',
      };
      const valueExpr = valueExprMap[valueType] || 'dialogObject:getEntity():getCredits()';
      return `(dialogObject:getEntity() ~= nil and (${valueExpr} ${op} ${value}))`;
    }
    case 'npc_cond_flag': {
      const flag   = block.getFieldValue('FLAG');
      const expect = block.getFieldValue('EXPECT') === 'true' ? 'true' : 'false';
      if (flag === 'creative') {
        return `(dialogObject:getEntity() ~= nil and dialogObject:getEntity():isCreativeModeEnabled() == ${expect})`;
      }
      if (flag === 'inTeam') {
        return `(dialogObject:isConverationPartnerInTeam() == ${expect})`;
      }
      return 'false';
    }
    case 'npc_cond_is_at_block': {
      const x = getOptionalVarName(block, 'X_VAR') || block.getFieldValue('X');
      const y = getOptionalVarName(block, 'Y_VAR') || block.getFieldValue('Y');
      const z = getOptionalVarName(block, 'Z_VAR') || block.getFieldValue('Z');
      return `(dialogObject:isAtBlock(${x}, ${y}, ${z}))`;
    }
    case 'npc_cond_custom': {
      const expr = block.getFieldValue('EXPR') || 'false';
      return `(${expr})`;
    }
    case 'npc_cond_sqlite_value': {
      const table = String(block.getFieldValue('TABLE') || 'quest_state').replace(/"/g, '\\"');
      const col   = String(block.getFieldValue('COL') || 'done').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '==';
      const value = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE') || '1';
      const def   = getOptionalVarName(block, 'DEFAULT_VAR') || block.getFieldValue('DEFAULT') || '0';
      return `(_dbGetPlayerValue("${table}", "${col}", dialogObject:getOwnName(), ${def}) ${op} ${value})`;
    }
    case 'npc_cond_sqlite_exists': {
      const table  = String(block.getFieldValue('TABLE') || 'quest_state').replace(/"/g, '\\"');
      const expect = block.getFieldValue('EXPECT') === 'false' ? 'false' : 'true';
      return `(_dbHasPlayerRow("${table}", dialogObject:getOwnName()) == ${expect})`;
    }
    case 'npc_cond_sqlite_number': {
      const table = String(block.getFieldValue('TABLE') || 'quest_state').replace(/"/g, '\\"');
      const col   = String(block.getFieldValue('COL') || 'step').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '==';
      const value = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE') || 0;
      const def   = getOptionalVarName(block, 'DEFAULT_VAR') || block.getFieldValue('DEFAULT') || 0;
      return `(_dbGetPlayerNumber("${table}", "${col}", dialogObject:getOwnName(), ${def}) ${op} ${value})`;
    }
    case 'npc_cond_sqlite_text': {
      const table = String(block.getFieldValue('TABLE') || 'quest_state').replace(/"/g, '\\"');
      const col   = String(block.getFieldValue('COL') || 'state').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '==';
      const valueVar = getOptionalVarName(block, 'VALUE_VAR');
      const defVar   = getOptionalVarName(block, 'DEFAULT_VAR');
      const value = valueVar || luaStringLiteral(block.getFieldValue('VALUE') || 'done');
      const def   = defVar || luaStringLiteral(block.getFieldValue('DEFAULT') || '');
      return `(_dbGetPlayerText("${table}", "${col}", dialogObject:getOwnName(), ${def}) ${op} ${value})`;
    }
    case 'npc_cond_memory_number': {
      const key   = String(block.getFieldValue('KEY') || 'quest_step').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '==';
      const value = getOptionalVarName(block, 'VALUE_VAR') || block.getFieldValue('VALUE') || 0;
      const def   = getOptionalVarName(block, 'DEFAULT_VAR') || block.getFieldValue('DEFAULT') || 0;
      return `(_memGetNumber(dialogObject:getOwnName(), "${key}", ${def}) ${op} ${value})`;
    }
    case 'npc_cond_memory_text': {
      const key   = String(block.getFieldValue('KEY') || 'quest_state').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '==';
      const valueVar = getOptionalVarName(block, 'VALUE_VAR');
      const defVar   = getOptionalVarName(block, 'DEFAULT_VAR');
      const value = valueVar || luaStringLiteral(block.getFieldValue('VALUE') || 'done');
      const def   = defVar || luaStringLiteral(block.getFieldValue('DEFAULT') || '');
      return `(_memGetText(dialogObject:getOwnName(), "${key}", ${def}) ${op} ${value})`;
    }
    case 'npc_cond_memory_exists': {
      const key    = String(block.getFieldValue('KEY') || 'quest_state').replace(/"/g, '\\"');
      const expect = block.getFieldValue('EXPECT') === 'false' ? 'false' : 'true';
      return `(_memHas(dialogObject:getOwnName(), "${key}") == ${expect})`;
    }
    case 'npc_cond_quest_status': {
      const questId = String(block.getFieldValue('QUEST_ID') || 'intro_delivery').replace(/"/g, '\\"');
      const status  = block.getFieldValue('STATUS') ?? 'active';
      return `(_questStatus(dialogObject:getOwnName(), ${luaStringLiteral(questId)}) == ${luaStringLiteral(status || 'none')})`;
    }
    case 'npc_cond_quest_step': {
      const questId = String(block.getFieldValue('QUEST_ID') || 'intro_delivery').replace(/"/g, '\\"');
      const op      = block.getFieldValue('OP') || '==';
      const step    = block.getFieldValue('STEP') || 0;
      return `(_questStep(dialogObject:getOwnName(), ${luaStringLiteral(questId)}) ${op} ${step})`;
    }
    case 'npc_cond_rep': {
      const npcId = String(block.getFieldValue('NPC_ID') || 'trading_guild').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '>=';
      const value = block.getFieldValue('VALUE') || 0;
      return `(_repGet(dialogObject:getOwnName(), "${npcId}") ${op} ${value})`;
    }
    case 'npc_cond_cooldown': {
      const actionId = String(block.getFieldValue('ACTION_ID') || 'daily_delivery').replace(/"/g, '\\"');
      const state    = block.getFieldValue('STATE') || 'active';
      if (state === 'active') return `(_cooldownActive(dialogObject:getOwnName(), "${actionId}") == true)`;
      return `(_cooldownActive(dialogObject:getOwnName(), "${actionId}") == false)`;
    }
    case 'npc_cond_stock': {
      const shopId   = String(block.getFieldValue('SHOP_ID') || 'guild_shop').replace(/"/g, '\\"');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const op       = block.getFieldValue('OP') || '>=';
      const value    = block.getFieldValue('VALUE') || 1;
      return `(_stockGet("${shopId}", ${itemType}) ${op} ${value})`;
    }
    case 'npc_cond_flag_db': {
      const flagName = String(block.getFieldValue('FLAG_NAME') || 'first_visit').replace(/"/g, '\\"');
      const value    = block.getFieldValue('VALUE') || 'true';
      return `(_flagGet(dialogObject:getOwnName(), "${flagName}") == ${value})`;
    }
    case 'npc_cond_world': {
      const key   = String(block.getFieldValue('KEY') || 'guild_event_active').replace(/"/g, '\\"');
      const op    = block.getFieldValue('OP') || '==text';
      const value = block.getFieldValue('VALUE') || 'true';
      if (op.endsWith('text')) {
        const luaOp = op.replace('text', '').trim();
        return `(_worldGet("${key}", "") ${luaOp} ${luaStringLiteral(value)})`;
      } else {
        const luaOp = op.replace('num', '').trim();
        return `(_worldGetNumber("${key}", 0) ${luaOp} ${Number(value) || 0})`;
      }
    }
    case 'npc_cond_and': {
      const a = buildConditionExpression(block.getInputTargetBlock('A'));
      const b = buildConditionExpression(block.getInputTargetBlock('B'));
      return `((${a}) and (${b}))`;
    }
    case 'npc_cond_or': {
      const a = buildConditionExpression(block.getInputTargetBlock('A'));
      const b = buildConditionExpression(block.getInputTargetBlock('B'));
      return `((${a}) or (${b}))`;
    }
    case 'npc_cond_not': {
      const expr = buildConditionExpression(block.getInputTargetBlock('COND'));
      return `(not (${expr}))`;
    }
    case 'npc_cond_conv_state': {
      const state = String(block.getFieldValue('STATE') || '').replace(/"/g, '\\"');
      return `(dialogObject:getConversationState() == "${state}")`;
    }
    default:
      return 'false';
  }
}
