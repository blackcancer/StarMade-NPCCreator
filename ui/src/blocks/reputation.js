// blocks/reputation.js — Blockly block definitions

export function registerReputationBlocks(Blockly) {

// ── REPUTATION ─────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_rep_add'] = {
  init() {
    this.appendDummyInput()
      .appendField('⭐ Rep Add')
      .appendField(new Blockly.FieldTextInput('trading_guild'), 'NPC_ID')
      .appendField(new Blockly.FieldNumber(10, -9999, 9999), 'DELTA');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#880e4f');
    this.setTooltip('REPUTATION ADD\nAdd (or subtract if negative) DELTA to the reputation with NPC_ID.');
  }
};

Blockly.Blocks['npc_rep_set'] = {
  init() {
    this.appendDummyInput()
      .appendField('⭐ Rep Set')
      .appendField(new Blockly.FieldTextInput('trading_guild'), 'NPC_ID')
      .appendField('to')
      .appendField(new Blockly.FieldNumber(0, -9999, 9999), 'VALUE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#880e4f');
    this.setTooltip('REPUTATION SET\nForce the reputation with NPC_ID to VALUE.');
  }
};

Blockly.Blocks['npc_rep_reset'] = {
  init() {
    this.appendDummyInput()
      .appendField('⭐ Rep Reset')
      .appendField(new Blockly.FieldTextInput('trading_guild'), 'NPC_ID');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#880e4f');
    this.setTooltip('REPUTATION RESET\nReset the reputation with NPC_ID to 0.');
  }
};

Blockly.Blocks['npc_get_rep'] = {
  init() {
    this.appendDummyInput()
      .appendField('⭐ Show Rep')
      .appendField(new Blockly.FieldTextInput('trading_guild'), 'NPC_ID');
    this.appendDummyInput()
      .appendField('Text (%s = value)')
      .appendField(new Blockly.FieldTextInput('Your reputation: %s'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#880e4f');
    this.setTooltip('GET REPUTATION\nDisplay the reputation score in a text node.\n%s is replaced by the numeric score.');
  }
};

Blockly.Blocks['npc_check_rep'] = {
  init() {
    this.appendDummyInput()
      .appendField('⭐ Check Rep')
      .appendField(new Blockly.FieldTextInput('trading_guild'), 'NPC_ID')
      .appendField(new Blockly.FieldDropdown([
        ['≥','>='], ['>','>'], ['=','=='], ['≤','<='], ['<','<'],
      ]), 'OP')
      .appendField(new Blockly.FieldNumber(0), 'VALUE');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#880e4f');
    this.setTooltip('CHECK REPUTATION\nBranch based on the reputation score.\nTHEN = condition met, ELSE = not met.');
  }
};

}
