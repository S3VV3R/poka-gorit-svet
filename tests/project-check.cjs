const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {root,scripts}=require('./support/load-game.cjs');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const files=[];
function scan(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){
  if(['node_modules','.git','test-results'].includes(e.name))continue;
  const full=path.join(folder,e.name);if(e.isDirectory())scan(full);else files.push(path.relative(root,full).split(path.sep).join('/'));
}}
scan(root);const exact=new Set(files);
function exists(relative){assert.ok(relative.startsWith('./'),'Use a relative Pages URL: '+relative);assert.ok(exact.has(relative.slice(2)),'Missing file or wrong filename case: '+relative);}
assert.ok(exact.has('.nojekyll'));assert.ok(Buffer.byteLength(index)<12000,'index.html stays small');
assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(index),'No inline game code');
assert.ok(!/<style>/i.test(index),'Styles live in CSS files');
for(const m of index.matchAll(/(?:src|href)="([^"]+)"/g))exists(m[1]);
const loaded=scripts();assert.ok(loaded.length>20);
for(const {name,code} of loaded){
  new vm.Script(code,{filename:name});
  if(name.startsWith('./js/')){
    assert.ok(!/C:[/\\]|127\.0\.0\.1|localhost|data:image\/[^;]+;base64,[A-Za-z0-9+/]{100}/.test(code),'No development paths or embedded image payloads in '+name);
    assert.ok(code.split('\n').length<750,'Split this responsibility further: '+name);
  }
}
new vm.Script(loaded.map(x=>x.code).join('\n'),{filename:'all-project-scripts'});
const manifest=vm.runInNewContext(fs.readFileSync(path.join(root,'assets/manifest.js'),'utf8')+'; ASSETS');
for(const [key,url] of Object.entries(manifest)){
  exists(url);const png=fs.readFileSync(path.join(root,url));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Valid PNG: '+key);
}
assert.equal(new Set(loaded.map(s=>s.name)).size,loaded.length,'No script is loaded twice');
console.log(`PASS: ${loaded.length} scripts, ${Object.keys(manifest).length} PNGs, syntax, dependency order syntax, relative URLs and case-sensitive paths`);
