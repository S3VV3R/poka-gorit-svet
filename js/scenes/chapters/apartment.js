class ApartmentScene extends GameplayScene {
  constructor() { super('Apartment'); }

  create() {
    GameState.flags.movedInTogether = true;
    this.commonCreate();
    GameState.chapter = 'apartment';
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    const W = 22, H = 14, T = 16;
    const worldW = W*T, worldH=H*T;
    this.worldW=worldW; this.worldH=worldH; this._compactHome=true; this.homeZoom=CFG.ZOOM;
    const data=makeGrid(W,H,3);
    fillRect(data,1,3,W-2,H-2,0);
    for(let y=3;y<H-1;y++)for(let x=1;x<W-1;x+=2)data[y][x]=1;
    fillRect(data,1,3,6,H-2,5); fillRect(data,8,0,14,1,6); fillRect(data,10,2,12,2,7);
    
    
    
    buildTilemap(this,data,'tileset_interior',T,T);
    this.add.rectangle(121.26,80,8.42,64,0x403b38).setDepth(20); this.add.rectangle(121.26,172,8.42,72,0x403b38).setDepth(20);
    this.add.rectangle(239.16,80,8.42,64,0x403b38).setDepth(20); this.add.rectangle(239.16,172,8.42,72,0x403b38).setDepth(20);
    this.physics.world.setBounds(16, 0, worldW - 32, worldH - 16);

    // ---- structural colliders ----
    this.addCollider( 91.79, 46, 151.58, 12);   // top wall, left of balcony door
    this.addCollider( 268.63, 46, 134.74, 12);   // top wall, right of balcony door
    this.addCollider( 66.53, 22, 101.05, 36);   // solid block above the kitchen (no balcony there)
    this.addCollider( 289.68, 22, 92.63, 36);   // solid block above the bedroom (no balcony there)
    this.addCollider( 121.26, 82, 8.42, 60);   // kitchen|living divider, above door
    this.addCollider( 121.26, 172, 8.42, 72);   // kitchen|living divider, below door
    this.addCollider( 239.16, 82, 8.42, 60);   // living|bedroom divider, above door
    this.addCollider( 239.16, 172, 8.42, 72);   // living|bedroom divider, below door
    this.addCollider( 176, 214, 320, 12);  // bottom wall
    this.addCollider( 8, 130, 8.42, 180);    // left wall
    this.addCollider( 340.21, 130, 8.42, 180);  // right wall

    // ---- kitchen furniture (each with its own fitted collider) ----
    this.add.image( 44.42, 79, 'counter').setScale(0.86).setOrigin(0.5, 1).setDepth(79);
    this.addCollider( 44.42, 73, 25.26, 12);
    this.add.image( 65.47, 79, 'stove').setScale(0.86).setOrigin(0.5, 1).setDepth(79);
    this.addCollider( 65.47, 73, 8.42, 12);
    this.add.image( 81.26, 85, 'fridge').setScale(0.86).setOrigin(0.5, 1).setDepth(85);
    this.addCollider( 81.26, 76, 9.47, 16.5);
    this.add.image( 39.16, 161.5, 'table').setScale(0.86).setOrigin(0.5, 1).setDepth(161.5);
    this.addCollider( 39.16, 157, 16.84, 7.5);
    this.dishesSprite = this.add.image( 44.42, 70, 'dishes_dirty').setScale(0.86).setOrigin(0.5, 1).setDepth(79.75);

    // ---- living room ----
    this.add.image( 176, 169, 'couch').setScale(0.86).setOrigin(0.5, 1).setDepth(169);
    this.addCollider( 176, 164.5, 21.05, 9);
    this.add.image( 147.05, 170.5, 'plant').setScale(0.86).setOrigin(0.5, 1).setDepth(170.5);
    this.addCollider( 147.05, 166, 6.32, 7.5);
    // ---- extra apartment decorations ----
    this.add.image( 44.42, 52, 'kitchen_shelf').setScale(0.86).setOrigin(0.5, 1).setDepth(49.75);
    this.add.image( 176, 142, 'tv').setScale(0.86).setOrigin(0.5, 1).setDepth(142);
    this.addCollider( 176, 137.5, 12.63, 7.5);
    this.add.image( 323.37, 154, 'bookshelf').setScale(0.86).setOrigin(0.5, 1).setDepth(154);
    this.addCollider( 323.37, 142, 14.74, 12);
    this.add.image( 260.21, 199, 'rug_round').setScale(0.86).setOrigin(0.5, 1).setDepth(2);
    this.interactions.add( 176, 137.5, 28, 'включить телевизор', () => {
      this.ui.dialogue([
        { who: 'Тамир', text: 'Там опять какое-то кулинарное шоу.', mood: 'neutral' },
        { who: 'Настя', text: 'Давай посмотрим, как люди ругаются из-за соуса. Это успокаивает.', mood: 'happy' },
        { who: 'Тамир', text: 'Мы дома. Я до сих пор не привык к этому слову.', mood: 'happy' },
      ]);
    });
    this.interactions.add( 323.37, 142, 30, 'порыться на книжной полке', () => {
      this.ui.dialogue([
        { who: '', text: 'Половина книг — Настины, половина — Тамира. Корешки уже перемешались, и никто не помнит, где чьё.' },
        { who: 'Настя', text: 'Между «Мастером и Маргаритой» и справочником по сетям. Идеально.', mood: 'happy' },
      ]);
    });
    this.boxSprite = this.add.image( 207.58, 116.5, 'box').setScale(0.86).setOrigin(0.5, 1).setDepth(116.5);
    this.boxCollider = this.addCollider( 207.58, 112.75, 8.42, 9);

    // ---- bedroom ----
    this.add.image( 291.79, 176.5, 'bed').setScale(0.86).setOrigin(0.5, 1).setDepth(176.5);
    this.addCollider( 291.79, 161.5, 21.05, 15);

    // ---- balcony decoration ----
    this.buildApartmentBalcony();

    addTint(this, worldW, worldH, 0xffd9a0, 0.10, Phaser.BlendModes.MULTIPLY);

    this.player = new Player(this, 39.16, 184);
    this.collidersReadyFor(this.player.sprite);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setZoom(CFG.ZOOM);

    Audio.startAmbience('home');
    this.ui.fadeIn(600);
    this.ui.setQuest('Заглянуть на кухню — там явно копится проблема');
    this.ui.caption('Их первая общая квартира. Маленькая. Своя.', 2200);

    this.setupInteractions();
  }

  buildApartmentBalcony() {
    // One continuous outdoor nook, with an open central doorway and no curtains.
    // Local pixel-art coordinates keep its rails, decking and furniture aligned.
    const compact = !!this._compactHome;
    const left = compact ? 120 : 208, sx = compact ? 1 : 2, sy = compact ? 1 : 1.2;
    const art = this.add.graphics().setPosition(left, 0).setScale(sx, sy).setDepth(1);
    const rect = (color, x, y, w, h) => art.fillStyle(color, 1).fillRect(x, y, w, h);
    rect(0x302f30, 0, 0, 120, 40);
    rect(0x505052, 3, 13, 114, 25);
    for (let y = 14; y < 38; y += 6) {
      rect(0x73706a, 4, y, 112, 4);
      rect(0x8a847a, 4, y, 112, 1);
      for (let x = 12 + (y % 12 ? 0 : 14); x < 115; x += 28) rect(0x4a4946, x, y, 1, 4);
    }
    // Back railing: a dark opening between slim pale bars, firmly on the slab.
    rect(0x20262c, 3, 2, 114, 11);
    for (let x = 6; x < 118; x += 10) { rect(0x9c9d98, x, 3, 2, 11); rect(0xd0cec5, x, 3, 1, 11); }
    rect(0xbbb6aa, 2, 2, 116, 2);
    rect(0x3d3f40, 2, 13, 116, 2);
    // Side cheeks and sill. The 32-pixel central opening remains clear.
    rect(0xaaa396, 0, 3, 3, 37); rect(0xaaa396, 117, 3, 3, 37);
    rect(0x3b3835, 0, 38, 48, 3); rect(0x3b3835, 80, 38, 40, 3);
    rect(0xc0b7a4, 48, 38, 32, 2);
    // A low bench and a little tea table on the left.
    rect(0x35312d, 11, 22, 20, 12); rect(0x9b8164, 11, 21, 20, 4);
    rect(0xb69a76, 13, 26, 16, 4); rect(0x5d4c3c, 13, 30, 3, 5); rect(0x5d4c3c, 26, 30, 3, 5);
    rect(0x3b332c, 35, 29, 9, 5); rect(0xc2a37a, 33, 25, 13, 5);
    rect(0xe8dfc9, 36, 23, 3, 3); rect(0x73624d, 37, 23, 1, 1);
    rect(0xd5cfbe, 41, 24, 2, 2);
    // Planter on the right, away from the route through the door.
    rect(0x403a32, 98, 27, 12, 7); rect(0x987757, 97, 26, 14, 3);
    rect(0x466052, 101, 18, 3, 9); rect(0x6f8060, 96, 19, 7, 4);
    rect(0x85936d, 103, 16, 7, 4); rect(0x566f56, 104, 22, 9, 3);
    this.addCollider(left + 27 * sx, 29 * sy, 38 * sx, 12 * sy);
    this.addCollider(left + 104 * sx, 30 * sy, 14 * sx, 8 * sy);
    this.addCollider(left + 60 * sx, 6 * sy, 120 * sx, 8 * sy);
  }

  setupInteractions() {
    this.dishesPoint = this.interactions.add( 44.42, 73, 34, 'посмотреть на посуду', () => {
      if (this.locked) return;
      if (!GameState.flags.dishesResolved) this.safeRun(() => this.dishesScene());
      else this.ui.dialogue([{ who: '', text: 'Посуда чистая и сложена аккуратной стопкой.' }]);
    });

    this.interactions.add( 39.16, 157, 30, 'выпить чаю', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Две почти одинаковые кружки. Одна чуть сколота — Настина любимая.' }]);
    });

    this.boxPoint = this.interactions.add( 207.58, 112.75, 30, 'открыть коробку', () => {
      if (this.locked) return;
      if (!GameState.flags.dishesResolved) {
        this.ui.dialogue([{ who: '', text: 'Ещё не время. Сначала разобраться со своими делами на кухне.' }]);
        return;
      }
      if (!GameState.flags.marsHome) this.safeRun(() => this.boxScene());
    });

    this.interactions.add( 181.26, 37, 26, 'выйти на балкон', () => {
      if (this.locked) return;
      if (GameState.flags.marsHome && GameState.flags.abilkaHome) this.safeRun(() => this.endingScene());
      else this.ui.dialogue([{ who: '', text: 'Тихий вечер. Отсюда виден весь двор.' }]);
    });

    this.interactions.add( 176, 164.5, 30, 'сесть на диван', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Диван продавлен ровно в двух местах — их любимых. Идеально по размеру для двоих.' }]);
    });
    this.interactions.add( 147.05, 166, 24, 'полить цветок', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Цветок в целом справляется сам, но немного внимания ему точно не повредит.' }]);
    });
    this.interactions.add( 81.26, 76, 24, 'заглянуть в холодильник', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Как обычно — что-то из вчерашнего, полбанки соуса и уверенность, что завтра точно дойдут руки до магазина.' }]);
    });
    this.interactions.add( 128.63, 79, 40, 'рассмотреть стену', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Стена почти пустая — пара гвоздей без картин и одно пятно от старого календаря. Со временем здесь точно что-то появится.' }]);
    });
  }

  async dishesScene() {
    this.lockInput();
    this.ui.clearQuest();
    await this.ui.dialogue([
      { who: '', text: 'Гора посуды в раковине смотрит укоризненно уже третий день.' },
    ]);
    await this.ui.dialogue([
      { who: '', text: 'Это, конечно, не про посуду. Это про то, кто в этой квартире замечает, что нужно сделать, а кто ждёт, пока заметят за него. Вслух об этом говорить труднее.' },
    ]);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Я хотел помыть.' },
      { who: 'Настя', text: 'Когда?' },
      { who: 'Тамир', text: 'Сегодня.' },
      { who: 'Настя', text: 'Сегодня уже завтра.' },
      { who: '', text: 'Пауза.' },
      { who: 'Тамир', text: 'Справедливо.' },
      { who: '', text: 'Она пытается не засмеяться.' },
      { who: '', text: 'Смех получается настоящий — и злость, которая копилась три дня, вдруг оказывается меньше, чем казалась.' },
    ]);

    const pick = await this.ui.choice('Как отреагировать?', [
      'Улыбнуться и молча сунуть ему полотенце',
      'Съязвить в ответ, но всё равно взяться мыть вместе',
    ]);
    GameState.flags.dishesResolved = pick === 0 ? 'laughed' : 'sharp';
    if (pick === 0) {
      await this.ui.dialogue([
        { who: '', text: 'Она суёт ему полотенце. Он вздыхает и всё же моет.' },
        { who: 'Тамир', text: 'Ты специально коллекционируешь мои слабые места?' },
        { who: 'Настя', text: 'Веду учёт. На будущее.' },
        { who: '', text: '«На будущее» вырывается не подумав. Слово повисает в воздухе дольше, чем она ожидала: будущее здесь уже не абстракция, а то, что они строят прямо сейчас, тарелка за тарелкой.' },
      ]);
      adjustRelationship({ warmth: 1 });
    } else {
      await this.ui.dialogue([
        { who: 'Настя', text: 'Ты вообще знаешь, где у нас губка?' },
        { who: 'Тамир', text: 'Это уже личное.' },
        { who: 'Настя', text: 'Так и думала. Подвинься, покажу.' },
        { who: '', text: 'Они моют посуду вдвоём в неловком, почти сердитом молчании — и это молчание почему-то надёжнее многих слов.' },
      ]);
      adjustRelationship({ closeness: 1 });
    }

    this.dishesSprite.setTexture('dishes_clean');
    Audio.playChime();
    SaveSystem.save();
    this.unlockInput();

    await wait(this, 400);
    await this.ui.caption('Через пару дней в квартире появляется коробка.', 2200);
    this.boxSprite.setVisible(true);
    this.ui.setQuest('Открыть коробку в гостиной');
  }

  async boxScene() {
    this.lockInput();
    this.ui.clearQuest();
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Только не пугайся.' },
      { who: 'Настя', text: 'Это звучит ровно как повод испугаться.' },
    ]);
    this.boxSprite.setTexture('box_open');
    if (this.boxCollider) { this.boxCollider.destroy(); this.boxCollider = null; }
    Audio.playPurr();

    this.mars = new Cat(this, 207.58, 115, 'mars');
    this.mars.dir = 'down';
    this.cats.push(this.mars);
    this.collidersReadyFor(this.mars.sprite);

    await this.ui.dialogue([
      { who: '', text: 'Рыжий комок выпрыгивает наружу и тут же осматривает территорию так,\nбудто квартира всегда принадлежала ему.' },
      { who: 'Тамир', text: 'Знакомься. Марс.' },
      { who: 'Настя', text: 'Он уже забрался на диван.' },
      { who: 'Тамир', text: 'Да, это тоже часть знакомства.' },
    ]);

    GameState.flags.marsHome = true;
    adjustRelationship({ warmth: 1 });
    SaveSystem.save();
    this.unlockInput();

    this.mars.moveTo( 176, 169);

    await wait(this, 500);
    this.spawnNeighbor();

    await wait(this, 600);
    await this.ui.caption('Через неделю в доме появляется кто-то ещё — незаметно, тихо.', 2400);
    this.abilkaPoint = this.interactions.add( 289.16, 169, 32, 'сесть у кровати', () => {
      if (this.locked) return;
      this.safeRun(() => this.abilkaScene());
    });
    this.ui.setQuest('В спальне кто-то прячется у кровати — присмотреться');
  }

  // ---- a small living NPC: the neighbour, dropping by after Марс arrives ----
  spawnNeighbor() {
    if (this.neighbor) return;
    this.neighbor = new NPC(this, 129.68, 124, 'npc_lyuda');
    this.neighbor.dir = 'left';
    this.collidersReadyFor(this.neighbor.sprite);
    this.neighborTalked = false;
    this.neighborPoint = this.interactions.add( 129.68, 124, 30, 'поговорить с соседкой', () => {
      if (this.locked) return;
      this.safeRun(() => this.talkToNeighbor());
    });
  }

  async talkToNeighbor() {
    this.lockInput();
    if (!this.neighborTalked) {
      this.neighborTalked = true;
      await this.ui.dialogue([
        { who: 'Люда (соседка)', text: 'Ой, а у вас тоже кто-то шуршит теперь? Слышу через стену — то ли мышь, то ли зверь размером с чемодан.' },
        { who: 'Настя', text: 'Это Марс. Он не шуршит, он топает.' },
        { who: 'Люда (соседка)', text: 'А, ну тогда ладно. У вас хоть свой. А у меня в вентиляции — загадка без имени.' },
      ]);
    } else {
      await this.ui.dialogue([
        { who: 'Люда (соседка)', text: 'Если ваш рыжий опять придёт разведывать мой балкон — я не против, если честно.' },
      ]);
    }
    this.unlockInput();
  }

  async abilkaScene() {
    this.lockInput();
    this.ui.clearQuest();
    this.interactions.remove(this.abilkaPoint);
    this.player.moveToScripted( 289.16, 172, null);
    await wait(this, 900);
    this.player.releaseScript();
    this.player.locked = true;

    await this.ui.dialogue([
      { who: '', text: 'Настя садится на пол у кровати. Не пытается вытащить кота.\nПросто сидит.' },
    ]);
    await this.ui.dialogue([
      { who: '', text: 'Она умеет ждать, когда дело того стоит — это она понимает про себя только сейчас, замечая, что сама не двигалась уже несколько минут.' },
    ]);
    await wait(this, 1600);
    await this.ui.dialogue([
      { who: '', text: 'Где-то под кроватью тишина меняет тон — уже не испуганная, а просто осторожная.' },
    ]);
    await wait(this, 800);

    this.abilka = new Cat(this, 298.11, 181, 'abilka');
    this.abilka.sprite.setAlpha(0);
    this.cats.push(this.abilka);
    this.collidersReadyFor(this.abilka.sprite);
    this.tweens.add({ targets: this.abilka.sprite, alpha: 1, duration: 800 });
    this.abilka.moveTo( 289.68, 172);
    Audio.playPurr();

    await wait(this, 1400);

    GameState.flags.abilkaHome = true;
    adjustRelationship({ closeness: 1, warmth: 1 });
    SaveSystem.save();
    this.unlockInput();
    await this.ui.caption('Через несколько минут Абилка сама выходит и садится рядом.', 2400);
    await this.ui.caption('Настя не гладит её сразу. Просто позволяет находиться рядом. Кажется, это и было нужно всё это время — не ласка, а право не убегать.', 3000);
    this.ui.setQuest('Выйти на балкон и выдохнуть');
  }

  async endingScene() {
    this.lockInput();
    this.ui.clearQuest();
    await this.ui.fadeOut(900);
    GameState.flags.chapter1Complete = true;
    GameState.chapter = 'proposal';
    SaveSystem.save();

    await this.ui.caption('Прошёл год с их первой встречи.', 2200);
    await this.ui.caption('Марс и Абилка теперь тоже часть этой квартиры.', 2400);
    await this.ui.chapterCard('КОНЕЦ ГЛАВЫ 1', 'Знакомство • Начало отношений • Совместная жизнь', 3000);
    await this.ui.caption('Проходит ещё какое-то время. Обычные вечера. Один из них запомнится больше остальных.', 3000);

    Audio.stopAmbience(1.2);
    this.scene.start('Proposal');
  }

  tick(time, delta) {
    if (this.mars) this.mars.wander({ x: 128.63, y: 146.5, w: 94.74, h: 45 });
    if (this.abilka) this.abilka.wander({ x: 249.68, y: 146.5, w: 78.95, h: 45 });
  }
}
/* =====================================================================
   ProposalScene — ЭТАП IV: СВАДЬБА (часть A — предложение)
   A quiet, ordinary evening at home. Настя is cooking. Тамир has
   something in his pocket he's been carrying around for two weeks.
   ===================================================================== */
