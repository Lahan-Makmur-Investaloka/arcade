import { BOSS_MASKS } from './boss-masks.mjs';
type Boss={kind:string;x:number;y:number;w:number;h:number;vx:number};
type Rect={x:number;y:number;w:number;h:number};
export const isBeastBoss=(e:Boss)=>e.kind==='glacier'||e.kind==='magma';
function solidRects(e:Boss,hit:(r:Rect)=>boolean){
 const mask=BOSS_MASKS[e.kind as keyof typeof BOSS_MASKS];if(!mask)return false;
 const cw=e.w/mask.width,ch=e.h/mask.height;
 for(let row=0;row<mask.height;row++)for(const [from,to] of mask.rows[row]){
  const x=e.x+(e.vx>0?mask.width-to:from)*cw;
  if(hit({x,y:e.y+row*ch,w:(to-from)*cw,h:ch}))return true;
 }
 return false;
}
const overlaps=(a:Rect,b:Rect)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function beastTouchesPlayer(e:Boss,p:Rect){return overlaps(e,p)&&solidRects(e,r=>overlaps(r,p));}
export function shotHitsBeast(e:Boss,s:{x:number;y:number;radius:number}){
 const bounds={x:s.x-s.radius,y:s.y-s.radius,w:s.radius*2,h:s.radius*2};
 return overlaps(e,bounds)&&solidRects(e,r=>{
  const x=Math.max(r.x,Math.min(s.x,r.x+r.w)),y=Math.max(r.y,Math.min(s.y,r.y+r.h));
  return (s.x-x)**2+(s.y-y)**2<=s.radius**2;
 });
}
