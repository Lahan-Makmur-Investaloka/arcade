import {act,createGame,scores,type Game,type Card,type Combo,type Move} from '../../app/big-two/engine.ts';
import type {SessionSummary} from '../../app/big-two/session-types.ts';
type SessionStats={completed:number;endedAt:number|null;includesEarlierScores?:boolean;members:{hash:string;name:string;character:number;total:number;wins:number;rounds:number}[]};
export type Member={hash:string;name:string;character:number;ready:boolean};
export type RoomState={players:(Member|null)[];host:number;phase:'lobby'|'playing'|'finished'|'closed'|'ended';game:Game|null;round:number;totals:number[];receipts:{id:string;hash:string;signature:string}[];message:string;sessionStats?:SessionStats};
export type RoomView={code:string;revision:number;you:number;host:number;phase:RoomState['phase'];round:number;expiresAt:number;serverTime:number;message:string;session?:SessionSummary;players:({name:string;character:number;ready:boolean;connected:boolean;lastSeen:number;total:number}|null)[];game:{hand:Card[];counts:number[];turn:number;table:Combo|null;owner:number|null;passes:number;opening:boolean;winner:number|null;history:Move[];sequence:number;trick:number;score:number[]}|null};
export type RoomAction={type:string;cards?:unknown;character?:unknown;ready?:unknown;seat?:unknown};
export class RoomError extends Error{status:number;constructor(message:string,status=400){super(message);this.status=status;}}
export const ROOM_TTL=24*60*60*1000,ONLINE_MS=25_000;
export const seatOf=(state:RoomState,hash:string)=>state.players.findIndex(p=>p?.hash===hash);
export function newRoom(hash:string,name:string,character:number):RoomState{return {players:[{hash,name,character,ready:false},null,null,null],host:0,phase:'lobby',game:null,round:0,totals:[0,0,0,0],receipts:[],message:'',sessionStats:{completed:0,endedAt:null,members:[]}};}
export function validName(value:unknown){if(typeof value!=='string')throw new RoomError('Isi nama pemain.');const name=value.trim().replace(/\s+/g,' ');if(name.length<2||name.length>20||/[<>\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/.test(name))throw new RoomError('Nama 2–20 karakter, tanpa simbol kontrol.');return name;}
export function validCharacter(value:unknown):number{if(!Number.isInteger(value)||Number(value)<0||Number(value)>4)throw new RoomError('Pilih karakter TEKAD.');return Number(value);}
export function joinRoom(state:RoomState,hash:string,name:string,character:number){
 const existing=seatOf(state,hash);if(existing>=0)return state;
 if(state.phase!=='lobby')throw new RoomError('Ronde sedang berlangsung. Tunggu host membuka lobi lagi.',409);
 const seat=state.players.findIndex(p=>p===null);if(seat<0)throw new RoomError('Room sudah penuh.',409);
 if((state.sessionStats?.members.length??0)>=100)throw new RoomError('Batas pemain sesi tercapai. Minta host mengakhiri sesi dan membuat room baru.',409);
 if(state.players.some(p=>p?.name.toLocaleLowerCase()===name.toLocaleLowerCase()))throw new RoomError('Nama itu sudah dipakai di room ini.');
 if(state.players.some(p=>p?.character===character))character=[0,1,2,3,4].find(c=>!state.players.some(p=>p?.character===c))!;
 const next=structuredClone(state);next.players[seat]={hash,name,character,ready:false};
 // A returning member keeps their session points even when occupying a new seat.
 next.totals[seat]=state.sessionStats?.members.find(m=>m.hash===hash)?.total??0;return next;
}
export function transition(state:RoomState,seat:number,action:RoomAction,now:number,seen:number[],random:()=>number):RoomState{
 if(!state.players[seat])throw new RoomError('Kursi tidak tersedia.',403);
 if(state.phase==='closed')throw new RoomError('Room sudah ditutup.',410);
 if(state.phase==='ended')throw new RoomError('Sesi sudah berakhir. Rekap tetap bisa dibuka.',409);
 const next=structuredClone(state),member=next.players[seat]!;
 switch(action.type){
  case 'ready':if(state.phase!=='lobby'||typeof action.ready!=='boolean')throw new RoomError('Status siap hanya diubah di lobi.');member.ready=action.ready;break;
  case 'character':{
   if(state.phase!=='lobby')throw new RoomError('Ganti karakter setelah ronde selesai.');const c=validCharacter(action.character);
   if(state.players.some((p,i)=>i!==seat&&p?.character===c))throw new RoomError('Karakter itu sudah dipilih pemain lain.',409);member.character=c;member.ready=false;break;
  }
  case 'start':
   if(seat!==state.host)throw new RoomError('Hanya host yang bisa memulai.',403);
   if((state.sessionStats?.completed??0)>=200)throw new RoomError('Sesi mencapai 200 ronde. Akhiri sesi dan buat room baru.');
   if(state.phase!=='lobby'||state.players.some(p=>!p||!p.ready))throw new RoomError('Empat pemain harus menekan Siap.');
   if(seen.some(t=>now-t>ONLINE_MS))throw new RoomError('Tunggu semua pemain tersambung kembali.');
   next.game=createGame(random);next.phase='playing';next.round++;next.message='';break;
  case 'play':{
   if(state.phase!=='playing'||!state.game)throw new RoomError('Ronde belum berjalan.');
   if(!Array.isArray(action.cards)||action.cards.length>5||action.cards.some(c=>!Number.isInteger(c)||c<0||c>51))throw new RoomError('Pilihan kartu tidak valid.');
   try{next.game=act(state.game,seat,action.cards as Card[]);}catch(e){throw new RoomError(e instanceof Error?e.message:'Langkah tidak valid.');}
   if(next.game.winner!==null){
    const points=scores(next.game);next.phase='finished';next.totals=state.totals.map((s,i)=>s+points[i]);next.players.forEach(p=>{if(p)p.ready=false;});
    next.sessionStats??={completed:0,endedAt:null,members:[],includesEarlierScores:state.round>1};next.sessionStats.completed++;
    next.players.forEach((p,i)=>{if(!p)return;let row=next.sessionStats!.members.find(m=>m.hash===p.hash);if(!row){row={hash:p.hash,name:p.name,character:p.character,total:state.totals[i],wins:0,rounds:0};next.sessionStats!.members.push(row);}row.name=p.name;row.character=p.character;row.total+=points[i];row.rounds++;if(i===next.game!.winner)row.wins++;});
   }break;
  }
  case 'lobby':
   if(seat!==state.host)throw new RoomError('Tunggu host membuka lobi.',403);
   if(state.phase!=='finished')throw new RoomError('Ronde belum selesai.');next.phase='lobby';next.game=null;next.players.forEach(p=>{if(p)p.ready=false;});next.message='Ronde selesai. Tekan Siap untuk main lagi.';break;
  case 'cancel':
   if(seat!==state.host)throw new RoomError('Hanya host yang bisa membatalkan ronde.',403);
   if(state.phase!=='playing'||!seen.some((t,i)=>i!==seat&&now-t>60_000))throw new RoomError('Ronde hanya bisa dibatalkan jika pemain terputus lebih dari 1 menit.');
   next.phase='lobby';next.game=null;next.players.forEach(p=>{if(p)p.ready=false;});next.message='Ronde dibatalkan karena pemain terputus. Skor tidak berubah.';break;
  case 'end-session':
   if(seat!==state.host)throw new RoomError('Hanya host yang bisa mengakhiri sesi.',403);
   if(state.phase==='playing')throw new RoomError('Selesaikan ronde sebelum mengakhiri sesi.');
   next.sessionStats??={completed:0,endedAt:null,includesEarlierScores:state.round>0,members:state.players.flatMap((p,i)=>p?[{hash:p.hash,name:p.name,character:p.character,total:state.totals[i],wins:0,rounds:0}]:[])};
   next.sessionStats.endedAt=now;next.phase='ended';next.game=null;next.message='Sesi selesai. Rekap poin tersimpan.';break;
  case 'claim-host':
   if(now-seen[state.host]<=60_000)throw new RoomError('Host masih tersambung.');next.host=seat;next.message=`${member.name} menjadi host.`;break;
  case 'kick':{
   if(seat!==state.host||state.phase!=='lobby')throw new RoomError('Host hanya dapat mengeluarkan pemain di lobi.',403);
   const target=action.seat;if(!Number.isInteger(target)||Number(target)<0||Number(target)>3||target===seat||!state.players[Number(target)])throw new RoomError('Kursi tidak valid.');
   next.players[Number(target)]=null;next.totals[Number(target)]=0;break;
  }
  case 'leave':
   if(state.phase==='playing')throw new RoomError('Kursimu tetap disimpan sampai ronde selesai. Gunakan Tutup meja untuk keluar sementara.');
   next.players[seat]=null;next.totals[seat]=0;
   if(next.players.every(p=>!p)){next.phase='closed';next.game=null;}else if(seat===next.host)next.host=next.players.findIndex(Boolean);
   if(next.phase==='finished'){next.phase='lobby';next.game=null;next.players.forEach(p=>{if(p)p.ready=false;});}break;
  default:throw new RoomError('Aksi tidak dikenal.');
 }
 return next;
}
export function roomView(state:RoomState,seat:number,meta:{code:string;revision:number;expiresAt:number;seen:number[]},now:number):RoomView{
 if(!state.players[seat])throw new RoomError('Kursi ini tidak lagi terdaftar.',403);
 const g=state.game;
 // Deliberate allowlist. Never spread the private state into any API response.
 return {code:meta.code,revision:meta.revision,you:seat,host:state.host,phase:state.phase,round:state.round,expiresAt:meta.expiresAt,serverTime:now,message:state.message,
  session:{completed:state.sessionStats?.completed??0,endedAt:state.sessionStats?.endedAt??null,includesEarlierScores:state.sessionStats?.includesEarlierScores,standings:(state.sessionStats?.members??[]).map((m,i)=>({id:String(i),name:m.name,character:m.character,total:m.total,wins:m.wins,rounds:m.rounds,active:state.players.some(p=>p?.hash===m.hash)}))},
  players:state.players.map((p,i)=>p?{name:p.name,character:p.character,ready:p.ready,connected:now-meta.seen[i]<=ONLINE_MS,lastSeen:meta.seen[i],total:state.totals[i]}:null),
  game:g?{hand:[...g.hands[seat]],counts:g.hands.map(h=>h.length),turn:g.turn,table:g.table,owner:g.owner,passes:g.passes,opening:g.opening,winner:g.winner,history:g.history,sequence:g.sequence,trick:g.trick,score:g.winner===null?[0,0,0,0]:scores(g)}:null};
}
