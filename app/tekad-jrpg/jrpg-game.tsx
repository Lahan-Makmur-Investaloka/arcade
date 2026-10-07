'use client';
import {useEffect,useReducer,useState,useRef} from 'react';
import Link from 'next/link';
import {freshBattle,playerAction,enemyAction,intent,MAX_HP,MAX_MP,KIRANA_HP,KIRANA_MP,ENEMY_HP,DYLAN_HP,DYLAN_MP,MEMBERS,memberName,memberHp,memberMaxHp,memberGuard,nextActor,upcomingTurns,actionUnavailableReason,type Member,type Action,type Battle} from './battle';
import './jrpg.css';
import {PARTY_IMPACT_MS,PARTY_RECOVERY_MS,ENEMY_RECOVERY_MS} from './motion';
import TimmySprite from './timmy-sprite';
import GuardianSprite,{ENEMY_IMPACT_MS} from './guardian-sprite';
import KiranaSprite from './kirana-sprite';
import DylanSprite from './dylan-sprite';
import BattleMusic from './battle-music';
import {useBattleSound} from './battle-sound';
type Input={action:Action;target:Member}|'next'|'enemy'|'reset';
function reducer(s:Battle,a:Input){return a==='reset'?freshBattle():a==='enemy'?enemyAction(s):a==='next'?nextActor(s):playerAction(s,a.action,a.target);}
const timmyCommands: {id:Action;name:string;sub:string;icon:string}[]=[{id:'attack',name:'Attack',sub:'48 damage · +2 MP',icon:'Ⅰ'},{id:'bash',name:'Shield Bash',sub:'38 damage · −1 armor · 6 MP',icon:'Ⅱ'},{id:'guard',name:'Guard',sub:'−75% damage · +8 MP',icon:'Ⅲ'},{id:'potion',name:'Potion',sub:'Restore 100 HP',icon:'Ⅳ'}];
export default function Jrpg(){
 const [battle,dispatch]=useReducer(reducer,undefined,freshBattle);
 const sound=useBattleSound(battle);
 const [feedback,setFeedback]=useState(false);
 const [harmonyPulse,setHarmonyPulse]=useState(false);
 const [blocked,setBlocked]=useState('');
 useEffect(()=>{setFeedback(battle.event>0);setHarmonyPulse(battle.lastAction==='harmony');const timer=setTimeout(()=>setFeedback(false),1200);return()=>clearTimeout(timer);},[battle.event]);
 function memberStatus(m:Member){const hp=memberHp(battle,m),guard=memberGuard(battle,m);return <div className="jrpg-member-status" aria-label={`${memberName(m)} status`}>{hp===0?<span className="ko">KO</span>:<>{guard&&<span>Guard</span>}{battle.harmony>0&&<span className="harmony">Harmony · {battle.harmony}</span>}</>}</div>;}
 function healFeedback(m:Member){return feedback&&battle.target===m&&!!battle.healed?<span key={battle.event} className="jrpg-heal-number">+{battle.healed} HP</span>:null;}
 const [targetAction,setTargetAction]=useState<Action|null>(null);
 const [armed,setArmed]=useState(false);
 const [cursor,setCursor]=useState(0);
 const [menu,setMenu]=useState<'root'|'skills'|'item'>('root');
 const [ally,setAlly]=useState<Member|null>(null);
 const baseCommands=battle.active==='timmy'?timmyCommands:battle.active==='dylan'?[
 {id:'attack' as Action,name:'Attack',sub:'54 damage · +2 MP',icon:'Ⅰ'},
 {id:'crusher' as Action,name:'Breaker Fist',sub:`${battle.broken?120:72} damage · 120 on Break · 8 MP`,icon:'Ⅱ'},
 {id:'guard' as Action,name:'Guard',sub:'−75% damage · +8 MP',icon:'Ⅲ'},
 {id:'potion' as Action,name:'Potion',sub:'Restore 100 HP',icon:'Ⅳ'}]:[
 {id:'attack' as Action,name:'Attack',sub:'30 damage · +3 MP',icon:'Ⅰ'},
 {id:'heal' as Action,name:'Healing Melody',sub:'Heal 75 HP · 8 MP',icon:'Ⅱ'},
 {id:'harmony' as Action,name:'Harmony',sub:'+25% damage · −20% incoming · 2 turns · 10 MP',icon:'Ⅲ'},
 {id:'guard' as Action,name:'Guard',sub:'−75% damage · +8 MP',icon:'Ⅳ'},
 {id:'potion' as Action,name:'Potion',sub:'Restore 100 HP',icon:'Ⅴ'}];
 const commands=baseCommands.map(c=>({...c,sub:(c.id==='attack'||c.id==='bash'||c.id==='crusher')&&battle.harmony>0?c.sub.replace(/^\d+/,String(Math.round((c.id==='crusher'?(battle.broken?120:72):c.id==='bash'?38:battle.active==='dylan'?54:battle.active==='timmy'?48:30)*1.25)))+' · Harmony':c.sub}));
 useEffect(()=>setCursor(menu==='root'?0:1),[menu,battle.active]);
 const actorName=memberName(battle.active);
 useEffect(()=>{if(battle.phase!=='party')return;const timer=setTimeout(()=>dispatch('next'),PARTY_RECOVERY_MS);return()=>clearTimeout(timer);},[battle.phase,battle.event]);
 useEffect(()=>{setMenu('root');setTargetAction(null);setSelected('attack');setArmed(false);setAlly(null);setBlocked('');},[battle.active]);
 function available(action:Action){return action==='heal'||action==='potion'?MEMBERS.some(t=>playerAction(battle,action,t)!==battle):playerAction(battle,action)!==battle;}
 const [recovering,setRecovering]=useState(false);
 const recoveryLock=useRef(false);
 useEffect(()=>{
  if(!recovering)return;
  const timer=setTimeout(()=>{recoveryLock.current=false;setRecovering(false);dispatch('next');},ENEMY_RECOVERY_MS);
  return()=>clearTimeout(timer);
 },[recovering]);
 const [help,setHelp]=useState(false);
 const [selected,setSelected]=useState<Action>('attack');
 const [showResult,setShowResult]=useState(false);
 useEffect(()=>{setShowResult(false);if(battle.phase!=='won'&&battle.phase!=='lost')return;const timer=setTimeout(()=>setShowResult(true),1000);return()=>clearTimeout(timer);},[battle.phase]);
 const [pending,setPending]=useState<Action|null>(null);
 const actionTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const actionLock=useRef(false);
 useEffect(()=>()=>{if(actionTimer.current)clearTimeout(actionTimer.current);},[]);
 const ready=battle.phase==='player'&&!pending&&!recovering;
 function chooseAction(action:Action){if(!ready)return;setSelected(action);setAlly(null);const reason=actionUnavailableReason(battle,action);setBlocked(reason);setArmed(!reason);setTargetAction(!reason&&(action==='heal'||action==='potion')?action:null);}
 type MenuId=Action|'skills'|'item'|'back';
 const visibleCommands:{id:MenuId;name:string;sub:string;icon:string}[]=menu==='root'?[commands.find(c=>c.id==='attack')!,{id:'skills',name:'Skills',sub:'Choose a character skill',icon:''},{id:'item',name:'Item',sub:'Choose a shared item',icon:''},commands.find(c=>c.id==='guard')!]:[{id:'back',name:'Back',sub:'Return to actions',icon:''},...commands.filter(c=>menu==='item'?c.id==='potion':!['attack','guard','potion'].includes(c.id))];
 function activateMenu(id:MenuId){if(!ready)return;if(id==='skills'||id==='item'||id==='back'){setMenu(id==='back'?'root':id);setArmed(false);setTargetAction(null);setAlly(null);setBlocked('');return;}chooseAction(id);}
 function menuAvailable(id:MenuId){return ['skills','item','back'].includes(id)||available(id as Action);}
 function targetHint(m:Member){const hp=memberHp(battle,m),max=memberMaxHp(m);return hp===0?'KO':hp===max?'HP full':`+${Math.min(targetAction==='heal'?75:100,max-hp)} HP → ${Math.min(max,hp+(targetAction==='heal'?75:100))}/${max}`;}
 function targetButton(m:Member){return targetAction&&ready?<button className={`jrpg-party-target ${ally===m?'chosen':''}`} aria-pressed={ally===m} aria-label={`Target ${memberName(m)}: ${targetHint(m)}`} disabled={playerAction(battle,targetAction,m)===battle} onClick={()=>setAlly(m)}><span>{targetHint(m)}</span></button>:null;}
 function confirmAction(){if(!armed||!ready||(targetAction&&!ally))return;performAction(selected,ally??undefined);}
 function performAction(action:Action,target?:Member){
  if((action==='heal'||action==='potion')&&!target){if(available(action)){setSelected(action);setTargetAction(action);}return;}
  if(actionLock.current||recoveryLock.current||pending||playerAction(battle,action,target)===battle)return;
  sound.unlock();
  actionLock.current=true;setPending(action);setSelected(action);setTargetAction(null);setArmed(false);setAlly(null);
  actionTimer.current=setTimeout(()=>{dispatch({action,target:target??battle.active});setPending(null);actionLock.current=false;},PARTY_IMPACT_MS);
 }
 const visualBattle:Battle=pending?{...battle,event:battle.event+1,phase:'party',lastActor:battle.active,lastAction:pending,heroDamage:0,kiranaDamage:0,dylanDamage:0}:battle;
 const shell=useRef<HTMLElement>(null);
 const [expanded,setExpanded]=useState(false);
 const [screenNote,setScreenNote]=useState('');
 useEffect(()=>{const sync=()=>{if(!document.fullscreenElement)setExpanded(false);};document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync);},[]);
 useEffect(()=>{if(!expanded)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old;};},[expanded]);
 async function toggleFullscreen(){
  if(expanded){if(document.fullscreenElement)await document.exitFullscreen();setExpanded(false);return;}
  setExpanded(true);setScreenNote('');
  try{if(shell.current?.requestFullscreen)await shell.current.requestFullscreen();else setScreenNote('Expanded view active. Rotate your phone to landscape.');}
  catch{setScreenNote('Expanded view active. Rotate your phone to landscape.');}
  try{await (screen.orientation as ScreenOrientation & {lock?:(mode:string)=>Promise<void>}).lock?.('landscape');}catch{/* Rotation remains under device control. */}
 }


 useEffect(()=>{if(battle.phase!=='enemy')return;const timer=setTimeout(()=>{recoveryLock.current=true;setRecovering(true);dispatch('enemy');},ENEMY_IMPACT_MS);return()=>clearTimeout(timer);},[battle.phase,battle.round]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  if(e.target instanceof HTMLElement&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  if(e.key==='Escape'){e.preventDefault();if(help)setHelp(false);else if(armed){setArmed(false);setTargetAction(null);setAlly(null);}else if(menu!=='root')setMenu('root');else if(expanded){void toggleFullscreen();}return;}
  if(help||!ready)return;
  const direction=['ArrowRight','ArrowDown','d','D','s','S'].includes(e.key)?1:['ArrowLeft','ArrowUp','a','A','w','W'].includes(e.key)?-1:0;
  const confirm=e.key==='Enter'||e.key===' ';
  if(targetAction){const targets=(['kirana','dylan','timmy'] as Member[]).filter(m=>playerAction(battle,targetAction,m)!==battle);
   if(direction){e.preventDefault();const index=ally?targets.indexOf(ally):-1;setAlly(targets[(index+direction+targets.length)%targets.length]??null);}
   else if(confirm){e.preventDefault();if(ally)confirmAction();else setAlly(targets[0]??null);}return;
  }
  if(direction){e.preventDefault();setCursor((cursor+direction+visibleCommands.length)%visibleCommands.length);setArmed(false);setBlocked('');return;}
  if(confirm){e.preventDefault();if(armed)confirmAction();else activateMenu(visibleCommands[cursor]?.id??visibleCommands[0].id);return;}
  const index=Number(e.key)-1;if(index>=0&&index<visibleCommands.length){e.preventDefault();setCursor(index);activateMenu(visibleCommands[index].id);}
 };window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[help,battle,pending,targetAction,armed,ally,recovering,menu,cursor,expanded]);
 function actorMarker(m:Member){const selectedTarget=!!targetAction&&ally===m,active=ready&&battle.active===m;return selectedTarget||active?<span className={`jrpg-actor-marker ${selectedTarget?'heal-target':''}`}>{memberName(m)} · {selectedTarget?'TARGET':'TURN'}</span>:null;}
 const ended=battle.phase==='won'||battle.phase==='lost';
 return <main ref={shell} className={`jrpg-shell landscape-game duo-party trio-party ${pending||battle.phase==='party'||battle.phase==='enemy'||recovering?'cinematic-action':''} ${expanded?'is-expanded':''}`} lang="en">

  <div className="jrpg-rotate"><strong>Rotate to landscape</strong><p>Turn your phone sideways to play.</p><button onClick={toggleFullscreen}>{expanded?'Exit Fullscreen':'Fullscreen'}</button></div>
  {screenNote&&<p className="jrpg-screen-note" role="status">{screenNote}</p>}
  <section className="jrpg-battle" aria-label="Battle at Duskbridge">
  <div className="jrpg-initiative" aria-label="Turn order by speed"><span className="initiative-label">R{battle.round}</span>{upcomingTurns(battle).map((m,i)=><div key={`${m}-${i}`} className={`initiative-slot ${i===0?'current':''} ${m==='guardian'?'enemy-slot':''}`} aria-label={`${i===0?'Current':'Upcoming'}: ${m==='guardian'?'Guardian':memberName(m)}, Speed ${battle.speeds[m]}`}><div className="initiative-portrait">{m==='guardian'?<span className="initiative-guardian"/>:m==='timmy'?<TimmySprite battle={battle} portrait/>:m==='kirana'?<KiranaSprite battle={battle} portrait/>:<DylanSprite battle={battle} portrait/>}</div><span>{m==='guardian'?'Guardian':memberName(m)}<small>SPD {battle.speeds[m]}</small></span></div>)}</div>
  <BattleMusic/>
  <header className="jrpg-top"><Link href="/" className="jrpg-back">← Arcade</Link><div className="jrpg-wordmark">Saving Twilight</div><div className="jrpg-toolbar"><button onClick={sound.toggle} aria-pressed={sound.enabled}>{sound.enabled?'SFX Off':'SFX On'}</button><button onClick={()=>setHelp(!help)} aria-expanded={help}>Guide</button><button onClick={toggleFullscreen} aria-pressed={expanded}>{expanded?'Exit Fullscreen':'Fullscreen'}</button></div></header>
   <div className="jrpg-stage"><img className="jrpg-landscape" src="/jrpg/duskbridge-arena.png" alt="An ancient stone bridge in a mountain valley at dusk"/><div className="jrpg-vignette"/>
   <div className="jrpg-location"><span>PROLOGUE · FIRST ENCOUNTER</span><h1>World 1 · Duskbridge</h1><p>Defeat the guardian. Open the way forward.</p></div>
   <div className="jrpg-turn"><span>TURN {battle.round}</span><strong>{ended?'Battle complete':pending||battle.phase==='party'?actorName:recovering?'Recovering':battle.phase==='player'?actorName:'Guardian'}</strong></div>
    <div className="jrpg-enemy-title"><span>ANCIENT BEAST</span><h2>Antlered Guardian</h2><div className="jrpg-meter enemy-meter" role="progressbar" aria-label="Guardian HP" aria-valuenow={battle.enemyHp} aria-valuemax={ENEMY_HP} aria-valuemin={0}><i style={{width:`${battle.enemyHp/ENEMY_HP*100}%`}}/></div><small>{battle.enemyHp} / {ENEMY_HP} HP <b>{battle.broken?'BREAK':`ARMOR ${'◆'.repeat(battle.armor)}`}</b></small></div>
   <div className={`jrpg-enemy ${battle.phase==='won'?'fallen':''} ${battle.enemyDamage?'struck':''}`}>

    <GuardianSprite battle={battle}/><GuardianSprite battle={battle} effects/>
    {battle.enemyDamage>0&&<span key={`enemy-hit-${battle.round}-${battle.phase}`} className="jrpg-damage">{battle.enemyDamage}</span>}
   </div>
   <div className={`jrpg-hero timmy-actor ${battle.guard?'guarding':''} ${battle.heroDamage?'struck':''} ${battle.phase==='lost'?'fallen':''}`}>
    <TimmySprite battle={visualBattle}/>{healFeedback('timmy')}{actorMarker('timmy')}
    {battle.heroDamage>0&&<span key={`hero-hit-${battle.round}`} className="jrpg-damage hero-damage">−{battle.heroDamage}</span>}
    <div className="jrpg-hero-label"><span>GUARDIAN</span><strong>Timmy</strong></div>
   </div>
   <div className="jrpg-hero kirana-actor"><KiranaSprite battle={visualBattle}/>{healFeedback('kirana')}{actorMarker('kirana')}{battle.kiranaDamage>0&&<span key={battle.event} className="jrpg-damage hero-damage">−{battle.kiranaDamage}</span>}</div>
   <div className={`jrpg-hero dylan-actor ${battle.dylanGuard?'guarding':''}`}><DylanSprite battle={visualBattle}/>{healFeedback('dylan')}{actorMarker('dylan')}{battle.dylanDamage>0&&<span key={battle.event} className="jrpg-damage hero-damage">−{battle.dylanDamage}</span>}</div>
   {feedback&&harmonyPulse&&MEMBERS.filter(m=>(memberHp(battle,m))>0).map(m=><div key={m+battle.event} className={`jrpg-harmony-pulse ${m}`} aria-hidden="true">♪</div>)}
   <div className={`jrpg-intent ${battle.broken?'is-broken':battle.charged?'is-charged':''}`}><span>ENEMY INTENT</span><strong>{battle.broken?(battle.breakRecovery?'BROKEN · Recovering next turn':'BREAK · Next turn skipped'):battle.charged?'IRONFALL READY':intent(battle.round)}</strong><small>{battle.broken?'Armor shattered · your opening':battle.charged?'Heavy attack next · Guard to endure':battle.round%3===2?'Power gathering next':'Physical attack'}</small></div>
   <div className="jrpg-scene-caption">A sword to forge ahead. A shield to endure.</div>
   {ended&&showResult&&<div className="jrpg-outcome" role="dialog" aria-modal="true" aria-label="Battle result"><span>{battle.phase==='won'?'VICTORY':'FALLEN'}</span><h2>{battle.phase==='won'?'The way is open.':'Rise once more.'}</h2><p>{battle.phase==='won'?'The guardian bows. Beyond the mist, the party’s journey begins.':'Read the guardian’s pattern and guard against its heavy attacks.'}</p><div><button onClick={()=>dispatch('reset')}>{battle.phase==='won'?'Play again':'Try again'}</button><Link href="/">Back to Arcade</Link></div></div>}
  </div>
  <section className="jrpg-controls" aria-label="Battle commands">
   <div className={`jrpg-party ${ready&&battle.active==='timmy'?'active-member':''}`}><div className="jrpg-portrait"><TimmySprite battle={battle} portrait/></div><div className="jrpg-section-label">PARTY <span>01 / 03</span></div><div className="jrpg-member"><div><strong>Timmy</strong><span>Guardian · Sword & Shield</span></div><b>LV 01</b></div><div className="jrpg-stat"><span>HP</span><div className="jrpg-meter"><i style={{width:`${battle.hp/MAX_HP*100}%`}}/></div><b>{battle.hp}/{MAX_HP}</b></div><div className="jrpg-stat mp"><span>MP</span><div className="jrpg-meter"><i style={{width:`${battle.mp/MAX_MP*100}%`}}/></div><b>{battle.mp}/{MAX_MP}</b></div>{memberStatus('timmy')}{targetButton('timmy')}</div>
   <div className={`jrpg-party kirana-status ${ready&&battle.active==='kirana'?'active-member':''}`}><div className="jrpg-portrait"><KiranaSprite battle={battle} portrait/></div><div className="jrpg-member"><strong>Kirana</strong><b>BARD</b></div><div className="jrpg-stat"><span>HP</span><div className="jrpg-meter"><i style={{width:`${battle.kiranaHp/KIRANA_HP*100}%`}}/></div><b>{battle.kiranaHp}/{KIRANA_HP}</b></div><div className="jrpg-stat mp"><span>MP</span><div className="jrpg-meter"><i style={{width:`${battle.kiranaMp/KIRANA_MP*100}%`}}/></div><b>{battle.kiranaMp}/{KIRANA_MP}</b></div>{memberStatus('kirana')}{targetButton('kirana')}</div>
   <div className={`jrpg-party dylan-status ${ready&&battle.active==='dylan'?'active-member':''}`}><div className="jrpg-portrait"><DylanSprite battle={battle} portrait/></div><div className="jrpg-member"><strong>Dylan</strong><b>BRAWLER</b></div><div className="jrpg-stat"><span>HP</span><div className="jrpg-meter"><i style={{width:`${battle.dylanHp/DYLAN_HP*100}%`}}/></div><b>{battle.dylanHp}/{DYLAN_HP}</b></div><div className="jrpg-stat mp"><span>MP</span><div className="jrpg-meter"><i style={{width:`${battle.dylanMp/DYLAN_MP*100}%`}}/></div><b>{battle.dylanMp}/{DYLAN_MP}</b></div>{memberStatus('dylan')}{targetButton('dylan')}</div>
   {battle.harmony>0&&<div className="jrpg-harmony-status">Harmony · {battle.harmony} enemy turn{battle.harmony===1?'':'s'}</div>}
   <div className="jrpg-command-panel"><div className="jrpg-section-label">{ended?'BATTLE COMPLETE':ready?`${actorName} · Choose action`:pending||battle.phase==='party'?`${actorName} · Acting`:recovering?'Recovering':'GUARDIAN TURN'}</div><div className="jrpg-command-grid">{visibleCommands.map((c,i)=><button key={c.id} className={`${selected===c.id&&armed?'selected':''} ${cursor===i?'keyboard-choice':''}`} aria-pressed={armed&&selected===c.id} disabled={!ready} aria-disabled={!ready||!menuAvailable(c.id)} onClick={()=>{setCursor(i);activateMenu(c.id);}}><i>{c.icon}</i><div><strong>{c.name}{c.id==='potion'&&<em> ×{battle.potions}</em>}</strong><span>{c.sub}</span>{ready&&!['skills','item','back'].includes(c.id)&&actionUnavailableReason(battle,c.id as Action)&&<small className="jrpg-unavailable">{actionUnavailableReason(battle,c.id as Action)}</small>}</div><b>›</b></button>)}</div></div>
   <div className="jrpg-journal"><div className="jrpg-action-description"><strong>{commands.find(c=>c.id===selected)?.name}</strong><p>{!armed&&menu!=='root'?(menu==='skills'?'Choose a skill':'Choose an item'):commands.find(c=>c.id===selected)?.sub}</p></div>{armed&&ready?<div className="jrpg-confirm"><span className={targetAction?'target-instruction':'ready-instruction'}>{targetAction?ally?`Target: ${memberName(ally)} · ${targetHint(ally)}`:'Choose a party card above':'Ready to act'}</span><button disabled={!!targetAction&&!ally} onClick={confirmAction}>Confirm</button><button onClick={()=>{setArmed(false);setTargetAction(null);setAlly(null);}}>Cancel</button></div>:<p className="jrpg-action-hint">{blocked|| (ready?'← → / WASD Select · Enter Choose · Esc Back':'Waiting for the turn to finish.')}</p>}<div className="jrpg-section-label">BATTLE LOG</div><ol aria-live="polite" aria-relevant="additions text">{battle.log.slice(-3).map((line,i)=><li key={`${battle.round}-${i}`}>{line}</li>)}</ol></div>
  </section>
  <div className="jrpg-result-line" role="status">{feedback&&battle.harmonyExpired?`${battle.log.slice(-1)[0]} Harmony has ended.`:battle.log.slice(-1)[0]}</div>
  </section>
  <footer className="jrpg-footer"><span>GUARDIAN · COMBAT PROLOGUE</span><span>Attack · Break armor · Guard</span></footer>
  {help&&<div className="jrpg-help-backdrop" onClick={()=>setHelp(false)}><section className="jrpg-help" role="dialog" aria-modal="true" aria-label="Battle guide" onClick={e=>e.stopPropagation()}><button autoFocus className="jrpg-close" onClick={()=>setHelp(false)}>Close ×</button><span>GUARDIAN FIELD NOTES</span><h2>Read your opponent.</h2><p>Speed sets the order each round: higher Speed acts first, including the guardian. Everyone acts once per round. The turn queue shows who is next. Fallen allies skip their turns. Ironfall strikes the whole party.</p><dl><dt>Kirana · Bard</dt><dd>Healing Melody restores 75 HP to a living ally. Harmony boosts party damage by 25% and reduces incoming damage by 20% for two enemy turns. Attack restores 3 MP.</dd><dt>Dylan · Brawler</dt><dd>Attack restores 2 MP. Breaker Fist costs 8 MP and deals 72 damage, or 120 while the guardian is Broken. Use Timmy to break armor, then let Dylan strike.</dd><dt>Sword</dt><dd>A reliable attack that also restores a little MP.</dd><dt>Shield Bash</dt><dd>Break three layers of armor to make the enemy lose one turn.</dd><dt>Guard</dt><dd>Brace for heavy attacks: reduce damage by 75% and restore MP.</dd><dt>Potion</dt><dd>Two healing items. Use them when your HP is low.</dd></dl><p>Open Skills or Item to choose a skill or potion. Use arrow keys or WASD to move, Enter or Space to select and confirm, and Escape to go back. Number keys select menu entries directly. Healing targets also support arrow keys and Enter. For Heal or Potion, select a party card first. Escape cancels your selection. Guard each character before Ironfall.</p></section></div>}
 </main>;
}
