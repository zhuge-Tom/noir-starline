import * as T from 'three';
export const TRAIN_WIDTH_SCALE=1.65;
export const TRAVEL_SPEED=8.5;
/** The rear platform and aisle share one continuous walkable route. */
export function constrainWalk(old:T.Vector3,p:T.Vector3){
 p.y=T.MathUtils.clamp(p.y,2.65,3.45);p.z=T.MathUtils.clamp(p.z,-41.2,1.22);
 // Solid end wall beside the central doorway, approached from the platform.
 if(old.z>=-.85&&p.z<-.85&&Math.abs(p.x)>.52)p.z=old.z;
 p.x=T.MathUtils.clamp(p.x,p.z<-.85?-.52:-2.45,p.z<-.85?.52:2.45);
 return p;
}
export function passingPosition(start:number,time:number,span=240){return ((start+time*TRAVEL_SPEED+180)%span+span)%span-180;}
export function buildPassingScenery(){
 const root=new T.Group(),objects:{mesh:T.Object3D;z:number}[]=[];
 // Far banks and trees move at the same world speed; distance produces parallax.
 const land=new T.MeshStandardMaterial({color:0x17273a,roughness:1});
 const leaves=new T.MeshStandardMaterial({color:0x233849,roughness:1});
 for(const side of [-1,1])for(let i=0;i<12;i++){
  const g=new T.Group();g.position.set(side*(28+(i%3)*7),-.3,-180+i*20);
  const island=new T.Mesh(new T.SphereGeometry(1,10,6),land);island.scale.set(7,1.4,11);g.add(island);
  for(let j=0;j<3;j++){const tree=new T.Mesh(new T.ConeGeometry(1.6,5+(i%3),7),leaves);tree.position.set((j-1)*3,3,j*2-2);g.add(tree);}
  root.add(g);objects.push({mesh:g,z:g.position.z});
 }
 return {root,update(time:number){for(const item of objects)item.mesh.position.z=passingPosition(item.z,time);}};
}
