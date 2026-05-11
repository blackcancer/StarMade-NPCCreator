// toolbox.js — Blockly toolbox XML kept out of shell.html

import { localizeToolboxXml } from './i18n.js';

export const TOOLBOX_XML = String.raw`
<xml id="toolbox" style="display:none">

  <!-- ── DIALOG ──────────────────────────────────────────────────────────── -->
  <category name="📋 Dialog" colour="#1565c0">
    <block type="npc_greeting"></block>
    <block type="npc_cond_greeting"></block>
    <block type="npc_say"></block>
    <block type="npc_say_value"></block>
    <block type="npc_say_menu"></block>
    <block type="npc_confirm"></block>
    <sep></sep>
    <block type="npc_choice"></block>
    <block type="npc_goback"></block>
  </category>

  <!-- ── VARIABLES ────────────────────────────────────────────────────────── -->
  <category name="🧮 Variables" colour="#6a1b9a">
    <block type="npc_lua_var"></block>
    <block type="npc_var_ref"></block>
  </category>

  <!-- ── CREW ─────────────────────────────────────────────────────────────── -->
  <category name="👥 Crew" colour="#1b5e20">
    <block type="npc_hire"></block>
    <block type="npc_unhire"></block>
    <block type="npc_spawn_crew"></block>
  </category>

  <!-- ── ITEMS ────────────────────────────────────────────────────────────── -->
  <category name="🛒 Items" colour="#d84315">
    <block type="npc_give_credits"></block>
    <block type="npc_check_inventory"></block>
    <block type="npc_take_item"></block>
    <block type="npc_send_message"></block>
    <sep></sep>
    <block type="npc_sell_item"></block>
    <block type="npc_give_type"></block>
    <block type="npc_give_meta_item"></block>
  </category>

  <!-- ── WORLD ────────────────────────────────────────────────────────────── -->
  <category name="⚡ World" colour="#283593">
    <block type="npc_activate_block"></block>
    <block type="npc_move_to"></block>
    <block type="npc_destroy_ship"></block>
    <block type="npc_give_gravity"></block>
    <block type="npc_call_tutorial"></block>
  </category>

  <!-- ── SEQUENCES ────────────────────────────────────────────────────────── -->
  <category name="🔗 Sequences" colour="#546e7a">
    <block type="npc_auto_sequence"></block>
    <block type="npc_wait_until"></block>
  </category>

  <!-- ── SQLITE / MEMORY ──────────────────────────────────────────────────── -->
  <category name="💾 SQLite" colour="#006064">
    <block type="npc_sqlite_table"></block>
    <block type="npc_sqlite_get"></block>
    <block type="npc_sqlite_set"></block>
    <block type="npc_sqlite_increment"></block>
    <sep></sep>
    <block type="npc_memory_set"></block>
    <block type="npc_memory_increment"></block>
  </category>

  <!-- ── QUESTS ───────────────────────────────────────────────────────────── -->
  <category name="📜 Quests" colour="#b71c1c">
    <block type="npc_quest_offer_advanced"></block>
    <block type="npc_quest_offer"></block>
    <block type="npc_quest_start"></block>
    <block type="npc_quest_set_step"></block>
    <block type="npc_quest_require_status"></block>
    <block type="npc_quest_require_step"></block>
    <block type="npc_quest_objective"></block>
    <block type="npc_quest_reward"></block>
    <block type="npc_quest_complete"></block>
    <block type="npc_quest_fail"></block>
  </category>

  <!-- ── REPUTATION ───────────────────────────────────────────────────────── -->
  <category name="⭐ Reputation" colour="#880e4f">
    <block type="npc_rep_add"></block>
    <block type="npc_rep_set"></block>
    <block type="npc_rep_reset"></block>
    <block type="npc_get_rep"></block>
    <block type="npc_check_rep"></block>
  </category>

  <!-- ── COOLDOWNS ────────────────────────────────────────────────────────── -->
  <category name="⏱ Cooldowns" colour="#004d40">
    <block type="npc_cooldown_set"></block>
    <block type="npc_cooldown_clear"></block>
    <block type="npc_get_cooldown_remaining"></block>
    <block type="npc_check_cooldown"></block>
  </category>

  <!-- ── STOCK ────────────────────────────────────────────────────────────── -->
  <category name="📦 Stock" colour="#33691e">
    <block type="npc_stock_init"></block>
    <block type="npc_stock_sell"></block>
    <block type="npc_stock_add"></block>
    <block type="npc_stock_reset"></block>
    <block type="npc_get_stock"></block>
    <block type="npc_check_stock"></block>
  </category>

  <!-- ── FLAGS & WORLD STATE ──────────────────────────────────────────────── -->
  <category name="🚩 Flags &amp; World" colour="#f57f17">
    <block type="npc_flag_set"></block>
    <block type="npc_check_flag_db"></block>
    <sep></sep>
    <block type="npc_world_set"></block>
    <block type="npc_world_get"></block>
    <block type="npc_get_world"></block>
    <block type="npc_check_world"></block>
  </category>

  <!-- ── BRANCHES (if/then/else — no bottom connector) ───────────────────── -->
  <category name="✅ Branches" colour="#2e7d32">
    <block type="npc_if_condition"></block>
    <sep></sep>
    <block type="npc_check_credits"></block>
    <block type="npc_check_player_value"></block>
    <block type="npc_check_flag"></block>
    <block type="npc_is_at_block"></block>
    <block type="npc_check_custom_condition"></block>
  </category>

  <!-- ── EXPRESSIONS (green — plug into If Condition or Wait Until) ───────── -->
  <category name="🧩 Expressions" colour="#455a64">
    <block type="npc_cond_player_value"></block>
    <block type="npc_cond_flag"></block>
    <block type="npc_cond_is_at_block"></block>
    <block type="npc_cond_custom"></block>
    <sep></sep>
    <block type="npc_cond_sqlite_value"></block>
    <block type="npc_cond_sqlite_exists"></block>
    <block type="npc_cond_sqlite_number"></block>
    <block type="npc_cond_sqlite_text"></block>
    <sep></sep>
    <block type="npc_cond_memory_number"></block>
    <block type="npc_cond_memory_text"></block>
    <block type="npc_cond_memory_exists"></block>
    <sep></sep>
    <block type="npc_cond_quest_status"></block>
    <block type="npc_cond_quest_step"></block>
    <sep></sep>
    <block type="npc_cond_rep"></block>
    <block type="npc_cond_cooldown"></block>
    <block type="npc_cond_stock"></block>
    <block type="npc_cond_flag_db"></block>
    <block type="npc_cond_world"></block>
    <sep></sep>
    <block type="npc_cond_conv_state"></block>
    <sep></sep>
    <block type="npc_cond_and"></block>
    <block type="npc_cond_or"></block>
    <block type="npc_cond_not"></block>
  </category>

  <!-- ── ADVANCED ─────────────────────────────────────────────────────────── -->
  <category name="🔧 Advanced" colour="#6a0032">
    <block type="npc_custom_hook"></block>
    <block type="npc_get_info"></block>
    <block type="npc_set_conv_state"></block>
    <block type="npc_delayed_followup"></block>
  </category>

</xml>
`;

/** Create a DOM element containing the Blockly toolbox XML. */
export function createToolboxElement() {
  const tpl = document.createElement('template');
  tpl.innerHTML = localizeToolboxXml(TOOLBOX_XML.trim());
  return tpl.content.firstElementChild;
}
