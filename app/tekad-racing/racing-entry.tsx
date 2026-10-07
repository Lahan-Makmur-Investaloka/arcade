"use client";
import {lazy,Suspense,useState} from "react";
import HarborGame from "./harbor/harbor-game";
const NeonGame=lazy(()=>import("./racing-game"));
export default function RacingEntry(){
  const [neon,setNeon]=useState(false);
  if(!neon)return <HarborGame onNeon={()=>setNeon(true)}/>;
  return <><div className="racing-course-return"><button onClick={()=>setNeon(false)}>Latihan Pelabuhan</button></div><Suspense fallback={<p role="status">Menyiapkan Sirkuit Neon…</p>}><NeonGame/></Suspense></>;
}
