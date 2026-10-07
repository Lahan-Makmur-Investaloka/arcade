// Timers advance only while a boss fight is active and gameplay is unpaused.
export type SupplyClock = { boss: string; coins: number; health: number };
export function bossSupplies(clock: SupplyClock, boss: string | undefined, left: number, right: number, dt: number, coinCount: number, chestCount: number, rng: () => number) {
  const drops: { kind: 'coin' | 'health'; x: number }[] = [];
  if (!boss) { clock.boss = ''; return drops; }
  if (clock.boss !== boss) { clock.boss = boss; clock.coins = 8; clock.health = 24 + rng() * 8; }
  clock.coins -= dt; clock.health -= dt;
  const width = right - left - 160;
  if (clock.coins <= 0) {
    clock.coins = 8;
    for (let i = 0; i < Math.min(3, Math.max(0, 12 - coinCount)); i++)
      drops.push({ kind: 'coin', x: left + 80 + width * (i + .2 + rng() * .6) / 3 });
  }
  if (clock.health <= 0) {
    clock.health = 24 + rng() * 8;
    if (chestCount === 0) drops.push({ kind: 'health', x: left + 80 + rng() * width });
  }
  return drops;
}
