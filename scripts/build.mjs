/** Vinext beta.5 exits immediately after prerender server.close(). On Windows,
 * libuv may still have async close callbacks queued. Drain those callbacks before
 * a SUCCESSFUL CLI exit; error exits remain unchanged and are never suppressed. */
const exit = process.exit.bind(process);
if(process.platform==='win32') process.exit=(code)=>{
  if(Number(code??0)!==0)return exit(code);
  setTimeout(()=>exit(code),1000);
};
process.argv=[process.execPath,new URL('../node_modules/vinext/dist/cli.js',import.meta.url).pathname,'build'];
await import(new URL('../node_modules/vinext/dist/cli.js',import.meta.url).href);

