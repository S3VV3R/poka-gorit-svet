class WeddingScene extends GameplayScene {
  constructor() { super('Wedding'); }

  create() {
    this.commonCreate();
    GameState.chapter = 'wedding';
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    const W = 30, H = 16, T = 16;
    const data = makeGrid(W, H, 0);
    fillRect(data, 0, 6, W - 1, 6, 3);
    fillRect(data, 0, 7, W - 1, 11, 2);
    [[4,2],[9,13],[15,2],[20,13],[25,3]].forEach(([x,y]) => data[y][x] = 4);
    [[6,1],[12,14],[18,1],[23,14]].forEach(([x,y]) => data[y][x] = 1);

    buildTilemap(this, data, 'tileset_outdoor', T, T);
    const worldW = W * T, worldH = H * T;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    [40, 130, 350, 440].forEach((x) => {
      this.add.image(x, 30, 'tree').setOrigin(0.5, 1).setDepth(30);
      this.addCollider(x, 24, 20, 14);
    });
    [60, 420].forEach((x) => {
      this.add.image(x, 250, 'tree').setOrigin(0.5, 1).setDepth(250);
      this.addCollider(x, 236, 20, 14);
    });

    // aisle of chairs (benches) leading to the arch
    [80, 140, 200, 300, 360, 420].forEach((x, i) => {
      const y = i % 2 === 0 ? 100 : 200;
      this.add.image(x, y, 'bench').setOrigin(0.5, 1).setDepth(y);
      this.add.image(x, y - 20, 'flowerpot').setOrigin(0.5, 1).setDepth(y - 20);
    });

    this.archX = 240;
    this.add.image(this.archX, 150, 'arch').setOrigin(0.5, 1).setDepth(149);
    // ---- extra wedding decorations ----
    this.add.image(40, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(100, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(160, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(220, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(280, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(340, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(400, 70, 'lantern').setOrigin(0.5, 1).setDepth(70);
    this.add.image(470, 150, 'giftboxes').setOrigin(0.5, 1).setDepth(150);
    this.add.image(20, 150, 'giftboxes').setOrigin(0.5, 1).setDepth(150);
    this.add.image(280, 36, 'bush').setOrigin(0.5, 1).setDepth(36);
    this.add.image(20, 36, 'bush').setOrigin(0.5, 1).setDepth(36);
    this.interactions.add(470, 148, 24, 'посмотреть подарки', () => {
      this.ui.dialogue([{ who: '', text: 'Горы коробок с бантами. Одна подписана: «Для кошек. От Люды». Остальные — для людей, но кошки не согласны.' }]);
    });

    addTint(this, worldW, worldH, 0xfff0c8, 0.14, Phaser.BlendModes.MULTIPLY);

    // a few guests for atmosphere (visually distinct NPCs, not tints)
    this.guests = [];
    [[100, 118, 'npc_guest1'], [180, 118, 'npc_guest2'],
     [300, 118, 'npc_guest3'], [380, 118, 'npc_lyuda']].forEach(([x, y, tex]) => {
      const g = new NPC(this, x, y, tex);
      g.dir = 'down';
      this.guests.push(g);
    });

    this.player = new Player(this, 40, 200);
    this.collidersReadyFor(this.player.sprite);
    this.npc = new NPC(this, this.archX + 10, 148, 'tamir');
    this.npc.dir = 'left';
    this.collidersReadyFor(this.npc.sprite);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setZoom(CFG.ZOOM);

    Audio.startAmbience('dusk');
    this.ui.fadeIn(600);

    this.lockInput();
    this.safeRun(() => this.introChoice());
  }

  async introChoice() {
    const pick = await this.ui.choice('Какой получилась свадьба?', [
      'Большая — полный зал родственников',
      'Маленькая — только самые близкие',
      'Почти спонтанная — списком гостей никто не занимался',
    ]);
    const styles = ['big', 'small', 'spontaneous'];
    GameState.flags.weddingStyle = styles[pick];
    const descriptions = [
      'Зал гудит от разговоров. Кто-то уже произносит третий тост, хотя церемония ещё не началась. Настя честно не помнит и половины гостей по именам — но её мама наконец перестала спрашивать, когда уже.',
      'Всего дюжина людей. Настя рада, что можно расслышать собственные мысли — и разглядеть лицо каждого, кто пришёл не по обязанности, а потому что действительно хотел быть здесь.',
      'Половина гостей узнала о свадьбе три дня назад. Как ни странно, это работает — меньше времени на то, чтобы придумать, чего бояться.',
    ];
    await this.ui.caption(descriptions[pick], 2600);
    this.unlockInput();
    this.ui.setQuest('Подойти к арке, где ждёт Тамир');

    this.interactions.add(this.archX + 10, 148, 34, 'встать рядом', () => {
      if (this.locked) return;
      this.safeRun(() => this.ceremony());
    });

    const guestLines = [
      'Дальний родственник, чьё имя Настя каждый раз забывает и каждый раз стесняется переспросить.',
      'Подруга ещё со студенчества. Уже готовит речь на случай, если её позовут к микрофону.',
      'Коллега Тамира — пришёл из вежливости, но, кажется, искренне рад.',
      'Люда с их старой лестничной клетки — примчалась, едва узнав дату. «Ни за что бы не пропустила».',
    ];
    this.guests.forEach((g, i) => {
      this.interactions.add(g.sprite.x, g.sprite.y, 26, 'поговорить с гостем', () => {
        if (this.locked) return;
        this.ui.dialogue([{ who: '', text: guestLines[i] }]);
      });
    });
  }

  async ceremony() {
    this.lockInput();
    this.interactions.clear();
    this.ui.clearQuest();

    this.player.moveToScripted(this.archX - 10, 148, null);
    await wait(this, 900);
    this.player.releaseScript();
    this.player.dir = 'right';
    this.player.playDir('idle');
    this.npc.dir = 'left';
    this.npc.playDir('idle');

    await this.ui.letterboxOn(600);
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(this.archX, 140, 900, 'Sine.easeInOut');
    cam.zoomTo(CFG.ZOOM + 1.3, 1600);
    Audio.startAmbience('night'); // the "noise" quietly drops away
    await wait(this, 1400);

    await this.ui.caption('Были клятвы, было кольцо на пальце рядом с другим, было «да» — на этот раз вслух, при свидетелях, под аплодисменты, которых оба почти не услышали.', 3200);
    await this.ui.caption('Шум вокруг становится тише. Музыка приглушается.', 2400);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Ну что?', mood: 'happy' },
      { who: 'Настя', text: 'Что?' },
      { who: 'Тамир', text: 'Мы это правда сделали.' },
      { who: '', text: 'Ни один из них потом не вспомнит свою клятву дословно. Зато это — «ну что» / «что» — они будут помнить оба, всегда, безошибочно. Совсем как то самое первое «ага» много лет назад.' },
      { who: 'Настя', text: 'Ты опять не можешь сказать ничего нормального в важный момент.' },
      { who: 'Тамир', text: 'Похоже, это уже традиция.' },
    ]);
    Audio.playChime();
    Audio.startMelody();
    await wait(this, 1200);

    cam.zoomTo(CFG.ZOOM, 1000);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    await this.ui.letterboxOff(500);
    Audio.stopMelody();

    GameState.flags.weddingDone = true;
    adjustRelationship({ closeness: 2, warmth: 2, trust: 1 });
    SaveSystem.save();

    await this.ui.fadeOut(900);
    GameState.flags.chapter2Complete = true;
    GameState.chapter = 'complete2';
    SaveSystem.save();

    await this.ui.chapterCard('КОНЕЦ ГЛАВЫ 2', 'Предложение • Свадьба', 3200);
    await this.ui.caption('Впереди — новая квартира, финансовые вопросы и разговор,\nкоторый начинается с "мне нужно тебе кое-что сказать".', 3400);

    Audio.stopAmbience(1.0);
    this.scene.start('YoungFamily');
  }
}
/* =====================================================================
   YoungFamilyScene — ЭТАП V: МОЛОДАЯ СЕМЬЯ + ФИНАНСОВЫЙ КРИЗИС + БЕРЕМЕННОСТЬ
   Three quiet beats in the same home: an ordinary rainy Monday, a hard
   conversation about money with no right answer, and — weeks later —
   the quietest scene in the whole story.
   ===================================================================== */
