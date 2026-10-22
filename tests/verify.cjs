const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const html=require('./support/load-game.cjs').html();
const storage=new Map();
class Scene{}
const context=vm.createContext({console,setTimeout,clearTimeout,Math,Date,JSON,Promise,Set,Map,
  window:{addEventListener(){}},document:{},navigator:{},Phaser:{Scene,AUTO:0,BlendModes:{ADD:1,MULTIPLY:2}},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}});
const source=html.slice(html.indexOf('const CFG ='),html.lastIndexOf('</script>'));
vm.runInContext(source,context,{timeout:5000});
const api=vm.runInContext('({Chronicle,LIFE_DECISIONS,SCRIPT_CONTENT,TOWN_PEOPLE,TOWN_EXTRAS,MemorySystem,SaveSystem,CFG,CAST,ARCS})',context);
let dialogueCount=0;
function setup(era=6,pick=0){
  vm.runInContext('GameState=DEFAULT_STATE(); GameState.flags.metTamir=true;GameState.flags.marsHome=true;GameState.flags.abilkaHome=true;',context);
  const c=api.Chronicle.state();Object.assign(c,{era,money:100000,pantry:100,food:100,month:12});c.items.car=true;c.items.electric=true;
  vm.runInContext('GameState.life.season=3;',context);
  const sc={storyEra:'e'+era,scene:{key:'Test'},locked:false,interactions:{needRelease:false},
    ui:{dialogue:async lines=>{assert.ok(Array.isArray(lines));assert.ok(lines.every(x=>typeof x.text==='string'));dialogueCount+=lines.length;},choice:async(t,opts)=>{assert.ok(opts.length>0);assert.ok(opts.every(o=>typeof o==='string'));return Math.min(pick,opts.length-1);},caption:async()=>{},setLifeStatus(){},saveToast(){}},
    lockInput(){this.locked=true;},unlockInput(){this.locked=false;},time:{delayedCall:(ms,cb)=>cb()},
    game:{renderer:{snapshot:cb=>cb(null)}}};
  return {sc,c};
}
(async()=>{
  assert.equal(api.SCRIPT_CONTENT.actions.length,120);assert.equal(api.SCRIPT_CONTENT.events.length,60);
  assert.equal(api.LIFE_DECISIONS.length,60);assert.equal(new Set(api.LIFE_DECISIONS.map(d=>d[0])).size,60);
  assert.equal(api.SCRIPT_CONTENT.milestones.length,40);assert.equal(Object.keys(api.TOWN_PEOPLE).length,15);assert.equal(Object.keys(api.TOWN_EXTRAS).length,6);
  for(const id of Object.keys(api.TOWN_PEOPLE)){assert.ok(api.CAST[id]);assert.ok(api.ARCS[id]);}
  for(const d of api.LIFE_DECISIONS)for(const pick of [0,1]){
    const {sc,c}=setup(Math.max(d[1],Math.min(d[2],6)),pick);
    if([46,47,48].includes(d[0]))vm.runInContext('GameState.flags.marsGone=true;GameState.flags.abilkaGone=true;',context);
    await api.Chronicle.run(sc,()=>api.Chronicle.decide(sc,d[0],true));
    assert.equal(c.decisions[d[0]].pick,pick,'choice '+d[0]);assert.equal(sc.locked,false);
  }
  for(let id=1;id<=120;id++){
    const {sc,c}=setup([66,67].includes(id)?5:[97,107,117].includes(id)?7:6);
    if(id===31){c.month=9;vm.runInContext('GameState.life.season=2;',context);}
    await api.Chronicle.run(sc,()=>api.Chronicle.activity(sc,id,{noEvent:true}));
    assert.equal(c.actions[id],1,'action '+id);assert.equal(sc.locked,false);
  }
  for(let id=1;id<=60;id++)for(const pick of [0,1]){
    const {sc,c}=setup([49,50,51,52,53,54,57,58,59,60].includes(id)?7:6,pick);
    if(id===29){c.month=6;vm.runInContext('GameState.life.season=1;',context);}
    assert.ok(api.Chronicle.eventAllowed(id),'event allowed '+id);
    await api.Chronicle.run(sc,()=>api.Chronicle.event(sc,id));
    assert.equal(c.events[id],1,'event '+id);assert.equal(sc.locked,false);
  }
  {
    const {sc,c}=setup(7);vm.runInContext('GameState.flags.marsGone=true;GameState.flags.abilkaGone=true;',context);
    assert.ok(api.Chronicle.actionReason(82));assert.ok(api.Chronicle.actionReason(83));assert.equal(api.Chronicle.eventAllowed(55),false);assert.equal(api.Chronicle.eventAllowed(56),false);
    assert.ok(api.Chronicle.actionReason(67));
    c.money=0;const result=await api.Chronicle.activity(sc,23,{noEvent:true});assert.equal(result,false);assert.equal(c.pantry,100);
    c.minute=1430;c.day=30;c.month=12;api.Chronicle.advance(sc,30);assert.equal(c.day,1);assert.equal(c.month,1);assert.equal(c.year,1);
    c.money=1000;await api.Chronicle.activity(sc,26,{noEvent:true});const balance=c.money;await api.Chronicle.activity(sc,26,{noEvent:true});assert.equal(c.money,balance,'bills cannot be paid twice');
  }
  {
    setup(6);for(let i=0;i<60;i++){api.MemorySystem.remember('test:'+i,'Memory '+i);api.MemorySystem.snapshot('test:'+i,'Photo '+i);}
    assert.equal(vm.runInContext('GameState.life.photos.length',context),60);assert.ok(vm.runInContext('GameState.life.memories.length',context)>=60);
    api.SaveSystem.save();vm.runInContext('GameState=DEFAULT_STATE()',context);assert.equal(api.SaveSystem.load(),true);
    assert.equal(vm.runInContext('GameState.life.photos.length',context),60);
    storage.set(api.CFG.SAVE_KEY,JSON.stringify({chapter:'kids',flags:{metTamir:true},relationship:{trust:4}}));
    assert.equal(api.SaveSystem.load(),true);assert.doesNotThrow(()=>api.Chronicle.state());
    assert.equal(vm.runInContext('GameState.relationship.trust',context),4);
  }
  process.stdout.write(JSON.stringify({status:'PASS',people:21,decisionBranches:120,actions:120,eventBranches:120,dialogueLines:dialogueCount,saves:'old + new',boundaries:'calendar, food, money, pets, parenting'})+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;});
