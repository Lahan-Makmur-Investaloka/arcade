# Stage 4 — camera, barrier contact and recovery

Continues production v148 in the existing Harbor renderer. This is an implementation milestone, not approval of final art or device performance. The user's concern about prematurely closing short stages is valid: elapsed time and automated checks alone do not establish visual quality or good driving feel.

## Changes

- Camera follows lateral kart movement, adapts its distance/FOV to portrait, clears road crests and interpolates fixed simulation ticks. Pausing freezes the displayed camera instead of snapping to a different target. Reduced motion suppresses speed zoom and recovery lift.
- Visible guardrails are continuous extrusions using the same boundary dimensions as physics. Collision bounds include kart heading and width variation along its length. Start-gate posts now stand outside the driving envelope; harbor foundations no longer sit coplanar with the road.
- Glancing and harder impacts lose different amounts of speed. Sustained scraping incurs bounded drag rather than repeated large speed cuts. Contact rearms after separation. Twelve pooled sparks show contact without screen flashes or shake.
- Recovery lasts 0.7 seconds, visibly brings the kart back to the center, stops forward progress and continues the race timer. It cannot be retriggered while active. Pause menu exposes recovery on landscape layouts, and tall dialogs can scroll from their top.

## Defects caught during this stage

The first camera revision failed the full kart projection check at extreme portrait edge positions: maximum horizontal normalized-device coordinate was 1.375, outside the viewport. Increasing lateral camera tracking and matching the aim corrected it to 0.926 or less. Continuous barriers also removed the old mismatch between isolated visible blocks and a continuous invisible collision boundary.

## Evidence

`tests/racing-camera-collision.test.mjs` exercises the real course, Three.js scene geometry and pure simulation, without a GPU:

- 5,184 static kart poses across portrait and landscape aspect ratios, steering angles, lane positions and speeds. Worst projected absolute X 0.926, Y 0.734 (viewport edge is 1).
- 288 driver sightlines raycast against the scene, including road, rails and props: unobstructed.
- 4,000 moving-frame observations across scripted driving, scraping, braking and recovery. Worst absolute X 0.894, Y 0.643.
- Camera cadence equivalence at 15/30/60/120/144 Hz; paused camera does not advance.
- Collision severity, rearming, sustained contact, steering away, angle-aware kart footprint and all barrier cross-sections agree with physical bounds.
- Recovery preserves distance, advances elapsed time, rejects duplicate activation and freezes on pause.

All 9 tests passed. The existing 6 Harbor physics/geometry checks also passed; the deterministic three-lap scripted race remains 104.20 seconds. Scene inventory is 113 mesh batches and 201 instanced props, plus one 12-instance contact effect.

The React integration test uses a mocked WebGLRenderer, with actual scene/physics. It passed input release, pause/resume, exact paused camera preservation, recovery, blur, context-loss retry and cleanup. These checks do not measure rendered pixels, touch feel, shadow quality or FPS.

## Outstanding acceptance

Actual browser/GPU and phone playtesting is still unavailable: the required Sites control-browser capability is missing. Do not label this work visually approved, mobile-performance verified or AAA quality. Timmy is still the stage-2 blockout; final character and environment assets have separate stages. Stage 5 adds drift/mini-turbo, followed by the first driving-feel gate. Build and deployment results are recorded in the corresponding Sites version history.
