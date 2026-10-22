Object.assign(Chronicle, {
async milestone(sc,key){
    const c=this.state();if(c.milestones[key])return;
    const scenes={
      trip:['Дорога не по плану',[
        NS('Кажется, мы проехали поворот.'),TM('Не проехали. Исследуем местность.'),
        NAR('Они спорят, потом едят суп в дешёвом кафе. В маленькую гостиницу возвращаются поздно, с одной общей фотографией.')],8],
      purchase:['Первая большая покупка',[TM('Это всего лишь стиральная машина.'),NS('Это ещё и один свободный вечер каждую неделю.')],14],
      kindergarten:['Первый день в садике',[{who:'Ирина',text:'Можно не убегать тайком. Попрощайтесь и скажите, когда вернётесь.'},
        {who:'Белла',text:'А если я захочу домой?'},NS('Тебе помогут позвонить мне. Я вернусь после полдника.')],28],
      bellaIll:['Первая болезнь Беллы',[NAR('Всю ночь Настя слушает дыхание ребёнка. Тамир меняет воду в стакане.'),{who:'Олег',text:'Я осмотрю её. Расскажите, как началось и как она спала.'}],27],
      niaSchool:['Первый школьный день Нии',[{who:'Павел',text:'Здесь можно задавать вопросы, на которые я не знаю ответа.'},
        {who:'Максим',text:'Я тоже пока не знаю, где наш кабинет.'},{who:'Ния',text:'Тогда найдём вместе.'}],32],
      firstLove:['Первая любовь Беллы',[{who:'София',text:'Белла сама расскажет. Только не смейтесь, пожалуйста.'},
        {who:'Белла',text:'Мам, мне нравится один человек. Я пока сама не очень понимаю, что с этим делать.'}],35],
      niaGrad:['Выпускной Нии',[NAR('Ния стоит с аттестатом. Светлые волосы убраны за ухо, в руке знакомая тетрадь.'),
        {who:'Ния',text:'Я думала, будет страшнее. А теперь страшно, что дальше столько всего.'},TM('Это не закончится. Но к этому привыкают.')],36],
      parentIll:['Болезнь и помощь',[NAR('Тамир впервые не встаёт по привычному утреннему будильнику. Настя звонит Олегу.'),
        {who:'Олег',text:'Нужны обследование и отдых. Давайте распределим помощь, чтобы Настя не делала всё одна.'}],43],
      marsIll:['Марс больше спит',[NAR('Марс пробует запрыгнуть на шкаф и остаётся на полу. Тамир ставит рядом маленькую ступеньку.'),
        {who:'Татьяна',text:'Проверим, нет ли боли. Дома ему нужны удобные невысокие места.'}],null],
      abilkaIll:['Абилка у окна',[NAR('Она тихо лежит рядом, но миска остаётся почти полной. Настя договаривается об осмотре.'),
        {who:'Татьяна',text:'Поговорим об уходе и о том, как сделать ей спокойнее.'}],null],
      lastParty:['Большой семейный вечер',[NAR('Белла привезла работу для новой выставки. Ния — книгу с нотами на полях. Гости пришли по приглашению.'),
        {who:'Елена',text:'Кажется, этот стол никогда не становится достаточно большим.'},TM('Он просто умеет быть тесным ровно тогда, когда нужно.')],53],
      lastVisit:['Последняя встреча с детьми',[{who:'Белла',text:'Я могу остаться до утра.'},NS('Останься. Расскажешь ещё про свою выставку.'),
        {who:'Ния',text:'А я поставлю чайник. Я знаю, где у вас чай.'}],null],
    };
    const d=scenes[key];if(!d)return;
    const was=sc.locked;sc.lockInput();
    const party=[];
    if(key==='lastParty' && sc.put){
      for(const [tex,x,y] of [['bella_adult',298.12,180.57],['nia_adult',329.18,187.43],[castTexFor('elena',eraOf(sc)),357.65,185.71]]){
        const guest=new NPC(sc,x,y,tex);guest.playDir('idle');party.push(guest);
      }
    }
    try{await sc.ui.caption(d[0],1200);await sc.ui.dialogue(d[1]);}
    finally{party.forEach(v=>v.destroy());}
    if(d[2])await this.decide(sc,d[2],true);
    if(key==='niaGrad')await sc.ui.dialogue([{who:'Ния',text:'Я выбрала '+this.chooseCareer()+'. Если передумаю, надеюсь, ты не скажешь «я же говорила».'}]);
    if(key==='trip')MemorySystem.snapshot('first-trip-cafe','Дешёвое кафе в первой поездке');
    if(['marsIll','abilkaIll','parentIll'].includes(key))await this.quiet(sc);
    c.milestones[key]=true;this.note(d[0]);MemorySystem.remember('milestone:'+key,d[0]);SaveSystem.save();if(!was)sc.unlockInput();
  },

async breathe(sc){
    sc.lockInput();
    for(;;){
      const home=typeof HomeLife!=='undefined' && sc._homeLife;
      const options=['Прожить обычный день','Продолжить историю'];
      if(home)options.push('Просто побыть дома — без спешки');
      const p=await sc.ui.choice('Можно задержаться в этом времени.',options);
      if(p===1)return;
      if(p===0)await this.run(sc,()=>this.ordinaryDay(sc));
      if(p===2 && home)await HomeLife.freeTime(sc);
      sc.lockInput();SaveSystem.save();
    }
  },

async houseTour(sc){
    sc.player.sprite.setVisible(false);sc.tamir?.sprite.setVisible(false);
    await sc.ui.fadeOut(600);sc.jump( 309.76, 113.71,sc.homeZoom);await sc.ui.fadeIn(700);
    for(const [x,y,text] of [[309.76,113.71,'Кухня. Стол. Старая кружка.'],[219.18,88,'Рисунок. Книги. Фотографии.'],[199.76,173.71,'Детская. Теперь здесь очень тихо.'],[63.88,139.43,'Спальня. Знакомые вещи на своих местах.'],[44.47,45.14,'Пустое место Марса.'],[277.41,194.29,'Место Абилки.']]){
      sc.cameras.main.pan(x,y,1000,'Sine.easeInOut');await sc.ui.caption(text,1700);
    }
    await sc.cut(sc.balcOX+236,160,2.6,600);sc.balcN.setVisible(false);sc.balcT.setVisible(false);
    await sc.ui.caption('Балкон. Два кресла. Целая жизнь между ними.',2400);
  },

async widowDays(sc){
    const c=this.state();c.widowed=true;c.milestones.firstLoss=true;c.milestones.widowLife=true;sc.lockInput();
    for(;;){
      const p=await sc.ui.choice('Жизнь Насти продолжается',['Прожить ещё один обычный день','Позвонить дочери','К следующей части истории']);
      if(p===2)break;
      if(p===0){await sc.ui.dialogue([NAR(this.dinnerLine())]);await this.activity(sc,13,{noEvent:true});c.minute=1440+480;this.advance(sc,0);await this.quiet(sc);}
      if(p===1)await this.daughterCall(sc);
      SaveSystem.save();
    }
    await this.milestone(sc,'lastVisit');
  },

milestoneDone(id){
    const f=GameState.flags,c=this.state();
    const flags={1:'metTamir',2:'firstDateDone',3:'firstKissDone',4:'dishesResolved',5:'tripDone',6:'movedInTogether',7:'marsHome',8:'abilkaHome',10:'proposalDone',11:'weddingDone',14:'pregnancyRevealed',16:'firstNightDone',18:'firstWordsDone',19:'niaBorn',21:'schoolChoice',22:'quarrelParents',24:'quarrelBella',25:'graduationDone',27:'bellaLeft',28:'niaLeft',32:'marsGone',34:'abilkaGone',36:'lastBalcony'};
    const custom={9:'crisis',12:'purchase',13:'parentTalk',15:'birthBella',17:'bellaIll',20:'kindergarten',23:'parentIll',26:'niaGrad',29:'agingTamir',30:'agingNastya',31:'marsIll',33:'abilkaIll',35:'lastParty',37:'firstLoss',38:'widowLife',39:'lastVisit',40:'secondLoss'};
    return !!(flags[id]?f[flags[id]]:c.milestones[custom[id]]);
  },

keepsakes(){
    const f=GameState.flags;
    return [
      [!!f.dishesResolved,f.shardKept?'Осколок синей кружки':'Первая синяя кружка','Когда-то на кухне было только две кружки.','Он сказал «сегодня», она ответила «сегодня уже завтра». Чай потом всё-таки был.'],
      [f.proposalDone,'Первое кольцо','Простое кольцо с маленькой неровностью.','Тамир не придумал речи и всё равно сумел сказать самое нужное.'],
      [GameState.life.photos.length>0,'Семейная фотография','Лица на снимках меняются вместе с домом.','Обычный вечер остался в кадре, потому что Настя достала телефон.'],
      [f.drawingOnFridge,'Рисунок Беллы','Неровная подпись и все члены семьи.','Ребёнок первым увидел семью целиком и оставил ей место на бумаге.'],
      [f.firstWordsDone,'Игрушка Беллы','Потёртая игрушка с ковра в детской.','Рядом лежал Марс. Первое слово оказалось коротким: «Мар».'],
      [f.niaBorn,'Игрушка Нии','Маленький жираф без одного уха.','Белла хотела тоже остаться маленькой. Настя тогда ещё не умела объяснить, как любят двоих.'],
      [f.marsHome && (!f.marsGone || f.keptMarsToy),'Ошейник Марса','Рядом со старой игрушечной мышью.','Марс ждал Тамира у двери и считал его одежду лучшей лежанкой.'],
      [f.abilkaHome && f.keptAbilkaBed!==false,'Лежанка Абилки','Тихое место рядом с креслом Насти.','Под кроватью было темно. Настя просто села рядом. Абилка вышла сама.'],
      [f.chapter1Complete,'Старый телефон','На нём когда-то помещались все первые сообщения.','Знакомый звук заставлял Настю улыбаться ещё до того, как она читала текст.'],
      [f.tripDone,'Билет из первой поездки','Бумага выцвела, но дата читается.','Они ошиблись дорогой. Потом смеялись в дешёвом кафе и возвращались в номер слишком поздно.'],
      [f.weddingDone,'Свадебная фотография','Тамир смотрит не в камеру, а на Настю.','«Ну что?» — «Что?» — «Мы это правда сделали».'],
    ].filter(x=>x[0]).map(x=>x.slice(1));
  },
});
