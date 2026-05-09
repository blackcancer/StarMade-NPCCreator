// blocks/cooldowns.js — Blockly block definitions

export function registerCooldownsBlocks(Blockly) {

// ── COOLDOWNS ──────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_cooldown_set'] = {
  init() {
    this.appendDummyInput()
      .appendField('⏱ Set Cooldown')
      .appendField(new Blockly.FieldTextInput('daily_deal'), 'ACTION_ID')
      .appendField(new Blockly.FieldNumber(86400, 1), 'DURATION_SEC')
      .appendField('s');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#004d40');
    this.setTooltip('COOLDOWN SET\nStart a cooldown timer for ACTION_ID lasting DURATION seconds.\nUsed to gate daily rewards or repeatable actions.');
  }
};

Blockly.Blocks['npc_cooldown_clear'] = {
  init() {
    this.appendDummyInput()
      .appendField('⏱ Clear Cooldown')
      .appendField(new Blockly.FieldTextInput('daily_deal'), 'ACTION_ID');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#004d40');
    this.setTooltip('COOLDOWN CLEAR\nRemove an active cooldown for ACTION_ID immediately.');
  }
};

Blockly.Blocks['npc_get_cooldown_remaining'] = {
  init() {
    this.appendDummyInput()
      .appendField('⏱ Show Cooldown Remaining')
      .appendField(new Blockly.FieldTextInput('daily_deal'), 'ACTION_ID');
    this.appendDummyInput()
      .appendField('Text (%s = seconds)')
      .appendField(new Blockly.FieldTextInput('Come back in %s seconds.'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#004d40');
    this.setTooltip('GET COOLDOWN\nDisplay the remaining cooldown seconds in a text node.\n%s is replaced by the remaining seconds.');
  }
};

Blockly.Blocks['npc_check_cooldown'] = {
  init() {
    this.appendDummyInput()
      .appendField('⏱ Check Cooldown')
      .appendField(new Blockly.FieldTextInput('daily_deal'), 'ACTION_ID')
      .appendField(new Blockly.FieldDropdown([
        ['is expired', 'expired'], ['is active', 'active'],
      ]), 'STATE');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#004d40');
    this.setTooltip('CHECK COOLDOWN\nBranch on cooldown state: expired = available, active = on cooldown.');
  }
};

}
