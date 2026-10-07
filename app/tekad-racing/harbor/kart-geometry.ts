import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {mergeGeometries} from "three/examples/jsm/utils/BufferGeometryUtils.js";

export function roundedBox(x:number,y:number,z:number,r=.08){return new RoundedBoxGeometry(x,y,z,2,Math.min(r,x/3,y/3,z/3));}
export function tube(points:number[][],radius:number,segments=16){
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number]))),segments,radius,6,false);
}
// A swept oval shell with smooth normals and real longitudinal curvature.
export function shell(length:number,profile:(t:number)=>{width:number;height:number;center:number},rows=18,sides=24){
  const positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=rows;j++)for(let i=0;i<=sides;i++){
    const t=j/rows,a=i/sides*Math.PI*2,p=profile(t);
    positions.push(Math.cos(a)*p.width,p.center+Math.sin(a)*p.height,t*length);uv.push(i/sides,t);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<sides;i++){const a=j*(sides+1)+i,b=a+1,c=a+sides+1;indices.push(a,b,c,b,c+1,c);}
  for(const j of [0,rows]){
    const center=positions.length/3,p=profile(j/rows);positions.push(0,p.center,j/rows*length);uv.push(.5,j/rows);
    for(let i=0;i<sides;i++){const a=j*(sides+1)+i;indices.push(...(j===0?[center,a+1,a]:[center,a,a+1]));}
  }
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
export const noseProfile=(t:number)=>({width:.57+Math.sin(t*Math.PI)*.075-t*.2,height:.22-t*.11,center:.57-t*.12});
// Upper cowl overlay shares its surface equation with the shell, preventing a
// floating flat decal. UVs read from cockpit toward the nose.
export function noseLivery(){
  const pos:number[]=[],uv:number[]=[],ix:number[]=[];const rows=18,cols=12;
  for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
    const t=.04+j/rows*.9,u=i/cols,p=noseProfile(t),a=.3+(1-u)*(Math.PI-.6);
    pos.push(Math.cos(a)*(p.width+.004),p.center+Math.sin(a)*(p.height+.004),.22+t*1.3);uv.push(u,1-j/rows);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1;ix.push(a,c,b,b,c,c+1);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
// Curved tapered locks, rather than a ring of cones, give Timmy's side-swept
// hair its own silhouette. Cross sections follow a quadratic centerline.
export function hairLock(start:number[],control:number[],end:number[],width:number){
  const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(...start as [number,number,number]),new THREE.Vector3(...control as [number,number,number]),new THREE.Vector3(...end as [number,number,number]));
  const pos:number[]=[],ix:number[]=[];const axis=new THREE.Vector3(),normal=new THREE.Vector3(),binormal=new THREE.Vector3();
  for(let j=0;j<=8;j++){
    const t=j/8,p=curve.getPoint(t),tangent=curve.getTangent(t),radius=Math.max(.002,width*(1-t)**.7);
    axis.set(0,0,1);if(Math.abs(tangent.z)>.9)axis.set(1,0,0);normal.crossVectors(tangent,axis).normalize();binormal.crossVectors(tangent,normal).normalize();
    for(let i=0;i<=8;i++){const a=i/8*Math.PI*2,q=p.clone().addScaledVector(normal,Math.cos(a)*radius).addScaledVector(binormal,Math.sin(a)*radius*.42);pos.push(q.x,q.y,q.z);}
  }
  for(let j=0;j<8;j++)for(let i=0;i<8;i++){const a=j*9+i,b=a+1,c=a+9;ix.push(a,b,c,b,c+1,c);}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(new Array(pos.length/3*2).fill(0),2));g.setIndex(ix);g.computeVertexNormals();return g;
}
export function glassesFrame(){
  const p=new THREE.Path(),w=.113,h=.075,r=.035;
  p.moveTo(-w+r,-h);p.lineTo(w-r,-h);p.quadraticCurveTo(w,-h,w,-h+r);p.lineTo(w,h-r);p.quadraticCurveTo(w,h,w-r,h);p.lineTo(-w+r,h);p.quadraticCurveTo(-w,h,-w,h-r);p.lineTo(-w,-h+r);p.quadraticCurveTo(-w,-h,-w+r,-h);
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p.getPoints(32).map(p=>new THREE.Vector3(p.x,p.y,0)),true),40,.017,6,true);
}
export function timmyFace(){
  const g=new THREE.SphereGeometry(1,24,18),p=g.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),jaw=y<-.1?Math.max(.76,1+(y+.1)*.27):1;
    p.setXYZ(i,x*.31*jaw,y*.37,z*.285*jaw+(y<-.1?(-y-.1)*.035:0));
  }
  g.computeVertexNormals();return g;
}
// Merge rigid components per material, leaving driver/head/wheel pivots intact.
export function batchRigid(group:THREE.Group){
  const bins=new Map<THREE.Material,THREE.Mesh[]>();
  for(const child of [...group.children])if(child instanceof THREE.Mesh&&!Array.isArray(child.material)&&child.visible){const list=bins.get(child.material)||[];list.push(child);bins.set(child.material,list);}
  for(const [mat,meshes] of bins){
    if(meshes.length<2)continue;
    const geometries=meshes.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);for(const name of Object.keys(g.attributes))if(!["position","normal","uv"].includes(name))g.deleteAttribute(name);return g;});
    const geometry=mergeGeometries(geometries,false);for(const g of geometries)g.dispose();if(!geometry)throw new Error("Kart mesh batching failed");
    for(const m of meshes){group.remove(m);m.geometry.dispose();}
    const mesh=new THREE.Mesh(geometry,mat);mesh.name=`rigid-${mat.name}`;mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);
  }
}
