// blocks/persistence.js — Blockly block definitions

export function registerPersistenceBlocks(Blockly) {

// ── SQLITE / MEMORY — simple actions ───────────────────────────────────────────

Blockly.Blocks['npc_sqlite_table'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 SQLite Table')
      .appendField(new Blockly.FieldTextInput('my_table'), 'TABLE');
    this.appendDummyInput()
      .appendField('columns SQL')
      .appendField(new Blockly.FieldTextInput('player VARCHAR(255) NOT NULL, done INTEGER DEFAULT 0, PRIMARY KEY(player)'), 'COLS');
    this.setColour('#006064');
    this.setTooltip('SQLITE TABLE\nDeclare a persistent table (floating block, not in the flow).');
  }
};

Blockly.Blocks['npc_sqlite_get'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 Get')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('done'), 'COL')
      .appendField('default')
      .appendField(new Blockly.FieldTextInput('0'), 'DEFAULT')
      .appendField('→')
      .appendField(new Blockly.FieldTextInput('questDone'), 'VAR');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#006064');
    this.setTooltip('SQLITE GET\nRead a value from a custom HSQLDB table column.\nDEFAULT is used when no row exists.');
  }
};

Blockly.Blocks['npc_sqlite_set'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 Set')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('done'), 'COL')
      .appendField('=')
      .appendField(new Blockly.FieldTextInput('1'), 'VALUE');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('or var');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#006064');
    this.setTooltip('SQLITE SET\nUpsert a value into a custom HSQLDB table column.');
  }
};

Blockly.Blocks['npc_sqlite_increment'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 Increment')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('step'), 'COL')
      .appendField('+')
      .appendField(new Blockly.FieldNumber(1), 'AMOUNT');
    this.appendValueInput('AMOUNT_VAR').setCheck(null).appendField('or var');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#006064');
    this.setTooltip('SQLITE INCREMENT\nIncrement a numeric column in a custom HSQLDB table.');
  }
};

Blockly.Blocks['npc_memory_set'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧠 Memory Set')
      .appendField(new Blockly.FieldTextInput('my_key'), 'KEY')
      .appendField(new Blockly.FieldDropdown([
        ['number', 'number'], ['text', 'text'], ['raw', 'raw'],
      ]), 'MODE')
      .appendField('=')
      .appendField(new Blockly.FieldTextInput('0'), 'VALUE');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('or var');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#006064');
    this.setTooltip('MEMORY SET\nWrite a persistent key=value for the player.\nModes: text, number, raw Lua expression.');
  }
};

Blockly.Blocks['npc_memory_increment'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧠 Memory Increment')
      .appendField(new Blockly.FieldTextInput('my_counter'), 'KEY')
      .appendField('+')
      .appendField(new Blockly.FieldNumber(1), 'AMOUNT');
    this.appendValueInput('AMOUNT_VAR').setCheck(null).appendField('or var');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#006064');
    this.setTooltip('MEMORY INCREMENT\nAdd AMOUNT to a numeric persistent key for the player.');
  }
};

}
