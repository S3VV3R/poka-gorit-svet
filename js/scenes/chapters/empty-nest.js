class EmptyNestScene extends HouseScene {
  constructor() { super('EmptyNest'); }

  create() {
    GameState.chapter = 'emptynest';
    GameState.ageStage = 'mid';
    this.houseCreate({ era: 'kids', tint: 0xffe4b8, tintAlpha: 0.08, ambience: 'home' });
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');
    this.player.setPosition( 283.88, 148); this.player.dir = 'right';
    this.spawnTamir( 329.18, 96.57, 'down');
    this.bella = this.spawnKid('bella_adult', 309.76, 130.86, 'down');
    this.suitcase = this.add.image( 329.18, 146.29, 'suitcase').setScale(0.86).setOrigin(0.5, 1).setDepth(146.29);
    this.nia = null;
    this.marsWander = false; this.abilkaWander = false;
    this.baseFlavour();
    this.safeRun(() => this.bellaLeaves());
  }

  baseFlavour() {
    this.interactions.add( 44.47, 41.71, 28, 'посмотреть на Марса', () => {
      if (!this.mars) { this.ui.dialogue([{ who: '', text: 'Шкаф. Просто шкаф.' }]); return; }
      this.ui.dialogue([{ who: '', text: 'Марс на шкафу. Седой на морде, медленнее, чем раньше. Но всё ещё считает, что дом принадлежит ему.' }]);
    });
    this.interactions.add( 70.35, 192.57, 28, 'погладить Абилку', () => {
      if (!this.abilka) { this.ui.dialogue([{ who: '', text: 'Здесь теперь тихо.' }]); return; }
      Audio.playPurr();
      this.ui.dialogue([{ who: '', text: 'Абилка уже не прыгает на кровать. Она ждёт, чтобы её подняли. Это не слабость — просто такой теперь порядок.' }]);
    });
    this.interactions.add( 348.59, 49.43, 28, 'посмотреть на рисунок на холодильнике', () => {
      this.ui.dialogue([{ who: '', text: 'Фломастер за пятнадцать лет почти выцвел. Но рисунок всё ещё держится на том самом магните — одном из немногих, которые никто не трогал.' }]);
    });
  }

  // ---------------- 1. Белла уезжает
  async bellaLeaves() {
    this.lockInput();
    this.ui.fadeIn(800);
    await this.ui.caption('Осень. Белла уезжает учиться.', 2600);
    this.unlockInput();
    this.ui.setQuest('Проводить Беллу');
    this.bellaSpot = this.interactions.add( 309.76, 130.86, 36, 'обнять Беллу', () => {
      if (!this.need('bellaGo')) return;
      this.mark('bellaGo');
      this.safeRun(() => this.bellaGoodbye());
    });
  }

  async bellaGoodbye() {
    this.lockInput();
    this.ui.clearQuest();
    await this.focus( 316.24, 130.86, CFG.ZOOM + 1);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Ты проверила паспорт? Зарядку? Ту синюю куртку?' },
      { who: 'Белла', text: 'Пап, я еду в соседний город. Не в экспедицию.', mood: 'happy' },
      { who: 'Тамир', text: 'Мало ли.' },
      { who: 'Настя', text: '...' },
      { who: 'Белла', text: 'Мам, я же не умираю.' },
      { who: 'Настя', text: 'Я знаю.' },
      { who: 'Белла', text: 'Тогда почему ты плачешь?' },
      { who: 'Настя', text: 'Потому что ты выросла.', mood: 'worried' },
      { who: 'Белла', text: 'Это ведь хорошо?', mood: 'happy' },
      { who: 'Настя', text: 'Очень.', mood: 'happy' },
    ]);
    const pick = await this.ui.choice('Последние слова на пороге.', [
      'Обнять крепко и ничего не говорить',
      'Сунуть в сумку контейнер с едой «на всякий случай»',
      'Сказать: «Тебе не обязательно звонить каждый день»',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([{ who: '', text: 'Объятие длится дольше, чем нужно. Белла не торопит. Это, пожалуй, самое взрослое, что она сделала за всё время.' }]);
      addStat('kidsBond');
    } else if (pick === 1) {
      await this.ui.dialogue([{ who: 'Белла', text: 'Мам, в общежитии есть столовая.', mood: 'happy' }, { who: 'Настя', text: 'Но не такая.' }, { who: 'Белла', text: 'Ладно. Но ты — моя причина вернуться, а не контейнеры.', mood: 'happy' }]);
      addStat('habits'); addStat('kidsBond');
    } else {
      await this.ui.dialogue([{ who: 'Настя', text: 'Тебе не обязательно звонить каждый день. Но иногда — звони.' }, { who: 'Белла', text: 'Раз в неделю?', mood: 'happy' }, { who: 'Настя', text: 'Для начала.' }]);
      addStat('letGo'); addStat('talk');
    }
    GameState.flags.bellaLeft = true;
    this.bella.moveTo( 362.82, 204.57);
    await wait(this, 1500);
    this.bella.destroy(); this.kids = [];
    this.suitcase.destroy();
    SaveSystem.save();
    await this.unfocus();
    this.unlockInput();
    this.interactions.remove(this.bellaSpot);
    await this.ui.caption('Первые недели Настя наслаждается тишиной.', 2600);
    this.quietChores = 0;
    this.ui.setQuest('Насладиться тишиной (0/2)');
    const quiet = () => {
      this.quietChores++;
      if (this.quietChores >= 2) {
        this.ui.setQuest('...');
        this.safeRun(() => this.tooQuiet());
      } else this.ui.setQuest(`Насладиться тишиной (${this.quietChores}/2)`);
    };
    this.interactions.add( 351.82, 168.57, 30, 'выпить кофе на диване', () => {
      if (!this.need('q1')) return;
      this.mark('q1');
      this.safeRun(async () => {
        this.lockInput();
        await this.ui.dialogue([
          { who: '', text: 'Диван. Кофе. Никаких носков на полу и ни одного «мам, а где...».' },
          { who: 'Настя', text: 'Так вот как оно, когда никто ничего не требует.', mood: 'happy' },
          { who: '', text: 'Первые десять минут — абсолютное блаженство. Следующие десять — подозрительно напоминают ожидание звонка.' },
        ]);
        this.unlockInput();
        quiet();
      });
    });
    this.interactions.add( 63.88, 177.14, 30, 'принять долгую ванну', () => {
      if (!this.need('q2')) return;
      this.mark('q2');
      this.safeRun(async () => {
        this.lockInput();
        await this.ui.dialogue([
          { who: '', text: 'Ванна занимает час. Никто не стучит в дверь. Никто не просит срочно выйти. Вода медленно остывает.' },
          { who: 'Настя', text: 'Целый час. И никто не спросил, жива ли я.', mood: 'happy' },
          { who: '', text: 'Она улыбается. Потом замечает, что прислушивается к двери. Потом — что прислушивается зря.' },
        ]);
        this.unlockInput();
        quiet();
      });
    });
  }

  // ---------------- 2. слишком тихо (пустая комната)
  async tooQuiet() {
    await wait(this, 500);
    this.ui.clearQuest();
    await this.ui.caption('Проходит ещё неделя. Тишина становится слишком тихой.', 3000);
    this.ui.setQuest('Заглянуть в комнату Беллы');
    this.interactions.add( 173.88, 173.71, 40, 'зайти в комнату Беллы', () => {
      if (!this.need('room')) return;
      this.mark('room');
      this.safeRun(() => this.emptyRoom());
    });
  }

  async emptyRoom() {
    this.lockInput();
    this.ui.clearQuest();
    this.tamir.setPosition( 144.76, 112); this.tamir.dir = 'right';
    await this.focus( 173.88, 165.14, CFG.ZOOM + 1.1);
    await this.ui.dialogue([
      { who: '', text: 'Комната Беллы почти нетронута. Покрывало ровное — оно давно не бывало таким ровным. На стене — наклейки, которые она когда-то считала слишком детскими и всё равно не сняла.' },
      { who: '', text: 'На столе — недорисованный эскиз. Настя не трогает его. Это единственная вещь, которую она ни за что не уберёт.' },
    ]);
    Audio.stopAmbience(0.4);
    await wait(this, 900);
    this.tamir.moveTo( 157.71, 130.86);
    await wait(this, 700);
    await this.ui.dialogue([
      { who: 'Настя', text: 'Скучаешь?' },
      { who: 'Тамир', text: 'Ага.' },
      { who: 'Настя', text: 'Я тоже.' },
      { who: '', text: 'Он ничего не добавляет. Просто стоит рядом, и им обоим становится чуть теплее — как будто тишина стала на двоих.' },
    ]);
    Audio.startAmbience('home');
    addStat('houseAttach');
    await this.unfocus();
    this.tamir.moveTo( 329.18, 96.57);
    this.unlockInput();
    await wait(this, 500);
    await this.ui.caption('Через два года уезжает и Ния.', 3000);
    this.safeRun(() => this.niaLeaves());
  }

  async niaLeaves() {
    this.nia = this.spawnKid('nia_adult', 219.18, 130.86, 'down');
    this.suitcase = this.add.image( 232.12, 146.29, 'suitcase').setScale(0.86).setOrigin(0.5, 1).setDepth(146.29);
    this.ui.setQuest('Проводить Нию');
    this.interactions.add( 219.18, 130.86, 34, 'проводить Нию', () => {
      if (!this.need('niaGo')) return;
      this.mark('niaGo');
      this.safeRun(async () => {
        this.lockInput();
        this.ui.clearQuest();
        await this.focus( 222.41, 130.86, CFG.ZOOM + 1);
        await this.ui.dialogue([
          { who: 'Ния', text: 'Я позвоню, когда доеду.' },
          { who: 'Настя', text: 'Тебе не обязательно.' },
          { who: 'Ния', text: 'Знаю. Но хочу.' },
          { who: '', text: 'Ния всегда была тише Беллы. Она не плачет, не обнимается на пороге, не говорит лишнего. Но кладёт на подушку маленькую записку: «Не закрывай мою комнату. Пожалуйста».' },
        ]);
        const pick = await this.ui.choice('Записка Нии. Что сделаешь с её комнатой?', [
          'Оставить всё как есть — как она просила',
          'Через месяц переделать в кабинет',
          'Спросить саму Нию, что она хочет',
        ]);
        if (pick === 0) {
          await this.ui.dialogue([{ who: 'Настя', text: 'Комната остаётся твоей. Всегда.' }, { who: 'Ния', text: 'Спасибо, мам.', mood: 'happy' }]);
          addStat('houseAttach'); addStat('kidsBond');
        } else if (pick === 1) {
          await this.ui.dialogue([{ who: 'Настя', text: 'Я подумаю про кабинет.' }, { who: 'Ния', text: '...Хорошо. Я понимаю.', mood: 'worried' }, { who: '', text: 'Слово «понимаю» звучит тоньше, чем нужно. Настя запоминает его — на потом.' }]);
          addStat('letGo');
        } else {
          await this.ui.dialogue([{ who: 'Настя', text: 'Давай решим вместе. Чего ты хочешь?' }, { who: 'Ния', text: 'Хочу, чтобы там остались книги. Остальное — как скажете.', mood: 'happy' }]);
          addStat('talk'); addStat('kidsBond');
        }
        GameState.flags.niaLeft = true;
        this.nia.moveTo( 362.82, 204.57);
        await wait(this, 1700);
        this.nia.destroy(); this.kids = [];
        this.suitcase.destroy();
        SaveSystem.save();
        await this.unfocus();
        this.unlockInput();
        this.safeRun(() => this.callsPhase());
      });
    });
  }

  // ---------------- 3. звонки взрослых дочерей
  async callsPhase() {
    await wait(this, 500);
    this.ui.clearQuest();
    await this.ui.caption('Белла и Ния не исчезают. Они звонят. Иногда.', 3000);
    this.ui.setQuest('Услышать звонок (0/2)');
    this.calls = 0;
    this.phoneSpot = this.interactions.add( 309.76, 127.43, 34, 'взять телефон', () => {
      if (this.locked) return;
      this.safeRun(() => this.callScene());
    });
  }

  async callScene() {
    this.lockInput();
    Audio.playChime();
    const n = this.calls;
    this.calls++;
    if (n === 0) {
      await this.ui.dialogue([{ who: '', text: 'Звонит Белла. Настя берёт телефон на кухне — хотя в руках чашка и кипящий суп.' }]);
      const pick = await this.ui.choice('Белла звонит в удобное для тебя время?', ['Ответить и поговорить — суп подождёт', 'Сказать: «Перезвоню позже»']);
      if (pick === 0) {
        await this.ui.dialogue([
          { who: 'Белла', text: 'Мам, у меня получилось! Мою работу выбрали на выставку.', mood: 'happy' },
          { who: 'Настя', text: 'Белла! Это же... расскажи всё. С самого начала.', mood: 'happy' },
          { who: '', text: 'Суп выкипает. Настя не замечает. Они разговаривают сорок минут — дольше, чем за весь последний год жизни под одной крышей.' },
        ]);
        addStat('kidsBond', 2); addStat('talk');
      } else {
        await this.ui.dialogue([
          { who: 'Настя', text: 'Белла, давай вечером? У меня суп.' },
          { who: 'Белла', text: 'Ну... ладно. Просто хотела рассказать кое-что хорошее.', mood: 'worried' },
          { who: '', text: 'Вечером Настя перезванивает. Белла не отвечает. «Потом» опять пришло слишком быстро.' },
        ]);
        addStat('avoid'); addStat('kidsBond', -1);
      }
    } else {
      await this.ui.dialogue([{ who: '', text: 'Прошла неделя. Звонка от Нии всё нет. Настя смотрит на экран, держит палец над её именем и злится: «Могли бы звонить чаще».' }]);
      const pick = await this.ui.choice('Ния давно не звонила. Что делаешь?', ['Позвонить первой', 'Дождаться: у неё своя жизнь', 'Обидеться и промолчать']);
      if (pick === 0) {
        await this.ui.dialogue([
          { who: 'Ния', text: 'Мам? Я как раз хотела позвонить. Просто было не до этого.', mood: 'happy' },
          { who: 'Настя', text: 'Ничего. Я просто хотела услышать голос.' },
          { who: 'Ния', text: 'И я тебя.', mood: 'happy' },
          { who: '', text: 'Настя вдруг вспоминает: когда-то она сама забывала позвонить матери. Тогда казалось — незначительно. Теперь она понимает, как звучит тишина на другом конце.' },
        ]);
        addStat('kidsBond'); addStat('talk');
      } else if (pick === 1) {
        await this.ui.dialogue([{ who: '', text: 'Настя откладывает телефон. Через три дня сообщение: «Прости, завал. Люблю». Это не разговор. Но это тоже форма присутствия.' }]);
        addStat('letGo');
      } else {
        await this.ui.dialogue([{ who: '', text: 'Настя молчит. Ния молчит. Две женщины на расстоянии трёх сотен километров ждут, когда другая сделает первый шаг. Оба шага ещё впереди — но чем дольше ждёшь, тем длиннее путь.' }]);
        addStat('avoid'); addStat('kidsBond', -1);
      }
    }
    SaveSystem.save();
    this.unlockInput();
    if (this.calls < 2) {
      this.ui.setQuest('Услышать звонок (1/2)');
      await wait(this, 400);
      await this.ui.caption('Проходит несколько месяцев.', 2400);
    } else {
      this.interactions.remove(this.phoneSpot);
      this.ui.clearQuest();
      this.safeRun(() => this.agingScene());
    }
  }

  // ---------------- 4. старение Тамира и Насти
  async agingScene() {
    await wait(this, 600);
    await this.ui.fadeOut(700);
    await this.ui.caption('Годы идут. Седина приходит не в один день — она просто однажды оказывается.', 3400);
    this.setStage('mid');
    this.tamir.setPosition( 329.18, 94.86);
    this.player.setPosition( 296.82, 148);
    await this.ui.fadeIn(700);
    this.ui.setQuest('Утро. Найти ключи');
    this.interactions.add( 309.76, 127.43, 34, 'искать ключи вместе с Тамиром', () => {
      if (!this.need('keys')) return;
      this.mark('keys');
      this.safeRun(() => this.keysScene());
    });
  }

  async keysScene() {
    this.lockInput();
    this.ui.clearQuest();
    this.tamir.setPosition( 322.71, 130.86); this.tamir.dir = 'left';
    await this.focus( 316.24, 122.29, CFG.ZOOM + 1);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Ты не видела мои ключи?' },
      { who: 'Настя', text: 'Они в твоей руке.' },
      { who: 'Тамир', text: '...' },
      { who: 'Тамир', text: 'Всё. Стареем.' },
      { who: 'Настя', text: 'Только ты.' },
      { who: 'Тамир', text: 'Конечно.', mood: 'happy' },
      { who: '', text: 'Он улыбается — но чуть дольше, чем нужно, смотрит на ключи в руке. Как на маленький знак, о котором лучше не спрашивать вслух.' },
    ]);
    const pick = await this.ui.choice('Тамир шутит про старость. Он говорит искренне — или просто шутит?', [
      'Спросить прямо: «Тебя это беспокоит?»',
      'Поддержать шутку и промолчать',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Тебя это беспокоит? Правда?' },
        { who: 'Тамир', text: 'Немного. Не ключи — а то, что я заметил. Раньше ключи не пропадали.' },
        { who: 'Настя', text: 'Раньше нас было четверо, и кто-нибудь да подбирал. Теперь — двое.' },
        { who: 'Тамир', text: 'Значит, придётся друг друга подбирать.' },
      ]);
      addStat('talk'); adjustRelationship({ trust: 1, closeness: 1 });
    } else {
      await this.ui.dialogue([{ who: 'Настя', text: 'Конечно, только ты. Я — вечно молодая.' }, { who: 'Тамир', text: 'Именно.' }, { who: '', text: 'Они смеются. И оба понимают, что про ключи больше не будут говорить — пока.' }]);
      addStat('avoid');
    }
    await this.unfocus();
    this.unlockInput();
    this.ui.setQuest('Посмотреть в зеркало шкафа');
    this.interactions.add( 44.47, 43.43, 28, 'посмотреть в зеркало шкафа', () => {
      if (!this.need('mirror')) return;
      this.mark('mirror');
      this.safeRun(() => this.mirrorScene());
    });
  }

  async mirrorScene() {
    this.lockInput();
    this.ui.clearQuest();
    await this.focus( 50.94, 62.29, CFG.ZOOM + 1.3);
    await this.ui.dialogue([
      { who: '', text: 'В зеркале шкафа — женщина, которая давно не рассматривала себя. Линия у глаз. Серебристые нити у висков. Голос, который сегодня утром сказал «доброе утро» чуть ниже, чем в двадцать пять.' },
      { who: 'Настя', text: 'Хм.' },
      { who: '', text: 'Она улыбается отражению. Морщинки у глаз складываются в знакомую картинку — ту, что рисовала когда-то маленькая Белла. «Мама. У неё всегда много смешных линий вокруг глаз».' },
      { who: 'Настя', text: 'Знаешь что? Мне нравится.', mood: 'happy' },
      { who: '', text: 'Старение — не наказание. Это просто карта, на которой нарисованы места, где они смеялись.' },
    ]);
    addStat('habits');
    await this.unfocus();
    this.unlockInput();
    await wait(this, 500);
    await this.ui.caption('Проходят ещё несколько лет.', 2600);
    this.safeRun(() => this.marsGone());
  }

  // ---------------- 5. Марс
  async marsGone() {
    await this.ui.fadeOut(700);
    this.setStage('old');
    this.player.setPosition( 70.35, 148); this.player.dir = 'up';
    this.tamir.setPosition( 329.18, 94.86);
    if (this.mars) { this.mars.sprite.setPosition( 44.47, 36.57); this.mars.dir = 'down'; this.mars.target = null; }
    await this.ui.caption('Марс стареет первым. Он уже не прыгает на шкаф — только смотрит на него.', 3600);
    await this.ui.fadeIn(700);
    this.marsWander = false;
    this.ui.setQuest('Утро. Проведать Марса');
    this.interactions.add( 44.47, 43.43, 30, 'проведать Марса', () => {
      if (!this.need('marsLook')) return;
      this.mark('marsLook');
      this.safeRun(() => this.marsScene());
    });
  }

  async marsScene() {
    this.lockInput();
    this.ui.clearQuest();
    Audio.stopAmbience(1.0);
    await this.focus( 47.71, 53.71, CFG.ZOOM + 1);
    await wait(this, 600);
    if (this.mars) { this.mars.destroy(); this.cats = this.cats.filter((c) => c !== this.mars); this.mars = null; }
    await wait(this, 1400);
    await this.ui.caption('Утром Настя автоматически смотрит на шкаф. Секунду.', 2600);
    await wait(this, 1000);
    await this.ui.caption('Две.', 1800);
    await wait(this, 900);
    await this.ui.dialogue([
      { who: '', text: 'Потом понимает.' },
    ]);
    await wait(this, 1800);
    this.tamir.moveTo( 57.41, 62.29);
    await wait(this, 1800);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Он ушёл тихо. Во сне. Я подумал, что ты захочешь так знать.' },
      { who: 'Настя', text: 'Да.' },
    ]);
    await wait(this, 1500);
    await this.ui.dialogue([{ who: '', text: 'Дом хранит вещи Марса. Теперь нужно решить, что с ними делать.' }]);
    const bowl = await this.ui.choice('Миска Марса.', ['Оставить на привычном месте', 'Убрать']);
    GameState.flags.keptMarsBowl = bowl === 0;
    if (bowl === 0) addStat('houseAttach'); else addStat('letGo');
    if (this.bowlImg) this.bowlImg.setVisible(bowl === 0);
    const toy = await this.ui.choice('Его любимая игрушка — мышь, перетёртая до дыр.', ['Сохранить в коробке', 'Выбросить']);
    GameState.flags.keptMarsToy = toy === 0;
    if (toy === 0) { addStat('memories'); addStat('houseAttach'); } else addStat('letGo');
    const photo = await this.ui.choice('Фотография: рыжий комок на новом диване.', ['Поставить в рамку', 'Оставить в альбоме']);
    GameState.flags.photoMars = photo === 0 ? 'frame' : 'album';
    addStat('memories');
    await this.ui.dialogue([{ who: '', text: 'Музыки нет. Нет ни драматичных кадров, ни слёз на камеру. Есть просто пустое место на шкафу и три решения, из которых складывается дом.' }]);
    GameState.flags.marsGone = true;
    SaveSystem.save();
    await this.unfocus();
    Audio.startAmbience('home');
    this.unlockInput();
    this.ui.setQuest('Подождать. Время идёт');
    this.interactions.add( 44.47, 43.43, 30, 'посмотреть на пустое место', () => {
      this.ui.dialogue([{ who: '', text: 'Шкаф. Вроде бы тот же самый. Но кто-то должен там сидеть.' }]);
    });
    await wait(this, 800);
    this.safeRun(() => this.abilkaGone());
  }

  // ---------------- 6. Абилка
  async abilkaGone() {
    await this.ui.caption('Через некоторое время приходит очередь Абилки.', 3200);
    this.ui.setQuest('Посидеть рядом с Абилкой');
    if (this.abilka) { this.abilka.sprite.setPosition( 296.82, 156.57); this.abilka.target = null; this.abilkaWander = false; }
    this.interactions.add( 296.82, 156.57, 30, 'посидеть рядом с Абилкой', () => {
      if (!this.need('abLook')) return;
      this.mark('abLook');
      this.safeRun(() => this.abilkaScene());
    });
  }

  async abilkaScene() {
    this.lockInput();
    this.ui.clearQuest();
    Audio.stopAmbience(1.0);
    this.player.setPosition( 296.82, 139.43);
    await this.focus( 296.82, 152.29, CFG.ZOOM + 1.2);
    Audio.playPurr();
    await this.ui.dialogue([
      { who: '', text: 'Абилка всегда ложилась рядом с Настей. Не на колени — просто рядом, чтобы можно было достать лапой. Так она и жила: без требований, но неизменно здесь.' },
      { who: 'Настя', text: 'Ты ведь не умеешь долго быть одна, да?' },
    ]);
    await wait(this, 1200);
    if (this.abilka) { this.abilka.destroy(); this.cats = this.cats.filter((c) => c !== this.abilka); this.abilka = null; }
    await wait(this, 1800);
    await this.ui.dialogue([
      { who: '', text: 'Рядом пусто. Рука всё ещё лежит на диване — там, где была тёплая шерсть.' },
    ]);
    await wait(this, 1800);
    await this.ui.dialogue([{ who: '', text: 'Её лежанка осталась в углу. Что с ней делать?' }]);
    const bed = await this.ui.choice('Лежанка Абилки.', ['Оставить в углу', 'Убрать в кладовку']);
    GameState.flags.keptAbilkaBed = bed === 0;
    if (bed === 0) addStat('houseAttach'); else addStat('letGo');
    if (this.catBedImg) this.catBedImg.setVisible(bed === 0);
    const photo = await this.ui.choice('Фотография: Абилка, спящая на тёплой батарее.', ['Повесить на стену', 'Положить в коробку с памятью']);
    GameState.flags.photoAbilka = photo === 0 ? 'wall' : 'box';
    addStat('memories');
    GameState.flags.abilkaGone = true;
    SaveSystem.save();
    await this.unfocus();
    Audio.startAmbience('home');
    this.unlockInput();
    this.ui.clearQuest();
    await wait(this, 800);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Теперь мы одни.' },
      { who: 'Настя', text: 'Нет.' },
      { who: 'Настя', text: 'Теперь у нас есть всё, что мы вместе прожили.' },
      { who: 'Тамир', text: 'Это не одно и то же.' },
      { who: 'Настя', text: 'Нет. Но, наверное, лучше.' },
    ]);
    await this.endChapter(6, 'Тихий дом', 'Пустые комнаты • Годы • Два тихих прощания',
      'lateyears', 'LateYears', 'chapter6Complete', 'Свет в окне горит. Пока горит.');
  }
}


/* =====================================================================
   ГЛАВА 7 — «Пока горит свет»
   Память дома • Последний балкон • выбор концовки
   ===================================================================== */
