import * as THREE from "three";
import {advanceRaceClock,createRaceClock,RACE_STEP} from "../race-clock";
import {createHarborCourse,courseMap,sampleCourse} from "./course";
import {freshHarborInput,freshHarborState,harborPose,recoverHarbor,stepHarbor,type HarborInput,type HarborState} from "./simulation";
import {copyChaseCamera,freshChaseCamera,interpolateChaseCamera,stepChaseCamera,readyCameraTarget,type HarborPose} from "./camera";
import {createAnimeKart} from "./anime-kart";
import {createHarborWorld} from "./world";
import {createContactEffect} from "./contact-effect";
import {kartLateralExtent} from "./bounds";
import {cancelDrift,driftTier,DRIFT} from "./drift";
import {createDriftEffect} from "./drift-effect";

export type HarborPhase="ready"|"running"|"paused"|"finished";
export type HarborSnapshot={speed:number;lap:number;elapsed:number;offroad:boolean;impact:boolean;progress:number;mapX:number;mapY:number;recoveries:number;recovering:boolean;contactSide:number;impactStrength:number;drifting:boolean;driftCharge:number;driftTier:number;boostRemaining:number;boostTier:number;turboCount:number};
type Callbacks={onPhase:(phase:HarborPhase)=>void;onSnapshot:(state:HarborSnapshot)=>void;onMap:(path:string)=>void;onError:(message:string)=>void;onReady:()=>void};

export function createHarborRuntime(canvas:HTMLCanvasElement,callbacks:Callbacks){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x9bd1eb);scene.fog=new THREE.Fog(0x9bd1eb,180,550);
  const camera=new THREE.PerspectiveCamera(59,16/9,.15,700);
  scene.add(new THREE.HemisphereLight(0xd5f2ff,0x938475,2.25));
  const sun=new THREE.DirectionalLight(0xffe2b0,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-32;sun.shadow.camera.right=32;sun.shadow.camera.top=32;sun.shadow.camera.bottom=-32;sun.shadow.camera.near=1;sun.shadow.camera.far=180;sun.shadow.normalBias=.05;sun.shadow.bias=-.00015;scene.add(sun,sun.target);
  const course=createHarborCourse(),map=courseMap(course),world=createHarborWorld(course),kart=createAnimeKart();
  scene.add(world.root,kart.root);callbacks.onMap(map.path);
  const contactEffect=createContactEffect();scene.add(contactEffect.mesh);
  const driftEffect=createDriftEffect();scene.add(driftEffect.root);
  let state=freshHarborState(),input=freshHarborInput(),phase:HarborPhase="ready",disposed=false,failed=false,assetReady=false,raf=0;
  const held=new Map<keyof HarborInput,Set<string>>();
  let lastHud=0,visualTime=0,lastAlpha=1,compactReady=false;
  const chase=freshChaseCamera();
  let previousChase=copyChaseCamera(chase),previousPose=harborPose(state);
  const clock=createRaceClock(performance.now());
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  // Do not start an invisible kart while its artwork is loading.
  const atlasTexture=new THREE.TextureLoader().load("/racing/timmy-anime-atlas-v1.webp",texture=>{
    if(disposed){texture.dispose();return;}kart.setAtlas(texture);assetReady=true;callbacks.onReady();
  },undefined,()=>{if(!disposed)fail("Gambar Timmy belum berhasil dimuat. Periksa koneksi lalu coba lagi.");});
  const phaseTo=(value:HarborPhase)=>{phase=value;if(value==="paused")cancelDrift(state);input=freshHarborInput();held.clear();clock.remainder=0;clock.previous=performance.now();callbacks.onPhase(value);};
  const snapshot=()=>{
    const p=map.point(sampleCourse(course,state.distance));
    callbacks.onSnapshot({speed:Math.round(state.speed*3.6),lap:state.lap,elapsed:state.elapsed,offroad:state.offroad,impact:state.impact>0,progress:state.distance/course.length,mapX:p.x,mapY:p.y,recoveries:state.recoveries,recovering:state.recovering>0,contactSide:state.contactSide,impactStrength:state.impactStrength,drifting:state.driftSide!==0,driftCharge:state.driftCharge/DRIFT.secondCharge,driftTier:driftTier(state.driftCharge),boostRemaining:state.boostRemaining,boostTier:state.boostTier,turboCount:state.turboCount});
  };
  const resize=()=>{
    if(disposed)return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<1||rect.height<1)return;
    compactReady=rect.width<=600;
    renderer.setSize(rect.width,rect.height,false);camera.aspect=rect.width/rect.height;
    stepChaseCamera(chase,course,harborPose(state),camera.aspect,0,reduced.matches,true);
    previousChase=copyChaseCamera(chase);camera.fov=chase.fov;camera.updateProjectionMatrix();
  };
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
  const fail=(message:string)=>{if(failed||disposed)return;failed=true;cancelAnimationFrame(raf);phaseTo("paused");callbacks.onError(message);};
  const contextLost=(event:Event)=>{event.preventDefault();fail("Grafis 3D terhenti. Muat ulang lintasan untuk melanjutkan.");};
  canvas.addEventListener("webglcontextlost",contextLost);
  const render=(now:number)=>{
    if(disposed||failed)return;
    const steps=advanceRaceClock(clock,now,phase==="running");
    for(let i=0;i<steps&&phase==="running";i++){
      previousPose=harborPose(state);previousChase=copyChaseCamera(chase);
      const impacts=state.collisionCount;
      stepHarbor(state,input,course,RACE_STEP);visualTime+=RACE_STEP;
      contactEffect.update(RACE_STEP,reduced.matches);
      driftEffect.update(state,course,RACE_STEP,reduced.matches);
      if(state.collisionCount!==impacts&&!reduced.matches){
        const hit=sampleCourse(course,state.distance,state.lateral+state.contactSide*kartLateralExtent(state.heading));
        contactEffect.burst(new THREE.Vector3(hit.x,hit.y+.4,hit.z),new THREE.Vector3(-hit.tz*state.contactSide,0,hit.tx*state.contactSide),new THREE.Vector3(-hit.tx,0,-hit.tz),state.impactStrength);
      }
      stepChaseCamera(chase,course,harborPose(state),camera.aspect,RACE_STEP,reduced.matches);
      if(state.finished){phaseTo("finished");lastAlpha=1;}
    }
    if(phase==="running")lastAlpha=Math.max(0,Math.min(1,clock.remainder/RACE_STEP));
    const currentPose=harborPose(state),pose={} as HarborPose;
    for(const key of ["distance","lateral","heading","speed","lift"] as const)pose[key]=previousPose[key]+(currentPose[key]-previousPose[key])*lastAlpha;
    const p=sampleCourse(course,pose.distance,pose.lateral);
    kart.root.position.set(p.x,p.y+.035+(reduced.matches?0:pose.lift),p.z);
    kart.root.rotation.set(-Math.atan2(p.ty,Math.hypot(p.tx,p.tz)),Math.atan2(p.tx,p.tz)+pose.heading,0,"YXZ");
    world.update(visualTime,reduced.matches);
    const view=phase==="ready"?readyCameraTarget(course,camera.aspect,compactReady):interpolateChaseCamera(previousChase,chase,lastAlpha);
    camera.position.set(view.position.x,view.position.y,view.position.z);camera.lookAt(view.target.x,view.target.y,view.target.z);
    kart.update(state,visualTime,reduced.matches,camera);
    if(Math.abs(camera.fov-view.fov)>.001){camera.fov=view.fov;camera.updateProjectionMatrix();}
    sun.position.set(p.x-42,p.y+65,p.z-28);sun.target.position.set(p.x,p.y,p.z);
    try{renderer.render(scene,camera);}catch{fail("Grafis 3D terhenti. Coba muat ulang lintasan.");return;}
    if(now-lastHud>90||state.finished){lastHud=now;snapshot();}
    raf=requestAnimationFrame(render);
  };
  driftEffect.update(state,course,0,true);snapshot();raf=requestAnimationFrame(render);
  return {
    start(){if(failed||disposed||!assetReady)return;state=freshHarborState();visualTime=0;lastAlpha=1;contactEffect.update(0,true);driftEffect.update(state,course,0,true);previousPose=harborPose(state);stepChaseCamera(chase,course,previousPose,camera.aspect,0,reduced.matches,true);previousChase=copyChaseCamera(chase);phaseTo("running");snapshot();},
    pause(){if(phase==="running")phaseTo("paused");},
    resume(){if(phase==="paused"&&!failed)phaseTo("running");},
    recover(){if(phase!=="running"||!recoverHarbor(state))return;previousPose=harborPose(state);input=freshHarborInput();held.clear();snapshot();},
    setInput(key:keyof HarborInput,value:boolean,source="direct",cancelled=false){
      if(value&&(phase!=="running"||state.recovering>0))return;
      const sources=held.get(key)||new Set<string>();
      if(cancelled&&key==="drift"&&sources.has(source)&&sources.size===1)cancelDrift(state);
      if(value)sources.add(source);else sources.delete(source);
      held.set(key,sources);input[key]=sources.size>0;
    },
    setQuality(low:boolean){renderer.setPixelRatio(low?1:Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=!low;resize();},
    getState():Readonly<HarborState>{return {...state};},
    dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();canvas.removeEventListener("webglcontextlost",contextLost);
      const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();
      scene.traverse(o=>{if(o instanceof THREE.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m);if(o instanceof THREE.InstancedMesh)o.dispose();}});
      for(const g of geometries)g.dispose();for(const m of materials)m.dispose();atlasTexture.dispose();sun.shadow.map?.dispose();renderer.dispose();renderer.forceContextLoss();scene.clear();
    },
  };
}
export type HarborRuntime=ReturnType<typeof createHarborRuntime>;
