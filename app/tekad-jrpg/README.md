# TEKAD JRPG continuity

Continue within the existing TEKAD Arcade site. Preserve Switch Run, Racing and Puzzle.

Confirmed voice decisions retrieved on 2026-09-06: serious fantasy JRPG; large detailed intimidating enemies; active party maximum three; primary jobs before secondary jobs; Timmy is Guardian with sword and shield. Clean fantasy characters without corporate logos/value symbols. Existing TEKAD character sheets provide identity references.

This milestone implements a playable single-character Guardian combat prologue at /tekad-jrpg. Jembatan Senja, the antlered guardian, action values and armor-break rules are implementation choices for this pilot, not claimed voice approvals. Other current primary jobs and further story details were not recovered; do not substitute old poster job labels as approved gameplay decisions.

Combat has four commands, telegraphed enemy turns, armor break, finite recovery items, victory/defeat and replay. Other party members, exploration, progression and secondary jobs are not implemented yet.

Artwork is generated for this milestone; Timmy's existing public/characters/timmy.png was the visual identity reference. Run node tests/jrpg-battle.test.mjs for deterministic battle checks.

## Approved visual direction (reference follow-up)
Landscape 16:9 scene with integrated HUD: party portrait and resources top left, world title and enemy HP top right, vertical commands bottom left, adjacent action description. Timmy and enemy share the ground line. No dialogue bubbles. Keep English UI, fullscreen with browser-compatible expanded fallback, and portrait rotation prompt. Kirana and Dylan shown in the user mockup are not approved sprite references and remain outside this milestone.
