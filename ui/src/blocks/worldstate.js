// blocks/worldstate.js — Blockly block definitions

export function registerWorldstateBlocks(Blockly) {

// ── WORLD STATE ────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_world_set'] = {
  init() {
    this.appendDummyInput()
      .appendField('🌐 World Set')
      .appendField(new Blockly.FieldTextInput('guild_event_active'), 'KEY')
      .appendField('=')
      .appendField(new Blockly.FieldTextInput('true'), 'VALUE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#f57f17');
    this.setTooltip('WORLD STATE SET\nWrite a global string value to persistent world state.\nShared across all players — not per-player.');
  }
};

Blockly.Blocks['npc_world_get'] = {
  init() {
    this.appendDummyInput()
      .appendField('🌐 World Get')
      .appendField(new Blockly.FieldTextInput('guild_event_active'), 'KEY');
    this.appendDummyInput()
      .appendField('Default')
      .appendField(new Blockly.FieldTextInput(''), 'DEFAULT');
    this.appendDummyInput()
      .appendField('Text (%s = value)')
      .appendField(new Blockly.FieldTextInput('Current event: %s'), 'SUCCESS');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#f57f17');
    this.setTooltip('WORLD STATE GET\nDisplay a global world state value in a text node.\n%s is replaced by the current value.');
  }
};

Blockly.Blocks['npc_get_world'] = {
  init() {
    this.appendDummyInput()
      .appendField('🌐 Display World State')
      .appendField(new Blockly.FieldTextInput('guild_event_active'), 'KEY');
    this.appendDummyInput()
      .appendField('Default')
      .appendField(new Blockly.FieldTextInput(''), 'DEFAULT');
    this.appendDummyInput()
      .appendField('Text (%s = value)')
      .appendField(new Blockly.FieldTextInput('Current event: %s'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#f57f17');
    this.setTooltip('GET WORLD STATE\nRead a global world state value inside an action chain.\n%s is replaced by the current value.');
  }
};

Blockly.Blocks['npc_check_world'] = {
  init() {
    this.appendDummyInput()
      .appendField('🌐 Check World State')
      .appendField(new Blockly.FieldTextInput('guild_event_active'), 'KEY')
      .appendField(new Blockly.FieldDropdown([
        ['= text','== text'], ['≠ text','~= text'],
        ['= num','== num'], ['≥ num','>= num'], ['> num','> num'],
      ]), 'OP')
      .appendField(new Blockly.FieldTextInput('true'), 'VALUE');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#f57f17');
    this.setTooltip('CHECK WORLD STATE\nBranch based on the current global world state value.');
  }
};

}
