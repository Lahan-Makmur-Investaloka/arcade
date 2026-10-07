export type Member='timmy'|'kirana'|'dylan';
export type Combatant=Member|'guardian';
export const SPEED:Record<Combatant,number>={kirana:28,timmy:24,guardian:22,dylan:20};
export type Action='attack'|'bash'|'guard'|'potion'|'heal'|'harmony'|'crusher';
export type Battle={speeds:Record<Combatant,number>;dylanHp:number;dylanMp:number;dylanGuard:boolean;dylanDamage:number;charged?:boolean;breakRecovery?:boolean;hp:number;mp:number;enemyHp:number;armor:number;potions:number;round:number;phase:'player'|'party'|'enemy'|'enemyRecovery'|'won'|'lost';guard:boolean;broken:boolean;lastAction:Action|null;log:string[];enemyDamage:number;heroDamage:number;active:Member;acted:Combatant[];kiranaHp:number;kiranaMp:number;kiranaGuard:boolean;kiranaDamage:number;harmony:number;target:Member;lastActor:Member;event:number;healed?:number;harmonyExpired?:boolean};
export const MAX_HP=240,MAX_MP=36,KIRANA_HP=180,KIRANA_MP=48,DYLAN_HP=280,DYLAN_MP=30,ENEMY_HP=900;
export const intent=(round:number)=>round%3===0?'Ironfall':round%3===2?'Gathering Power':'Horn Sweep';
export const freshBattle=():Battle=>({speeds:{...SPEED},dylanHp:DYLAN_HP,dylanMp:DYLAN_MP,dylanGuard:false,dylanDamage:0,hp:MAX_HP,mp:MAX_MP,enemyHp:ENEMY_HP,armor:3,potions:2,round:1,phase:'player',guard:false,broken:false,lastAction:null,log:['Timmy leads. Kirana readies her lyre. Dylan raises his fists.'],enemyDamage:0,heroDamage:0,active:'kirana',acted:[],kiranaHp:KIRANA_HP,kiranaMp:KIRANA_MP,kiranaGuard:false,kiranaDamage:0,harmony:0,target:'timmy',lastActor:'timmy',event:0});
export function playerAction(state:Battle,action:Action,target:Member=state.active):Battle{
 if(state.phase!=='player')return state;
 const bard=state.active==='kirana',brawler=state.active==='dylan',mp=memberMp(state,state.active);
 if((state.active!=='timmy'&&action==='bash')||(!bard&&(action==='heal'||action==='harmony'))||(!brawler&&action==='crusher'))return state;
 const cost=action==='crusher'?8:action==='bash'?6:action==='heal'?8:action==='harmony'?10:0;
 const targetHp=memberHp(state,target),max=memberMaxHp(target);
 if(mp<cost||((action==='heal'||action==='potion')&&(targetHp===0||targetHp===max))||(action==='potion'&&state.potions===0))return state;
 const s:Battle={...state,lastAction:action,lastActor:state.active,target,log:[...state.log],acted:[...state.acted,state.active],enemyDamage:0,heroDamage:0,kiranaDamage:0,dylanDamage:0,healed:0,harmonyExpired:false,event:state.event+1};
 if(bard)s.kiranaMp-=cost;else if(brawler)s.dylanMp-=cost;else s.mp-=cost;
 if(action==='attack'||action==='bash'||action==='crusher'){
  const base=action==='crusher'?(s.broken?120:72):action==='bash'?38:brawler?54:bard?30:48;s.enemyDamage=Math.round(base*(s.harmony>0?1.25:1));s.enemyHp=Math.max(0,s.enemyHp-s.enemyDamage);
  s.log.push(`${action==='crusher'?'Breaker Fist':action==='bash'?'Shield Bash':'Attack'} — ${s.enemyDamage} damage.`);
  if(action==='bash'){s.armor=Math.max(0,s.armor-1);if(s.armor===0&&!s.broken){s.broken=true;s.breakRecovery=false;s.charged=false;s.log.push('BREAK! The guardian’s armor shatters.');}}
  if(action==='attack'){if(bard)s.kiranaMp=Math.min(KIRANA_MP,s.kiranaMp+3);else if(brawler)s.dylanMp=Math.min(DYLAN_MP,s.dylanMp+2);else s.mp=Math.min(MAX_MP,s.mp+2);}
 }else if(action==='guard'){
  if(bard){s.kiranaGuard=true;s.kiranaMp=Math.min(KIRANA_MP,s.kiranaMp+8);}else if(brawler){s.dylanGuard=true;s.dylanMp=Math.min(DYLAN_MP,s.dylanMp+8);}else{s.guard=true;s.mp=Math.min(MAX_MP,s.mp+8);}
  s.log.push(`${memberName(state.active)} guards. Restored 8 MP.`);
 }else if(action==='harmony'){s.harmony=2;s.log.push('Harmony — party damage +25%, incoming damage −20% for two enemy turns.');}
 else{const amount=action==='heal'?75:100,healed=Math.min(amount,max-targetHp);s.healed=healed;if(target==='timmy')s.hp+=healed;else if(target==='kirana')s.kiranaHp+=healed;else s.dylanHp+=healed;if(action==='potion')s.potions--;s.log.push(`${action==='heal'?'Healing Melody':'Potion'} — ${memberName(target)} recovers ${healed} HP.`);}
 s.phase=s.enemyHp===0?'won':'party';s.log=s.log.slice(-5);return s;
}
export function turnOrder(s:Battle):Combatant[]{return ([...MEMBERS,'guardian'] as Combatant[]).filter(m=>m==='guardian'?s.enemyHp>0:memberHp(s,m)>0).sort((a,b)=>s.speeds[b]-s.speeds[a]);}
export function upcomingTurns(s:Battle):Combatant[]{const order=turnOrder(s),remaining=order.filter(m=>!s.acted.includes(m));const acting:Combatant[]=s.phase==='party'?[s.lastActor]:s.phase==='enemyRecovery'?['guardian']:[];return [...acting,...remaining,...order,...order].slice(0,8);}
export function nextActor(state:Battle):Battle{
 if(state.phase!=='party'&&state.phase!=='enemyRecovery')return state;
 let acted=state.acted,round=state.round;
 let next=turnOrder(state).find(m=>!acted.includes(m));
 if(!next){acted=[];round++;next=turnOrder(state)[0];}
 return {...state,round,acted,phase:next==='guardian'?'enemy':'player',active:next&&next!=='guardian'?next:state.active,enemyDamage:0,heroDamage:0,kiranaDamage:0,dylanDamage:0,lastAction:null};
}
export function enemyAction(state:Battle):Battle{
 if(state.phase!=='enemy')return state;
 const s:Battle={...state,log:[...state.log],acted:[...state.acted,'guardian'],enemyDamage:0,heroDamage:0,kiranaDamage:0,dylanDamage:0,healed:0,harmonyExpired:false,event:state.event+1,lastAction:null};
 if(s.broken&&!s.breakRecovery){s.log.push('The guardian staggers and loses its turn.');s.breakRecovery=true;s.charged=false;}
 else{
  if(s.breakRecovery){s.broken=false;s.breakRecovery=false;s.armor=3;}
  if(s.round%3===2){s.charged=true;s.log.push('Its horns glow. Ironfall is ready!');}
  else{
   s.charged=false;const heavy=s.round%3===0,mitigation=s.harmony>0?.8:1;
   if(s.hp>0){s.heroDamage=Math.round((heavy?96:40)*(s.guard?.25:1)*mitigation);s.hp=Math.max(0,s.hp-s.heroDamage);}
   if(s.kiranaHp>0&&(heavy||state.hp===0)){s.kiranaDamage=Math.round((heavy?72:40)*(s.kiranaGuard?.25:1)*mitigation);s.kiranaHp=Math.max(0,s.kiranaHp-s.kiranaDamage);}
   if(s.dylanHp>0&&(heavy||(state.hp===0&&state.kiranaHp===0))){s.dylanDamage=Math.round((heavy?84:40)*(s.dylanGuard?.25:1)*mitigation);s.dylanHp=Math.max(0,s.dylanHp-s.dylanDamage);}
   s.log.push(heavy?`Ironfall — Timmy −${s.heroDamage} HP, Kirana −${s.kiranaDamage} HP, Dylan −${s.dylanDamage} HP.`:`Horn Sweep — ${state.hp>0?'Timmy':state.kiranaHp>0?'Kirana':'Dylan'} takes ${s.heroDamage||s.kiranaDamage||s.dylanDamage} damage.`);
  }
 }
 s.harmonyExpired=s.harmony===1;s.harmony=Math.max(0,s.harmony-1);s.guard=false;s.kiranaGuard=false;s.dylanGuard=false;s.phase=MEMBERS.every(m=>memberHp(s,m)===0)?'lost':'enemyRecovery';s.log=s.log.slice(-5);return s;
}

export function actionUnavailableReason(s:Battle,a:Action):string{
 if(s.phase!=='player')return 'Wait for your turn';
 const mp=memberMp(s,s.active),cost=a==='crusher'?8:a==='bash'?6:a==='heal'?8:a==='harmony'?10:0;
 if(mp<cost)return `Not enough MP · need ${cost}`;
 if(a==='potion'&&s.potions===0)return 'No potions left';
 if((a==='heal'||a==='potion')&&!MEMBERS.some(m=>memberHp(s,m)>0&&memberHp(s,m)<memberMaxHp(m)))return 'Living allies have full HP';
 return '';
}

export const MEMBERS:Member[]=['timmy','kirana','dylan'];
export const memberName=(m:Member)=>m==='timmy'?'Timmy':m==='kirana'?'Kirana':'Dylan';
export const memberHp=(s:Battle,m:Member)=>m==='timmy'?s.hp:m==='kirana'?s.kiranaHp:s.dylanHp;
export const memberMp=(s:Battle,m:Member)=>m==='timmy'?s.mp:m==='kirana'?s.kiranaMp:s.dylanMp;
export const memberMaxHp=(m:Member)=>m==='timmy'?MAX_HP:m==='kirana'?KIRANA_HP:DYLAN_HP;
export const memberGuard=(s:Battle,m:Member)=>m==='timmy'?s.guard:m==='kirana'?s.kiranaGuard:s.dylanGuard;
