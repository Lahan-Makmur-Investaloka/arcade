# Eldric's Workshop visual upgrade

2026-10-03. Extends existing TEKAD Arcade and the existing 20-level game. No other game's rules or saved data change.

## Art and presentation

- Twelve original generated raster assets: environment, cover, Eldric portrait, material, four idle machines, and four activated counterparts. Eldric follows the existing canonical yellow-coat inventor art. No Bu Cita.
- Optimized WebP runtime assets in `public/workshop`; mobile environment variant reduces transfer size. Transparent machine/character edges preserved.
- Four chapter prototypes: Scarab MK-I, Atlas Gyroscope, Noctua Scout, Aether Core.
- Functional SVG conduits use the generated material, smooth quarter-turns, and actual graph-entry directions for energy flow. Success switches to activated machine art.
- Mobile success presentation can be dismissed with “Lihat rangkaian” to inspect the solved board. No forced full-screen mode or drag gesture.
- Ambient particles, subtle machine movement, and optional synthesized interaction sounds. Reduced-motion preference stops motion; sound defaults off. No external audio dependencies.
- Home Arcade feature card updated with the new cover; other games retained.

## State and lifecycle

Retains `tekad-eldric-workshop-v1` and migrates prior `{completed,level}` saves. Adds current tile rotations, move count, sound, and ambient preference. Sanitizes malformed saved values. Progress is device-local, matching the prior game.

Animation timers are cancelled on reset, level switch, opening a panel, and unmount. A synchronous running guard prevents repeated activation. Native dialogs supply focus trapping; focus returns to the opening control.

## Verification

- TypeScript check scoped to the changed game and layout: passed.
- Engine: all 20 authored solutions remain reachable by rotating unlocked tiles; initial boards are unsolved; source disconnection fails; propagated connections are reciprocal.
- React/JSDOM interaction simulation: all 20 levels solved via tile clicks; failure feedback, reset during an active test, switching levels during a test, dialog lifecycle, old-save migration, reload, and malformed storage validated.
- Assets inspected, alpha transparency checked, converted to optimized WebP.
- Browser visual/device QA unavailable: no control-browser capability supplied in this environment. Responsive CSS and DOM were reviewed, but no real Safari or browser-rendered screenshot verification is claimed.

Game logic lives in `engine.ts`; presentation/state helpers in `presentation.ts`; pure tile visuals in `circuit-tile.tsx`; audio and ambient effects have explicit teardown.
