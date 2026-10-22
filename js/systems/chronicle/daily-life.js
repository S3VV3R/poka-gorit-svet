Object.assign(Chronicle, {
async morning(sc){
    const c=this.state();this.sync(sc);
    if(c.pendingVisits.length && c.elapsedDays%7>=5){const key=c.pendingVisits.shift();await this.visitDaughter(sc,key);}
    await this.tamirDay(sc);
    if(c.elapsedDays%7===0 && GameState.life.season===3){
      const p=await sc.ui.choice('Зимний семейный вечер',['Украсить дом и приготовить стол','Сделать тихий вечер с музыкой']);
      c.items.holiday=true;this.effect(p===0?'kids':'memory');this.note('Зимний праздник','У каждого года свой вечер.');
    }
    if(c.elapsedDays%7===0 && GameState.life.season===1 && !c.items.seaVisited){c.reminders.push('Летняя поездка к морю: можно запланировать в решениях жизни');}
    this.refreshHome(sc);
  },

async tamirDay(sc){
    const c=this.state(),t=TamirLife.ensure(),actor=sc.tamir||sc.npc;
    if(c.era<2 || c.widowed)return;
    const mode=c.elapsedDays%10;
    const outcomes=[
      ['Ранний уход','Уехал пораньше. Вернусь вечером. На кухне оставил чай.','work'],
      ['Подарок без повода','Увидел маленький цветок и подумал про твой подоконник.','gift'],
      ['Сам приготовил завтрак','Я приготовил завтрак. Не спрашивай, сколько сковородок понадобилось.','breakfast'],
      ['Задержка на работе','Тут какая-то фигня происходит. Расскажу, когда немного выдохну.','late'],
      ['Прогулка в одиночку','Пойду пройдусь. Мне нужно немного побыть одному. Тебе принести булочку?','walk'],
      ['Ремонт без просьбы','Начал чинить эту полку. Теперь выясняю, почему она раньше держалась.','repair'],
      ['Звонок другу','Артём позвонил. Зайду к нему ненадолго, хорошо?','friend'],
      ['Усталость','Я сегодня раньше лягу. Можно без серьёзных разговоров прямо сейчас?','rest'],
      ['Первый шаг после ссоры','Я вчера был резок. Чай будешь?','reconcile'],
      ['Сигарета на балконе',c.items.quitSupport?'Сегодня после ужина обойдусь без сигареты. Просто посидим?':'Пойду на балкон. Пять минут, и вернусь.','smoke'],
    ];
    const d=outcomes[mode];t.lastTopic=d[2];t.initiatives++;
    await sc.ui.dialogue([{who:'Тамир',text:d[1]}]);this.note('Тамир: '+d[0],d[1]);
    if(actor && ['work','late','walk','friend'].includes(d[2])){
      actor.sprite.setVisible(false);sc._tamirAway=true;
      await sc.ui.dialogue([NAR('На вешалке нет его куртки. На столе остаётся записка.')]);
      // Absence belongs to this optional scene; authored scenes always receive their actor back.
      await wait(sc,700);actor.sprite.setVisible(true);sc._tamirAway=false;
    }
    if(d[2]==='repair'){delete c.repairs.tap;delete c.repairs.furniture;}
    if(d[2]==='gift'){c.items.gift=true;}
    if(d[2]==='rest')t.energy=Math.min(100,t.energy+15);
    if(d[2]==='reconcile' && GameState.relationship.conflicts>0)this.effect('reconcile');
    if(t.daysSinceTalk>=3){await sc.ui.dialogue([TM('Ты замечаешь, что мы почти не разговариваем?')]);const p=await sc.ui.choice('Он ждёт ответа.',['Отложить дела и слушать','Снова сказать «потом»']);this.effect(p===0?'talk':'avoid');}
  },

async ordinaryDay(sc){
    const c=this.state();
    if(c.era<2){await sc.ui.dialogue([NAR('День Насти пока состоит из её собственных планов, друзей и случайных встреч. Общий быт появится позже.')]);await this.socialCall(sc,'lera');this.advance(sc,90);return;}
    await this.morning(sc);
    const morning=await sc.ui.choice('Утро',['Приготовить завтрак',c.widowed?'Позвонить дочери':'Спросить Тамира о его работе','Ещё немного поспать']);
    if(morning===0)await this.activity(sc,16,{noEvent:true});
    else if(morning===1){if(c.widowed)await this.daughterCall(sc);else if(c.decisions[3]){await sc.ui.dialogue([NS('Как твой день?'),TM('Расскажу. Я как раз хотел спросить о твоём.')]);this.effect('talk');}else await this.decide(sc,3,true);}
    else this.effect('rest');
    c.minute=780;this.sync(sc);
    const day=await sc.ui.choice('Днём',['Заняться делами дома','Встретиться с близким человеком','Провести время с детьми или позвонить']);
    if(day===0)await this.activity(sc,13,{noEvent:true});
    if(day===1)await this.socialCall(sc,'lera');
    if(day===2){if(c.era>=7)await this.daughterCall(sc);else if(c.era>=5)await this.activity(sc,68,{noEvent:true});else await this.socialCall(sc,'elena');}
    await this.event(sc);c.minute=1140;this.sync(sc);
    const evening=await sc.ui.choice('Вечером',['Общий ужин','Сохранить фотографию','Тихий разговор у окна']);
    if(evening===0)await this.activity(sc,19,{noEvent:true});
    if(evening===1)await this.photo(sc);
    if(evening===2){await sc.ui.dialogue([NAR(this.dinnerLine(true))]);MemorySystem.remember('balcony:'+c.elapsedDays,'Балкон в конце дня',this.dinnerLine(true));}
    c.minute=1440+480;this.advance(sc,0);await sc.ui.caption('Прошёл ещё один обычный день.',1300);
  },

async photo(sc){
    const c=this.state(),id='camera:'+c.era+':'+c.elapsedDays+':'+(++c.actionSerial);
    const title=`${LifeSystem.seasons[GameState.life.season].name}. ${TOWN_PLACES[sc.place]?.[0]||'Свет дома'}`;
    MemorySystem.snapshot(id,title);
    const photo=GameState.life.photos.find(p=>p.id===id);
    const image=await new Promise(resolve=>{
      let settled=false;const finish=v=>{if(!settled){settled=true;resolve(v);}};
      const timer=setTimeout(()=>finish(null),1800);
      try{sc.game.renderer.snapshot(img=>{clearTimeout(timer);finish(img);});}catch(e){clearTimeout(timer);finish(null);}
    });
    if(image && photo){
      try{const canvas=document.createElement('canvas');canvas.width=240;canvas.height=135;canvas.getContext('2d').drawImage(image,0,0,240,135);photo.image=canvas.toDataURL('image/jpeg',0.65);}
      catch(e){/* The dated memory remains if the browser cannot capture a frame. */}
    }
    this.note('Фотография',title);if(sc.era==='baby')GameState.flags.photoBella=true;
    await sc.ui.dialogue([NAR('Настя сохраняет кадр в телефоне. Его можно открыть в альбоме и потом узнать в семейной истории.')]);
    this.refreshHome(sc);SaveSystem.save();
  },

refreshHome(sc){
    if(!sc || !sc.put || !sc.add)return;
    const c=this.state();
    if(sc.bowlImg)sc.bowlImg.setVisible(GameState.flags.keptMarsBowl!==false);
    if(sc.catBedImg)sc.catBedImg.setVisible(GameState.flags.keptAbilkaBed!==false);
    const v=sc._chronicleVisuals ||= {};
    const prop=(id,key,x,y,show)=>{
      if(!v[id] && show && sc.textures.exists(key))v[id]=sc.add.image(x,y,key).setScale(0.86).setOrigin(0.5,1).setDepth(y+1);
      if(v[id])v[id].setVisible(!!show);
    };
    prop('gift','plant', 113.06, 148,c.items.gift);
    prop('holiday','string_lights', 199.76, 38.29,c.items.holiday&&GameState.life.season===3);
    prop('headphones','radio', 217.88, 60.57,GameState.ageStage==='mid'&&c.era===6);
    prop('medicine','books_stack', 104, 57.14,c.era>=8);
    prop('drawing','kid_drawing', 348.59, 46.86,GameState.flags.drawingOnFridge);
    prop('newFurniture','armchair', 99.47, 152.29,c.items.newFurniture);
    prop('wrappedGift','giftboxes', 112.41, 190.86,c.items.wrappedGift);
    // Collected photographs stay in the album, not floating above the floor.
  },
});
