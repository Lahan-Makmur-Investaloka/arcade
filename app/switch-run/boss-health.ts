// Shared World 1-style panel for all five bosses, including live spectators.
export function drawBossHealth(ctx: CanvasRenderingContext2D, boss: { hp: number; maxHp: number }, name: string, color: string, width = 960) {
  const left = width / 2 - 200;
  const ratio = boss.maxHp > 0 ? Math.max(0, Math.min(1, boss.hp / boss.maxHp)) : 0;
  ctx.fillStyle = '#100c25eb'; ctx.fillRect(left - 12, 104, 424, 67);
  ctx.font = 'bold 14px ui-monospace, monospace'; ctx.textAlign = 'left';
  ctx.fillStyle = '#edf0ff'; ctx.fillText(name, left, 122);
  ctx.fillStyle = '#35203f'; ctx.fillRect(left, 131, 400, 10);
  ctx.fillStyle = ratio <= .5 ? '#ff657d' : color; ctx.fillRect(left, 131, 400 * ratio, 10);
  ctx.textAlign = 'center'; ctx.fillStyle = '#c9c2de';
}
