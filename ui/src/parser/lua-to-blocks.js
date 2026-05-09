// parser/lua-to-blocks.js — Parse generated Lua back to Blockly workspace state
import { enrichSerializedBlock, reactionText, attachVarRefInput, escapeRegExp, resolveLuaNumeric } from '../generator/core.js';


function parseLuaToBlocklyState(lua) {

  // ── Step 1: Extract global function bodies + constants ─────────────────────
  const hookBodies  = {};  // funcName → body string
  const hookArgDefs = {};  // funcName → extra param names e.g. ['x','y','z']
  const fnBodies    = {};  // any pre-create function body
  const fnArgDefs   = {};  // any pre-create function arg names
  const constVals   = {};  // priceLaser → 100000
  const globalVars  = [];  // standalone global vars before create()

  const createIdx    = lua.search(/\r?\nfunction create\s*\(/);
  const beforeCreate = createIdx >= 0 ? lua.slice(0, createIdx) : lua;

  const anyFnRe = /^function\s+(\w+)\s*\(([^)]*)\)\r?\n([\s\S]+?)\r?\nend/gm;
  let hm;
  while ((hm = anyFnRe.exec(beforeCreate)) !== null) {
    const fnName = hm[1];
    const argDefs = hm[2].split(',').map(s => s.trim()).filter(Boolean);
    const body = hm[3].trim();
    fnBodies[fnName] = body;
    fnArgDefs[fnName] = argDefs;
    if (argDefs[0] === 'dialogObject') {
      hookBodies[fnName] = body;
      hookArgDefs[fnName] = argDefs.slice(1);
    }
  }

  const beforeCreateNoFns = beforeCreate.replace(anyFnRe, '');

  const constRe = /^\s*(?:local\s+)?(\w+)\s*=\s*(-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*")\s*;?\s*$/gm;
  let cm;
  while ((cm = constRe.exec(beforeCreateNoFns)) !== null) {
    let val = cm[2];
    if (/^"/.test(val)) val = val.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    else val = Number(val);
    constVals[cm[1]] = val;
  }
  const globalVarRe = /^\s*(\w+)\s*=\s*(-?\d+(?:\.\d+)?|"(?:[^"\\]|\\.)*")\s*;?\s*$/gm;
  let gv;
  while ((gv = globalVarRe.exec(beforeCreateNoFns)) !== null) {
    const rawVal = gv[2];
    globalVars.push({
      type: 'npc_lua_var',
      x: 30,
      y: 40 + (globalVars.length * 88),
      fields: {
        NAME: gv[1],
        MODE: /^"/.test(rawVal) ? 'text' : 'number',
        VALUE: /^"/.test(rawVal)
          ? rawVal.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          : String(Number(rawVal)),
      }
    });
  }

  // ── Step 2: Extract create() body ─────────────────────────────────────────
  const createMatch = lua.match(/function create\s*\(dialogObject,\s*bindings\)\r?\n([\s\S]+?)^end/m);
  if (!createMatch) throw new Error('No create() function found.');
  const createBody = createMatch[1];

  // ── Step 3: Parse all declarations and wiring calls ───────────────────────
  const nodes       = {}; // varName → { text, ms }
  const hookInsts   = {}; // hookVarName → { funcName, params[] }
  const hookMeta    = {}; // funcName   → { disabled, comment }
  const nodeMeta    = {}; // varName    → { disabled, comment }
  const hookOf      = {}; // nodeVarName → hookVarName (from setHook)
  const reactionMap = {}; // nodeVarName → [{ hookVar, code, targetVar }]
  const addCalls    = []; // { fromVar, targetVar, label }
  let   rootVar     = null;

  function splitLuaArgs(argText) {
    const out = [];
    let cur = '';
    let depth = 0;
    let inString = false;
    for (let i = 0; i < argText.length; i++) {
      const ch = argText[i];
      if (ch === '"' && argText[i - 1] !== '\\') inString = !inString;
      if (!inString) {
        if (ch === '(' || ch === '{' || ch === '[') depth++;
        else if (ch === ')' || ch === '}' || ch === ']') depth--;
        else if (ch === ',' && depth === 0) {
          out.push(cur.trim());
          cur = '';
          continue;
        }
      }
      cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function toLogicalLines(body) {
    const lines = [];
    const rawLines = body.split(/\r?\n/);
    let current = '';
    for (const rawLine of rawLines) {
      if (!current) current = rawLine;
      else current += ' ' + rawLine.trim();
      const trimmed = current.trimEnd();
      if (countOpen(current) <= 0 && !trimmed.endsWith('..') && !trimmed.endsWith(',')) {
        lines.push(current);
        current = '';
      }
    }
    if (current.trim()) lines.push(current);
    return lines;
  }

  const logicalLines = [];
  const pendingLines = toLogicalLines(createBody);
  let helperSeq = 0;
  while (pendingLines.length > 0) {
    const line = pendingLines.shift();
    const trimmed = line.trim();
    const callM = trimmed.match(/^(\w+)\s*\((.*)\)\s*;?$/);
    if (callM && fnBodies[callM[1]] && callM[1] !== 'create') {
      const fnName = callM[1];
      const body = fnBodies[fnName] || '';
      if (/(?:add\(|newInstance|setHook|addReaction|setRootEntry)/.test(body)) {
        const params = fnArgDefs[fnName] || [];
        const args = splitLuaArgs(callM[2]);
        const helperLines = toLogicalLines(body);
        const locals = Array.from(new Set((body.match(/(?:^|\r?\n)\s*(?:local\s+)?(\w+)\s*=/gm) || [])
          .map(s => (s.match(/(\w+)\s*=/) || [])[1])
          .filter(Boolean)
          .filter(v => !params.includes(v))));
        const prefix = `__${fnName}_${++helperSeq}_`;
        const expanded = helperLines.map(src => {
          let out = src;
          for (const localName of locals) out = out.replace(new RegExp(`\\b${escapeRegExp(localName)}\\b`, 'g'), `${prefix}${localName}`);
          params.forEach((p, i) => {
            const arg = args[i] || p;
            out = out.replace(new RegExp(`\\b${escapeRegExp(p)}\\b`, 'g'), arg);
          });
          return out;
        });
        pendingLines.unshift(...expanded.reverse());
        continue;
      }
    }
    logicalLines.push(line);
  }

  function decodeLuaString(raw) {
    return String(raw || '').replace(/\\n/g,'\n').replace(/\\"/g,'"').replace(/\\\\/g,'\\');
  }

  function extractDialogText(line) {
    const textM = line.match(/dialogObject:format\s*\(\s*"((?:[^"\\]|\\.)*)"/);
    const rawTextM = line.match(/newInstance\s*\([^,]+,\s*"((?:[^"\\]|\\.)*)"/);
    if (textM) {
      let text = decodeLuaString(textM[1]);
      const afterQuote = line.slice(line.indexOf(textM[0]) + textM[0].length);
      const concatRe = /\.\.\s*"((?:[^"\\]|\\.)*)"/g;
      let cleanedAfterQuote = afterQuote;
      let sm;
      while ((sm = concatRe.exec(afterQuote)) !== null) text += decodeLuaString(sm[1]);
      cleanedAfterQuote = cleanedAfterQuote.replace(concatRe, '');
      const phMap = {
        'getConverationParterName':        '{name}',
        'getConverationPartnerAffinity':   '{partner}',
        'getConverationPartnerFactionName':'{faction}',
        'getConverationPartnerOwnerName':  '{owner}',
        'getOwnName':                      '{self}',
        'getName':                         '{entity}',
      };
      const argRe = /,\s*(?:dialogObject:(?:\w+\s*\(\s*\)\s*:\s*)?(\w+)\s*\(\s*\)|([A-Za-z_]\w*)|(-?\d+(?:\.\d+)?))/g;
      let am;
      while ((am = argRe.exec(cleanedAfterQuote)) !== null) {
        let repl = '%s';
        if (am[1]) repl = phMap[am[1]] || '%s';
        else if (am[2] && Object.prototype.hasOwnProperty.call(constVals, am[2])) repl = String(constVals[am[2]]);
        else if (am[3]) repl = am[3];
        text = text.replace('%s', repl);
      }
      return text;
    }
    if (rawTextM) return decodeLuaString(rawTextM[1]);
    return '';
  }

  // Track comments and disabled state from preceding lines
  let _pendingComment = null;
  let _pendingDisabled = false;
  // Also store per-hook and per-node disabled/comment info
  let _inDisabledBlock = false; // inside --[[ DISABLED ... --]]

  for (const rawLine of logicalLines) {
    let line = rawLine.trim();

    // Disabled generated lines are emitted as comments, e.g.
    //   -- [DISABLED] local entry1 = ...
    // Parse the payload as normal Lua while carrying the disabled flag.
    const disabledCodeM = line.match(/^--\s*\[DISABLED\]\s+(.+)$/);
    if (disabledCodeM) {
      _pendingDisabled = true;
      line = disabledCodeM[1].trim();
    }

    // ── Detect --[[ DISABLED block start / end ────────────────────────────────
    if (line === '--[[ DISABLED') { _inDisabledBlock = true; continue; }
    if (line === '--]]' && _inDisabledBlock) { _inDisabledBlock = false; continue; }

    // ── Detect legacy -- [DISABLED] marker without inline Lua ─────────────────
    const disabledM = !disabledCodeM && line.match(/^--\s*\[DISABLED\]\s+(\w+)/);
    if (disabledM) {
      _pendingDisabled = true;
      continue;
    }

    // ── Detect regular comments (potential block comments) ────────────────────
    if (line.startsWith('--') && !line.startsWith('--[[') && !line.startsWith('-- [DISABLED]')) {
      const commentText = line.replace(/^--\s*/, '').trim();
      // Accumulate multi-line comments
      if (_pendingComment) _pendingComment += '\n' + commentText;
      else _pendingComment = commentText;
      continue;
    }

    if (!line) { _pendingComment = null; _pendingDisabled = false; continue; }

    // ── Hook instance declaration (MUST come before TextEntry check) ─────────────
    // Both `local hook_FUNC =` and `hookVarName =` (vanilla)
    const hookInstM2 = line.match(/(?:local\s+)?(\w+)\s*=\s*luajava\.newInstance\s*\([^,]*(?:DialogTextEntryHookLua|HookLua)[^,]*,\s*"(\w+)"\s*,\s*\{([^}]*)\}/);
    if (hookInstM2) {
      const [, varName, funcName, paramsRaw] = hookInstM2;
      const params = paramsRaw.split(',').map(s => s.trim()).filter(Boolean);
      hookInsts[varName] = { funcName, params };
      hookMeta[funcName] = { disabled: _pendingDisabled, comment: _pendingComment };
      _pendingComment = null; _pendingDisabled = false;
      continue;
    }

    // ── TextEntry node declaration ───────────────────────────────────────────
    // Both `local VAR =` (NPCCreator) and `VAR =` (vanilla) are supported
    // CancelDialogEntry and TextEntry both create dialog nodes
    const nodeM = line.match(/(?:local\s+)?(\w+)\s*=\s*luajava\.newInstance\s*\(\s*(?:"[^"]*(?:TextEntry|CancelDialogEntry)[^"]*"|TextEntry|CancelDialogEntry)\s*,\s*/);
    if (nodeM) {
      const varName = nodeM[1];
      if (varName.startsWith('hook_') || hookInsts[varName]) continue;
      const text = extractDialogText(line);
      const msM = line.match(/,\s*(\d+)\s*\)\s*;?\s*$/);
      nodes[varName] = {
        text: text || '...',
        ms: msM ? parseInt(msM[1]) : 2000,
        disabled: _pendingDisabled,
        comment: _pendingComment,
      };
      nodeMeta[varName] = { disabled: _pendingDisabled, comment: _pendingComment };
      _pendingComment = null; _pendingDisabled = false;
      continue;
    }

    // (hookInstM check moved to top of loop)

    // ── setRootEntry ──────────────────────────────────────────────────────────
    const rootM = line.match(/factory:setRootEntry\s*\(\s*(\w+)\s*\)/);
    if (rootM) { rootVar = rootM[1]; continue; }

    // ── setHook ───────────────────────────────────────────────────────────────
    const hookM = line.match(/^(\w+):setHook\s*\(\s*(\w+)\s*\)/);
    if (hookM) { hookOf[hookM[1]] = hookM[2]; continue; }

    const reactM = line.match(/^(\w+):addReaction\s*\(\s*(\w+)\s*,\s*(-?\d+)\s*,\s*(\w+)\s*\)/);
    if (reactM) {
      if (!reactionMap[reactM[1]]) reactionMap[reactM[1]] = [];
      reactionMap[reactM[1]].push({ hookVar: reactM[2], code: Number(reactM[3]), targetVar: reactM[4] });
      continue;
    }

    // ── add() choice wiring ───────────────────────────────────────────────────
    // VAR:add(TARGET, "label") or VAR:add(TARGET, dialogObject:format("label"...))
    const addM = line.match(/^(\w+):add\s*\(\s*(\w+)\s*,/);
    if (addM) {
      const label = extractDialogText(line);
      addCalls.push({ fromVar: addM[1], targetVar: addM[2], label: label || '...' });
      continue;
    }
  }

  if (!rootVar) throw new Error('No factory:setRootEntry() found.');

  // ── Step 4: Build choice map ───────────────────────────────────────────────
  const choiceMap = {};
  for (const c of addCalls) {
    if (!choiceMap[c.fromVar]) choiceMap[c.fromVar] = [];
    choiceMap[c.fromVar].push({ targetVar: c.targetVar, label: c.label });
  }

  // ── Step 5: Build Blockly state ───────────────────────────────────────────
  const rootNode = nodes[rootVar] || { text: '...', ms: 2000 };
  const greetingBlock = {
    type: 'npc_greeting', x: 30, y: 40 + (globalVars.length * 88) + (globalVars.length ? 40 : 0),
    fields: { TEXT: stripBrackets(rootNode.text), MS: rootNode.ms }
  };

  const rootChoices = choiceMap[rootVar] || [];
  if (rootChoices.length > 0) {
    const chain = buildChoiceChain(rootChoices, nodes, hookOf, hookInsts, hookBodies, hookArgDefs, choiceMap, reactionMap, new Set([rootVar]), constVals);
    if (chain) greetingBlock.inputs = { CHOICES: { block: chain } };
  }

  return { blocks: { languageVersion: 0, blocks: [...globalVars, greetingBlock] } };
}

// ── Count unbalanced open parens (for continuation detection) ────────────────
function countOpen(line) {
  let n = 0;
  for (const c of line) { if (c === '(') n++; else if (c === ')') n--; }
  return n;
}

// ── Strip [bracket] wrapper from sub-menu labels ─────────────────────────────
function stripBrackets(t) {
  t = t || '';
  return (t.startsWith('[') && t.endsWith(']')) ? t.slice(1, -1) : t;
}

/** Resolve a parsed TextEntry variable into plain Blockly text. */
function nodeText(varName, nodes, fallback = '...') {
  return stripBrackets(nodes?.[varName]?.text || fallback);
}

/** Convert a parsed TextEntry variable into a serialized npc_say block. */
function textNodeAsSay(varName, nodes, fallback = '...') {
  return {
    type: 'npc_say',
    fields: {
      TEXT: nodeText(varName, nodes, fallback),
      MS: nodes?.[varName]?.ms || 2000,
    }
  };
}

/** Attach a serialized statement input to a block when a child exists. */
function attachStatementInput(block, inputName, child) {
  if (!child) return block;
  block.inputs = block.inputs || {};
  block.inputs[inputName] = { block: child };
  return block;
}

function stripOuterParensExpr(expr) {
  expr = (expr || '').trim();
  while (expr.startsWith('(') && expr.endsWith(')')) {
    let depth = 0;
    let wraps = true;
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth--;
      if (depth === 0 && i < expr.length - 1) { wraps = false; break; }
    }
    if (!wraps) break;
    expr = expr.slice(1, -1).trim();
  }
  return expr;
}

function splitTopLevelBool(expr, op) {
  let depth = 0;
  let inString = false;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (ch === '"' && expr[i - 1] !== '\\') inString = !inString;
    if (inString) continue;
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (depth === 0 && expr.slice(i, i + op.length + 2) === ` ${op} `) {
      return [expr.slice(0, i).trim(), expr.slice(i + op.length + 2).trim()];
    }
  }
  return null;
}

function buildConditionBlockFromExpression(expr) {
  expr = stripOuterParensExpr(expr || 'false');

  let m = expr.match(/^dialogObject:getEntity\(\)\s*~=\s*nil\s+and\s+(.+)$/);
  if (m) return buildConditionBlockFromExpression(m[1]);

  if (expr.startsWith('not ')) {
    return {
      type: 'npc_cond_not',
      inputs: { COND: { block: buildConditionBlockFromExpression(expr.slice(4).trim()) } }
    };
  }

  const andParts = splitTopLevelBool(expr, 'and');
  if (andParts) {
    return {
      type: 'npc_cond_and',
      inputs: {
        A: { block: buildConditionBlockFromExpression(andParts[0]) },
        B: { block: buildConditionBlockFromExpression(andParts[1]) },
      }
    };
  }

  const orParts = splitTopLevelBool(expr, 'or');
  if (orParts) {
    return {
      type: 'npc_cond_or',
      inputs: {
        A: { block: buildConditionBlockFromExpression(orParts[0]) },
        B: { block: buildConditionBlockFromExpression(orParts[1]) },
      }
    };
  }

  m = expr.match(/^dialogObject:getEntity\(\):(getCredits|getHealth|getMaxHealth|getFactionId|getCurrentSectorId)\(\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const methodToType = {
      getCredits: 'credits',
      getHealth: 'health',
      getMaxHealth: 'maxHealth',
      getFactionId: 'factionId',
      getCurrentSectorId: 'sectorId',
    };
    return {
      type: 'npc_cond_player_value',
      fields: {
        VALUE_TYPE: methodToType[m[1]] || 'credits',
        OP: m[2],
        VALUE: Number(m[3]),
      }
    };
  }

  m = expr.match(/^dialogObject:getEntity\(\):isCreativeModeEnabled\(\)\s*==\s*(true|false)$/);
  if (m) {
    return { type: 'npc_cond_flag', fields: { FLAG: 'creative', EXPECT: m[1] } };
  }

  m = expr.match(/^dialogObject:isConverationPartnerInTeam\(\)\s*==\s*(true|false)$/);
  if (m) {
    return { type: 'npc_cond_flag', fields: { FLAG: 'inTeam', EXPECT: m[1] } };
  }

  m = expr.match(/^dialogObject:isAtBlock\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)$/);
  if (m) {
    return {
      type: 'npc_cond_is_at_block',
      fields: { X: parseInt(m[1]), Y: parseInt(m[2]), Z: parseInt(m[3]) }
    };
  }

  m = expr.match(/^_dbGetPlayerValue\("([^"]+)",\s*"([^"]+)",\s*dialogObject:getOwnName\(\),\s*(.+?)\)\s*(>=|<=|==|~=|>|<)\s*(.+)$/);
  if (m) {
    return {
      type: 'npc_cond_sqlite_value',
      fields: {
        TABLE: m[1],
        COL: m[2],
        DEFAULT: m[3].trim(),
        OP: m[4],
        VALUE: m[5].trim(),
      }
    };
  }

  m = expr.match(/^_dbGetPlayerNumber\("([^"]+)",\s*"([^"]+)",\s*dialogObject:getOwnName\(\),\s*(-?\d+(?:\.\d+)?)\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (m) {
    return {
      type: 'npc_cond_sqlite_number',
      fields: {
        TABLE: m[1],
        COL: m[2],
        DEFAULT: Number(m[3]),
        OP: m[4],
        VALUE: Number(m[5]),
      }
    };
  }

  m = expr.match(/^_dbGetPlayerText\("([^"]+)",\s*"([^"]+)",\s*dialogObject:getOwnName\(\),\s*"([^"]*)"\)\s*(==|~=)\s*"([^"]*)"$/);
  if (m) {
    return {
      type: 'npc_cond_sqlite_text',
      fields: {
        TABLE: m[1],
        COL: m[2],
        DEFAULT: m[3],
        OP: m[4],
        VALUE: m[5],
      }
    };
  }

  m = expr.match(/^_dbHasPlayerRow\("([^"]+)",\s*dialogObject:getOwnName\(\)\)\s*==\s*(true|false)$/);
  if (m) {
    return {
      type: 'npc_cond_sqlite_exists',
      fields: {
        TABLE: m[1],
        EXPECT: m[2],
      }
    };
  }

  m = expr.match(/^_memGetNumber\(dialogObject:getOwnName\(\),\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (m) {
    return {
      type: 'npc_cond_memory_number',
      fields: {
        KEY: m[1],
        DEFAULT: Number(m[2]),
        OP: m[3],
        VALUE: Number(m[4]),
      }
    };
  }

  m = expr.match(/^_memGetText\(dialogObject:getOwnName\(\),\s*"([^"]+)",\s*"([^"]*)"\)\s*(==|~=)\s*"([^"]*)"$/);
  if (m) {
    return {
      type: 'npc_cond_memory_text',
      fields: {
        KEY: m[1],
        DEFAULT: m[2],
        OP: m[3],
        VALUE: m[4],
      }
    };
  }

  m = expr.match(/^_memHas\(dialogObject:getOwnName\(\),\s*"([^"]+)"\)\s*==\s*(true|false)$/);
  if (m) {
    return {
      type: 'npc_cond_memory_exists',
      fields: {
        KEY: m[1],
        EXPECT: m[2],
      }
    };
  }

  m = expr.match(/^_questStatus\(dialogObject:getOwnName\(\),\s*"([^"]+)"\)\s*==\s*"([^"]*)"$/) ||
       expr.match(/^_memGetText\(dialogObject:getOwnName\(\),\s*"quest:([^":]+):status",\s*""\)\s*==\s*"([^"]*)"$/);
  if (m) {
    return {
      type: 'npc_cond_quest_status',
      fields: {
        QUEST_ID: m[1],
        STATUS: m[2],
      }
    };
  }

  m = expr.match(/^_questStep\(dialogObject:getOwnName\(\),\s*"([^"]+)"\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)$/) ||
       expr.match(/^_memGetNumber\(dialogObject:getOwnName\(\),\s*"quest:([^":]+):step",\s*0\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)$/);
  if (m) {
    return {
      type: 'npc_cond_quest_step',
      fields: {
        QUEST_ID: m[1],
        OP: m[2],
        STEP: Number(m[3]),
      }
    };
  }

  return { type: 'npc_cond_custom', fields: { EXPR: expr } };
}

// ── Build a linked chain of choice blocks ─────────────────────────────────────
function buildChoiceChain(list, nodes, hookOf, hookInsts, hookBodies, hookArgDefs, choiceMap, reactionMap, visited, constVals) {
  visited = visited || new Set();
  if (!list.length) return null;
  const [first, ...rest] = list;
  const block = buildSingleChoice(first, nodes, hookOf, hookInsts, hookBodies, hookArgDefs, choiceMap, reactionMap, visited, constVals);
  if (block && rest.length) {
    const next = buildChoiceChain(rest, nodes, hookOf, hookInsts, hookBodies, hookArgDefs, choiceMap, reactionMap, visited, constVals);
    if (next) block.next = { block: next };
  }
  return block;
}

// ── Build one choice block ────────────────────────────────────────────────────
function buildSingleChoice(choice, nodes, hookOf, hookInsts, hookBodies, hookArgDefs, choiceMap, reactionMap, visited, constVals) {
  visited = visited || new Set();
  const { targetVar, label } = choice;

  // Cycle guard — vanilla scripts often have back-links (entry:add(parentEntry,...))
  if (visited.has(targetVar)) {
    return { type: 'npc_goback', fields: { LABEL: label || 'Back' } };
  }
  visited.add(targetVar);

  const hookVarName = hookOf[targetVar];
  const hookInst    = hookVarName ? hookInsts[hookVarName] : null;
  const subChoices  = choiceMap[targetVar] || [];

  // Terminal (no hook, no sub-choices) → GoBack
  if (!hookVarName && !hookInst && subChoices.length === 0) {
    return { type: 'npc_goback', fields: { LABEL: label } };
  }

  // Has a hook → action block
  if (hookInst) {
    const fn     = hookInst.funcName;
    const body   = hookBodies[fn] || '';
    const params = hookInst.params;
    const action = buildActionBlock(fn, body, params, hookArgDefs[fn] || [], constVals, reactionMap[targetVar] || [], nodes, targetVar, choiceMap, hookOf, hookInsts, hookBodies, hookArgDefs, reactionMap);
    const meta2  = nodes[targetVar] || {};
    const block  = { type: 'npc_choice', fields: { LABEL: stripBrackets(label) } };
    if (action) {
      // Metadata belongs to the generated action node (Hire Crew, Give Item...),
      // not to the parent choice wrapper.
      if (meta2.disabled) action.enabled = false;
      if (meta2.comment)  action.extraState = { comment: meta2.comment };
      block.inputs = { ACTIONS: { block: action } };
    } else {
      if (meta2.disabled) block.enabled = false;
      if (meta2.comment)  block.extraState = { comment: meta2.comment };
    }
    return enrichSerializedBlock(block, { nodeText: nodes[targetVar]?.text || label, nodeMs: nodes[targetVar]?.ms || 2000 });
  }

  // Has sub-choices (sub-menu) — may be npc_say_menu, npc_confirm, or npc_quest_offer
  if (subChoices.length > 0) {
    const nodeText = nodes[targetVar]?.text || label;
    const nodeMs   = nodes[targetVar]?.ms   || 2000;

    // npc_quest_offer: sub-choices include one that leads to a questOfferHook_
    for (const ch of subChoices) {
      const chHookVar  = hookOf?.[ch.targetVar];
      const chHookInst = chHookVar ? hookInsts?.[chHookVar] : null;
      const chBody     = chHookInst ? (hookBodies?.[chHookInst.funcName] || '') : '';
      if (chBody && /_questSet\(player,/.test(chBody) && !/status\s*==\s*"complete"/.test(chBody)) {
        // This is the accept choice leading to a questOfferHook_
        const acceptChoice  = subChoices[0] || {};
        const refuseChoice  = subChoices[1] || {};
        const startVar      = acceptChoice.targetVar;
        const startHookVar  = hookOf?.[startVar];
        const startHookInst = startHookVar ? hookInsts?.[startHookVar] : null;
        const startBody     = startHookInst ? (hookBodies?.[startHookInst.funcName] || '') : '';
        const questM        = startBody.match(/_questSet\(player,\s*"([^"]+)",\s*"active",\s*(-?\d+)\)/);
        const acceptedVar   = (reactionMap?.[startVar]||[]).find(r=>Number(r.code)===0)?.targetVar;
        const offerBlock = {
          type: 'npc_quest_offer',
          fields: {
            QUEST_ID:     questM?.[1] || '',
            OFFER_TEXT:   nodeText,
            ACCEPT_LABEL: acceptChoice.label || 'Yes, I will do it!',
            REFUSE_LABEL: refuseChoice.label || 'Not now.',
            STEP:         questM ? Number(questM[2]) : 1,
          }
        };
        attachStatementInput(offerBlock, 'ACCEPTED', textNodeAsSay(acceptedVar, nodes, 'Quest started. Good luck!'));
        attachStatementInput(offerBlock, 'REFUSED',  textNodeAsSay(refuseChoice.targetVar, nodes, 'Come back if you change your mind.'));
        const choiceBlock = { type: 'npc_choice', fields: { LABEL: stripBrackets(label) }, inputs: { ACTIONS: { block: offerBlock } } };
        return enrichSerializedBlock(choiceBlock, { nodeText, nodeMs });
      }
    }

    // npc_confirm: exactly 2 choices, no hook, no actions inside choices
    if (subChoices.length === 2) {
      const [yesC, noC] = subChoices;
      const yesTarget = hookInsts?.[hookOf?.[yesC?.targetVar]] || choiceMap?.[yesC?.targetVar]?.length;
      const noTarget  = hookInsts?.[hookOf?.[noC?.targetVar]]  || choiceMap?.[noC?.targetVar]?.length;
      if (!yesTarget && !noTarget) {
        const confirmBlock = {
          type: 'npc_choice',
          fields: { LABEL: stripBrackets(label) },
          inputs: { ACTIONS: { block: {
            type: 'npc_confirm',
            fields: { TEXT: nodeText, MS: nodeMs, YES_LABEL: yesC?.label || 'Yes.', NO_LABEL: noC?.label || 'No.' }
          }}}
        };
        return enrichSerializedBlock(confirmBlock, { nodeText, nodeMs });
      }
    }
    // npc_say_menu: hookless node with sub-choices
    const block = { type: 'npc_choice', fields: { LABEL: stripBrackets(label) } };
    const sayMenuBlock = { type: 'npc_say_menu', fields: { TEXT: nodeText, MS: nodeMs } };
    const chain = buildChoiceChain(subChoices, nodes, hookOf, hookInsts, hookBodies, hookArgDefs, choiceMap, reactionMap, new Set(visited), constVals);
    if (chain) sayMenuBlock.inputs = { CHOICES: { block: chain } };
    block.inputs = { ACTIONS: { block: sayMenuBlock } };
    return enrichSerializedBlock(block, { nodeText, nodeMs });
  }

  return { type: 'npc_choice', fields: { LABEL: stripBrackets(label) } };
}

// ── Map hook body + bound params to a Blockly action block ───────────────────
function buildActionBlock(funcName, body, boundParams, argDefs, constVals, reactions, nodes, targetVar, choiceMap = {}, hookOf = {}, hookInsts = {}, hookBodies = {}, hookArgDefs = {}, reactionMap = {}) {
  // Resolve bound parameter values into named args
  // argDefs = ['x','y','z'] from function signature (if any)
  // boundParams = ['8','9','9','true'] from hook instance
  const namedArgs = {};
  for (let i = 0; i < argDefs.length; i++) {
    namedArgs[argDefs[i]] = boundParams[i] ?? '0';
  }
  // Also parse from body directly for simple cases
  const getCoord = (name, fallback = 0) =>
    namedArgs[name] !== undefined ? parseInt(namedArgs[name]) :
    (boundParams[0] !== undefined && name === 'x' ? parseInt(boundParams[0]) : fallback);

  const xToken = namedArgs['x'] !== undefined ? namedArgs['x'] : (boundParams.length >= 3 ? boundParams[0] : '0');
  const yToken = namedArgs['y'] !== undefined ? namedArgs['y'] : (boundParams.length >= 3 ? boundParams[1] : '0');
  const zToken = namedArgs['z'] !== undefined ? namedArgs['z'] : (boundParams.length >= 3 ? boundParams[2] : '0');
  const x = parseInt(xToken) || 0;
  const y = parseInt(yToken) || 0;
  const z = parseInt(zToken) || 0;

  const firstNum = (s) => { const m = s.match(/-?\d+/); return m ? parseInt(m[0]) : 0; };
  const firstCallArg = (body.match(/\(\s*([A-Za-z_]\w*|-?\d+(?:\.\d+)?)\s*\)/) || [])[1] || '';
  let price = resolveLuaNumeric(firstCallArg, body, constVals);
  // Hire hook body has no price argument; generated function name carries it.
  const hirePriceM = funcName.match(/^hireHookFunc_(\d+)/);
  if (hirePriceM && !firstCallArg) price = Number(hirePriceM[1]);
  const priceVarName = (firstCallArg && constVals && Object.prototype.hasOwnProperty.call(constVals, firstCallArg)) ? firstCallArg : '';
  const reactionMeta = {
    waitText: nodes?.[targetVar]?.text || undefined,
    reactions: (reactions || []).map(r => ({
      code: r.code,
      text: stripBrackets(nodes?.[r.targetVar]?.text || ''),
      targetVar: r.targetVar,
    })),
  };

  // ── Advanced quest offer ──────────────────────────────────────────────────
  const advOfferM = body.match(/local\s+status\s*=\s*_questStatus\(player,\s*"([^"]+)"\)[\s\S]*?status\s*==\s*"complete"\s+then\s+return\s+2\s+end[\s\S]*?status\s*==\s*"active"\s+then\s+return\s+1\s+end[\s\S]*?return\s+0/);
  if (advOfferM) {
    const offerVar    = (reactions || []).find(r => Number(r.code) === 0)?.targetVar;
    const activeVar   = (reactions || []).find(r => Number(r.code) === 1)?.targetVar;
    const completeVar = (reactions || []).find(r => Number(r.code) === 2)?.targetVar;
    const offerChoices = choiceMap?.[offerVar] || [];
    const acceptChoice = offerChoices[0] || {};
    const refuseChoice = offerChoices[1] || {};
    const startVar     = acceptChoice.targetVar;
    const startHook    = startVar ? hookInsts?.[hookOf?.[startVar]] : null;
    const startBody    = startHook ? hookBodies?.[startHook.funcName] || '' : '';
    const stepM        = startBody.match(/_questSet\(player,\s*"[^"]+",\s*"active",\s*(-?\d+(?:\.\d+)?)\)/);
    const acceptedVar  = (reactionMap?.[startVar] || []).find(r => Number(r.code) === 0)?.targetVar;
    const block = {
      type: 'npc_quest_offer_advanced',
      fields: {
        QUEST_ID: advOfferM[1],
        OFFER_TEXT: nodeText(offerVar, nodes, 'Will you take this mission?'),
        ACCEPT_LABEL: acceptChoice.label || 'Yes, I will do it!',
        REFUSE_LABEL: refuseChoice.label || 'Not now.',
        STEP: stepM ? Number(stepM[1]) : 1,
      }
    };
    attachStatementInput(block, 'ACCEPTED', textNodeAsSay(acceptedVar, nodes, 'Quest started. Good luck!'));
    attachStatementInput(block, 'REFUSED', textNodeAsSay(refuseChoice.targetVar, nodes, 'Come back if you change your mind.'));
    attachStatementInput(block, 'ALREADY_ACTIVE', textNodeAsSay(activeVar, nodes, 'You already have this quest active.'));
    attachStatementInput(block, 'ALREADY_COMPLETE', textNodeAsSay(completeVar, nodes, 'You have already completed this quest.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Quest reward ──────────────────────────────────────────────────────────
  if (/^questRewardHook_/.test(funcName)) {
    const credsM = body.match(/getCredits\(\)\s*\+\s*(-?\d+(?:\.\d+)?)/);
    const itemM  = body.match(/giveType\s*\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
    const repM   = body.match(/_repAdd\(player,\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\)/);
    const flagM  = body.match(/_flagSet\(player,\s*"([^"]+)",\s*(true|false)\)/);
    return enrichSerializedBlock({
      type: 'npc_quest_reward',
      fields: {
        SUCCESS: reactionText(reactionMeta, 0, 'Reward received!'),
        CREDITS: credsM ? Number(credsM[1]) : 0,
        ITEM: itemM ? Number(itemM[1]) : 0,
        COUNT: itemM ? Number(itemM[2]) : 0,
        NPC_ID: repM ? repM[1] : '',
        REP_DELTA: repM ? Number(repM[2]) : 0,
        FLAG_NAME: flagM ? flagM[1] : '',
        FLAG_VALUE: flagM ? flagM[2] : 'true',
      }
    }, reactionMeta);
  }

  // ── Quest requirements ────────────────────────────────────────────────────
  let questReqM = body.match(/_questStatus\(player,\s*"([^"]+)"\)\s*==\s*"([^"]+)"[\s\S]*?return\s+0[\s\S]*?return\s+-1/);
  if (questReqM) {
    const block = { type: 'npc_quest_require_status', fields: { QUEST_ID: questReqM[1], STATUS: questReqM[2] } };
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions || []).find(r => Number(r.code) === 0)?.targetVar, nodes, 'Done.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions || []).find(r => Number(r.code) === -1)?.targetVar, nodes, 'Condition not met.'));
    return enrichSerializedBlock(block, reactionMeta);
  }
  questReqM = body.match(/_questStep\(player,\s*"([^"]+)"\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)[\s\S]*?return\s+0[\s\S]*?return\s+-1/);
  if (questReqM) {
    const block = { type: 'npc_quest_require_step', fields: { QUEST_ID: questReqM[1], OP: questReqM[2], STEP: Number(questReqM[3]) } };
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions || []).find(r => Number(r.code) === 0)?.targetVar, nodes, 'Done.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions || []).find(r => Number(r.code) === -1)?.targetVar, nodes, 'Condition not met.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Crew ──────────────────────────────────────────────────────────────────
  // Test unhire before hire — unhireConverationPartner contains "hire" as substring
  if (/unhireConverationPartner/.test(body) || funcName.includes('unhireHook'))
    return enrichSerializedBlock({ type: 'npc_unhire', fields: { SUCCESS: reactionText(reactionMeta, 0, 'Yes, commander!') } }, reactionMeta);
  if (/hireConverationPartner/.test(body) || funcName.includes('hireHook'))
    return attachVarRefInput(
      enrichSerializedBlock({ type: 'npc_hire', fields: { PRICE: price, SUCCESS: reactionText(reactionMeta, 0, "I'm honoured to work with you, commander!") } }, reactionMeta),
      'PRICE_VAR',
      priceVarName
    );
  if (/spawnCrew/.test(body))
    return attachVarRefInput(
      enrichSerializedBlock({ type: 'npc_spawn_crew', fields: { PRICE: price } }, reactionMeta),
      'PRICE_VAR',
      priceVarName
    );

  // ── Items (order: longest method name first) ──────────────────────────────
  const itemMap = [
    ['giveTransporterMarkerBeam', 'transporter'],
    ['givePowerSupplyBeam',       'power'],
    ['giveRocketLauncher',        'rocket'],
    ['giveSniperRifle',           'sniper'],
    ['giveLaserWeapon',           'laser'],
    ['giveHealingBeam',           'healing'],
    ['giveMarkerBeam',            'marker'],
    ['giveGrappleBeam',           'grapple'],
    ['giveTorchBeam',             'torch'],
    ['giveBuildProhibiter',       'prohibiter'],
    ['giveFlashLight',            'flashlight'],
    ['giveHelmet',                'helmet'],
  ];
  for (const [fn, item] of itemMap) {
    if (body.includes(fn) || funcName.toLowerCase().includes(item)) {
      // Price from bound params or body
      const p = boundParams.length ? (parseInt(boundParams[0]) || resolveLuaNumeric(boundParams[0], body, constVals)) : price;
      return attachVarRefInput(
        enrichSerializedBlock({ type: 'npc_sell_item', fields: { ITEM: item, PRICE: p } }, reactionMeta),
        'PRICE_VAR',
        priceVarName || ((boundParams[0] && constVals && Object.prototype.hasOwnProperty.call(constVals, boundParams[0])) ? boundParams[0] : '')
      );
    }
  }

  // ── Give type (must be AFTER stock_sell which also uses giveType) ─────────
  if ((/giveType/.test(body) || funcName.includes('giveType')) && !body.includes('_stockTake')) {
    const typeId = boundParams[0] !== undefined ? parseInt(boundParams[0])
                 : (body.match(/giveType\s*\((\d+)/) ? parseInt(body.match(/giveType\s*\((\d+)/)[1]) : 0);
    const count  = boundParams[1] !== undefined ? parseInt(boundParams[1])
                 : (body.match(/giveType\s*\(\d+\s*,\s*(\d+)/) ? parseInt(body.match(/giveType\s*\(\d+\s*,\s*(\d+)/)[1]) : 1);
    return enrichSerializedBlock({ type: 'npc_give_type', fields: { TYPE_ID: typeId, COUNT: count, FREE: 'TRUE' } }, reactionMeta);
  }

  // ── World actions ─────────────────────────────────────────────────────────
  if (/activateBlockSwitch/.test(body) || funcName.includes('Switch')) {
    let block = { type: 'npc_activate_block', fields: { X: x, Y: y, Z: z, STATE: 'toggle' } };
    block = attachVarRefInput(block, 'X_VAR', constVals?.[xToken] !== undefined ? xToken : '');
    block = attachVarRefInput(block, 'Y_VAR', constVals?.[yToken] !== undefined ? yToken : '');
    block = attachVarRefInput(block, 'Z_VAR', constVals?.[zToken] !== undefined ? zToken : '');
    return block;
  }
  if (/activateBlock/.test(body) || funcName.includes('activateBlock')) {
    const stateVal = boundParams[3] || 'true';
    const state = stateVal === 'false' ? 'false' : 'true';
    let block = { type: 'npc_activate_block', fields: { X: x, Y: y, Z: z, STATE: state } };
    block = attachVarRefInput(block, 'X_VAR', constVals?.[xToken] !== undefined ? xToken : '');
    block = attachVarRefInput(block, 'Y_VAR', constVals?.[yToken] !== undefined ? yToken : '');
    block = attachVarRefInput(block, 'Z_VAR', constVals?.[zToken] !== undefined ? zToken : '');
    return block;
  }
  if (/moveTo/.test(body) || funcName.includes('moveTo')) {
    let block = { type: 'npc_move_to', fields: { X: x, Y: y, Z: z } };
    block = attachVarRefInput(block, 'X_VAR', constVals?.[xToken] !== undefined ? xToken : '');
    block = attachVarRefInput(block, 'Y_VAR', constVals?.[yToken] !== undefined ? yToken : '');
    block = attachVarRefInput(block, 'Z_VAR', constVals?.[zToken] !== undefined ? zToken : '');
    return block;
  }

  // ── Tutorial call ─────────────────────────────────────────────────────────
  if (/callTutorial/.test(body) || funcName.includes('Tutorial')) {
    const tutName = (boundParams[0] || '').replace(/"/g, '') ||
                    (body.match(/"([^"]+)"/) ? body.match(/"([^"]+)"/)[1] : 'tutorial');
    return enrichSerializedBlock({
      type: 'npc_call_tutorial',
      fields: { NAME: tutName }
    }, reactionMeta);
  }

  // ── destroyShip ──────────────────────────────────────────────────────────
  if (/destroyShip/.test(body) || funcName.toLowerCase().includes('destroyship') || funcName.toLowerCase().includes('destroyship')) {
    const uid = (boundParams[0] || '').replace(/"/g,'') ||
                (body.match(/"([^"]+)"/) ? body.match(/"([^"]+)"/)[1] : 'ENTITY_SHIP_target');
    return enrichSerializedBlock({
      type: 'npc_destroy_ship',
      fields: { UID: uid }
    }, reactionMeta);
  }

  // ── giveGravity ───────────────────────────────────────────────────────────
  if (/giveGravity/.test(body) || funcName.includes('Gravity') || funcName.includes('Grav')) {
    const gravVal = boundParams[0] === 'false' ? 'false' : 'true';
    return enrichSerializedBlock({
      type: 'npc_give_gravity',
      fields: { STATE: gravVal }
    }, reactionMeta);
  }

  // ── SQLite / memory / quest actions ──────────────────────────────────────
  // Import: nouveau format HSQLDB (_questSet)
  let m2 = body.match(/_questSet\(player,\s*"([^"]+)",\s*"active",\s*(\d+)\)/);
  if (m2) {
    if (/Quest updated|Updating quest/.test(reactionMeta.waitText || '')) {
      return { type: 'npc_quest_set_step', fields: { QUEST_ID: m2[1], STEP: Number(m2[2]), SUCCESS: reactionText(reactionMeta, 0, 'Quest updated.') } };
    }
    return { type: 'npc_quest_start', fields: { QUEST_ID: m2[1], STEP: Number(m2[2]), SUCCESS: reactionText(reactionMeta, 0, 'Quest started.') } };
  }
  m2 = body.match(/_questSet\(player,\s*"([^"]+)",\s*"complete"/);
  if (m2) {
    const creds = (body.match(/getCredits\(\)\s*\+\s*(\d+)/) || [])[1] || 0;
    const item  = (body.match(/giveType\((\d+),/) || [])[1] || 0;
    const cnt   = (body.match(/giveType\(\d+,\s*(\d+)\)/) || [])[1] || 0;
    return { type: 'npc_quest_complete', fields: { QUEST_ID: m2[1], SUCCESS: reactionText(reactionMeta, 0, 'Quest complete!'), REWARD_CREDITS: Number(creds), REWARD_ITEM: Number(item), REWARD_COUNT: Number(cnt) } };
  }
  m2 = body.match(/_questSet\(player,\s*"([^"]+)",\s*"failed"/);
  if (m2) {
    return { type: 'npc_quest_fail', fields: { QUEST_ID: m2[1], SUCCESS: reactionText(reactionMeta, 0, 'Quest failed.') } };
  }
  // Import: ancien format _memSet (rétro-compat)
  m2 = body.match(/_memSet\(player,\s*"quest:([^":]+):status",\s*"active"\)[\s\S]*?_memSet\(player,\s*"quest:\1:step",\s*(-?\d+(?:\.\d+)?)\)/);
  if (m2) {
    if (/Quest updated|Updating quest/.test(reactionMeta.waitText || '')) {
      return { type: 'npc_quest_set_step', fields: { QUEST_ID: m2[1], STEP: Number(m2[2]), SUCCESS: reactionText(reactionMeta, 0, 'Quest updated.') } };
    }
    return { type: 'npc_quest_start', fields: { QUEST_ID: m2[1], STEP: Number(m2[2]), SUCCESS: reactionText(reactionMeta, 0, 'Quest started.') } };
  }
  m2 = body.match(/_memSet\(player,\s*"quest:([^":]+):status",\s*"complete"\)/);
  if (m2) {
    return { type: 'npc_quest_complete', fields: { QUEST_ID: m2[1], SUCCESS: reactionText(reactionMeta, 0, 'Quest complete!'), REWARD_CREDITS: 0, REWARD_ITEM: 0, REWARD_COUNT: 0 } };
  }
  m2 = body.match(/_memSet\(player,\s*"quest:([^":]+):status",\s*"failed"\)/);
  if (m2) {
    return { type: 'npc_quest_fail', fields: { QUEST_ID: m2[1], SUCCESS: reactionText(reactionMeta, 0, 'Quest failed.') } };
  }
  m2 = body.match(/_memSet\(player,\s*"([^"]+)",\s*(.+)\)/);
  if (m2) {
    let mode = 'raw', value = m2[2].trim();
    if (/^".*"$/.test(value)) { mode = 'text'; value = value.slice(1, -1).replace(/\\"/g, '"'); }
    else if (/^-?\d+(?:\.\d+)?$/.test(value)) { mode = 'number'; }
    return enrichSerializedBlock({ type: 'npc_memory_set', fields: { KEY: m2[1], MODE: mode, VALUE: value } }, reactionMeta);
  }
  m2 = body.match(/_memIncrement\(player,\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\)/);
  if (m2) {
    return enrichSerializedBlock({ type: 'npc_memory_increment', fields: { KEY: m2[1], AMOUNT: Number(m2[2]) } }, reactionMeta);
  }

  // ── Conditions ────────────────────────────────────────────────────────────
  const ifExprM = body.match(/--\s*NPCC_IF_CONDITION[\s\S]*?local\s+_cond\s*=\s*([\s\S]*?)\n\s*if\s+_cond\s+then\s+return\s+0\s+end/);
  if (ifExprM) {
    return enrichSerializedBlock({
      type: 'npc_if_condition',
      fields: { SUCCESS: reactionText(reactionMeta, 0, 'Condition met.'), FAIL: reactionText(reactionMeta, -1, 'Condition failed.') },
      inputs: { COND: { block: buildConditionBlockFromExpression(ifExprM[1].trim()) } }
    }, reactionMeta);
  }

  const waitExprM = body.match(/--\s*NPCC_WAIT_UNTIL[\s\S]*?local\s+_cond\s*=\s*([\s\S]*?)\n\s*if\s+_cond\s+then\s+return\s+0\s+end/);
  if (waitExprM) {
    return enrichSerializedBlock({
      type: 'npc_wait_until',
      fields: { WAIT: reactionMeta.waitText || 'Waiting...', SUCCESS: reactionText(reactionMeta, 0, 'Done!') },
      inputs: { COND: { block: buildConditionBlockFromExpression(waitExprM[1].trim()) } }
    }, reactionMeta);
  }

  const creditM = body.match(/local\s+credits\s*=\s*ps:getCredits\(\)[\s\S]*?if\s+credits\s*>=\s*(-?\d+(?:\.\d+)?)\s+then\s+return\s+0\s+end/);
  if (creditM) {
    return {
      type: 'npc_check_credits',
      fields: { AMOUNT: Number(creditM[1]), SUCCESS: 'You have enough credits!', FAIL: "You don't have enough credits." }
    };
  }

  const valueM = body.match(/local\s+val\s*=\s*(ps:(getCredits|getHealth|getMaxHealth|getFactionId|getCurrentSectorId)\(\))[\s\S]*?if\s+val\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)\s+then\s+return\s+0\s+end/);
  if (valueM) {
    const methodToType = {
      getCredits: 'credits',
      getHealth: 'health',
      getMaxHealth: 'maxHealth',
      getFactionId: 'factionId',
      getCurrentSectorId: 'sectorId',
    };
    return {
      type: 'npc_check_player_value',
      fields: {
        VALUE_TYPE: methodToType[valueM[2]] || 'credits',
        OP: valueM[3],
        VALUE: Number(valueM[4]),
        SUCCESS: 'Condition met.',
        FAIL: 'Condition failed.',
      }
    };
  }

  const flagM = body.match(/local\s+ok\s*=\s*(.+?)\s*\n\s*if\s+ok\s*==\s*(true|false)\s+then\s+return\s+0\s+end/);
  if (flagM) {
    let flag = null;
    if (/isCreativeModeEnabled/.test(flagM[1])) flag = 'creative';
    if (/isConverationPartnerInTeam/.test(flagM[1])) flag = 'inTeam';
    if (flag) {
      return {
        type: 'npc_check_flag',
        fields: {
          FLAG: flag,
          EXPECT: flagM[2],
          SUCCESS: 'Yes.',
          FAIL: 'No.',
        }
      };
    }
  }

  const atBlockM = body.match(/dialogObject:isAtBlock\(\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\)/);
  if (atBlockM && /return\s+-1/.test(body)) {
    return {
      type: 'npc_is_at_block',
      fields: {
        X: parseInt(atBlockM[1]),
        Y: parseInt(atBlockM[2]),
        Z: parseInt(atBlockM[3]),
        SUCCESS: 'You are in position!',
        FAIL: 'You need to go to the marker.',
      }
    };
  }

  const customCondM = body.match(/^if\s*\((.+)\)\s*then\s*return\s+0\s+end\s*\n\s*return\s+-1\s*$/s);
  if (customCondM && !/^(?:checkValueHook_|checkFlagHook_|ifConditionHook_|checkCreditsHook_|isAtBlockHook_)/.test(funcName)) {
    return {
      type: 'npc_check_custom_condition',
      fields: {
        EXPR: customCondM[1].trim(),
        SUCCESS: 'Condition met.',
        FAIL: 'Condition failed.',
      }
    };
  }

  // ── Reputation ─────────────────────────────────────────────────────────────
  // Reputation reset must be tested before repSet to avoid false match on _repSet(..., 0)
  if (/repResetHook_/.test(funcName)) {
    const npcM = body.match(/_repSet\(player,\s*"([^"]+)"/);
    if (npcM) return enrichSerializedBlock({ type: 'npc_rep_reset', fields: { NPC_ID: npcM[1], SUCCESS: reactionText(reactionMeta, 0, 'Reputation reset.') } }, reactionMeta);
  }
  const repAddM = body.match(/_repAdd\(player,\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\)/);
  if (repAddM) {
    return enrichSerializedBlock({ type: 'npc_rep_add', fields: { NPC_ID: repAddM[1], DELTA: Number(repAddM[2]) } }, reactionMeta);
  }
  const repSetM = body.match(/_repSet\(player,\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\)/);
  if (repSetM) {
    return enrichSerializedBlock({ type: 'npc_rep_set', fields: { NPC_ID: repSetM[1], VALUE: Number(repSetM[2]) } }, reactionMeta);
  }
  if (/_repSet\(player,.*,\s*0\)/.test(body)) {
    const npcM = body.match(/_repSet\(player,\s*"([^"]+)"/);
    if (npcM) return enrichSerializedBlock({ type: 'npc_rep_reset', fields: { NPC_ID: npcM[1], SUCCESS: reactionText(reactionMeta, 0, 'Reputation reset.') } }, reactionMeta);
  }
  const repGetM = body.match(/_repGet\(player,\s*"([^"]+)"/);
  if (repGetM && (/repGetHook_|getRepHook_/).test(funcName)) {
    const text = nodes?.[targetVar]?.text || 'Your reputation: %s';
    return enrichSerializedBlock({ type: 'npc_get_rep', fields: { NPC_ID: repGetM[1], TEXT: text.replace('(live)', '%s') } }, reactionMeta);
  }
  const checkRepM = body.match(/_repGet\(player,\s*"([^"]+)"\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)[\s\S]*?return\s+0[\s\S]*?return\s+-1/);
  if (checkRepM) {
    return enrichSerializedBlock({ type: 'npc_check_rep', fields: { NPC_ID: checkRepM[1], OP: checkRepM[2], VALUE: Number(checkRepM[3]), SUCCESS: reactionText(reactionMeta, 0, 'Reputation ok.'), FAIL: reactionText(reactionMeta, -1, 'Not enough reputation.') } }, reactionMeta);
  }

  // ── Cooldowns ─────────────────────────────────────────────────────────────
  const coolSetM = body.match(/_cooldownSet\(player,\s*"([^"]+)",\s*(-?\d+(?:\.\d+)?)\)/);
  if (coolSetM) {
    const durSec = Math.round(Number(coolSetM[2]) / 1000);
    return enrichSerializedBlock({ type: 'npc_cooldown_set', fields: { ACTION_ID: coolSetM[1], DURATION_SEC: durSec } }, reactionMeta);
  }
  const coolClearM = body.match(/DELETE FROM npc_cooldowns WHERE player=\?.*action_id=\?.*?\)/);
  if (coolClearM || /cooldownClearHook_/.test(funcName)) {
    const idM = body.match(/_dbExec.*action_id=\?".*?,\s*player,\s*"([^"]+)"/);
    const actionId = idM ? idM[1] : (funcName.replace('cooldownClearHook_', '') || 'action');
    return enrichSerializedBlock({ type: 'npc_cooldown_clear', fields: { ACTION_ID: actionId, SUCCESS: reactionText(reactionMeta, 0, 'Cooldown cleared.') } }, reactionMeta);
  }
  const coolRemM = body.match(/_cooldownRemaining\(player,\s*"([^"]+)"/);
  if (coolRemM) {
    const text = nodes?.[targetVar]?.text || 'Come back in %s seconds.';
    return enrichSerializedBlock({ type: 'npc_get_cooldown_remaining', fields: { ACTION_ID: coolRemM[1], TEXT: text.replace('...', '%s') } }, reactionMeta);
  }
  const checkCoolM = body.match(/(_cooldownActive)\(player,\s*"([^"]+)"\)[\s\S]*?return\s+0[\s\S]*?return\s+-1/);
  if (checkCoolM) {
    const expired = /not _cooldownActive/.test(body);
    const idM2 = body.match(/_cooldownActive\(player,\s*"([^"]+)"\)/);
    return enrichSerializedBlock({ type: 'npc_check_cooldown', fields: { ACTION_ID: idM2 ? idM2[1] : '', STATE: expired ? 'expired' : 'active', SUCCESS: reactionText(reactionMeta, 0, 'Available.'), FAIL: reactionText(reactionMeta, -1, 'On cooldown.') } }, reactionMeta);
  }

  // ── Stock ─────────────────────────────────────────────────────────────────
  const stockInitM = body.match(/_stockInit\([^,]+,\s*(-?\d+),\s*(-?\d+)\)/);
  if (stockInitM && /stockInitHook_/.test(funcName)) {
    const shopM = body.match(/_stockInit\("([^"]+)"/);
    return enrichSerializedBlock({ type: 'npc_stock_init', fields: { SHOP_ID: shopM ? shopM[1] : '', ITEM_TYPE: Number(stockInitM[1]), QTY: Number(stockInitM[2]) } }, reactionMeta);
  }
  const stockSellM = body.match(/_stockTake\([^,]+,\s*(-?\d+),\s*(-?\d+)\)/);
  if (stockSellM && /stockSellHook_/.test(funcName)) {
    const shopM = body.match(/_stockTake\("([^"]+)"/);
    const priceM = body.match(/getCredits\(\)\s*<\s*(-?\d+)/);
    return enrichSerializedBlock({ type: 'npc_stock_sell', fields: { SHOP_ID: shopM ? shopM[1] : '', ITEM_TYPE: Number(stockSellM[1]), COUNT: Number(stockSellM[2]), PRICE: priceM ? Number(priceM[1]) : 0 } }, reactionMeta);
  }
  const stockAddM = body.match(/_stockAdd\([^,]+,\s*(-?\d+),\s*(-?\d+)\)/);
  if (stockAddM) {
    const shopM = body.match(/_stockAdd\("([^"]+)"/);
    return enrichSerializedBlock({ type: 'npc_stock_add', fields: { SHOP_ID: shopM ? shopM[1] : '', ITEM_TYPE: Number(stockAddM[1]), QTY: Number(stockAddM[2]), SUCCESS: reactionText(reactionMeta, 0, 'Stock restocked.') } }, reactionMeta);
  }
  const stockResetM = body.match(/UPDATE npc_shop_stock SET quantity=\?[\s\S]*?stockResetHook_|INSERT INTO npc_shop_stock[\s\S]*?stockResetHook_/);
  if (stockResetM || /stockResetHook_/.test(funcName)) {
    const shopM = body.match(/"([^"]+)",\s*(-?\d+)/);
    const qtyM  = body.match(/quantity=\?(\s*,\s*(-?\d+))?/);
    const qty2M = body.match(/VALUES\(\?\s*,\s*\?\s*,\s*(-?\d+)/);
    return enrichSerializedBlock({ type: 'npc_stock_reset', fields: { SHOP_ID: shopM ? shopM[1] : '', ITEM_TYPE: shopM ? Number(shopM[2]) : 0, QTY: qty2M ? Number(qty2M[1]) : 0, SUCCESS: reactionText(reactionMeta, 0, 'Stock reset.') } }, reactionMeta);
  }
  const checkStockM = body.match(/_stockGet\([^,]+,\s*(-?\d+)\)\s*(>=|<=|==|~=|>|<)\s*(-?\d+)[\s\S]*?return\s+0/);
  if (checkStockM) {
    const shopM = body.match(/_stockGet\("([^"]+)"/);
    return enrichSerializedBlock({ type: 'npc_check_stock', fields: { SHOP_ID: shopM ? shopM[1] : '', ITEM_TYPE: Number(checkStockM[1]), OP: checkStockM[2], VALUE: Number(checkStockM[3]), SUCCESS: reactionText(reactionMeta, 0, 'In stock.'), FAIL: reactionText(reactionMeta, -1, 'Out of stock.') } }, reactionMeta);
  }
  const getStockM = body.match(/_stockGet\("([^"]+)",\s*(-?\d+)/);
  if (getStockM && /getStockHook_/.test(funcName)) {
    const text = nodes?.[targetVar]?.text || 'Available stock: %s';
    return enrichSerializedBlock({ type: 'npc_get_stock', fields: { SHOP_ID: getStockM[1], ITEM_TYPE: Number(getStockM[2]), TEXT: text.replace('...', '%s') } }, reactionMeta);
  }

  // ── Flags & World state ───────────────────────────────────────────────────
  const flagSetM2 = body.match(/_flagSet\(player,\s*"([^"]+)",\s*(true|false)\)/);
  if (flagSetM2) {
    return enrichSerializedBlock({ type: 'npc_flag_set', fields: { FLAG_NAME: flagSetM2[1], VALUE: flagSetM2[2], SUCCESS: reactionText(reactionMeta, 0, 'Flag updated.') } }, reactionMeta);
  }
  const checkFlagDbM = body.match(/_flagGet\(player,\s*"([^"]+)"\)\s*==\s*(true|false)[\s\S]*?return\s+0[\s\S]*?return\s+-1/);
  if (checkFlagDbM) {
    return enrichSerializedBlock({ type: 'npc_check_flag_db', fields: { FLAG_NAME: checkFlagDbM[1], VALUE: checkFlagDbM[2], SUCCESS: reactionText(reactionMeta, 0, 'Flag matches.'), FAIL: reactionText(reactionMeta, -1, 'Flag does not match.') } }, reactionMeta);
  }
  const worldSetM = body.match(/_worldSet\("([^"]+)",\s*"([^"]+)"\)/);
  if (worldSetM) {
    return enrichSerializedBlock({ type: 'npc_world_set', fields: { KEY: worldSetM[1], VALUE: worldSetM[2], SUCCESS: reactionText(reactionMeta, 0, 'World state updated.') } }, reactionMeta);
  }
  const worldGetM = body.match(/_worldGet\("([^"]+)",\s*"([^"]*)"\)/);
  if (worldGetM && /^getWorldHook_/.test(funcName)) {
    const text = nodes?.[targetVar]?.text || 'Current event: %s';
    return enrichSerializedBlock({ type: 'npc_get_world', fields: { KEY: worldGetM[1], DEFAULT: worldGetM[2], TEXT: text.replace('...', '%s') } }, reactionMeta);
  }
  const checkWorldM = body.match(/_world(?:Get|GetNumber)\("([^"]+)"[^)]*\)\s*(>=|<=|==|~=|>|<|== )\s*(["\d][^\s;]*)/);
  if (checkWorldM) {
    const isNum = body.includes('_worldGetNumber');
    const rawVal = checkWorldM[3].replace(/"/g, '');
    const op = checkWorldM[2].trim();
    return enrichSerializedBlock({ type: 'npc_check_world', fields: { KEY: checkWorldM[1], OP: op + (isNum ? 'num' : 'text'), VALUE: rawVal, SUCCESS: reactionText(reactionMeta, 0, 'Matches.'), FAIL: reactionText(reactionMeta, -1, 'Does not match.') } }, reactionMeta);
  }

  // ── Give credits ──────────────────────────────────────────────────────────
  const giveCredsM = body.match(/setCredits\((?:dialogObject:getEntity\(\):getCredits\(\)|ps:getCredits\(\))\s*\+\s*(-?\d+(?:\.\d+)?)\)/);
  if (giveCredsM && !body.includes('giveType') && !body.includes('_repAdd') && !body.includes('_flagSet') && !body.includes('_stockTake')) {
    return enrichSerializedBlock({ type: 'npc_give_credits', fields: { AMOUNT: Number(giveCredsM[1]) } }, reactionMeta);
  }

  // ── Take item (take credits check) ────────────────────────────────────────
  const takeItemM = body.match(/giveType\((-?\d+),\s*(-?\d+)\)/);
  const takeCredM = body.match(/setCredits\(.*-\s*(-?\d+)\)/);
  if (takeCredM && !body.includes('_stockTake') && !body.includes('_repAdd')) {
    const iM = body.match(/giveType\((-?\d+),\s*(-?\d+)\)/);
    if (iM) return enrichSerializedBlock({ type: 'npc_take_item', fields: { ITEM_TYPE: Number(iM[1]), COUNT: Number(iM[2]), PRICE: Number(takeCredM[1]), SUCCESS: reactionText(reactionMeta, 0, 'Thank you!'), FAIL: reactionText(reactionMeta, -1, "You don't have enough credits.") } }, reactionMeta);
  }

  // ── Conversation state ────────────────────────────────────────────────────
  const convStateM = body.match(/setConversationState\(([^)]+)\)/);
  if (convStateM) {
    const rawState = convStateM[1].trim().replace(/"/g, '');
    return enrichSerializedBlock({ type: 'npc_set_conv_state', fields: { STATE: rawState } }, reactionMeta);
  }

  // ── Auto Say (sayAutoHook_) — npc_say in sequence ─────────────────────────
  if (/^sayAutoHook_/.test(funcName) && body.trim() === 'return 0') {
    const text = nodes?.[targetVar]?.text || '...';
    const ms   = nodes?.[targetVar]?.ms   || 2000;
    return { type: 'npc_say', fields: { TEXT: text, MS: ms } };
  }

  // ── Wait until (waitUntilHook_) — npc_wait_until ─────────────────────────────
  if (/^waitUntilHook_/.test(funcName)) {
    const thenVar = (reactions || []).find(r => Number(r.code) === 0)?.targetVar;
    return enrichSerializedBlock({
      type: 'npc_wait_until',
      fields: { WAIT: nodes?.[targetVar]?.text || 'Please wait...' }
    }, reactionMeta);
  }

  // ── Check player value (checkValueHook_) — npc_check_player_value ───────────
  if (/^checkValueHook_/.test(funcName)) {
    const methodToType = { credits:'credits', health:'health', maxHealth:'maxHealth', factionId:'factionId', sectorId:'sectorId' };
    const parts = funcName.replace('checkValueHook_','').split('_').filter(Boolean);
    const typeKey = parts[0] || 'credits';
    const op      = (parts[1]||'').replace('__','>=').replace('_','>=') || '>=';
    const val     = parts.slice(2).join('_') || '0';
    const opMatch = body.match(/(>=|<=|==|~=|>|<)/);
    const valMatch = body.match(/val\s*(?:>=|<=|==|~=|>|<)\s*(-?\d+(?:\.\d+)?)/);
    const block = { type: 'npc_check_player_value', fields: {
      VALUE_TYPE: methodToType[typeKey] || 'credits',
      OP: opMatch ? opMatch[1] : '>=',
      VALUE: valMatch ? Number(valMatch[1]) : 0,
    }};
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===0)?.targetVar, nodes, 'Condition met.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-1)?.targetVar, nodes, 'Condition failed.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Check flag (checkFlagHook_) — npc_check_flag ─────────────────────────────
  if (/^checkFlagHook_/.test(funcName)) {
    const isCreative = body.includes('isCreativeModeEnabled');
    const isTeam     = body.includes('isConverationPartnerInTeam');
    const flag       = isCreative ? 'creative' : isTeam ? 'inTeam' : 'creative';
    const expectM    = body.match(/==\s*(true|false)/);
    const expect     = expectM ? expectM[1] : 'true';
    const block = { type: 'npc_check_flag', fields: { FLAG: flag, EXPECT: expect } };
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===0)?.targetVar, nodes, 'Yes.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-1)?.targetVar, nodes, 'No.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── If condition (ifConditionHook_) — npc_if_condition ───────────────────────
  if (/^ifConditionHook_/.test(funcName)) {
    const condExprM = body.match(/if\s+(.+)\s+then\s+return\s+0/);
    const block = { type: 'npc_if_condition', fields: {} };
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===0)?.targetVar, nodes, 'Condition met.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-1)?.targetVar, nodes, 'Condition failed.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Check credits (checkCreditsHook_) — npc_check_credits ────────────────────
  if (/^checkCreditsHook_/.test(funcName)) {
    const amtM = body.match(/getCredits\(\)\s*>=\s*(-?\d+(?:\.\d+)?)/);
    const block = { type: 'npc_check_credits', fields: { AMOUNT: amtM ? Number(amtM[1]) : 0 } };
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===0)?.targetVar, nodes, 'Enough credits.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-1)?.targetVar, nodes, 'Not enough.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Auto say (sayAutoHook_) — npc_say in sequence ──────────────────────────
  if (/^sayAutoHook_/.test(funcName) && body.trim() === 'return 0') {
    const text = nodes?.[targetVar]?.text || '...';
    const ms   = nodes?.[targetVar]?.ms   || 2000;
    return { type: 'npc_say', fields: { TEXT: text, MS: ms } };
  }

  // ── Say value (sayValueHook_) — npc_say_value ────────────────────────────────
  if (/^sayValueHook_/.test(funcName)) {
    const typeMap = { credits:'credits', health:'health', maxHealth:'maxHealth', factionId:'factionId', sectorId:'sectorId', convState:'convState' };
    const typeKey = funcName.replace(/^sayValueHook_([^_]+)_.+$/,'$1');
    const text    = nodes?.[targetVar]?.text?.replace('(live)', '%s') || '%s';
    const ms      = nodes?.[targetVar]?.ms || 2000;
    return enrichSerializedBlock({ type: 'npc_say_value', fields: { VALUE_TYPE: typeMap[typeKey] || 'credits', TEXT: text, MS: ms } }, reactionMeta);
  }

  // ── Get info (getInfoHook_) — npc_get_info ───────────────────────────────────
  if (/^getInfoHook_/.test(funcName)) {
    const typeKey = funcName.replace(/^getInfoHook_([^_]+)_.+$/,'$1');
    const text    = nodes?.[targetVar]?.text?.replace('...', '%s') || '%s';
    return enrichSerializedBlock({ type: 'npc_get_info', fields: { INFO_TYPE: typeKey, TEXT: text } }, reactionMeta);
  }

  // ── Give meta item ────────────────────────────────────────────────────────────
  if (/giveMetaItem/.test(body) || /^giveMetaItemHook_/.test(funcName)) {
    const metaM = body.match(/giveMetaItem\(([^,]+),\s*(-?\d+),\s*(-?\d+(?:\.\d+)?)\)/);
    const meta  = metaM ? metaM[1].replace(/"/g,'').trim() : '';
    const sub   = metaM ? Number(metaM[2]) : 0;
    const cost  = metaM ? Number(metaM[3]) : 0;
    const block = { type: 'npc_give_meta_item', fields: { META_TYPE: meta, SUB_TYPE: sub, COST: cost } };
    attachStatementInput(block, 'GIVEN',      textNodeAsSay((reactions||[]).find(r=>Number(r.code)===0)?.targetVar,  nodes, "Here you go!"));
    attachStatementInput(block, 'NO_CREDITS', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-1)?.targetVar, nodes, "You don't have enough money!"));
    attachStatementInput(block, 'INV_FULL',   textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-2)?.targetVar, nodes, 'Your inventory is full!'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Send message ──────────────────────────────────────────────────────────────
  if (/sendServerMessage/.test(body) || /^sendMsgHook_/.test(funcName)) {
    const typeCodeM = body.match(/dialogObject:format\([^)]+\),\s*(\d+),/);
    const typeCode  = typeCodeM ? typeCodeM[1] : '0';
    const typeMap   = {'0':'info','1':'warn','2':'error'};
    const textM     = body.match(/dialogObject:format\("((?:[^"\\]|\\.)*)"/); 
    const text      = textM ? textM[1] : 'Message';
    return enrichSerializedBlock({ type: 'npc_send_message', fields: { TYPE: typeMap[typeCode]||'info', TEXT: text } }, reactionMeta);
  }

  // ── Check inventory ───────────────────────────────────────────────────────────
  if (/checkInvHook_/.test(funcName) || /inv:getActiveSlotsMax/.test(body)) {
    const itemM  = body.match(/getType\(i\)\s*==\s*(-?\d+)/);
    const countM = body.match(/total\s*>=\s*(-?\d+)/);
    const block  = { type: 'npc_check_inventory', fields: { ITEM_TYPE: itemM ? Number(itemM[1]) : 0, COUNT: countM ? Number(countM[1]) : 1 } };
    attachStatementInput(block, 'THEN', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===0)?.targetVar,  nodes, 'You have the items.'));
    attachStatementInput(block, 'ELSE', textNodeAsSay((reactions||[]).find(r=>Number(r.code)===-1)?.targetVar, nodes, 'Not enough items.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── Auto sequence (sequenceHook_) ─────────────────────────────────────────────
  if (/^sequenceHook_/.test(funcName)) {
    const name = funcName.replace(/^sequenceHook_/, '');
    const bodyLine = body.replace(/\n/g, '; ').trim();
    return enrichSerializedBlock({ type: 'npc_auto_sequence', fields: { NAME: name, BODY: bodyLine } }, reactionMeta);
  }

  // ── SQLite raw helpers ────────────────────────────────────────────────────────
  const sqlGetM = body.match(/_dbGet\("SELECT\s+(\S+)\s+FROM\s+(\S+)\s+WHERE\s+player/);
  if (sqlGetM && /^sqliteGetHook_/.test(funcName)) {
    const varM = body.match(/local\s+(\w+)\s*=\s*\(_dbGet/);
    const defM = body.match(/\)\s+or\s+(.+)\)/);
    return enrichSerializedBlock({ type: 'npc_sqlite_get', fields: { TABLE: sqlGetM[2], COL: sqlGetM[1], DEFAULT: defM ? defM[1].trim() : '0', VAR: varM ? varM[1] : 'v' } }, reactionMeta);
  }
  if (/_dbUpsert/.test(body)) {
    const upsM = body.match(/_dbUpsert\("([^"]+)",\s*"[^"]+",\s*player,\s*"([^"]+)",\s*(.+)\)/);
    if (upsM) return enrichSerializedBlock({ type: 'npc_sqlite_set', fields: { TABLE: upsM[1], COL: upsM[2], VALUE: upsM[3].trim() } }, reactionMeta);
  }
  if (/_dbIncrement/.test(body)) {
    const incrM = body.match(/_dbIncrement\("([^"]+)",\s*"[^"]+",\s*player,\s*"([^"]+)",\s*(-?\d+)\)/);
    if (incrM) return enrichSerializedBlock({ type: 'npc_sqlite_increment', fields: { TABLE: incrM[1], COL: incrM[2], AMOUNT: Number(incrM[3]) } }, reactionMeta);
  }

  // ── Quest offer (simple, no advanced state check) ─────────────────────────────
  const questOfferM = body.match(/_questSet\(player,\s*"([^"]+)",\s*"active",\s*(-?\d+(?:\.\d+)?)\)/);
  if (questOfferM && !/status\s*==\s*"complete"/.test(body)) {
    const offerChoices  = choiceMap?.[targetVar] || [];
    const acceptChoice  = offerChoices[0] || {};
    const refuseChoice  = offerChoices[1] || {};
    const startVar      = acceptChoice.targetVar;
    const acceptedVar   = (reactionMap?.[startVar]||[]).find(r=>Number(r.code)===0)?.targetVar;
    const block = {
      type: 'npc_quest_offer',
      fields: {
        QUEST_ID:     questOfferM[1],
        OFFER_TEXT:   nodeText(targetVar, nodes, 'Will you take this mission?'),
        ACCEPT_LABEL: acceptChoice.label  || 'Yes, I will do it!',
        REFUSE_LABEL: refuseChoice.label  || 'Not now.',
        STEP:         Number(questOfferM[2]),
      }
    };
    attachStatementInput(block, 'ACCEPTED', textNodeAsSay(acceptedVar,             nodes, 'Quest started. Good luck!'));
    attachStatementInput(block, 'REFUSED',  textNodeAsSay(refuseChoice.targetVar,  nodes, 'Come back if you change your mind.'));
    return enrichSerializedBlock(block, reactionMeta);
  }

  // ── World get (worldGetHook_) — npc_world_get ────────────────────────────────
  if (/^worldGetHook_/.test(funcName)) {
    const wgM   = body.match(/_worldGet\("([^"]+)",\s*"([^"]*)"\)/);
    // worldGetHook_ has a reaction to a display node, npc_world_get style
    const reactText = nodes?.[(reactions||[]).find(r=>Number(r.code)===0)?.targetVar]?.text || '';
    return enrichSerializedBlock({ type: 'npc_world_get', fields: { KEY: wgM?.[1]||'', DEFAULT: wgM?.[2]||'', SUCCESS: reactText || 'World state updated.' } }, reactionMeta);
  }

  // ── Get world state (getWorldHook_) — npc_get_world ────────────────────────
  if (/^getWorldHook_/.test(funcName)) {
    const wgM   = body.match(/_worldGet\("([^"]+)",\s*"([^"]*)"\)/);
    const text  = nodes?.[targetVar]?.text || 'Reading...';
    return enrichSerializedBlock({ type: 'npc_get_world', fields: { KEY: wgM?.[1]||'', DEFAULT: wgM?.[2]||'', TEXT: text.replace('...','%s') } }, reactionMeta);
  }

  // ── Confirm (no hook — detect by 2 hardcoded choices with no hook on target) ──
  // npc_confirm generates a node with 2 choices and no hook; detect via choiceMap.
  if (!funcName && choiceMap?.[targetVar]?.length === 2) {
    const ch = choiceMap[targetVar];
    return enrichSerializedBlock({
      type: 'npc_confirm',
      fields: {
        TEXT:      nodeText(targetVar, nodes, 'Are you sure?'),
        MS:        nodes?.[targetVar]?.ms || 2000,
        YES_LABEL: ch[0]?.label || 'Yes, proceed.',
        NO_LABEL:  ch[1]?.label || 'No, cancel.',
      }
    }, reactionMeta);
  }

  // ── Say menu (no hook — detect by sub-choices on node) ────────────────────────
  if (!funcName && choiceMap?.[targetVar]?.length > 0) {
    const text = nodes?.[targetVar]?.text || '...';
    const ms   = nodes?.[targetVar]?.ms   || 2000;
    // choices are rebuilt by the caller via buildChoiceChain — just return the shell
    return enrichSerializedBlock({ type: 'npc_say_menu', fields: { TEXT: text, MS: ms } }, reactionMeta);
  }

  // ── Catch-all: Custom Hook ─────────────────────────────────────────────────
  const bodyOneLine = (body || '').replace(/\n/g, '; ').trim() || `return 0; -- ${funcName}`;
  return enrichSerializedBlock({
    type: 'npc_custom_hook',
    fields: {
      NAME: funcName,
      BODY: bodyOneLine,
      SUCCESS: reactionText(reactionMeta, 0, 'Done!'),
      FAIL: reactionText(reactionMeta, -1, 'Something went wrong.')
    }
  }, reactionMeta);
}



export { parseLuaToBlocklyState };
