# Big Two — visual polish audit, 4 October 2026

## Final static art-direction pass before Stage 3B

Existing transparent play/victory portraits now sit above the opponent panel edge, using `contain` to preserve all character pixels. Desktop rows reserve 18px above the panels; mobile uses a smaller 10px allowance, with narrower image columns to protect names. Each panel has its cast color on the edge and a stronger static active-turn marker. No flashing or new looping effects are introduced.

The player's heading inherits the selected character color and uses a larger portrait/name strip. A low-opacity radial light behind the hand separates the paper cards from the background without overlays blocking taps. The existing generated felt texture is more visible under the lighting layer, with inset rail highlights, inner stitching, contact shadows and darker outer edges. The city backdrop is dimmer. Existing J/Q/K/ace artwork, lobby, rules and multiplayer protocol are unchanged.

Validation: strict component TypeScript check, five-cast select/cancel/play/cut-in/effects-off DOM exercise, static responsive cascade and hand/table width checks. These checks do not replace browser/phone visual QA, which remains unavailable in this environment.

## Follow-up: desktop composition

The user's published screenshot showed excessive side/bottom space and small hands. The playing canvas now allows 1740px, with a 1360px table/opponent row, 1448px hand/status area and 850px controls. Desktop hand cards grow from an 80px cap to 104px (30%); a viewport formula reserves space for all thirteen cards and twelve gaps. Short screens cap cards at 92px. Opponent portraits grow to 96×104px, with narrower-tablet and short-screen variants. The empty table minimum drops from 260px on large screens to 208px; content can still grow for a five-card combination and pass count. Cut-ins remain capped at 900px so a wider table does not spread the portrait and label apart. Mobile portrait rules and the established lobby remain intact.

Static cascade and width-budget checks cover 320–2560px, including 844×390 landscape, 13/8/5/1-card hands, five-card table capacity, effects-off visibility and existing card framing. This is not browser-rendered layout verification; the earlier browser/device limitation still applies.

## Scope and outcome

Continues published version 136. Preserves the approved lobby, court illustration identities, rules engine and multiplayer protocol. The pass targets the user's complaints about undersized courts, plain number/ace faces, distant combo portraits and generic controls.

| Area | Change | Evidence |
| --- | --- | --- |
| J/Q/K | Art viewport inset reduced to 2%; J/Q enlarged 114%, K 102% to protect its crown | Source-image ink bounds inspected individually; all 52 identities render correctly |
| Numbers | Warm paper, restrained gold frame, serif indices and conventional pip arrangements | Exact body-pip count checked for every 2–10 and all four suits |
| Aces | Four original engraved suit emblems with transparent backgrounds | Correct suit-to-file mapping, dimensions and asset presence checked |
| Combo portraits | Five new head-and-shoulder illustrations, separate from full-body play poses | Original images inspected; correct portrait appears for all five cast rotations |
| Buttons | Angular ink/paper silhouettes, custom functional icons, red Banting action and count plaque | Select/cancel/play, accessible names and disabled states exercised in DOM |
| Motion preference | New closeup is conditionally removed when Animasi is OFF; reduced-motion CSS remains active | Toggle tested after a five-card play; cascade checks confirm hidden state |
| Mobile controls | Fixed safe-area action bar, 44px cancellation target, compact primary action | CSS cascade checked at eight viewport sizes; no browser-rendering claim |

## Verification performed

- Targeted strict TypeScript validation of the affected Big Two components.
- Final accessibility review separates keyboard focus (gold outline) from selected-card state (red outline/check) and increases the mobile sort control to a 44px minimum height.
- Existing 52-card/character art assertions and multiplayer client flow passed.
- New interaction test uses legal engine-generated combinations. It rotates all five characters, selects and clears cards, submits exactly one five-card action, checks the new hand count and matching cut-in, then disables animation.
- Static CSS cascade audit at 320×568, 360×740, 390×844, 430×932, 700×900, 768×1024, 1024×768 and 1440×900. Checks target the real layered stylesheets: court inset, K scale, lower indices, action-bar positioning, cancellation target and effects-off visibility.
- Nine new generated originals export to fourteen WebP files, approximately 1.11 MB in total. Portraits have 480px and 960px variants; only seated characters preload during a match with animation enabled. All images retain transparency. Exact generation prompts and hashes are in `big-two-polish-art.json`.

## Limits and follow-up

DOM interaction and stylesheet evaluation do not measure actual browser layout, rasterization or physical touch behavior. The managed browser-control capability was unavailable during this pass, so Safari/Chrome phone rendering, GPU frame pacing and real-device clipping remain unverified. The supported widths are implementation targets, not a claim of screenshots from eight devices.

The approved J/Q/K originals remain unchanged; only their CSS framing changes. Number pips are live text, not generated graphics. The special effects are an incremental visual polish pass, not completion of the broader planned Stage 3B music and motion work.
