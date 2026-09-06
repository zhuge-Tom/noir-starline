import {createServer} from 'node:http';
import {createReadStream, existsSync} from 'node:fs';
import {stat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/client/',import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.rsc':'text/x-component','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.mp4':'video/mp4','.woff2':'font/woff2'};
export function createLocalServer(){return createServer(async(req,res)=>{
 const end=(code,message)=>{res.writeHead(code,{'Content-Type':'text/plain; charset=utf-8'});res.end(message)};
 if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return end(405,'Method not allowed')}
 if(req.url==='/__noir_health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end(JSON.stringify({app:'noir-starline',mode:'local-static'}))}
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch{return end(400,'Invalid path')}
 if(pathname.includes('\0')||pathname.includes('\\')||pathname.split('/').some(s=>s==='..'||s.startsWith('.')))return end(403,'Forbidden');
 const filename=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));
 const inside=p=>p.startsWith(path.resolve(root)+path.sep);
 if(!inside(filename))return end(403,'Forbidden');
 try{
  const actual=await realpath(filename);if(!inside(actual))return end(403,'Forbidden');const info=await stat(actual);if(!info.isFile())return end(404,'Not found');
  const headers={'Content-Type':mime[path.extname(actual)]||'application/octet-stream','Accept-Ranges':'bytes','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'};
  let start=0,endByte=info.size-1,status=200;
  if(req.headers.range){const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);if(!match||(!match[1]&&!match[2]))return end(416,'Invalid range');
   if(!match[1])start=Math.max(0,info.size-Number(match[2]));else start=Number(match[1]);if(match[1]&&match[2])endByte=Math.min(endByte,Number(match[2]));
   if(!Number.isSafeInteger(start)||!Number.isSafeInteger(endByte)||start>endByte||start>=info.size){res.setHeader('Content-Range',`bytes */${info.size}`);return end(416,'Invalid range')}
   status=206;headers['Content-Range']=`bytes ${start}-${endByte}/${info.size}`;
  }
  headers['Content-Length']=String(Math.max(0,endByte-start+1));res.writeHead(status,headers);if(req.method==='HEAD'||info.size===0)return res.end();
  const stream=createReadStream(actual,{start,end:endByte});stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
 }catch(error){end(error.code==='ENOENT'?404:500,error.code==='ENOENT'?'Not found':'Unable to read asset')}
})}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(!existsSync(path.join(root,'index.html'))){console.error('Build missing. Run npm run build first.');process.exit(1)}
 const port=Number(process.env.PORT||3000);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
 const server=createLocalServer();server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`Port ${port} is already in use.`:error.message);process.exitCode=1});
 server.listen(port,'127.0.0.1',()=>console.log(`NOIR local: http://127.0.0.1:${port}/`));
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close());
}
