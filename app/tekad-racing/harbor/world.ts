import * as THREE from "three";
import {sampleCourse,type Course} from "./course";
import {HARBOR_BOUNDS} from "./bounds";

type Placement={x:number;y:number;z:number;sx:number;sy:number;sz:number;yaw?:number};
function instances(scene:THREE.Object3D,geometry:THREE.BufferGeometry,material:THREE.Material,placements:Placement[],shadow=true){
  const mesh=new THREE.InstancedMesh(geometry,material,placements.length),dummy=new THREE.Object3D();
  placements.forEach((p,i)=>{dummy.position.set(p.x,p.y,p.z);dummy.scale.set(p.sx,p.sy,p.sz);dummy.rotation.set(0,p.yaw||0,0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);});
  mesh.castShadow=shadow;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);return mesh;
}

function ribbon(course:Course,inner:number,outer:number,height:number,colors:number[]){
  const positions:number[]=[],indices:number[]=[],vertexColors:number[]=[];
  const count=512;
  for(let i=0;i<=count;i++){
    const s=sampleCourse(course,i/count*course.length),normal=new THREE.Vector3(s.tz,0,-s.tx).normalize();
    const color=new THREE.Color(colors[Math.floor(i*course.length/count/4)%colors.length]);
    for(const edge of [inner,outer]){
      const offset=edge*s.width/2;
      positions.push(s.x+normal.x*offset,s.y+height,s.z+normal.z*offset);
      vertexColors.push(color.r,color.g,color.b);
    }
    if(i<count){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("color",new THREE.Float32BufferAttribute(vertexColors,3));g.setIndex(indices);g.computeVertexNormals();
  const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.93,side:THREE.DoubleSide}));mesh.receiveShadow=true;return mesh;
}

export function createBarrierMesh(course:Course,side:number,material:THREE.Material){
  const positions:number[]=[],indices:number[]=[];
  const segments=1024;
  for(let i=0;i<=segments;i++){
    const sample=sampleCourse(course,i/segments*course.length);
    const center=sample.width/2+HARBOR_BOUNDS.barrierOffset;
    for(const [offset,height] of [[center-HARBOR_BOUNDS.barrierThickness/2,-.04],[center-HARBOR_BOUNDS.barrierThickness/2,HARBOR_BOUNDS.barrierHeight],[center+HARBOR_BOUNDS.barrierThickness/2,HARBOR_BOUNDS.barrierHeight],[center+HARBOR_BOUNDS.barrierThickness/2,-.04]]){
      const p=sampleCourse(course,i/segments*course.length,side*offset);
      positions.push(p.x,p.y+height,p.z);
    }
    if(i<segments)for(let edge=0;edge<4;edge++){
      const a=i*4+edge,b=(i+1)*4+edge,c=i*4+(edge+1)%4,d=(i+1)*4+(edge+1)%4;
      if(side>0)indices.push(a,b,c,c,b,d);else indices.push(a,c,b,c,d,b);
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,material);mesh.name=side<0?"barrier-left":"barrier-right";mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

export function createHarborWorld(course:Course){
  const root=new THREE.Group();root.name="harbor-course";
  root.add(ribbon(course,-1.7,1.7,-.16,[0xc9c1a5]));
  const road=ribbon(course,-1,1,0,[0x35434c]);road.name="road-deck";root.add(road);
  root.add(ribbon(course,-1.08,-1,.025,[0xf5f2e4,0xd9483c]));
  root.add(ribbon(course,1,1.08,.025,[0xf5f2e4,0xd9483c]));
  root.add(ribbon(course,-.96,-.943,.032,[0xf2e9cf]));
  root.add(ribbon(course,.943,.96,.032,[0xf2e9cf]));
  const stone=new THREE.MeshStandardMaterial({color:0xd7cfb4,roughness:.9});
  const white=new THREE.MeshStandardMaterial({color:0xf0e7d3,roughness:.85});
  const roof=new THREE.MeshStandardMaterial({color:0xc77552,roughness:.9});
  const windows=new THREE.MeshStandardMaterial({color:0x2b6e87,roughness:.3,metalness:.15});
  const green=new THREE.MeshStandardMaterial({color:0x43815a,roughness:1,flatShading:true});
  const wood=new THREE.MeshStandardMaterial({color:0x67503a,roughness:1});
  const pillars:Placement[]=[],houses:Placement[]=[],roofs:Placement[]=[],panes:Placement[]=[],islands:Placement[]=[],trees:Placement[]=[],trunks:Placement[]=[];
  for(let distance=0;distance<course.length;distance+=6){
    const center=sampleCourse(course,distance);
    const yaw=Math.atan2(center.tx,center.tz);
    for(const side of [-1,1]){
      const p=sampleCourse(course,distance,side*(center.width/2+HARBOR_BOUNDS.barrierOffset));
      if(center.y>2 && Math.floor(distance/6)%3===0)pillars.push({x:p.x,y:(p.y-3)/2,z:p.z,sx:1.4,sy:p.y+3,sz:1.6,yaw});
    }
  }
  for(let i=0;i<34;i++){
    const distance=(i+.5)/34*course.length;
    const p=sampleCourse(course,distance,19+(i%3)*3),height=5+(i%4)*1.6,yaw=Math.atan2(p.tx,p.tz);
    if(p.y>4)continue;
    islands.push({x:p.x,y:-2.25,z:p.z,sx:24,sy:4,sz:25,yaw});
    houses.push({x:p.x,y:height/2-.25,z:p.z,sx:7,sy:height,sz:8,yaw});
    roofs.push({x:p.x,y:height+.8,z:p.z,sx:6.2,sy:2.2,sz:7.2,yaw:yaw+Math.PI/4});
    const facing=sampleCourse(course,distance,15.4+(i%3)*3);
    panes.push({x:facing.x,y:height*.6,z:facing.z,sx:.05,sy:1.5,sz:4.8,yaw});
    const t=sampleCourse(course,distance+9,17);
    trunks.push({x:t.x,y:1.9,z:t.z,sx:.25,sy:3.8,sz:.25});
    trees.push({x:t.x,y:4.4,z:t.z,sx:2.8,sy:3.2,sz:2.8});
  }
  for(const side of [-1,1])root.add(createBarrierMesh(course,side,stone));
  instances(root,new THREE.BoxGeometry(1,1,1),stone,pillars);
  instances(root,new THREE.BoxGeometry(1,1,1),stone,islands);
  instances(root,new THREE.BoxGeometry(1,1,1),white,houses);
  instances(root,new THREE.ConeGeometry(1,1,4),roof,roofs);
  instances(root,new THREE.BoxGeometry(1,1,1),windows,panes);
  instances(root,new THREE.CylinderGeometry(1,1,1,6),wood,trunks);
  instances(root,new THREE.IcosahedronGeometry(1,1),green,trees);
  // Start gantry and physical chequered line use the same start sample.
  const start=sampleCourse(course,0),gate=new THREE.Group();gate.position.set(start.x,start.y,start.z);gate.rotation.y=Math.atan2(start.tx,start.tz);root.add(gate);
  const gateMaterial=new THREE.MeshStandardMaterial({color:0x1663b3,roughness:.4,metalness:.25});
  const gateHalf=start.width/2+HARBOR_BOUNDS.barrierOffset+.65;
  const gateBoxes:Placement[]=[{x:-gateHalf,y:3,z:0,sx:.5,sy:6,sz:.5},{x:gateHalf,y:3,z:0,sx:.5,sy:6,sz:.5},{x:0,y:6,z:0,sx:gateHalf*2+.5,sy:.75,sz:.6}];
  instances(gate,new THREE.BoxGeometry(1,1,1),gateMaterial,gateBoxes);
  const checks:Placement[]=[];
  for(let x=0;x<16;x++)for(let row=0;row<2;row++)if((x+row)%2===0)checks.push({x:-5.5+(x+.5)*11/16,y:.04,z:row*.65,sx:11/16,sy:.025,sz:.65});
  instances(gate,new THREE.BoxGeometry(1,1,1),white,checks,false);
  // A small set of rigged flags gives the prototype real world motion.
  const flags:THREE.Mesh[]=[];
  const flagMaterial=new THREE.MeshStandardMaterial({color:0xf3ad43,side:THREE.DoubleSide,roughness:.8});
  for(let i=0;i<12;i++){
    const p=sampleCourse(course,i/12*course.length,8);
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,5,6),white);pole.position.set(p.x,p.y+2.5,p.z);root.add(pole);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.8,.85,6,2),flagMaterial);flag.position.set(p.x+.9,p.y+4.2,p.z);flag.userData.base=new Float32Array(flag.geometry.attributes.position.array);root.add(flag);flags.push(flag);
  }
  const waterMaterial=new THREE.MeshStandardMaterial({color:0x28adb8,roughness:.38,metalness:.25});
  const water=new THREE.Mesh(new THREE.PlaneGeometry(1800,1800),waterMaterial);water.rotation.x=-Math.PI/2;water.position.y=-2.1;root.add(water);
  // Distant land masses are actual low-poly meshes, not a scene painted over the camera.
  const hills:Placement[]=[];for(let i=0;i<12;i++){const a=i/12*Math.PI*2;hills.push({x:Math.cos(a)*400,y:8,z:Math.sin(a)*400,sx:80+(i%3)*25,sy:35+(i%4)*12,sz:70});}
  instances(root,new THREE.IcosahedronGeometry(1,1),new THREE.MeshStandardMaterial({color:0x719885,roughness:1,flatShading:true}),hills,false);
  const update=(time:number,reducedMotion=false)=>{
    for(let n=0;n<flags.length;n++){
      const flag=flags[n],p=flag.geometry.attributes.position,base=flag.userData.base as Float32Array;
      for(let i=0;i<p.count;i++)p.setZ(i,reducedMotion?0:Math.sin(time*3+base[i*3]*2+n)*.12*(base[i*3]+.9));
      p.needsUpdate=true;
    }
  };
  return {root,update};
}
