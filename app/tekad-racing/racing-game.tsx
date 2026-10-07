"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { advanceRaceClock, createRaceClock, RACE_STEP } from "./race-clock";

const W = 960;
const H = 540;
const HORIZON = 158;
const TRACK_LENGTH = 12_000;
const TOTAL_LAPS = 3;
const CHECKPOINTS = [TRACK_LENGTH / 3, (TRACK_LENGTH * 2) / 3];
const RACING_SPRITE_CELL = 190;
const SPECIAL_SPRITE_DURATION = .8;

type Controls = { left: boolean; right: boolean; brake: boolean; throttle: boolean; drift: boolean };
type CharacterId = "timmy" | "eldric" | "kirana" | "adelia" | "dylan";
type ItemKind = "" | "turbo" | "shield" | "pulse";
type ImpactKind = "" | "wall" | "kart" | "shield" | "pulse";
type CharacterSpec = { id: CharacterId; name: string; value: string; color: string; accent: string; special: string; description: string; sheet: string; racingSheet?: string };
type RaceState = {
  distance: number;
  lap: number;
  speed: number;
  lateral: number;
  driftCharge: number;
  boost: number;
  elapsed: number;
  checkpoint: number;
  collisionFlash: number;
  impactKind: ImpactKind;
  heldItem: ItemKind;
  shield: number;
  specialCooldown: number;
  specialActive: number;
  nextItemDistance: number;
  nextItemLane: number;
  finished: boolean;
  lastTime: number;
};
type AIRacer = {
  id: CharacterId;
  name: string;
  color: string;
  accent: string;
  distance: number;
  speed: number;
  lateral: number;
  pace: number;
  phase: number;
  wallCooldown: number;
  stun: number;
  visualSteer: number;
  impact: number;
};

const CHARACTERS: Record<CharacterId, CharacterSpec> = {
  timmy: { id: "timmy", name: "TIMMY", value: "TERPERCAYA", color: "#4f8cff", accent: "#b9d5ff", special: "INTEGRITY GUARD", description: "Menahan satu benturan atau serangan.", sheet: "/sprites/timmy-sheet-v2.png", racingSheet: "/sprites/timmy-racing-sheet-v1.png" },
  eldric: { id: "eldric", name: "ELDRIC", value: "EKSPLORATIF", color: "#f4a51c", accent: "#ffe082", special: "IDEA ENGINE", description: "Menciptakan Turbo Cell saat diperlukan.", sheet: "/sprites/eldric-sheet-v2.png", racingSheet: "/sprites/eldric-racing-sheet-v1.png" },
  kirana: { id: "kirana", name: "KIRANA", value: "KOLABORATIF", color: "#82bc4a", accent: "#d9f99d", special: "HARMONY LINK", description: "Boost makin kuat saat dekat pembalap lain.", sheet: "/sprites/kirana-sheet-v3.png", racingSheet: "/sprites/kirana-racing-sheet-v1.png" },
  adelia: { id: "adelia", name: "ADELIA", value: "ADAPTIF", color: "#a96de1", accent: "#e9d5ff", special: "ADAPTIVE DRIVE", description: "Kebal perlambatan off-road selama 4 detik.", sheet: "/sprites/adelia-sheet-v2.png", racingSheet: "/sprites/adelia-racing-sheet-v2.png" },
  dylan: { id: "dylan", name: "DYLAN", value: "DETERMINASI", color: "#ef4e4e", accent: "#fecaca", special: "POWER RAM", description: "Boost dan menyingkirkan kart yang tersenggol.", sheet: "/sprites/dylan-sheet-v3.png", racingSheet: "/sprites/dylan-racing-sheet-v1.png" },
};
const ITEM_LABELS: Record<Exclude<ItemKind, "">, string> = { turbo: "TURBO CELL", shield: "GUARD FIELD", pulse: "PULSE SHOT" };
const freshRace = (): RaceState => ({ distance: 0, lap: 1, speed: 0, lateral: 0, driftCharge: 0, boost: 0, elapsed: 0, checkpoint: 0, collisionFlash: 0, impactKind: "", heldItem: "", shield: 0, specialCooldown: 0, specialActive: 0, nextItemDistance: 620, nextItemLane: -.44, finished: false, lastTime: 0 });
const AI_PACE: Record<CharacterId, number> = { timmy: 234, eldric: 232, kirana: 237, adelia: 242, dylan: 246 };
const AI_PHASE: Record<CharacterId, number> = { timmy: 5.9, eldric: .7, kirana: 2.1, adelia: 3.6, dylan: 5.2 };
const freshOpponents = (player: CharacterId = "timmy"): AIRacer[] => (Object.values(CHARACTERS) as CharacterSpec[])
  .filter(character => character.id !== player)
  .map((character, index) => ({
    id: character.id,
    name: character.name,
    color: character.color,
    accent: character.accent,
    distance: [112, 82, 48, -22][index],
    speed: 0,
    lateral: [.04, -.42, .28, .48][index],
    pace: AI_PACE[character.id],
    phase: AI_PHASE[character.id],
    wallCooldown: 0,
    stun: 0,
    visualSteer: 0,
    impact: 0,
  }));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const TAU = Math.PI * 2;
const trackProgress = (distance: number) => (((distance % TRACK_LENGTH) + TRACK_LENGTH) % TRACK_LENGTH) / TRACK_LENGTH;
// Long, continuous harmonics create broad racing lines without abrupt left/right snaps.
const curveAt = (distance: number) => {
  const s = trackProgress(distance);
  return Math.sin((s - .06) * TAU) * .68
    + Math.sin((s - .22) * TAU * 2) * .21
    + Math.sin((s + .11) * TAU * 3) * .09;
};
const circularDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
const smoothPulse = (s: number, center: number, radius: number) => {
  const d = circularDistance(s, center);
  return d >= radius ? 0 : (1 + Math.cos(Math.PI * d / radius)) / 2;
};
const trackWidthAt = (distance: number) => {
  const s = trackProgress(distance);
  return 1 - .12 * smoothPulse(s, .39, .11) - .16 * smoothPulse(s, .72, .09);
};
const mapPointAt = (progress: number) => {
  const angle = progress * TAU - Math.PI / 2;
  return {
    x: Math.cos(angle) * (.82 + .1 * Math.sin(angle * 2)) + .1 * Math.sin(angle * 3),
    y: Math.sin(angle) * (.67 + .07 * Math.cos(angle * 2)),
  };
};

function polygon(ctx: CanvasRenderingContext2D, points: number[][], color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

export default function RacingGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controlsRef = useRef<Controls>({ left: false, right: false, brake: false, throttle: false, drift: false });
  const raceRef = useRef<RaceState>(freshRace());
  const opponentsRef = useRef<AIRacer[]>(freshOpponents());
  const characterRef = useRef<CharacterId>("timmy");
  const runningRef = useRef(false);
  const startedRef = useRef(false);
  const driftWasHeld = useRef(false);
  const driverRef = useRef<HTMLImageElement | null>(null);
  const racingDriverRef = useRef<HTMLImageElement | null>(null);
  const racingSpritesRef = useRef<Partial<Record<CharacterId, HTMLImageElement>>>({});
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [started, setStarted] = useState(false);
  const [bestTime, setBestTime] = useState<number | null>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("timmy");
  const [hud, setHud] = useState({ speed: 0, lap: 1, position: 4, elapsed: 0, checkpoint: 0, drift: 0, boost: 0, offroad: false, impact: "" as ImpactKind, item: "" as ItemKind, shield: 0, specialCooldown: 0, specialActive: 0 });

  useEffect(() => {
    let stored = 0;
    try { stored = Number(localStorage.getItem("tekad-racing-best")); } catch { /* Racing remains playable when storage is unavailable. */ }
    if (stored > 0) setBestTime(stored);
    const image = new Image();
    image.src = CHARACTERS.timmy.sheet;
    driverRef.current = image;
    const racingImage = new Image();
    racingImage.src = CHARACTERS.timmy.racingSheet!;
    racingDriverRef.current = racingImage;
    for (const character of Object.values(CHARACTERS) as CharacterSpec[]) {
      if (!character.racingSheet) continue;
      const sprite = new Image();
      sprite.src = character.racingSheet;
      racingSpritesRef.current[character.id] = sprite;
    }
  }, []);

  const selectCharacter = useCallback((id: CharacterId) => {
    if (startedRef.current) return;
    characterRef.current = id;
    setSelectedCharacter(id);
    opponentsRef.current = freshOpponents(id);
    const image = new Image();
    image.src = CHARACTERS[id].sheet;
    driverRef.current = image;
    const racingSheet = CHARACTERS[id].racingSheet;
    if (racingSheet) {
      const racingImage = new Image();
      racingImage.src = racingSheet;
      racingDriverRef.current = racingImage;
    } else racingDriverRef.current = null;
  }, []);

  const useItem = useCallback(() => {
    const race = raceRef.current;
    if (!runningRef.current || !race.heldItem) return;
    if (race.heldItem === "turbo") race.boost = Math.max(race.boost, 1.9);
    if (race.heldItem === "shield") race.shield = 1;
    if (race.heldItem === "pulse") {
      const target = opponentsRef.current.filter(opponent => opponent.distance > race.distance).sort((a, b) => a.distance - b.distance)[0];
      if (target && target.distance - race.distance < 1150) {
        target.speed *= .42;
        target.stun = 1.1;
        race.impactKind = "pulse";
        race.collisionFlash = .45;
      }
    }
    race.heldItem = "";
  }, []);

  const useSpecial = useCallback(() => {
    const race = raceRef.current;
    if (!runningRef.current || race.specialCooldown > 0) return;
    const id = characterRef.current;
    if (id === "timmy") {
      race.shield = 1;
      race.specialActive = SPECIAL_SPRITE_DURATION;
    }
    if (id === "eldric") {
      race.heldItem = "turbo";
      race.specialActive = SPECIAL_SPRITE_DURATION;
    }
    if (id === "kirana") {
      const nearby = opponentsRef.current.filter(opponent => Math.abs(opponent.distance - race.distance) < 520).length;
      race.boost = Math.max(race.boost, 1.35 + nearby * .42);
      race.specialActive = 1.6;
    }
    if (id === "adelia") race.specialActive = 4;
    if (id === "dylan") {
      race.boost = Math.max(race.boost, 2.3);
      race.specialActive = 2.8;
    }
    race.specialCooldown = id === "dylan" ? 9 : id === "timmy" ? 8 : 7;
  }, []);

  const startRace = useCallback(() => {
    raceRef.current = freshRace();
    opponentsRef.current = freshOpponents(characterRef.current);
    runningRef.current = true;
    startedRef.current = true;
    controlsRef.current = { left: false, right: false, brake: false, throttle: false, drift: false };
    driftWasHeld.current = false;
    setFinished(false);
    setStarted(true);
    setRunning(true);
  }, []);

  const togglePause = useCallback(() => {
    if (!startedRef.current || raceRef.current.finished) return;
    controlsRef.current = { left: false, right: false, brake: false, throttle: false, drift: false };
    driftWasHeld.current = false;
    raceRef.current.driftCharge = 0;
    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);
  }, []);

  const returnToSelection = useCallback(() => {
    runningRef.current = false;
    startedRef.current = false;
    raceRef.current = freshRace();
    opponentsRef.current = freshOpponents(characterRef.current);
    controlsRef.current = { left: false, right: false, brake: false, throttle: false, drift: false };
    driftWasHeld.current = false;
    setRunning(false);
    setStarted(false);
    setFinished(false);
  }, []);

  const setControl = useCallback((key: keyof Controls, value: boolean) => {
    if (value && !runningRef.current) return;
    controlsRef.current[key] = value;
  }, []);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.target instanceof Element) {
        if (event.target.closest("input, textarea, select, [contenteditable=true]")) return;
        if (["Space", "Enter"].includes(event.code) && event.target.closest("button, a")) return;
      }
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(event.code)) event.preventDefault();
      if (event.code === "ArrowLeft" || event.code === "KeyA") setControl("left", true);
      if (event.code === "ArrowRight" || event.code === "KeyD") setControl("right", true);
      if (event.code === "ArrowDown" || event.code === "KeyS") setControl("brake", true);
      if (event.code === "ArrowUp" || event.code === "KeyW") setControl("throttle", true);
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") setControl("drift", true);
      if (event.code === "KeyQ" && !event.repeat) useItem();
      if (event.code === "KeyE" && !event.repeat) useSpecial();
      if (event.code === "KeyP" && !event.repeat) togglePause();
      if (event.code === "KeyR" && !event.repeat && !runningRef.current) startRace();
    };
    const up = (event: KeyboardEvent) => {
      if (event.code === "ArrowLeft" || event.code === "KeyA") setControl("left", false);
      if (event.code === "ArrowRight" || event.code === "KeyD") setControl("right", false);
      if (event.code === "ArrowDown" || event.code === "KeyS") setControl("brake", false);
      if (event.code === "ArrowUp" || event.code === "KeyW") setControl("throttle", false);
      if (event.code === "Space" || event.code === "ShiftLeft" || event.code === "ShiftRight") setControl("drift", false);
    };
    const suspend = () => {
      controlsRef.current = { left: false, right: false, brake: false, throttle: false, drift: false };
      driftWasHeld.current = false;
      raceRef.current.driftCharge = 0;
      if (runningRef.current) { runningRef.current = false; setRunning(false); }
    };
    const visibility = () => { if (document.hidden) suspend(); };
    window.addEventListener("keydown", down, { passive: false });
    window.addEventListener("keyup", up);
    window.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("blur", suspend); document.removeEventListener("visibilitychange", visibility);
    };
  }, [setControl, startRace, togglePause, useItem, useSpecial]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    const clock = createRaceClock(performance.now());
    let visualTime = 0;
    let hudTick = 0;

    const draw = (race: RaceState, now: number) => {
      const sky = ctx.createLinearGradient(0, 0, 0, HORIZON + 95);
      sky.addColorStop(0, "#1b1649");
      sky.addColorStop(.55, "#71356d");
      sky.addColorStop(1, "#f26a60");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#ffd56a";
      ctx.beginPath();
      ctx.arc(748, 89, 53, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f36a69";
      for (let y = 60; y < 130; y += 12) ctx.fillRect(694, y, 108, 5);

      const skylineOffset = (race.distance * .025) % 160;
      ctx.fillStyle = "#21183f";
      for (let i = -2; i < 10; i++) {
        const x = i * 160 - skylineOffset;
        const h = 45 + ((i * 37 + 71) % 75);
        ctx.fillRect(x, HORIZON - h, 88, h);
        ctx.fillStyle = i % 2 ? "#37d9eb" : "#f650bd";
        for (let wy = HORIZON - h + 13; wy < HORIZON - 8; wy += 18) ctx.fillRect(x + 13, wy, 45, 3);
        ctx.fillStyle = "#21183f";
      }

      ctx.fillStyle = "#121a32";
      ctx.fillRect(0, HORIZON, W, H - HORIZON);
      const baseCurve = curveAt(race.distance);
      const step = 6;
      for (let y = HORIZON; y < H; y += step) {
        const p1 = (y - HORIZON) / (H - HORIZON);
        const p2 = (y + step - HORIZON) / (H - HORIZON);
        const depth1 = Math.pow(1 - p1, 1.72);
        const depth2 = Math.pow(1 - p2, 1.72);
        const d1 = depth1 * 1850;
        const d2 = depth2 * 1850;
        const half1 = (60 + Math.pow(p1, 1.12) * 390) * trackWidthAt(race.distance + d1);
        const half2 = (60 + Math.pow(p2, 1.12) * 390) * trackWidthAt(race.distance + d2);
        const c1 = W / 2 + (curveAt(race.distance + d1) - baseCurve) * 245 * depth1 - race.lateral * half1 * .62;
        const c2 = W / 2 + (curveAt(race.distance + d2) - baseCurve) * 245 * depth2 - race.lateral * half2 * .62;
        const band = Math.floor((race.distance + d1) / 165) % 2;
        ctx.fillStyle = band ? "#18293c" : "#142337";
        ctx.fillRect(0, y, W, step + 1);
        polygon(ctx, [[c1-half1-18,y],[c1-half1,y],[c2-half2,y+step],[c2-half2-25,y+step]], band ? "#ff4fbd" : "#55dff1");
        polygon(ctx, [[c1+half1,y],[c1+half1+18,y],[c2+half2+25,y+step],[c2+half2,y+step]], band ? "#ff4fbd" : "#55dff1");
        polygon(ctx, [[c1-half1,y],[c1+half1,y],[c2+half2,y+step],[c2-half2,y+step]], band ? "#30344c" : "#292e46");
        if ((Math.floor((race.distance + d1) / 115) % 3) === 0) {
          const line1 = Math.max(1, half1 * .012);
          const line2 = Math.max(1, half2 * .012);
          polygon(ctx, [[c1-line1,y],[c1+line1,y],[c2+line2,y+step],[c2-line2,y+step]], "#f7df7b");
        }
      }

      const itemDelta = race.nextItemDistance - race.distance;
      if (itemDelta > 32 && itemDelta < 1820) {
        const depth = clamp(itemDelta / 1850, 0, 1);
        const p = 1 - Math.pow(depth, 1 / 1.72);
        const roadHalf = (60 + Math.pow(p, 1.12) * 390) * trackWidthAt(race.distance + itemDelta);
        const roadCenter = W / 2 + (curveAt(race.distance + itemDelta) - baseCurve) * 245 * depth - race.lateral * roadHalf * .62;
        const x = roadCenter + race.nextItemLane * roadHalf * .68;
        const y = HORIZON + p * (H - HORIZON);
        const size = 10 + p * 24;
        ctx.save();
        ctx.translate(x, y - size * .35 + Math.sin(now / 130) * 3);
        ctx.rotate(now / 950);
        ctx.fillStyle = "#52e7f5";
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.strokeStyle = "#fff7a8";
        ctx.lineWidth = Math.max(1, size * .09);
        ctx.strokeRect(-size / 2, -size / 2, size, size);
        ctx.fillStyle = "#13213a";
        ctx.font = `bold ${Math.max(8, size * .55)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText("?", 0, size * .2);
        ctx.restore();
      }

      const visibleOpponents = opponentsRef.current
        .map(opponent => ({ opponent, delta: opponent.distance - race.distance }))
        .filter(({ delta }) => delta > 28 && delta < 1820)
        .sort((a, b) => b.delta - a.delta);
      for (const { opponent, delta } of visibleOpponents) {
        const depth = clamp(delta / 1850, 0, 1);
        const p = 1 - Math.pow(depth, 1 / 1.72);
        const roadHalf = (60 + Math.pow(p, 1.12) * 390) * trackWidthAt(race.distance + delta);
        const roadCenter = W / 2 + (curveAt(race.distance + delta) - baseCurve) * 245 * depth - race.lateral * roadHalf * .62;
        const x = roadCenter + opponent.lateral * roadHalf * .68;
        const y = HORIZON + p * (H - HORIZON);
        const scale = .23 + p * .72;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        const opponentSprite = racingSpritesRef.current[opponent.id];
        if (opponentSprite?.complete && opponentSprite.naturalWidth) {
          let row = 0;
          let frame = Math.floor(now / 145 + opponent.phase * 2) % 4;
          if (opponent.impact > 0 || opponent.stun > 0) {
            row = 3;
            frame = Math.floor(now / 100 + opponent.phase) % 4;
          } else if (Math.abs(opponent.visualSteer) > .58 && opponent.speed > 195) {
            row = 2;
            frame = opponent.visualSteer < 0 ? Math.floor(now / 120) % 2 : 2 + Math.floor(now / 120) % 2;
          } else if (Math.abs(opponent.visualSteer) > .1) {
            row = 1;
            frame = opponent.visualSteer < 0 ? 0 : 3;
          }
          ctx.drawImage(
            opponentSprite,
            frame * RACING_SPRITE_CELL,
            row * RACING_SPRITE_CELL,
            RACING_SPRITE_CELL,
            RACING_SPRITE_CELL,
            -72,
            -115,
            144,
            144,
          );
        } else {
          ctx.fillStyle = "#0b1020";
          ctx.fillRect(-31, 15, 18, 19);
          ctx.fillRect(13, 15, 18, 19);
          polygon(ctx, [[-42,8],[-29,-18],[29,-18],[42,8],[32,29],[-32,29]], opponent.color);
          ctx.fillStyle = "#101827";
          ctx.fillRect(-27, 1, 54, 17);
          ctx.fillStyle = opponent.accent;
          ctx.fillRect(-20, 21, 40, 5);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 17px monospace";
          ctx.textAlign = "center";
          ctx.fillText(opponent.name[0], 0, 16);
        }
        ctx.fillStyle = "#08101d";
        ctx.fillRect(-39, -108, 78, 15);
        ctx.fillStyle = opponent.accent;
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(opponent.name, 0, -97);
        ctx.restore();
      }

      const steer = (controlsRef.current.right ? 1 : 0) - (controlsRef.current.left ? 1 : 0);
      const impactKick = race.collisionFlash > 0 ? Math.sin(now * .16) * 11 * race.collisionFlash : 0;
      const kartX = W / 2 + steer * 14 + race.lateral * 9 + impactKick;
      const bob = runningRef.current ? Math.sin(now / 38) * Math.min(2, race.speed / 130) : 0;
      ctx.save();
      ctx.translate(kartX, 432 + bob);
      if (race.collisionFlash > 0) ctx.rotate(Math.sin(now * .12) * .08 * race.collisionFlash);
      const currentCharacter = CHARACTERS[characterRef.current];
      if (race.shield > 0) {
        ctx.strokeStyle = currentCharacter.accent;
        ctx.lineWidth = 5;
        ctx.globalAlpha = .7 + Math.sin(now / 90) * .18;
        ctx.beginPath();
        ctx.arc(0, -7, 67, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (race.boost > 0) {
        ctx.fillStyle = "#53ecff";
        polygon(ctx, [[-31,36],[-11,36],[-18,79]], "#53ecff");
        polygon(ctx, [[11,36],[31,36],[18,79]], "#f7d84c");
      }
      const driver = driverRef.current;
      const racingDriver = racingDriverRef.current;
      const hasRacingSprite = Boolean(currentCharacter.racingSheet && racingDriver?.complete && racingDriver.naturalWidth);
      if (hasRacingSprite && racingDriver) {
        let row = 0;
        let frame = Math.floor(now / 125) % 4;
        if (race.specialActive > 0) {
          row = 4;
          frame = Math.floor(now / 120) % 4;
        } else if (race.collisionFlash > 0) {
          row = 3;
          frame = Math.floor(now / 95) % 4;
        } else if (controlsRef.current.drift && steer !== 0) {
          row = 2;
          frame = steer < 0 ? Math.floor(now / 110) % 2 : 2 + Math.floor(now / 110) % 2;
        } else if (steer !== 0) {
          row = 1;
          frame = steer < 0 ? 0 : 3;
        }
        ctx.drawImage(
          racingDriver,
          frame * RACING_SPRITE_CELL,
          row * RACING_SPRITE_CELL,
          RACING_SPRITE_CELL,
          RACING_SPRITE_CELL,
          -84,
          -119,
          168,
          168,
        );
      } else {
        if (driver?.complete && driver.naturalWidth) ctx.drawImage(driver, 0, 0, driver.naturalWidth / 4, driver.naturalHeight / 5, -43, -72, 86, 86);
        ctx.fillStyle = race.driftCharge > .12 ? "#fbbf24" : currentCharacter.color;
        polygon(ctx, [[-54,3],[-35,-16],[35,-16],[54,3],[43,39],[-43,39]], ctx.fillStyle as string);
        ctx.fillStyle = "#101827";
        ctx.fillRect(-39, 1, 78, 23);
        ctx.fillStyle = "#dae5f5";
        ctx.fillRect(-48, 24, 20, 18);
        ctx.fillRect(28, 24, 20, 18);
        ctx.fillStyle = currentCharacter.accent;
        ctx.fillRect(-24, 27, 48, 7);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.fillText(currentCharacter.name[0], 0, 20);
      }
      ctx.restore();

      // Compact live circuit map: the selected driver is the large white marker.
      const mapX = 812;
      const mapY = 225;
      const mapW = 122;
      const mapH = 104;
      const mapCenterX = mapX + mapW / 2;
      const mapCenterY = mapY + 57;
      ctx.save();
      ctx.fillStyle = "rgba(5,10,24,.84)";
      ctx.fillRect(mapX, mapY, mapW, mapH);
      ctx.strokeStyle = "rgba(121,157,205,.65)";
      ctx.lineWidth = 2;
      ctx.strokeRect(mapX + 1, mapY + 1, mapW - 2, mapH - 2);
      ctx.fillStyle = "#dbeafe";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("LIVE MAP", mapX + 9, mapY + 15);
      ctx.beginPath();
      for (let i = 0; i <= 72; i++) {
        const point = mapPointAt(i / 72);
        const x = mapCenterX + point.x * 48;
        const y = mapCenterY + point.y * 40;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#43536f";
      ctx.lineWidth = 7;
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.strokeStyle = "#91a6c7";
      ctx.lineWidth = 2;
      ctx.stroke();
      const drawMapMarker = (distance: number, color: string, player = false) => {
        const point = mapPointAt(trackProgress(distance));
        const x = mapCenterX + point.x * 48;
        const y = mapCenterY + point.y * 40;
        ctx.beginPath();
        ctx.arc(x, y, player ? 5 : 3.5, 0, TAU);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = player ? "#ffffff" : "#09101f";
        ctx.lineWidth = player ? 2.5 : 1.5;
        ctx.stroke();
      };
      for (const opponent of opponentsRef.current) drawMapMarker(opponent.distance, opponent.color);
      drawMapMarker(race.distance, CHARACTERS[characterRef.current].color, true);
      ctx.restore();

      if (race.collisionFlash > 0) {
        ctx.fillStyle = `rgba(255,76,109,${race.collisionFlash * .35})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    const loop = (now: number) => {
      const steps = advanceRaceClock(clock, now, runningRef.current);
      const dt = RACE_STEP;
      const race = raceRef.current;
      const c = controlsRef.current;
      for (let step = 0; step < steps && runningRef.current && !race.finished; step++) {
        visualTime += dt * 1000;
        race.elapsed += dt;
        race.specialCooldown = Math.max(0, race.specialCooldown - dt);
        race.specialActive = Math.max(0, race.specialActive - dt);
        const steer = (c.right ? 1 : 0) - (c.left ? 1 : 0);
        const playerTrackWidth = trackWidthAt(race.distance);
        const offroad = Math.abs(race.lateral) > .78 * playerTrackWidth;
        const target = c.brake ? 85 : c.throttle ? 292 : 238;
        const adaptiveGrip = characterRef.current === "adelia" && race.specialActive > 0;
        const targetWithSurface = offroad && !adaptiveGrip ? Math.min(target, 142) : target;
        const boostAdd = race.boost > 0 ? 92 : 0;
        race.speed += (targetWithSurface + boostAdd - race.speed) * Math.min(1, dt * (race.speed < targetWithSurface ? 1.9 : 3.2));
        const steerPower = (.45 + race.speed / 330) * 1.5 * (c.drift ? 1.28 : 1);
        race.lateral += steer * steerPower * dt;
        // Track the road centre itself, not just the curve drawn ahead. A kart
        // that keeps pointing straight now falls toward the outside edge as
        // the centre line moves; counter-steering is required to stay on road.
        const frameAdvance = race.speed * dt * 2.15;
        const roadShift = curveAt(race.distance + frameAdvance) - curveAt(race.distance);
        race.lateral -= roadShift * 3;
        race.lateral *= 1 - dt * (c.drift ? .025 : .045);
        if (c.drift && steer !== 0 && race.speed > 145) race.driftCharge = clamp(race.driftCharge + dt * .64, 0, 1);
        else if (!c.drift && driftWasHeld.current && race.driftCharge > .18) {
          race.boost = .65 + race.driftCharge * 1.15;
          race.driftCharge = 0;
        } else if (!c.drift) race.driftCharge = Math.max(0, race.driftCharge - dt * .9);
        driftWasHeld.current = c.drift;
        race.boost = Math.max(0, race.boost - dt);
        if (Math.abs(race.lateral) > 1.06 * playerTrackWidth && race.collisionFlash <= 0) {
          race.lateral = Math.sign(race.lateral) * .82 * playerTrackWidth;
          if (race.shield > 0) {
            race.shield = 0;
            race.speed *= .76;
            race.collisionFlash = .55;
            race.impactKind = "shield";
          } else {
            race.speed *= .18;
            race.collisionFlash = 1;
            race.impactKind = "wall";
          }
        }
        race.collisionFlash = Math.max(0, race.collisionFlash - dt * 1.6);
        if (race.collisionFlash <= 0) race.impactKind = "";
        const oldTrackPos = race.distance % TRACK_LENGTH;
        race.distance += race.speed * dt * 2.15;
        if (race.distance >= race.nextItemDistance) {
          if (Math.abs(race.lateral - race.nextItemLane) < .36 && !race.heldItem) {
            const itemIndex = Math.floor(race.nextItemDistance / 470) % 3;
            race.heldItem = (["turbo", "shield", "pulse"] as const)[itemIndex];
          }
          race.nextItemDistance += 1080;
          race.nextItemLane = Math.sin(race.nextItemDistance / 410) * .58;
        }
        for (const opponent of opponentsRef.current) {
          const bend = Math.abs(curveAt(opponent.distance + 150) - curveAt(opponent.distance - 30));
          const mistake = Math.max(0, Math.sin(opponent.distance / 470 + opponent.phase) - .9) * 11;
          const opponentTrackWidth = trackWidthAt(opponent.distance);
          const laneLimit = .78 * opponentTrackWidth;
          const desiredLane = clamp(Math.sin(opponent.distance / 610 + opponent.phase) * .34 + mistake * Math.sign(Math.sin(opponent.phase * 2.7)), -laneLimit, laneLimit);
          opponent.visualSteer += (clamp((desiredLane - opponent.lateral) * 4.5, -1, 1) - opponent.visualSteer) * Math.min(1, dt * 7);
          opponent.lateral += (desiredLane - opponent.lateral) * Math.min(1, dt * 1.25);
          const aiOffroad = Math.abs(opponent.lateral) > .8 * opponentTrackWidth;
          opponent.stun = Math.max(0, opponent.stun - dt);
          const aiTarget = opponent.stun > 0 ? 88 : aiOffroad ? 142 : opponent.pace + Math.sin(opponent.distance / 390 + opponent.phase) * 9 - bend * 15;
          opponent.speed += (aiTarget - opponent.speed) * Math.min(1, dt * (opponent.speed < aiTarget ? 1.72 : 3.4));
          opponent.wallCooldown = Math.max(0, opponent.wallCooldown - dt);
          opponent.impact = Math.max(0, opponent.impact - dt);
          if (Math.abs(opponent.lateral) > 1.02 * opponentTrackWidth && opponent.wallCooldown <= 0) {
            opponent.lateral = Math.sign(opponent.lateral) * .75 * opponentTrackWidth;
            opponent.speed *= .48;
            opponent.wallCooldown = .8;
            opponent.impact = .55;
          }
          opponent.distance += opponent.speed * dt * 2.15;
          const gap = opponent.distance - race.distance;
          if (Math.abs(gap) < 54 && Math.abs(opponent.lateral - race.lateral) < .28 && race.collisionFlash <= 0) {
            const push = race.lateral <= opponent.lateral ? -.16 : .16;
            race.lateral += push;
            opponent.lateral -= push * .75;
            const powerRam = characterRef.current === "dylan" && race.specialActive > 0;
            if (powerRam) opponent.speed *= .38;
            else if (race.shield > 0) {
              race.shield = 0;
              opponent.speed *= .72;
              race.impactKind = "shield";
            } else {
              race.speed *= .7;
              opponent.speed *= .82;
              race.impactKind = "kart";
            }
            race.collisionFlash = .72;
            opponent.impact = .65;
          }
        }
        const pack = opponentsRef.current;
        for (let i = 0; i < pack.length; i++) for (let j = i + 1; j < pack.length; j++) {
          if (Math.abs(pack[i].distance - pack[j].distance) < 42 && Math.abs(pack[i].lateral - pack[j].lateral) < .22) {
            const nudge = pack[i].lateral <= pack[j].lateral ? -.1 : .1;
            pack[i].lateral += nudge;
            pack[j].lateral -= nudge;
            pack[i].speed *= .94;
            pack[j].speed *= .94;
            pack[i].impact = Math.max(pack[i].impact, .28);
            pack[j].impact = Math.max(pack[j].impact, .28);
          }
        }
        const newTrackPos = race.distance % TRACK_LENGTH;
        if (race.checkpoint === 0 && oldTrackPos < CHECKPOINTS[0] && newTrackPos >= CHECKPOINTS[0]) race.checkpoint = 1;
        if (race.checkpoint === 1 && oldTrackPos < CHECKPOINTS[1] && newTrackPos >= CHECKPOINTS[1]) race.checkpoint = 2;
        if (newTrackPos < oldTrackPos) {
          if (race.checkpoint === 2) {
            if (race.lap >= TOTAL_LAPS) {
              race.finished = true;
              race.lastTime = race.elapsed;
              runningRef.current = false;
              setRunning(false);
              setFinished(true);
              let stored = 0;
              try { stored = Number(localStorage.getItem("tekad-racing-best")); } catch { /* Optional device record. */ }
              if (!stored || race.elapsed < stored) {
                try { localStorage.setItem("tekad-racing-best", String(race.elapsed)); } catch { /* Do not interrupt the finish screen. */ }
                setBestTime(race.elapsed);
              }
            } else race.lap += 1;
          }
          race.checkpoint = 0;
        }
      }
      draw(race, visualTime);
      if (now - hudTick > 80) {
        hudTick = now;
        const position = 1 + opponentsRef.current.filter(opponent => opponent.distance > race.distance).length;
        setHud({ speed: Math.round(race.speed), lap: race.lap, position, elapsed: race.elapsed, checkpoint: race.checkpoint, drift: race.driftCharge, boost: race.boost, offroad: Math.abs(race.lateral) > .78 * trackWidthAt(race.distance), impact: race.impactKind, item: race.heldItem, shield: race.shield, specialCooldown: race.specialCooldown, specialActive: race.specialActive });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pointer = (key: keyof Controls, value: boolean) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (value) event.currentTarget.setPointerCapture(event.pointerId);
    setControl(key, value);
  };

  return (
    <section className="racing-stage" aria-label="TEKAD Racing">
      <div className="racing-statusbar">
        <div><span>PEMBALAP</span><strong>{CHARACTERS[selectedCharacter].name}</strong></div>
        <div><span>REKOR PERANGKAT</span><strong>{bestTime ? formatTime(bestTime) : "--:--.--"}</strong></div>
        <button onClick={togglePause} disabled={!started || finished}>{running ? "Jeda" : "Lanjut"}</button>
      </div>
      <div className={`racing-canvas-wrap${!started ? " is-setup" : ""}`}>
        <canvas ref={canvasRef} width={W} height={H} className="racing-canvas" aria-label="Lintasan balap Earth 3000" />
        <div className="racing-hud">
          <div><span>POSITION</span><strong>{hud.position}/5</strong></div>
          <div><span>LAP</span><strong>{hud.lap}/{TOTAL_LAPS}</strong></div>
          <div><span>TIME</span><strong>{formatTime(hud.elapsed)}</strong></div>
          <div><span>SPEED</span><strong>{hud.speed}<small> KM/H</small></strong></div>
        </div>
        <div className="racing-item-slot"><span>ITEM · Q</span><strong>{hud.item ? ITEM_LABELS[hud.item] : "EMPTY"}</strong></div>
        <div className={`racing-special-slot ${hud.specialActive > 0 ? "active" : ""}`}><span>SPECIAL · E</span><strong>{hud.specialCooldown > 0 ? `${hud.specialCooldown.toFixed(1)}s` : CHARACTERS[selectedCharacter].special}</strong></div>
        <div className={`racing-meter ${hud.impact ? "wall-hit" : ""}`}><span>{hud.impact === "wall" ? "WALL HIT!" : hud.impact === "kart" ? "KART HIT!" : hud.impact === "shield" ? "GUARD BLOCK!" : hud.impact === "pulse" ? "PULSE HIT!" : hud.boost > 0 ? "MINI BOOST" : hud.offroad ? "OFF-ROAD" : "DRIFT CHARGE"}</span><i><b style={{ width: `${hud.impact || hud.boost > 0 ? 100 : hud.drift * 100}%` }} /></i></div>
        {!started && <div className="racing-overlay character-setup">
          <span className="eyebrow">TEKAD RACING</span><h2>Pilih pembalap</h2>
          <div className="racing-character-select">{(Object.values(CHARACTERS) as CharacterSpec[]).map(character => <button key={character.id} aria-pressed={selectedCharacter === character.id} className={selectedCharacter === character.id ? "selected" : ""} style={{ "--pick": character.color } as React.CSSProperties} onClick={() => selectCharacter(character.id)}><b className="driver-portrait" style={{ backgroundImage: `url(${character.racingSheet})` }} aria-hidden="true" /><span>{character.name}</span></button>)}</div>
          <p>{CHARACTERS[selectedCharacter].description}</p>
          <button className="racing-start" onClick={startRace}>Mulai balapan</button>
        </div>}
        {started && !running && !finished && <div className="racing-overlay racing-paused" role="group" aria-label="Balapan dijeda">
          <h2>Jeda</h2><p>Posisi dan waktu balapan tetap tersimpan selama halaman ini terbuka.</p>
          <button onClick={togglePause}>Lanjut balapan</button>
          <button className="racing-secondary" onClick={startRace}>Ulang dari awal</button>
          <button className="racing-secondary" onClick={returnToSelection}>Kembali pilih pembalap</button>
        </div>}
        {finished && <div className="racing-overlay finish"><span className="eyebrow">FINISH · POSISI {hud.position}/5</span><h2>{formatTime(raceRef.current.lastTime)}</h2><p>Rekor perangkat: {bestTime ? formatTime(bestTime) : "--:--.--"}</p><button onClick={startRace}>Balapan lagi</button><button className="racing-secondary" onClick={returnToSelection}>Pilih pembalap</button></div>}
      </div>
      <div className="racing-controls" aria-label="Kontrol balapan">
        <div className="racing-control-group"><button aria-label="Belok kiri" onPointerDown={pointer("left", true)} onPointerUp={pointer("left", false)} onPointerCancel={pointer("left", false)} onLostPointerCapture={pointer("left", false)}>←</button><button aria-label="Belok kanan" onPointerDown={pointer("right", true)} onPointerUp={pointer("right", false)} onPointerCancel={pointer("right", false)} onLostPointerCapture={pointer("right", false)}>→</button></div>
        <p><b>Gas otomatis</b><br />A/D belok · W gas ekstra · Spasi drift · S rem · Q item · E skill · P jeda</p>
        <div className="racing-control-group actions"><button className="brake" aria-label="Rem" onPointerDown={pointer("brake", true)} onPointerUp={pointer("brake", false)} onPointerCancel={pointer("brake", false)} onLostPointerCapture={pointer("brake", false)}>REM</button><button className="drift" aria-label="Drift" onPointerDown={pointer("drift", true)} onPointerUp={pointer("drift", false)} onPointerCancel={pointer("drift", false)} onLostPointerCapture={pointer("drift", false)}>DRIFT</button><button className="item" aria-label="Gunakan item" onClick={useItem} disabled={!running || !hud.item}>ITEM</button><button className="special" aria-label="Gunakan special" onClick={useSpecial} disabled={!running || hud.specialCooldown > 0}>SPECIAL</button></div>
      </div>
    </section>
  );
}
