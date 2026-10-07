// Rendering may run at 30/60/120 Hz; race rules always advance at 120 Hz.
// Long stalls are bounded. Hidden tabs pause explicitly rather than catch up.
export const RACE_STEP = 1 / 120;
const MAX_FRAME_TIME = .25;
export type RaceClock = { previous: number; remainder: number };
export const createRaceClock = (now: number): RaceClock => ({ previous: now, remainder: 0 });
export function advanceRaceClock(clock: RaceClock, now: number, running: boolean): number {
  const delta = Math.max(0, Math.min(MAX_FRAME_TIME, (now - clock.previous) / 1000));
  clock.previous = now;
  if (!running) { clock.remainder = 0; return 0; }
  clock.remainder += delta;
  const steps = Math.floor((clock.remainder + 1e-10) / RACE_STEP);
  clock.remainder = Math.max(0, clock.remainder - steps * RACE_STEP);
  return steps;
}
