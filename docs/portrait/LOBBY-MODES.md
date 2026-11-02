# Lobby mode selection — 2026-10-06

The lobby now selects Classic/Skill, Single Player/Multiplayer, and character before Start Game. Character cards do not launch a round. Classic solo keeps existing server session records and resume behavior; Classic multiplayer opens the existing room flow. Multiplayer characters are selected inside the room. Skill multiplayer is explicitly unavailable and cannot be started.

Skill solo opens the portrait table with the selected character. One active skill per character is implemented: Timmy reveals the next rival's live hand; Eldric swaps a selected card for a random card of the next rival; Kirana swaps for the lowest card of the largest rival hand; Adelia swaps for a higher suit of the same rank still held by a rival; Dylan discards one selected card, with at least one card left to finish normally. Skills work only after the opening, on the player's turn, once per round. Bots do not use skills. These are initial skills, not the later two-skill selection system.

Skill game/player/usage are persisted together in a separate local storage envelope. Classic saves and server score records remain separate. Start Game explicitly starts a new Skill round; reload resumes the current one. Menu new round resets usage.

Validation: 3 skill engine tests (deck conservation, immutable state, restore compatibility, opening/turn/reuse/final-card guards, Adapt target), 11 existing portrait tests, strict TypeScript and production build. Browser at 390x844 verifies selection before launch, Dylan identity, actual Breakthrough activation, preserved pile, 12 remaining cards, and used-state display; Classic Multiplayer opens create/join room. Classic server-backed round start could not be exercised in the local preview because record API is unavailable there. No production multiplayer match was created. Screenshot: lobby-v167.jpg.

## Simplification — v169
Classic uses the existing landscape table; Skill uses portrait. Removed separate portrait entry, repeated mode summary, all static lobby explanations, and the bottom help link. Header info icon now contains mode/player/control guidance plus complete rules. Start arrow is SVG to avoid iOS emoji substitution. Kept actual errors/session actions visible when relevant. Verified mobile 390x844 lobby and info open/close in browser; no game rules or routing changes. Screenshot: lobby-v169.jpg.
