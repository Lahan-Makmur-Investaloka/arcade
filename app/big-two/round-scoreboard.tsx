import type {Game} from './engine';
import {resultRows} from './portrait/atmosphere';
import './results.css';

export function RoundScoreboard({game,names}:{game:Game;names:string[]}){
 const rows=resultRows(game);
 return <section className="wc-round-score" aria-label="Peringkat ronde">
  <table><caption>Peringkat ronde</caption><thead><tr><th scope="col">Pemain</th><th scope="col">Sisa</th><th scope="col">Poin</th></tr></thead>
   <tbody>{rows.map(row=><tr key={row.seat} className={`${row.seat===0?'wc-score-you':''} ${row.seat===game.winner?'wc-score-winner':''}`}>
    <th scope="row"><span className="wc-score-rank">{1+rows.filter(other=>other.points>row.points).length}</span><span className="wc-score-name">{names[row.seat]}<small>{row.seat===0?'Kamu':row.seat===game.winner?'Pemenang':''}{row.seat===0&&row.seat===game.winner?' · Pemenang':''}</small></span></th>
    <td>{row.count}<small>{row.multiplier>1?` ×${row.multiplier}`:''}</small></td><td className={row.points>0?'wc-points-positive':'wc-points-negative'}>{row.points>0?'+':''}{row.points}</td>
   </tr>)}</tbody>
  </table><p className="wc-score-footnote">10–12 kartu ×2 · 13+ kartu ×3 · Poin sama, peringkat sama</p>
 </section>;
}
