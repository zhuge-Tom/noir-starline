import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Reference: user-supplied bg040c.png. Shared materials survive static batching.
function surface(color:number,kind:'wood'|'cloth'|'plain'='plain',metalness=0){
 const m=new T.MeshStandardMaterial({color,metalness,roughness:kind==='cloth'?.96:.78,emissive:color,emissiveIntensity:.3});
 m.name=`Carriage ${kind} ${color.toString(16)}`;
 m.onBeforeCompile=shader=>{
  // The enclosed cabin receives warm lantern light; suppress the unoccluded
  // exterior moon/sky fill on these materials instead of altering the outdoors.
  const lightChunk=T.ShaderChunk.lights_fragment_begin
   .replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight ); if(directLight.color.b > directLight.color.r) directLight.color *= 0.18;')
   .replace('irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );','irradiance += 0.18 * getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );');
  shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_begin>',lightChunk);
  if(kind==='plain')return;
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 surfacePoint;').replace('#include <begin_vertex>','#include <begin_vertex>\nsurfacePoint=position;');
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
   varying vec3 surfacePoint;
   float textileHash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
   float textileNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(mix(textileHash(i),textileHash(i+vec3(1,0,0)),f.x),mix(textileHash(i+vec3(0,1,0)),textileHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(textileHash(i+vec3(0,0,1)),textileHash(i+vec3(1,0,1)),f.x),mix(textileHash(i+vec3(0,1,1)),textileHash(i+vec3(1,1,1)),f.x),f.y),f.z);
   }
  `).replace('#include <color_fragment>',kind==='cloth'?`#include <color_fragment>
   float nap=textileNoise(surfacePoint*24.0)*.6+textileNoise(surfacePoint*65.0)*.4;
   diffuseColor.rgb*=.73+.5*nap;
  `:`#include <color_fragment>
   float grain=textileNoise(surfacePoint*vec3(38.0,1.5,9.0));
   diffuseColor.rgb*=.85+.25*grain;
  `);
 };m.customProgramCacheKey=()=>`original-carriage-${kind}-v3`;return m;
}
export function interiorPalette(){return {
 wood:surface(0x70452c,'wood'),panel:surface(0x42291e,'wood'),ceiling:surface(0xd6b988),
 velvet:surface(0x54251d,'cloth'),seam:surface(0x3d1b17,'cloth'),
 brass:surface(0x8d7351,'plain',.3),iron:surface(0x3f3529,'plain',.25),
 cream:surface(0xd1ba87),sign:surface(0x626347),
 glow:new T.MeshBasicMaterial({color:0xffe0a1}),
};}
type Palette=ReturnType<typeof interiorPalette>;
export function buildCarriageInterior(car:number,m:Palette){
 const g=new T.Group();g.name=`Original-reference interior ${car}`;
 const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material,r=0)=>{
  const o=new T.Mesh(r?new RoundedBoxGeometry(w,h,d,4,r):new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);g.add(o);return o;
 };
 const rod=(a:T.Vector3,b:T.Vector3,r:number,mat:T.Material)=>{
  const d=b.clone().sub(a),o=new T.Mesh(new T.CylinderGeometry(r,r,d.length(),8),mat);
  o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());g.add(o);return o;
 };
 const v=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 // Bare narrow floorboards, no aisle carpet or dining tables.
 box(3.34,.10,12.6,0,1.36,0,m.panel);
 for(let i=0;i<20;i++)box(.157,.022,12.5,-1.57+i*.165,1.42,0,m.wood,.004);
 for(const s of [-1,1]){
  box(.08,.94,12.5,s*1.58,1.91,0,m.wood);
  box(.10,.045,12.5,s*1.54,2.37,0,m.panel,.012);
  box(.08,.20,12.5,s*1.61,3.99,0,m.wood);
  box(.065,.035,12.5,s*1.53,3.86,0,m.panel,.012);
  // Timber pillars, sliding sash and small brass fittings.
  for(let i=0;i<7;i++){
   const z=-6.105+i*2.03;
   box(.12,1.54,.36,s*1.57,3.14,z,m.wood,.012);
   box(.025,.14,.07,s*1.495,3.30,z,m.cream,.008);
   for(const y of [2.54,3.72])box(.022,.025,.025,s*1.50,y,z-.12,m.brass);
  }
  for(let i=0;i<6;i++){
   const z=-5.09+i*2.03;
   for(const dz of [-.80,.80])box(.13,1.44,.06,s*1.59,3.12,z+dz,m.panel,.008);
   for(const y of [2.42,3.04,3.84])box(.13,.055,1.64,s*1.59,y,z,m.wood,.008);
   box(.03,.065,1.67,s*1.50,3.90,z,m.brass,.009);
   box(.02,.028,.16,s*1.48,3.90,z,m.cream);
   box(.15,.06,1.67,s*1.53,2.42,z,m.wood,.016);
   rod(v(s*1.49,2.58,z+.67),v(s*1.49,2.72,z+.67),.014,m.brass);
  }
  // Open lattice, rounded front rail and perforated curved brackets.
  for(const x of [1.05,1.59])rod(v(s*x,3.99,-6.1),v(s*x,3.99,6.1),.027,m.iron);
  for(let k=0;k<5;k++)rod(v(s*(1.10+k*.105),3.99,-6.1),v(s*(1.10+k*.105),3.99,6.1),.006,m.iron);
  for(let k=0;k<100;k++)rod(v(s*1.06,3.99,-6.04+k*.122),v(s*1.60,3.99,-6.04+k*.122),.006,m.iron);
  for(let i=0;i<7;i++){
   const z=-6.105+i*2.03;
   const shape=new T.Shape();shape.moveTo(1.04,3.98);shape.lineTo(1.60,3.98);shape.lineTo(1.60,3.68);shape.quadraticCurveTo(1.28,3.66,1.04,3.98);
   for(let k=0;k<4;k++){const x=1.23+k*.09,y=3.927-k*.035;const hole=new T.Path();hole.absarc(x,y,.025+k*.003,0,Math.PI*2,true);shape.holes.push(hole);}
   const bracket=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false,curveSegments:12}),m.iron);bracket.scale.x=s;bracket.position.z=z;g.add(bracket);
  }
 }
 // Continuous vaulted cream ceiling and slender curved seams.
 const arch=new T.CatmullRomCurve3([v(-1.62,3.98,0),v(-1.42,4.38,0),v(-.83,4.64,0),v(0,4.71,0),v(.83,4.64,0),v(1.42,4.38,0),v(1.62,3.98,0)]);
 const points=arch.getPoints(40),pos:number[]=[],uv:number[]=[],idx:number[]=[];
 for(let i=0;i<points.length;i++){const p=points[i];pos.push(p.x,p.y,-6.26,p.x,p.y,6.26);uv.push(i/40,0,i/40,1);if(i<40){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}}
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();m.ceiling.side=T.DoubleSide;g.add(new T.Mesh(geo,m.ceiling));
 for(let i=0;i<7;i++){const curve=new T.CatmullRomCurve3(points.map(p=>v(p.x,p.y-.018,-6.09+i*2.03)));g.add(new T.Mesh(new T.TubeGeometry(curve,40,.012,6,false),m.wood));}
 // Six-sided cage lanterns with overlapping warm pools of light.
 for(const z of [-4.06,0,4.06]){
  rod(v(0,4.66,z),v(0,4.50,z),.027,m.iron);
  const lamp=new T.Mesh(new T.CylinderGeometry(.13,.13,.32,6),m.glow);lamp.position.set(0,4.29,z);g.add(lamp);
  for(const y of [4.10,4.47]){const cap=new T.Mesh(new T.CylinderGeometry(.17,.15,.06,6),m.iron);cap.position.set(0,y,z);g.add(cap);}
  for(let k=0;k<6;k++){const a=k*Math.PI/3;rod(v(Math.sin(a)*.143,4.12,z+Math.cos(a)*.143),v(Math.sin(a)*.143,4.46,z+Math.cos(a)*.143),.012,m.iron);}
  const light=new T.PointLight(0xffcb8c,6,8,1.2);light.position.set(0,3.94,z);g.add(light);
 }
 // Facing benches: slim timber frames, softened oxblood moquette upholstery.
 for(const s of [-1,1])for(let bay=0;bay<3;bay++)for(const direction of [-1,1]){
  const x=s*1.055,z=-4.06+bay*4.06+direction*1.13;
  for(const edge of [-1,1]){
   rod(v(x+edge*.43,1.45,z-.25),v(x+edge*.43,1.94,z-.25),.022,m.iron);
   rod(v(x+edge*.43,1.45,z+.25),v(x+edge*.43,1.94,z+.25),.022,m.iron);
  }
  box(1.01,.10,.78,x,1.84,z,m.panel,.025);
  for(const seat of [-1,0,1])box(.306,.20,.76,x+seat*.316,1.97,z,m.velvet,.055);
  box(.955,.022,.75,x,1.955,z,m.seam,.010);
  const back=box(1.04,1.10,.16,x,2.40,z+direction*.34,m.wood,.028);back.rotation.x=direction*.055;
  const pad=box(.93,.98,.14,x,2.42,z+direction*.245,m.velvet,.045);pad.rotation.x=direction*.055;
  for(const division of [-1,1])box(.010,.82,.015,x+division*.158,2.43,z+direction*.168,m.seam,.004);
  box(.87,.018,.025,x,1.92,z-direction*.375,m.seam,.008);
  for(const edge of [-1,1]){
   rod(v(x+edge*.49,1.86,z-direction*.23),v(x+edge*.49,2.20,z-direction*.23),.019,m.iron);
   box(.095,.07,.78,x+edge*.49,2.22,z,m.wood,.031);
  }
 }
 // Fill the vaulted end wall up to the curved ceiling, avoiding open sky gaps.
 const endShape=new T.Shape();endShape.moveTo(-1.62,3.79);endShape.lineTo(1.62,3.79);
 for(const p of [...points].reverse())endShape.lineTo(p.x,p.y);endShape.closePath();
 for(const end of [-1,1]){const cap=new T.Mesh(new T.ShapeGeometry(endShape,32),m.ceiling);cap.position.z=end*6.19;g.add(cap);}
 // Olive notice boards and ventilator from the original end wall.
 for(const end of [-1,1]){
  for(const s of [-1,1]){
   box(1.02,2.62,.065,s*1.14,2.74,end*6.22,m.wood,.012);
   box(.59,.38,.055,s*1.12,3.22,end*6.17,m.panel,.008);
   box(.51,.30,.058,s*1.12,3.22,end*6.13,m.sign);
  }
  box(1.22,.55,.07,0,4.07,end*6.22,m.wood);
  for(const s of [-1,1])box(.045,2.58,.09,s*.61,2.73,end*6.16,m.cream,.018);
  box(.35,.22,.08,0,4.03,end*6.14,m.cream,.018);box(.24,.12,.09,0,4.03,end*6.10,m.iron);
 }
 return g;
}

/** Keep the camera in the continuous aisle. */
export function constrainCabin(position:T.Vector3){
 position.x=T.MathUtils.clamp(position.x,-.39,.39);
 position.y=T.MathUtils.clamp(position.y,2.65,3.45);
 position.z=T.MathUtils.clamp(position.z,-41.2,.05);
 return position;
}
