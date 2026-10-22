const TamirLife = {
  ensure() {
    const d = DEFAULT_STATE().tamirLife;
    GameState.tamirLife = Object.assign(d, GameState.tamirLife || {});
    return GameState.tamirLife;
  },

  heardEachOther() {
    const t = this.ensure();
    t.daysSinceTalk = 0;
    t.openness = Math.min(100, t.openness + 7);
    GameState.life.routines.talks++;
  },

  nextDay() {
    const t = this.ensure();
    t.daysSinceTalk++;
    t.energy = Math.max(20, Math.min(100, t.energy + (Math.random() < 0.5 ? 8 : -5)));
  },

  schedule(scene) {
    if (!scene) return;
    scene._tamirInitiativeLeft = 18000 + Math.random() * 16000;
  },

  tick(scene, delta) {
    if (!scene || !scene.tamir || scene.locked || scene._livingDay || scene._tamirInitiating) return;
    if (scene._tamirInitiativeLeft === undefined) this.schedule(scene);
    scene._tamirInitiativeLeft -= delta || 16;
    if (scene._tamirInitiativeLeft <= 0) scene.safeRun(() => this.initiate(scene));
  },

  async initiate(scene) {
    if (!scene.tamir || scene.locked || scene._tamirInitiating) return;
    const t = this.ensure();
    scene._tamirInitiating = true;
    scene.lockInput();
    if (scene.interactions) scene.interactions.needRelease = true;
    try {
      const far = Phaser.Math.Distance.Between(scene.tamir.sprite.x, scene.tamir.sprite.y, scene.player.sprite.x, scene.player.sprite.y) > 85;
      if (far) {
        scene.tamir.moveTo(scene.player.sprite.x + 22, scene.player.sprite.y);
        await wait(scene, 1100);
      }
      const topic = t.daysSinceTalk >= 2 ? 'silence' : (t.energy < 42 ? 'tired' : ['walk', 'keys', 'work'][Math.floor(Math.random() * 3)]);
      t.lastTopic = topic;
      t.initiatives++;
      if (topic === 'silence') {
        await scene.ui.dialogue([
          { who: 'Тамир', text: 'Можно странный вопрос? Мы в последнее время рядом — но как будто каждый в своей комнате.', mood: 'worried' },
          { who: 'Настя', text: 'Я тоже это чувствую.' },
        ]);
        const pick = await scene.ui.choice('Тамир сам начал этот разговор.', ['Сесть рядом и поговорить', 'Сказать: «Давай после ужина»']);
        if (pick === 0) {
          await scene.ui.dialogue([{ who: 'Тамир', text: 'Спасибо. Мне не нужен идеальный разговор. Просто ты.' }]);
          this.heardEachOther(); adjustRelationship({ trust: 1, closeness: 1 });
          MemorySystem.remember('tamir-talk-' + GameState.life.completedDays, 'Разговор, который начал Тамир');
        } else {
          await scene.ui.dialogue([{ who: 'Тамир', text: 'Хорошо. Только давай не потеряем это «после».', mood: 'worried' }]);
          addStat('avoid');
        }
      } else if (topic === 'tired') {
        await scene.ui.dialogue([
          { who: 'Тамир', text: 'Сегодня я ничего не починил, не решил и даже не придумал ужин. Можно я просто посижу рядом?', mood: 'worried' },
          { who: 'Настя', text: 'Можно.' },
        ]);
        const pick = await scene.ui.choice('Что ответить?', ['Сделать чай и спросить, что случилось', 'Сказать, что у тебя тоже нет сил']);
        if (pick === 0) {
          this.heardEachOther(); addStat('habits'); adjustRelationship({ warmth: 1 });
          MemorySystem.remember('tamir-tea-' + GameState.life.completedDays, 'Чай после трудного дня');
        } else {
          await scene.ui.dialogue([{ who: 'Тамир', text: 'Тогда давай просто молчать вместе. Это тоже план.', mood: 'happy' }]);
          addStat('habits');
        }
      } else if (topic === 'walk') {
        await scene.ui.dialogue([{ who: 'Тамир', text: 'Пойдём пройдёмся? Без цели. Я весь день смотрел в одну точку и ей, кажется, надоело.', mood: 'happy' }]);
        const pick = await scene.ui.choice('Вечер внезапно освободился.', ['Пойти вместе', 'Остаться дома']);
        if (pick === 0) {
          await scene.ui.dialogue([{ who: '', text: 'Они выходят без маршрута. Через полчаса возвращаются с булочкой, которую никто не планировал покупать.' }]);
          this.heardEachOther(); addStat('habits'); adjustRelationship({ warmth: 1 });
          MemorySystem.remember('tamir-walk-' + GameState.life.completedDays, 'Прогулка без причины');
        } else {
          await scene.ui.dialogue([{ who: 'Тамир', text: 'Ладно. Я тогда принесу тебе что-нибудь вкусное по дороге.', mood: 'happy' }]);
          t.energy = Math.min(100, t.energy + 4);
        }
      } else if (topic === 'keys') {
        await scene.ui.dialogue([{ who: 'Тамир', text: 'Ты не видела ключи? Я положил их в очень надёжное место. Настолько надёжное, что теперь его не знает даже я.', mood: 'worried' }]);
        const pick = await scene.ui.choice('Обычная маленькая беда.', ['Искать вместе', 'Подшутить, а потом помочь']);
        if (pick === 0) {
          await scene.ui.dialogue([{ who: '', text: 'Ключи находятся в холодильнике. Никто не спрашивает почему. Иногда любовь — это молча не задавать очевидных вопросов.' }]);
          this.heardEachOther(); addStat('habits');
        } else {
          await scene.ui.dialogue([{ who: 'Настя', text: 'Это надёжное место называется «холодильник»?' }, { who: 'Тамир', text: 'Там прохладно. Ключи не перегреются.', mood: 'happy' }]);
          this.heardEachOther(); adjustRelationship({ warmth: 1 });
        }
      } else {
        await scene.ui.dialogue([{ who: 'Тамир', text: 'Я весь день думал о работе и понял, что хочу услышать, как прошёл твой. Расскажешь?', mood: 'happy' }]);
        const pick = await scene.ui.choice('Он ждёт ответа.', ['Рассказать честно', 'Отшутиться и сменить тему']);
        if (pick === 0) {
          this.heardEachOther(); addStat('talk'); adjustRelationship({ trust: 1 });
          MemorySystem.remember('tamir-work-' + GameState.life.completedDays, 'Вечерний вопрос без спешки');
        } else {
          await scene.ui.dialogue([{ who: 'Тамир', text: 'Ладно. Я подожду, когда шутка станет не единственным ответом.', mood: 'worried' }]);
          addStat('avoid');
        }
      }
      SaveSystem.save();
    } finally {
      scene._tamirInitiating = false;
      this.schedule(scene);
      scene.unlockInput();
    }
  },
};
