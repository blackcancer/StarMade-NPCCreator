// blocks/variables.js — Blockly block definitions

export function registerVariablesBlocks(Blockly) {

// ── VARIABLES ──────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_lua_var'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧮 Variable')
      .appendField(new Blockly.FieldTextInput('myVar'), 'NAME')
      .appendField('type')
      .appendField(new Blockly.FieldDropdown([
        ['number', 'number'], ['text', 'text'], ['raw Lua', 'raw'],
      ]), 'MODE');
    this.appendDummyInput()
      .appendField('=')
      .appendField(new Blockly.FieldTextInput('0'), 'VALUE');
    this.setColour('#6a1b9a');
    this.setTooltip('VARIABLE\nGlobal Lua constant. Reference it with the Var Reference block.');
  }
};

Blockly.Blocks['npc_var_ref'] = {
  init() {
    this.appendDummyInput()
      .appendField('📎')
      .appendField(new Blockly.FieldTextInput('myVar'), 'NAME');
    this.setOutput(true, null);
    this.setColour('#6a1b9a');
    this.setTooltip('VAR REFERENCE\nUse a declared variable as a numeric input.');
  }
};

}
