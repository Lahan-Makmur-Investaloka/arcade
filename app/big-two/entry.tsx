'use client';
import {useEffect,useState} from 'react';
import BigTwo from './game';
import Multiplayer from './multiplayer';
export default function BigTwoEntry(){
 const [online,setOnline]=useState(false);
 useEffect(()=>{if(new URLSearchParams(location.search).has('room'))setOnline(true);},[]);
 return online?<Multiplayer onBack={()=>setOnline(false)}/>:<BigTwo onMultiplayer={()=>setOnline(true)}/>;
}
