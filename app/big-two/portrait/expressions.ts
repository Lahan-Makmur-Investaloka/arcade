export type Mood='normal'|'anxious'|'smug';
export type Pose=Mood|'choose'|'play'|'pass';
export function moodFor(counts:readonly number[],seat:number):Mood {
 if(counts[seat]>0&&counts[seat]<=3)return 'smug';
 return counts.some(n=>n>0&&n<=3)&&counts[seat]>3?'anxious':'normal';
}
export function poseFor({counts,seat,choosing=false,action,preview}:{counts:readonly number[];seat:number;choosing?:boolean;action?:'play'|'pass';preview?:Pose|null}):Pose {
 return preview??action??(choosing?'choose':moodFor(counts,seat));
}
export const POSE_INDEX:Record<Pose,number>={normal:0,choose:1,play:2,anxious:3,smug:4,pass:5};
export const POSE_LABEL:Record<Pose,string>={normal:'Fokus',choose:'Memilih kartu',play:'Banting!',anxious:'Cemas',smug:'Percaya diri',pass:'Pass'};
