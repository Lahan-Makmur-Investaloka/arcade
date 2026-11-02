'use client';
import {useEffect,useRef} from 'react';
import type {Battle} from './battle';
import {partyTime,recoveryTime} from './motion';
// Source row bands are measured independently: generated sheets are not assumed to be a perfect grid.
const bands=[0,211,410,619,819,1020,1225,1425,1670,1881];
const ground=[200,400,605,805,1005,1205,1420,1650,1860];
export function spritePose(battle:Battle,elapsed:number):[number,number]{
 const frame=Math.min(3,Math.floor(elapsed/180));
 if(battle.hp===0||battle.phase==='lost')return [8,3];
 if(battle.phase==='won')return [7,frame];
 if(battle.phase==='party'&&battle.lastActor==='timmy'){
  if(battle.lastAction==='guard')return [4,frame];
  if(elapsed>720)return [0,Math.floor(elapsed/220)%4];
  return [battle.lastAction==='attack'?2:battle.lastAction==='bash'?3:6,frame];
 }
 if(battle.guard)return [4,3];
 if(battle.heroDamage>0&&elapsed<720)return [5,frame];
 return [0,Math.floor(elapsed/220)%4];
}
export default function TimmySprite({battle,portrait=false}:{battle:Battle;portrait?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);
 const image=useRef<HTMLImageElement|null>(null);
 useEffect(()=>{
  const img=new Image();img.src='/jrpg/timmy-guardian-sheet-v3.png';image.current=img;
  return()=>{image.current=null;};
 },[]);
 useEffect(()=>{
  let raf=0;const start=performance.now();let last='';
  const render=(now:number)=>{
   const img=image.current,ctx=canvas.current?.getContext('2d');
   if(canvas.current&&!portrait){const attacking=battle.phase==='party'&&battle.lastActor==='timmy'&&(battle.lastAction==='attack'||battle.lastAction==='bash'),t=partyTime(now-start),box=canvas.current.parentElement?.getBoundingClientRect(),enemy=canvas.current.closest('.jrpg-stage')?.querySelector('.jrpg-enemy')?.getBoundingClientRect();const distance=box&&enemy?(enemy.x+enemy.width*.22-box.x-box.width*.8)/box.width:0,progress=attacking?(t<360?Math.min(1,t/360):Math.max(0,1-(t-360)/540)):0;canvas.current.style.transform=window.matchMedia('(prefers-reduced-motion: reduce)').matches?'none':`translateX(${distance*100*progress}%)`;}

   if(img?.complete&&img.naturalWidth&&ctx){
    const [row,col]=portrait?[0,0]:spritePose(battle,battle.phase==='party'&&battle.lastActor==='timmy'?partyTime(now-start):battle.heroDamage>0?recoveryTime(now-start):now-start);const key=`${row}-${col}`;
    if(last!==key){last=key;ctx.clearRect(0,0,256,256);ctx.imageSmoothingEnabled=false;
     if(portrait)ctx.drawImage(img,48,20,110,110,0,0,256,256);
     else {const scale=.95;ctx.drawImage(img,col*209,bands[row],209,bands[row+1]-bands[row],28,246-(ground[row]-bands[row])*scale,209*scale,(bands[row+1]-bands[row])*scale);}
    }
   }
   raf=requestAnimationFrame(render);
  };raf=requestAnimationFrame(render);return()=>cancelAnimationFrame(raf);
 },[battle.phase,battle.round,battle.event,battle.lastAction,battle.heroDamage,battle.hp,battle.guard,portrait]);
 return <canvas ref={canvas} width={256} height={256} className={portrait?'jrpg-portrait-canvas':'jrpg-sprite-canvas'} role="img" aria-label={portrait?'Timmy Guardian portrait':'Timmy Guardian animated battle sprite'}/>;
}
