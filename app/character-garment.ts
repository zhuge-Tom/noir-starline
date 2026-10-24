import * as T from 'three';

/** A continuous, two-sided fabric ribbon with a thin closed edge. Its folds
 * gather at the seam and fan out towards the free edge. */
export function ruffleBand(y:number,rx:number,rz:number,height:number,folds:number,material:T.Material){
 const segments=192,rows=8,p:number[]=[],ix:number[]=[];
 const stride=rows+1,layerSize=(segments+1)*stride;
 for(let side=0;side<2;side++)for(let j=0;j<=segments;j++){
  const a=j/segments*Math.PI*2,phase=a*folds+.32*Math.sin(a*3);
  for(let i=0;i<=rows;i++){
   const t=i/rows,w=Math.sin(phase),flaring=t*(.014+.008*w);
   p.push(Math.sin(a)*(rx+flaring),y-t*height+Math.sin(phase+.5)*t*.012+side*.0025,Math.cos(a)*(rz+flaring*.7));
   if(j<segments&&i<rows){const k=side*layerSize+j*stride+i;
    if(side===0)ix.push(k,k+stride,k+1,k+1,k+stride,k+stride+1);
    else ix.push(k,k+1,k+stride,k+1,k+stride+1,k+stride);
   }
  }
 }
 for(let j=0;j<segments;j++)for(const i of [0,rows]){
  const a=j*stride+i,b=a+stride,c=a+layerSize,d=b+layerSize;
  ix.push(a,c,b,b,c,d);
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(ix);geo.computeVertexNormals();
 return new T.Mesh(geo,material);
}

export function shoulderRuffle(side:number,material:T.Material){
 const p:number[]=[],ix:number[]=[],rows=8,segments=64;
 for(let j=0;j<=segments;j++){
  const t=j/segments,a=t*Math.PI;
  for(let i=0;i<=rows;i++){
   const u=i/rows,fold=Math.sin(t*Math.PI*16+.4);
   p.push(side*(.254+.038*Math.sin(a)+u*(.045+.006*fold)),2.004+.043*Math.sin(a)-u*.024+u*fold*.008,.13-t*.25);
   if(j<segments&&i<rows){const k=j*(rows+1)+i;ix.push(k,k+1,k+rows+1,k+1,k+rows+2,k+rows+1)}
  }
 }
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(ix);geo.computeVertexNormals();
 const mesh=new T.Mesh(geo,material);mesh.name=`Folded shoulder trim ${side}`;return mesh;
}
