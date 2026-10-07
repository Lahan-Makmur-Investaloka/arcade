'use client';
import {useEffect,useRef,useState} from 'react';
export default function BattleMusic(){
 const audio=useRef<HTMLAudioElement>(null);
 const wanted=useRef(true);
 const [enabled,setEnabled]=useState(false);
 const [volume,setVolume]=useState(.35);
 const [error,setError]=useState('');
 useEffect(()=>{const element=audio.current;if(element)element.volume=volume;},[volume]);
 useEffect(()=>{const element=audio.current;return()=>{element?.pause();};},[]);
 useEffect(()=>{
  const play=()=>{const el=audio.current;if(wanted.current&&el?.paused&&!document.hidden){el.volume=volume;void el.play().then(()=>setEnabled(true)).catch(()=>{});}};
  const gesture=(event:Event)=>{if(event.target instanceof Element&&event.target.closest('.jrpg-music'))return;play();};
  const visibility=()=>{if(document.hidden){audio.current?.pause();setEnabled(false);}else play();};
  play();document.addEventListener('pointerdown',gesture);document.addEventListener('keydown',gesture);document.addEventListener('visibilitychange',visibility);
  return()=>{document.removeEventListener('pointerdown',gesture);document.removeEventListener('keydown',gesture);document.removeEventListener('visibilitychange',visibility);};
 },[volume]);
 async function toggle(){
  const element=audio.current;if(!element)return;
  if(!element.paused){wanted.current=false;element.pause();setEnabled(false);return;}
  wanted.current=true;setError('');try{element.volume=volume;await element.play();setEnabled(true);}catch{setEnabled(false);setError('Unable to play. Tap Music On to retry.');}
 }
 return <div className="jrpg-music">
  <audio ref={audio} src="/jrpg/fight-bgm.m4a" loop autoPlay preload="auto" onError={()=>{setEnabled(false);setError('Music could not load. Tap to retry.');}}/>
  <button onClick={toggle} aria-pressed={enabled}>{enabled?'Music Off':'Music On'}</button>
  <label>Volume <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e=>setVolume(Number(e.target.value))} aria-label="Music volume"/></label>
  {error&&<span role="status">{error}</span>}
 </div>;
}
