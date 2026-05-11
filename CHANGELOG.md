# Changelog

All notable changes to StarMade-NPCCreator are documented in this file.

## [1.0.1] - 2026-05-12

### Added

- Added runtime UI localization system.
- Added full French localization.
- Added German, Spanish, Russian, and Japanese locale support.
- Added language selector with persisted locale preference.
- Localized Blockly labels, toolbox categories, dropdowns, tooltips, default text, example dialogs, status messages, and help panel.

### Fixed

- Fixed localization of toolbox category names containing escaped HTML entities, such as `Flags & World`.

### Validation

- `npm run build-ui` passes.
- `npm test` passes: 406 tests.
- CDP smoke test passed for French, German, Spanish, Russian, and Japanese with no serious runtime errors.

## [1.0.0] - 2026-05-09

### Added

- Initial public release of StarMade-NPCCreator.
- Visual Blockly editor for StarMade NPC Lua dialog scripts.
- TypeScript fluent API and standalone UI build.
- Lua generation, import/export workflow, examples, and documentation.
