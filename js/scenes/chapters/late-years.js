class LateYearsScene extends HouseScene {
  constructor() { super('LateYears'); }

  create() {
    GameState.chapter = 'lateyears';
    GameState.ageStage = 'old';
    this.houseCreate({ era: 'empty', tint: 0xffe0a8, tintAlpha: 0.12, ambience: 'home' });
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');
    // cats are gone by now (if the player skipped here via chapter select)
    [this.mars, this.abilka].forEach((c) => { if (c) { c.destroy(); this.cats = this.cats.filter((x) => x !== c); } });
    this.mars = null; this.abilka = null;
    this.player.setPosition( 296.82, 148); this.player.dir = 'down';
    this.spawnTamir( 329.18, 98.29, 'down');
    this.memories = 0;
    this.safeRun(() => this.intro());
  }

  async intro() {
    this.lockInput();
    this.ui.fadeIn(900);
    await this.ui.caption('Последние годы замедляются.', 2600);
    await this.ui.caption('Меньше работы. Меньше людей вокруг. Больше времени.', 3000);
    await this.ui.dialogue([
      { who: '', text: 'Дом тот же. Но в нём теперь можно услышать, как тикают часы, как шумит холодильник и как два человека дышат в разных комнатах — привычно, ровно.' },
      { who: 'Тамир', text: 'Чай будешь?' },
      { who: 'Настя', text: 'Буду. Только не крепкий.' },
      { who: 'Тамир', text: 'Мы это уже обсуждали сорок лет назад.' },
      { who: 'Настя', text: 'И я до сих пор права.' },
    ]);
    this.unlockInput();
    this.ui.setQuest('Разобрать память дома (0/5)');
    this.setupMemories();
  }

  bump() {
    this.memories++;
    addStat('memories');
    if (this.memories >= 5) {
      this.ui.setQuest('Выйти на балкон');
      this.balcDoor.enabled = true;
    } else {
      this.ui.setQuest(`Разобрать память дома (${this.memories}/5)`);
    }
  }

  setupMemories() {
    const F = GameState.flags;
    this.balcDoor = this.interactions.add( 358.29, 24.57, 28, 'выйти на балкон', () => this.safeRun(() => this.lastBalcony()));
    this.balcDoor.enabled = false;

    // 1. Куртка Тамира
    this.interactions.add( 44.47, 43.43, 30, 'открыть старый шкаф', () => {
      if (!this.need('jacket')) { this.ui.dialogue([{ who: '', text: 'На вешалке всё ещё висит куртка. Тамир утверждает, что носит её «только по праздникам». Праздников, видимо, много.' }]); return; }
      this.mark('jacket');
      this.safeRun(async () => {
        this.lockInput();
        this.tamir.setPosition( 63.88, 70.86); this.tamir.dir = 'left';
        await this.focus( 54.18, 62.29, CFG.ZOOM + 1.1);
        await this.ui.dialogue([
          { who: '', text: 'За новыми пальто — старая куртка. Пахнет пылью, табаком, которого в доме не было двадцать лет, и вечерней улицей.' },
          { who: 'Тамир', text: 'Эта куртка?' },
          { who: 'Настя', text: 'Твоя. Ты был в ней в тот вечер. Стоял и делал вид, что просто гуляешь.' },
          { who: 'Тамир', text: 'Я правда гулял.' },
          { who: 'Настя', text: 'Ты всегда так провожаешь людей?' },
          { who: 'Тамир', text: 'Как?' },
          { who: 'Настя', text: 'Ага.', mood: 'happy' },
          { who: 'Тамир', text: 'Ты запомнила.', mood: 'happy' },
          { who: 'Настя', text: 'Конечно, запомнила. Это же было начало.' },
        ]);
        await this.unfocus();
        this.tamir.moveTo( 329.18, 98.29);
        this.unlockInput();
        this.bump();
      });
    });

    // 2. Коробка памяти
    this.interactions.add( 199.76, 103.43, 30, 'открыть коробку с памятью', () => {
      if (!this.need('box')) { this.ui.dialogue([{ who: '', text: 'Коробка уже стоит открытой. Каждый раз находится что-то новое — не потому что там много предметов, а потому что мы сами меняемся.' }]); return; }
      this.mark('box');
      this.safeRun(async () => {
        this.lockInput();
        await this.focus( 199.76, 100.86, CFG.ZOOM + 1.2);
        const lines = [{ who: '', text: 'Внутри — вещи, которые никому не нужны и без которых нельзя.' }];
        lines.push({ who: '', text: 'Билет с первой поездки. Он выцвел, но дата читается. Тамир тогда сказал: «Сейчас примерно представляю». Они до сих пор не знают, где именно были.' });
        if (F.shardKept) lines.push({ who: '', text: 'Осколок синей кружки. Острый край давно сгладился — как будто время делало вид, что это не больно.' });
        if (F.keptMarsToy) lines.push({ who: '', text: 'Мышь Марса, перетёртая до пуха. Он таскал её по дому, как трофей.' });
        lines.push({ who: '', text: 'Игрушка Нии — крошечный жираф без одного уха. Ния всегда была тихой и всегда выбирала странных зверей.' });
        lines.push({ who: '', text: 'Первое кольцо. Простое, чуть кривое. Тамир выбирал его так долго, что продавщица успела выпить два чая.' });
        if (F.photoBella) lines.push({ who: '', text: 'Фотография: Белла на ковре, с Марсом в обнимку. На обороте — рука Насти: «Первое слово: Мар».' });
        else lines.push({ who: '', text: 'Фотографии Беллы-малышки почти нет. Настя тогда слишком старалась жить, чтобы успевать снимать. Теперь это чувствуется.' });
        lines.push({ who: 'Настя', text: 'Каждая вещь тут — маленькая дверь в другой день.' });
        await this.ui.dialogue(lines);
        await this.unfocus();
        this.unlockInput();
        this.bump();
      });
    });

    // 3. Стена с фотографиями
    this.interactions.add( 357.65, 40, 30, 'посмотреть на фотографии', () => {
      if (!this.need('wall')) { this.ui.dialogue([{ who: '', text: 'Фотографии на стене. Свадьба, пикник, выпускной, чей-то первый зуб. Это не коллекция — это маршрут.' }]); return; }
      this.mark('wall');
      this.safeRun(async () => {
        this.lockInput();
        await this.focus( 357.65, 49.43, CFG.ZOOM + 1.3);
        const lines = [
          { who: 'Тамир', text: 'Свадьба. Ты тут смеёшься — потому что я споткнулся.' },
          { who: 'Настя', text: 'Я смеялась, потому что ты не споткнулся. Ты притворился, чтобы я перестала волноваться.' },
          { who: 'Тамир', text: '...Я надеялся, что ты не заметила.' },
          { who: 'Настя', text: 'Я всё замечаю. Просто не всегда говорю.' },
        ];
        if (F.photoAbilka === 'wall') lines.push({ who: '', text: 'Рядом — Абилка на батарее. Серая тень в углу кадра, всегда чуть в стороне и всегда рядом.' });
        if (F.photoMars === 'frame') lines.push({ who: '', text: 'А в рамке — Марс на новом диване. Недовольный и абсолютно счастливый.' });
        lines.push({ who: 'Настя', text: 'Мы так много сделали, что не успели сфотографировать.' });
        lines.push({ who: 'Тамир', text: 'Это нормально. Зато помним мы.' });
        await this.ui.dialogue(lines);
        await this.unfocus();
        this.unlockInput();
        this.bump();
      });
    });

    // 4. Рисунок на холодильнике
    this.interactions.add( 348.59, 49.43, 28, 'рассмотреть рисунок на холодильнике', () => {
      if (!this.need('draw')) { this.ui.dialogue([{ who: '', text: 'Рисунок так и висит. Он пережил три ремонта, два холодильника и бесчисленные попытки убрать его «хоть немного подальше от света».' }]); return; }
      this.mark('draw');
      this.safeRun(async () => {
        this.lockInput();
        await this.focus( 348.59, 53.71, CFG.ZOOM + 1.3);
        const cam = this.cameras.main;
        const big = this.add.image(cam.midPoint.x, cam.midPoint.y, 'kid_drawing').setScale(7).setDepth(2000);
        await this.ui.dialogue([
          { who: '', text: 'Фломастер почти выцвел. «БЕЛА» читается едва-едва. Квадрат с усами, женщина с вихрем, огурец-кот и маленькая фигурка в углу, которая теперь где-то далеко и взрослая.' },
          { who: 'Настя', text: 'Я думала, он провисит десять лет.' },
          { who: 'Тамир', text: 'Я говорил — двадцать.' },
          { who: 'Настя', text: 'Тридцать.' },
        ]);
        const pick = await this.ui.choice('Что делать с рисунком?', ['Оставить на холодильнике, где он висит', 'Отправить Белле — пусть он будет у неё']);
        if (pick === 0) {
          await this.ui.dialogue([{ who: 'Настя', text: 'Пусть остаётся. Это не рисунок. Это место, где мы все собираемся.' }]);
          addStat('houseAttach');
        } else {
          await this.ui.dialogue([{ who: 'Настя', text: 'Пусть едет к ней. Теперь у неё свой холодильник. И своя семья, которой понадобится первое напоминание о том, как всё начинается.' }]);
          addStat('letGo');
        }
        big.destroy();
        await this.unfocus();
        this.unlockInput();
        this.bump();
      });
    });

    // 5. Чай и старые фильмы
    this.interactions.add( 296.82, 49.43, 30, 'заварить чай и включить старый фильм', () => {
      if (!this.need('tea')) { this.ui.dialogue([{ who: '', text: 'Чайник тихо шумит. Они давно не торопятся — теперь даже чайник уложился в их темп.' }]); return; }
      this.mark('tea');
      this.safeRun(async () => {
        this.lockInput();
        this.tamir.setPosition( 309.76, 130.86); this.tamir.dir = 'left';
        this.player.setPosition( 296.82, 70.86); this.player.dir = 'down';
        await this.focus( 306.53, 100.86, CFG.ZOOM + 1);
        await this.ui.dialogue([
          { who: 'Тамир', text: 'Тот самый фильм?' },
          { who: 'Настя', text: 'Тот самый.' },
          { who: '', text: 'Фильм идёт, и они оба знают каждую сцену наизусть. Это не скучно. Это как перечитывать любимую книгу: ради не сюжета — ради того, что тогда, в первый раз, вы смотрели вместе.' },
          { who: 'Тамир', text: 'Мы всё-таки дожили.' },
          { who: 'Настя', text: 'До чего?' },
          { who: 'Тамир', text: 'До всего.', mood: 'happy' },
        ]);
        const pick = await this.ui.choice('Тихий вечер. Сказать что-то важное — или просто посидеть?', ['Сказать: «Спасибо, что остался»', 'Просто сидеть рядом и смотреть дальше']);
        if (pick === 0) {
          await this.ui.dialogue([{ who: 'Настя', text: 'Спасибо, что остался. Во все те дни, когда можно было уйти.' }, { who: 'Тамир', text: 'Я не оставался. Я просто не хотел никуда уходить.' }]);
          addStat('talk'); adjustRelationship({ warmth: 1, trust: 1 });
        } else {
          await this.ui.dialogue([{ who: '', text: 'Они сидят. Молча. Иногда это и есть самый честный разговор.' }]);
          addStat('habits');
        }
        await this.unfocus();
        this.tamir.moveTo( 329.18, 98.29);
        this.unlockInput();
        this.bump();
      });
    });
  }

  async lastBalcony() {
    if (!this.need('balcony')) return;
    this.mark('balcony');
    this.balcDoor.enabled = false;
    this.ui.clearQuest();
    await this.toBalcony('old');
    Audio.startMelody();
    await this.ui.caption('Они долго сидят молча.', 3200);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Помнишь первый раз, когда мы здесь сидели?' },
      { who: 'Настя', text: 'Конечно.' },
      { who: 'Тамир', text: 'Я тогда думал, что всё самое интересное ещё впереди.' },
      { who: 'Настя', text: 'А оно было?' },
      { who: '', text: 'Он улыбается — медленно, так, как улыбаются только те, кому не надо торопиться.' },
      { who: 'Тамир', text: 'Было.', mood: 'happy' },
    ]);
    const s = GameState.stats;
    const pick = await this.ui.choice('Последняя фраза на балконе принадлежит тебе.', [
      'Сказать то, что давно хотела сказать',
      'Взять его за руку — без слов',
      '«Потом договорим»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Я не всегда говорила, как мне было страшно. И как хорошо с тобой. Мне казалось, ты и так знаешь.' },
        { who: 'Тамир', text: 'Я знал. Но слышать приятнее.' },
        { who: 'Настя', text: 'Тогда слушай: мне было хорошо. Всю жизнь. Даже в плохие дни.' },
      ]);
      addStat('talk', 2); adjustRelationship({ trust: 1, closeness: 1, warmth: 1 });
    } else if (pick === 1) {
      await this.ui.dialogue([{ who: '', text: 'Его ладонь тёплая и чуть шершавая — как всегда. Он не удивляется. Просто сжимает в ответ, и дальше они сидят, глядя на огни чужих окон.' }]);
      addStat('habits'); adjustRelationship({ warmth: 1 });
    } else {
      await this.ui.dialogue([{ who: 'Настя', text: 'Потом договорим.' }, { who: 'Тамир', text: 'Потом.' }, { who: '', text: 'Слово «потом» опускается на балкон мягко, как пыль. Они оба знают, что у некоторых «потом» срок годности короче, чем кажется.' }]);
      addStat('avoid');
    }
    Audio.stopMelody();
    GameState.flags.lastBalcony = true;
    GameState.chapter = 'ending';
    SaveSystem.save();
    await wait(this, 1000);
    await this.ui.fadeOut(1200);
    this.ui.clearQuest();
    Audio.stopAmbience(1.0);
    this.scene.start('Ending', { id: computeEnding() });
  }
}


/* =====================================================================
   КОНЦОВКИ — восемь способов закончить одну и ту же жизнь
   ===================================================================== */
