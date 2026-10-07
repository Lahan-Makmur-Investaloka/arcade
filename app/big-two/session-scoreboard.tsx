import {CAST,seatCast} from './presentation';
import {practiceTotals,type PracticeRecord,type SessionSummary} from './session-types';
import './session.css';
export const signed=(n:number)=>`${n>0?'+':''}${n}`;
export function practiceSummary(record:PracticeRecord):SessionSummary{
 const totals=practiceTotals(record);
 return {completed:record.rounds.length,endedAt:record.endedAt,standings:seatCast(record.player).map((p,i)=>({id:String(i),name:`${p.name}${i===0?' · Kamu':''}`,character:CAST.findIndex(c=>c.id===p.id),total:totals[i],wins:record.rounds.filter(r=>r.winner===i).length,rounds:record.rounds.length}))};
}
export function SessionScoreboard({summary,points,title='Peringkat sesi'}:{summary:SessionSummary;points?:Record<string,number>;title?:string}){
 const rows=[...summary.standings].sort((a,b)=>b.total-a.total);
 return <section className="b2-session-score" aria-label={title}>
  <header><h3>{title}</h3><span>{summary.completed} ronde {summary.includesEarlierScores?'tercatat':'selesai'}</span></header>
  {summary.includesEarlierScores&&<p className="b2-session-status">Poin lama tetap masuk total. Rincian kemenangan dicatat mulai pembaruan ini.</p>}
  {rows.length?<><div className="b2-session-columns" aria-hidden="true"><span>Pemain</span><span>{points?'Ronde':'Menang'}</span><span>Total</span></div>
   <ol>{rows.map(row=><li key={row.id}><span className="b2-session-rank">{1+rows.filter(r=>r.total>row.total).length}</span><div className="b2-session-player"><strong>{row.name}</strong><small>{row.rounds} ronde · {row.wins} menang{row.active===false?' · Keluar':''}</small></div><span className="b2-session-delta">{points?points[row.id]===undefined?'—':signed(points[row.id]):row.wins}</span><b className={row.total>0?'positive':row.total<0?'negative':''}>{signed(row.total)}</b></li>)}</ol></>:<p>Belum ada ronde yang selesai.</p>}
 </section>;
}
