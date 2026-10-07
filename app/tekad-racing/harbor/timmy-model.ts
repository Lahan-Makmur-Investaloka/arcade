import * as THREE from "three";
import {roundedBox,tube,shell,noseProfile,noseLivery,hairLock,glassesFrame,timmyFace,batchRigid} from "./kart-geometry";

export function createTimmyModel(){
  const root=new THREE.Group(),chassis=new THREE.Group(),driver=new THREE.Group(),head=new THREE.Group();
  root.name="timmy-kart";chassis.name="suspension";driver.name="driver-lean";head.name="timmy-head";
  root.add(chassis);chassis.add(driver);driver.add(head);
  const material=(name:string,color:number,roughness:number,metalness=0)=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness});m.name=name;return m;};
  const mats={paint:material("cobalt-enamel",0x165fd0,.3,.25),navy:material("navy-composite",0x11243c,.7,.08),cyan:material("cyan-trim",0x53d4ec,.4,.2),silver:material("brushed-alloy",0xb9c9d4,.28,.65),darkMetal:material("graphite-alloy",0x33434e,.45,.5),rubber:material("tire-rubber",0x182027,.9),tread:material("rubber-grooves",0x283039,.95),ivory:material("ivory-markings",0xf0f6f2,.5),cloth:material("blue-race-suit",0x154a98,.92),skin:material("warm-skin",0xe5ad82,.85),hair:material("black-hair",0x151b24,.68),hairLight:material("hair-facets",0x24303d,.66),iris:material("brown-eyes",0x492d1f,.75),mouth:material("mouth-line",0x8e5649,.8),lamp:material("rear-lamps",0xff3a24,.32)};
  mats.lamp.emissive.setHex(0xb52612);mats.lamp.emissiveIntensity=.35;
  const part=(parent:THREE.Object3D,g:THREE.BufferGeometry,m:THREE.Material,p:number[]=[0,0,0],r:number[]=[0,0,0],scale?:number[])=>{
    const mesh=new THREE.Mesh(g,m);mesh.position.set(p[0],p[1],p[2]);mesh.rotation.set(r[0],r[1],r[2]);if(scale)mesh.scale.set(scale[0],scale[1],scale[2]);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
  };
  const box=(parent:THREE.Object3D,size:number[],p:number[],m:THREE.Material,r?:number[])=>part(parent,roundedBox(size[0],size[1],size[2]),m,p,r);
  const oval=(parent:THREE.Object3D,p:number[],scale:number[],m:THREE.Material)=>part(parent,new THREE.SphereGeometry(1,20,14),m,p,[0,0,0],scale);
  const rod=(parent:THREE.Object3D,points:number[][],radius:number,m:THREE.Material)=>part(parent,tube(points,radius),m);
  box(chassis,[1.3,.17,2.64],[0,.36,-.03],mats.navy);
  part(chassis,shell(1.3,noseProfile),mats.paint,[0,0,.22]);
  const liveryMaterial=material("generated-hood-livery",0x165fd0,.34,.18);
  const livery=part(chassis,noseLivery(),liveryMaterial);livery.name="curved-livery-panel";
  for(const side of [-1,1]){
    part(chassis,shell(1.46,t=>({width:.16+Math.sin(t*Math.PI)*.065,height:.15+Math.sin(t*Math.PI)*.045,center:.58})),mats.paint,[side*.70,0,-.70]);
    rod(chassis,[[side*.79,.64,-.64],[side*.89,.66,-.12],[side*.82,.64,.64]],.025,mats.cyan);
    box(chassis,[.026,.13,.45],[side*.913,.52,-.15],mats.navy);
    for(let n=0;n<4;n++)box(chassis,[.026,.095,.028],[side*.93,.53,-.31+n*.1],mats.silver,[.12,0,.3*side]);
    rod(chassis,[[side*.42,.32,-.95],[side*.75,.3,-.93],[side*.96,.38,-.93]],.035,mats.silver);
    rod(chassis,[[side*.42,.32,.86],[side*.75,.29,.96],[side*.94,.38,.96]],.035,mats.silver);
  }
  rod(chassis,[[-.79,.39,1.37],[-.73,.4,1.54],[0,.4,1.58],[.73,.4,1.54],[.79,.39,1.37]],.045,mats.silver);
  box(chassis,[1.08,.12,.13],[0,.35,1.53],mats.navy);
  box(chassis,[.83,.18,.71],[0,.64,-.15],mats.navy);
  box(chassis,[.76,.72,.16],[0,.97,-.52],mats.navy,[-.13,0,0]);
  box(chassis,[.58,.54,.075],[0,1.0,-.41],mats.cloth,[-.13,0,0]);
  for(const side of [-1,1])box(chassis,[.1,.51,.15],[side*.35,1.03,-.43],mats.navy,[-.13,0,-side*.15]);
  box(chassis,[.68,.35,.52],[0,.72,-1.0],mats.darkMetal);
  for(let n=0;n<5;n++)box(chassis,[.74,.035,.46],[0,.59+n*.065,-1.0],mats.silver);
  for(const side of [-1,1]){
    box(chassis,[.085,.32,.1],[side*.47,.70,-1.34],mats.darkMetal);
    box(chassis,[.28,.11,.075],[side*.55,.53,-1.45],mats.lamp);
    box(chassis,[.04,.17,.28],[side*.77,.86,-1.31],mats.paint);
  }
  box(chassis,[1.55,.09,.28],[0,.84,-1.30],mats.paint);
  box(chassis,[1.35,.018,.065],[0,.895,-1.26],mats.cyan);
  rod(chassis,[[-.83,.32,-1.36],[-.74,.3,-1.52],[.74,.3,-1.52],[.83,.32,-1.36]],.04,mats.silver);
  part(chassis,new THREE.CylinderGeometry(.11,.11,.58,14),mats.silver,[.6,.66,-1.13],[Math.PI/2,0,0]);
  part(chassis,new THREE.TorusGeometry(.095,.024,6,16),mats.darkMetal,[.6,.66,-1.43]);
  part(chassis,new THREE.CircleGeometry(.076,16),mats.navy,[.6,.66,-1.44],[0,Math.PI,0]);

  const wheels:{pivot:THREE.Group;spin:THREE.Group;front:boolean}[]=[];
  const tireProfile=[[.245,-.17],[.31,-.18],[.36,-.14],[.38,-.09],[.383,0],[.38,.09],[.36,.14],[.31,.18],[.245,.17]].map(p=>new THREE.Vector2(...p as [number,number]));
  for(const side of [-1,1])for(const z of [-.93,.96]){
    const pivot=new THREE.Group(),spin=new THREE.Group();pivot.name=z>0?"front-steering":"rear-axle";spin.name="spinning-wheel";pivot.position.set(side*.94,.383,z);pivot.add(spin);root.add(pivot);
    part(spin,new THREE.LatheGeometry(tireProfile,24),mats.rubber,[0,0,0],[0,0,Math.PI/2]);
    for(const face of [-1,1]){
      part(spin,new THREE.CylinderGeometry(.246,.246,.026,24),mats.darkMetal,[face*.164,0,0],[0,0,Math.PI/2]);
      part(spin,new THREE.TorusGeometry(.237,.018,6,24),mats.silver,[face*.181,0,0],[0,Math.PI/2,0]);
      part(spin,new THREE.CylinderGeometry(.072,.072,.032,12),mats.paint,[face*.178,0,0],[0,0,Math.PI/2]);
      for(let n=0;n<5;n++){const a=n/5*Math.PI*2;box(spin,[.018,.052,.165],[face*.184,Math.sin(a)*.139,Math.cos(a)*.139],mats.silver,[-a,0,0]);}
      part(spin,new THREE.TorusGeometry(.309,.008,4,24),mats.tread,[face*.174,0,0],[0,Math.PI/2,0]);
    }
    for(let n=0;n<12;n++){const a=n/12*Math.PI*2;part(spin,new THREE.BoxGeometry(.24,.008,.028),mats.tread,[0,Math.sin(a)*.38,Math.cos(a)*.38],[-a,0,0]);}
    batchRigid(spin);wheels.push({pivot,spin,front:z>0});
  }
  // Seated Timmy with a tailored blue suit and curved, side-swept black hair.
  driver.position.set(0,.77,-.13);head.position.set(0,1.03,.015);
  oval(driver,[0,.42,0],[.285,.37,.20],mats.cloth);
  box(driver,[.28,.37,.027],[0,.40,.196],mats.navy);
  rod(driver,[[0,.10,.19],[0,.39,.208],[0,.71,.105]],.01,mats.silver);
  const arms:THREE.Group[]=[],eyes:THREE.Group[]=[];
  for(const side of [-1,1]){
    oval(driver,[side*.22,.64,0],[.17,.14,.20],mats.cloth);
    oval(driver,[side*.22,.751,.015],[.125,.025,.135],mats.ivory);
    const arm=new THREE.Group();arm.name=side<0?"left-arm":"right-arm";arm.position.set(side*.29,.61,.03);driver.add(arm);arms.push(arm);
    rod(arm,[[0,0,0],[side*.10,-.25,.15],[0,-.30,.49]],.102,mats.cloth);
    rod(arm,[[-side*.03,.06,.075],[side*.05,-.10,.155],[side*.065,-.24,.24]],.016,mats.cyan);
    oval(arm,[-side*.015,-.29,.50],[.095,.09,.105],mats.navy);
    oval(arm,[-side*.015,-.27,.55],[.066,.043,.035],mats.ivory);
    rod(driver,[[side*.16,.13,.02],[side*.23,.08,.34],[side*.23,-.09,.68]],.122,mats.navy);
    oval(driver,[side*.23,-.065,.75],[.115,.09,.19],mats.cloth);
    box(driver,[.2,.035,.27],[side*.23,-.13,.75],mats.rubber);
  }
  oval(driver,[0,.81,0],[.105,.13,.1],mats.skin);
  part(driver,new THREE.TorusGeometry(.12,.045,6,20),mats.navy,[0,.74,0],[Math.PI/2,0,0]);
  part(head,timmyFace(),mats.skin);
  for(const side of [-1,1]){
    oval(head,[side*.303,-.04,-.005],[.065,.09,.065],mats.skin);
    oval(head,[side*.318,-.035,.029],[.033,.055,.018],mats.mouth);
    const eye=new THREE.Group();eye.name=side<0?"left-eye":"right-eye";eye.position.set(side*.127,.005,.258);head.add(eye);eyes.push(eye);
    oval(eye,[0,0,0],[.088,.045,.022],mats.ivory);
    oval(eye,[0,0,.023],[.031,.038,.013],mats.iris);
    oval(eye,[side*.002,.002,.036],[.017,.027,.008],mats.hair);
    oval(eye,[-side*.011,.017,.045],[.009,.01,.004],mats.ivory);
    rod(head,[[side*.053,.099,.263],[side*.13,.113,.267],[side*.204,.087,.243]],.016,mats.hair);
    part(head,glassesFrame(),mats.hair,[side*.129,.015,.300]);
    rod(head,[[side*.245,.032,.29],[side*.307,.037,.16],[side*.311,.02,-.027]],.018,mats.hair);
  }
  rod(head,[[-.023,.017,.304],[0,.037,.32],[.023,.017,.304]],.014,mats.hair);
  oval(head,[0,-.074,.282],[.043,.059,.045],mats.skin);
  rod(head,[[-.07,-.168,.258],[0,-.18,.277],[.07,-.164,.26]],.009,mats.mouth);
  part(head,new THREE.SphereGeometry(1,24,16,0,Math.PI*2,0,Math.PI*.61),mats.hair,[0,.045,-.017],[0,0,0],[.326,.369,.294]);
  for(let n=0;n<8;n++){
    const a=n/8*Math.PI*2,x=Math.sin(a),z=Math.cos(a);
    part(head,hairLock([x*.15,.29,z*.14],[x*.31+.07,.42,z*.27],[x*.33+.05,.10+(n%3)*.06,z*.32],.10),n%3===0?mats.hairLight:mats.hair);
  }
  for(let n=0;n<5;n++){
    const x=-.27+n*.065;
    part(head,hairLock([x,.30,.13],[x+.13,.30,.35],[x+.25,.07+n*.022,.303],.075),n%2?mats.hair:mats.hairLight);
  }
  for(let n=0;n<5;n++){
    const x=-.24+n*.12;
    part(head,hairLock([x,.15,-.23],[x+.02,.03,-.33],[x+.03,-.20,-.23],.09),mats.hair);
  }
  const steeringWheel=new THREE.Group();steeringWheel.name="steering-wheel";steeringWheel.position.set(0,1.09,.43);steeringWheel.rotation.x=.55;chassis.add(steeringWheel);
  part(steeringWheel,new THREE.TorusGeometry(.255,.031,8,24),mats.navy);
  for(const a of [0,Math.PI*2/3,Math.PI*4/3])rod(steeringWheel,[[0,0,0],[Math.sin(a)*.21,Math.cos(a)*.21,0]],.018,mats.silver);
  part(steeringWheel,new THREE.CylinderGeometry(.07,.07,.04,12),mats.paint,[0,0,.01],[Math.PI/2,0,0]);
  for(const group of [...arms,...eyes,head,driver,chassis,steeringWheel])batchRigid(group);
  return {root,chassis,driver,head,arms,eyes,wheels,steeringWheel,liveryMaterial,brakeMaterial:mats.lamp};
}
