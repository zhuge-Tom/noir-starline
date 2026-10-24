import assert from 'node:assert/strict';
import {buildDetailedCharacter} from '../app/character.ts';
const actor=buildDetailedCharacter();
const dress=actor.root.getObjectByName('Clean fitted dress');assert(dress);assert(!dress.material.map,'Garment must never contain standing-art arms/necklace');
for(const side of [-1,1]){const arm=actor.root.getObjectByName(`Upper arm ${side}`);assert(arm);const p=arm.geometry.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>1.70&&p.getY(i)<1.92)assert(Math.abs(p.getX(i))>.26,'Upper arm must stay outside fitted bodice');}
console.log('PASS: clean garment material and independent arm clearance');
