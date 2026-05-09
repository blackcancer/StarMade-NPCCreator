import { assert } from 'chai';
import { parseLuaToBlocklyState } from '../ui/src/parser/lua-to-blocks.js';

const LUA = `
function questOfferCheckHook_intro_delivery(dialogObject)
  local player = dialogObject:getOwnName()
  local status = _questStatus(player, "intro_delivery")
  if status == "complete" then return 2 end
  if status == "active" then return 1 end
  return 0
end
function questOfferStartHook_intro_delivery(dialogObject)
  local player = dialogObject:getOwnName()
  _questSet(player, "intro_delivery", "active", 3)
  return 0
end
function questRewardHook_1(dialogObject)
  dialogObject:getEntity():setCredits(dialogObject:getEntity():getCredits() + 500)
  dialogObject:giveType(12, 3)
  local player = dialogObject:getOwnName()
  _repAdd(player, "guild", 5)
  _flagSet(player, "intro_rewarded", true)
  return 0
end
function questRequireStatusHook_intro_delivery_complete(dialogObject)
  local player = dialogObject:getOwnName()
  if _questStatus(player, "intro_delivery") == "complete" then return 0 end
  return -1
end
function create(dialogObject, bindings)
  local factory = luajava.newInstance(DialogTextEntryFactory, dialogObject)
  local HookLua = "org.schema.game.common.data.player.dialog.conversation.DialogTextEntryHookLua"
  local TextEntry = "org.schema.game.common.data.player.dialog.TextEntry"
  local hook_check = luajava.newInstance(HookLua, "questOfferCheckHook_intro_delivery", {})
  local hook_start = luajava.newInstance(HookLua, "questOfferStartHook_intro_delivery", {})
  local hook_reward = luajava.newInstance(HookLua, "questRewardHook_1", {})
  local hook_req = luajava.newInstance(HookLua, "questRequireStatusHook_intro_delivery_complete", {})
  local entry = luajava.newInstance(TextEntry, dialogObject:format("Hi"), 2000)
  local check = luajava.newInstance(TextEntry, dialogObject:format("Checking quest..."), 2000)
  local offer = luajava.newInstance(TextEntry, dialogObject:format("Mission?"), 2000)
  local start = luajava.newInstance(TextEntry, dialogObject:format("Starting quest..."), 2000)
  local accepted = luajava.newInstance(TextEntry, dialogObject:format("Accepted."), 2000)
  local refused = luajava.newInstance(TextEntry, dialogObject:format("Refused."), 2000)
  local active = luajava.newInstance(TextEntry, dialogObject:format("Active."), 2000)
  local complete = luajava.newInstance(TextEntry, dialogObject:format("Complete."), 2000)
  local reward = luajava.newInstance(TextEntry, dialogObject:format("Giving reward..."), 2000)
  local req = luajava.newInstance(TextEntry, dialogObject:format("Checking quest status..."), 2000)
  local done = luajava.newInstance(TextEntry, dialogObject:format("Done."), 2000)
  factory:setRootEntry(entry)
  entry:add(check, dialogObject:format("Quest"))
  entry:add(reward, dialogObject:format("Reward"))
  entry:add(req, dialogObject:format("Require"))
  check:setHook(hook_check)
  check:addReaction(hook_check, 0, offer)
  check:addReaction(hook_check, 1, active)
  check:addReaction(hook_check, 2, complete)
  offer:add(start, dialogObject:format("Yes"))
  offer:add(refused, dialogObject:format("No"))
  start:setHook(hook_start)
  start:addReaction(hook_start, 0, accepted)
  reward:setHook(hook_reward)
  reward:addReaction(hook_reward, 0, done)
  req:setHook(hook_req)
  req:addReaction(hook_req, 0, done)
  req:addReaction(hook_req, -1, refused)
  return factory
end
`;

describe('Lua import — advanced quest blocks', () => {
  it('rebuilds advanced offer, composable reward and status requirement blocks', () => {
    const state = parseLuaToBlocklyState(LUA);
    const firstChoice = state.blocks.blocks[0].inputs.CHOICES.block;
    const offer = firstChoice.inputs.ACTIONS.block;
    const reward = firstChoice.next.block.inputs.ACTIONS.block;
    const req = firstChoice.next.block.next.block.inputs.ACTIONS.block;

    assert.equal(offer.type, 'npc_quest_offer_advanced');
    assert.deepInclude(offer.fields, {
      QUEST_ID: 'intro_delivery',
      OFFER_TEXT: 'Mission?',
      ACCEPT_LABEL: 'Yes',
      REFUSE_LABEL: 'No',
      STEP: 3,
    });
    assert.equal(offer.inputs.ALREADY_ACTIVE.block.fields.TEXT, 'Active.');
    assert.equal(offer.inputs.ALREADY_COMPLETE.block.fields.TEXT, 'Complete.');

    assert.equal(reward.type, 'npc_quest_reward');
    assert.deepInclude(reward.fields, {
      CREDITS: 500,
      ITEM: 12,
      COUNT: 3,
      NPC_ID: 'guild',
      REP_DELTA: 5,
      FLAG_NAME: 'intro_rewarded',
      FLAG_VALUE: 'true',
    });

    assert.equal(req.type, 'npc_quest_require_status');
    assert.deepInclude(req.fields, { QUEST_ID: 'intro_delivery', STATUS: 'complete' });
    assert.equal(req.inputs.THEN.block.fields.TEXT, 'Done.');
    assert.equal(req.inputs.ELSE.block.fields.TEXT, 'Refused.');
  });
});
