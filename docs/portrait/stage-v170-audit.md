# Classic stabilization audit — v170

- Provisional skills are disabled in portrait, including old mode=skill links. Dormant definitions remain for later design; no runtime imports.
- Lobby separates Landscape / Portrait presentation from Single Player / Multiplayer. Both tables use Classic rules. Portrait remains single-player; information is in the info panel.
- Fresh portrait entry uses the selected character and consumes start=1. Refresh resumes the saved Classic game and identity without redealing. Previous experimental skill saves remain untouched and are not resumed as Classic.
- Sound/music defaults and persisted mute behavior are unchanged.

## Verification

- Strict TypeScript check of both game components passed.
- Engine: 11 tests passed, including 100 seeded bot rounds, legal moves, conserved cards, zero-sum scoring and restored state.
- Portrait: 7 tests passed, including added old skill URL, fresh Dylan entry and reload recovery assertions.
- Atmosphere: 4 tests passed, covering preferences, result rows, final card, third pass and pause.
- Sessions: 3 tests passed, including server scoring, duplicate recording protection, completed-round recovery and history.
- Real-time practice round passed: 60 turns, 15 player actions, menu/background pause, duplicate taps, rematch and animation cleanup. Updated obsolete test button labels and awaited asynchronous start.
- Cloud Chrome at 390 x 844: entered portrait via lobby with Dylan, selected and played opening 3 diamond, opened compact pause menu. No skill control, correct identity and Classic label, sound/music ON. Screenshot stage-v170.jpg.

## Limits

- Preview landscape session API could not connect to the production database; server/session behavior was verified using isolated SQLite-backed tests. No live multiplayer room was created.
- No physical iPhone/Safari test. No skill balance validation because skills await product design.
