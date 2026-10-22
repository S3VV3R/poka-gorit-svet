class ProposalScene extends GameplayScene {
  constructor() { super('Proposal'); }

  create() {
    this.commonCreate();
    GameState.chapter = 'proposal';
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    const W = 20, H = 13, T = 16;
    const worldW = W*T, worldH=H*T;
    this.worldW=worldW; this.worldH=worldH; this._compactHome=true; this.homeZoom=CFG.ZOOM;
    const data=makeGrid(W,H,3);
    fillRect(data,1,1,W-2,H-2,0);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x+=2)data[y][x]=1;
    
    
    
    fillRect(data,12,7,16,10,2);fillRect(data,3,0,5,0,4);
    buildTilemap(this,data,'tileset_interior',T,T);
    
    this.physics.world.setBounds(16, 16, worldW - 32, worldH - 32);

    this.addCollider(worldW / 2, 8, worldW - 16, 16);
    this.addCollider(worldW / 2, worldH - 8, worldW - 16, 16);
    this.addCollider(8, worldH / 2, 16, worldH - 16);
    this.addCollider(worldW - 8, worldH / 2, 16, worldH - 16);

    this.add.image( 52, 65.5, 'counter').setScale(0.86).setOrigin(0.5, 1).setDepth(65.5);
    this.addCollider( 52, 59.08, 39.27, 14.67);
    this.add.image( 84.73, 65.5, 'stove').setScale(0.86).setOrigin(0.5, 1).setDepth(65.5);
    this.addCollider( 84.73, 59.08, 13.09, 14.67);
    this.add.image( 105.18, 72.83, 'fridge').setScale(0.86).setOrigin(0.5, 1).setDepth(72.83);
    this.addCollider( 105.18, 61.83, 14.73, 20.17);
    this.add.image( 232, 148, 'couch').setScale(0.86).setOrigin(0.5, 1).setDepth(148);
    this.addCollider( 232, 142.5, 32.73, 11);
    this.add.image( 191.09, 152.58, 'plant').setScale(0.86).setOrigin(0.5, 1).setDepth(152.58);
    this.addCollider( 191.09, 146.17, 9.82, 9.17);
    this.add.image( 125.64, 93, 'table').setScale(0.86).setOrigin(0.5, 1).setDepth(93);
    this.addCollider( 125.64, 87.5, 26.18, 9.17);
    // ---- extra proposal-room decorations ----
    this.add.image( 281.09, 184.67, 'tv').setScale(0.86).setOrigin(0.5, 1).setDepth(184.67);
    this.addCollider( 281.09, 179.17, 19.64, 9.17);
    this.add.image( 272.91, 203, 'rug_round').setScale(0.86).setOrigin(0.5, 1).setDepth(2);
    this.interactions.add( 281.09, 179.17, 28, 'выключить телевизор', () => {
      this.ui.dialogue([{ who: '', text: 'Экран тёмный. Сегодня вечером смотреть будем друг на друга.' }]);
    });

    addTint(this, worldW, worldH, 0xffd9a0, 0.10, Phaser.BlendModes.MULTIPLY);

    this.player = new Player(this, 64.27, 83.83);
    this.player.dir = 'up';
    this.collidersReadyFor(this.player.sprite);
    this.npc = new NPC(this, 248.36, 175.5, 'tamir');
    this.npc.dir = 'up';
    this.collidersReadyFor(this.npc.sprite);

    this.mars = new Cat(this, 207.45, 138.83, 'mars');
    this.cats.push(this.mars);
    this.collidersReadyFor(this.mars.sprite);
    this.abilka = new Cat(this, 166.55, 166.33, 'abilka');
    this.cats.push(this.abilka);
    this.collidersReadyFor(this.abilka.sprite);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    cam.setZoom(CFG.ZOOM);

    Audio.startAmbience('home');
    this.ui.fadeIn(600);
    this.ui.setQuest('Готовить ужин у плиты');
    this.ui.caption('Обычный вечер. Ничего не предвещает.', 2200);

    this.cookPoint = this.interactions.add( 84.73, 59.08, 30, 'готовить ужин', () => {
      if (this.locked) return;
      this.safeRun(() => this.proposalScene());
    });
    this.interactions.add( 232, 142.5, 28, 'посидеть на диване', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Диван продавлен ровно под них двоих — за столько вечеров он успел запомнить форму.' }]);
    });
    this.interactions.add( 191.09, 146.17, 22, 'посмотреть на цветок', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Цветок пережил два переезда и одну зиму без отопления. Настоящий боец.' }]);
    });
    this.interactions.add( 125.64, 87.5, 26, 'поправить скатерть', () => {
      if (this.locked) return;
      this.ui.dialogue([{ who: '', text: 'Стол накрыт — почти празднично, хотя формального повода вроде бы нет. Пока нет.' }]);
    });
  }

  tick() {
    if (this.mars) this.mars.wander({ x: 117.45, y: 83.83, w: 130.91, h: 82.5 });
    if (this.abilka) this.abilka.wander({ x: 117.45, y: 83.83, w: 130.91, h: 82.5 });
  }

  async proposalScene() {
    this.lockInput();
    this.interactions.clear();
    this.ui.clearQuest();
    Audio.startAmbience('home');

    await this.ui.dialogue([
      { who: '', text: 'Настя стоит у плиты. Пахнет чем-то простым и домашним.' },
    ]);

    let npcArrived = false;
    this.npc.moveTo( 76.55, 83.83, () => { npcArrived = true; });
    const arriveDeadline = this.time.now + 5000;
    while (!npcArrived && this.time.now < arriveDeadline) { await wait(this, 100); }
    this.npc.playDir('idle');

    await this.ui.dialogue([
      { who: '', text: 'Она слышит, что он подошёл, ещё до того, как он заговорил — за два года выучила звук его шагов наизусть, даже не заметив, когда это случилось.' },
    ]);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Настя.' },
      { who: 'Настя', text: 'М?' },
      { who: 'Тамир', text: 'Подожди секунду.' },
      { who: '', text: 'Она оборачивается. Он нервничает — не знает, куда деть руки.' },
      { who: 'Тамир', text: 'Я не придумал нормальной речи.', mood: 'worried' },
      { who: '', text: 'Он писал её три раза. Каждый раз получалось слишком гладко, слишком похоже на кино — а хотелось сказать что-то настоящее, даже если настоящее звучит нескладно.' },
      { who: '', text: 'Настя начинает улыбаться.' },
      { who: 'Настя', text: 'Уже заметно.' },
      { who: '', text: 'Он смеётся. Достаёт кольцо — и на секунду сам удивляется, что рука не дрожит, хотя внутри всё наоборот.' },
    ]);

    await this.ui.letterboxOn(500);
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan((this.player.sprite.x + this.npc.sprite.x) / 2, (this.player.sprite.y + this.npc.sprite.y) / 2 - 6, 700, 'Sine.easeInOut');
    cam.zoomTo(CFG.ZOOM + 1.2, 1200);
    await wait(this, 1000);

    const pick = await this.ui.choice('Настя не может произнести ни слова. Что выражает её лицо?', [
      'Слёзы и улыбка одновременно',
      'Смех — от неожиданности и облегчения',
      'Долгая, оглушительная тишина, а потом просто кивок',
    ]);
    const reactions = [
      'Она смеётся и плачет одновременно, и оба делают вид, что не замечают ни того, ни другого.',
      'Она хохочет так, что соседи наверняка всё слышат. Марс тут же прибегает проверить, что случилось.',
      'Она молчит секунд десять — целую вечность для него. Потом просто кивает.',
    ];
    await this.ui.dialogue([{ who: '', text: reactions[pick] }]);
    await this.ui.dialogue([
      { who: '', text: 'Это не решение, принятое за секунду, хотя со стороны выглядит именно так. Это ответ, который она носила с собой уже какое-то время — просто ждала вопроса.' },
      { who: 'Настя', text: 'Да. Да, конечно да.', mood: 'happy' },
    ]);

    Audio.playChime();
    Audio.startMelody();
    cam.zoomTo(CFG.ZOOM, 900);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    await this.ui.letterboxOff(400);
    Audio.stopMelody();

    GameState.flags.proposalDone = true;
    adjustRelationship({ closeness: 2, trust: 1 });
    SaveSystem.save();

    await this.ui.fadeOut(800);
    await this.ui.caption('Дальше — недели звонков, списков гостей и споров о цвете салфеток.', 2600);

    GameState.chapter = 'wedding';
    SaveSystem.save();
    this.scene.start('Wedding');
  }
}
/* =====================================================================
   WeddingScene — ЭТАП IV: СВАДЬБА (часть B — сама свадьба)
   The scale of the wedding is the player's choice; the feeling
   underneath it is always the same — noise fading to just the two
   of them for a moment.
   ===================================================================== */
