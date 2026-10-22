class DateScene extends GameplayScene {
  constructor() { super('DateScene'); }

  create() {
    this.commonCreate();
    GameState.chapter = 'date';
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    const W = 36, H = 16, T = 16;
    const data = makeGrid(W, H, 0);
    fillRect(data, 0, 6, W - 1, 6, 3);
    fillRect(data, 0, 7, W - 1, 10, 2);
    [[4,2],[10,13],[16,2],[22,13],[28,2],[32,13]].forEach(([x,y]) => data[y][x] = 4);
    [[7,1],[13,14],[19,1],[25,14],[31,1]].forEach(([x,y]) => data[y][x] = 1);

    buildTilemap(this, data, 'tileset_outdoor', T, T);
    const worldW = W * T, worldH = H * T;
    this.physics.world.setBounds(0, 0, worldW, worldH);

    [40, 150, 260, 370, 480, 560].forEach((x) => {
      this.add.image(x, 30, 'tree').setOrigin(0.5, 1).setDepth(30);
      this.addCollider(x, 24, 20, 14);
    });
    [90, 210, 330, 450].forEach((x) => {
      this.add.image(x, 250, 'tree').setOrigin(0.5, 1).setDepth(250);
      this.addCollider(x, 236, 20, 14);
    });

    this.add.image(290, 128, 'bench').setOrigin(0.5, 1).setDepth(128);
    // ---- extra park decorations ----
    this.add.image(120, 36, 'bush').setOrigin(0.5, 1).setDepth(36);
    this.add.image(400, 36, 'bush').setOrigin(0.5, 1).setDepth(36);
    this.add.image(220, 190, 'fountain').setOrigin(0.5, 1).setDepth(190);
    this.addCollider(220, 182, 20, 12);
    this.add.image(500, 230, 'bicycle').setOrigin(0.5, 1).setDepth(230);
    this.addCollider(500, 224, 14, 8);
    this.add.image(60, 230, 'streetsign').setOrigin(0.5, 1).setDepth(230);
    this.interactions.add(220, 182, 24, 'посмотреть на фонтан', () => {
      this.ui.dialogue([{ who: '', text: 'В воде плавают монетки. На дне блестит одна, самая новая. Кто-то загадал желание и очень надеялся.' }]);
    });
    this.interactions.add(500, 224, 22, 'осмотреть велосипед', () => {
      this.ui.dialogue([{ who: '', text: 'Красный велосипед без замка. Хозяин, видимо, верит в людей. Приятная вера.' }]);
    });
    this.interactions.add(60, 226, 22, 'прочитать табличку', () => {
      this.ui.dialogue([{ who: '', text: '«Не кормить голубей». Под табличкой, конечно, сидит голубь. Уверенно так сидит.' }]);
    });

    addTint(this, worldW, worldH, 0xffb977, 0.16, Phaser.BlendModes.MULTIPLY);
    addTint(this, worldW, worldH, 0x3a2a55, 0.12, Phaser.BlendModes.ADD);

    this.player = new Player(this, 48, 160);
    this.collidersReadyFor(this.player.sprite);
    this.npc = new NPC(this, 280, 128, 'tamir');
    this.npc.dir = 'left';
    this.collidersReadyFor(this.npc.sprite);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setZoom(CFG.ZOOM);

    Audio.startAmbience('dusk');

    this.metPoint = this.interactions.add(280, 128, 34, 'подойти', () => {
      if (this.locked) return;
      this.safeRun(() => this.startDates());
    });

    this.interactions.add(64, 32, 26, 'понюхать цветы', () => {
      this.ui.dialogue([{ who: '', text: 'Клумба у самой дорожки. Пахнет чем-то простым и летним.' }]);
    });
    this.interactions.add(150, 30, 24, 'посмотреть на дерево', () => {
      this.ui.dialogue([{ who: '', text: 'Под этим деревом наверняка сидела половина города — скамейка выточена временем и чужими разговорами.' }]);
    });
    this.interactions.add(450, 250, 24, 'покормить голубей', () => {
      this.ui.dialogue([{ who: '', text: 'Голуби сбегаются мгновенно и с большим достоинством делают вид, что им всё равно.' }]);
    });

    this.ui.fadeIn(600);
    this.ui.setQuest('Подойти к Тамиру на скамейке');
    this.ui.caption('Парк. Настя знает — Тамир уже здесь.', 2000);
  }

  async startDates() {
    this.lockInput();
    this.interactions.clear();
    this.ui.clearQuest();
    this.npc.faceTowards(this.player.sprite.x, this.player.sprite.y);

    await this.ui.caption('Первое свидание.', 1600);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Я взял на всякий случай два кофе. Вдруг тебе не понравится один.' },
      { who: 'Настя', text: 'А если мне не понравятся оба?' },
      { who: 'Тамир', text: 'Тогда у меня будет повод прийти в третий раз.' },
      { who: 'Настя', text: 'А почему не второй?' },
      { who: 'Тамир', text: 'Второй я уже приготовил заранее. Я оптимист, но не идиот.' },
      { who: '', text: 'Она смеётся — по-настоящему, не из вежливости. И сама немного удивляется этому.' },
    ]);

    await this.ui.caption('Потом второе. Уже не про кофе — про паузы, в которые оба боятся сказать лишнее.', 2800);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Кстати. Вчера в переписке — ты там с кем-то долго смеялась. Кто это был?' },
    ]);
    const pick = await this.ui.choice('Спросил слишком нарочито небрежно.', [
      'Честно рассказать — это был просто коллега',
      'Отшутиться и сменить тему',
    ]);
    if (pick === 0) {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Это был Игорь с работы. Прислал мем, я не сдержалась.' },
        { who: 'Тамир', text: 'Уф. Ладно, живи.' },
        { who: 'Настя', text: 'Ты правда переживал?' },
        { who: '', text: 'Пауза чуть дольше, чем нужна для шутки.' },
        { who: 'Тамир', text: 'Немного. Не люблю, когда не понимаю, что происходит. Это не про тебя — это про меня.' },
        { who: '', text: 'Она запоминает это признание. Оно скажет ей о нём больше, чем следующие три свидания вместе взятые.' },
      ]);
      adjustRelationship({ trust: 1 });
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'О, ты что, ревнуешь?' },
        { who: 'Тамир', text: 'Ни капли. Просто веду учёт.' },
        { who: 'Настя', text: 'Веди тише. Мне нравится держать хоть что-то в тайне.' },
        { who: '', text: 'Она не ответила на самом деле. Ни ему, ни себе.' },
      ]);
      adjustRelationship({ warmth: 1 });
    }

    await this.ui.caption('Потом третье.', 1500);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Знаешь, обычно я не так много говорю с людьми.' },
      { who: 'Настя', text: 'А со мной?' },
      { who: 'Тамир', text: 'А с тобой почему-то не могу остановиться. Даже когда понимаю, что несу ерунду.' },
      { who: 'Настя', text: 'Это не ерунда.' },
      { who: 'Тамир', text: 'Ты ещё не слышала мою теорию про голубей.' },
      { who: 'Настя', text: 'Очень хочу дослушать. Всю жизнь, если понадобится.' },
      { who: '', text: 'Она произносит это как шутку. И слышит собственный голос — на секунду сама удивляясь, насколько не шутит.' },
    ]);

    GameState.flags.firstDateDone = true;
    SaveSystem.save();
    await this.kissScene();
  }

  async kissScene() {
    const cam = this.cameras.main;
    await this.ui.letterboxOn(500);
    cam.stopFollow();
    cam.pan(this.npc.sprite.x - 10, this.npc.sprite.y - 6, 900, 'Sine.easeInOut');
    cam.zoomTo(CFG.ZOOM + 1.1, 1400);
    this.player.moveToScripted(this.npc.sprite.x - 14, this.npc.sprite.y, () => {});
    await wait(this, 1500);

    await this.ui.caption('Между «мне пора» и этим мгновением — если считать честно — три свидания и один разговор о голубях. Не так уж мало для того, что сейчас происходит.', 3400);
    await this.ui.caption('Без лишних слов. Без музыки на полную громкость.', 2400);
    await this.ui.caption('Просто пауза. Тишина. Только двое.', 2400);
    Audio.playChime();
    Audio.startMelody();
    await wait(this, 900);
    await this.ui.caption('Потом кто-то из них тихо смеётся — так и не выяснится, кто первый. Не потому что смешно. Потому что страшно и хорошо одновременно.', 3000);
    if (GameState.relationship.warmth >= 4) {
      await this.ui.caption('Это не первый раз, когда между ними так легко. Но именно сейчас, кажется, легко станет насовсем.', 2600);
    } else {
      await this.ui.caption('Ей не всегда даётся так просто — быть настолько открытой. Сейчас, на удивление, далось.', 2600);
    }

    cam.zoomTo(CFG.ZOOM, 900);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.player.releaseScript();
    await this.ui.letterboxOff(400);
    Audio.stopMelody();

    GameState.flags.firstKissDone = true;
    adjustRelationship({ closeness: 2, warmth: 1 });
    SaveSystem.save();

    await this.ui.fadeOut(700);
    await this.ui.caption('Через несколько месяцев они решают куда-то поехать вместе.', 2400);

    GameState.chapter = 'trip';
    SaveSystem.save();
    this.scene.start('TripScene');
  }
}
/* =====================================================================
   TripScene — ЭТАП II (часть B): ПЕРВАЯ ПОЕЗДКА
   A hilltop overlook at night. Quiet, cinematic, almost no dialogue —
   the exact scripted exchange from the design doc plus a short
   free-roam beat by the fire afterwards.
   ===================================================================== */
