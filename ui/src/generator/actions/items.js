/**
 * @fileoverview Item, credit, inventory and HUD action generators.
 *
 * Handles inventory, shop, credit, meta item and server message actions.
 * Modules follow the StarMade-DB documentation style: file purpose first,
 * section separators, and small generator functions with explicit dependencies.
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
export function genItemAction(block, ctx) {
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
    case 'npc_sell_item': {
      const item    = block.getFieldValue('ITEM');
      const price   = getOptionalVarName(block, 'PRICE_VAR') || block.getFieldValue('PRICE');
      const methods = { laser:'giveLaserWeapon', sniper:'giveSniperRifle', rocket:'giveRocketLauncher',
        helmet:'giveHelmet', healing:'giveHealingBeam', power:'givePowerSupplyBeam', marker:'giveMarkerBeam',
        transporter:'giveTransporterMarkerBeam', grapple:'giveGrappleBeam', torch:'giveTorchBeam',
        prohibiter:'giveBuildProhibiter', flashlight:'giveFlashLight' };
      const hookFn = 'give_' + item + '_' + sanitizeIdentPart(price) + '_Hook';
      registerHook(hookFn, ['return dialogObject:' + (methods[item] || 'giveLaserWeapon') + '(' + price + ');']);
      const waitVn = makeNode('Please wait...');
      const node   = getNode(waitVn);
      node.hook    = hookFn;
      node.reactions = [
        { code:  0, target: processActions(block, 'SOLD',       waitVn) || makeNode('Thank you!') },
        { code: -1, target: processActions(block, 'NO_CREDITS', waitVn) || makeNode("You don't have enough money!") },
        { code: -2, target: processActions(block, 'INV_FULL',   waitVn) || makeNode('Sorry, your inventory is full!') },
      ];
      return waitVn;
    }
    case 'npc_give_type': {
      const typeId  = block.getFieldValue('TYPE_ID');
      const count   = getOptionalVarName(block, 'COUNT_VAR') || block.getFieldValue('COUNT');
      const hookFn  = 'giveTypeHook_' + sanitizeIdentPart(typeId) + '_' + sanitizeIdentPart(count);
      registerHook(hookFn, ['return dialogObject:giveType(' + typeId + ', ' + count + ');']);
      const waitVn = makeNode('Please wait...');
      const node   = getNode(waitVn);
      node.hook    = hookFn;
      node.reactions = [
        { code:  0, target: processActions(block, 'GIVEN',      waitVn) || makeNode('Here you go!') },
        { code: -1, target: processActions(block, 'NO_CREDITS', waitVn) || makeNode("You don't have enough money!") },
        { code: -2, target: processActions(block, 'INV_FULL',   waitVn) || makeNode('Your inventory is full!') },
      ];
      return waitVn;
    }
    case 'npc_give_meta_item': {
      const metaType = block.getFieldValue('META_TYPE');
      const subType  = block.getFieldValue('SUB_TYPE');
      const cost     = block.getFieldValue('COST');
      const hookFn   = `giveMetaItemHook_${sanitizeIdentPart(metaType)}_${sanitizeIdentPart(subType)}_${sanitizeIdentPart(cost)}`;
      registerHook(hookFn, [`return dialogObject:giveMetaItem(${luaStringLiteral(metaType)}, ${subType}, ${cost});`]);
      const waitVn = makeNode('Please wait...');
      const node = getNode(waitVn);
      node.hook = hookFn;
      node.reactions = [
        { code: 0,  target: processActions(block, 'GIVEN',      waitVn) || makeNode('Here you go!') },
        { code: -1, target: processActions(block, 'NO_CREDITS', waitVn) || makeNode("You don't have enough money!") },
        { code: -2, target: processActions(block, 'INV_FULL',   waitVn) || makeNode('Your inventory is full!') },
      ];
      return waitVn;
    }
    case 'npc_give_credits': {
      const amount  = Number(block.getFieldValue('AMOUNT') || 0);
      const hookFn  = 'giveCreditsHook_' + (amount < 0 ? 'n' + Math.abs(amount) : amount);
      registerHook(hookFn, [
        'local ps = dialogObject:getEntity()',
        'if ps == nil then return -1 end',
        'ps:setCredits(ps:getCredits() + ' + amount + ')',
        'return 0',
      ]);
      const waitVn   = makeNode(amount >= 0 ? 'Transferring credits...' : 'Charging credits...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      const nextBlock = block.getNextBlock();
      const nextVn    = nextBlock ? processActionBlock(nextBlock, waitVn) : null;
      waitNode.reactions = [
        { code:  0, target: nextVn || makeNode(amount >= 0 ? 'Credits transferred.' : 'Charged.') },
        { code: -1, target: makeNode('Error: player not found.') },
      ];
      return waitVn;
    }
    case 'npc_check_inventory': {
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const count    = Number(block.getFieldValue('COUNT')     || 1);
      const hookFn   = `checkInvHook_${itemType}_${count}`;
      return makeBranchAction(hookFn, [
        `local inv = dialogObject:getEntity():getInventory()`,
        `if inv == nil then return -1 end`,
        `local total = 0`,
        `for i = 0, inv:getActiveSlotsMax() - 1 do`,
        `  if inv:getType(i) == ${itemType} then`,
        `    total = total + inv:getCount(i, ${itemType})`,
        `  end`,
        `end`,
        `if total >= ${count} then return 0 end`,
        `return -1`,
      ], block, 'Checking inventory...');
    }
    case 'npc_take_item': {
      const itemType = Number(block.getFieldValue('ITEM_TYPE') || 0);
      const count    = Number(block.getFieldValue('COUNT')     || 1);
      const hookFn   = `takeItemHook_${itemType}_${count}`;
      registerHook(hookFn, [
        `local inv = dialogObject:getEntity():getInventory()`,
        `if inv == nil then return -1 end`,
        `local total = 0`,
        `for i = 0, inv:getActiveSlotsMax() - 1 do`,
        `  if inv:getType(i) == ${itemType} then`,
        `    total = total + inv:getCount(i, ${itemType})`,
        `  end`,
        `end`,
        `if total < ${count} then return -1 end`,
        `local rem = ${count}`,
        `for i = 0, inv:getActiveSlotsMax() - 1 do`,
        `  if rem <= 0 then break end`,
        `  if inv:getType(i) == ${itemType} then`,
        `    local c = inv:getCount(i, ${itemType})`,
        `    if c <= rem then`,
        `      inv:decrementOrUpdateSlot(i, ${itemType}, c, true)`,
        `      rem = rem - c`,
        `    else`,
        `      inv:decrementOrUpdateSlot(i, ${itemType}, rem, true)`,
        `      rem = 0`,
        `    end`,
        `  end`,
        `end`,
        `return 0`,
      ]);
      const waitVn    = makeNode('Collecting item...');
      const waitNode  = getNode(waitVn);
      waitNode.hook = hookFn;
      const thenVnTake = processActions(block, 'THEN', waitVn);
      const elseVnTake = processActions(block, 'ELSE', waitVn);
      waitNode.reactions = [
        { code:  0, target: thenVnTake || makeNode('Done.') },
        { code: -1, target: elseVnTake || makeNode('Not found.') },
      ];
      return waitVn;
    }
    case 'npc_send_message': {
      const msgType = block.getFieldValue('TYPE') || 'info';
      const text    = block.getFieldValue('TEXT') || 'Quest updated!';
      const hookFn  = `sendMsgHook_${Math.abs(hashCode(text + msgType))}`;
      const typeMap = { info: '0', warn: '1', error: '2' };
      const typeCode = typeMap[msgType] || '0';
      registerHook(hookFn, [
        `local ps = dialogObject:getEntity()`,
        `if ps ~= nil then`,
        `  local ServerMessage = luajava.bindClass("org.schema.schine.network.server.ServerMessage")`,
        `  ps:sendServerMessage(luajava.newInstance("org.schema.schine.network.server.ServerMessage",`,
        `    dialogObject:format(${luaStringLiteral(text)}), ${typeCode}, ps:getId()))`,
        `end`,
        `return 0`,
      ]);
      const waitVn   = makeNode('Sending message...');
      const waitNode = getNode(waitVn);
      waitNode.hook  = hookFn;
      return waitVn;
    }
    default:
      return undefined;
  }
}
