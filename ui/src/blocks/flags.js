// blocks/flags.js — Blockly block definitions

export function registerFlagsBlocks(Blockly) {

// ── FLAGS ──────────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_flag_set'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚩 Set Flag')
      .appendField(new Blockly.FieldTextInput('first_visit'), 'FLAG_NAME')
      .appendField(new Blockly.FieldDropdown([['ON', 'true'], ['OFF', 'false']]), 'VALUE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#f57f17');
    this.setTooltip('FLAG SET\nSet a named boolean flag for the player in persistent storage.');
  }
};

Blockly.Blocks['npc_check_flag'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚦 Check Flag')
      .appendField(new Blockly.FieldDropdown([
        ['Player creative mode', 'creative'], ['NPC already in team', 'inTeam'],
      ]), 'FLAG')
      .appendField(new Blockly.FieldDropdown([
        ['is ON', 'true'], ['is OFF', 'false'],
      ]), 'EXPECT');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('CHECK BOOLEAN FLAG\nBranch based on a live in-memory flag (creative mode, in-team).\nFor persistent flags use Check Flag (DB).');
  }
};

Blockly.Blocks['npc_check_flag_db'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚩 Check Named Flag')
      .appendField(new Blockly.FieldTextInput('first_visit'), 'FLAG_NAME')
      .appendField(new Blockly.FieldDropdown([['is ON', 'true'], ['is OFF', 'false']]), 'VALUE');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#f57f17');
    this.setTooltip('CHECK FLAG (DB)\nBranch based on a persistent player flag value.\nTHEN = matches, ELSE = does not match.');
  }
};

}
