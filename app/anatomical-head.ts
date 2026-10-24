import * as T from 'three';
/** A ring-built anatomical volume. Unlike silhouette extrusion, every horizontal
 * cross-section is elliptical and the underside rounds into a real chin. */
export function anatomicalHead(painted:T.Material,skin:T.Material,hair:T.Material){
 const profile=[
 [2.13,0,0,.025],[2.145,.042,.05,.030],[2.165,.075,.085,.03],
 [2.205,.137,.14,.020],[2.27,.18,.18,.008],[2.36,.224,.202,-.006],
 [2.46,.245,.212,-.018],[2.55,.228,.194,-.020],[2.63,.139,.119,-.018],[2.665,0,0,-.018]
 ];
 const rows=80,cols=96,pos:number[]=[],uv:number[]=[],front:number[]=[],back:number[]=[],under:number[]=[];
 const shape=(y:number)=>{let j=0;while(j<profile.length-2&&y>profile[j+1][0])j++;const t=(y-profile[j][0])/(profile[j+1][0]-profile[j][0]);return [1,2,3].map(k=>T.MathUtils.lerp(profile[j][k],profile[j+1][k],t))};
 pos.push(.018,2.13-2.325,.035);uv.push(.5,.7);
 for(let i=1;i<rows;i++){const y=T.MathUtils.lerp(2.13,2.665,i/rows),[r,d,z0]=shape(y);for(let j=0;j<cols;j++){
  const a=j/cols*Math.PI*2,x=.018+Math.sin(a)*r,f=Math.cos(a);
  const nose=.018*Math.exp(-(((x-.018)/.035)**2)-((y-2.205)/.035)**2)*Math.max(0,f)**12;
  pos.push(x,y-2.325,z0+f*d+nose);
  uv.push((425+x*470)/900,1-Math.min(435,1450-y*470)/1500);
 }}
 const top=pos.length/3;pos.push(.018,2.665-2.325,-.018);uv.push(.5,.85);
 const ring=(i:number,j:number)=>1+(i-1)*cols+(j+cols)%cols;
 for(let j=0;j<cols;j++){
  under.push(0,ring(1,j+1),ring(1,j));back.push(top,ring(rows-1,j),ring(rows-1,j+1));
  for(let i=1;i<rows-1;i++){
   const y=T.MathUtils.lerp(2.13,2.665,(i+.5)/rows),isFront=Math.cos((j+.5)/cols*Math.PI*2)>(y>2.31?.45:.03);
   const target=y<2.16?under:isFront&&y<2.43?front:back;
   const a=ring(i,j),b=ring(i,j+1),c=ring(i+1,j),d=ring(i+1,j+1);target.push(a,b,c,b,d,c);
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex([...front,...back,...under]);geo.addGroup(0,front.length,0);geo.addGroup(front.length,back.length,1);geo.addGroup(front.length+back.length,under.length,2);geo.computeVertexNormals();
 const normals=geo.attributes.normal,colours:number[]=[];for(let i=0;i<normals.count;i++){const f=.91+.09*Math.max(0,normals.getY(i)*.3+normals.getZ(i)*.7);colours.push(f,f,f)}geo.setAttribute('color',new T.Float32BufferAttribute(colours,3));
 const jawSkin=(skin as T.MeshBasicMaterial).clone();jawSkin.color.set(0xdedbdc);jawSkin.vertexColors=true;delete jawSkin.userData.characterSurface;
 const root=new T.Group();
 // Opaque, identical-volume core remains under alpha-cutout artwork, never a plate.
 const coreGeo=geo.clone();coreGeo.clearGroups();const core=new T.Mesh(coreGeo,jawSkin);core.scale.set(.997,.997,.997);core.name='Anatomical head core';root.add(core);
 const mesh=new T.Mesh(geo,[painted,hair,jawSkin]);mesh.name='Anatomical head and rounded jaw';root.add(mesh);
 return root;
}
