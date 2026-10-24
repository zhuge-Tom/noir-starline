import assert from 'node:assert/strict';
import * as T from 'three';
import {buildLayeredHair} from '../app/layered-hair.ts';
import {buildDetailedCharacter} from '../app/character.ts';
const hair=buildLayeredHair(new T.Texture());
assert(hair.root.userData.independentBangs>=10);
assert(hair.layers.length>=80);
hair.animate(0,0);const initial=hair.layers.map(l=>Float32Array.from(l.mesh.geometry.attributes.position.array));
hair.animate(2,1);let moved=0;
for(const [j,l] of hair.layers.entries()){
 const p=l.mesh.geometry.attributes.position.array;
 assert(p.every(Number.isFinite));
 assert.deepEqual(Array.from(p.slice(0,30)),Array.from(initial[j].slice(0,30)),'Roots must stay pinned');
 if(p.some((v,i)=>v!==initial[j][i]))moved++;
}
assert.equal(moved,hair.layers.length,'Every independent layer responds to wind');
hair.animate(2,0);for(const [i,l] of hair.layers.entries())assert.deepEqual(l.mesh.geometry.attributes.position.array,initial[i],'Zero wind restores geometry');
const actor=buildDetailedCharacter(),group=actor.root.getObjectByName('Independent animated hair');
actor.setHairVisible(false);assert.equal(group.visible,false);actor.setHairVisible(true);assert.equal(group.visible,true);
let face;actor.root.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m?.userData.separateHair)face=m});assert(face,'Face must remove baked hair independently of geometry visibility');
console.log(`PASS: ${hair.layers.length} solid hair layers, pinned roots, delayed sway, separate face material and hair toggle`);
