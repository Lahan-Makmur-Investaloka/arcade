# Capsa portrait visual trial — 2026-10-05

Latest: all five characters and POV costumes completed in v163; stage 4 table atmosphere shipped in v164 (`ATMOSPHERE-STAGE-4.md`). The subsequent requested typography/button/animation redesign is documented in `REBEL-REDESIGN.md`, including its browser verification limit. Next are character skills, lobby integration and final audit.

Historical initial implementation notes below. `AUDIT-2026-10-05.md` and the atmosphere screenshots describe the earlier rendered-browser audits; they do not verify the later redesign.

Existing Site: TEKAD Arcade. Base source `6d8d30a83d007238e37c747152d2cf9168388609`, published version 152. Isolated trial route `/big-two/portrait`; one lobby link in `app/big-two/game.tsx`. No Racing, multiplayer protocol, scores, skills, or existing Capsa gameplay changes.

## User direction

Portrait first-person card table. One focused opponent at a time, quick transitions. Prioritize visual quality. Start with one opponent's complete expressions; defer skills. Timmy is the player, Eldric is the fully illustrated opponent. Other seats retain existing artwork while focus follows the turn. No Bu Cita.

- No player has 1–3 cards: normal, mildly focused mood.
- Player has 1–3 cards: smug/confident.
- Someone else has 1–3 and this player has >3: anxious.
- Multiple players may be confident simultaneously. A zero-card hand is a finished round, not a danger trigger.
- Action poses temporarily override resting mood, then return to count-driven mood.
- Unselected fan initially held between both hands. Selected cards move right; unselected remain left. The initial two-fan arrangement was replaced in revision 2 with one shared grip pivot per hand.

## Implemented

Six-pose transparent Eldric atlas (neutral, choose, play, anxious, smug, pass), separate room, separate player-hand atlas. Imagegen prompt provenance is in `imagegen-prompts.txt`. Built-in image generation; reference character lineup from uploaded IMG_9631.jpeg. PNG originals supplied by image asset worker were exported as WebP with alpha retained. Final assets:

- `public/big-two/portrait/eldric-atlas.webp` (1536×1024, 3×2 square cells)
- `public/big-two/portrait/room.webp` (1024×1536)
- `public/big-two/portrait/hands.webp` (1536×1024, 2×1 cells)

Approximately 553 KB total. Fixed atlas aspect ratios prevent pose distortion. CSS scope is `fp-*`. Exact existing card faces reused through Card component, with live rank/suit labels and existing engine. All 52 cards remain governed by unchanged Big Two rules. Bots use own hand, table and public counts only.

Practice-only trial, isolated device-local save. No score writes. Opening 3♦, legal suggestions, play/pass, three-pass reset, winner and replay. Reactions hold for 620 ms; focus transition 160 ms; bot considers for 1600 ms. Menus, explicit pause, expression preview and hidden tabs stop the bot timers. Menu contains six-pose inspection without altering real hand counts. Reduced-motion CSS disables spatial movement. Asset load failure offers retry; bot starts only once artwork is ready.

## Validation and limits

- Existing engine suite: 11 tests, including 100 complete seeded four-bot rounds, passed.
- Targeted strict TypeScript check for portrait component and imported modules passed.
- New expression threshold test passed (all above 3, one/multiple at or below 3, zero-card terminal hand).
- React DOM integration passed: restore 13-card hand, select/cancel and split, legal play, unchanged saved sequence while menu open, six-pose inspection, resume exactly one bot action. This uses linkedom and is not a rendered browser test.
- Whole-project TypeScript check reports pre-existing `.ts` extension and Cloudflare type declaration issues; no portrait errors. No unrelated fixes attempted.
- Asset alpha and dimensions inspected, plus generated artwork reviewed. Browser control skill unavailable; no browser screenshots, touch-device, final compositing, sound or physical iPhone verification claimed.

## Next

Actual portrait rendering and touch review remain a quality gate before describing visual work as final. Refine hand-to-card contact if needed, then extend pose set to other characters and integrate the approved presentation into the intended Skill mode. This trial deliberately does not claim those stages complete.
