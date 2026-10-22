Object.assign(Chronicle, {
actionGroup(id) {
    if(id <= 15 || [22,41,42,43,109,113,114,115,116,117,118,119,120].includes(id)) return 'Дом и растения';
    if([40,62,63,64,65,106,107,108,110,112].includes(id)) return 'Память и фотографии';
    if(id === 111) return 'Отдых и прогулки';
    if([59,60,61].includes(id)) return 'Дети и праздники';
    if(id <= 24 || id === 75 || id === 101) return 'Кухня';
    if(id <= 47) return 'Деньги, ремонт и техника';
    if(id <= 58) return 'Отдых и прогулки';
    if(id <= 80) return 'Дети и праздники';
    if(id <= 90) return 'Коты';
    return 'Работа и близкие';
  },

actionCost(id) {
    return ({23:260,26:180,27:100,28:220,29:60,59:200,71:160,76:240,85:100,90:120,94:130,95:80,114:240,115:650,116:400})[id] || 0;
  },

actionInfo(id) {
    const c=this.state(),cost=this.actionCost(id);
    let duration=id===120?'До следующего утра':id===91?'4 ч':[48,49,58].includes(id)?'1 ч 30 мин':id===96?'Около 2 ч':id===62?'1 ч':[97,98,99].includes(id)?'30–50 мин':'30 мин';
    if(cost)duration+=' · '+cost+' ₽';
    if(id===91)duration+=' · +'+(c.items.flexjob?400:600)+' ₽';
    if([16,19,20,21,66,75].includes(id))duration+=' · 1 порция продуктов';
    if([82,83].includes(id))duration+=' · 1 порция корма';
    return duration;
  },

actionReason(id) {
    const c=this.state(), f=GameState.flags, e=c.era;
    if(id >= 66 && id <= 71 || id >= 77 && id <= 80){
      if(e < 5 || e > 6) return 'Когда дети живут дома';
      if([66,67].includes(id) && e > 5) return 'В младенчестве детей';
      if([69,70,71].includes(id) && e < 6) return 'В школьные годы';
    }
    if(id === 82 && (!f.marsHome || f.marsGone)) return 'Пока Марс рядом';
    if(id === 83 && (!f.abilkaHome || f.abilkaGone)) return 'Пока Абилка рядом';
    if(id >= 81 && id <= 90 && id !== 82 && id !== 83 && ((!f.marsHome || f.marsGone) && (!f.abilkaHome || f.abilkaGone))) return 'Когда дома есть коты';
    if([97,107,117].includes(id) && e < 7) return 'Когда дочери вырастут';
    if([72,73,74,76].includes(id) && GameState.life.season !== 3) return 'Зимние праздники';
    if(id === 30 && GameState.life.season !== 3) return 'Когда выпадет снег';
    if(id === 31 && GameState.life.season !== 2) return 'Осенняя пора';
    if([28,29,32,33].includes(id) && !c.items.car) return 'Сначала выбрать семейный транспорт в разделе «Дом и планы»';
    if(id===29 && !c.items.electric)return 'Когда в семье есть электромобиль';
    if([76,108,116].includes(id) && e<5)return 'После появления детей';
    if([91,92].includes(id) && e >= 8) return 'Рабочие годы позади; отдых и встречи доступны';
    if([102,103,104,101].includes(id) && (!f.metTamir || c.widowed)) return 'Когда Тамир рядом';
    if(e < 2 && ![48,49,50,51,54,55,56,57,58,59,61,62,98,96,104,105].includes(id)) return 'После начала совместной жизни';
    if([26,27].includes(id) && c.paid[`${id}:${c.era}:${c.year}:${c.month}`]) return 'Этот счёт за месяц уже оплачен';
    if(this.actionCost(id)>c.money) return 'Нужно '+this.actionCost(id)+' ₽ · сейчас '+c.money+' ₽';
    if([16,19,20,21,66,75].includes(id) && c.pantry<=0) return 'Сначала купить продукты';
    if([82,83].includes(id) && c.food<=0) return 'Сначала купить корм';
    return '';
  },

async activity(sc,id, options={}) {
    const c=this.state(), f=GameState.flags, reason=this.actionReason(id), title=SCRIPT_CONTENT.actions[id-1];
    if(reason){ await sc.ui.dialogue([NAR(reason + '.')]); return false; }
    const first=!c.actions[id], group=this.actionGroup(id);
    const cost=this.actionCost(id);
    if(cost && [26,27].includes(id)){
      const bill=`${id}:${c.era}:${c.year}:${c.month}`;
      if(c.paid[bill]){await sc.ui.dialogue([NAR('Этот счёт за месяц уже оплачен.')]);return false;}
      if(this.charge(cost,title))c.paid[bill]=true;
      else {await sc.ui.dialogue([NAR('На счёте пока недостаточно. Можно взять рабочую смену или пересмотреть бюджет.')]);return false;}
    } else if(cost && !this.charge(cost,title)){
      await sc.ui.dialogue([NAR('На эту покупку сейчас не хватает денег. Настя записывает её в планы.')]);return false;
    }
    if([16,19,20,21,66,75].includes(id)){
      if(c.pantry <= 0){await sc.ui.dialogue([NAR('На полке почти пусто. Сначала нужно купить продукты.')]);return false;}
      c.pantry--;
    }
    if([82,83].includes(id)){
      if(c.food<=0){await sc.ui.dialogue([NAR('Корм закончился. В магазине можно купить новую упаковку.')]);return false;}
      c.food--; c.items[id===82?'marsFed':'abilkaFed']=c.elapsedDays;
    }
    if(id===23)c.pantry+=8;
    if(id===85)c.food+=8;
    if(id===91){c.money+=c.items.flexjob?400:600;GameState.life.routines.work++;c.stress+=8;}
    if(id===94)c.items.medicine=true;
    if(id===95){c.items.checkup=true; c.stress=Math.max(0,c.stress-15);}
    if(id===92)c.items.atWork=true;
    if(id===93)c.items.atWork=false;
    if(id===7)c.items.laundry='выстирано';
    if(id===8)c.items.laundry='сохнет';
    if(id===9 || id===10)c.items.laundry='в шкафу';
    if(id===11 || id===12)c.items.bedMade=true;
    if(id===28 || id===29)c.items.carReady=true;
    if(id===30 || id===31)c.items.yardCleared=true;
    if(id===32 || id===33)c.items.carChecked=true;
    if(id===36)c.items.furnitureAssembled=true;
    if(id===38)c.items.wallPainted=true;
    if(id===39)c.items.furnitureMoved=!c.items.furnitureMoved;
    if(id===44)c.items.phoneCharged=true;
    if(id===45)c.items.smartHomeUpdated=true;
    if(id===46)c.items.lightMode=c.items.lightMode==='тёплый'?'вечерний':'тёплый';
    if(id===47)c.items.heating='комфортное';
    if(id===59 || id===60)c.items.wrappedGift=true;
    if(id===61)c.items.postcard=true;
    if(id===63)c.items.prints=GameState.life.photos.length;
    if(id===72 || id===73)c.items.holiday=true;
    if(id===74)c.items.holiday=false;
    if(id===84)c.items.trayClean=true;
    if(id===94)c.items.medicine=true;
    if(id===108)c.items.keptDrawing=true;
    if(id===109)c.items.decluttered=true;
    if(id===110)c.items.restoredPhoto=true;
    if(id===114)c.items.newCurtains=true;
    if(id===115)c.items.newFurniture=true;
    if(id===116)c.items.nurseryRenovated=true;
    if(id===117)c.items.closedRoom=true;
    if(id===118 || id===119)c.items.windowOpen=true;
    if(id===120)c.items.windowOpen=false;
    if(id===90){c.items.marsSick=false;c.items.abilkaSick=false;}
    if([1,2,3,4,5,6,7,8,9,10,11,12,22].includes(id))c.items.clean=true;
    if([13,14,15].includes(id))c.items.plantsWatered=c.elapsedDays;
    if([34,35,36,37,38,45].includes(id)){
      const key={34:'tap',35:'bulb',36:'furniture',37:'robot',38:'wall',45:'internet'}[id]; delete c.repairs[key];
    }
    if([40,63,64,65,106,108,110,112].includes(id)){c.items.archive=true; if(first)addStat('memories');}
    if(id===105)c.items.tripPlanned=true;
    if(id===97){await this.daughterCall(sc);}
    else if(id===96){await this.socialCall(sc,'elena');}
    else if(id===98){await this.messages(sc);}
    else if(id===99){await this.invite(sc);}
    else if(id===100){this.dismissGuests(sc);await sc.ui.dialogue([NAR('У двери говорят последнее «пока». Абилка осторожно возвращается в комнату.')]);}
    else if(id===62){await this.photo(sc);}
    else if(id===53 && typeof sc.toBalcony==='function'){
      await sc.toBalcony(GameState.ageStage); await sc.ui.dialogue([NAR(this.dinnerLine(true))]); await sc.fromBalcony(); sc.lockInput();
    }else{
      const line=this.activityLine(id,first);
      await sc.ui.dialogue([NAR(line)]);
    }
    c.actions[id]=(c.actions[id]||0)+1; c.actionSerial++;
    if(first){MemorySystem.remember('action:'+id,title,this.activityLine(id,true));this.note(title,this.activityLine(id,true));}
    if(group==='Дети и праздники' && first)addStat('kidsBond');
    if([16,17,19,48,53,101,102].includes(id) && first){addStat('habits');adjustRelationship({warmth:1});}
    if(id===103 && first)this.effect('reconcile');
    if(id===104 && first)this.effect('talk');
    if([48,49,50,51,52,54,55,56,57,111].includes(id))c.energy=Math.min(100,c.energy+10);
    if(id===69)c.interests.science++;
    if(id===51 && c.era===6)c.interests.music++;
    if(id===45 && c.era===6)c.interests.technology++;
    if([36,37].includes(id) && c.era===6)c.interests.engineering++;
    if(id===95 && c.era===6)c.interests.medicine++;
    if(id===120){c.minute=1440+480;this.advance(sc,0);await this.morning(sc);}
    else this.advance(sc,id===91?240:[48,49,58,96].includes(id)?90:30);
    if(!options.noEvent && c.actionSerial%3===0)await this.event(sc);
    this.refreshHome(sc);return true;
  },

dinnerLine(balcony=false){
    const c=this.state();
    if(c.widowed)return balcony?'Одно кресло пустует. Настя смотрит на свет в соседних окнах.':'На столе одна чашка. Она всё равно заваривает любимый чай.';
    if(c.era<=4)return balcony?'Они говорят о будущем, которого ещё не знают.':'Две тарелки, пересоленный ужин и Тамир, который настаивает, что это «авторский рецепт».';
    if(c.era<=6 && GameState.ageStage==='young')return balcony?'Из детской доносится голос. Тишина длится ровно до следующего «мам».':'На столе четыре места. Кто-то разливает сок, кто-то впервые рассказывает о своём дне.';
    if(c.era===6)return balcony?'Они выдыхают после тяжёлого дня. За закрытой дверью тихо играет музыка.':'Дочери быстро едят и уходят к своим делам. Настя и Тамир остаются допивать чай.';
    return balcony?'Они сидят молча. Между ними помещается целая прожитая жизнь.':'Снова две тарелки. Стол тот же; они уже другие. Тамир знает, сколько соли ей нужно.';
  },

activityLine(id,first){
    const c=this.state();
    if(c.widowed && id===1)return 'Настя моет посуду одна. Привычное движение рук помогает собраться с мыслями.';
    if(c.widowed && id===48)return 'Она включает старый фильм. Тамир всегда смеялся на несколько секунд раньше этой сцены.';
    const lines={
      1:'Тарелки звякают. Настя моет, Тамир вытирает; полотенце снова оказывается мокрее посуды.',
      6:'У контейнеров Денис придерживает дверь. Встреча длится минуту, разговор — чуть дольше.',
      13:'Листья блестят от воды. У растения с первого подоконника уже появился новый побег.',
      14:'Старая земля осыпается. Теперь корням свободнее; горшок остаётся тот же, любимый.',
      16:this.dinnerLine(),17:'Чайник шумит. Настя ждёт, когда чай станет нужного цвета.',
      18:'Кофе пахнет утром, даже если утро давно закончилось.',19:this.dinnerLine(),
      20:'Край пирога вышел неровным. Нина говорит, что именно так и узнают домашнюю выпечку.',
      23:'В сумке продукты по списку. Молоко — на месте. Это уже маленькая победа.',
      24:'Настя пишет список. Тамир дописывает «что-нибудь вкусное», будто это отдел магазина.',
      25:`На счёте ${c.money} ₽. Долг — ${c.debt} ₽. Они обсуждают покупки, а не угадывают мысли друг друга.`,
      34:'Кран наконец не капает. Последняя капля держится секунду и тоже сдаётся.',
      35:'Новая лампа загорается. Комната та же, но вечер снова тёплый.',
      37:'Винт находится под ногой. Тамир три часа искал причину поломки, а она всё это время блестела на полу.',
      43:'Ключи лежали в кармане другой куртки. Настя молча отдаёт их Тамиру; он благодарен за отсутствие комментария.',
      45:'Домашний помощник обновляет расписание света. Люди всё равно будут включать кухонную лампу вручную.',
      46:'Умное окно приглушает блики, свет становится мягче. За стеклом всё такой же обычный двор.',
      47:'Отопление теперь не спорит с открытой форточкой. Настя вспоминает об этом только через час.',
      48:first?'Они выбирают первый общий фильм. Название потом забудется, семейная шутка — останется.':'Та же сцена. Тамир заранее смеётся; Настя смеётся над тем, что он заранее смеётся.',
      50:'В библиотечной книге чужая закладка. Настя оставляет её на месте и находит свою страницу.',
      51:'Музыка доносится негромко. Ния объясняет ритм, если она дома; в тихом доме Настя просто слушает.',
      58:'Они проходят привычный круг. Сегодня замечают новую вывеску и дерево, которое всегда было здесь.',
      66:'Маленькая ложка встречает большое недоверие. С третьей попытки половина еды всё-таки оказывается по назначению.',
      67:'Вода тёплая. Тамир держит полотенце так серьёзно, будто это самый ответственный пост в мире.',
      68:'История закончилась. Ребёнок просит ещё одну — не потому что не слышал, а потому что не хочет отпускать вечер.',
      69:'Правильный ответ находится не сразу. Настя удерживается от того, чтобы решить за дочь всё задание.',
      70:'В рюкзаке тетрадь, рисунок и камень с очень важной историей. Камень остаётся.',
      72:'Гирлянда цепляется за край шкафа. Дом становится праздничным ещё до того, как всё готово.',
      73:'Ёлка чуть кривая. Место внизу оставляют для игрушек, которые не жалко уронить.',
      80:'Настя отпускает велосипед на несколько секунд позже, чем обещала. Дочь едет сама и не замечает.',
      81:'Марс охотится на верёвочку, Абилка ждёт, когда станет тише. У каждого свой способ играть.',
      82:'Марс приходит на звук миски быстрее, чем когда-либо откликался на своё имя.',
      83:'Абилка подходит осторожно. Настя отступает на шаг и даёт ей спокойно поесть.',
      86:'На щётке остаётся удивительное количество шерсти. Кот выглядит так, будто потерял только терпение.',
      87:'Только тёплая вода и только по необходимости. Сухое полотенце оказывается важнее любых уговоров.',
      89:'Кот нашёлся в самом тихом углу. Настя садится рядом и ждёт, пока он сам захочет выйти.',
      90:'Татьяна осматривает кота и объясняет уход. Настя записывает рекомендации; дома ему оставят тихое место.',
      91:'Рабочая смена заканчивается. Марина просит не отвечать на сообщения до завтра. Зарплата поступила на счёт.',
      92:'Автономный автобус везёт по обычному маршруту. Настя смотрит в окно, не проверяя каждую минуту телефон.',
      93:'У входа пахнет чьим-то ужином. Дом узнаётся раньше, чем открывается дверь.',
      95:'Олег объясняет результаты обследования понятными словами. Диагностическая система помогает, разговор остаётся человеческим.',
      101:this.dinnerLine(),102:'Они обнимаются без повода. Тамир убирает телефон и остаётся рядом.',
      103:'Тамир берёт тарелку, Настя — полотенце. Чай появляется на столе раньше, чем находится последняя нужная фраза.',
      107:'На дне ящика маленькая игрушка. Настя помнит день покупки лучше, чем его дату.',
      108:'Лист выцвел по краям. Неровная подпись Беллы всё ещё читается.',
      110:'Оборванный край аккуратно закреплён. Лицо на снимке теперь можно разглядеть целиком.',
      117:'Дверь прикрывается, но ключ остаётся снаружи. Комната сможет снова открыться, когда понадобится.',
      120:'В кухне гаснет последняя лампа. Из окна напротив всё ещё светит чей-то вечер.',
    };
    if(lines[id])return lines[id];
    const group=this.actionGroup(id);
    const result={ 'Дом и растения':'Дом становится чуть ухоженнее. Настя замечает следы вчерашнего дня и оставляет место для завтрашнего.',
      'Кухня':this.dinnerLine(), 'Деньги, ремонт и техника':'Дело закончено. На столе остаются нужные бумаги, инструменты возвращаются в ящик.',
      'Отдых и прогулки':'Несколько минут никто ничего не просит. Настя успевает заметить погоду, музыку и собственные мысли.',
      'Память и фотографии':'У этой вещи уже есть история. Настя бережно сохраняет её рядом с другими следами жизни.',
      'Дети и праздники':'Дом наполняется голосами. Небольшое дело превращается в повод побыть вместе.',
      'Коты':'В комнате снова тихо. Кот устраивается поудобнее и оставляет Насте совсем немного места.',
      'Работа и близкие':'День получает ещё одно маленькое дело и ещё одну встречу. Возвращаться домой теперь немного приятнее.' };
    return `${SCRIPT_CONTENT.actions[id-1]}. ${result[group]}`;
  },
});
