import type { Metadata } from 'next';
import Jrpg from './jrpg-game';
export const metadata: Metadata={title:'Saving Twilight',description:'A TEKAD fantasy adventure. Lead the TEKAD party in tactical turn-based combat.'};
export default function Page(){return <Jrpg/>;}
