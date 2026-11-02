# Portrait audit — 5 October 2026

Scope: hand transitions, card selection, compact screens, validation, round lifecycle.

## Fixed
- After playing the final card, the right hand used the holding pose despite an empty hand. Both hands now use empty/release cells when no cards remain; the clipped foreground thumb stays hidden.
- Validation text crossed the illustrated wrists. Added a dark backing only when a message is present.

## Verification
- 17 tests passed across portrait interaction/layout and the shared engine, including 100 seeded complete four-bot rounds, legal moves, card conservation, resumable saves, three-pass reset, and scoring.
- Targeted strict TypeScript check passed.
- Browser inspected at 320×568, 360×640, 375×667, 390×844; also exercised 430×932 before returning to compact view.
- Browser states: 13-card starting hand, 8+5 split and valid straight play, 5 cards all selected with invalid combination blocked, 3-card and 2-card fans, one-card selection/play, win overlay and restored completed round after reload.
- Real browser pointer drag selected the release target (4 clubs) exactly once. Selection/cancel, suit sorting, suggestion, pause/resume worked.
- Per-frame DOM sampling during a five-card play captured 11 frames across release and return with maximum palm/thumb rectangle difference 0.00 px. Last-card play captured 10 frames with the same 0.00 px result. This verifies alignment on sampled browser frames, not device frame rate.
- After the empty-hand fix, browser reload of the won round showed the right release atlas cell and hidden foreground thumb.
- Compact validation message and action buttons stay in bounds. Screenshot: audit-final-2026-10-05.jpg.

## Limits
Cloud Chromium viewport checks are not physical iPhone/Safari testing. Safe-area insets, native touch behavior, and performance on that hardware remain unverified. Full automated rounds test the engine; browser interaction covers representative states rather than manually playing every turn of a complete round.

Internal repeatable fixtures and motion sampler live in audit-harness.html. Copy to public only during QA; removed from public before deployment.
