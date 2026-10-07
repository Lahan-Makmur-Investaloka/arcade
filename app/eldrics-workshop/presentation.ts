import { levels, rotate, type Level } from './engine';

export const ART='/workshop/';
export const CHAPTERS=[
  {name:'Sirkuit dasar',label:'Level 01–05',machine:'Scarab MK-I',asset:'scarab.webp',number:'01',accent:'#6ee7e7',description:'Hubungkan sumber energi ke satu modul.'},
  {name:'Jalur lanjutan',label:'Level 06–10',machine:'Atlas Gyroscope',asset:'gyroscope.webp',number:'02',accent:'#8cc9ff',description:'Susun jalur dengan lebih banyak belokan.'},
  {name:'Dua modul',label:'Level 11–15',machine:'Noctua Scout',asset:'owl.webp',number:'03',accent:'#bca1fa',description:'Bagi aliran energi ke kedua modul.'},
  {name:'Tiga modul',label:'Level 16–20',machine:'Aether Core',asset:'reactor.webp',number:'04',accent:'#87f5bf',description:'Hubungkan ketiga modul ke sumber energi.'},
] as const;

export type Progress={completed:number[];level:number;rotations:number[];moves:number;sound:boolean;ambient:boolean};
export function maskAt(base:number,turns:number){let m=base;for(let n=0;n<((turns%4)+4)%4;n++)m=rotate(m);return m;}
export function masksFor(level:Level,rotations:number[]){return level.tiles.map((tile,i)=>tile.fixed?tile.mask:maskAt(tile.mask,rotations[i]||0));}
export function restoreProgress(raw:string|null):Progress {
  const fallback:Progress={completed:[],level:0,rotations:levels[0].tiles.map(()=>0),moves:0,sound:false,ambient:true};
  try {
    const saved=JSON.parse(raw||'null');if(!saved||typeof saved!=='object')return fallback;
    const level=Number.isInteger(saved.level)&&saved.level>=0&&saved.level<20?saved.level:0;
    const rotations=levels[level].tiles.map((tile,i)=>!tile.fixed&&Array.isArray(saved.rotations)&&Number.isInteger(saved.rotations[i])&&saved.rotations[i]>=0?saved.rotations[i]%4:0);
    return {level,rotations,completed:[...new Set<number>(Array.isArray(saved.completed)?saved.completed.filter((n:unknown)=>typeof n==='number'&&Number.isInteger(n)&&n>=0&&n<20):[])],moves:Number.isInteger(saved.moves)&&saved.moves>=0?saved.moves:0,sound:saved.sound===true,ambient:saved.ambient!==false};
  }catch{return fallback;}
}
export function pipePath(mask:number){
  const points=['50 0','100 50','50 100','0 50'];
  const ds=[0,1,2,3].filter(d=>mask&(1<<d));
  if(ds.length===2)return `M${points[ds[0]]} Q50 50 ${points[ds[1]]}`;
  return ds.map(d=>`M50 50 L${points[d]}`).join(' ');
}
export function tileLabel(level:Level,i:number,mask:number){const tile=level.tiles[i];const kind=tile.kind==='source'?'Sumber energi':tile.kind==='machine'?`Modul mesin ${level.targets.indexOf(i)+1}`:tile.kind==='block'?'Panel tertutup':'Putar jalur';return `${kind}, baris ${Math.floor(i/level.size)+1}, kolom ${i%level.size+1}${tile.kind==='wire'?', terhubung ke '+['atas','kanan','bawah','kiri'].filter((_,d)=>mask&(1<<d)).join(' dan '):''}`;}

export function energyPath(mask:number,entry:number){
 const points=['50 0','100 50','50 100','0 50'];
 const ds=[0,1,2,3].filter(d=>mask&(1<<d));
 if(ds.length===1)return entry>=0?`M${points[ds[0]]} L50 50`:`M50 50 L${points[ds[0]]}`;
 if(ds.length===2){const first=ds.includes(entry)?entry:ds[0],last=ds.find(d=>d!==first)!;return `M${points[first]} Q50 50 ${points[last]}`;}
 return ds.map(d=>d===entry?`M${points[d]} L50 50`:`M50 50 L${points[d]}`).join(' ');
}
