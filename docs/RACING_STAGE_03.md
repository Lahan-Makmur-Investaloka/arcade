# Racing stage 3 — handling foundation

5 October 2026. Continues v147. Only Harbor handling and its existing actor motion changed; Neon and other games preserved.

## Changes

- Progressive acceleration: strong launch, gradually tapering engine force near top speed. Cruise remains 23m/s (82.8km/h), extra gas caps at 28m/s (100.8km/h). Releasing extra gas coasts back to cruise rather than abruptly clamping speed.
- Brake overrides throttle and stops fully without creep. Normal dry-surface deceleration is 19m/s². Returning from the shoulder accelerates smoothly instead of snapping back to road speed.
- Replaced direct lateral displacement with an assisted bicycle model in course coordinates: steering wheel angle, yaw, heading offset, tire grip and lateral velocity. Steering sensitivity decreases with speed. Releasing steering recenters progressively; velocity does not instantly disappear.
- Course-relative forward progress accounts for heading and the radius of an offset racing line. Heading is bounded to keep this arcade prototype recoverable. The explicit 70% road-yaw assist is a tuning choice for touch play, not a claim of realistic vehicle physics or full free-driving simulation.
- Wheel steering and rendered kart heading now follow simulation state. Chassis pitches under acceleration/braking; brake lights brighten while braking. Reduced-motion mode suppresses chassis pitch/lean/bob, retaining essential heading/wheel motion.
- Input sources are tracked independently. W plus ArrowUp, touch plus keyboard, or multiple fingers do not cancel each other when one source releases. Blur/pause/recovery clears all held sources. Keyboard-held control buttons release on focus loss.

## Verified

Six course/simulation/geometry tests and the real React UI test with mocked GPU adapter. New cases cover acceleration taper, braking with gas held, no stationary strafing, left/right symmetry, smooth steering release, off-road/re-entry, motion reset, and simultaneous accelerator keys. Existing tests exercise finish, pause/resume, touch capture loss, renderer retry and cleanup.

Measured in deterministic simulation, not physical-device measurements:

- Full brake from 100.8km/h stops in **20.51m** on the straight dry test course.
- Repeatable simple test driver finishes Harbor three laps in **104.20s**, identical at 15, 30, 60 and 120 render updates per second.
- Harbor is still 749.1m. Stage-2 baseline time (98.98s) is historical and does not apply to this handling version.

Strict scoped TypeScript and full production build/SSR checks are required before publishing. No new art assets or final vehicle models are claimed. Actual WebGL, human driving feel, touch usability and device FPS are still unverified because the supported browser QA skill is unavailable. These simulation checks do not replace a driving playtest.

## Next

Stage 4: camera and collision refinement. Stage 5: deliberate drift and mini-turbo. Current grip-based cornering is not yet the drift mechanic. Continue the scheduled character/asset work after the driving foundation.
