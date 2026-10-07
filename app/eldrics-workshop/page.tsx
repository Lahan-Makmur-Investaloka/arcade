'use client';

import Link from 'next/link';
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {levels,trace} from './engine';
import {ART,CHAPTERS,masksFor,restoreProgress} from './presentation';
import {WorkshopSound} from './sound';
import CircuitTile from './circuit-tile';
import Atmosphere from './atmosphere';
import './workshop.css';

const KEY='tekad-eldric-workshop-v1';
type Phase='idle'|'charging'|'running'|'win'|'fail';
type Panel='levels'|'settings'|'help'|null;
function Icon({name}:{name:'back'|'close'|'sound'|'muted'|'settings'|'grid'|'reset'|'help'|'bolt'|'check'}){
 const paths={back:'M15 5l-7 7 7 7',close:'M6 6l12 12M6 18L18 6',sound:'M11 5L6 9H3v6h3l5 4V5ZM15 8a6 6 0 010 8M18 5a10 10 0 010 14',muted:'M11 5L6 9H3v6h3l5 4V5ZM16 9l5 6M21 9l-5 6',settings:'M12 8a4 4 0 100 8 4 4 0 000-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',grid:'M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z',reset:'M4 10a8 8 0 111 8M4 4v6h6',help:'M9 8a3 3 0 116 0c0 2-3 2-3 5M12 17v1',bolt:'M13 2L4 14h7l-1 8L20 9h-7Z',check:'M5 12l4 4L19 6'};
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}

export default function Workshop(){
 const [index,setIndex]=useState(0),[rotations,setRotations]=useState<number[]>(levels[0].tiles.map(()=>0));
 const [moves,setMoves]=useState(0),[completed,setCompleted]=useState<number[]>([]),[ready,setReady]=useState(false);
 const [phase,setPhase]=useState<Phase>('idle'),[lit,setLit]=useState<number[]>([]),[leaks,setLeaks]=useState<number[]>([]);
 const [inspect,setInspect]=useState(false);
 const [entries,setEntries]=useState<Record<number,number>>({});
 const [panel,setPanel]=useState<Panel>(null),[soundOn,setSoundOn]=useState(false),[ambient,setAmbient]=useState(true),[reduced,setReduced]=useState(true);
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]),running=useRef(false),sound=useRef<WorkshopSound|null>(null),dialog=useRef<HTMLDialogElement>(null),lastFocus=useRef<HTMLElement|null>(null);
 const level=levels[index],chapterIndex=Math.floor(index/5),chapter=CHAPTERS[chapterIndex];
 const masks=useMemo(()=>masksFor(level,rotations),[level,rotations]);
 const busy=phase==='charging'||phase==='running',powered=level.targets.filter(n=>lit.includes(n)).length,progress=powered/level.targets.length;
 const motion=ambient&&!reduced;
 const cancel=useCallback(()=>{timers.current.forEach(clearTimeout);timers.current=[];running.current=false;sound.current?.stop();},[]);
 useEffect(()=>{
  const audio=new WorkshopSound();sound.current=audio;
  try{const saved=restoreProgress(localStorage.getItem(KEY));setIndex(saved.level);setRotations(saved.rotations);setMoves(saved.moves);setCompleted(saved.completed);setSoundOn(saved.sound);setAmbient(saved.ambient);audio.enabled=saved.sound;}catch{/* Start fresh when browser storage is unavailable. */}
  const preference=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(preference.matches);update();preference.addEventListener('change',update);setReady(true);
  return()=>{cancel();audio.dispose();sound.current=null;preference.removeEventListener('change',update);};
 },[cancel]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify({completed,level:index,rotations:rotations.map(n=>n%4),moves,sound:soundOn,ambient}));}catch{/* The puzzle remains playable without storage. */}},[ready,completed,index,rotations,moves,soundOn,ambient]);
 useEffect(()=>{if(sound.current)sound.current.enabled=soundOn;},[soundOn]);
 useEffect(()=>{
  const el=dialog.current;if(!el)return;
  if(panel&&!el.open){lastFocus.current=document.activeElement as HTMLElement;el.showModal();}
  else if(!panel&&el.open){el.close();lastFocus.current?.focus();}
 },[panel]);
 useEffect(()=>{if(!ready)return;const next=CHAPTERS[Math.min(chapterIndex+1,3)];const img=new Image();img.src=ART+next.asset;},[chapterIndex,ready]);
 const load=useCallback((n:number)=>{cancel();setIndex(n);setRotations(levels[n].tiles.map(()=>0));setMoves(0);setLit([]);setLeaks([]);setPhase('idle');setInspect(false);setEntries({});setPanel(null);},[cancel]);
 const turn=useCallback((i:number)=>{
  if(!ready||running.current||phase==='win'||level.tiles[i].fixed)return;
  void sound.current?.unlock();sound.current?.turn();setRotations(old=>old.map((r,n)=>i===n?r+1:r));setMoves(m=>m+1);setLit([]);setLeaks([]);setPhase('idle');
 },[ready,phase,level]);
 function openPanel(value:Panel){if(busy){cancel();setPhase('idle');setLit([]);setLeaks([]);}setPanel(value);}
 function later(fn:()=>void,ms:number){timers.current.push(setTimeout(fn,ms));}
 function activate(){
  if(!ready||running.current||phase==='win')return;cancel();running.current=true;setPhase('charging');setInspect(false);setLit([]);setLeaks([]);void sound.current?.unlock();sound.current?.charge();
  const result=trace(level,masks);setEntries(result.entries);const lead=motion?600:100,step=motion?170:30;
  later(()=>setPhase('running'),lead);
  result.layers.forEach((layer,n)=>later(()=>{setLit(old=>[...old,...layer]);sound.current?.step(n);},lead+n*step));
  later(()=>{running.current=false;setLeaks(result.leaks);setPhase(result.success?'win':'fail');if(result.success){setCompleted(old=>old.includes(index)?old:[...old,index]);sound.current?.success();}else sound.current?.fail();},lead+result.layers.length*step+250);
 }
 function toggleSound(){const next=!soundOn;setSoundOn(next);if(sound.current){sound.current.enabled=next;if(next)void sound.current.unlock();else sound.current.stop();}}
 const guide=index===0&&moves===0&&!busy&&phase!=='win';
 const feedback=phase==='win'?(index===19&&completed.length===20?'Semua 20 level selesai.':'Semua modul terhubung. Mesin menyala.'):phase==='fail'?(leaks.length?'Jalur merah belum tersambung. Putar, lalu coba lagi.':'Ada modul yang belum mendapat energi. Coba lagi.'):phase==='charging'?'Menyiapkan energi…':phase==='running'?'Menguji sambungan…':guide?'Ketuk jalur tengah untuk memutar, lalu tekan Aktifkan.':`Sambungkan sumber ke ${level.targets.length===1?'modul mesin':`semua ${level.targets.length} modul`}. Jangan sisakan ujung terbuka.`;
 return <main className={`ws-world ws-chapter-${chapterIndex}${motion?' ws-motion':''} ws-phase-${phase}`} style={{'--ws-accent':chapter.accent} as CSSProperties}>
  <picture className="ws-backdrop" aria-hidden="true"><source media="(max-width:760px)" srcSet={ART+'workshop-mobile.webp'}/><img src={ART+'workshop.webp'} alt="" fetchPriority="high"/></picture>
  <div className="ws-scene-shade" aria-hidden="true"/><Atmosphere enabled={ready&&motion} energized={busy||phase==='win'}/>
  <header className="ws-topbar">
   <Link className="ws-return" href="/"><Icon name="back"/><span>Arcade</span></Link>
   <div className="ws-wordmark"><span>TEKAD</span><b>ELDRIC’S WORKSHOP</b></div>
   <nav className="ws-tools" aria-label="Pengaturan game"><button className="ws-icon-button ws-sound-button" onClick={toggleSound} aria-label={soundOn?'Matikan suara':'Nyalakan suara'} aria-pressed={soundOn}><Icon name={soundOn?'sound':'muted'}/></button><button className="ws-icon-button" onClick={()=>openPanel('settings')} aria-label="Pengaturan"><Icon name="settings"/></button><button className="ws-level-button" onClick={()=>openPanel('levels')}><Icon name="grid"/><span>Level <b>{index+1}</b><small>/20</small></span></button></nav>
  </header>
  <div className="ws-chapter-heading"><span className="ws-eyebrow">{chapter.label}</span><h1>{chapter.name}</h1><p>{chapter.description}</p></div>
  <div className="ws-stage">
   <aside className="ws-inventor" aria-label="Eldric"><div className="ws-character-wrap"><img src={ART+'eldric.webp'} alt="Eldric, penemu dengan mantel kuning dan kacamata mekanik" width="640" height="800"/><div className="ws-character-name"><strong>Eldric</strong></div></div><div className="ws-chapter-progress"><span><b>{completed.length.toString().padStart(2,'0')}</b> / 20 level</span><div className="ws-progress-segments" aria-label={`${completed.length} dari 20 level selesai`}>{levels.map((_,n)=><i key={n} className={`${completed.includes(n)?'done':''} ${n===index?'current':''}`}/>)}</div></div></aside>
   <section className="ws-console" aria-label="Papan jalur energi">
    <div className="ws-console-heading"><div><span className="ws-eyebrow">LEVEL {String(index+1).padStart(2,'0')}</span><h2>{level.name}</h2></div><div className="ws-turn-counter"><strong>{moves.toString().padStart(2,'0')}</strong><span>putaran</span></div></div>
    <div className="ws-board-wrap"><div className="ws-board-frame"><div className="ws-board-trim"><span>JALUR ENERGI</span><span>{level.size} × {level.size}</span></div>
     <div className={`ws-board${phase==='win'?' ws-board-success':''}`} style={{gridTemplateColumns:`repeat(${level.size},minmax(0,1fr))`}} key={index}>
      {level.tiles.map((_,i)=><CircuitTile key={`${index}-${i}`} level={level} index={i} rotation={rotations[i]||0} mask={masks[i]} lit={lit.includes(i)} leak={leaks.includes(i)} disabled={!ready||busy||phase==='win'} onTurn={turn} entry={entries[i]??-1} guide={guide&&i===4}/>)}
     </div>{phase==='win'&&!inspect&&<div className="ws-victory"><button className="ws-inspect-button" onClick={()=>setInspect(true)}>Lihat rangkaian <Icon name="close"/></button><img src={ART+chapter.asset.replace('.webp','-active.webp')} alt={chapter.machine+' menyala'} width="360" height="360"/><span className="ws-eyebrow">MESIN AKTIF</span><h3>{chapter.machine}</h3></div>}<div className="ws-board-legend"><span><i className="ws-legend-source"/>Sumber</span><span><i className="ws-legend-target"/>Modul {powered}/{level.targets.length}</span><span className="ws-board-rotate">↻ Ketuk & putar</span></div>
    </div></div>
    <div className={`ws-message ${phase==='win'?'ws-message-success':phase==='fail'?'ws-message-error':''}`} role="status" aria-live="polite"><span className="ws-mobile-portrait" aria-hidden="true"><img src={ART+'eldric.webp'} alt="" width="40" height="40"/></span><span className="ws-message-symbol">{phase==='win'?<Icon name="check"/>:phase==='fail'?'!':<Icon name="bolt"/>}</span><p>{feedback}</p></div>
    <div className="ws-controls"><button className="ws-secondary-button" onClick={()=>load(index)} aria-label="Ulangi level"><Icon name="reset"/><span>Ulangi</span></button>{phase==='win'?<button className="ws-activate ws-next" onClick={()=>index<19?load(index+1):openPanel('levels')}><Icon name="check"/><span>{index<19?'Level berikutnya':'Pilih level'}</span></button>:<button className={`ws-activate${busy?' is-testing':''}`} disabled={busy||!ready} onClick={activate}><Icon name="bolt"/><span>{busy?'Menguji…':'Aktifkan'}</span></button>}<button className="ws-icon-button ws-help-button" onClick={()=>openPanel('help')} aria-label="Cara bermain"><Icon name="help"/></button></div>
   </section>
   <aside className={`ws-machine-panel${phase==='win'?' ws-machine-awake':''}`} aria-label={`Prototipe ${chapter.machine}`}>
    <div className="ws-machine-heading"><span className="ws-eyebrow">MESIN {chapter.number}</span><h2>{chapter.machine}</h2><span className={`ws-machine-state${phase==='win'?' online':''}`}><i/>{phase==='win'?'SISTEM AKTIF':phase==='fail'?'SIRKUIT BELUM STABIL':busy?'MENERIMA ENERGI':'MENUNGGU DAYA'}</span></div>
    <div className="ws-machine-display"><div className="ws-machine-aura" style={{opacity:.15+progress*.6}} aria-hidden="true"/><img key={chapter.asset} className="ws-machine-art ws-machine-art-base" src={ART+chapter.asset} alt={chapter.machine} width="640" height="640"/><img key={chapter.asset+'-active'} className="ws-machine-art ws-machine-art-active" src={ART+chapter.asset.replace('.webp','-active.webp')} alt="" aria-hidden="true" width="640" height="640"/><div className="ws-machine-plinth" aria-hidden="true"><svg viewBox="0 0 300 90"><ellipse cx="150" cy="45" rx="138" ry="33"/><ellipse cx="150" cy="45" rx="113" ry="25"/><path d="M10 45H38M262 45H290M150 10V23M150 67V80"/></svg></div></div>
    <div className="ws-power-meter"><div><span>Modul terhubung</span><strong>{Math.round(progress*100)}<small>%</small></strong></div><div className="ws-meter-track"><i style={{transform:`scaleX(${progress})`}}/></div><div className="ws-module-status">{level.targets.map((n,i)=><span key={n} className={lit.includes(n)?'active':''}><i/>{String(i+1).padStart(2,'0')} <small>{lit.includes(n)?'TERHUBUNG':'OFFLINE'}</small></span>)}</div></div>
    <div className="ws-success-stamp" aria-hidden={phase!=='win'}><Icon name="check"/><span>LEVEL SELESAI</span></div>
   </aside>
  </div>
  <footer className="ws-footer"><span>Progres tersimpan di perangkat ini</span></footer>
  <dialog className={`ws-dialog ws-dialog-${panel||'closed'}`} ref={dialog} onCancel={()=>setPanel(null)} onClose={()=>{setPanel(null);lastFocus.current?.focus();}} onClick={e=>{if(e.target===e.currentTarget)setPanel(null);}} aria-labelledby="ws-dialog-title">
   <div className="ws-dialog-content"><header><div><span className="ws-eyebrow">ELDRIC’S WORKSHOP</span><h2 id="ws-dialog-title">{panel==='levels'?'Pilih level':panel==='settings'?'Pengaturan':'Cara bermain'}</h2></div><button className="ws-icon-button" onClick={()=>setPanel(null)} aria-label="Tutup"><Icon name="close"/></button></header>
    {panel==='levels'&&<><p className="ws-dialog-intro">{completed.length}/20 selesai · Pilih level untuk dimainkan.</p><div className="ws-chapter-list">{CHAPTERS.map((c,j)=><section className="ws-chapter-card" key={c.name}><div className="ws-chapter-art"><img src={ART+c.asset} alt="" width="160" height="160" loading="lazy"/></div><div className="ws-chapter-info"><span className="ws-eyebrow">LEVEL {j*5+1}–{j*5+5}</span><h3>{c.name}</h3><div className="ws-level-grid">{Array.from({length:5},(_,k)=>{const n=j*5+k;return <button key={n} onClick={()=>load(n)} className={`${n===index?'selected':''} ${completed.includes(n)?'completed':''}`} aria-label={`Level ${n+1}, ${levels[n].name}${completed.includes(n)?', selesai':''}`} aria-current={n===index?'step':undefined}><span>{String(n+1).padStart(2,'0')}</span>{completed.includes(n)&&<Icon name="check"/>}</button>;})}</div></div></section>)}</div></>}
    {panel==='settings'&&<div className="ws-setting-list"><button onClick={toggleSound} role="switch" aria-checked={soundOn}><span><strong>Efek suara</strong><small>Putaran mekanik, aliran, dan mesin aktif</small></span><i className={`ws-switch${soundOn?' on':''}`}/></button><button onClick={()=>setAmbient(a=>!a)} role="switch" aria-checked={ambient}><span><strong>Efek visual</strong><small>{reduced?'Mengikuti pengaturan gerakan perangkat':'Partikel, cahaya, dan gerakan mesin'}</small></span><i className={`ws-switch${ambient?' on':''}`}/></button><p>Progres tersimpan otomatis di perangkat ini.</p></div>}
    {panel==='help'&&<div className="ws-howto"><div><span>01</span><section><h3>Putar jalur</h3><p>Ketuk kepingan logam untuk memutar 90°. Sumber, modul mesin, dan panel tertutup tidak bisa diputar.</p></section></div><div><span>02</span><section><h3>Sambungkan modul</h3><p>Hubungkan sumber berwarna kuning ke semua modul bernomor. Jangan sisakan ujung jalur terbuka.</p></section></div><div><span>03</span><section><h3>Uji sambungan</h3><p>Tekan Aktifkan. Jalur biru sudah terhubung; jalur merah perlu diperbaiki.</p></section></div><button className="ws-activate" onClick={()=>setPanel(null)}>Kembali ke game</button></div>}
   </div>
  </dialog>
 </main>;
}
