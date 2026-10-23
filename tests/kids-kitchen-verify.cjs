const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={GameState:{flags:{}},SaveSystem:{save(){}},REPEAT_LINES:{},
  Phaser:{Math:{Distance:{Between:(x,y,a,b)=>Math.hypot(x-a,y-b)}}}};
vm.createContext(context);
for(const file of ['systems/interactions','systems/kids-kitchen'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../js',file+'.js'),'utf8'),context);
const {KidsKitchen:K,InteractionSystem:I}=vm.runInContext('({KidsKitchen,InteractionSystem})',context);
function scene(){
  const sc={scene:{key:'Kids',isActive:()=>true},locked:false,ui:{isConversationActive:()=>false,setQuest(t){this.quest=t;},showPrompt(){},hidePrompt(){},setPromptProgress(){}},
    lockInput(){this.locked=true;},unlockInput(){this.locked=false;},safeRun(fn){this.pending=Promise.resolve().then(fn);}};
  sc.interactions=new I(sc,sc.ui);return sc;
}
(async()=>{
  // Reproduce the former exact-coordinate tie: completed dinner won over cleanup.
  const old=scene();old.interactions.add(309.76,127.43,30,'накрыть ужин',()=>{});
  old.interactions.add(309.76,127.43,30,'вернуться к посуде',()=>{});
  old.interactions.update({sprite:{x:309.76,y:148}},false,16);
  assert.equal(old.interactions.active.label,'накрыть ужин');
  for(const label of ['помыть посуду','вернуться к посуде','вместе помыть кухню'])old.interactions.add(296.82,49.43,30,label,()=>{});
  K.set(old,'tidy');assert.equal(old.interactions.items.length,2,'old story hotspots removed');
  old.interactions.add(309.76,148,30,'чай',()=>{});
  for(const [x,y] of [[309.76,110],[309.76,148],[296.82,66],[322,146]]){
    old.interactions.update({sprite:{x,y}},false,16);
    assert.equal(old.interactions.active.priority,10,'story task wins over a nearer household prompt');
  }
  for(const id of [1,2,3,4,6])assert.equal(K.matches(old,id),true);
  for(const id of [5,7,8,11,17,48])assert.equal(K.matches(old,id),false);
  assert.equal(K.matches({...old,scene:{key:'Baby'}},1),false,'other chapters unchanged');
  let starts=0,finish;
  old.quarrelParents=async()=>{starts++;await new Promise(r=>finish=r);K.set(old,'together');old.unlockInput();};
  const first=K.run(old);assert.equal(await K.run(old),false);assert.equal(starts,1);
  finish();await first;assert.equal(old.kitchenTask.stage,'together');assert.equal(context.GameState.flags.kidsKitchenStage,'together');
  old.washKitchen=async()=>{throw new Error('synthetic failure');};
  await assert.rejects(K.run(old),/synthetic failure/);assert.equal(old.kitchenTask.running,false);assert.equal(old.locked,false);
  assert.ok(old.kitchenTask.items.every(i=>i.enabled),'retry remains possible after error');
  old.washKitchen=async()=>K.clear(old);assert.equal(await K.run(old),true);assert.equal(old.kitchenTask,null);
  assert.equal(K.matches(old,1),false,'ordinary chores restored after the story task');
  console.log('PASS: reproduced completed-dinner interception, sink/table priority, cleanup menu routing, duplicate guard, error retry and task cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});
