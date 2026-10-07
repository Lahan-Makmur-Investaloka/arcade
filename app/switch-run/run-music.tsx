'use client';
import {useEffect,useRef} from 'react';

/** One audio element for the run; existing sound switch controls music and SFX. */
export default function RunMusic({enabled,active,paused}:{enabled:boolean;active:boolean;paused:boolean}) {
 const ref=useRef<HTMLAudioElement>(null);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  let disposed=false;
  el.volume=.32;
  const wanted=()=>!disposed&&enabled&&active&&!paused&&!document.hidden;
  const sync=()=>{
   if(!wanted()){el.pause();return;}
   if(el.paused)void el.play().then(()=>{if(!wanted())el.pause();}).catch(()=>{/* Retry on the next user gesture, including on iOS. */});
  };
  if(!active)el.currentTime=0;
  sync();
  document.addEventListener('visibilitychange',sync);
  window.addEventListener('pointerup',sync);
  window.addEventListener('keydown',sync);
  return()=>{disposed=true;el.pause();document.removeEventListener('visibilitychange',sync);window.removeEventListener('pointerup',sync);window.removeEventListener('keydown',sync);};
 },[enabled,active,paused]);
 return <audio ref={ref} src="/audio/switch-chase-the-dawn.mp3" preload="auto" loop aria-hidden="true"/>;
}
