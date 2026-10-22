Object.assign(AdaptiveUI, {
  createMenus() {
    this.menu = this.node('section', 'ad-screen ad-menu'); this.menu.hidden = true;
    this.menu.setAttribute('role', 'dialog'); this.menu.setAttribute('aria-label', 'Меню игры');
    this.root.append(this.menu);
  },
  refreshDeviceStatus() {
    if (this.deviceStatus) this.text(this.deviceStatus, GamePerformance.details());
    if (this.deviceSummary) this.text(this.deviceSummary, GamePerformance.summary());
  },
  volumeControls(card) {
    for (const [key, label, setter] of [['music', 'Музыка', 'setMusicVolume'], ['sfx', 'Звуки', 'setSfxVolume']]) {
      const row = this.node('label', 'ad-setting', label);
      const input = this.node('input'); input.type = 'range'; input.min = 0; input.max = 100; input.step = 5;
      input.value = Math.round(GameState.settings[key] * 100);
      input.addEventListener('input', () => { Audio.unlock(); Audio[setter](Number(input.value) / 100); });
      input.addEventListener('change', () => this.savePreferences()); row.append(input); card.append(row);
    }
    this.textControls(card);
    const quality = this.node('label', 'ad-setting', 'Производительность');
    const select = this.node('select');
    for (const [value, label] of [['auto','Автоматически'],['eco','Экономный режим · 30 кадров/с'],['full','Плавный режим · 60 кадров/с']]) {
      const option = this.node('option', '', label); option.value = value; select.append(option);
    }
    select.value = this.quality(); select.addEventListener('change', () => this.setQuality(select.value));
    quality.append(select); card.append(quality);
    const device = this.node('details', 'ad-device');
    device.append(this.node('summary', '', 'Проверка устройства'));
    this.deviceStatus = this.node('p', 'ad-help ad-reading');
    device.append(this.deviceStatus); this.refreshDeviceStatus();
    this.button('Проверить заново', () => {
      select.value = 'auto'; this.setQuality('auto');
    }, device);
    card.append(device);
    if (document.fullscreenEnabled) this.button(document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen();
      } catch { this.text(this.toast, 'Браузер не разрешил полноэкранный режим. Игра продолжает работать.'); }
    }, card);
    card.append(this.node('p', 'ad-help', 'Клавиатура: WASD / стрелки — движение, E — действие, Esc — пауза. На сенсорном экране: джойстик и кнопка «Действие». Можно удерживать их одновременно.'));
  },
  syncMenus(active) {
    const scene = active.find(sc => sc.scene.key === 'Pause') || active.find(sc => sc.scene.key === 'MainMenu');
    this.menuOpen = !!scene;
    this.show(this.menu, !!scene);
    if (!scene) { this.menuScene = null; this.menuKey = null; return; }
    scene.input.enabled = false;
    const panel = scene.panels?.find(p => p.visible) || null;
    if (scene === this.menuScene && panel === this.menuKey) return;
    this.menuScene = scene; this.menuKey = panel; this.releaseControls(); this.menu.replaceChildren();
    this.deviceStatus = this.deviceSummary = null;
    const card = this.node('div', 'ad-card'); this.menu.append(card);
    const pause = scene.scene.key === 'Pause';
    card.append(this.node('h1', '', pause ? 'Пауза' : 'ПОКА ГОРИТ СВЕТ'));
    if (panel) {
      const titles = new Map([[scene.settingsPanel,'Настройки'],[scene.chapterPanel,'Главы'],[scene.achPanel,'Достижения'],[scene.galleryPanel,'Воспоминания'],[scene.aboutPanel,'О главах']]);
      card.append(this.node('h2', '', titles.get(panel) || 'Меню'));
      this.button('← Назад', () => scene.panels.forEach(p => p.setVisible(false)), card);
      if (panel === scene.settingsPanel) this.volumeControls(card);
      else if (panel === scene.chapterPanel) {
        panel.list.forEach((item, i, list) => {
          if (item.type !== 'Rectangle' || !list[i + 1]?.text) return;
          const button = this.button(list[i + 1].text, () => item.emit('pointerdown'), card);
          button.disabled = !item.input;
        });
      } else {
        const texts = panel.list.filter(item => typeof item.text === 'string').map(item => item.text);
        card.append(this.node('div', 'ad-reading', texts.join('\n\n')));
      }
    } else {
      if (!pause) {
        card.append(this.node('p', 'ad-subtitle', 'история о доме, который согревает'));
        this.deviceSummary = this.node('p', 'ad-help', GamePerformance.summary());
        card.append(this.deviceSummary);
      }
      const buttons = this.node('div', 'ad-menu-buttons'); card.append(buttons);
      for (const item of scene.children.list) {
        if (item.type === 'Text' && item.input) this.button(item.text, () => item.emit('pointerdown'), buttons);
      }
      this.button('Сохранения', () => this.renderSaves(), buttons);
      if (!pause && SaveSystem.recovered) card.append(this.node('p', 'ad-help', 'Последнее сохранение недоступно. Восстановлена предыдущая контрольная точка. Другие копии — в разделе «Сохранения».'));
      if (pause) {
        const source = this.game.scene.getScene(scene.returnKey);
        this.button('Сделать снимок', () => {
          scene.resumeGame(); source.safeRun(() => Chronicle.run(source, () => Chronicle.photo(source)));
        }, buttons);
        this.volumeControls(card);
      }
    }
    card.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  },
});
