import assert from 'node:assert/strict';
import * as T from 'three';
import {constrainWalk,passingPosition,TRAVEL_SPEED,buildPassingScenery,TRAIN_WIDTH_SCALE} from '../app/train-journey.ts';
import {buildTrain} from '../app/scene.ts';
const train=buildTrain(),d=train.doors[0];let p=new T.Vector3(0,2.85,-.05);
function step(){const old=p.clone();p.z-=.08;constrainWalk(old,p);for(const door of train.doors){if(Math.abs(old.z-door.z)<2)door.constrain(old,p);door.update(.05,p);}}
for(let i=0;i<40;i++)step();assert(p.z>d.z,'Walking into a shut door stays outside');assert(!d.open,'Collision must not silently open a closed door');
d.toggle(p);for(let i=0;i<30;i++)d.update(.05,p);for(let i=0;i<25;i++)step();assert(p.z<d.z-.4,'F/open followed by forward movement enters cabin');
const old=new T.Vector3(1.5,2.85,-.8),wall=old.clone();wall.z=-1.1;constrainWalk(old,wall);assert.equal(wall.z,old.z,'Cannot enter through wall beside door');
assert(.95*TRAIN_WIDTH_SCALE>1.5,'Bench must offer three half-unit sitting places');
const scenery=buildPassingScenery();scenery.update(0);const before=scenery.root.children[0].position.z;scenery.update(1);assert(Math.abs(scenery.root.children[0].position.z-before-TRAVEL_SPEED)<.001);
const snapshot=scenery.root.children.map(o=>o.position.z);scenery.update(1);assert.deepEqual(scenery.root.children.map(o=>o.position.z),snapshot,'Paused clock freezes movement');
for(const t of [0,1,30,100000])assert(passingPosition(-180,t)>=-180&&passingPosition(-180,t)<60);
console.log('PASS: unified walking, manual door entry, side wall collision, bench width, moving and paused scenery');
