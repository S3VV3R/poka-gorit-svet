// An in-memory adapter for the legacy regression harnesses. Never shipped or
// generated as a second source of truth; every run reads the actual project.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'../..');
function scripts(){
  const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
  return [...index.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(m=>({
    name:m[1],code:fs.readFileSync(path.join(root,m[1]),'utf8')
  }));
}
function html(){
  const source=scripts().map(({name,code})=>{
    if(name==='./assets/manifest.js'){
      const entries=vm.runInNewContext(code+'; ASSETS');
      for(const key of Object.keys(entries))entries[key]='data:image/png;base64,'+fs.readFileSync(path.join(root,entries[key])).toString('base64');
      code='const ASSETS = '+JSON.stringify(entries)+';';
    }
    return code;
  }).join('\n');
  return '<!doctype html><script>\n'+source+'\n</script>';
}
module.exports={root,scripts,html};
