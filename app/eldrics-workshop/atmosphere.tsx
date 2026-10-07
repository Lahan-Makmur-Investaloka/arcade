'use client';
import { useEffect,useRef } from 'react';
export default function Atmosphere({enabled,energized}:{enabled:boolean;energized:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),active=useRef(energized);
 useEffect(()=>{active.current=energized;},[energized]);
 useEffect(()=>{
  const el=canvas.current;if(!el||!enabled)return;const ctx=el.getContext('2d');if(!ctx)return;
  let width=0,height=0,frame=0,last=0;
  const particles=Array.from({length:28},(_,i)=>({x:((i*37)%101)/101,y:((i*53)%97)/97,r:.5+(i%4)*.35,s:.004+(i%5)*.0015}));
  const resize=()=>{width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,1.5);el.width=width*dpr;el.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);};
  const paint=(now:number)=>{frame=requestAnimationFrame(paint);if(document.hidden||now-last<40)return;const dt=Math.min((now-last)/1000,.1);last=now;ctx.clearRect(0,0,width,height);for(const p of particles){p.y-=p.s*dt*(active.current?2:1);if(p.y<0)p.y=1;const x=p.x*width+Math.sin(now*.0002+p.x*15)*16;ctx.beginPath();ctx.fillStyle=active.current?'rgba(136,235,238,.4)':'rgba(233,188,111,.28)';ctx.arc(x,p.y*height,p.r,0,Math.PI*2);ctx.fill();}};
  resize();addEventListener('resize',resize);frame=requestAnimationFrame(paint);return()=>{cancelAnimationFrame(frame);removeEventListener('resize',resize);ctx.clearRect(0,0,width,height);};
 },[enabled]);
 return <canvas className="ws-atmosphere" ref={canvas} aria-hidden="true"/>;
}
