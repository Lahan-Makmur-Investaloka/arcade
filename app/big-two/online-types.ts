import type {RoomView} from '../../lib/big-two/room';
import {RULESET,type Game} from './engine';
export type OnlineGame={view:RoomView;pending:boolean;connected:boolean;error?:string;canClaimHost?:boolean;retry?:boolean;onRetry?:()=>void;onAction:(type:string,extra?:Record<string,unknown>)=>Promise<void>;onExit:()=>void};
/** UI-only projection: opponent slots are unknown sentinels, never invented card identities. */
export function boardView(room:RoomView):Game|undefined{
 const g=room.game;if(!g)return undefined;const rel=(seat:number)=>(seat-room.you+4)%4;
 return {version:RULESET,hands:Array.from({length:4},(_,i)=>i===0?g.hand:Array(g.counts[(room.you+i)%4]).fill(-1)),played:[],turn:rel(g.turn),table:g.table,owner:g.owner===null?null:rel(g.owner),passes:g.passes,opening:g.opening,winner:g.winner===null?null:rel(g.winner),history:g.history.map(m=>({...m,seat:rel(m.seat)})),sequence:g.sequence,trick:g.trick};
}
