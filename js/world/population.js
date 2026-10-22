function pedTex(sc, i) { return 'ped_' + (1 + ((i * 7 + sc.scene.key.length * 3) % 16)); }
function PUT(sc, k, x, y, col, depth) {
  const im = sc.add.image(x, y, k).setOrigin(0.5, 1).setDepth(depth === undefined ? y : depth);
  if (sc._compactHome) im.setScale(0.86);
  if (col) sc.addCollider(col[0], col[1], col[2], col[3]);
  if (!sc._decorSpots) sc._decorSpots = [];
  sc._decorSpots.push([x, y]);
  return im;
}
function VIL(sc, id, x, y, o = {}) {
  const rx = o.rx === undefined ? 22 : o.rx, ry = o.ry === undefined ? 14 : o.ry;
  return sc.addVillager(id, x, y, Object.assign({ area: { x: x - rx, y: y - ry, w: rx * 2, h: ry * 2 }, mode: o.stand ? 'stand' : 'wander' }, o));
}
const GRASS_KINDS = ['flowers_red', 'flowers_yellow', 'flowers_blue', 'flowers_white', 'grass_tuft', 'grass_tuft', 'stones', 'mushroom'];

function populateScene(sc) {
  const k = sc.scene.key;
  const table = {
    Street: popStreet, DateScene: popDate, TripScene: popTrip, Apartment: popApartment, Proposal: popProposal,
    Wedding: popWedding, YoungFamily: popYoung, Baby: popHouse, Kids: popHouse, EmptyNest: popHouse, LateYears: popHouse, Ending: popHouse,
  };
  const f = table[k];
  if (!f) return;
  try { f(sc, ERA_BY_SCENE[k]); } catch (e) { console.error('populate failed for ' + k, e); }
}

// ------------------------------------------------------------------ УЛИЦА
function popStreet(sc) {
  const A = sc.ambientInit();
  A.pedestrians([{ y: 112, x0: -14, x1: 654 }, { y: 168, x0: -14, x1: 654 }], { max: 3, every: 6500 });
  A.pigeonFlock({ x: 470, y: 112, w: 110, h: 22 }, 4);
  A.pigeonFlock({ x: 40, y: 92, w: 80, h: 10 }, 3);
  A.fireflies({ x: 0, y: 20, w: 640, h: 72 }, 10);
  A.fireflies({ x: 0, y: 180, w: 640, h: 60 }, 10);

  // остановка и люди
  PUT(sc, 'bus_stop', 566, 104, [566, 98, 22, 8]);
  VIL(sc, 'lera', 540, 122, { stand: true, dir: 'right' });
  PUT(sc, 'bench', 72, 86);
  VIL(sc, 'vera', 72, 90, { stand: true, dir: 'down', radius: 22 });
  PUT(sc, 'news_stand', 252, 100, [252, 94, 10, 8]);
  VIL(sc, 'sergey', 268, 118, { stand: true, dir: 'left' });
  VIL(sc, 'marina', 604, 150, { stand: true, dir: 'left' });
  VIL(sc, 'denis', 176, 126, { stand: true, dir: 'left' });

  // уличная жизнь
  PUT(sc, 'stall_green', 400, 82, [400, 76, 28, 8]);
  sc.addExtra(400, 70, pedTex(sc, 1), 'down', { pool: 'street', label: 'поболтать с продавцом', who: 'Продавец', collide: false });
  sc.chatGroup(450, 62, [pedTex(sc, 2), pedTex(sc, 5)], { pool: 'street', label: 'поболтать с прохожими', rot: 0.4 });
  PUT(sc, 'cafe_table', 190, 214, [190, 208, 18, 6]);
  sc.addExtra(174, 210, pedTex(sc, 4), 'right', { pool: 'street', label: 'поболтать с гостем кафе', collide: false });
  sc.addExtra(206, 210, pedTex(sc, 9), 'left', { collide: false });
  PUT(sc, 'cafe_sign', 150, 214, [150, 210, 8, 4]);
  PUT(sc, 'hydrant', 610, 104, [610, 99, 6, 5]);
  PUT(sc, 'recycle_bin', 300, 190, [300, 185, 8, 5]);
  PUT(sc, 'bike_rack', 110, 196, [110, 192, 18, 5]);
  PUT(sc, 'bicycle', 134, 196, [134, 192, 14, 5]);
  PUT(sc, 'vending', 24, 98, [24, 92, 12, 8]);
  PUT(sc, 'bunting', 420, 106, null, 108);
  sc.addPet('dog_brown', 500, 205, { x: 440, y: 190, w: 110, h: 40 });

  sc.scatterDecor({ x: 8, y: 38, w: 624, h: 56 }, GRASS_KINDS, 40);
  sc.scatterDecor({ x: 8, y: 184, w: 624, h: 56 }, GRASS_KINDS, 40, { seed: 'b' });
  sc.scatterDecor({ x: 8, y: 36, w: 624, h: 58 }, ['hedge', 'bush', 'barrel'], 4, { margin: 16, spacing: 40, seed: 'c' });
  sc.scatterDecor({ x: 8, y: 190, w: 624, h: 56 }, ['hedge', 'bush', 'crates'], 4, { margin: 16, spacing: 40, seed: 'd' });
}

// ------------------------------------------------------------------ ПАРК
function popDate(sc) {
  const A = sc.ambientInit();
  A.pedestrians([{ y: 108, x0: -14, x1: 590 }, { y: 166, x0: -14, x1: 590 }], { max: 3, every: 5800, dogChance: 0.3 });
  A.pigeonFlock({ x: 400, y: 232, w: 110, h: 14 }, 5);
  A.butterflies({ x: 0, y: 28, w: 576, h: 66 }, 7);
  A.butterflies({ x: 0, y: 182, w: 576, h: 60 }, 6);

  VIL(sc, 'lera', 112, 148, { stand: true, dir: 'right' });
  VIL(sc, 'artem', 392, 150, { stand: true, dir: 'left' });
  VIL(sc, 'vera', 430, 236, { stand: true, dir: 'right', radius: 22 });

  PUT(sc, 'icecream_cart', 520, 80, [520, 74, 20, 8]);
  sc.addExtra(520, 66, pedTex(sc, 6), 'down', { pool: 'park', label: 'поболтать с мороженщиком', collide: false });
  PUT(sc, 'bench', 400, 66);
  sc.addExtra(393, 63, pedTex(sc, 3), 'down', { pool: 'park', label: 'поболтать со стариками', collide: false });
  sc.addExtra(407, 63, pedTex(sc, 8), 'down', { collide: false });
  PUT(sc, 'easel', 62, 70, [62, 66, 10, 6]);
  sc.addExtra(76, 70, pedTex(sc, 10), 'left', { pool: 'park', label: 'поговорить с художником', who: 'Художник', collide: false });
  PUT(sc, 'picnic', 138, 76, null, 4);
  sc.addExtra(128, 72, pedTex(sc, 11), 'right', { pool: 'park', label: 'поболтать с пикникующими', collide: false });
  sc.addExtra(148, 74, pedTex(sc, 13), 'left', { collide: false });
  PUT(sc, 'stroller', 248, 78, [248, 72, 12, 6]);
  sc.addExtra(262, 78, pedTex(sc, 12), 'left', { pool: 'park', label: 'поболтать с мамой', collide: false });
  // детская площадка
  PUT(sc, 'swing', 470, 214, [470, 208, 18, 6]);
  PUT(sc, 'slide', 510, 218, [510, 212, 14, 6]);
  PUT(sc, 'sandbox', 546, 238, [546, 233, 24, 5]);
  sc.addExtra(530, 232, 'kid_1', 'down', { pool: 'kids', label: 'поболтать с малышом', collide: false });
  sc.addExtra(560, 224, 'kid_3', 'left', { collide: false });
  sc.addExtra(486, 226, 'kid_2', 'right', { collide: false });
  PUT(sc, 'hydrant', 30, 100, [30, 95, 6, 5]);
  PUT(sc, 'recycle_bin', 330, 100, [330, 95, 8, 5]);
  PUT(sc, 'flowerbed', 330, 202, [330, 197, 22, 6]);
  PUT(sc, 'hedge', 150, 218, [150, 213, 24, 7]);
  sc.addPet('dog_white', 300, 214, { x: 240, y: 196, w: 150, h: 36 });

  sc.scatterDecor({ x: 8, y: 40, w: 560, h: 50 }, GRASS_KINDS, 42);
  sc.scatterDecor({ x: 8, y: 196, w: 560, h: 46 }, GRASS_KINDS, 38, { seed: 'b' });
  sc.scatterDecor({ x: 8, y: 38, w: 560, h: 52 }, ['hedge', 'bush', 'log'], 3, { margin: 16, spacing: 40, seed: 'c' });
}

// ------------------------------------------------------------------ ПОХОД
function popTrip(sc) {
  const A = sc.ambientInit();
  A.fireflies({ x: 0, y: 150, w: 480, h: 72 }, 14);
  // дальние огни других лагерей на горизонте
  [[40, 150], [140, 148], [410, 149], [460, 150]].forEach(([x, y]) => {
    const g = sc.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setScale(0.45).setAlpha(0.5).setDepth(-40).setTint(0xff9a4a);
    sc.tweens.add({ targets: g, alpha: 0.25, duration: 1200 + Math.random() * 800, yoyo: true, repeat: -1 });
  });
  [[40, 152], [140, 150], [410, 151]].forEach(([x, y]) => sc.add.image(x, y, 'tent').setOrigin(0.5, 1).setScale(0.5).setTint(0x2a2a4a).setDepth(-45));

  PUT(sc, 'tent', 430, 212, [430, 204, 26, 12]);
  PUT(sc, 'log', 372, 216, [372, 212, 18, 5]);
  PUT(sc, 'barrel', 330, 212, [330, 208, 8, 5]);
  PUT(sc, 'crates', 456, 218, [456, 214, 14, 5]);
  VIL(sc, 'viktor', 396, 206, { stand: true, dir: 'left', radius: 30 });
  PUT(sc, 'tent', 24, 214, [24, 206, 26, 12]);
  PUT(sc, 'lantern', 40, 200, null, 205);
  sc.addExtra(104, 214, pedTex(sc, 14), 'right', { pool: 'camp', label: 'поболтать с туристом', collide: false });
  sc.addExtra(120, 214, pedTex(sc, 3), 'left', { collide: false });
  PUT(sc, 'log', 112, 220, [112, 216, 18, 5], 215);
  sc.scatterDecor({ x: 8, y: 170, w: 464, h: 50 }, ['grass_tuft', 'grass_tuft', 'stones', 'mushroom', 'flowers_white', 'flowers_yellow'], 30, { margin: 5 });
}

// ------------------------------------------------------------ КВАРТИРА (гл.1)
function popApartment(sc) {
  // Дом — личное пространство: случайные прохожие и гости здесь не живут.
  // Несколько предметов рассказывают о привычках, но не перекрывают проходы.
  PUT(sc, 'coat_rack', 23.37, 200.5, [23.37, 197.5, 4.21, 3.75]);
  PUT(sc, 'doormat', 36, 205, null, 3);
  PUT(sc, 'shoes', 48.63, 205, null, 3);
  PUT(sc, 'floor_lamp', 132.84, 88, [132.84, 85, 3.16, 3.75]);
  PUT(sc, 'plant_big', 222.32, 82, [222.32, 78.25, 5.26, 4.5]);
  PUT(sc, 'plant_big', 250.74, 82, [250.74, 78.25, 5.26, 4.5]);
  PUT(sc, 'cat_tree', 322.32, 85, [322.32, 80.5, 5.26, 4.5]);
  PUT(sc, 'laundry_basket', 254.95, 197.5, [254.95, 194.5, 5.26, 3.75]);
  PUT(sc, 'window_night', 281.26, 43, null, 42.25);
  PUT(sc, 'wall_calendar', 70.74, 43, null, 42.25);
  PUT(sc, 'radio', 23.37, 157, null, 157.75);
  PUT(sc, 'table', 216, 100, [216, 95.5, 13.68, 6]);
  PUT(sc, 'aquarium', 216, 88, null, 100.75);
  PUT(sc, 'vase', 40.21, 155.5, null, 163);
  PUT(sc, 'books_stack', 110.74, 53.5, null, 49.75);
  PUT(sc, 'candle', 100.21, 56.5, null, 49.75);
}

// -------------------------------------------------------------- ПРЕДЛОЖЕНИЕ
function popProposal(sc) {
  // Вечер предложения — только для Насти, Тамира и их котов.
  PUT(sc, 'coat_rack', 25.82, 188.33, [25.82, 184.67, 6.55, 4.58]);
  PUT(sc, 'shoes', 45.45, 192, null, 3);
  PUT(sc, 'floor_lamp', 20.91, 120.5, [20.91, 116.83, 4.91, 4.58]);
  PUT(sc, 'plant_big', 282.73, 38, [282.73, 33.42, 8.18, 5.5]);
  PUT(sc, 'candle', 119.09, 83.83, null, 94.83); PUT(sc, 'candle', 132.18, 85.67, null, 94.83);
  PUT(sc, 'vase', 125.64, 82, null, 95.75);
  PUT(sc, 'bunting', 207.45, 32.5, null, 57.25);
  PUT(sc, 'bunting', 240.18, 32.5, null, 57.25);
  PUT(sc, 'window_night', 191.09, 14, null, 15);
  PUT(sc, 'books_stack', 158.36, 189.25, null, 189.25);
  PUT(sc, 'pillow_pile', 236.91, 177.33, null, 179.17);
}

// ------------------------------------------------------------------ СВАДЬБА
function popWedding(sc) {
  const A = sc.ambientInit();
  A.butterflies({ x: 0, y: 20, w: 480, h: 60 }, 7);
  A.butterflies({ x: 0, y: 200, w: 480, h: 50 }, 5);
  A.fallingLeaves(480, 256, 20, [0xf4c0d0, 0xffffff, 0xf8d8e0]);
  A.pigeonFlock({ x: 20, y: 232, w: 100, h: 14 }, 3);

  VIL(sc, 'lera', 204, 164, { stand: true, dir: 'right', rx: 8, ry: 5 });
  VIL(sc, 'artem', 282, 166, { stand: true, dir: 'left', rx: 8, ry: 5 });
  VIL(sc, 'denis', 196, 184, { stand: true, dir: 'up', rx: 8, ry: 5 });
  VIL(sc, 'vera', 80, 98, { stand: true, dir: 'down' });
  VIL(sc, 'elena', 140, 198, { stand: true, dir: 'up' });
  VIL(sc, 'oleg', 200, 98, { stand: true, dir: 'down' });
  VIL(sc, 'marina', 300, 198, { stand: true, dir: 'up' });
  VIL(sc, 'roman', 360, 98, { stand: true, dir: 'down' });
  PUT(sc, 'guitar', 376, 98, null, 99);
  VIL(sc, 'sergey', 420, 198, { stand: true, dir: 'up' });
  VIL(sc, 'viktor', 452, 178, { stand: true, dir: 'left', radius: 22 });

  PUT(sc, 'stall_red', 330, 62, [330, 56, 28, 8]);
  sc.addExtra(330, 50, pedTex(sc, 6), 'down', { pool: 'wedding', label: 'поболтать с поваром', who: 'Повар', collide: false });
  PUT(sc, 'cake', 380, 62, null, 63);
  PUT(sc, 'cafe_table', 130, 66, [130, 60, 18, 6]);
  sc.addExtra(118, 62, pedTex(sc, 2), 'right', { pool: 'wedding', label: 'поболтать с гостем', collide: false });
  sc.addExtra(142, 62, pedTex(sc, 7), 'left', { collide: false });
  sc.chatGroup(250, 54, [pedTex(sc, 8), pedTex(sc, 11), pedTex(sc, 13)], { pool: 'wedding', label: 'поболтать с гостями', r: 11 });
  sc.chatGroup(60, 60, [pedTex(sc, 3), pedTex(sc, 12)], { pool: 'wedding', label: 'поболтать с гостями', rot: 1 });
  sc.chatGroup(430, 60, [pedTex(sc, 4), pedTex(sc, 15)], { pool: 'wedding', label: 'поболтать с гостями', rot: 2 });
  sc.chatGroup(30, 226, [pedTex(sc, 1), pedTex(sc, 10)], { pool: 'wedding', label: 'поболтать с гостями' });
  sc.chatGroup(270, 232, [pedTex(sc, 5), pedTex(sc, 14)], { pool: 'wedding', label: 'поболтать с гостями', rot: 1.4 });
  sc.chatGroup(380, 230, [pedTex(sc, 9), pedTex(sc, 16), 'kid_2'], { pool: 'wedding', label: 'поболтать с гостями', r: 10 });
  for (let i = 0; i < 9; i++) PUT(sc, 'bunting', 20 + i * 40, 46, null, 61);
  for (let i = 0; i < 6; i++) PUT(sc, 'string_lights', 30 + i * 80, 84, null, 85);
  sc.scatterDecor({ x: 8, y: 16, w: 464, h: 60 }, ['flowers_red', 'flowers_yellow', 'flowers_white', 'flowers_blue', 'grass_tuft'], 40, { margin: 5 });
  sc.scatterDecor({ x: 8, y: 214, w: 464, h: 36 }, ['flowers_red', 'flowers_yellow', 'flowers_white', 'flowers_blue', 'grass_tuft'], 34, { margin: 5, seed: 'b' });
}

// --------------------------------------------------------- МОЛОДАЯ СЕМЬЯ
function popYoung(sc) {
  // Молодая семья не выглядит как вечеринка: жизнь создают вещи и герои сцены.
  PUT(sc, 'coat_rack', 25.33, 204.57, [25.33, 201.14, 5.33, 4.29]);
  PUT(sc, 'shoes', 41.33, 208, null, 3);
  PUT(sc, 'floor_lamp', 160, 91.43, [160, 88, 4, 4.29]);
  PUT(sc, 'plant_big', 189.33, 201.14, [189.33, 197.71, 6.67, 5.14]);
  PUT(sc, 'laundry_basket', 138.67, 201.14, [138.67, 197.71, 6.67, 4.29]);
  PUT(sc, 'radio', 309.33, 55.43, null, 56.29);
  PUT(sc, 'window_night', 245.33, 14, null, 15);
  PUT(sc, 'wall_calendar', 285.33, 14, null, 15);
  PUT(sc, 'candle', 208, 125.71, null, 132.57);
  PUT(sc, 'books_stack', 94.67, 62.29, null, 54.57);
  PUT(sc, 'pillow_pile', 285.33, 184, null, 184.86);
}

// общая раскладка «бытового хлама»: по углам и вдоль стен, а не посреди прохода
function interiorFill(sc, rects) {
  rects.forEach((r, i) => {
    const kinds = r.kinds || ['books_stack', 'pillow_pile', 'candle'];
    sc.scatterDecor(r, kinds, r.n || 3, { margin: 6, spacing: 22, seed: 'int' + i, edge: 22 });
  });
}

// ---------------------------------------------- ДОМ СЕМЬИ (главы 4–7, конец)
function popHouse(sc, era) {
  // Постоянные жильцы и дети создаются соответствующими главами.
  // Поэтому здесь нет случайных гостей и «пыли в воздухе» посреди комнаты.
  PUT(sc, 'floor_lamp', 122.12, 55.43, [122.12, 52, 3.88, 4.29]);
  PUT(sc, 'plant_big', 123.41, 86.29, [123.41, 82.86, 6.47, 5.14]);
  PUT(sc, 'books_stack', 101.41, 53.71, null, 54.57);
  PUT(sc, 'doormat', 360.24, 213.14, null, 3);
  PUT(sc, 'coat_rack', 362.82, 76, [362.82, 72.57, 5.18, 4.29]);
  PUT(sc, 'laundry_basket', 28.94, 201.14, [28.94, 197.71, 6.47, 4.29]);
  PUT(sc, 'wall_calendar', 270.94, 14, null, 15);
  PUT(sc, 'fridge_magnets', 348.59, 45.14, null, 62.29);
  if (era === 'e5') {
    PUT(sc, 'stroller', 358.94, 130.86, [358.94, 127.43, 7.76, 4.29]);
    PUT(sc, 'high_chair', 287.76, 139.43, [287.76, 136, 5.18, 4.29]);
    PUT(sc, 'toy_cars', 167.41, 130.86, null, 3);
    PUT(sc, 'pillow_pile', 356.35, 185.71, null, 3);
  } else if (era === 'e6') {
    PUT(sc, 'school_desk', 219.18, 130.86, [219.18, 125.71, 10.35, 5.14]);
    PUT(sc, 'globe', 194.59, 136, null, 136.86);
    PUT(sc, 'guitar', 360.24, 88, [360.24, 84.57, 3.88, 4.29]);
    PUT(sc, 'table', 280, 105.14, [280, 100, 16.82, 6.86]);
    PUT(sc, 'aquarium', 280, 91.43, null, 106);
    PUT(sc, 'toy_cars', 158.35, 130.86, null, 3);
  } else if (era === 'e7') {
    PUT(sc, 'piano', 355.06, 98.29, [355.06, 91.43, 16.82, 8.57]);
    PUT(sc, 'candle', 309.76, 125.71, null, 132.57);
    PUT(sc, 'vase', 316.24, 125.71, null, 133.43);
    PUT(sc, 'books_stack', 199.76, 130.86, null, 131.71);
  } else if (era === 'e8' || era === 'e9') {
    PUT(sc, 'radio', 318.82, 139.43, null, 140.29);
    PUT(sc, 'vase', 312.35, 127.43, null, 132.57);
    PUT(sc, 'candle', 322.71, 127.43, null, 132.57);
    PUT(sc, 'plant_big', 269.65, 84.57, [269.65, 81.14, 6.47, 5.14]);
    PUT(sc, 'plant_big', 358.94, 113.71, [358.94, 110.29, 6.47, 5.14]);
  }
}

/* =====================================================================
   ГЛАВЫ 4–7 — общий «дом семьи» и вспомогательные штуки
   ===================================================================== */
