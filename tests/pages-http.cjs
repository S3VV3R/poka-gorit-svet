// Exercise actual HTTP responses at both / and /repository-name/, like Pages.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {createServer}=require('../tools/serve.cjs');
(async()=>{
  for(const prefix of ['/','/repository-name/']){
    const server=createServer(prefix);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    try{
      const origin=`http://127.0.0.1:${server.address().port}`,base=origin+prefix;
      const response=await fetch(base);assert.equal(response.status,200);const html=await response.text();
      const urls=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1]);
      let manifest;
      for(const relative of urls){const url=new URL(relative,base);assert.ok(url.pathname.startsWith(prefix));
        const r=await fetch(url);assert.equal(r.status,200,relative);const content=await r.text();
        if(relative.endsWith('.js')){assert.ok(r.headers.get('content-type').includes('javascript'));new vm.Script(content);}
        if(relative.endsWith('.css'))assert.ok(r.headers.get('content-type').includes('text/css'));
        if(relative==='./assets/manifest.js')manifest=vm.runInNewContext(content+'; ASSETS');
      }
      for(const relative of Object.values(manifest)){
        const r=await fetch(new URL(relative,base));assert.equal(r.status,200,relative);
        assert.equal(r.headers.get('content-type'),'image/png');assert.ok((await r.arrayBuffer()).byteLength>8);
      }
      const missing=await fetch(base+'missing-file.js');assert.equal(missing.status,404);
      console.log('PASS: HTTP scripts, CSS and all textures under '+prefix);
    }finally{await new Promise(resolve=>server.close(resolve));}
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
