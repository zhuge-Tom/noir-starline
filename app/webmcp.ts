import type { ViewMode } from './scene';
type Tool={name:string;title:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown};
type ModelContext={registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>};
export function registerSceneTools(setView:(view:ViewMode)=>void){
 const context=(document as Document & {modelContext?:ModelContext}).modelContext;
 if(!context?.registerTool)return()=>{};
 const lifecycle=new AbortController();
 try{void Promise.resolve(context.registerTool({name:'set_scene_view',title:'切换星海列车视角',description:'切换页面可见的电影、自由环绕、场景漫游或角色近景视角。',inputSchema:{type:'object',properties:{view:{type:'string',enum:['cinema','orbit','walk','close']}},required:['view'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Expected an object');const record=input as Record<string,unknown>;if(Object.keys(record).length!==1||!['cinema','orbit','walk','close'].includes(String(record.view)))throw new Error('Invalid scene view');setView(record.view as ViewMode);return{view:record.view,status:'selected'};}},{signal:lifecycle.signal})).catch(()=>{});}catch{/* Unsupported hosts leave ordinary controls intact. */}
 return()=>lifecycle.abort();
}
