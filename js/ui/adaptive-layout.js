// HTML interface stays readable independently of the fixed-resolution game world.
// Story state and all decisions remain owned by the existing Phaser scenes.
const AdaptiveUI = {
  node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  },
  text(el, value = '') { if (el.textContent !== value) el.textContent = value; },
  show(el, value) { if (el.hidden === value) el.hidden = !value; },
  button(text, action, parent) {
    const b = this.node('button', '', text); b.type = 'button';
    b.addEventListener('click', action); parent?.append(b); return b;
  },
  attach(game) {
    this.game = game;
    this.root = this.node('div'); this.root.id = 'adaptive-ui'; document.body.append(this.root);
    for (const type of ['pointerdown','pointerup','pointermove','mousedown','mouseup','touchstart','touchend','touchmove','click']) {
      this.root.addEventListener(type, e => e.stopPropagation());
    }
    this.createControls(); this.createContent(); this.createMenus(); this.createSaveTools(); this.createTutorial();
    this.resize = () => {
      const device = DeviceProfile.refresh();
      const viewport = window.visualViewport;
      const w = viewport?.width || window.innerWidth, h = viewport?.height || window.innerHeight;
      document.documentElement.style.setProperty('--app-height', h + 'px');
      const portrait = h > w;
      document.body.classList.toggle('portrait', portrait);
      this.touch = device.touch;
      document.body.dataset.touch = String(this.touch);
      const width = Math.max(1, Math.min(w - 16, (h - 24) * (portrait ? .52 : 1) * 16 / 9));
      const root = document.getElementById('game-root');
      if (root.style.width !== width + 'px') {
        root.style.width = width + 'px'; root.style.height = width * 9 / 16 + 'px';
        game.scale?.refresh();
      }
      this.releaseControls();
      this.refreshDeviceStatus();
    };
    this.resize();
    // Browser chrome can fire both events repeatedly in one frame.
    const scheduleResize = () => {
      if (this.resizePending) return;
      this.resizePending = requestAnimationFrame(() => { this.resizePending = null; this.resize(); });
    };
    window.addEventListener('resize', scheduleResize);
    window.visualViewport?.addEventListener('resize', scheduleResize);
    window.matchMedia('(any-pointer: coarse)').addEventListener('change', scheduleResize);
    window.addEventListener('blur', () => this.releaseControls());
    document.addEventListener('visibilitychange', () => {
      this.releaseControls();
      // Phaser pauses its loop on hidden documents; suspend synthesis as well.
      if (document.hidden && Audio.ctx?.state === 'running') Audio.ctx.suspend().catch(() => {});
      else if (!document.hidden && !OrientationGate.blocked() && Audio.ready && Audio.ctx?.state === 'suspended') Audio.ctx.resume().catch(() => {});
    });
    // Text appearance and interaction progress follow rendered frames.
    game.events.on('poststep', () => { if (!document.hidden && !OrientationGate.blocked()) this.sync(); });
    this.setQuality(this.quality());
  },
  quality() {
    try { return localStorage.getItem('pgs_quality') || 'auto'; } catch { return 'auto'; }
  },
  setQuality(value) {
    if (!['auto', 'eco', 'full'].includes(value)) value = 'auto';
    GamePerformance.setMode(value);
    try { localStorage.setItem('pgs_quality', value); } catch {}
    this.refreshDeviceStatus();
  },
  ignore(ui, objects) {
    const camera = ui.cameras.main;
    // Containers already exclude their children; do not traverse them every frame.
    for (const obj of objects) if (obj?.scene && !(obj.cameraFilter & camera.id)) camera.ignore(obj);
  },
  sync() {
    const ui = this.game.scene.getScene('UI');
    if (!ui?.dlgContainer) return;
    this.ui = ui;
    const active = this.game.scene.getScenes(true);
    this.playScene = active.find(sc => sc instanceof GameplayScene);
    this.ignore(ui, [ui.dlgContainer, ui.choiceContainer, ui.touchContainer, ui.questContainer,
      ui.prompt, ui.promptBarBg, ui.promptBarFill, ui.lifeText, ui.logContainer, ui.memoryContainer,
      ui.captionText, ui.chapterTitleCard, ui.saveToastText, this.playScene?._homeLife?.freeText]);
    // DOM controls replace the scaled canvas hit targets, including hybrid laptops.
    ui.touchContainer.list.forEach(o => { if (o.input?.enabled) o.disableInteractive(); });
    for (const object of [ui.dlgNextButton, ...ui.choiceContainer.list, this.playScene?._homeLife?.freeText]) {
      if (object?.input?.enabled) object.disableInteractive();
    }
    this.syncMenus(active); this.syncContent(ui); this.syncControls(ui); this.syncTutorial();
    document.body.classList.toggle('ad-modal', this.menuOpen || !this.modal.hidden || !this.choice.hidden || !this.reader.hidden || !this.utility.hidden);
  },
};
