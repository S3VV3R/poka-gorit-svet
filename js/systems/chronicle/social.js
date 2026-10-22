Object.assign(Chronicle, {
async socialCall(sc,id){
    if(!this.availablePerson(id)){await sc.ui.dialogue([NAR('Знакомство ещё впереди.')]);return;}
    const locked=sc.locked;await castTalk(sc,id,null);if(locked)sc.lockInput();
    this.note('Разговор: '+CAST[id].name,'Телефонный звонок.');addStat('friends');this.advance(sc,20);
  },

async messages(sc){
    const c=this.state();
    const ids=Object.keys(TOWN_PEOPLE).filter(id=>this.availablePerson(id));
    const names=ids.slice(0,4);
    const canTamir=GameState.flags.metTamir&&!c.widowed;
    const pick=await sc.ui.choice('Кому написать?',names.map(id=>CAST[id].name).concat(canTamir?['Тамиру']:[]));
    if(canTamir && pick===names.length){
      await sc.ui.dialogue([NS('Как проходит твой день?'),TM(c.items.tamirRetired?'Чиню старое кресло. Скучаю.':'Работаю. Устал, но твоё сообщение очень вовремя.')]);
      TamirLife.heardEachOther();adjustRelationship({openness:1});
    }else await this.socialCall(sc,names[pick]);
  },

async daughterCall(sc,key){
    const c=this.state();if(c.era<7){await sc.ui.dialogue([NAR('Дочери пока живут дома. Можно поговорить с ними рядом.')]);return;}
    if(!key){const p=await sc.ui.choice('Кому позвонить?',['Белле','Ние']);key=p===0?'bella':'nia';}
    const name=key==='bella'?'Белла':'Ния',d=GameState.life.daughters;
    const career=key==='bella'?'выставка и работа над дизайном':('новый этап: я выбрала '+this.chooseCareer());
    const calls=++d[key+'Calls'];
    if(d[key]<2 && calls%3===1){await sc.ui.dialogue([NAR('Звонок остаётся без ответа. Через некоторое время приходит: «Мам, я позже напишу».')]);this.note('Пропущенный звонок',name+' обещала написать позже.');return;}
    const topics=[`У меня сейчас ${career}. Хотела рассказать именно тебе.`,
      'Кажется, я влюбилась. Можно без расспросов сразу обо всём? Сначала просто послушай.',
      'Мы думаем о своей семье. И я вдруг лучше понимаю, как вам когда-то было страшно.',
      'Я купила вам маленький подарок. Только не говори, что ничего не нужно.',
      'Сегодня устала. Можно просто послушать, как у вас дома шумит чайник?'];
    await sc.ui.dialogue([{who:name,text:topics[(calls-1)%topics.length]}]);
    const p=await sc.ui.choice('Что ответит Настя?',['Выслушать и спросить о её жизни','Дать совет без просьбы','Позвать в гости, договорившись о времени']);
    if(p===0){d[key]=Math.min(10,d[key]+1);addStat('kidsBond');addStat('talk');}
    if(p===1){await sc.ui.dialogue([{who:name,text:'Мам, мне не всегда нужно решение. Иногда нужен твой голос.'}]);}
    if(p===2){d[key]=Math.min(10,d[key]+1);if(!c.pendingVisits.includes(key))c.pendingVisits.push(key);await sc.ui.dialogue([{who:name,text:'Договорились на выходных. Я напишу, когда выеду.'}]);}
    this.note('Звонок: '+name,topics[(calls-1)%topics.length]);MemorySystem.remember('grown:'+key+':'+calls,'Звонок: '+name,topics[(calls-1)%topics.length]);
    GameState.life.routines.familyCalls++;this.advance(sc,20);
  },

async invite(sc){
    const p=await sc.ui.choice('Кого позвать на чай?',['Леру','Елену','Артёма','Веру Андреевну']);
    const id=['lera','elena','artem','vera'][p];
    if(!sc.put){await sc.ui.dialogue([NAR('Сегодня они договорились созвониться. Настя достаёт телефон.')]);await this.socialCall(sc,id);return;}
    if((sc._storyGuests||[]).length>=3){await sc.ui.dialogue([NAR('За столом уже достаточно гостей. Сначала проводим тех, кто собирался домой.')]);return;}
    const v=VIL(sc,id,296.82+(sc._storyGuests||[]).length*22,184,{stand:true,dir:'up'});
    (sc._storyGuests ||= []).push(v);await sc.ui.dialogue([{who:CAST[id].name,text:'Я по приглашению. И не с пустыми руками.'}]);
    if(sc.abilka)sc.abilka.moveTo( 67.12, 186.57);addStat('friends');
  },

dismissGuests(sc){
    const guests=sc._storyGuests||[];
    guests.forEach(v=>{if(v.talkItem)sc.interactions.remove(v.talkItem);v.destroy();});
    sc.villagers=(sc.villagers||[]).filter(v=>!guests.includes(v));sc._storyGuests=[];
  },

async visitDaughter(sc,key){
    const name=key==='bella'?'Белла':'Ния';
    let v=null;
    if(sc.put){v=new NPC(sc, 335.65, 187.43,key+'_adult');v.dir='left';(sc._visitingFamily ||= []).push(v);}
    await sc.ui.dialogue([{who:name,text:'Я привезла чай и кое-что из дома. Моего. Пока странно так говорить.'},NS('Показывай. Мы как раз собирались ужинать.')]);
    MemorySystem.remember('visit:real:'+key+':'+this.state().elapsedDays,'Приезд: '+name,'На кухне снова слышен голос дочери.');
    addStat('kidsBond');if(v){v.destroy();sc._visitingFamily=sc._visitingFamily.filter(x=>x!==v);}
  },
});
