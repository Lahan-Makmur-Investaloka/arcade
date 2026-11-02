export type RoundRecord={round:number;winner:number;points:number[];counts:number[]};
export type PracticeRecord={id:string;player:number;startedAt:number;endedAt:number|null;rounds:RoundRecord[]};
export type PracticeBook={active:PracticeRecord|null;history:PracticeRecord[]};
export type SessionStanding={id:string;name:string;character:number;total:number;wins:number;rounds:number;active?:boolean};
export type SessionSummary={completed:number;endedAt:number|null;standings:SessionStanding[];includesEarlierScores?:boolean};
export const practiceTotals=(record:PracticeRecord)=>[0,1,2,3].map(i=>record.rounds.reduce((sum,r)=>sum+r.points[i],0));
