import {roomDatabase,type RoomDatabase} from '../../../lib/big-two/database.ts';
import {joinRoom,newRoom,roomView,RoomError,ROOM_TTL,seatOf,transition,validCharacter,validName,type RoomState} from '../../../lib/big-two/room.ts';
export const dynamic='force-dynamic';
type Row={code:string;creator_hash:string;state:string;revision:number;seen0:number;seen1:number;seen2:number;seen3:number;created_at:number;expires_at:number};
type Payload={type:string;token:string;code?:string;requestId?:string;revision?:number;name?:unknown;character?:unknown;ready?:unknown;seat?:unknown;cards?:unknown};
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store, private','Vary':'Origin','X-Content-Type-Options':'nosniff'}});
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const secureRandom=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
const codeAlphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode(){let result='';while(result.length<6){const n=crypto.getRandomValues(new Uint8Array(1))[0];if(n<Math.floor(256/codeAlphabet.length)*codeAlphabet.length)result+=codeAlphabet[n%codeAlphabet.length];}return result;}
const seen=(row:Row)=>[row.seen0,row.seen1,row.seen2,row.seen3];
const view=(row:Row,seat:number,now:number)=>roomView(JSON.parse(row.state),seat,{code:row.code,revision:row.revision,expiresAt:row.expires_at,seen:seen(row)},now);
async function rate(db:RoomDatabase,key:string,limit:number,now:number,window=60_000){
 const bucket=Math.floor(now/window),id=`${key}:${bucket}`;
 const row=await db.prepare('INSERT INTO big_two_limits (id,hits,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET hits=hits+1 RETURNING hits').bind(id,(bucket+2)*window).first<{hits:number}>();
 if(!row||row.hits>limit)throw new RoomError('Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',429);
}
async function body(request:Request):Promise<Payload>{
 if(!request.headers.get('content-type')?.includes('application/json'))throw new RoomError('Gunakan JSON.',415);
 const reader=request.body?.getReader();if(!reader)throw new RoomError('Permintaan kosong.');let text='',bytes=0;const decoder=new TextDecoder();
 while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>8192){await reader.cancel();throw new RoomError('Permintaan terlalu besar.',413);}text+=decoder.decode(part.value,{stream:true});}text+=decoder.decode();
 let b;try{b=JSON.parse(text);}catch{throw new RoomError('Permintaan tidak valid.');}
 if(!b||typeof b!=='object'||Array.isArray(b)||typeof b.type!=='string'||typeof b.token!=='string'||!/^[a-f0-9]{64}$/.test(b.token))throw new RoomError('Identitas kursi tidak valid.',401);
 if(b.type!=='sync'&&b.type!=='away'&&(typeof b.requestId!=='string'||!/^[a-zA-Z0-9-]{16,64}$/.test(b.requestId)))throw new RoomError('ID permintaan tidak valid.');
 return b;
}
async function touch(db:RoomDatabase,row:Row,seat:number,owner:string,now:number){
 // Fixed, server-derived column; membership predicate prevents a stale occupant touching a replacement seat.
 const column=['seen0','seen1','seen2','seen3'][seat];
 if(now===0||now-seen(row)[seat]>4_000){await db.prepare(`UPDATE big_two_rooms SET ${column}=? WHERE code=? AND json_extract(state,?)=?`).bind(now,row.code,`$.players[${seat}].hash`,owner).run();}
 return {...row,[column]:now};
}
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('sec-fetch-site')==='cross-site')throw new RoomError('Permintaan lintas situs ditolak.',403);
  const b=await body(request),owner=await hash(b.token),db=roomDatabase(),now=Date.now();
  const signature=await hash(JSON.stringify({type:b.type,name:b.name,character:b.character,ready:b.ready,seat:b.seat,cards:b.cards}));
  if(b.type==='create'){
   const name=validName(b.name),character=validCharacter(b.character);
   let row=await db.prepare('SELECT * FROM big_two_rooms WHERE creator_hash=?').bind(owner).first<Row>();
   if(!row){
    const ip=request.headers.get('cf-connecting-ip')||'unknown';await rate(db,`create:${await hash(ip)}`,12,now,3_600_000);
    // Bounded, indexed cleanup; no active rooms are touched.
    await db.prepare("DELETE FROM big_two_rooms WHERE code IN (SELECT code FROM big_two_rooms WHERE expires_at<? AND json_extract(state,'$.phase')!='ended' LIMIT 100)").bind(now).run();
    await db.prepare('DELETE FROM big_two_limits WHERE id IN (SELECT id FROM big_two_limits WHERE expires_at<? LIMIT 100)').bind(now).run();
    const state=newRoom(owner,name,character);state.receipts.push({id:b.requestId!,hash:owner,signature});
    for(let i=0;i<3&&!row;i++){
     await db.prepare('INSERT OR IGNORE INTO big_two_rooms (code,creator_hash,state,revision,seen0,seen1,seen2,seen3,created_at,expires_at) VALUES (?,?,?,0,?,0,0,0,?,?)').bind(makeCode(),owner,JSON.stringify(state),now,now,now+ROOM_TTL).run();
     row=await db.prepare('SELECT * FROM big_two_rooms WHERE creator_hash=?').bind(owner).first<Row>();
    }
   }
   if(!row)throw new RoomError('Room belum berhasil dibuat. Coba lagi.',503);
   if(row.expires_at<=now||JSON.parse(row.state).phase==='closed')throw new RoomError('Room lama sudah berakhir. Buat room baru.',410);
   const seat=seatOf(JSON.parse(row.state),owner);if(seat<0)throw new RoomError('Kursi ini sudah keluar dari room.',403);
   return json({room:view(await touch(db,row,seat,owner,now),seat,now)});
  }
  if(typeof b.code!=='string'||!/^[A-Z2-9]{6}$/.test(b.code))throw new RoomError('Kode room terdiri dari 6 karakter.');
  if(b.type==='join'){const ip=request.headers.get('cf-connecting-ip')||'unknown';await rate(db,`join:${await hash(ip)}`,80,now,3_600_000);}
  let row=await db.prepare('SELECT * FROM big_two_rooms WHERE code=?').bind(b.code).first<Row>();
  if(!row)throw new RoomError('Room tidak ditemukan.',404);
  if(row.expires_at<=now&&JSON.parse(row.state).phase!=='ended')throw new RoomError('Room sudah kedaluwarsa. Buat room baru.',410);
  let state:RoomState=JSON.parse(row.state),seat=seatOf(state,owner);
  if(b.type==='join'&&seat<0){
   const next=joinRoom(state,owner,validName(b.name),validCharacter(b.character));seat=seatOf(next,owner);
   next.receipts.push({id:b.requestId!,hash:owner,signature});next.receipts=next.receipts.slice(-100);
   const column=['seen0','seen1','seen2','seen3'][seat];
   const result=await db.prepare(`UPDATE big_two_rooms SET state=?,revision=revision+1,${column}=? WHERE code=? AND revision=?`).bind(JSON.stringify(next),now,row.code,row.revision).run();
   if(!result.meta.changes){
    const fresh=await db.prepare('SELECT * FROM big_two_rooms WHERE code=?').bind(b.code).first<Row>();const own=fresh?seatOf(JSON.parse(fresh.state),owner):-1;
    if(fresh&&own>=0)return json({room:view(fresh,own,now)});
    throw new RoomError('Pemain lain baru bergabung. Coba masuk lagi.',409);
   }
   row={...row,state:JSON.stringify(next),revision:row.revision+1,[column]:now};return json({room:view(row,seat,now)});
  }
  if(seat<0){const receipt=state.receipts.find(r=>r.hash===owner&&r.id===b.requestId&&r.signature===signature);if(b.type==='leave'&&receipt)return json({left:true});throw new RoomError('Kursi tidak terdaftar atau sudah dikeluarkan. Masuk kembali ke room.',403);}
  // Closing a table records a final heartbeat. Zero would falsely mean the player
  // has already been absent for a minute, allowing immediate takeover/cancellation.
  if(b.type==='away'){await touch(db,row,seat,owner,now);return json({ok:true});}
  row=await touch(db,row,seat,owner,now);
  if(b.type==='sync'||b.type==='join')return json({room:view(row,seat,now)});
  await rate(db,`action:${owner}`,180,now);
  const receipt=state.receipts.find(r=>r.hash===owner&&r.id===b.requestId);
  if(receipt){if(receipt.signature!==signature)throw new RoomError('ID permintaan sudah dipakai untuk aksi lain.',409);return json({room:view(row,seat,now),replayed:true});}
  if(!Number.isInteger(b.revision)||b.revision!==row.revision)return json({room:view(row,seat,now),error:'Meja sudah berubah. Tampilan diperbarui; pilih langkah lagi.'},409);
  let next:RoomState;try{next=transition(state,seat,b,now,seen(row),secureRandom);}catch(e){if(e instanceof RoomError)return json({room:view(row,seat,now),error:e.message},e.status);throw e;}
  next.receipts.push({id:b.requestId!,hash:owner,signature});next.receipts=next.receipts.slice(-100);
  const result=await db.prepare('UPDATE big_two_rooms SET state=?,revision=revision+1 WHERE code=? AND revision=?').bind(JSON.stringify(next),row.code,row.revision).run();
  if(!result.meta.changes){
   const fresh=await db.prepare('SELECT * FROM big_two_rooms WHERE code=?').bind(b.code).first<Row>();if(!fresh)throw new RoomError('Room tidak ditemukan.',404);
   const st:RoomState=JSON.parse(fresh.state),own=seatOf(st,owner),done=st.receipts.find(r=>r.hash===owner&&r.id===b.requestId&&r.signature===signature);
   if(own<0){if(b.type==='leave'&&done)return json({left:true});throw new RoomError('Kursi sudah tidak terdaftar.',403);}
   return json({room:view(fresh,own,now),...(done?{replayed:true}:{error:'Langkah lain sudah masuk. Tampilan diperbarui.'})},done?200:409);
  }
  if(b.type==='leave')return json({left:true});
  return json({room:view({...row,state:JSON.stringify(next),revision:row.revision+1},seat,now)});
 }catch(e){if(e instanceof RoomError)return json({error:e.message},e.status);console.error('Big Two room unavailable',e instanceof Error?e.message:'unknown');return json({error:'Koneksi room terganggu. Coba sambungkan ulang; kartumu tetap tersimpan.'},503);}
}
