// ui.js — UI actions: import/export/copy/download/tabs/clear/examples
// All functions receive workspace + Blockly + generateLua as parameters

import { highlight }              from './highlight.js';
import { parseLuaToBlocklyState } from './parser/lua-to-blocks.js';
import { examples }               from './examples/index.js';
import { localizeWorkspaceState, t } from './i18n.js';

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
export function generateAndShow(generateLua) {
  const name = document.getElementById('scriptName').value || 'my-npc';
  try {
    const lua = generateLua(name);
    document.getElementById('luaOutput').innerHTML = highlight(lua);
    showTab('lua');
    const nodeCount = window._npcState?.nodes?.length ?? 0;
    const hookCount = window._npcState?.hooks?.size   ?? 0;
    document.getElementById('statusBar').textContent =
      t('✓ Generated — {nodes} nodes, {hooks} hooks, {lines} lines', {
        nodes: nodeCount,
        hooks: hookCount,
        lines: lua.split('\n').length,
      });
  } catch (e) {
    document.getElementById('luaOutput').textContent = t('-- ERROR: {message}', { message: e.message });
    document.getElementById('statusBar').textContent = t('✗ Error: {message}', { message: e.message });
  }
}

// ── Copy ──────────────────────────────────────────────────────────────────────

/** Copy the current generated Lua script to the clipboard. */
export function copyLua(generateLua) {
  const name = document.getElementById('scriptName').value || 'my-npc';
  const lua  = generateLua(name);
  navigator.clipboard.writeText(lua).then(() => {
    const badge = document.getElementById('copyBadge');
    badge.style.display = 'block';
    setTimeout(() => { badge.style.display = 'none'; }, 2000);
    document.getElementById('statusBar').textContent = t('✓ Lua copied to clipboard');
  }).catch(() => {
    const el = document.createElement('textarea');
    el.value = lua;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    document.getElementById('statusBar').textContent = t('✓ Lua copied (fallback)');
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
export function exportWorkspace(Blockly, workspace) {
  const state = Blockly.serialization.workspaces.save(workspace);
  const name  = (document.getElementById('scriptName').value || 'my-npc') + '.workspace.json';
  const blob  = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
  document.getElementById('statusBar').textContent = t('✓ Workspace exported as {name}', { name });
}

// ── Import workspace / Lua ────────────────────────────────────────────────────

/** Open the hidden Import file input. */
export function triggerImportInput() {
  document.getElementById('fileInput').click();
}

/** Import a .json Blockly workspace or .lua script file. */
export function onFileLoad(event, Blockly, workspace, generateLua) {
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
        generateAndShow(generateLua);
        document.getElementById('statusBar').textContent = t('✓ Lua imported: {name}', { name: file.name });
      } catch (parseErr) {
        document.getElementById('luaOutput').innerHTML = highlight(lua);
        showTab('lua');
        document.getElementById('statusBar').textContent = t('⚠ Parse warning: {message} — showing Lua source', { message: parseErr.message });
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
      generateAndShow(generateLua);
      const baseName = file.name.replace(/\.workspace\.json$/, '').replace(/\.json$/, '');
      if (baseName) document.getElementById('scriptName').value = baseName;
      document.getElementById('statusBar').textContent = t('✓ Workspace imported: {name}', { name: file.name });
    } catch (err) {
      document.getElementById('statusBar').textContent = t('✗ Import error: {message}', { message: err.message });
      alert(t('Failed to import workspace:\n{message}', { message: err.message }));
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ── Clear ─────────────────────────────────────────────────────────────────────

/** Clear all blocks after user confirmation. */
export function clearWorkspace(workspace) {
  if (confirm(t('Clear all blocks?'))) workspace.clear();
  document.getElementById('luaOutput').textContent = t('-- Workspace cleared.');
  document.getElementById('statusBar').textContent = t('Workspace cleared.');
}

// ── Load example ──────────────────────────────────────────────────────────────

/** Load a built-in example workspace by name. */
export function loadExample(name, Blockly, workspace, generateLua) {
  workspace.clear();
  const state = examples[name] || examples['merchant'];
  try {
    Blockly.serialization.workspaces.load(localizeWorkspaceState(state), workspace);
  } catch (e) {
    document.getElementById('statusBar').textContent = t('Could not load example: {message}', { message: e.message });
    return;
  }
  workspace.scrollCenter();
  generateAndShow(generateLua);
}
