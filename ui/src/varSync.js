// varSync.js — Variable sync + reference warnings
// All functions take `workspace` as parameter — no global dependency

export const VAR_SYNC_BINDINGS = [
  ['npc_hire', 'PRICE_VAR', 'PRICE', true],
  ['npc_spawn_crew', 'PRICE_VAR', 'PRICE', true],
  ['npc_sell_item', 'PRICE_VAR', 'PRICE', true],
  ['npc_give_type', 'COUNT_VAR', 'COUNT', true],
  ['npc_sqlite_set', 'VALUE_VAR', 'VALUE', false],
  ['npc_sqlite_increment', 'AMOUNT_VAR', 'AMOUNT', true],
  ['npc_memory_set', 'VALUE_VAR', 'VALUE', false],
  ['npc_memory_increment', 'AMOUNT_VAR', 'AMOUNT', true],
  ['npc_activate_block', 'X_VAR', 'X', true],
  ['npc_activate_block', 'Y_VAR', 'Y', true],
  ['npc_activate_block', 'Z_VAR', 'Z', true],
  ['npc_move_to', 'X_VAR', 'X', true],
  ['npc_move_to', 'Y_VAR', 'Y', true],
  ['npc_move_to', 'Z_VAR', 'Z', true],
  ['npc_is_at_block', 'X_VAR', 'X', true],
  ['npc_is_at_block', 'Y_VAR', 'Y', true],
  ['npc_is_at_block', 'Z_VAR', 'Z', true],
  ['npc_check_credits', 'AMOUNT_VAR', 'AMOUNT', true],
  ['npc_check_player_value', 'VALUE_VAR', 'VALUE', true],
  ['npc_cond_player_value', 'VALUE_VAR', 'VALUE', true],
  ['npc_cond_is_at_block', 'X_VAR', 'X', true],
  ['npc_cond_is_at_block', 'Y_VAR', 'Y', true],
  ['npc_cond_is_at_block', 'Z_VAR', 'Z', true],
  ['npc_cond_sqlite_value', 'VALUE_VAR', 'VALUE', false],
  ['npc_cond_sqlite_value', 'DEFAULT_VAR', 'DEFAULT', false],
  ['npc_cond_sqlite_number', 'VALUE_VAR', 'VALUE', true],
  ['npc_cond_sqlite_number', 'DEFAULT_VAR', 'DEFAULT', true],
  ['npc_cond_sqlite_text', 'VALUE_VAR', 'VALUE', false],
  ['npc_cond_sqlite_text', 'DEFAULT_VAR', 'DEFAULT', false],
  ['npc_cond_memory_number', 'VALUE_VAR', 'VALUE', true],
  ['npc_cond_memory_number', 'DEFAULT_VAR', 'DEFAULT', true],
  ['npc_cond_memory_text', 'VALUE_VAR', 'VALUE', false],
  ['npc_cond_memory_text', 'DEFAULT_VAR', 'DEFAULT', false],
];

/** Collect declared Variable blocks from the workspace. */
function collectDeclaredVariablesFromBlocks(blocks) {
  const vars = new Map();
  for (const b of blocks || []) {
    if (b.type !== 'npc_lua_var') continue;
    const name = String(b.getFieldValue('NAME') || '').trim();
    if (!name) continue;
    vars.set(name, {
      value: String(b.getFieldValue('VALUE') || ''),
      mode:  b.getFieldValue('MODE') || 'raw',
    });
  }
  return vars;
}

/** Read an optional connected variable reference from a block input. */
function getOptionalVarName(block, inputName) {
  const child = block?.getInputTargetBlock ? block.getInputTargetBlock(inputName) : null;
  if (!child || child.type !== 'npc_var_ref') return '';
  return String(child.getFieldValue('NAME') || '').trim();
}

let _syncing = false;

/** Synchronize literal field displays from connected variable values. */
export function syncVariableDisplays(workspace) {
  if (_syncing || !workspace?.getAllBlocks) return;
  _syncing = true;
  try {
    const allBlocks = workspace.getAllBlocks(false);
    const vars = collectDeclaredVariablesFromBlocks(allBlocks);
    for (const [type, inputName, fieldName, numeric] of VAR_SYNC_BINDINGS) {
      for (const b of allBlocks) {
        if (b.type !== type) continue;
        const varName = getOptionalVarName(b, inputName);
        if (!varName || !vars.has(varName)) continue;
        const rawValue  = vars.get(varName).value;
        const parsedNum = Number(rawValue);
        if (numeric && !Number.isFinite(parsedNum)) continue;
        const nextValue = numeric ? String(parsedNum) : rawValue;
        const field = b.getField(fieldName);
        if (field && String(field.getValue()) !== String(nextValue)) field.setValue(nextValue);
      }
    }
  } finally {
    _syncing = false;
  }
}

/** Display Blockly warnings for unresolved connected variable references. */
export function updateVariableReferenceWarnings(workspace) {
  if (!workspace?.getAllBlocks) return;
  const allBlocks = workspace.getAllBlocks(false);
  const vars = collectDeclaredVariablesFromBlocks(allBlocks);
  for (const b of allBlocks) {
    if (b.type !== 'npc_var_ref') continue;
    const name        = String(b.getFieldValue('NAME') || '').trim();
    const isConnected = !!(b.getParent && b.getParent());
    if (!name) {
      b.setWarningText(isConnected ? 'Select a variable.' : null);
    } else if (isConnected && !vars.has(name)) {
      b.setWarningText(`Variable not initialized: ${name}`);
    } else {
      b.setWarningText(null);
    }
  }
}

/** Return all connected variable references without matching declarations. */
export function getMissingConnectedVariables(allBlocks) {
  const vars = collectDeclaredVariablesFromBlocks(allBlocks);
  const missing = new Set();
  for (const b of allBlocks) {
    if (b.type !== 'npc_var_ref') continue;
    if (!(b.getParent && b.getParent())) continue;
    const name = String(b.getFieldValue('NAME') || '').trim();
    if (name && !vars.has(name)) missing.add(name);
  }
  return Array.from(missing).sort((a, b) => a.localeCompare(b));
}
