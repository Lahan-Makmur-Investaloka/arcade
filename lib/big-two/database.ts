export type Statement={bind(...values:unknown[]):Statement;first<T=Record<string,unknown>>():Promise<T|null>;run():Promise<{meta:{changes?:number}}>};
export type RoomDatabase={prepare(sql:string):Statement};
export function roomDatabase():RoomDatabase{const db=(globalThis as typeof globalThis & {__TEKAD_DB__?:RoomDatabase}).__TEKAD_DB__;if(!db)throw Error('Room database unavailable');return db;}
