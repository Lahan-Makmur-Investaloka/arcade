import {createGame,restoreGame,sortCards,type Game} from '../engine';
export type KiranaSkills={phase:'choose'|'peek'|'ready';opening:'shuffle'|'peek'|'skip'|null;gift:{card:number;target:number}|null;seen:number[]|null};
export type SkillGame=Game&{kirana?:KiranaSkills};
export const freshKirana=():KiranaSkills=>({phase:'choose',opening:null,gift:null,seen:null});
export function newSkillGame(kirana:boolean,random:()=>number=Math.random):SkillGame{return {...createGame(random),...(kirana?{kirana:freshKirana()}:{})};}
export function openingSkill(game:SkillGame,choice:'shuffle'|'peek'|'skip',random:()=>number=Math.random):SkillGame{
 const skill=game.kirana;
 if(!skill||skill.phase!=='choose'||game.sequence!==0||game.winner!==null)throw Error('Skill pembukaan sudah selesai.');
 if(choice==='shuffle')return {...createGame(random),kirana:{...skill,phase:'ready',opening:choice}};
 return {...game,kirana:{...skill,phase:choice==='peek'?'peek':'ready',opening:choice,seen:choice==='peek'?game.hands.slice(1).map(h=>Math.max(...h)):null}};
}
export function finishPeek(game:SkillGame):SkillGame{
 if(game.kirana?.phase!=='peek')throw Error('Tidak ada kartu untuk dilihat.');
 return {...game,kirana:{...game.kirana,phase:'ready'}};
}
export function giftReason(game:SkillGame,card:number,target:number):string|null{
 if(!game.kirana||game.kirana.phase!=='ready')return 'Selesaikan skill pembukaan dulu.';
 if(game.kirana.gift)return 'Skill memberi kartu sudah digunakan.';
 if(game.winner!==null)return 'Ronde sudah selesai.';
 if(game.turn!==0)return 'Tunggu giliran Kirana.';
 if(game.hands[0].length<=1)return 'Kartu terakhir harus dimainkan ke meja.';
 if(!Number.isInteger(target)||target<1||target>3)return 'Pilih satu lawan.';
 if(!game.hands[0].includes(card))return 'Pilih satu kartu milikmu.';
 if(game.opening&&card===0)return '3♦ harus dimainkan sebagai pembukaan.';
 return null;
}
export function giveCard(game:SkillGame,card:number,target:number):SkillGame{
 const reason=giftReason(game,card,target);if(reason)throw Error(reason);
 return {...game,hands:game.hands.map((h,i)=>i===0?h.filter(c=>c!==card):i===target?sortCards([...h,card]):h),kirana:{...game.kirana!,gift:{card,target}}};
}
/** Skill saves allow a 14-card recipient; Classic retains its 13-card limit. */
export function restoreSkillGame(raw:unknown,isKirana:boolean):SkillGame|null{
 if(!raw||typeof raw!=='object')return null;
 const candidate=raw as SkillGame,s=candidate.kirana;
 if(s){
  if(!isKirana||!['choose','peek','ready'].includes(s.phase)||![null,'shuffle','peek','skip'].includes(s.opening))return null;
  if(s.gift!==null&&(!s.gift||!Number.isInteger(s.gift.card)||s.gift.card<0||s.gift.card>51||!Number.isInteger(s.gift.target)||s.gift.target<1||s.gift.target>3))return null;
  if(s.seen!==null&&(!Array.isArray(s.seen)||s.seen.length!==3||s.seen.some(c=>!Number.isInteger(c)||c<0||c>51)))return null;
  if(s.phase==='ready'&&s.opening===null)return null;
  if((s.phase==='choose'&&(s.opening!==null||s.gift!==null||s.seen!==null))||(s.phase==='peek'&&(s.opening!=='peek'||!s.seen||s.gift!==null))||(s.phase!=='ready'&&candidate.sequence!==0))return null;
 }
 const game=restoreGame(raw,s?.gift?14:13) as SkillGame|null;
 if(!game)return null;
 if(game.hands.some((h,i)=>h.length>13&&i!==s?.gift?.target))return null;
 return isKirana&&!s?{...game,kirana:{...freshKirana(),phase:'ready',opening:'skip'}}:game;
}
