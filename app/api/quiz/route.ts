import { advance, createGame, publicGame } from '../../../lib/quiz/engine.mjs';
export const dynamic='force-dynamic';
type Row={id:string;owner_hash:string;display_name:string;state:string;revision:number;status:string};
const json=(v:unknown,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
function db(){const d=(globalThis as typeof globalThis & {__TEKAD_DB__?:D1Database}).__TEKAD_DB__;if(!d)throw Error('DB unavailable');return d;}
const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('');
function view(row:Row,now:number){return {id:row.id,revision:row.revision,...publicGame(JSON.parse(row.state),now)};}
export async function GET(){try{const rows=await db().prepare(`WITH scored AS (
 SELECT display_name, owner_hash, score, elapsed_ms, updated_at,
 (SELECT COUNT(DISTINCT seen.value) FROM json_each(quiz_sessions.state,'$.seen') AS seen
  WHERE seen.value IN (SELECT value FROM json_each(quiz_sessions.state,'$.deck'))) AS reached
 FROM quiz_sessions WHERE status='ended' AND score>0
), ranked AS (
 SELECT *, ROW_NUMBER() OVER (PARTITION BY owner_hash ORDER BY score DESC, reached DESC, elapsed_ms ASC, updated_at ASC) AS rank FROM scored
)
SELECT display_name AS name, score, reached, elapsed_ms AS elapsed FROM ranked WHERE rank=1
ORDER BY score DESC, reached DESC, elapsed_ms ASC, updated_at ASC LIMIT 30`).all();return json({rows:rows.results});}catch{return json({error:'Leaderboard belum bisa dimuat. Coba lagi.'},503);}}
export async function POST(request:Request){try{
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return json({error:'Origin tidak sesuai.'},403);
 const raw=await request.text();if(raw.length>4096)return json({error:'Permintaan terlalu besar.'},413);
 let b;try{b=JSON.parse(raw);}catch{return json({error:'Permintaan tidak valid.'},400);}
 if(!b||typeof b.key!=='string'||! /^[a-f0-9]{64}$/.test(b.key))return json({error:'Identitas perangkat tidak valid. Muat ulang halaman.'},400);
 const owner=await hash(b.key);const d=db();let now=Date.now();
 if(b.type==='start'){
  const name=typeof b.name==='string'?b.name.trim().replace(/\s+/g,' '):'';if(name.length<2||name.length>24||/[\u0000-\u001f\u007f<>]/.test(name))return json({error:'Nama 2–24 karakter, tanpa tanda < atau >.'},400);
  // One unfinished game per device. A retry resumes instead of creating another run.
  let row=await d.prepare("SELECT * FROM quiz_sessions WHERE owner_hash=? AND status!='ended' LIMIT 1").bind(owner).first<Row>();
  if(!row){const id=crypto.randomUUID();const state=createGame(name);await d.prepare("INSERT OR IGNORE INTO quiz_sessions (id,owner_hash,display_name,state,revision,status,score,elapsed_ms,created_at,updated_at) VALUES (?,?,?,?,0,'ready',0,0,?,?)").bind(id,owner,name,JSON.stringify(state),now,now).run();row=await d.prepare("SELECT * FROM quiz_sessions WHERE owner_hash=? AND status!='ended' LIMIT 1").bind(owner).first<Row>();}
  if(!row)return json({error:'Sesi belum terbentuk. Coba lagi.'},503);
  // Continue through sync below, including an expired active run.
  b={...b,id:row.id,type:'sync'};
 }
 if(typeof b.id!=='string'||b.id.length>64)return json({error:'Sesi tidak ditemukan.'},400);
 let row=await d.prepare('SELECT * FROM quiz_sessions WHERE id=? AND owner_hash=?').bind(b.id,owner).first<Row>();if(!row)return json({error:'Sesi tidak ditemukan di perangkat ini.'},404);
 const original=JSON.parse(row.state);now=Date.now();
 // Every mutation uses a compare-and-swap revision; stale tabs cannot replay answers.
 if(b.type!=='sync'&&b.revision!==row.revision)return json({game:view(row,now),error:'Sesi berubah di tab lain. Tampilan sudah diperbarui.'},409);
 let state;try{state=advance(original,b,now);}catch(e){return json({game:view(row,now),error:e instanceof Error?e.message:'Aksi tidak valid.'},400);}
 const encoded=JSON.stringify(state);
 if(encoded!==row.state){const result=await d.prepare('UPDATE quiz_sessions SET state=?,revision=revision+1,status=?,score=?,elapsed_ms=?,updated_at=? WHERE id=? AND owner_hash=? AND revision=?').bind(encoded,state.phase,state.score,state.elapsed,now,row.id,owner,row.revision).run();
  if(!result.meta.changes){row=(await d.prepare('SELECT * FROM quiz_sessions WHERE id=? AND owner_hash=?').bind(row.id,owner).first<Row>())!;return json({game:view(row,Date.now()),error:'Sesi berubah. Silakan lanjut dari tampilan terbaru.'},409);}
  row={...row,state:encoded,revision:row.revision+1,status:state.phase};
 }
 return json({game:view(row,Date.now())});
 }catch(e){console.error('Quiz API failed',e instanceof Error?e.message:'unknown');return json({error:'Koneksi permainan terganggu. Coba sambungkan ulang; timer tetap berjalan.'},503);}}
