import * as T from 'three';
import { shadeCharacter } from './character-shading.ts';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
export function buildLayeredHair(atlas:T.Texture){
 const root=new T.Group();root.name='Independent animated hair';
 const material=shadeCharacter(new T.MeshBasicMaterial({map:atlas,color:0x565466,vertexColors:true,toneMapped:false,side:T.DoubleSide}),'hair');
 const layers:{mesh:T.Mesh;base:Float32Array;weights:Float32Array;phase:number;strength:number}[]=[];
 let id=0;
 function lock(points:T.Vector3[],width:number,thickness:number,strength:number,name:string){
  const curve=new T.CatmullRomCurve3(points),frames=curve.computeFrenetFrames(40,false),p:number[]=[],c:number[]=[],uv:number[]=[],idx:number[]=[],weights:number[]=[];
  const phase=id++*.73,baseColour=new T.Color(0xd7d9e5),highlight=new T.Color(0xffffff);
  for(let i=0;i<=40;i++){
   const t=i/40,q=curve.getPoint(t),tangent=curve.getTangent(t);
   let outward=V(q.x-.018,Math.max(0,q.y-2.42)*.6,q.z+.025).normalize();
   let across=outward.clone().cross(tangent).normalize();if(across.lengthSq()<.1)across=frames.normals[i];
   outward=tangent.clone().cross(across).normalize();
   const isFringe=name.startsWith('Bangs')||name.startsWith('Fringe');
   const taper=(.57+.43*Math.sin(Math.PI*Math.min(1,t*1.1)))*Math.max(.012,Math.pow(Math.max(0,1-Math.pow(t,isFringe?3.4:4.2)),.8));
   for(let j=0;j<10;j++){
    const a=j/10*Math.PI*2,xx=Math.cos(a),zz=Math.sin(a),v=q.clone().addScaledVector(across,xx*width*taper).addScaledVector(outward,zz*thickness*taper);
    p.push(v.x,v.y-2.325,v.z);weights.push(t*t);uv.push((185+(id%9)*14+(xx*.5+.5)*36)/2048,1-(110+t*340)/2048);
    const glint=Math.pow(Math.max(0,zz),2)*(.10+.24*Math.exp(-Math.pow((t-.32)/.19,2)));
    const colour=baseColour.clone().lerp(highlight,glint).multiplyScalar(.80+.20*Math.pow(Math.max(0,zz),.6));c.push(colour.r,colour.g,colour.b);
    if(i<40){const k=i*10+j,n=i*10+(j+1)%10;idx.push(k,n,k+10,n,n+10,k+10)}
   }
  }
  // Closed ends, embedded roots and fine tapered tips.
  for(let j=1;j<9;j++){idx.push(0,j+1,j);idx.push(400,400+j,401+j)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const mesh=new T.Mesh(geo,material);mesh.name=name;root.add(mesh);layers.push({mesh,base:Float32Array.from(p),weights:Float32Array.from(weights),phase,strength});
 }
 // Overlapping crown-to-bang locks, never a textured face sheet.
 const fringe=[[-.232,2.175,.041],[-.19,2.24,.047],[-.151,2.31,.043],[-.11,2.365,.039],[-.074,2.337,.034],[-.039,2.27,.037],[.004,2.25,.039],[.052,2.30,.042],[.096,2.36,.040],[.14,2.325,.044],[.179,2.24,.043],[.215,2.165,.043]];
 for(let i=0;i<fringe.length;i++){
  const [x,tip,width]=fringe[i],sweep=.017*Math.sin(i*1.7),rootX=.027+x*.20;
  lock([V(rootX,2.651-Math.abs(x)*.055,.010),V(x*.72+.014,2.553,.166),V(x+sweep*.5,2.43,.230),V(x+sweep,tip,.235)],width,.0055,.045,`Bangs ${i+1}`);
 }
 // Crown coverage and long rear layers follow natural gravity with curved ends.
 for(let i=0;i<30;i++){
  const a=.12+i/29*(Math.PI-.24),x=Math.cos(a)*.238,z=-.028-Math.sin(a)*.218;
  const sweep=.035*Math.sin(i*.67);
  lock([V(x*.32,2.635,z*.28),V(x,2.46,z),V(x*1.2,2.04,z-.032),V(x*1.48+sweep,1.57,z-.065),V(x*1.8+.045+sweep,1.12+(i%5)*.038,z+.065)],.037+(i%3)*.007,.015,.32,`Back hair ${i+1}`);
 }
 for(const s of [-1,1])for(let i=0;i<7;i++){
  const x=s*(.221+i*.005),z=.19-i*.03;
  lock([V(x*.74,2.59,z*.5),V(x*.99,2.37,z),V(x*1.16,2.07,z+.018),V(x*1.21,1.68+(i%3)*.045,z+.065)],.025,.010,.20,`Side hair ${s}/${i}`);
 }
 // Soft inner masses support the fine strands without a flat curtain or bald temples.
 for(const side of [-1,1])lock([V(side*.11,2.635,.025),V(side*.23,2.52,.115),V(side*.255,2.32,.16),V(side*.27,1.96,.18),V(side*.30,1.63,.19)],.065,.010,.14,`Temple underlayer ${side}`);
 for(let i=0;i<9;i++){const a=.16+i/8*(Math.PI-.32),x=Math.cos(a)*.215,z=-.03-Math.sin(a)*.20;
  lock([V(x*.35,2.61,z*.30),V(x,2.40,z),V(x*1.22,1.98,z-.03),V(x*1.50,1.55,z-.04),V(x*1.65,1.22,z+.02)],.061,.010,.23,`Inner back layer ${i}`);
 }
 // Fine wisps are separate solid geometry with greater delayed tip movement.
 for(let i=0;i<14;i++){
  const s=i%2?1:-1,k=Math.floor(i/2);
  lock([V(s*.235,2.40,-.08-k*.016),V(s*(.29+k*.007),1.98,-.13),V(s*(.36+k*.012),1.54,-.10),V(s*(.39+k*.012),1.19+k*.025,.05)],.0035,.002,.40,`Fine wisp ${i+1}`);
 }
 const animate=(time:number,wind:number)=>{
  for(const l of layers){const a=l.mesh.geometry.attributes.position;
   for(let i=0;i<a.count;i++){const k=i*3,w=l.weights[i],lag=w*1.7;
    const sway=wind*l.strength*w*(.24+.36*Math.sin(time*1.15-lag+l.phase*.08)+.12*Math.sin(time*2.15-lag*2+l.phase));
    a.setXYZ(i,l.base[k]+sway,l.base[k+1]+wind*l.strength*w*.06*Math.sin(time*1.15-lag+l.phase*.14),l.base[k+2]+wind*l.strength*w*.23*Math.sin(time*1.42-lag+l.phase*.18));
   }a.needsUpdate=true;
  }
 };
 root.userData={independentBangs:12,volumetricLocks:layers.length,rootPinned:true};
 return {root,animate,layers};
}
