// blocks/stock.js — Blockly block definitions

export function registerStockBlocks(Blockly) {

// ── STOCK ──────────────────────────────────────────────────────────────────────

Blockly.Blocks['npc_stock_init'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Stock Init')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE')
      .appendField('qty')
      .appendField(new Blockly.FieldNumber(10, 0), 'QTY');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#33691e');
    this.setTooltip('STOCK INIT\nInitialize shop stock for ITEM_TYPE with QTY units if not already set.');
  }
};

Blockly.Blocks['npc_stock_sell'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Stock Sell')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE');
    this.appendDummyInput()
      .appendField('price')
      .appendField(new Blockly.FieldNumber(1000, 0), 'PRICE')
      .appendField('qty')
      .appendField(new Blockly.FieldNumber(1, 1), 'COUNT');
    this.appendStatementInput('SOLD').setCheck(null).appendField('✅ Sold →');
    this.appendStatementInput('FAIL').setCheck(null).appendField('❌ No credits / out of stock →');
    this.setPreviousStatement(true, null);
    this.setColour('#33691e');
    this.setTooltip('STOCK SELL\nDeduct credits and remove items from shop stock.\nReactions: 0 = sold, 1 = not enough credits or out of stock.');
  }
};

Blockly.Blocks['npc_stock_add'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Restock')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE')
      .appendField('+')
      .appendField(new Blockly.FieldNumber(1, 1), 'QTY');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#33691e');
    this.setTooltip('STOCK ADD\nAdd QTY units to the shop stock for ITEM_TYPE.');
  }
};

Blockly.Blocks['npc_stock_reset'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Stock Reset')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE')
      .appendField('qty')
      .appendField(new Blockly.FieldNumber(10, 0), 'QTY');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#33691e');
    this.setTooltip('STOCK RESET\nForce the shop stock for ITEM_TYPE to exactly QTY units.');
  }
};

Blockly.Blocks['npc_get_stock'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Show Stock')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE');
    this.appendDummyInput()
      .appendField('Text (%s = qty)')
      .appendField(new Blockly.FieldTextInput('Available: %s'), 'TEXT');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour('#33691e');
    this.setTooltip('GET STOCK\nDisplay the current stock quantity in a text node.\n%s is replaced by the quantity.');
  }
};

Blockly.Blocks['npc_check_stock'] = {
  init() {
    this.appendDummyInput()
      .appendField('📦 Check Stock')
      .appendField(new Blockly.FieldTextInput('guild_shop'), 'SHOP_ID')
      .appendField('item')
      .appendField(new Blockly.FieldNumber(0, 0), 'ITEM_TYPE')
      .appendField(new Blockly.FieldDropdown([
        ['≥','>='], ['>','>'], ['=','=='], ['≤','<='], ['<','<'],
      ]), 'OP')
      .appendField(new Blockly.FieldNumber(1), 'VALUE');
    this.appendStatementInput('THEN').setCheck(null).appendField('✅ Yes →');
    this.appendStatementInput('ELSE').setCheck(null).appendField('❌ No →');
    this.setPreviousStatement(true, null);
    this.setColour('#33691e');
    this.setTooltip('CHECK STOCK\nBranch on the current stock quantity.\nTHEN = condition met, ELSE = not met.');
  }
};

}
