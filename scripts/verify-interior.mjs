import assert from 'node:assert/strict';
import * as T from 'three';
import {buildCarriageInterior,interiorPalette,constrainCabin} from '../app/carriage-interior.ts';
const palette=interiorPalette();
for(let car=0;car<3;car++){
 const interior=buildCarriageInterior(car,palette);interior.updateMatrixWorld(true);
 let meshes=0;
 interior.traverse(o=>{if(!o.isMesh)return;meshes++;assert(o.geometry.attributes.position.array.every(Number.isFinite));
  const b=new T.Box3().setFromObject(o);
  // Every solid furnishing must leave the walkable eye-height aisle clear.
  if(b.max.y>2.65&&b.min.y<3.45)assert(b.max.x<-.39||b.min.x>.39,'Furniture intersects camera corridor');
 });assert(meshes>200);
}
for(const z of [-100,-42.25,-36.3,-29.1,-22,-14.7,-7.5,-1.7,100])for(const x of [-5,0,5]){
 const p=constrainCabin(new T.Vector3(x,8,z));assert(Math.abs(p.x)<=.39);assert(p.y<=3.45&&p.y>=2.65);assert(p.z>=-42.25&&p.z<=.05);
}
console.log('PASS: three furnished cabins, clear camera corridor and bounded interior navigation');
