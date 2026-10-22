class StreetScene extends GameplayScene {
  constructor() { super('Street'); }

  create() {
    this.commonCreate();
    GameState.chapter = 'street';
    SaveSystem.save();

    // Three close rooms and a tiny entry nook: enough to feel lived in,
    // never so wide that the family home reads as an empty floor plan.
    const W = 40, H = 16, T = 16;
    const data = makeGrid(W, H, 0);
    fillRect(data, 0, 6, W - 1, 6, 3);
    fillRect(data, 0, 7, W - 1, 10, 2);
    // sprinkle a few flower / variant tiles by hand for texture
    [[3,2],[7,13],[12,3],[18,13],[24,2],[30,13],[35,3]].forEach(([x,y]) => data[y][x] = 4);
    [[5,1],[9,14],[15,1],[21,14],[27,1],[33,14]].forEach(([x,y]) => data[y][x] = 1);

    const { map } = buildTilemap(this, data, 'tileset_outdoor', T, T);
    const worldW = W * T, worldH = H * T;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    // decorative trees along the top & bottom edges
    [40, 160, 280, 400, 520, 600].forEach((x) => {
      this.add.image(x, 30, 'tree_night').setOrigin(0.5, 1).setDepth(30);
      this.addCollider(x, 24, 20, 14);
    });
    [70, 200, 340, 470, 590].forEach((x) => {
      this.add.image(x, 250, 'tree_night').setOrigin(0.5, 1).setDepth(250);
      this.addCollider(x, 236, 20, 14);
    });

    // streetlamps along the path
    [150, 420].forEach((x) => {
      this.add.image(x, 116, 'streetlamp').setOrigin(0.5, 1).setDepth(116);
      addGlow(this, x, 96, 1.3);
      this.addCollider(x, 108, 8, 10);
    });

    // bench near the meeting point
    this.add.image(330, 128, 'bench').setOrigin(0.5, 1).setDepth(128);

    // ---- extra street decorations ----
    this.add.image(100, 32, 'bush').setOrigin(0.5, 1).setDepth(32);
    this.add.image(460, 32, 'bush').setOrigin(0.5, 1).setDepth(32);
    this.add.image(230, 32, 'trashcan').setOrigin(0.5, 1).setDepth(32);
    this.addCollider(230, 28, 10, 8);
    this.add.image(560, 250, 'mailbox').setOrigin(0.5, 1).setDepth(250);
    this.addCollider(560, 244, 10, 10);
    this.add.image(60, 250, 'streetsign').setOrigin(0.5, 1).setDepth(250);
    this.add.image(290, 170, 'puddle_deco').setOrigin(0.5, 1).setDepth(100);
    this.add.image(500, 170, 'puddle_deco').setOrigin(0.5, 1).setDepth(100);
    for (let fx = 0; fx < worldW; fx += 24) this.add.image(fx, 254, 'fence').setOrigin(0, 1).setDepth(10);
    this.interactions.add(560, 244, 22, 'заглянуть в почтовый ящик', () => {
      this.ui.dialogue([{ who: '', text: 'Пусто. Только рекламная листовка про скидки на матрасы. Рановато думать о матрасах. Или нет?' }]);
    });
    this.interactions.add(230, 30, 22, 'заглянуть в урну', () => {
      this.ui.dialogue([{ who: '', text: 'Внутри два стаканчика из-под кофе. Кто-то тоже прогуливался здесь не один.' }]);
    });
    this.interactions.add(60, 246, 22, 'прочитать указатель', () => {
      this.ui.dialogue([{ who: '', text: '«Парк — 300 м. Набережная — 1 км.» Хочется пройти и то и другое. Но не сегодня.' }]);
    });

    // dusk tint over the whole map
    addTint(this, worldW, worldH, 0x1c1440, 0.35, Phaser.BlendModes.MULTIPLY);

    // player & Тамир
    this.player = new Player(this, 48, 140);
    this.collidersReadyFor(this.player.sprite);
    this.npc = new NPC(this, 340, 140, 'tamir');
    this.npc.dir = 'left';
    this.collidersReadyFor(this.npc.sprite);

    // camera
    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setZoom(CFG.ZOOM);

    Audio.startAmbience('dusk');

    // interaction with Тамир
    this.meetPoint = this.interactions.add(340, 140, 34, 'заговорить', () => {
      if (this.locked) return;
      this.safeRun(() => this.startIntro());
    });

    // a handful of flavour interactions scattered along the street
    this.interactions.add(330, 128, 26, 'сесть на скамейку', () => {
      this.ui.dialogue([{ who: '', text: 'Скамейка ещё тёплая от дневного солнца. Пара минут покоя перед тем, что случится дальше.' }]);
    });
    this.interactions.add(150, 108, 24, 'постоять под фонарём', () => {
      this.ui.dialogue([{ who: '', text: 'Свет фонаря жёлтый и немного дрожит — старая лампа, которую городские службы вечно забывают поменять.' }]);
    });
    this.interactions.add(420, 108, 24, 'постоять под фонарём', () => {
      this.ui.dialogue([{ who: '', text: 'Здесь тише. Мотыльки кружат вокруг лампы, не решаясь улететь во тьму.' }]);
    });
    this.interactions.add(40, 24, 26, 'посмотреть на дерево', () => {
      this.ui.dialogue([{ who: '', text: 'Старая липа — говорят, ей больше ста лет. Она видела улицу совсем другой.' }]);
    });
    this.interactions.add(48, 140, 40, 'посмотреть на небо', () => {
      this.ui.dialogue([{ who: '', text: 'Небо ещё не совсем тёмное — тот самый час, когда день не хочет уходить, а ночь уже не может ждать.' }]);
    });

    this.ui.fadeIn(600);
    this.ui.setQuest('Подойти к Тамиру и заговорить с ним');
    this.ui.caption('Вечер. Обычная улица неподалёку от дома.', 2200);
  }

  async startIntro() {
    this.lockInput();
    this.interactions.clear();
    this.ui.clearQuest();
    this.npc.faceTowards(this.player.sprite.x, this.player.sprite.y);
    this.npc.dir = this.player.sprite.x < this.npc.sprite.x ? 'left' : 'right';
    this.npc.playDir('idle');

    await this.ui.dialogue([
      { who: '', text: 'Он явно репетировал что-то другое. Получилось не то.' },
      { who: 'Тамир', text: 'Извините... мы, кажется, где-то встречались?', mood: 'worried' },
      { who: '', text: 'Настя смотрит на него на секунду дольше, чем нужно для отказа.' },
      { who: 'Настя', text: 'Сомневаюсь. Я бы запомнила настолько неудачную попытку.' },
      { who: 'Тамир', text: 'Справедливо. Если честно, я не придумывал это заранее — испугался, что вы уйдёте, и рот открылся быстрее головы.' },
      { who: '', text: 'Она уже почти сделала шаг в сторону. Но что-то в этой ненужной честности — глупой, необязательной — держит её на месте секундой дольше.' },
      { who: 'Тамир', text: 'В защиту скажу — обычно я даже до «извините» не добираюсь.' },
    ]);

    const pick = await this.ui.choice('Как ответить?', [
      'Улыбнуться',
      'Промолчать и просто пойти дальше',
    ]);
    GameState.flags.firstImpression = pick === 0 ? 'warm' : 'guarded';

    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ладно. Наглость я прощаю быстрее, чем скуку — но вообще-то я так не отвечаю.', mood: 'happy' },
        { who: 'Тамир', text: 'А как обычно отвечаете?' },
        { who: 'Настя', text: 'Обычно просто ухожу. Так что это уже прогресс — можете гордиться.' },
      ]);
    } else {
      await this.ui.dialogue([
        { who: '', text: 'Настя молчит. Это не грубость — просто правило: не поощрять с первой фразы. Но уйти почему-то не так легко, как должно быть.' },
        { who: 'Тамир', text: 'Хорошо, буду считать это согласием на пять минут разговора.' },
        { who: 'Настя', text: 'На четыре.' },
        { who: '', text: 'Она закатывает глаза. Но не уходит.' },
      ]);
    }

    GameState.flags.metTamir = true;
    SaveSystem.save();
    await this.walkTogetherScene();
  }

  async walkTogetherScene() {
    await this.ui.caption('Они идут вместе. Говорят обо всём и ни о чём — почему он терпеть не может понедельники, почему ей всегда кажется, что она опаздывает, даже когда никуда не спешит.', 3400);
    await this.ui.caption('Ничего важного. Или самое важное — сразу не разберёшь.', 2400);

    const targetX = 600;
    const cam = this.cameras.main;
    cam.stopFollow();

    let playerDone = false, npcDone = false;
    this.player.moveToScripted(targetX - 40, this.player.sprite.y, () => { playerDone = true; });
    this.npc.moveTo(targetX, this.npc.sprite.y, () => { npcDone = true; });
    cam.pan(targetX, this.player.sprite.y, 4200, 'Linear');
    await this.ui.letterboxOn(500);

    await this.ui.dialogue([
      { who: 'Настя', text: 'Ну... мне, наверное, уже пора.' },
      { who: 'Тамир', text: 'Ага.' },
      { who: '', text: 'Пауза длиннее, чем нужно для одного слова.' },
      { who: 'Настя', text: 'Ты всегда так провожаешь людей?' },
      { who: 'Тамир', text: 'Как?' },
      { who: 'Настя', text: '«Ага».' },
      { who: '', text: 'Он смеётся — не потому что смешно, а потому что не знает, что ещё с собой делать.' },
      { who: '', text: 'Она не сможет объяснить потом, почему из целого вечера запомнит именно это «ага». Но запомнит — на годы вперёд.' },
    ]);

    Audio.playChime();
    // let the walk finish even if dialogue was skipped quickly (bounded — never hang forever)
    const walkDeadline = this.time.now + 6000;
    while ((!playerDone || !npcDone) && this.time.now < walkDeadline) { await wait(this, 120); }
    this.player.releaseScript();
    await this.ui.letterboxOff(400);

    await this.ui.fadeOut(700);
    await this.ui.caption('Прошло несколько недель.', 2000);

    GameState.chapter = 'date';
    SaveSystem.save();
    this.scene.start('DateScene');
  }
}
/* =====================================================================
   DateScene — ЭТАП II (часть A): НАЧАЛО ОТНОШЕНИЙ
   A handful of early dates collapsed into one evening in the park,
   ending on the quiet, unmusical first-kiss beat from the design doc.
   ===================================================================== */
