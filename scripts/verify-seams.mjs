import assert from 'node:assert/strict';
import {buildDetailedCharacter} from '../app/character.ts';
const actor=buildDetailedCharacter();
const shell=actor.root.getObjectByName('Anatomical head core');
assert(shell,'Head needs an opaque closed backing, not disconnected face/scalp cards');
const edges=new Map(),index=shell.geometry.index.array;
for(let i=0;i<index.length;i+=3)for(let j=0;j<3;j++){const a=index[i+j],b=index[i+(j+1)%3],k=a<b?`${a},${b}`:`${b},${a}`;edges.set(k,(edges.get(k)||0)+1)}
assert([...edges.values()].every(n=>n===2),'Every shell edge must have exactly two incident faces');
assert(shell.material.alphaTest===0,'Backing cannot discard transparent pixels');
assert(actor.root.getObjectByName('Independent animated hair'),'Hair needs continuous backing');
for(const t of [0,1,3,7]){actor.animate(t,1);actor.root.traverse(o=>{if(o.isMesh)assert(o.geometry.attributes.position.array.every(Number.isFinite))})}
console.log('PASS: closed head topology, opaque backing and finite animated hair');

assert(!actor.root.getObjectByName('Closed original head shell'),'Remove silhouette extrusion');
assert(actor.root.getObjectByName('Anatomical neck'));
assert(actor.root.getObjectByName('Anatomical head and rounded jaw'));

const anatomical=actor.root.getObjectByName('Anatomical head and rounded jaw');
assert(anatomical.geometry.attributes.color,'Mixed skin groups require vertex colours; otherwise jaw renders black');
const pos=anatomical.geometry.attributes.position;
let depthMin=Infinity,depthMax=-Infinity;
for(let i=0;i<pos.count;i++)if(pos.getY(i)<-.14){depthMin=Math.min(depthMin,pos.getZ(i));depthMax=Math.max(depthMax,pos.getZ(i))}
assert(depthMax-depthMin>.15,'Underside must be a rounded 3D jaw, not a front card');
