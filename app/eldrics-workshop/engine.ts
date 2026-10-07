export type Tile = { mask: number; fixed: boolean; kind: 'wire' | 'source' | 'machine' | 'block' };
export type Level = { name: string; size: number; tiles: Tile[]; solution: number[]; source: number; targets: number[] };
export const rotate = (mask: number) => ((mask << 1) & 15) | (mask >> 3);
const directions = [-1, 1, 1, -1];
export function neighbor(i: number, d: number, size: number) {
  const r = Math.floor(i / size), c = i % size;
  if ((d === 0 && r === 0) || (d === 1 && c === size - 1) || (d === 2 && r === size - 1) || (d === 3 && c === 0)) return -1;
  return i + directions[d] * (d % 2 === 0 ? size : 1);
}
const specs: [string, number, number[]][] = [
  ['Jalur lurus',3,[3,4,5]], ['Satu belokan',3,[6,3,4,5]], ['Dua belokan',3,[6,7,4,1,2]], ['Jalan memutar',3,[0,3,6,7,4,5,2]],
  ['Jalur bertingkat',4,[0,1,5,6,10,11,15]], ['Belokan beruntun',4,[12,8,9,5,6,2,3]], ['Jalur panjang',4,[0,4,8,12,13,9,5,6,7]], ['Belokan lanjutan',4,[3,2,1,5,9,10,6,7,11,15]],
  ['Rangkaian panjang',4,[0,1,2,3,7,6,5,9,10,11,15,14,13,12]], ['Rangkaian berliku',4,[12,13,9,8,4,0,1,2,6,10,11,7,3]],
  ['Dua modul',5,[0,1,6,11,12,13,18,23,24]], ['Jalur bercabang',5,[20,15,10,11,6,7,8,13,14]], ['Putar balik',5,[4,3,2,7,12,11,16,21,22,23,24]], ['Jalur berliku',5,[0,5,10,15,20,21,16,11,12,13,8,3,4]],
  ['Dua sambungan',5,[20,21,22,17,12,7,2,3,8,13,18,23,24]], ['Tiga modul',6,[0,1,7,13,19,20,21,15,9,10,11,17,23,29,35]],
  ['Cabang lanjutan',6,[30,24,18,12,6,0,1,2,8,14,20,26,27,28,22,16,10,4,5]], ['Arus berkelok',6,[5,4,3,9,15,14,13,19,25,31,32,33,27,21,22,23,29,35]],
  ['Tiga sambungan',6,[0,6,12,18,24,30,31,25,19,13,7,8,9,15,21,27,33,34,35]], ['Rangkaian akhir',6,[30,31,25,19,13,7,1,2,3,9,15,14,20,26,32,33,34,28,22,16,10,4,5,11,17,23,29,35]],
];
export const levels: Level[] = specs.map(([name,size,path], index) => {
  const solution = Array(size*size).fill(0) as number[];
  const connect = (a: number,b: number) => { const d = [0,1,2,3].find(d=>neighbor(a,d,size)===b); if(d===undefined) throw Error('Invalid path'); solution[a] |= 1<<d; solution[b] |= 1<<((d+2)%4); };
  path.slice(1).forEach((b,j)=>connect(path[j],b));
  const targets = [path[path.length-1]];
  const used = new Set(path);
  const branches = index < 10 ? 0 : index < 15 ? 1 : 2;
  for(let b=0;b<branches;b++) {
    let added=false;
    for(const a of path.slice(2,-2).slice().reverse()) { if(added) break; for(let d=0;d<4;d++) { const n=neighbor(a,d,size); if(n>=0&&!used.has(n)) { connect(a,n); targets.push(n); used.add(n); added=true; break; } } }
  }
  const tiles = solution.map((mask,i): Tile => {
    if(i===path[0]) return {mask,fixed:true,kind:'source'};
    if(targets.includes(i)) return {mask,fixed:true,kind:'machine'};
    if(!mask && (i+index)%3===0) return {mask:0,fixed:true,kind:'block'};
    let m=mask||((i+index)%2 ? 5 : 3);
    for(let k=0;k<(i*7+index*3)%3+1;k++) m=rotate(m);
    return {mask:m,fixed:false,kind:'wire'};
  });
  // Every puzzle starts unsolved, even if all path wires happen to be symmetric.
  const first=path[1]; if(tiles[first].mask===solution[first]) tiles[first].mask=rotate(solution[first]);
  return {name,size,tiles,solution,source:path[0],targets};
});
export function trace(level: Level, masks: number[]) {
  const layers: number[][]=[[level.source]], seen=new Set([level.source]); const leaks:number[]=[]; const entries:Record<number,number>={};
  for(let depth=0;depth<level.tiles.length;depth++) {
    const next:number[]=[];
    for(const i of layers[depth]||[]) for(let d=0;d<4;d++) if(masks[i]&(1<<d)) {
      const n=neighbor(i,d,level.size);
      if(n<0 || !(masks[n]&(1<<((d+2)%4)))) { leaks.push(i); continue; }
      if(!seen.has(n)) {seen.add(n);next.push(n);entries[n]=(d+2)%4;}
    }
    if(!next.length) break; layers.push(next);
  }
  return {layers,entries,leaks:[...new Set(leaks)],success:leaks.length===0 && level.targets.every(i=>seen.has(i))};
}
