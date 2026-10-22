Object.assign(AdaptiveUI, {
  savePreferences() {
    if (!UserSettings.save()) this.ui?.saveToast('Настройки действуют сейчас, но браузер не смог их запомнить.');
  },
  textControls(card) {
    for (const [key, title, options] of [
      ['textSize','Размер текста',[['normal','Обычный'],['large','Крупный'],['largest','Очень крупный']]],
      ['textSpeed','Появление текста',[['slow','Медленно'],['normal','Обычно'],['fast','Быстро']]],
    ]) {
      const row = this.node('label', 'ad-setting', title), select = this.node('select');
      for (const [value,label] of options) { const option = this.node('option', '', label); option.value = value; select.append(option); }
      select.value = GameState.settings[key];
      select.addEventListener('change', () => { GameState.settings[key] = select.value; this.savePreferences(); });
      row.append(select); card.append(row);
    }
    card.append(this.node('p', 'ad-text-preview', 'Свет в окне. Знакомый голос. Мы снова дома.'));
    card.append(this.node('p', 'ad-help', 'Скорость применяется со следующей реплики. Даже быстрый текст появляется постепенно — пропуска диалогов нет.'));
    this.button('Повторить обучение', () => { Tutorial.restart(); this.ui?.saveToast('Подсказки появятся после возвращения в игру.'); }, card);
  },
});
