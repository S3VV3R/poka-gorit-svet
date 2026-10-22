const originalCommonCreate=GameplayScene.prototype.commonCreate;
GameplayScene.prototype.commonCreate=function(){
  this._colliders=null;this._colRects=[];this._decorSpots=[];this.villagers=[];this.pets=[];this.ambient=null;
  this._lifeLayerInstalled=false;this._seasonOverlay=null;this._chronicleVisuals={};this._storyGuests=[];
  this._visitingFamily=[];this._chronicleBusy=false;this._tamirAway=false;
  originalCommonCreate.call(this);
  this.events.once('create',()=>Chronicle.install(this));
};
const originalGameUpdate=GameplayScene.prototype.update;
GameplayScene.prototype.update=function(time,delta){
  originalGameUpdate.call(this,time,delta);
  if(Chronicle.controls){const available=Chronicle.canOpen(this)&&!Chronicle.owner;Chronicle.controls.hidden=!available;}
};
const originalEraOf=eraOf;
eraOf=function(sc){return sc.storyEra||originalEraOf(sc);};
LifeSystem.liveDay=sc=>Chronicle.run(sc,()=>Chronicle.ordinaryDay(sc));
LifeSystem.randomEvent=sc=>Chronicle.event(sc);
LifeSystem.advanceDay=sc=>{const c=Chronicle.state();c.minute=1440+480;Chronicle.advance(sc,0);};
DaughtersSystem.available=()=>Chronicle.state().era>=7;
DaughtersSystem.call=sc=>Chronicle.run(sc,()=>Chronicle.daughterCall(sc));
const originalLifeRefresh=LifeSystem.refresh;
LifeSystem.refresh=function(sc){originalLifeRefresh.call(this,sc);if(sc)Chronicle.sync(sc);};

function beforeLifeMethod(Type,name,keys){
  const original=Type.prototype[name];
  if(typeof original!=='function')throw new Error('Unknown story checkpoint '+name);
  Type.prototype[name]=async function(...args){
    for(const key of keys)await Chronicle.milestone(this,key);
    return original.apply(this,args);
  };
}
beforeLifeMethod(TripScene,'introCutscene',['trip']);
beforeLifeMethod(YoungFamilyScene,'crisisScene',['purchase']);
beforeLifeMethod(BabyScene,'toddlerYear',['bellaIll']);
beforeLifeMethod(BabyScene,'niaScene',['kindergarten']);
beforeLifeMethod(KidsScene,'teenYears',['niaSchool']);
beforeLifeMethod(KidsScene,'quarrelBella',['firstLove']);
beforeLifeMethod(EmptyNestScene,'niaLeaves',['niaGrad']);
beforeLifeMethod(EmptyNestScene,'agingScene',['parentIll']);
beforeLifeMethod(EmptyNestScene,'marsGone',['marsIll']);
beforeLifeMethod(EmptyNestScene,'abilkaGone',['abilkaIll']);
beforeLifeMethod(LateYearsScene,'lastBalcony',['lastParty']);

for(const [Type,name] of [[TripScene,'endTrip'],[ApartmentScene,'endingScene'],[WeddingScene,'ceremony'],[HouseScene,'endChapter']]){
  const fn=Type.prototype[name];
  Type.prototype[name]=async function(...args){await Chronicle.breathe(this);return fn.apply(this,args);};
}
const pregnancyBefore=YoungFamilyScene.prototype.pregnancyScene;
YoungFamilyScene.prototype.pregnancyScene=async function(...args){
  await Chronicle.decide(this,19,true);
  if(Chronicle.state().items.parenthoodWait)await this.ui.caption('Проходят месяцы. Они возвращаются к разговору, когда оба готовы попробовать.',2500);
  await Chronicle.breathe(this);return pregnancyBefore.apply(this,args);
};
const stageBefore=HouseScene.prototype.setStage;
HouseScene.prototype.setStage=function(stage){stageBefore.call(this,stage);if(this.worldW)Chronicle.sync(this);};

for(const [Type,method,key] of [
  [YoungFamilyScene,'crisisScene','crisis'],[YoungFamilyScene,'pregnancyScene','parentTalk'],
  [BabyScene,'intro','birthBella'],[EmptyNestScene,'agingScene','agingTamir'],[EmptyNestScene,'mirrorScene','agingNastya'],
]){
  const fn=Type.prototype[method];
  Type.prototype[method]=async function(...args){const value=await fn.apply(this,args);Chronicle.state().milestones[key]=true;SaveSystem.save();return value;};
}

const initialEndingChoice=computeEnding;
computeEnding=function(){
  const c=Chronicle.state(),r=GameState.relationship,s=GameState.stats;
  const friends=Object.keys(TOWN_PEOPLE).filter(id=>(castState(id).bond||0)>=3).length;
  const result=initialEndingChoice();
  if(result===8 && (!c.items.seaVisited || c.trips<2 || r.support<4 || r.respect<4))return 1;
  if(result===1 && friends>=3 && s.letGo>=4 && s.avoid<=3)return 5;
  if(result===1 && c.items.inherit && s.houseAttach>=3)return 2;
  return result;
};

const originalEndingCreate=EndingScene.prototype.create;
EndingScene.prototype.create=function(){Chronicle.state().widowed=false;originalEndingCreate.call(this);};
const originalFinale=EndingScene.prototype.montage;
MemorySystem.finaleLines=function(){
  const c=Chronicle.state(),life=GameState.life,out=[];
  if((c.actions[53]||0)>=3)out.push('Балкон: разговор о будущем.','Тот же балкон спустя годы: они молчат рядом.');
  if((c.actions[16]||0)+(c.actions[19]||0)>=3)out.push('На столе менялось число тарелок. Привычка собираться осталась.');
  if(c.items.keptDrawing || GameState.flags.drawingOnFridge)out.push('Неровное «БЕЛА». Семья глазами ребёнка.');
  if(GameState.flags.keptMarsToy)out.push('Игрушечная мышь Марса, сохранённая в коробке.');
  if(GameState.flags.keptAbilkaBed)out.push('Лежанка Абилки, которую никто не занял.');
  out.push(...life.photos.slice(-4).map(p=>'Снимок: '+p.title));
  out.push(...life.memories.filter(m=>!m.id.startsWith('photo:')).slice(-4).map(m=>m.title));
  return [...new Set(out)].slice(0,12);
};
EndingScene.prototype.montage=async function(){
  const saved=MEMORY_GALLERY.filter(m=>GameState.flags[m.flag]);
  Audio.stopMelody();Audio.startMelody();
  for(const m of saved)await this.ui.caption(m.title+'\n'+m.text,1800);
  for(const m of MemorySystem.finaleLines())await this.ui.caption(m,1800);
};

/* A compact, hand-drawn balcony. All art is local and pixel aligned. */
