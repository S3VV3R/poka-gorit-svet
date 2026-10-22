class YoungFamilyScene extends GameplayScene {
  constructor() { super('YoungFamily'); }

  create() {
    this.commonCreate();
    GameState.chapter = 'youngfamily';
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    const W = 22, H = 14, T = 16;
    const worldW = W*T, worldH=H*T;
    this.worldW=worldW; this.worldH=worldH; this._compactHome=true; this.homeZoom=CFG.ZOOM;
    const data=makeGrid(W,H,3);
    fillRect(data,1,1,W-2,H-2,0);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x+=2)data[y][x]=1;
    
    
    fillRect(data,14,6,18,9,2);fillRect(data,3,0,5,0,4);
    
    buildTilemap(this,data,'tileset_interior',T,T);
    this.add.rectangle(165.33,64,10.67,96,0x403b38).setDepth(20); this.add.rectangle(165.33,173.72,10.67,68.57,0x403b38).setDepth(20);
    this.physics.world.setBounds(16, 16, worldW - 32, worldH - 32);

    this.addCollider(worldW / 2, 8, worldW - 16, 16);
    this.addCollider(worldW / 2, worldH - 8, worldW - 16, 16);
    this.addCollider(8, worldH / 2, 16, worldH - 16);
    this.addCollider(worldW - 8, worldH / 2, 16, worldH - 16);
    this.addCollider(165.33,64,10.67,96);   // divider, above doorway
    this.addCollider(165.33,173.715,10.67,68.57);   // divider, below doorway

    // ---- bedroom ----
    this.add.image( 65.33, 194.29, 'bed').setScale(0.86).setOrigin(0.5, 1).setDepth(194.29);
    this.addCollider( 65.33, 177.14, 26.67, 20.57);
    this.add.image( 45.33, 50.29, 'wardrobe').setScale(0.86).setOrigin(0.5, 1).setDepth(50.29);
    this.addCollider( 45.33, 41.71, 16, 17.14);

    // ---- kitchen / living ----
    this.add.image( 232, 53.71, 'counter').setScale(0.86).setOrigin(0.5, 1).setDepth(53.71);
    this.addCollider( 232, 47.71, 32, 12);
    this.add.image( 258.67, 53.71, 'stove').setScale(0.86).setOrigin(0.5, 1).setDepth(53.71);
    this.addCollider( 258.67, 47.71, 10.67, 12);
    this.add.image( 205.33, 130.86, 'table').setScale(0.86).setOrigin(0.5, 1).setDepth(130.86);
    this.addCollider( 205.33, 125.71, 21.33, 8.57);
    this.add.image( 292, 165.14, 'couch').setScale(0.86).setOrigin(0.5, 1).setDepth(165.14);
    this.addCollider( 292, 160, 26.67, 10.29);
    this.add.image( 272, 36.57, 'plant').setScale(0.86).setOrigin(0.5, 1).setDepth(36.57);
    this.addCollider( 272, 31.43, 8, 8.57);
    // ---- extra decorations ----
    this.add.image( 185.33, 53.71, 'bookshelf').setScale(0.86).setOrigin(0.5, 1).setDepth(53.71);
    this.addCollider( 185.33, 40, 18.67, 13.71);
    this.add.image( 318.67, 53.71, 'tv').setScale(0.86).setOrigin(0.5, 1).setDepth(53.71);
    this.addCollider( 318.67, 48.57, 16, 8.57);
    this.add.image( 85.33, 156.57, 'rug_round').setScale(0.86).setOrigin(0.5, 1).setDepth(2);
    this.interactions.add( 318.67, 48.57, 26, 'выключить телевизор', () => {
      this.ui.dialogue([
        { who: 'Тамир', text: 'Шесть каналов, и ни на одном ничего про нас.', mood: 'neutral' },
        { who: 'Настя', text: 'Зато у нас есть дождь. Он бесплатный.', mood: 'happy' },
      ]);
    });
    this.interactions.add( 185.33, 40, 28, 'просмотреть книги', () => {
      this.ui.dialogue([{ who: '', text: 'Между романами уже втиснулись «Бюджет для чайников» и «Что делать, если...». Названия подобраны подозрительно точно.' }]);
    });

    addTint(this, worldW, worldH, 0x2a3a55, 0.22, Phaser.BlendModes.MULTIPLY);
    this.rain = addRain(this, worldW, worldH, 50);

    this.mars = new Cat(this, 45.33, 21.14, 'mars');
    this.mars.dir = 'down';
    this.cats.push(this.mars);
    this.collidersReadyFor(this.mars.sprite);
    this.abilka = new Cat(this, 72, 190.86, 'abilka');
    this.abilka.dir = 'down';
    this.cats.push(this.abilka);
    this.collidersReadyFor(this.abilka.sprite);

    this.player = new Player(this, 105, 151);
    this.player.dir = 'up';
    this.collidersReadyFor(this.player.sprite);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setZoom(CFG.ZOOM);

    Audio.startAmbience('dusk');
    this.ui.fadeIn(700);
    this.ui.setQuest('Тихое утро. Не спеши.');
    this.ui.caption('Понедельник. За окном дождь.', 2400);

    this.interactions.add( 37.33, 16, 30, 'смотреть на дождь', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Капли стекают по стеклу вперегонки. Настя когда-то в детстве загадывала на этом желания — и сейчас, без всякой причины, всё равно загадывает.' }]);
    });
    this.interactions.add( 72, 190.86, 28, 'погладить Абилку', () => {
      if (this.locked) return;
      Audio.playPurr();
      this.ui.dialogue([{ who: '', text: 'Абилка щурится и подставляет ухо. С котами разговор всегда проще — им не нужно объяснять, почему сегодня хочется молчать.' }]);
    });
    this.interactions.add( 45.33, 41.71, 28, 'посмотреть на Марса', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Марс наблюдает за комнатой со шкафа, как король со своего балкона — снисходительно и слегка разочарованно в подданных.' }]);
    });
    this.interactions.add( 292, 160, 28, 'посидеть на диване', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Диван здесь новее, чем в старой квартире, но продавливается уже похожим образом — видимо, это неизбежно.' }]);
    });
    this.interactions.add( 272, 31.43, 22, 'посмотреть на цветок', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Тот самый цветок, что пережил два переезда. Кажется, он единственный, кто уверен в завтрашнем дне больше, чем они.' }]);
    });

    this.crisisTriggered = false;
  }

  tick() {
    if (this.mars) this.mars.wander({ x: 18.67, y: 62.29, w: 53.33, h: 42.86 });
    if (!this.crisisTriggered && this.player.sprite.x > 176) {
      this.crisisTriggered = true;
      this.safeRun(() => this.crisisScene());
    }
  }

  async crisisScene() {
    this.lockInput();
    this.ui.clearQuest();
    this.interactions.clear();

    if (!this.tamir) {
      this.tamir = new NPC(this, 232, 96.57, 'tamir');
      this.tamir.dir = 'down';
      this.collidersReadyFor(this.tamir.sprite);
    }

    await this.ui.dialogue([
      { who: 'Тамир', text: 'Слушай, есть разговор.' },
      { who: 'Настя', text: 'Судя по лицу, не про отпуск.' },
      { who: 'Тамир', text: 'На работе сокращают отдел. Меня пока не трогали, но зарплату задерживают уже второй месяц.' },
      { who: 'Настя', text: 'Второй? Почему я узнаю только сейчас?' },
      { who: 'Тамир', text: 'Потому что всё время казалось — вот-вот наладится.' },
      { who: '', text: 'Марс, будто почувствовав напряжение, спрыгивает со шкафа и садится подальше.' },
      { who: 'Настя', text: 'Ладно. Что будем делать?' },
    ]);

    const pick = await this.ui.choice('Единственно правильного ответа тут нет.', [
      'Составить бюджет и экономить вместе',
      'Сказать, что пора искать другую работу',
      'Просто обнять — без плана, без советов',
      'Не сдержаться и высказать всё, что накопилось',
      'Сделать вид, что справитесь, как всегда',
    ]);

    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Тогда для начала — никаких доставок еды. И кафе тоже подождёт.' },
        { who: 'Тамир', text: 'Сурово.' },
        { who: 'Настя', text: 'Справедливо.' },
        { who: 'Тамир', text: 'Ты уже второй раз в жизни используешь моё слово против меня.' },
      ]);
      adjustRelationship({ trust: 1 });
    } else if (pick === 1) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Может, тебе просто пора посмотреть, что ещё есть на рынке?' },
        { who: 'Тамир', text: 'Может быть. Страшно, если честно — засиделся на одном месте.' },
        { who: 'Настя', text: 'Значит, самое время.' },
      ]);
      adjustRelationship({ trust: 1, closeness: -1 });
    } else if (pick === 2) {
      await this.ui.dialogue([
        { who: '', text: 'Настя подходит и просто обнимает его — без плана, без советов.' },
        { who: 'Настя', text: 'Мы разберёмся. Не сегодня. Но разберёмся.' },
        { who: '', text: 'Он молчит дольше, чем обычно. Потом кивает.' },
      ]);
      adjustRelationship({ warmth: 2 });
    } else if (pick === 3) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ты вообще следил за счетами последние два месяца?' },
        { who: 'Тамир', text: 'Не начинай.', mood: 'worried' },
        { who: 'Настя', text: 'Я не начинаю. Я спрашиваю.' },
        { who: '', text: 'Разговор выходит громче, чем оба ожидали.' },
        { who: '', text: 'Настя злится не на цифры в выписке — она злится, что снова узнаёт важное последней, будто её берегут вместо того, чтобы ей доверять.' },
        { who: '', text: 'Тамир злится не на вопрос — он злится на себя, за то, что действительно не открывал счета, надеясь, что тревога рассосётся сама.' },
      ]);
      await wait(this, 600);
      await this.ui.dialogue([
        { who: 'Тамир', text: 'Прости. Я должен был сказать раньше.' },
        { who: 'Настя', text: 'Я тоже была резче, чем надо было.' },
        { who: 'Тамир', text: 'Дело не совсем в деньгах, если честно. Дело в том, что не хотел, чтобы ты видела меня растерянным.' },
        { who: 'Настя', text: 'Я уже видела тебя в пижаме с заваренной ромашкой в три часа ночи. Растерянность — не самое страшное, что я про тебя знаю.' },
        { who: '', text: 'Он смеётся — и это первый настоящий смех за весь разговор.' },
        { who: '', text: 'Абилка выбирает именно этот момент, чтобы громко потребовать еды. Оба смеются уже вместе.' },
      ]);
      adjustRelationship({ closeness: -1, trust: 1 });
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ничего. Прорвёмся, как всегда.' },
        { who: 'Тамир', text: 'Ты правда так думаешь?' },
        { who: 'Настя', text: 'Я думаю, что сейчас не время паниковать.' },
        { who: '', text: 'Она не паникует. Но и не спит в ту ночь — перебирает все худшие варианты по очереди, методично, будто от этого будет легче. Не будет. Но выбор сделан: сегодня она несёт это одна, чтобы он мог поспать хоть немного.' },
      ]);
      adjustRelationship({ warmth: 1, trust: -1 });
    }

    SaveSystem.save();
    this.unlockInput();
    this.ui.setQuest('Дни идут своим чередом');

    await wait(this, 500);
    await this.ui.caption('Проходит несколько недель. Разговор о деньгах становится привычным фоном — не менее важным, но уже не таким страшным.', 3200);

    this.safeRun(() => this.pregnancyScene());
  }

  async pregnancyScene() {
    this.lockInput();
    this.ui.clearQuest();

    await this.ui.fadeOut(700);
    await this.ui.caption('Однажды утром Настя долго не выходит из ванной.', 2400);
    await this.ui.fadeIn(700);

    if (!this.tamir) {
      this.tamir = new NPC(this, 232, 96.57, 'tamir');
      this.collidersReadyFor(this.tamir.sprite);
    }
    this.player.setPosition( 65.33, 165.14);
    this.player.dir = 'down';
    this.tamir.sprite.setPosition( 52, 165.14);
    this.tamir.dir = 'right';

    await this.ui.letterboxOn(500);
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan( 58.67, 165.14, 700, 'Sine.easeInOut');
    cam.zoomTo(CFG.ZOOM + 1.2, 1200);
    await wait(this, 900);

    await this.ui.dialogue([
      { who: 'Тамир', text: 'Что там?' },
    ]);
    await this.ui.caption('Настя ничего не говорит. Передаёт ему тест.', 2400);
    await wait(this, 800);
    await this.ui.dialogue([
      { who: '', text: 'Тамир смотрит. Несколько секунд молчит — очень на него не похоже.' },
      { who: 'Тамир', text: 'Мы... родители?', mood: 'happy' },
      { who: 'Настя', text: 'Похоже на то.' },
      { who: '', text: 'Он садится. Смеётся. Потом вдруг становится серьёзным.' },
      { who: 'Тамир', text: 'Я боюсь.', mood: 'worried' },
      { who: '', text: 'Не уточняет, чего именно — денег, того, что не справится, того, что однажды подведёт кого-то, кто будет полностью от него зависеть. После недавнего разговора о счетах она и без уточнений знает, как ему тяжело чувствовать себя недостаточным.' },
      { who: 'Настя', text: 'Я тоже.', mood: 'worried' },
      { who: '', text: 'Она боится иначе — что потеряется в этой новой роли, что та Настя, которая когда-то предпочла бы просто уйти, не всегда будет знать, как остаться теперь, когда цена ошибки — не только её собственное сердце.' },
      { who: '', text: 'Десять секунд молчания — и решение принято без слов: пусть боятся. Это не повод не пробовать.' },
      { who: '', text: 'Они обнимаются — молча, дольше обычного.' },
    ]);
    if (GameState.relationship.trust >= 6) {
      await this.ui.caption('Это объятие не тревожное — оно из тех, что научились доверять друг другу задолго до этой новости.', 2600);
    } else {
      await this.ui.caption('Это объятие само по себе — маленький акт доверия. Возможно, самый важный из всех, что были у них до сих пор.', 2800);
    }
    await wait(this, 1000);
    await this.ui.dialogue([
      { who: 'Настя', text: 'Ну хоть Абилка не будет единственной, кто будит нас по ночам.' },
      { who: 'Тамир', text: '...' },
      { who: 'Тамир', text: 'Спасибо, что сказала это именно сейчас.', mood: 'happy' },
    ]);
    Audio.playChime();
    Audio.startMelody();

    cam.zoomTo(CFG.ZOOM, 1000);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    await this.ui.letterboxOff(500);
    Audio.stopMelody();

    adjustRelationship({ closeness: 2, warmth: 2, trust: 1 });
    GameState.flags.pregnancyRevealed = true;
    GameState.chapter = 'complete3';
    GameState.flags.chapter3Complete = true;
    SaveSystem.save();

    await this.ui.fadeOut(900);
    await this.ui.chapterCard('КОНЕЦ ГЛАВЫ 3', 'Молодая семья • Финансовый кризис • Беременность', 3200);
    await this.ui.caption('Впереди — девять месяцев ожидания и человек по имени Белла.', 3000);

    GameState.chapter = 'baby';
    SaveSystem.save();
    Audio.stopAmbience(1.0);
    this.scene.start('Baby');
  }
}
/* =====================================================================
   ЖИВОЙ МИР — жители, прохожие, животные, мелкая жизнь, авто-декор
   ===================================================================== */
