# Stage 4 — multiplayer reliability and mobile audit

4 October 2026. Continues published version 141 on the existing TEKAD Arcade project. The approved lobby, original cast artwork, J/Q/K designs, classic number pips, ace ornaments and gameplay rules remain in place.

## Repairs

- Temporary table exit previously wrote a zero last-seen timestamp. That made a freshly disconnected player appear absent for more than a minute immediately. Exit now records a recent heartbeat; the existing 25-second presence timeout and 60-second host/cancellation grace period apply normally.
- The native result modal now exposes host takeover when the host has been absent for a minute. Players can recover and open the next lobby without being trapped behind the result modal. Connection errors and retry controls are visible inside it, and opening a lobby is disabled while disconnected.
- A permission error that still contains an authenticated room view no longer invalidates the player's seat. Actual missing/expired/unauthorized seats still return to recovery.
- Delayed polling/action responses are ignored after their credential has been forgotten or replaced. Choosing another room cannot be undone by an old resume response.
- A failed server poll disables play controls. Visibility return, network return and page restoration request a fresh snapshot before permitting another move.
- Background polling no longer erases action error feedback. An uncertain action keeps the exact request identity for retry, even when polling resumes successfully.
- Destructive room confirmations are tied to the room code and revision shown when opened. If another player changes the room, the stale confirmation is discarded for review instead of applying it to a changed seat/round.
- Lobby messages now explain cancellation/rematch/host changes. Disconnected opponents are identified even when it is their turn; the turn highlight remains visible. The action banner distinguishes a pending confirmation from an actionable turn.

## Mobile refinements

Room and remove-player controls have 44px minimum targets. Long player names can wrap in the hand heading, result heading, history and host label, while the table label truncates without pushing out its combination label. Score counts retain their width. The room strip can wrap on narrow screens.

Tall results use safe vertical alignment so their top stays reachable when content exceeds the viewport; they retain scrolling and bottom safe-area padding. Short landscape phone widths (701–1000px, at most 500px high) keep the action bar at the bottom while the playing surface scrolls, with clearance under the last cards. Portrait and large-desktop compositions are preserved.

These are source/cascade checks, not claims about Safari/Chrome rendering. The existing static audit covers 320, 360, 390, 430, 700, 768, 1024, 1440, 1536, 1920 and 2560px widths plus 844×390 landscape. It verifies frame rules, card width budgets, fixed/flow action behavior and effects-off styling. Actual fonts, rasterization, scrolling and notch behavior still require browser/device review.

## Validation

- Engine: 11 tests, including 100 seeded complete rounds with legal moves, card conservation and resumable state.
- API: six scenarios using the actual API handler and SQLite-backed D1 interface. Covers private hands, four seats, duplicate and simultaneous requests, stale revisions, forged cards, three complete rounds, zero-sum/cumulative scores, replacements, expiry, host permissions and the corrected offline grace period.
- React room client: create/join/ready, lost response retry, deal/play, refresh to the same hand, invitation versus a different saved room, and a delayed resume response after choosing another room.
- Four React clients: real room components and API, one DOM harness with per-client credentials. Cards are selected and played through the UI. Includes double taps, a server commit whose response is lost, a failed sync, refresh, long player names, permission rejection with a valid room, stale confirmation, result recovery and rematch.
- The endurance run completed four consecutive matches (186 turns), rotated host through all four seats after four separate 62-second real-time absences, and started round 5 with correct cumulative totals. It ran for approximately 663 seconds. Sampled Node heap after the four rematches was 73, 50, 82 and 49 MB; these are harness samples, not a phone memory benchmark.
- A final fast four-client regression on the final UI logic completed 68 turns and rematch.
- A normal-polling run completed a 35-turn match, waited 62 real seconds after host exit, recovered from inside the result modal and started round 2 with preserved totals. Duration about 160 seconds. No fast clock was used for that grace period.
- An earlier normal-polling attempt had a 120-second test deadline. The scenario continued through 52 turns and rematch, but the test was cancelled by that deadline; it is not counted as a passing run. The explicit long-duration mode uses a suitable bounded deadline.
- Artwork and presentation regression tests retain all 52 accessible card identities, exact number-pip counts, all five character rotations, cut-in timing, motion-off behavior and saved audio settings.
- Targeted strict TypeScript, Worker build and built-route checks validate the final source before publication.
- Read-only production error logs returned no error events for the preceding 180-minute query. This is a limited log sample, not proof that every multiplayer path has been exercised in production.

## Testing boundary

The managed browser-control skill is not available in this session. Some polling activity in the long DOM harness produced React act-scope warnings; assertions were evaluated after controlled waits and the complete scenario passed. These warnings are test-harness scheduling output, not browser-console evidence. No direct cloud-browser navigation, device screenshot review, physical four-phone match, Safari audio audition or device frame-rate measurement is claimed. DOM geometry and network failures are simulated; the server rules/SQL/API and the long test timers are real local execution. No production room or user data was modified by the tests.

A physical-device check should still cover iPhone/Android portrait and landscape, selecting edge cards above the home indicator, native sharing, browser Back/return, backgrounding one phone, audio after an iOS interruption, long result scrolling and reduced motion.
