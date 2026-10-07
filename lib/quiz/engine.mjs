import { QUESTIONS } from './questions.mjs';
export const POINTS=[100,200,300,500,1000,2000,4000,8000,16000,32000,64000,125000,250000,500000,1000000];
export const HELPERS=['timmy','eldric','kirana','adelia','dylan'];
const lookup=new Map(QUESTIONS.map(q=>[q.id,q]));
export const shuffle=(a)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const seconds=(level)=>level<5?15:level<10?20:25;
export function createGame(name){return {name,phase:'ready',level:0,score:0,safe:0,elapsed:0,used:[],seen:[],deck:[1,2,3].flatMap(t=>shuffle(QUESTIONS.filter(q=>q.tier===t).map(q=>q.id)).slice(0,5)),question:null,result:null};}
function reveal(s,now,id=s.deck[s.level]){s.seen.push(id);s.question={id,order:shuffle([0,1,2,3]),removed:[],hint:null,vote:null,second:false,retried:false,started:now,deadline:now+seconds(s.level)*1000};s.phase='active';s.result=null;}
function charge(s,now){s.elapsed+=Math.max(0,Math.min(now,s.question.deadline)-s.question.started);}
function finish(s,reason,now){if(s.phase==='active')charge(s,now);s.score=reason==='walk'?s.score:s.safe;s.phase='ended';s.result={kind:reason};}
export function advance(input,action,now){const s=structuredClone(input);if(s.phase==='active'&&now>=s.question.deadline){finish(s,'timeout',now);return s;}
 const q=s.question&&lookup.get(s.question.id);
 if(action.type==='sync')return s;
 if(action.type==='next'&&(s.phase==='ready'||s.phase==='review')){reveal(s,now);return s;}
 if(action.type==='walk'&&s.phase!=='ended'){finish(s,'walk',now);return s;}
 if(s.phase!=='active')throw Error('Sesi ini tidak sedang menerima jawaban.');
 if(action.type==='help'){
  const h=action.helper;if(!HELPERS.includes(h)||s.used.includes(h))throw Error('Bantuan sudah dipakai atau tidak tersedia.');
  if(h==='dylan'&&s.question.retried)throw Error('Aktifkan sebelum jawaban pertama.');
  s.used.push(h);
  if(h==='timmy'){const wrong=shuffle(s.question.order.map((v,i)=>v!==0&&!s.question.removed.includes(i)?i:-1).filter(i=>i>=0));s.question.removed.push(...wrong.slice(0,2));}
  if(h==='eldric')s.question.hint=q.hint;
  if(h==='kirana'){const available=s.question.order.map((_,i)=>i).filter(i=>!s.question.removed.includes(i));const correct=s.question.order.indexOf(0);const wrong=available.filter(i=>i!==correct);const favored=Math.random()<.72||!wrong.length?correct:shuffle(wrong)[0];let weights=[0,0,0,0];for(const i of available)weights[i]=i===favored?50+Math.random()*25:5+Math.random()*20;const total=weights.reduce((a,b)=>a+b,0);const percent=weights.map(v=>Math.floor(v/total*100));percent[favored]+=100-percent.reduce((a,b)=>a+b,0);s.question.vote=percent;}
  if(h==='adelia'){charge(s,now);const choices=QUESTIONS.filter(x=>x.tier===q.tier&&!s.seen.includes(x.id)&&!s.deck.includes(x.id));if(!choices.length)throw Error('Soal pengganti tidak tersedia.');reveal(s,now,shuffle(choices)[0].id);}
  if(h==='dylan')s.question.second=true;
  s.question.deadline+=5000;
  return s;
 }
 if(action.type==='answer'){
  const i=action.choice;if(!Number.isInteger(i)||i<0||i>3||s.question.removed.includes(i))throw Error('Pilih jawaban yang tersedia.');
  if(s.question.order[i]!==0){if(s.question.second){s.question.second=false;s.question.retried=true;s.question.removed.push(i);s.question.vote=null;return s;}finish(s,'wrong',now);s.result.chosen=i;return s;}
  charge(s,now);s.score=POINTS[s.level];s.level++;if(s.level===5||s.level===10)s.safe=s.score;s.phase=s.level===15?'ended':'review';s.result={kind:s.level===15?'win':'correct',chosen:i};return s;
 }
 throw Error('Aksi tidak dikenal.');
}
export function publicGame(s,now){const q=s.question&&lookup.get(s.question.id);const answered=s.phase==='review'||s.phase==='ended';return {name:s.name,phase:s.phase,level:s.level,score:s.score,safe:s.safe,elapsed:s.elapsed,used:s.used,result:s.result,serverNow:now,question:q?{text:q.text,category:q.category,tier:q.tier,options:s.question.order.map(i=>q.options[i]),removed:s.question.removed,hint:s.question.hint,vote:s.question.vote,second:s.question.second,retried:s.question.retried,deadline:s.question.deadline,duration:(s.question.deadline-s.question.started)/1000,...(answered?{correct:s.question.order.indexOf(0),explanation:q.explanation,source:q.source}: {})}:null};}
