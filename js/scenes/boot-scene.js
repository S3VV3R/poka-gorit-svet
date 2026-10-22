class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const A = ASSETS;
    this.failedAssets = [];
    this.load.on('loaderror', (file) => {
      this.failedAssets.push(file.key);
      window.GameBoot?.fail('Не удалось загрузить изображение: ' + file.key + '. Проверьте папку assets и обновите страницу.');
    });

    // characters & cats (spritesheets)
    this.load.spritesheet('nastya', A.nastya, { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet('tamir', A.tamir, { frameWidth: 16, frameHeight: 24 });
    this.load.spritesheet('mars', A.mars, { frameWidth: 16, frameHeight: 12 });
    this.load.spritesheet('abilka', A.abilka, { frameWidth: 16, frameHeight: 12 });
    // extra NPC appearances — distinct hair/skin/clothing, not tints
    ['npc_lyuda', 'npc_guest1', 'npc_guest2', 'npc_guest3'].forEach((k) => {
      this.load.spritesheet(k, A[k], { frameWidth: 16, frameHeight: 24 });
    });

    // later-life appearances (kids / middle age / old age)
    ['nastya_mid', 'nastya_old', 'tamir_mid', 'tamir_old',
     'bella_kid', 'bella_teen', 'bella_adult', 'nia_kid', 'nia_teen', 'nia_adult'].forEach((k) => {
      this.load.spritesheet(k, A[k], { frameWidth: 16, frameHeight: 24 });
    });

    // ---- living world: cast (3 ages each), passers-by, pets, extra props ----
    ['lera','artem','vera','denis','marina','sergey','irina','pavel','oleg','sofia','maxim','elena','roman','mila','viktor'].forEach((id) => {
      ['young', 'mid', 'old'].forEach((st) => this.load.spritesheet(`cast_${id}_${st}`, A[`cast_${id}_${st}`], { frameWidth: 16, frameHeight: 24 }));
      ['neutral', 'happy', 'worried'].forEach((m) => this.load.image(`portrait_${id}_${m}`, A[`portrait_${id}_${m}`]));
    });
    for (let i = 1; i <= 16; i++) this.load.spritesheet('ped_' + i, A['ped_' + i], { frameWidth: 16, frameHeight: 24 });
    for (let i = 1; i <= 4; i++) this.load.spritesheet('kid_' + i, A['kid_' + i], { frameWidth: 16, frameHeight: 24 });
    ['dog_brown', 'dog_white', 'dog_black'].forEach((k) => this.load.spritesheet(k, A[k], { frameWidth: 16, frameHeight: 12 }));
    this.load.spritesheet('pigeon', A.pigeon, { frameWidth: 8, frameHeight: 8 });
    this.load.spritesheet('butterfly', A.butterfly, { frameWidth: 8, frameHeight: 6 });
    this.load.image('leaf', A.leaf);
    ["aquarium", "barrel", "bike_rack", "books_stack", "bunting", "bus_stop", "cafe_sign", "cafe_table", "candle", "cat_tree", "chair", "coat_rack", "crates", "desk_laptop", "doormat", "easel", "floor_lamp", "flowerbed", "flowers_blue", "flowers_red", "flowers_white", "flowers_yellow", "fridge_magnets", "globe", "grass_tuft", "guitar", "hedge", "high_chair", "hydrant", "icecream_cart", "laundry", "laundry_basket", "log", "mushroom", "news_stand", "piano", "picnic", "pillow_pile", "plant_big", "plate_round", "radio", "recycle_bin", "sandbox", "school_desk", "seesaw", "shoes", "slide", "stall_blue", "stall_green", "stall_red", "stones", "string_lights", "stroller", "stump", "swing", "tent", "toy_cars", "vase", "vending", "wall_calendar", "window_night"].forEach((k) => this.load.image(k, A[k]));

    // tilesets
    this.load.image('tileset_outdoor', A.tileset_outdoor);
    this.load.image('tileset_park', A.tileset_park);
    this.load.image('tileset_interior', A.tileset_interior);

    // props (static images)
    const propKeys = [
      'streetlamp', 'glow', 'bench', 'tree', 'tree_night', 'box', 'box_open',
      'dishes_dirty', 'dishes_clean', 'counter', 'stove', 'fridge', 'table',
      'couch', 'bed', 'plant', 'balcony_rail', 'suitcase', 'rock',
      'arch', 'flowerpot', 'wardrobe', 'raindrop',
      'trashcan', 'mailbox', 'bush', 'fence', 'puddle_deco', 'streetsign', 'bicycle', 'fountain', 'bookshelf', 'wallclock', 'picture_frame', 'tv', 'curtains', 'kitchen_shelf', 'rug_round', 'lantern', 'giftboxes',
      'crib', 'toys', 'kid_drawing', 'grave', 'memory_box', 'photo_album', 'photo_wall', 'cake', 'balloons',
      'mug_blue', 'armchair', 'cat_bed', 'cat_bowl', 'house_night', 'house_neighbor', 'backpack',
    ];
    propKeys.forEach((k) => this.load.image(k, A[k]));

    // campfire (2-frame spritesheet)
    this.load.spritesheet('campfire', A.campfire, { frameWidth: 16, frameHeight: 16 });

    // portraits (dialogue box)
    const portraitKeys = [
      'portrait_nastya_neutral', 'portrait_nastya_happy', 'portrait_nastya_worried',
      'portrait_tamir_neutral', 'portrait_tamir_happy', 'portrait_tamir_worried',
      'portrait_nastya_old_neutral', 'portrait_nastya_old_happy', 'portrait_nastya_old_worried',
      'portrait_tamir_old_neutral', 'portrait_tamir_old_happy', 'portrait_tamir_old_worried',
      'portrait_bella_neutral', 'portrait_bella_happy', 'portrait_bella_worried',
      'portrait_nia_neutral', 'portrait_nia_happy', 'portrait_nia_worried',
    ];
    portraitKeys.forEach((k) => this.load.image(k, A[k]));

    // backgrounds
    this.load.image('overlook_sky', A.overlook_sky);
    this.load.image('title', A.title);

    this.buildLoadingBar();
  }

  buildLoadingBar() {
    const W = CFG.WIDTH, H = CFG.HEIGHT;
    const box = this.add.rectangle(W / 2, H / 2, 320, 10, 0x1c1c2a).setStrokeStyle(1, 0x8a7ba0);
    const bar = this.add.rectangle(W / 2 - 158, H / 2, 4, 6, 0xe8c07d).setOrigin(0, 0.5);
    this.load.on('progress', (v) => { bar.width = 316 * v; });
    this.load.on('complete', () => { box.destroy(); bar.destroy(); });
  }

  create() {
    if (this.failedAssets.length || window.GameBoot?.failed) return;
    this.anims.create({
      key: 'campfire_burn',
      frames: this.anims.generateFrameNumbers('campfire', { start: 0, end: 1 }),
      frameRate: 3,
      repeat: -1,
    });

    SaveSystem.load();
    UserSettings.restore();
    window.GameBoot?.complete();
    this.scene.launch('UI');
    this.scene.start(window.location.hash === '#balcony' ? 'BalconyPreview' : window.location.hash === '#home' ? 'HomePreview' : 'MainMenu');
  }
}
/* =====================================================================
   MainMenuScene
   ===================================================================== */
