import * as T from 'three';
import { batchStatic } from './batching.ts';
import { buildDetailedCharacter } from './character.ts';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Water } from 'three/addons/objects/Water.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export type ViewMode='cinema'|'orbit'|'walk'|'close'|'inspect';
export type SceneOptions={wind:number;waves:number;stars:number;paused:boolean;reflections:boolean;quality:'high'|'low'};
export type SceneAPI={setHairVisible:(v:boolean)=>void;ready:Promise<void>;setOptions:(o:SceneOptions)=>void;setView:(v:ViewMode)=>void;key:(k:string,v:boolean)=>void;setSuspended:(v:boolean)=>void;dispose:()=>void};
const v3=(x=0,y=0,z=0)=>new T.Vector3(x,y,z);
function random(seed:number){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const mat=(color:number,metalness=.3,roughness=.48)=>new T.MeshStandardMaterial({color,metalness,roughness});
function box(g:T.Group,w:number,h:number,d:number,x:number,y:number,z:number,m:T.Material){const a=new T.Mesh(new T.BoxGeometry(w,h,d),m);a.position.set(x,y,z);g.add(a);return a}
function ellipsoid(g:T.Group,x:number,y:number,z:number,sx:number,sy:number,sz:number,m:T.Material){const a=new T.Mesh(new T.SphereGeometry(1,28,20),m);a.position.set(x,y,z);a.scale.set(sx,sy,sz);g.add(a);return a}
function tube(g:T.Group,points:T.Vector3[],radius:number,m:T.Material){const a=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),Math.max(8,points.length*5),radius,6,false),m);g.add(a);return a}
function rod(g:T.Group,a:T.Vector3,b:T.Vector3,r:number,m:T.Material,r2=r){const delta=b.clone().sub(a);const o=new T.Mesh(new T.CylinderGeometry(r2,r,delta.length(),8),m);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(v3(0,1,0),delta.normalize());g.add(o);return o}
export function buildTrain(){
 const root=new T.Group();root.name='Night train';
 const body=mat(0x101a3c,.65,.34),frame=mat(0x36436a,.7,.32),dark=mat(0x080f22,.7,.5),trim=mat(0x7d81a8,.65,.3),floor=mat(0x20283f,.3,.6),gold=mat(0xaca185,.65,.35);
 const glass=new T.MeshStandardMaterial({color:0xffe2a2,emissive:0xffd69b,emissiveIntensity:2.1,roughness:.25});
 const wheels:T.Group[]=[];
 for(let car=0;car<3;car++){
  const z=-7.5-car*14.4,g=new T.Group();g.position.z=z;root.add(g);g.name=`carriage-${car}`;
  box(g,3.6,.35,13,0,1.13,0,dark);box(g,3.4,1.35,12.6,0,1.92,0,body);
  for(const side of [-1,1]){
   box(g,.17,.62,12.6,side*1.7,4.15,0,body);
   for(let i=0;i<7;i++)box(g,.2,1.65,.43,side*1.7,3.1,-6.1+i*2.03,body);
   for(let i=0;i<6;i++){
    const zz=-5.09+i*2.03;
    box(g,.13,1.44,1.59,side*1.705,3.12,zz,frame);
    box(g,.145,1.25,1.42,side*1.79,3.15,zz,glass);
    box(g,.17,.065,1.46,side*1.81,3.05,zz,frame);
    box(g,.18,.09,1.62,side*1.8,2.46,zz,trim);
    box(g,.05,.95,.11,side*1.88,3.23,zz-.57,gold);
   }
   for(const yy of [1.44,2.18,4.38])box(g,.04,.035,12.64,side*1.8,yy,0,trim);
   for(let s=0;s<38;s++)for(const yy of [1.53,4.27])ellipsoid(g,side*1.81,yy,-6.1+s*.33,.025,.025,.025,trim);
  }
  // Curved coach roof, not a flat placeholder box.
  const shape=new T.Shape();shape.moveTo(-1.88,0);shape.quadraticCurveTo(-1.88,.74,0,.83);shape.quadraticCurveTo(1.88,.74,1.88,0);shape.lineTo(-1.88,0);
  const roof=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:13,bevelEnabled:false,curveSegments:20}),dark);roof.position.set(0,4.46,-6.5);g.add(roof);
  for(let j=0;j<5;j++)box(g,.68,.16,.65,0,5.3,-4.6+j*2.3,frame);
  for(const end of [-1,1]){
   box(g,1.07,3.07,.16,-1.17,2.93,end*6.32,body);box(g,1.07,3.07,.16,1.17,2.93,end*6.32,body);
   box(g,1.28,.38,.17,0,4.25,end*6.33,frame);box(g,1.22,2.7,.10,0,2.71,end*6.34,floor);
   box(g,.75,.94,.035,0,3.35,end*6.42,new T.MeshStandardMaterial({color:0x444b67,emissive:0x4b537a,emissiveIntensity:.18}));
   rod(g,v3(.43,2.4,end*6.46),v3(.43,2.7,end*6.46),.036,gold);
  }
  for(const zz of [-4.25,4.25]){
   box(g,2.75,.28,2.25,0,.63,zz,dark);
   for(const dz of [-.64,.64]){
    const axle=new T.Group();axle.position.set(0,.62,zz+dz);g.add(axle);wheels.push(axle);
    rod(axle,v3(-1.73,0,0),v3(1.73,0,0),.09,trim);
    for(const xx of [-1.54,1.54]){
     const wh=new T.Mesh(new T.CylinderGeometry(.52,.52,.18,24),dark);wh.rotation.z=Math.PI/2;wh.position.x=xx;axle.add(wh);
     const rim=new T.Mesh(new T.TorusGeometry(.4,.04,6,24),frame);rim.rotation.y=Math.PI/2;rim.position.x=xx+Math.sign(xx)*.1;axle.add(rim);
     for(let a=0;a<8;a++){const theta=a*Math.PI/4;rod(axle,v3(xx,0,0),v3(xx,.38*Math.cos(theta),.38*Math.sin(theta)),.025,frame)}
    }
   }
  }
  if(car<2){box(g,2.65,2.7,1.55,0,2.7,-7,dark);for(let a=0;a<9;a++){box(g,2.8,.06,.08,0,4.1,-6.5-a*.13,frame);for(const x of [-1.36,1.36])box(g,.04,2.65,.04,x,2.7,-6.5-a*.13,frame)}}
 }
 // Exposed rear platform, ornamental railings, step, poles and canopy.
 box(root,3.7,.24,2.65,0,1.18,.22,floor);
 for(let i=0;i<12;i++)box(root,3.5,.023,.025,0,1.32,-.95+i*.21,trim);
 const railY=2.67;
 rod(root,v3(-1.73,railY,1.55),v3(1.73,railY,1.55),.058,frame);
 for(const x of [-1.74,1.74]){
  rod(root,v3(x,railY,-1.05),v3(x,railY,1.55),.055,frame);
  rod(root,v3(x,1.35,1.55),v3(x,4.7,1.55),.04,trim);
  rod(root,v3(x,1.35,-1),v3(x,4.65,-1),.045,frame);
  box(root,.08,.10,2.7,x,1.39,.23,frame);
  for(let j=0;j<7;j++)rod(root,v3(x,1.4,-.95+j*.4),v3(x,railY,-.95+j*.4),.035,frame);
  tube(root,[v3(x,1.05,1.4),v3(x,.9,1.7),v3(x,.82,2.06)],.045,trim);
 }
 for(let i=0;i<11;i++){
  const x=-1.68+i*.336;rod(root,v3(x,1.35,1.55),v3(x,railY,1.55),.032,frame);
  const pts=[];for(let j=0;j<22;j++){const a=j/21*Math.PI*2.5;const r=.105*(1-j/26);pts.push(v3(x+.12+Math.cos(a)*r,2.48+Math.sin(a)*r,1.55))}tube(root,pts,.018,frame);
 }
 box(root,3.5,.10,.09,0,1.39,1.55,frame);box(root,2.8,.12,.55,0,.84,1.91,frame);box(root,2.55,.1,.4,0,.57,2.2,dark);
 for(let i=0;i<4;i++)box(root,2.7,.018,.022,0,.91,1.72+i*.11,trim);
 box(root,3.92,.13,2.78,0,4.72,.26,dark);box(root,3.95,.07,2.86,0,4.8,.24,frame);
 for(const x of [-1.55,1.55]){
  const lamp=new T.Mesh(new T.SphereGeometry(.08,12,8),new T.MeshBasicMaterial({color:0xff877e}));lamp.position.set(x,1.56,1.68);root.add(lamp);
 }
 const lamp=new T.PointLight(0x91a8de,2.4,7,2);lamp.position.set(.2,4.3,.7);root.add(lamp);
 const fill=new T.PointLight(0xffd99b,3,6,2);fill.position.set(-2.2,3,-3);root.add(fill);
 wheels.forEach(w=>batchStatic(w));batchStatic(root,wheels);return{root,wheels};
}
function makeSky(scene:T.Scene){
 const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{brightness:{value:.8}},vertexShader:`varying vec3 vDirection;void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec3 vDirection;uniform float brightness;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){float n=0.;float a=.5;for(int i=0;i<5;i++){n+=noise(p)*a;p=p*2.03+vec3(13.2,3.1,7.7);a*=.5;}return n;}
 void main(){vec3 d=normalize(vDirection);float horizon=pow(1.-abs(d.y),4.);vec3 col=mix(vec3(.006,.01,.034),vec3(.045,.075,.18),horizon);float band=exp(-pow((d.y-.22-d.x*.38)*3.4,2.));float n=fbm(d*5.8+vec3(2,7,3));float cloud=pow(n,2.5)*band;col+=mix(vec3(.09,.11,.32),vec3(.15,.08,.28),fbm(d*11.))*cloud*2.2*brightness;gl_FragColor=vec4(col,1.);}`});
 const sky=new T.Mesh(new T.SphereGeometry(350,36,20),skyMat);scene.add(sky);
 const rng=random(81),p:number[]=[],sz:number[]=[],phase:number[]=[],colors:number[]=[];
 for(let i=0;i<6500;i++){const y=.012+rng()*.987,a=rng()*Math.PI*2,r=210+rng()*65;const q=Math.sqrt(1-y*y);p.push(Math.cos(a)*q*r,y*r,Math.sin(a)*q*r);sz.push(i%19===0?3.4+rng()*2: .6+rng()*1.7);phase.push(rng()*Math.PI*2);const c=new T.Color().setHSL(.57+rng()*.2,.2+rng()*.25,.68+rng()*.25);colors.push(c.r,c.g,c.b)}
 const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p,3));geometry.setAttribute('aSize',new T.Float32BufferAttribute(sz,1));geometry.setAttribute('phase',new T.Float32BufferAttribute(phase,1));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));
 const material=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,blending:T.AdditiveBlending,uniforms:{time:{value:0},brightness:{value:.8},pixelRatio:{value:1}},vertexShader:`attribute float aSize;attribute float phase;uniform float time;uniform float pixelRatio;varying float alpha;varying vec3 vColor;void main(){vColor=color;alpha=.65+.35*sin(time*.7+phase);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=aSize*pixelRatio;}`,fragmentShader:`uniform float brightness;varying float alpha;varying vec3 vColor;void main(){vec2 p=gl_PointCoord-.5;float d=length(p);float light=exp(-d*10.)+pow(max(0.,1.-abs(p.x)*16.),5.)*max(0.,.5-abs(p.y))*.3+pow(max(0.,1.-abs(p.y)*16.),5.)*max(0.,.5-abs(p.x))*.3;gl_FragColor=vec4(vColor*1.8,light*alpha*brightness);}`});const stars=new T.Points(geometry,material);scene.add(stars);return{material,skyMat};
}
function waterNormals(){const size=256,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size*Math.PI*2,v=y/size*Math.PI*2;const dx=.4*Math.cos(u*8+v*3)+.24*Math.cos(u*19-v*11)+.12*Math.sin(u*37+v*23);const dy=.34*Math.sin(u*4+v*9)+.23*Math.cos(u*13-v*17)+.12*Math.sin(u*31+v*29);const n=v3(dx,dy,1).normalize(),i=(y*size+x)*4;data[i]=(n.x*.5+.5)*255;data[i+1]=(n.y*.5+.5)*255;data[i+2]=(n.z*.5+.5)*255;data[i+3]=255}const tex=new T.DataTexture(data,size,size,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.needsUpdate=true;return tex}
export function createScene(host:HTMLDivElement,initial:SceneOptions,onStats:(text:string)=>void):SceneAPI{
 let options={...initial},mode:ViewMode='close',disposed=false,suspended=false,time=0,frames=0,statTime=0,firstFrame=true;
 const scene=new T.Scene();scene.fog=new T.FogExp2(0x111e48,.0027);
 const camera=new T.PerspectiveCamera(43,host.clientWidth/host.clientHeight,.06,650);camera.position.set(1.0,3.65,5.8);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setSize(host.clientWidth,host.clientHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.outputColorSpace=T.SRGBColorSpace;renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','拖动环绕，WASD 移动');host.appendChild(renderer.domElement);
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,2.82,.6);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=1.4;controls.maxDistance=85;controls.maxPolarAngle=Math.PI*.82;controls.update();
 scene.add(new T.HemisphereLight(0xa6b9ff,0x253b7c,1.1));const moon=new T.DirectionalLight(0xb4c3ff,1.45);moon.position.set(10,16,8);scene.add(moon);const blue=new T.DirectionalLight(0x5f79ed,1.2);blue.position.set(-8,5,-10);scene.add(blue);
 const sky=makeSky(scene),train=buildTrain(),character=buildDetailedCharacter();scene.add(train.root);train.root.add(character.root);
 const normals=waterNormals();const water=new Water(new T.PlaneGeometry(1100,1100),{textureWidth:1024,textureHeight:1024,waterNormals:normals,sunDirection:v3(-.4,.5,-1).normalize(),sunColor:0x778ace,waterColor:0x09132e,distortionScale:1.8,fog:true,alpha:1});water.rotation.x=-Math.PI/2;water.position.y=-.015;water.material.uniforms.size.value=3.8;
 // Boost reflection at elevated reference-camera angles, while retaining Fresnel.
 water.material.fragmentShader=water.material.fragmentShader.replace('rf0 = 0.02','rf0 = 0.48');scene.add(water);
 const still=new T.Mesh(new T.PlaneGeometry(1100,1100),new T.MeshStandardMaterial({color:0x0b1c43,metalness:.25,roughness:.5}));still.rotation.x=-Math.PI/2;still.position.y=-.018;still.visible=false;scene.add(still);
 const rails=new T.Group();const railmat=mat(0x6c82b0,.8,.28);for(const x of [-1.05,1.05])box(rails,.05,.055,240,x,.045,-45,railmat);const ties=mat(0x111a30,.4,.6);for(let i=0;i<140;i++)box(rails,2.7,.045,.14,0,.005,30-i*1.25,ties);scene.add(rails);
 const rng=random(13),particleGeo=new T.BufferGeometry(),pos=new Float32Array(150*3),col=new Float32Array(150*3);for(let i=0;i<150;i++){pos[i*3]=(rng()-.5)*45;pos[i*3+1]=rng()*12+.4;pos[i*3+2]=(rng()-.5)*70;const c=new T.Color().setHSL(.48+rng()*.35,.8,.66);col.set([c.r,c.g,c.b],i*3)}particleGeo.setAttribute('position',new T.BufferAttribute(pos,3));particleGeo.setAttribute('color',new T.BufferAttribute(col,3));
 const particleMat=new T.ShaderMaterial({vertexColors:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:`uniform float time;varying vec3 vColor;void main(){vColor=color;vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=min(12.,65./max(1.,-p.z))*(.7+.3*sin(time+position.x));}`,fragmentShader:`varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5);gl_FragColor=vec4(vColor,exp(-r*r*22.)*.7);}`});const particles=new T.Points(particleGeo,particleMat);scene.add(particles);
 const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(host.clientWidth,host.clientHeight),.22,.4,1.25);composer.addPass(bloom);composer.addPass(new OutputPass());
 const keys=new Set<string>(),forward=v3(),right=v3(),move=v3();let yaw=0,pitch=0,drag=false,lastX=0,lastY=0,walkDistance=10;
 let transition:{p:T.Vector3;t:T.Vector3}|null=null;
 const setView=(v:ViewMode)=>{mode=v;keys.clear();controls.enabled=v!=='walk';controls.autoRotate=false;drag=false;const presets={inspect:[v3(.72,3.2,2.05),v3(0,3.59,.61)],cinema:[v3(8.5,7.6,12),v3(-.5,2.15,-2.8)],orbit:[v3(13,7,15),v3(0,2,-8)],close:[v3(1.0,3.65,5.8),v3(0,2.82,.6)],walk:[v3(3.1,2.9,5.6),v3(0,2.5,.6)]};const[p,t]=presets[v];transition={p,t};if(v==='walk'){const d=t.clone().sub(p).normalize();yaw=Math.atan2(-d.x,-d.z);pitch=Math.asin(d.y);walkDistance=t.distanceTo(p)}renderer.domElement.focus({preventScroll:true})};
 const onDown=(e:PointerEvent)=>{renderer.domElement.focus({preventScroll:true});if(mode==='cinema')controls.autoRotate=false;if(mode==='walk'){drag=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId)}};
 const onMove=(e:PointerEvent)=>{if(!drag||mode!=='walk')return;yaw-=(e.clientX-lastX)*.004;pitch=T.MathUtils.clamp(pitch-(e.clientY-lastY)*.004,-1.4,1.4);lastX=e.clientX;lastY=e.clientY};const onUp=()=>{drag=false};
 const isUI=(e:KeyboardEvent)=>(e.target instanceof HTMLElement)&&!!e.target.closest('button,input,[role="slider"],[role="dialog"]');
 const onKey=(e:KeyboardEvent)=>{if(isUI(e))return;if(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();keys.add(e.code);transition=null}};
 const keyUp=(e:KeyboardEvent)=>keys.delete(e.code);const blur=()=>{keys.clear();drag=false};
 renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointerup',onUp);renderer.domElement.addEventListener('pointercancel',onUp);window.addEventListener('keydown',onKey);window.addEventListener('keyup',keyUp);window.addEventListener('blur',blur);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);composer.setSize(w,h)};const observer=new ResizeObserver(resize);observer.observe(host);
 const clock=new T.Clock();let raf=0;
 const updateOptions=(o:SceneOptions)=>{const prev=options;options={...o};water.visible=o.reflections;still.visible=!o.reflections;water.material.uniforms.distortionScale.value=.15+o.waves*3.2;sky.material.uniforms.brightness.value=o.stars;sky.skyMat.uniforms.brightness.value=o.stars;if(prev.quality!==o.quality||firstFrame){const ratio=Math.min(devicePixelRatio,o.quality==='high'?1.65:1);renderer.setPixelRatio(ratio);composer.setPixelRatio(ratio);sky.material.uniforms.pixelRatio.value=ratio;resize()}};
 updateOptions(options);
 const animate=()=>{if(disposed)return;raf=requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(document.hidden||suspended)return;if(!options.paused)time+=dt;
  if(transition){camera.position.lerp(transition.p,1-Math.exp(-dt*5));controls.target.lerp(transition.t,1-Math.exp(-dt*5));camera.lookAt(controls.target);if(camera.position.distanceTo(transition.p)<.02){camera.position.copy(transition.p);controls.target.copy(transition.t);transition=null}}
  else if(mode==='walk'){
   forward.set(-Math.sin(yaw),0,-Math.cos(yaw));right.set(Math.cos(yaw),0,-Math.sin(yaw));move.set(0,0,0);
   if(keys.has('KeyW')||keys.has('ArrowUp'))move.add(forward);if(keys.has('KeyS')||keys.has('ArrowDown'))move.sub(forward);if(keys.has('KeyD')||keys.has('ArrowRight'))move.add(right);if(keys.has('KeyA')||keys.has('ArrowLeft'))move.sub(right);if(keys.has('KeyE'))move.y+=1;if(keys.has('KeyQ'))move.y-=1;
   const old=camera.position.clone();camera.position.addScaledVector(move.normalize(),dt*(keys.has('ShiftLeft')||keys.has('ShiftRight')?8:3.2));camera.position.y=T.MathUtils.clamp(camera.position.y,.5,45);camera.position.x=T.MathUtils.clamp(camera.position.x,-100,100);camera.position.z=T.MathUtils.clamp(camera.position.z,-95,70);
   // Keep the observer outside opaque coach bodies; platform stays reachable.
   if(Math.abs(camera.position.x)<1.97&&camera.position.z<-.95&&camera.position.z>-43&&camera.position.y<5.55){camera.position.x=old.x;camera.position.z=old.z}
   const look=v3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(look));controls.target.copy(camera.position).addScaledVector(look,walkDistance);
  }else{
   camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();move.set(0,0,0);if(keys.has('KeyW'))move.add(forward);if(keys.has('KeyS'))move.sub(forward);if(keys.has('KeyA'))move.sub(right);if(keys.has('KeyD'))move.add(right);if(keys.has('KeyQ'))move.y-=1;if(keys.has('KeyE'))move.y+=1;move.normalize().multiplyScalar(dt*4);camera.position.add(move);controls.target.add(move);if(mode==='cinema'&&!keys.size){controls.autoRotate=!options.paused;controls.autoRotateSpeed=.13}controls.update(dt);
  }
  character.animate(time,options.wind);train.root.position.y=Math.sin(time*1.4)*.008;train.wheels.forEach(w=>w.rotation.x=-time*.55);rails.position.z=(time*1.6)%1.25;water.material.uniforms.time.value=time*.3;sky.material.uniforms.time.value=time;particleMat.uniforms.time.value=time;
  if(!options.paused){const p=particleGeo.attributes.position;for(let i=0;i<p.count;i++){p.setZ(i,p.getZ(i)+dt*(.65+options.wind*1.5));if(p.getZ(i)>26)p.setZ(i,-44)}p.needsUpdate=true}
  if(options.quality==='high')composer.render();else renderer.render(scene,camera);
  firstFrame=false;frames++;statTime+=dt;if(statTime>1.2){onStats(`${Math.round(frames/statTime)} FPS · ${options.quality==='high'?'高清':'流畅'}渲染`);frames=0;statTime=0}
 };
 animate();
 return{setHairVisible:character.setHairVisible,ready:character.ready,setOptions:updateOptions,setView,key:(k,v)=>{if(v){keys.add(k);transition=null}else keys.delete(k)},setSuspended:v=>{suspended=v;keys.clear()},dispose:()=>{disposed=true;cancelAnimationFrame(raf);observer.disconnect();controls.dispose();window.removeEventListener('keydown',onKey);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',blur);renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('pointercancel',onUp);const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();scene.traverse(o=>{const m=o as T.Mesh;if(m.geometry)geometries.add(m.geometry);if(m.material)(Array.isArray(m.material)?m.material:[m.material]).forEach(v=>materials.add(v))});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());character.dispose();normals.dispose();composer.dispose();bloom.dispose();renderer.dispose();renderer.domElement.remove()}};
}




