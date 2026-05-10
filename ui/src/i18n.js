export const translations = {
  en: {
    langLabel: 'Language',
    subtitle: 'Visual Lua dialog builder',
    script: 'Script',
    loadExample: 'Load example',
    import: '📥 Import',
    export: '📤 Export',
    clear: '🗑 Clear',
    copyLua: '📋 Copy Lua',
    download: '⬇ Download',
    luaOutput: 'Lua Output',
    help: 'Help',
    ready: 'Ready — drag blocks from the toolbox.',
    workspaceHint: '-- Drag blocks from the toolbox to build your NPC dialog.',
    copied: '✓ Copied!'
  },
  fr: { langLabel: 'Langue', subtitle: 'Constructeur visuel de dialogues Lua', script: 'Script', loadExample: 'Charger un exemple', import: '📥 Importer', export: '📤 Exporter', clear: '🗑 Effacer', copyLua: '📋 Copier Lua', download: '⬇ Télécharger', luaOutput: 'Sortie Lua', help: 'Aide', ready: 'Prêt — glissez des blocs depuis la boîte à outils.', workspaceHint: '-- Glissez des blocs depuis la boîte à outils pour construire votre dialogue NPC.', copied: '✓ Copié !' },
  de: { langLabel: 'Sprache', subtitle: 'Visueller Lua-Dialog-Builder', script: 'Skript', loadExample: 'Beispiel laden', import: '📥 Importieren', export: '📤 Exportieren', clear: '🗑 Leeren', copyLua: '📋 Lua kopieren', download: '⬇ Herunterladen', luaOutput: 'Lua-Ausgabe', help: 'Hilfe', ready: 'Bereit — ziehe Blöcke aus der Toolbox.', workspaceHint: '-- Ziehe Blöcke aus der Toolbox, um deinen NPC-Dialog zu erstellen.', copied: '✓ Kopiert!' },
  es: { langLabel: 'Idioma', subtitle: 'Constructor visual de diálogos Lua', script: 'Script', loadExample: 'Cargar ejemplo', import: '📥 Importar', export: '📤 Exportar', clear: '🗑 Limpiar', copyLua: '📋 Copiar Lua', download: '⬇ Descargar', luaOutput: 'Salida Lua', help: 'Ayuda', ready: 'Listo — arrastra bloques desde la caja de herramientas.', workspaceHint: '-- Arrastra bloques desde la caja de herramientas para construir tu diálogo NPC.', copied: '✓ ¡Copiado!' }
};


const runtime = {
  en:{generated:'Generated',nodes:'nodes',hooks:'hooks',lines:'lines',error:'✗ Error',luaCopiedClipboard:'Lua copied to clipboard',luaCopiedFallback:'Lua copied (fallback)',workspaceExportedAs:'Workspace exported as',luaImported:'Lua imported',parseWarning:'Parse warning',showingLuaSource:'showing Lua source',workspaceImported:'Workspace imported',importError:'✗ Import error',clearAllBlocksConfirm:'Clear all blocks?',workspaceCleared:'Workspace cleared',couldNotLoadExample:'Could not load example'},
  fr:{generated:'Généré',nodes:'nœuds',hooks:'hooks',lines:'lignes',error:'✗ Erreur',luaCopiedClipboard:'Lua copié dans le presse-papiers',luaCopiedFallback:'Lua copié (secours)',workspaceExportedAs:'Espace de travail exporté sous',luaImported:'Lua importé',parseWarning:'Avertissement de parsing',showingLuaSource:'affichage du code Lua',workspaceImported:'Espace de travail importé',importError:"✗ Erreur d'import",clearAllBlocksConfirm:'Effacer tous les blocs ?',workspaceCleared:'Espace de travail effacé',couldNotLoadExample:"Impossible de charger l'exemple"},
  de:{generated:'Generiert',nodes:'Knoten',hooks:'Hooks',lines:'Zeilen',error:'✗ Fehler',luaCopiedClipboard:'Lua in Zwischenablage kopiert',luaCopiedFallback:'Lua kopiert (Fallback)',workspaceExportedAs:'Workspace exportiert als',luaImported:'Lua importiert',parseWarning:'Parse-Warnung',showingLuaSource:'Lua-Quelle wird angezeigt',workspaceImported:'Workspace importiert',importError:'✗ Importfehler',clearAllBlocksConfirm:'Alle Blöcke löschen?',workspaceCleared:'Workspace geleert',couldNotLoadExample:'Beispiel konnte nicht geladen werden'},
  es:{generated:'Generado',nodes:'nodos',hooks:'hooks',lines:'líneas',error:'✗ Error',luaCopiedClipboard:'Lua copiado al portapapeles',luaCopiedFallback:'Lua copiado (alternativa)',workspaceExportedAs:'Espacio de trabajo exportado como',luaImported:'Lua importado',parseWarning:'Advertencia de análisis',showingLuaSource:'mostrando código Lua',workspaceImported:'Espacio de trabajo importado',importError:'✗ Error de importación',clearAllBlocksConfirm:'¿Limpiar todos los bloques?',workspaceCleared:'Espacio de trabajo limpiado',couldNotLoadExample:'No se pudo cargar el ejemplo'}
};

export function createI18n() {
  const saved = localStorage.getItem('npc_creator_lang');
  const fallback = navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en';
  let current = saved && translations[saved] ? saved : fallback;
  const t = (k) => translations[current]?.[k] ?? runtime[current]?.[k] ?? runtime.en[k] ?? translations.en[k] ?? k;
  const apply = () => {
    document.documentElement.lang = current;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    const hint = document.getElementById('luaOutput');
    if (hint && hint.textContent?.startsWith('-- Drag blocks')) hint.textContent = t('workspaceHint');
    const status = document.getElementById('statusBar');
    if (status && status.textContent?.startsWith('Ready')) status.textContent = t('ready');
  };
  const setLanguage = (lang) => { if (translations[lang]) { current = lang; localStorage.setItem('npc_creator_lang', lang); apply(); } };
  return { t, apply, setLanguage, getLanguage: () => current };
}
