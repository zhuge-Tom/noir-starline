import assert from 'node:assert/strict';
import * as T from 'three';
import { buildTrain } from '../app/scene.ts';
import { buildDetailedCharacter } from '../app/character.ts';
const train=buildTrain();let meshes=0;
train.root.traverse(o=>{if(o.isMesh){meshes++;const a=o.geometry.attributes.position.array;assert(a.every(Number.isFinite),'Train positions must be finite');}});
assert.equal(train.wheels.length,12);assert(meshes<110,`Static batching should keep train draw calls under 110, found ${meshes}`);
const bounds=new T.Box3().setFromObject(train.root);assert(bounds.max.z>2);assert(bounds.min.z<-40);assert(bounds.max.y>5);
const actor=buildDetailedCharacter();let before=[];actor.root.traverse(o=>{if(o.isMesh)before.push(Float32Array.from(o.geometry.attributes.position.array));});actor.animate(.08,1);let changed=false,i=0;actor.root.traverse(o=>{if(o.isMesh){const a=o.geometry.attributes.position.array;assert(a.every(Number.isFinite),'Animated geometry must be finite');if(a.some((v,j)=>v!==before[i][j]))changed=true;i++}});assert(changed,'Hair/skirt animation must deform 3D geometry');
for(const t of [0,5.2,19.5,1000])actor.animate(t,0);
console.log(JSON.stringify({passed:true,trainMeshes:meshes,wheelGroups:train.wheels.length,trainBounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},animatedMeshes:i}));

const mats=new Set();actor.root.traverse(o=>{if(o.isMesh)mats.add(o.material)});assert([...mats].some(m=>m.isShaderMaterial),'Passenger must use bounded custom cel shading');console.log('Character v2: bounded cel materials and animated detailed geometry verified.');
