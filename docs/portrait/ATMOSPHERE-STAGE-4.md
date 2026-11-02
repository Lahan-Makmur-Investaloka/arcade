# Portrait stage 4 — table atmosphere

Requested on 5 October 2026: continue the agreed next stage with at least thirty minutes for implementation and audit. Base publication: v163, source 3c3abf3484aaa3e7e7a4017922fc6e43d568c5f0. Work began about 22:43 WIB.

## Scope

The next agreed step after the five-character artwork/POV work is atmosphere: deal, turn, card sound and round conclusion. Skills, lobby unification and final integration remain subsequent stages. This change stays on `/big-two/portrait`; it does not change multiplayer, the rules engine, room APIs or leaderboard records.

- New rounds show a deck and 52 back-of-card flights in thirteen groups of four, while the player's fan fills progressively. Input and bot turns wait until delivery finishes.
- The complete engine hand is saved immediately. Refreshing a saved round skips the presentation and restores all cards. Menu, pause, hidden document and pending artwork freeze visual progress and bot timers.
- Reduced motion or the Animasi switch uses a short stationary deal cue. The same switches stop hand transitions, card flights and decorative animation. No flashing strobe effects.
- Player cards arrive from below, opponent cards from above. Three passes clear the outgoing pile briefly and identify who opens the next trick. Active-seat underline and one-shot turn cue make the current player clearer.
- Reuses the existing original CardSound synthesizer for select, play, pass, five-card combinations, turn and win cues, plus its lounge music. Audio remains off by default and only unlocks after a user gesture. Preferences have a separate device-local key with bounded volumes and corrupt-save fallback.
- Menu/preview/pause/hidden states suspend audio. Reopening or refreshing a completed result does not replay its historical win cue. Music stops at round end.
- A native result dialog shows the winner's existing portrait, all four remaining-card counts, and round points from the shared engine. It explains the existing 10–12 ×2 and 13 ×3 penalty rules. Results can be dismissed to inspect the table, reopened, or followed by a new deal. These are round-only points, not a new persistent tournament or score submission.

## Preserved behavior

All four rear-hand and foreground-thumb nodes retain their existing keys and geometry profiles; both layers stay mounted together. Card index touch targets, drag-to-pick behavior, selected-card fan, opening 3♦, legal moves, character identities and five-character expression preview are retained.

## Validation

- Strict targeted TypeScript check for the portrait component and imports.
- Existing portrait interaction suite, expanded to freeze and resume each new-character deal.
- New policy and DOM integration cases: malformed preferences; shared zero-sum scoring for every winner; fresh vs historical sounds; final-card result timing; inspect/reopen/restore result; complete hand saved during delivery; stationary deal; menu pause; third-pass pile clearance; hidden-tab bot pause and one-turn resume.
- Existing sound lifecycle tests exercise explicit unlock, mute, independent levels, bounded voices, pause, visibility, unsupported audio and disposal.
- Rendered browser checks at 390×844 and 320×568: deal, result win/loss, five-card selection, third pass, settings, native modal fit. Browser audit wrapper observed AudioContext running after a gesture, suspended in menu, and running after close. This verifies browser audio lifecycle, not subjective sound quality or physical iPhone/Safari behavior.

Audit harness lives in docs and is copied to an ignored public test page only while testing; the test page must be removed before publication.

## Remaining roadmap

1. Character skills: choose one of two before the deal; Classic and Skill modes separate; protected opening 3♦ and final-card constraints.
2. Integrate the approved portrait presentation with the intended lobby flow.
3. Final cross-mode and native-device audit.

## Completion evidence

Thirteen targeted portrait/atmosphere/audio tests passed together. Final strict TypeScript and diff-whitespace checks passed. A real rendered-browser round was played from a new deal through an intervening refresh, multiple trick resets and low-card moods to Timmy's win: Timmy +14 / Eldric −1 / Kirana −4 / Dylan −9. Result screenshot: `atmosphere-result-browser.jpg`. The release/return sampler continued to report 0.00px rear/foreground origin mismatch. Implementation and audit ran beyond thirty minutes (started ~22:43 WIB; final browser evidence after 23:14 WIB). Physical-device and subjective audio listening verification remain unclaimed.
