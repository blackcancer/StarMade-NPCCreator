/**
 * @fileoverview Stock action generators.
 *
 * Handles shop stock mutation, selling, display and branch checks.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

// =============================================================================
// ACTION GENERATOR
// =============================================================================

/**
 * Try to generate Lua state for a block owned by this category.
 *
 * @param {Object} block Blockly block instance.
 * @param {Object} ctx Explicit generator dependencies from core.js.
 * @returns {string|undefined} Root node variable name when handled; undefined otherwise.
 */
export function genStockAction(block, ctx) {
  const {
    getOptionalVarName,
    sanitizeIdentPart,
    hashCode,
    luaStringLiteral,
    registerHook,
    makeNode,
    getNode,
    makeBranchAction,
    processActions,
    processActionBlock,
  } = ctx;

  switch (block.type) {
    case 'npc_stock_init': {
      const shopId   = block.getFieldValue('SHOP_ID');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const qty      = Number(block.getFieldValue('QTY') || 0);
      const hookFn   = `stockInitHook_${sanitizeIdentPart(shopId)}_${itemType}`;
      registerHook(hookFn, [
        `_stockInit(${luaStringLiteral(shopId)}, ${itemType}, ${qty})`,
        `return 0`,
      ]);
      const waitVn   = makeNode('Initializing stock...');
      const doneVn   = makeNode('Stock initialized.');
      const waitNode = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: doneVn }];
      return waitVn;
    }

    case 'npc_stock_sell': {

      const shopId   = block.getFieldValue('SHOP_ID');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const price    = Number(block.getFieldValue('PRICE')     || 0);
      const count    = Number(block.getFieldValue('COUNT')     || 1);
      const hookFn   = 'stockSellHook_' + sanitizeIdentPart(shopId) + '_' + itemType;
      registerHook(hookFn, [
        'local player = dialogObject:getOwnName()',
        'if dialogObject:getEntity():getCredits() < ' + price + ' then return 1 end',
        'if not _stockTake(' + luaStringLiteral(shopId) + ', ' + itemType + ', ' + count + ') then return 1 end',
        'dialogObject:getEntity():setCredits(dialogObject:getEntity():getCredits() - ' + price + ')',
        'dialogObject:giveType(' + itemType + ', ' + count + ')',
        'return 0',
      ]);
      const waitVn = makeNode('Processing...');
      const n = getNode(waitVn); n.hook = hookFn;
      n.reactions = [
        { code: 0, target: processActions(block, 'SOLD', waitVn) || makeNode('Here is your item.') },
        { code: 1, target: processActions(block, 'FAIL', waitVn) || makeNode('Sorry, out of stock.') },
      ];
      return waitVn;
    }

    case 'npc_stock_add': {
      const shopId   = block.getFieldValue('SHOP_ID');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const qty      = Number(block.getFieldValue('QTY') || 1);
      const success  = block.getFieldValue('SUCCESS') || 'Stock restocked.';
      const hookFn   = `stockAddHook_${sanitizeIdentPart(shopId)}_${itemType}`;
      registerHook(hookFn, [
        `_stockAdd(${luaStringLiteral(shopId)}, ${itemType}, ${qty})`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Restocking...');
      const successVn = makeNode(success);
      const waitNode  = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }

    case 'npc_check_stock': {
      const shopId   = block.getFieldValue('SHOP_ID');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const op       = block.getFieldValue('OP') || '>=';
      const value    = Number(block.getFieldValue('VALUE') || 1);
      const hookFn   = `checkStockHook_${sanitizeIdentPart(shopId)}_${itemType}`;
      return makeBranchAction(hookFn, [
        `if _stockGet(${luaStringLiteral(shopId)}, ${itemType}) ${op} ${value} then return 0 end`,
        `return -1`,
      ], block, 'Checking stock...');
    }

    case 'npc_get_stock': {
      const shopId   = block.getFieldValue('SHOP_ID');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const text     = block.getFieldValue('TEXT') || 'Available stock: %s';
      const hookFn   = `getStockHook_${sanitizeIdentPart(shopId)}_${itemType}`;
      registerHook(hookFn, [
        `local val = _stockGet(${luaStringLiteral(shopId)}, ${itemType})`,
        `return 0`,
      ]);
      const waitVn   = makeNode(text.replace('%s', '...'));
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      return waitVn;
    }

    case 'npc_stock_reset': {
      const shopId   = block.getFieldValue('SHOP_ID');
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const qty      = Number(block.getFieldValue('QTY') || 0);
      const success  = block.getFieldValue('SUCCESS') || 'Stock reset.';
      const hookFn   = `stockResetHook_${sanitizeIdentPart(shopId)}_${itemType}`;
      registerHook(hookFn, [
        `if _dbGet("SELECT 1 FROM npc_shop_stock WHERE shop_id=? AND item_type=?", ${luaStringLiteral(shopId)}, ${itemType}) == nil then`,
        `  _dbExec("INSERT INTO npc_shop_stock(shop_id,item_type,quantity) VALUES(?,?,?)", ${luaStringLiteral(shopId)}, ${itemType}, ${qty})`,
        `else`,
        `  _dbExec("UPDATE npc_shop_stock SET quantity=? WHERE shop_id=? AND item_type=?", ${qty}, ${luaStringLiteral(shopId)}, ${itemType})`,
        `end`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Resetting stock...');
      const successVn = makeNode(success);
      const waitNode  = getNode(waitVn);
      waitNode.hook      = hookFn;
      waitNode.reactions = [{ code: 0, target: successVn }];
      return waitVn;
    }
    default:
      return undefined;
  }
}
