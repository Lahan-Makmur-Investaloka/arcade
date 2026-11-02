// Convert wall time to a shared animation timeline. Damage lands at the same beat.
export const PARTY_IMPACT_MS=720,PARTY_RECOVERY_MS=700,ENEMY_RECOVERY_MS=760;
export function partyTime(t:number){return t<=180?t:t<=720?180+(t-180)/3:t<=880?360:360+t-880;}
export function enemyTime(t:number){return t<=900?t:t<=1620?900+(t-900)/2:t<=1780?1260:1260+t-1780;}
export const recoveryTime=(t:number)=>Math.max(0,t-160);
