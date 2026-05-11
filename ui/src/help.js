// help.js — Structured content for the Help tab

import { getLocale } from './i18n.js';

const HELP_HTML_EN = String.raw`
        <section class="help-hero">
          <div class="help-kicker">Integrated guide</div>
          <h2>StarMade NPC Creator Help</h2>
          <p>Build NPC dialog trees visually, generate Lua automatically, then import the Lua back without losing structure when possible.</p>
        </section>

        <section class="help-card">
          <h3>🚀 Quick workflow</h3>
          <ol class="help-steps">
            <li><strong>Start with a Greeting</strong> block — it is the mandatory root entry of the dialog.</li>
            <li><strong>Add Choice</strong> blocks under the greeting to give the player options.</li>
            <li><strong>Attach actions</strong> inside choices: hire crew, give items, quests, reputation, cooldowns…</li>
            <li><strong>Read the Lua Output</strong> panel on the right — it updates live after every edit.</li>
            <li><strong>Export JSON</strong> to save an editable project, or <strong>Download Lua</strong> to deploy to StarMade.</li>
          </ol>
        </section>

        <section class="help-grid">
          <article class="help-card">
            <h3>📋 Dialog basics</h3>
            <ul>
              <li><strong>Greeting</strong> — required root node.</li>
              <li><strong>Choice</strong> — player button leading to actions or a sub-menu.</li>
              <li><strong>Say</strong> — NPC text, auto-advances to the next block after the timer.</li>
              <li><strong>Say with choices</strong> — creates a sub-menu anywhere in a branch.</li>
              <li><strong>Confirm</strong> — prompts Yes / No before a sensitive action.</li>
              <li><strong>Go Back</strong> — returns the player to the parent dialog node.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>✅ Branches vs 🧩 Expressions</h3>
            <ul>
              <li><strong>Branches</strong> are action blocks with THEN / ELSE outputs (readable, self-contained).</li>
              <li><strong>Expressions</strong> are composable condition pieces that plug into <em>If Condition</em>.</li>
              <li>Combine expressions with AND / OR / NOT for complex conditions.</li>
              <li>Use branches for simple checks; expressions for composed logic.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>🧮 Variables</h3>
            <ul>
              <li><strong>Variable</strong> blocks are floating Lua constant declarations.</li>
              <li><strong>Var Reference</strong> connects a variable to a numeric field (prices, amounts, coordinates).</li>
              <li>Missing references produce a blocking warning before Lua generation.</li>
              <li>Variables are placed on the workspace, not inside the dialog tree.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>💬 Text placeholders</h3>
            <div class="help-tags">
              <code>{name}</code><span>NPC name</span>
              <code>{partner}</code><span>NPC affinity</span>
              <code>{faction}</code><span>faction name</span>
              <code>{owner}</code><span>commander name</span>
              <code>{self}</code><span>player name</span>
            </div>
            <p style="margin-top:8px;font-size:0.78rem;color:var(--text-secondary)">Use <code>%s</code> in Say with Value / Get Info to display a live stat.</p>
          </article>
        </section>

        <section class="help-card">
          <h3>🗂 Block categories — quick reference</h3>
          <div class="help-category-list">
            <div>
              <span style="--c:#1565c0">📋 Dialog</span>
              <p>Greeting (root), Say, Say with Choices, Say + Value, Confirm, Choice, Go Back.</p>
            </div>
            <div>
              <span style="--c:#6a1b9a">🧮 Variables</span>
              <p>Floating Lua constants and Var Reference inputs for prices, counts and coordinates.</p>
            </div>
            <div>
              <span style="--c:#1b5e20">👥 Crew</span>
              <p>Hire (with price), Unhire, Spawn Crew — all with full reaction branches.</p>
            </div>
            <div>
              <span style="--c:#d84315">🛒 Items</span>
              <p>Give Credits, Take Item, Give Type, Sell Item, Give Meta Item, Check Inventory, Send Message.</p>
            </div>
            <div>
              <span style="--c:#283593">⚡ World</span>
              <p>Activate Block, Move NPC, Destroy Ship, Give Gravity, Call Tutorial.</p>
            </div>
            <div>
              <span style="--c:#546e7a">🔗 Sequences</span>
              <p>Auto Sequence, Wait Until (polling), Delayed Follow-Up.</p>
            </div>
            <div>
              <span style="--c:#006064">💾 SQLite / Memory</span>
              <p>Memory Set/Increment, SQLite Get/Set/Increment — backed by the StarMade HSQLDB driver.</p>
            </div>
            <div>
              <span style="--c:#b71c1c">📜 Quests</span>
              <p>Advanced Quest Offer (state-aware), Quest Offer, Start, Set Step, Require Status/Step, Objective, Reward, Complete, Fail.</p>
            </div>
            <div>
              <span style="--c:#880e4f">⭐ Reputation</span>
              <p>Rep Add, Set, Reset, Get, Check — per NPC-ID reputation score.</p>
            </div>
            <div>
              <span style="--c:#004d40">⏱ Cooldowns</span>
              <p>Cooldown Set, Clear, Get Remaining, Check — time-gate daily rewards or repeatable actions.</p>
            </div>
            <div>
              <span style="--c:#33691e">📦 Stock</span>
              <p>Stock Init, Sell, Add, Reset, Get, Check — persistent shop inventory per shop ID.</p>
            </div>
            <div>
              <span style="--c:#795548">🚩 Flags &amp; World State</span>
              <p>Flag Set, Check Flag (DB), World State Set/Get, Get World, Check World — global and per-player persistence.</p>
            </div>
            <div>
              <span style="--c:#2e7d32">✅ Branches</span>
              <p>Check Credits, Player Value, Flag, Reputation, Cooldown, Stock, Flag DB, World State, Is At Block, Custom Condition, If Condition.</p>
            </div>
            <div>
              <span style="--c:#455a64">🧩 Expressions</span>
              <p>All <code>npc_cond_*</code> blocks: player value, flag, is-at-block, memory, quest status/step, reputation, cooldown, stock, flag DB, world, conversation state, AND/OR/NOT.</p>
            </div>
            <div>
              <span style="--c:#ad1457">🔧 Advanced</span>
              <p>Get Info (live stat display), Custom Hook (raw Lua), Set Conversation State, Delayed Follow-Up.</p>
            </div>
          </div>
        </section>

        <section class="help-grid">
          <article class="help-card">
            <h3>📜 Quest system</h3>
            <ul>
              <li>Quests are stored in the <code>npc_quests</code> HSQLDB table per player.</li>
              <li>Fields: <code>player</code>, <code>quest_id</code>, <code>status</code> (none/active/complete/failed), <code>step</code>.</li>
              <li><strong>Advanced Quest Offer</strong> checks status automatically before presenting the offer.</li>
              <li><strong>Quest Require Status/Step</strong> branch on persistent state without offering a new quest.</li>
              <li><strong>Quest Reward</strong> is composable: credits + item + reputation + flag in one block.</li>
              <li>Helpers <code>_questSet</code>, <code>_questStatus</code>, <code>_questStep</code> are injected automatically.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>💾 Persistence (HSQLDB)</h3>
            <ul>
              <li>StarMade ships <code>lib/hsqldb.jar</code> — no external driver needed.</li>
              <li>Each subsystem auto-creates its table on first use.</li>
              <li>Tables: <code>npc_quests</code>, <code>npc_memory</code>, <code>npc_reputation</code>, <code>npc_cooldowns</code>, <code>npc_shop_stock</code>.</li>
              <li>World-state values are global (not per-player): stored in <code>npc_memory</code> with a <code>world:</code> prefix.</li>
              <li>Custom tables via <code>npc_sqlite_table</code> + SQLite Get/Set/Increment blocks.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>📝 Comments</h3>
            <ul>
              <li>Add a Blockly comment to any block — it appears above the generated Lua.</li>
              <li>On import, comments before hook/node declarations are restored to the block.</li>
              <li>Use comments to document quest steps, expected states or design intent.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>⛔ Disabled blocks</h3>
            <ul>
              <li>Right-click → Disable to grey out any block.</li>
              <li>Hook functions emit inside <code>--[[ DISABLED … --]]</code>.</li>
              <li>All wiring (hook instance, setHook, addReaction, :add()) uses <code>-- [DISABLED]</code>.</li>
              <li>The full subtree inside a disabled Choice is also disabled automatically.</li>
              <li>Importing a Lua with disabled markers restores the block as disabled.</li>
            </ul>
          </article>
        </section>

        <section class="help-card">
          <h3>📥 Import / Export</h3>
          <div class="help-do-dont">
            <div>
              <h4>✅ Good practice</h4>
              <ul>
                <li>Save your work as <strong>Export JSON</strong> while editing.</li>
                <li>Use <strong>Download Lua</strong> only when deploying to StarMade.</li>
                <li>Keep generated <code>-- [DISABLED]</code> markers if you want round-trip fidelity.</li>
                <li>Name your Script in the header field before downloading.</li>
              </ul>
            </div>
            <div>
              <h4>⚠️ Known limitations</h4>
              <ul>
                <li>Very custom Lua (complex setFollowUp, self-loops, raw API calls) may import as Custom Hook blocks.</li>
                <li>Hook-less blocks (Quest Objective) import as <em>Say</em> — functionally identical.</li>
                <li>Manual Lua edits between export/import reduce round-trip quality.</li>
                <li>Vanilla StarMade scripts import as a best-effort approximation.</li>
              </ul>
            </div>
          </div>
        </section>

        <section class="help-card">
          <h3>⚙ Installing the Lua in StarMade</h3>
          <ol class="help-steps">
            <li>Copy the generated <code>.lua</code> file into the server directory:<br>
                <code>StarMade/data/script/your_script.lua</code></li>
            <li>Launch StarMade and join your server as an admin.</li>
            <li><strong>Aim at the NPC</strong> with your crosshair until it is highlighted / selected.</li>
            <li>Open the chat and run the admin command:<br>
                <code>/creature_script your_script.lua</code></li>
            <li>The server confirms success: <em>[ADMIN COMMAND] [SUCCESS] script of … set to your_script.lua</em></li>
            <li>Talk to the NPC — the new dialog is active immediately (no restart required).</li>
          </ol>
          <p class="help-note">The command uses the <strong>currently selected entity</strong> from your crosshair. You must be an operator/admin. The filename is case-sensitive and must include the <code>.lua</code> extension.</p>
        </section>
`;

const HELP_HTML_FR = String.raw`
        <section class="help-hero">
          <div class="help-kicker">Guide intégré</div>
          <h2>Aide de StarMade NPC Creator</h2>
          <p>Construisez visuellement des arbres de dialogue PNJ, générez automatiquement le Lua, puis réimportez ce Lua sans perdre la structure quand c’est possible.</p>
        </section>

        <section class="help-card">
          <h3>🚀 Flux de travail rapide</h3>
          <ol class="help-steps">
            <li><strong>Commencez par un bloc Salutation</strong> — c’est l’entrée racine obligatoire du dialogue.</li>
            <li><strong>Ajoutez des blocs Choix</strong> sous la salutation pour proposer des options au joueur.</li>
            <li><strong>Branchez des actions</strong> dans les choix : équipage, objets, quêtes, réputation, délais…</li>
            <li><strong>Lisez la sortie Lua</strong> à droite — elle se met à jour en direct après chaque modification.</li>
            <li><strong>Exportez le JSON</strong> pour conserver un projet éditable, ou <strong>téléchargez le Lua</strong> pour le déployer dans StarMade.</li>
          </ol>
        </section>

        <section class="help-grid">
          <article class="help-card">
            <h3>📋 Bases du dialogue</h3>
            <ul>
              <li><strong>Salutation</strong> — nœud racine obligatoire.</li>
              <li><strong>Choix</strong> — bouton joueur menant à des actions ou à un sous-menu.</li>
              <li><strong>Dire</strong> — texte PNJ, avance automatiquement après le minuteur.</li>
              <li><strong>Dire avec choix</strong> — crée un sous-menu n’importe où dans une branche.</li>
              <li><strong>Confirmer</strong> — demande Oui / Non avant une action sensible.</li>
              <li><strong>Retour</strong> — renvoie au nœud de menu parent.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>✅ Branches vs 🧩 Expressions</h3>
            <ul>
              <li><strong>Branches</strong> : blocs d’action avec sorties ALORS / SINON, lisibles et autonomes.</li>
              <li><strong>Expressions</strong> : conditions composables à brancher dans <em>Si</em> ou <em>Attendre jusqu’à</em>.</li>
              <li>Combinez les expressions avec ET / OU / NON pour construire une logique complexe.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>🧮 Variables</h3>
            <ul>
              <li>Les blocs <strong>Variable</strong> déclarent des constantes Lua flottantes.</li>
              <li><strong>Référence variable</strong> relie une variable à un champ numérique : prix, quantités, coordonnées.</li>
              <li>Les références manquantes bloquent la génération Lua avec un avertissement clair.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>💬 Variables de texte</h3>
            <div class="help-tags">
              <code>{name}</code><span>nom du PNJ</span>
              <code>{partner}</code><span>affinité PNJ</span>
              <code>{faction}</code><span>nom de faction</span>
              <code>{owner}</code><span>nom du commandant</span>
              <code>{self}</code><span>nom du joueur</span>
            </div>
            <p style="margin-top:8px;font-size:0.78rem;color:var(--text-secondary)">Utilisez <code>%s</code> dans Dire + valeur / Lire info pour afficher une statistique en direct.</p>
          </article>
        </section>

        <section class="help-card">
          <h3>🗂 Catégories de blocs</h3>
          <div class="help-category-list">
            <div><span style="--c:#1565c0">📋 Dialogue</span><p>Salutation, Dire, Dire avec choix, Dire + valeur, Confirmer, Choix, Retour.</p></div>
            <div><span style="--c:#6a1b9a">🧮 Variables</span><p>Constantes Lua et références pour prix, quantités et coordonnées.</p></div>
            <div><span style="--c:#1b5e20">👥 Équipage</span><p>Recruter, renvoyer, faire apparaître un membre d’équipage avec branches complètes.</p></div>
            <div><span style="--c:#d84315">🛒 Objets</span><p>Crédits, inventaire, vente, type de bloc, objet méta et message HUD.</p></div>
            <div><span style="--c:#283593">⚡ Monde</span><p>Activer un bloc, déplacer le PNJ, détruire une entité, gravité, tutoriel.</p></div>
            <div><span style="--c:#546e7a">🔗 Séquences</span><p>Séquence automatique, attente conditionnelle et suivi différé.</p></div>
            <div><span style="--c:#006064">💾 SQLite / Mémoire</span><p>Mémoire, tables HSQLDB personnalisées, lecture, écriture et incrément.</p></div>
            <div><span style="--c:#b71c1c">📜 Quêtes</span><p>Offre avancée, démarrage, étape, objectif, récompense, réussite et échec.</p></div>
            <div><span style="--c:#880e4f">⭐ Réputation</span><p>Ajouter, définir, réinitialiser, afficher et vérifier la réputation.</p></div>
            <div><span style="--c:#004d40">⏱ Délais</span><p>Limiter les récompenses quotidiennes et actions répétables.</p></div>
            <div><span style="--c:#33691e">📦 Stock</span><p>Stock persistant de boutique : initialiser, vendre, ajouter, réinitialiser, lire, vérifier.</p></div>
            <div><span style="--c:#795548">🚩 Drapeaux & monde</span><p>Drapeaux persistants et état global du monde.</p></div>
            <div><span style="--c:#2e7d32">✅ Branches</span><p>Crédits, valeurs joueur, drapeaux, réputation, délais, stock, monde, position, condition custom.</p></div>
            <div><span style="--c:#455a64">🧩 Expressions</span><p>Blocs <code>npc_cond_*</code> pour conditions composables, ET / OU / NON inclus.</p></div>
            <div><span style="--c:#ad1457">🔧 Avancé</span><p>Lire info, hook Lua personnalisé, état de conversation, suivi différé.</p></div>
          </div>
        </section>

        <section class="help-grid">
          <article class="help-card">
            <h3>📜 Système de quêtes</h3>
            <ul>
              <li>Les quêtes sont stockées dans <code>npc_quests</code> par joueur.</li>
              <li>Champs : <code>player</code>, <code>quest_id</code>, <code>status</code>, <code>step</code>.</li>
              <li><strong>Proposition avancée</strong> vérifie automatiquement si la quête est déjà active ou terminée.</li>
              <li><strong>Récompense</strong> peut combiner crédits, objet, réputation et drapeau.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>💾 Persistance HSQLDB</h3>
            <ul>
              <li>StarMade fournit <code>lib/hsqldb.jar</code> — aucun pilote externe requis.</li>
              <li>Chaque sous-système crée sa table à la première utilisation.</li>
              <li>Tables : <code>npc_quests</code>, <code>npc_memory</code>, <code>npc_reputation</code>, <code>npc_cooldowns</code>, <code>npc_shop_stock</code>.</li>
              <li>L’état monde est global, stocké avec un préfixe <code>world:</code>.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>📝 Commentaires</h3>
            <ul>
              <li>Un commentaire Blockly sur un bloc est recopié au-dessus du Lua généré.</li>
              <li>À l’import, les commentaires des hooks et nœuds sont restaurés quand possible.</li>
            </ul>
          </article>

          <article class="help-card">
            <h3>⛔ Blocs désactivés</h3>
            <ul>
              <li>Clic droit → Désactiver pour griser un bloc.</li>
              <li>Les hooks désactivés sont émis dans <code>--[[ DISABLED … --]]</code>.</li>
              <li>Le câblage utilise <code>-- [DISABLED]</code> pour préserver le round-trip.</li>
            </ul>
          </article>
        </section>

        <section class="help-card">
          <h3>📥 Import / Export</h3>
          <div class="help-do-dont">
            <div><h4>✅ Bonne pratique</h4><ul><li>Exportez en JSON pendant l’édition.</li><li>Téléchargez le Lua uniquement pour déployer.</li><li>Gardez les marqueurs <code>-- [DISABLED]</code> pour préserver la fidélité.</li></ul></div>
            <div><h4>⚠️ Limites connues</h4><ul><li>Le Lua très personnalisé peut revenir sous forme de Hook personnalisé.</li><li>Les scripts StarMade vanilla sont importés au mieux.</li><li>Les éditions manuelles réduisent la qualité du round-trip.</li></ul></div>
          </div>
        </section>

        <section class="help-card">
          <h3>⚙ Installer le Lua dans StarMade</h3>
          <ol class="help-steps">
            <li>Copiez le fichier <code>.lua</code> généré dans <code>StarMade/data/script/votre_script.lua</code>.</li>
            <li>Lancez StarMade et rejoignez le serveur comme administrateur.</li>
            <li><strong>Visez le PNJ</strong> jusqu’à ce qu’il soit sélectionné.</li>
            <li>Dans le chat, lancez <code>/creature_script votre_script.lua</code>.</li>
            <li>Parlez au PNJ : le nouveau dialogue est actif immédiatement.</li>
          </ol>
          <p class="help-note">La commande utilise l’entité actuellement sélectionnée au viseur. Le nom de fichier est sensible à la casse et doit inclure <code>.lua</code>.</p>
        </section>
`;

const HELP_HTML_DE = String.raw`
  <section class="help-hero"><div class="help-kicker">Integrierter Leitfaden</div><h2>StarMade NPC Creator Hilfe</h2><p>Erstellen Sie NPC-Dialogbäume visuell, erzeugen Sie automatisch Lua und importieren Sie Lua nach Möglichkeit wieder ohne Strukturverlust.</p></section>
  <section class="help-card"><h3>🚀 Schneller Arbeitsablauf</h3><ol class="help-steps"><li>Beginnen Sie mit einem <strong>Begrüßung</strong>-Block.</li><li>Fügen Sie <strong>Auswahl</strong>-Blöcke für Spieleroptionen hinzu.</li><li>Verbinden Sie Aktionen: Crew, Gegenstände, Quests, Ruf, Abklingzeiten.</li><li>Prüfen Sie die Lua-Ausgabe rechts.</li><li>Exportieren Sie JSON zum Bearbeiten oder laden Sie Lua für StarMade herunter.</li></ol></section>
  <section class="help-card"><h3>🗂 Blockkategorien</h3><p>Dialog, Variablen, Crew, Gegenstände, Welt, Sequenzen, SQLite, Quests, Ruf, Abklingzeiten, Bestand, Flags und erweiterte Hooks.</p></section>
  <section class="help-card"><h3>⚙ Lua in StarMade installieren</h3><ol class="help-steps"><li>Kopieren Sie die erzeugte <code>.lua</code>-Datei nach <code>StarMade/data/script/</code>.</li><li>Treten Sie dem Server als Administrator bei.</li><li>Zielen Sie auf den NPC.</li><li>Führen Sie <code>/creature_script ihr_script.lua</code> aus.</li></ol></section>
`;

const HELP_HTML_ES = String.raw`
  <section class="help-hero"><div class="help-kicker">Guía integrada</div><h2>Ayuda de StarMade NPC Creator</h2><p>Cree árboles de diálogo para NPC de forma visual, genere Lua automáticamente e importe el Lua de vuelta sin perder la estructura cuando sea posible.</p></section>
  <section class="help-card"><h3>🚀 Flujo rápido</h3><ol class="help-steps"><li>Empiece con un bloque de <strong>Saludo</strong>.</li><li>Añada bloques de <strong>Opción</strong> para las respuestas del jugador.</li><li>Conecte acciones: tripulación, objetos, misiones, reputación y enfriamientos.</li><li>Revise la salida Lua a la derecha.</li><li>Exporte JSON para editar o descargue Lua para StarMade.</li></ol></section>
  <section class="help-card"><h3>🗂 Categorías de bloques</h3><p>Diálogo, variables, tripulación, objetos, mundo, secuencias, SQLite, misiones, reputación, enfriamientos, stock, indicadores y hooks avanzados.</p></section>
  <section class="help-card"><h3>⚙ Instalar Lua en StarMade</h3><ol class="help-steps"><li>Copie el archivo <code>.lua</code> generado en <code>StarMade/data/script/</code>.</li><li>Entre al servidor como administrador.</li><li>Apunte al NPC.</li><li>Ejecute <code>/creature_script su_script.lua</code>.</li></ol></section>
`;

const HELP_HTML_RU = String.raw`
  <section class="help-hero"><div class="help-kicker">Встроенное руководство</div><h2>Справка StarMade NPC Creator</h2><p>Создавайте деревья диалогов NPC визуально, автоматически генерируйте Lua и по возможности импортируйте Lua обратно без потери структуры.</p></section>
  <section class="help-card"><h3>🚀 Быстрый процесс</h3><ol class="help-steps"><li>Начните с блока <strong>Приветствие</strong>.</li><li>Добавьте блоки <strong>Вариант</strong> для ответов игрока.</li><li>Подключите действия: экипаж, предметы, квесты, репутацию и перезарядки.</li><li>Проверьте вывод Lua справа.</li><li>Экспортируйте JSON для редактирования или скачайте Lua для StarMade.</li></ol></section>
  <section class="help-card"><h3>🗂 Категории блоков</h3><p>Диалог, переменные, экипаж, предметы, мир, последовательности, SQLite, квесты, репутация, перезарядки, склад, флаги и расширенные hooks.</p></section>
  <section class="help-card"><h3>⚙ Установка Lua в StarMade</h3><ol class="help-steps"><li>Скопируйте созданный файл <code>.lua</code> в <code>StarMade/data/script/</code>.</li><li>Зайдите на сервер как администратор.</li><li>Наведитесь на NPC.</li><li>Выполните <code>/creature_script ваш_script.lua</code>.</li></ol></section>
`;

const HELP_HTML_JA = String.raw`
  <section class="help-hero"><div class="help-kicker">内蔵ガイド</div><h2>StarMade NPC Creator ヘルプ</h2><p>NPCのダイアログツリーを視覚的に作成し、Luaを自動生成し、可能な場合は構造を失わずにLuaを再インポートできます。</p></section>
  <section class="help-card"><h3>🚀 クイックワークフロー</h3><ol class="help-steps"><li><strong>あいさつ</strong>ブロックから開始します。</li><li>プレイヤーの選択肢として<strong>選択肢</strong>ブロックを追加します。</li><li>クルー、アイテム、クエスト、評判、クールダウンなどのアクションを接続します。</li><li>右側のLua出力を確認します。</li><li>編集用にJSONをエクスポートするか、StarMade用にLuaをダウンロードします。</li></ol></section>
  <section class="help-card"><h3>🗂 ブロックカテゴリ</h3><p>ダイアログ、変数、クルー、アイテム、ワールド、シーケンス、SQLite、クエスト、評判、クールダウン、在庫、フラグ、高度なフック。</p></section>
  <section class="help-card"><h3>⚙ StarMadeにLuaを導入</h3><ol class="help-steps"><li>生成した<code>.lua</code>ファイルを<code>StarMade/data/script/</code>へコピーします。</li><li>管理者としてサーバーへ参加します。</li><li>NPCを照準で選択します。</li><li><code>/creature_script your_script.lua</code>を実行します。</li></ol></section>
`;

const HELP_BY_LOCALE = { en: HELP_HTML_EN, fr: HELP_HTML_FR, de: HELP_HTML_DE, es: HELP_HTML_ES, ru: HELP_HTML_RU, ja: HELP_HTML_JA };

/**
 * Inject the structured Help tab HTML into the shell container.
 *
 * @returns {void}
 */
export function initHelpPanel() {
  const el = document.getElementById('helpOutput');
  if (el) el.innerHTML = HELP_BY_LOCALE[getLocale()] || HELP_HTML_EN;
}
