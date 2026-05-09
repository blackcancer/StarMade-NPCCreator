// highlight.js — Minimal Lua syntax colorizer

// SYNTAX HIGHLIGHT (minimal, no deps)
// ──────────────────────────────────────────────────────────────────────────────
export function highlight(code) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const kws = new Set(['function','local','return','if','then','else','elseif','end','and','or','not','for','in','do','while','repeat','until']);
  let out = '';
  let i = 0;
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (ch === '-' && next === '-') {
      let j = i + 2;
      while (j < code.length && code[j] !== '\n') j++;
      out += `<span class="cmt">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    if (ch === '[' && next === '[') {
      let j = i + 2;
      while (j < code.length && !(code[j] === ']' && code[j + 1] === ']')) j++;
      j = Math.min(code.length, j + 2);
      out += `<span class="str">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    if (ch === '"') {
      let j = i + 1;
      while (j < code.length) {
        if (code[j] === '"' && code[j - 1] !== '\\') { j++; break; }
        j++;
      }
      out += `<span class="str">${esc(code.slice(i, j))}</span>`;
      i = j;
      continue;
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      out += kws.has(word) ? `<span class="kw">${word}</span>` : esc(word);
      i = j;
      continue;
    }

    if (/\d/.test(ch) && !/[A-Za-z_]/.test(code[i - 1] || '')) {
      let j = i + 1;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      out += `<span class="num">${code.slice(i, j)}</span>`;
      i = j;
      continue;
    }

    out += esc(ch);
    i++;
  }
  return out;
}


