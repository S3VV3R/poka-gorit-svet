function skinFor(who) {
  const st = GameState.ageStage || 'young';
  if (who === 'nastya') return { young: 'nastya', mid: 'nastya_mid', old: 'nastya_old' }[st];
  return { young: 'tamir', mid: 'tamir_mid', old: 'tamir_old' }[st];
}

// Which ending does this life add up to? (см. «Условия концовок»)
function computeEnding() {
  const s = GameState.stats, r = GameState.relationship;
  const bond = r.trust + r.closeness + r.warmth;
  // редкая: всё сделано «вовремя»
  if (s.talk >= 8 && s.avoid <= 2 && s.kidsBond >= 6 && s.letGo >= 3 && s.memories >= 7 && bond >= 12) return 8;
  // «Тишина»: откладывала разговоры и потеряла связь с детьми
  if (s.kidsBond <= 2 && s.avoid >= 3) return 7;
  // «Поздно»: слишком долго молчали друг с другом
  if (s.avoid >= 5 && s.avoid >= s.talk - 1) return 4;
  const score = {
    3: (s.reconciled >= 1 && s.quarrels >= 1) ? 4 + s.reconciled * 2 + (s.habits >= 5 ? 2 : 0) : 0,   // «Мы всё ещё здесь»
    2: s.houseAttach >= 3 ? s.houseAttach * 2 : 0,                                                    // «Дом, который остался»
    6: s.kidsBond >= 5 ? s.kidsBond + (r.closeness >= 6 ? 2 : 0) : 0,                                  // «Дети вернулись»
    5: s.letGo >= 4 ? s.letGo * 1.5 : 0,                                                              // «Оставь свет»
    1: 5,                                                                                             // «Вместе до конца»
  };
  let best = 1, bv = -1;
  [3, 2, 6, 5, 1].forEach((k) => { if (score[k] > bv) { bv = score[k]; best = k; } });
  return best;
}

class HouseScene extends GameplayScene {
  // opts: { era, tint, tintAlpha, rain, ambience }
  houseCreate(opts) {
    this.commonCreate();
    this.era = opts.era;
    const W = 24, H = 14, T = 16;
    const worldW = W*T, worldH=H*T;
    this.worldW=worldW; this.worldH=worldH; this._compactHome=true; this.homeZoom=CFG.ZOOM;
    const data=makeGrid(W,H,3);
    fillRect(data,1,1,W-2,H-2,0);
    for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x+=2)data[y][x]=1;
    
    fillRect(data,18,6,21,9,2); fillRect(data,3,0,5,0,4); fillRect(data,10,0,12,0,4); fillRect(data,21,0,22,0,7);
    
    
    buildTilemap(this,data,'tileset_interior',T,T);
    this.add.rectangle(135.06,57.15,10.35,82.29,0x403b38).setDepth(20); this.add.rectangle(135.06,166.86,10.35,82.29,0x403b38).setDepth(20);
    this.add.rectangle(259.29,57.15,10.35,82.29,0x403b38).setDepth(20); this.add.rectangle(259.29,166.86,10.35,82.29,0x403b38).setDepth(20);
    this.physics.world.setBounds(16, 16, worldW - 32, worldH - 32);

    this.addCollider(worldW / 2, 8, worldW - 16, 16);
    this.addCollider(worldW / 2, worldH - 8, worldW - 16, 16);
    this.addCollider(8, worldH / 2, 16, worldH - 16);
    this.addCollider(worldW - 8, worldH / 2, 16, worldH - 16);
    [135.06, 259.29].forEach((x) => {
      this.addCollider(x, 57.14, 10.35, 82.29);
      this.addCollider(x, 166.86, 10.35, 82.29);
    });
    const put = (k, x, y, depth, col) => {
      const im = this.add.image(x, y, k).setScale(0.86).setOrigin(0.5, 1).setDepth(depth === undefined ? y : depth);
      if (col) this.addCollider(col[0], col[1], col[2], col[3]);
      return im;
    };
    this.put = put;

    // ---- parents' bedroom ----
    put('bed', 63.88, 194.29, 194.29, [63.88, 177.14, 25.88, 20.57]);
    put('wardrobe', 44.47, 50.29, 50.29, [44.47, 41.71, 15.53, 17.14]);

    // ---- kids' room ----
    this.kidBedA = put('bed', 167.41, 194.29, 194.29, [167.41, 177.14, 25.88, 20.57]);
    if (this.era !== 'baby') put('bed', 232.12, 194.29, 194.29, [232.12, 177.14, 25.88, 20.57]);
    put('bookshelf', 225.65, 53.71, 53.71, [225.65, 40, 18.12, 13.71]);
    put('table', 199.76, 105.14, 105.14, [199.76, 100, 20.71, 8.57]);
    if (this.era === 'baby') {
      this.crib = put('crib', 199.76, 88, 88, [199.76, 81.14, 11.65, 10.29]);
      put('toys', 167.41, 165.14, 4);
    } else if (this.era === 'kids' || this.era === 'teen') {
      put('toys', 170.65, 163.43, 4);
      put('backpack', 190.06, 112, 106);
      this.add.image( 219.18, 50.29, 'kid_drawing').setScale(0.86).setOrigin(0.5, 1).setDepth(54.57);
    } else {
      this.memoryBox = put('memory_box', 199.76, 103.43, 104.29);
    }

    // ---- kitchen / living ----
    put('counter', 296.82, 53.71, 53.71, [296.82, 47.71, 31.06, 12]);
    put('stove', 322.71, 53.71, 53.71, [322.71, 47.71, 10.35, 12]);
    put('fridge', 348.59, 58.86, 58.86, [348.59, 49.43, 11.65, 18.86]);
    if (GameState.flags.drawingOnFridge) this.fridgeDrawing = this.add.image( 348.59, 45.14, 'kid_drawing').setScale(0.86).setOrigin(0.5, 1).setDepth(59.71);
    put('plant', 277.41, 40, 40, [277.41, 34.86, 7.76, 8.57]);
    put('table', 309.76, 130.86, 130.86, [309.76, 125.71, 20.71, 8.57]);
    put('couch', 351.82, 173.71, 173.71, [351.82, 168.57, 25.88, 10.29]);
    put('photo_wall', 357.65, 14, 15);
    put('armchair', 290.35, 165.14, 165.14, [290.35, 160, 10.35, 10.29]);
    this.bowlImg = put('cat_bowl', 362.82, 204.57, 4);
    this.catBedImg = this.add.image( 277.41, 204.57, 'cat_bed').setScale(0.86).setOrigin(0.5, 1).setDepth(4);
    if (GameState.flags.keptMarsBowl === false) this.bowlImg.setVisible(false);
    if (GameState.flags.keptAbilkaBed === false) this.catBedImg.setVisible(false);
    put('rug_round', 342.12, 194.29, 2);
    // A few intentional layers make the small room feel warm without
    // blocking its walkable space or filling it with random clutter.
    this.add.image( 312.35, 38.29, 'string_lights').setScale(0.86).setOrigin(0.5, 0).setDepth(55.43).setAlpha(0.8);
    this.add.image( 332.41, 127.43, 'mug_blue').setScale(0.86).setOrigin(0.5, 1).setDepth(132.57);
    this.add.image( 358.94, 158.29, 'pillow_pile').setScale(0.86).setOrigin(0.5, 1).setDepth(158.29);
    const kitchenGlow = this.add.image( 313.65, 62.29, 'glow').setScale(0.86).setOrigin(0.5).setDepth(52).setScale(1.45).setTint(0xffd27a).setAlpha(0.18);
    this.tweens.add({ targets: kitchenGlow, alpha: 0.27, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    if (this.era !== 'baby' && !GameState.flags.marsGone) { /* mars' wardrobe spot is in the bedroom */ }

    addTint(this, worldW, worldH, opts.tint || 0xffe4b8, opts.tintAlpha === undefined ? 0.10 : opts.tintAlpha, Phaser.BlendModes.MULTIPLY);
    if (opts.rain) this.rain = addRain(this, worldW, worldH, 40);

    // cats alive in this period
    this.mars = null; this.abilka = null;
    if (!GameState.flags.marsGone) {
      this.mars = new Cat(this, 44.47, 36.57, 'mars'); this.mars.dir = 'down';
      this.cats.push(this.mars); this.collidersReadyFor(this.mars.sprite);
    }
    if (!GameState.flags.abilkaGone) {
      this.abilka = new Cat(this, 70.35, 173.71, 'abilka'); this.abilka.dir = 'down';
      this.cats.push(this.abilka); this.collidersReadyFor(this.abilka.sprite);
    }

    this.player = new Player(this, 101, 151, skinFor('nastya'));
    this.player.dir = 'up';
    this.collidersReadyFor(this.player.sprite);
    this.tamir = null;
    this.npc = null;      // Tamir is driven explicitly by scenes
    this.kids = [];

    const cam = this.cameras.main;
    cam.setBounds(0, 0, worldW, worldH);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.homeZoom = CFG.ZOOM + 0.12;
    cam.setZoom(this.homeZoom);
    Audio.startAmbience(opts.ambience || 'home');

    this.buildBalconyTableau();
    this.done = new Set();
    this._ph = 0;
    // Optional ordinary days live beside the authored chapter objectives.
    LifeSystem.install(this);
    return { worldW, worldH };
  }

  // set/get story progress milestones
  need(k) { return !this.done.has(k); }
  mark(k) { this.done.add(k); }

  spawnTamir(x, y, dir = 'down') {
    if (this.tamir) this.tamir.destroy();
    this.tamir = new NPC(this, x, y, skinFor('tamir'));
    this.tamir.speed = GameState.ageStage === 'old' ? 38 : GameState.ageStage === 'mid' ? 48 : 52;
    this.tamir.dir = dir;
    this.collidersReadyFor(this.tamir.sprite);
    this.tamir.sprite.setDepth(y);
    this.tamirSprites = [this.tamir];
    return this.tamir;
  }

  spawnKid(tex, x, y, dir = 'down') {
    const k = new NPC(this, x, y, tex);
    k.dir = dir; k.speed = 40;
    this.collidersReadyFor(k.sprite);
    this.kids.push(k);
    return k;
  }

  setStage(stage) {
    GameState.ageStage = stage;
    if (this.player) this.player.setSkin(skinFor('nastya'));
    if (this.tamir) this.tamir.setSkin(skinFor('tamir'));
    if (this.refreshVillagers) this.refreshVillagers();
  }

  tick(time, delta) {
    if (this.tamir) { this.tamir.update(); this.tamir.sprite.setDepth(this.tamir.sprite.y); }
    TamirLife.tick(this, delta);
    this.kids.forEach((k) => { k.update(); k.sprite.setDepth(k.sprite.y); });
    if (this.kidWander) {
      this._kw = (this._kw || 0) - (delta || 16);
      if (this._kw <= 0) {
        this._kw = 1600 + Math.random() * 1800;
        const k = this.kids[Math.floor(Math.random() * this.kids.length)];
        if (k && !k.target) k.moveTo(Phaser.Math.Between(...this.kidWander.x), Phaser.Math.Between(...this.kidWander.y));
      }
    }
    if (this.mars && this.marsWander !== false) this.mars.wander({ x: 25.06, y: 36.57, w: 77.65, h: 34.29 });
    if (this.abilka && this.abilkaWander !== false) this.abilka.wander({ x: 44.47, y: 139.43, w: 71.18, h: 51.43 });
    if (this.storyTick) this.storyTick(time, delta);
  }

  // ---------------- balcony tableau (far from the house, camera jumps there)
  buildBalconyTableau() {
    const ox = 1400;
    this.balcOX = ox;
    this.add.image(ox, 0, 'overlook_sky').setOrigin(0, 0).setDepth(0);
    this.add.rectangle(ox, 140, 480, 90, 0x3a2f2a).setOrigin(0, 0).setDepth(1);
    this.add.rectangle(ox, 140, 480, 3, 0x1a1418).setOrigin(0, 0).setDepth(2);
    for (let x = 0; x < 480; x += 16) this.add.image(ox + x + 8, 142, 'balcony_rail').setOrigin(0.5, 1).setDepth(3);
    this.balcChairA = this.add.image(ox + 214, 198, 'armchair').setOrigin(0.5, 1).setDepth(165.14);
    this.balcChairB = this.add.image(ox + 258, 198, 'armchair').setOrigin(0.5, 1).setDepth(165.14);
    this.balcN = this.add.sprite(ox + 214, 190, 'nastya', 4).setOrigin(0.5, 1).setDepth(166);
    this.balcT = this.add.sprite(ox + 258, 190, 'tamir', 4).setOrigin(0.5, 1).setDepth(166);
    this.add.image(ox + 236, 200, 'mug_blue').setOrigin(0.5, 1).setDepth(166.86);
    // windows of far-away houses
    for (let i = 0; i < 9; i++) {
      const g = this.add.image(ox + 30 + i * 52, 118 + (i % 3) * 6, 'glow').setScale(0.35).setAlpha(0.55).setDepth(2);
      g.setTint(0xffd27a);
    }
  }

  async toBalcony(frames) {
    // frames: 'young'|'mid'|'old' appearance on the balcony
    const prev = GameState.ageStage;
    GameState.ageStage = frames || prev;
    this.balcN.setTexture(skinFor('nastya'), 4);
    this.balcT.setTexture(skinFor('tamir'), 4);
    GameState.ageStage = prev;
    this.lockInput();
    await this.ui.fadeOut(500);
    const cam = this.cameras.main;
    cam.stopFollow(); cam.removeBounds(); cam.setZoom(2.6);
    cam.centerOn(this.balcOX + 236, 160);
    await this.ui.fadeIn(600);
  }

  async fromBalcony() {
    await this.ui.fadeOut(500);
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.worldW, this.worldH);
    cam.setZoom(this.homeZoom);
    cam.startFollow(this.player.sprite, true, 1, 1);
    cam.centerOn(this.player.sprite.x, this.player.sprite.y);
    await this.ui.fadeIn(600);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
    this.unlockInput();
  }

  // cinematic pan helper for in-house cutscenes
  async focus(x, y, zoom = CFG.ZOOM + 1, ms = 700) {
    const cam = this.cameras.main;
    cam.stopFollow();
    cam.pan(x, y, ms, 'Sine.easeInOut');
    cam.zoomTo(zoom, ms);
    await wait(this, ms + 100);
  }
  async unfocus() {
    const cam = this.cameras.main;
    cam.zoomTo(this.homeZoom, 600);
    await wait(this, 600);
    cam.startFollow(this.player.sprite, true, 0.12, 0.12);
  }

  // choose two ways: retains "binary choice" helper
  async yesNo(prompt, a, b) { return this.ui.choice(prompt, [a, b]); }

  // end-of-chapter shared flow
  async endChapter(num, title, subtitle, nextKey, nextScene, flagName, line) {
    this.lockInput();
    this.ui.clearQuest();
    await this.ui.fadeOut(900);
    await this.ui.chapterCard(`КОНЕЦ ГЛАВЫ ${num}`, `${title}`, 3000);
    if (line) await this.ui.caption(line, 2800);
    GameState.flags[flagName] = true;
    GameState.chapter = nextKey;
    SaveSystem.save();
    Audio.stopAmbience(1.0);
    this.scene.start(nextScene);
  }
}


/* =====================================================================
   ГЛАВА 4 — «Девять месяцев и Белла»
   Первая ночь • Балкон с плачем из комнаты • Первые шаги • Рисунок • Ния
   ===================================================================== */
