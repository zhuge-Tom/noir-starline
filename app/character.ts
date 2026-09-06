import * as T from 'three';
const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
/** Art-directed two-tone shading: scene light cannot burn out the passenger. */
function cel(hex:number,shadow=0x171d38){return new T.ShaderMaterial({uniforms:{base:{value:new T.Color(hex)},shadow:{value:new T.Color(shadow)}},vertexShader:`varying vec3 vNormal;varying vec3 vView;void main(){vec4 p=modelViewMatrix*vec4(position,1.);vView=-p.xyz;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*p;}`,fragmentShader:`uniform vec3 base;uniform vec3 shadow;varying vec3 vNormal;varying vec3 vView;void main(){vec3 n=normalize(vNormal);float d=dot(n,normalize(vec3(-.4,.8,1.)));float lit=smoothstep(-.2,.35,d);float rim=pow(1.-max(dot(n,normalize(vView)),0.),3.);vec3 c=mix(shadow,base,.42+lit*.48)+vec3(.05,.075,.13)*rim*.45;gl_FragColor=vec4(c,1.);#include <tonemapping_fragment>\n#include <colorspace_fragment>}`.replace(';#include',';\n#include'),side:T.DoubleSide})}
function mesh(root:T.Group,geo:T.BufferGeometry,material:T.Material,pos=[0,0,0]){const m=new T.Mesh(geo,material);m.position.fromArray(pos);root.add(m);return m}
function oval(root:T.Group,pos:number[],scale:number[],material:T.Material){const m=mesh(root,new T.SphereGeometry(1,32,24),material,pos);m.scale.fromArray(scale);return m}
function curveMesh(root:T.Group,points:T.Vector3[],r:number,material:T.Material){return mesh(root,new T.TubeGeometry(new T.CatmullRomCurve3(points),36,r,7,false),material)}
function limb(root:T.Group,points:T.Vector3[],radii:number[],material:T.Material){
 const path=new T.CatmullRomCurve3(points),frames=path.computeFrenetFrames(24,false),p:number[]=[],indices:number[]=[];
 for(let i=0;i<=24;i++){const t=i/24,c=path.getPoint(t),k=t*(radii.length-1),j=Math.min(radii.length-2,Math.floor(k)),r=T.MathUtils.lerp(radii[j],radii[j+1],k-j);for(let s=0;s<=12;s++){const a=s/12*Math.PI*2,q=c.clone().addScaledVector(frames.normals[i],r*Math.cos(a)).addScaledVector(frames.binormals[i],r*Math.sin(a));p.push(q.x,q.y,q.z);if(i<24&&s<12){const v=i*13+s;indices.push(v,v+13,v+1,v+1,v+13,v+14)}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(indices);g.computeVertexNormals();return mesh(root,g,material);
}
export function buildDetailedCharacter(){
 const root=new T.Group();root.name='NOIR passenger v2';root.position.set(0,1.32,.65);root.rotation.y=.08;
 const skin=cel(0xbeb2c5,0x635e7d),darkHair=cel(0x22283c,0x111728),hair=cel(0x353e55,0x171b2e),hairShine=cel(0x67728b,0x353b53),cloth=cel(0x28334d,0x10182c),clothLight=cel(0x3a4868,0x1d253e),lace=cel(0x8590a9,0x444c6b),leather=cel(0x1f283e,0x101426);
 // Slender legs and fitted boots, preserving the silhouette visible behind the railing.
 for(const s of [-1,1]){
  limb(root,[V(s*.14,.12,.035),V(s*.145,.39,-.005),V(s*.15,.70,-.015),V(s*.13,.94,-.02)],[.05,.066,.07,.083],skin);
  oval(root,[s*.14,.095,.065],[.079,.095,.155],leather);limb(root,[V(s*.14,.05,0),V(s*.14,.18,0),V(s*.145,.25,0)],[.06,.056,.064],leather);
  curveMesh(root,[V(s*.20,.05,.12),V(s*.14,.04,.21),V(s*.07,.05,.12)],.008,clothLight);
 }
 // Sculpted torso with a narrow waist rather than primitive cylinders.
 const torsoPts=[new T.Vector2(.23,1.03),new T.Vector2(.205,1.11),new T.Vector2(.203,1.24),new T.Vector2(.247,1.38),new T.Vector2(.218,1.45)];
 const torso=mesh(root,new T.LatheGeometry(torsoPts,48),cloth);torso.scale.z=.69;
 const skirtGeo=new T.BufferGeometry(),skirtPos:number[]=[],skirtUV:number[]=[],indices:number[]=[];
 for(let y=0;y<=20;y++){const t=y/20;for(let j=0;j<=128;j++){const a=j/128*Math.PI*2,fold=Math.sin(a*16)*.025*Math.pow(t,1.4)+Math.sin(a*32)*.008*t,r=.215+.33*Math.pow(t,.8)+fold;skirtPos.push(Math.sin(a)*r,1.065-t*.67,Math.cos(a)*r*.86);skirtUV.push(j/128,t);if(y<20&&j<128){const k=y*129+j;indices.push(k,k+129,k+1,k+1,k+129,k+130)}}}
 skirtGeo.setAttribute('position',new T.Float32BufferAttribute(skirtPos,3));skirtGeo.setAttribute('uv',new T.Float32BufferAttribute(skirtUV,2));skirtGeo.setIndex(indices);skirtGeo.computeVertexNormals();mesh(root,skirtGeo,cloth);const baseSkirt=Float32Array.from(skirtPos);
 // A scalloped, double-layer petticoat follows the skirt instead of a torus hoop.
 const trimGeo=new T.BufferGeometry(),trimPos:number[]=[],trimIndices:number[]=[];
 for(let j=0;j<=192;j++){const a=j/192*Math.PI*2,r=.55+.012*Math.cos(a*24);for(let row=0;row<2;row++){trimPos.push(Math.sin(a)*(r+row*.028),.405-row*(.07+.012*Math.sin(a*24)),Math.cos(a)*(r+row*.028)*.86)}if(j<192){const k=j*2;trimIndices.push(k,k+1,k+2,k+1,k+3,k+2)}}trimGeo.setAttribute('position',new T.Float32BufferAttribute(trimPos,3));trimGeo.setIndex(trimIndices);trimGeo.computeVertexNormals();mesh(root,trimGeo,lace);const baseTrim=Float32Array.from(trimPos);
 // Neck, high ruffled collar, sleeveless blouse and small dark bow.
 limb(root,[V(0,1.41,0),V(0,1.57,0)],[.077,.078],skin);
 const collar=mesh(root,new T.CylinderGeometry(.09,.2,.19,40,1,true),lace,[0,1.48,0]);collar.scale.z=.77;
 for(let j=0;j<24;j++){const a=j/24*Math.PI*2;oval(root,[Math.sin(a)*.184,1.40,Math.cos(a)*.143],[.029,.046,.024],lace)}
 for(const s of [-1,1]){
  // Smooth shoulder-to-elbow-to-wrist taper, with hands resting on the rear rail.
  limb(root,[V(s*.222,1.385,0),V(s*.259,1.25,.035),V(s*.263,1.105,.19)],[.067,.059,.049],skin);
  limb(root,[V(s*.263,1.105,.19),V(s*.233,1.09,.41),V(s*.175,1.105,.72)],[.05,.044,.034],skin);
  limb(root,[V(s*.181,1.10,.63),V(s*.174,1.10,.705)],[.048,.046],clothLight);
  oval(root,[s*.168,1.105,.744],[.065,.04,.076],leather);
  for(let f=0;f<4;f++){const x=s*.168+(f-1.5)*.025;limb(root,[V(x,1.11,.76),V(x,1.09,.80),V(x,1.045,.807)],[.011,.010,.0075],leather)}
  limb(root,[V(s*.22,1.105,.73),V(s*.224,1.08,.785),V(s*.209,1.045,.79)],[.015,.013,.009],leather);
  for(let j=0;j<7;j++){const a=j/6*Math.PI;oval(root,[s*(.21+.066*Math.cos(a)),1.39+.048*Math.sin(a),.016],[.031,.035,.055],lace)}
  const b=oval(root,[s*.073,1.38,.172],[.078,.04,.025],clothLight);b.rotation.z=s*.3;
  curveMesh(root,[V(s*.025,1.37,.18),V(s*.03,1.28,.18),V(s*.065,1.2,.17)],.013,clothLight);
 }
 oval(root,[0,1.38,.197],[.022,.026,.012],hairShine);
 const head=new T.Group();head.position.set(0,1.775,.015);root.add(head);
 // Anime jaw: round cranium, tapered cheeks and a delicate chin, not a sphere face.
 const headGeo=new T.SphereGeometry(1,64,48);const hp=headGeo.attributes.position;
 for(let i=0;i<hp.count;i++){const x=hp.getX(i),y=hp.getY(i),z=hp.getZ(i),jaw=y<-.2?1-(-y-.2)*.30:1;hp.setXYZ(i,x*.294*jaw,y*.321,z*.238)}headGeo.computeVertexNormals();mesh(head,headGeo,skin,[0,0,.022]);
 oval(head,[0,.043,-.043],[.324,.355,.275],darkHair);
 const faceGeo=new T.BufferGeometry(),fp:number[]=[],fu:number[]=[],fi:number[]=[];
 for(let y=0;y<=48;y++){const lat=y/48*Math.PI;for(let j=0;j<=64;j++){const a=-Math.PI/2+j/64*Math.PI,ny=Math.cos(lat),jaw=ny<-.2?1-(-ny-.2)*.30:1,x=Math.sin(a)*Math.sin(lat)*.295*jaw,yy=ny*.322,z=Math.cos(a)*Math.sin(lat)*.247+.035;fp.push(x,yy,z);fu.push(x/.67+.5,yy/.73+.5);if(y<48&&j<64){const k=y*65+j;fi.push(k,k+1,k+65,k+1,k+66,k+65)}}}
 faceGeo.setAttribute('position',new T.Float32BufferAttribute(fp,3));faceGeo.setAttribute('uv',new T.Float32BufferAttribute(fu,2));faceGeo.setIndex(fi);faceGeo.computeVertexNormals();
 const faceMaterial=new T.MeshBasicMaterial({color:0xc4bfd4,side:T.DoubleSide,toneMapped:false});
 const face=mesh(head,faceGeo,faceMaterial);face.name='Detailed hand-painted facial albedo';
 const blink={value:1};
 faceMaterial.onBeforeCompile=shader=>{shader.uniforms.blink=blink;shader.fragmentShader='uniform float blink;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
 vec2 faceUv=vMapUv;float eyeCenter=.54;float eyeMask=step(.17,faceUv.x)*step(faceUv.x,.83)*step(.395,faceUv.y)*step(faceUv.y,.65);
 if(eyeMask>.5){float dy=faceUv.y-eyeCenter;float halfEye=.103*blink;if(abs(dy)<halfEye){faceUv.y=eyeCenter+dy/max(blink,.035);}else if(abs(dy)<.108){faceUv.y=.35;}}
 vec4 sampledDiffuseColor=texture2D(map,faceUv);diffuseColor*=sampledDiffuseColor;
 #endif`)};
 // Fallback facial planes are replaced after the detailed diffuse asset loads.
 const fallback=new T.Group();head.add(fallback);for(const s of [-1,1]){
  const ink=new T.MeshBasicMaterial({color:0x28233e,toneMapped:false});const eyeMat=new T.MeshBasicMaterial({color:0x706384,toneMapped:false});const e=oval(fallback,[s*.122,.02,.269],[.06,.082,.018],eyeMat);e.rotation.y=s*.13;oval(fallback,[s*.119,.035,.286],[.027,.051,.007],ink);oval(fallback,[s*.131,.068,.294],[.012,.017,.004],new T.MeshBasicMaterial({color:0xc5c2d5,toneMapped:false}));curveMesh(fallback,[V(s*.065,.07,.266),V(s*.12,.10,.28),V(s*.19,.074,.25)],.006,ink);
 }
 curveMesh(fallback,[V(-.019,-.169,.249),V(0,-.173,.255),V(.019,-.169,.249)],.003,new T.MeshBasicMaterial({color:0x8e687e}));
 let faceTexture:T.Texture|undefined;
 if(typeof window!=='undefined')new T.TextureLoader().load('/face-albedo-v2.png',tex=>{faceTexture=tex;tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;faceMaterial.map=tex;faceMaterial.needsUpdate=true;fallback.visible=false},undefined,()=>{});
 // Rounded cat ears, with inset surfaces and subtle edge piping.
 for(const s of [-1,1]){
  const shape=new T.Shape();shape.moveTo(s*.115,.23);shape.quadraticCurveTo(s*.24,.41,s*.371,.475);shape.quadraticCurveTo(s*.378,.26,s*.291,.14);shape.closePath();mesh(head,new T.ExtrudeGeometry(shape,{depth:.105,bevelEnabled:true,bevelThickness:.022,bevelSize:.015,bevelSegments:3}),darkHair, [0,0,-.04]);
  const inner=new T.Shape();inner.moveTo(s*.20,.265);inner.lineTo(s*.334,.411);inner.quadraticCurveTo(s*.34,.28,s*.287,.219);inner.closePath();mesh(head,new T.ShapeGeometry(inner),hair,[0,0,.089]);
  curveMesh(head,[V(s*.16,.26,.085),V(s*.25,.375,.084),V(s*.37,.47,.044)],.0045,hairShine);
 }
 type Lock={g:T.BufferGeometry;base:Float32Array;phase:number;flow:number;highlight:boolean};const locks:Lock[]=[];
 const strand=(parent:T.Group,pts:T.Vector3[],width:number,phase:number,flow:number,highlight=false)=>{
  const path=new T.CatmullRomCurve3(pts),ps:number[]=[],idx:number[]=[],seg=36,across=6;
  for(let j=0;j<=seg;j++){const t=j/seg,c=path.getPoint(t),tangent=path.getTangent(t),side=V(0,0,1).cross(tangent).normalize();const taper=Math.pow(Math.sin(Math.PI*(.08+t*.92)),.67),w=width*taper;
   for(let k=0;k<=across;k++){const q=k/across*2-1;ps.push(c.x+side.x*w*q,c.y+side.y*w*q,c.z+side.z*w*q+.012*(1-q*q)*taper);if(j<seg&&k<across){const a=j*(across+1)+k;idx.push(a,a+1,a+across+1,a+1,a+across+2,a+across+1)}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(ps,3));g.setIndex(idx);g.computeVertexNormals();mesh(parent,g,highlight?hairShine:phase%4===0?hair:darkHair);locks.push({g,base:Float32Array.from(ps),phase,flow,highlight});
 };
 // Bangs descend in tapered overlapping blades, not flat spiky sticks.
 for(let i=0;i<13;i++){const x=(i-6)*.042,edge=Math.abs(i-6)/6,endY=.075-edge*.16+(i%3)*.018;
  strand(head,[V(x*.45,.333,.112),V(x*.82,.235,.235),V(x,.137,.266),V(x*.98,endY,.29)],.036,i,0.1);
  if(i%2===0)strand(head,[V(x*.67,.284,.213),V(x*.9,.213,.264),V(x*.98,.156,.28)],.003,i,.1,true);
 }
 for(const s of [-1,1])for(let i=0;i<5;i++)strand(head,[V(s*.245,.225,.09-i*.04),V(s*(.30+i*.004),.055,.143-i*.039),V(s*(.304+i*.009),-.20,.15-i*.03),V(s*.235,-.34-i*.014,.19-i*.03)],.030,i+25,.2);
 // Dense layered long hair, with thin silhouette flyaways.
 for(let i=0;i<38;i++){const a=i/37*Math.PI,xx=Math.cos(a)*.28,zz=-.075-Math.sin(a)*.22,off=(i%5)*.025;
  strand(root,[V(xx,2.02,zz),V(xx*1.06,1.7,zz-.03),V(xx+.08,1.29,zz-.11),V(xx+.38,.99+off,zz-.19),V(xx+.76,1.02+off,zz-.29),V(xx+.84,1.17+off,zz-.3)],.020+(i%4)*.008,i,1);
  if(i%4===0)strand(root,[V(xx+.015,1.78,zz+.012),V(xx+.07,1.38,zz-.08),V(xx+.36,1.08+off,zz-.168),V(xx+.70,1.10+off,zz-.267)],.0028,i+1,1,true);
 }
 for(let i=0;i<9;i++)strand(root,[V(.1,1.98,-.16),V(.33,1.56+i*.026,-.26),V(.7,1.53+i*.016,-.27),V(1.02+i*.023,1.68+i*.018,-.25)],.0045,i+81,1.4,true);
 let lastTime=-1,lastWind=-1;
 const animate=(time:number,wind:number)=>{
  if(time===lastTime&&wind===lastWind)return;lastTime=time;lastWind=wind;
  root.rotation.z=Math.sin(time*.64)*.006;head.rotation.z=Math.sin(time*.5)*.018;head.rotation.y=Math.sin(time*.35)*.05;
  const t=time%5.3;blink.value=t<.17?Math.max(.035,Math.abs(t-.085)/.085):1;fallback.scale.y=blink.value;
  locks.forEach(({g,base,phase,flow})=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const t=Math.floor(i/7)/36,w=t*t*wind*flow,k=i*3;p.setXYZ(i,base[k]+Math.sin(time*1.75+phase*.23+t*5)*.065*w,base[k+1]+Math.sin(time*1.5+phase*.14+t*4)*.037*w,base[k+2]+Math.cos(time*1.55+phase*.25+t*5)*.045*w)}p.needsUpdate=true;g.computeVertexNormals()});
  const deform=(g:T.BufferGeometry,base:Float32Array)=>{const p=g.attributes.position;for(let i=0;i<p.count;i++){const k=i*3,x=base[k],y=base[k+1],z=base[k+2],fall=Math.max(0,(1.065-y)/.74),a=Math.atan2(z,x),f=1+.025*fall*wind*Math.sin(time*1.8+a*3);p.setXYZ(i,x*f+.023*fall*wind*Math.sin(time*1.4),y+.008*fall*wind*Math.sin(time*2+a*4),z*f)}p.needsUpdate=true;g.computeVertexNormals()};deform(skirtGeo,baseSkirt);deform(trimGeo,baseTrim);
 };
 return{root,animate,dispose:()=>faceTexture?.dispose()};
}
