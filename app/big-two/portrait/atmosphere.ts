import {scores,type Game} from '../engine';

export const DEAL_STEP_MS=115;
export const DEAL_FLIGHT_MS=320;
export const DEAL_SETTLE_MS=260;
export const REACTION_MS=620;
export type TablePreferences={sound:boolean;music:boolean;effectsVolume:number;musicVolume:number;motion:boolean};
export const DEFAULT_PREFERENCES:TablePreferences={sound:true,music:true,effectsVolume:.65,musicVolume:.22,motion:true};
const volume=(v:unknown,fallback:number)=>typeof v==='number'&&Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback;
export function readPreferences(raw:unknown):TablePreferences{
 const v=raw&&typeof raw==='object'?raw as Partial<TablePreferences>:{};
 return {sound:typeof v.sound==='boolean'?v.sound:true,music:typeof v.music==='boolean'?v.music:true,motion:v.motion!==false,effectsVolume:volume(v.effectsVolume,.65),musicVolume:volume(v.musicVolume,.22)};
}
/** A restored hand is already dealt. Never replay historic move sounds on hydration. */
export function moveSound(game:Game):'play'|'combo'|'pass'|'win'|null{
 const move=game.history.at(-1);if(!move)return null;
 return game.winner!==null?'win':move.kind==='pass'?'pass':move.cards.length===5?'combo':'play';
}
export function resultRows(game:Game){
 const points=scores(game);
 return game.hands.map((hand,seat)=>({seat,count:hand.length,multiplier:hand.length>=13?3:hand.length>=10?2:1,points:points[seat]})).sort((a,b)=>a.seat===game.winner?-1:b.seat===game.winner?1:b.points-a.points||a.seat-b.seat);
}
