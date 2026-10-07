# Card Club visual redesign

Requested 6 October 2026 WIB: more striking animation and a Persona-inspired redesign of fonts and buttons. Work started around 23:18 UTC on 5 October (06:18 WIB). Base release v164, source `4e182f3f474bc4a8336bad463ce30961e76d8392`.

## Presentation

The portrait trial now uses an original ink/scarlet/ivory graphic treatment. Existing TEKAD character and card artwork is reused. Layout and presentation remain scoped to `/big-two/portrait`.

| Element | Treatment |
| --- | --- |
| Display typography | Self-hosted condensed, slanted **Tekad Display**; a modified Latin subset of DejaVu Sans Bold, 13,580 bytes in WOFF format. Notices and permission included alongside the font. |
| Reading text | Arial/system sans for explanations, preferences, scores and card counts; existing serif card indices retained. |
| Primary action | Scarlet cut-corner button, ivory counter, clear disabled state and one brief readiness sweep. |
| Secondary actions | Angular ink buttons with strong uppercase labels; 44 px minimum command height. |
| Turn and seats | Ivory current-turn banner, active-seat paper panel, red accent; low-card numbers remain distinct. |
| Character focus | Animated name tag over a restrained halftone/slash backdrop. Existing six-pose atlases remain unchanged. |
| Menu and results | Same graphic system; native dialogs, scrollable content, explicit menu name and visible focus rings. |

## Action animation

`ActionFlair` is mounted only for the current live reaction. It checks that the latest move ID matches the reaction sequence. It never treats persisted history alone as a new action.

- Single/pair/triple: small angled action stamp and short speed lines.
- Five-card combinations: scarlet portrait strip and the actual combination name.
- Final card: finishing portrait strip before the existing round-result dialog.
- Pass: compact dark stamp; the third pass identifies the newly open table.
- A short radial impact sits behind the table pile. It has no pointer events.

Effects use the existing 620 ms reaction window, with no additional bot delay or input lock. The same action node is retained through menu and expression preview; preview conceals it while the existing frozen state pauses animation. It leaves with the reaction, and refresh does not replay it. Animasi OFF and system reduced-motion settings use a stationary stamp and remove speed lines/impact marks. The readiness sweep has zero base opacity, so disabling animation cannot leave a stripe over the button.

Portrait crop positions were checked against all five existing 480×320 cut-in assets. Kirana/Adelia use a different vertical crop from Timmy/Eldric/Dylan. A crop review is not a rendered browser screenshot.

## Preserved behavior

No changes to `hand-layout.ts`, thumb clipping profiles, rear/foreground hand keys, card-index geometry, engine rules, bot logic, sound policy, persistence keys, multiplayer or scoring. The approved hand/card relationship and wide fan are retained. The only unrelated metadata cleanup removes the old development-only `codex-preview` tag as required by the publishing workflow.

## Audit

- Thirteen targeted portrait/atmosphere/audio tests pass, with no skips. Existing coverage includes card selection, drag/cancel, 30 character expressions, all five POV identities, hidden/menu pause, deal, sound lifecycle, final-card results, third pass and exact shared hand-layer origins.
- Added integration assertions cover live versus restored action strips, preview preserving the same action node, finishing cut-in removal, and Dylan's five-card straight-flush strip. Toggling motion during the cut-in and closing the menu preserve the same foreground thumb node; reload retains the five-card pile without replaying the strip.
- Targeted strict TypeScript check and CSS parsing pass.
- Real font metrics were reviewed at the intended small-screen sizes. Saran/Banting were reduced at ≤360 px, the turn banner now scales with viewport width, and two-line combination titles have enough vertical space. These are metric/layout calculations, not browser measurements.
- Key text/background contrast ratios: ivory/scarlet **4.91:1**, ink/ivory **17.80:1**, muted text/ink **10.59:1**, result secondary text/ivory **6.94:1** or higher. Disabled-control contrast is visually separate and not counted as active text. The old yellow focus ring was replaced by a bright red ring so it remains distinct on the new ivory result panel as well as the ink menu.
- Production build and packaging are release gates. The source helper records the final build, commit and archive.

**Verification limit:** the required managed preview browser skill is unavailable in this session. Per Sites instructions no preview server or alternate browser path was started. No rendered-browser, physical iPhone, animation-frame or final screenshot verification is claimed for this redesign. The v164 screenshots in this directory document the previous appearance, not this release.

## Following stages

Character skills, lobby integration, then final cross-mode/device review. This visual pass does not enable skills or merge the portrait trial into multiplayer.

Font follow-up: composite glyphs are decomposed before transformation, preventing accented characters from receiving the narrowing/slant twice. The reproducible builder is `build-display-font.py`; the font URL is versioned to avoid stale caches.
