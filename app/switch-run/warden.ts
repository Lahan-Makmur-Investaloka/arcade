import { drawBossHealth } from "./boss-health";
export const ARENA_LEFT = 18700, ARENA_ENTRY = 19000, ARENA_GATE = 19980, WARDEN_HP = 60;
// The head extends 26px above the highest step: walking cannot bypass the
// Warden, but a normal jump still clears it. Keep feet on the arena floor.
export const WARDEN_HEIGHT = 196;
export function arenaSteps(floorY: number) {
  return [
    { x: 18810, y: floorY - 85, w: 160, h: 18 },
    { x: 19050, y: floorY - 170, w: 170, h: 18 },
    { x: 19320, y: floorY - 85, w: 160, h: 18 },
    { x: 19560, y: floorY - 170, w: 170, h: 18 },
    { x: 19790, y: floorY - 85, w: 150, h: 18 },
  ];
}
export type Warden = { x: number; y: number; w: number; h: number; vx: number; phase: number; hp: number; maxHp: number; alive: boolean; engaged?: boolean };
export type Shockwave = { x: number; y: number; w: number; h: number; vx: number; life: number };
export const wardenStage = (phase: number) => phase < 1.5 ? "approach" : phase < 2.3 ? "charge" : phase < 3.3 ? "dash" : "recover";
export function stepWarden(boss: Warden, playerX: number, dt: number): Shockwave[] {
  if (!boss.alive) return [];
  const before = boss.phase;
  boss.phase = (boss.phase + dt) % 6;
  const rage = boss.hp <= boss.maxHp / 2;
  if (before < 1.5 && boss.phase >= 1.5) boss.vx = playerX < boss.x + boss.w / 2 ? -1 : 1;
  const stage = wardenStage(boss.phase);
  if (stage === "approach") boss.x += Math.sign(playerX - boss.x) * 35 * dt;
  if (stage === "dash") boss.x += boss.vx * (rage ? 225 : 180) * dt;
  boss.x = Math.max(ARENA_LEFT + 24, Math.min(ARENA_GATE - boss.w, boss.x));
  if (before < 2.3 && boss.phase >= 2.3) {
    const x = boss.x + boss.w / 2, y = boss.y + boss.h - 16;
    return [-1, 1].map(direction => ({ x, y, w: 30, h: 16, vx: direction * (rage ? 280 : 220), life: 4 }));
  }
  return [];
}
export function clampArenaPlayer(x: number, width: number) { return Math.max(ARENA_LEFT + 24, Math.min(ARENA_GATE - width, x)); }

export function drawBossFight(ctx: CanvasRenderingContext2D, boss: Warden | undefined, hazards: Shockwave[], camera: number, playerX: number, width: number) {
  ctx.save();
  for (const wave of hazards) if (wave.life > 0) {
    const x = wave.x - camera;
    ctx.fillStyle = "#d574ff55"; ctx.fillRect(x - 6, wave.y - 7, wave.w + 12, wave.h + 12);
    ctx.fillStyle = "#e8baff"; ctx.fillRect(x, wave.y, wave.w, wave.h);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 5, wave.y + 2, 5, wave.h - 4);
  }
  if (boss?.alive && playerX >= ARENA_LEFT) {
    const gate = ARENA_GATE - camera;
    ctx.fillStyle = "#b04bff55"; ctx.fillRect(gate - 5, 0, 16, 540);
    ctx.fillStyle = "#edbaff"; ctx.fillRect(gate, 0, 4, 540);
    if (boss.engaged) {
      drawBossHealth(ctx, boss, "VOID WARDEN", "#c777ff", width);
      ctx.font = "bold 11px ui-monospace, monospace"; ctx.textAlign = "center";
      const stage = wardenStage(boss.phase);
      ctx.fillStyle = stage === "charge" ? "#ffd783" : "#c9c2de";
      ctx.fillText(stage === "charge" ? "BERSIAP! LOMPATI GELOMBANG" : stage === "recover" ? "SERANG SEKARANG · STORM TERTAHAN" : "GERBANG TERKUNCI · KALAHKAN BOSS", width / 2, 158);
      if (stage === "charge") {
        ctx.fillStyle = "#ffb76288"; ctx.fillRect(boss.x - camera - 45, boss.y + boss.h - 3, boss.w + 90, 6);
      }
    }
  }
  ctx.restore();
}
