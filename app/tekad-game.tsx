"use client";
import RunMusic from "./switch-run/run-music";
import { highHeroSection, kiranaBossSteps } from "./switch-run/hero-terrain";
import { createFrostWeather, stepFrostWeather, drawFrostWeather, type FrostWeather } from "./switch-run/frost-weather";
import { loadBeastBossArt, drawBeastBoss } from "./switch-run/beast-boss-art";
import { isBeastBoss, beastTouchesPlayer, shotHitsBeast } from "./switch-run/boss-collision";
import { HIGH_SCORE_KEY } from "./leaderboard-season";
import { verdantSection, nextForestPattern, stepForestPlatforms, type ForestPlatform } from "./switch-run/verdant-terrain";
import { EMBER_START, ASTRAL_START, FINISH, CHEAT_TARGETS, lateBossBounds, lateArt, drawLateBackground, drawLatePlatform, lateSection, spawnLateEnemies, isLateEnemy, drawLateEnemy, stepLateEnemy, stepLateBoss, drawLateFight } from "./switch-run/late-worlds";
import { GLACIER_LEFT, GLACIER_ENTRY, GLACIER_GATE, frostSection, stepGlacier, drawGlacierFight } from "./switch-run/frost-encounters";
import { bossSupplies, type SupplyClock } from "./switch-run/boss-supplies";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { VERDANT_START, worldName, isVerdantEnemy, stepVerdantEnemy, loadVerdantArt, drawVerdantBackground, drawVerdantEnemy } from "./switch-run/verdant-world";

import { loadEarthArt, drawEarthArtwork } from "./switch-run/earth-world";

import { loadCombatArt, drawEarthEnemy, drawTerrain, drawObstacle } from "./switch-run/combat-art";
import { drawCoinDetail, drawChestDetail } from "./switch-run/detail-art";
import { drawShot } from "./switch-run/shot-art";
import { ARENA_LEFT, ARENA_ENTRY, ARENA_GATE, WARDEN_HP, WARDEN_HEIGHT, arenaSteps, stepWarden, clampArenaPlayer, drawBossFight, type Shockwave } from "./switch-run/warden";

import { FROST_START, BLOOM_LEFT, BLOOM_ENTRY, BLOOM_GATE, loadFrostArt, drawFrostBackground, drawIcePlatform, stepIcePlatforms, isFrostEnemy, stepFrostEnemy, drawNewEnemy, stepBloom, stepSkyHazards, drawSkyHazards, drawBloomFight, type IcePlatform, type SkyHazard } from "./switch-run/frost-world";

type CharacterId = "timmy" | "eldric" | "kirana" | "adelia" | "dylan";
type Mode = "select" | "playing" | "gameover" | "spectating" | "victory";
type LeaderboardRow = { name: string; score: number; distance: number; hero: CharacterId };
type LeaderboardPeriod = "day" | "week" | "all";
type LivePlayer = { sessionId: string; name: string; score: number; distance: number; elapsedMs: number; viewers: number; updatedAt: number };
type Character = {
  id: CharacterId; name: string; value: string; role: string; weapon: string;
  weaponDesc: string; ability: string; abilityDesc: string; color: string; image: string; sprite: string;
};
type Platform = ForestPlatform & { x: number; y: number; w: number; h: number; require?: CharacterId };
type Coin = { x: number; y: number; got: boolean; phase: number };
type Chest = { x: number; y: number; opened: boolean; phase: number };
type EnemyKind = "crawler" | "drone" | "horned" | "titan" | "colossus" | "moss" | "wasp" | "golem" | "warden" | "bloom" | "icewolf" | "crystal" | "frostgolem" | "glacier" | "emberbeetle" | "astralwisp" | "magma" | "sovereign" | "firebat" | "furnacesentry" | "riftspider" | "astralsentinel";
type Enemy = { x: number; y: number; w: number; h: number; vx: number; alive: boolean; phase: number; hp: number; maxHp: number; hitCooldown: number; kind: EnemyKind; homeY?: number; patrolLeft?: number; patrolRight?: number; engaged?: boolean };
type Shot = { x: number; y: number; vx: number; vy: number; life: number; kind: string; radius: number; color: string };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };
type Barrier = { x: number; y: number; w: number; h: number; alive: boolean; kind: "laser" | "wall" | "speed" | "hurdle"; requires: CharacterId };
type LiveMotionSample = {
  t: number; camera: number; active: CharacterId; voidX: number; voidGrace: number;
  score: number; distance: number; coinCount: number; hp: number; energy: number;
  player: { x: number; y: number; w: number; h: number; vx: number; vy: number; face: number; animRow: number; animFrame: number; invuln: number };
};
type LiveSnapshot = {
  frostWeather?: FrostWeather;
  hazards?: Shockwave[];
  worlds?: 2 | 3 | 5;
  skyHazards?: SkyHazard[];
  v: 1; t: number; camera: number; active: CharacterId; voidX: number; voidGrace: number;
  score: number; distance: number; coinCount: number; hp: number; energy: number;
  player: { x: number; y: number; w: number; h: number; vx: number; vy: number; face: number; animRow: number; animFrame: number; invuln: number };
  platforms: Platform[]; coins: Coin[]; chests: Chest[]; enemies: Enemy[]; shots: Shot[]; barriers: Barrier[];
  motion?: LiveMotionSample[];
};

const W = 960, H = 540, GROUND_Y = 458;
const LIVE_BUFFER_MS = 2_100;
const LIVE_POLL_MS = 300;
const LIVE_BROADCAST_MS = 450;
const LIVE_MOTION_SAMPLE_MS = 90;
const CHARACTERS: Character[] = [
  { id: "timmy", name: "Timmy", value: "Terpercaya", role: "Moral Anchor", weapon: "Phase Guard", weaponDesc: "Kebal benturan & tembus musuh 2,5 detik · 75 energi (75%)", ability: "Integrity Guard", abilityDesc: "Menerobos laser & rintangan pendek", color: "#4f8cff", image: "/characters/timmy.png", sprite: "/sprites/timmy-sheet-v2.png" },
  { id: "eldric", name: "Eldric", value: "Eksploratif", role: "Idea Catalyst", weapon: "Idea Blaster", weaponDesc: "Tiga proyektil energi", ability: "Rocket Jump", abilityDesc: "Melompat jauh lebih tinggi", color: "#f7a21b", image: "/characters/eldric.png", sprite: "/sprites/eldric-sheet-v2.png" },
  { id: "kirana", name: "Kirana", value: "Kolaboratif", role: "Emotional Connector", weapon: "Harmony Pulse", weaponDesc: "Serangan gelombang area", ability: "Harmony Link", abilityDesc: "Memunculkan jembatan hijau & menarik koin", color: "#7db750", image: "/characters/kirana.png", sprite: "/sprites/kirana-sheet-v3.png" },
  { id: "adelia", name: "Adelia", value: "Adaptif", role: "Change Navigator", weapon: "Adaptive Shot", weaponDesc: "Tembakan energi · 2 damage · 30 energi", ability: "Quick Shift", abilityDesc: "Berlari paling cepat, melewati speed gate & kebal slow wall", color: "#a875e8", image: "/characters/adelia.png", sprite: "/sprites/adelia-sheet-v2.png" },
  { id: "dylan", name: "Dylan", value: "Determinasi", role: "Energy Driver", weapon: "Trailbreaker", weaponDesc: "Tebasan kuat dengan 4 damage", ability: "Power Break", abilityDesc: "Menghancurkan dinding penghalang", color: "#ef5350", image: "/characters/dylan.png", sprite: "/sprites/dylan-sheet-v3.png" },
];

// Per-frame registration corrections for generated running poses. Values are
// destination pixels and keep each character's visual center and feet stable.
const RUN_FRAME_OFFSETS: Record<CharacterId, ReadonlyArray<readonly [number, number]>> = {
  timmy: [[0, 0], [0, 0], [0, 0], [0, 0]],
  eldric: [[0, 0], [0, 0], [0, 0], [0, 0]],
  kirana: [[0, 0], [0, 0], [0, 0], [0, 0]],
  adelia: [[0, 0], [0, 0], [0, 0], [0, 0]],
  dylan: [[0, 0], [0, 0], [0, 0], [0, 0]],
};

// Some generated fourth running frames change the character's proportions.
// Ping-pong only through the most consistent poses to keep motion fluid
// without the remaining one-frame "morph".
const RUN_FRAME_SEQUENCE: Record<CharacterId, ReadonlyArray<number>> = {
  timmy: [0, 1, 2, 3],
  eldric: [0, 1, 2, 3],
  kirana: [0, 1, 2, 3],
  adelia: [0, 1, 2, 3],
  dylan: [0, 1, 2, 3],
};

// Registration corrections for the remaining generated action rows. Each
// sprite cell contains a differently positioned pose, so anchoring every
// frame to the character's visual centre and feet prevents action "teleports".
const ACTION_FRAME_OFFSETS: Record<CharacterId, Record<"jump" | "hurt" | "special", ReadonlyArray<readonly [number, number]>>> = {
  timmy: {
    jump: [[0, 0], [0, 0], [0, 0], [0, 0]],
    hurt: [[0, 0], [0, 0], [0, 0], [0, 0]],
    special: [[0, 0], [0, 0], [0, 0], [0, 0]],
  },
  eldric: {
    jump: [[0, 0], [0, 0], [0, 0], [0, 0]],
    hurt: [[0, 0], [0, 0], [0, 0], [0, 0]],
    special: [[0, 0], [0, 0], [0, 0], [0, 0]],
  },
  kirana: {
    jump: [[0, 0], [0, 0], [0, 0], [0, 0]],
    hurt: [[0, 0], [0, 0], [0, 0], [0, 0]],
    special: [[0, 0], [0, 0], [0, 0], [0, 0]],
  },
  adelia: {
    jump: [[0, 0], [0, 0], [0, 0], [0, 0]],
    hurt: [[0, 0], [0, 0], [0, 0], [0, 0]],
    special: [[0, 0], [0, 0], [0, 0], [0, 0]],
  },
  dylan: {
    jump: [[0, 0], [0, 0], [0, 0], [0, 0]],
    hurt: [[0, 0], [0, 0], [0, 0], [0, 0]],
    special: [[0, 0], [0, 0], [0, 0], [0, 0]],
  },
};

const getChar = (id: CharacterId) => CHARACTERS.find(c => c.id === id)!;

function weekLabel(weekKey: string) {
  const start = new Date(`${weekKey}T00:00:00+07:00`);
  if (Number.isNaN(start.getTime())) return weekKey;
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const format = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
  return `${format.format(start)} – ${format.format(end)}`;
}
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const overlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
function random(seed: { value: number }) { seed.value = (seed.value * 1664525 + 1013904223) >>> 0; return seed.value / 4294967296; }

function compactInPlace<T>(items: T[], keep: (item: T) => boolean) {
  let write = 0;
  for (const item of items) if (keep(item)) items[write++] = item;
  items.length = write;
}

function getOrCreatePlayerKey() {
  try {
    const stored = localStorage.getItem("tekad-player-key") || "";
    if (/^[a-f0-9]{64}$/i.test(stored)) return stored.toLowerCase();
    const bytes = new Uint8Array(32); crypto.getRandomValues(bytes);
    const key = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    localStorage.setItem("tekad-player-key", key); return key;
  } catch { return ""; }
}

function playTone(kind: "jump" | "coin" | "special" | "hit" | "switch" | "gameover", enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx(), osc = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    const freq = { jump: 360, coin: 880, special: 190, hit: 90, switch: 520, gameover: 130 }[kind];
    osc.type = kind === "coin" || kind === "switch" ? "square" : kind === "special" ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(kind === "gameover" ? 55 : freq * 1.5, now + .12);
    gain.gain.setValueAtTime(.05, now); gain.gain.exponentialRampToValueAtTime(.001, now + .2);
    osc.connect(gain); gain.connect(ctx.destination); osc.start(now); osc.stop(now + .23); setTimeout(() => ctx.close(), 350);
  } catch { /* audio is optional */ }
}

function pixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color = "#fff", align: CanvasTextAlign = "left") {
  ctx.save(); ctx.font = `900 ${size}px ui-monospace, monospace`; ctx.textAlign = align; ctx.textBaseline = "middle";
  ctx.fillStyle = "#05070caa"; ctx.fillText(text, x + 2, y + 3); ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}

function drawEarth3000(ctx: CanvasRenderingContext2D, camera: number) {
  if (drawEarthArtwork(ctx, camera, performance.now(), W, H)) return;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#030617"); sky.addColorStop(.38, "#0d1235"); sky.addColorStop(.68, "#251351"); sky.addColorStop(1, "#58266c");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

  // Slow nebula glow and two star layers give the skyline real depth.
  const nebula = ctx.createRadialGradient(690, 110, 15, 690, 110, 310);
  nebula.addColorStop(0, "#a02cff30"); nebula.addColorStop(.45, "#5524a625"); nebula.addColorStop(1, "#12072e00");
  ctx.fillStyle = nebula; ctx.fillRect(350, 0, 610, 330);
  for (let layer = 0; layer < 2; layer++) {
    const spacing = layer ? 73 : 113, speed = layer ? .035 : .015;
    const offset = (camera * speed) % spacing;
    ctx.fillStyle = layer ? "#a9dfff99" : "#ffffff70";
    for (let i = -1; i < Math.ceil(W / spacing) + 2; i++) {
      const seed = i + Math.floor(camera * speed / spacing);
      const x = i * spacing - offset + ((seed * 29) % 31);
      const y = 22 + Math.abs((seed * 67 + layer * 41) % 188);
      const size = (seed + layer) % 4 === 0 ? 2 : 1;
      ctx.fillRect(Math.floor(x), y, size, size);
    }
  }

  // Orbital moon with a clipped scanline texture and thin energy rings.
  ctx.save();
  ctx.beginPath(); ctx.arc(785, 92, 58, 0, Math.PI * 2); ctx.clip();
  const moon = ctx.createLinearGradient(740, 35, 830, 150); moon.addColorStop(0, "#6a3da6"); moon.addColorStop(1, "#24144f");
  ctx.fillStyle = moon; ctx.fillRect(724, 30, 122, 126);
  ctx.fillStyle = "#d985ff38"; for (let y = 38; y < 150; y += 8) ctx.fillRect(724, y, 122, 2);
  ctx.restore();
  ctx.strokeStyle = "#e184ff99"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(785, 92, 59, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = "#75e8ff38"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(785, 92, 82, 22, -.18, 0, Math.PI * 2); ctx.stroke();

  // Distant skyline: smaller silhouettes, slower parallax, warm window haze.
  const farOffset = (camera * .09) % 64;
  for (let i = -2; i < 18; i++) {
    const seed = i + Math.floor(camera * .09 / 64), x = i * 64 - farOffset;
    const h = 48 + Math.abs((seed * 37) % 105), w = 39 + Math.abs((seed * 13) % 16), top = 350 - h;
    ctx.fillStyle = seed % 3 === 0 ? "#101735" : "#111b3d"; ctx.fillRect(x, top, w, h);
    ctx.fillStyle = seed % 2 ? "#8d56d344" : "#38c9e344";
    for (let y = top + 11; y < 340; y += 17) for (let wx = x + 7; wx < x + w - 5; wx += 13) if ((wx + y + seed) % 4) ctx.fillRect(wx, y, 5, 2);
  }

  const horizonGlow = ctx.createLinearGradient(0, 250, 0, 405);
  horizonGlow.addColorStop(0, "#bb3cff00"); horizonGlow.addColorStop(.55, "#a436ff1c"); horizonGlow.addColorStop(1, "#4f28a400");
  ctx.fillStyle = horizonGlow; ctx.fillRect(0, 225, W, 200);

  // Main skyline: irregular towers, rooftop details, signs and moving parallax.
  const nearOffset = (camera * .24) % 96;
  for (let i = -2; i < 13; i++) {
    const seed = i + Math.floor(camera * .24 / 96), x = i * 96 - nearOffset;
    const h = 105 + Math.abs((seed * 61) % 205), w = 66 + Math.abs((seed * 17) % 16), top = 455 - h;
    ctx.fillStyle = seed % 3 === 0 ? "#101a36" : seed % 3 === 1 ? "#121d3d" : "#0d1832";
    ctx.fillRect(x, top, w, h);
    ctx.fillStyle = "#24315b"; ctx.fillRect(x + 5, top + 5, w - 10, 5);
    if (seed % 3 === 0) { ctx.fillStyle = "#202c54"; ctx.fillRect(x + w / 2 - 4, top - 24, 8, 24); ctx.fillStyle = "#55edff"; ctx.fillRect(x + w / 2 - 1, top - 31, 2, 9); }
    const neon = seed % 2 ? "#ff4fd8" : "#35dcff";
    ctx.fillStyle = neon;
    for (let y = top + 23; y < 438; y += 27) {
      const inset = 10 + Math.abs((seed + y) % 8); ctx.fillRect(x + inset, y, Math.max(13, w - inset * 2), 3);
    }
    if (seed % 4 === 1 && h > 180) {
      ctx.fillStyle = "#070c20cc"; ctx.fillRect(x + 9, top + 44, w - 18, 28);
      ctx.strokeStyle = neon; ctx.lineWidth = 2; ctx.strokeRect(x + 9, top + 44, w - 18, 28);
      ctx.fillStyle = "#ffffffcc"; ctx.fillRect(x + 18, top + 56, w - 36, 3);
    }
  }

  // Elevated transit lanes and atmospheric reflections anchor the play plane.
  ctx.fillStyle = "#080f26cc"; ctx.fillRect(0, 348, W, 12);
  ctx.fillStyle = "#7148ff"; ctx.fillRect(0, 348, W, 2);
  ctx.fillStyle = "#29dff244"; ctx.fillRect(0, 358, W, 2);
  const lightOffset = (camera * .8) % 150;
  for (let x = -lightOffset; x < W + 150; x += 150) { ctx.fillStyle = "#f35bd8"; ctx.fillRect(x, 351, 54, 3); ctx.fillStyle = "#31dff2"; ctx.fillRect(x + 72, 351, 28, 3); }

  const haze = ctx.createLinearGradient(0, 365, 0, H);
  haze.addColorStop(0, "#4f24a51f"); haze.addColorStop(1, "#160d3638"); ctx.fillStyle = haze; ctx.fillRect(0, 365, W, H - 365);
  ctx.strokeStyle = "#5df2ff25"; ctx.lineWidth = 1;
  for (let y = 390; y < H; y += 26) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawWorld(ctx: CanvasRenderingContext2D, camera: number, distance: number, now: number) {
  // Portrait adds vertical scenery. Keep all 960 horizontal world units visible:
  // sprites, physics, jump distances and forward warning distance stay unchanged.
  const portrait = window.matchMedia('(max-width: 560px) and (orientation: portrait)').matches;
  const viewHeight = portrait ? W : H;
  if (ctx.canvas.height !== viewHeight) ctx.canvas.height = viewHeight;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const world=Math.min(4,Math.floor(distance/2000)),blend=clamp((distance*10-world*20000)/450,0,1);
  const draw=(index:number)=>{if(index===0){if(!portrait || !drawEarthArtwork(ctx,camera,now,W,viewHeight))drawEarth3000(ctx,camera);}else if(index===1)drawVerdantBackground(ctx,camera,now,W,viewHeight);else if(index===2)drawFrostBackground(ctx,camera,now,W,viewHeight);else drawLateBackground(ctx,camera,now,W,viewHeight,index===4);};
  if(world>0&&blend<1)draw(world-1);ctx.save();ctx.globalAlpha=world===0?1:blend;draw(world);ctx.restore();
  ctx.translate(0, viewHeight - H);
  if(world>0&&distance-world*2000<90){ctx.fillStyle="#0b1833ee";ctx.fillRect(230,108,500,52);pixelText(ctx,`WORLD 0${world+1} · ${worldName(distance).toUpperCase()}`,480,137,16,"#ddedff","center");}
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, sx: number, active: CharacterId) {
  if(p.gone && p.gone > 0)return;
  if(p.biome){drawLatePlatform(ctx,p,sx);return;}
  if(p.ice){drawIcePlatform(ctx,p,sx);return;}
  const verdant = p.x >= VERDANT_START;
  const harmony = p.require === "kirana", enabled = !harmony || active === "kirana";
  if (!enabled) return;
  if (drawTerrain(ctx, p, sx)) return;
  ctx.save(); ctx.fillStyle = harmony ? "#102b27" : verdant ? "#071b20" : "#15162e"; ctx.fillRect(sx + 5, p.y + 7, p.w, p.h);
  ctx.fillStyle = harmony ? "#24563f" : verdant ? "#274438" : "#202b56"; ctx.fillRect(sx, p.y, p.w, p.h); ctx.fillStyle = harmony ? "#8ae86d" : verdant ? "#ace49b" : "#46d9e8"; ctx.fillRect(sx, p.y, p.w, 8);
  ctx.fillStyle = harmony ? "#a7ff8d77" : verdant ? "#e5b86d77" : "#46d9e855"; for (let x = 10; x < p.w; x += 32) ctx.fillRect(sx + x, p.y + 14, 13, 4); ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, sx: number, sy: number) {
  if(drawBeastBoss(ctx,e,sx,sy))return;
  ctx.save();
  if (drawLateEnemy(ctx, e, sx, sy)) {
    // Late-world sprites use the same HP pips as World 1.
  } else if (drawNewEnemy(ctx, e, sx, sy)) {
    // Frost and Bloom artwork share their actual gameplay bounds.
  } else if (drawEarthEnemy(ctx, e, sx, sy)) {
    // Earth production sprites share the existing collision boxes.
  } else if (isVerdantEnemy(e.kind) && drawVerdantEnemy(ctx, { ...e, kind: e.kind }, sx, sy)) {
    // New world atlas; health pips below remain shared.
  } else if (e.kind === "crawler" || e.kind === "moss") {
    ctx.fillStyle = "#171424"; ctx.fillRect(sx - 3, sy + 10, e.w + 6, e.h - 6);
    ctx.fillStyle = "#ff4fcb"; ctx.fillRect(sx, sy + 5, e.w, e.h - 10);
    ctx.fillStyle = "#ff91e3"; ctx.fillRect(sx + 5, sy, e.w - 10, 8);
    ctx.fillStyle = "#fff"; ctx.fillRect(sx + 7, sy + 11, 6, 6); ctx.fillRect(sx + e.w - 13, sy + 11, 6, 6);
  } else if (e.kind === "drone" || e.kind === "wasp") {
    ctx.fillStyle = "#31d7e8"; ctx.fillRect(sx + 7, sy + 4, e.w - 14, e.h - 8);
    ctx.fillStyle = "#d8fbff"; ctx.fillRect(sx + 13, sy + 9, e.w - 26, 7);
    ctx.fillStyle = "#202b56"; ctx.fillRect(sx, sy + 10, 9, 8); ctx.fillRect(sx + e.w - 9, sy + 10, 9, 8);
    ctx.fillStyle = "#ffef67"; ctx.fillRect(sx + 4, sy + e.h - 5, 7, 5); ctx.fillRect(sx + e.w - 11, sy + e.h - 5, 7, 5);
  } else if (e.kind === "horned") {
    ctx.fillStyle = "#f6c344"; ctx.fillRect(sx - 3, sy, 9, 12); ctx.fillRect(sx + e.w - 6, sy, 9, 12);
    ctx.fillStyle = "#7c3aed"; ctx.fillRect(sx, sy + 8, e.w, e.h - 8);
    ctx.fillStyle = "#bd8cff"; ctx.fillRect(sx + 6, sy + 4, e.w - 12, 12);
    ctx.fillStyle = "#fff"; ctx.fillRect(sx + 8, sy + 17, 7, 7); ctx.fillRect(sx + e.w - 15, sy + 17, 7, 7);
    ctx.fillStyle = "#251338"; ctx.fillRect(sx + 11, sy + 20, 3, 4); ctx.fillRect(sx + e.w - 14, sy + 20, 3, 4);
  } else if (e.kind === "titan") {
    ctx.fillStyle = "#2a1029"; ctx.fillRect(sx - 5, sy + 12, e.w + 10, e.h - 12);
    ctx.fillStyle = "#b52b71"; ctx.fillRect(sx, sy + 7, e.w, e.h - 7);
    ctx.fillStyle = "#f35fa1"; ctx.fillRect(sx + 8, sy, e.w - 16, 15);
    ctx.fillStyle = "#ffcf4a"; ctx.fillRect(sx - 6, sy + 2, 12, 18); ctx.fillRect(sx + e.w - 6, sy + 2, 12, 18);
    ctx.fillStyle = "#fff"; ctx.fillRect(sx + 13, sy + 21, 10, 8); ctx.fillRect(sx + e.w - 23, sy + 21, 10, 8);
    ctx.fillStyle = "#2b1024"; ctx.fillRect(sx + 17, sy + 24, 4, 4); ctx.fillRect(sx + e.w - 21, sy + 24, 4, 4);
    ctx.fillStyle = "#64163f"; ctx.fillRect(sx + 17, sy + e.h - 13, e.w - 34, 7);
  } else {
    ctx.fillStyle = "#120e28"; ctx.fillRect(sx - 8, sy + 15, e.w + 16, e.h - 15);
    ctx.fillStyle = "#2749a8"; ctx.fillRect(sx, sy + 10, e.w, e.h - 10);
    ctx.fillStyle = "#4f8cff"; ctx.fillRect(sx + 12, sy, e.w - 24, 20);
    ctx.fillStyle = "#8fdcff"; ctx.fillRect(sx - 8, sy + 3, 17, 25); ctx.fillRect(sx + e.w - 9, sy + 3, 17, 25);
    ctx.fillStyle = "#fff"; ctx.fillRect(sx + 17, sy + 27, 13, 10); ctx.fillRect(sx + e.w - 30, sy + 27, 13, 10);
    ctx.fillStyle = "#0b1538"; ctx.fillRect(sx + 22, sy + 31, 5, 5); ctx.fillRect(sx + e.w - 27, sy + 31, 5, 5);
    ctx.fillStyle = "#79e8ff"; ctx.fillRect(sx + 22, sy + e.h - 17, e.w - 44, 9);
    ctx.fillStyle = "#d7f8ff"; ctx.fillRect(sx + e.w / 2 - 5, sy + 7, 10, 10);
  }
  if (e.maxHp >= 1 && !["warden", "bloom", "glacier", "magma", "sovereign"].includes(e.kind)) {
    const pipW = e.maxHp > 4 ? 6 : 7, gap = 2, total = e.maxHp * pipW + (e.maxHp - 1) * gap, start = sx + (e.w - total) / 2;
    for (let i = 0; i < e.maxHp; i++) { ctx.fillStyle = i < e.hp ? (e.maxHp > 4 ? "#ffcf4a" : "#fff") : "#3b2452"; ctx.fillRect(Math.floor(start + i * (pipW + gap)), sy - 10, pipW, 4); }
  }
  ctx.restore();
}

function drawVoidStorm(ctx: CanvasRenderingContext2D, frontX: number, now: number, grace: number) {
  ctx.save();
  const pulse = .55 + Math.sin(now / 95) * .18;
  if (frontX < -18) {
    const warning = ctx.createLinearGradient(0, 0, 24, 0); warning.addColorStop(0, `rgba(199,57,255,${pulse})`); warning.addColorStop(1, "rgba(102,30,170,0)");
    ctx.fillStyle = warning; ctx.fillRect(0, 0, 28, H);
  } else {
    const front = Math.min(W, Math.max(18, frontX));
    const storm = ctx.createLinearGradient(0, 0, front + 42, 0); storm.addColorStop(0, "#020108f2"); storm.addColorStop(.65, "#29073dde"); storm.addColorStop(.88, "#8618bacc"); storm.addColorStop(1, "#eb6dff22");
    ctx.fillStyle = storm; ctx.fillRect(0, 0, front + 46, H);
    ctx.fillStyle = `rgba(225,112,255,${pulse})`; ctx.fillRect(front, 0, 6, H);
    ctx.fillStyle = "#8c2fd988";
    for (let y = -30; y < H + 40; y += 52) { const wave = Math.sin(now / 120 + y * .07) * 11; ctx.fillRect(front - 16 + wave, y, 13, 31); }
    ctx.strokeStyle = "#f0a4ffcc"; ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) { const y = (i * 137 + now / 7) % H; ctx.beginPath(); ctx.moveTo(front - 4, y); ctx.lineTo(front + 18, y + 13); ctx.lineTo(front + 3, y + 29); ctx.stroke(); }
  }
  if (grace > 0) { ctx.fillStyle = "#080313aa"; ctx.fillRect(14, H - 48, 150, 28); pixelText(ctx, `VOID STORM ${grace.toFixed(1)}`, 24, H - 34, 10, "#e8a2ff"); }
  ctx.restore();
}

function drawLiveSnapshot(ctx: CanvasRenderingContext2D, snap: LiveSnapshot, sprites: Record<CharacterId, HTMLImageElement>, fallbacks: Record<CharacterId, HTMLImageElement>) {
  const now = performance.now(), active = snap.active, c = getChar(active), camera = snap.camera;
  drawWorld(ctx, camera, snap.worlds && snap.worlds >= 2 ? snap.distance : 0, now);
  for (const p of snap.platforms) { const x = Math.floor(p.x - camera); if (x < W + 100 && x + p.w > -100) drawPlatform(ctx, p, x, active); }
  for (const b of snap.barriers) if (b.alive) drawObstacle(ctx, b, camera);
  for (const coin of snap.coins) if (!coin.got) drawCoinDetail(ctx,coin,camera,now);
  for (const chest of snap.chests) drawChestDetail(ctx,chest,camera,now);
  for (const e of snap.enemies) if (e.alive) { const x = Math.floor(e.x - camera), y = Math.floor(e.y + (e.kind === "drone" ? Math.sin(e.phase) * 7 : 0)); if (x + e.w > -90 && x < W + 90) drawEnemy(ctx, e, x, y); }
  for (const s of snap.shots) if (s.life > 0) drawShot(ctx, s, camera, now);
  drawFrostWeather(ctx,snap.frostWeather,W,H);
  drawVoidStorm(ctx, snap.voidX - camera, now, snap.voidGrace);
  drawBossFight(ctx, snap.enemies.find(e => e.kind === "warden"), snap.hazards ?? [], camera, snap.player.x, W);
  drawSkyHazards(ctx, snap.skyHazards ?? [], camera);
  drawBloomFight(ctx, snap.enemies.find(e => e.kind === "bloom"), camera);
  drawGlacierFight(ctx, snap.enemies.find(e => e.kind === "glacier"), camera);
  drawLateFight(ctx,snap.enemies.find(e=>e.kind==="magma"||e.kind==="sovereign"),camera);
  const p = snap.player, px = Math.floor(p.x - camera), py = Math.floor(p.y), sprite = sprites[active], fallback = fallbacks[active];
  ctx.save(); if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2) ctx.globalAlpha = .32;
  if (sprite.complete && sprite.naturalWidth) {
    const sw = sprite.naturalWidth / 4, sh = sprite.naturalHeight / 5, dw = active === "dylan" ? 102 : active === "adelia" ? 90 : active === "kirana" ? 88 : 86, dh = active === "adelia" ? 90 : active === "kirana" ? 88 : 86;
    const action = p.animRow === 2 ? "jump" : p.animRow === 3 ? "hurt" : p.animRow === 4 ? "special" : null;
    const offset = p.animRow === 1 ? RUN_FRAME_OFFSETS[active][p.animFrame] : action ? ACTION_FRAME_OFFSETS[active][action][p.animFrame] : [0, 0];
    const dx = px + p.w / 2 - dw / 2 + offset[0] * p.face, dy = py + p.h - dh + 4 + offset[1];
    if (p.face < 0) { ctx.translate(dx + dw, 0); ctx.scale(-1, 1); ctx.drawImage(sprite, p.animFrame * sw, p.animRow * sh, sw, sh, 0, dy, dw, dh); }
    else ctx.drawImage(sprite, p.animFrame * sw, p.animRow * sh, sw, sh, dx, dy, dw, dh);
  } else if (fallback.complete && fallback.naturalWidth) ctx.drawImage(fallback, px, py - 10, p.w, p.h + 10);
  ctx.restore();
  const voidDistance = Math.max(0, p.x - snap.voidX), voidColor = voidDistance < 260 ? "#ff5263" : voidDistance < 520 ? "#ffb347" : "#d77cff";
  ctx.fillStyle = "#07101dd9"; ctx.fillRect(18, 16, 420, 80); ctx.strokeStyle = c.color; ctx.strokeRect(18, 16, 420, 80); pixelText(ctx, `SCORE ${String(snap.score).padStart(6, "0")}`, 34, 36, 16); pixelText(ctx, `COIN ${String(snap.coinCount).padStart(2, "0")}`, 34, 68, 13, "#ffd447"); pixelText(ctx, c.name.toUpperCase(), 205, 34, 13, c.color); pixelText(ctx, "♥".repeat(snap.hp), 412, 35, 18, "#ff5c67", "right"); ctx.fillStyle = "#16233b"; ctx.fillRect(205, 66, 207, 12); ctx.fillStyle = c.color; ctx.fillRect(205, 66, 207 * snap.energy / 100, 12); pixelText(ctx, `${snap.distance} M`, W - 25, 34, 15, "#fff", "right"); pixelText(ctx, snap.voidGrace > 0 ? `STORM ${snap.voidGrace.toFixed(1)}S` : `STORM ${Math.floor(voidDistance / 10)}M`, W - 25, 63, 11, voidColor, "right");
}

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

function interpolateLiveSnapshot(from: LiveSnapshot, to: LiveSnapshot, amount: number, renderNow: number): LiveSnapshot {
  // A buffered timeline needs linear time progression. Easing every packet
  // would make a constant run repeatedly accelerate and decelerate.
  const eased = clamp(amount, 0, 1);
  const sameHero = from.active === to.active;
  // Match moving entities by proximity instead of array index. Items are
  // compacted as they leave the screen, so index matching can make a monster
  // or projectile jump to another entity for one frame.
  const usedEnemies = new Set<number>();
  const matchEnemies = to.enemies.map(enemy => {
    let previousIndex = -1, nearest = 181;
    from.enemies.forEach((candidate, index) => {
      if (usedEnemies.has(index) || candidate.kind !== enemy.kind) return;
      const distance = Math.abs(candidate.x - enemy.x) + Math.abs(candidate.y - enemy.y) * .35;
      if (distance < nearest) { nearest = distance; previousIndex = index; }
    });
    const previous = previousIndex >= 0 ? from.enemies[previousIndex] : undefined;
    if (!previous) return { ...enemy };
    usedEnemies.add(previousIndex);
    const cycle = enemy.kind === "magma"||enemy.kind === "sovereign" ? 10 : enemy.kind === "glacier" ? 9 : enemy.kind === "bloom" ? 8 : enemy.kind === "warden" ? 6 : 0;
    return { ...enemy, x: lerp(previous.x, enemy.x, eased), y: lerp(previous.y, enemy.y, eased), phase: cycle ? lerp(previous.phase, enemy.phase < previous.phase ? enemy.phase + cycle : enemy.phase, eased) % cycle : lerp(previous.phase, enemy.phase, eased) };
  });
  const usedShots = new Set<number>();
  const matchShots = to.shots.map(shot => {
    let previousIndex = -1, nearest = 261;
    from.shots.forEach((candidate, index) => {
      if (usedShots.has(index) || candidate.kind !== shot.kind) return;
      const distance = Math.abs(candidate.x - shot.x) + Math.abs(candidate.y - shot.y) * .4;
      if (distance < nearest) { nearest = distance; previousIndex = index; }
    });
    const previous = previousIndex >= 0 ? from.shots[previousIndex] : undefined;
    if (!previous) return { ...shot };
    usedShots.add(previousIndex);
    return { ...shot, x: lerp(previous.x, shot.x, eased), y: lerp(previous.y, shot.y, eased), radius: lerp(previous.radius, shot.radius, eased) };
  });
  const matchCoins = to.coins.map((coin, index) => {
    const previous = from.coins[index];
    return previous && Math.abs(previous.x - coin.x) < 120 ? { ...coin, x: lerp(previous.x, coin.x, eased), y: lerp(previous.y, coin.y, eased) } : { ...coin };
  });
  let animFrame = to.player.animFrame;
  if (to.player.animRow === 1) animFrame = RUN_FRAME_SEQUENCE[to.active][Math.floor(renderNow / 135) % RUN_FRAME_SEQUENCE[to.active].length];
  else if (to.player.animRow === 0) animFrame = Math.floor(renderNow / 260) % 4;
  return {
    ...to,
    camera: sameHero ? lerp(from.camera, to.camera, eased) : to.camera,
    voidX: lerp(from.voidX, to.voidX, eased),
    voidGrace: lerp(from.voidGrace, to.voidGrace, eased),
    energy: lerp(from.energy, to.energy, eased),
    player: {
      ...to.player,
      x: sameHero ? lerp(from.player.x, to.player.x, eased) : to.player.x,
      y: sameHero ? lerp(from.player.y, to.player.y, eased) : to.player.y,
      vx: lerp(from.player.vx, to.player.vx, eased),
      vy: lerp(from.player.vy, to.player.vy, eased),
      animFrame,
    },
    platforms: to.platforms.map(p => {
      const previous=from.platforms.find(q=>q.x===p.x&&q.w===p.w);
      return previous&&p.ice==="lift"?{...p,y:lerp(previous.y,p.y,eased)}:{...p};
    }),
    skyHazards: (to.skyHazards??[]).map(h=>{
      const previous=(from.skyHazards??[]).find(p=>p.kind===h.kind&&p.x===h.x&&Math.abs(p.life-h.life)<1);
      return previous?{...h,y:lerp(previous.y,h.y,eased),warning:lerp(previous.warning,h.warning,eased)}:{...h};
    }),
    coins: matchCoins,
    enemies: matchEnemies,
    shots: matchShots,
    hazards: (to.hazards ?? []).map(wave => {
      const previous = (from.hazards ?? []).find(candidate => candidate.vx === wave.vx && Math.abs(candidate.x - wave.x) < 180);
      return previous ? { ...wave, x: lerp(previous.x, wave.x, eased) } : { ...wave, x: wave.x - wave.vx * (1 - eased) * Math.min(.5, (to.t - from.t) / 1000) };
    }),
  };
}

function interpolateLiveMotion(from: LiveMotionSample, to: LiveMotionSample, amount: number, renderNow: number): LiveMotionSample {
  const progress = clamp(amount, 0, 1), sameHero = from.active === to.active;
  let animFrame = to.player.animFrame;
  if (to.player.animRow === 1) animFrame = RUN_FRAME_SEQUENCE[to.active][Math.floor(renderNow / 135) % RUN_FRAME_SEQUENCE[to.active].length];
  else if (to.player.animRow === 0) animFrame = Math.floor(renderNow / 260) % 4;
  return {
    ...to,
    camera: sameHero ? lerp(from.camera, to.camera, progress) : to.camera,
    voidX: lerp(from.voidX, to.voidX, progress),
    voidGrace: lerp(from.voidGrace, to.voidGrace, progress),
    score: Math.round(lerp(from.score, to.score, progress)),
    distance: Math.round(lerp(from.distance, to.distance, progress)),
    coinCount: progress < 1 ? from.coinCount : to.coinCount,
    hp: progress < 1 ? from.hp : to.hp,
    energy: lerp(from.energy, to.energy, progress),
    player: {
      ...to.player,
      x: sameHero ? lerp(from.player.x, to.player.x, progress) : to.player.x,
      y: sameHero ? lerp(from.player.y, to.player.y, progress) : to.player.y,
      vx: lerp(from.player.vx, to.player.vx, progress),
      vy: lerp(from.player.vy, to.player.vy, progress),
      animFrame,
    },
  };
}

export default function TekadGame() {
  const [paused, setPaused] = useState(false), [confirmExit, setConfirmExit] = useState(false);
  const pausedRef = useRef(false), pauseDialog = useRef<HTMLDialogElement>(null);
  const [hud, setHud] = useState({hp:3,maxHp:3,energy:100,distance:12,score:0,boss:"",storm:"4.5s"});
  const changePause = (value: boolean) => { pausedRef.current=value; setPaused(value); keysRef.current={}; if(!value)setConfirmExit(false); };
  useEffect(() => { if(paused)pauseDialog.current?.showModal();else pauseDialog.current?.close(); }, [paused]);

  const [rewardWorld, setRewardWorld] = useState("EARTH 3000");
  const [rewardOpen, setRewardOpen] = useState(false);
  const [pendingReward, setPendingReward] = useState<"health" | "damage" | "speed" | null>(null);
  const rewardDialog = useRef<HTMLDialogElement>(null);
  const rewardChoice = useRef<(choice: string) => void>(() => {});
  useEffect(() => { if (rewardOpen) rewardDialog.current?.showModal(); else rewardDialog.current?.close(); }, [rewardOpen]);
  useEffect(() => {
    if (!rewardOpen) { setPendingReward(null); return; }
    rewardDialog.current?.querySelector<HTMLButtonElement>(pendingReward ? '[data-confirm-reward]' : '.reward-options button')?.focus();
  }, [rewardOpen, pendingReward]);
  const [mode, setMode] = useState<Mode>("select");
  useEffect(() => { loadBeastBossArt(); loadEarthArt(); loadCombatArt(); loadFrostArt(); lateArt(); }, []);
  const [selected, setSelected] = useState<CharacterId>("timmy");
  const [currentWorld, setCurrentWorld] = useState("Earth 3000");
  const [currentHero, setCurrentHero] = useState<CharacterId>("timmy");
  const [highScore, setHighScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [sound, setSound] = useState(true);
  const [switchCooldownUi, setSwitchCooldownUi] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [playerRank, setPlayerRank] = useState<number | null>(null);
  const [allTimeRank, setAllTimeRank] = useState<number | null>(null);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>("day");
  const [selectedWeek, setSelectedWeek] = useState("");
  const [currentWeek, setCurrentWeek] = useState("");
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [boardStatus, setBoardStatus] = useState<"loading" | "ready" | "error">("loading");
  const [rankingNotice, setRankingNotice] = useState("");
  const [starting, setStarting] = useState(false);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [liveStatus, setLiveStatus] = useState<"loading" | "ready" | "error">("loading");
  const [watching, setWatching] = useState<{ sessionId: string; name: string } | null>(null);
  const [watchStatus, setWatchStatus] = useState<"connecting" | "live" | "ended">("connecting");
  const canvasRef = useRef<HTMLCanvasElement>(null), rafRef = useRef(0), keysRef = useRef<Record<string, boolean>>({}), stopGameRef = useRef<() => void>(() => {}), soundRef = useRef(true), sessionIdRef = useRef(""), playerKeyRef = useRef(""), startingRef = useRef(false), viewerIdRef = useRef("");
  const starter = useMemo(() => getChar(selected), [selected]);
  const activeUi = useMemo(() => getChar(currentHero), [currentHero]);

  const loadLeaderboard = useCallback(async (name = "", period: LeaderboardPeriod = "day", week = "") => {
    try {
      setBoardStatus("loading");
      const params = new URLSearchParams({ period }); if (name) params.set("name", name); if (period === "week" && week) params.set("week", week);
      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!response.ok) throw new Error("leaderboard unavailable");
      const data = await response.json() as { board?: LeaderboardRow[]; player?: { rank?: number } | null; weekKey?: string; currentWeekKey?: string; availableWeeks?: string[] };
      setLeaderboard(data.board ?? []); setPlayerRank(data.player?.rank ?? null); setCurrentWeek(data.currentWeekKey ?? ""); setAvailableWeeks(data.availableWeeks ?? []);
      if (period === "week" && !week) setSelectedWeek(data.weekKey ?? data.currentWeekKey ?? "");
      if (period === "all") setAllTimeRank(data.player?.rank ?? null);
      setBoardStatus("ready");
    } catch { setBoardStatus("error"); }
  }, []);

  const loadLivePlayers = useCallback(async () => {
    try {
      const response = await fetch("/api/live"); if (!response.ok) throw new Error("live unavailable");
      const data = await response.json() as { players?: LivePlayer[] }; setLivePlayers(data.players ?? []); setLiveStatus("ready");
    } catch { setLiveStatus("error"); }
  }, []);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(HIGH_SCORE_KEY) || 0);
      const savedName = localStorage.getItem("tekad-player-name") || "";
      playerKeyRef.current = getOrCreatePlayerKey();
      viewerIdRef.current = sessionStorage.getItem("tekad-viewer-id") || crypto.randomUUID(); sessionStorage.setItem("tekad-viewer-id", viewerIdRef.current);
      queueMicrotask(() => { setHighScore((Number.isFinite(saved) ? Math.max(saved, 0) : 0)); setPlayerName(savedName); void loadLeaderboard(savedName); void loadLivePlayers(); });
    } catch { queueMicrotask(() => { void loadLeaderboard(); void loadLivePlayers(); }); }
  }, [loadLeaderboard, loadLivePlayers]);
  useEffect(() => {
    if (mode !== "select") return;
    const timer = window.setInterval(() => void loadLivePlayers(), 3_000);
    return () => window.clearInterval(timer);
  }, [mode, loadLivePlayers]);
  useEffect(() => { soundRef.current = sound; }, [sound]);

  const saveScore = useCallback((value: number) => {
    setIsNewRecord(value > highScore); if (value > highScore) { setHighScore(value); localStorage.setItem(HIGH_SCORE_KEY, String(value)); }
  }, [highScore]);
  const submitLeaderboardScore = useCallback(async (score: number, distance: number, hero: CharacterId) => {
    const name = playerName.trim(), sessionId = sessionIdRef.current, playerKey = playerKeyRef.current; if (name.length < 2 || !sessionId || !playerKey) return;
    try {
      sessionIdRef.current = "";
      const response = await fetch("/api/leaderboard", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, score, distance, hero, sessionId, playerKey }) });
      if (!response.ok) throw new Error("submit failed");
      const data = await response.json() as { player?: { rank?: number } | null };
      setAllTimeRank(data.player?.rank ?? null);
      await loadLeaderboard(name, leaderboardPeriod, selectedWeek);
    } catch { setBoardStatus("error"); }
  }, [playerName, leaderboardPeriod, selectedWeek, loadLeaderboard]);
  const closeLive = useCallback((sessionId = sessionIdRef.current) => {
    if (!sessionId || !playerKeyRef.current) return;
    void fetch("/api/live", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, playerKey: playerKeyRef.current }), keepalive: true }).catch(() => {});
  }, []);
  const finishGame = useCallback((score: number, distance: number, hero: CharacterId) => { cancelAnimationFrame(rafRef.current); closeLive(); setFinalScore(score); saveScore(score); void submitLeaderboardScore(score, distance, hero); setMode("gameover"); playTone("gameover", soundRef.current); }, [closeLive, saveScore, submitLeaderboardScore]);
  const beginGame = useCallback(async () => {
    if (startingRef.current) return; startingRef.current = true; setStarting(true); setRankingNotice(""); sessionIdRef.current = "";
    const name = playerName.trim(), playerKey = playerKeyRef.current || getOrCreatePlayerKey(); playerKeyRef.current = playerKey;
    try {
      const response = await fetch("/api/leaderboard/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, playerKey }) });
      const data = await response.json().catch(() => ({})) as { sessionId?: string; error?: string };
      if (response.ok && data.sessionId) sessionIdRef.current = data.sessionId;
      else if ([400, 409, 429].includes(response.status)) { setRankingNotice(data.error || "Nama pemain belum dapat digunakan."); return; }
      else setRankingNotice("Mode tanpa ranking: leaderboard sedang tidak tersedia.");
    } catch { setRankingNotice("Mode tanpa ranking: leaderboard sedang tidak tersedia."); }
    finally { startingRef.current = false; setStarting(false); }
    cancelAnimationFrame(rafRef.current); pausedRef.current=false; setPaused(false); setConfirmExit(false); setHud({hp:3,maxHp:3,energy:100,distance:12,score:0,boss:"",storm:"4.5s"}); keysRef.current = {}; setRewardOpen(false); setCurrentHero(selected); setCurrentWorld("Earth 3000"); setSwitchCooldownUi(0); setFinalScore(0); setIsNewRecord(false); setMode("playing"); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })));
  }, [selected, playerName]);

  const startWatching = useCallback((player: LivePlayer) => {
    setWatching({ sessionId: player.sessionId, name: player.name }); setWatchStatus("connecting"); setCurrentWorld(worldName(player.distance)); setMode("spectating");
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" })));
  }, []);

  useEffect(() => {
    if (mode !== "spectating" || !watching) return;
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    loadVerdantArt();
    const sprites = {} as Record<CharacterId, HTMLImageElement>, fallbacks = {} as Record<CharacterId, HTMLImageElement>;
    for (const c of CHARACTERS) { sprites[c.id] = new Image(); sprites[c.id].src = c.sprite; fallbacks[c.id] = new Image(); fallbacks[c.id].src = c.image; }
    let alive = true, polling = false, failures = 0, animation = 0, playbackReady = false, playhead = 0, previousAnimationTime = 0, newestArrivedAt = 0, fallbackTimer = 0;
    let shownHero: CharacterId | null = null, shownWorld = "";
    const snapshots: LiveSnapshot[] = [];
    const motionSamples: LiveMotionSample[] = [];
    const animate = (now: number) => {
      if (!alive) return;
      const newest = snapshots.at(-1), newestMotion = motionSamples.at(-1);
      if (!playbackReady && snapshots.length >= 2 && motionSamples.length >= 3 && newestMotion && newestMotion.t - motionSamples[0].t >= LIVE_BUFFER_MS) {
        playbackReady = true; playhead = newestMotion.t - LIVE_BUFFER_MS; previousAnimationTime = now; setWatchStatus("live");
      }
      if (playbackReady && newest && newestMotion) {
        const delta = Math.min(50, Math.max(0, now - previousAnimationTime)); previousAnimationTime = now;
        // Advance the target between packets too. Otherwise it would stand
        // still for 300–450 ms and create a subtle speed-up/slow-down pulse.
        const sincePacket = Math.min(LIVE_BROADCAST_MS * 1.6, Math.max(0, now - newestArrivedAt));
        const target = newestMotion.t - LIVE_BUFFER_MS + sincePacket, drift = target - playhead;
        // Tiny, invisible clock corrections absorb variable network arrival
        // times without jumping the camera or freezing at packet boundaries.
        if (Math.abs(drift) > 900) playhead = target;
        else playhead += delta * clamp(1 + drift / 2_800, .94, 1.06);
        while (snapshots.length > 2 && snapshots[1].t <= playhead) snapshots.shift();
        while (motionSamples.length > 2 && motionSamples[1].t <= playhead) motionSamples.shift();
        const from = snapshots[0], to = snapshots[1] ?? from;
        const motionFrom = motionSamples[0], motionTo = motionSamples[1] ?? motionFrom;
        if (from && to && motionFrom && motionTo) {
          const span = Math.max(1, to.t - from.t), frame = interpolateLiveSnapshot(from, to, (playhead - from.t) / span, now);
          const motionSpan = Math.max(1, motionTo.t - motionFrom.t), motion = interpolateLiveMotion(motionFrom, motionTo, (playhead - motionFrom.t) / motionSpan, now);
          frame.t = motion.t; frame.camera = motion.camera; frame.active = motion.active; frame.voidX = motion.voidX; frame.voidGrace = motion.voidGrace;
          frame.score = motion.score; frame.distance = motion.distance; frame.coinCount = motion.coinCount; frame.hp = motion.hp; frame.energy = motion.energy; frame.player = motion.player;
          if (frame.active !== shownHero) { shownHero = frame.active; setCurrentHero(frame.active); }
          const nextWorld = worldName(frame.worlds && frame.worlds >= 2 ? frame.distance : 0);
          if (nextWorld !== shownWorld) { shownWorld = nextWorld; setCurrentWorld(nextWorld); }
          drawLiveSnapshot(ctx, frame, sprites, fallbacks);
        }
      }
      animation = requestAnimationFrame(animate);
    };
    const acceptSnapshot = (incoming: LiveSnapshot) => {
      if (!alive) return;
      incoming.player.vx = Number(incoming.player.vx) || 0; incoming.player.vy = Number(incoming.player.vy) || 0;
      failures = 0;
      if (!snapshots.length || snapshots.at(-1)!.t < incoming.t) {
        snapshots.push(incoming); newestArrivedAt = performance.now();
        const samples = incoming.motion?.length ? incoming.motion : [{ t: incoming.t, camera: incoming.camera, active: incoming.active, voidX: incoming.voidX, voidGrace: incoming.voidGrace, score: incoming.score, distance: incoming.distance, coinCount: incoming.coinCount, hp: incoming.hp, energy: incoming.energy, player: incoming.player }];
        for (const sample of samples) if (!motionSamples.length || motionSamples.at(-1)!.t < sample.t) motionSamples.push(sample);
      }
    };
    const poll = async () => {
      if (polling) return; polling = true;
      try {
        const response = await fetch(`/api/live/${watching.sessionId}`); if (!response.ok) { if (response.status === 404) setWatchStatus("ended"); return; }
        const data = await response.json() as { snapshot: LiveSnapshot }; if (!alive) return;
        acceptSnapshot(data.snapshot);
      } catch { failures++; if (alive && failures >= 3) setWatchStatus("ended"); }
      finally { polling = false; }
    };
    const startFallback = () => {
      if (fallbackTimer) return;
      void poll(); fallbackTimer = window.setInterval(() => void poll(), LIVE_POLL_MS);
    };
    // Start the bounded request loop immediately. Long-lived streaming
    // responses can be buffered or terminated by mobile browsers/edge
    // runtimes, which used to leave spectators on an empty loading canvas.
    // Each response still carries the dense 90 ms motion trail, so rendering
    // remains continuous while this transport stays universally reliable.
    startFallback();
    const markViewer = () => void fetch(`/api/live/${watching.sessionId}/viewer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ viewerId: viewerIdRef.current }) });
    animation = requestAnimationFrame(animate); markViewer(); const viewerTimer = window.setInterval(markViewer, 5_000);
    return () => { alive = false; cancelAnimationFrame(animation); window.clearInterval(fallbackTimer); window.clearInterval(viewerTimer); void fetch(`/api/live/${watching.sessionId}/viewer`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ viewerId: viewerIdRef.current }), keepalive: true }).catch(() => {}); };
  }, [mode, watching]);

  useEffect(() => {
    if (mode !== "playing") return;
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d"); if (!canvas || !ctx) return; ctx.imageSmoothingEnabled = false;
    loadVerdantArt();
    const sprites = {} as Record<CharacterId, HTMLImageElement>, fallbacks = {} as Record<CharacterId, HTMLImageElement>;
    for (const c of CHARACTERS) { sprites[c.id] = new Image(); sprites[c.id].src = c.sprite; fallbacks[c.id] = new Image(); fallbacks[c.id].src = c.image; }
    const seed = { value: ((Date.now() * 2654435761) ^ Math.floor(performance.now() * 1000) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0 };
    const platforms: Platform[] = [{ x: -200, y: GROUND_Y, w: 980, h: 110 }];
    const coins: Coin[] = [], chests: Chest[] = [];
    const enemies: Enemy[] = [], shots: Shot[] = [], particles: Particle[] = [];
    const barriers: Barrier[] = [];
    const hazards: Shockwave[] = [];
    const skyHazards: SkyHazard[] = [];
    const icicleSpawns: {x:number;floor:number;triggered:boolean;kind?:"vent"|"beam"|"root"}[] = [];
    let bloom: Enemy | undefined;
    let glacier: Enemy | undefined;
    let magma: Enemy | undefined, sovereign: Enemy | undefined;
    let warden: Enemy | undefined;
    let bossBonus = 0;
    const frostWeather=createFrostWeather();
    const supplyClock: SupplyClock = { boss: "", coins: 8, health: 24 };
    let awaitingReward = false, rewardTaken = false, damageBonus = 0, speedBonus = 1;
    rewardChoice.current = choice => {
      if (!awaitingReward || rewardTaken || !["health", "damage", "speed"].includes(choice)) return;
      if (choice === "health") { player.maxHp++; player.hp = Math.min(player.maxHp, player.hp + 1); }
      if (choice === "damage") damageBonus += .5;
      if (choice === "speed") speedBonus += .1;
      rewardTaken = true; awaitingReward = false; keysRef.current = {}; setRewardOpen(false);
    };
    const player = { x: 120, y: GROUND_Y - 70, w: 43, h: 66, vx: 0, vy: 0, grounded: false, face: 1, hp: 3, maxHp: 5, phaseGuard: 0, energy: 100, invuln: 0, hurtTimer: 0, specialTimer: 0, maxX: 120, score: 0, coinCount: 0, kills: 0, guard: 0 };
    let active: CharacterId = selected, camera = 0, cursor = 780, terrainY = GROUND_Y, last = performance.now(), running = true, flash = 0, switchGlow = .5, switchCooldown = 0, lastCooldownDisplay = 0, voidX = -520, voidGrace = 4.5, cleanupClock = 0, lastBroadcast = 0, lastMotionSample = 0;
    const forestPatterns={bag:[] as number[],last:-1};
    let frostSections = 0, astralSections = 0;
    let enteredVerdant = false, enteredFrost = false;
    const liveStartedAt = Date.now();
    const pendingMotion: LiveMotionSample[] = [];
    const burst = (x: number, y: number, color: string, count = 8) => { for (let i = 0; i < count; i++) particles.push({ x, y, vx: (random(seed) - .5) * 270, vy: -80 - random(seed) * 240, life: .35 + random(seed) * .45, color, size: 3 + random(seed) * 5 }); };
    const swap = (next: CharacterId) => { if (pausedRef.current || awaitingReward || next === active || switchCooldown > 0) return; active = next; switchCooldown = 1; lastCooldownDisplay = 1; setSwitchCooldownUi(1); setCurrentHero(next); player.invuln = Math.max(player.invuln, .35); switchGlow = .38; burst(player.x + player.w / 2, player.y + 30, getChar(next).color, 18); playTone("switch", soundRef.current); };
    const generate = () => {
      while (cursor < camera + 2500) {
        if (!warden && cursor < VERDANT_START && cursor + 1400 >= ARENA_LEFT) {
          terrainY = GROUND_Y;
          const approachStart = Math.min(cursor, ARENA_LEFT - 160);
          platforms.push({ x: approachStart, y: terrainY, w: VERDANT_START + 420 - approachStart, h: H - terrainY + 30 });
          chests.push({ x: ARENA_LEFT - 100, y: terrainY - 34, opened: false, phase: 0 });
          platforms.push(...arenaSteps(terrainY));
          platforms.push(...kiranaBossSteps(ARENA_LEFT, terrainY));
          warden = { x: ARENA_LEFT + 800, y: terrainY - WARDEN_HEIGHT, w: 148, h: WARDEN_HEIGHT, vx: -1, alive: true, phase: 0, hp: WARDEN_HP, maxHp: WARDEN_HP, hitCooldown: 0, kind: "warden", engaged: false };
          enemies.push(warden);
          cursor = VERDANT_START + 420;
        }
        if (!bloom && cursor >= VERDANT_START && cursor < FROST_START && cursor + 1400 >= BLOOM_LEFT) {
          terrainY=GROUND_Y;
          const approachStart = Math.min(cursor, BLOOM_LEFT - 160);
          platforms.push({x:approachStart,y:GROUND_Y,w:FROST_START+220-approachStart,h:110});
          chests.push({x:BLOOM_LEFT-100,y:GROUND_Y-34,opened:false,phase:0});
          for(let i=0;i<5;i++)platforms.push({x:BLOOM_LEFT+130+i*230,y:GROUND_Y-(i%2?150:75),w:155,h:18});
          platforms.push(...kiranaBossSteps(BLOOM_LEFT, GROUND_Y));
          bloom={x:BLOOM_LEFT+690,y:135,w:175,h:160,vx:0,alive:true,phase:0,hp:84,maxHp:84,hitCooldown:0,kind:"bloom",engaged:false};
          enemies.push(bloom);cursor=FROST_START+220;
        }
        if(cursor>=EMBER_START){
          const astral=cursor>=ASTRAL_START,boss=astral?sovereign:magma,kind=astral?"sovereign":"magma",bounds=lateBossBounds(kind);
          if(!boss&&cursor+1400>=bounds.left){
            const approach=Math.min(cursor,bounds.left-160);platforms.push({x:approach,y:GROUND_Y,w:bounds.gate+420-approach,h:110,biome:astral?"astral":"ember"});
            chests.push({x:bounds.left-100,y:GROUND_Y-34,opened:false,phase:0});
            for(let i=0;i<4;i++)platforms.push({x:bounds.left+110+i*280,y:GROUND_Y-(i%2?170:85),w:170,h:18,biome:astral?"astral":"ember"});
            platforms.push(...kiranaBossSteps(bounds.left, GROUND_Y));
            const nextBoss:Enemy={x:bounds.left+700,y:astral?200:278,w:astral?190:280,h:astral?200:180,vx:110,alive:true,phase:0,hp:astral?140:120,maxHp:astral?140:120,hitCooldown:0,kind,engaged:false};
            if(astral)sovereign=nextBoss;else magma=nextBoss;enemies.push(nextBoss);cursor=bounds.gate+420;terrainY=GROUND_Y;continue;
          }
          if(cursor>=FINISH){platforms.push({x:cursor,y:GROUND_Y,w:3000,h:110,biome:"astral"});cursor+=3000;continue;}
          if(astral && ++astralSections % 3 === 0){
            const section=highHeroSection(cursor,terrainY,true);platforms.push(...section.platforms);
            const peak=section.platforms[1];for(let i=0;i<5;i++)coins.push({x:peak.x+40+i*65,y:peak.y-35,got:false,phase:0});
            cursor=section.end;continue;
          }
          const section=lateSection(cursor,terrainY,()=>random(seed));platforms.push(...section.platforms);icicleSpawns.push(...section.traps);
          for(const p of section.platforms.slice(1,-1))coins.push({x:p.x+p.w/2,y:p.y-45,got:false,phase:0});
          enemies.push(...spawnLateEnemies(section,astral,()=>random(seed)));
          cursor=section.end;terrainY=section.floor;continue;
        }
        if(cursor>=FROST_START){
          if(!glacier && cursor + 1800 >= GLACIER_LEFT){
            const approach = Math.min(cursor, GLACIER_LEFT-160);
            platforms.push({x:approach,y:GROUND_Y,w:GLACIER_GATE+420-approach,h:110,ice:"solid"});
            // A small stair joins an elevated route to the level boss approach.
            if(terrainY<GROUND_Y)platforms.push({x:approach,y:terrainY,w:150,h:18,ice:"solid"});
            chests.push({x:GLACIER_LEFT-100,y:GROUND_Y-34,opened:false,phase:0});
            for(let i=0;i<4;i++)platforms.push({x:GLACIER_LEFT+120+i*280,y:GROUND_Y-(i%2?170:85),w:165,h:18,ice:"solid"});
            platforms.push(...kiranaBossSteps(GLACIER_LEFT, GROUND_Y));
            glacier={x:GLACIER_LEFT+1000,y:GROUND_Y-130,w:270,h:130,vx:0,alive:true,phase:0,hp:100,maxHp:100,hitCooldown:0,kind:"glacier",engaged:false};
            enemies.push(glacier);cursor=GLACIER_GATE+420;terrainY=GROUND_Y;continue;
          }
          if(++frostSections % 3 === 0){
            const section=highHeroSection(cursor,terrainY,false);platforms.push(...section.platforms);
            const peak=section.platforms[1];for(let i=0;i<5;i++)coins.push({x:peak.x+40+i*65,y:peak.y-35,got:false,phase:0});
            cursor=section.end;continue;
          }
          const section=frostSection(cursor,terrainY,()=>random(seed));
          platforms.push(...section.platforms);icicleSpawns.push(...section.traps);
          for(const p of section.platforms.slice(1,-1))coins.push({x:p.x+p.w/2,y:p.y-48,got:false,phase:random(seed)*6});
          const kind: EnemyKind=(["crystal","icewolf","frostgolem"] as const)[Math.floor(random(seed)*3)],h=kind==="frostgolem"?80:kind==="icewolf"?46:52;
          const homeY=section.floor-h-(kind==="crystal"?100:0);
          enemies.push({x:section.landing+90,y:homeY,homeY,w:kind==="frostgolem"?72:58,h,vx:-45,alive:true,phase:0,hp:kind==="frostgolem"?8:4,maxHp:kind==="frostgolem"?8:4,hitCooldown:0,kind,patrolLeft:section.landing+10,patrolRight:section.end-10});
          if(random(seed)<.2)chests.push({x:section.landing+180,y:section.floor-34,opened:false,phase:0});
          cursor=section.end;terrainY=section.floor;continue;
        }
        if (cursor >= VERDANT_START) {
          const section = verdantSection(cursor, terrainY, nextForestPattern(forestPatterns,()=>random(seed)), () => random(seed));
          platforms.push(...section.platforms); icicleSpawns.push(...section.traps);
          for (const p of section.platforms.slice(1, -1)) coins.push({x:p.x+p.w/2,y:p.y-40,got:false,phase:random(seed)*6});
          const kind = (["moss", "wasp", "golem"] as const)[Math.floor(random(seed)*3)];
          const w = kind === "golem" ? 72 : 48, h = kind === "golem" ? 74 : kind === "wasp" ? 56 : 34;
          const hp = kind === "golem" ? 6 : kind === "moss" ? 3 : 2;
          const homeY = section.floor-h-(kind === "wasp" ? 70 : 0);
          enemies.push({x:section.landing+35+random(seed)*90,y:homeY,homeY,w,h,vx:kind === "wasp" ? -65 : -42,alive:true,phase:0,hp,maxHp:hp,hitCooldown:0,kind,patrolLeft:section.landing+20,patrolRight:section.end-15});
          if(random(seed)<.4){const perch=section.platforms[1+Math.floor(random(seed)*(section.platforms.length-2))];const homeY=perch.y-110;enemies.push({kind:"wasp",x:perch.x+20,y:homeY,homeY,w:48,h:56,vx:random(seed)<.5?-55:55,alive:true,phase:random(seed)*6,hp:2,maxHp:2,hitCooldown:0,patrolLeft:perch.x,patrolRight:perch.x+perch.w});}
          if(section.pattern === 2)chests.push({x:cursor+610,y:section.floor-184,opened:false,phase:0});
          cursor=section.end;terrainY=section.floor;continue;
        }
        const verdant = cursor >= VERDANT_START;
        const challenge = Math.floor(random(seed) * 6); let gap = 58 + random(seed) * 72;
        if (challenge === 2) gap = 205 + random(seed) * 18;
        if (challenge === 3) gap = 205 + random(seed) * 22;
        if (challenge === 5) gap = 430 + random(seed) * 25;
        const elevationRoll = random(seed); let elevationStep = elevationRoll < .14 ? -90 : elevationRoll < .29 ? -60 : elevationRoll < .43 ? -30 : elevationRoll < .57 ? 0 : elevationRoll < .72 ? 30 : elevationRoll < .87 ? 60 : 90;
        if ((challenge === 2 || challenge === 3) && elevationStep < -60) elevationStep = -60;
        if (challenge === 5) elevationStep = clamp(elevationStep, -30, 30);
        const nextY = clamp(terrainY + elevationStep, verdant ? 310 : 280, GROUND_Y);
        const start = cursor + gap, width = challenge === 1 ? 820 + random(seed) * 160 : 430 + random(seed) * 300; platforms.push({ x: start, y: nextY, w: width, h: H - nextY + 30 });
        if (challenge === 2) {
          const bridgeBase = Math.min(terrainY, nextY) - 12;
          platforms.push({ x: cursor + 35, y: bridgeBase, w: 64, h: 18, require: "kirana" }, { x: cursor + 103, y: bridgeBase - 42, w: 64, h: 18, require: "kirana" }, { x: cursor + 171, y: bridgeBase, w: 64, h: 18, require: "kirana" });
        }
        if (challenge === 5) {
          for (let i = 0; i < 6; i++) {
            const progress = (i + 1) / 7, stepY = terrainY + (nextY - terrainY) * progress - 22 - Math.sin(progress * Math.PI) * 34;
            platforms.push({ x: cursor + 30 + i * 68, y: stepY, w: 54, h: 18, require: "kirana" });
          }
        }
        if (challenge === 0) barriers.push({ x: start + width * .55, y: nextY - 126, w: 18, h: 126, alive: true, kind: "laser", requires: "timmy" });
        if (challenge === 1) { const wallWidth = 552; barriers.push({ x: start + (width - wallWidth) * .5, y: nextY - 76, w: wallWidth, h: 76, alive: true, kind: "wall", requires: "dylan" }); }
        if (challenge !== 1 && challenge !== 5 && random(seed) > .62) barriers.push({ x: start + width * .72, y: nextY - 42, w: 38, h: 42, alive: true, kind: "hurdle", requires: "timmy" });
        if (challenge === 4) { const px = start + width * .28, highY = Math.max(190, nextY - 178); platforms.push({ x: px, y: highY, w: 150, h: 18 }); for (let i = 0; i < 3; i++) coins.push({ x: px + 35 + i * 42, y: highY - 35, got: false, phase: random(seed) * 6 }); }
        const count = 2 + Math.floor(random(seed) * 5); for (let i = 0; i < count; i++) coins.push({ x: start + 60 + i * 46, y: nextY - 62 - Math.sin(i / Math.max(1, count - 1) * Math.PI) * 38, got: false, phase: random(seed) * 6 });
        if (start > 900 && random(seed) < .18) chests.push({ x: start + width * (.18 + random(seed) * .26), y: nextY - 34, opened: false, phase: random(seed) * 6 });
        if (verdant) {
          const kind: EnemyKind = start < VERDANT_START + 1300 ? "moss" : start < VERDANT_START + 2400 ? "wasp" : (["moss", "wasp", "golem"] as const)[Math.floor(random(seed) * 3)];
          const w = kind === "golem" ? 72 : kind === "wasp" ? 56 : 48, h = kind === "golem" ? 74 : kind === "wasp" ? 56 : 34;
          const hp = kind === "golem" ? 6 : kind === "moss" ? 3 : 2;
          const homeY = nextY - h - (kind === "wasp" ? 48 : 0);
          enemies.push({ x: start + width * .48, y: homeY, w, h, vx: kind === "golem" ? -54 : kind === "wasp" ? -72 : -48, alive: true, phase: 0, hp, maxHp: hp, hitCooldown: 0, kind, homeY, patrolLeft: start + 30, patrolRight: start + width - 30 });
        } else if (random(seed) > .35) {
          const monsterRoll = random(seed), colossus = start > 6200 && monsterRoll < .08, elite = !colossus && start > 3400 && monsterRoll < .28;
          const normalKinds: EnemyKind[] = ["crawler", "drone", "horned"], kind: EnemyKind = colossus ? "colossus" : elite ? "titan" : normalKinds[Math.floor(random(seed) * normalKinds.length)];
          const w = colossus ? 120 : elite ? 64 : kind === "horned" ? 44 : kind === "drone" ? 42 : 38, h = colossus ? 220 : elite ? 58 : kind === "horned" ? 40 : kind === "drone" ? 28 : 32;
          const hp = colossus ? 12 : elite ? 7 + Math.floor(random(seed) * 2) : start < 2400 ? 1 : 1 + Math.floor(random(seed) * Math.min(3, 1 + Math.floor(start / 3200)));
          const hover = kind === "drone" ? 22 : 0;
          enemies.push({ x: start + width * (.35 + random(seed) * .42), y: nextY - h - hover, w, h, vx: (random(seed) > .5 ? 1 : -1) * (colossus ? 20 : elite ? 28 : kind === "drone" ? 58 : 42), alive: true, phase: random(seed) * 6, hp, maxHp: hp, hitCooldown: 0, kind });
        }
        cursor = start + width; terrainY = nextY;
      }
    };
    const weapon = () => {
      const cost = active === "timmy" ? 75 : 30; if (pausedRef.current || awaitingReward || player.energy < cost || (active === "timmy" && player.phaseGuard > 0)) return; const c = getChar(active); player.energy -= cost; player.specialTimer = .72; flash = .2; playTone("special", soundRef.current);
      if (active === "adelia") { shots.push({ x: player.x + 20, y: player.y + 30, vx: player.face * 420, vy: 0, life: .8, kind: "shield", radius: 40, color: c.color }); }
      if (active === "eldric") for (const vy of [-135, 0, 135]) shots.push({ x: player.x + 20, y: player.y + 28, vx: player.face * 545, vy, life: 1.05, kind: "bolt", radius: 14, color: c.color });
      if (active === "kirana") shots.push({ x: player.x + 20, y: player.y + 30, vx: 0, vy: 0, life: .58, kind: "pulse", radius: 14, color: c.color });
      if (active === "timmy") { player.phaseGuard = 2.5; player.invuln = Math.max(player.invuln, 2.5); }
      if (active === "dylan") shots.push({ x: player.x + 20, y: player.y + 30, vx: player.face * 390, vy: 0, life: .46, kind: "slash", radius: 58, color: c.color });
      burst(player.x + 20, player.y + 30, c.color, 14);
    };
    const jump = () => { if (!pausedRef.current && !awaitingReward && player.grounded) { player.vy = active === "eldric" ? -820 : -625; player.grounded = false; playTone("jump", soundRef.current); } };
    const cycle = () => swap(CHARACTERS[(CHARACTERS.findIndex(c => c.id === active) + 1) % CHARACTERS.length].id);
    let cheatSequence = "", cheatUsed = false;
    const selectHero = (next: CharacterId) => {
      if (pausedRef.current || awaitingReward) return;
      if (!cheatUsed && player.maxX < 1000) {
        cheatSequence = (cheatSequence + (CHARACTERS.findIndex(c => c.id === next) + 1)).slice(-5);
        const destination=CHEAT_TARGETS[cheatSequence];
        if (destination) {
          cheatUsed = true;
          // Rebuild the destination before resuming physics: no skipped boss gate or unsafe landing.
          platforms.length = coins.length = chests.length = enemies.length = barriers.length = 0;
          shots.length = particles.length = hazards.length = skyHazards.length = icicleSpawns.length = 0;
          warden = undefined; bloom = undefined; glacier = undefined; magma = undefined; sovereign = undefined;
          Object.assign(frostWeather,createFrostWeather());
          cursor = destination; terrainY = GROUND_Y; camera = destination - 280;
          player.x = player.maxX = destination; player.y = GROUND_Y - player.h;
          player.vx = player.vy = 0; player.grounded = true; player.face = 1;
          player.invuln = 1; player.phaseGuard = player.hurtTimer = player.specialTimer = 0;
          active = "timmy"; switchCooldown = lastCooldownDisplay = 0;
          setCurrentHero("timmy"); setSwitchCooldownUi(0);
          enteredVerdant = destination>=VERDANT_START; enteredFrost=destination>=FROST_START; setCurrentWorld(worldName(destination/10));
          voidX = player.x - 640; voidGrace = 4.5;
          keysRef.current = {}; pendingMotion.length = 0;
          generate(); switchGlow = .5; flash = .2;
          burst(player.x + player.w / 2, player.y + 30, getChar(active).color, 18);
          playTone("switch", soundRef.current);
          return;
        }
      }
      swap(next);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape" && !awaitingReward && !pausedRef.current) { e.preventDefault(); changePause(true); return; }
      if (pausedRef.current || awaitingReward) return;
      keysRef.current[e.code] = true; if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) jump(); if (["KeyE", "KeyK"].includes(e.code)) weapon(); if (e.code === "KeyQ") cycle();
      const n = Number(e.key); if (!e.repeat && n >= 1 && n <= 5) selectHero(CHARACTERS[n - 1].id);
    };
    const onKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; };
    const releaseMovement = () => { keysRef.current = {}; };
    const onAction = (e: Event) => { const action = (e as CustomEvent<string>).detail; if (action === "jump") jump(); else if (action === "special") weapon(); else if (action === "cycle") cycle(); else if (action.startsWith("switch:")) selectHero(action.split(":")[1] as CharacterId); };
    window.addEventListener("keydown", onKeyDown); window.addEventListener("keyup", onKeyUp); window.addEventListener("tekad-action", onAction);
    window.addEventListener("blur", releaseMovement);

    let lastHudUpdate = 0;
    const frame = (now: number) => {
      if (!running) return; const dt = Math.min(.033, (now - last) / 1000); last = now; const c = getChar(active);
      if (!pausedRef.current && !awaitingReward) {
      generate();
      switchCooldown = Math.max(0, switchCooldown - dt); const cooldownDisplay = Math.ceil(switchCooldown * 10) / 10; if (cooldownDisplay !== lastCooldownDisplay) { lastCooldownDisplay = cooldownDisplay; setSwitchCooldownUi(cooldownDisplay); }
      const left = keysRef.current.ArrowLeft || keysRef.current.KeyA || keysRef.current.touchLeft, right = keysRef.current.ArrowRight || keysRef.current.KeyD || keysRef.current.touchRight, target = (right ? 1 : 0) - (left ? 1 : 0); if (target) player.face = target;
      const baseSpeed = active === "adelia" ? 400 : active === "dylan" ? 305 : active === "kirana" ? 285 : 275;
      const insideSlowWall = active !== "adelia" && barriers.some(b => b.alive && b.kind === "wall" && overlap(player.x, player.y, player.w, player.h, b.x, b.y, b.w, b.h));
      const riding = player.grounded ? platforms.find(p => (!p.gone || p.gone <= 0) && Math.abs(player.y + player.h - p.y) < 3 && player.x + player.w > p.x && player.x < p.x + p.w) : undefined;
      stepIcePlatforms(platforms,dt,player);
      stepForestPlatforms(platforms,dt,player);
      if(riding?.ice==="lift")player.y+=riding.dy||0;
      if(riding?.conveyor)player.x+=riding.conveyor*dt;
      const weatherSpeed=stepFrostWeather(frostWeather,dt,player.x,()=>random(seed));
      const speed = weatherSpeed * baseSpeed * speedBonus * (insideSlowWall ? .32 : 1);
      player.vx += (target * speed - player.vx) * Math.min(1, dt * (player.grounded ? riding?.ice === "solid" ? 7 : 11 : 5)); player.vy += 1750 * dt; const oldX = player.x, oldY = player.y; player.x += player.vx * dt; player.y += player.vy * dt; player.grounded = false;
      for (const p of platforms) if ((!p.gone || p.gone <= 0) && (!p.require || p.require === active) && player.vy >= 0 && player.x + player.w > p.x && player.x < p.x + p.w && oldY + player.h <= p.y - (p.dy || 0) + 8 && player.y + player.h >= p.y) { player.y = p.y - player.h; player.vy = 0; player.grounded = true; }
      for (const b of barriers) if (b.alive) {
        const near = overlap(player.x, player.y, player.w, player.h, b.x, b.y, b.w, b.h);
        if (b.kind === "wall" && near) { if (active !== "adelia") { const slowLimit = baseSpeed * .32; player.vx = clamp(player.vx, -slowLimit, slowLimit); } }
        else if (active === "timmy" && ((b.kind === "laser" && Math.abs(player.x - b.x) < 55) || (b.kind === "hurdle" && near))) { b.alive = false; burst(b.x + b.w / 2, b.y + b.h / 2, c.color, 16); }
        else if (b.kind === "speed" && active === "adelia" && Math.abs(player.vx) > 325 && near) { b.alive = false; burst(b.x, b.y + 60, c.color, 16); }
        else if (near) { if (player.vx > 0 && oldX + player.w <= b.x + 8) player.x = b.x - player.w; else if (player.vx < 0) player.x = b.x + b.w; player.vx *= -.08; }
      }
      if (warden?.alive && player.x >= ARENA_ENTRY && !warden.engaged) {
        warden.engaged = true; voidX = Math.min(voidX, ARENA_LEFT - 260); player.energy = 100;
        for (const enemy of enemies) if (enemy !== warden && enemy.x < VERDANT_START) enemy.alive = false;
      }
      if (warden?.alive && warden.engaged) {
        const bounded = clampArenaPlayer(player.x, player.w);
        if (bounded !== player.x) player.vx = 0;
        player.x = bounded;
      }
      if(bloom?.alive&&player.x>=BLOOM_ENTRY&&!bloom.engaged){bloom.engaged=true;skyHazards.length=0;for(const trap of icicleSpawns)if(trap.kind==="root")trap.triggered=true;voidX=Math.min(voidX,BLOOM_LEFT-260);player.energy=100;for(const e of enemies)if(e!==bloom&&e.x>=VERDANT_START&&e.x<FROST_START)e.alive=false;}
      if(bloom?.alive&&bloom.engaged){const bounded=clamp(player.x,BLOOM_LEFT+24,BLOOM_GATE-player.w);if(player.x!==bounded)player.vx=0;player.x=bounded;}
      if(glacier?.alive&&player.x>=GLACIER_ENTRY&&!glacier.engaged){glacier.engaged=true;voidX=Math.min(voidX,GLACIER_LEFT-260);player.energy=100;skyHazards.length=0;for(const trap of icicleSpawns)trap.triggered=true;for(const e of enemies)if(e!==glacier&&e.x>=FROST_START)e.alive=false;}
      if(glacier?.alive&&glacier.engaged){const bounded=clamp(player.x,GLACIER_LEFT+24,GLACIER_GATE-player.w);if(player.x!==bounded)player.vx=0;player.x=bounded;}
      for(const boss of [magma,sovereign])if(boss?.alive){const bounds=lateBossBounds(boss.kind);if(!boss.engaged&&player.x>=bounds.entry){boss.engaged=true;voidX=Math.min(voidX,bounds.left-260);player.energy=100;skyHazards.length=0;for(const trap of icicleSpawns)trap.triggered=true;for(const e of enemies)if(e!==boss&&e.x>=bounds.left-2000&&e.x<bounds.gate)e.alive=false;}if(boss.engaged){const bounded=clamp(player.x,bounds.left+24,bounds.gate-player.w);if(bounded!==player.x)player.vx=0;player.x=bounded;}}
      player.x = Math.max(camera - 80, player.x); player.maxX = Math.max(player.maxX, player.x); player.energy = Math.min(100, player.energy + dt * 10); player.phaseGuard = Math.max(0, player.phaseGuard - dt); player.invuln = Math.max(0, player.invuln - dt); player.hurtTimer = Math.max(0, player.hurtTimer - dt); player.specialTimer = Math.max(0, player.specialTimer - dt); player.guard = Math.max(0, player.guard - dt); flash = Math.max(0, flash - dt); switchGlow = Math.max(0, switchGlow - dt); camera += ((player.x - 280) - camera) * Math.min(1, dt * 5); camera = Math.max(0, camera);
      if (warden?.alive && warden.engaged) {
        camera = clamp(camera, ARENA_LEFT, VERDANT_START - W);
        player.energy = Math.min(100, player.energy + dt * 12);
      }
      if(bloom?.alive&&bloom.engaged){camera=clamp(camera,BLOOM_LEFT,FROST_START-W);player.energy=Math.min(100,player.energy+dt*12);}
      if(glacier?.alive&&glacier.engaged){camera=clamp(camera,GLACIER_LEFT,GLACIER_GATE+20-W);player.energy=Math.min(100,player.energy+dt*12);}
      for(const boss of [magma,sovereign])if(boss?.alive&&boss.engaged){const b=lateBossBounds(boss.kind);camera=clamp(camera,b.left,b.gate+20-W);player.energy=Math.min(100,player.energy+dt*12);}
      if(player.maxX>=EMBER_START)setCurrentWorld(worldName(player.maxX/10));
      if(!enteredFrost&&player.maxX>=FROST_START){enteredFrost=true;setCurrentWorld("Frostbound Citadel");playTone("switch",soundRef.current);}
      if (!enteredVerdant && player.maxX >= VERDANT_START) {
        enteredVerdant = true; setCurrentWorld("Verdant Ruins");
        burst(player.x + 20, player.y + 25, "#8dffce", 24); playTone("switch", soundRef.current);
      }
      voidGrace = Math.max(0, voidGrace - dt);
      if (voidGrace <= 0 && !(warden?.alive && warden.engaged) && !(bloom?.alive && bloom.engaged) && !(glacier?.alive && glacier.engaged) && !(magma?.alive && magma.engaged) && !(sovereign?.alive && sovereign.engaged)) { const lead = player.x - voidX, progressBoost = Math.min(55, player.maxX / 160), idleBoost = Math.abs(player.vx) < 45 ? 32 : 0, catchup = clamp((lead - 520) * .3, 0, 220); voidX += (60 + progressBoost + idleBoost + catchup) * dt * weatherSpeed; }
      const supplyBoss = sovereign?.alive&&sovereign.engaged?sovereign:magma?.alive&&magma.engaged?magma:glacier?.alive && glacier.engaged ? glacier : bloom?.alive && bloom.engaged ? bloom : warden?.alive && warden.engaged ? warden : undefined;
      const supplyLeft = supplyBoss && ["magma","sovereign"].includes(supplyBoss.kind) ? lateBossBounds(supplyBoss.kind).left : supplyBoss?.kind === "glacier" ? GLACIER_LEFT : supplyBoss?.kind === "bloom" ? BLOOM_LEFT : ARENA_LEFT;
      const supplyRight = supplyBoss && ["magma","sovereign"].includes(supplyBoss.kind) ? lateBossBounds(supplyBoss.kind).gate : supplyBoss?.kind === "glacier" ? GLACIER_GATE : supplyBoss?.kind === "bloom" ? BLOOM_GATE : ARENA_GATE;
      const arenaCoins = coins.filter(coin => !coin.got && coin.x >= supplyLeft && coin.x <= supplyRight).length;
      const arenaChests = chests.filter(chest => !chest.opened && chest.x >= supplyLeft && chest.x <= supplyRight).length;
      for (const drop of bossSupplies(supplyClock, supplyBoss?.kind, supplyLeft, supplyRight, dt, arenaCoins, arenaChests, () => random(seed))) {
        if (drop.kind === "coin") coins.push({ x: drop.x, y: GROUND_Y - 52, got: false, phase: random(seed) * 6 });
        else chests.push({ x: drop.x, y: GROUND_Y - 34, opened: false, phase: random(seed) * 6 });
        burst(drop.x + (drop.kind === "health" ? 21 : 0), GROUND_Y - 34, drop.kind === "coin" ? "#ffd44d" : "#8dffce", 10);
      }
      if (active === "kirana") for (const coin of coins) if (!coin.got) { const dx = player.x + 20 - coin.x, dy = player.y + 25 - coin.y, d = Math.hypot(dx, dy); if (d < 145 && d > 4) { coin.x += dx / d * 260 * dt; coin.y += dy / d * 260 * dt; } }
      for (const coin of coins) if (!coin.got && overlap(player.x, player.y, player.w, player.h, coin.x - 12, coin.y - 12, 24, 24)) { coin.got = true; player.coinCount++; player.energy = Math.min(100, player.energy + 7); burst(coin.x, coin.y, "#ffd44d", 7); playTone("coin", soundRef.current); }
      for (const chest of chests) if (!chest.opened && overlap(player.x, player.y, player.w, player.h, chest.x, chest.y, 42, 34)) { chest.opened = true; player.hp = Math.min(player.maxHp, player.hp + 1); player.score += 200; burst(chest.x + 21, chest.y + 12, "#91ffcb", 22); playTone("coin", soundRef.current); }
      for (const s of shots) { s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; if (s.kind === "pulse") s.radius += 380 * dt; }
      for (const b of barriers) if (b.alive && b.kind === "wall") for (const s of shots) if (s.life > 0 && s.kind === "slash" && overlap(s.x - s.radius, s.y - s.radius, s.radius * 2, s.radius * 2, b.x, b.y, b.w, b.h)) { b.alive = false; s.life = 0; burst(b.x + 20, b.y + 35, "#ef5350", 22); player.score += 350; }
      for (const e of enemies) if (e.alive) {
        e.hitCooldown = Math.max(0, e.hitCooldown - dt);
        if(e.kind==="magma"||e.kind==="sovereign"){if(!e.engaged)continue;skyHazards.push(...stepLateBoss(e,player.x,player.y,dt));}else if(isLateEnemy(e.kind)){skyHazards.push(...stepLateEnemy(e,dt,player.x,player.y));}else if(e.kind==="glacier"){
          if(!e.engaged)continue;
          skyHazards.push(...stepGlacier(e,player.x,dt));
        } else if(e.kind==="bloom"){
          if(!e.engaged)continue;
          skyHazards.push(...stepBloom(e,player.x,dt));
        } else if(isFrostEnemy(e.kind)) {
          stepFrostEnemy(e,dt);
        } else if (e.kind === "warden") {
          if (!e.engaged) continue;
          hazards.push(...stepWarden(e, player.x, dt));
        } else {
          e.phase += dt * (isVerdantEnemy(e.kind) ? 2.1 : 4);
          if (isVerdantEnemy(e.kind)) stepVerdantEnemy(e, dt); else e.x += e.vx * dt;
        }
        for (const s of shots) if (s.life > 0 && e.hitCooldown <= 0 && (isBeastBoss(e) ? shotHitsBeast(e,s) : Math.hypot(e.x + e.w / 2 - s.x, e.y + e.h / 2 - s.y) < s.radius + Math.max(e.w, e.h) * .55)) {
          const damage = (s.kind === "slash" ? 4 : s.kind === "shield" ? 2 : e.kind === "warden" ? 2 : 1) + damageBonus; e.hp -= damage; e.hitCooldown = .22; burst(e.x + e.w / 2, e.y + e.h / 2, s.color, e.hp <= 0 ? 16 : 6);
          if (s.kind !== "disc" && s.kind !== "pulse") s.life = 0;
          if (e.hp <= 0) { e.alive = false; player.kills++;
            if (e.kind === "warden") { hazards.length = 0; bossBonus = 2000; awaitingReward = true; keysRef.current = {}; player.invuln = Math.max(player.invuln, 1); setRewardWorld("EARTH 3000"); rewardTaken=false; setRewardOpen(true); player.energy = 100; voidGrace = 4.5; voidX = Math.min(voidX, player.x - 650); burst(e.x + e.w / 2, e.y + e.h / 2, "#d895ff", 50); }
            if(e.kind==="magma"||e.kind==="sovereign"){skyHazards.length=0;bossBonus+=e.kind==="magma"?8000:10000;player.energy=100;player.invuln=2;voidGrace=4.5;voidX=Math.min(voidX,player.x-650);if(e.kind==="magma"){awaitingReward=true;rewardTaken=false;keysRef.current={};setRewardWorld("EMBER FOUNDRY");setRewardOpen(true);}burst(e.x+e.w/2,e.y+e.h/2,"#e6b5ff",45);}
            if(e.kind==="glacier"){skyHazards.length=0;bossBonus+=6000;awaitingReward=true;rewardTaken=false;keysRef.current={};setRewardWorld("FROSTBOUND CITADEL");setRewardOpen(true);player.energy=100;player.invuln=Math.max(player.invuln,1);voidGrace=4.5;voidX=Math.min(voidX,player.x-650);burst(e.x+e.w/2,e.y+e.h/2,"#a4efff",45);}
            if(e.kind==="bloom"){skyHazards.length=0;bossBonus+=4000;awaitingReward=true;rewardTaken=false;keysRef.current={};setRewardWorld("VERDANT RUINS");setRewardOpen(true);player.energy=100;player.invuln=Math.max(player.invuln,1);voidGrace=4.5;voidX=Math.min(voidX,player.x-650);burst(e.x+e.w/2,e.y+e.h/2,"#9fffbe",45);}
             if (active === "kirana") coins.push({ x: e.x + 15, y: e.y, got: false, phase: 0 }); }
          break;
        }
        const touchingEnemy = e.alive && (isBeastBoss(e) ? beastTouchesPlayer(e,player) : overlap(player.x, player.y, player.w, player.h, e.x, e.y, e.w, e.h));
        if (touchingEnemy && player.invuln <= 0) {
          player.hp--; player.invuln = 1.2; player.hurtTimer = .56; player.specialTimer = 0; player.vx = -player.face * 300; player.vy = -320; burst(player.x, player.y + 25, "#ff5263", 14); playTone("hit", soundRef.current);
        }
        if (touchingEnemy && e.kind === "colossus" && player.phaseGuard <= 0) {
          if (player.x + player.w / 2 < e.x + e.w / 2) { player.x = e.x - player.w; player.vx = Math.min(0, player.vx); }
          else { player.x = e.x + e.w; player.vx = Math.max(0, player.vx); }
        }
      }
      for (const wave of hazards) {
        wave.x += wave.vx * dt; wave.life -= dt;
        if (wave.life > 0 && player.invuln <= 0 && overlap(player.x, player.y, player.w, player.h, wave.x, wave.y, wave.w, wave.h)) {
          player.hp--; player.invuln = 1.2; player.hurtTimer = .56; wave.life = 0; playTone("hit", soundRef.current);
        }
      }
      for(const trap of icicleSpawns)if(!trap.triggered&&Math.abs(player.x-trap.x)<220){trap.triggered=true;skyHazards.push({x:trap.x,y:trap.kind==='beam'?trap.floor-240:trap.kind==='vent'?trap.floor-105:trap.kind==='root'?trap.floor-80:95,w:trap.kind==='vent'?38:28,h:trap.kind==='beam'?240:trap.kind==='vent'?105:trap.kind==='root'?80:65,vx:0,vy:trap.kind?0:370,life:3,warning:1.3,kind:trap.kind??'icicle',floor:trap.floor});}
      stepSkyHazards(skyHazards,dt);
      for(const h of skyHazards)if(h.life>0&&h.warning<=0&&player.invuln<=0&&overlap(player.x,player.y,player.w,player.h,h.x,h.y,h.w,h.h)){player.hp--;player.invuln=1.2;player.hurtTimer=.56;h.life=0;playTone("hit",soundRef.current);}
      compactInPlace(skyHazards,h=>h.life>0&&h.x>camera-250);
      compactInPlace(icicleSpawns,h=>h.x>camera-700);
      compactInPlace(hazards, wave => wave.life > 0 && wave.x > ARENA_LEFT - 100 && wave.x < ARENA_GATE + 100);
      for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 540 * dt; p.life -= dt; }
      cleanupClock += dt;
      if (cleanupClock >= 1.5) {
        cleanupClock = 0; const cutoff = camera - 700, farEdge = camera + W + 1400;
        compactInPlace(platforms, p => p.x + p.w > cutoff);
        compactInPlace(coins, coin => !coin.got && coin.x > cutoff);
        compactInPlace(chests, chest => !chest.opened && chest.x + 42 > cutoff);
        compactInPlace(enemies, enemy => enemy.alive && (["warden","bloom","glacier","magma","sovereign"].includes(enemy.kind) || enemy.x + enemy.w > cutoff));
        compactInPlace(barriers, barrier => barrier.alive && barrier.x + barrier.w > cutoff);
        compactInPlace(shots, shot => shot.life > 0 && shot.x > cutoff && shot.x < farEdge);
        compactInPlace(particles, particle => particle.life > 0 && particle.x > cutoff - 200 && particle.x < farEdge);
      }
      player.score = Math.max(player.score, Math.floor((player.maxX - 120) / 5) + player.coinCount * 100 + player.kills * 250 + bossBonus); if(sovereign&&!sovereign.alive&&player.x>=FINISH){running=false;setHud({hp:player.hp,maxHp:player.maxHp,energy:Math.floor(player.energy),distance:FINISH/10,score:player.score,storm:"—",boss:""});finishGame(player.score,FINISH/10,active);setMode("victory");return;} if (player.y > H + 120 || player.hp <= 0 || voidX + 20 >= player.x) { running = false; finishGame(player.score, Math.floor(player.maxX / 10), active); return; }

      } // Reward selection freezes simulation; rendering and live snapshots continue.
      drawWorld(ctx, camera, player.maxX / 10, now);
      for (const p of platforms) { const sx = Math.floor(p.x - camera); if (sx < W + 100 && sx + p.w > -100) drawPlatform(ctx, p, sx, active); }
      for (const b of barriers) if (b.alive) drawObstacle(ctx, b, camera);
      for (const coin of coins) if (!coin.got) drawCoinDetail(ctx,coin,camera,now);
      for (const chest of chests) drawChestDetail(ctx,chest,camera,now);
      for (const e of enemies) if (e.alive) { const x = Math.floor(e.x - camera), bob = isVerdantEnemy(e.kind) ? 0 : e.kind === "drone" ? Math.sin(e.phase) * 7 : e.kind === "bloom" || e.kind === "glacier" || e.kind === "magma" || isFrostEnemy(e.kind) ? 0 : Math.sin(e.phase) * 2, y = Math.floor(e.y + bob); if (x + e.w > -90 && x < W + 90) drawEnemy(ctx, e, x, y); }
      for (const s of shots) if (s.life > 0) drawShot(ctx, s, camera, now);
      for (const p of particles) if (p.life > 0) { ctx.globalAlpha=clamp(p.life*2,0,1);ctx.strokeStyle=p.color;ctx.lineWidth=p.size;ctx.beginPath();ctx.moveTo(p.x-camera,p.y);ctx.lineTo(p.x-camera-p.vx*.018,p.y-p.vy*.018);ctx.stroke();ctx.fillStyle="#fff6de";ctx.fillRect(p.x-camera,p.y,2,2); } ctx.globalAlpha=1;
      drawFrostWeather(ctx,frostWeather,W,H);
      drawVoidStorm(ctx, voidX - camera, now, voidGrace);
      drawBossFight(ctx, warden, hazards, camera, player.x, W);
      drawSkyHazards(ctx, skyHazards, camera);drawBloomFight(ctx,bloom,camera);drawGlacierFight(ctx,glacier,camera);drawLateFight(ctx,magma,camera);drawLateFight(ctx,sovereign,camera);
      const px = Math.floor(player.x - camera), py = Math.floor(player.y), sprite = sprites[active], fallback = fallbacks[active];
      if (player.phaseGuard > 0) {
        ctx.save(); ctx.strokeStyle = "#c5b1ff"; ctx.lineWidth = 3;
        ctx.strokeRect(px - 8, py - 12, player.w + 16, player.h + 18);
        pixelText(ctx, `PHASE ${player.phaseGuard.toFixed(1)}s`, px + player.w / 2, py - 24, 12, "#e6dbff", "center"); ctx.restore();
      }
      if(now-lastHudUpdate>100){
        lastHudUpdate=now;
        const boss=sovereign?.alive&&sovereign.engaged?sovereign:magma?.alive&&magma.engaged?magma:glacier?.alive&&glacier.engaged?glacier:bloom?.alive&&bloom.engaged?bloom:warden?.alive&&warden.engaged?warden:undefined;
        const intent=!boss?"":boss.kind==="magma"?"Hindari lava & bola api":boss.kind==="sovereign"?"Hindari pilar & energi":boss.kind==="bloom"?(boss.phase<2?"Hindari benih":boss.phase<4.5?"Lompati akar":"Terus serang"):boss.kind==="glacier"?(boss.phase<3.5?"Serbuan: naik ke step":boss.phase<6.5?"Waspadai stalaktit":"Terus serang"):"Lompati boss dan gelombang";
        setHud({hp:player.hp,maxHp:player.maxHp,energy:Math.floor(player.energy),distance:Math.floor(player.maxX/10),score:player.score,storm:voidGrace>0?`${voidGrace.toFixed(1)}s`:`${Math.floor((player.x-voidX)/10)}m`,boss:boss?intent:""});
      }
      // Generated idle poses vary slightly in silhouette and registration.
      // Hold one clean frame while stationary so the character never jitters.
      let animRow = 0, animFrame = 0;
      if (player.hurtTimer > 0) { animRow = 3; animFrame = clamp(Math.floor((.56 - player.hurtTimer) / .14), 0, 3); }
      else if (player.specialTimer > 0) { animRow = 4; animFrame = clamp(Math.floor((.72 - player.specialTimer) / .18), 0, 3); }
      else if (!player.grounded) { animRow = 2; animFrame = player.vy < -260 ? 0 : player.vy < -40 ? 1 : player.vy < 260 ? 2 : 3; }
      else if (Math.abs(player.vx) > 42) {
        animRow = 1;
        const runPhase = Math.floor(now / 135) % RUN_FRAME_SEQUENCE[active].length;
        animFrame = RUN_FRAME_SEQUENCE[active][runPhase];
      }
      else animFrame = Math.floor(now / 260) % 4;
      ctx.save(); if (player.invuln > 0 && Math.floor(player.invuln * 14) % 2) ctx.globalAlpha = .32;
      if (sprite.complete && sprite.naturalWidth) {
        const sw = sprite.naturalWidth / 4, sh = sprite.naturalHeight / 5, dw = active === "dylan" ? 102 : active === "adelia" ? 90 : active === "kirana" ? 88 : active === "timmy" || active === "eldric" ? 86 : 96, dh = active === "adelia" ? 90 : active === "kirana" ? 88 : 86;
        const action = animRow === 2 ? "jump" : animRow === 3 ? "hurt" : animRow === 4 ? "special" : null;
        const frameOffset = animRow === 1 ? RUN_FRAME_OFFSETS[active][animFrame] : action ? ACTION_FRAME_OFFSETS[active][action][animFrame] : [0, 0];
        const dx = px + player.w / 2 - dw / 2 + frameOffset[0] * player.face, dy = py + player.h - dh + 4 + frameOffset[1];
        if (player.face < 0) { ctx.translate(dx + dw, 0); ctx.scale(-1, 1); ctx.drawImage(sprite, animFrame * sw, animRow * sh, sw, sh, 0, dy, dw, dh); }
        else ctx.drawImage(sprite, animFrame * sw, animRow * sh, sw, sh, dx, dy, dw, dh);
      } else if (fallback.complete && fallback.naturalWidth) { if (player.face < 0) { ctx.translate(px + player.w, 0); ctx.scale(-1, 1); ctx.drawImage(fallback, 0, py - 10, player.w, player.h + 10); } else ctx.drawImage(fallback, px, py - 10, player.w, player.h + 10); }
      else { ctx.fillStyle = c.color; ctx.fillRect(px, py, player.w, player.h); } ctx.restore();
      if (flash > 0 || switchGlow > 0) { ctx.fillStyle = `${c.color}${switchGlow > 0 ? "22" : "18"}`; ctx.fillRect(0, 0, W, H); }
      const voidDistance = Math.max(0, player.x - voidX), voidColor = voidDistance < 260 ? "#ff5263" : voidDistance < 520 ? "#ffb347" : "#d77cff";
      if (sessionIdRef.current && now - lastMotionSample >= LIVE_MOTION_SAMPLE_MS) {
        lastMotionSample = now;
        pendingMotion.push({ t: Date.now(), camera, active, voidX, voidGrace, score: player.score, distance: Math.floor(player.maxX / 10), coinCount: player.coinCount, hp: player.hp, energy: player.energy, player: { x: player.x, y: player.y, w: player.w, h: player.h, vx: player.vx, vy: player.vy, face: player.face, animRow, animFrame, invuln: player.invuln } });
        if (pendingMotion.length > 10) pendingMotion.shift();
      }
      if (sessionIdRef.current && now - lastBroadcast >= LIVE_BROADCAST_MS) {
        lastBroadcast = now; const minX = camera - 120, maxX = camera + W + 120;
        const snapshot: LiveSnapshot = { frostWeather:{...frostWeather}, hazards: hazards.map(wave => ({ ...wave })), skyHazards: skyHazards.map(h => ({...h})), worlds: 5, v: 1, t: Date.now(), camera, active, voidX, voidGrace, score: player.score, distance: Math.floor(player.maxX / 10), coinCount: player.coinCount, hp: player.hp, energy: player.energy, player: { x: player.x, y: player.y, w: player.w, h: player.h, vx: player.vx, vy: player.vy, face: player.face, animRow, animFrame, invuln: player.invuln }, platforms: platforms.filter(p => p.x + p.w > minX && p.x < maxX).map(p => ({ ...p })), coins: coins.filter(coin => !coin.got && coin.x > minX && coin.x < maxX).map(coin => ({ ...coin })), chests: chests.filter(chest => !chest.opened && chest.x > minX && chest.x < maxX).map(chest => ({ ...chest })), enemies: enemies.filter(enemy => enemy.alive && (enemy.kind === "warden" || enemy.kind === "bloom" || enemy.kind === "glacier" || enemy.kind === "magma" || enemy.kind === "sovereign" || (enemy.x + enemy.w > minX && enemy.x < maxX))).map(enemy => ({ ...enemy })), shots: shots.filter(shot => shot.life > 0 && shot.x > minX && shot.x < maxX).map(shot => ({ ...shot })), barriers: barriers.filter(barrier => barrier.alive && barrier.x + barrier.w > minX && barrier.x < maxX).map(barrier => ({ ...barrier })), motion: pendingMotion.splice(0) };
        void fetch("/api/live", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: sessionIdRef.current, playerKey: playerKeyRef.current, name: playerName.trim(), score: player.score, distance: snapshot.distance, elapsedMs: Date.now() - liveStartedAt, snapshot }) }).catch(() => {});
      }
      rafRef.current = requestAnimationFrame(frame);
    };
    rafRef.current = requestAnimationFrame(frame); stopGameRef.current = () => { running = false; cancelAnimationFrame(rafRef.current); };
    return () => { running = false; cancelAnimationFrame(rafRef.current); window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); window.removeEventListener("tekad-action", onAction); window.removeEventListener("blur", releaseMovement); releaseMovement(); rewardChoice.current = () => {}; };
  }, [mode, selected, playerName, finishGame]);

  const emit = (action: string) => window.dispatchEvent(new CustomEvent("tekad-action", { detail: action }));
  const touch = (key: string, value: boolean) => { keysRef.current[key] = value; };
  const changePlayerName = (value: string) => { const clean = value.slice(0, 18); setPlayerName(clean); localStorage.setItem("tekad-player-name", clean); setPlayerRank(null); setAllTimeRank(null); setRankingNotice(""); };
  return <main className={`game-shell ${mode !== "select" ? "playing" : ""}`} onContextMenu={e => { if (mode !== "select" && !(e.target as HTMLElement).closest("input, textarea, [contenteditable=true]")) e.preventDefault(); }} style={{ "--char": (mode === "select" ? starter : activeUi).color } as React.CSSProperties}>
    <RunMusic enabled={sound} active={mode === "playing"} paused={paused || rewardOpen}/>
    <header className="topbar"><div className="brand"><div className="brand-mark" aria-label="TEKAD"><span>T</span><span>E</span><span>K</span><span>A</span><span>D</span></div><div className="brand-sub">Switch Run · Five Worlds</div></div><div className="game-nav-actions"><a className="hub-back" href="/">← Semua Game</a><button className="sound-button" onClick={() => setSound(s => !s)} aria-label={sound ? "Matikan suara" : "Nyalakan suara"}>{sound ? "♪" : "×"}</button></div></header>
    {mode === "select" ? <section className="select-wrap"><div className="hero-copy"><span className="eyebrow">Pilih karakter awal</span><h1>Switch Run</h1><p>Pilih hero, lalu mulai. Kamu bisa berganti hero selama bermain.</p></div><div className="player-name-box"><label htmlFor="player-name">NAMA PEMAIN</label><input id="player-name" value={playerName} maxLength={18} placeholder="Nickname, maks. 18 karakter" onChange={e => changePlayerName(e.target.value)} onBlur={() => void loadLeaderboard(playerName.trim(), leaderboardPeriod, selectedWeek)} /><span>Nama untuk leaderboard publik. Tersimpan di perangkat ini.</span>{rankingNotice && <strong className="ranking-notice">{rankingNotice}</strong>}</div><div className="char-grid">{CHARACTERS.map(c => <button key={c.id} className={`char-card ${selected === c.id ? "selected" : ""}`} style={{ "--char": c.color } as React.CSSProperties} aria-pressed={selected === c.id} onClick={() => setSelected(c.id)}><span className="world-badge">START AS {c.name}</span><span className="char-img-wrap"><span className="char-idle-sprite" role="img" aria-label={`${c.name} sprite idle`} style={{ backgroundImage: `url(${c.sprite})` }} /></span><span className="char-name">{c.name}</span><span className="char-value">{c.value}</span></button>)}</div><div className="selected-hero-info"><strong>{starter.weapon}</strong><span>{starter.weaponDesc}</span><small>{starter.ability}: {starter.abilityDesc}</small></div><div className="launch-row single-record"><div className="record">HIGH SCORE<strong>{String(highScore).padStart(6, "0")}</strong></div><button className="start-button" disabled={playerName.trim().length < 2 || starting} onClick={() => void beginGame()}>{starting ? "Menyiapkan sesi…" : playerName.trim().length < 2 ? "Isi nama dahulu" : `Mulai dengan ${starter.name} →`}</button><div className="record right">5 WORLDS<strong>10.000 M</strong></div></div><details className="world-details"><summary>Lihat dunia dan panduan</summary><div className="world-journey" aria-label="Perjalanan dunia"><div className="journey-city"><span>WORLD 01 · START</span><strong>Earth 3000</strong><p>Kota neon · Void Warden</p></div><div className="journey-ruins"><span>WORLD 02 · 2.000 M</span><strong>Verdant Ruins</strong><p>Hutan · Bloom Sovereign</p></div><div className="journey-frost"><span>WORLD 03 · 4.000 M</span><strong>Frostbound Citadel</strong><p>Es retak · Jalur naik-turun · Glacier Colossus</p></div><div className="journey-ember"><span>WORLD 04 · 6.000 M</span><strong>Ember Foundry</strong><p>Conveyor · Lava · Magma Titan</p></div><div className="journey-astral"><span>WORLD 05 · 8.000 M</span><strong>Astral Sanctuary</strong><p>Platform menghilang · Astral Sovereign</p></div></div><p className="microcopy">Lima world, masing-masing 2.000 meter. Kalahkan boss menjelang 2.000, 4.000, 6.000, 8.000, dan 10.000 meter. Chest health tersedia sebelum arena. Storm berhenti selama pertarungan boss.</p></details><section className="live-card"><div className="live-head"><div><span className="live-dot" /> LIVE NOW</div><strong>{livePlayers.length} PEMAIN</strong></div>{liveStatus === "loading" ? <p className="board-message">Mencari pemain aktif…</p> : liveStatus === "error" ? <p className="board-message">Status live sedang tidak tersedia.</p> : livePlayers.length === 0 ? <p className="board-message">Belum ada yang bermain. Mulai game dan jadilah siaran pertama!</p> : <div className="live-list">{livePlayers.map(player => <div className="live-row" key={player.sessionId}><span className="live-pulse" /><strong>{player.name}</strong><span>{player.distance} M</span><span>{String(player.score).padStart(6, "0")}</span><span>{Math.floor(player.elapsedMs / 60_000)}:{String(Math.floor(player.elapsedMs / 1_000) % 60).padStart(2, "0")}</span><span>◉ {player.viewers}</span><button onClick={() => startWatching(player)}>TONTON →</button></div>)}</div>}</section>
      <section className="leaderboard-card period-leaderboard">
        <div className="leaderboard-tabs" role="tablist" aria-label="Periode leaderboard">{([['day', 'Hari Ini'], ['week', 'Minggu Ini'], ['all', 'All Time']] as const).map(([period, label]) => <button key={period} role="tab" aria-selected={leaderboardPeriod === period} className={leaderboardPeriod === period ? "active" : ""} onClick={() => { setLeaderboardPeriod(period); void loadLeaderboard(playerName.trim(), period, period === "week" ? selectedWeek : ""); }}>{label}</button>)}</div>
        {leaderboardPeriod === "week" && <div className="week-picker"><label htmlFor="leaderboard-week">ARSIP MINGGUAN</label><select id="leaderboard-week" value={selectedWeek || currentWeek} onChange={event => { const week = event.target.value; setSelectedWeek(week); void loadLeaderboard(playerName.trim(), "week", week); }}>{availableWeeks.map(week => <option key={week} value={week}>{week === currentWeek ? `Minggu ini · ${weekLabel(week)}` : weekLabel(week)}</option>)}</select></div>}
        <div className="leaderboard-head"><div><span>GLOBAL RANKING</span><h2>Top 20 Skor</h2><small>{leaderboardPeriod === "day" ? "Skor terbaik hari ini · reset 00.00 WIB" : leaderboardPeriod === "week" ? `${selectedWeek === currentWeek || !selectedWeek ? "Minggu ini" : "Arsip mingguan"} · Senin–Minggu` : "Skor tertinggi sepanjang permainan"}</small></div>{playerRank && <strong>PERINGKATMU #{playerRank}</strong>}</div>
        {boardStatus === "loading" ? <p className="board-message">Memuat leaderboard…</p> : boardStatus === "error" ? <p className="board-message">Leaderboard sedang tidak tersedia.</p> : leaderboard.length === 0 ? <p className="board-message">Belum ada skor untuk periode ini. Jadilah pemain pertama!</p> : <div className="leaderboard-list">{leaderboard.map((row, i) => <div className={`leaderboard-row ${row.name.toLocaleLowerCase("id-ID") === playerName.trim().toLocaleLowerCase("id-ID") ? "mine" : ""}`} key={`${row.name}-${i}`}><span className="rank">#{i + 1}</span><strong>{row.name}</strong><span>{row.distance} M</span><b>{String(row.score).padStart(6, "0")}</b></div>)}</div>}
      </section></section>
    : <section className={`play-wrap ${mode === "spectating" ? "spectator" : ""}`}><div className="game-info"><div className="world-title"><span className="mini-face-sprite" aria-hidden="true" style={{ backgroundImage: `url(${activeUi.sprite})` }} /><div><strong>{mode === "spectating" ? `● LIVE · ${currentWorld}` : currentWorld}</strong><span>{mode === "spectating" ? `${watching?.name ?? "Pemain"} · mode penonton` : `${playerName} · ${activeUi.name} · ${activeUi.ability} · ${activeUi.weapon}`}</span>{rankingNotice && mode !== "spectating" && <small className="ranking-notice">{rankingNotice}</small>}</div></div><div className="play-actions"><button className="exit-button" aria-label={sound?"Matikan suara":"Nyalakan suara"} onClick={()=>setSound(v=>!v)}>{sound?"♪ On":"♪ Off"}</button>{mode==="playing"&&<button className="exit-button" onClick={()=>{setConfirmExit(false);changePause(true);}}>Pause</button>}<button className="exit-button" onClick={() => { if(mode==="playing"){setConfirmExit(true);changePause(true);}else{setWatching(null);setMode("select");} }}>Menu</button></div></div><div className="canvas-frame">{mode!=="spectating"&&<div className="readable-hud"><div><div className="hud-hearts" role="img" aria-label={`Health ${hud.hp} dari ${hud.maxHp}`}>{Array.from({length:hud.maxHp},(_,i)=><span key={i} aria-hidden="true" className={i<hud.hp?"heart-full":"heart-empty"}>♥</span>)}</div><div className="hud-energy" role="progressbar" aria-label="Energi" aria-valuemin={0} aria-valuemax={100} aria-valuenow={hud.energy}><span aria-hidden="true">ENERGI</span><div className="hud-energy-track"><i style={{width:`${Math.max(0,Math.min(100,hud.energy))}%`}} /></div></div><strong>{hud.distance.toLocaleString("id-ID")} m</strong><span>Storm {hud.storm}</span><span>Skor {hud.score}</span></div>{hud.boss&&<p>{hud.boss}</p>}</div>}<canvas ref={canvasRef} className="game-canvas" width={W} height={H} aria-label={mode === "spectating" ? `Siaran langsung permainan ${watching?.name ?? "pemain"}` : "Game platformer TEKAD Switch Run"} /><div className="scanlines" />{mode === "spectating" && watchStatus !== "live" && <div className="watch-overlay">{watchStatus === "connecting" ? <span className="live-dot" aria-label="Menghubungkan siaran" /> : <><strong>SIARAN TELAH SELESAI</strong><button className="secondary-button" onClick={() => { setWatching(null); setMode("select"); }}>Kembali ke daftar live</button></>}</div>}{(mode === "gameover" || mode === "victory") && <div className="gameover"><div className={`gameover-card ${mode === "victory" ? "is-victory" : ""}`}><div className="new-record">{isNewRecord ? "★ High score baru!" : "Petualangan selesai"}</div><h2>{mode==="victory"?"Five Worlds Cleared!":"Game Over"}</h2>{mode==="victory"&&<p>10.000 m · Semua world selesai</p>}<div className="final-score">SKOR AKHIR<strong>{String(finalScore).padStart(6, "0")}</strong>High score: {String(highScore).padStart(6, "0")}{allTimeRank && <span className="gameover-rank">All-time rank #{allTimeRank}</span>}</div><div className="gameover-actions"><button className="secondary-button" onClick={() => setMode("select")}>Leaderboard</button><button className="start-button" disabled={starting} onClick={() => void beginGame()}>{starting ? "Menyiapkan…" : "Main lagi"}</button></div></div></div>}</div>
      {mode !== "spectating" && <><div className="hero-switcher" aria-label="Ganti karakter"><span className="switch-label">GANTI HERO<br /><small>{switchCooldownUi > 0 ? `${switchCooldownUi.toFixed(1)}s` : "Q / 1–5"}</small></span>{CHARACTERS.map((c, i) => { const locked = switchCooldownUi > 0 && currentHero !== c.id; return <button key={c.id} disabled={locked} className={`switch-hero ${currentHero === c.id ? "active" : ""} ${locked ? "cooldown" : ""}`} style={{ "--char": c.color } as React.CSSProperties} onClick={() => emit(`switch:${c.id}`)} aria-label={`Ganti ke ${c.name}`}><span className="switch-key">{i + 1}</span><span className="switch-hero-sprite" aria-hidden="true" style={{ backgroundImage: `url(${c.sprite})` }} /><span className="switch-name">{c.name}</span>{locked && <span className="switch-cooldown">{switchCooldownUi.toFixed(1)}</span>}</button>; })}</div>
      <div className="touch-controls"><div className="touch-group"><button className="touch-button" aria-label="Kiri" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); touch("touchLeft", true); }} onPointerUp={() => touch("touchLeft", false)} onPointerCancel={() => touch("touchLeft", false)} onLostPointerCapture={() => touch("touchLeft", false)}>←</button><button className="touch-button" aria-label="Kanan" onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); touch("touchRight", true); }} onPointerUp={() => touch("touchRight", false)} onPointerCancel={() => touch("touchRight", false)} onLostPointerCapture={() => touch("touchRight", false)}>→</button></div><div className="keyboard-hint">A/D atau ←/→ · SPACE lompat · E senjata · Q ganti hero</div><div className="touch-group actions"><button className="touch-button jump" aria-label="Lompat" onPointerDown={() => emit("jump")}>↑</button><button className="touch-button special" aria-label={`Gunakan ${activeUi.weapon}`} style={{ "--char": activeUi.color } as React.CSSProperties} onPointerDown={() => emit("special")}>{activeUi.weapon}</button></div></div></>}</section>}
    <dialog ref={pauseDialog} className={`reward-dialog pause-dialog ${confirmExit ? "exit-confirm-dialog" : ""}`} aria-labelledby="pause-title" onCancel={e=>{e.preventDefault();changePause(false);}}>
      <div className="dialog-emblem" aria-hidden="true">{confirmExit ? "↗" : "Ⅱ"}</div>
      <span className="dialog-kicker">SWITCH RUN · {confirmExit ? "AKHIRI RUN" : "PAUSED"}</span>
      <h2 id="pause-title">{confirmExit?"Keluar dari permainan?":"Game dijeda"}</h2>
      {!confirmExit && <div className="pause-summary"><span>{currentWorld}</span><strong>{hud.distance.toLocaleString("id-ID")} <small>m</small></strong></div>}
      <p>{confirmExit?"Run ini akan berakhir. Progres yang sedang dimainkan tidak disimpan.":"Karakter, musuh, dan Storm berhenti. Lanjutkan saat siap."}</p>
      <div className="gameover-actions"><button autoFocus className="start-button" onClick={()=>changePause(false)}>{confirmExit?"Batal, lanjut main":"Lanjutkan"}</button>{confirmExit?<button className="secondary-button danger-button" onClick={()=>{stopGameRef.current();closeLive();sessionIdRef.current="";changePause(false);setWatching(null);setMode("select");}}>Ya, keluar</button>:<button className="secondary-button" onClick={()=>setConfirmExit(true)}>Menu utama</button>}</div>
    </dialog>
    <dialog ref={rewardDialog} className="reward-dialog" aria-labelledby="reward-title" onCancel={e => { e.preventDefault(); setPendingReward(null); }}>
      <div className="reward-heading"><div className="dialog-emblem" aria-hidden="true">✦</div><div><span className="dialog-kicker">BOSS DEFEATED · {rewardWorld}</span><h2 id="reward-title">{pendingReward ? "Siap diperkuat?" : "Pilih kekuatanmu"}</h2></div></div>
      <p>Game dan Storm berhenti. Berlaku untuk semua hero sampai run selesai.</p>
      {pendingReward ? <section className={`reward-confirm reward-${pendingReward}`}>
        <div className="power-icon" aria-hidden="true">{pendingReward === "health" ? "♥" : pendingReward === "damage" ? "ϟ" : "»"}</div>
        <h3>Gunakan {pendingReward === "health" ? "Vital Core" : pendingReward === "damage" ? "Overcharge" : "Velocity Core"}?</h3>
        <p>{pendingReward === "health" ? "Maksimum HP +1 dan pulihkan 1 HP." : pendingReward === "damage" ? "Damage semua serangan +0,5. Phase Guard Timmy tetap defensif." : "Kecepatan lari semua hero +10%."}</p>
        <p>Setelah dikonfirmasi, pilihan tidak bisa diganti selama run ini.</p>
        <div className="gameover-actions"><button data-confirm-reward className="start-button" onClick={() => rewardChoice.current(pendingReward)}>Ya, gunakan</button><button className="secondary-button" onClick={() => setPendingReward(null)}>Pilih ulang</button></div>
      </section> : <div className="reward-options">
        <button className="reward-health" autoFocus onClick={() => setPendingReward("health")}><i className="power-icon" aria-hidden="true">♥</i><strong>Vital Core</strong><b>Maksimum HP +1</b><span>Tambah 1 slot dan pulihkan 1 HP.</span></button>
        <button className="reward-damage" onClick={() => setPendingReward("damage")}><i className="power-icon" aria-hidden="true">ϟ</i><strong>Overcharge</strong><b>Damage +0,5</b><span>Semua serangan yang memberi damage. Phase Guard Timmy tetap defensif.</span></button>
        <button className="reward-speed" onClick={() => setPendingReward("speed")}><i className="power-icon" aria-hidden="true">»</i><strong>Velocity Core</strong><b>Kecepatan +10%</b><span>Kecepatan lari semua hero meningkat.</span></button>
      </div>}<p className="dialog-keyboard-hint">Tab untuk berpindah · Enter untuk memilih{pendingReward ? " · Esc untuk pilih ulang" : ". Ada konfirmasi sebelum power-up diterapkan"}.</p>
    </dialog>
  </main>;
}
