import * as T from 'three';
import { separateFaceAlbedo } from './face-albedo.ts';
import { buildLayeredHair } from './layered-hair.ts';
import { anatomicalHead } from './anatomical-head.ts';
import { characterMaterial, shadeCharacter } from './character-shading.ts';
import { ruffleBand, shoulderRuffle } from './character-garment.ts';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
const SCALE=470, CENTER=425, BASE=1450;
const add=(g:T.Group,geo:T.BufferGeometry,m:T.Material|T.Material[],p=V(0,0,0))=>{const mesh=new T.Mesh(geo,m);mesh.position.copy(p);g.add(mesh);return mesh};
function oval(g:T.Group,p:T.Vector3,size:T.Vector3,m:T.Material){const mesh=add(g,new T.SphereGeometry(1,40,32),m,p);mesh.scale.copy(size);return mesh}
function tube(g:T.Group,ps:T.Vector3[],radius:number,m:T.Material){return add(g,new T.TubeGeometry(new T.CatmullRomCurve3(ps),36,radius,8,false),m)}
function limb(g:T.Group,ps:T.Vector3[],rs:number[],m:T.Material){const curve=new T.CatmullRomCurve3(ps),frames=curve.computeFrenetFrames(32,false),pos:number[]=[],idx:number[]=[];for(let i=0;i<=32;i++){const t=i/32,k=t*(rs.length-1),j=Math.min(rs.length-2,Math.floor(k)),r=T.MathUtils.lerp(rs[j],rs[j+1],k-j),p=curve.getPoint(t);for(let a=0;a<=16;a++){const q=a/16*Math.PI*2,v=p.clone().addScaledVector(frames.normals[i],r*Math.cos(q)).addScaledVector(frames.binormals[i],r*Math.sin(q));pos.push(v.x,v.y,v.z);if(i<32&&a<16){const n=i*17+a;idx.push(n,n+17,n+1,n+1,n+17,n+18)}}}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();return add(g,geo,m)}
/** Original artwork is projected onto shaped surfaces. No eye-erasing shader,
 * no camera-facing billboard, and no generated replacement facial identity. */
export function buildDetailedCharacter(){
 const root=new T.Group();root.name='NOIR — original art calibrated 3D';root.position.set(0,1.32,.61);
 const skin=characterMaterial(0xf1dcda,'skin'),hair=characterMaterial(0x454454,'hair'),collarMat=characterMaterial(0x9692a8,'cloth'),glove=characterMaterial(0x414259,'cloth'),silver=characterMaterial(0xb7bdd6,'metal');
 const source=new T.Texture(),closed=new T.Texture(),atlas=new T.Texture();
 for(const tex of [source,closed,atlas]){tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true}
 let disposed=false,loaded=0;
 const failures:string[]=[];
 const ready=typeof window==='undefined'?Promise.resolve():Promise.all([
  ['/character/noir-original.png',source],['/character/noir-closed.png',closed],['/character/noir-atlas.png',atlas]
 ].map(([url,target])=>new Promise<void>((resolve,reject)=>{new T.ImageLoader().load(String(url),im=>{if(!disposed){const t=target as T.Texture;t.image=im;t.needsUpdate=true;loaded++}resolve()},undefined,()=>{failures.push(String(url));reject(new Error('角色原画载入失败：'+url))})}))).then(()=>{});
 // Catch internally as well; scene exposes readiness and error to the UI.
 ready.catch(()=>{});
 const painted=new T.MeshBasicMaterial({map:source,color:0xd7d9e5,alphaTest:.35,toneMapped:false,side:T.DoubleSide});
 const faceMat=painted.clone();faceMat.name='Original face, no procedural iris replacement';separateFaceAlbedo(faceMat);
 shadeCharacter(painted,'cloth');
 const uvSource=(x:number,y:number)=>[(CENTER+x*SCALE)/900,1-(BASE-y*SCALE)/1500];
 // Five-head silhouette including ears, long shins/thighs, bare feet from the standing art.
 for(const s of [-1,1]){
  limb(root,[V(s*.135,.105,.00),V(s*.132,.39,-.018),V(s*.15,.68,.007),V(s*.175,.92,.015),V(s*.16,1.17,0)],[.045,.069,.064,.087,.095],skin);
  oval(root,V(s*.13,.085,.085),V(.058,.055,.13),skin);
  for(let f=0;f<5;f++){const x=s*.13+(f-2)*.023;oval(root,V(x,.046,.183-Math.abs(f-1)*.012),V(.014,.023,.036),skin)}
 }
 const deformables:{geo:T.BufferGeometry;base:Float32Array;kind:'cloth'|'hair';phase:number;weight:number}[]=[];
 // Continuous fitted bodice and flared skirt, front UVs preserve original seams and shading.
 const profiles=[[1.055,.487,.235],[1.10,.48,.225],[1.3,.392,.20],[1.5,.286,.155],[1.65,.219,.132],[1.81,.219,.127],[1.99,.252,.124],[2.05,.199,.11]];
 const p:number[]=[],u:number[]=[],ix:number[]=[],groups:{start:number;count:number;materialIndex:number}[]=[];
 const rows=48,cols=96;
 const profile=(y:number)=>{let j=0;while(j<profiles.length-2&&y>profiles[j+1][0])j++;const t=T.MathUtils.clamp((y-profiles[j][0])/(profiles[j+1][0]-profiles[j][0]),0,1);return[T.MathUtils.lerp(profiles[j][1],profiles[j+1][1],t),T.MathUtils.lerp(profiles[j][2],profiles[j+1][2],t)]};
 for(let i=0;i<=rows;i++){const y=1.055+i/rows*.995,[r,d]=profile(y);for(let j=0;j<=cols;j++){const a=j/cols*Math.PI*2,fall=T.MathUtils.smoothstep(1.70-y,0,.65),fold=1+fall*(.043*Math.cos(a*12+.32*Math.sin(a*3))+.012*Math.sin(a*7)),x=Math.sin(a)*r*fold,z=Math.cos(a)*d*fold,hemLift=Math.pow(fall,5)*(.009*Math.sin(a*5)+.006*Math.cos(a*9));p.push(x,y+hemLift,z);u.push(...uvSource(x,y));if(i<rows&&j<cols){const k=i*(cols+1)+j,start=ix.length;ix.push(k,k+1,k+cols+1,k+1,k+cols+2,k+cols+1);groups.push({start,count:6,materialIndex:Math.cos(a)>0?0:1})}}}
 const dressGeo=new T.BufferGeometry();dressGeo.setAttribute('position',new T.Float32BufferAttribute(p,3));dressGeo.setAttribute('uv',new T.Float32BufferAttribute(u,2));dressGeo.setIndex(ix);const frontIx:number[]=[],backIx:number[]=[];for(const g of groups)(g.materialIndex===0?frontIx:backIx).push(...ix.slice(g.start,g.start+g.count));dressGeo.setIndex([...frontIx,...backIx]);dressGeo.addGroup(0,frontIx.length,0);dressGeo.addGroup(frontIx.length,backIx.length,1);dressGeo.computeVertexNormals();
 const garment=characterMaterial(0xffffff,'cloth');garment.vertexColors=true;garment.name='Clean garment — no body artwork';
 const garmentColors:number[]=[];for(let i=0;i<p.length;i+=3){const x=p[i],y=p[i+1],z=p[i+2],a=Math.atan2(x,z),c=new T.Color(y>1.91?0x9692a8:0x505572);const folds=.76+.22*Math.pow(.5+.5*Math.cos(a*12+.32*Math.sin(a*3)),1.5),bibShadow=1-.16*Math.exp(-Math.pow((y-1.88)/.045,2)),hemShadow=1-.12*Math.exp(-Math.pow((y-1.065)/.035,2));c.multiplyScalar(folds*bibShadow*hemShadow);garmentColors.push(c.r,c.g,c.b)}
 dressGeo.setAttribute('color',new T.Float32BufferAttribute(garmentColors,3));dressGeo.clearGroups();add(root,dressGeo,garment).name='Clean fitted dress';
 // Separate scalloped bib trim and buttons, rather than baked arms/hair/necklace.
 const bibTrim=ruffleBand(1.928,.237,.14,.065,22,collarMat);bibTrim.name='Folded bib ruffle';root.add(bibTrim);
 for(let i=0;i<3;i++)oval(root,V(.008,1.965-i*.025,.144),V(.006,.006,.004),silver);
deformables.push({geo:dressGeo,base:Float32Array.from(p),kind:'cloth',phase:0,weight:1});
 // Soft scalloped hem; no toy-like torus hoop.
 const underskirt=ruffleBand(1.075,.489,.239,.074,26,characterMaterial(0x75758f,'cloth'));underskirt.name='Folded underskirt';root.add(underskirt);
 const hg=underskirt.geometry;deformables.push({geo:hg,base:Float32Array.from(hg.attributes.position.array),kind:'cloth',phase:0,weight:1});
 // Neck is a real tapered volume, seated behind the chin and inside the torso.
 const neck=limb(root,[V(.012,1.99,-.01),V(.015,2.075,.002),V(.018,2.185,.016)],[.089,.065,.067],skin);neck.name='Anatomical neck';
 // Continuous fabric collar: no source face/neck pixels projected onto this geometry.
 const collar=add(root,new T.CylinderGeometry(.072,.093,.09,64,4,true),collarMat,V(.014,2.055,.002));collar.name='Fitted fabric collar';collar.scale.z=.88;
 const neckTrim=ruffleBand(2.115,.073,.064,.021,18,collarMat);neckTrim.position.set(.014,0,.002);neckTrim.name='Folded neck trim';root.add(neckTrim);
 // Hands rest on the video railing; their bone lengths now match the standing reference.
 for(const s of [-1,1]){
  oval(root,V(s*.304,1.995,.008),V(.064,.068,.061),skin).name=`Rounded shoulder ${s}`;
  // One continuous surface avoids a lit ring where separate elbow tubes met.
  limb(root,[V(s*.305,2.012,0),V(s*.35,1.82,.035),V(s*.35,1.61,.18),V(s*.286,1.46,.39),V(s*.154,1.34,.74)],[.063,.057,.049,.041,.033],skin).name=`Upper arm ${s}`;
  limb(root,[V(s*.176,1.364,.668),V(s*.155,1.337,.743)],[.046,.043],glove);
  oval(root,V(s*.145,1.338,.773),V(.058,.035,.073),glove);
  for(let f=0;f<4;f++){const x=s*.145+(f-1.5)*.022;limb(root,[V(x,1.346,.78),V(x,1.32,.823),V(x,1.281,.824)],[.010,.009,.007],glove)}
  root.add(shoulderRuffle(s,collarMat));
  const cuff=ruffleBand(1.37,.047,.044,.025,12,glove);cuff.position.set(s*.166,0,.707);cuff.name=`Gathered glove cuff ${s}`;root.add(cuff);
  limb(root,[V(s*.196,1.348,.767),V(s*.215,1.326,.797),V(s*.205,1.30,.812)],[.014,.012,.009],glove).name=`Gloved thumb ${s}`;
 }
 // Fine necklace and the character's cross pendant.
 tube(root,[V(-.077,2.03,.135),V(-.059,1.86,.15),V(0,1.70,.166),V(.06,1.86,.15),V(.075,2.03,.135)],.0028,silver);
 add(root,new T.BoxGeometry(.013,.09,.009),silver,V(0,1.654,.177));add(root,new T.BoxGeometry(.048,.013,.009),silver,V(0,1.68,.18));
 const head=new T.Group();head.position.set(0,2.325,0);head.name='Original proportion head';root.add(head);
 // Geometry owns the head shape. Original artwork supplies front albedo only.
 head.add(anatomicalHead(faceMat,skin,hair));
 for(const side of [-1,1]){
  const x0=side<0?-.16:.19,x1=side<0?-.345:.385,x2=side<0?-.265:.29;
  const points=[V(x0,.205,.035),V(x1,.31,.015),V(x2,.195,.045)];
  const ep:number[]=[],eu:number[]=[],ei=[0,1,2,5,4,3,0,3,1,1,3,4,1,4,2,2,4,5,2,5,0,0,5,3];
  for(let layer=0;layer<2;layer++)for(const v of points){ep.push(v.x,v.y,v.z-layer*.045);eu.push((425+v.x*470)/900,1-(1450-(v.y+2.325)*470)/1500)}
  const eg=new T.BufferGeometry();eg.setAttribute('position',new T.Float32BufferAttribute(ep,3));eg.setAttribute('uv',new T.Float32BufferAttribute(eu,2));eg.setIndex(ei);eg.computeVertexNormals();add(head,eg,hair);const ef=eg.clone();ef.setIndex([0,1,2]);add(head,ef,painted,V(0,0,.001));
 }
 const hairstyle=buildLayeredHair(atlas);head.add(hairstyle.root);
 // Long cat tail, absent in the old proxy.
 const tail=tube(root,[V(.06,1.24,-.14),V(.31,.99,-.28),V(.52,.71,-.22),V(.62,.57,-.1)],.025,hair);tail.name='Cat tail';
 let prev=-1,prevWind=-1;
 const animate=(time:number,wind:number)=>{if(time===prev&&wind===prevWind)return;prev=time;prevWind=wind;
  const blinkPhase=(time+2.6)%5.4;faceMat.map=blinkPhase<.13&&loaded===3?closed:source;
  hairstyle.animate(time,wind);
  head.rotation.z=Math.sin(time*.42)*.012;head.rotation.y=Math.sin(time*.33)*.035;head.position.y=2.325+Math.sin(time*1.45)*.003;root.rotation.z=Math.sin(time*.64)*.003;tail.rotation.y=Math.sin(time*.8)*.055;
  for(const {geo,base,kind,phase,weight} of deformables){const a=geo.attributes.position;for(let i=0;i<a.count;i++){const k=i*3,x=base[k],y=base[k+1],z=base[k+2];if(kind==='hair'){const fall=T.MathUtils.clamp((2.45-y)/1.45,0,1),w=wind*weight*fall*fall;a.setXYZ(i,x+(.085+Math.sin(time*1.3+phase*.21+y*2)*.045)*w,y+Math.sin(time*1.15+phase*.24)*.018*w,z+Math.sin(time*1.22+phase*.19+y*2)*.028*w)}else{const fall=Math.max(0,(1.7-y)/.7),w=fall*fall*wind;a.setXYZ(i,x+Math.sin(time*1.4+x*4)*.016*w,y+Math.sin(time*1.3+x*5)*.004*w,z+Math.sin(time*1.35+x*5)*.013*w)}}if(kind==='hair'){head.updateMatrix();const v=V(0,0,0);for(let i=0;i<a.count;i++){const y=base[i*3+1],blend=T.MathUtils.smoothstep(y,1.98,2.38);if(blend>0){v.fromBufferAttribute(a,i);const original=v.clone();v.sub(head.position).applyEuler(head.rotation).add(head.position);v.lerp(original,1-blend);a.setXYZ(i,v.x,v.y,v.z)}}}a.needsUpdate=true}
 };
 root.traverse(obj=>{if(obj instanceof T.Mesh&&(obj.material===skin||(Array.isArray(obj.material)&&obj.material.includes(skin)))){const geo=obj.geometry,n=geo.attributes.normal,colors:number[]=[];for(let i=0;i<n.count;i++){const f=.92+.08*Math.max(0,n.getX(i)*-.3+n.getY(i)*.5+n.getZ(i)*.7);colors.push(f,f,f)}geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));skin.vertexColors=true}});
 root.userData={version:5,polishVersion:6,source:'supplied original standing artwork and Live2D texture atlas',height:2.74,representation:'anatomical volumes, bounded night cel shading, folded cloth and original face; unseen details approximate',eyeShader:'original eye pixels preserved; baked hair excluded'};
 return{root,animate,ready,failures,setHairVisible:(visible:boolean)=>{hairstyle.root.visible=visible},dispose:()=>{disposed=true;source.dispose();closed.dispose();atlas.dispose()}};
}


