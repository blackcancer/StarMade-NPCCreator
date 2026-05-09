// blocks/world.js — Blockly block definitions

export function registerWorldBlocks(Blockly) {

// ── WORLD — simple actions ─────────────────────────────────────────────────────

Blockly.Blocks['npc_activate_block'] = {
  init() {
    this.appendDummyInput()
      .appendField('⚡ Activate Block X')
      .appendField(new Blockly.FieldNumber(0), 'X')
      .appendField('Y').appendField(new Blockly.FieldNumber(0), 'Y')
      .appendField('Z').appendField(new Blockly.FieldNumber(0), 'Z')
      .appendField(new Blockly.FieldDropdown([
        ['ON', 'true'], ['OFF', 'false'], ['Toggle', 'toggle'],
      ]), 'STATE');
    this.appendValueInput('X_VAR').setCheck(null).appendField('X var');
    this.appendValueInput('Y_VAR').setCheck(null).appendField('Y var');
    this.appendValueInput('Z_VAR').setCheck(null).appendField('Z var');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#283593');
    this.setTooltip('ACTIVATE BLOCK\nToggle or set a block switch at coordinates X, Y, Z.\nUse Lua variable blocks to pass dynamic coordinates.');
  }
};

Blockly.Blocks['npc_move_to'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚶 Move NPC to X')
      .appendField(new Blockly.FieldNumber(0), 'X')
      .appendField('Y').appendField(new Blockly.FieldNumber(0), 'Y')
      .appendField('Z').appendField(new Blockly.FieldNumber(0), 'Z');
    this.appendValueInput('X_VAR').setCheck(null).appendField('X var');
    this.appendValueInput('Y_VAR').setCheck(null).appendField('Y var');
    this.appendValueInput('Z_VAR').setCheck(null).appendField('Z var');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#283593');
    this.setTooltip('MOVE NPC TO\nMove the NPC to block coordinates X, Y, Z.');
  }
};

Blockly.Blocks['npc_destroy_ship'] = {
  init() {
    this.appendDummyInput()
      .appendField('💥 Destroy Entity UID')
      .appendField(new Blockly.FieldTextInput('ENTITY_SHIP_target'), 'UID');
    this.appendStatementInput('SUCCESS').setCheck(null).appendField('✅ Destroyed →');
    this.appendStatementInput('FAIL')   .setCheck(null).appendField('❌ Not found →');
    this.setPreviousStatement(true, null);
    this.setColour('#283593');
    this.setTooltip('DESTROY SHIP\nDestroy the ship with the given entity UID.\nFormat: ENTITY_SHIP_<name>.');
  }
};

Blockly.Blocks['npc_give_gravity'] = {
  init() {
    this.appendDummyInput()
      .appendField('🌍 Set Player Gravity')
      .appendField(new Blockly.FieldDropdown([['ON', 'true'], ['OFF', 'false']]), 'STATE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#283593');
    this.setTooltip('GIVE GRAVITY\nEnable or disable personal gravity for the player.');
  }
};

Blockly.Blocks['npc_call_tutorial'] = {
  init() {
    this.appendDummyInput()
      .appendField('📖 Start Tutorial')
      .appendField(new Blockly.FieldTextInput('intro_tutorial'), 'NAME');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#283593');
    this.setTooltip('CALL TUTORIAL\nTrigger a StarMade tutorial step by name.');
  }
};

}
