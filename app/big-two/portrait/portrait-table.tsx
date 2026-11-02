'use client';
import Link from 'next/link';
import {useEffect,useMemo,useRef,useState,type PointerEvent,type CSSProperties} from 'react';
import {act,chooseBotMove,explainMove,legalPlays,sortCards,LABELS,RANKS,SUITS,rank,suit,cardName,type Game} from '../engine';
import {Card} from '../card';
import {poseFor,POSE_INDEX,POSE_LABEL,type Pose} from './expressions';
import {handLayout,nearestCard} from './hand-layout';
import {CHARACTERS,tableCast,playerIndex as validPlayerIndex} from './characters';
import {HAND_PROFILES} from './hand-profiles';
import {useAtmosphere} from './use-atmosphere';
import {REACTION_MS,DEAL_STEP_MS,DEAL_FLIGHT_MS,moveSound} from './atmosphere';
import {ActionFlair} from './action-flair';
import '../deck.css';
import './portrait.css';
import './rebel.css';
import {WildCardsBrand} from '../wild-cards-brand';
import {RoundScoreboard} from '../round-scoreboard';
import {RoundEntrance} from '../round-entrance';
import {newSkillGame,restoreSkillGame,openingSkill,finishPeek,giveCard,type SkillGame} from './kirana-skills';
import {SkillPanel} from './skill-panel';

const ROOT='/big-two/portrait/';
const SAVE='tekad-capsa-portrait-trial-v1';
const PLAYER_SAVE='tekad-capsa-portrait-player-v1';
type Reaction={seat:number;pose:'play'|'pass';sequence:number;cleared?:Game['table']};
export default function PortraitTable(){
 const [playerIndex,setPlayerIndex]=useState(0),[draftPlayer,setDraftPlayer]=useState(0);
 const CAST=tableCast(playerIndex),player=CAST[0],handProfile=HAND_PROFILES[player.id];
 const [game,setGame]=useState<SkillGame|null>(null),[selected,setSelected]=useState<number[]>([]),[paused,setPaused]=useState(false),[visible,setVisible]=useState(true);
 const [reaction,setReaction]=useState<Reaction|null>(null),[menu,setMenu]=useState(false),[preview,setPreview]=useState<Pose|null>(null),[notice,setNotice]=useState('');
 const [assetReady,setAssetReady]=useState(false),[assetError,setAssetError]=useState(false),[retry,setRetry]=useState(0),[storageError,setStorageError]=useState(false);
 const [thinking,setThinking]=useState(false),[sortSuit,setSortSuit]=useState(false),[confirmNew,setConfirmNew]=useState(false);
 const [resultDismissed,setResultDismissed]=useState(false);
 const [skillPanel,setSkillPanel]=useState<'gift'|'info'|null>(null);
 const preparing=!!game?.kirana&&game.kirana.phase!=='ready';
 const resultDialog=useRef<HTMLDialogElement>(null),resultFocus=useRef<HTMLElement|null>(null);
 const blocked=paused||menu||!!preview||!visible||!assetReady;
 const atmosphere=useAtmosphere({blocked,active:!!game&&game.winner===null});
 const {preferences,update:changePreferences,motion,dealCount,startDeal,cue}=atmosphere;
 const dealing=dealCount!==null;
 const resultShown=!!game&&game.winner!==null&&!reaction&&!preview&&!menu&&!dealing&&!resultDismissed&&!blocked;
 const [previewCharacter,setPreviewCharacter]=useState(1);
 const [handSize,setHandSize]=useState({width:390,height:218});
 const [touchCard,setTouchCard]=useState<number|null>(null);
 const touchOrigin=useRef({x:0,y:0});
 const touchPick=useRef<number|null>(null),touchActive=useRef(false),suppressClick=useRef(0);
 const handStage=useRef<HTMLElement|null>(null);
 const dialog=useRef<HTMLDialogElement>(null),previousFocus=useRef<HTMLElement|null>(null),lock=useRef(false),live=useRef<SkillGame|null>(null);
 useEffect(()=>{let next:Game|null=null;const params=new URLSearchParams(window.location?.search??'');const requested=CHARACTERS.findIndex(c=>c.id===params.get('character'));const fresh=params.get('start')==='1';let index=requested<0?0:requested;try{if(!fresh){index=validPlayerIndex(JSON.parse(localStorage.getItem(PLAYER_SAVE)||'0'));next=restoreSkillGame(JSON.parse(localStorage.getItem(SAVE)||'null'),CHARACTERS[index].id==='kirana');}}catch{}setPlayerIndex(index);setDraftPlayer(index);setGame(next??newSkillGame(CHARACTERS[index].id==='kirana'));if(!next)startDeal();if(fresh){params.delete('start');window.history.replaceState(null,'',window.location.pathname+'?'+params.toString());}const onVisibility=()=>setVisible(!document.hidden);onVisibility();document.addEventListener('visibilitychange',onVisibility);return()=>document.removeEventListener('visibilitychange',onVisibility);},[]);
 useEffect(()=>{const node=handStage.current;if(!node)return;const measure=()=>{const {width,height}=node.getBoundingClientRect();if(width>0&&height>0)setHandSize(old=>old.width===width&&old.height===height?old:{width,height});};measure();const observer=new ResizeObserver(measure);observer.observe(node);return()=>observer.disconnect();},[]);
 useEffect(()=>{let cancelled=false;setAssetError(false);setAssetReady(false);const paths=['room.webp',...CHARACTERS.map(c=>c.atlas),player.hands];Promise.all(paths.map(path=>new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=reject;image.src=ROOT+path;}))).then(()=>{if(!cancelled)setAssetReady(true);}).catch(()=>{if(!cancelled)setAssetError(true);});return()=>{cancelled=true;};},[retry,player.hands]);
 useEffect(()=>{live.current=game;lock.current=false;if(game){try{localStorage.setItem(SAVE,JSON.stringify(game));localStorage.setItem(PLAYER_SAVE,JSON.stringify(playerIndex));setStorageError(false);}catch{setStorageError(true);}}},[game,playerIndex]);
 useEffect(()=>{if(!menu)return;const d=dialog.current;if(!d)return;previousFocus.current=document.activeElement as HTMLElement;d.showModal();return()=>{d.close();previousFocus.current?.focus();};},[menu]);

 const frozen=blocked||dealing||preparing||!!skillPanel;
 useEffect(()=>{if(!resultShown)return;const d=resultDialog.current;if(!d)return;resultFocus.current=document.activeElement as HTMLElement;d.showModal();return()=>{d.close();resultFocus.current?.focus();};},[resultShown]);
 const heardMove=useRef<Reaction|null>(null);
 useEffect(()=>{if(!reaction||frozen||heardMove.current===reaction||!game)return;heardMove.current=reaction;const sound=moveSound(game);if(sound)cue(sound);},[reaction,frozen,game,cue]);
 const heardTurn=useRef<Game|null>(null);
 useEffect(()=>{if(!game||game.turn!==0||game.winner!==null||reaction||frozen||heardTurn.current===game)return;heardTurn.current=game;cue('turn');},[game,reaction,frozen,cue]);
 useEffect(()=>{if(!reaction||frozen)return;const timer=setTimeout(()=>setReaction(null),REACTION_MS);return()=>clearTimeout(timer);},[reaction,frozen]);
 useEffect(()=>{setThinking(false);if(!game||game.winner!==null||game.turn===0||frozen||reaction)return;const seq=game.sequence;const a=setTimeout(()=>setThinking(true),220);const b=setTimeout(()=>{const current=live.current;if(!current||current.sequence!==seq||current.turn===0||lock.current)return;lock.current=true;const seat=current.turn;const cards=chooseBotMove(current.hands[seat],current.table,current.opening,current.hands.filter((_,i)=>i!==seat).map(h=>h.length));const next=act(current,seat,cards);setReaction({seat,pose:cards.length?'play':'pass',sequence:next.sequence,cleared:next.table?null:current.table});setGame(next);setSelected([]);setNotice('');},1600);return()=>{clearTimeout(a);clearTimeout(b);};},[game,frozen,reaction]);
 const shownHand=useMemo(()=>game?sortCards(game.hands[0],sortSuit).slice(0,dealCount??Infinity):[],[game,sortSuit,dealCount]);
 const counts=game?.hands.map(h=>h.length)??[13,13,13,13];
 const mine=!!game&&game.turn===0&&game.winner===null&&!frozen&&!reaction;
 const hand=useMemo(()=>game?sortCards(game.hands[0],sortSuit):[],[game,sortSuit]);
 const focus=reaction&&reaction.seat!==0?reaction.seat:game?.turn&&game.turn>0?game.turn:1;
 const focusedCharacter=preview?CHARACTERS[previewCharacter]:CAST[focus];
 const pose=poseFor({counts:dealing?[13,13,13,13]:counts,seat:focus,preview,action:reaction?.seat===focus?reaction.pose:undefined,choosing:thinking&&game?.turn===focus});
 const arrangement=useMemo(()=>handLayout(handSize.width,shownHand,selected,reaction?.seat===0&&reaction.pose==='play',handSize.height),[handSize,shownHand,selected,reaction]);
 const reason=game&&selected.length?explainMove(game,0,selected):null;
 const latest=game?.history.at(-1);
 const danger=counts.some(n=>n>0&&n<=3);
 function toggle(card:number){if(!mine)return;cue('select',true);setNotice('');setSelected(s=>s.includes(card)?s.filter(c=>c!==card):s.length<5?[...s,card]:s);if(selected.length>=5&&!selected.includes(card))setNotice('Maksimal 5 kartu.');}
 function clickCard(card:number){if(Date.now()>=suppressClick.current)toggle(card);}
 function pointCard(event:PointerEvent<HTMLDivElement>){
  const buttons=event.currentTarget.querySelectorAll?.<HTMLButtonElement>('.fp-card-index button');
  if(buttons?.length){let best=72*72,result:number|null=null;buttons.forEach(button=>{const r=button.getBoundingClientRect();const d=(event.clientX-r.left-r.width/2)**2+(event.clientY-r.top-r.height/2)**2;if(d<best){best=d;result=Number(button.dataset.card);}});return result;}
  const r=event.currentTarget.getBoundingClientRect();return nearestCard(arrangement.cards,event.clientX-r.left,event.clientY-r.top);
 }
 function touchStart(event:PointerEvent<HTMLDivElement>){if(!mine||event.button!==0)return;const target=(event.target as HTMLElement).closest<HTMLButtonElement>('button[data-card]');const card=pointCard(event)??(target?Number(target.dataset.card):null);if(card===null)return;touchOrigin.current={x:event.clientX,y:event.clientY};event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);touchActive.current=true;touchPick.current=card;setTouchCard(card);}
 function touchMove(event:PointerEvent<HTMLDivElement>){if(!touchActive.current||Math.hypot(event.clientX-touchOrigin.current.x,event.clientY-touchOrigin.current.y)<5)return;touchPick.current=pointCard(event);setTouchCard(touchPick.current);}
 function touchEnd(event:PointerEvent<HTMLDivElement>){if(!touchActive.current)return;event.preventDefault();suppressClick.current=Date.now()+500;const card=Math.hypot(event.clientX-touchOrigin.current.x,event.clientY-touchOrigin.current.y)<5?touchPick.current:pointCard(event);touchActive.current=false;touchPick.current=null;setTouchCard(null);if(card!==null)toggle(card);}
 function touchCancel(){touchActive.current=false;touchPick.current=null;setTouchCard(null);}
 function play(pass=false){const current=live.current;if(!mine||!current||lock.current)return;atmosphere.unlock();const cards=pass?[]:selected;if(!pass&&!cards.length)return;const error=explainMove(current,0,cards);if(error){setNotice(error);return;}lock.current=true;const next=act(current,0,cards);setReaction({seat:0,pose:pass?'pass':'play',sequence:next.sequence,cleared:next.table?null:current.table});setGame(next);setSelected([]);setNotice('');}
 function suggest(){if(!mine||!game)return;cue('select',true);const choices=legalPlays(hand,game.table,game.opening);if(!choices.length){setNotice('Belum ada balasan. Pilih Pass.');return;}const index=choices.findIndex(c=>c.cards.join(',')===[...selected].sort((a,b)=>a-b).join(','));setSelected(choices[(index+1)%choices.length].cards);setNotice('');}
 function newRound(nextPlayer=playerIndex){startDeal();setResultDismissed(false);setPlayerIndex(nextPlayer);setDraftPlayer(nextPlayer);setGame(newSkillGame(CHARACTERS[nextPlayer].id==='kirana'));setSkillPanel(null);setSelected([]);setReaction(null);setPreview(null);setPaused(false);setConfirmNew(false);setNotice('');setMenu(false);}

 return <main className="fp-page"><div className={`fp-shell b2-root ${motion?'':'fp-still'} ${blocked?'fp-frozen':''} ${dealing?'fp-dealing':''} ${preview?'fp-previewing':''}`} data-deal-count={dealCount??undefined}>
  {dealing&&assetReady&&<RoundEntrance key={atmosphere.dealId} enabled={motion} character={player.name}/>}
  <svg className="fp-clip-defs" width="0" height="0" aria-hidden="true"><defs>{handProfile.thumbs.flatMap((row,r)=>row.map((d,c)=><clipPath id={`fp-thumb-${r}-${c}`} key={`${r}-${c}`} clipPathUnits="objectBoundingBox"><path d={d}/></clipPath>))}</defs></svg>
  <img className="fp-room" src={ROOT+'room.webp'} alt=""/>
  <div className="fp-vignette"/>
  <div className="fp-graphic-field" aria-hidden="true"><span>TEKAD</span><i/><i/></div>
  <header className="fp-header"><Link href="/big-two" aria-label="Kembali ke BIG 2: Wild Cards" className="fp-icon">‹</Link><div><WildCardsBrand compact/><small>SKILL MODE</small></div><button className="fp-icon" onClick={()=>{setDraftPlayer(playerIndex);setMenu(true);}} aria-label="Buka menu">☰</button></header>
  <nav className="fp-seats" aria-label="Pemain dan sisa kartu">{CAST.map((c,i)=><div key={c.id} className={`fp-seat ${!dealing&&game?.winner===null&&game.turn===i?'active':''} ${!dealing&&counts[i]>0&&counts[i]<=3?'low':''}`} style={{'--seat-color':c.color} as CSSProperties} aria-current={!dealing&&game?.winner===null&&game.turn===i?'step':undefined}><img src={`/big-two/art/${c.id}-cutin-480.webp`} alt=""/><span>{i===0?'Kamu':c.name}<b>{dealing?dealCount:counts[i]} <small>kartu</small></b></span>{!dealing&&game?.winner===null&&game.turn===i&&<i/>}</div>)}</nav>
  <section className={`fp-character fp-${pose}`} aria-label={`${focusedCharacter.name}: ${POSE_LABEL[pose]}`}>
   <div key={focusedCharacter.id} className="fp-character-entry">
   <div className="fp-sprite" data-character={focusedCharacter.id} style={{backgroundImage:`url('${ROOT+focusedCharacter.atlas}')`,backgroundPosition:`${(POSE_INDEX[pose]%3)*50}% ${Math.floor(POSE_INDEX[pose]/3)*100}%`}} role="img" aria-label={`${focusedCharacter.name} ${POSE_LABEL[pose].toLowerCase()}`}/></div>
   <div key={`tag-${focusedCharacter.id}`} className="fp-rival-tag" aria-hidden="true"><small>RIVAL / {String(focus).padStart(2,'0')}</small><b>{focusedCharacter.name}</b></div>
  </section>
  {reaction&&game&&<ActionFlair key={reaction.sequence} game={game} sequence={reaction.sequence} name={CAST[reaction.seat].name} character={CAST[reaction.seat].id}/>}
  <section className={`fp-table ${reaction?.pose==='play'?'fp-impact':''}`} aria-label="Kartu di meja">
   {reaction?.pose==='play'&&<div key={reaction.sequence} className="fp-impact-mark" aria-hidden="true"/>}
   {dealing&&<div className="fp-deal" aria-hidden="true"><div className="fp-deck-stack"><i/><i/><i/><b>♠</b></div><div className="fp-deal-wave" key={atmosphere.dealId}>{Array.from({length:52},(_,i)=><i key={i} className={`fp-deal-to-${i%4}`} style={{animationDelay:`${Math.floor(i/4)*DEAL_STEP_MS+(i%4)*12}ms`,animationDuration:`${DEAL_FLIGHT_MS}ms`}}>♠</i>)}</div></div>}
   {reaction?.cleared&&<div className="fp-clearing-pile fp-pile" aria-hidden="true">{reaction.cleared.cards.map((c,i)=><div key={c} style={{'--pile-i':i,'--pile-n':reaction.cleared!.cards.length} as CSSProperties}><Card card={c}/></div>)}</div>}
   {!dealing&&(game?.table?<><span className="fp-pile-label">{CAST[game.owner!].name} <b>{LABELS[game.table.kind]}</b></span><div className="fp-pile" data-origin={game.owner===0?'player':'opponent'} key={game.history.findLast(m=>m.cards.length)?.id}>{game.table.cards.map((c,i)=><div key={c} style={{'--pile-i':i,'--pile-n':game.table!.cards.length} as CSSProperties}><Card card={c}/></div>)}</div></>:<div className="fp-empty"><span>♠</span><b>{game?.opening?'Pembukaan 3♦':'Meja terbuka'}</b></div>)}
   {latest?.kind==='pass'&&game?.table&&<span className="fp-pass-note">{CAST[latest.seat].name} pass <span className="fp-pass-dots" aria-label={`${game.passes} dari 3 pass`}>{[1,2,3].map(n=><i key={n} className={n<=game.passes?'filled':''}/>)}</span></span>}
   {!reaction&&latest?.newTrick&&<span className="fp-trick-open" key={game?.sequence}>Tiga pass · {game?.turn===0?'kamu':CAST[game?.turn??0].name} membuka</span>}
  </section>
  <div key={`${game?.sequence}:${dealing?'deal':reaction?'action':'turn'}`} className={`fp-turn ${mine?'fp-your-turn':''}`} role="status" aria-live="polite"><i/><span>{preview?`Pratinjau ekspresi ${focusedCharacter.name}`:!assetReady?'Menyiapkan meja…':dealing?'Membagikan 13 kartu':preparing?'Pilih skill pembukaan':skillPanel?'Skill Kirana':paused||menu?'Permainan dijeda':game?.winner!==null&&game?.winner!==undefined?`${CAST[game.winner].name} menang!`:reaction?`${CAST[reaction.seat].name} ${reaction.pose==='pass'?'pass':'membanting kartu'}`:game?.turn===0?'Giliranmu':`Giliran ${CAST[game?.turn??1].name}`}</span>{danger&&!dealing&&<b aria-label="Ada pemain dengan tiga kartu atau kurang">≤3</b>}</div>
  <section ref={handStage} className={`fp-hands ${selected.length?'fp-split':''} ${reaction?.seat===0&&reaction.pose==='play'?'fp-own-play':''}`} data-player={player.id} aria-label="Kartu di tanganmu">
   <div className="fp-hand-caption">{player.id==='kirana'?<div className="fp-skill-tools"><button className="fp-skill-trigger" disabled={!mine||!!game?.kirana?.gift||counts[0]<=1} onClick={()=>{setSelected([]);setSkillPanel('gift');}}>Skill {game?.kirana?.gift?'0/1':'1/1'}</button><button className="fp-skill-info" aria-label="Informasi skill Kirana" onClick={()=>setSkillPanel('info')}>ⓘ</button></div>:<span/>}<button onClick={()=>setSortSuit(v=>!v)} aria-label="Ganti urutan kartu">Urut: {sortSuit?'lambang':'angka'}</button></div>
   <div className="fp-fan" onPointerDown={touchStart} onPointerMove={touchMove} onPointerUp={touchEnd} onPointerCancel={touchCancel} onLostPointerCapture={touchCancel}>{arrangement.cards.flatMap(c=>{
    const style={left:c.x,top:c.y-c.height,width:c.width,height:c.height,transform:`translateX(-50%) rotate(${c.angle}deg)`};
    return [<div aria-hidden="true" className={`fp-card-slot ${c.selected?'picked':''}`} key={`${c.card}-face`} style={{...style,zIndex:c.layer}} onClick={()=>clickCard(c.card)}><Card card={c.card}/></div>,
     <div className="fp-card-index" key={`${c.card}-index`} style={{...style,zIndex:c.layer+100}}><button type="button" data-card={c.card} data-rank={RANKS[rank(c.card)]} aria-label={cardName(c.card)} aria-pressed={c.selected} disabled={!mine} onClick={()=>clickCard(c.card)} className={suit(c.card)===0||suit(c.card)===2?'red':''}><b>{RANKS[rank(c.card)]}</b><i>{SUITS[suit(c.card)]}</i></button></div>];
   })}</div>
   {/* Keep both layers mounted so their movement and release animation share a timeline. */}
   {arrangement.hands.flatMap((h,i)=>{const [gx,gy]=handProfile.grips[h.row][h.column];const style={backgroundImage:`url('${ROOT+player.hands}')`,left:h.x-h.size*gx,top:h.y-h.size*gy,width:h.size,height:h.size,backgroundPosition:`${h.column*50}% ${h.row*100}%`};return [<div key={`${i}-back`} className={`fp-grip-art fp-grip-${i} fp-hand-behind`} style={style} aria-hidden="true"/>,<div key={`${i}-thumb`} className={`fp-grip-art fp-grip-${i} fp-thumb-front`} style={{...style,visibility:h.column<2?'visible':'hidden',clipPath:`url(#fp-thumb-${h.row}-${Math.min(h.column,1)})`}} aria-hidden="true"/>];})}
   {touchCard!==null&&<div className="fp-touch-preview" aria-hidden="true"><Card card={touchCard}/></div>}
  </section>
  <footer className="fp-controls"><div className={`fp-selection-note ${reason?'invalid':''}`} aria-live="polite">{notice||reason||''}</div><div className="fp-actions"><button className="fp-hint" disabled={!mine} onClick={suggest}>Saran</button><button disabled={!selected.length||!mine} onClick={()=>{setSelected([]);setNotice('');}}>Batal</button><button disabled={!mine||!game?.table} onClick={()=>play(true)}>Pass</button><button className="fp-banting" disabled={!mine||!selected.length||!!reason} onClick={()=>play()}>Banting <span>{selected.length||'♠'}</span></button></div>{game?.winner!==null&&game?.winner!==undefined&&resultDismissed&&<button className="fp-show-result" onClick={()=>setResultDismissed(false)}>Lihat hasil ronde</button>}{storageError&&<p className="fp-storage-error">Ronde belum tersimpan di perangkat.</p>}</footer>
  {(!assetReady||!game)&&<div className="fp-loading" role="status"><span>♠</span><b>{assetError?'Gambar belum termuat':'Menyiapkan meja'}</b>{assetError?<button onClick={()=>setRetry(n=>n+1)}>Coba lagi</button>:<small>TEKAD CARD CLUB</small>}</div>}
  {paused&&!menu&&!preview&&<div className="fp-pause"><b>Jeda dulu.</b><button onClick={()=>setPaused(false)}>Lanjut main</button></div>}
  {preview&&<div className="fp-expression-controls"><div className="fp-preview-cast" role="group" aria-label="Pilih karakter pratinjau">{CHARACTERS.map((c,i)=><button key={c.id} aria-pressed={previewCharacter===i} onClick={()=>setPreviewCharacter(i)}>{c.name}</button>)}</div><div>{(Object.keys(POSE_INDEX) as Pose[]).map(p=><button key={p} aria-pressed={preview===p} onClick={()=>setPreview(p)}>{POSE_LABEL[p]}</button>)}</div><button className="fp-end-preview" onClick={()=>setPreview(null)}>Kembali bermain</button></div>}
  {resultShown&&game&&<dialog ref={resultDialog} className={`fp-result fp-round-result ${game.winner===0?'fp-winner':''}`} aria-labelledby="fp-result-title" onCancel={()=>setResultDismissed(true)}>
   <button className="fp-result-close fp-icon" aria-label="Lihat meja" onClick={()=>setResultDismissed(true)}>×</button>
   <div className="fp-winner-portrait"><img src={`/big-two/art/${CAST[game.winner!].id}-cutin-480.webp`} alt=""/></div>
   <span>RONDE SELESAI</span><h1 className="wc-outcome" id="fp-result-title">{game.winner===0?'Menang!':'Kalah.'}</h1>
   <p>{game.winner===0?'Semua kartu berhasil dimainkan.':`${CAST[game.winner!].name} menang · ${counts[0]} kartu tersisa.`}</p>
   <RoundScoreboard game={game} names={CAST.map(c=>c.name)}/>
   <button className="fp-next-round" onClick={()=>newRound()}>Main lagi</button><Link href="/big-two">Kembali ke lobi</Link>
  </dialog>}


  {game&&!blocked&&!dealing&&(preparing||skillPanel)&&<SkillPanel game={game} names={CAST.map(c=>c.name)} mode={preparing?'opening':skillPanel!} onClose={()=>setSkillPanel(null)} onOpening={choice=>{if(lock.current)return;lock.current=true;setGame(openingSkill(game,choice));setSelected([]);cue('select',true);if(choice==='shuffle')startDeal();}} onStart={()=>{setGame(finishPeek(game));cue('select',true);}} onGift={(card,target)=>{if(lock.current)return;lock.current=true;setGame(giveCard(game,card,target));setSkillPanel(null);setSelected([]);setNotice(`${cardName(card)} diberikan ke ${CAST[target].name}. Giliranmu berlanjut.`);cue('combo',true);}}/>}
  {menu&&<dialog className="fp-menu" ref={dialog} aria-labelledby="fp-menu-title" onCancel={()=>{setMenu(false);setConfirmNew(false);}}><div className="fp-menu-heading"><h2 id="fp-menu-title">Jeda</h2><button className="fp-icon" aria-label="Tutup menu" onClick={()=>{setMenu(false);setConfirmNew(false);}}>×</button></div><p className="fp-menu-context">{player.name} · Skill Mode</p><button className="fp-resume-game" onClick={()=>{setPaused(false);setMenu(false);}}>Lanjut bermain</button><fieldset className="fp-atmosphere-settings"><legend>Pengaturan</legend><button role="switch" aria-checked={preferences.sound} onClick={()=>changePreferences({sound:!preferences.sound})}><span>Suara</span><b>{preferences.sound?'ON':'OFF'}</b></button><button role="switch" aria-checked={preferences.music} onClick={()=>changePreferences({music:!preferences.music,sound:preferences.music?preferences.sound:true})}><span>Musik meja</span><b>{preferences.music?'ON':'OFF'}</b></button><button role="switch" aria-checked={preferences.motion} onClick={()=>changePreferences({motion:!preferences.motion})}><span>Animasi</span><b>{preferences.motion?'ON':'OFF'}</b></button>{atmosphere.reduced&&<small>Gerakan dibatasi mengikuti perangkat.</small>}</fieldset><button onClick={()=>setConfirmNew(true)}>Mulai ronde baru</button>{confirmNew&&<div className="fp-confirm"><p>Mulai ronde baru? Ronde ini akan diganti.</p><button onClick={()=>newRound()}>Ya, bagikan ulang</button><button onClick={()=>setConfirmNew(false)}>Batal</button></div>}<Link href="/big-two">Kembali ke lobi BIG 2: Wild Cards</Link></dialog>}
 </div></main>;
}
