/**
 * @fileoverview Quest action generators.
 *
 * Handles quest start, step, completion, failure and offer flows.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

import { _state } from '../state.js';

// =============================================================================
// ACTION GENERATOR
// =============================================================================

/**
 * Try to generate Lua state for a block owned by this category.
 *
 * @param {Object} block Blockly block instance.
 * @param {Object} ctx Explicit generator dependencies from core.js.
 * @returns {string|undefined} Root node variable name when handled; undefined otherwise.
 */
export function genQuestAction(block, ctx) {
  const {
    getOptionalVarName,
    sanitizeIdentPart,
    hashCode,
    luaStringLiteral,
    registerHook,
    makeNode,
    getNode,
    makeBranchAction,
    processActions,
    processActionBlock,
  } = ctx;

  switch (block.type) {
    case 'npc_quest_offer_advanced': {
      _state.usesQuestTable = true;

      const questId     = block.getFieldValue('QUEST_ID');
      const offerText   = block.getFieldValue('OFFER_TEXT')   || 'Will you take this mission?';
      const acceptLabel = block.getFieldValue('ACCEPT_LABEL') || 'Yes, I will do it!';
      const refuseLabel = block.getFieldValue('REFUSE_LABEL') || 'Not now.';
      const step        = block.getFieldValue('STEP') || 1;
      const checkHookFn = 'questOfferCheckHook_' + sanitizeIdentPart(questId);
      const startHookFn = 'questOfferStartHook_' + sanitizeIdentPart(questId);
      registerHook(checkHookFn, [
        'local player = dialogObject:getOwnName()',
        'local status = _questStatus(player, ' + luaStringLiteral(questId) + ')',
        'if status == "complete" then return 2 end',
        'if status == "active" then return 1 end',
        'return 0',
      ]);
      registerHook(startHookFn, [
        'local player = dialogObject:getOwnName()',
        '_questSet(player, ' + luaStringLiteral(questId) + ', "active", ' + step + ')',
        'return 0',
      ]);
      const checkVn   = makeNode('Checking quest...');
      const checkNode = getNode(checkVn);
      const offerVn   = makeNode(offerText);
      const offerNode = getNode(offerVn);
      const waitVn    = makeNode('Starting quest...');
      const waitNode  = getNode(waitVn);
      const activeVn  = processActions(block, 'ALREADY_ACTIVE', checkVn) || makeNode('You already have this quest active.');
      const completeVn = processActions(block, 'ALREADY_COMPLETE', checkVn) || makeNode('You have already completed this quest.');
      const acceptedVn = processActions(block, 'ACCEPTED', waitVn) || makeNode('Quest started. Good luck!');
      const refusedVn  = processActions(block, 'REFUSED', offerVn) || makeNode('Come back if you change your mind.');
      checkNode.hook = checkHookFn;
      checkNode.reactions = [
        { code: 0, target: offerVn },
        { code: 1, target: activeVn },
        { code: 2, target: completeVn },
      ];
      waitNode.hook = startHookFn;
      waitNode.reactions = [{ code: 0, target: acceptedVn }];
      offerNode.choices = [
        { label: acceptLabel, targetVarName: waitVn },
        { label: refuseLabel, targetVarName: refusedVn },
      ];
      return checkVn;
    }

    case 'npc_quest_start': {
      _state.usesQuestTable = true;

      const questId = block.getFieldValue('QUEST_ID');
      const step    = block.getFieldValue('STEP');
      const hookFn  = 'questStartHook_' + sanitizeIdentPart(questId);
      registerHook(hookFn, [
        'local player = dialogObject:getOwnName()',
        '_questSet(player, ' + luaStringLiteral(questId) + ', "active", ' + step + ')',
        'return 0',
      ]);
      const waitVn   = makeNode('Starting quest...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode('Quest started.') }];
      return waitVn;
    }

    case 'npc_quest_set_step': {
      _state.usesQuestTable = true;

      const questId = block.getFieldValue('QUEST_ID');
      const step    = block.getFieldValue('STEP');
      const hookFn  = 'questSetStepHook_' + sanitizeIdentPart(questId) + '_' + sanitizeIdentPart(step);
      registerHook(hookFn, [
        'local player = dialogObject:getOwnName()',
        '_questSet(player, ' + luaStringLiteral(questId) + ', "active", ' + step + ')',
        'return 0',
      ]);
      const waitVn   = makeNode('Updating quest...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode('Quest updated.') }];
      return waitVn;
    }

    case 'npc_quest_require_status': {
      _state.usesQuestTable = true;

      const questId = block.getFieldValue('QUEST_ID');
      const status  = block.getFieldValue('STATUS') || 'active';
      const hookFn  = 'questRequireStatusHook_' + sanitizeIdentPart(questId) + '_' + sanitizeIdentPart(status);
      return makeBranchAction(hookFn, [
        'local player = dialogObject:getOwnName()',
        'if _questStatus(player, ' + luaStringLiteral(questId) + ') == ' + luaStringLiteral(status) + ' then return 0 end',
        'return -1',
      ], block, 'Checking quest status...');
    }

    case 'npc_quest_require_step': {
      _state.usesQuestTable = true;

      const questId = block.getFieldValue('QUEST_ID');
      const op      = block.getFieldValue('OP') || '==';
      const step    = Number(block.getFieldValue('STEP') || 0);
      const hookFn  = 'questRequireStepHook_' + sanitizeIdentPart(questId) + '_' + String(op).replace(/\W/g, '_') + '_' + step;
      return makeBranchAction(hookFn, [
        'local player = dialogObject:getOwnName()',
        'if _questStep(player, ' + luaStringLiteral(questId) + ') ' + op + ' ' + step + ' then return 0 end',
        'return -1',
      ], block, 'Checking quest step...');
    }

    case 'npc_quest_objective': {

      const text = block.getFieldValue('TEXT') || 'Objective updated.';
      const objectiveVn = makeNode(text);
      const objectiveNode = getNode(objectiveVn);
      const nextBlock = block.getNextBlock();
      const nextVn = nextBlock ? processActionBlock(nextBlock, objectiveVn) : null;
      if (nextVn) {
        objectiveNode.choices = [{ label: 'Continue.', targetVarName: nextVn }];
      }
      return objectiveVn;
    }

    case 'npc_quest_reward': {

      const success    = block.getFieldValue('SUCCESS') || 'Reward received!';
      const credits    = Number(block.getFieldValue('CREDITS') || 0);
      const item       = Number(block.getFieldValue('ITEM') || 0);
      const count      = Number(block.getFieldValue('COUNT') || 0);
      const npcId      = block.getFieldValue('NPC_ID') || '';
      const repDelta   = Number(block.getFieldValue('REP_DELTA') || 0);
      const flagName   = block.getFieldValue('FLAG_NAME') || '';
      const flagValue  = block.getFieldValue('FLAG_VALUE') === 'true';
      const hookFn     = 'questRewardHook_' + Math.abs(hashCode([success, credits, item, count, npcId, repDelta, flagName, flagValue].join('|')));
      const hookBody   = [];
      if (credits > 0) hookBody.push('dialogObject:getEntity():setCredits(dialogObject:getEntity():getCredits() + ' + credits + ')');
      if (item > 0 && count > 0) hookBody.push('dialogObject:giveType(' + item + ', ' + count + ')');
      if (npcId && repDelta !== 0) {
        _state.usesReputation = true;
        hookBody.push('local player = dialogObject:getOwnName()');
        hookBody.push('_repAdd(player, ' + luaStringLiteral(npcId) + ', ' + repDelta + ')');
      }
      if (flagName) {
        _state.usesHsqlMemory = true;
        if (!hookBody.includes('local player = dialogObject:getOwnName()')) hookBody.push('local player = dialogObject:getOwnName()');
        hookBody.push('_flagSet(player, ' + luaStringLiteral(flagName) + ', ' + flagValue + ')');
      }
      hookBody.push('return 0');
      registerHook(hookFn, hookBody);
      const waitVn   = makeNode('Giving reward...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode(success) }];
      return waitVn;
    }

    case 'npc_quest_complete': {
      _state.usesQuestTable = true;

      const questId     = block.getFieldValue('QUEST_ID');
      const rewardCreds = Number(block.getFieldValue('REWARD_CREDITS') || 0);
      const rewardItem  = Number(block.getFieldValue('REWARD_ITEM')    || 0);
      const rewardCount = Number(block.getFieldValue('REWARD_COUNT')   || 0);
      const hookFn      = 'questCompleteHook_' + sanitizeIdentPart(questId);
      const hookBody    = [
        'local player = dialogObject:getOwnName()',
        '_questSet(player, ' + luaStringLiteral(questId) + ', "complete", _questStep(player, ' + luaStringLiteral(questId) + '))',
      ];
      if (rewardCreds > 0) hookBody.push('dialogObject:getEntity():setCredits(dialogObject:getEntity():getCredits() + ' + rewardCreds + ')');
      if (rewardItem > 0 && rewardCount > 0) hookBody.push('dialogObject:giveType(' + rewardItem + ', ' + rewardCount + ')');
      hookBody.push('return 0');
      registerHook(hookFn, hookBody);
      const waitVn   = makeNode('Completing quest...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode('Quest complete!') }];
      return waitVn;
    }

    case 'npc_quest_fail': {
      _state.usesQuestTable = true;

      const questId = block.getFieldValue('QUEST_ID');
      const hookFn  = 'questFailHook_' + sanitizeIdentPart(questId);
      registerHook(hookFn, [
        'local player = dialogObject:getOwnName()',
        '_questSet(player, ' + luaStringLiteral(questId) + ', "failed", _questStep(player, ' + luaStringLiteral(questId) + '))',
        'return 0',
      ]);
      const waitVn   = makeNode('Updating quest...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [{ code: 0, target: nextVn || makeNode('Quest failed.') }];
      return waitVn;
    }

    case 'npc_quest_offer': {
      _state.usesQuestTable = true;

      const questId     = block.getFieldValue('QUEST_ID');
      const offerText   = block.getFieldValue('OFFER_TEXT')   || 'Will you take this mission?';
      const acceptLabel = block.getFieldValue('ACCEPT_LABEL') || 'Yes, I will do it!';
      const refuseLabel = block.getFieldValue('REFUSE_LABEL') || 'Not now.';
      const step        = block.getFieldValue('STEP') || 1;
      const hookFn      = 'questOfferHook_' + sanitizeIdentPart(questId);
      registerHook(hookFn, [
        'local player = dialogObject:getOwnName()',
        '_questSet(player, ' + luaStringLiteral(questId) + ', "active", ' + step + ')',
        'return 0',
      ]);
      const offerVn   = makeNode(offerText);
      const offerNode = getNode(offerVn);
      const waitVn    = makeNode('Starting quest...');
      const waitNode  = getNode(waitVn);
      waitNode.hook   = hookFn;
      const acceptedVn = processActions(block, 'ACCEPTED', waitVn) || makeNode('Quest started. Good luck!');
      const refusedVn  = processActions(block, 'REFUSED',  offerVn) || makeNode('Come back if you change your mind.');
      waitNode.reactions = [{ code: 0, target: acceptedVn }];
      offerNode.choices  = [
        { label: acceptLabel, targetVarName: waitVn },
        { label: refuseLabel, targetVarName: refusedVn },
      ];
      return offerVn;
    }
    default:
      return undefined;
  }
}
