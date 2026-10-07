import * as THREE from "three";

// Short pooled world-space sparks. No full-screen flashing or camera shake.
export function createContactEffect(){
  const mesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.045,0),new THREE.MeshBasicMaterial({color:0xffcf75}),12);
  mesh.name="contact-sparks";mesh.frustumCulled=false;
  const dummy=new THREE.Object3D();
  const particles=Array.from({length:12},()=>({position:new THREE.Vector3(),velocity:new THREE.Vector3(),life:0,total:.3}));
  const update=(dt:number,disabled=false)=>{
    particles.forEach((p,i)=>{
      p.life=disabled?0:Math.max(0,p.life-dt);
      if(p.life>0){p.velocity.y-=7*dt;p.position.addScaledVector(p.velocity,dt);}
      dummy.position.copy(p.position);dummy.scale.setScalar(p.life>0?p.life/p.total:0);dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
  };
  const burst=(point:THREE.Vector3,inward:THREE.Vector3,back:THREE.Vector3,strength:number)=>{
    particles.forEach((p,i)=>{
      p.position.copy(point);p.life=p.total=.22+(i%4)*.04;
      p.velocity.copy(inward).multiplyScalar(.5+(i%3)*.4).addScaledVector(back,1.5+strength*2+(i%2));p.velocity.y=.6+(i%5)*.3;
    });
    update(0);
  };
  update(0);
  return {mesh,update,burst};
}
