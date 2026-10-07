# Stage 5 — drift and mini-turbo

Base: published v149, commit `9cc8a14955cbc98744ee078df32e47e853ee2b4b`. Changes remain confined to Harbor Racing and its regression tests. Existing Neon Racing and other Arcade games remain available.

## Playing

Hold Drift while steering, then release after the charge bar turns blue or gold. On keyboard, use Shift with A/D or arrow keys. Automatic throttle permits two-thumb touch play: steer with the left thumb and hold/release Drift with the right. Countersteering widens the turn. The initial drift direction stays locked until release.

Two touches can arrive up to 0.22 seconds apart. Holding Drift indefinitely before steering does not automatically start one later. Braking, leaving asphalt, touching a barrier, recovery and finishing cancel the charge and any active boost. Pausing cancels an unfinished charge without awarding a turbo; an already released boost freezes and resumes with the simulation. A cancelled touch cannot award a turbo. Multiple input sources remain independent.

## Initial tuning

| Parameter | Value |
| --- | --- |
| Minimum entry speed | 11 m/s (39.6 km/h) |
| Blue charge | 0.8 seconds of qualifying slide |
| Gold charge | 1.65 seconds of qualifying slide |
| Blue boost duration | 0.7 seconds |
| Gold boost duration | 1.15 seconds |
| Boost target | 33 m/s (118.8 km/h) |
| Boost acceleration | 18 m/s² |

Charge requires both heading and lateral velocity in the drift direction. Tapping, standing still or simply holding Drift does not earn it. Boost accelerates toward its target rather than teleporting speed, remains steerable and decays back toward normal speed when over. Both charge levels use the same maximum speed, with different durations.

## Presentation

Added a compact charge/remaining-time bar with both text and color distinctions, a highlighted held Drift button, tire tracks, blue/gold rear-wheel sparks, driver lean and a short matching exhaust plume. Results include the number of mini-turbos used in that run; durable records remain stage 23.

Effects use fixed pools: 96 short skid segments and 48 sparks. Inactive pools skip matrix updates. Reduced-motion mode removes these particles and the exhaust plume while preserving the informative HUD. No screen flash or new camera shake. The scene remains a character/environment blockout; final actor art is not part of this stage.

## Verification and findings

Eight focused drift checks cover entry conditions and input buffering, two charge levels, countersteering, cancellation, real-course release and steering out, cadence determinism at 15/30/60/120/144 Hz, pooled effects and active-exhaust framing.

The initial straight full-steering attempt could earn blue but ran off the road before gold. Controlled countersteering earns both tiers on the actual course, and the earned boost survives steering out. An exploratory sweep used a deterministic scripted driver at 96 evenly spaced course positions:

| Starting speed | Blue earned / survives 0.35 s | Gold earned / survives 0.35 s |
| --- | --- | --- |
| 16 m/s | 96 / 96 | 96 / 96 |
| 23 m/s | 96 / 96 | 96 / 79 |
| 28 m/s | 96 / 96 | 80 / 70 |

These are coverage observations, not human success rates. The script always starts from the outside of a turn and uses one fixed steering strategy. Gold at full speed needs more room and better exit timing; not every position supports that strategy. Both tiers are achievable without leaving asphalt. Do not interpret this as final balance approval.

Adding the exhaust exposed a test issue: Three's `Box3.setFromObject` includes hidden VFX. Physical-body checks now use visible mesh bounds. A separate test explicitly enables the exhaust at 33 m/s and projects 864 course/heading/aspect combinations: maximum absolute viewport coordinates X 0.905, Y 0.624, within the frame.

All 23 physics/camera/drift tests pass, including the unchanged baseline scripted three-lap time of 104.20 seconds. The React/Three integration check with a mocked GPU renderer passes: shared Shift keys, charge display, release reward, frozen boost on pause, cancelled touch, recovery, pause during charge, existing input release/context-loss/retry/cleanup. Strict scoped TypeScript compilation passes.

## Open quality gate

The required Sites control-browser capability is unavailable in this environment. No actual GPU screenshot, phone FPS measurement, or human driving-feel approval is claimed. Stage 5 is implemented, but its first driving-feel gate remains open. A browser/device playtest must assess how readable the sparks are, thumb ergonomics, turn exit control and boost satisfaction. Build and publish outcomes are in Sites version history.
