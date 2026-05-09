# StarMade NPC Creator

> Visual Lua dialog builder for StarMade NPC scripts.

A dual-interface toolkit for creating NPC dialog trees in StarMade:

- **Visual editor** — drag-and-drop Blockly workspace → live Lua output
- **TypeScript API** — fluent programmatic builder for scripts and tooling

---

## Documentation

| Document | Description |
|---|---|
| [docs/API.md](docs/API.md) | Full API reference — DialogBuilder, NodeBuilder, LuaEmitter, Hooks, HOOK_RESULT, SqliteState, DialogObject |
| [docs/GUIDE.md](docs/GUIDE.md) | Developer guide — concepts, patterns, SqliteState, best practices |
| [docs/EXAMPLES.md](docs/EXAMPLES.md) | 10 worked examples from minimal NPC to full faction hub |

---

## Quick start — Visual Editor

The editor is a single self-contained HTML file. No server, no install.

```bash
# Open directly in any browser
open ui/index.html          # macOS
start ui/index.html         # Windows
xdg-open ui/index.html      # Linux
```

Or build from source:

```bash
npm install
node ui/build.mjs           # → ui/index.html
```

### Workflow

1. **Start with a Greeting block** — the required root node.
2. **Add Choice blocks** — each one is a player button.
3. **Attach actions** — quests, crew, items, reputation, cooldowns…
4. **Read the Lua output** on the right — updates live.
5. **Download Lua** and deploy to your StarMade server.

### Deploy to StarMade

```
1. Copy your_script.lua  →  StarMade/data/script/your_script.lua
2. Launch StarMade as admin
3. Aim crosshair at the NPC
4. Open chat and run:  /creature_script your_script.lua
```

---

## Quick start — TypeScript API

```bash
npm install starmade-npccreator   # (or use the local build)
```

```ts
import { DialogBuilder, LuaEmitter } from 'starmade-npccreator';

const script = new DialogBuilder({ name: 'trading_npc' })
  .greeting('Welcome, {name}! I am {partner} of {faction}.')
  .addChoice('Hire me (50 000 cr)', b => b.hire(50_000))
  .addChoice('Buy a laser (100 000 cr)', b => b.sell('laser', 100_000))
  .addChoice('Goodbye.', b => b.goBack())
  .done();

console.log(new LuaEmitter().emit(script));
```

---

## Project structure

```
starmade-npccreator/
├── src/                        TypeScript API (library)
│   ├── core/
│   │   ├── DialogBuilder.ts    Fluent dialog tree builder
│   │   ├── DialogNode.ts       Node model
│   │   ├── DialogObject.ts     dialogObject interface + HOOK_RESULT constants
│   │   ├── Hook.ts             Hook definitions + built-in factory
│   │   └── ScriptDefinition.ts Script container
│   ├── db/
│   │   └── SqliteState.ts      HSQLDB/SQLite persistent state helpers
│   └── emitter/
│       └── LuaEmitter.ts       Lua code generator
│
├── ui/                         Visual editor (browser, no server)
│   ├── index.html              ← single-file build (deploy this)
│   ├── shell.html              HTML template
│   ├── style.css               Design system
│   ├── build.mjs               esbuild bundler
│   └── src/
│       ├── blocks/             Blockly block definitions (one file per category)
│       ├── examples/           Built-in workspace examples
│       ├── generator/          Lua generation (core, emitter, actions, conditions)
│       └── parser/             Lua → Blockly round-trip parser
│
├── test/                       Test suite (Mocha + Chai)
└── package.json
```

---

## Scripts

```bash
npm test              # Run 406 tests
node ui/build.mjs     # Build ui/index.html
```

---

## Requirements

- **Node.js** 18+
- **StarMade** r106.0.1+ (HSQLDB bundled in lib/hsqldb.jar)
- No external runtime dependencies — Blockly loads from CDN

---

## License

MIT
