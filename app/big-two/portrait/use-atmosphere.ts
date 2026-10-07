'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {CardSound,type SoundKind} from '../sound';
import {DEAL_STEP_MS,DEAL_FLIGHT_MS,DEAL_SETTLE_MS,DEFAULT_PREFERENCES,readPreferences,type TablePreferences} from './atmosphere';
const PREF='tekad-capsa-portrait-preferences-v2';
/** Visual deal progress is disposable; the complete engine hand is always saved. */
export function useAtmosphere({blocked,active}:{blocked:boolean;active:boolean}){
 const [preferences,setPreferences]=useState(DEFAULT_PREFERENCES),[ready,setReady]=useState(false),[reduced,setReduced]=useState(false);
 const [dealCount,setDealCount]=useState<number|null>(null),[dealId,setDealId]=useState(0);
 const audio=useRef<CardSound|null>(null);
 useEffect(()=>{
  const sound=new CardSound();audio.current=sound;
  try{const current=localStorage.getItem(PREF);const previous=JSON.parse(localStorage.getItem('tekad-capsa-portrait-preferences-v1')||'null');setPreferences(readPreferences(current?JSON.parse(current):{...previous,sound:true,music:true}));}catch{}
  const unlockOnGesture=()=>sound.unlock();window.addEventListener?.('pointerdown',unlockOnGesture,{passive:true});
  setReady(true);
  const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const change=()=>setReduced(media?.matches??false);change();media?.addEventListener('change',change);
  return()=>{window.removeEventListener?.('pointerdown',unlockOnGesture);sound.dispose();audio.current=null;media?.removeEventListener('change',change);};
 },[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(PREF,JSON.stringify(preferences));}catch{}if(audio.current)audio.current.enabled=preferences.sound;},[preferences,ready]);
 useEffect(()=>{audio.current?.configure({music:preferences.music,effectsVolume:preferences.effectsVolume,musicVolume:preferences.musicVolume,active:active&&!blocked,visible:!blocked});},[preferences,active,blocked]);
 const motion=preferences.motion&&!reduced;
 useEffect(()=>{
  if(dealCount===null||blocked)return;
  // Reduced motion keeps a brief, stationary deal cue without spatial flight.
  const timer=setTimeout(()=>setDealCount(n=>n===null?null:n>=13?null:motion?n+1:13),dealCount>=13?DEAL_SETTLE_MS:motion?(dealCount===0?DEAL_FLIGHT_MS:DEAL_STEP_MS):180);
  return()=>clearTimeout(timer);
 },[dealCount,blocked,motion]);
 const unlock=useCallback(()=>audio.current?.unlock(),[]);
 const cue=useCallback((kind:SoundKind,gesture=false)=>{if(gesture)audio.current?.unlock();audio.current?.play(kind);},[]);
 const update=useCallback((patch:Partial<TablePreferences>)=>{
  const next=readPreferences({...preferences,...patch});
  if(audio.current){audio.current.enabled=next.sound;if(next.sound)audio.current.unlock();}
  setPreferences(next);
 },[preferences]);
 const startDeal=useCallback(()=>{audio.current?.unlock();setDealId(n=>n+1);setDealCount(0);},[]);
 // A short tick per deal wave can stop immediately with a menu/hidden tab.
 const soundedCount=useRef<number|null>(null);
 useEffect(()=>{if(dealCount===null){soundedCount.current=null;return;}if(!blocked&&dealCount>0&&dealCount<14&&soundedCount.current!==dealCount){soundedCount.current=dealCount;cue('select');}},[dealCount,blocked,cue]);
 return {preferences,update,ready,reduced,motion,dealCount,dealId,startDeal,cue,unlock};
}
