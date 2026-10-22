// Measure delivered game frames, not monitor refresh rate. No synthetic load test.
const GamePerformance = {
  attach(game) {
    this.game = game;
    game.events.on('poststep', time => this.sample(time));
    document.addEventListener('visibilitychange', () => this.resetSample());
    window.addEventListener('resize', () => this.resetSample());
  },
  resetSample() {
    this.lastFrame = null; this.sampleMs = 0; this.frames = 0; this.slowFrames = 0;
    this.warmup = 2000; this.badWindows = 0;
  },
  setMode(mode) {
    this.mode = ['auto', 'eco', 'full'].includes(mode) ? mode : 'auto';
    this.measuredFps = null;
    const device = DeviceProfile.refresh();
    this.level = this.mode === 'eco' ? 2 : this.mode === 'auto' && device.modest ? 1 : 0;
    this.reason = this.mode === 'eco' ? 'Выбран экономный режим' : this.mode === 'full' ? 'Выбран плавный режим' :
      device.modest ? 'Облегчённые эффекты по доступным сведениям об устройстве' : 'Проверка плавности во время игры';
    this.resetSample(); this.apply();
  },
  apply() {
    this.targetFps = this.level === 2 ? 30 : 60;
    this.reducedEffects = this.level > 0;
    const loop = this.game?.loop;
    if (loop && loop.fpsLimit !== this.targetFps) {
      loop.fpsLimit = this.targetFps; loop._limitRate = 1000 / this.targetFps;
      loop.delta = 0; loop._frameBudget = 0;
    }
    document.body.classList.toggle('eco', this.reducedEffects);
  },
  sample(time) {
    const scene = AdaptiveUI.playScene;
    const playing = scene && !AdaptiveUI.menuOpen && !document.hidden && !DeviceProfile.current?.portraitBlocked &&
      !(Chronicle.panel && !Chronicle.panel.hidden);
    if (!playing || scene !== this.sampleScene) {
      this.sampleScene = scene; this.resetSample(); return;
    }
    if (this.lastFrame === null) { this.lastFrame = time; return; }
    const delta = time - this.lastFrame; this.lastFrame = time;
    if (delta <= 0 || delta > 250) { this.resetSample(); return; }
    if (this.warmup > 0) { this.warmup -= delta; return; }
    this.sampleMs += delta; this.frames++;
    if (delta > 1000 / this.targetFps * 1.65) this.slowFrames++;
    if (this.sampleMs < 3000) return;
    this.measuredFps = Math.round(this.frames * 1000 / this.sampleMs);
    const slow = this.measuredFps < this.targetFps * .82 || this.slowFrames / this.frames > .2;
    this.badWindows = slow ? this.badWindows + 1 : 0;
    this.sampleMs = 0; this.frames = 0; this.slowFrames = 0;
    if (this.mode === 'auto' && this.badWindows >= 2 && this.level < 2) {
      this.level++;
      this.reason = this.level === 1 ? 'Упрощены фоновые эффекты из-за просадок' : 'Включено ограничение до 30 кадров для снижения нагрузки';
      this.apply(); this.resetSample();
    }
    // Keep the chosen level for this session: capped 30 FPS cannot prove that 60
    // is sustainable. The player can rerun the check, without quality oscillation.
  },
  summary() {
    const device = DeviceProfile.current || DeviceProfile.refresh();
    return `${device.label} · ${device.touch ? 'сенсорное управление доступно' : 'клавиатура и мышь'} · до ${this.targetFps || 60} кадров/с`;
  },
  details() {
    const d = DeviceProfile.current || DeviceProfile.refresh();
    const renderer = this.game?.renderer;
    return [this.summary(),
      `Окно: ${Math.round(d.width)} × ${Math.round(d.height)}. Отрисовка: ${renderer?.gl ? 'WebGL' : renderer ? 'Canvas' : 'проверяется'}.`,
      `Потоки процессора: ${d.cores ?? 'браузер не сообщает'}. Память: ${d.memory ? '≈ ' + d.memory + ' ГБ' : 'браузер не сообщает'}.`,
      `Эффекты: ${this.reducedEffects ? 'облегчённые' : 'полные'}. ${this.reason || ''}.`,
      this.measuredFps ? `Последнее измерение: ${this.measuredFps} кадров/с.` : 'Для измерения нужно немного поиграть.',
      'Плавность проверяется во время игры. Тип устройства и объём памяти определяются приблизительно; данные никуда не отправляются.',
    ].join('\n');
  },
};
