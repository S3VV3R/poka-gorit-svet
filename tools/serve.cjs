// Development server only. GitHub Pages serves the same files without Node.js.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json'};
function createServer(prefix='/'){
  if(!prefix.startsWith('/')||!prefix.endsWith('/'))throw new Error('Prefix must start and end with /');
  return http.createServer(async(req,res)=>{
    try{
      if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(!pathname.startsWith(prefix)){res.writeHead(404);res.end('Not found');return;}
      const relative=pathname.slice(prefix.length)||'index.html';
      const file=path.resolve(root,relative),inside=path.relative(root,file);
      if(inside.startsWith('..')||path.isAbsolute(inside)){res.writeHead(403);res.end('Forbidden');return;}
      const content=await fs.readFile(file);
      res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      res.end(req.method==='HEAD'?undefined:content);
    }catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('Not found');}
  });
}
if(require.main===module){
  const port=Number(process.env.PORT||8765),prefix=process.env.SITE_PREFIX||'/';
  const server=createServer(prefix);
  server.on('error',error=>{console.error('Не удалось запустить сервер:',error.message);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Игра: http://127.0.0.1:${port}${prefix}\nОстановить: Ctrl+C`));
}
module.exports={createServer,root};
