import assert from 'node:assert/strict';
import {once} from 'node:events';
import http from 'node:http';
import {createLocalServer} from './serve-local.mjs';
const server=createLocalServer();server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
try{
 const r=await fetch(base);assert.equal(r.status,200);const html=await r.text();assert(html.includes('NOIR'));assert(!html.includes('Sorry, you have been blocked'));
 const paths=[...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(p=>p.startsWith('/')&&!p.startsWith('//'));
 for(const p of new Set([...paths,'/face-albedo-v2.png','/reference.webp'])){const a=await fetch(base+p,{method:'HEAD'});assert.equal(a.status,200,p)}
 const video=await fetch(base+'/reference.mp4',{headers:{Range:'bytes=0-127'}});assert.equal(video.status,206);assert.equal((await video.arrayBuffer()).byteLength,128);
 assert.equal((await fetch(base+'/not-a-file.js')).status,404);
 assert.equal((await fetch(base+'/.openai/hosting.json')).status,403);
 assert.equal((await fetch(base,{method:'POST'})).status,405);
 const traversal=await new Promise(resolve=>{http.get(base+'/%2e%2e%5cpackage.json',res=>{res.resume();resolve(res.statusCode)})});assert.equal(traversal,403);
 console.log(JSON.stringify({passed:true,html:'200',assets:new Set(paths).size+2,videoRange:'206',sourceFiles:'not exposed'}));
}finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
