class EndingScene extends HouseScene {
  constructor() { super('Ending'); }

  init(data) { this.endId = (data && data.id) || computeEnding(); }

  create() {
    GameState.chapter = 'ending';
    GameState.ageStage = 'old';
    this.houseCreate({ era: 'empty', tint: 0xffe0a8, tintAlpha: 0.12, ambience: 'home' });
    [this.mars, this.abilka].forEach((c) => { if (c) { c.destroy(); this.cats = this.cats.filter((x) => x !== c); } });
    this.mars = null; this.abilka = null;
    this.interactions.clear();
    this.lockInput();
    this.ui.clearQuest();
    this.player.setPosition( 296.82, 148);
    this.spawnTamir( 322.71, 130.86, 'left');
    this.buildGraveTableau();
    this.buildNightTableau();
    this.ui.fadeIn(900);
    this.jump( 309.76, 113.71, CFG.ZOOM);
    this.safeRun(() => this['ending' + this.endId]());
  }

  jump(cx, cy, zoom = CFG.ZOOM) {
    const cam = this.cameras.main;
    cam.stopFollow(); cam.removeBounds(); cam.setZoom(zoom); cam.centerOn(cx, cy);
  }
  async cut(cx, cy, zoom = CFG.ZOOM, ms = 600) {
    await this.ui.fadeOut(ms);
    this.jump(cx, cy, zoom);
    await this.ui.fadeIn(ms);
  }
  async lines(arr, ms = 2200) { for (const t of arr) await this.ui.caption(t, ms); }

  buildGraveTableau() {
    const ox = 2400;
    this.add.rectangle(ox, 0, 480, 260, 0x24402e).setOrigin(0, 0).setDepth(0);
    this.add.rectangle(ox, 0, 480, 90, 0x1b2740).setOrigin(0, 0).setDepth(0);
    [20, 120, 220, 330, 440].forEach((x, i) => this.add.image(ox + x, 110 + (i % 2) * 6, 'tree').setOrigin(0.5, 1).setDepth(96.57));
    this.graveA = this.add.image(ox + 214, 170, 'grave').setOrigin(0.5, 1).setDepth(148);
    this.graveB = this.add.image(ox + 244, 170, 'grave').setOrigin(0.5, 1).setDepth(148);
    this.add.image(ox + 214, 175, 'flowerpot').setOrigin(0.5, 1).setDepth(152.29);
    this.add.image(ox + 244, 175, 'flowerpot').setOrigin(0.5, 1).setDepth(152.29);
    this.gBella = this.add.sprite(ox + 205, 200, 'bella_adult', 4).setOrigin(0.5, 1).setDepth(173.71);
    this.gNia = this.add.sprite(ox + 253, 200, 'nia_adult', 4).setOrigin(0.5, 1).setDepth(173.71);
    this.graveX = ox + 229;
  }

  buildNightTableau() {
    const ox = 3200;
    this.add.rectangle(ox, 0, 480, 270, 0x07070f).setOrigin(0, 0).setDepth(0);
    for (let i = 0; i < 40; i++) {
      this.add.rectangle(ox + Phaser.Math.Between(4, 476), Phaser.Math.Between(4, 120), 1, 1, 0xdad6c4, Phaser.Math.FloatBetween(0.3, 0.9)).setDepth(1);
    }
    this.nightHouse = this.add.image(ox + 200, 190, 'house_night').setOrigin(0.5, 1).setDepth(10);
    this.nightNeighbor = this.add.image(ox + 300, 190, 'house_neighbor').setOrigin(0.5, 1).setDepth(10).setAlpha(0);
    this.nightX = ox + 250;
  }

  async finish(roman, name, sub) {
    GameState.flags['ending' + this.endId] = true;
    SaveSystem.save();
    await this.ui.fadeOut(1000);
    await this.ui.chapterCard(`КОНЦОВКА ${roman}`, `«${name}»`, 3400);
    if (sub) await this.ui.caption(sub, 3200);
    await this.credits();
  }

  async credits() {
    const seen = [1, 2, 3, 4, 5, 6, 7, 8].filter((i) => GameState.flags['ending' + i]).length;
    await this.ui.caption('ПОКА ГОРИТ СВЕТ', 2600);
    await this.ui.caption('История Насти и Тамира. Марса и Абилки. Беллы и Нии.', 3000);
    await this.ui.caption('Одна жизнь, прожитая по-разному.', 2800);
    await this.ui.caption(`Концовок открыто: ${seen} из 8.`, 3000);
    await this.ui.caption('Спасибо, что прожили её вместе с ними.', 3200);
    GameState.chapter = 'ending';
    SaveSystem.save();
    Audio.stopMelody(); Audio.stopAmbience(1.0);
    this.scene.start('MainMenu');
  }

  // montage (the "life flashing by" from the original scenario)
  async montage() {
    const F = GameState.flags;
    const m = ['Настя и Тамир познакомились.', 'Первый поцелуй.', 'Марс.', 'Абилка.', 'Свадьба.'];
    if (F.photoBella) m.push('Белла — на ковре, с Марсом в обнимку.'); else m.push('Белла.');
    m.push('Ния.');
    if (F.photoMars === 'frame') m.push('Рыжий на новом диване.');
    if (F.shardKept) m.push('Осколок синей кружки.');
    m.push('Семейный ужин.', 'Ссора.', 'Примирение.', 'Праздник.', 'Выпускной.', 'Старость.', 'Балкон.');
    // These lines are not authored milestones: they are the small things
    // this particular player chose to keep, photograph or say aloud.
    const personal = MemorySystem.finaleLines();
    if (personal.length) m.push('И ещё — ' + personal[0] + '.');
    personal.slice(1).forEach((line) => m.push(line + '.'));
    Audio.startMelody();
    for (const t of m) await this.ui.caption(t, 900);
  }

  // ===================================================================
  // I. «Вместе до конца»
  async ending1() {
    await this.ui.caption('Долгая жизнь. Две взрослые дочери. Старый дом. Коты, которых давно нет.', 3600);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Знаешь, что самое странное?' },
      { who: 'Настя', text: 'Что мы до сих пор не придумали, что делать с этим диваном?' },
      { who: 'Тамир', text: 'Что мне не страшно.' },
      { who: 'Настя', text: '...' },
      { who: 'Тамир', text: 'Раньше я боялся многого. Не успеть. Не справиться. Не удержать. А сейчас я смотрю на этот дом и думаю: если это всё — этого было достаточно.' },
      { who: 'Настя', text: 'Для меня тоже.', mood: 'happy' },
    ]);
    await this.ui.fadeOut(800);
    await this.ui.caption('Тамир уходит весной. Тихо. Утром, когда в окно уже светит солнце.', 4000);
    this.tamir.setPosition(-200, -200);
    this.player.setPosition( 296.82, 96.57);
    await this.ui.fadeIn(800);
    await this.ui.caption('Игра не заканчивается. Настя продолжает жить.', 3000);
    await Chronicle.widowDays(this);
    await this.ui.dialogue([
      { who: '', text: 'Она завтракает одна. Ставит на стол две кружки — и убирает одну.' },
      { who: 'Настя', text: 'Ты опять поставил кружку не туда.', mood: 'happy' },
      { who: '', text: 'Никто не отвечает. Но в голове ответ звучит так ясно, что она улыбается.' },
      { who: 'Тамир', text: '(в памяти) Тебе не должна быть интересна кружка.' },
      { who: 'Настя', text: 'Нет. Мне интересен ты.', mood: 'happy' },
    ]);
    await this.cut(this.balcOX + 236, 160, 2.6, 700);
    this.balcT.setVisible(false);
    await this.ui.dialogue([
      { who: 'Настя', text: 'Сегодня звонила Белла. Рассказывала про выставку. Ния привезёт внуков на выходные. Знаешь, они похожи на тебя. Особенно когда обижаются.' },
      { who: 'Настя', text: 'Я не скучаю. Я просто... разговариваю.', mood: 'happy' },
    ]);
    await this.ui.caption('Проходят годы. Не быстро, не медленно — так, как проходят.', 3400);
    await this.ui.fadeOut(800);
    Chronicle.state().milestones.secondLoss = true;
    await this.ui.caption('Однажды утром Настя не просыпается. Мирно. С окном, открытым на балкон.', 4200);
    this.jump(this.graveX, 150, 2.6);
    await this.ui.fadeIn(900);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Знаешь, о чём я думаю? Что у них всё было правильно. Не идеально. Правильно.' },
      { who: 'Ния', text: 'Они просто остались. Каждый день.' },
    ]);
    await this.montage();
    await Chronicle.houseTour(this);
    Audio.stopMelody();
    this.jump(this.nightX, 130, 2.2);
    await this.ui.fadeOut(500);
    await this.ui.fadeIn(1200);
    await this.ui.caption('Их дом. Пустой. Свет выключен.', 3400);
    this.tweens.add({ targets: this.nightNeighbor, alpha: 1, duration: 1800 });
    await wait(this, 2200);
    await this.ui.caption('Но в окне соседнего дома уже горит новый свет.', 3400);
    await this.ui.caption('Жизнь продолжается.', 3000);
    await this.finish('I', 'Вместе до конца', null);
  }

  // II. «Дом, который остался»
  async ending2() {
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Я вот думаю... Может, пора что-то поменьше? Мы и по этим трём комнатам едва ходим.' },
      { who: 'Настя', text: 'Нет.' },
      { who: 'Тамир', text: 'Я ещё ничего не предложил.' },
      { who: 'Настя', text: 'Нет, Тамир. Здесь стоит стол, на который Белла приклеила жвачку. Здесь шкаф, на котором сидел Марс. Здесь окно, в которое Ния смотрела на дождь.' },
      { who: 'Тамир', text: 'Это вещи.' },
      { who: 'Настя', text: 'Это не вещи. Это стены, которые нас помнят.', mood: 'happy' },
      { who: '', text: 'Тамир долго смотрит на неё. И вдруг соглашается — с той мягкой неохотой, с какой соглашаются только с очень любимыми людьми.' },
    ]);
    await this.ui.caption('Дом стал слишком тихим. Но Настя ни разу не пожалела, что остались.', 3600);
    await this.ui.caption('Проходят годы. Много лет. Дом переходит к Белле.', 3600);
    await this.ui.fadeOut(700);
    this.tamir.setPosition(-200, -200); this.player.setPosition(-200, -200);
    this.kidsTmp = this.spawnKid('bella_adult', 362.82, 201.14, 'up');
    await this.cut( 296.82, 122.29, CFG.ZOOM, 700);
    this.kidsTmp.moveTo( 347.29, 105.14);
    await wait(this, 2600);
    this.kidsTmp.moveTo( 357.65, 53.71);
    await wait(this, 1600);
    await this.ui.dialogue([
      { who: '', text: 'Белла входит в старый дом. Он пахнет чаем и дождём. Здесь всё то же самое, только тише.' },
      { who: '', text: 'На стене остаётся фотография родителей. Они на ней смеются — оба, как будто ей только что сказали что-то очень глупое и очень нужное.' },
    ]);
    await this.focus( 357.65, 53.71, CFG.ZOOM + 1.4, 900);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Привет. Я вернулась.', mood: 'happy' },
      { who: 'Белла', text: 'Я ничего не буду менять. Обещаю. Ну, почти. Диван сменю. Мам, прости, но он ужасен.', mood: 'happy' },
    ]);
    const nf = this.add.image( 373.18, 14, 'picture_frame').setScale(0.86).setOrigin(0.5, 1).setDepth(15).setAlpha(0);
    this.tweens.add({ targets: nf, alpha: 1, duration: 1500 });
    await wait(this, 1700);
    await this.ui.caption('Она ставит рядом новую фотографию — свою семью.', 3600);
    await this.ui.caption('Дом не заканчивается вместе с Настей.', 3400);
    await this.finish('II', 'Дом, который остался', null);
  }

  // III. «Мы всё ещё здесь»
  async ending3() {
    await this.ui.caption('Они не были идеальными. Ссорились о деньгах. О детях. О том, чья очередь.', 3600);
    await this.ui.caption('Но каждый раз — выбирали друг друга.', 3200);
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Ты опять поставила кружку не туда.' },
      { who: 'Настя', text: 'Тебе семьдесят.' },
      { who: 'Тамир', text: 'И?' },
      { who: 'Настя', text: 'И тебе не должна быть интересна кружка.' },
      { who: 'Тамир', text: 'Она стоит не там.' },
      { who: 'Настя', text: 'Она стоит там, где стоит. Там, где стояла сорок лет.', mood: 'happy' },
      { who: 'Тамир', text: 'Я знаю. Просто мне нравится, когда ты закатываешь глаза.' },
      { who: 'Настя', text: 'Ты невыносим.', mood: 'happy' },
      { who: 'Тамир', text: 'И всё ещё здесь.', mood: 'happy' },
      { who: '', text: 'Настя смеётся. Громко, по-настоящему. Так, как смеются люди, которым не нужно никому ничего доказывать.' },
    ]);
    await this.ui.caption('Камера медленно отдаляется.', 3000);
    this.cameras.main.zoomTo(1.4, 4500);
    await wait(this, 4800);
    await this.ui.caption('Они всё ещё здесь.', 4000);
    await this.finish('III', 'Мы всё ещё здесь', null);
  }

  // IV. «Поздно»
  async ending4() {
    await this.ui.caption('Они любили друг друга. Это никогда не было вопросом.', 3200);
    await this.ui.caption('Вопросом было другое: когда поговорить.', 3200);
    this.tamir.setPosition( 329.18, 96.57); this.tamir.dir = 'down';
    this.player.setPosition( 296.82, 130.86); this.player.dir = 'right';
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Нам надо будет обсудить...' },
      { who: 'Настя', text: 'Потом поговорим. Я устала.' },
      { who: 'Тамир', text: 'Да. Конечно.' },
    ]);
    await this.ui.caption('Потом превратилось в «на выходных». Выходные — в «после отпуска». Отпуск — в «когда дети поедут».', 4400);
    await this.ui.fadeOut(900);
    this.tamir.setPosition(-200, -200);
    this.player.setPosition( 296.82, 130.86);
    await this.ui.caption('Дети замечают. Дом становится тише ещё до их отъезда.', 3600);
    await this.ui.fadeIn(900);
    await this.ui.dialogue([
      { who: 'Белла', text: 'Мам. А вы вообще разговариваете? Не про то, что купить. А просто разговариваете?', mood: 'worried' },
      { who: 'Настя', text: 'Конечно. Мы... разговариваем.' },
      { who: 'Белла', text: 'Когда последний раз?', mood: 'worried' },
      { who: 'Настя', text: '...' },
    ]);
    await this.ui.caption('Они не разводятся. Они просто постепенно становятся чужими. В конце живут раздельно.', 4400);
    await this.ui.caption('Без громкой ссоры. Без трагедии.', 3000);
    await this.ui.fadeOut(900);
    this.player.setPosition( 309.76, 130.86);
    this.jump( 309.76, 113.71, CFG.ZOOM + 0.6);
    await this.ui.fadeIn(900);
    await this.ui.dialogue([
      { who: '', text: 'Кухня. Два стула. Один — с вмятиной, которую оставил много лет подряд один и тот же человек. Теперь он пуст.' },
      { who: 'Настя', text: 'Я бы ему сейчас позвонила. Я бы сказала...' },
      { who: '', text: 'Она берёт телефон. Находит имя. Держит палец над кнопкой. Что именно сказать? Слова, которые когда-то казались простыми, кончились так давно, что вместо них остался воздух.' },
    ]);
    await this.ui.caption('Однажды Настя понимает:', 3000);
    await this.ui.caption('Они слишком долго откладывали разговор.', 4600);
    await this.finish('IV', 'Поздно', 'Иногда любви мало. Нужно ещё сказать вслух.');
  }

  // V. «Оставь свет»
  async ending5() {
    await this.ui.dialogue([
      { who: 'Тамир', text: 'Если вдруг я первым...' },
      { who: 'Настя', text: 'Не начинай.' },
      { who: 'Тамир', text: 'Я не прощаюсь. Просто: не закрывайся. Живи. Ладно?' },
      { who: 'Настя', text: '...Ладно.', mood: 'worried' },
    ]);
    await this.ui.fadeOut(800);
    this.tamir.setPosition(-200, -200);
    await this.ui.caption('Тамир умирает раньше. Настя остаётся одна.', 4000);
    this.player.setPosition( 296.82, 122.29);
    await this.ui.fadeIn(800);
    await this.ui.caption('Но она не закрывается от жизни.', 3000);
    await Chronicle.widowDays(this);
    await this.ui.dialogue([
      { who: '', text: 'Она продолжает встречаться с детьми. Ходит в гости. Помогает соседям — Люде с третьего этажа носит рассаду, и они пьют чай до темноты.' },
      { who: '', text: 'Едет к морю, к которому «когда-нибудь». Первый раз — одна. Второй — с Беллой. Третий — просто так, потому что можно.' },
      { who: '', text: 'Она не «заменяет» Тамира. Она продолжает жить. Это разные вещи.' },
    ]);
    await this.ui.fadeOut(800);
    Audio.stopAmbience(0.5);
    // night, only the kitchen lamp
    const dark = this.add.rectangle( 212.71, 112, 582.35, 428.57, 0x04040c, 0.82).setDepth(900);
    this.player.setPosition( 309.76, 139.43); this.player.dir = 'up';
    this.jump( 309.76, 113.71, CFG.ZOOM + 0.8);
    await this.ui.fadeIn(900);
    await this.ui.caption('Поздно вечером Настя включает свет на кухне.', 3600);
    const lamp = this.add.image( 309.76, 105.14, 'glow').setScale(0.86).setScale(2.4).setDepth(901).setAlpha(0).setTint(0xffd27a);
    this.tweens.add({ targets: lamp, alpha: 0.8, duration: 1200 });
    this.tweens.add({ targets: dark, alpha: 0.55, duration: 1200 });
    Audio.playChime();
    await wait(this, 1800);
    await this.ui.caption('Садится одна. Смотрит в окно.', 3600);
    await this.ui.caption('И улыбается.', 4000);
    await this.finish('V', 'Оставь свет', null);
  }

  // VI. «Дети вернулись»
  async ending6() {
    await this.ui.caption('Семейная близость — не просто слова. Белла и Ния чаще и чаще возвращаются в дом.', 3800);
    await this.ui.caption('Последние годы дом снова наполняется голосами.', 3400);
    this.player.setPosition( 290.35, 148); this.player.dir = 'right';
    this.tamir.setPosition( 329.18, 130.86); this.tamir.dir = 'left';
    this.bellaE = this.spawnKid('bella_adult', 303.29, 81.14, 'up');
    this.niaE = this.spawnKid('nia_adult', 316.24, 152.29, 'left');
    this.jump( 316.24, 109.43, CFG.ZOOM + 0.8);
    Audio.startMelody();
    await this.ui.dialogue([
      { who: 'Белла', text: 'Мам, где у тебя соль? Опять переставила?' },
      { who: 'Настя', text: 'Она всегда там, где была.' },
      { who: 'Белла', text: 'Её там нет.' },
      { who: 'Тамир', text: 'Я переставил.' },
      { who: 'Ния', text: 'Пап, ты не можешь просто так переставлять соль. Это нарушает логику системы!', mood: 'happy' },
      { who: 'Тамир', text: 'Ты девочка с системой. Я мужчина с солью. Мы квиты.', mood: 'happy' },
      { who: 'Ния', text: 'Это не аргумент.' },
      { who: 'Тамир', text: 'Это жизненный опыт.', mood: 'happy' },
      { who: 'Белла', text: 'Мам, они опять!', mood: 'happy' },
      { who: 'Настя', text: 'Я не вмешиваюсь. Мне нравится слушать.', mood: 'happy' },
      { who: '', text: 'Смех, звон посуды, чей-то голос из соседней комнаты. Настя сидит на кухне и наслаждается тем самым шумом, которого когда-то так хотела избежать.' },
    ]);
    await this.focus( 357.65, 49.43, CFG.ZOOM + 1.2, 1200);
    await this.ui.caption('Камера медленно скользит по старым фотографиям на стене.', 3400);
    await this.ui.caption('Дом снова шумный.', 4000);
    Audio.stopMelody();
    await this.finish('VI', 'Дети вернулись', null);
  }

  // VII. «Тишина»
  async ending7() {
    await this.ui.caption('Она не плохой человек. Просто слишком часто выбирала: «Потом поговорим».', 4200);
    await this.ui.caption('Потом наступило слишком быстро.', 3800);
    await this.ui.fadeOut(900);
    this.tamir.setPosition(-200, -200);
    this.player.setPosition( 296.82, 139.43);
    await this.ui.caption('Дети живут своей жизнью. Тамира больше нет. Даже небольшой дом кажется огромным.', 4200);
    await this.ui.fadeIn(900);
    this.player.moveToScripted( 199.76, 130.86, () => {});
    await wait(this, 2600);
    this.player.moveToScripted( 167.41, 173.71, () => {});
    await wait(this, 2200);
    this.player.releaseScript();
    await this.ui.dialogue([
      { who: '', text: 'Настя ходит по дому одна. Комната Беллы. Комната Нии. Кухня. Каждая дверь открывается тише, чем раньше.' },
    ]);
    await this.cut(this.balcOX + 236, 160, 2.6, 800);
    this.balcT.setVisible(false);
    await this.ui.caption('Она садится на балкон. Смотрит на пустое кресло.', 4600);
    await this.ui.dialogue([
      { who: 'Настя', text: 'Мне хотелось не другой жизни.' },
      { who: 'Настя', text: 'Мне хотелось чаще замечать ту, которая у меня уже была.', mood: 'worried' },
    ]);
    await this.ui.caption('И впервые за много лет она понимает это.', 4400);
    await this.finish('VII', 'Тишина', 'Тишина — это тоже слово. Просто слишком поздно услышанное.');
  }

  // VIII. «Ещё один день» (редкая)
  async ending8() {
    await this.ui.caption('Настя всю жизнь старалась не откладывать жизнь.', 3600);
    await this.lines(['Путешествовала.', 'Поддерживала Тамира.', 'Проводила время с детьми.', 'Исполняла маленькие мечты.', 'Не боялась менять планы.'], 1500);
    await this.ui.caption('Финал не показывает смерть.', 3200);
    await this.ui.fadeOut(1000);
    this.player.setPosition( 70.35, 173.71); this.player.dir = 'down';
    this.tamir.setPosition( 316.24, 94.86); this.tamir.dir = 'down';
    this.jump( 199.76, 113.71, CFG.ZOOM);
    const sun = this.add.rectangle( 212.71, 112, 582.35, 428.57, 0xffe9a8, 0.18).setDepth(900).setBlendMode(Phaser.BlendModes.ADD);
    Audio.startMelody();
    await this.ui.fadeIn(1400);
    await this.ui.caption('Обычное утро.', 3200);
    this.player.moveToScripted( 283.88, 105.14, () => {});
    this.cameras.main.pan( 296.82, 105.14, 2600, 'Sine.easeInOut');
    await wait(this, 3000);
    this.player.releaseScript();
    this.player.dir = 'right';
    await this.ui.dialogue([
      { who: '', text: 'Тамир уже на кухне. Он ставит перед ней чашку чая — не слишком крепкий.' },
      { who: 'Тамир', text: 'Доброе утро.', mood: 'happy' },
      { who: 'Настя', text: 'Доброе.', mood: 'happy' },
    ]);
    await wait(this, 1200);
    this.cameras.main.pan( 322.71, 70.86, 3000, 'Sine.easeInOut');
    await this.ui.caption('Камера смотрит на солнечный свет.', 3600);
    await this.ui.fadeOut(1400);
    await this.ui.chapterCard('«Иногда самый хороший день —', 'тот, который ничем не отличается от остальных.»', 5400);
    GameState.flags.ending8 = true;
    SaveSystem.save();
    await this.ui.chapterCard('КОНЦОВКА VIII', '«Ещё один день»', 3200);
    await this.credits();
  }
}

/* =====================================================================
   Bootstrap
   ===================================================================== */
