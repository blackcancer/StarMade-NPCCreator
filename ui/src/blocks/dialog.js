// blocks/dialog.js — Blockly block definitions

export function registerDialogBlocks(Blockly) {

// ── DIALOG ─────────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_greeting'] = {
  init() {
    this.appendDummyInput()
      .appendField('💬 Greeting')
      .appendField(new Blockly.FieldTextInput('Hello {name}! I am {partner} of {faction}.'), 'TEXT');
    this.appendDummyInput()
      .appendField('Show for (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS');
    this.appendStatementInput('CHOICES').setCheck(['npc_choice', 'npc_goback']).appendField('Choices');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#1565c0');
    this.setTooltip('GREETING\nRoot dialog node. The NPC speaks first.\nAttach Choice blocks to give the player options.\nPlaceholders: {name} {partner} {faction} {owner} {self}');
  }
};

Blockly.Blocks['npc_say'] = {
  init() {
    this.appendDummyInput()
      .appendField('💬 Say')
      .appendField(new Blockly.FieldTextInput('...'), 'TEXT');
    this.appendDummyInput()
      .appendField('Duration (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#1565c0');
    this.setTooltip('SAY\nNPC speaks then auto-advances to the next block after the duration.\nPlaceholders: {name} {partner} {faction} {owner} {self}');
  }
};

Blockly.Blocks['npc_say_menu'] = {
  init() {
    this.appendDummyInput()
      .appendField('💬 Say with choices')
      .appendField(new Blockly.FieldTextInput('What can I do for you?'), 'TEXT');
    this.appendDummyInput()
      .appendField('Duration (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS');
    this.appendStatementInput('CHOICES').setCheck(['npc_choice', 'npc_goback']).appendField('Choices');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#1565c0');
    this.setTooltip('SAY WITH CHOICES\nLike Greeting but usable anywhere in the tree.\nAttach Choice blocks inside.\nPlaceholders: {name} {partner} {faction} {owner} {self}');
  }
};

Blockly.Blocks['npc_choice'] = {
  init() {
    this.appendDummyInput()
      .appendField('📌 Choice')
      .appendField(new Blockly.FieldTextInput('What do you need?'), 'LABEL');
    this.appendStatementInput('ACTIONS').setCheck(null).appendField('→');
    this.setPreviousStatement(true, ['npc_choice', 'npc_goback']);
    this.setNextStatement(true, ['npc_choice', 'npc_goback']);
    this.setColour('#1565c0');
    this.setTooltip('CHOICE\nA player button. Chain multiple choices top-to-bottom.\nAttach actions inside the slot.');
  }
};

Blockly.Blocks['npc_goback'] = {
  init() {
    this.appendDummyInput()
      .appendField('↩ Go Back')
      .appendField(new Blockly.FieldTextInput('Never mind.'), 'LABEL');
    this.setPreviousStatement(true, ['npc_choice', 'npc_goback']);
    this.setNextStatement(true, ['npc_choice', 'npc_goback']);
    this.setColour('#1565c0');
    this.setTooltip('GO BACK\nReturns the player to the parent menu node.\nUseful at the end of a sub-menu.');
  }
};

// ── CONDITIONAL ENTRY ─────────────────────────────────────────────────────────────
// Root of the dialog can branch depending on an expression evaluated at open time

Blockly.Blocks['npc_cond_greeting'] = {
  init() {
    this.appendValueInput('COND').setCheck('npc_condition').appendField('🔀 If');
    this.appendDummyInput()
      .appendField('THEN — greeting text')
      .appendField(new Blockly.FieldTextInput('Welcome back!'), 'TEXT_THEN');
    this.appendDummyInput()
      .appendField('Duration (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS_THEN');
    this.appendStatementInput('CHOICES_THEN').setCheck(['npc_choice', 'npc_goback']).appendField('Choices →');
    this.appendDummyInput()
      .appendField('ELSE — greeting text')
      .appendField(new Blockly.FieldTextInput('Greetings, traveller.'), 'TEXT_ELSE');
    this.appendDummyInput()
      .appendField('Duration (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS_ELSE');
    this.appendStatementInput('CHOICES_ELSE').setCheck(['npc_choice', 'npc_goback']).appendField('Choices →');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#1565c0');
    this.setTooltip(
      'CONDITIONAL GREETING\nBranch the root dialog based on a condition evaluated when the player opens the dialog.\n\n' +
      'Typical use: different dialog if NPC is already in team, or quest already accepted.\n' +
      'Plug any Expression block into the left input.'
    );
  }
};

// ── SAY WITH VALUE ──────────────────────────────────────────────────────────────────
// Display a live player value inline in dialog text

Blockly.Blocks['npc_say_value'] = {
  init() {
    this.appendDummyInput()
      .appendField('💬 Say + Value')
      .appendField(new Blockly.FieldDropdown([
        ['Credits',   'credits'],
        ['Health',    'health'],
        ['Max Health','maxHealth'],
        ['Faction ID','factionId'],
        ['Sector ID', 'sectorId'],
        ['Conv State','convState'],
      ]), 'VALUE_TYPE');
    this.appendDummyInput()
      .appendField('Text (%s = value)')
      .appendField(new Blockly.FieldTextInput('You have %s credits.'), 'TEXT');
    this.appendDummyInput()
      .appendField('Duration (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#1565c0');
    this.setTooltip(
      'SAY WITH VALUE\nShow a text that includes a live player value.\n\n' +
      '%s is replaced by the actual value at runtime.\n' +
      'Placeholders {name} {partner} etc. also work.'
    );
  }
};

// ── CONFIRM ──────────────────────────────────────────────────────────────────────────
// Generic yes/no confirmation before an expensive action

Blockly.Blocks['npc_confirm'] = {
  init() {
    this.appendDummyInput()
      .appendField('❓ Confirm')
      .appendField(new Blockly.FieldTextInput('Are you sure?'), 'TEXT');
    this.appendDummyInput()
      .appendField('Duration (ms)')
      .appendField(new Blockly.FieldNumber(2000, 500, 30000, 500), 'MS');
    this.appendDummyInput()
      .appendField('Yes label')
      .appendField(new Blockly.FieldTextInput('Yes, proceed.'), 'YES_LABEL');
    this.appendDummyInput()
      .appendField('No label')
      .appendField(new Blockly.FieldTextInput('No, cancel.'), 'NO_LABEL');
    this.appendStatementInput('YES').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('NO') .setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#1565c0');
    this.setTooltip(
      'CONFIRM\nShow a yes/no prompt before an action.\n\n' +
      'Common pattern: ask before hire, buy expensive item, irreversible action.\n' +
      'The "No" branch typically uses a Say block to acknowledge and end.'
    );
  }
};

}
