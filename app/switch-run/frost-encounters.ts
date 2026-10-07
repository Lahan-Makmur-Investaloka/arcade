import { drawBossHealth } from "./boss-health";
import type { IcePlatform, FrostEnemy, SkyHazard } from './frost-world';
export const GLACIER_LEFT=58700, GLACIER_ENTRY=59000, GLACIER_GATE=59980;
const limit=(n:number)=>Math.max(310,Math.min(458,n));
export function frostSection(start:number,floor:number,rng:()=>number){
 const kind=Math.floor(rng()*3),count=2+Math.floor(rng()*4),width=125+Math.floor(rng()*26),gap=35;
 const platforms:IcePlatform[]=[{x:start,y:floor,w:180,h:570-floor,ice:'solid'}];
 let x=start+180,y=floor;
 const traps:{x:number;floor:number;triggered:boolean}[]=[];
 for(let i=0;i<count;i++){
   const next=limit(y+(Math.floor(rng()*3)-1)*40);
   if(kind===2){platforms.push({x,y:next,w:180,h:570-next,ice:'solid'});if(i%2===0)traps.push({x:x+90,floor:next,triggered:false});x+=180;}
   else{x+=gap;platforms.push({x,y:next,w:width,h:18,ice:kind===0?'crumble':'lift',baseY:next,phase:0});x+=width;}
   y=next;
 }
 if(kind!==2)x+=gap;
 platforms.push({x,y,w:240,h:570-y,ice:'solid'});
 return {platforms,traps,end:x+240,floor:y,count,kind,landing:x};
}
export function stepGlacier(e:FrostEnemy,playerX:number,dt:number):SkyHazard[]{
 const before=e.phase;e.phase=(before+dt)%9;const phase=e.phase;
 if(before===0||phase<before)e.vx=playerX<e.x?-220:220;
 if(phase>=1.5&&phase<3.5){e.x+=e.vx*dt;e.x=Math.max(GLACIER_LEFT,Math.min(GLACIER_GATE-e.w,e.x));}
 e.y=458-e.h;
 if(before<5&&phase>=5)return [-170,0,170].map(offset=>({x:Math.max(GLACIER_LEFT+40,Math.min(GLACIER_GATE-60,playerX+offset)),y:60,w:30,h:72,vx:0,vy:330,warning:1.2,life:3.5,kind:'icicle' as const,floor:458}));
 return [];
}
export function drawGlacierFight(ctx:CanvasRenderingContext2D,boss:FrostEnemy|undefined,camera:number){
 if(!boss?.alive||!boss.engaged)return;
 ctx.save();ctx.fillStyle='#b0eaff88';ctx.fillRect(GLACIER_GATE-camera,0,5,540);
 drawBossHealth(ctx,boss,'GLACIER BEHEMOTH','#91dbff');
 ctx.font='bold 11px monospace';ctx.fillText(boss.phase<1.5?'BERSIAP MENYERBU · NAIK KE STEP':boss.phase<3.5?'SERBUAN ES · LOMPATI BOSS':boss.phase<5?'BOSS BERHENTI · SERANG SEKARANG':boss.phase<6.5?'STALAKTIT · HINDARI TANDA !':'TERUS SERANG',480,159);ctx.restore();
}
