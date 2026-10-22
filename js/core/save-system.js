let GameState = DEFAULT_STATE();

const SaveSystem = {
  _seenAchievements: new Set(),
  lastError: '',
  read(key = CFG.SAVE_KEY) {
    try { const raw = localStorage.getItem(key); return raw ? { ...SaveFormat.parse(raw), raw } : null; }
    catch { return null; }
  },
  fail(error) {
    this.lastError = error?.name === 'QuotaExceededError' ? 'Память браузера заполнена. Скачайте сохранение файлом.' :
      'Не удалось сохранить. Проверьте доступ к памяти браузера; текущий прогресс можно скачать файлом.';
    console.warn('Save failed:', error);
    try { window.__phaserGame?.scene.getScene('UI')?.saveToast(this.lastError); } catch {}
    return false;
  },
  save() {
    try {
      const next = SaveFormat.encode(GameState), previous = this.read();
      if (previous && JSON.stringify(previous.state) !== JSON.stringify(GameState)) localStorage.setItem(CFG.SAVE_KEY + '_previous', previous.raw);
      localStorage.setItem(CFG.SAVE_KEY, next);
      this.lastError = ''; this.recovered = false; this._checkAchievements();
      return true;
    } catch (e) {
      return this.fail(e);
    }
  },
  _checkAchievements() {
    if (typeof ACHIEVEMENTS === 'undefined') return;
    ACHIEVEMENTS.forEach((a) => {
      if (GameState.flags[a.flag] && !this._seenAchievements.has(a.flag)) {
        this._seenAchievements.add(a.flag);
        try {
          const scenes = window.__phaserGame && window.__phaserGame.scene;
          const ui = scenes && scenes.getScene && scenes.getScene('UI');
          if (ui && ui.scene.isActive('UI')) ui.achievementToast(a.title);
        } catch (e) {}
      }
    });
  },
  load() {
    const current = this.read(), previous = current ? null : this.read(CFG.SAVE_KEY + '_previous');
    if (!current && !previous) return false;
    this.use((current || previous).state); this.recovered = !!previous; return true;
  },
  hasSave() {
    const record = this.read() || this.read(CFG.SAVE_KEY + '_previous');
    return !!record && record.state.chapter !== 'menu';
  },
  use(state) {
    GameState = state; UserSettings.restore(); this._seenAchievements.clear();
    if (typeof ACHIEVEMENTS !== 'undefined') for (const a of ACHIEVEMENTS) if (state.flags[a.flag]) this._seenAchievements.add(a.flag);
  },
  // Explicit replacement checkpoint: autosaves never overwrite this backup.
  protect(state = GameState) {
    if (state.chapter !== 'menu') localStorage.setItem(CFG.SAVE_KEY + '_backup', SaveFormat.encode(state));
  },
  activate(state) {
    try {
      const next = SaveFormat.normalize(state), encoded = SaveFormat.encode(next);
      this.protect(); localStorage.setItem(CFG.SAVE_KEY, encoded);
      this.use(next); this.lastError = ''; this.recovered = false; return true;
    } catch (e) { return this.fail(e); }
  },
  reset() {
    const state = DEFAULT_STATE(); state.settings = { ...GameState.settings };
    const fresh = GameState.chapter === 'menu' && !this.hasSave();
    if (this.activate(state)) return true;
    // A blocked storage API must not make a first playthrough unstartable.
    // Keep the warning and allow in-memory play/export without deleting anything.
    if (fresh) { this.use(state); return true; }
    return false;
  },
  targetScene() {
    return { street:'Street', date:'DateScene', trip:'TripScene', apartment:'Apartment', proposal:'Proposal', wedding:'Wedding',
      youngfamily:'YoungFamily', baby:'Baby', kids:'Kids', emptynest:'EmptyNest', lateyears:'LateYears', menu:'Street',
      complete:'Proposal', complete2:'YoungFamily', complete3:'Baby', complete4:'Kids', complete5:'EmptyNest', complete6:'LateYears', ending:'LateYears' }[GameState.chapter] || 'Street';
  },
};
