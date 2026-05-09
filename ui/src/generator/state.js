// generator/state.js — GeneratorState singleton reset between generations

/** Create a fresh mutable generator state object. */
export function createState() {
  return {
    nodeCounter: 0,
    // funcName → { body: string[], disabled: boolean, comment: string }
    hooks: new Map(),
    // { varName, text, ms, hook, reactions[], choices[], comment, disabled }
    nodes: [],
    rootVar: 'entry',
    dbTables: new Map(),    // table → { cols }
    luaVars: [],            // { name, mode, value }
    usesHsqlMemory: false,
    usesQuestTable: false,
    usesReputation: false,
    usesCooldowns:  false,
    usesShopStock:  false,
    usesWorldState: false,
  };
}

// Module-level mutable state (reset on each generateLua call)
export let _state = createState();

/** Reset the module-level generator state before a new generation pass. */
export function resetState() {
  _state = createState();
}
