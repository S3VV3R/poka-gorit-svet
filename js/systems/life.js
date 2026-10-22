const LifeSystem = {
  seasons: [
    { name: 'Весна', color: 0xb9e6be, line: 'Окна хочется открыть даже тогда, когда ещё прохладно.' },
    { name: 'Лето', color: 0xffdfa3, line: 'Вечер тянется долго, будто никому не хочется ставить точку.' },
    { name: 'Осень', color: 0xe3b077, line: 'Дом пахнет чаем, мокрыми куртками и возвращением.' },
    { name: 'Зима', color: 0xaec9e8, line: 'Свет в окне кажется важнее, когда снаружи темно рано.' },
  ],

  ensure() {
    const d = DEFAULT_STATE();
    GameState.life = Object.assign(d.life, GameState.life || {});
    GameState.life.routines = Object.assign(d.life.routines, GameState.life.routines || {});
    GameState.life.daughters = Object.assign(d.life.daughters, GameState.life.daughters || {});
    if (!Array.isArray(GameState.life.memories)) GameState.life.memories = [];
    if (!Array.isArray(GameState.life.photos)) GameState.life.photos = [];
    if (!GameState.life.seenEvents) GameState.life.seenEvents = {};
    TamirLife.ensure();
    return GameState.life;
  },

  label() {
    const life = this.ensure();
    const season = this.seasons[life.season % this.seasons.length];
    return `${season.name} · ${life.day} день · год ${life.year}\n${life.phase}  ·  M — альбом`;
  },

  attach(scene) {
    const life = this.ensure();
    if (scene.ui) scene.ui.setLifeStatus(this.label());
    if (scene.worldW && !scene._seasonOverlay) {
      const season = this.seasons[life.season % this.seasons.length];
      scene._seasonOverlay = scene.add.rectangle(scene.worldW / 2, scene.worldH / 2, scene.worldW, scene.worldH, season.color, 0.045)
        .setDepth(820).setBlendMode(Phaser.BlendModes.ADD);
    }
    TamirLife.schedule(scene);
  },

  refresh(scene) {
    const life = this.ensure();
    const season = this.seasons[life.season % this.seasons.length];
    if (scene && scene._seasonOverlay) scene._seasonOverlay.setFillStyle(season.color, 0.045);
    if (scene && scene.ui) scene.ui.setLifeStatus(this.label());
  },

  install(scene) {
    if (!scene || scene._lifeLayerInstalled) return;
    scene._lifeLayerInstalled = true;
    this.attach(scene);
    scene.lifePlanner = scene.interactions.add( 355.06, 156.57, 24, 'спланировать сегодняшний день', () => scene.safeRun(() => this.liveDay(scene)));
    if (DaughtersSystem.available()) {
      scene.phoneSpot = scene.interactions.add( 360.24, 101.71, 22, 'позвонить дочерям', () => scene.safeRun(() => DaughtersSystem.call(scene)));
    }
  },

  async liveDay(scene) {
    if (scene._livingDay || scene.locked) return;
    const life = this.ensure();
    scene._livingDay = true;
    scene.lockInput();
    if (scene.interactions) scene.interactions.needRelease = true;
    try {
      life.phase = 'утро'; this.refresh(scene);
      const season = this.seasons[life.season % this.seasons.length];
      await scene.ui.caption(`${season.name}. Обычный день — а значит, единственный в своём роде.`, 1900);
      const morning = await scene.ui.choice('Утро. Что для тебя важнее сейчас?', [
        'Приготовить завтрак и собрать всех за столом',
        'Спросить Тамира, как он на самом деле',
        'Оставить себе ещё немного тишины',
      ]);
      if (morning === 0) {
        await scene.ui.dialogue([{ who: '', text: 'Чайник шумит. Кто-то ищет ложку, кто-то уже опаздывает. На несколько минут все оказываются рядом.' }]);
        life.routines.breakfast++; life.homeMood++; addStat('habits'); adjustRelationship({ warmth: 1 });
        MemorySystem.remember('breakfast-' + life.completedDays, 'Завтрак, на который все успели');
      } else if (morning === 1) {
        await scene.ui.dialogue([{ who: 'Настя', text: 'Как ты?', mood: 'worried' }, { who: 'Тамир', text: 'Если честно? Рад, что ты спросила.', mood: 'happy' }]);
        TamirLife.heardEachOther(); life.homeMood++; addStat('talk'); adjustRelationship({ trust: 1, closeness: 1 });
        MemorySystem.remember('morning-talk-' + life.completedDays, 'Вопрос, заданный вовремя');
      } else {
        await scene.ui.dialogue([{ who: '', text: 'Настя сидит у окна чуть дольше обычного. Мир не рушится от того, что она не отвечает на всё сразу.' }]);
        life.routines.rest++; addStat('letGo');
      }

      life.phase = 'день'; this.refresh(scene);
      const familyDay = scene.era === 'baby' || scene.era === 'kids';
      const dayOptions = familyDay
        ? ['Помочь детям с их маленькими большими делами', 'Заняться работой и не отменять себя', 'Позвать близкого человека на чай']
        : ['Взяться за работу или важное дело', 'Встретиться с близким человеком', 'Сделать что-то только для себя'];
      const day = await scene.ui.choice('День. Куда отдать несколько часов?', dayOptions);
      if (day === 0) {
        await scene.ui.dialogue([{ who: '', text: familyDay ? 'Вопросов оказывается больше, чем ответов. Но один рисунок, один урок и один разговор всё-таки получаются.' : 'Дело не становится легче от того, что его откладывают. Зато становится посильным, когда начать.' }]);
        life.routines.work++; addStat(familyDay ? 'kidsBond' : 'talk');
        if (familyDay) MemorySystem.remember('family-day-' + life.completedDays, 'День, отданный детям');
      } else if (day === 1) {
        await scene.ui.dialogue([{ who: '', text: 'Разговор уходит далеко от повода встречи. Домой Настя возвращается с лёгкой усталостью и ощущением, что мир больше одной квартиры.' }]);
        addStat('talk'); life.homeMood++; MemorySystem.remember('friend-day-' + life.completedDays, 'Чай, который длился дольше плана');
      } else {
        await scene.ui.dialogue([{ who: '', text: 'Несколько часов никто ничего не просит. Внутри становится тише — не пусто, а именно тише.' }]);
        life.routines.rest++; addStat('letGo');
      }

      await this.randomEvent(scene);

      life.phase = 'вечер'; this.refresh(scene);
      const evening = await scene.ui.choice('Вечер. Что хочется сохранить?', [
        'Ужин и разговор без телефонов',
        'Сделать снимок этого обычного вечера',
        'Выйти на балкон и ничего не решать',
      ]);
      if (evening === 0) {
        await scene.ui.dialogue([{ who: '', text: 'Посуда звякает, кто-то перебивает, кто-то смеётся слишком громко. Ничего выдающегося — кроме того, что все дома.' }]);
        addStat('habits'); adjustRelationship({ warmth: 1 }); life.homeMood++;
        MemorySystem.remember('dinner-' + life.completedDays, 'Ужин без спешки');
      } else if (evening === 1) {
        const title = season.name + ': свет на кухне';
        await scene.ui.dialogue([{ who: '', text: 'Кадр выходит чуть смазанным. Зато в нём остаётся смех, который камера обычно не умеет ловить.' }]);
        MemorySystem.snapshot('evening-' + life.completedDays, title);
      } else {
        await scene.ui.dialogue([{ who: '', text: 'На балконе ничего не происходит. Воздух прохладный, окна напротив светятся. Иногда этого достаточно.' }]);
        addStat('letGo'); MemorySystem.remember('balcony-day-' + life.completedDays, 'Балкон и чужие окна');
      }

      this.advanceDay(scene);
      await scene.ui.caption('День закончился. Не важный для всех — важный для них.', 1800);
      SaveSystem.save();
      if (scene.ui) scene.ui.saveToast('Этот день сохранён');
    } finally {
      scene._livingDay = false;
      scene.unlockInput();
    }
  },

  async randomEvent(scene) {
    const life = this.ensure();
    const base = [
      { id: 'light', text: 'Вечером гаснет свет. Дом сразу становится другим — меньше, ближе, честнее.', opts: ['Зажечь свечи и накрыть на стол', 'Сходить к соседям, узнать, всё ли у них в порядке'] },
      { id: 'note', text: 'Под дверью лежит записка без подписи: «Не откладывайте хорошие слова».', opts: ['Положить её в коробку памяти', 'Улыбнуться и выбросить'] },
      { id: 'rain', text: 'Дождь начинается без предупреждения и отменяет все планы, кроме тех, что можно прожить дома.', opts: ['Заварить чай на всех', 'Написать человеку, с которым давно не говорила'] },
      { id: 'guest', text: 'В дверь звонят. Кто-то из своих оказался рядом и принёс пирог, который невозможно съесть «на минутку».', opts: ['Позвать на кухню', 'Встретить на пороге и договориться о другом дне'] },
      { id: 'keys', text: 'Тамир снова не может найти ключи. Он пытается шутить, но видно, что устал.', opts: ['Искать вместе', 'Сначала обнять, потом искать'] },
    ];
    if (scene.era === 'baby' || scene.era === 'kids') base.push({ id: 'school', text: 'Из комнаты доносится тихое: «Мам, можно с тобой поговорить?»', opts: ['Отложить всё и слушать', 'Сказать: «Через пять минут»'] });
    let pool = base.filter((e) => !life.seenEvents[e.id]);
    if (!pool.length) { life.seenEvents = {}; pool = base; }
    const event = pool[Math.floor(Math.random() * pool.length)];
    life.seenEvents[event.id] = true;
    await scene.ui.dialogue([{ who: '', text: event.text }]);
    const pick = await scene.ui.choice('Что сделать?', event.opts);
    if (event.id === 'school' && pick === 0) {
      addStat('kidsBond', 2); addStat('talk'); MemorySystem.remember('event-' + event.id + '-' + life.completedDays, 'Разговор, для которого нашлось время');
    } else if (event.id === 'note' && pick === 0) {
      addStat('houseAttach'); MemorySystem.remember('event-' + event.id + '-' + life.completedDays, 'Записка у двери');
    } else if (pick === 0) {
      addStat('habits'); adjustRelationship({ warmth: 1 }); MemorySystem.remember('event-' + event.id + '-' + life.completedDays, 'Незапланированный ' + (event.id === 'rain' ? 'дождливый вечер' : 'маленький вечер'));
    } else {
      addStat(event.id === 'school' ? 'avoid' : 'talk');
    }
  },

  advanceDay(scene) {
    const life = this.ensure();
    life.completedDays++;
    life.day++;
    life.phase = 'утро';
    if (life.day > 7) {
      life.day = 1;
      life.season = (life.season + 1) % this.seasons.length;
      if (life.season === 0) life.year++;
    }
    TamirLife.nextDay();
    TamirLife.schedule(scene);
    this.refresh(scene);
  },
};

// tiny helper: promise-based delay independent of any scene
