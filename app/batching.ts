import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
/** Batch stationary meshes by material, leaving articulated groups untouched. */
export function batchStatic(root:T.Group, exclude:T.Object3D[]=[]){
 root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
 const batches=new Map<T.Material,{geometries:T.BufferGeometry[];meshes:T.Mesh[]}>();
 const visit=(obj:T.Object3D)=>{if(exclude.includes(obj))return;if(obj instanceof T.Mesh&&!Array.isArray(obj.material)){const m=obj.material;let b=batches.get(m);if(!b){b={geometries:[],meshes:[]};batches.set(m,b)}const clone=obj.geometry.index?obj.geometry.toNonIndexed():obj.geometry.clone();b.geometries.push(clone.applyMatrix4(inverse.clone().multiply(obj.matrixWorld)));b.meshes.push(obj)}else obj.children.slice().forEach(visit)};
 root.children.slice().forEach(visit);
 batches.forEach(({geometries,meshes},material)=>{const geometry=mergeGeometries(geometries,false);if(!geometry){geometries.forEach(g=>g.dispose());return}const mesh=new T.Mesh(geometry,material);root.add(mesh);meshes.forEach(m=>{m.removeFromParent();m.geometry.dispose()});geometries.forEach(g=>g.dispose())});
}

