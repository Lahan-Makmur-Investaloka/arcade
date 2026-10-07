# TEKAD Arcade — console home redesign

Updated 4 October 2026. Existing Site and all eight game destinations preserved.

## Experience

The homepage now centers on the selected game: full-screen artwork, a horizontal cover rail, concise game information, and a primary Main action. The all-games catalog remains available as a native modal, with a no-JavaScript catalog fallback. Typography uses a local system sans-serif stack, with no external font request. The red TEKAD app icon remains the brand mark.

The selected game is remembered only for the current browser session. Selecting a cover, the previous/next controls, keyboard arrows/Home/End, or a horizontal swipe over the feature panel updates the game. The rail itself can be scrolled naturally and a cover selected by tapping. Vertical swipes preserve normal page scrolling. The loading screen can always be skipped and releases after a bounded deadline even if images fail.

Game implementations, multiplayer state, APIs, scoreboards, and existing lobby screens were not modified.

## Art and delivery

Two original generated illustrations were added: a five-character Big Two scene and an Earth 3000 kart racing scene. Both place the main subjects toward the right to leave text space at desktop widths. Existing artwork supplies the other six games. No Persona characters or logos are included.

The new hero artwork is delivered as WebP (approximately 306 KB and 357 KB). Eight home-only thumbnails together are approximately 300 KB. Large existing PNG backgrounds have separate WebP delivery copies; the original game files remain intact. The icon displayed by home/loading uses the existing 192px red app icon. Full-resolution backgrounds are requested as games are selected, not all eagerly at entry.

## Interaction validation

`tests/arcade-home.test.mjs` exercises the actual React component through an optional LinkeDOM harness. Run with `ARCADE_DOM_PATH` pointing to an installed LinkeDOM ESM entry. It checks:

- All eight preserved game destinations and available local image files.
- Selection, keyboard wrapping/Home/End, roving tab stops, and primary action updates.
- Delayed artwork responses cannot replace a newer selection.
- Missing artwork does not prevent launching a game.
- Horizontal touch selection, vertical-scroll preservation, and boundary clamping.
- Catalog opening, Escape/backdrop closing, and body-scroll restoration.
- Session restoration and continued operation with storage denied.
- Loading-screen exit even when both critical image requests fail.

Strict TypeScript validation is scoped to the changed home components. Existing built-Worker SSR checks cover homepage, Big Two, and Workshop.

## Responsive and accessibility provisions

Home-only CSS includes phone, narrow-phone, tablet, desktop, and short-landscape rules. No fixed-height content clipping is used; smaller screens can scroll to reach the launch button. Cover rail overflow stays horizontal. The catalog uses four/three/two columns by available width. Native modal behavior supplies focus containment. Interactive elements have focus indicators, and the selection tab has a single roving tab stop. Reduced-motion preferences remove transitions and smooth scrolling. High-contrast rules preserve button and selection outlines.

## Verification limit

Automated interaction tests and built server rendering are not browser layout tests. The required managed browser-control capability was unavailable in this session, so no actual browser screenshot, physical-phone rendering, frame-rate, or device gesture verification is claimed. Final visual framing on real phones remains a manual review item.
