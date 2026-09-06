import {spawn} from 'node:child_process';
import {mkdirSync,openSync,closeSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const project=fileURLToPath(new URL('../',import.meta.url));
const url='http://127.0.0.1:3000/';
async function health(){try{const response=await fetch(url+'__noir_health',{signal:AbortSignal.timeout(1000)});return response.ok&&(await response.json()).app==='noir-starline'}catch{return false}}
if(await health()){console.log(url);process.exit(0)}
const logdir=new URL('../work/',import.meta.url);mkdirSync(logdir,{recursive:true});
const out=openSync(new URL('local-server.log',logdir),'a'),err=openSync(new URL('local-server-error.log',logdir),'a');
const child=spawn(process.execPath,[fileURLToPath(new URL('./serve-local.mjs',import.meta.url))],{cwd:project,detached:true,windowsHide:true,stdio:['ignore',out,err],env:{...process.env,PORT:'3000'}});
child.unref();closeSync(out);closeSync(err);
let ready=false;for(let i=0;i<25;i++){await new Promise(resolve=>setTimeout(resolve,200));if(await health()){ready=true;break}}
if(!ready){console.error('Local server could not start. Check whether port 3000 is already in use. See work/local-server-error.log.');process.exitCode=1}else console.log(url);
