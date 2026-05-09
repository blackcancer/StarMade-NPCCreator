// blocks/branches.js — Blockly block definitions

export function registerBranchesBlocks(Blockly) {

// ── CONDITIONS / BRANCHES ──────────────────────────────────────────────────────
// Note: NO setNextStatement — flow is entirely through THEN/ELSE

Blockly.Blocks['npc_if_condition'] = {
  init() {
    this.appendValueInput('COND').setCheck('npc_condition').appendField('🔀 If');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ True →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ False →');
    this.setPreviousStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('IF CONDITION\nBranch using a composable expression block.\nAttach expression blocks from the Expressions category to COND.');
  }
};

Blockly.Blocks['npc_check_credits'] = {
  init() {
    this.appendDummyInput()
      .appendField('💰 Check Credits ≥')
      .appendField(new Blockly.FieldNumber(50000, 0), 'AMOUNT');
    this.appendValueInput('AMOUNT_VAR').setCheck(null).appendField('or var');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Enough →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ Not enough →');
    this.setPreviousStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('CHECK CREDITS\nBranch based on whether the player has enough credits.\nTHEN = enough, ELSE = not enough.');
  }
};

Blockly.Blocks['npc_check_player_value'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧪 Check Player')
      .appendField(new Blockly.FieldDropdown([
        ['Credits','credits'], ['Health','health'], ['Max Health','maxHealth'],
        ['Faction ID','factionId'], ['Sector ID','sectorId'],
      ]), 'VALUE_TYPE')
      .appendField(new Blockly.FieldDropdown([
        ['≥','>='], ['>','>'], ['=','=='], ['≠','~='], ['≤','<='], ['<','<'],
      ]), 'OP')
      .appendField(new Blockly.FieldNumber(0), 'VALUE');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('or var');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('CHECK PLAYER VALUE\nBranch based on any numeric player stat.\nTypes: credits, health, maxHealth, factionId, sectorId.');
  }
};

Blockly.Blocks['npc_check_custom_condition'] = {
  init() {
    this.appendDummyInput()
      .appendField('🔧 Custom Condition')
      .appendField(new Blockly.FieldTextInput('dialogObject:getEntity() ~= nil'), 'EXPR');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ True →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ False →');
    this.setPreviousStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('CUSTOM CONDITION\nWrite raw Lua that returns 0 (THEN) or -1 (ELSE).');
  }
};

Blockly.Blocks['npc_is_at_block'] = {
  init() {
    this.appendDummyInput()
      .appendField('📍 Player At Block X')
      .appendField(new Blockly.FieldNumber(0), 'X')
      .appendField('Y').appendField(new Blockly.FieldNumber(0), 'Y')
      .appendField('Z').appendField(new Blockly.FieldNumber(0), 'Z');
    this.appendValueInput('X_VAR').setCheck(null).appendField('X var');
    this.appendValueInput('Y_VAR').setCheck(null).appendField('Y var');
    this.appendValueInput('Z_VAR').setCheck(null).appendField('Z var');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ In position →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ Not there →');
    this.setPreviousStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('IS AT BLOCK\nBranch based on whether the player is at coordinates X, Y, Z.');
  }
};

}
