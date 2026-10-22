class CompactHomePreviewScene extends HouseScene {
  constructor(){super('HomePreview');}
  create(){
    this.originalState=GameState;GameState=JSON.parse(JSON.stringify(GameState));
    this.originalSave=SaveSystem.save;SaveSystem.save=()=>false;
    GameState.ageStage='young';
    this.storyEra='e6';
    this.houseCreate({era:'kids',tintAlpha:.06,ambience:'home'});
    popHouse(this,'e6');
    this.spawnTamir(310,92,'down');
    this.spawnKid('bella_kid',179,145,'right');this.spawnKid('nia_kid',221,153,'left');
    this.unlockInput();this.cameras.main.stopFollow().removeBounds().setZoom(2.5).centerOn(192,112);
    this.ui.clearQuest();this.ui.hidePrompt();this.ui.setLifeStatus('');this.ui.fadeIn(200);
    if(Chronicle.controls)Chronicle.controls.hidden=true;
    const bar=document.createElement('div');
    bar.style.cssText='position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:650;display:flex;gap:8px;align-items:center;padding:10px 14px;background:#000;color:#fff;border:1px solid #fff;font:14px Georgia,serif';
    const title=document.createElement('span');title.textContent='Новый интерьер · предпросмотр';bar.append(title);
    for(const [label,fn] of [['Балкон',()=>{this.scene.start('BalconyPreview');}],['К игре',()=>this.scene.start('MainMenu')]]){
      const b=document.createElement('button');b.textContent=label;b.style.cssText='background:#fff;color:#000;border:1px solid #fff;padding:8px 12px;cursor:pointer;font:inherit';b.onclick=fn;bar.append(b);
    }
    document.body.append(bar);
    this.events.once('shutdown',()=>{bar.remove();GameState=this.originalState;SaveSystem.save=this.originalSave;});
  }
  tick(time,delta){HouseScene.prototype.tick.call(this,time,delta);}
}

/* Small, persistent domestic details. No new residents or forced story scenes.
   This module is inserted AFTER coordinate compaction: anchors come from furniture. */
