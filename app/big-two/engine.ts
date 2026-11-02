/** Shared, deterministic Big Two rules. No rendering, timers, storage or hidden-hand AI access. */
export const RULESET = 'tekad-big-two-1';
export const RANKS = ['3','4','5','6','7','8','9','10','J','Q','K','A','2'] as const;
export const SUITS = ['♦','♣','♥','♠'] as const;
export const SUIT_NAMES = ['wajik','keriting','hati','sekop'] as const;
export type Card = number; // rank * 4 + suit; 3♦ = 0, 2♠ = 51
export type ComboKind = 'single'|'pair'|'triple'|'straight'|'flush'|'full-house'|'four-kind'|'straight-flush';
export type Combo = {cards:Card[];kind:ComboKind;size:number;tier:number;key:number[]};
export type Move = {seat:number;cards:Card[];kind:ComboKind|'pass';id:number;newTrick:boolean};
export type Game = {version:typeof RULESET;hands:Card[][];played:Card[];turn:number;table:Combo|null;owner:number|null;passes:number;opening:boolean;winner:number|null;history:Move[];sequence:number;trick:number};
export const LABELS:Record<ComboKind,string>={single:'Single',pair:'Pair',triple:'Triple',straight:'Straight',flush:'Flush','full-house':'Full house','four-kind':'Four of a kind','straight-flush':'Straight flush'};
export const rank=(card:Card)=>Math.floor(card/4);
export const suit=(card:Card)=>card%4;
export const cardName=(card:Card)=>`${RANKS[rank(card)]} ${SUIT_NAMES[suit(card)]}`;
export const sortCards=(cards:Card[],bySuit=false)=>[...cards].sort((a,b)=>bySuit?suit(a)-suit(b)||a-b:a-b);
export function compareKey(a:number[],b:number[]){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]??0)-(b[i]??0);if(d)return d;}return 0;}

/** Straight order: A2345 < 23456 < 34567 ... < TJQKA. No wrapping. */
function straightKey(cards:Card[]):number[]|null{
 const natural=cards.map(c=>({card:c,value:rank(c)===12?2:rank(c)+3})).sort((a,b)=>a.value-b.value);
 if(new Set(natural.map(c=>c.value)).size!==5)return null;
 if(natural.map(c=>c.value).join(',')==='2,3,4,5,14')return [5,suit(natural.find(c=>c.value===5)!.card)];
 if(natural.every((c,i)=>!i||c.value===natural[i-1].value+1))return [natural[4].value,suit(natural[4].card)];
 return null;
}
export function classify(input:Card[]):Combo|null{
 if(![1,2,3,5].includes(input.length)||input.some(c=>!Number.isInteger(c)||c<0||c>51)||new Set(input).size!==input.length)return null;
 const cards=sortCards(input),size=cards.length,groups=new Map<number,Card[]>();
 for(const c of cards)groups.set(rank(c),[...(groups.get(rank(c))??[]),c]);
 const make=(kind:ComboKind,tier:number,key:number[]):Combo=>({cards,kind,size,tier,key});
 if(size===1)return make('single',0,[cards[0]]);
 if(size===2||size===3)return groups.size===1?make(size===2?'pair':'triple',0,[rank(cards[0]),suit(cards[size-1])]):null;
 const straight=straightKey(cards),flush=cards.every(c=>suit(c)===suit(cards[0]));
 if(straight&&flush)return make('straight-flush',4,straight);
 const quads=[...groups].find(([,g])=>g.length===4);if(quads)return make('four-kind',3,[quads[0]]);
 const triple=[...groups].find(([,g])=>g.length===3);if(triple&&groups.size===2)return make('full-house',2,[triple[0]]);
 if(flush)return make('flush',1,[suit(cards[0]),...cards.map(rank).reverse()]);
 return straight?make('straight',0,straight):null;
}
export function beats(candidate:Combo,table:Combo|null){return !table||(candidate.size===table.size&&(candidate.tier>table.tier||(candidate.tier===table.tier&&compareKey(candidate.key,table.key)>0)));}
export function combinations(cards:Card[],count:number):Card[][]{
 const result:Card[][]=[];const visit=(start:number,picked:Card[])=>{if(picked.length===count){result.push(picked);return;}for(let i=start;i<=cards.length-(count-picked.length);i++)visit(i+1,[...picked,cards[i]]);};visit(0,[]);return result;
}
export function legalPlays(hand:Card[],table:Combo|null,opening=false):Combo[]{
 const sizes=table?[table.size]:[1,2,3,5];const result:Combo[]=[];
 for(const size of sizes)for(const cards of combinations(hand,size)){if(opening&&!cards.includes(0))continue;const combo=classify(cards);if(combo&&beats(combo,table))result.push(combo);}
 return result.sort((a,b)=>a.size-b.size||a.tier-b.tier||compareKey(a.key,b.key));
}
export function createGame(random:()=>number=Math.random):Game{
 const deck=Array.from({length:52},(_,i)=>i);
 for(let i=51;i>0;i--){const n=random();if(!Number.isFinite(n)||n<0||n>=1)throw Error('Invalid random source');const j=Math.floor(n*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
 const hands=Array.from({length:4},(_,seat)=>sortCards(deck.filter((_,i)=>i%4===seat)));
 return {version:RULESET,hands,played:[],turn:hands.findIndex(h=>h.includes(0)),table:null,owner:null,passes:0,opening:true,winner:null,history:[],sequence:0,trick:1};
}
export function explainMove(game:Game,seat:number,cards:Card[]):string|null{
 if(game.winner!==null)return 'Ronde sudah selesai.';
 if(game.turn!==seat)return 'Tunggu giliranmu.';
 if(!cards.length)return !game.table?'Pilih kartu untuk membuka putaran.':null;
 if(cards.some(c=>!game.hands[seat]?.includes(c)))return 'Kartu itu tidak ada di tanganmu.';
 const combo=classify(cards);if(!combo)return 'Pilih 1 kartu, pair, triple, atau kombinasi 5 kartu.';
 if(game.opening&&!cards.includes(0))return 'Pembukaan harus menyertakan 3♦.';
 if(game.table&&combo.size!==game.table.size)return `Balas dengan ${game.table.size} kartu.`;
 if(!beats(combo,game.table))return 'Kombinasimu belum mengalahkan kartu di meja.';
 return null;
}
export function act(game:Game,seat:number,cards:Card[]):Game{
 const error=explainMove(game,seat,cards);if(error)throw Error(error);
 const next:Game={...game,hands:game.hands.map(h=>[...h]),played:[...game.played],sequence:game.sequence+1,history:[...game.history]};
 let newTrick=false;
 if(!cards.length){next.passes++;if(next.passes===3){next.turn=next.owner!;next.table=null;next.owner=null;next.passes=0;next.trick++;newTrick=true;}else next.turn=(seat+1)%4;}
 else{const combo=classify(cards)!;next.hands[seat]=next.hands[seat].filter(c=>!cards.includes(c));next.played.push(...combo.cards);next.table=combo;next.owner=seat;next.passes=0;next.opening=false;next.turn=(seat+1)%4;if(!next.hands[seat].length)next.winner=seat;}
 next.history.push({seat,cards:sortCards(cards),kind:cards.length?next.table!.kind:'pass',id:next.sequence,newTrick});next.history=next.history.slice(-40);return next;
}

/** Bots see their own hand, public table/counts and discards only. */
export function chooseBotMove(hand:Card[],table:Combo|null,opening:boolean,opponentCounts:number[]):Card[]{
 const moves=legalPlays(hand,table,opening);if(!moves.length)return [];
 const winning=moves.find(m=>m.size===hand.length);if(winning)return winning.cards;
 const danger=Math.min(...opponentCounts)<=2;
 // Preserve combinations and control cards. Lead with long combinations to reduce hand size.
 const utility=(move:Combo)=>{
  const remaining=hand.filter(c=>!move.cards.includes(c));const counts=new Map<number,number>();for(const c of remaining)counts.set(rank(c),(counts.get(rank(c))??0)+1);
  const singles=[...counts.values()].filter(n=>n===1).length;
  const highCost=move.cards.reduce((s,c)=>s+Math.max(0,rank(c)-8),0);
  return move.size*(table?3:18)-singles*2-highCost*1.5-move.tier*.6-move.key[0]*.025+(danger&&move.size===1?move.cards[0]*.7:0);
 };
 return [...moves].sort((a,b)=>utility(b)-utility(a)||a.tier-b.tier||compareKey(a.key,b.key))[0].cards;
}
export function penalty(count:number){return count*(count>=13?3:count>=10?2:1);}
export function scores(game:Game){const p=game.hands.map(h=>penalty(h.length));return p.map((value,i)=>i===game.winner?p.reduce((a,b)=>a+b,0):-value);}

export function restoreGame(value:unknown,maxHand=13):Game|null{
 if(!value||typeof value!=='object')return null;
 const g=value as Game;
 if(g.version!==RULESET||!Array.isArray(g.hands)||g.hands.length!==4||!Array.isArray(g.played)||!Array.isArray(g.history)||g.history.length>40)return null;
 if(g.hands.some(h=>!Array.isArray(h)||h.length>maxHand))return null;
 const all=[...g.hands.flat(),...g.played];if(all.length!==52||new Set(all).size!==52||all.some(c=>!Number.isInteger(c)||c<0||c>51))return null;
 if(!Number.isInteger(g.turn)||g.turn<0||g.turn>3||!Number.isInteger(g.passes)||g.passes<0||g.passes>2||typeof g.opening!=='boolean'||!Number.isInteger(g.sequence)||g.sequence<0||!Number.isInteger(g.trick)||g.trick<1)return null;
 if(g.winner!==null&&(!Number.isInteger(g.winner)||g.winner<0||g.winner>3||g.hands[g.winner].length!==0))return null;
 if(g.winner===null&&g.hands.some(h=>h.length===0))return null;
 if(g.table){if(!Array.isArray(g.table.cards))return null;const c=classify(g.table.cards);if(!c||g.owner===null||!Number.isInteger(g.owner)||g.owner<0||g.owner>3||c.cards.some(c=>!g.played.includes(c)))return null;g.table=c;}
 else if(g.owner!==null||g.passes!==0)return null;
 if(g.opening&&(g.played.length||g.table||!g.hands[g.turn].includes(0)))return null;
 if(g.history.some(m=>!m||!Number.isInteger(m.seat)||m.seat<0||m.seat>3||!Array.isArray(m.cards)||m.cards.some(c=>!Number.isInteger(c)||c<0||c>51)||(!Object.keys(LABELS).includes(m.kind)&&m.kind!=='pass')))return null;
 return g;
}
