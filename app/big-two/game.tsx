'use client';
import Link from 'next/link';
import {useCallback,useEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {act,cardName,chooseBotMove,classify,createGame,explainMove,LABELS,legalPlays,restoreGame,scores,sortCards,type Card as CardId,type Game} from './engine';
import {Card} from './card';
import {CutIn} from './cutin';
import {CommandIcon} from './command-icon';
import {ART,CAST,RULES,seatCast} from './presentation';
import {CardSound} from './sound';
import {useTableMotion} from './use-table-motion';
import {MOTION} from './motion-policy';
import {boardView,type OnlineGame} from './online-types';
import {CharacterArt as Portrait,ART_ROOT} from './art';
import {usePracticeRecords} from './use-practice-records';
import {SessionScoreboard,practiceSummary,signed} from './session-scoreboard';
import type {PracticeRecord,SessionSummary} from './session-types';
import './style.css';
import './art.css';
import './deck.css';
import './table.css';
import './polish.css';
import './motion.css';
import './session.css';
import './lobby-rebel.css';
import {WildCardsBrand} from './wild-cards-brand';
import {RoundScoreboard} from './round-scoreboard';
import {RoundEntrance} from './round-entrance';

const SAVE='tekad-big-two-match-v1',PREF='tekad-big-two-preferences-v2';
type Panel='rules'|'settings'|'leave'|'history'|'session'|'end-session'|'records'|null;
type Session={game:Game;player:number;seriesId?:string;round?:number};
function Icon({name}:{name:'sound'|'mute'|'close'|'help'|'back'|'settings'|'history'}){
 const paths={sound:'M11 5L6 9H3v6h3l5 4V5ZM15 8a6 6 0 010 8M18 5a10 10 0 010 14',mute:'M11 5L6 9H3v6h3l5 4V5ZM16 9l5 6M21 9l-5 6',close:'M6 6l12 12M6 18L18 6',help:'M9 8a3 3 0 116 0c0 2-3 2-3 5M12 17v1',back:'M15 5l-7 7 7 7',settings:'M12 8a4 4 0 100 8 4 4 0 000-8ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',history:'M4 10a8 8 0 111 8M4 4v6h6M12 7v5l3 2'};
 return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}

export default function BigTwo({online,onMultiplayer}:{online?:OnlineGame;onMultiplayer?:()=>void}={}){
 const [session,setSession]=useState<Session|null>(null),[resume,setResume]=useState<Session|null>(null),[character,setCharacter]=useState(0),[ready,setReady]=useState(false);
 const [selected,setSelected]=useState<CardId[]>([]),[sortSuit,setSortSuit]=useState(false),[panel,setPanel]=useState<Panel>(null),[notice,setNotice]=useState('');
 const [soundOn,setSoundOn]=useState(true),[effects,setEffects]=useState(true),[reduced,setReduced]=useState(true),[visible,setVisible]=useState(true),[dealing,setDealing]=useState(false);
 const [cutin,setCutin]=useState<{seat:number;label:string;id:number}|null>(null),[hintIndex,setHintIndex]=useState(0),[resultShown,setResultShown]=useState(false);
 const [storageWarning,setStorageWarning]=useState(false);
 const [lobbyMode,setLobbyMode]=useState<'classic'|'portrait'>('classic'),[lobbyPlayers,setLobbyPlayers]=useState<'single'|'multi'>('single');
 const records=usePracticeRecords(!online),[recap,setRecap]=useState<PracticeRecord|null>(null),[scoreRetry,setScoreRetry]=useState(0);
 const recordAttempt=useRef(''),legacyAttempt=useRef(false),startId=useRef(''),beginning=useRef(false);
 const [musicOn,setMusicOn]=useState(true),[effectsVolume,setEffectsVolume]=useState(.65),[musicVolume,setMusicVolume]=useState(.28);
 const audio=useRef<CardSound|null>(null),dialog=useRef<HTMLDialogElement>(null),resultDialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null),locked=useRef(false),sessionRef=useRef<Session|null>(null);
 const networkGame=useMemo(()=>online?boardView(online.view):undefined,[online?.view.revision,online?.view.round,online?.view.code]);
 const game=online?networkGame:session?.game;
 const record=session?.seriesId?(records.book?.active?.id===session.seriesId?records.book.active:records.book?.history.find(r=>r.id===session.seriesId)):undefined;
 const sessionSummary:SessionSummary|undefined=online?online.view.session:record?practiceSummary(record):records.book?.active?practiceSummary(records.book.active):undefined;
 const recordedRound=record?.rounds.find(r=>r.round===session?.round);
 const scoreSaved=!!online||!!recordedRound&&!!game&&game.winner!==null&&recordedRound.winner===game.winner&&JSON.stringify(recordedRound.points)===JSON.stringify(scores(game))&&JSON.stringify(recordedRound.counts)===JSON.stringify(game.hands.map(h=>h.length));
 const scoreConflict=!!recordedRound&&!scoreSaved;
 const cast=useMemo(()=>online?Array.from({length:4},(_,i)=>{const p=online.view.players[(online.view.you+i)%4]!;return {...CAST[p.character],name:p.name};}):seatCast(session?.player??character),[online?.view.revision,online?.view.code,session?.player,character]);
 const motion=effects&&!reduced;
 const active=!!game&&!dealing&&game.winner===null&&!panel&&visible&&(!online||(online.connected&&!online.pending));
 const isMyTurn=active&&game?.turn===0;
 const hand=useMemo(()=>game?sortCards(game.hands[0],sortSuit):[],[game,sortSuit]);
 const moves=useMemo(()=>game&&game.turn===0&&game.winner===null?legalPlays(game.hands[0],game.table,game.opening):[],[game]);
 const combo=useMemo(()=>classify(selected),[selected]);
 const reason=game?explainMove(game,0,selected):null;
 const latest=game?.history.at(-1),latestPlay=game?.history.findLast(m=>m.cards.length>0);
 const cutinCast=game?cast.map(c=>c.id).join(','):'';
 const finishingCast=game?cast.filter((_,i)=>game.hands[i].length<=5).map(c=>c.id).join(','):'';
 const stage=useTableMotion({game,round:online?`${online.view.code}:${online.view.round}`:`practice:${session?.seriesId??'legacy'}:${session?.round??1}`,enabled:motion,visible,paused:!!panel||!!online&&!online.connected,dealing,handKey:hand.join(','),onStart:()=>setCutin(null),onDeal:()=>audio.current?.play('deal'),onLand:(move,won,ownTurn)=>{
  audio.current?.play(won?'win':move.kind==='pass'?'pass':move.cards.length===5?'combo':'play');
  if(ownTurn&&!won&&move.cards.length!==5)audio.current?.play('turn');
  if(motion&&(won||move.cards.length===5))setCutin({seat:move.seat,label:won?'HABIS!':LABELS[move.kind as keyof typeof LABELS],id:move.id});
 }});

 useEffect(()=>{
  if(!cutinCast||!motion)return;
  const images=cutinCast.split(',').map(id=>{const img=document.createElement('img');img.decoding='async';img.srcset=`${ART_ROOT}${id}-cutin-480.webp 480w, ${ART_ROOT}${id}-cutin.webp 960w`;img.sizes='(max-width:700px) 70vw, 480px';img.src=`${ART_ROOT}${id}-cutin.webp`;return img;});
  return()=>{images.forEach(img=>{img.onload=null;img.onerror=null;});};
 },[cutinCast,motion]);

 useEffect(()=>{
  // Warm only likely winners, after the hand has progressed. No hidden hand data is needed.
  if(!finishingCast)return;
  const images=finishingCast.split(',').map(id=>{const img=document.createElement('img');img.decoding='async';img.src=`${ART_ROOT}${id}-win.webp`;return img;});
  return()=>{images.forEach(img=>{img.onload=null;img.onerror=null;});};
 },[finishingCast]);

 useEffect(()=>{
  const playerAudio=new CardSound();audio.current=playerAudio;
  try{const current=localStorage.getItem(PREF);const p=current?JSON.parse(current):{...JSON.parse(localStorage.getItem('tekad-big-two-preferences-v1')||'{}'),sound:true,music:true};setSoundOn(p.sound!==false);playerAudio.enabled=p.sound!==false;setEffects(p.effects!==false);setMusicOn(p.music!==false);if(Number.isFinite(p.effectsVolume))setEffectsVolume(Math.max(0,Math.min(1,p.effectsVolume)));if(Number.isFinite(p.musicVolume))setMusicVolume(Math.max(0,Math.min(1,p.musicVolume)));if(Number.isInteger(p.character)&&p.character>=0&&p.character<5)setCharacter(p.character);
   const raw=JSON.parse(localStorage.getItem(SAVE)||'null');if(raw&&Number.isInteger(raw.player)&&raw.player>=0&&raw.player<5){const restored=restoreGame(raw.game);if(restored)setResume({game:restored,player:raw.player,...(typeof raw.seriesId==='string'&&Number.isInteger(raw.round)&&raw.round>0?{seriesId:raw.seriesId,round:raw.round}:{})});}
  }catch{/* Invalid or unavailable local saves never block the game. */}
  const pref=matchMedia('(prefers-reduced-motion: reduce)');const update=()=>setReduced(pref.matches);update();pref.addEventListener('change',update);
  const visibility=()=>setVisible(!document.hidden);visibility();document.addEventListener('visibilitychange',visibility);setReady(true);
  return()=>{playerAudio.dispose();pref.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 useEffect(()=>{if(!online&&!session&&records.book?.active)setCharacter(records.book.active.player);},[records.book?.active?.id,!!session,online]);
 useEffect(()=>{
  if(online||!session||session.seriesId||!records.book||records.busy||legacyAttempt.current)return;
  legacyAttempt.current=true;
  void(async()=>{const active=records.book!.active;const book=active?records.book:await records.request({type:'start',id:crypto.randomUUID(),player:session.player});const series=book?.active;if(series&&series.player===session.player)setSession(current=>current&&!current.seriesId?{...current,seriesId:series.id,round:series.rounds.length+1}:current);})();
 },[online,session,records.book,records.busy,scoreRetry]);
 useEffect(()=>{
  if(online||!session?.seriesId||!game||game.winner===null||scoreSaved||scoreConflict||records.busy)return;
  const key=`${session.seriesId}:${session.round}:${scoreRetry}`;if(recordAttempt.current===key)return;recordAttempt.current=key;
  void records.request({type:'record',id:session.seriesId,round:session.round,game});
 },[online,session,game,scoreSaved,scoreConflict,records.busy,scoreRetry]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(PREF,JSON.stringify({sound:soundOn,effects,character,music:musicOn,effectsVolume,musicVolume}));}catch{/* Preferences are optional. */}if(audio.current)audio.current.enabled=soundOn;},[ready,soundOn,effects,character,musicOn,effectsVolume,musicVolume]);
 useEffect(()=>{audio.current?.configure({music:musicOn,effectsVolume,musicVolume,active:!!game&&!panel&&!resultShown&&game.winner===null,visible});},[musicOn,effectsVolume,musicVolume,game?.winner,!!game,panel,resultShown,visible,soundOn]);
 useEffect(()=>{if(!motion||!visible||panel)setCutin(null);},[motion,visible,panel]);
 useEffect(()=>{sessionRef.current=session;locked.current=false;beginning.current=false;setSelected([]);setHintIndex(0);setNotice('');if(!session)return;try{localStorage.setItem(SAVE,JSON.stringify(session));setStorageWarning(false);}catch{setStorageWarning(true);}},[session]);
 useEffect(()=>{if(online){setSelected([]);setHintIndex(0);setNotice('');locked.current=false;}},[online?.view.game?.sequence,online?.view.round]);
 useEffect(()=>{if(online&&online.view.game){if(online.view.game.sequence===0)setDealing(true);}},[online?.view.round]);
 useEffect(()=>{if(online&&dealing&&(online.view.game?.sequence??0)>0)setDealing(false);},[online?.view.game?.sequence,dealing]);
 useEffect(()=>{if(!dealing)return;const t=setTimeout(()=>setDealing(false),motion?MOTION.deal:200);return()=>clearTimeout(t);},[dealing,motion]);
 useEffect(()=>{
  const d=dialog.current;if(!d)return;
  if(panel&&!d.open){previousFocus.current=document.activeElement as HTMLElement;d.showModal();}
  else if(!panel&&d.open){d.close();previousFocus.current?.focus();}
 },[panel]);
 useEffect(()=>{
  if(online||!active||!game||game.turn===0)return;
  const expected=game.sequence;const timer=setTimeout(()=>{
   setSession(current=>{if(!current||current.game.sequence!==expected||current.game.turn===0||current.game.winner!==null)return current;
    const g=current.game,seat=g.turn;const cards=chooseBotMove(g.hands[seat],g.table,g.opening,g.hands.filter((_,i)=>i!==seat).map(h=>h.length));return {...current,game:act(g,seat,cards)};
   });
  },motion?(game.history.at(-1)?.cards.length===5?2050:1150):750);return()=>clearTimeout(timer);
 },[active,game,motion,online]);
 useEffect(()=>{if(!cutin)return;const timer=setTimeout(()=>setCutin(null),motion?MOTION.cutin:0);return()=>clearTimeout(timer);},[cutin,motion]);
 useEffect(()=>{if(game?.winner===null||game?.winner===undefined){setResultShown(false);return;}const t=setTimeout(()=>setResultShown(true),motion?MOTION.result:250);return()=>clearTimeout(t);},[game?.winner,motion]);
 useEffect(()=>{const d=resultDialog.current;if(resultShown&&d&&!d.open)d.showModal();},[resultShown]);
 const begin=async()=>{
  if(online){void online.onAction('lobby');return;}if(records.busy||!records.book||beginning.current)return;beginning.current=true;
  audio.current?.unlock();startId.current||=crypto.randomUUID();
  const fresh=await records.request({type:'sync'});if(!fresh){beginning.current=false;return;}
  if((fresh.active?.rounds.length??0)>=200){beginning.current=false;return;}
  const book=fresh.active?fresh:await records.request({type:'start',id:startId.current,player:character});const series=book?.active;if(!series){beginning.current=false;return;}
  locked.current=false;setCutin(null);setResultShown(false);setSession({game:createGame(),player:series.player,seriesId:series.id,round:series.rounds.length+1});setResume(null);setDealing(true);setPanel(null);startId.current='';
 };
 const continueGame=()=>{if(!resume)return;setCharacter(resume.player);setSession(resume);setResume(null);audio.current?.unlock();};
 const finishSession=async()=>{
  if(online){await online.onAction('end-session');setPanel(null);return;}
  const pending=session??resume,id=pending?.seriesId??records.book?.active?.id;if(!id)return;
  if(pending?.seriesId===id&&pending.game.winner!==null){const saved=await records.request({type:'record',id,round:pending.round,game:pending.game});if(!saved)return;}
  const book=await records.request({type:'end',id});if(!book)return;
  const ended=book.history.find(r=>r.id===id);setRecap(ended??null);setSession(null);setResume(null);setResultShown(false);setPanel('session');try{const saved=JSON.parse(localStorage.getItem(SAVE)||'null');if(!saved?.seriesId||saved.seriesId===id)localStorage.removeItem(SAVE);}catch{setStorageWarning(true);}
 };
 const play=useCallback((pass=false)=>{
  const current=sessionRef.current;if((!current&&!online)||locked.current||!isMyTurn)return;
  const cards=pass?[]:selected;if(!pass&&!cards.length){setNotice('Pilih kartu yang ingin dimainkan.');return;}
  const error=explainMove(game!,0,cards);if(error){setNotice(error);return;}
  stage.capture();locked.current=true;audio.current?.unlock();if(online){void online.onAction('play',{cards}).finally(()=>{locked.current=false;});return;}setSession({...current!,game:act(current!.game,0,cards)});
 },[selected,isMyTurn,game,online]);
 const toggle=(card:CardId)=>{if(!isMyTurn)return;if(selected.length===5&&!selected.includes(card)){setNotice('Maksimal 5 kartu. Batalkan salah satu pilihan dulu.');return;}audio.current?.unlock();audio.current?.play('select');setNotice('');setSelected(s=>s.includes(card)?s.filter(c=>c!==card):s.length<5?[...s,card]:s);};
 const suggest=()=>{if(!isMyTurn)return;if(!moves.length){setNotice('Tidak ada kombinasi yang bisa membalas. Pilih Pass.');return;}setSelected(moves[hintIndex%moves.length].cards);setHintIndex(n=>n+1);setNotice('');audio.current?.unlock();audio.current?.play('select');};
 const leave=()=>{if(online){online.onExit();return;}setResume(session);setSession(null);setPanel(null);setCutin(null);setSelected([]);};
 const toggleSound=()=>{const next=!soundOn;setSoundOn(next);if(audio.current){audio.current.enabled=next;audio.current.unlock();audio.current.play('select');}};

 return <main ref={stage.root} className={`b2-root ${game?'b2-playing':'b2-home'} ${motion?'b2-motion':'b2-still'}`}>
  {dealing&&<RoundEntrance enabled={motion} character={cast[0].name} round={online?.view.round??session?.round}/>}
  <div className="b2-scene" aria-hidden="true"/><div className="b2-screenprint" aria-hidden="true"/>
  <header className="b2-header"><div className="b2-header-left">{game?<button className="b2-icon" onClick={()=>setPanel('leave')} aria-label="Kembali ke lobi"><Icon name="back"/></button>:<Link className="b2-icon" href="/" aria-label="Kembali ke Arcade"><Icon name="back"/></Link>}<Link href="/" className="b2-brand"><img src="/branding/tekad-arcade-red.png" alt="" width="34" height="34"/><span>TEKAD <b>ARCADE</b></span></Link></div><div className="b2-header-tools"><button className="b2-icon" onClick={()=>setPanel('rules')} aria-label="Informasi permainan"><span aria-hidden="true">ⓘ</span></button><button className="b2-icon" onClick={toggleSound} aria-label={soundOn?'Matikan suara':'Aktifkan suara'} aria-pressed={soundOn}><Icon name={soundOn?'sound':'mute'}/></button><button className="b2-icon" onClick={()=>setPanel('settings')} aria-label="Pengaturan"><Icon name="settings"/></button></div></header>
  {!game?<section className="b2-lobby">
   <div className="b2-splash b2-character-stage" style={{'--cast':CAST[character].color} as CSSProperties}><img className="b2-cover-layer" src={`${ART}cover.webp`} alt="Timmy, Eldric, Kirana, Adelia, dan Dylan siap bermain kartu" width="1536" height="1024" fetchPriority="low"/><Portrait id={CAST[character].id} pose={CAST[character].id==='adelia'?'lobby':'play'} className="b2-selected-art" portrait eager priority/><div className="b2-splash-label"><span>{CAST[character].name.toUpperCase()}</span><WildCardsBrand/></div><span className="b2-edition">TEKAD / CARD CLUB</span></div>
   <div className="b2-lobby-controls"><div className="b2-lobby-heading"><span className="b2-eyebrow">BIG 2: Wild Cards</span><h1>Your move.</h1></div>
    <div className="b2-mode-heading"><span>01 / MODE</span></div><div className="b2-mode-options" role="group" aria-label="Mode permainan"><button aria-pressed={lobbyMode==='classic'} onClick={()=>{setLobbyMode('classic');setCharacter(resume?.player??records.book?.active?.player??character);}}><b>Classic</b></button><button aria-pressed={lobbyMode==='portrait'} onClick={()=>setLobbyMode('portrait')}><b>Skill Mode</b></button></div><div className="b2-mode-heading"><span>02 / PLAYERS</span></div><div className="b2-mode-options" role="group" aria-label="Jumlah pemain"><button aria-pressed={lobbyPlayers==='single'} onClick={()=>setLobbyPlayers('single')}><b>Single Player</b></button><button aria-pressed={lobbyPlayers==='multi'} onClick={()=>setLobbyPlayers('multi')}><b>Multiplayer</b></button></div><div className="b2-mode-heading"><span>03 / YOUR CHARACTER</span></div><div className="b2-cast-picker" role="group" aria-label="Pilih karakter">{CAST.map((c,i)=><button key={c.id} className={`b2-cast-choice ${character===i?'chosen':''}`} style={{'--cast':c.color} as CSSProperties} onClick={()=>setCharacter(i)} aria-pressed={character===i} aria-label={`Pilih ${c.name}`} disabled={lobbyPlayers==='multi'||(lobbyMode==='classic'&&!!records.book?.active&&records.book.active.player!==i)}><Portrait id={c.id}/><span>{c.name}</span></button>)}</div>
    <button className="b2-primary b2-start-game" disabled={lobbyMode==='portrait'&&lobbyPlayers==='multi'||!ready||lobbyPlayers==='single'&&lobbyMode==='classic'&&(records.busy||!records.book||(records.book.active?.rounds.length??0)>=200)||lobbyPlayers==='multi'&&!onMultiplayer} onClick={()=>{if(lobbyPlayers==='multi'){onMultiplayer?.();return;}if(lobbyMode==='portrait'){window.location.assign(`/big-two/portrait?character=${CAST[character].id}&start=1`);return;}if(resume)continueGame();else void begin();}}>Start Game <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 19L19 5M5 5h14v14"/></svg></button>
    {lobbyMode==='classic'&&lobbyPlayers==='single'&&<>

    {records.error&&<div className="b2-session-error" role="alert">Rekap belum tersambung. {records.error}<button disabled={records.busy} onClick={()=>void records.request({type:'sync'})}>Coba sambungkan</button></div>}
    {records.deviceWarning&&<p className="b2-session-status">Rekap disimpan di server, tetapi akses perangkat tidak dapat disimpan. Jangan tutup halaman ini.</p>}
    <div className="b2-session-buttons">{records.book?.active&&<><button onClick={()=>{setRecap(records.book!.active);setPanel('session');}}>Rekap sesi</button><button onClick={()=>setPanel('end-session')}>Akhiri sesi</button></>}<button onClick={()=>setPanel('records')}>Riwayat sesi</button></div>
    </>}

   </div>
  </section>:<>
   <section className="b2-game" aria-label="Meja BIG 2: Wild Cards">
    <div className="b2-match-bar"><div><WildCardsBrand compact/><b>RONDE {online?.view.round??session?.round??1} · PUTARAN {game.trick}</b></div><div className="b2-match-tools"><button className="b2-session-open" onClick={()=>{setRecap(null);setPanel('session');}}>Poin sesi</button><button className="b2-history-button" onClick={()=>setPanel('history')}><Icon name="history"/><span>Riwayat</span></button></div></div>
    <div className="b2-opponents">{[1,2,3].map(seat=>{const c=cast[seat],last=game.history.findLast(m=>m.seat===seat),turn=game.turn===seat&&game.winner===null;return <div key={seat} className={`b2-opponent b2-seat-${seat} ${turn?'is-turn':''} ${game.hands[seat].length<=2?'is-danger':''}`} style={{'--cast':c.color} as CSSProperties}><div className="b2-opponent-image"><Portrait id={c.id} pose={game.winner===seat?'win':'play'} eager/><span className="b2-seat-number">0{seat+1}</span></div><div className="b2-opponent-info"><strong>{c.name}</strong><span>{dealing?'…':`${game.hands[seat].length} kartu`}</span></div><div className="b2-opponent-status">{game.winner===seat?'MENANG':online&&!online.view.players[(online.view.you+seat)%4]?.connected?'TERPUTUS':turn?'GILIRAN':last?.kind==='pass'&&last.id>(latestPlay?.id??0)?'PASS':online?'ONLINE':'BOT'}</div><div className="b2-mini-hand" aria-hidden="true">{Array.from({length:Math.min(game.hands[seat].length,7)},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}/>)}</div></div>;})}</div>
    <section className={`b2-table ${dealing?'is-dealing':''}`} aria-label="Kartu di meja">
     <div className="b2-table-lines" aria-hidden="true"/><span className="b2-table-watermark" aria-hidden="true">TEKAD<br/>CARD CLUB</span>
     {dealing?<div className="b2-deal-overlay"><div className="b2-deck" aria-hidden="true">♠</div><div className="b2-deal-flight" aria-hidden="true">{Array.from({length:16},(_,i)=><i key={i} className={`b2-fly-${i%4}`} style={{'--i':i} as CSSProperties}>♠</i>)}</div><strong>Membagikan kartu</strong></div>:game.table?<div className="b2-table-play"><div className="b2-play-label"><span>{cast[game.owner!].name}</span><strong>{LABELS[game.table.kind]}</strong></div><div className={`b2-pile b2-pile-${game.table.size}`} key={`pile-${latestPlay?.id}`}>{game.table.cards.map((c,i)=><Card card={c} index={i} key={c}/>)}</div>{game.passes>0&&<span className="b2-pass-count">{game.passes} / 3 Pass</span>}</div>:<div className="b2-table-empty"><span className="b2-empty-suit" aria-hidden="true">♠</span><strong>{game.opening?'Pembukaan 3♦':'Meja terbuka'}</strong><span>{cast[game.turn].name} memulai</span></div>}
     {cutin&&motion&&<CutIn key={cutin.id} id={cast[cutin.seat].id} name={cast[cutin.seat].name} label={cutin.label} seat={cutin.seat}/>}
    </section>
    <div className={`b2-turn-banner ${isMyTurn?'your-turn':''}`} role="status" aria-live="polite"><i aria-hidden="true"/><span>{dealing?'Menyiapkan ronde':game.winner!==null?`${cast[game.winner].name} menghabiskan kartu!`:online&&!online.connected?'Menyambungkan kembali…':online?.pending?'Menunggu konfirmasi langkah…':panel?(online?'Menu terbuka · ronde tetap berjalan':'Permainan dijeda'):!visible?'Permainan dijeda':game.turn===0?(game.opening?'Giliranmu · sertakan 3♦':game.table?'Giliranmu · balas atau Pass':'Giliranmu · buka kombinasi baru'):`Giliran ${cast[game.turn].name}`}</span>{game.winner===null&&<b>{game.hands[0].length} KARTU</b>}</div>
    <section className={`b2-hand-section ${dealing?'b2-hand-dealing':''}`} aria-label="Kartu kamu" style={{'--cast':cast[0].color} as CSSProperties}><div className="b2-hand-heading"><div><Portrait id={cast[0].id} pose="play"/><strong>{cast[0].name} <small>KAMU</small></strong></div><button onClick={()=>{stage.capture();setSortSuit(v=>!v);}} className="b2-sort" aria-label={`Urutkan berdasarkan ${sortSuit?'angka':'lambang'}`}><CommandIcon name="sort"/><span>Urutan: {sortSuit?'lambang':'angka'}</span></button></div><div className="b2-hand" role="group" aria-label="Ketuk untuk memilih kartu">{hand.map((card,i)=><Card key={card} card={card} index={i} selected={selected.includes(card)} onClick={()=>toggle(card)} disabled={!isMyTurn}/>)}</div></section>
    <div className="b2-controls"><div className={`b2-selection-status ${selected.length&&reason?'invalid':''}`} aria-live="polite">{notice||(selected.length?(reason??`${combo?LABELS[combo.kind]:''} · ${selected.length} kartu`):(isMyTurn?'Ketuk kartu, lalu Banting.':'Kartu dipilih saat giliranmu.'))}</div><div className="b2-action-row"><button className="b2-utility" onClick={suggest} disabled={!isMyTurn}><CommandIcon name="hint"/><span>Saran</span></button><button className="b2-utility b2-clear" aria-label="Batalkan pilihan" onClick={()=>{setSelected([]);setNotice('');}} disabled={!selected.length||!isMyTurn}><CommandIcon name="clear"/><span>Batal</span></button><button className="b2-pass" onClick={()=>play(true)} disabled={!isMyTurn||!game.table}><CommandIcon name="pass"/><span>Pass</span></button><button className="b2-primary b2-play" aria-label={selected.length?`Banting ${selected.length} kartu`:'Banting kartu'} onClick={()=>play()} disabled={!isMyTurn||!selected.length||!!reason}><CommandIcon name="play"/><span className="b2-command-text">Banting</span><span className="b2-command-count" aria-hidden="true">{selected.length||'♠'}</span></button></div></div>
    {storageWarning&&<p className="b2-save-warning">Penyimpanan perangkat tidak tersedia. Ronde ini tidak tersimpan setelah halaman ditutup.</p>}
   </section>
   {resultShown&&game.winner!==null&&<dialog ref={resultDialog} className="b2-results" aria-label="Hasil ronde" onCancel={event=>event.preventDefault()}><div className="b2-result-card"><div className="b2-result-art" style={{'--cast':cast[game.winner].color} as CSSProperties}><Portrait id={cast[game.winner].id} pose="win" portrait eager/><span>01</span><small>PEMENANG RONDE</small></div><div className="b2-result-copy"><span className="b2-eyebrow">RONDE {online?.view.round??session?.round??1} SELESAI</span><h2 className="wc-outcome">{game.winner===0?'Menang!':'Kalah.'}</h2><p>{game.winner===0?'Semua kartu berhasil dimainkan.':`${cast[game.winner].name} menang · ${game.hands[0].length} kartu tersisa.`}</p>
    <RoundScoreboard game={game} names={cast.map(c=>c.name)}/>
    {!!sessionSummary?.standings.length&&scoreSaved&&<details className="wc-session-details"><summary>Peringkat sesi · {sessionSummary.completed} ronde</summary><SessionScoreboard summary={sessionSummary} title="Total sesi"/></details>}
    {!online&&!scoreSaved&&<p className="b2-session-status" role="status">{records.busy?'Menyimpan poin ronde…':'Poin ronde belum tersimpan.'}</p>}
    {scoreConflict&&<div className="b2-session-error" role="alert">Ronde ini sudah selesai di tab lain. Gunakan hasil yang sudah tersimpan.<button onClick={()=>{setSession(null);setResume(null);setRecap(records.book?.active??record??null);setPanel('session');try{localStorage.removeItem(SAVE);}catch{setStorageWarning(true);}}}>Buka hasil tersimpan</button></div>}
    {!online&&records.error&&<div className="b2-session-error" role="alert">{records.error}<button disabled={records.busy} onClick={()=>{legacyAttempt.current=false;setScoreRetry(n=>n+1);if(!records.book)void records.request({type:'sync'});}}>Coba simpan lagi</button></div>}
    {online?.error&&<p className="b2-room-error" role="alert">{online.error}</p>}{online&&!online.connected&&<p role="status">Menyambungkan kembali…</p>}{online?.canClaimHost&&<button className="b2-primary" disabled={online.pending||!online.connected} onClick={()=>void online.onAction('claim-host')}>Ambil alih host</button>}{online?.retry&&<button className="b2-primary" onClick={online.onRetry}>Coba sambungkan ulang</button>}
    {(sessionSummary?.completed??0)>=200&&<p className="b2-session-status">200 ronde tercapai. Akhiri sesi untuk mulai sesi baru.</p>}
    <button className="b2-primary" onClick={()=>void begin()} disabled={online?(online.pending||!online.connected||online.view.you!==online.view.host):records.busy||!scoreSaved||(record?.rounds.length??0)>=200}>{online?(online.view.you!==online.view.host?'Menunggu host':'Siapkan ronde berikutnya'):'Main lagi'} <span aria-hidden="true">♠</span></button>
    {(!online||online.view.you===online.view.host)&&<button className="b2-text-button" disabled={online?online.pending||!online.connected:records.busy||!scoreSaved} onClick={()=>setPanel('end-session')}>Akhiri sesi</button>}
    <button className="b2-text-button" onClick={leave}>{online?'Tutup meja':'Kembali ke lobi'}</button></div></div></dialog>}
  </>}
  <dialog ref={dialog} className="b2-dialog" onCancel={()=>setPanel(null)} onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)setPanel(null);}}}><div className="b2-dialog-top"><WildCardsBrand compact/><button className="b2-icon" onClick={()=>setPanel(null)} aria-label="Tutup"><Icon name="close"/></button></div><div className="b2-dialog-body">
   <h2>{panel==='rules'?'Panduan bermain':panel==='settings'?'Pengaturan':panel==='history'?'Riwayat kartu':panel==='session'?'Rekap sesi':panel==='end-session'?'Akhiri sesi?':panel==='records'?'Riwayat sesi':'Kembali ke lobi?'}</h2>
   {panel==='session'&&<>{(recap&&!online?practiceSummary(recap):sessionSummary)?<SessionScoreboard summary={(recap&&!online?practiceSummary(recap):sessionSummary)!} title={(recap?.endedAt||sessionSummary?.endedAt)?'Hasil akhir':'Peringkat sementara'}/>:<p>Belum ada ronde yang tercatat.</p>}<p className="b2-session-status">{online?'Poin dihitung oleh server setelah ronde selesai.':'Rekap tersimpan di server dan diakses melalui perangkat ini.'}</p><button className="b2-primary" onClick={()=>setPanel(null)}>Tutup rekap</button></>}
   {panel==='end-session'&&<><p>{online?'Sesi berakhir untuk seluruh meja. Total poin dan kemenangan disimpan sebagai hasil akhir.':(session??resume)?.game.winner===null?'Ronde yang belum selesai tidak dihitung. Poin ronde sebelumnya tetap tersimpan.':'Total poin dan kemenangan disimpan. Sesi berikutnya dimulai dari nol.'}</p>{(records.error||online?.error)&&<p className="b2-session-error" role="alert">{online?.error??records.error}</p>}<button className="b2-primary" disabled={online?online.pending||!online.connected:records.busy} onClick={()=>void finishSession()}>Ya, akhiri sesi</button><button className="b2-text-button" onClick={()=>setPanel(null)}>Batal</button></>}
   {panel==='records'&&<><p className="b2-session-status">20 sesi latihan terakhir. Akses rekap mengikuti perangkat ini.</p>{records.error&&<p className="b2-session-error">{records.error}</p>}<div className="b2-session-history">{records.book?.history.length?records.book.history.map(r=><button key={r.id} onClick={()=>{setRecap(r);setPanel('session');}}><span>{new Date(r.startedAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}<small>{CAST[r.player].name} · {r.rounds.length} ronde · {r.rounds.filter(x=>x.winner===0).length} menang</small></span><b>{signed(practiceSummary(r).standings[0].total)} poin</b></button>):<p>Belum ada sesi yang diakhiri.</p>}</div></>}
   {panel==='rules'&&<><div className="b2-mode-guide"><section><h3>Classic</h3><p>Meja landscape dengan aturan Classic, tanpa skill. Poin tercatat dalam sesi. Jika ada ronde tersimpan, Start Game melanjutkannya.</p></section><section><h3>Skill Mode</h3><p>Meja portrait first-person. Skill Kirana sudah tersedia: pilih kocok ulang atau lihat kartu tertinggi lawan sebelum ronde, lalu satu kali memberi kartu saat giliranmu. Karakter lain belum memiliki skill. Pilih karakter lalu Start Game; refresh melanjutkan ronde tersimpan.</p></section><section><h3>Single Player / Multiplayer</h3><p>Single Player melawan tiga bot. Multiplayer membuka pilihan buat atau gabung room untuk empat pemain; karakter dipilih di dalam room. Multiplayer tersedia di Classic (landscape). Skill Mode (portrait) saat ini untuk Single Player.</p></section><section><h3>Kontrol</h3><p>Pilih kartu, lalu Banting. Gunakan Pass jika tidak membalas. Saran membantu memilih kombinasi. Suara dan musik dapat dimatikan melalui pengaturan.</p></section></div><div className="b2-rules">{RULES.map(([title,body],i)=><section key={title}><span>{(i+1).toString().padStart(2,'0')}</span><div><h3>{title}</h3><p>{body}</p></div></section>)}</div><p className="b2-rule-source">Varian meja TEKAD. <a href="https://www.pagat.com/climbing/bigtwo.html" target="_blank" rel="noreferrer">Referensi aturan permainan</a>.</p></>}
   {panel==='settings'&&<div className="b2-settings"><button role="switch" aria-checked={soundOn} onClick={toggleSound}><span><b>Suara</b><small>Aktifkan atau matikan semua audio</small></span><i>{soundOn?'ON':'OFF'}</i></button><button role="switch" aria-checked={musicOn} onClick={()=>{const next=!musicOn;setMusicOn(next);if(next){setSoundOn(true);if(audio.current){audio.current.enabled=true;audio.current.unlock();}}}}><span><b>Musik meja</b><small>Musik instrumental · berhenti saat menu terbuka</small></span><i>{musicOn?'ON':'OFF'}</i></button><div className="b2-audio-levels"><label htmlFor="b2-effects-volume"><span>Efek suara <output>{Math.round(effectsVolume*100)}%</output></span><input id="b2-effects-volume" type="range" min="0" max="100" value={Math.round(effectsVolume*100)} disabled={!soundOn} onChange={e=>{setEffectsVolume(Number(e.target.value)/100);audio.current?.unlock();}}/></label><label htmlFor="b2-music-volume"><span>Musik <output>{Math.round(musicVolume*100)}%</output></span><input id="b2-music-volume" type="range" min="0" max="100" value={Math.round(musicVolume*100)} disabled={!soundOn||!musicOn} onChange={e=>{setMusicVolume(Number(e.target.value)/100);audio.current?.unlock();}}/></label></div><button role="switch" aria-checked={effects} onClick={()=>setEffects(v=>!v)}><span><b>Animasi</b><small>{reduced?'Gerakan dikurangi mengikuti perangkat':'Gerak kartu, jurus, dan pergantian giliran'}</small></span><i>{effects?'ON':'OFF'}</i></button><p>{online?'Room tersimpan di server. Membuka menu tidak menghentikan giliran pemain lain.':'Latihan melawan bot tersimpan di perangkat ini. Bot berhenti saat tab tidak aktif atau menu terbuka.'}</p></div>}
   {panel==='history'&&<div className="b2-history">{!game?.history.length?<p>Belum ada kartu dimainkan.</p>:game.history.slice().reverse().map(move=><div key={move.id}><span>{cast[move.seat].name}<small>#{move.id}</small></span><section><b>{move.kind==='pass'?'Pass':LABELS[move.kind]}</b><p>{move.cards.map(cardName).join(' · ')}{move.newTrick?'Meja terbuka kembali.':''}</p></section></div>)}</div>}
   {panel==='leave'&&<div className="b2-leave"><p>{online?'Kursimu tetap tersimpan. Pemain lain dapat melanjutkan giliran mereka; kembali lewat Lanjutkan room.':'Ronde dijeda dan disimpan di perangkat ini. Kamu bisa melanjutkannya dari lobi.'}</p><button className="b2-primary" onClick={leave}>{online?'Tutup meja':'Ke lobi'}</button><button className="b2-text-button" onClick={()=>setPanel(null)}>Lanjut bermain</button></div>}
  </div></dialog>
 </main>;
}
