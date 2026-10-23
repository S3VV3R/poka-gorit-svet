// Synthetic storage and DOM only: never reads the player's browser profile.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const storage=new Map(),writes=[],css={},toasts=[],downloads=[];
let failKey=null,blocked=false;
const walk=node=>[node,...node.children.flatMap(walk)];
class Element {
  constructor(tag){this.tagName=tag;this.children=[];this.events={};this.attrs={};this.hidden=false;this.style={};this.dataset={};this.textContent='';this.className='';this.classes=new Set();this.classList={add:c=>this.classes.add(c),remove:c=>this.classes.delete(c),toggle(){}};}
  append(...nodes){for(const n of nodes){n.parent=this;this.children.push(n);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,fn){(this.events[k]??=[]).push(fn);}
  async fire(k,e={}){for(const fn of this.events[k]||[])await fn({target:this,stopPropagation(){},preventDefault(){},...e});}
  focus(){document.activeElement=this;}
  remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}
  click(){downloads.push(this);}
  getClientRects(){return this.hidden?[]:[{}];}
  closest(){return ['button','input','select'].includes(this.tagName)?this:null;}
  querySelectorAll(selector){return walk(this).slice(1).filter(n=>selector.split(',').some(s=>s.startsWith(n.tagName)&&!n.disabled));}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
}
const document={body:new Element('body'),createElement:t=>new Element(t),addEventListener(){},documentElement:{style:{setProperty:(k,v)=>css[k]=v}}};
const context={document,Blob,URL:{createObjectURL(blob){this.blob=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout:fn=>fn(),
  console:{warn(){}},Audio:{stopMelody(){},unlock(){},setMusicVolume(){},setSfxVolume(){}},Phaser:{Scene:class{}},
  Chronicle:{close(){},panel:null},GameplayScene:class{},
  localStorage:{getItem:k=>{if(blocked)throw new Error('blocked');return storage.get(k)||null;},setItem:(k,v)=>{if(blocked||k===failKey)throw Object.assign(new Error('quota'),{name:'QuotaExceededError'});storage.set(k,v);writes.push(k);}}};
context.window=context;vm.createContext(context);
for(const file of ['core/config','core/default-state','core/save-format','core/user-settings','core/save-system','core/save-slots','core/state-helpers','systems/tutorial','ui/adaptive-layout','ui/adaptive-content','ui/adaptive-menus','ui/adaptive-saves','ui/adaptive-settings','ui/adaptive-tutorial','ui/main-menu'])
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),context,{filename:file});
const api=vm.runInContext('({SaveFormat,SaveSystem,UserSettings,Tutorial,AdaptiveUI,MainMenuScene,DEFAULT_STATE,CFG,textSpeedMs,get state(){return GameState},set state(v){GameState=v}})',context);
const {SaveFormat:F,SaveSystem:S,UserSettings:P,Tutorial:T,AdaptiveUI:ui}=api,key=api.CFG.SAVE_KEY;
const fresh=chapter=>Object.assign(api.DEFAULT_STATE(),{chapter});
const snapshot=()=>JSON.stringify([...storage]);
const buttons=(root,text)=>walk(root).filter(n=>n.tagName==='button'&&n.textContent===text);
const click=async(root,text,index=0)=>{const b=buttons(root,text)[index];assert.ok(b,'button exists: '+text);await b.fire('click');};
ui.root=new Element('div');ui.releaseControls=()=>{};ui.createMenus();ui.createSaveTools();ui.createTutorial();ui.createContent();
ui.ui={saveToast:t=>toasts.push(t),resetForScene(){}};
ui.game={scene:{getScenes:()=>[],stop(){},start(k){this.started=k;}}};
(async()=>{
  const legacy={chapter:'kids',flags:{metTamir:true},relationship:{trust:4}};
  storage.set(key,JSON.stringify(legacy));assert.equal(S.load(),true);
  assert.equal(api.state.relationship.trust,4);assert.equal(api.state.settings.textSize,'normal');assert.equal(T.step(),null);
  assert.equal(S.save(),true);assert.equal(JSON.parse(storage.get(key)).version,JSON.parse(fs.readFileSync(path.join(__dirname,'../package.json'),'utf8')).version);
  const encoded=F.encode(api.state);assert.equal(F.parse(encoded).state.chapter,'kids');
  assert.ok(F.parse(encoded).savedAt);assert.equal(F.parse(JSON.stringify(legacy)).savedAt,null);
  const bad=['{','null','[]','{"chapter":"unknown","flags":{}}','{"chapter":"street","flags":{"__proto__":{}}}',
    JSON.stringify({...legacy,life:{photos:['bad']}}),JSON.stringify({...legacy,chronicle:{journal:[null]}}),
    JSON.stringify({...legacy,chronicle:{era:100}}),JSON.stringify({...legacy,chronicle:{minute:1e8}}),
    JSON.stringify({...legacy,chronicle:{pendingVisits:['stranger']}}),JSON.stringify({...legacy,flags:{cast:{lera:null}}}),
    JSON.stringify({...legacy,life:{photos:[{title:'bad',image:'https://example.invalid/track'}]}}),
    JSON.stringify({...legacy,life:{photos:[{title:'bad',image:'data:image/svg+xml;base64,AAAA'}]}}),
    JSON.stringify({format:2,game:'poka-gorit-svet',state:legacy}), ' '.repeat(F.maxBytes+1)];
  const beforeInvalid=snapshot();for(const input of bad)assert.throws(()=>F.parse(input));assert.equal(snapshot(),beforeInvalid);
  assert.equal({}.polluted,undefined);
  assert.equal(S.writeSlot(1),true);const slot=storage.get(S.slotKey(1));
  api.state.flags.metTamir=false;assert.equal(S.save(),true);assert.equal(storage.get(S.slotKey(1)),slot,'autosave never mutates manual slots');
  assert.equal(S.writeSlot(1),true);assert.equal(storage.get(key+'_backup'),slot,'slot overwrite has a backup');
  const auto=storage.get(key);assert.equal(S.writeSlot(2,fresh('proposal')),true);assert.equal(storage.get(key),auto,'import does not activate');
  assert.equal(S.writeSlot(4),false);assert.equal(S.entries().length,6);
  const priorState=JSON.stringify(api.state),priorAuto=storage.get(key);failKey=key;
  assert.equal(S.activate(fresh('apartment')),false);assert.equal(JSON.stringify(api.state),priorState);assert.equal(storage.get(key),priorAuto);
  assert.ok(S.lastError.includes('Память'));failKey=null;
  assert.equal(S.activate(fresh('apartment')),true);assert.equal(S.read(key+'_backup').state.chapter,'kids');
  api.state.stats.talk++;assert.equal(S.save(),true);storage.set(key,'broken');
  assert.equal(S.load(),true);assert.equal(S.recovered,true);assert.equal(api.state.chapter,'apartment');
  assert.equal(S.save(),true);assert.equal(S.recovered,false);
  const autoBeforeSettings=storage.get(key);api.state.settings.textSize='largest';api.state.settings.textSpeed='fast';
  assert.equal(P.save(),true);assert.equal(css['--dialogue-size'],'30px');assert.equal(api.textSpeedMs(),10);
  assert.equal(storage.get(key),autoBeforeSettings,'preferences cannot overwrite the story');
  assert.equal(S.activate(fresh('kids')),true);assert.equal(api.state.settings.textSize,'largest','loading progress preserves local preferences');
  blocked=true;assert.equal(P.save(),false);blocked=false;
  api.state=fresh('street');T.restart();assert.equal(T.step(),'moved');
  const sc={player:{sprite:{x:0,y:0},moving:true},locked:false};T.observe(sc,true);sc.player.sprite.x=7;T.observe(sc,true);
  assert.equal(T.step(),'interacted');const count=writes.length;T.complete('moved');assert.equal(writes.length,count,'completed steps never write per-frame');
  T.complete('interacted');assert.equal(T.step(),'activities');T.complete('activities');assert.equal(T.step(),null);
  T.restart();sc.player.scripted=true;T.observe(sc,true);sc.player.sprite.x=50;T.observe(sc,true);assert.equal(T.step(),'moved');sc.player.scripted=false;
  T.complete('dismissed');assert.equal(T.step(),null);assert.equal(S.load(),true);assert.equal(T.step(),null);
  // Actual menu callbacks: cancellation, overwrite errors, focus and loading.
  const menu=new api.MainMenuScene();menu.scene={start(k){this.started=k;},get(){return ui.ui;}};
  S.activate(fresh('kids'));const beforeNew=snapshot();menu.newGame();assert.equal(ui.utility.hidden,false);
  assert.equal(document.activeElement.textContent,'Отмена');await click(ui.utility,'Отмена');assert.equal(snapshot(),beforeNew);assert.equal(menu.scene.started,undefined);
  menu.newGame();failKey=key;await click(ui.utility,'Начать заново');assert.equal(api.state.chapter,'kids');assert.equal(menu.scene.started,undefined);assert.equal(ui.utility.hidden,false);failKey=null;
  await click(ui.utility,'Начать заново');assert.equal(menu.scene.started,'Street');assert.equal(S.read(key+'_backup').state.chapter,'kids');assert.equal(ui.utility.hidden,true);
  S.activate(fresh('apartment'));ui.renderSaves();const beforeCancel=snapshot();await click(ui.utility,'Загрузить');
  let stopped=false,prevented=false;await ui.root.fire('keydown',{key:'Escape',stopPropagation(){stopped=true;},preventDefault(){prevented=true;}});
  assert.ok(stopped&&prevented);assert.equal(snapshot(),beforeCancel);assert.equal(ui.utility.attrs['aria-label'],'Сохранения');
  await click(ui.utility,'Загрузить');await click(ui.utility,'Загрузить');assert.equal(ui.game.scene.started,'Apartment');assert.equal(ui.utility.hidden,true);
  ui.renderSaves();await click(ui.utility,'Скачать текущий прогресс');assert.equal(downloads.length,1);assert.ok(downloads[0].download.endsWith('.json'));
  assert.equal(F.parse(await context.URL.blob.text()).state.chapter,'apartment');
  const input=walk(ui.utility).find(n=>n.type==='file');const beforeImport=snapshot();
  input.files=[{size:2,text:async()=>'{'}];await input.fire('change');assert.equal(snapshot(),beforeImport);assert.ok(ui.utilityStatus.textContent.includes('не изменён'));
  input.files=[{size:encoded.length,text:async()=>encoded}];await input.fire('change');assert.equal(ui.utility.attrs['aria-label'],'Файл проверен');
  const autoBeforeImport=storage.get(key);await click(ui.utility,'Импортировать в слот 3');assert.equal(storage.get(key),autoBeforeImport);assert.equal(S.read(S.slotKey(3)).state.chapter,'kids');
  ui.renderSaves();const delayedInput=walk(ui.utility).find(n=>n.type==='file');let resolve;
  delayedInput.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];const pending=delayedInput.fire('change');ui.closeUtility();resolve(encoded);await pending;assert.equal(ui.utility.hidden,true,'stale import cannot reopen a closed dialog');
  ui.renderSaves();ui.menuOpen=true;ui.playScene=sc;ui.modal.hidden=ui.reader.hidden=ui.choice.hidden=ui.caption.hidden=true;T.restart();ui.syncTutorial();assert.equal(ui.tutorial.hidden,true,'no tutorial on menu');
  ui.closeUtility();ui.menuOpen=false;ui.syncTutorial();assert.equal(ui.tutorial.hidden,false);ui.modal.hidden=false;ui.syncTutorial();assert.equal(ui.tutorial.hidden,true,'no tutorial on dialogue');
  const card=new Element('div');ui.textControls(card);assert.equal(walk(card).filter(n=>n.tagName==='select').length,2);
  const sizeSelect=walk(card).find(n=>n.tagName==='select');sizeSelect.value='large';await sizeSelect.fire('change');assert.equal(css['--dialogue-size'],'26px');
  storage.clear();api.state=fresh('menu');blocked=true;assert.equal(S.reset(),true,'first game still starts with blocked browser storage');assert.equal(storage.size,0);assert.ok(S.lastError);blocked=false;
  console.log('PASS: legacy/new saves, 15 invalid imports, slot isolation, backups, quota rollback, recovery, preference isolation, tutorial, confirmation/cancel, file roundtrip and stale import safety');
})().catch(e=>{console.error(e);process.exitCode=1;});
