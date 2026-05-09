// blocks/crew.js — Blockly block definitions

export function registerCrewBlocks(Blockly) {

// ── CREW — multi-result ─────────────────────────────────────────────────────────

Blockly.Blocks['npc_hire'] = {
  init() {
    this.appendDummyInput()
      .appendField('🤝 Hire Crew — price')
      .appendField(new Blockly.FieldNumber(50000, 0), 'PRICE')
      .appendField('credits');
    this.appendValueInput('PRICE_VAR').setCheck(null).appendField('or var');
    this.appendStatementInput('HIRED')    .setCheck(null).appendField('✅ Hired →');
    this.appendStatementInput('CREW_FULL').setCheck(null).appendField('❌ Crew full / already in team →');
    this.appendStatementInput('REFUSED')  .setCheck(null).appendField('❌ Different faction →');
    this.setPreviousStatement(true, null);
    this.setColour('#1b5e20');
    this.setTooltip('HIRE CREW\nDeduct PRICE credits and hire the NPC as crew.\nReactions: 0 = hired, -1 = not enough credits, -2 = crew slot full, -3 = faction mismatch.');
  }
};

Blockly.Blocks['npc_unhire'] = {
  init() {
    this.appendDummyInput()
      .appendField('🚪 Dismiss Crew');
    this.appendStatementInput('SUCCESS').setCheck(null).appendField('✅ Done →');
    this.appendStatementInput('FAIL')   .setCheck(null).appendField('❌ Failed →');
    this.setPreviousStatement(true, null);
    this.setColour('#1b5e20');
    this.setTooltip('DISMISS CREW\nRemove this NPC from the player\'s crew.');
  }
};

Blockly.Blocks['npc_spawn_crew'] = {
  init() {
    this.appendDummyInput()
      .appendField('👤 Spawn Crew — price')
      .appendField(new Blockly.FieldNumber(50000, 0), 'PRICE')
      .appendField('credits');
    this.appendValueInput('PRICE_VAR').setCheck(null).appendField('or var');
    this.appendStatementInput('SUCCESS')   .setCheck(null).appendField('✅ Spawned →');
    this.appendStatementInput('NO_CREDITS').setCheck(null).appendField('❌ No credits →');
    this.appendStatementInput('CREW_FULL') .setCheck(null).appendField('❌ Crew full →');
    this.setPreviousStatement(true, null);
    this.setColour('#1b5e20');
    this.setTooltip('SPAWN CREW\nSpawn a crew member at PRICE credits.\nThe player must be in a ship with a free crew slot.');
  }
};

}
