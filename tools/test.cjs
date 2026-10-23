const {spawnSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const root=path.resolve(__dirname,'..');fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
for(const name of ['project-check','pages-http','startup-verify','device-performance-verify','orientation-verify','adaptive-verify','saves-verify','kids-kitchen-verify','dialogue-verify','menu-verify','layout-verify','verify','home-life-verify','engine-transition-verify']){
  const args=[path.join(root,'tests',name+'.cjs')];if(name==='engine-transition-verify')args.push('--home-tests');
  const result=spawnSync(process.execPath,args,{cwd:root,stdio:'inherit'});
  if(result.status!==0){process.exitCode=result.status||1;break;}
}
