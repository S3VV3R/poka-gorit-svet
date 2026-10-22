class KidsScene extends HouseScene {
  constructor() { super('Kids'); }

  create() {
    GameState.chapter = 'kids';
    GameState.ageStage = 'young';
    this.houseCreate({ era: 'kids', tint: 0xffe4b8, tintAlpha: 0.08, ambience: 'home' });
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');
    this.add.image( 309.76, 124, 'mug_blue').setScale(0.86).setOrigin(0.5, 1).setDepth(131.71);
    this.player.setPosition( 76.82, 165.14);
    this.spawnTamir( 309.76, 83.71, 'down');
    this.bella = this.spawnKid('bella_kid', 180.35, 156.57, 'right');
    this.nia = this.spawnKid('nia_kid', 232.12, 165.14, 'left');
    this.kidWander = { x: [144.76, 251.53], y: [113.71, 186.57] };
    this.hallFlavour();
    this.safeRun(() => this.morning());
  }

  // flavour interactions that exist throughout the chapter
  hallFlavour() {
    this.interactions.add( 170.65, 163.43, 24, 'наступить на игрушку', () => {
      Audio.playBlip(880);
      this.ui.dialogue([{ who: '', text: 'ПИ-И-И-ИК. Из-под ноги раздаётся нечто среднее между игрушкой и сиреной. Из соседней комнаты доносится одобрительный смех.' }]);
    });
    this.interactions.add( 348.59, 49.43, 28, 'рассмотреть рисунок на холодильнике', () => {
      this.ui.dialogue([{ who: '', text: 'Рисунок Беллы всё ещё здесь. Рядом уже налеплены три новых — они не такие аккуратные, зато больше. Холодильник превращается в галерею.' }]);
    });
    this.interactions.add( 351.82, 168.57, 28, 'сесть на диван', () => {
      this.ui.dialogue([{ who: '', text: 'На диване — гора детских курток и одно одеяло с пятном от сока. Занять место не удаётся. Зато видно, что в доме идёт жизнь.' }]);
    });
    this.interactions.add( 44.47, 41.71, 28, 'посмотреть на Марса', () => {
      this.ui.dialogue([{ who: '', text: 'Марс на шкафу. Сверху видно всё, что происходит в доме. Выглядит так, будто он всё это придумал.' }]);
    });
    this.interactions.add( 70.35, 192.57, 28, 'погладить Абилку', () => {
      Audio.playPurr();
      this.ui.dialogue([{ who: '', text: 'Абилка уютно устроилась на колене и даже не просит ничего. Редкая семейная миротворица.' }]);
    });
    this.balcDoor = this.interactions.add( 358.29, 24.57, 28, 'выйти на балкон', () => {
      this.ui.dialogue([{ who: '', text: 'Балкон никуда не делся. Но сейчас там сушатся три рюкзака и чья-то куртка. Тишины здесь не будет до вечера.' }]);
    });
  }

  // ---------------- A. утро вторника
  async morning() {
    this.lockInput();
    this.ui.fadeIn(800);
    await this.ui.caption('Белле шесть. Нии два. Утро вторника.', 2600);
    await this.ui.dialogue([
      { who: '', text: 'Утро в доме — как репетиция оркестра, где все играют разные произведения и никто не хочет слушать дирижёра.' },
      { who: 'Тамир', text: 'Я опаздываю на работу!' },
      { who: 'Белла', text: 'Мама, где мой левый носок?', mood: 'worried' },
      { who: 'Ния', text: 'Ка-ша!', mood: 'happy' },
      { who: 'Настя', text: 'Все живы?' },
      { who: 'Тамир', text: 'Пока да.' },
    ]);
    this.unlockInput();
    this.ui.setQuest('Собраться на утро (0/3)');
    this.chores = 0;
    const doneOne = (txt) => {
      this.chores++;
      if (this.chores >= 3) {
        this.ui.setQuest('Проводить Беллу в школу');
        this.safeRun(() => this.schoolDoor());
      } else {
        this.ui.setQuest(`Собраться на утро (${this.chores}/3)`);
      }
    };
    this.interactions.add( 296.82, 49.43, 26, 'приготовить завтрак', () => {
      if (!this.need('b1')) return;
      this.mark('b1');
      this.safeRun(async () => {
        this.lockInput();
        const pick = await this.ui.choice('Что на завтрак?', ['Каша', 'Бутерброды с чаем', 'Блинчики — «просто так»']);
        if (pick === 0) {
          await this.ui.dialogue([{ who: 'Ния', text: 'Ка-ша! Не хочу.' }, { who: 'Настя', text: 'Парадокс. Ты три минуты кричала за кашу.' }, { who: 'Ния', text: 'Это было ДО каши.' }]);
        } else if (pick === 1) {
          await this.ui.dialogue([{ who: 'Белла', text: 'Мам, на бутерброде кусочек лука!', mood: 'worried' }, { who: 'Настя', text: 'Это укроп.' }, { who: 'Белла', text: 'Тогда он страшнее.' }]);
        } else {
          await this.ui.dialogue([{ who: 'Тамир', text: 'Блинчики во вторник?' }, { who: 'Настя', text: 'Если вторник начинается так, лучше сделать его хорошим самим.' }, { who: '', text: 'Дети съедают всё за две минуты. Это, пожалуй, лучший отзыв из возможных.' }]);
          addStat('habits');
        }
        this.unlockInput();
        doneOne();
      });
    });
    this.interactions.add( 190.06, 108.57, 26, 'собрать рюкзак Беллы', () => {
      if (!this.need('b2')) return;
      this.mark('b2');
      this.safeRun(async () => {
        this.lockInput();
        await this.ui.dialogue([
          { who: 'Настя', text: 'Пенал, тетрадь, яблоко... А это что?' },
          { who: 'Белла', text: 'Это мой друг. Он едет со мной.', mood: 'happy' },
          { who: '', text: 'Из рюкзака выглядывает плюшевая мышь, три фантика и одна записка: «Не открывать до вечера».' },
          { who: 'Настя', text: 'Мышь можно. Записка — твои дела.' },
          { who: 'Белла', text: 'Спасибо!', mood: 'happy' },
        ]);
        this.unlockInput();
        doneOne();
      });
    });
    this.niaSpot = this.interactions.add( 232.12, 165.14, 34, 'одеть Нию', () => {
      if (!this.need('b3')) return;
      this.mark('b3');
      this.safeRun(async () => {
        this.lockInput();
        await this.ui.dialogue([
          { who: 'Настя', text: 'Платьице, колготки, ботинки...' },
          { who: 'Ния', text: 'Я сама!', mood: 'happy' },
          { who: '', text: 'Через две минуты Ния стоит в платье задом наперёд, колготках на одной ноге и с тапком на голове. Настя решает, что это стиль, а не неудача.' },
          { who: 'Настя', text: 'Отлично. Теперь ты готова.' },
          { who: 'Ния', text: 'Я знаю!', mood: 'happy' },
        ]);
        this.unlockInput();
        doneOne();
      });
    });
  }

  storyTick() {
    if (this.niaSpot && this.nia) { this.niaSpot.x = this.nia.sprite.x; this.niaSpot.y = this.nia.sprite.y; }
  }

  async schoolDoor() {
    await wait(this, 300);
    this.lockInput();
    this.kidWander = null;
    this.bella.target = null; this.nia.target = null;
    this.bella.sprite.setPosition( 355.06, 113.71);
    this.nia.sprite.setPosition( 329.18, 113.71);
    this.player.setPosition( 342.12, 94.86);
    this.player.dir = 'down';
    this.tamir.setPosition( 316.24, 94.86);
    await this.focus( 342.12, 109.43, CFG.ZOOM + 1);
    this.bella.dir = 'up';
    await this.ui.dialogue([
      { who: 'Белла', text: 'Мам... а если со мной никто не будет дружить?', mood: 'worried' },
      { who: 'Тамир', text: 'Все будут дружить. Ты же рисуешь.', mood: 'happy' },
      { who: 'Белла', text: 'Это не считается. Там все умеют быстро бегать.', mood: 'worried' },
    ]);
    const pick = await this.ui.choice('Белла боится первого дня в школе. Как поведёшь себя?', [
      'Давить: «Соберись. Все идут — и ты пойдёшь»',
      'Поддержать: «Я буду думать о тебе весь день»',
      'Вмешаться: «Я зайду и поговорю с учительницей»',
      'Позволить ошибаться: «Может, будет страшно. Но ты справишься сама»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Соберись. Все идут — и ты пойдёшь.' },
        { who: 'Белла', text: 'Ладно.', mood: 'worried' },
        { who: '', text: 'Белла кивает быстро, слишком быстро — как человек, который понял, что спорить бессмысленно. Настя чувствует: что-то только что произошло. Что-то маленькое и закрытое.' },
      ]);
      GameState.flags.schoolChoice = 'push';
      addStat('avoid'); addStat('kidsBond', -1);
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Я буду думать о тебе весь день. Хочешь, расскажешь вечером, что там было — и хорошее, и страшное.' },
        { who: 'Белла', text: 'А если страшное — вообще всё?', mood: 'worried' },
        { who: 'Настя', text: 'Тогда мы вместе придумаем, как сделать из него хотя бы смешное.' },
        { who: 'Белла', text: 'Хорошо.', mood: 'happy' },
      ]);
      GameState.flags.schoolChoice = 'support';
      addStat('kidsBond', 2); addStat('talk');
    } else if (pick === 2) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Я зайду с тобой. Скажу, что ты волнуешься. Пусть учительница посадит тебя рядом с кем-то добрым.' },
        { who: 'Белла', text: 'Мам, только не при всех.', mood: 'worried' },
        { who: 'Тамир', text: 'Настя... ей нужно пройти этот коридор самой.' },
        { who: 'Настя', text: 'Я знаю. Но мне сложно.' },
      ]);
      GameState.flags.schoolChoice = 'intervene';
      addStat('letGo', -1);
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Может быть, будет страшно. Может быть, ты выберешь не ту парту и не тех друзей. Но ты справишься сама. А дома мы будем ждать.' },
        { who: 'Белла', text: 'А если нет?', mood: 'worried' },
        { who: 'Настя', text: 'Тогда придёшь и расскажешь. Это тоже нормально.' },
        { who: '', text: 'Белла выдыхает так, словно ей разрешили не быть идеальной. Ей шесть, и она, кажется, это поняла лучше многих взрослых.' },
      ]);
      GameState.flags.schoolChoice = 'free';
      addStat('letGo', 2); addStat('kidsBond');
    }
    await this.ui.dialogue([
      { who: '', text: 'Белла шагает к двери. Оборачивается. Машет. И через секунду исчезает в утре — как будто её и не было.' },
      { who: 'Настя', text: 'Они уходят слишком быстро.' },
      { who: 'Тамир', text: 'Сегодня — только до школы.' },
      { who: 'Настя', text: 'Ага. Пока.' },
    ]);
    await this.unfocus();
    SaveSystem.save();
    await this.ui.fadeOut(800);
    await this.ui.caption('Проходят годы. Они складываются в учебные четверти, дни рождения и разбитые чашки.', 3200);
    this.safeRun(() => this.teenYears());
  }

  // ---------------- B. подростки
  async teenYears() {
    this.setStage('mid');
    this.kids.forEach((k) => k.destroy()); this.kids = [];
    this.kidWander = null;
    this.interactions.clear();
    this.hallFlavour();
    this.add.image( 309.76, 124, 'mug_blue').setScale(0.86).setOrigin(0.5, 1).setDepth(131.71);
    this.bella = this.spawnKid('bella_teen', 180.35, 165.14, 'down');
    this.nia = this.spawnKid('nia_kid', 232.12, 130.86, 'left');
    this.nia.sprite.setScale(1.15);
    this.player.setPosition( 76.82, 165.14);
    this.tamir.setPosition( 309.76, 88);
    this.tamir.dir = 'down';
    await this.ui.fadeIn(900);
    await this.ui.caption('Белле пятнадцать. Нии одиннадцать. В доме появились двери, и их теперь закрывают.', 3400);
    this.unlockInput();
    this.ui.setQuest('Заглянуть к Белле');
    this.interactions.add( 149.29, 112, 28, 'постучать в комнату Беллы', () => {
      if (!this.need('knock')) return;
      this.mark('knock');
      this.safeRun(() => this.knockScene());
    });
  }

  async knockScene() {
    this.lockInput();
    this.ui.clearQuest();
    await this.ui.dialogue([
      { who: 'Настя', text: 'Белла? Можно войти?' },
      { who: 'Белла', text: 'Я занята!', mood: 'worried' },
      { who: 'Настя', text: 'Просто хочу узнать, как дела.' },
      { who: 'Белла', text: 'Нормально!', mood: 'worried' },
      { who: '', text: 'Из-за двери доносится что-то, подозрительно похожее на музыку, на которую никто никогда не просил разрешения. И один тихий звук, будто кто-то поспешно прячет телефон.' },
    ]);
    const pick = await this.ui.choice('За дверью что-то происходит. Как поступить?', [
      'Постоять и подождать — вдруг сама откроет',
      'Оставить записку: «Люблю тебя. Ужин в семь»',
      'Нажать на ручку — «я же мама»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([{ who: '', text: 'Настя стоит. Минута. Две. Дверь так и не открывается. Но когда Настя уходит, она слышит позади тихий скрип. Не слово, не шаг — только скрип. И этого достаточно, чтобы понять: Белла знает, что она ждала.' }]);
      addStat('kidsBond'); addStat('letGo');
    } else if (pick === 1) {
      await this.ui.dialogue([{ who: '', text: 'Записка исчезает под дверью. Через минуту из-под неё появляется ответ: смайлик с высунутым языком. Настя улыбается. Это не диалог. Но это не стена.' }]);
      addStat('kidsBond'); addStat('talk');
    } else {
      await this.ui.dialogue([
        { who: 'Белла', text: 'МАМА! СТУЧАТЬ НАДО!', mood: 'worried' },
        { who: 'Настя', text: 'Я стучала.' },
        { who: 'Белла', text: 'А ждать — не надо?!', mood: 'worried' },
        { who: '', text: 'Настя отходит от двери. Нет ничего хуже, чем знать, что ты права, — и чувствовать, что проиграла.' },
      ]);
      addStat('kidsBond', -1);
    }
    this.unlockInput();
    this.ui.setQuest('Позвать всех на ужин');
    this.interactions.add( 309.76, 127.43, 30, 'накрыть ужин', () => {
      if (!this.need('dinner')) return;
      this.mark('dinner');
      this.safeRun(() => this.dinnerScene());
    });
  }

  async dinnerScene() {
    this.lockInput();
    this.ui.clearQuest();
    this.player.setPosition( 296.82, 143.71); this.player.dir = 'right';
    this.tamir.setPosition( 322.71, 143.71); this.tamir.dir = 'left';
    this.bella.sprite.setPosition( 309.76, 152.29); this.nia.sprite.setPosition( 309.76, 109.43);
    await this.focus( 309.76, 130.86, CFG.ZOOM + 1);
    await this.ui.dialogue([
      { who: '', text: 'Раньше ужин был событием. Все садились, говорили одновременно, спорили, кто получил больше картошки. Теперь...' },
      { who: 'Белла', text: 'Я не голодная.', mood: 'neutral' },
      { who: 'Ния', text: '(в наушниках) Что?' },
      { who: 'Настя', text: 'Я говорю — ужинаем.' },
      { who: 'Ния', text: 'Я могу взять в комнату?' },
      { who: 'Настя', text: 'Мы же всегда...' },
      { who: 'Белла', text: 'Мам, у нас контрольная завтра. Пожалуйста.', mood: 'worried' },
    ]);
    await wait(this, 400);
    this.bella.moveTo( 167.41, 165.14); this.nia.moveTo( 232.12, 130.86);
    await this.ui.caption('Тарелки уходят из кухни быстрее, чем были наполнены.', 2600);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Ты заметила? Мы теперь сидим друг напротив друга.' },
      { who: 'Настя', text: 'Нас стало двое за столом на шесть мест.' },
      { who: 'Тамир', text: 'Они не нуждаются в нас так, как раньше.' },
      { who: 'Настя', text: 'Это хорошо. И больно.' },
      { who: 'Тамир', text: 'Одновременно?' },
      { who: 'Настя', text: 'Каждую минуту.' },
    ]);
    await this.unfocus();
    this.unlockInput();
    this.quarrelTrigger = true;
    this.ui.setQuest('Помыть посуду');
    this.interactions.add( 296.82, 49.43, 28, 'помыть посуду', () => {
      if (!this.need('wash1')) return;
      this.mark('wash1');
      this.safeRun(() => this.quarrelBella());
    });
  }

  // ---------------- C. ссора с Беллой (первая большая)
  async quarrelBella() {
    this.lockInput();
    this.ui.clearQuest();
    this.bella.sprite.setPosition( 199.76, 152.29);
    this.bella.dir = 'right';
    this.bella.moveTo( 300.06, 105.14);
    await wait(this, 900);
    await this.focus( 300.06, 88, CFG.ZOOM + 1);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Мам, мне нужно поговорить.', mood: 'worried' },
      { who: 'Настя', text: 'Слушаю.' },
      { who: 'Белла', text: 'Я хочу записаться на рисование. В студию. По вечерам. Три раза в неделю.' },
      { who: 'Настя', text: 'Три раза в неделю? А как же учёба? Тебе поступать через два года.' },
      { who: 'Белла', text: 'Вот именно! Поступать. На дизайн. Я хочу — на дизайн.' },
      { who: 'Настя', text: 'Дизайн — это красиво, но надёжнее была бы...' },
      { who: 'Белла', text: 'Ты вообще меня не понимаешь.', mood: 'worried' },
    ]);
    const pick = await this.ui.choice('Белла говорит громче. Настя отвечает...', [
      '«Я пытаюсь понять, правда»',
      '«Ты ещё ребёнок, ты не знаешь, что хочешь»',
      '«Давай поговорим, когда остынешь»',
    ]);
    let tone = 0;
    if (pick === 0) { tone = 1; addStat('talk'); }
    else if (pick === 1) { tone = -1; addStat('kidsBond', -1); }
    else { tone = 0; addStat('avoid'); }
    await this.ui.dialogue([
      { who: 'Настя', text: ['Я пытаюсь.', 'Ты ещё ребёнок.', 'Давай обсудим это спокойно.'][pick] },
      { who: 'Белла', text: 'Нет! Ты просто хочешь, чтобы я была такой, какой тебе удобно!', mood: 'worried' },
      { who: '', text: 'Белла уходит. Не бегом, не хлопая дверью — просто быстро, и от этого ещё больнее.' },
    ]);
    this.bella.moveTo( 167.41, 165.14);
    await wait(this, 600);
    await this.ui.dialogue([
      { who: '', text: 'Настя остаётся на кухне с мокрой тарелкой в руке. Из вентиляции пахнет жареным луком и чужой обидой.' },
    ]);
    const after = await this.ui.choice('Что дальше?', [
      'Пойти за Беллой прямо сейчас',
      'Дать ей остыть — но не забыть вернуться',
      'Сказать себе «потом поговорим»',
    ]);
    if (after === 0) {
      await this.ui.dialogue([
        { who: '', text: 'Настя подходит к закрытой двери. Тихо опускается на пол у стены.' },
        { who: 'Настя', text: 'Я не буду заходить. Я просто здесь. Мне жаль, что получилось так.' },
        { who: '', text: 'Через минуту дверь приоткрывается на ладонь. Этого достаточно.' },
      ]);
      addStat('kidsBond'); addStat('talk');
    } else if (after === 1) {
      await this.ui.dialogue([{ who: '', text: 'Настя кивает самой себе. Это не победа и не поражение. Это пауза. Они обе знают, что она закончится.' }]);
      addStat('letGo');
    } else {
      await this.ui.dialogue([{ who: '', text: 'Слово «потом» повисает в коридоре, как пыль в луче света. Настя ещё не знает, как много раз оно повторится.' }]);
      addStat('avoid');
    }
    GameState.flags.quarrelBella = true;
    SaveSystem.save();
    this.tamir.moveTo( 283.88, 96.57);
    await wait(this, 800);
    await this.ui.dialogue([
      { who: 'Настя', text: 'Я всё испортила.', mood: 'worried' },
      { who: 'Тамир', text: 'Может быть.' },
      { who: '', text: 'Пауза. Настя смотрит на него — не обиженно, а с каким-то странным облегчением.' },
      { who: 'Настя', text: 'Спасибо.' },
      { who: 'Тамир', text: 'За что?' },
      { who: 'Настя', text: 'За то, что не сказал «нет».', mood: 'happy' },
      { who: 'Тамир', text: 'Нельзя же всё время говорить «нет». Иногда тебе нужно, чтобы кто-то сказал: «Да, было больно. И ты всё ещё хорошая мать».' },
      { who: 'Настя', text: 'Я хорошая?' },
      { who: 'Тамир', text: 'Ты стоишь здесь и переживаешь. Плохие так не делают.' },
    ]);
    adjustRelationship({ trust: 1, closeness: 1 });
    await this.unfocus();
    this.unlockInput();
    this.ui.setQuest('Закончить уборку на кухне');
    this.interactions.add( 309.76, 127.43, 30, 'вернуться к посуде', () => {
      if (!this.need('night')) return;
      this.mark('night');
      this.safeRun(() => this.quarrelParents());
    });
  }

  // ---------------- D. ссора родителей + примирение (мытьё кухни)
  async quarrelParents() {
    this.lockInput();
    this.ui.clearQuest();
    await this.ui.fadeOut(600);
    await this.ui.caption('Поздно ночью. Дети спят. На кухне горит свет.', 2800);
    this.player.setPosition( 306.53, 88); this.player.dir = 'up';
    this.tamir.setPosition( 322.71, 103.43); this.tamir.dir = 'left';
    this.bella.sprite.setPosition( 167.41, 165.14); this.nia.sprite.setPosition( 232.12, 165.14);
    await this.ui.fadeIn(600);
    await this.focus( 314.94, 92.29, CFG.ZOOM + 1.2);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Ты опять решала всё сама. Про студию. Про школу. Ты даже не спросила, что думаю я.' },
      { who: 'Настя', text: 'Потому что ты каждый раз говоришь: «Как скажешь». Как будто тебе всё равно.' },
      { who: 'Тамир', text: 'Мне не всё равно. Просто если я что-то скажу, это превращается в спор.' },
      { who: 'Настя', text: 'А если не скажешь — это превращается в тишину.' },
    ]);
    const pick = await this.ui.choice('Всё, что копилось годами, лежит на столе. Что скажет Настя?', [
      '«Мне иногда кажется, что я в этом доме одна»',
      '«Давай закончим. Я не хочу об этом сегодня»',
      '«Мне нужна твоя помощь. Не потом — сейчас»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Мне иногда кажется, что я в этом доме одна. Не одна физически. А... единственная, кто думает о том, что у нас всё в порядке.' },
        { who: 'Тамир', text: 'А мне иногда кажется, что я всё делаю не так. И чем больше стараюсь, тем больше тебя раздражаю.' },
        { who: 'Настя', text: 'Я не раздражена. Я просто...' },
        { who: 'Настя', text: 'Я устала.' },
        { who: 'Тамир', text: 'Я тоже.' },
        { who: '', text: 'Пауза. Первая за вечер, в которой никто не пытается выиграть.' },
        { who: 'Настя', text: 'И что теперь?' },
        { who: 'Тамир', text: 'Не знаю.' },
      ]);
      addStat('talk'); addStat('quarrels'); GameState.flags.quarrelParents = true;
      this.reconcile = true;
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Давай закончим. Я не хочу об этом сегодня.' },
        { who: 'Тамир', text: 'Но мы так никогда не...' },
        { who: 'Настя', text: 'Потом поговорим.' },
        { who: '', text: 'Он не спорит. Это самое страшное: он просто кивает и становится чуть дальше, чем был секунду назад. Совсем чуть-чуть. Но шаг к шагу набирается расстояние.' },
      ]);
      addStat('avoid'); addStat('quarrels'); GameState.flags.quarrelParents = true;
      this.reconcile = false;
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Мне нужна твоя помощь. Не «как скажешь». Не «ты лучше знаешь». Просто — реши что-нибудь вместе со мной.' },
        { who: 'Тамир', text: '...' },
        { who: 'Тамир', text: 'Я боялся, что решать — это значит ошибаться при тебе.' },
        { who: 'Настя', text: 'Я ошибаюсь при тебе каждый день.' },
        { who: 'Тамир', text: 'Но ты делаешь это уверенно.' },
        { who: 'Настя', text: 'Это называется «притворяться».', mood: 'happy' },
        { who: '', text: 'Оба невольно усмехаются. Напряжение лопается, как мыльный пузырь.' },
      ]);
      addStat('talk', 2); addStat('quarrels'); GameState.flags.quarrelParents = true;
      this.reconcile = true;
    }
    adjustRelationship({ closeness: this.reconcile ? 1 : -1 });
    SaveSystem.save();
    await wait(this, 500);
    await this.ui.caption('Тамир начинает убирать со стола. Настя молча берёт другую тарелку.', 3200);
    await this.unfocus();
    this.unlockInput();
    this.ui.setQuest('Помыть кухню вместе');
    this.interactions.add( 309.76, 129.14, 34, 'вместе помыть кухню', () => {
      if (!this.need('washK')) return;
      this.mark('washK');
      this.safeRun(() => this.washKitchen());
    });
  }

  async washKitchen() {
    this.lockInput();
    this.ui.clearQuest();
    await this.focus( 309.76, 105.14, CFG.ZOOM + 1.2);
    await this.ui.dialogue([
      { who: '', text: 'Они моют кухню. Молча, сосредоточенно, по очереди протирая то, что и так чистое. Это не слова. Это язык, который у них давно есть.' },
      { who: '', text: 'Тамир тянется за кружкой — синей, той самой, первой, из старой квартиры. Рука задевает полку.' },
      { who: '', text: 'Хруст. Две половинки на кафеле.' },
      { who: 'Тамир', text: 'Нет. Только не эту.', mood: 'worried' },
      { who: 'Настя', text: '...' },
    ]);
    const pick = await this.ui.choice('Синяя кружка из первой квартиры разбилась. Что делает Настя?', [
      'Сказать: «Ничего страшного» — и сохранить осколок',
      'Выбросить — «это просто кружка»',
      'Засмеяться — иначе заплакать',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ничего страшного. Осколок я заберу.' },
        { who: 'Тамир', text: 'Зачем тебе осколок?' },
        { who: 'Настя', text: 'Потому что пока он есть, мы помним, откуда мы начинали.' },
      ]);
      GameState.flags.shardKept = true; addStat('memories'); addStat('houseAttach');
      adjustRelationship({ warmth: 1 });
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Это просто кружка.' },
        { who: 'Тамир', text: 'Ты уверена?' },
        { who: 'Настя', text: 'Нет. Но вещи — это вещи. Мы всё равно остаёмся.' },
        { who: '', text: 'Осколки уходят в мусорное ведро с глухим звоном. Тамир долго смотрит им вслед.' },
      ]);
      addStat('letGo');
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ты разбил нашу первую кружку. Ты понимаешь?' },
        { who: 'Тамир', text: 'Я понимаю. Прости.' },
        { who: 'Настя', text: 'Нет, я не... это просто...', mood: 'happy' },
        { who: '', text: 'Она смеётся — тем смехом, который появляется там, где слёзы уже не помещаются. Через секунду Тамир смеётся тоже.' },
      ]);
      addStat('habits'); adjustRelationship({ warmth: 2 });
    }
    await wait(this, 500);
    await this.ui.dialogue([
      { who: '', text: 'Спустя минуту Тамир ставит перед ней чашку чая. Другую, красную. Настя ничего не говорит.' },
      { who: '', text: 'Но берёт её.' },
    ]);
    if (this.reconcile) addStat('reconciled');
    GameState.flags.kitchenWashed = true;
    SaveSystem.save();
    await this.unfocus();
    await this.ui.fadeOut(700);
    await this.ui.caption('Бывают ссоры, которые заканчиваются не словами, а чашкой чая.', 3000);
    this.safeRun(() => this.graduation());
  }

  // ---------------- E. выпускной
  async graduation() {
    this.interactions.clear();
    this.hallFlavour();
    this.kids.forEach((k) => k.destroy()); this.kids = [];
    this.bella = this.spawnKid('bella_adult', 309.76, 130.86, 'down');
    this.bella.sprite.setScale(1.08);
    this.nia = this.spawnKid('nia_teen', 342.12, 122.29, 'left');
    this.player.setPosition( 283.88, 148); this.player.dir = 'right';
    this.tamir.setPosition( 322.71, 88); this.tamir.dir = 'down';
    this.add.image( 283.88, 113.71, 'balloons').setScale(0.86).setOrigin(0.5, 1).setDepth(113.71);
    this.add.image( 368, 113.71, 'balloons').setScale(0.86).setOrigin(0.5, 1).setDepth(113.71);
    this.add.image( 309.76, 122.29, 'cake').setScale(0.86).setOrigin(0.5, 1).setDepth(131.71);
    this.kidWander = null;
    await this.ui.fadeIn(900);
    await this.ui.caption('Выпускной. Белла заканчивает школу.', 3000);
    this.unlockInput();
    this.ui.setQuest('Подойти к Белле');
    this.interactions.add( 309.76, 130.86, 34, 'подойти к Белле', () => {
      if (!this.need('grad')) return;
      this.mark('grad');
      this.safeRun(() => this.graduationTalk());
    });
    this.interactions.add( 348.59, 49.43, 28, 'посмотреть на рисунок', () => {
      this.safeRun(async () => {
        this.lockInput();
        const cam = this.cameras.main;
        const big = this.add.image(cam.midPoint.x, cam.midPoint.y, 'kid_drawing').setScale(7).setDepth(2000);
        await this.ui.dialogue([
          { who: '', text: 'Выцветшие фломастеры, неровное «БЕЛА». Четыре фигурки и одна совсем маленькая в углу.' },
          { who: '', text: 'Теперь та, что в углу, стоит в соседней комнате и выше Насти на полголовы.' },
        ]);
        big.destroy();
        this.unlockInput();
      });
    });
  }

  async graduationTalk() {
    this.lockInput();
    this.ui.clearQuest();
    await this.focus( 309.76, 122.29, CFG.ZOOM + 1);
    this.bella.dir = 'left';
    await this.ui.dialogue([
      { who: '', text: 'Настя смотрит на Беллу — высокую, взрослую, с рукой в вечернем платье, которое она выбирала сама. И вспоминает маленькую девочку, которая нарисовала огурец с усами и назвала его папой.' },
      { who: 'Настя', text: 'Ты такая... выросла.', mood: 'happy' },
      { who: 'Белла', text: 'Мам, не начинай.', mood: 'happy' },
      { who: 'Настя', text: 'Я не начинаю. Я констатирую.' },
    ]);
    if (GameState.flags.photoBella) {
      await this.ui.dialogue([{ who: '', text: 'Тамир выкладывает на экран телевизора слайд-шоу. Белла на ковре с Марсом. Белла с мороженым. Белла в первом классе — с огромным бантом. Все кадры, которые Настя когда-то успела сохранить.' }]);
    } else {
      await this.ui.dialogue([{ who: '', text: 'Тамир ищет старые фотографии для слайд-шоу и находит их очень мало. Оказывается, самые важные моменты почти никогда не снимают — их просто проживают.' }]);
    }
    await this.ui.dialogue([
      { who: 'Ния', text: 'Ты теперь не будешь занимать ванну по сорок минут.', mood: 'happy' },
      { who: 'Белла', text: 'Буду. Просто в другом городе.', mood: 'happy' },
      { who: '', text: 'Все смеются. Только Настя вдруг понимает, что слово «другом» звучит так, как будто его уже проговорили в чужом доме.' },
    ]);
    await wait(this, 600);
    await this.ui.fadeOut(600);
    await this.ui.caption('Праздник заканчивается. Гости уходят. Остаются только они вдвоём.', 3000);
    this.nia.sprite.setPosition( 360.24, 96.57);
    this.tamir.setPosition( 277.41, 53.71); this.tamir.dir = 'down';
    this.bella.sprite.setPosition( 309.76, 130.86);
    this.player.setPosition( 296.82, 139.43);
    await this.ui.fadeIn(600);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Мам?' },
      { who: 'Настя', text: 'Да?' },
      { who: 'Белла', text: 'Я правда была такой маленькой?', mood: 'happy' },
      { who: 'Настя', text: 'Ещё меньше.', mood: 'happy' },
    ]);
    const pick = await this.ui.choice('Белла готова вот-вот уехать. Что ты скажешь?', [
      '«Если захочешь вернуться — дверь открыта»',
      '«Я хочу, чтобы ты была счастлива — везде, где захочешь»',
      '«Позвони, как приедешь. И звони чаще»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([{ who: 'Настя', text: 'Если захочешь вернуться — дверь открыта. И не придётся объяснять почему.' }, { who: 'Белла', text: 'Я знаю.', mood: 'happy' }]);
      addStat('houseAttach'); addStat('kidsBond');
    } else if (pick === 1) {
      await this.ui.dialogue([{ who: 'Настя', text: 'Я хочу, чтобы ты была счастлива — везде, где захочешь. Даже если это далеко.' }, { who: 'Белла', text: 'Мам. Спасибо.', mood: 'happy' }]);
      addStat('letGo', 2);
    } else {
      await this.ui.dialogue([{ who: 'Настя', text: 'Позвони, как приедешь. И звони чаще, чем кажется нужным.' }, { who: 'Белла', text: 'Договорились. Хотя если я не позвоню — это значит, что у меня всё хорошо.', mood: 'happy' }, { who: 'Настя', text: 'Это худший аргумент, который я слышала.' }]);
      addStat('talk'); addStat('kidsBond');
    }
    GameState.flags.graduationDone = true;
    SaveSystem.save();
    await wait(this, 600);
    await this.endChapter(5, 'Дом, полный голосов', 'Школа • Закрытые двери • Ссора • Выпускной',
      'emptynest', 'EmptyNest', 'chapter5Complete', 'Дети вырастают, даже если родители не готовы.');
  }
}


/* =====================================================================
   ГЛАВА 6 — «Тихий дом»
   Дети уезжают • Пустые комнаты • Взрослые дочери • Старение • Коты
   ===================================================================== */
