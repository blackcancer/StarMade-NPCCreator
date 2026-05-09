// blocks/quests.js — Blockly block definitions

export function registerQuestsBlocks(Blockly) {

// ── QUESTS — mix simple + multi-result ─────────────────────────────────────────

Blockly.Blocks['npc_quest_offer_advanced'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Advanced Quest Offer')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID');
    this.appendDummyInput()
      .appendField('Offer text')
      .appendField(new Blockly.FieldTextInput('Will you take this mission?'), 'OFFER_TEXT');
    this.appendDummyInput()
      .appendField('Accept label')
      .appendField(new Blockly.FieldTextInput('Yes, I will do it!'), 'ACCEPT_LABEL');
    this.appendDummyInput()
      .appendField('Refuse label')
      .appendField(new Blockly.FieldTextInput('Not now.'), 'REFUSE_LABEL');
    this.appendDummyInput()
      .appendField('Initial step')
      .appendField(new Blockly.FieldNumber(1, 0), 'STEP');
    this.appendStatementInput('ACCEPTED').setCheck(null).appendField('✅ Accepted →');
    this.appendStatementInput('REFUSED').setCheck(null).appendField('❌ Refused →');
    this.appendStatementInput('ALREADY_ACTIVE').setCheck(null).appendField('⏳ Already active →');
    this.appendStatementInput('ALREADY_COMPLETE').setCheck(null).appendField('🏁 Already complete →');
    this.setPreviousStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('ADVANCED QUEST OFFER\nChecks the persistent quest state before offering.\nRoutes: none = offer, active = already active branch, complete = already complete branch.\nAccept and Refuse labels customizable.');
  }
};

Blockly.Blocks['npc_quest_offer'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest Offer')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID');
    this.appendDummyInput()
      .appendField('Offer text')
      .appendField(new Blockly.FieldTextInput('Will you take this mission?'), 'OFFER_TEXT');
    this.appendDummyInput()
      .appendField('Accept label')
      .appendField(new Blockly.FieldTextInput('Yes, I will do it!'), 'ACCEPT_LABEL');
    this.appendDummyInput()
      .appendField('Refuse label')
      .appendField(new Blockly.FieldTextInput('Not now.'), 'REFUSE_LABEL');
    this.appendDummyInput()
      .appendField('Initial step')
      .appendField(new Blockly.FieldNumber(1, 0), 'STEP');
    this.appendStatementInput('ACCEPTED').setCheck(null).appendField('✅ Accepted →');
    this.appendStatementInput('REFUSED') .setCheck(null).appendField('❌ Refused →');
    this.setPreviousStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST OFFER\nPresent a quest to the player with Accept / Refuse choices.\nSets quest status to active when accepted.');
  }
};

// Simple quest actions (always succeed — chain below)
Blockly.Blocks['npc_quest_start'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest Start')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID')
      .appendField('step')
      .appendField(new Blockly.FieldNumber(1, 0), 'STEP');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST START\nMark a quest as active and set its initial step.\nDoes NOT offer a choice — use Quest Offer for that.');
  }
};

Blockly.Blocks['npc_quest_set_step'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest Set Step')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID')
      .appendField('step')
      .appendField(new Blockly.FieldNumber(2, 0), 'STEP');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST SET STEP\nAdvance an active quest to a specific step number.');
  }
};

Blockly.Blocks['npc_quest_require_status'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Require Quest Status')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID')
      .appendField('is')
      .appendField(new Blockly.FieldDropdown([
        ['none', 'none'], ['active', 'active'], ['complete', 'complete'], ['failed', 'failed'],
      ]), 'STATUS');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Then →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ Else →');
    this.setPreviousStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST REQUIRE STATUS\nBranch based on the current persistent quest status.\nStatuses: none, active, complete, failed.');
  }
};

Blockly.Blocks['npc_quest_require_step'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Require Quest Step')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID')
      .appendField('step')
      .appendField(new Blockly.FieldDropdown([['=', '=='], ['≥', '>='], ['>', '>'], ['≤', '<='], ['<', '<']]), 'OP')
      .appendField(new Blockly.FieldNumber(1), 'STEP');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Then →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ Else →');
    this.setPreviousStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST REQUIRE STEP\nBranch based on the persistent quest step number.\nOperators: = >= > <= <');
  }
};

Blockly.Blocks['npc_quest_objective'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest Objective')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID');
    this.appendDummyInput()
      .appendField('Text')
      .appendField(new Blockly.FieldTextInput('Objective updated: deliver the cargo.'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST OBJECTIVE\nShow an objective / journal text to the player and continue.\nNo persistent state is written — purely informational.');
  }
};

Blockly.Blocks['npc_quest_reward'] = {
  init() {
    this.appendDummyInput()
      .appendField('🎁 Quest Reward')
      .appendField(new Blockly.FieldTextInput('Reward received!'), 'SUCCESS');
    this.appendDummyInput()
      .appendField('Credits')
      .appendField(new Blockly.FieldNumber(0, 0), 'CREDITS');
    this.appendDummyInput()
      .appendField('Item type')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM')
      .appendField('×')
      .appendField(new Blockly.FieldNumber(0, 0), 'COUNT');
    this.appendDummyInput()
      .appendField('Reputation NPC')
      .appendField(new Blockly.FieldTextInput('guild'), 'NPC_ID')
      .appendField('delta')
      .appendField(new Blockly.FieldNumber(0), 'REP_DELTA');
    this.appendDummyInput()
      .appendField('Set flag')
      .appendField(new Blockly.FieldTextInput(''), 'FLAG_NAME')
      .appendField(new Blockly.FieldDropdown([['true', 'true'], ['false', 'false']]), 'FLAG_VALUE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST REWARD\nGive a composable reward after a quest action.\nCredits, item type x count, reputation delta, persistent flag.\nLeave fields at 0 or empty to skip them.');
  }
};

Blockly.Blocks['npc_quest_complete'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest Complete')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID');
    this.appendDummyInput()
      .appendField('Reward credits')
      .appendField(new Blockly.FieldNumber(0, 0), 'REWARD_CREDITS');
    this.appendDummyInput()
      .appendField('Reward item type')
      .appendField(new Blockly.FieldNumber(0, 0), 'REWARD_ITEM')
      .appendField('×')
      .appendField(new Blockly.FieldNumber(0, 0), 'REWARD_COUNT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST COMPLETE\nMark the quest as complete in the HSQLDB table.\nOptional inline rewards: credits and item type x count.');
  }
};

Blockly.Blocks['npc_quest_fail'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest Fail')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#b71c1c');
    this.setTooltip('QUEST FAIL\nMark the quest as failed in the HSQLDB table.');
  }
};

}
