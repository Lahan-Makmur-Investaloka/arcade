import { CatmullRomCurve3, Vector3 } from "three";

export type CourseSample = { x: number; y: number; z: number; tx: number; ty: number; tz: number; width: number };
export type Course = { length: number; samples: CourseSample[] };
export const ROAD_WIDTH = 11;
export const HARBOR_LAPS = 3;

// Shared centerline: road, kart placement, camera, checkpoint progress and map.
export function createHarborCourse(): Course {
  const points = [[50,0,-110],[110,0,-70],[125,0,15],[95,0,85],[15,1,110],[-50,5,85],[-100,8,30],[-110,8,-45],[-75,4,-105],[-15,0,-125]];
  const curve = new CatmullRomCurve3(points.map(([x,y,z]) => new Vector3(x,y,z)), true, "centripetal");
  curve.arcLengthDivisions = 4096;
  curve.updateArcLengths();
  const samples: CourseSample[] = [];
  for (let i = 0; i < 1024; i++) {
    const p = curve.getPointAt(i / 1024), t = curve.getTangentAt(i / 1024);
    const bridge = Math.max(0, Math.min(1, (p.y - 3) / 5));
    samples.push({x:p.x,y:p.y,z:p.z,tx:t.x,ty:t.y,tz:t.z,width:ROAD_WIDTH - bridge * 1.5});
  }
  return {length: curve.getLength(), samples};
}

export function sampleCourse(course: Course, distance: number, lateral = 0): CourseSample {
  const progress = ((distance % course.length) + course.length) % course.length / course.length * course.samples.length;
  const index = Math.floor(progress), f = progress - index;
  const a = course.samples[index], b = course.samples[(index + 1) % course.samples.length];
  const mix = (x:number,y:number) => x + (y-x)*f;
  let tx = mix(a.tx,b.tx), ty = mix(a.ty,b.ty), tz = mix(a.tz,b.tz);
  const norm = Math.hypot(tx,ty,tz); tx /= norm; ty /= norm; tz /= norm;
  const horizontal = Math.hypot(tx,tz);
  return {x:mix(a.x,b.x)+tz/horizontal*lateral,y:mix(a.y,b.y),z:mix(a.z,b.z)-tx/horizontal*lateral,tx,ty,tz,width:mix(a.width,b.width)};
}

export function courseMap(course: Course) {
  const xs=course.samples.map(p=>p.x), zs=course.samples.map(p=>p.z);
  const minX=Math.min(...xs), minZ=Math.min(...zs), scale=100/Math.max(Math.max(...xs)-minX,Math.max(...zs)-minZ);
  const point=(sample: Pick<CourseSample,"x"|"z">) => ({x:10+(sample.x-minX)*scale,y:10+(sample.z-minZ)*scale});
  const path=course.samples.filter((_,i)=>i%8===0).map((s,i)=>{const p=point(s);return `${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;}).join(' ')+' Z';
  return {path,point};
}
