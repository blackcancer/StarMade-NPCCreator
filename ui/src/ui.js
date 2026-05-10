// ui.js — UI actions: import/export/copy/download/tabs/clear/examples
// All functions receive workspace + Blockly + generateLua as parameters

import { highlight }              from './highlight.js';
import { parseLuaToBlocklyState } from './parser/lua-to-blocks.js';
import { examples }               from './examples/index.js';

// ── Tabs ──────────────────────────────────────────────────────────────────────

/** Activate one of the right-panel tabs. */
export function showTab(id) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['lua', 'help'][i] === id);
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('active', c.id === 'tab-' + id);
  });
}

// ── Generate & display ────────────────────────────────────────────────────────

/** Run Lua generation and render highlighted output/status. */
export function generateAndShow(generateLua, t = (k) => k) {
  const name = document.getElementById('scriptName').value || 'my-npc';
  try {
    const lua = generateLua(name);
    document.getElementById('luaOutput').innerHTML = highlight(lua);
    showTab('lua');
    const nodeCount = window._npcState?.nodes?.length ?? 0;
    const hookCount = window._npcState?.hooks?.size   ?? 0;
    document.getElementById('statusBar').textContent =
      `✓ ${t('generated')} — ${nodeCount} ${t('nodes')}, ${hookCount} ${t('hooks')}, ${lua.split('\n').length} ${t('lines')}`;
  } catch (e) {
    document.getElementById('luaOutput').textContent = '-- ERROR: ' + e.message;
    document.getElementById('statusBar').textContent = t('error') + ': ' + e.message;
  }
}

// ── Copy ──────────────────────────────────────────────────────────────────────

/** Copy the current generated Lua script to the clipboard. */
export function copyLua(generateLua, t = (k) => k) {
  const name = document.getElementById('scriptName').value || 'my-npc';
  const lua  = generateLua(name);
  navigator.clipboard.writeText(lua).then(() => {
    const badge = document.getElementById('copyBadge');
    badge.style.display = 'block';
    setTimeout(() => { badge.style.display = 'none'; }, 2000);
    document.getElementById('statusBar').textContent = '✓ ' + t('luaCopiedClipboard');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = lua;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    document.getElementById('statusBar').textContent = '✓ ' + t('luaCopiedFallback');
  });
}

// ── Download ──────────────────────────────────────────────────────────────────

/** Download the current generated Lua script as a .lua file. */
export function downloadLua(generateLua) {
  const name = document.getElementById('scriptName').value || 'my-npc';
  const lua  = generateLua(name);
  const blob = new Blob([lua], { type: 'text/plain' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = name + '.lua'; a.click();
  URL.revokeObjectURL(url);
}

// ── Export workspace ──────────────────────────────────────────────────────────

/** Export the Blockly workspace as editable JSON. */
export function exportWorkspace(Blockly, workspace, t = (k) => k) {
  const state = Blockly.serialization.workspaces.save(workspace);
  const name  = (document.getElementById('scriptName').value || 'my-npc') + '.workspace.json';
  const blob  = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
  document.getElementById('statusBar').textContent = `✓ ${t('workspaceExportedAs')} ${name}`;
}

// ── Import workspace / Lua ────────────────────────────────────────────────────

/** Open the hidden Import file input. */
export function triggerImportInput() {
  document.getElementById('fileInput').click();
}

/** Import a .json Blockly workspace or .lua script file. */
export function onFileLoad(event, Blockly, workspace, generateLua, t = (k) => k) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();

  if (file.name.endsWith('.lua')) {
    reader.onload = (e) => {
      const lua      = e.target.result;
      const baseName = file.name.replace(/\.lua$/, '');
      if (baseName) document.getElementById('scriptName').value = baseName;
      try {
        const state = parseLuaToBlocklyState(lua);
        workspace.clear();
        Blockly.serialization.workspaces.load(state, workspace);
        workspace.scrollCenter();
        generateAndShow(generateLua, t);
        document.getElementById('statusBar').textContent = `✓ ${t('luaImported')}: ${file.name}`;
      } catch (parseErr) {
        document.getElementById('luaOutput').innerHTML = highlight(lua);
        showTab('lua');
        document.getElementById('statusBar').textContent = `⚠ ${t('parseWarning')}: ${parseErr.message} — ${t('showingLuaSource')}`;
      }
    };
    reader.readAsText(file);
    event.target.value = '';
    return;
  }

  reader.onload = (e) => {
    try {
      const state = JSON.parse(e.target.result);
      workspace.clear();
      Blockly.serialization.workspaces.load(state, workspace);
      workspace.scrollCenter();
      generateAndShow(generateLua, t);
      const baseName = file.name.replace(/\.workspace\.json$/, '').replace(/\.json$/, '');
      if (baseName) document.getElementById('scriptName').value = baseName;
      document.getElementById('statusBar').textContent = `✓ ${t('workspaceImported')}: ${file.name}`;
    } catch (err) {
      document.getElementById('statusBar').textContent = `${t('importError')}: ${err.message}`;
      alert('Failed to import workspace:\n' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ── Clear ─────────────────────────────────────────────────────────────────────

/** Clear all blocks after user confirmation. */
export function clearWorkspace(workspace, t = (k) => k) {
  if (confirm(t('clearAllBlocksConfirm'))) workspace.clear();
  document.getElementById('luaOutput').textContent = '-- ' + t('workspaceCleared') + '.';
  document.getElementById('statusBar').textContent = t('workspaceCleared') + '.';
}

// ── Load example ──────────────────────────────────────────────────────────────

/** Load a built-in example workspace by name. */
export function loadExample(name, Blockly, workspace, generateLua, t = (k) => k) {
  workspace.clear();
  const state = examples[name] || examples['merchant'];
  try {
    Blockly.serialization.workspaces.load(state, workspace);
  } catch (e) {
    document.getElementById('statusBar').textContent = `${t('couldNotLoadExample')}: ${e.message}`;
    return;
  }
  workspace.scrollCenter();
  generateAndShow(generateLua, t);
}
