export const CHARACTERS=[
 {id:'timmy',name:'Timmy',color:'#66c6ee',atlas:'timmy-atlas-v1.webp',hands:'hands-v3.webp'},
 {id:'eldric',name:'Eldric',color:'#e6b351',atlas:'eldric-atlas-v2.webp',hands:'hands-eldric-v1.webp'},
 {id:'kirana',name:'Kirana',color:'#7ac998',atlas:'kirana-atlas-v1.webp',hands:'hands-kirana-v1.webp'},
 {id:'adelia',name:'Adelia',color:'#bca3d7',atlas:'adelia-atlas-v1.webp',hands:'hands-adelia-v1.webp'},
 {id:'dylan',name:'Dylan',color:'#ed7f6d',atlas:'dylan-atlas-v1.webp',hands:'hands-dylan-v1.webp'},
] as const;
export type CharacterId=typeof CHARACTERS[number]['id'];
export function playerIndex(value:unknown):number{return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<CHARACTERS.length?value:0;}
/** Four seats; rotate the cast so the selected player never also appears as an opponent. */
export function tableCast(index:number){return Array.from({length:4},(_,seat)=>CHARACTERS[(playerIndex(index)+seat)%CHARACTERS.length]);}
