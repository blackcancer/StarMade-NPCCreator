// help.js — Structured content for the Help tab

const HELP_HTML_EN = String.raw`
<section class="help-hero"><div class="help-kicker">Integrated guide</div><h2>StarMade NPC Creator Help</h2><p>Build NPC dialog trees visually, generate Lua automatically, then import the Lua back without losing structure when possible.</p></section>
<section class="help-card"><h3>🚀 Quick workflow</h3><ol class="help-steps"><li><strong>Start with a Greeting</strong> block — it is the mandatory root entry of the dialog.</li><li><strong>Add Choice</strong> blocks under the greeting to give the player options.</li><li><strong>Attach actions</strong> inside choices: hire crew, give items, quests, reputation, cooldowns…</li><li><strong>Read the Lua Output</strong> panel on the right — it updates live after every edit.</li><li><strong>Export JSON</strong> to save an editable project, or <strong>Download Lua</strong> to deploy to StarMade.</li></ol></section>
<section class="help-card"><h3>📥 Import / Export</h3><p>Use Export JSON while editing. Use Download Lua when deploying in StarMade.</p></section>
`;

const HELP_HTML_FR = String.raw`
<section class="help-hero"><div class="help-kicker">Guide intégré</div><h2>Aide StarMade NPC Creator</h2><p>Créez visuellement des arbres de dialogue NPC, générez du Lua automatiquement, puis réimportez le Lua en conservant la structure autant que possible.</p></section>
<section class="help-card"><h3>🚀 Flux de travail rapide</h3><ol class="help-steps"><li>Commencez avec un bloc <strong>Accueil</strong> — c'est l'entrée racine obligatoire du dialogue.</li><li>Ajoutez des blocs <strong>Choix</strong> sous l'accueil pour proposer des options au joueur.</li><li>Attachez des <strong>actions</strong> dans les choix : recruter, donner des objets, quêtes, réputation, temps de recharge…</li><li>Lisez le panneau <strong>Sortie Lua</strong> à droite — il se met à jour en direct après chaque modification.</li><li>Utilisez <strong>Exporter JSON</strong> pour sauvegarder un projet éditable, ou <strong>Télécharger Lua</strong> pour déployer dans StarMade.</li></ol></section>
<section class="help-card"><h3>📥 Import / Export</h3><p>Utilisez Exporter JSON pendant l’édition. Utilisez Télécharger Lua lors du déploiement dans StarMade.</p></section>
`;

const HELP_BY_LANG = { en: HELP_HTML_EN, fr: HELP_HTML_FR, de: HELP_HTML_EN, es: HELP_HTML_EN };

export function initHelpPanel(lang = 'en') {
  const el = document.getElementById('helpOutput');
  if (!el) return;
  el.innerHTML = HELP_BY_LANG[lang] || HELP_HTML_EN;
}
