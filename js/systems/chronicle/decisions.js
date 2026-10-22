Object.assign(Chronicle, {
effect(kind) {
    const c=this.state(),f=GameState.flags;
    const positive={talk:'openness',openness:'openness',trust:'trust',support:'support',romance:'romance',respect:'respect',compatibility:'compatibility',reconcile:'openness',home:'home',newhome:'home'};
    if(positive[kind])adjustRelationship({[positive[kind]]:1});
    if(['talk','trust','openness','support','reconcile','lasttalk'].includes(kind)){addStat('talk');TamirLife.heardEachOther();}
    if(['kids','autonomy','respect','career','education','callbella','callnia','askkids'].includes(kind)){
      addStat('kidsBond');GameState.life.daughters.bella=Math.min(10,GameState.life.daughters.bella+1);GameState.life.daughters.nia=Math.min(10,GameState.life.daughters.nia+1);
    }
    if(['control','privacy','distance'].includes(kind)){
      addStat('avoid');GameState.life.daughters.bella=Math.max(0,GameState.life.daughters.bella-1);GameState.life.daughters.nia=Math.max(0,GameState.life.daughters.nia-1);
      adjustRelationship({respect:-1});
    }
    if(kind==='avoid'){addStat('avoid');TamirLife.ensure().openness=Math.max(0,TamirLife.ensure().openness-5);}
    if(kind==='conflict'){addStat('quarrels');adjustRelationship({conflicts:1,warmth:-1});}
    if(kind==='reconcile'){addStat('reconciled');adjustRelationship({conflicts:-1,closeness:1});}
    if(['autonomy','roomoffice','furniturechange','accessible','donate'].includes(kind))addStat('letGo');
    if(['home','roomkeep','furniturekeep','inherit','newhome'].includes(kind))addStat('houseAttach');
    if(['memory','archivecopy','marskeep','marsbed','abilkakeep'].includes(kind))addStat('memories');
    if(kind==='overload'){c.stress+=15;c.energy=Math.max(0,c.energy-12);}
    if(kind==='rest'){c.energy=Math.min(100,c.energy+15);c.stress=Math.max(0,c.stress-12);}
    if(kind==='economy'){c.items.budget=true;c.money+=100;}
    if(kind==='debt'){c.debt+=180;c.items.unpaid=true;}
    if(kind==='loan'){c.money+=1800;c.debt+=2000;}
    if(kind==='newjob'){c.items.job='новая работа';c.money+=400;}
    if(kind==='flexjob'){c.items.flexjob=true;c.items.job='гибкий график';}
    if(kind==='appliance'){if(this.charge(650,'стиральная машина'))c.items.appliance=true;else{c.items.savingFor='стиральная машина';this.note('Покупка отложена','Нужны сбережения на стиральную машину.');}}
    if(kind==='repair'){delete c.repairs.tap;c.items.repaired=true;}
    if(kind==='nest'){c.items.nursery=true;}
    if(kind==='parentlater'){c.items.parenthoodWait=true;}
    if(kind==='parentnow'){c.items.parenthoodWait=false;}
    if(kind==='proposalquiet')c.items.proposalStyle='тихий вечер';
    if(kind==='proposalspontaneous')c.items.proposalStyle='спонтанно';
    if(kind==='weddingbig')c.items.weddingWish='big';
    if(kind==='weddingsmall')c.items.weddingWish='family';
    if(kind==='newhome'){c.items.homePlan='небольшой семейный дом';c.items.savingFor='дом';}
    if(kind==='accessible'){c.items.accessibleHome=true;}
    if(kind==='inherit')c.items.inherit=true;
    if(kind==='roomkeep')c.items.room='с книгами и открытой дверью';
    if(kind==='roomoffice')c.items.room='кабинет с сохранёнными вещами детей';
    if(kind==='retire'){c.items.tamirRetired=true;}
    if(kind==='technology'){c.items.delivery=true;}
    if(kind==='health'){c.items.checkup=true;c.items.bellaRecovered=true;}
    if(kind==='friends'){c.extraBonds.galina=(c.extraBonds.galina||0)+1;addStat('friends');}
    if(kind==='career'){this.chooseCareer();}
    if(kind==='seafund'){c.items.tripPlanned=true;c.items.savingFor='море';}
    if(kind==='travel'){c.trips++;MemorySystem.remember('trip:small:'+c.trips,'Небольшая поездка','Дорога, кафе и общий снимок.');}
    if(kind==='sea'){c.items.tripPlanned=true;c.items.seaVisited=true;c.trips++;MemorySystem.remember('sea','Настя увидела море','Это желание пришло из самой молодости.');}
    if(kind==='smokingtalk'){c.items.smokingDiscussed=true;TamirLife.ensure().smoking=Math.max(0,(TamirLife.ensure().smoking ?? 5)-1);}
    if(['quitsupport','quitspace'].includes(kind)){c.items.quitSupport=true;TamirLife.ensure().smoking=Math.max(0,(TamirLife.ensure().smoking ?? 4)-2);}
    if(kind==='marskeep'){f.keptMarsBowl=true;f.keptMarsToy=true;}
    if(kind==='marsclear'){f.keptMarsBowl=false;c.items.marsPhoto=true;}
    if(kind==='marsbed')c.items.marsBed=true;
    if(kind==='abilkakeep')f.keptAbilkaBed=true;
    if(kind==='abilkaclear'){f.keptAbilkaBed=false;c.items.abilkaPhoto=true;}
    c.items[kind]=true;
  },

chooseCareer() {
    const c=this.state(),f=GameState.flags;
    if(c.items.niaCareer)return c.items.niaCareer;
    const names={medicine:'медицину',science:'науку',technology:'технологии',engineering:'инженерию',music:'музыку',other:'собственное направление, которое пока ищет'};
    const ranking=Object.entries(c.interests).sort((a,b)=>b[1]-a[1]);
    const pick=ranking[0][1]===0?'science':ranking[0][0];
    c.items.niaCareer=names[pick];f.niaCareer=pick;c.items.bellaCareer='дизайн и визуальное искусство';
    return c.items.niaCareer;
  },

decisionReason(d){
    const c=this.state(),id=d[0];
    if(c.decisions[id])return 'Уже прожито';
    if(!GameState.flags.metTamir)return 'После знакомства с Тамиром';
    if(c.era<d[1] || c.era>d[2])return 'Другой период жизни';
    if([46,47].includes(id) && !GameState.flags.marsGone)return 'После прощания с Марсом';
    if(id===48 && !GameState.flags.abilkaGone)return 'После прощания с Абилкой';
    if(c.widowed && [3,6,7,44,45,54,58,59,60].includes(id))return 'Этот разговор остался в прошлом';
    return '';
  },

async decide(sc,id,force=false){
    const c=this.state(),d=LIFE_DECISIONS.find(x=>x[0]===id);
    if(!d || c.decisions[id])return;
    if(!force && this.decisionReason(d))return;
    await sc.ui.dialogue([{who:d[3],text:d[4]}]);
    const pick=await sc.ui.choice(SCRIPT_CONTENT.choices[id-1],[d[5],d[6]]);
    const kind=d[pick===0?7:8];this.effect(kind);
    c.decisions[id]={pick,kind,date:this.date()};this.note(SCRIPT_CONTENT.choices[id-1],d[5+pick]);
    MemorySystem.remember('decision:'+id,SCRIPT_CONTENT.choices[id-1],d[5+pick]);
    const replies={avoid:'Он кивает. Разговор не закончен — просто пока не состоялся.',privacy:'Настя узнаёт лишнее. Позже дочь замечает, что дневник лежит не так, и закрывается ещё сильнее.',
      control:'Дочь соглашается коротко. Это не значит, что она согласилась внутри.',support:'«Спасибо», — говорит Тамир. Сегодня без шутки.',
      autonomy:'«Я попробую сама. А если что — позвоню». Настя учится отпускать по одному вечеру.',
      career:`Ния выбирает ${this.chooseCareer()}. «Мне хочется попробовать самой», — говорит она. Белла собирает портфолио для дизайна.`,
      parentlater:'Они договариваются вернуться к разговору через несколько месяцев. В жизни остаётся время пожить вдвоём.',
      parentnow:'Никто не чувствует себя совершенно готовым. Но теперь они знают, что могут бояться вместе.',
      quitsupport:'Вместо сигареты он берёт куртку. «Пойдём. Только без отчётов о каждом дне».',
      quitspace:'Тамир убирает пачку. Ему важно, что это его решение, а рядом есть поддержка.',
      loan:'Деньги поступили. В бюджете появился долг и регулярный посильный платёж.',
      newhome:'В планах появляется небольшой дом. Чтобы покупка стала реальностью, ещё нужно накопить.',
      sea:'В расписании появляется поездка к морю. Они собирают вещи и едут.',
      lasttalk:'Они обсуждают страхи, пожелания и то, кому позвонить. Потом Тамир спрашивает, остался ли чай.'};
    await sc.ui.dialogue([NAR(replies[kind] || `«${d[5+pick]}». Настя произносит это вслух. Другой человек слышит её решение, даже если не сразу находит ответ.`)]);
    if(['avoid','privacy','control','conflict','lasttalk'].includes(kind))await this.quiet(sc);
    this.advance(sc,30);SaveSystem.save();
  },

async quiet(sc){
    const c=this.state();c.quietUntil=c.elapsedDays+1;
    await sc.ui.dialogue([NAR('Чай остывает. Настя делает несколько обычных движений: убирает ложки, открывает форточку, садится.')]);
    if(sc.abilka && !GameState.flags.abilkaGone){sc.abilka.moveTo(sc.player.sprite.x+14,sc.player.sprite.y+5);await wait(sc,500);}
  },
});
