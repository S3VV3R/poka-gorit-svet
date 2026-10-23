Object.assign(Chronicle, {
active(){
    const game=window.__phaserGame;if(!game)return null;
    return game.scene.getScenes(true).find(sc=>sc instanceof GameplayScene && sc.scene.key!=='UI')||null;
  },

canOpen(sc){return sc && !sc.locked && !sc._chronicleBusy && !sc.ui?.isConversationActive?.() && !sc.ui?.dlgContainer?.visible && !sc.ui?.choiceContainer?.visible && !sc.ui?.memoryContainer?.visible && !sc.ui?.logContainer?.visible;},

install(sc){
    this.sync(sc);
    const c=this.state();c.clockAnchors ||= {};
    const anchors={Street:1140,DateScene:1140,TripScene:1200,Apartment:1080,Proposal:1140,Wedding:720,YoungFamily:480,Baby:1320,Kids:480,EmptyNest:540,LateYears:1020,Ending:480};
    if(!c.clockAnchors[sc.scene.key] && anchors[sc.scene.key]!==undefined){c.minute=anchors[sc.scene.key];c.clockAnchors[sc.scene.key]=true;this.sync(sc);}
    this.mount();
    sc.input.keyboard.on('keydown-J',()=>{if(this.canOpen(sc))this.open(sc,'Дела');});
    sc.input.keyboard.on('keydown-F',()=>{if(this.canOpen(sc))sc.safeRun(()=>this.run(sc,()=>this.photo(sc)));});
    sc.events.once('shutdown',()=>{if(this.owner===sc)this.close(false);if(this.controls)this.controls.hidden=true;});
  },

mount(){
    if(this.controls)return;
    const controls=document.createElement('div');controls.id='life-buttons';controls.hidden=true;
    controls.setAttribute('aria-label','Свободное время');
    const hint=document.createElement('span');hint.className='life-hint';hint.textContent='Здесь можно выбрать занятие для свободного времени ↓';hint.hidden=!!this.state().menuDiscovered;controls.append(hint);
    for(const [label,tab] of [['ЧЕМ ЗАНЯТЬСЯ? · J','Дела'],['Снимок · F','photo']]){
      const b=document.createElement('button');b.type='button';b.textContent=label;if(tab==='Дела'){b.className='life-primary';b.setAttribute('aria-haspopup','dialog');}b.onclick=()=>{const sc=this.active();if(!this.canOpen(sc))return;if(tab==='photo')sc.safeRun(()=>this.run(sc,()=>this.photo(sc)));else this.open(sc,tab);};controls.append(b);
    }
    document.body.append(controls);this.controls=controls;
    const overlay=document.createElement('section');overlay.id='life-book';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Жизнь Насти');
    overlay.innerHTML='<div class="book"><header><div><h2>Чем заняться?</h2><div class="sub"></div></div><button data-close>Вернуться в игру · Esc</button></header><nav aria-label="Разделы жизни Насти"></nav><main></main></div>';
    overlay.querySelector('[data-close]').onclick=()=>this.close();
    overlay.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();this.close();}if(e.key==='Tab'){const nodes=[...overlay.querySelectorAll('button:not(:disabled),select,input:not(:disabled),a[href],summary')].filter(n=>n.getClientRects().length);const i=nodes.indexOf(document.activeElement);if(e.shiftKey&&i<=0){e.preventDefault();nodes.at(-1)?.focus();}else if(!e.shiftKey&&(i<0||i===nodes.length-1)){e.preventDefault();nodes[0]?.focus();}}});
    overlay.addEventListener('pointerdown',e=>e.stopPropagation());document.body.append(overlay);this.panel=overlay;
  },

open(sc,tab='Дела'){
    if(!this.canOpen(sc) || this.owner)return;
    if(tab==='Дела' && typeof Tutorial!=='undefined')Tutorial.complete('activities');
    this.mount();this.owner=sc;this.lastFocus=document.activeElement;sc.lockInput();sc.scene.pause();
    sc.ui.input.enabled=false;sc.ui.input.keyboard.enabled=false;
    if(tab==='Дела'&&!this.state().menuDiscovered){this.state().menuDiscovered=true;this.controls.querySelector('.life-hint').hidden=true;SaveSystem.save();}
    this.panel.hidden=false;this.controls.hidden=true;this.render(tab);this.panel.querySelector('nav button.selected').focus();
  },

close(resume=true){
    const sc=this.owner;this.owner=null;if(this.panel)this.panel.hidden=true;
    if(sc && resume){sc.scene.resume();sc.unlockInput();sc.ui.input.enabled=true;sc.ui.input.keyboard.enabled=true;if(sc.ui.showTouchControls)sc.ui.showTouchControls();}
    if(sc && !resume){sc.ui.input.enabled=true;sc.ui.input.keyboard.enabled=true;}
    this.lastFocus?.focus?.();
  },

launch(fn){const sc=this.owner;if(!sc)return;this.close();sc.safeRun(()=>this.run(sc,()=>fn(sc)));},

render(tab,focusTab=false){
    const tabs=['Дела','Альбом','Дом и планы'];
    if(!tabs.includes(tab))tab='Дела';
    const sc=this.owner,c=this.state(),root=this.panel,main=root.querySelector('main'),nav=root.querySelector('nav');
    main.replaceChildren();nav.replaceChildren();
    main.scrollTop=0;root.querySelector('h2').textContent=tab==='Дела'?'Чем заняться?':tab;root.setAttribute('aria-label','Жизнь Насти · '+tab);
    root.querySelector('.sub').textContent=this.date()+' · '+c.money+' ₽ · '+(c.widowed?'Жизнь Насти продолжается':'Свободное время Насти');
    for(const t of tabs){
      const b=document.createElement('button');b.textContent=t;b.className=tab===t?'selected':'';if(tab===t)b.setAttribute('aria-current','page');b.onclick=()=>this.render(t,true);nav.append(b);
    }
    const text=(t)=>{const p=document.createElement('p');p.textContent=t;main.append(p);return p;};
    const grid=document.createElement('div');grid.className='grid';
    const card=(title,body)=>{const a=document.createElement('article'),h=document.createElement('h3'),p=document.createElement('small');h.textContent=title;p.textContent=body;a.append(h,p);grid.append(a);return a;};
    const button=(a,label,fn,disabled=false)=>{const b=document.createElement('button');b.textContent=label;b.disabled=!!disabled;b.onclick=fn;a.append(b);return b;};
    if(tab==='Дела'){
      if(sc.kitchenTask && !sc.kitchenTask.running)button(main,'По сюжету: '+sc.kitchenTask.title,()=>this.launch(source=>KidsKitchen.run(source)));
      const help=document.createElement('details'),summaryHelp=document.createElement('summary'),helpText=document.createElement('p');
      summaryHelp.textContent='Как выбрать занятие?';
      helpText.textContent='Выбери занятие и нажми «Начать». Время пройдёт после дела; покупки и воспоминания сохранятся.'+(sc._homeLife?' Можно подойти к мебели и удерживать E или сенсорную кнопку «Действие».':'');
      help.append(summaryHelp,helpText);main.append(help);
      const day=document.createElement('div');day.className='day-option';
      const dayText=document.createElement('small');dayText.textContent='Хочется прожить день целиком? Утро, встречи и вечер — с небольшими выборами по ходу.';day.append(dayText);
      button(day,'Прожить обычный день →',()=>this.launch(source=>this.ordinaryDay(source)));main.append(day);
      const entries=SCRIPT_CONTENT.actions.map((title,i)=>({id:i+1,title,group:this.actionGroup(i+1),reason:this.actionReason(i+1)}));
      const row=document.createElement('div');row.className='row';
      const categoryLabel=document.createElement('label');categoryLabel.className='field';categoryLabel.textContent='Что хочется сделать?';
      const select=document.createElement('select');
      for(const [value,name] of [['now','Подборка на сейчас'],['all','Все дела · '+entries.length],...[...new Set(entries.map(a=>a.group))].map(name=>[name,name])]){
        const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o);
      }
      categoryLabel.append(select);row.append(categoryLabel);
      const searchLabel=document.createElement('label');searchLabel.className='field';searchLabel.textContent='Найти занятие';
      const search=document.createElement('input');search.type='search';search.placeholder='Например, чай или фотографии';searchLabel.append(search);row.append(searchLabel);main.append(row);
      const lockedRow=document.createElement('div');lockedRow.className='row';
      const lockedLabel=document.createElement('label'),showLocked=document.createElement('input');showLocked.type='checkbox';
      const lockedCount=entries.filter(a=>a.reason).length;lockedLabel.append(showLocked,document.createTextNode('Показать пока недоступные'+(lockedCount?' · '+lockedCount:'')));lockedRow.append(lockedLabel);main.append(lockedRow);
      const summary=text('');summary.className='activity-summary';summary.setAttribute('aria-live','polite');
      const priorities=c.phase==='утро'?[16,17,18,13,91,58,98,50]:c.phase==='вечер'||c.phase==='ночь'?[19,17,53,48,102,68,81,120]:[58,50,13,98,81,51,104,23];
      const fill=()=>{
        grid.replaceChildren();
        const query=search.value.trim().toLocaleLowerCase('ru');
        let matching=entries.filter(a=>(select.value==='now'||select.value==='all'||a.group===select.value)&&(!query||(a.title+' '+a.group).toLocaleLowerCase('ru').includes(query)));
        const available=matching.filter(a=>!a.reason),locked=matching.filter(a=>a.reason);
        let visible=available;
        if(select.value==='now'&&!query){
          const rank=id=>{const index=priorities.indexOf(id);return index<0?priorities.length+(c.actions[id]?1:0):index;};
          visible=[...available].sort((a,b)=>rank(a.id)-rank(b.id)).slice(0,8);
        }
        if(showLocked.checked)visible=visible.concat(locked);
        summary.textContent=select.value==='now'&&!query
          ?'На сейчас — '+Math.min(available.length,8)+' занятий. Все '+entries.length+' дел — в категориях и поиске.'
          :'Найдено: '+available.length+' доступных'+(locked.length?' · '+locked.length+' пока недоступны':'')+'.';
        for(const a of visible){
          const item=card(a.title,a.group+' · '+this.actionInfo(a.id));
          if(a.reason||c.actions[a.id]){const status=document.createElement('p');status.className='activity-status'+(a.reason?' unavailable':'');status.textContent=a.reason||'✓ Уже знакомое дело';item.append(status);}
          button(item,a.reason?'Пока недоступно':'Начать →',()=>this.launch(source=>this.activity(source,a.id)),a.reason);
        }
        if(!visible.length){const empty=document.createElement('p');empty.className='empty-state';empty.textContent=locked.length?'Сейчас эти дела недоступны. Включи «Показать пока недоступные», чтобы узнать причину.':'Такого занятия не найдено. Попробуй другое слово или выбери все дела.';grid.append(empty);}
      };
      select.onchange=fill;search.oninput=fill;showLocked.onchange=fill;fill();
    }
    if(tab==='Альбом'){
      text('Здесь остаются сделанные снимки, важные вещи и записи. У каждой жизни будет своя последовательность.');
      for(const item of this.keepsakes()){
        const a=card(item[0],item[1]);button(a,'Рассмотреть и вспомнить',()=>this.launch(async source=>{await source.ui.dialogue([NAR(item[1]),NAR(item[2])]);MemorySystem.remember('keepsake:'+item[0],item[0],item[2]);this.advance(source,15);}));
      }
      for(const p of [...GameState.life.photos].reverse()){
        const a=card(p.title,`Год ${p.year}, день ${p.day}`);
        if(p.image){const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.src=p.image;img.alt=p.title;a.prepend(img);}
      }
      for(const m of [...GameState.life.memories].reverse()){const a=card(m.title,m.text||'Осталось в памяти.');}
      for(const entry of c.journal.slice(-25).reverse())card(entry.title,entry.date+' · '+entry.text);
    }
    if(tab==='Дом и планы'){
      text(`Бюджет: ${c.money} ₽. Долг: ${c.debt} ₽. Продукты: ${c.pantry}. Порций корма: ${c.food}.`);
      text(`Мечта Насти: ${c.era<=2?'увидеть море':c.era<=4?'свой небольшой дом':c.era<=7?'чтобы девочки выросли счастливыми':'ещё один обычный день'}.`);
      for(const [title,body,fn] of [
        ['Следующее утро','Отдохнуть, закончить день и увидеть, что задумал Тамир.',async source=>{c.minute=1440+480;this.advance(source,0);await this.morning(source);}],
        ['Семейный транспорт','Подержанный автомобиль — 900 ₽; можно выбрать электромобиль.',async source=>{const p=await source.ui.choice('Как ездить?',['Автономный общественный транспорт','Подержанная машина · 900 ₽','Электромобиль · 1300 ₽']);if(p>0){if(this.charge(p===1?900:1300,'транспорт')){c.items.car=true;c.items.electric=p===2;await source.ui.dialogue([NAR('Ключи от машины лежат у входа. У неё начинается своя семейная история.')]);}else await source.ui.dialogue([NAR('Пока лучше накопить. Общественный транспорт остаётся доступен.')]);}}],
        ['Переезд в свой дом','Реальная покупка небольшого дома — 2200 ₽.',async source=>{if(this.charge(2200,'свой дом')){c.items.homeOwned=true;this.effect('home');await source.ui.dialogue([NAR('Небольшой дом становится своим. Они сохраняют привычные уголки, растения и семейный стол.')]);}else await source.ui.dialogue([NAR('Сбережений пока недостаточно. План остаётся в дневнике.')]);}],
        ['Платёж по кредиту','Погасить часть задолженности — до 250 ₽.',async source=>{const n=Math.min(250,c.debt,Math.max(0,c.money));c.money-=n;c.debt-=n;await source.ui.dialogue([NAR(n?'Платёж внесён. Долг стал меньше на '+n+' ₽.':'Сейчас нет задолженности или свободных денег для платежа.')]);}],
        ['Поездки к детям','После их отъезда можно увидеть, как устроена их собственная жизнь.',async source=>{await this.daughterCall(source);await source.ui.dialogue([NAR('Они выбирают удобный день для поездки. У дочерей теперь свои ключи, свои кухни и свои привычки.')]);if(c.era>=7){await this.visitDaughter(source,'bella');await this.visitDaughter(source,'nia');}}],
        ['Круглый семейный праздник','Собраться, сохранить снимок и встретить дочерей.',async source=>{if(c.era>=7){await this.milestone(source,'lastParty');await this.visitDaughter(source,'bella');await this.visitDaughter(source,'nia');}else{c.items.holiday=true;await source.ui.dialogue([NAR('К столу приходят по приглашению. Лера приносит цветы; Артём снова берёт на себя неловкий тост.')]);}await this.photo(source);}],
        ['Интересы Нии','Предложить кружок или занятие. Профессию она позже выберет сама.',async source=>{if(c.era!==6){await source.ui.dialogue([NAR('Эти занятия важны в школьные годы Нии.')]);return;}const keys=['medicine','science','technology','engineering','music','other'];const p=await source.ui.choice('Что попробовать вместе?',['Биология и первая помощь','Научный кружок','Программирование','Конструирование','Музыка','Другое творческое занятие']);const key=keys[p];c.interests[key]=(c.interests[key]||0)+1;await source.ui.dialogue([{who:'Ния',text:'Спасибо. Попробую. Только можно я передумаю, если не понравится?'}]);this.advance(source,90);}],
      ]){const a=card(title,body);button(a,'Выбрать',()=>this.launch(fn),title==='Поездки к детям'&&c.era<7);}
      if(Object.keys(c.repairs).length)text('Требуют внимания: '+Object.keys(c.repairs).map(k=>({tap:'кран',bulb:'лампа',robot:'робот-пылесос',internet:'домашняя сеть'}[k]||k)).join(', ')+'.');
    }
    main.append(grid);
    if(focusTab)nav.querySelector('button.selected')?.focus();
  },

travel(source,place,onReturn){
    const origin=source.scene.key==='Neighborhood'?source.returnKey:source.scene.key;
    const quest=source.scene.key==='Neighborhood'?source.returnQuest:{text:source.ui.questText.text,visible:source.ui.questContainer.visible};
    const data={returnKey:origin,place,storyEra:source.storyEra||ERA_BY_SCENE[source.scene.key]||'e'+this.state().era,returnQuest:quest,onReturn};
    if(source.scene.key==='Neighborhood'){data.onReturn=source.onReturn||onReturn;source.scene.restart(data);}
    else{source.scene.pause();source.scene.launch('Neighborhood',data);}
  },
});
