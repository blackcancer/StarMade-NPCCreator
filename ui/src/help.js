// help.js — Structured content for the Help tab

const HELP_HTML = String.raw`
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

/**
 * Inject the structured Help tab HTML into the shell container.
 *
 * @returns {void}
 */
export function initHelpPanel() {
  const el = document.getElementById('helpOutput');
  if (el) el.innerHTML = HELP_HTML;
}
