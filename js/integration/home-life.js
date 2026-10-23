const homeCommonCreate=GameplayScene.prototype.commonCreate;
GameplayScene.prototype.commonCreate=function(){homeCommonCreate.call(this);this.events.once('create',()=>HomeLife.install(this));};
const homeUpdate=GameplayScene.prototype.update;
GameplayScene.prototype.update=function(time,delta){
  if(this._homeLife&&!HomeLife.free(this))HomeLife.cancelWalk(this);
  homeUpdate.call(this,time,delta);HomeLife.update(this,delta);
};
const homeActivity=Chronicle.activity;
Chronicle.activity=async function(sc,id,options={}){
  if(KidsKitchen.matches(sc,id))return KidsKitchen.run(sc);
  if(sc._homeLife && !this.actionReason(id))await HomeLife.animate(sc,id);
  const result=await homeActivity.call(this,sc,id,options);
  if(result && sc._homeLife)HomeLife.record(sc,id);
  return result;
};
const homeEvent=Chronicle.event;
Chronicle.event=async function(sc,...args){if(sc._homeLife?.quiet>0)return;return homeEvent.call(this,sc,...args);};
const homeTamirTick=TamirLife.tick;
TamirLife.tick=function(sc,delta){if(sc._homeLife)return;homeTamirTick.call(this,sc,delta);};
const homeDialogue=UIScene.prototype._showDialogue;
UIScene.prototype._showDialogue=async function(lines,...args){
  const sc=typeof Chronicle!=='undefined'?Chronicle.active():null;
  const result=await homeDialogue.call(this,lines,...args);
  if(sc?._homeLife && (lines.length>=3 || lines.reduce((n,l)=>n+(l.text?.length||0),0)>240))sc._homeLife.quiet=25000;
  return result;
};
const homeNewDay=Chronicle.newDay;
Chronicle.newDay=function(sc){homeNewDay.call(this,sc);const h=HomeLife.state();
  h.bedMade=false;h.meal=false;h.cups=0;if(h.laundry==='сохнет')h.laundry='высохло';this.state().items.clean=false;
  h.lastDay=this.state().elapsedDays;h.lastEra=this.state().era;
  if(sc?._homeLife)HomeLife.render(sc);
};
