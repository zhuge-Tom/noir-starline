import * as T from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {batchStatic} from './batching.ts';
import type {interiorPalette} from './carriage-interior.ts';
export function createCarriageDoor(z:number,m:ReturnType<typeof interiorPalette>){
 const root=new T.Group();root.name='Sliding carriage door';root.position.z=z;
 const box=(w:number,h:number,d:number,x:number,y:number,mat:T.Material,depth=0)=>{const mesh=new T.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(.025,d/3)),mat);mesh.position.set(x,y,depth);root.add(mesh);};
 // A real window opening, recessed lower panel and handles on both sides.
 box(1.19,.91,.10,0,1.91,m.wood);box(1.19,.22,.10,0,3.87,m.wood);
 for(const s of [-1,1])box(.16,1.42,.10,s*.515,3.05,m.wood);
 box(1.19,.10,.12,0,2.40,m.panel);
 const glass=new T.MeshStandardMaterial({color:0x9da596,transparent:true,opacity:.24,roughness:.28,metalness:.08,depthWrite:false});
 box(.87,1.30,.025,0,3.08,glass);
 for(const face of [-1,1]){
  box(.92,.62,.025,0,1.92,m.panel,face*.065);
  for(const x of [-.435,.435])box(.025,1.35,.025,x,3.08,m.brass,face*.065);
  for(const y of [2.41,3.75])box(.90,.025,.025,0,y,m.brass,face*.065);
  box(.075,.30,.04,-.49,2.49,m.brass,face*.085);
  box(.035,.18,.055,-.49,2.49,m.brass,face*.12);
 }
 batchStatic(root);
 let amount=0,target=0;
 const occupied=(p:T.Vector3)=>Math.abs(p.z-z)<.40&&Math.abs(p.x)<.8;
 return {root,z,get amount(){return amount;},get open(){return target===1;},
  toggle(p:T.Vector3){if(target===1&&occupied(p))return false;target=1-target;return true;},
  update(dt:number,p:T.Vector3){if(target===0&&amount>0&&occupied(p))target=1;amount=T.MathUtils.clamp(amount+Math.sign(target-amount)*Math.min(Math.abs(target-amount),dt/1.1),0,1);const eased=amount*amount*(3-2*amount);root.position.x=1.26*eased;},
  constrain(old:T.Vector3,next:T.Vector3){if(amount>=.93)return;const side=old.z>=z?1:-1;if((next.z-z)*side<.28)next.z=z+side*.28;}
 };
}
