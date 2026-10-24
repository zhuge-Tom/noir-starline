import * as T from 'three';
import data from './head-shell-data.json' with {type:'json'};
/** Closed extrusion of the supplied artwork silhouette. Shared boundary vertices
 * join front/back/walls; opaque edge colours prevent alpha-cutout cracks. */
export function closedHeadShell(){
 const p:number[]=[],c:number[]=[],idx:number[]=[],walls:number[]=[],skinWalls:number[]=[],n=data.n,stride=n+1,count=data.vertices.length;
 const tint=new T.Color(0xd7d9e5),colour=new T.Color();
 for(let back=0;back<2;back++)for(let i=0;i<count;i++){
  const [x,y,z]=data.vertices[i],py=1450-(y+2.325)*470;
  const thickness=.025+.275*Math.sqrt(Math.max(0,1-(x/.335)**2-((y+.005)/.35)**2));
  p.push(back?x*(1-.18*T.MathUtils.smoothstep(py,280,350)):x,y,z-(back?thickness:0));
  if(back)colour.set(0x272631);else {const rgb=data.colors[i];colour.setRGB(rgb[0]/255,rgb[1]/255,rgb[2]/255,T.SRGBColorSpace).multiply(tint)}
  c.push(colour.r,colour.g,colour.b);
 }
 const present=new Set(data.cells.map(([x,y])=>`${x},${y}`));
 for(const [x,y] of data.cells){
  const a=y*stride+x,b=a+1,d=a+stride,e=d+1;
  idx.push(a,d,b,b,d,e,a+count,b+count,d+count,b+count,e+count,d+count);
  const wall=(v:number,w:number)=>{const [vx,vy]=data.vertices[v];const target=vy<-.08&&Math.abs(vx)<.16?skinWalls:walls;target.push(v,w,v+count,w,w+count,v+count)};
  if(!present.has(`${x},${y-1}`))wall(b,a);
  if(!present.has(`${x},${y+1}`))wall(d,e);
  if(!present.has(`${x-1},${y}`))wall(a,d);
  if(!present.has(`${x+1},${y}`))wall(e,b);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setAttribute('color',new T.Float32BufferAttribute(c,3));geo.setIndex([...idx,...walls,...skinWalls]);geo.addGroup(0,idx.length,0);geo.addGroup(idx.length,walls.length,1);geo.addGroup(idx.length+walls.length,skinWalls.length,2);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,[new T.MeshBasicMaterial({vertexColors:true,side:T.DoubleSide,toneMapped:false}),new T.MeshBasicMaterial({color:0x272631,side:T.DoubleSide,toneMapped:false}),new T.MeshBasicMaterial({color:0xb6a8b5,side:T.DoubleSide,toneMapped:false})]);mesh.name='Closed original head shell';return mesh;
}
