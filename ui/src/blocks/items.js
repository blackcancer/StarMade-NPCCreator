// blocks/items.js — Blockly block definitions

export function registerItemsBlocks(Blockly) {

// ── ITEMS — mix simple + multi-result ──────────────────────────────────────────

// Simple: give credits (always succeeds)
Blockly.Blocks['npc_give_credits'] = {
  init() {
    this.appendDummyInput()
      .appendField('💰 Give Credits')
      .appendField(new Blockly.FieldNumber(10000, -999999999, 999999999), 'AMOUNT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#2e7d32');
    this.setTooltip('GIVE CREDITS\nAdd (or remove if negative) credits to the player.\nReactions: 0 = done, -1 = player entity not found.');
  }
};

// Branch: check inventory
Blockly.Blocks['npc_check_inventory'] = {
  init() {
    this.appendDummyInput()
      .appendField('🎒 Check Inventory — item type')
      .appendField(new Blockly.FieldNumber(424, 0), 'ITEM_TYPE')
      .appendField('qty ≥')
      .appendField(new Blockly.FieldNumber(1, 1), 'COUNT');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Has item →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ Missing →');
    this.setPreviousStatement(true, null);
    this.setColour('#d84315');
    this.setTooltip('CHECK INVENTORY\nBranch based on whether the player has COUNT of ITEM_TYPE.\nTHEN = has enough, ELSE = not enough.');
  }
};

// Multi-result: take item
Blockly.Blocks['npc_take_item'] = {
  init() {
    this.appendDummyInput()
      .appendField('🎒 Take Item — type')
      .appendField(new Blockly.FieldNumber(424, 0), 'ITEM_TYPE')
      .appendField('qty')
      .appendField(new Blockly.FieldNumber(1, 1), 'COUNT');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Taken →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ Not enough →');
    this.setPreviousStatement(true, null);
    this.setColour('#d84315');
    this.setTooltip('TAKE ITEM\nRemove N items from the player\'s inventory.');
  }
};

// Multi-result: sell item
Blockly.Blocks['npc_sell_item'] = {
  init() {
    this.appendDummyInput()
      .appendField('🛒 Sell Item')
      .appendField(new Blockly.FieldDropdown([
        ['Laser Pistol', 'laser'], ['Sniper Rifle', 'sniper'], ['Rocket Launcher', 'rocket'],
        ['Helmet', 'helmet'], ['Healing Beam', 'healing'], ['Power Supply Beam', 'power'],
        ['Marker Beam', 'marker'], ['Transporter Beacon', 'transporter'],
        ['Grapple Beam', 'grapple'], ['Torch Beam', 'torch'],
        ['Build Prohibiter', 'prohibiter'], ['Flash Light', 'flashlight'],
      ]), 'ITEM')
      .appendField('for')
      .appendField(new Blockly.FieldNumber(100000, 0), 'PRICE')
      .appendField('credits');
    this.appendValueInput('PRICE_VAR').setCheck(null).appendField('or var');
    this.appendStatementInput('SOLD')      .setCheck(null).appendField('✅ Sold →');
    this.appendStatementInput('NO_CREDITS').setCheck(null).appendField('❌ No credits →');
    this.appendStatementInput('INV_FULL')  .setCheck(null).appendField('❌ Inv full →');
    this.setPreviousStatement(true, null);
    this.setColour('#d84315');
    this.setTooltip('SELL ITEM\nSell a weapon or tool to the player for PRICE credits.\nReactions: 0 = sold, -1 = not enough credits, -2 = inventory full, -3 = faction mismatch.');
  }
};

// Multi-result: give type
Blockly.Blocks['npc_give_type'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Give Block Type')
      .appendField(new Blockly.FieldNumber(424, 0), 'TYPE_ID')
      .appendField('×')
      .appendField(new Blockly.FieldNumber(1, 1), 'COUNT');
    this.appendValueInput('COUNT_VAR').setCheck(null).appendField('or var');
    this.appendStatementInput('GIVEN')     .setCheck(null).appendField('✅ Given →');
    this.appendStatementInput('NO_CREDITS').setCheck(null).appendField('❌ No credits →');
    this.appendStatementInput('INV_FULL')  .setCheck(null).appendField('❌ Inv full →');
    this.setPreviousStatement(true, null);
    this.setColour('#d84315');
    this.setTooltip('GIVE ITEM TYPE\nGive COUNT units of block TYPE_ID to the player for free.\nUse the block/item numeric ID from the game registry.');
  }
};

// Simple: send message
Blockly.Blocks['npc_send_message'] = {
  init() {
    this.appendDummyInput()
      .appendField('📨 HUD Message')
      .appendField(new Blockly.FieldDropdown([
        ['Info (white)', 'info'], ['Warning (orange)', 'warn'], ['Error (red)', 'error'],
      ]), 'TYPE');
    this.appendDummyInput()
      .appendField('Text')
      .appendField(new Blockly.FieldTextInput('Quest updated!'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#6a0032');
    this.setTooltip('SEND MESSAGE\nSend a server notification to the player.\nTypes: info (blue), warn (yellow), error (red).\nPlaceholders: {name} {partner} {faction} {owner} {self}.');
  }
};

// Multi-result: give meta item
Blockly.Blocks['npc_give_meta_item'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Give Meta Item')
      .appendField(new Blockly.FieldDropdown([
        ['Weapon', 'WEAPON'], ['Helmet', 'HELMET'], ['Blueprint', 'BLUEPRINT'],
        ['Recipe', 'RECIPE'], ['Log Book', 'LOG_BOOK'], ['Flash Light', 'FLASH_LIGHT'],
        ['Build Prohibiter', 'BUILD_PROHIBITER'], ['Block Storage', 'BLOCK_STORAGE'],
        ['Virtual Blueprint', 'VIRTUAL_BLUEPRINT'],
      ]), 'META_TYPE')
      .appendField('sub')
      .appendField(new Blockly.FieldNumber(0, 0), 'SUB_TYPE')
      .appendField('cost (credits)')
      .appendField(new Blockly.FieldNumber(0, 0), 'COST');
    this.appendStatementInput('GIVEN')     .setCheck(null).appendField('✅ Given →');
    this.appendStatementInput('NO_CREDITS').setCheck(null).appendField('❌ No credits →');
    this.appendStatementInput('INV_FULL')  .setCheck(null).appendField('❌ Inv full →');
    this.setPreviousStatement(true, null);
    this.setColour('#6a0032');
    this.setTooltip('GIVE META ITEM\nGive a meta/blueprint item to the player.\nMeta type = entity class name, sub type = variant, cost = credits charged.\nReactions: 0 = given, -1 = not enough credits, -2 = inventory full.');
  }
};

}
