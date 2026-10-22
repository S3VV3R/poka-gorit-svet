class BabyScene extends HouseScene {
  constructor() { super('Baby'); }

  create() {
    GameState.chapter = 'baby';
    GameState.ageStage = 'young';
    this.houseCreate({ era: 'baby', tint: 0x28305a, tintAlpha: 0.26, ambience: 'night' });
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    this.player.setPosition( 76.82, 165.14);
    this.spawnTamir( 50.94, 165.14, 'right');
    this.marsWander = false; this.abilkaWander = false;
    if (this.mars) this.mars.sprite.setPosition( 44.47, 38.29);
    if (this.abilka) this.abilka.sprite.setPosition( 70.35, 192.57);

    // extra flavour in the bedroom / hall
    this.interactions.add( 63.88, 177.14, 30, 'прилечь на кровать', () => {
      this.ui.dialogue([{ who: '', text: 'Кровать зовёт как никогда. Но из соседней комнаты уже слышно, как кто-то тихо сопит и вот-вот решит, что ему тоже не спится.' }]);
    });
    this.interactions.add( 44.47, 41.71, 28, 'посмотреть на Марса', () => {
      this.ui.dialogue([{ who: '', text: 'Марс наблюдает с шкафа с выражением кота, которого заменили на младшую модель и не предупредили.' }]);
    });
    this.interactions.add( 70.35, 192.57, 28, 'погладить Абилку', () => {
      Audio.playPurr();
      this.ui.dialogue([{ who: '', text: 'Абилка тихо мурчит. Единственная в доме, кто не требует внимания. Из-за этого её хочется гладить ещё дольше.' }]);
    });
    this.interactions.add( 348.59, 49.43, 26, 'заглянуть в холодильник', () => {
      this.ui.dialogue([{ who: '', text: 'Полки теперь делятся на «наше» и «детское». «Детского» уже больше. Пока оно ещё не умеет есть.' }]);
    });
    this.balcDoor = this.interactions.add( 358.29, 24.57, 28, 'выйти на балкон', () => this.safeRun(() => this.balconyFamily()));
    this.balcDoor.enabled = false;

    this.cribSpot = this.interactions.add( 199.76, 93.14, 34, 'подойти к кроватке', () => this.safeRun(() => this.firstNight()));

    this.safeRun(() => this.intro());
  }

  async intro() {
    this.lockInput();
    this.ui.fadeIn(900);
    this.ui.clearQuest();
    await this.ui.caption('Девять месяцев спустя.', 2200);
    await this.ui.caption('Ночь. Два часа.', 1800);
    await this.ui.dialogue([
      { who: '', text: 'Из соседней комнаты доносится плач. Тонкий, настойчивый, абсолютно уверенный в своей правоте.' },
      { who: 'Тамир', text: 'Это... она?', mood: 'worried' },
      { who: 'Настя', text: 'Нет, это соседский телевизор. Конечно, она, Тамир.' },
      { who: 'Тамир', text: 'Я просто проверяю. Вдруг у нас теперь два ребёнка, а мы не заметили.' },
      { who: 'Настя', text: 'Иди. Нет, подожди. Идём вместе.', mood: 'worried' },
      { who: '', text: 'Первое, что Настя узнала о материнстве: сон — это не потребность. Это воспоминание.' },
    ]);
    this.unlockInput();
    this.ui.setQuest('Подойти к кроватке Беллы');
  }

  async firstNight() {
    if (!this.need('night')) return;
    this.mark('night');
    this.lockInput();
    this.ui.clearQuest();
    this.tamir.moveTo( 186.82, 96.57);
    await this.focus( 199.76, 88, CFG.ZOOM + 1);
    await this.ui.dialogue([
      { who: '', text: 'Белла красная от возмущения, крошечные кулачки сжаты. Она смотрит на них так, будто они опоздали на встречу, о которой договорились заранее.' },
      { who: 'Тамир', text: 'Она не плачет. Она... докладывает.' },
      { who: 'Настя', text: 'Что она сообщает?' },
      { who: 'Тамир', text: 'Что мы справляемся плохо.' },
      { who: 'Настя', text: 'Спасибо, что поддерживаешь.' },
    ]);
    const pick = await this.ui.choice('Белла не успокаивается. Что делаешь?', [
      'Взять на руки и качать',
      'Спеть колыбельную',
      'Передать Тамиру — пусть попробует',
      'Сесть рядом и просто дышать вместе с ней',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: '', text: 'Настя прижимает её к плечу и ходит по комнате. Плач становится тише, потом превращается в сердитое сопение.' },
        { who: 'Настя', text: 'Всё. Всё. Ты не одна. Мы здесь.' },
        { who: '', text: 'Она не уверена, что говорит это только Белле.' },
      ]);
      addStat('kidsBond');
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Баю-баюшки-баю...' },
        { who: 'Тамир', text: '...не ложися на краю.', mood: 'happy' },
        { who: 'Настя', text: 'Ты фальшивишь.' },
        { who: 'Тамир', text: 'Зато уверенно.' },
        { who: '', text: 'К третьему куплету Белла замолкает. То ли заслушалась, то ли просто сдалась. Они решают считать, что заслушалась.' },
      ]);
      addStat('kidsBond'); addStat('habits');
    } else if (pick === 2) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Держи. Голову поддерживай.' },
        { who: 'Тамир', text: 'Я держу. Я очень осторожно держу. Если что — я держу ещё осторожнее.', mood: 'worried' },
        { who: '', text: 'Он замирает, как человек, которому доверили вазу династии Мин. Белла замирает тоже — и, кажется, из уважения.' },
        { who: 'Тамир', text: 'Настя. Она на меня смотрит.' },
        { who: 'Настя', text: 'Это называется «отец».' },
      ]);
      adjustRelationship({ trust: 1 });
    } else {
      await this.ui.dialogue([
        { who: '', text: 'Настя садится на пол у кроватки. Не берёт на руки — просто кладёт ладонь рядом и дышит медленно, нарочито, вслух.' },
        { who: '', text: 'Через минуту плач стихает. Белла ловит ритм. Дышать вместе оказывается проще, чем объяснять.' },
        { who: 'Тамир', text: 'Откуда ты это знаешь?' },
        { who: 'Настя', text: 'Не знаю. Просто так показалось правильным.' },
      ]);
      adjustRelationship({ warmth: 1 });
      addStat('kidsBond');
    }
    await wait(this, 400);
    await this.ui.caption('Но через двадцать минут Белле снова что-то не нравится.', 2400);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Я попробую поменять... всё, что нужно менять.' },
      { who: 'Настя', text: 'Инструкция в телефоне. Прочти шаг первый.' },
      { who: 'Тамир', text: 'Шаг первый: «Не паниковать». Дальше загрузилось не до конца — телефон сел.' },
      { who: 'Настя', text: 'Я знала, что чем-то это закончится.' },
      { who: '', text: 'Спустя десять минут памперс надет. Спустя двенадцать — надет правильно. Спустя пятнадцать Белла окончательно решает, что ночь — это перформанс, и засыпает посреди собственного возмущения.' },
      { who: 'Тамир', text: 'Мы это сделали.' },
      { who: 'Настя', text: 'Ещё триста тысяч раз — и можно считать, что научились.' },
      { who: 'Тамир', text: 'Ты умеешь поддержать.' },
    ]);
    await this.unfocus();
    this.tamir.moveTo( 342.12, 165.14);
    this.unlockInput();
    GameState.flags.firstNightDone = true;
    SaveSystem.save();
    this.balcDoor.enabled = true;
    this.cribSpot.enabled = false;
    this.ui.setQuest('Выйти на балкон, пока она спит');
  }

  async balconyFamily() {
    if (!this.need('balcony')) return;
    this.mark('balcony');
    this.balcDoor.enabled = false;
    await this.toBalcony('young');
    Audio.startMelody();
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Помнишь, как мы здесь сидели раньше? Тихо. Без ничьих... дыханий в соседней комнате.' },
      { who: 'Настя', text: 'Помню. Тогда казалось, что устать — это когда много работы.' },
      { who: 'Тамир', text: 'А сейчас?' },
      { who: 'Настя', text: 'Сейчас я не знаю, как называется то, что со мной.' },
    ]);
    const pick = await this.ui.choice('Тамир ждёт. Что ты скажешь?', [
      'Сказать вслух: «Я боюсь, что не справлюсь»',
      'Сказать: «Всё нормально, просто устала»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Я боюсь, что не справлюсь. Что буду делать всё неправильно. Что она вырастет и вспомнит только, как я злилась, когда не могла уложить её спать.' },
        { who: 'Тамир', text: 'Она вспомнит, что ты пела.' },
        { who: 'Настя', text: 'Я не пела.' },
        { who: 'Тамир', text: 'Ты хотя бы пыталась. Для ребёнка это одно и то же.' },
        { who: '', text: 'Они сидят в тишине. Это та самая тишина, в которой уже не страшно быть уставшей.' },
      ]);
      addStat('talk'); adjustRelationship({ trust: 1, closeness: 1 });
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Всё нормально. Просто устала. Пройдёт.' },
        { who: 'Тамир', text: 'Точно?' },
        { who: 'Настя', text: 'Точно.' },
        { who: '', text: 'Тамир кивает. Он не спорит. Они сидят рядом — но между ними остаётся небольшой воздух, который никто не решился занять.' },
      ]);
      addStat('avoid');
    }
    await this.ui.dialogue([
      { who: '', text: 'Из квартиры, приглушённо, доносится знакомый возмущённый голосок.' },
      { who: 'Тамир', text: 'Моя очередь.' },
      { who: 'Настя', text: 'Была моя.' },
      { who: 'Тамир', text: 'Тогда вместе.' },
    ]);
    Audio.stopMelody();
    await this.fromBalcony();
    this.ui.clearQuest();
    await this.ui.fadeOut(700);
    await this.ui.caption('Проходит год.', 2400);
    this.safeRun(() => this.toddlerYear());
  }

  async toddlerYear() {
    // the house a year later: warmer light, toys everywhere, a toddler loose
    this.crib.setVisible(true);
    this.player.setPosition( 329.18, 165.14);
    this.player.dir = 'left';
    this.tamir.setPosition( 303.29, 148);
    this.tamir.dir = 'right';
    this.bella = this.spawnKid('bella_kid', 309.76, 169.43, 'left');
    this.bella.sprite.setScale(1);
    this.kidWander = { x: [277.41, 357.65], y: [130.86, 190.86] };
    this.marsWander = true; this.abilkaWander = true;
    await this.ui.fadeIn(800);
    await this.ui.caption('Белле год. Она хочет всё, всё сразу и немедленно.', 2600);
    this.unlockInput();
    this.ui.setQuest('Побыть с Беллой');
    this.bellaSpot = this.interactions.add( 309.76, 165.14, 34, 'позвать Беллу', () => {
      if (this.locked) return;
      this.safeRun(() => this.firstSteps());
    });
    this.photoSpot = this.interactions.add( 342.12, 186.57, 28, 'сфотографировать Беллу', () => {
      if (this.locked) return;
      if (GameState.flags.photoBella) {
        this.ui.dialogue([{ who: '', text: 'Ещё один кадр. Белла всегда выходит с высунутым языком. Настя уже перестала расстраиваться.' }]);
        return;
      }
      GameState.flags.photoBella = true;
      addStat('memories');
      SaveSystem.save();
      this.ui.caption('📷 Кадр сохранён: Белла на ковре, с мордой кота в обнимку.', 2600);
    });
  }

  storyTick() {
    if (this.bella && this.bellaSpot) { this.bellaSpot.x = this.bella.sprite.x; this.bellaSpot.y = this.bella.sprite.y; }
  }

  async firstSteps() {
    if (!this.need('steps')) return;
    this.mark('steps');
    this.lockInput();
    this.ui.clearQuest();
    this.kidWander = null;
    this.bella.target = null;
    this.bella.sprite.setPosition( 329.18, 173.71);
    this.player.setPosition( 329.18, 153.14);
    this.player.dir = 'down';
    this.tamir.setPosition( 296.82, 173.71);
    this.tamir.dir = 'right';
    await this.focus( 313, 169.43, CFG.ZOOM + 1.2);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Давай, Белла. Иди ко мне. Тут конфеты!' },
      { who: 'Настя', text: 'У нас нет конфет, ей год.' },
      { who: 'Тамир', text: 'Она этого не знает.' },
      { who: '', text: 'Белла покачивается. Разводит руки, как канатоходец над пропастью. Делает один шаг. Второй.' },
      { who: '', text: 'Третий уже не удаётся — она плюхается на ковёр и смотрит на родителей так, словно хочет убедиться: они это видели?' },
      { who: 'Настя', text: 'Она... она...' },
      { who: 'Тамир', text: 'Три шага! Я считал!' },
    ]);
    await wait(this, 400);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Мар!', mood: 'happy' },
      { who: 'Настя', text: 'Что она сказала?' },
      { who: 'Тамир', text: 'Кажется... «Мар».' },
      { who: 'Белла', text: 'Мар! Мар!', mood: 'happy' },
      { who: '', text: 'Марс, дремавший на подоконнике, лениво приоткрывает один глаз. Выражение на его морде: «Ну да. Конечно. Первым — я».' },
      { who: 'Тамир', text: 'Первое слово. И не «мама». И не «папа».' },
      { who: 'Настя', text: 'Давай не будем говорить, что мы расстроены.' },
    ]);
    const pick = await this.ui.choice('Первое слово Беллы — «Мар». Как реагируешь?', [
      'Рассмеяться — это лучшая шутка года',
      'Тихо шепнуть ей: «Мама. Скажи — мама»',
      'Сделать вид, что она сказала «мама»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Мы пересели с кошки в бабушкины книги по воспитанию — и всё равно проиграли коту.' },
        { who: 'Тамир', text: 'Обожаю его.' },
        { who: 'Настя', text: 'Кого? Кота?', mood: 'happy' },
        { who: 'Тамир', text: 'Ситуацию.' },
      ]);
      addStat('habits'); adjustRelationship({ warmth: 1 });
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ма-ма. Мааа-ма. Давай, мне ты тоже скажешь.' },
        { who: 'Белла', text: 'Мар!' },
        { who: 'Настя', text: 'Ладно. Я подожду. У меня теперь на всё есть время. Правда?' },
        { who: 'Тамир', text: 'У нас на всё есть ближайшие восемнадцать лет.' },
      ]);
      addStat('kidsBond');
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Она сказала «мама». Слышал?' },
        { who: 'Тамир', text: 'Это была «р», Настя.' },
        { who: 'Настя', text: 'А я слышала «м».' },
        { who: 'Тамир', text: 'Ладно. Запишем в книжку: «Мама». Но в дневнике — «Мар».' },
        { who: '', text: 'В детской книжке развития появляется запись, которая вроде бы и правда, и неправда. Так бывает с воспоминаниями.' },
      ]);
      adjustRelationship({ warmth: 1 });
    }
    GameState.flags.firstWordsDone = true;
    SaveSystem.save();
    await this.unfocus();
    this.kidWander = { x: [277.41, 357.65], y: [130.86, 190.86] };
    this.unlockInput();
    await wait(this, 300);
    await this.ui.caption('Ещё полгода. Белла находит карандаш и считает дом холстом.', 3000);
    this.tableSpot = this.interactions.add( 309.76, 125.71, 30, 'найти, что нарисовала Белла', () => {
      if (this.locked) return;
      this.safeRun(() => this.drawingScene());
    });
    this.ui.setQuest('Найти, что нарисовала Белла');
  }

  async drawingScene() {
    if (!this.need('drawing')) return;
    this.mark('drawing');
    this.lockInput();
    this.ui.clearQuest();
    this.interactions.remove(this.tableSpot);
    await this.ui.dialogue([
      { who: '', text: 'На столе — лист бумаги, на котором определённо что-то происходит. Под листом — полтюбика фломастера. Из-под стола торчит довольная Белла.' },
    ]);
    const cam = this.cameras.main;
    const big = this.add.image(cam.midPoint.x, cam.midPoint.y, 'kid_drawing').setScale(7).setDepth(2000);
    big.setAlpha(0);
    this.tweens.add({ targets: big, alpha: 1, duration: 500 });
    await wait(this, 700);
    await this.ui.dialogue([
      { who: 'Настя', text: 'Это... это мы?' },
      { who: 'Тамир', text: 'Вот это — ты. Ты самая высокая, у тебя на голове вихрь.' },
      { who: 'Настя', text: 'Это не вихрь. Это волосы.' },
      { who: 'Тамир', text: 'А я — вот. Квадрат с усами.' },
      { who: 'Настя', text: 'У тебя нет усов.' },
      { who: 'Тамир', text: 'Она видит меня иначе.' },
      { who: '', text: 'Рядом — рыжее пятно с ушами. Серое пятно с ушами. И совсем маленькая фигурка в углу. Подписана неровным «БЕЛА».' },
      { who: 'Настя', text: 'Марс. Абилка. И она сама — в самом низу.' },
      { who: 'Тамир', text: 'Она нарисовала всю семью. Целиком. И себя тоже посчитала.' },
      { who: '', text: 'Настя долго смотрит на рисунок. Это самая важная семейная фотография, которой у них ещё нет.' },
    ]);
    this.tweens.add({ targets: big, alpha: 0, duration: 400, onComplete: () => big.destroy() });
    await wait(this, 450);
    this.unlockInput();
    this.fridgeSpot = this.interactions.add( 348.59, 55.43, 28, 'повесить рисунок на холодильник', () => {
      if (this.locked) return;
      this.safeRun(() => this.fridgeScene());
    });
    this.ui.setQuest('Повесить рисунок на холодильник');
  }

  async fridgeScene() {
    this.lockInput();
    this.interactions.remove(this.fridgeSpot);
    this.ui.clearQuest();
    await this.ui.dialogue([
      { who: 'Настя', text: 'На холодильник. Магнитом. Чтобы видно было.' },
      { who: 'Тамир', text: 'Он там провисит лет десять.' },
      { who: 'Настя', text: 'Двадцать.' },
      { who: '', text: 'Рисунок занимает центральное место на холодильнике. Он останется там на годы — и Настя ещё не знает, как часто ей придётся смотреть на него в тишине.' },
    ]);
    this.fridgeDrawing = this.add.image( 348.59, 45.14, 'kid_drawing').setScale(0.86).setOrigin(0.5, 1).setDepth(59.71);
    GameState.flags.drawingOnFridge = true;
    addStat('memories'); addStat('habits');
    SaveSystem.save();
    this.unlockInput();
    await wait(this, 800);
    await this.ui.fadeOut(700);
    await this.ui.caption('Проходит несколько лет. Белле почти пять.', 3000);
    this.safeRun(() => this.niaScene());
  }

  async niaScene() {
    this.kidWander = null;
    this.kids.forEach((k) => k.destroy()); this.kids = [];
    this.bella = this.spawnKid('bella_kid', 170.65, 113.71, 'right');
    this.player.setPosition( 199.76, 113.71);
    this.player.dir = 'down';
    this.tamir.setPosition( 219.18, 113.71);
    this.tamir.dir = 'left';
    this.marsWander = false;
    await this.ui.fadeIn(800);
    await this.ui.caption('В кроватке — новый человек. Ния.', 2400);
    GameState.flags.niaBorn = true; SaveSystem.save();
    this.bellaTalk = this.interactions.add( 170.65, 113.71, 34, 'подойти к Белле', () => {
      if (this.locked) return;
      this.safeRun(() => this.jealousy());
    });
    this.ui.setQuest('Подойти к Белле');
    this.unlockInput();
  }

  async jealousy() {
    if (!this.need('jealous')) return;
    this.mark('jealous');
    this.interactions.remove(this.bellaTalk);
    this.lockInput();
    this.ui.clearQuest();
    this.bella.dir = 'down';
    await this.focus( 186.82, 113.71, CFG.ZOOM + 1.1);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Почему она всё время с вами?', mood: 'worried' },
      { who: 'Настя', text: 'Потому что она маленькая.' },
      { who: 'Белла', text: 'Я тоже маленькая.', mood: 'worried' },
    ]);
    const pick = await this.ui.choice('Белла смотрит и ждёт. Что скажет Настя?', [
      '«Ты уже большая»',
      '«Иди сюда. Я обниму вас обеих»',
      '«Тамир, займись Беллой — я не успеваю»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ты уже большая.' },
        { who: 'Белла', text: '...', mood: 'worried' },
        { who: 'Белла', text: 'Не хочу.', mood: 'worried' },
        { who: '', text: 'Она отворачивается к окну, и в этом «не хочу» помещается весь следующий десяток лет. Настя не сразу понимает, что услышала не каприз, а пророчество: дети всё равно будут расти, даже если родители не готовы.' },
      ]);
      addStat('letGo');
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Иди сюда. Обеих. Ничего, что я одна, а вас двое. Рук хватит.' },
        { who: 'Белла', text: 'А ей можно будет мои игрушки?', mood: 'happy' },
        { who: 'Настя', text: 'Нет. Но смотреть можно.' },
        { who: 'Белла', text: 'Ладно. Только на моём ковре.', mood: 'happy' },
        { who: '', text: 'Белла забирается на колени — осторожно, как ревнивый ёжик. Ния спит и не знает, что её только что поделили.' },
      ]);
      addStat('kidsBond'); addStat('kidsBond');
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Тамир, займись Беллой. Я с ней не успеваю.' },
        { who: 'Тамир', text: 'Белла, пойдём собирать конструктор?' },
        { who: 'Белла', text: 'Не хочу собирать. Хочу, чтобы мама пошла.', mood: 'worried' },
        { who: '', text: 'Тамир уводит её в соседнюю комнату. Настя остаётся над кроваткой. Ей вдруг кажется, что кто-то только что закрыл маленькую дверь. Не навсегда. Но тихо.' },
      ]);
      addStat('avoid');
    }
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Знаешь, о чём я подумал?' },
      { who: 'Настя', text: 'О том, что у нас теперь двое?' },
      { who: 'Тамир', text: 'О том, что нам придётся купить машину побольше. И холодильник.' },
      { who: 'Настя', text: 'Романтик.' },
    ]);
    await this.unfocus();
    this.endChapter(4, 'Белла и Ния', 'Первая ночь • Рисунок на холодильнике • Две сестры',
      'kids', 'Kids', 'chapter4Complete', 'Дом больше никогда не будет тихим.');
  }
}


/* =====================================================================
   ГЛАВА 5 — «Дом, полный голосов»
   Хаос • Школа • Подростки • Ссора с Беллой • Ссора родителей • Выпускной
   ===================================================================== */
