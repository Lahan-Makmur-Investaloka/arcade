let earthArt: HTMLImageElement | undefined;
export function loadEarthArt() {
  if (!earthArt) { earthArt = new Image(); earthArt.src = "/worlds/earth-3000-background.png"; }
  return earthArt;
}

export function drawEarthArtwork(ctx: CanvasRenderingContext2D, camera: number, now: number, width: number, height: number) {
  const art = loadEarthArt();
  if (!art.complete || !art.naturalWidth) return false;
  ctx.save();
  const tileWidth = height * art.naturalWidth / art.naturalHeight;
  const scroll = camera * .16, index = Math.floor(scroll / tileWidth), offset = scroll % tileWidth;
  // Mirror alternate panoramas so the skyline's edges meet during continuous scrolling.
  for (let i = -1; i < Math.ceil(width / tileWidth) + 1; i++) {
    ctx.save(); ctx.translate(i * tileWidth - offset, 0);
    if ((index + i) % 2 !== 0) { ctx.translate(tileWidth, 0); ctx.scale(-1, 1); }
    ctx.drawImage(art, 0, 0, tileWidth + 1, height); ctx.restore();
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, "#060c2433"); shade.addColorStop(.5, "#060c2400"); shade.addColorStop(1, "#060c24b3");
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
  // Sparse foreground rain catches the neon; no flashes obscure obstacles or the player.
  ctx.lineWidth = 1;
  for (let i = 0; i < 32; i++) {
    const x = ((i * 137 - camera * .48) % (width + 40) + width + 40) % (width + 40) - 20;
    const y = (i * 79 + now * .055) % height;
    ctx.strokeStyle = i % 3 ? "#65dfff2e" : "#dd8cff33";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 11); ctx.stroke();
  }
  ctx.restore(); return true;
}
