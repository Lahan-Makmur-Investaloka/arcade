# Racing stage 2 — 3D feasibility slice

5 October 2026. Continuation of v146 on the existing TEKAD Arcade.

## Delivered

`/tekad-racing` now opens **Pelabuhan**, a coherent solo training course: Timmy, three laps, automatic throttle, extra gas, steering, brake, pause/resume, explicit restart, return-to-road, time and actual course minimap. The existing complete five-character race remains available as **Sirkuit Neon**, including its bots/items/skills and device best time. Harbor training does not write to the old course record key. Big Two and all other games are untouched.

Three.js 0.180.0 is pinned and lazily imported by the Racing runtime. Existing framework, package manager and deployment bindings preserved. World is actual world-space mesh geometry rendered by WebGL, not a generated background with a sprite pasted on top.

### Course

- Closed 749.1m arc-length sampled Catmull-Rom course, 1,024 shared samples; real elevation reaching approximately 8m across the bridge section.
- Road, shoulder, red/white curb, border strips, guard walls and bridge supports generated from the same course used for kart placement, follow camera and minimap.
- Harbor village blockout: white buildings, terracotta roofs, window strips, trees, water plane, distant terrain, start gate and chequered line.
- 451 instanced props across batches, 112 mesh objects/batches including the actor in the initial scene. These are geometry inventory counts, NOT measured GPU draw calls or FPS.
- Moving flags; sun/contact shadows, fog, hemisphere lighting, reduced-motion behavior. Lightweight graphics option disables shadow rendering and caps pixel ratio at 1.

### Original kart feasibility

`harbor/kart.ts` contains an original articulated **blockout**, not the final character asset. Named vehicle root, suspension chassis, independent front steering pivots, four wheel spin pivots, driver lean and head turn. Engine housing, cooling fins, exhaust, tail lights, seat, steering wheel, blue bodywork, black hair and glasses establish Timmy's identity at prototype fidelity.

The runtime contract is demonstrated with actual geometry and working pivots. This does not make the final character modeling task complete: face, hands, silhouette refinement, textures, clothing, expressions and higher-quality deformation remain stages 6–8. Other four 3D racers are not claimed as delivered. Their existing sprite versions remain playable in Neon.

### Simulation and lifecycle

Stage-2 baseline remains road-relative. It supports acceleration, steering smoothing, road-surface slowdown, boundary collision, braking and recovery without increasing progress or resetting elapsed time. Wheel rotation uses actual tire radius. It is deliberately not yet a free-heading/drift physics implementation; handling and drift are stages 3–5.

120Hz fixed simulation with bounded recovery; 15/30/60/120Hz test cadences produce identical three-lap results. Deterministic test driver completes in 98.98s (about 33s/lap); this is a test result, not a claim about typical human lap time. The earlier 60–90s single-lap concept remains a later course-tuning target.

Blur/hidden tab pauses, pointer loss clears controls, resume preserves progress, explicit new race resets. Renderer/scene/material/geometry/observer/RAF cleanup runs on route/mode switch. WebGL/context failures surface a useful message with retry and access to Neon. The UI can retry with a fresh canvas rather than reuse a lost context.

## Verification and honest boundaries

- `tests/racing-harbor.test.mjs`: closed seam, lateral offset, minimap bounds, bridge width clamp, deterministic full race at four cadences, recovery invariant, boundary collision, braking, finite geometry, articulated pivots and instance count.
- `tests/racing-harbor-ui.test.mjs`: real React, real Three scene/simulation; mocked GPU adapter only. Exercises loading/start, held touch and lost capture, pause/resume, blur, recovery, context loss, failed retry, successful retry and cleanup.
- Stage-1 legacy Racing regression remains available and is rerun for Neon preservation.
- Scoped strict TypeScript compilation; full production build and rendered route checks before publication.
- Offline CPU projections of the real scene checked camera framing at 0%, 25%, 56% and 77%. These are diagnostic mesh projections, NOT WebGL screenshots; painter-order artifacts and absence of GPU shadows/water are not evidence of the final render. The kart occupies roughly a fifth of image height, leaving visible road ahead.
- **Actual WebGL/browser/device verification is still unavailable:** required control-browser skill absent. Do not claim shader correctness, GPU performance, real touch feel or mobile screenshot audit based on the tests above. Stage 24 remains required, and earliest available actual device validation should happen before the art direction is considered proven.

## Next stage

Stage 3: acceleration/steering and control feel. Preserve this renderer/actor contract. Tune turn response, braking, speed feedback and camera interaction with measurable cases. Stages 4–5 finish chase-camera/collision behavior and drift/mini-turbo. Do not count the present blockout as final visual quality or skip the later asset/animation stages.
