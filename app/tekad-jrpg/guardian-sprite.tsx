'use client';
import {useEffect,useRef} from 'react';
import type {Battle} from './battle';
import {enemyTime,recoveryTime} from './motion';
export const ENEMY_IMPACT_MS=1620;
type Pose={sheet:string;row:number;frame:number;effect?:number};
export function guardianPose(b:Battle,t:number):Pose{
 const f=(n:number)=>Math.max(0,Math.min(3,Math.floor(n/180)));
 if(b.phase==='won')return {sheet:'reactions',row:3,frame:f(t)};
 if(b.phase==='lost')return {sheet:'attacks',row:3,frame:f(t)};
 if(b.broken&&!(b.phase==='enemy'&&b.breakRecovery)){return {sheet:'reactions',row:1,frame:b.phase==='party'&&b.lastActor==='timmy'&&b.lastAction==='bash'&&!b.breakRecovery?f(t):3,effect:b.phase==='party'&&b.lastAction==='bash'&&!b.breakRecovery?2:undefined};}
 if(b.phase==='party')return b.broken?{sheet:'reactions',row:1,frame:b.breakRecovery?3:f(t),effect:b.breakRecovery?undefined:2}:b.enemyDamage?{sheet:'reactions',row:0,frame:f(t)}:b.charged?{sheet:'movement',row:2,frame:3,effect:3}:{sheet:'movement',row:0,frame:0};
 if(b.breakRecovery&&b.phase==='player')return {sheet:'reactions',row:1,frame:3};
 if(b.phase==='enemy'){
  if(b.breakRecovery&&t<900)return {sheet:'reactions',row:t<720?1:2,frame:t<720?3:2};
  if(b.broken&&!b.breakRecovery)return {sheet:'reactions',row:1,frame:3};
  if(t<720&&b.charged)return {sheet:'movement',row:2,frame:3,effect:3};
  if(t<720)return b.enemyDamage?{sheet:'reactions',row:0,frame:f(t)}:{sheet:'movement',row:0,frame:0};
  if(b.round%3===2)return {sheet:'movement',row:2,frame:f(t-720),effect:3};
  return {sheet:'attacks',row:b.round%3===0?2:0,frame:f(t-900)};
 }
 if((b.heroDamage>0||b.kiranaDamage>0||b.dylanDamage>0)&&t<540)return {sheet:'attacks',row:b.round%3===0?2:0,frame:t<180?2:3,effect:b.round%3===0?1:0};
 return b.charged?{sheet:'movement',row:2,frame:3,effect:3}:{sheet:'movement',row:0,frame:0};
}
export default function GuardianSprite({battle,effects=false}:{battle:Battle;effects?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const images=useRef<Record<string,HTMLImageElement>>({});
 useEffect(()=>{for(const name of ['movement','attacks','reactions','effects']){const img=new Image();img.src=`/jrpg/guardian-${name}.png`;images.current[name]=img;}return()=>{images.current={};};},[]);
 useEffect(()=>{
  let raf=0;let last='';const start=performance.now();
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const draw=(now:number)=>{
   const elapsed=now-start,t=battle.phase==='enemy'?enemyTime(elapsed):(battle.heroDamage>0||battle.kiranaDamage>0||battle.dylanDamage>0)?recoveryTime(elapsed):elapsed,p=guardianPose(battle,t),ctx=canvas.current?.getContext('2d');
   const row=effects?p.effect:p.row,frame=effects?(p.effect===3?Math.floor(t/240)%4:Math.min(3,Math.floor(t/135))):p.frame;
   const img=images.current[effects?'effects':p.sheet];
   const attacking=battle.phase==='enemy'&&(!battle.broken||battle.breakRecovery)&&battle.round%3!==2;
   const recovering=battle.phase==='enemyRecovery'&&(battle.heroDamage>0||battle.kiranaDamage>0||battle.dylanDamage>0)&&t<540;
   const progress=attacking?Math.max(0,Math.min(1,(t-900)/360)):recovering?Math.max(0,1-t/540):0;
   const origin=canvas.current?.parentElement?.getBoundingClientRect();
   const target=canvas.current?.closest('.jrpg-stage')?.querySelector(battle.hp>0?'.timmy-actor':battle.kiranaHp>0?'.kirana-actor':'.dylan-actor')?.getBoundingClientRect();
   const distance=origin&&target&&origin.width?(origin.x+origin.width/2-target.x-target.width/2)/origin.width:1;
   const travel=reduced.matches?0:progress*progress*(3-2*progress)*distance;const idle=!battle.broken&&!battle.charged&&!attacking&&!recovering&&battle.phase!=='won'&&battle.phase!=='lost';const breath=idle&&!reduced.matches?Math.sin(now/950)*.6:0;
   if(canvas.current){canvas.current.style.transformOrigin='50% 96%';canvas.current.style.transform=`translateX(${-100*travel}%) translateY(${breath}px) scaleY(${1+breath*.002})`;
    if(effects&&p.effect!==undefined&&p.effect<2)canvas.current.style.transform=`translateX(${-100*distance}%)`;
    if(effects)canvas.current.style.opacity=p.effect!==undefined&&p.effect<2?`${Math.max(0,1-t/540)}`:'1';
    if(!effects)canvas.current.parentElement?.style.setProperty('--guardian-travel',`${-100*travel/0.76}%`);}

   const key=`${effects?'fx':p.sheet}-${row}-${frame}`;
   if(ctx&&img?.complete&&img.naturalWidth&&key!==last){last=key;ctx.clearRect(0,0,512,512);ctx.imageSmoothingEnabled=false;
    if(row!==undefined){const cell=img.naturalWidth/4;if(!effects&&p.sheet==='reactions'){const bands=[0,345,655,965,1254],ground=[330,645,955,1228],scale=512/cell;ctx.drawImage(img,Math.round(frame*cell),bands[row],Math.floor(cell),bands[row+1]-bands[row],0,500-(ground[row]-bands[row])*scale,512,(bands[row+1]-bands[row])*scale);}else ctx.drawImage(img,Math.round(frame*cell),Math.round(row*cell),Math.floor(cell),Math.floor(cell),0,0,512,512);}
   }
   raf=requestAnimationFrame(draw);
  };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
 },[battle.phase,battle.round,battle.event,battle.broken,battle.enemyDamage,battle.heroDamage,battle.charged,battle.breakRecovery,effects]);
 return <canvas width={512} height={512} ref={canvas} className={effects?'jrpg-guardian-fx':'jrpg-guardian-sprite'} aria-hidden={effects||undefined} role={effects?undefined:'img'} aria-label={effects?undefined:'Animated Antlered Guardian'}/>;
}
