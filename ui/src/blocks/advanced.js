// blocks/advanced.js — Blockly block definitions

export function registerAdvancedBlocks(Blockly) {

// ── ADVANCED ───────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_custom_hook'] = {
  init() {
    this.appendDummyInput()
      .appendField('🔧 Custom Hook')
      .appendField(new Blockly.FieldTextInput('myHookFunc'), 'NAME');
    this.appendDummyInput()
      .appendField('Lua body (must return int)')
      .appendField(new Blockly.FieldTextInput('return 0'), 'BODY');
    this.appendStatementInput('SUCCESS').setCheck(null).appendField('✅ Return 0 →');
    this.appendStatementInput('FAIL')   .setCheck(null).appendField('❌ Return -1 →');
    this.setPreviousStatement(true, null);
    this.setColour('#6a0032');
    this.setTooltip('CUSTOM HOOK\nWrite raw Lua in a hook body.\nReturn 0 for SUCCESS path, -1 for FAIL path.');
  }
};

Blockly.Blocks['npc_get_info'] = {
  init() {
    this.appendDummyInput()
      .appendField('ℹ Show Player Info')
      .appendField(new Blockly.FieldDropdown([
        ['Credits','credits'], ['Health','health'], ['Max Health','maxHealth'],
        ['Faction ID','factionId'], ['Creative','creative'], ['Sector ID','sectorId'],
      ]), 'INFO_TYPE');
    this.appendDummyInput()
      .appendField('Text (%s = value)')
      .appendField(new Blockly.FieldTextInput('Your credits: %s'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6a0032');
    this.setTooltip('GET INFO\nDisplay a live player stat in a text node.\n%s is replaced by the real value at runtime.\nTypes: credits, health, maxHealth, factionId, sectorId, creative.');
  }
};

// ── CONVERSATION STATE ───────────────────────────────────────────────────────────────────
// Native NPC-side state storage (no DB needed, stored on the NPC entity)

Blockly.Blocks['npc_set_conv_state'] = {
  init() {
    this.appendDummyInput()
      .appendField('📌 Set Conv State')
      .appendField(new Blockly.FieldTextInput('quest_accepted'), 'STATE');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#7f1d1d');
    this.setTooltip(
      'SET CONVERSATION STATE\nStore a named state on the NPC (zero DB needed).\n\n' +
      'Uses: dialogObject:setConversationState(name)\n' +
      'Persists between dialog openings on the same NPC.\n' +
      'Retrieve with the Cond Conv State expression block.'
    );
  }
};

Blockly.Blocks['npc_cond_conv_state'] = {
  init() {
    this.appendDummyInput()
      .appendField('📌 Conv State is')
      .appendField(new Blockly.FieldTextInput('quest_accepted'), 'STATE');
    this.setOutput(true, 'npc_condition');
    this.setColour('#455a64');
    this.setTooltip(
      'COND CONV STATE\nTrue if the NPC conversation state equals the given name.\n\n' +
      'Uses: dialogObject:getConversationState()\n' +
      'Use inside If Condition or Wait Until.'
    );
  }
};

}
