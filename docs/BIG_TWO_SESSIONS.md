# Big Two session records — 4 October 2026

## Player experience

- Completed rounds show round points alongside cumulative session totals and tied ranks.
- Practice: continue rounds with the same cast, pause to the lobby, view session totals during play, explicitly end the session, and reopen the most recent 20 completed sessions.
- Multiplayer: server-owned totals, completed-round count and wins, current-session standings including former participants, host-only session completion, and a shared final summary. The host reopens the lobby through **Lanjut ronde**, retaining the readiness workflow.
- A canceled or unfinished round contributes no points. Existing scoring/penalty rules are unchanged.
- Completed room summaries remain available after the normal 24-hour active-room expiry. Only participants whose seat credentials remain valid can read them; knowing a room code is insufficient. Active rooms still expire normally if nobody ends the session.

## Persistence and scope

Practice records use the new D1 `big_two_practice_records` table. A random browser-held access capability selects a private server record; only its hash is stored. The active round itself retains the existing local resume mechanism. No account or cross-device identity was added. Losing browser storage loses the access capability, even though records are server-side.

Multiplayer aggregates are committed in the same existing optimistic-concurrency room-state update as the winning move. Member hashes remain private; the public response uses an explicit allowlist. Completed summaries preserve former participants' results without assigning those scores to a replacement player. Browser storage holds access pointers for the last 20 ended rooms, not authoritative scores.

Practice result submission uses a session ID plus monotonic round number. Duplicate matching submissions return the existing result. Conflicting results, skipped rounds, or new results after ending are rejected. Compare-and-swap retries protect concurrent requests. A lost acknowledgement can be retried without double scoring. Practice is a private session record, not a tamper-proof competitive leaderboard: final local game state is validated, but the whole bot game is not replayed server-side.

Limits: 200 completed rounds per session, 100 historical multiplayer participants, 20 completed practice sessions in the server book. New-owner and per-owner request limits bound abuse. Prior multiplayer totals are preserved on upgrade; when old score history cannot be reconstructed, the UI labels the new detailed counters as beginning with this update.

## Validation

- Actual React practice flow + SQLite endpoint: record with simulated lost acknowledgement, retry, refresh without recounting, next round, unscored unfinished-round exit, session end and history reopening.
- Actual four-client React/API simulation: private hands, duplicate taps/lost response, refresh, host recovery, next round, cancellation without points, shared session completion, and ended-summary refresh.
- API tests: two-round totals, concurrent duplicate submissions, conflicting/skipped rounds, owner isolation, archive access, host-only ending, no private-hash leakage, and reading an ended room after active expiry.
- Scoped strict TypeScript checks and production build/SSR checks.

The DOM harness validates behavior, not device rendering. No physical-phone or browser screenshot verification is claimed.
