'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {PracticeBook} from './session-types';
const KEY='tekad-big-two-record-owner-v1';
export function usePracticeRecords(enabled:boolean){
 const [book,setBook]=useState<PracticeBook|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[deviceWarning,setDeviceWarning]=useState(false);
 const owner=useRef(''),mounted=useRef(true),lock=useRef(false);
 const request=useCallback(async(body:Record<string,unknown>):Promise<PracticeBook|null>=>{
  if(!owner.current||lock.current)return null;lock.current=true;setBusy(true);setError('');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{const response=await fetch('/api/big-two/practice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,token:owner.current}),signal:controller.signal,cache:'no-store'});const data=await response.json();if(!mounted.current)return null;if(data.book)setBook(data.book);if(!response.ok)throw Error(data.error||'Rekap belum tersimpan. Coba lagi.');return data.book;}
  catch(e){if(mounted.current)setError(e instanceof Error&&e.name!=='AbortError'&&e.name!=='TypeError'?e.message:'Koneksi terputus. Coba lagi; poin tidak akan dihitung dua kali.');return null;}
  finally{clearTimeout(timer);lock.current=false;if(mounted.current)setBusy(false);}
 },[]);
 useEffect(()=>{
  mounted.current=true;if(!enabled)return;
  try{const saved=localStorage.getItem(KEY);if(saved&&/^[a-f0-9]{64}$/.test(saved))owner.current=saved;}catch{setDeviceWarning(true);}
  if(!owner.current){owner.current=Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');try{localStorage.setItem(KEY,owner.current);}catch{setDeviceWarning(true);}}
  void request({type:'sync'});
  return()=>{mounted.current=false;};
 },[enabled,request]);
 return {book,busy,error,deviceWarning,request};
}
