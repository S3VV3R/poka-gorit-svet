const DaughtersSystem = {
  available() {
    return GameState.ageStage === 'mid' || GameState.ageStage === 'old' || GameState.flags.bellaLeft || GameState.flags.niaLeft;
  },

  async call(scene) {
    if (!this.available() || scene._callingDaughter) return;
    const life = LifeSystem.ensure();
    scene._callingDaughter = true;
    scene.lockInput();
    if (scene.interactions) scene.interactions.needRelease = true;
    try {
      const who = await scene.ui.choice('Кому позвонить?', ['Белле', 'Ние', 'Никому — сегодня хочется тишины']);
      if (who === 2) {
        await scene.ui.dialogue([{ who: '', text: 'Телефон остаётся на столе. Тишина не всегда означает одиночество — иногда это просто передышка.' }]);
        addStat('rest');
        return;
      }
      const isBella = who === 0;
      const name = isBella ? 'Белла' : 'Ния';
      const key = isBella ? 'bella' : 'nia';
      const number = ++life.daughters[key + 'Calls'];
      const update = (n) => { life.daughters[key] = Math.max(0, Math.min(10, life.daughters[key] + n)); };
      const topic = isBella
        ? (number % 2 ? 'У нас открыли маленькую выставку. Я повесила одну работу — ту самую, с дождём.' : 'Я научилась делать суп без твоих голосовых сообщений. Но всё равно звоню, чтобы уточнить, сколько соли.')
        : (number % 2 ? 'Я сегодня весь день собирала шкаф. Оказывается, взрослость — это когда ты радуешься полке.' : 'У меня на работе был сложный день. Хотела просто услышать ваш дом.');
      await scene.ui.dialogue([{ who: name, text: topic, mood: 'happy' }]);
      const pick = await scene.ui.choice('Как ответить?', ['Сначала спросить и выслушать', 'Дать совет', 'Позвать в гости на выходных']);
      if (pick === 0) {
        await scene.ui.dialogue([{ who: name, text: 'Спасибо, мам. Иногда мне именно этого и надо — чтобы меня не торопили.', mood: 'happy' }]);
        update(2); addStat('kidsBond'); addStat('talk');
        MemorySystem.remember('call-' + key + '-' + number, 'Долгий звонок с ' + name);
      } else if (pick === 1) {
        await scene.ui.dialogue([{ who: name, text: 'Ты всё ещё умеешь решить мою жизнь за три минуты. Но... спасибо. Я подумаю.', mood: 'happy' }]);
        update(1); addStat('kidsBond');
      } else {
        await scene.ui.dialogue([{ who: name, text: 'Приеду. И привезу что-нибудь, что нельзя ставить на тот старый диван.', mood: 'happy' }]);
        update(2); addStat('kidsBond'); addStat('habits');
        MemorySystem.remember('visit-' + key + '-' + number, 'Обещание увидеться с ' + name);
      }
      life.routines.familyCalls++;
      SaveSystem.save();
    } finally {
      scene._callingDaughter = false;
      scene.unlockInput();
    }
  },
};
