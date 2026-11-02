'use client';
import {useCallback,useLayoutEffect,useRef} from 'react';
import type {Game,Move} from './engine';
import {isFreshMove,landingDelay,MOTION,type MotionStamp} from './motion-policy';

type Box={x:number;y:number;width:number;height:number};
type PileSnapshot={node:HTMLElement;bounds:Box}|null;
type Options={game:Game|undefined;round:string;enabled:boolean;visible:boolean;paused:boolean;dealing:boolean;handKey:string;onStart:()=>void;onLand:(move:Move,won:boolean,ownTurn:boolean)=>void;onDeal:()=>void};
const box=(el:Element):Box=>{const r=el.getBoundingClientRect();return{x:r.left,y:r.top,width:r.width,height:r.height};};
const usable=(b:Box)=>[b.x,b.y,b.width,b.height].every(Number.isFinite)&&b.width>0&&b.height>0;

export function useTableMotion(options:Options){
 const root=useRef<HTMLElement|null>(null),previous=useRef<MotionStamp|null>(null),handBoxes=useRef(new Map<string,Box>()),pileSnapshot=useRef<PileSnapshot>(null);
 const presentableRef=useRef(false),flagsRef=useRef(''),handRuns=useRef(new Set<Animation>());
 const runs=useRef(new Set<Animation>()),timers=useRef(new Set<ReturnType<typeof setTimeout>>()),callbacks=useRef(options);
 callbacks.current=options;
 const cancel=useCallback(()=>{for(const timer of timers.current)clearTimeout(timer);timers.current.clear();for(const a of runs.current)a.cancel();runs.current.clear();handRuns.current.clear();root.current?.querySelectorAll('[data-flight]').forEach(el=>el.removeAttribute('data-flight'));root.current?.querySelectorAll('.b2-clearing-pile').forEach(el=>el.remove());},[]);
 const later=useCallback((fn:()=>void,ms:number)=>{const timer=setTimeout(()=>{timers.current.delete(timer);fn();},ms);timers.current.add(timer);},[]);
 const animate=useCallback((el:Element,keyframes:Keyframe[],timing:KeyframeAnimationOptions)=>{
  if(!callbacks.current.enabled||!callbacks.current.visible||callbacks.current.paused||typeof el.animate!=='function')return false;
  try{const a=el.animate(keyframes,timing);runs.current.add(a);if(el.closest('.b2-hand'))handRuns.current.add(a);a.onfinish=()=>{runs.current.delete(a);handRuns.current.delete(a);a.cancel();};return true;}catch{return false;}
 },[]);
 const capture=useCallback(()=>{const next=new Map<string,Box>();root.current?.querySelectorAll('.b2-hand [data-card]').forEach(el=>next.set(el.getAttribute('data-card')!,box(el)));handBoxes.current=next;},[]);
 useLayoutEffect(()=>{
  const {game,round,enabled,visible,paused,dealing}=options;
  const stamp=game?{round,sequence:game.sequence}:null;
  const before=previous.current;
  const presentable=!!game&&visible&&!paused&&!dealing;
  const fresh=!!stamp&&isFreshMove(before,stamp,presentable&&presentableRef.current);
  presentableRef.current=presentable;
  const reflow=fresh||!!before&&!!stamp&&before.round===stamp.round&&before.sequence===stamp.sequence;
  const flags=`${enabled}:${visible}:${paused}:${dealing}`;
  const sameStamp=!!before&&!!stamp&&before.round===stamp.round&&before.sequence===stamp.sequence;
  const changed=!sameStamp||flagsRef.current!==flags;
  previous.current=stamp;flagsRef.current=flags;
  if(changed)cancel();else{for(const a of handRuns.current){a.cancel();runs.current.delete(a);}handRuns.current.clear();}
  const stage=root.current;
  if(!stage||!game){handBoxes.current.clear();pileSnapshot.current=null;return;}
  // Save final layout before WAAPI transforms affect getBoundingClientRect.
  const nextHand=new Map<string,Box>();stage.querySelectorAll('.b2-hand [data-card]').forEach(el=>nextHand.set(el.getAttribute('data-card')!,box(el)));
  const currentPile=stage.querySelector<HTMLElement>('.b2-table .b2-pile');
  const nextPile=sameStamp?pileSnapshot.current:currentPile?{node:currentPile.cloneNode(true) as HTMLElement,bounds:box(currentPile)}:null;
  if(!visible||paused){handBoxes.current=nextHand;pileSnapshot.current=nextPile;return;}
  if(dealing){
   if(!changed){handBoxes.current=nextHand;return;}
   const deck=stage.querySelector('.b2-deck');
   if(deck){const from=box(deck);stage.querySelectorAll('.b2-deal-flight i').forEach((el,i)=>{
    const seat=i%4,target=stage.querySelector(seat===0?'.b2-hand':`.b2-seat-${seat} .b2-mini-hand`);
    if(!target||!usable(from))return;const to=box(target);if(!usable(to))return;
    const x=to.x+to.width/2-23+(Math.floor(i/4)-1.5)*4,y=to.y+to.height/2-32;
    animate(el,[{transform:`translate(${from.x+(from.width-46)/2}px,${from.y+(from.height-64)/2}px) rotate(-5deg)`,opacity:0},{offset:.1,opacity:1},{offset:.85,opacity:1},{transform:`translate(${x}px,${y}px) rotate(${seat===1?-12:seat===3?12:0}deg) scale(.8)`,opacity:0}],{duration:300,delay:i*65,fill:'both',easing:'cubic-bezier(.2,.7,.3,1)'});
   });}
   callbacks.current.onDeal();capture();return;
  }
  let duration=0;
  if(fresh){
   const move=game.history.at(-1);
   if(move){
    callbacks.current.onStart();
    if(move.newTrick&&!game.table&&pileSnapshot.current&&enabled){
     const {node,bounds}=pileSnapshot.current;
     if(usable(bounds)){
      node.classList.add('b2-clearing-pile');node.setAttribute('aria-hidden','true');
      Object.assign(node.style,{left:`${bounds.x}px`,top:`${bounds.y}px`,width:`${bounds.width}px`,height:`${bounds.height}px`});
      stage.appendChild(node);
      if(animate(node,[{opacity:1,transform:'translate(0,0) rotate(0)'},{opacity:0,transform:'translate(26px,-12px) rotate(4deg) scale(.96)'}],{duration:280,easing:'ease-in',fill:'both'}))later(()=>node.remove(),285);else node.remove();
     }
    }
    if(move.cards.length){
     const source=stage.querySelector(move.seat===0?'.b2-hand':`.b2-seat-${move.seat} .b2-mini-hand`);
     const origin=source?box(source):null;
     stage.querySelectorAll('.b2-pile [data-card]').forEach((el,i)=>{
      const end=box(el),saved=move.seat===0?handBoxes.current.get(el.getAttribute('data-card')!):null;
      const start=saved??(origin?{x:origin.x+origin.width/2-end.width*.35,y:origin.y+origin.height/2-end.height*.35,width:end.width*.7,height:end.height*.7}:null);
      if(!start||!usable(start)||!usable(end))return;
      const dx=start.x-end.x,dy=start.y-end.y;
      const flew=animate(el,[{transform:`translate(${dx}px,${dy}px) scale(${start.width/end.width},${start.height/end.height}) rotate(${move.seat===1?-9:move.seat===3?9:0}deg)`,opacity:.85},{offset:.8,transform:'translate(0,-5px) scale(1.025)',opacity:1},{transform:'translate(0,0) scale(1)',opacity:1}],{duration:MOTION.flight,delay:i*MOTION.stagger,easing:'cubic-bezier(.18,.72,.28,1)',fill:'both'});
      if(flew){el.setAttribute('data-flight','true');duration=landingDelay(move.cards.length);}
     });
    }else{
     const badge=stage.querySelector(move.seat===0?'.b2-pass':`.b2-seat-${move.seat} .b2-opponent-status`);
     if(badge)animate(badge,[{transform:'translateY(-5px)',opacity:.4},{transform:'translateY(0)',opacity:1}],{duration:260,easing:'ease-out'});
    }
    const land=()=>{
     stage.querySelectorAll('[data-flight]').forEach(el=>el.removeAttribute('data-flight'));
     const pile=stage.querySelector('.b2-table-play');
     if(move.cards.length&&pile)animate(pile,[{transform:'translateY(0)'},{offset:.35,transform:`translateY(${move.cards.length===5?3:1}px)`},{transform:'translateY(0)'}],{duration:180,easing:'ease-out'});
     const banner=stage.querySelector('.b2-turn-banner');
     if(banner)animate(banner,[{opacity:.65,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:220});
     callbacks.current.onLand(move,game.winner!==null,game.turn===0&&game.winner===null);
    };
    if(duration)later(land,duration);else land();
   }
  }
  // FLIP surviving cards after a committed play or explicit hand sort.
  if(reflow)stage.querySelectorAll('.b2-hand [data-card]').forEach(el=>{
   const old=handBoxes.current.get(el.getAttribute('data-card')!),now=box(el);
   if(old&&usable(old)&&usable(now)&&Math.abs(old.x-now.x)+Math.abs(old.y-now.y)>2){
    const computed=typeof window.getComputedStyle==='function'?window.getComputedStyle(el).transform:'none';
    const base=computed&&computed!=='none'?computed:'';
    animate(el,[{transform:`translate(${old.x-now.x}px,${old.y-now.y}px) ${base}`.trim()},{transform:base||'translate(0,0)'}],{duration:240,easing:'cubic-bezier(.2,.8,.2,1)'});
   }
  });handBoxes.current=nextHand;pileSnapshot.current=nextPile;
 },[options.game?.sequence,options.round,options.enabled,options.visible,options.paused,options.dealing,options.handKey,cancel,capture,animate,later]);
 useLayoutEffect(()=>{
  // Viewport geometry can change during a swipe/rotation; end the decoration, keep game state.
  const reset=()=>{cancel();capture();const pile=root.current?.querySelector<HTMLElement>('.b2-table .b2-pile');pileSnapshot.current=pile?{node:pile.cloneNode(true) as HTMLElement,bounds:box(pile)}:null;};window.addEventListener('resize',reset);window.addEventListener('scroll',reset,true);
  return()=>{cancel();window.removeEventListener('resize',reset);window.removeEventListener('scroll',reset,true);};
 },[cancel,capture]);
 return{root,capture,cancel};
}
