export function createGeometry(COLS = 10, ROWS = 6, WIDTH = 1600, HEIGHT = 900) {
const CW = WIDTH / COLS, CH = HEIGHT / ROWS;
const edgePiece = id => id % COLS === 0 || id % COLS === COLS - 1 || id < COLS || id >= COLS * (ROWS - 1);
const sign = n => ((n * 17 + 7) % 11 < 5 ? 1 : -1);
function piecePath(id) {
  const col = id % COLS, row = Math.floor(id / COLS);
  let x = col * CW, y = row * CH, path = `M ${x} ${y}`;
  function edge(dx, dy, tab) {
    const length = Math.hypot(dx, dy), nx = dy / length, ny = -dx / length;
    const p = (t, h = 0) => `${x + dx * t + nx * h * tab} ${y + dy * t + ny * h * tab}`;
    if (!tab) path += ` L ${p(1)}`;
    else path += ` L ${p(.36)} C ${p(.44)} ${p(.43, 5)} ${p(.4, 15)} C ${p(.32, 38)} ${p(.68, 38)} ${p(.6, 15)} C ${p(.57, 5)} ${p(.56)} ${p(.64)} L ${p(1)}`;
    x += dx; y += dy;
  }
  edge(CW, 0, row === 0 ? 0 : -sign(id - COLS + 100));
  edge(0, CH, col === COLS - 1 ? 0 : sign(id));
  edge(-CW, 0, row === ROWS - 1 ? 0 : sign(id + 100));
  edge(0, -CH, col === 0 ? 0 : -sign(id - 1));
  return path + ' Z';
}
function canSnap(id, x, y) {
  return Math.abs(x - (id % COLS + .5) * CW) < CW * .55 && Math.abs(y - (Math.floor(id / COLS) + .5) * CH) < CH * .55;
}
return {COLS, ROWS, WIDTH, HEIGHT, CW, CH, edgePiece, piecePath, canSnap};
}
export const {COLS, ROWS, WIDTH, HEIGHT, CW, CH, edgePiece, piecePath, canSnap} = createGeometry();
export function shuffled() {
  const ids = Array.from({length: COLS * ROWS}, (_, i) => i);
  for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  return ids;
}
export function readSave(raw) {
  try {
    const s = JSON.parse(raw);
    const valid = n => Number.isInteger(n) && n >= 0 && n < 60;
    if (s.version !== 1 || !Array.isArray(s.placed) || !s.placed.every(valid) || !Array.isArray(s.order) || s.order.length !== 60 || new Set(s.order).size !== 60 || !s.order.every(valid)) return null;
    return {placed: [...new Set(s.placed)], order: s.order, seconds: Number.isFinite(s.seconds) ? Math.max(0, Math.floor(s.seconds)) : 0};
  } catch { return null; }
}
