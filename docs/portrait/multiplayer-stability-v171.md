# Multiplayer stabilization — v171

## Changes

- Persist the exact in-flight action with the saved seat before sending it. After reload, an unconfirmed action remains available through Coba lagi with its original request ID.
- Definitive responses clear the pending action; transport errors and server 5xx retain it. Server receipts prevent duplicated plays, readiness changes and leave actions.
- Changing seat credentials clears stale room/retry state so another room cannot inherit the previous room's pending action.
- A returning member retains their session points even if they rejoin in another seat. Historical session totals and seat totals remain consistent.
- No skill, hand geometry, audio preference, room permissions, or database schema changes.

## Verification

- Six SQLite-backed API tests pass: four private seats; create/join retry; simultaneous play retries; stale revision and forged-card rejection; three complete rounds and rematches; one-minute disconnect grace; host takeover; cancellation; kick/replacement; expiry and validation. Added return-to-room score assertion.
- React integration passes with isolated storage and real API handler: create/join/ready/deal/play/reload, invitation routing, delayed stale response. Added lost-response + reload + retry checks for ready, play and leave; exact IDs reused, play sequence unchanged, removed seat's leave receipt resolves successfully.
- Three session tests and eleven engine tests pass, including 100 seeded rounds and score persistence.
- Strict TypeScript validation passes for multiplayer and its imported room/game code.

## Limits

Tests use isolated SQLite and simulated clients. No live production room or four physical devices were used, and mobile Safari/network switching remains a device-level verification item. Browser layout was not changed in this patch.
