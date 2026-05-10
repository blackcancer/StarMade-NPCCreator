// main.js — Entry point for StarMade NPC Creator (Blockly edition)
// Blockly is loaded from CDN as window.Blockly

import { registerAllBlocks }                          from './blocks/index.js';
import { resetState, _state }                         from './generator/state.js';
import { emitLua }                                    from './generator/emitter.js';
import { getMissingConnectedVariables }               from './varSync.js';
import { syncVariableDisplays,
         updateVariableReferenceWarnings }             from './varSync.js';
import { showTab, generateAndShow, copyLua, downloadLua,
         exportWorkspace, triggerImportInput, onFileLoad,
         clearWorkspace, loadExample }                from './ui.js';
import { initHelpPanel }                              from './help.js';
import { createToolboxElement }                       from './toolbox.js';
import { createI18n, patchBlocklyLocalization, localizeToolboxXml } from './i18n.js';

// ── Inline the core generator functions from the monolith ─────────────────────
// (processGreeting, processActionBlock, buildConditionExpression are in core.js)
import {
  processGreeting,
  processActionBlock,
  buildConditionExpression,
} from './generator/core.js';

// ── Globals ───────────────────────────────────────────────────────────────────

const Blockly = window.Blockly;

// ── Register all custom blocks ────────────────────────────────────────────────

const i18n = createI18n();
patchBlocklyLocalization(Blockly, i18n.getLanguage);
registerAllBlocks(Blockly);
initHelpPanel(i18n.getLanguage());

// ── Toolbox ───────────────────────────────────────────────────────────────────

const workspace = Blockly.inject('blocklyDiv', {
  toolbox: createToolboxElement((xml) => localizeToolboxXml(xml, i18n.getLanguage())),
  grid:    { spacing: 20, length: 3, colour: '#1a2540', snap: true },
  zoom:    { controls: true, wheel: true, startScale: 0.9, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
  theme: Blockly.Theme.defineTheme('starmade', {
    'base': Blockly.Themes.Classic,
    'componentStyles': {
      'workspaceBackgroundColour': '#0d1117',
      'toolboxBackgroundColour':   '#161b22',
      'toolboxForegroundColour':   '#c9d1d9',
      'flyoutBackgroundColour':    '#21262d',
      'flyoutForegroundColour':    '#c9d1d9',
      'flyoutOpacity':             0.95,
      'scrollbarColour':           '#0f3460',
    }
  }),
  trashcan:    true,
  scrollbars:  true,
});

// ── Core generate function ────────────────────────────────────────────────────

/**
 * Generate Lua from the current Blockly workspace.
 *
 * @param {string} scriptName Script name used in the Lua header.
 * @returns {string} Generated Lua or a user-facing error string.
 */
function generateLua(scriptName) {
  resetState();

  const allBlocks = workspace.getAllBlocks(false);

  // Validate variable references
  const missingVars = getMissingConnectedVariables(allBlocks);
  if (missingVars.length > 0)
    throw new Error('Undefined variable references: ' + missingVars.join(', ') + '. Add matching Variable block(s).');

  // Collect standalone lua vars + sqlite tables
  for (const b of allBlocks) {
    if (b.type === 'npc_lua_var') {
      const name = String(b.getFieldValue('NAME') || '').trim();
      if (!name) continue;
      _state.luaVars.push({
        name,
        mode:  b.getFieldValue('MODE')  || 'raw',
        value: b.getFieldValue('VALUE') || '',
      });
    }
    if (b.type === 'npc_sqlite_table') {
      _state.dbTables.set(b.getFieldValue('TABLE'), { cols: b.getFieldValue('COLS') });
    }
  }

  // Detect DB subsystems
  const uses = (...types) => allBlocks.some(b => types.includes(b.type));

  if (uses('npc_memory_set','npc_memory_increment','npc_cond_memory_number','npc_cond_memory_text',
           'npc_cond_memory_exists','npc_quest_start','npc_quest_set_step','npc_quest_complete',
           'npc_quest_fail','npc_quest_offer','npc_quest_offer_advanced','npc_quest_require_status',
           'npc_quest_require_step','npc_cond_quest_status','npc_cond_quest_step'))
    { _state.usesHsqlMemory = true; _state.usesQuestTable = true; }

  if (uses('npc_rep_add','npc_rep_set','npc_cond_rep','npc_check_rep','npc_get_rep','npc_rep_reset'))
    _state.usesReputation = true;

  if (uses('npc_cooldown_set','npc_cooldown_clear','npc_cond_cooldown','npc_check_cooldown','npc_get_cooldown_remaining'))
    _state.usesCooldowns = true;

  if (uses('npc_stock_init','npc_stock_sell','npc_stock_add','npc_stock_reset','npc_get_stock','npc_check_stock','npc_cond_stock'))
    _state.usesShopStock = true;

  if (uses('npc_world_set','npc_world_get','npc_get_world','npc_check_world','npc_cond_world'))
    _state.usesWorldState = true;

  if (uses('npc_flag_set','npc_check_flag_db','npc_cond_flag_db'))
    _state.usesHsqlMemory = true;

  // Find greeting and process (supports both npc_greeting and npc_cond_greeting)
  const greetings = allBlocks.filter(b =>
    b.type === 'npc_greeting' || b.type === 'npc_cond_greeting'
  );
  if (greetings.length === 0)
    return '-- ERROR: Add a "💬 Greeting" or "🔀 Conditional Greeting" block to start your dialog.';

  // Both processGreeting and processCondGreeting are dispatched via processActionBlock
  if (greetings[0].type === 'npc_cond_greeting') {
    processActionBlock(greetings[0], null);
  } else {
    processGreeting(greetings[0]);
  }

  window._npcState = _state;
  return emitLua(scriptName);
}

// ── Expose to HTML onclick attributes ────────────────────────────────────────

window.showTab        = showTab;
window.copyLua        = ()  => copyLua(generateLua, i18n.t);
window.downloadLua    = ()  => downloadLua(generateLua);
window.exportWorkspace = () => exportWorkspace(Blockly, workspace, i18n.t);
window.importWorkspace = () => triggerImportInput();
window.clearWorkspace = ()  => clearWorkspace(workspace, i18n.t);
window.onFileLoad     = (e) => onFileLoad(e, Blockly, workspace, generateLua, i18n.t);
window.loadExample    = (n) => loadExample(n, Blockly, workspace, generateLua, i18n.t);

// ── Auto-generate on change ───────────────────────────────────────────────────

workspace.addChangeListener(() => {
  syncVariableDisplays(workspace);
  updateVariableReferenceWarnings(workspace);
  if (workspace.getAllBlocks(false).some(b => b.type === 'npc_greeting' || b.type === 'npc_cond_greeting')) {
    generateAndShow(generateLua, i18n.t);
  }
});

// ── Load example on startup ───────────────────────────────────────────────────

window.addEventListener('load', () => {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try {
      loadExample('welcome_kiosk', Blockly, workspace, generateLua, i18n.t);
      const langSelect = document.getElementById('languageSelect');
      if (langSelect) {
        langSelect.value = i18n.getLanguage();
        langSelect.addEventListener('change', (e) => { i18n.setLanguage(e.target.value); initHelpPanel(i18n.getLanguage()); location.reload(); });
      }
      i18n.apply();
    } catch (e) {
      setTimeout(() => loadExample('welcome_kiosk', Blockly, workspace, generateLua, i18n.t), 500);
    }
  }));
});
