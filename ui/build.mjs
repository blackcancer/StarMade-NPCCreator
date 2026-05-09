// build.mjs — Bundle ui/src/main.js → inject inline into shell.html → ui/index.html
// Usage: node ui/build.mjs
// Result: ui/index.html (single autonomous HTML file, no server needed)

import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

const result = await build({
  entryPoints: [join(__dir, 'src/main.js')],
  bundle:      true,
  format:      'iife',
  platform:    'browser',
  minify:      true,    // source is modular/readable; generated index.html stays compact
  write:       false,
  // Blockly is on CDN (window.Blockly) — do not bundle it
  define: { 'window.Blockly': 'window.Blockly' },
});

if (result.errors.length > 0) {
  for (const e of result.errors) console.error('ERROR:', e.text, e.location?.file + ':' + e.location?.line);
  process.exit(1);
}

const bundle = result.outputFiles[0].text;
const css    = readFileSync(join(__dir, 'style.css'), 'utf8');
let   shell  = readFileSync(join(__dir, 'shell.html'), 'utf8');

// Inject CSS inline (replaces <style> tags from shell if any, or adds before </head>)
if (shell.includes('<style>')) {
  // Shell already has a <style> block (from extraction) — replace its content
  shell = shell.replace(/<style>[\s\S]*?<\/style>/, () => `<style>\n${css}\n</style>`);
} else {
  shell = shell.replace('</head>', () => `<style>\n${css}\n</style>\n</head>`);
}

// Inject JS bundle
shell = shell.replace('<!-- BUNDLE -->', () => `<script>\n${bundle}\n</script>`);

const outPath = join(__dir, 'index.html');
writeFileSync(outPath, shell, 'utf8');
console.log(`✓ Built ui/index.html — ${shell.split('\n').length} lines`);
