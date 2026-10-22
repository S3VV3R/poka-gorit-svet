const HomeLife = {
  scenes: new Set(['Apartment','Proposal','YoungFamily','Baby','Kids','EmptyNest','LateYears','HomePreview']),
  state() {
    const c=Chronicle.state();
    const h=c.homeLife ||= {};
    const defaults={version:1,cups:0,teaCount:0,cleanDay:-1,bedMade:false,laundry:'',lamp:true,
      windowOpen:false,drawing:false,wateredDay:-1,meal:false,routineSerial:0,visits:0,lastEra:c.era,lastDay:c.elapsedDays};
    for(const [key,value] of Object.entries(defaults))if(h[key]===undefined)h[key]=value;
    // Adopt existing progress instead of resetting an older save's household.
    if(!h.migrated){h.migrated=true;h.teaCount=c.actions[17]||0;h.bedMade=!!c.items.bedMade;
      h.laundry=c.items.laundry||'';h.drawing=!!GameState.flags.drawingOnFridge;
      h.windowOpen=!!c.items.windowOpen;if(c.items.clean)h.cleanDay=c.elapsedDays;}
    return h;
  },
  image(sc,key) {return sc.children.list.find(o=>o.texture?.key===key && o.x>=0 && o.x<sc.worldW && o.y<sc.worldH);},
  free(sc) {return !!sc._homeLife && Chronicle.canOpen(sc) && !Chronicle.owner && sc.scene.isActive() &&
    sc.player?.sprite.visible && !sc.player.scripted && sc.player.sprite.x<sc.worldW;},
  install(sc) {
    if(!this.scenes.has(sc.scene.key) || !sc.player || !sc._compactHome)return;
    const h=this.state(),c=Chronicle.state();h.visits++;
    if(h.lastEra!==c.era){
      h.cups=0;h.meal=false;h.bedMade=false;h.windowOpen=false;h.cleanDay=-1;h.wateredDay=-1;
      if(h.laundry)h.laundry='в шкафу';h.lastEra=c.era;h.lastDay=c.elapsedDays;
    }
    const table=this.image(sc,'table'), counter=this.image(sc,'counter'), sofa=this.image(sc,'couch'),
      plant=this.image(sc,'plant')||this.image(sc,'plant_big'), bed=this.image(sc,'bed'),
      lamp=this.image(sc,'floor_lamp'), coat=this.image(sc,'coat_rack'), fridge=this.image(sc,'fridge');
    const kitchenTable=sc.scene.key==='Apartment'?table:
      sc.children.list.filter(o=>o.texture?.key==='table'&&o.x<sc.worldW).sort((a,b)=>b.x-a.x)[0]||table;
    sc._homeLife={elapsed:0,quiet:12000,next:16000,serial:0,visualKey:'',stations:[],furniture:{table:kitchenTable,counter,sofa,plant,bed,lamp,coat,fridge},tasks:new Set(),bubble:null,walk:null,rest:null};
    const room=sc._homeLife;
    room.floor=sc.add.graphics().setDepth(3);
    room.details=sc.add.graphics().setDepth(250);
    room.steam=sc.add.graphics().setDepth(251);
    room.marker=sc.add.graphics().setDepth(300);
    room.light=sc.add.rectangle(sc.worldW/2,sc.worldH/2,sc.worldW,sc.worldH,0x101525,1).setDepth(810).setAlpha(0);
    room.light.setName('home-evening-light');
    if(kitchenTable)this.station(sc,'tea',kitchenTable,'заварить чай / накрыть стол',[17,18,19,2],/выпить чаю|поправить скатерть/);
    if(sofa)this.station(sc,'sofa',sofa,'устроиться на диване',[50,48,'rest','history'],/сесть на диван|посидеть на диване/);
    if(plant)this.station(sc,'plant',plant,'позаботиться о растении',[13,15],/полить цветок|посмотреть на цветок/);
    if(bed)this.station(sc,'bed',bed,'поправить постель',[11,12]);
    if(lamp)this.station(sc,'lamp',lamp,'включить / выключить лампу',['lamp']);
    if(coat)this.station(sc,'tidy',coat,'навести порядок',[3,7,8,9]);
    const window=this.image(sc,'window_night');
    if(window)this.station(sc,'window',{x:window.x,y:Math.max(32,window.y+15)},'побыть у окна',['window',54,56,57]);
    else this.station(sc,'window',{x:Math.min(sc.worldW-35,sc.worldW*.2),y:32},'побыть у окна',['window',54,56,57]);
    this.render(sc);
    sc.events.on('pause',()=>{room.freeText?.setVisible(false);room.bubble?.setVisible(false);});
    sc.events.once('shutdown',()=>{
      this.cancelWalk(sc);room.bubble?.destroy();room.rest=null;
      for(const cancel of [...room.tasks])cancel();room.tasks.clear();
      if(room.freeText)room.freeText.destroy();
      sc._homeLife=null;
    });
  },
  station(sc,key,anchor,label,actions,replace) {
    const room=sc._homeLife;
    const point={x:anchor.x,y:Math.min(sc.worldH-20,anchor.y+5)};
    const existing=replace && sc.interactions.items.find(i=>replace.test(i.label));
    const item=existing||sc.interactions.add(point.x,point.y,24,label,()=>{});
    item.label=label;item.homeStation=key;
    // Deliberately bypass flavour-repeat replacement: using a kettle twice must make tea twice.
    item.onInteract=()=>{if(this.free(sc))sc.safeRun(()=>Chronicle.run(sc,()=>this.choose(sc,key,actions)));};
    room.stations.push({key,item,anchor});
  },
  async choose(sc,key,actions) {
    const h=this.state();
    const names={rest:'Посидеть молча',lamp:h.lamp?'Выключить лампу':'Включить лампу',
      window:h.windowOpen?'Закрыть окно':'Приоткрыть окно',history:'Рассмотреть следы времени'};
    const list=actions.map(id=>typeof id==='number'?SCRIPT_CONTENT.actions[id-1]:names[id]);
    const pick=await sc.ui.choice('Здесь, дома',list.concat('Ничего — вернуться'));
    if(pick===actions.length)return;
    const action=actions[pick];
    if(typeof action==='number')return Chronicle.activity(sc,action,{noEvent:true});
    if(action==='rest'){await this.animate(sc,50,key);await this.rest(sc);}
    if(action==='lamp'){h.lamp=!h.lamp;this.sound('switch');this.render(sc);this.bubble(sc,sc.player,h.lamp?'Тёплый круг света.':'Можно посидеть в полумраке.');}
    if(action==='window'){h.windowOpen=!h.windowOpen;Chronicle.state().items.windowOpen=h.windowOpen;
      this.sound('window');this.render(sc);this.bubble(sc,sc.player,h.windowOpen?'С улицы доносятся знакомые звуки.':'За стеклом стало тише.');}
    if(action==='history')await sc.ui.dialogue([{who:'',text:this.history()}]);
    sc._homeLife.quiet=20000;SaveSystem.save();
  },
  history() {
    const c=Chronicle.state(),h=this.state();
    const lines=c.era<4?'Первые потёртости на диване. Две кружки уже стоят каждая на своём месте.':
      c.era<6?'В доме появились детские вещи. На дверном косяке — первая короткая отметка роста.':
      c.era===6?'На косяке всё выше тянутся отметки роста Беллы и Нии. Старый диван стал мягче; место Насти осталось прежним.':
      'Детские отметки роста остались на косяке. Взрослые дочери уже выше последней черты. Диван потёрся, но садиться на него по-прежнему привычно.';
    return lines+(h.teaCount>=3?' Чай здесь заваривали уже '+h.teaCount+' раз. Обычный вечер постепенно стал семейным ритуалом.':'');
  },
  record(sc,id) {
    const h=this.state(),c=Chronicle.state();
    if([17,18,101].includes(id)){h.cups=c.widowed?1:2;h.teaCount++;sc._homeLife.steamUntil=sc._homeLife.elapsed+18000;}
    if([16,19,20,75].includes(id)){h.meal=true;h.cups=c.widowed?1:2;}
    if([1,2].includes(id)){h.cups=0;h.meal=false;sc._homeLife.steamUntil=0;}
    if([3,4,6,109].includes(id))h.cleanDay=c.elapsedDays;
    if([11,12].includes(id))h.bedMade=true;
    if(id===7)h.laundry='выстирано';if(id===8)h.laundry='сохнет';if([9,10].includes(id))h.laundry='в шкафу';
    if([13,14,15].includes(id))h.wateredDay=c.elapsedDays;
    if([68,69,79,108].includes(id) && c.era>=5)h.drawing=true;
    if([118,119].includes(id))h.windowOpen=true;if(id===120)h.windowOpen=false;
    if(id===46)h.lamp=!h.lamp;
    sc._homeLife.quiet=20000;this.render(sc);SaveSystem.save();
  },
  render(sc) {
    const r=sc._homeLife;if(!r)return;
    const h=this.state(),c=Chronicle.state(),f=r.furniture;
    const key=JSON.stringify([h,c.era,c.elapsedDays,c.phase,GameState.flags.drawingOnFridge]);
    if(key===r.visualKey)return;r.visualKey=key;
    const floor=r.floor.clear(),detail=r.details.clear();
    const rect=(g,color,x,y,w,hh,a=1)=>g.fillStyle(color,a).fillRect(Math.round(x),Math.round(y),w,hh);
    const t=f.table;
    if(f.counter){const x=f.counter.x+9,y=f.counter.y-f.counter.displayHeight+8;
      rect(detail,0xb1b5ad,x,y-6,5,6);rect(detail,0xe1dfcd,x+1,y-7,3,1);
      rect(detail,0x5e6564,x+5,y-5,2,3);rect(detail,0xd6d5c7,x-2,y-4,2,1);}
    if(t){
      // Cups sit on the tabletop, never at floating wall-decor coordinates.
      for(let n=0;n<h.cups;n++){const x=t.x-7+n*12,y=t.y-t.displayHeight+2;
        rect(detail,0xe5ddc9,x,y,4,4);rect(detail,n?0x7f8e91:0x637e99,x,y+1,4,2);rect(detail,0xeee4ce,x+4,y+1,1,2);}
      if(h.meal){const y=t.y-t.displayHeight+7;rect(detail,0xdad2b9,t.x-3,y,7,3);rect(detail,0x9e7956,t.x-1,y,3,2);}
    }
    if(h.cleanDay!==c.elapsedDays && !c.items.clean){
      const x=Math.max(24,Math.min(sc.worldW-48,(f.coat?.x||48)-20)),y=Math.min(sc.worldH-22,(f.coat?.y||sc.worldH-28)-3);
      for(let i=0;i<4;i++)rect(floor,0x57514b,x+8+i*5,y-(i%2)*4,2,1,.6);
      rect(floor,0xbeb3a1,x+18,y-9,5,3,.75);
    }
    if(f.bed && h.bedMade){rect(detail,0xd6d0c4,f.bed.x-13,f.bed.y-22,26,4);rect(detail,0x9dabb3,f.bed.x-13,f.bed.y-17,26,2);}
    if(f.coat && ['сохнет','высохло'].includes(h.laundry)){
      rect(detail,0xaaa18f,f.coat.x-5,f.coat.y-16,10,1);
      rect(detail,h.laundry==='сохнет'?0x718499:0x9baabd,f.coat.x-4,f.coat.y-14,6,8);rect(detail,0xa99a87,f.coat.x+3,f.coat.y-14,4,6);
    }
    if(f.plant && h.wateredDay===c.elapsedDays){rect(detail,0x66543e,f.plant.x-3,f.plant.y-3,6,2);rect(detail,0x9fb1ab,f.plant.x+5,f.plant.y-8,1,2);}
    if(f.fridge && (h.drawing||GameState.flags.drawingOnFridge)){
      rect(detail,0xe8dfc3,f.fridge.x-4,f.fridge.y-15,7,8);rect(detail,0xa78867,f.fridge.x-2,f.fridge.y-12,4,1);rect(detail,0x80966b,f.fridge.x-1,f.fridge.y-10,1,2);
    }
    if(f.sofa){
      const age=Math.max(0,c.era-3),x=f.sofa.x-10,y=f.sofa.y-8;
      for(let i=0;i<Math.min(5,age);i++)rect(detail,0x9a8a92,x+i*3,y+(i%2),2,1,.8);
      if(c.era>=7)rect(detail,0xbab0a2,f.sofa.x+7,f.sofa.y-12,6,9,.9);
    }
    // A slim growth strip is fixed to an actual divider; no floating pictures.
    if(c.era>=5){
      const walls=(sc._colRects||[]).filter(v=>v[2]<15 && v[3]>50 && v[0]>50 && v[0]<sc.worldW-50);
      const wall=walls[0];if(wall){const x=wall[0]-2,y=wall[1];rect(detail,0xc3af8b,x,y-14,3,27);
        for(let i=0;i<Math.min(6,c.era-3);i++){rect(detail,i%2?0x786c77:0x6e7475,x,y+9-i*4,3,1);}}
    }
    const night=['вечер','ночь'].includes(c.phase);
    r.light.setAlpha(h.lamp?(night?.04:0):(night?.18:.09));
    if(f.lamp && h.lamp){floor.fillStyle(0xf5df9c,.12).fillCircle(f.lamp.x,f.lamp.y+5,17);}
    if(sc.dishesSprite && GameState.flags.dishesResolved)sc.dishesSprite.setVisible(h.meal);
  },
  cancellation() {const e=new Error('Home moment ended with its scene');e.code='DIALOGUE_CANCELLED';return e;},
  delay(sc,ms) {
    const room=sc._homeLife;
    return new Promise((resolve,reject)=>{
      const cancel=()=>{timer.remove(false);room.tasks.delete(cancel);reject(this.cancellation());};
      const timer=sc.time.delayedCall(ms,()=>{room.tasks.delete(cancel);resolve();});room.tasks.add(cancel);
    });
  },
  async animate(sc,id,stationKey) {
    const room=sc._homeLife;if(!room || !sc.player?.sprite.visible || sc.player.scripted || sc.player.sprite.x>sc.worldW)return;
    const key=stationKey||([17,18,16,19,20,101,2].includes(id)?'tea':[13,14,15].includes(id)?'plant':[11,12].includes(id)?'bed':[48,49,50,51].includes(id)?'sofa':[7,8,9,10,3,4].includes(id)?'tidy':null);
    const station=room.stations.find(s=>s.key===key);if(!station)return;
    const player=sc.player, sprite=player.sprite,oldY=sprite.scaleY;
    player.faceTowards(station.anchor.x,station.anchor.y);player.playDir('idle');sprite.setVelocity(0,0);
    const effect=sc.add.graphics().setDepth(sprite.y+2);
    const tea=[17,18,101].includes(id),water=[13,14,15].includes(id);
    this.sound(tea?'kettle':water?'water':key==='tidy'?'cloth':key==='sofa'?'cloth':'switch');
    if(tea){room.steamUntil=room.elapsed+5000;}
    const tween=sc.tweens.add({targets:sprite,scaleY:oldY*.94,duration:180,yoyo:true,repeat:2});
    effect.fillStyle(tea?0xe4dac2:water?0x98b1ba:0xd6c9ae,1).fillRect(sprite.x+5,sprite.y-10,3,3);
    try{await this.delay(sc,720);}finally{tween.stop();effect.destroy();if(sprite.scene)sprite.setScale(sprite.scaleX,oldY);}
  },
  async rest(sc) {
    const room=sc._homeLife;
    sc.ui.hidePrompt();this.bubble(sc,sc.player,'Можно просто посидеть.');
    const sofa=room.furniture.sofa,sprite=sc.player.sprite;
    const saved={x:sprite.x,y:sprite.y,scaleY:sprite.scaleY,enabled:sprite.body.enable};
    // A brief seated pose; always restore the safe standing point, including cancellation.
    if(sofa){sprite.body.enable=false;sprite.setPosition(sofa.x-7,sofa.y+1).setScale(sprite.scaleX,saved.scaleY*.8);sc.player.dir='down';}
    try{await this.delay(sc,2200);room.quiet=30000;}
    finally{if(sprite.scene){sprite.setPosition(saved.x,saved.y).setScale(sprite.scaleX,saved.scaleY);sprite.body.enable=saved.enabled;}}
  },
  freeTime(sc) {
    const room=sc._homeLife,quest={text:sc.ui.questText.text,visible:sc.ui.questContainer.visible};
    return new Promise((resolve,reject)=>{
      const finish=()=>{if(!this.free(sc))return;cleanup();sc.lockInput();if(quest.visible)sc.ui.setQuest(quest.text);resolve();};
      const cancel=()=>{cleanup();reject(this.cancellation());};
      const cleanup=()=>{room.freeText?.destroy();room.freeText=null;room.tasks.delete(cancel);};
      room.tasks.add(cancel);room.quiet=25000;sc.unlockInput();sc.ui.clearQuest();
      room.freeText=sc.ui.add.text(CFG.WIDTH/2,76,'Побыть дома  ·  Продолжить историю →',{
        fontFamily:'Arial',fontSize:'16px',color:'#fff',backgroundColor:'#111',padding:{x:14,y:10}
      }).setOrigin(.5).setDepth(450).setInteractive({useHandCursor:true}).on('pointerdown',finish);
    });
  },
  bubble(sc,actor,text) {
    const r=sc._homeLife;if(!r || !actor?.sprite?.scene)return;
    r.bubble?.destroy();
    r.bubble=sc.add.text(actor.sprite.x,actor.sprite.y-28,text,{fontFamily:'Arial',fontSize:'7px',color:'#fff',
      backgroundColor:'#171717',padding:{x:4,y:3},wordWrap:{width:92},align:'center'}).setOrigin(.5,1).setDepth(350);
    r.bubbleActor=actor;r.bubbleUntil=r.elapsed+4500;
  },
  walk(sc,actor,target,arrive) {
    if(!actor?.sprite?.scene || actor.target)return false;
    const path=this.path(sc,actor.sprite,target);if(!path || !path.length)return false;
    sc._homeLife.walk={actor,path,arrive,left:14000,owned:null};return true;
  },
  path(sc,start,goal) {
    const step=4,w=sc.worldW,h=sc.worldH,rects=sc._colRects||[];
    const free=(x,y)=>x>=20&&x<=w-20&&y>=20&&y<=h-20&&!rects.some(([cx,cy,rw,rh])=>Math.abs(x-cx)<rw/2+6&&Math.abs(y-cy)<rh/2+5);
    const sx=Math.round(start.x/step)*step,sy=Math.round(start.y/step)*step;
    if(!free(sx,sy))return null;
    const queue=[[sx,sy,-1]],seen=new Set([sx+','+sy]);let found=-1;
    for(let i=0;i<queue.length&&i<6000;i++){
      const [x,y]=queue[i];if(Math.hypot(x-goal.x,y-goal.y)<18){found=i;break;}
      for(const [dx,dy] of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;
        if(!seen.has(key)&&free(nx,ny)){seen.add(key);queue.push([nx,ny,i]);}}
    }
    if(found<0)return null;const out=[];
    for(let at=found;at>0;at=queue[at][2])out.push({x:queue[at][0],y:queue[at][1]});
    return out.reverse();
  },
  cancelWalk(sc) {
    const r=sc._homeLife,w=r?.walk;if(!w)return;
    if(w.actor.target===w.owned){w.actor.target=null;w.actor.sprite?.setVelocity(0,0);}
    r.walk=null;
  },
  routine(sc) {
    const room=sc._homeLife,h=this.state(),c=Chronicle.state(),f=room.furniture;
    const kind=room.serial++%3,partner=sc.tamir||sc.npc;
    if(kind===0 && partner?.sprite?.visible && !sc._tamirAway && !c.widowed && f.table){
      this.walk(sc,partner,{x:f.table.x,y:f.table.y+13},()=>{
        h.cups=2;room.steamUntil=room.elapsed+15000;this.render(sc);this.sound('cup');
        this.bubble(sc,partner,GameState.ageStage==='old'?'Заварил как ты любишь.':'Чай готов. Твою кружку оставил рядом.');
        if(sc.tamir===partner)this.offerTalk(sc,partner);
        h.routineSerial++;SaveSystem.save();
      });
    }else if(kind===1 && sc.kids?.length && c.era>=5 && c.era<=6){
      const child=sc.kids.find(k=>k.sprite?.visible&&!k.target);if(!child)return;
      this.walk(sc,child,sc.player.sprite,()=>{h.drawing=true;this.render(sc);
        this.bubble(sc,child,'Мам, смотри! Это наш дом.');h.routineSerial++;SaveSystem.save();});
    }else{
      const cat=(sc.cats||[]).find(k=>k.sprite?.visible&&!k.hidden&&!k.target);
      if(cat && f.sofa)this.walk(sc,cat,{x:f.sofa.x+18,y:f.sofa.y+10},()=>{
        cat.wanderTimer=14000;cat.playDir('idle');this.sound('purr');this.bubble(sc,cat,'Мр-р…');
        room.rest={actor:cat,left:10000};
      });
    }
  },
  offerTalk(sc,partner) {
    const r=sc._homeLife;if(r.offer)sc.interactions.remove(r.offer);
    r.offer=sc.interactions.add(partner.sprite.x+5,partner.sprite.y+5,20,'поговорить с Тамиром за чаем',()=>{});
    r.offer.onInteract=()=>{
      if(!this.free(sc))return;
      sc.interactions.remove(r.offer);r.offer=null;r.quiet=25000;
      sc.safeRun(()=>TamirLife.initiate(sc));
    };
    r.offerUntil=r.elapsed+20000;
  },
  update(sc,delta) {
    const r=sc._homeLife;if(!r)return;
    const dt=Math.min(delta||16.67,100);r.elapsed+=dt;r.quiet=Math.max(0,r.quiet-dt);
    const free=this.free(sc);
    if(r.offer && (r.elapsed>r.offerUntil || !sc.tamir?.sprite?.visible || sc._tamirAway)){
      sc.interactions.remove(r.offer);r.offer=null;
    }
    if(r.offer){r.offer.x=sc.tamir.sprite.x+5;r.offer.y=sc.tamir.sprite.y+5;}
    if(r.freeText)r.freeText.setVisible(free);
    if(!free){this.cancelWalk(sc);r.rest=null;if(r.bubble)r.bubble.setVisible(false);r.marker.clear();return;}
    if(r.bubble){if(r.elapsed>=r.bubbleUntil){r.bubble.destroy();r.bubble=null;}
      else{const p=r.bubbleActor.sprite;r.bubble.setVisible(true).setPosition(Math.max(52,Math.min(sc.worldW-52,p.x)),Math.max(30,p.y-28));}}
    if(r.rest){const cat=r.rest.actor;r.rest.left-=dt;if(r.rest.left<=0||!cat.sprite?.scene)r.rest=null;
      else {cat.target=null;cat.wanderTimer=1000;cat.sprite.setVelocity(0,0);}}
    if(r.walk){const walk=r.walk;walk.left-=dt;
      if(walk.left<=0 || !walk.actor.sprite?.scene || (walk.actor.target && walk.actor.target!==walk.owned)){this.cancelWalk(sc);}
      else if(!walk.actor.target){const next=walk.path.shift();
        if(next){walk.actor.moveTo(next.x,next.y);walk.owned=walk.actor.target;}
        else{r.walk=null;walk.arrive();}}
    }
    if(!r.walk && !r.quiet){r.next-=dt;if(r.next<=0){r.next=28000;this.routine(sc);}}
    r.marker.clear();const active=sc.interactions.active;
    if(active?.homeStation){r.marker.lineStyle(1,0xffffff,.65).strokeCircle(active.x,active.y-4,4+Math.sin(r.elapsed/300)*.5);}
    r.steam.clear();const t=r.furniture.table;
    if(t && r.steamUntil>r.elapsed){for(let i=0;i<2;i++){const rise=(r.elapsed/160+i*4)%10;
      r.steam.fillStyle(0xeee6d8,(1-rise/10)*.5).fillRect(t.x-5+i*12+Math.sin(rise),t.y-t.displayHeight-rise,1,3);}}
    if(this.state().windowOpen && r.elapsed>(r.rainAt||0)){r.rainAt=r.elapsed+1500;this.sound('rain');}
    if(r.elapsed>(r.refreshAt||0)){r.refreshAt=r.elapsed+1000;this.render(sc);}
  },
  sound(kind) {
    if(!Audio.ready || Audio.ctx.state==='suspended')return;
    if(kind==='purr'){Audio.playPurr();return;}
    const ctx=Audio.ctx,now=ctx.currentTime;
    const settings={wood:[150,.07,.055],tile:[480,.045,.04],rug:[100,.05,.025],switch:[1200,.035,.035],
      cup:[920,.16,.035],kettle:[1350,.65,.018],water:[650,.38,.025],cloth:[220,.18,.025],window:[300,.12,.03],rain:[800,1.25,.009]};
    const [hz,duration,volume]=settings[kind]||settings.cloth;
    const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,now);gain.gain.linearRampToValueAtTime(volume,now+.012);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
    gain.connect(Audio.sfxGain);
    let source,filter;
    if(['cup','kettle','switch','window'].includes(kind)){source=ctx.createOscillator();source.type='sine';source.frequency.setValueAtTime(hz,now);source.frequency.linearRampToValueAtTime(hz*(kind==='kettle'?1.3:.85),now+duration);source.connect(gain);}
    else{source=ctx.createBufferSource();source.buffer=Audio._noiseBuffer(duration);filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=hz;source.connect(filter);filter.connect(gain);}
    source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();};source.start(now);source.stop(now+duration+.02);
  },
  footstep(sc,x,y) {
    const f=sc._homeLife.furniture,sofa=f.sofa,counter=f.counter;
    this.sound(sofa&&Math.hypot(x-sofa.x,y-sofa.y)<36?'rug':counter&&Math.hypot(x-counter.x,y-counter.y)<60?'tile':'wood');
  },
};
