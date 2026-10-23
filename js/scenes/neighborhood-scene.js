class NeighborhoodScene extends GameplayScene {
  constructor(){super('Neighborhood');}
  init(data){Object.assign(this,data);}
  create(){
    this.commonCreate();const place=this.place||'yard';this.place=place;
    const W=480,H=280;this.worldW=W;this.worldH=H;
    const palettes={yard:[0x38564a,0x927b60],cafe:[0x465a50,0xb29a78],work:[0x495b64,0x8c9391],school:[0x426456,0xa9a077],clinic:[0x627f79,0xc1c8b0],relatives:[0x416a4e,0x9a8867],coast:[0x4c9ca3,0xd5bf8b]};
    const colors=palettes[place];
    this.add.rectangle(0,0,W,H,colors[0]).setOrigin(0).setDepth(0);
    this.add.rectangle(0,170,W,80,colors[1]).setOrigin(0).setDepth(1);
    this.add.rectangle(36,30,W-72,80,0x2e403b).setOrigin(0).setDepth(2);
    this.add.rectangle(40,32,W-80,3,0xe4cf9b).setOrigin(0).setDepth(3);
    const label=(x,y,t)=>this.add.text(x,y,t,{fontFamily:'Georgia,serif',fontSize:'10px',color:'#fff0d0',backgroundColor:'#17231c',padding:{x:5,y:3}}).setOrigin(.5).setDepth(240);
    const prop=(k,x,y,scale=1)=>{if(this.textures.exists(k))this.add.image(x,y,k).setOrigin(.5,1).setScale(scale).setDepth(y);};
    for(const x of [32,448]){prop('tree',x,135);prop('flowerbed',x,258);}
    for(const x of [85,165,245,325,405]){this.add.rectangle(x,71,28,30,0xe0ca86,.8).setDepth(4);}
    label(240,28,TOWN_PLACES[place][0]);
    if(place==='yard'){prop('bench',238,161);prop('crates',65,145);prop('plant_big',410,145);label(73,94,'Магазин');}
    if(place==='cafe'){prop('cafe_table',125,161);prop('cafe_table',330,161);prop('plant_big',80,143);prop('flowers_red',320,119);label(138,94,'Кафе');label(340,94,'Цветочная');}
    if(place==='work'){prop('desk_laptop',130,135);prop('desk_laptop',330,135);label(138,94,'Работа Насти');label(340,94,'Работа Тамира');}
    if(place==='school'){prop('school_desk',120,137);prop('bookshelf',360,132);prop('toy_cars',228,155);label(120,94,'Садик и школа');label(350,94,'Библиотека');}
    if(place==='clinic'){prop('armchair',110,146);prop('table',320,140);label(125,94,'Олег · врач');label(350,94,'Ветеринар');}
    if(place==='relatives'){prop('cafe_table',230,149);prop('guitar',100,148);prop('flowerbed',350,145);}
    if(place==='coast'){
      this.add.rectangle(0,0,W,68,0x67aab5).setOrigin(0).setDepth(3);
      for(let i=0;i<8;i++){const wave=this.add.rectangle(30+i*60,42,34,2,0xe2eee1,.65).setDepth(4);this.tweens.add({targets:wave,x:wave.x+15,alpha:.2,duration:2400,yoyo:true,repeat:-1});}
      label(100,94,'Дешёвое кафе');label(344,94,'Маленькая гостиница');prop('cafe_table',100,142);prop('bed',345,143);
      this.interactions.add(350,152,24,'вернуться в номер после прогулки',()=>this.safeRun(()=>Chronicle.run(this,async()=>{await this.ui.dialogue([NS('Я всё-таки увидела море.'),NAR('За стеной тихо гудит старый холодильник. Они возвращаются поздно, уставшие и довольные.')]);MemorySystem.remember('hotel','Поздний вечер в маленьком номере');})));
    }
    this.physics.world.setBounds(16,112,W-32,H-128);
    this.player=new Player(this,240,235,skinFor('nastya'));
    this.npc=null;this._colRects=[];
    const ids=Object.keys(TOWN_PEOPLE).filter(id=>Chronicle.availablePerson(id)&&Chronicle.location(id)===place);
    ids.forEach((id,i)=>{const x=55+(i%6)*72,y=164+Math.floor(i/6)*44;const v=VIL(this,id,x,y,{stand:false,rx:12,ry:9});label(x,y-29,CAST[id].name);});
    for(const [id,n] of Object.entries(TOWN_EXTRAS).filter(([,n])=>n.place===place)){
      const v=new NPC(this,400-(Object.keys(TOWN_EXTRAS).indexOf(id)%2)*54,225,n.tex);v.playDir('idle');
      const it=this.interactions.add(v.sprite.x,v.sprite.y,24,'поговорить: '+n.name,()=>this.safeRun(()=>Chronicle.run(this,()=>this.extraTalk(id))));it.follow=v;label(v.sprite.x,198,n.name);
    }
    const source=this.scene.get(this.returnKey);
    if(!Chronicle.state().widowed && GameState.flags.metTamir && (place==='coast'||place==='relatives')){
      this.npc=new NPC(this,268,235,skinFor('tamir'));this.npc.dir='left';
      this.interactions.add(268,235,26,'поговорить с Тамиром',()=>this.safeRun(()=>Chronicle.run(this,async()=>{await this.ui.dialogue([TM(Chronicle.dinnerLine(true))]);TamirLife.heardEachOther();})));
    }
    this.interactions.add(240,262,23,'вернуться домой',()=>this.leave());label(240,269,'Домой');
    this.cameras.main.setBounds(0,0,W,H).setZoom(2.5).startFollow(this.player.sprite,true,.12,.12);
    this.ui.setQuest('Поговорить с людьми · E — взаимодействовать');this.ui.fadeIn(300);
    if(place==='coast'&&!Chronicle.state().items.seaVisited){Chronicle.state().items.seaVisited=true;Chronicle.state().trips++;MemorySystem.remember('sea','Настя увидела море','Это желание пришло из самой молодости.');}
    this.decorateSeason();
  }
  decorateSeason(){
    const season=GameState.life.season;
    if(season===3){for(let i=0;i<18;i++){const s=this.add.rectangle(i*27,5+(i*13)%90,2,2,0xf6f4e7,.65).setDepth(300);this.tweens.add({targets:s,y:280,duration:6000+i*120,repeat:-1});}}
    if(season===2)this.ambientInit().fallingLeaves(480,280,12);
    if(season===0 && this.place==='yard')addRain(this,480,280,12);
  }
  async extraTalk(id){
    const c=Chronicle.state(),n=TOWN_EXTRAS[id],count=c.extraBonds[id]||0;
    const ageLine=c.era<6?0:c.era<8?1:2;
    await this.ui.dialogue([{who:n.name,text:n.lines[ageLine]}]);
    const options=id==='timur'?['Купить продукты · 260 ₽','Поговорить о районе']:id==='tatiana'?['Записаться на осмотр кота','Рассказать, как кот ведёт себя дома']:id==='nina'?['Купить пирог · 80 ₽','Спросить, как проходит день']:['Послушать историю','Поделиться своей'];
    const p=await this.ui.choice(n.name+' · '+n.role,options);
    if(p===0 && id==='timur'){if(Chronicle.charge(260,'продукты')){c.pantry+=8;await this.ui.dialogue([{who:n.name,text:'Список собран. Молоко отдельно положил.'}]);}else await this.ui.dialogue([{who:n.name,text:'Ничего. Загляните после зарплаты.'}]);}
    else if(p===0 && id==='nina'){if(Chronicle.charge(80,'пирог')){c.pantry+=2;await this.ui.dialogue([{who:n.name,text:'Ещё тёплый. Только не держите пакет закрытым.'}]);}else await this.ui.dialogue([{who:n.name,text:'Свежая партия завтра. Не торопитесь.'}]);}
    else if(p===0 && id==='tatiana'){await Chronicle.activity(this,90,{noEvent:true});}
    else await this.ui.dialogue([NS(p===0?'Расскажите. Я сегодня не тороплюсь.':'В последнее время всё меняется. Иногда приятно просто поговорить.'),{who:n.name,text:count%2?'Мне тоже нравится, что мы можем вот так остановиться и поговорить.':n.lines[ageLine]}]);
    c.extraBonds[id]=count+1;addStat('friends');Chronicle.note('Встреча: '+n.name,options[p]);Chronicle.advance(this,15);
  }
  leave(){
    const source=this.scene.get(this.returnKey),cb=this.onReturn;
    this.scene.stop();this.scene.resume(this.returnKey);
    if(this.returnQuest?.visible)source.ui.setQuest(this.returnQuest.text);else source.ui.clearQuest();
    if(source.interactions)source.interactions.active=null;
    source.ui.hidePrompt();
    source.ui.showTouchControls?.();Chronicle.sync(source);SaveSystem.save();
    if(cb)cb();
  }
}

// Wire the expansion into all eras, including scenes loaded from older saves.
