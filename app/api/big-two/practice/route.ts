import {roomDatabase} from '../../../../lib/big-two/database.ts';
import {restoreGame,scores} from '../../../big-two/engine.ts';
import type {PracticeBook,RoundRecord} from '../../../big-two/session-types.ts';
export const dynamic='force-dynamic';
const json=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store, private'}});
const digest=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join('');
type Row={state:string;revision:number};
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Permintaan lintas situs ditolak.'},403);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Gunakan JSON.'},415);
  const reader=request.body?.getReader();if(!reader)return json({error:'Permintaan kosong.'},400);
  let text='',bytes=0;const decoder=new TextDecoder();while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>24000){await reader.cancel();return json({error:'Permintaan terlalu besar.'},413);}text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();
  let b;try{b=JSON.parse(text);}catch{return json({error:'Permintaan tidak valid.'},400);}
  if(!b||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token)||!['sync','start','record','end'].includes(b.type))return json({error:'Identitas sesi tidak valid.'},400);
  const owner=await digest(b.token),db=roomDatabase(),now=Date.now();
  const bucket=Math.floor(now/60000),limit=await db.prepare('INSERT INTO big_two_limits (id,hits,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET hits=hits+1 RETURNING hits').bind(`practice:${owner}:${bucket}`,(bucket+2)*60000).first<{hits:number}>();
  if(!limit||limit.hits>120)return json({error:'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.'},429);
  const found=await db.prepare('SELECT state,revision FROM big_two_practice_records WHERE owner_hash=?').bind(owner).first<Row>();
  if(b.type==='sync')return json({book:found?JSON.parse(found.state):{active:null,history:[]}});
  if(typeof b.id!=='string'||!/^[a-zA-Z0-9-]{16,64}$/.test(b.id))return json({error:'ID sesi tidak valid.'},400);
  if(!found){
   const ip=await digest(request.headers.get('cf-connecting-ip')||'unknown'),hour=Math.floor(now/3600000);
   const creates=await db.prepare('INSERT INTO big_two_limits (id,hits,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET hits=hits+1 RETURNING hits').bind(`practice-create:${ip}:${hour}`,(hour+2)*3600000).first<{hits:number}>();
   if(!creates||creates.hits>30)return json({error:'Terlalu banyak sesi baru. Coba lagi nanti.'},429);
   await db.prepare('INSERT OR IGNORE INTO big_two_practice_records (owner_hash,state,revision,updated_at) VALUES (?,?,0,?)').bind(owner,JSON.stringify({active:null,history:[]}),now).run();
  }
  // Compare-and-swap makes retries and concurrent tabs safe, without a second score write.
  for(let attempt=0;attempt<3;attempt++){
   const row=await db.prepare('SELECT state,revision FROM big_two_practice_records WHERE owner_hash=?').bind(owner).first<Row>();if(!row)throw Error('Missing practice book');
   const book:PracticeBook=JSON.parse(row.state),existing=book.active?.id===b.id?book.active:book.history.find(r=>r.id===b.id);
   if(b.type==='start'){
    if(existing)return existing.endedAt?json({error:'Sesi ini sudah berakhir.',book},409):json({book});
    if(book.active)return json({error:'Masih ada sesi aktif. Lanjutkan atau akhiri sesi tersebut.',book},409);
    if(!Number.isInteger(b.player)||b.player<0||b.player>4)return json({error:'Karakter tidak valid.'},400);
    book.active={id:b.id,player:b.player,startedAt:now,endedAt:null,rounds:[]};
   }else if(b.type==='record'){
    if(!existing)return json({error:'Sesi tidak ditemukan.',book},404);
    const game=restoreGame(b.game);if(!game||game.winner===null||!Number.isInteger(b.round)||b.round<1)return json({error:'Hasil ronde tidak valid.'},400);
    const result:RoundRecord={round:b.round,winner:game.winner,points:scores(game),counts:game.hands.map(h=>h.length)};
    const prior=existing.rounds.find(r=>r.round===b.round);if(prior)return JSON.stringify(prior)===JSON.stringify(result)?json({book}):json({error:'Ronde ini sudah memiliki hasil lain.',book},409);
    if(existing.endedAt||b.round!==existing.rounds.length+1)return json({error:'Urutan ronde sudah berubah. Muat ulang rekap sesi.',book},409);
    if(existing.rounds.length>=200)return json({error:'Sesi sudah mencapai 200 ronde. Akhiri dan mulai sesi baru.',book},409);
    existing.rounds.push(result);
   }else{
    if(!existing)return json({error:'Sesi tidak ditemukan.',book},404);
    if(existing.endedAt)return json({book});
    existing.endedAt=now;book.history=[existing,...book.history].slice(0,20);book.active=null;
   }
   const saved=await db.prepare('UPDATE big_two_practice_records SET state=?,revision=revision+1,updated_at=? WHERE owner_hash=? AND revision=?').bind(JSON.stringify(book),now,owner,row.revision).run();
   if(saved.meta.changes)return json({book});
  }
  return json({error:'Sesi sedang diperbarui di tab lain. Coba lagi.'},409);
 }catch(e){console.error('Practice records unavailable',e instanceof Error?e.message:'unknown');return json({error:'Rekap belum tersimpan. Periksa koneksi lalu coba lagi.'},503);}
}
