'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {Action,Battle} from './battle';

type Cue=Action|'hit'|'ironfall'|'break'|'charge'|'win'|'lose';
// Quiet, synthesized combat accents. No network requests or autoplay dependency.
export function useBattleSound(battle:Battle){
 const context=useRef<AudioContext|null>(null);
 const active=useRef(true);
 const [enabled,setEnabled]=useState(true);
 const unlock=useCallback(()=>{
  if(!active.current)return;
  try{
   const Constructor=window.AudioContext||(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
   if(!Constructor)return;
   context.current??=new Constructor();
   if(context.current.state==='suspended')void context.current.resume().catch(()=>{});
  }catch{/* Audio is optional; combat remains playable. */}
 },[]);
 const play=useCallback((cue:Cue)=>{
  const ctx=context.current;
  if(!active.current||!ctx||ctx.state!=='running'||document.hidden)return;
  const tone=(frequency:number,end:number,duration:number,delay=0,type:OscillatorType='sine',level=.07)=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+delay;
   osc.type=type;osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(end,start+duration);
   gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.008);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
   osc.connect(gain);gain.connect(ctx.destination);osc.start(start);osc.stop(start+duration+.02);
   osc.onended=()=>{osc.disconnect();gain.disconnect();};
  };
  const noise=(duration:number,frequency:number,level=.09)=>{
   const buffer=ctx.createBuffer(1,Math.ceil(ctx.sampleRate*duration),ctx.sampleRate),data=buffer.getChannelData(0);
   for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);
   const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();
   source.buffer=buffer;filter.type='lowpass';filter.frequency.value=frequency;gain.gain.value=level;
   source.connect(filter);filter.connect(gain);gain.connect(ctx.destination);source.start();
   source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  };
  if(cue==='attack'){noise(.13,3800);tone(620,180,.15,0,'triangle');}
  if(cue==='bash'||cue==='crusher'||cue==='hit'){noise(.18,1600);tone(170,55,.23);tone(940,620,.12,0,'triangle',.025);}
  if(cue==='ironfall'){noise(.45,1900,.13);tone(140,32,.55,0,'sine',.13);tone(65,30,.4,.12);}
  if(cue==='break'){noise(.3,5200);[1100,760,420].forEach((f,i)=>tone(f,f*.55,.25,i*.055,'triangle',.04));}
  if(cue==='guard'){tone(350,510,.25,0,'triangle');tone(700,1020,.25,.03,'sine',.035);}
  if(cue==='potion'||cue==='win'){[392,494,587,784].forEach((f,i)=>tone(f,f,.3,i*.1,'sine',.055));}
  if(cue==='charge'){tone(90,260,.7,0,'triangle',.055);tone(180,520,.65,.1,'sine',.04);}
  if(cue==='lose')tone(180,45,.65,0,'triangle',.06);
 },[]);
 useEffect(()=>{
  if(battle.phase==='party'&&battle.lastAction)play(battle.broken&&!battle.breakRecovery?'break':battle.lastAction==='heal'?'potion':battle.lastAction==='harmony'?'charge':battle.lastAction);
  else if(battle.phase==='enemyRecovery'&&(battle.heroDamage||battle.kiranaDamage||battle.dylanDamage))play(battle.round%3===0?'ironfall':'hit');
  else if(battle.phase==='enemyRecovery'&&battle.charged)play('charge');
  else if(battle.phase==='won')play('win');
  else if(battle.phase==='lost')play('lose');
 },[battle,play]);
 useEffect(()=>{
  const visibility=()=>{if(document.hidden&&context.current?.state==='running')void context.current.suspend().catch(()=>{});};
  document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('visibilitychange',visibility);void context.current?.close().catch(()=>{});context.current=null;};
 },[unlock]);
 const toggle=()=>{active.current=!active.current;setEnabled(active.current);if(active.current)unlock();else void context.current?.suspend().catch(()=>{});};
 return {enabled,toggle,unlock};
}
