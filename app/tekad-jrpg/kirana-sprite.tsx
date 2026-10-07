'use client';
import {useEffect,useRef} from 'react';
import type {Battle} from './battle';
import {partyTime,recoveryTime} from './motion';
let asset:Promise<HTMLCanvasElement>|undefined;
// Apply a connected background mask at render time; retain the approved source intact.
function sheet(){return asset??=new Promise<HTMLCanvasElement>((resolve,reject)=>{
 const img=new Image();img.onerror=()=>{asset=undefined;reject(new Error('Kirana could not load'));};img.onload=()=>{
  const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);
  const data=ctx.getImageData(0,0,c.width,c.height),p=data.data,w=c.width,h=c.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
  const add=(i:number)=>{if(i<0||i>=w*h||seen[i])return;seen[i]=1;const j=i*4,r=p[j],g=p[j+1],b=p[j+2];if(Math.min(r,g,b)>155&&Math.max(r,g,b)-Math.min(r,g,b)<22)queue[tail++]=i;};
  for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
  while(head<tail){const i=queue[head++];p[i*4+3]=0;if(i%w)add(i-1);if(i%w<w-1)add(i+1);add(i-w);add(i+w);}
  ctx.putImageData(data,0,0);resolve(c);
 };img.src='/jrpg/kirana-bard-sheet-v1.png';
});}
export default function KiranaSprite({battle,portrait=false}:{battle:Battle;portrait?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),source=useRef<HTMLCanvasElement|null>(null);
 useEffect(()=>{let alive=true;void sheet().then(c=>{if(alive)source.current=c;}).catch(()=>{});return()=>{alive=false;};},[]);
 useEffect(()=>{let raf=0,last='';const start=performance.now();const draw=(now:number)=>{
  const elapsed=now-start,t=battle.phase==='party'&&battle.lastActor==='kirana'?partyTime(elapsed):battle.kiranaDamage>0?recoveryTime(elapsed):elapsed,img=source.current,ctx=canvas.current?.getContext('2d'),frame=Math.min(3,Math.floor(t/180));
  let row=0,col=Math.floor(t/300)%4;
  if(battle.kiranaHp===0){row=7;col=3;}
  else if(battle.phase==='won'){row=6;col=frame;}
  else if(battle.phase==='party'&&battle.lastActor==='kirana'){row=battle.lastAction==='attack'?1:battle.lastAction==='heal'||battle.lastAction==='potion'?2:battle.lastAction==='harmony'?3:4;col=frame;}
  else if(battle.kiranaDamage>0&&t<720){row=5;col=frame;}
  else if(battle.kiranaGuard){row=4;col=3;}
  if(portrait){row=0;col=0;}
  const key=`${row}-${col}`;
  if(img&&ctx&&key!==last){last=key;ctx.clearRect(0,0,256,256);ctx.imageSmoothingEnabled=false;
   if(portrait)ctx.drawImage(img,50,22,130,125,0,0,256,256);
   else{const cw=img.width/4,ch=img.height/8;ctx.drawImage(img,Math.round(col*cw),Math.round(row*ch),Math.floor(cw),Math.floor(ch),8,0,240,256);}
  }raf=requestAnimationFrame(draw);
 };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);},[battle.phase,battle.event,battle.lastAction,battle.lastActor,battle.kiranaHp,battle.kiranaGuard,portrait]);
 return <canvas width={256} height={256} ref={canvas} className={portrait?'jrpg-portrait-canvas':'jrpg-sprite-canvas'} role="img" aria-label="Kirana Bard"/>;
}
