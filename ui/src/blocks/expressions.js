// blocks/expressions.js — Blockly block definitions

export function registerExpressionsBlocks(Blockly) {

// ── CONDITION EXPRESSIONS (green — plugged into If Condition) ──────────────────

Blockly.Blocks['npc_cond_player_value'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧪')
      .appendField(new Blockly.FieldDropdown([
        ['Credits','credits'], ['Health','health'], ['Max Health','maxHealth'],
        ['Faction ID','factionId'], ['Sector ID','sectorId'],
      ]), 'VALUE_TYPE')
      .appendField(new Blockly.FieldDropdown([
        ['≥','>='], ['>','>'], ['=','=='], ['≠','~='], ['≤','<='], ['<','<'],
      ]), 'OP')
      .appendField(new Blockly.FieldNumber(0), 'VALUE');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('or var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: player stat comparison');
  }
};

Blockly.Blocks['npc_cond_flag'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚦')
      .appendField(new Blockly.FieldDropdown([
        ['Creative mode','creative'], ['NPC in team','inTeam'],
      ]), 'FLAG')
      .appendField(new Blockly.FieldDropdown([['is ON','true'],['is OFF','false']]), 'EXPECT');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: built-in boolean flag');
  }
};

Blockly.Blocks['npc_cond_is_at_block'] = {
  init() {
    this.appendDummyInput()
      .appendField('📍 At X')
      .appendField(new Blockly.FieldNumber(0), 'X')
      .appendField('Y').appendField(new Blockly.FieldNumber(0), 'Y')
      .appendField('Z').appendField(new Blockly.FieldNumber(0), 'Z');
    this.appendValueInput('X_VAR').setCheck(null).appendField('X var');
    this.appendValueInput('Y_VAR').setCheck(null).appendField('Y var');
    this.appendValueInput('Z_VAR').setCheck(null).appendField('Z var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: player at block coordinates');
  }
};

Blockly.Blocks['npc_cond_custom'] = {
  init() {
    this.appendDummyInput()
      .appendField('🔧')
      .appendField(new Blockly.FieldTextInput('false'), 'EXPR');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: raw Lua boolean expression');
  }
};

Blockly.Blocks['npc_cond_sqlite_value'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField('.').appendField(new Blockly.FieldTextInput('done'), 'COL')
      .appendField(new Blockly.FieldDropdown([['=','=='],['≠','~='],['≥','>='],['>',' >'],['≤','<='],['<','<']]), 'OP')
      .appendField(new Blockly.FieldTextInput('1'), 'VALUE');
    this.appendDummyInput().appendField('default').appendField(new Blockly.FieldTextInput('0'), 'DEFAULT');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('value var');
    this.appendValueInput('DEFAULT_VAR').setCheck(null).appendField('default var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: compare a DB column value');
  }
};

Blockly.Blocks['npc_cond_sqlite_exists'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 Row in')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField(new Blockly.FieldDropdown([['exists','true'],['does NOT exist','false']]), 'EXPECT');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: player row exists in table');
  }
};

Blockly.Blocks['npc_cond_sqlite_number'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 Number')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField('.').appendField(new Blockly.FieldTextInput('step'), 'COL')
      .appendField(new Blockly.FieldDropdown([['=','=='],['≠','~='],['≥','>='],['>',' >'],['≤','<='],['<','<']]), 'OP')
      .appendField(new Blockly.FieldNumber(0), 'VALUE');
    this.appendDummyInput().appendField('default').appendField(new Blockly.FieldNumber(0), 'DEFAULT');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('value var');
    this.appendValueInput('DEFAULT_VAR').setCheck(null).appendField('default var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: compare a numeric DB column');
  }
};

Blockly.Blocks['npc_cond_sqlite_text'] = {
  init() {
    this.appendDummyInput()
      .appendField('🗄 Text')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'TABLE')
      .appendField('.').appendField(new Blockly.FieldTextInput('state'), 'COL')
      .appendField(new Blockly.FieldDropdown([['=','=='],['≠','~=']]), 'OP')
      .appendField(new Blockly.FieldTextInput('done'), 'VALUE');
    this.appendDummyInput().appendField('default').appendField(new Blockly.FieldTextInput(''), 'DEFAULT');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('value var');
    this.appendValueInput('DEFAULT_VAR').setCheck(null).appendField('default var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: compare a text DB column');
  }
};

Blockly.Blocks['npc_cond_memory_number'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧠 Number')
      .appendField(new Blockly.FieldTextInput('quest_step'), 'KEY')
      .appendField(new Blockly.FieldDropdown([['=','=='],['≠','~='],['≥','>='],['>',' >'],['≤','<='],['<','<']]), 'OP')
      .appendField(new Blockly.FieldNumber(0), 'VALUE');
    this.appendDummyInput().appendField('default').appendField(new Blockly.FieldNumber(0), 'DEFAULT');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('value var');
    this.appendValueInput('DEFAULT_VAR').setCheck(null).appendField('default var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: compare a numeric memory key');
  }
};

Blockly.Blocks['npc_cond_memory_text'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧠 Text')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'KEY')
      .appendField(new Blockly.FieldDropdown([['=','=='],['≠','~=']]), 'OP')
      .appendField(new Blockly.FieldTextInput('done'), 'VALUE');
    this.appendDummyInput().appendField('default').appendField(new Blockly.FieldTextInput(''), 'DEFAULT');
    this.appendValueInput('VALUE_VAR').setCheck(null).appendField('value var');
    this.appendValueInput('DEFAULT_VAR').setCheck(null).appendField('default var');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: compare a text memory key');
  }
};

Blockly.Blocks['npc_cond_memory_exists'] = {
  init() {
    this.appendDummyInput()
      .appendField('🧠 Key')
      .appendField(new Blockly.FieldTextInput('quest_state'), 'KEY')
      .appendField(new Blockly.FieldDropdown([['exists','true'],['does NOT exist','false']]), 'EXPECT');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: memory key exists');
  }
};

Blockly.Blocks['npc_cond_quest_status'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID')
      .appendField('status is')
      .appendField(new Blockly.FieldDropdown([
        ['none','none'], ['active','active'], ['complete','complete'], ['failed','failed'],
      ]), 'STATUS');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: quest has a given status');
  }
};

Blockly.Blocks['npc_cond_quest_step'] = {
  init() {
    this.appendDummyInput()
      .appendField('📜 Quest')
      .appendField(new Blockly.FieldTextInput('intro_delivery'), 'QUEST_ID')
      .appendField('step')
      .appendField(new Blockly.FieldDropdown([['=','=='],['≥','>='],['>',' >'],['≤','<='],['<','<']]), 'OP')
      .appendField(new Blockly.FieldNumber(1), 'STEP');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: quest step comparison');
  }
};

Blockly.Blocks['npc_cond_rep'] = {
  init() {
    this.appendDummyInput()
      .appendField('⭐')
      .appendField(new Blockly.FieldTextInput('trading_guild'), 'NPC_ID')
      .appendField(new Blockly.FieldDropdown([['≥','>='],['>',' >'],['=','=='],['≤','<='],['<','<']]), 'OP')
      .appendField(new Blockly.FieldNumber(0), 'VALUE');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: reputation comparison');
  }
};

Blockly.Blocks['npc_cond_cooldown'] = {
  init() {
    this.appendDummyInput()
      .appendField('⏱')
      .appendField(new Blockly.FieldTextInput('daily_deal'), 'ACTION_ID')
      .appendField(new Blockly.FieldDropdown([['is expired','expired'],['is active','active']]), 'STATE');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: cooldown state');
  }
};

Blockly.Blocks['npc_cond_stock'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item').appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE')
      .appendField(new Blockly.FieldDropdown([['≥','>='],['>',' >'],['=','=='],['≤','<='],['<','<']]), 'OP')
      .appendField(new Blockly.FieldNumber(1), 'VALUE');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: stock level comparison');
  }
};

Blockly.Blocks['npc_cond_flag_db'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚩')
      .appendField(new Blockly.FieldTextInput('first_visit'), 'FLAG_NAME')
      .appendField(new Blockly.FieldDropdown([['is ON','true'],['is OFF','false']]), 'VALUE');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: named player flag value');
  }
};

Blockly.Blocks['npc_cond_world'] = {
  init() {
    this.appendDummyInput()
      .appendField('🌐')
      .appendField(new Blockly.FieldTextInput('guild_event_active'), 'KEY')
      .appendField(new Blockly.FieldDropdown([
        ['= text','== text'], ['≠ text','~= text'],
        ['= num','== num'], ['≥ num','>= num'], ['> num','> num'],
      ]), 'OP')
      .appendField(new Blockly.FieldTextInput('true'), 'VALUE');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: world state comparison');
  }
};

Blockly.Blocks['npc_cond_and'] = {
  init() {
    this.appendValueInput('A').setCheck('npc_condition').appendField('AND');
    this.appendValueInput('B').setCheck('npc_condition');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: both A and B must be true');
  }
};

Blockly.Blocks['npc_cond_or'] = {
  init() {
    this.appendValueInput('A').setCheck('npc_condition').appendField('OR');
    this.appendValueInput('B').setCheck('npc_condition');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: at least one of A or B is true');
  }
};

Blockly.Blocks['npc_cond_not'] = {
  init() {
    this.appendValueInput('COND').setCheck('npc_condition').appendField('NOT');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip('EXPR: negate a condition');
  }
};

}
