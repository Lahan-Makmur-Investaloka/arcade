import {rank,suit,sortCards,cardName,type Game} from '../engine';
export const SKILLS=[
 {name:'Read the Table',description:'Lihat semua kartu lawan berikutnya sampai akhir ronde.',needsCard:false},
 {name:'Rebuild',description:'Tukar 1 kartu pilihanmu dengan kartu acak lawan berikutnya.',needsCard:true},
 {name:'Helping Hand',description:'Tukar 1 kartu pilihanmu dengan kartu terendah dari lawan yang kartunya paling banyak.',needsCard:true},
 {name:'Adapt',description:'Tukar 1 kartu pilihanmu dengan lambang lebih tinggi pada angka yang sama, jika masih di tangan lawan.',needsCard:true},
 {name:'Breakthrough',description:'Buang 1 kartu pilihanmu tanpa mengubah kartu meja. Sisakan minimal 1 kartu untuk menang dengan banting.',needsCard:true},
] as const;
export type SkillState={used:boolean;message:string;reveal?:number};
export function activateSkill(game:Game,player:number,selected:number[],state:SkillState,random= Math.random):{game:Game;state:SkillState;error?:string}{
 const fail=(error:string)=>({game,state,error});
 if(state.used)return fail('Skill sudah dipakai ronde ini.');
 if(game.winner!==null||game.turn!==0)return fail('Gunakan skill saat giliranmu.');
 if(game.opening)return fail('Skill tersedia setelah pembukaan 3♦.');
 if(!Number.isInteger(player)||player<0||player>4)return fail('Karakter tidak valid.');
 if(player===0)return {game,state:{used:true,reveal:1,message:'Kartu lawan berikutnya terbuka sampai akhir ronde.'}};
 if(selected.length!==1||!game.hands[0].includes(selected[0]))return fail('Pilih tepat 1 kartu di tanganmu dahulu.');
 const card=selected[0];const next={...game,hands:game.hands.map(h=>[...h]),played:[...game.played]};
 if(player===4){if(next.hands[0].length<=1)return fail('Kartu terakhir harus dihabiskan dengan banting.');next.hands[0]=next.hands[0].filter(c=>c!==card);next.played.push(card);return {game:next,state:{used:true,message:`Breakthrough: ${cardName(card)} dibuang.`}};}
 let seat=1,target:number|undefined;
 if(player===1){const value=random();if(value<0||value>=1||!Number.isFinite(value))return fail('Pertukaran belum tersedia.');target=next.hands[seat][Math.floor(value*next.hands[seat].length)];}
 if(player===2){seat=[1,2,3].sort((a,b)=>next.hands[b].length-next.hands[a].length||a-b)[0];target=Math.min(...next.hands[seat]);}
 if(player===3){for(let s=1;s<4;s++)for(const c of next.hands[s])if(rank(c)===rank(card)&&suit(c)>suit(card)&&(target===undefined||c>target)){target=c;seat=s;}}
 if(target===undefined||!Number.isInteger(target))return fail('Tidak ada kartu yang cocok. Skill belum terpakai.');
 next.hands[0]=sortCards(next.hands[0].map(c=>c===card?target!:c));next.hands[seat]=sortCards(next.hands[seat].map(c=>c===target?card:c));
 return {game:next,state:{used:true,message:`${SKILLS[player].name}: ${cardName(card)} ditukar dengan ${cardName(target)}.`}};
}
