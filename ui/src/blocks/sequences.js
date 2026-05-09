// blocks/sequences.js — Blockly block definitions

export function registerSequencesBlocks(Blockly) {

// ── SEQUENCES ──────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_auto_sequence'] = {
  init() {
    this.appendDummyInput()
      .appendField('▶ Sequence')
      .appendField(new Blockly.FieldTextInput('mySequence'), 'NAME');
    this.appendDummyInput()
      .appendField('Lua steps (semicolons)')
      .appendField(new Blockly.FieldTextInput('dialogObject:moveTo(0,0,0)'), 'BODY');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#546e7a');
    this.setTooltip('AUTO SEQUENCE\nRun a custom Lua body as a hook then auto-advance.\nSeparate multiple statements with semicolons.');
  }
};

Blockly.Blocks['npc_wait_until'] = {
  init() {
    this.appendValueInput('COND').setCheck('npc_condition').appendField('⏳ Wait until');
    this.appendDummyInput()
      .appendField('Waiting text')
      .appendField(new Blockly.FieldTextInput('Please wait...'), 'WAIT');
    this.appendStatementInput('DONE').setCheck(null).appendField('✅ Done →');
    this.setPreviousStatement(true, null);
    this.setColour('#546e7a');
    this.setTooltip('WAIT UNTIL\nPoll a condition. Loops back to itself until the condition is true.\nAttach an expression block to COND.');
  }
};

// ── DELAYED FOLLOW-UP ───────────────────────────────────────────────────────────
// Trigger an action only after an async condition becomes true (e.g. NPC reached position)

Blockly.Blocks['npc_delayed_followup'] = {
  init() {
    this.appendValueInput('CONDITION').setCheck('npc_condition').appendField('⏳ Delayed: when');
    this.appendDummyInput()
      .appendField('then run hook')
      .appendField(new Blockly.FieldTextInput('myFollowUpFunc'), 'FOLLOWUP_HOOK');
    this.appendDummyInput()
      .appendField('Lua body (return int)')
      .appendField(new Blockly.FieldTextInput('return 0'), 'FOLLOWUP_BODY');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6a0032');
    this.setTooltip(
      'DELAYED FOLLOW-UP\nRegister a hook that fires asynchronously once a condition becomes true.\n\n' +
      'Uses: dialogObject:addDelayedConditionFollowUpHook()\n' +
      'Example: move NPC to position, then trigger a follow-up action once arrived.\n' +
      'The condition is re-evaluated each server tick until true.'
    );
  }
};

}
