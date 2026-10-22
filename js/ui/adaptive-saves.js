Object.assign(AdaptiveUI, {
  createSaveTools() {
    this.utility = this.node('section', 'ad-screen ad-utility'); this.utility.hidden = true;
    this.utility.setAttribute('role', 'dialog'); this.utility.setAttribute('aria-modal', 'true');
    this.root.append(this.utility); this.utilityToken = 0;
  },
  showUtility(title, build, cancel = null) {
    if (this.utility.hidden) this.utilityFocus = document.activeElement;
    this.utilityToken++; this.utilityCancel = cancel; this.releaseControls();
    this.utility.hidden = false; this.menu.inert = true; this.utility.replaceChildren();
    this.utility.setAttribute('aria-label', title);
    const card = this.node('div', 'ad-card'); this.utility.append(card);
    card.append(this.node('h2', '', title)); build(card);
    this.utilityStatus = this.node('p', 'ad-help'); this.utilityStatus.setAttribute('role', 'status'); card.append(this.utilityStatus);
    card.querySelector('button:not(:disabled)')?.focus({ preventScroll:true });
  },
  closeUtility() {
    this.utilityToken++; this.utility.hidden = true; this.utilityCancel = null; this.menu.inert = false;
    this.utilityFocus?.focus?.({ preventScroll:true });
  },
  cancelUtility() { if (this.utilityCancel) this.utilityCancel(); else this.closeUtility(); },
  confirmAction(title, description, action, cancel = null, label = 'Подтвердить') {
    this.showUtility(title, card => {
      card.append(this.node('p', 'ad-reading', description));
      this.button('Отмена', () => this.cancelUtility(), card);
      this.button(label, () => {
        if (action() === false) this.text(this.utilityStatus, SaveSystem.lastError || 'Действие не выполнено. Прогресс не заменён.');
      }, card);
    }, cancel);
  },
  downloadSave(state, name = 'progress') {
    try {
      const blob = new Blob([SaveFormat.encode(state)], { type:'application/json' });
      const url = URL.createObjectURL(blob), link = this.node('a');
      link.href = url; link.download = `poka-gorit-svet-${name}-${Date.now()}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { this.text(this.utilityStatus, e.message); }
  },
  loadSave(state) {
    // Persist first. A failed storage write must not stop the running scene.
    if (!SaveSystem.activate(state)) return false;
    this.closeUtility(); Chronicle.close(false); this.ui?.resetForScene();
    for (const sc of this.game.scene.getScenes(false)) if (sc instanceof GameplayScene) this.game.scene.stop(sc.scene.key);
    this.game.scene.stop('Pause'); this.game.scene.stop('MainMenu');
    this.game.scene.start(SaveSystem.targetScene()); return true;
  },
  renderSaves(message = '') {
    this.showUtility('Сохранения', card => {
      this.button('← Назад', () => this.closeUtility(), card);
      card.append(this.node('p', 'ad-help', 'Продолжение — с контрольной точки сцены, а не с точной позиции персонажа. Ручные слоты не меняются при автосохранении. Резервная копия «Перед заменой прогресса» хранит последнее заменённое прохождение или слот.'));
      if (GameState.chapter !== 'menu') this.button('Скачать текущий прогресс', () => this.downloadSave(GameState), card);
      const input = this.node('input'); input.type = 'file'; input.accept = '.json,application/json';
      input.setAttribute('aria-label', 'Импорт сохранения из JSON-файла');
      const label = this.node('label', 'ad-setting', 'Импорт сохранения из файла'); label.append(input); card.append(label);
      input.addEventListener('change', async () => {
        const file = input.files?.[0]; if (!file) return;
        const token = this.utilityToken;
        try {
          if (file.size > SaveFormat.maxBytes) throw new Error('Файл слишком большой (максимум 8 МБ).');
          const record = SaveFormat.parse(await file.text());
          if (token !== this.utilityToken) return;
          this.importPreview(record);
        } catch (e) { if (token === this.utilityToken) this.text(this.utilityStatus, e.message + ' Текущий прогресс не изменён.'); }
        finally { input.value = ''; }
      });
      const grid = this.node('div', 'ad-save-grid'); card.append(grid);
      for (const entry of SaveSystem.entries()) {
        const row = this.node('section', 'ad-save-slot'); grid.append(row);
        row.setAttribute('aria-label', entry.title); row.append(this.node('h3', '', entry.title));
        const record = entry.record;
        row.append(this.node('p', 'ad-help', record ? SaveFormat.chapters[record.state.chapter] + (record.savedAt ? '\n' + new Date(record.savedAt).toLocaleString('ru-RU') : '\nСохранение старой версии') : 'Нет доступного сохранения'));
        if (record) {
          this.button('Загрузить', () => this.confirmAction('Загрузить: ' + entry.title + '?',
            'Текущее прохождение будет заменено. Перед загрузкой оно попадёт в резервную копию.',
            () => this.loadSave(record.state), () => this.renderSaves(), 'Загрузить'), row);
          this.button('Скачать файл', () => this.downloadSave(record.state, entry.slot ? 'slot-' + entry.slot : 'backup'), row);
        }
        if (entry.slot && GameState.chapter !== 'menu') this.button('Записать сюда', () => {
          const write = () => {
            if (!SaveSystem.writeSlot(entry.slot)) return false;
            this.renderSaves(entry.title + ': прогресс записан.'); return true;
          };
          if (record) this.confirmAction('Перезаписать ' + entry.title.toLowerCase() + '?', 'Прежнее содержимое слота попадёт в резервную копию.', write, () => this.renderSaves(), 'Перезаписать');
          else if (!write()) this.text(this.utilityStatus, SaveSystem.lastError);
        }, row);
      }
    });
    this.text(this.utilityStatus, message);
  },
  importPreview(record) {
    this.showUtility('Файл проверен', card => {
      this.button('Отмена', () => this.renderSaves(), card);
      card.append(this.node('p', 'ad-reading', SaveFormat.chapters[record.state.chapter] + '\nВыберите ручной слот. Импорт не запускает игру и не заменяет автосохранение.'));
      for (const slot of [1,2,3]) this.button('Импортировать в слот ' + slot, () => {
        const write = () => {
          if (!SaveSystem.writeSlot(slot, record.state)) return false;
          this.renderSaves('Файл импортирован в слот ' + slot + '. Можно загрузить его кнопкой «Загрузить».'); return true;
        };
        if (SaveSystem.read(SaveSystem.slotKey(slot))) this.confirmAction('Перезаписать слот ' + slot + '?', 'Предыдущее содержимое слота будет перенесено в резервную копию.', write, () => this.importPreview(record), 'Импортировать');
        else if (!write()) this.text(this.utilityStatus, SaveSystem.lastError);
      }, card);
    }, () => this.renderSaves());
  },
});
