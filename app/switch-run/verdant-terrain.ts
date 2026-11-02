import type { IcePlatform } from './frost-world';

export type ForestPlatform = IcePlatform & { forest?: 'stone' | 'bridge'; require?: 'kirana' };
// Each 1,160px section has safe entry/exit banks and its own traversal rhythm.
// Ordinary jumps can cross every mandatory gap; harmony platforms are shortcuts.
export function nextForestPattern(state: {bag:number[];last:number}, rng:()=>number){
  if(!state.bag.length){state.bag=[0,1,2,3,4,5,6,7];for(let i=7;i>0;i--){const j=Math.floor(rng()*(i+1));[state.bag[i],state.bag[j]]=[state.bag[j],state.bag[i]];}if(state.bag[7]===state.last)[state.bag[0],state.bag[7]]=[state.bag[7],state.bag[0]];}
  return state.last=state.bag.pop()!;
}
export function verdantSection(cursor: number, floor: number, index: number, rng: () => number) {
  const platforms: ForestPlatform[] = [];
  const traps: { x: number; floor: number; triggered: boolean; kind: 'root' }[] = [];
  const pattern = index % 8, end = cursor + 1160;
  const nextFloor = Math.max(370, Math.min(458, floor + (rng() < .5 ? -44 : 44)));
  const add = (offset: number, y: number, w: number, h = 22, forest: 'stone' | 'bridge' = 'stone') => {
    const varied=offset>0&&offset<920;
    const p: ForestPlatform = { x: cursor + offset+(varied?Math.floor(rng()*17)-8:0), y:y+(varied?Math.floor(rng()*13)-6:0), w:w+(varied?Math.floor(rng()*17):0), h, forest }; platforms.push(p); return p;
  };
  add(0, floor, 180, 570 - floor);
  if (pattern === 0) { // Staggered ruin pillars: repeated short climbs, then a descent.
    [55, 110, 145, 100, 50].forEach((rise, i) => add(220 + i * 140, floor - rise, 112, 570 - floor + rise));
  } else if (pattern === 1) { // Crumbling bridge over a long ravine.
    for (let i = 0; i < 6; i++) add(210 + i * 120, floor - 20 - Math.sin(i / 5 * Math.PI) * 38, 96, 20, 'bridge');
  } else if (pattern === 2) { // Root garden: lower path with hazards, upper route via steps.
    add(180, nextFloor, 720, 570 - nextFloor);
    add(220, nextFloor - 65, 120); add(370, nextFloor - 130, 150);
    add(560, nextFloor - 150, 150); add(750, nextFloor - 75, 120);
    for (const offset of [340, 640]) traps.push({ x: cursor + offset, floor: nextFloor, triggered: false, kind: 'root' });
  } else if (pattern === 3) { // Descend into a basin and climb its far bank.
    [35, 65, 85, 45, 0].forEach((drop, i) => add(220 + i * 140, Math.min(490, floor + drop), 110, 570 - Math.min(490, floor + drop)));
    const shortcut = add(370, floor - 60, 155); shortcut.require = 'kirana';
    const shortcut2 = add(595, floor - 60, 155); shortcut2.require = 'kirana';
  } else if(pattern===4) { // Alternating solid landings and fragile ledges.
    for (let i = 0; i < 5; i++) add(215 + i * 145, floor - (i % 2 ? 90 : 40), 118, i % 2 ? 20 : 570 - floor + 40, i % 2 ? 'bridge' : 'stone');
  }
  if(pattern===5){ // Broad low terraces with short upper stepping stones.
    for(let i=0;i<4;i++)add(205+i*175,floor-(i%2?65:15),145,570-floor+65);
    add(405,floor-135,130);add(635,floor-110,140);
  }else if(pattern===6){ // Two suspended bridges separated by a safe island.
    add(215,floor-35,125,20,'bridge');add(365,floor-65,125,20,'bridge');
    add(515,floor-35,170,570-floor+35);add(715,floor-75,160,20,'bridge');
    traps.push({x:cursor+600,floor:platforms[3].y,triggered:false,kind:'root'});
  }else if(pattern===7){ // Zig-zag ruins: ascending then descending shelves.
    for(let i=0;i<5;i++)add(210+i*140,floor-[35,85,120,70,25][i],115,22);
    const shortcut=add(420,floor-180,165);shortcut.require='kirana';
  }
  add(920, nextFloor, 240, 570 - nextFloor);
  return { platforms, traps, end, floor: nextFloor, landing: cursor + 920, pattern };
}

export function stepForestPlatforms(platforms: ForestPlatform[], dt: number, player: { x: number; y: number; w: number; h: number; grounded: boolean }) {
  // Shared platform stepping owns the active crumble countdown and regeneration.
  for (const p of platforms) if (p.forest === 'bridge' && !p.gone && !p.crumble && player.grounded && Math.abs(player.y + player.h - p.y) < 4 && player.x + player.w > p.x && player.x < p.x + p.w) p.crumble = .001;
}
