class TripScene extends GameplayScene {
  constructor() { super('TripScene'); }

  create() {
    this.commonCreate();
    GameState.chapter = 'trip';
    SaveSystem.save();
    if (this.ui) this.ui.saveToast('Прогресс сохранён');

    const worldW = 480, worldH = 224;
    const sky = this.add.image(0, 0, 'overlook_sky').setOrigin(0, 0).setDepth(-100);
    sky.setDisplaySize(worldW, worldH);

    const groundW = 30, groundH = 5;
    const data = makeGrid(groundW, groundH, 2);
    fillRect(data, 0, 0, groundW - 1, 0, 3);
    const built = buildTilemap(this, data, 'tileset_park', 16, 16);
    built.layer.y = worldH - groundH * 16;
    built.layer.setDepth(-50);

    this.physics.world.setBounds(0, worldH - 60, worldW, 60);

    this.add.image(70, worldH - 8, 'rock').setOrigin(0.5, 1).setDepth(500);
    this.add.image(390, worldH - 6, 'suitcase').setOrigin(0.5, 1).setDepth(500);
    const fireX = 250, fireY = worldH - 10;
    this.fire = this.add.sprite(fireX, fireY, 'campfire', 0).setOrigin(0.5, 1).setDepth(fireY);
    this.fire.play('campfire_burn');
    addGlow(this, fireX, fireY - 14, 1.6);
    this.addCollider(fireX, fireY - 6, 16, 10);

    this.player = new Player(this, fireX - 26, fireY + 2);
    this.player.dir = 'right';
    this.collidersReadyFor(this.player.sprite);
    this.npc = new NPC(this, fireX + 26, fireY + 2, 'tamir');
    this.npc.dir = 'left';
    this.collidersReadyFor(this.npc.sprite);

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.setZoom(CFG.ZOOM);
    cam.scrollX = fireX - CFG.WIDTH / (2 * CFG.ZOOM);
    cam.scrollY = 0;

    Audio.startAmbience('night');

    this.lockInput();
    this.safeRun(() => this.introCutscene());
  }

  async introCutscene() {
    this.ui.fadeRect.setAlpha(1);
    await this.ui.letterboxOn(0);
    const cam = this.cameras.main;
    this.ui.fadeIn(900);
    await wait(this, 300);
    this.tweens.add({
      targets: cam, scrollY: Math.max(0, this.physics.world.bounds.y - 60), duration: 1800, ease: 'Sine.easeInOut',
    });
    await wait(this, 1900);
    cam.startFollow(this.player.sprite, true, 0.1, 0.1);
    cam.setZoom(CFG.ZOOM);

    await this.ui.caption('Тишина здесь другая, чем дома. Не пустая — просто в ней нет привычного городского шума, который обычно заполняет паузы за них.', 3000);
    await this.ui.dialogue([
      { who: 'Настя', text: 'А ты вообще представлял когда-нибудь, как будет выглядеть твоя жизнь?' },
      { who: 'Тамир', text: 'Нет.' },
    ]);
    await this.ui.caption('Не потому что не думал об этом. Потому что каждый раз, представляя, боялся — вдруг не получится похоже.', 2800);
    await this.ui.caption('Пауза.', 1300);
    cam.zoomTo(CFG.ZOOM + 0.8, 1600);
    await this.ui.dialogue([
      { who: 'Настя', text: 'А сейчас?' },
    ]);
    await this.ui.caption('Он смотрит на неё, будто ищет ответ где-то за её плечом.', 2200);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Сейчас примерно представляю.' },
    ]);
    await this.ui.caption('Он не уточняет, что именно видит. Не нужно — она уже в этой картинке, и оба это знают.', 2800);
    Audio.playChime();
    Audio.startMelody();
    await wait(this, 800);
    cam.zoomTo(CFG.ZOOM, 900);
    await this.ui.letterboxOff(400);
    Audio.stopMelody();

    this.unlockInput();
    this.ui.setQuest('Осмотреться у костра, потом сказать Тамиру, что пора возвращаться');
    this.setupFreeRoam();
  }

  setupFreeRoam() {
    this.interactions.add(this.fire.x, this.fire.y - 6, 30, 'погреть руки', () => {
      this.ui.dialogue([{ who: '', text: 'Огонь тёплый, потрескивает. Настя ловит себя на мысли, что не хочет, чтобы вечер заканчивался — не потому что боится возвращаться, а потому что редко бывает настолько здесь, а не где-то ещё в голове.' }]);
    });
    this.interactions.add(390, 224 - 6, 26, 'посмотреть на вещи', () => {
      this.ui.dialogue([{ who: '', text: 'Чемоданы уже собраны — завтра снова город, работа, обычная жизнь. Странно, что этот кусочек земли у костра тоже вдруг стал немного похож на дом.' }]);
    });
    this.interactions.add(70, 216, 26, 'сесть на камень', () => {
      this.ui.dialogue([{ who: '', text: 'Камень холодный, но сидеть удобно. Отсюда видно, как искры от костра поднимаются и гаснут где-то в темноте.' }]);
    });
    this.interactions.add(180, 214, 50, 'посмотреть на звёзды', () => {
      this.ui.dialogue([{ who: '', text: 'Звёзд здесь в разы больше, чем в городе. Настя пытается вспомнить хоть одно созвездие и не может — и почему-то это не расстраивает.' }]);
    });
    this.interactions.add(this.npc.sprite.x, this.npc.sprite.y, 30, 'сказать, что пора возвращаться', () => {
      if (this.locked) return;
      this.safeRun(() => this.endTrip());
    });
  }

  async endTrip() {
    this.lockInput();
    this.interactions.clear();
    this.ui.clearQuest();
    await this.ui.dialogue([
      { who: 'Настя', text: 'Пора возвращаться, наверное.' },
      { who: 'Тамир', text: 'Ещё пять минут. Пусть костёр догорит.' },
      { who: '', text: 'Она могла бы сказать, что костёр прекрасно догорит и без них. Не говорит.' },
    ]);

    GameState.flags.tripDone = true;
    adjustRelationship({ trust: 1, closeness: 1 });
    SaveSystem.save();

    await this.ui.caption('Они остаются ещё немного. Потом всё равно уезжают — но в машине по дороге домой что-то уже другое, хоть оба молчат почти всю дорогу.', 3200);
    await this.ui.fadeOut(700);
    await this.ui.caption('Через год они решают жить вместе.', 2400);

    GameState.chapter = 'apartment';
    SaveSystem.save();
    this.scene.start('Apartment');
  }
}
/* =====================================================================
   ApartmentScene — ЭТАП III: СОВМЕСТНАЯ ЖИЗНЬ
   A real 3-room floor plan (kitchen / living room / bedroom) plus a
   small balcony nook, all connected by proper doorways with walls
   that actually block movement — for the player AND the cats.
   ===================================================================== */
