# Changelog

## Unreleased

### Added

- Show the selected model/provider `baseUrl` in the TUI detail pane.

### Fixed

- Resolve `ModelSelectorComponent` from pi's live bundle on pi >= 0.84.3 (bundled CLI): the previous code imported the dead unbundled copy, so the extension loaded but silently did nothing. Also handles the pi >= 0.86.0 entry-shim layout, where `cli.js` no longer references the hashed chunks.

## 0.2.0 - 2026-05-09

### Changed

- Migrated from `@mariozechner/*` to `@earendil-works/*` package namespace (pi 0.74.0)
- Updated peerDependencies and devDependencies to match pi 0.74.0

## 0.1.0 - 2026-04-29

### Added

- Initial release
- Bottom detail pane showing context window, max output, API protocol, input modalities, reasoning, and cost
- Protocol abbreviation (openai-responses → resp, openai-completions → comp, anthropic-messages → anth)
- Cost formatting with free model detection and cache read/write breakdown
- Monkey-patches `ModelSelectorComponent.prototype.updateList` for non-invasive enhancement
