# TEKAD Racing — 26-stage rebuild

Owner: Dax. Approved 5 October 2026, Asia/Jakarta. Target allocation roughly 30 minutes per stage, not a guarantee of production time or commercial-console parity. Continue the existing Arcade and `/tekad-racing` route. Original TEKAD world and assets; no Nintendo characters, logos, audio or ripped models.

## Product decision

Build an original mobile-first 3D kart racer. Five TEKAD racers, two circuits, four bot opponents, drift/mini-turbo, five item families, quick race, short cup and results. Multiplayer is a separate future project. A playable quality slice comes before multiplying content. A polished lobby or concept image does not pass the gameplay quality gate.

**5 October visual revision:** Dax rejected the procedural stage-6 Timmy and explicitly approved trying **2.5D** after viewing an anime concept. Harbor now uses an eight-view illustrated Timmy+kart actor inside the existing 3D course. This is a bounded visual experiment, not completion of the full-3D character target or approval to produce the remaining cast. Stage 6 is reopened; stages 7–8 remain on hold until the actual game look is reviewed. See `RACING_ANIME_TRIAL.md`.

Visual thesis: a bright, tactile harbor race with turquoise water, warm white masonry, botanical green and readable red/white curbs. Strong silhouettes, soft contact shadows, saturated racer accents and a close chase camera. First slice: Timmy's blue kart, one 60–90 second harbor loop, a broad first turn, narrowing bridge, hairpin and recovery straight. Exact timing is a target to tune, not measured yet. No jump/glider/underwater systems in the initial scope.

Stage-1 concept art in `docs/assets/racing-harbor-concept-v1.png` is art direction ONLY. It is not the engine, a measured device screenshot, a finished model, or proof that the visual target is achieved. Generated with imagegen using the existing Timmy racing sprite and Arcade racing hero as identity references. Inspected caveats: the kart occupies too much of the frame for actual racing, and the bridge is a scenic landmark rather than a visibly connected road segment. Runtime camera should reveal more road; level geometry must make the bridge driveable. This image is not loaded by the game.

## Audit of v145

Source inspected: `app/tekad-racing/racing-game.tsx` (715 lines before this stage), `page.tsx`, Racing rules in `app/globals.css`, all five racing asset paths. Timmy's actual sheet visually inspected.

| Area | Observed implementation | Consequence / decision |
| --- | --- | --- |
| Renderer | 960×540 Canvas2D; 6px road strips; depth from a power curve | Pseudo-3D. No world camera, elevation mesh, road normals or spatial shortcuts. Replace renderer for the new slice. |
| Circuit | Sinusoidal curve and width functions over a 12,000-unit loop | Keep existing playable circuit during transition; new road must have a real shared centerline. |
| Minimap | Independent decorative loop, not derived from road curvature | New minimap must sample the same course data as physics and renderer. |
| Kart/driver | Five 760×950 sheets, 4×5 cells of 190px; 2.7MB combined | Preserve temporarily. Not reusable as articulated 3D models. Repeated idle frames and few steering poses cannot carry the final animation target. |
| Simulation | Rules, drawing, input and React UI coupled in one RAF callback | Separate model, simulation, rendering and UI incrementally, not a site-wide rewrite. |
| Timing | Per-frame dt capped at .033s | Racing slows below ~30Hz; stage 1 replaces with bounded fixed 120Hz updates. |
| Pause | Paused screen also exposes character picker; continue calls startRace | Can reset the race and replace opponents mid-session. Fixed in stage 1. |
| Input | Global keys; no blur/visibility clearing | Held steering can survive app switching. Fixed in stage 1. |
| Opponents | Distance/lane heuristics; no planned world-space racing line | Reuse roster and intent only. New AI follows the same physical course and checkpoints. |
| Items | Turbo, shield, instant pulse; periodic single pickup | Retain existing behavior during transition. Final projectiles need travel, impact and target feedback. |
| Character skills | Five timed mechanics already exist | Preserve in current game; balance during new item/character stage. Do not silently delete capabilities. |
| Presentation | Large prototype introduction, tiny labels, old letter logo; picker clipped inside 16:9 canvas | Stage 1 uses current red icon, compact title, independent setup height and real pause screen. Final lobby deferred. |
| Records | Local best-time key `tekad-racing-best` | Existing device record retained. New course/version needs separate records so times are comparable. Durable new results later. |

## Architecture for the new slice

- Keep React for selection, HUD, controls and results; no per-frame React scene construction.
- Plan a lazily loaded Three.js/WebGL renderer only on the Racing route. Dependency and renderer feasibility are stage 2 work, not yet implemented or measured.
- One course definition drives mesh, progress, checkpoints, AI path, minimap and resets. Represent a closed sampled centerline with width/elevation, tangent/normal and arc length.
- Simulation at a fixed tick. Input sampling separate from render cadence. Stage-1 clock is now reusable.
- Event stream for drift thresholds, boost, collision, item launch/impact, lap, finish. Animation, sound and particles consume events; never determine race outcomes.
- Kart visual root separated from collision body: steering wheels, spinning wheels, lean, suspension travel and driver pose. Do not bake all effects into a single rear-facing PNG.
- Original 3D asset production is a major feasibility risk. Raster concept art cannot be treated as a GLB or rig. Stage 2 must prove an achievable runtime asset approach; stage 8 approves the first complete Timmy/kart pair in motion before producing four more.
- Pool particles and projectiles; share materials/geometries; cap device pixel ratio. Adaptive quality affects visuals, not speed, collisions or item behavior.

## Stage ledger

| # | Work | Acceptance output | State |
| --- | --- | --- | --- |
| 1 | Audit, production brief and lifecycle foundation | Latest source audited; pause/input/timing defects fixed; 26-stage ledger | Complete; publication recorded by Sites version history |
| 2 | Renderer and asset feasibility | Original articulated 3D kart, road geometry, chase camera, map and playable solo loop on existing route; actual GPU/device validation still outstanding | Implemented; see stage-2 report |
| 3 | Acceleration and steering | Progressive throttle, brake priority, assisted heading/lateral momentum, input ownership; deterministic cadence tests | Implemented; see stage-3 report |
| 4 | Chase camera and collisions | Fixed-tick interpolated camera, angle-aware continuous barriers, differentiated contact and animated recovery | Implemented; see stage-4 report; device/visual gate outstanding |
| 5 | Drift and mini-turbo | Two-tier charge/release, countersteering, pooled tire effects, touch/keyboard controls | Implemented; see stage-5 report; human driving-feel gate still open |
| 6 | Timmy design and kart modeling | Anime 2.5D trial replaces rejected procedural actor in Harbor; legacy source retained | Reopened; user visual approval and actual GPU/device QA outstanding |
| 7 | Timmy driving animation | Steering, driver lean, wheels, suspension, drift, boost | Pending |
| 8 | Timmy reactions and integration | Impact, recovery, finish; first complete animated actor gate | Pending |
| 9 | Eldric and Kirana assets | Two original kart/driver sets with consistent scale | Pending |
| 10 | Adelia and Dylan assets | Two original kart/driver sets; correct hijab/hair identities | Pending |
| 11 | Full-cast animation integration | Shared animation contract, distinct reactions; no frozen passengers | Pending |
| 12 | Harbor course geometry | Closed loop with bridge, broad corners and recovery zones | Pending |
| 13 | Harbor environment assets | Modular architecture, props, surfaces, vegetation, coherent lighting | Pending |
| 14 | Harbor motion and VFX | Water, flags, environmental motion, contact shadows; first gameplay visual gate | Pending |
| 15 | Second circuit geometry | Distinct flow and driving challenges; no recolor-only course | Pending |
| 16 | Second circuit art | Its own environment kit, lighting and animated landmarks | Pending |
| 17 | Opponent AI | Four bots, corner speeds, overtaking and recovery | Pending |
| 18 | Race rules | Countdown, lap/checkpoint order, ranking, final order | Pending |
| 19 | Items | Five readable item families, pickups, travel, impact, immunity windows | Pending |
| 20 | Skills and balance | Existing cast identity preserved; item/skill interactions tuned | Pending |
| 21 | Lobby, selection and HUD | Game-native launch flow, mobile-safe controls and readable state | Pending |
| 22 | Audio and presentation | Engine feedback, drift/impact cues, transitions and animated podium | Pending |
| 23 | Cup and records | Two-course cup, results and correctly scoped durable records | Pending |
| 24 | Mobile performance | Measure actual supported device/browser performance; optimize worst cases | Pending |
| 25 | Complete gameplay regression | Full races all characters/courses, interruptions, resets and item combinations | Pending |
| 26 | Final art/motion audit and release | End-to-end coherence, known limitations recorded, production deployment | Pending |

## Animation and asset inventory — acceptance scope

- Each kart: separate wheels, steering response, spinning wheels, chassis lean, suspension, exhaust/boost origin and driver seating alignment. Five readable silhouettes, not only five paint colors.
- Each driver: idle readiness, left/right steering lean, left/right drift, boost brace, hit reaction, recovery, win and loss. Separate reusable skeletal/procedural motion from character-specific expressions where feasible.
- Effects: tire dust/skid, two drift charge stages, turbo trail, item acquisition, projectile travel, impact, shield break, recovery, finish. Avoid full-screen flashing and large camera shake; provide reduced effects.
- First course: road/curb/barrier kit, start gate, bridge, harbor buildings, foliage, flags, water, collision/recovery bounds, landmark groups. Second course must be a distinct asset set and driving rhythm.
- UI: five portraits/selection poses, item icons, readable lap/position treatment, selection transitions, countdown, finish and podium. No debug labels in player flows.
- Audio needs authorized originals or appropriately licensed sources. Asset provenance belongs in the repository; no ripped Mario Kart material.

## Quality gates and performance targets

Targets, not measured promises: 60fps on a capable recent phone, stable 30fps on lower quality; no input penalty at either cadence. Responsive portrait navigation; landscape racing prioritized without forcing orientation. Touch controls at least 48px, visible safe-area margins, no essential labels hidden behind controls. Drivers must remain readable in chase view and opponents identifiable at normal racing distance.

Stage 5: does driving feel good without decoration? Stage 8: does the complete Timmy actor feel alive in motion? Stage 14: does an actual recorded race visually meet the intended direction? Do not pass these gates with a still concept image or a static lobby.

Actual browser/GPU/device QA currently blocked: this environment's Sites preview requires `$control-browser`, which is not available in the advertised skills. Do not substitute a live-site fetch or a fake canvas test for visual/performance verification. Stage-1 tests use a mocked drawing context only for React lifecycle and game-rule execution. Real renderer and touch QA remains an explicit outstanding gate.

## Stage 1 changes and verification

Current playable renderer and assets remain while the replacement is built. Added `race-clock.ts`, setup/pause separation, resume without reset, character lock during a race, loss-of-focus pause, cancelled pointer release, guarded localStorage, red brand icon and a compact shell. Existing records are not migrated or deleted. No Big Two or other game behavior changed.

Verification: `tests/racing-foundation.test.mjs` covers equal simulated time at 15/30/60/120Hz, uneven frames and bounded long stalls; optional actual React lifecycle test covers pause/resume, blur, pointer cancellation, full three-lap finish under blocked storage, selection and rematch. Scoped TypeScript compilation and complete production build are required before release. No browser screenshot or device FPS result claimed.
