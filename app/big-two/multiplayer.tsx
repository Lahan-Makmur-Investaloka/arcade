'use client';
import {useCallback,useEffect,useRef,useState,type CSSProperties} from 'react';
import BigTwo from './game';
import {ART,CAST} from './presentation';
import {CharacterArt} from './art';
import {SessionScoreboard} from './session-scoreboard';
import type {RoomView} from '../../lib/big-two/room';
import './multiplayer.css';
import {WildCardsBrand} from './wild-cards-brand';

const SAVE='tekad-big-two-room-v1';
const RECENTS='tekad-big-two-ended-rooms-v1';
type Credentials={token:string;code:string;requestId:string;name:string;character:number;operation:'create'|'join';joined:boolean;pendingRequest?:RequestBody};
type RequestBody=Record<string,unknown>;
type Reply={room?:RoomView;error?:string;left?:boolean;ok?:boolean};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
const persist=(c:Credentials|null)=>{try{if(c)localStorage.setItem(SAVE,JSON.stringify(c));else localStorage.removeItem(SAVE);return true;}catch{return false;}};
async function request(body:RequestBody):Promise<{status:number;data:Reply}>{
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch('/api/big-two',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});return {status:response.status,data:await response.json()};}finally{clearTimeout(timer);}
}
export default function Multiplayer({onBack}:{onBack:()=>void}){
 const [credentials,setCredentials]=useState<Credentials|null>(null),[savedRoom,setSavedRoom]=useState<Credentials|null>(null),[room,setRoom]=useState<RoomView|null>(null),[loaded,setLoaded]=useState(false);
 const [recentRooms,setRecentRooms]=useState<Credentials[]>([]);
 const [name,setName]=useState(''),[character,setCharacter]=useState(0),[code,setCode]=useState(''),[mode,setMode]=useState<'create'|'join'>('create');
 const [pending,setPending]=useState(false),[connected,setConnected]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[storage,setStorage]=useState(true),[invalid,setInvalid]=useState(false);
 const [retry,setRetry]=useState(false),[controls,setControls]=useState(false),[confirmation,setConfirmation]=useState<{type:string;extra?:RequestBody;text:string;revision:number;code:string}|null>(null);
 const roomRef=useRef<RoomView|null>(null),credentialRef=useRef<Credentials|null>(null),busy=useRef(false),uncertain=useRef<RequestBody|null>(null),mounted=useRef(true),dialog=useRef<HTMLDialogElement>(null),errorOrigin=useRef<'sync'|'action'|null>(null);
 const accept=useCallback((next:RoomView)=>{const old=roomRef.current;if(old&&old.code===next.code&&(next.revision<old.revision||(next.revision===old.revision&&next.serverTime<old.serverTime)))return;roomRef.current=next;setRoom(next);setConnected(true);setInvalid(false);},[]);
 const save=useCallback((next:Credentials|null)=>{
  if(credentialRef.current?.token!==next?.token){
   uncertain.current=null;setRetry(false);setInvalid(false);setConnected(false);
   roomRef.current=null;setRoom(null);errorOrigin.current=null;
  }
  credentialRef.current=next;setCredentials(next);setStorage(persist(next));
 },[]);
 useEffect(()=>{
  mounted.current=true;const invite=new URLSearchParams(location.search).get('room');try{const raw=JSON.parse(localStorage.getItem(SAVE)||'null');if(raw&&/^[a-f0-9]{64}$/.test(raw.token)&&typeof raw.code==='string'&&typeof raw.name==='string'&&['create','join'].includes(raw.operation)){if(invite&&raw.joined&&invite.toUpperCase()!==raw.code)setSavedRoom(raw);else{credentialRef.current=raw;setCredentials(raw);setCode(raw.code);}setName(raw.name);setCharacter(raw.character||0);}}
  catch{/* An unavailable device save does not prevent joining. */}
  const pendingRequest=credentialRef.current?.pendingRequest;
  if(pendingRequest&&pendingRequest.token===credentialRef.current?.token&&typeof pendingRequest.requestId==='string'){
   uncertain.current=pendingRequest;setRetry(true);setError('Ada aksi yang belum terkonfirmasi. Tekan Coba lagi untuk memeriksa hasilnya.');errorOrigin.current='action';
  }
  try{const list=JSON.parse(localStorage.getItem(RECENTS)||'[]');if(Array.isArray(list))setRecentRooms(list.filter(c=>c&&typeof c.token==='string'&&/^[a-f0-9]{64}$/.test(c.token)&&typeof c.code==='string'&&/^[A-Z2-9]{6}$/.test(c.code)).slice(0,20));}catch{/* Saved access pointers are optional. */}
  if(invite){setMode('join');setCode(invite.toUpperCase().replace(/[^A-Z2-9]/g,'').slice(0,6));}setLoaded(true);
  return()=>{mounted.current=false;};
 },[]);
 useEffect(()=>{if(room?.phase!=='ended'||!credentials)return;setRecentRooms(previous=>{const next=[credentials,...previous.filter(c=>c.code!==credentials.code)].slice(0,20);try{localStorage.setItem(RECENTS,JSON.stringify(next));}catch{setStorage(false);}return next;});},[room?.phase,room?.code,credentials?.token]);
 const handle=useCallback((response:{status:number;data:Reply},background=false)=>{
  if(!mounted.current)return;
  if(response.data.room)accept(response.data.room);
  if(response.status>=400){if(!background||!uncertain.current){setError(response.data.error||'Permintaan belum berhasil.');errorOrigin.current=background?'sync':'action';}if(!response.data.room&&[401,403,404,410].includes(response.status)){setInvalid(true);setConnected(false);}return false;}
  if(!background||errorOrigin.current==='sync'){setError('');errorOrigin.current=null;}return true;
 },[accept]);
 useEffect(()=>{
  if(!loaded||!credentials?.code||!credentials.joined||invalid)return;
  let stopped=false,timer:ReturnType<typeof setTimeout>|undefined,inFlight=false;
  const sync=async()=>{if(stopped||inFlight||document.hidden)return;inFlight=true;try{const response=await request({type:'sync',code:credentials.code,token:credentials.token});if(!stopped&&credentialRef.current?.token===credentials.token&&credentialRef.current?.code===credentials.code){if(response.status>=500||response.status===429)setConnected(false);handle(response,true);}}catch{if(!stopped)setConnected(false);}finally{inFlight=false;if(!stopped)timer=setTimeout(sync,1500);}};
  const wake=()=>{if(timer)clearTimeout(timer);setConnected(false);if(!document.hidden)void sync();};
  void sync();document.addEventListener('visibilitychange',wake);window.addEventListener('online',wake);window.addEventListener('pageshow',wake);
  const offline=()=>setConnected(false);window.addEventListener('offline',offline);
  return()=>{stopped=true;if(timer)clearTimeout(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('online',wake);window.removeEventListener('pageshow',wake);window.removeEventListener('offline',offline);};
 },[loaded,credentials?.code,credentials?.token,credentials?.joined,invalid,handle]);
 useEffect(()=>{const d=dialog.current;if(!d)return;if(confirmation&&!d.open)d.showModal();else if(!confirmation&&d.open)d.close();},[confirmation]);
 const perform=useCallback(async(body:RequestBody)=>{
  if(busy.current)return;busy.current=true;setPending(true);setError('');errorOrigin.current=null;
  // Persist the exact action before sending. Reloading after a lost response must
  // retry its original ID, never create a second play or lose a leave receipt.
  if(credentialRef.current)save({...credentialRef.current,pendingRequest:body});
  try{
   const response=await request(body);if(!mounted.current||credentialRef.current?.token!==body.token)return;
   // A 5xx can occur after a durable write. Keep the exact request ID until its outcome is known.
   if(response.status>=500)throw new Error('uncertain');
   uncertain.current=null;setRetry(false);
   save({...credentialRef.current!,pendingRequest:undefined});
   const ok=handle(response);
   if(ok&&response.data.room&&credentialRef.current){save({...credentialRef.current,code:response.data.room.code,joined:true});setCode(response.data.room.code);}
   if(ok&&response.data.left){save(null);roomRef.current=null;setRoom(null);setConnected(false);setNotice('Kamu sudah keluar dari room.');}
  }catch{if(mounted.current&&credentialRef.current?.token===body.token){uncertain.current=body;errorOrigin.current='action';setRetry(true);setConnected(false);setError('Konfirmasi belum diterima. Coba lagi untuk memeriksa aksi yang sama—kartu tidak akan dimainkan dua kali.');}}
  finally{busy.current=false;if(mounted.current)setPending(false);}
 },[handle,save]);
 const action=useCallback(async(type:string,extra:RequestBody={})=>{
  const c=credentialRef.current,r=roomRef.current;if(!c||!r||uncertain.current||!connected)return;
  await perform({type,...extra,code:c.code,token:c.token,revision:r.revision,requestId:crypto.randomUUID()});
 },[perform,connected]);
 const enter=async()=>{
  if(busy.current)return;const clean=name.trim();if(clean.length<2||clean.length>20){setError('Nama harus 2–20 karakter.');return;}
  if(mode==='join'&&!/^[A-Z2-9]{6}$/.test(code)){setError('Masukkan kode room 6 karakter.');return;}
  const old=credentialRef.current;const same=old&&!roomRef.current&&old.operation===mode&&old.name===clean&&old.character===character&&(mode==='create'||old.code===code);
  const c:Credentials=same?old:{token:token(),code:mode==='join'?code:'',requestId:crypto.randomUUID(),name:clean,character,operation:mode,joined:false};save(c);setSavedRoom(null);setInvalid(false);setNotice('');
  await perform({type:mode,token:c.token,code:c.code,requestId:c.requestId,name:clean,character});
 };
 const close=()=>{const c=credentialRef.current;if(c?.code)void fetch('/api/big-two',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'away',code:c.code,token:c.token}),keepalive:true}).catch(()=>{});onBack();};
 const forget=()=>{save(null);roomRef.current=null;setRoom(null);setInvalid(false);setError('');uncertain.current=null;setRetry(false);};
 const share=async()=>{if(!room)return;const url=`${location.origin}/big-two?room=${room.code}`;try{if(navigator.share)await navigator.share({title:'BIG 2: Wild Cards · TEKAD',text:`Masuk room ${room.code}`,url});else{await navigator.clipboard.writeText(url);setNotice('Tautan undangan disalin.');}}catch{setNotice(`Kode room: ${room.code}. Bagikan kode ini ke tiga temanmu.`);}};
 const playing=!!room?.game&&!invalid;
 const me=room?.players[room.you],host=!!room&&room.you===room.host;
 const staleHost=!!room&&room.serverTime-(room.players[room.host]?.lastSeen||0)>60000;
 const disconnected=!!room&&room.players.some((p,i)=>p&&i!==room.you&&room.serverTime-p.lastSeen>60000);
 const disabled=pending||retry||!connected;
 const alerts=<>{error&&<p className="b2-room-error" role="alert">{error}</p>}{notice&&<p className="b2-room-notice" role="status">{notice}</p>}{!storage&&<p className="b2-room-error">Penyimpanan perangkat tidak tersedia. Jangan tutup halaman ini jika ingin mempertahankan kursimu.</p>}{retry&&<button className="b2-room-small" disabled={pending} onClick={()=>uncertain.current&&void perform(uncertain.current)}>{pending?'Memeriksa…':'Coba lagi'}</button>}</>;
 return <div className={`b2-online-root ${playing?'b2-online-playing':''}`}>
  {playing?<>
   <div className="b2-room-strip"><span><b>{room.code}</b> · Ronde {room.round}</span><span role="status" className={connected?'':'b2-connection-lost'}>{connected?'Terhubung':'Menyambungkan…'}</span><button onClick={()=>setControls(v=>!v)} aria-expanded={controls}>Room</button></div>
   {(controls||error||retry||!storage)&&<section className="b2-room-drawer" aria-label="Pengaturan room">{alerts}{controls&&<><p>Room tetap berjalan saat menu dibuka. Kartu dan giliran disimpan di server.</p><div className="b2-room-inline"><button className="b2-room-small" onClick={share}>Undang teman</button><button className="b2-room-small" onClick={close}>Tutup meja</button>{!host&&staleHost&&<button className="b2-room-small" disabled={disabled} onClick={()=>void action('claim-host')}>Ambil alih host</button>}{host&&disconnected&&room.phase==='playing'&&<button className="b2-room-small" disabled={disabled} onClick={()=>setConfirmation({revision:room.revision,code:room.code,type:'cancel',text:'Batalkan ronde karena ada pemain yang terputus lebih dari satu menit? Skor ronde ini tidak dihitung.'})}>Batalkan ronde</button>}</div></>}</section>}
   <BigTwo online={{view:room,pending:pending||retry,connected,error,canClaimHost:!host&&staleHost,retry:retry&&!pending,onRetry:()=>{if(uncertain.current)void perform(uncertain.current);},onAction:action,onExit:close}}/>
  </>:<main className="b2-room-shell">
   <header className="b2-room-header"><button className="b2-room-small" onClick={close}>Kembali</button><a href="/" className="b2-room-brand"><img src="/branding/tekad-arcade-red.png" width="36" height="36" alt="TEKAD Arcade"/><WildCardsBrand compact/></a><span className="b2-room-edition">MULTIPLAYER</span></header>
   <section className="b2-room-content">
    <div className="b2-room-title"><span className="b2-eyebrow">BIG 2: Wild Cards / 4 PEMAIN</span><h1>{room?.phase==='ended'?'Sesi selesai.':room&&!invalid?'Meja bersama.':'Ajak temanmu.'}</h1><p>{room?.phase==='ended'?'Poin akhir dan kemenangan seluruh sesi.':room&&!invalid?'Pilih karakter, lalu tandai siap. Host membagikan kartu setelah semua siap.':'Buat room atau masuk dengan kode undangan. Setiap pemain memakai perangkat sendiri.'}</p></div>
    {alerts}{room?.message&&!invalid&&<p className="b2-room-notice" role="status">{room.message}</p>}
    {room?.phase==='ended'&&!invalid?<section className="b2-session-ended"><span className="b2-eyebrow">ROOM {room.code}</span><h2>Hasil akhir</h2>{room.session&&<SessionScoreboard summary={room.session}/>}<p>Rekap tersimpan di server. Membuat room baru tidak mengubah hasil sesi ini.</p><button className="b2-primary" onClick={forget}>Buat atau gabung sesi baru</button><button className="b2-text-button" onClick={close}>Kembali ke BIG 2: Wild Cards</button></section>:invalid?<section className="b2-room-form"><h2>Kursi tidak tersedia</h2><p>Room mungkin sudah berakhir, atau kursimu sudah dikeluarkan oleh host.</p><button className="b2-primary" onClick={forget}>Kembali ke pilihan room</button></section>:room?<>
     <div className="b2-room-code"><div><span>KODE ROOM</span><strong>{room.code}</strong></div><button className="b2-room-small" onClick={share}>Bagikan undangan</button><span role="status">{connected?'Terhubung':'Menyambungkan kembali…'}</span></div>
     <div className="b2-room-seats">{room.players.map((p,i)=><article key={i} className={`b2-room-seat ${p?'occupied':'empty'} ${p?.ready?'is-ready':''}`} style={{'--seat-color':p?CAST[p.character].color:'#555'} as CSSProperties}>
      {p?<><CharacterArt id={CAST[p.character].id} pose="play" portrait eager sizes="(max-width:700px) 48vw, 320px" alt={CAST[p.character].name}/><div className="b2-room-seat-top"><span>0{i+1}</span><span>{i===room.host?'HOST':i===room.you?'KAMU':'PEMAIN'}</span></div><div className="b2-room-seat-info"><small>{CAST[p.character].name}{i===room.you?' · Kamu':''}</small><h2>{p.name}</h2><span className="b2-room-ready">{!p.connected?'Terputus':p.ready?'SIAP':'Belum siap'}</span>{room.round>0&&<b className="b2-room-total">Total {p.total>0?'+':''}{p.total}</b>}</div>{host&&i!==room.you&&<button className="b2-room-remove" aria-label={`Keluarkan ${p.name}`} disabled={disabled} onClick={()=>setConfirmation({revision:room.revision,code:room.code,type:'kick',extra:{seat:i},text:`Keluarkan ${p.name} dari room?`})}>×</button>}</>:<><span className="b2-room-empty-number">0{i+1}</span><span>Menunggu pemain</span></>}
     </article>)}</div>
     <div className="b2-room-bottom"><div><span className="b2-room-label">KARAKTERMU</span><div className="b2-room-characters" role="group" aria-label="Pilih karakter">{CAST.map((c,i)=><button key={c.id} className={me?.character===i?'selected':''} aria-pressed={me?.character===i} disabled={disabled||room.players.some((p,s)=>s!==room.you&&p?.character===i)} onClick={()=>void action('character',{character:i})}>{c.name}</button>)}</div></div><div className="b2-room-lobby-actions"><button className={`b2-primary ${me?.ready?'b2-secondary':''}`} aria-pressed={me?.ready} disabled={disabled} onClick={()=>void action('ready',{ready:!me?.ready})}>{me?.ready?'Batal siap':'Saya siap'}</button>{host?<button className="b2-primary" disabled={disabled||room.players.some(p=>!p?.ready||!p.connected)} onClick={()=>void action('start')}>Bagikan kartu <span>♠</span></button>:<p>Host: {room.players[room.host]?.name}</p>}</div></div>
     {!!room.session?.completed&&<SessionScoreboard summary={room.session} title="Peringkat sementara"/>}
     <footer className="b2-room-footer"><span>Room aktif 24 jam · akhiri sesi untuk menyimpan rekap</span><div>{host&&<button className="b2-text-button" disabled={disabled} onClick={()=>setConfirmation({revision:room.revision,code:room.code,type:'end-session',text:'Akhiri sesi untuk seluruh meja? Total poin dan kemenangan akan disimpan sebagai hasil akhir.'})}>Akhiri sesi</button>}{!host&&staleHost&&<button className="b2-text-button" disabled={disabled} onClick={()=>void action('claim-host')}>Ambil alih host</button>}<button className="b2-text-button" disabled={disabled} onClick={()=>setConfirmation({revision:room.revision,code:room.code,type:'leave',text:'Keluar dari room dan kosongkan kursimu?'})}>Keluar dari room</button></div></footer>
    </>:<section className="b2-room-setup"><div className="b2-room-art"><img src={`${ART}cover.webp`} width="1536" height="1024" alt="Karakter TEKAD di meja kartu"/><div className="wc-room-cover"><WildCardsBrand/></div></div><form className="b2-room-form" onSubmit={e=>{e.preventDefault();void enter();}}>
     {savedRoom&&<div className="b2-room-resuming">Kursimu sebelumnya ada di {savedRoom.code}. Masuk ke room lain akan mengganti kursi yang tersimpan di perangkat ini.<button type="button" className="b2-text-button" onClick={()=>{save(savedRoom);setSavedRoom(null);}}>Lanjutkan room sebelumnya</button></div>}
     {credentials?.code&&credentials.joined&&<div className="b2-room-resuming" role="status">Menyambungkan ke {credentials.code}… <button type="button" className="b2-text-button" onClick={forget}>Pilih room lain</button></div>}
     <div className="b2-room-mode" role="group" aria-label="Pilihan room"><button type="button" aria-pressed={mode==='create'} onClick={()=>setMode('create')}>Buat room</button><button type="button" aria-pressed={mode==='join'} onClick={()=>setMode('join')}>Gabung room</button></div>
     <label>Nama pemain<input name="playerName" autoComplete="nickname" placeholder="Nama kamu" minLength={2} maxLength={20} value={name} onChange={e=>setName(e.target.value)} required disabled={pending||retry}/></label>
     {mode==='join'&&<label>Kode room<input name="roomCode" className="b2-code-input" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="6 KARAKTER" maxLength={6} minLength={6} value={code} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))} required disabled={pending||retry}/></label>}
     <fieldset><legend>Pilih karakter</legend><div className="b2-room-pick">{CAST.map((c,i)=><button type="button" key={c.id} aria-label={`Pilih ${c.name}`} aria-pressed={character===i} disabled={pending||retry} onClick={()=>setCharacter(i)}><img src={`${ART}${c.id}.webp`} width="768" height="1024" alt=""/><span>{c.name}</span></button>)}</div></fieldset>
     <button className="b2-primary" type="submit" disabled={!loaded||pending||retry}>{pending?'Menghubungkan…':mode==='create'?'Buat room':'Gabung room'}<span>4P</span></button><p className="b2-room-fine">Empat pemain manusia. Untuk bermain sendiri, pilih latihan bot di menu sebelumnya.</p>
    </form></section>}
    {!room&&!!recentRooms.length&&<section className="b2-session-history" aria-label="Riwayat sesi multiplayer"><h2>Riwayat sesi</h2>{recentRooms.map(c=><button key={c.code} onClick={()=>{setInvalid(false);setError('');setNotice('');save(c);setCode(c.code);}}><span>Room {c.code}<small>{c.name}</small></span><b>Buka rekap</b></button>)}</section>}
   </section>
  </main>}
  <dialog ref={dialog} className="b2-dialog b2-room-confirm" onCancel={()=>setConfirmation(null)} aria-label="Konfirmasi room"><div className="b2-dialog-body"><h2>Konfirmasi</h2><p>{confirmation?.text}</p><button className="b2-primary" disabled={disabled} onClick={()=>{if(confirmation){if(roomRef.current?.code!==confirmation.code||roomRef.current?.revision!==confirmation.revision){setError('Room sudah berubah. Periksa lagi sebelum mengonfirmasi.');errorOrigin.current='action';}else void action(confirmation.type,confirmation.extra);}setConfirmation(null);}}>Ya, lanjutkan</button><button className="b2-text-button" onClick={()=>setConfirmation(null)}>Batal</button></div></dialog>
 </div>;
}
