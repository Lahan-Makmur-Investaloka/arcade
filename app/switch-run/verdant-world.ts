// World progression is distance-based, so existing score and live-session formats stay compatible.
export const VERDANT_START = 20_000;
export const worldName = (distance: number) => distance >= 8000 ? "Astral Sanctuary" : distance >= 6000 ? "Ember Foundry" : distance >= 4000 ? "Frostbound Citadel" : distance >= 2000 ? "Verdant Ruins" : "Earth 3000";
export type VerdantKind = "moss" | "wasp" | "golem";
export const isVerdantEnemy = (kind: string): kind is VerdantKind => ["moss", "wasp", "golem"].includes(kind);
export type Patrol = { x: number; y: number; w: number; vx: number; phase: number; homeY?: number; patrolLeft?: number; patrolRight?: number; kind: string };
export function stepVerdantEnemy(e: Patrol, dt: number) {
  const cycle = e.phase % (Math.PI * 2);
  // Golems glow while winding up, then commit to a short dash; beetles patrol and wasps sweep vertically.
  const speed = e.kind === "golem" ? (cycle < 2.6 ? .22 : cycle < 3.6 ? 4 : .65) : 1;
  e.x += e.vx * speed * dt;
  if (e.patrolLeft !== undefined && e.x < e.patrolLeft) { e.x = e.patrolLeft; e.vx = Math.abs(e.vx); }
  if (e.patrolRight !== undefined && e.x + e.w > e.patrolRight) { e.x = e.patrolRight - e.w; e.vx = -Math.abs(e.vx); }
  if (e.kind === "wasp" && e.homeY !== undefined) e.y = e.homeY + Math.sin(e.phase) * 26;
}

type Art = { background: HTMLImageElement; enemies: HTMLImageElement };
let cachedArt: Art | undefined;
export function loadVerdantArt(): Art {
  if (!cachedArt) {
    const background = new Image(), enemies = new Image();
    background.src = "/worlds/verdant-background.png"; enemies.src = "/worlds/verdant-enemies.png";
    cachedArt = { background, enemies };
  }
  return cachedArt;
}

export function drawVerdantBackground(ctx: CanvasRenderingContext2D, camera: number, now: number, width: number, height: number) {
  const art = loadVerdantArt().background;
  ctx.fillStyle = "#061b20"; ctx.fillRect(0, 0, width, height);
  if (art.complete && art.naturalWidth) {
    const tileWidth = height * art.naturalWidth / art.naturalHeight;
    const scroll = camera * .15, index = Math.floor(scroll / tileWidth), offset = scroll % tileWidth;
    // Alternate mirrored copies to remove hard seams at the panorama edges.
    for (let i = -1; i < Math.ceil(width / tileWidth) + 1; i++) {
      const x = i * tileWidth - offset;
      ctx.save(); ctx.translate(x, 0);
      if ((index + i) % 2 !== 0) { ctx.translate(tileWidth, 0); ctx.scale(-1, 1); }
      ctx.drawImage(art, 0, 0, tileWidth + 1, height); ctx.restore();
    }
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "#02131c33"); shade.addColorStop(.55, "#02151c00"); shade.addColorStop(1, "#02131cb8");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  // Sparse foreground motes move faster than the ruins and keep the play area readable.
  const opacity = ctx.globalAlpha;
  for (let i = 0; i < 24; i++) {
    const x = ((i * 139 - camera * .48 + width * 100) % (width + 40)) - 20;
    const y = 135 + (i * 71 % 360) + Math.sin(now / 1600 + i) * 13;
    ctx.globalAlpha = opacity * (.25 + (Math.sin(now / 900 + i) + 1) * .18);
    ctx.fillStyle = i % 4 ? "#88fbd8" : "#ffd277"; ctx.fillRect(x, y, 2 + i % 2, 2 + i % 2);
  }
  ctx.globalAlpha = opacity;
}

// Filled from the generated atlas's alpha bounds, maintaining consistent baseline and silhouette.
export const ENEMY_FRAMES: Record<VerdantKind, number[][]> = {
  moss: [[32,180,436,304],[20,684,494,280]],
  wasp: [[548,25,430,452],[554,515,465,470]],
  golem: [[1024,10,486,478],[995,514,525,472]],
};
export function drawVerdantEnemy(ctx: CanvasRenderingContext2D, e: {kind: VerdantKind; phase: number; w: number; h: number; vx: number; hitCooldown: number}, x: number, y: number) {
  const art = loadVerdantArt().enemies;
  if (!art.complete || !art.naturalWidth) return false;
  const frame = ENEMY_FRAMES[e.kind][Math.floor(e.phase * 1.8) % 2];
  ctx.save();
  if (e.kind === "golem" && e.phase % (Math.PI * 2) > 1.8 && e.phase % (Math.PI * 2) < 2.6) {
    ctx.fillStyle = "#ffc65b"; ctx.fillRect(x, y + e.h + 3, e.w, 3);
  }
  if (e.hitCooldown > 0) ctx.globalAlpha = .55;
  ctx.translate(x + (e.vx > 0 ? e.w : 0), y);
  if (e.vx > 0) ctx.scale(-1, 1);
  ctx.drawImage(art, frame[0], frame[1], frame[2], frame[3], 0, 0, e.w, e.h);
  ctx.restore(); return true;
}
