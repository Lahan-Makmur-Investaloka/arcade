"use client";

import {useEffect,useRef,useState,type PointerEvent} from "react";
import type {HarborPhase,HarborRuntime,HarborSnapshot} from "./runtime";
import type {HarborInput} from "./simulation";
import {DRIFT} from "./drift";
import "./harbor.css";

const empty:HarborSnapshot={speed:0,lap:1,elapsed:0,offroad:false,impact:false,progress:0,mapX:0,mapY:0,recoveries:0,recovering:false,contactSide:0,impactStrength:0,drifting:false,driftCharge:0,driftTier:0,boostRemaining:0,boostTier:0,turboCount:0};
const time=(s:number)=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,"0")}.${String(Math.floor(s%1*100)).padStart(2,"0")}`;

export default function HarborGame({onNeon}:{onNeon:()=>void}){
  const canvas=useRef<HTMLCanvasElement>(null),runtime=useRef<HarborRuntime|null>(null),phaseRef=useRef<HarborPhase>("ready");
  const [phase,setPhase]=useState<HarborPhase>("ready"),[hud,setHud]=useState(empty),[map,setMap]=useState("");
  const [loaded,setLoaded]=useState(false),[error,setError]=useState(""),[retry,setRetry]=useState(0),[low,setLow]=useState(false);
  useEffect(()=>{
    let cancelled=false;setLoaded(false);setError("");setHud(empty);setPhase("ready");phaseRef.current="ready";
    import("./runtime").then(({createHarborRuntime})=>{
      if(cancelled||!canvas.current)return;
      try{
        runtime.current=createHarborRuntime(canvas.current,{
          onPhase:value=>{if(!cancelled){phaseRef.current=value;setPhase(value);}},
          onSnapshot:value=>{if(!cancelled)setHud(value);},onMap:value=>{if(!cancelled)setMap(value);},
          onError:value=>{if(!cancelled)setError(value);},
          onReady:()=>{if(!cancelled)setLoaded(true);},
        });
      }catch{setError("Grafis 3D belum bisa dibuka di perangkat ini. Coba muat ulang atau mainkan Sirkuit Neon.");}
    }).catch(()=>{if(!cancelled)setError("Lintasan belum berhasil dimuat. Periksa koneksi lalu coba lagi.");});
    const suspend=()=>runtime.current?.pause();
    const visibility=()=>{if(document.hidden)suspend();};
    const keys:Record<string,keyof HarborInput>={ArrowLeft:"left",KeyA:"left",ArrowRight:"right",KeyD:"right",ArrowDown:"brake",KeyS:"brake",ArrowUp:"throttle",KeyW:"throttle",ShiftLeft:"drift",ShiftRight:"drift"};
    const down=(event:KeyboardEvent)=>{
      if(event.target instanceof Element&&event.target.closest("input,textarea,select,[contenteditable=true]"))return;
      if(keys[event.code]){event.preventDefault();runtime.current?.setInput(keys[event.code],true,`key:${event.code}`);}
      if(event.code==="KeyP"&&!event.repeat){if(phaseRef.current==="running")runtime.current?.pause();else runtime.current?.resume();}
    };
    const up=(event:KeyboardEvent)=>{if(keys[event.code])runtime.current?.setInput(keys[event.code],false,`key:${event.code}`);};
    window.addEventListener("blur",suspend);document.addEventListener("visibilitychange",visibility);window.addEventListener("keydown",down,{passive:false});window.addEventListener("keyup",up);
    return()=>{cancelled=true;runtime.current?.dispose();runtime.current=null;window.removeEventListener("blur",suspend);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
  },[retry]);
  const pointer=(key:keyof HarborInput,value:boolean,cancelled=false)=>(event:PointerEvent<HTMLButtonElement>)=>{
    event.preventDefault();if(value)event.currentTarget.setPointerCapture(event.pointerId);runtime.current?.setInput(key,value,`pointer:${event.pointerId}`,cancelled);
  };
  const control=(key:keyof HarborInput,label:string,content:string)=><button className={`harbor-control-${key}`} aria-label={label} aria-pressed={key==="drift"?hud.drifting:undefined} disabled={phase!=="running"||hud.recovering} onPointerDown={pointer(key,true)} onPointerUp={pointer(key,false)} onPointerCancel={pointer(key,false,true)} onLostPointerCapture={pointer(key,false,true)} onKeyDown={e=>{if(e.code==="Space"||e.code==="Enter"){e.preventDefault();runtime.current?.setInput(key,true,`button:${key}:${e.code}`);}}} onKeyUp={e=>{if(e.code==="Space"||e.code==="Enter")runtime.current?.setInput(key,false,`button:${key}:${e.code}`);}} onBlur={()=>{for(const code of ["Space","Enter"])runtime.current?.setInput(key,false,`button:${key}:${code}`,true);}}>{content}</button>;
  const turboFill=Math.max(0,Math.min(1,hud.boostRemaining>0?hud.boostRemaining/(hud.boostTier===2?DRIFT.secondBoost:DRIFT.firstBoost):hud.driftCharge));
  return <section className="harbor-game" aria-label="Latihan balap Pelabuhan">
    <div className="harbor-coursebar"><div><span>LATIHAN</span><strong>Pelabuhan</strong></div><button className="harbor-neon" onClick={onNeon}>Sirkuit Neon</button></div>
    <div className={`harbor-viewport phase-${phase}`}>
      <canvas key={retry} ref={canvas} aria-label="Lintasan 3D Pelabuhan, dikendalikan dengan tombol arah atau kontrol sentuh" />
      {loaded&&!error&&phase!=="ready"&&<>
        <div className="harbor-lap"><span>LAP</span><strong>{hud.lap}<small> / 3</small></strong></div>
        <div className="harbor-time"><span>WAKTU</span><strong>{time(hud.elapsed)}</strong></div>
        <button className="harbor-pause" onClick={()=>runtime.current?.pause()} disabled={phase!=="running"} aria-label="Jeda balapan">Ⅱ</button>
        <div className="harbor-speed"><strong>{hud.speed}</strong><span>KM/JAM</span></div>
        {(hud.drifting||hud.boostRemaining>0)&&<div className="harbor-drift-meter" data-tier={hud.boostRemaining>0?hud.boostTier:hud.driftTier} data-boost={hud.boostRemaining>0}>
          <div><strong>{hud.boostRemaining>0?"MINI-TURBO":hud.driftTier===2?"TURBO II SIAP":hud.driftTier===1?"TURBO I SIAP":"DRIFT"}</strong><span>{hud.boostRemaining>0?`${hud.boostRemaining.toFixed(1)} dtk`:hud.driftTier>0?"Lepas untuk turbo":"Tahan sambil belok"}</span></div>
          <div className="harbor-drift-track" role="progressbar" aria-label={hud.boostRemaining>0?"Sisa mini-turbo":"Isi mini-turbo"} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(100*turboFill)}><i style={{transform:`scaleX(${turboFill})`}}/><b style={{left:`${DRIFT.firstCharge/DRIFT.secondCharge*100}%`}}/></div>
        </div>}
        <div className="harbor-map" aria-label="Posisi di lintasan"><svg viewBox="0 0 120 120" role="img" aria-label="Peta lintasan Pelabuhan"><path d={map} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="9"/><path d={map} fill="none" stroke="#fff" strokeWidth="3"/><circle cx={hud.mapX} cy={hud.mapY} r="5" fill="#ffcc54" stroke="#15273c" strokeWidth="2"/></svg></div>
        {phase==="running"&&(hud.recovering||hud.impact||hud.offroad)&&<div className="harbor-feedback" data-side={hud.contactSide} role={hud.recovering?"status":undefined}>{hud.recovering?"Kembali ke jalur…":hud.impact?(hud.contactSide<0?"Pembatas kiri":"Pembatas kanan"):"Kembali ke aspal"}</div>}
      </>}
      {(!loaded||error||phase==="ready")&&<div className="harbor-overlay harbor-ready">
        <div className="harbor-intro"><span className="harbor-kicker">TEKAD RACING · ANIME 2.5D</span><h2>Pelabuhan</h2><p>Timmy · 3 lap · Latihan solo</p>
          {error?<><p role="alert">{error}</p><button className="harbor-primary" onClick={()=>{setLow(false);setRetry(n=>n+1);}}>Coba lagi</button><button className="harbor-secondary" onClick={onNeon}>Mainkan Sirkuit Neon</button></>:<><button className="harbor-primary" disabled={!loaded} onClick={()=>runtime.current?.start()}>{loaded?"Mulai latihan":"Menyiapkan lintasan…"}</button><p className="harbor-hint">Tahan Drift sambil belok. Lepas saat bar biru atau emas untuk turbo.</p></>}
        </div>
      </div>}
      {loaded&&!error&&phase==="paused"&&<div className="harbor-overlay"><div className="harbor-dialog"><span className="harbor-kicker">PELABUHAN</span><h2>Jeda</h2><p>Lap {hud.lap} · {time(hud.elapsed)}</p><button className="harbor-primary" onClick={()=>runtime.current?.resume()}>Lanjut latihan</button><button className="harbor-secondary" onClick={()=>runtime.current?.start()}>Ulang dari awal</button><button className="harbor-secondary" onClick={()=>{runtime.current?.resume();runtime.current?.recover();}}>Pulihkan posisi</button><label className="harbor-quality"><input type="checkbox" checked={low} onChange={e=>{setLow(e.target.checked);runtime.current?.setQuality(e.target.checked);}}/>Grafis ringan</label><button className="harbor-secondary" onClick={onNeon}>Sirkuit Neon</button><a className="harbor-exit" href="/">Semua game</a></div></div>}
      {loaded&&!error&&phase==="finished"&&<div className="harbor-overlay"><div className="harbor-dialog"><span className="harbor-kicker">3 LAP SELESAI</span><h2>{time(hud.elapsed)}</h2><p>Timmy · Pelabuhan · {hud.turboCount} mini-turbo{hud.recoveries?` · ${hud.recoveries} kali kembali ke jalur`:""}</p><button className="harbor-primary" onClick={()=>runtime.current?.start()}>Latihan lagi</button><button className="harbor-secondary" onClick={onNeon}>Balapan di Sirkuit Neon</button></div></div>}
    </div>
    <div className="harbor-controls" aria-label="Kontrol latihan"><div className="harbor-steering">{control("left","Belok kiri","←")}{control("right","Belok kanan","→")}</div><p>A / D belok · Shift drift<br/>W gas · S rem · P jeda</p><div className="harbor-pedals">{control("brake","Rem","REM")}{control("drift","Tahan drift, lepas untuk mini-turbo","DRIFT")}{control("throttle","Gas ekstra","GAS")}</div></div>
    <div className="harbor-footer"><span>Gas otomatis · Timmy</span><button disabled={phase!=="running"||hud.recovering} onClick={()=>runtime.current?.recover()}>Kembali ke jalur</button></div>
  </section>;
}
