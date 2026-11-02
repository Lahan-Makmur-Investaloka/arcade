# Stage 3B — motion and audio audit

Date: 4 October 2026. Extends published version 140; preserves original cast, deck, lobby, shared rules and room protocol.

## Presentation timing

| Action | Behavior |
| --- | --- |
| Deal | 16 representative back-only flights to the four seats; 65ms spacing and 300ms travel. The actual deal remains 52 cards / 13 per player. Opening controls unlock after 1450ms, or 200ms with motion off. |
| Played cards | Measured source-to-slot travel, 420ms plus 32ms per card; five cards finish at 548ms. Only cards already committed to the public table are rendered. |
| Impact / turn | Small local settling motion and a brief turn-banner transition after arrival. No global screen shake. |
| Combination / win | Closeup after arrival; 1350ms duration. The result waits 2100ms so the final card and closeup can finish. |
| Three passes | A 280ms sweep of the former public pile; cloned decoration is inaccessible and cannot intercept taps. |
| Hand reflow | 240ms movement of surviving cards; sorting preserves selection transforms and does not cancel a table arrival cue. |

The engine commits immediately. New committed moves replace obsolete presentation rather than queueing stale moves. There is no presentation timer that authorizes a game action or room mutation.

## Lifecycle and accessibility

- Effect delivery requires a contiguous sequence in the same room/round. Initial snapshots, repeat responses and reconnect jumps are not animated or sounded as new moves.
- Menu, hidden tab, disconnect, reduced-motion change, scroll/resize and unmount cancel relevant animations, timers and temporary pile nodes. Returning does not replay missed moves.
- Animasi OFF / reduced motion preserve audio events and show the current table immediately. Unsupported animation APIs degrade to static rendering.
- Audio is off by default. Restoring an enabled preference does not create or start an AudioContext before an explicit gesture. Music is separately opt-in. Both volume settings persist locally.
- The eight-bar 104-BPM music is an original code-composed instrumental, not a sampled or licensed commercial recording. It pauses in menus/lobby/results and while hidden. A muted or zero-volume music bus allocates no scheduled music voices.
- Audio uses separate buses, short envelopes, a master compressor, cached noise buffers and bounded source counts. Source nodes disconnect at completion; dispose closes the context and clears the sequencer.
- Native labelled range controls and switches support keyboard use. The settings dialog retains its scrollable maximum height.

## Checks performed

- Strict targeted TypeScript check for game, geometry hook and audio implementation.
- Geometry/animation simulation verifies the actual starting delta, delayed landing, sort during flight, cancellation, hidden-tab/menu behavior, sequence jumps, table clearing and 16 back-only deal flights. Simulated geometry is not a browser screenshot.
- Five cast rotations exercise select/cancel/play, delay before the correct closeup, Animasi OFF, music enabling, master mute, separate volume persistence and animation cleanup.
- Audio graph tests exercise explicit unlock, all seven cues, independent levels, menu pause, one minute of scheduled music, hidden-tab suspension/resume, zero volume, mute, unsupported audio and disposal. These validate behavior and resource bounds, not real-device listening quality.
- A full practice round with real bot/motion timer durations completed in 55 turns / 14 player actions. Menu pause, hidden-tab pause, duplicate taps, result ordering, rematch and leaving all passed. The DOM harness sampled roughly 23–44 MB of JS heap during the successful run; this is not a phone memory benchmark.
- Responsive cascade / width-budget checks retain existing card framing and controls across 320–2560px. No new image downloads or backend dependencies are introduced by Stage 3B.

## Limits

The managed browser-control skill is unavailable. Safari/Chrome rasterization, physical-device frame pacing and actual speaker/headphone listening have not been verified. Two earlier full-round DOM harness attempts exhausted memory. The harness was changed to advance timer stages in small real-time increments and to use compact assertions instead of comparing entire DOM objects. The subsequent complete-round run passed; those harness failures are not evidence of phone memory use. No claim of browser/device visual QA is made.

The broader four-client reliability and physical mobile review remain Stage 4.
