import assert from 'node:assert/strict';
import * as T from 'three';
import {buildTrain} from '../app/scene.ts';
import {buildDetailedCharacter} from '../app/character.ts';
const train=buildTrain(),actor=buildDetailedCharacter();
const before=new T.Box3().setFromObject(actor.root).getSize(new T.Vector3());
train.root.add(actor.root);train.root.updateMatrixWorld(true);
const after=new T.Box3().setFromObject(actor.root).getSize(new T.Vector3());
assert(before.distanceTo(after)<1e-6,'Attaching the character to a widened train must preserve all three dimensions');
for(const time of [0,4,12]){actor.animate(time,.65);train.root.updateMatrixWorld(true);const scale=actor.root.getWorldScale(new T.Vector3());assert(scale.distanceTo(new T.Vector3(1,1,1))<1e-6,'Animated character must not inherit non-uniform carriage scale');}
actor.dispose();console.log('PASS: character dimensions and animation scale are independent of carriage width');
