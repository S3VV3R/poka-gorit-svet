class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    const W = CFG.WIDTH, H = CFG.HEIGHT;

    // ---- fade overlay (full screen) ----
    this.fadeRect = this.add.rectangle(0, 0, W, H, 0x0a0a12, 1)
      .setOrigin(0, 0).setDepth(500).setScrollFactor(0);
    this.fadeRect.setAlpha(0);

    // ---- letterbox bars ----
    this.barTop = this.add.rectangle(0, 0, W, 64, 0x000000, 1).setOrigin(0, 0).setDepth(490);
    this.barBottom = this.add.rectangle(0, H, W, 64, 0x000000, 1).setOrigin(0, 1).setDepth(490);
    this.barTop.y = -64; this.barBottom.y = H + 64;

    // ---- dialogue box ----
    const boxH = 132;
    this.dlgContainer = this.add.container(0, H).setDepth(400);
    const panel = this.add.rectangle(W / 2, -boxH / 2, W - 64, boxH, 0x000000, 0.95)
      .setStrokeStyle(3, 0xffffff, 1);
    this.dlgPanel = panel;
    const portraitCX = 100, portraitCY = -boxH + 34;
    this.dlgPortrait = this.add.image(portraitCX, portraitCY, 'portrait_nastya_neutral')
      .setOrigin(0.5).setScale(2).setVisible(false);
    this.dlgPortraitFrame = this.add.rectangle(portraitCX, portraitCY, 68, 68, 0x000000, 0)
      .setStrokeStyle(2, 0xffffff, 0.9).setVisible(false);
    this.dlgTextXWithPortrait = 150;
    this.dlgTextXNoPortrait = 64;
    this.dlgName = this.add.text(64, -boxH + 14, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '21px', color: '#ffffff', fontStyle: 'bold',
    });
    this.dlgText = this.add.text(64, -boxH + 44, '', {
      fontFamily: 'Arial, sans-serif', fontSize: '22px', color: '#ffffff', wordWrap: { width: W - 160 }, lineSpacing: 6,
    });
    this.dlgNextButton = this.add.rectangle(W - 130, -20, 132, 30, 0x000000, 1)
      .setStrokeStyle(2, 0xffffff, 1).setInteractive({ useHandCursor: true });
    this.dlgHint = this.add.text(W - 130, -20, 'Далее  ↵', {
      fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.dlgNextButton.on('pointerdown', (pointer) => {
      this._dialogueNextPointer = this._canContinueDialogue() ? pointer.id : null;
    });
    this.dlgNextButton.on('pointerup', (pointer) => {
      if (this._dialogueNextPointer === pointer.id) this._continueDialogue();
      this._dialogueNextPointer = null;
    });
    this.dlgNextButton.on('pointerout', () => { this._dialogueNextPointer = null; });
    this.dlgContainer.add([panel, this.dlgPortrait, this.dlgPortraitFrame, this.dlgName, this.dlgText, this.dlgNextButton, this.dlgHint]);
    this.dlgContainer.setVisible(false);
    this.dialogueLog = [];

    // ---- choice buttons container ----
    this.choiceContainer = this.add.container(W / 2, H / 2).setDepth(420);
    this.choiceContainer.setVisible(false);

    // ---- quest / objective tracker ----
    this.questContainer = this.add.container(16, 16).setDepth(410);
    this.questBg = this.add.rectangle(0, 0, 10, 34, 0x000000, 0.82).setOrigin(0, 0).setStrokeStyle(2, 0xffffff, 0.9);
    this.questLabel = this.add.text(10, 6, 'ЦЕЛЬ', {
      fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#8a8a8a',
    }).setOrigin(0, 0);
    this.questText = this.add.text(10, 18, '', {
      fontFamily: '"Courier New", monospace', fontSize: '15px', color: '#ffffff',
    }).setOrigin(0, 0);
    this.questContainer.add([this.questBg, this.questLabel, this.questText]);
    this.questContainer.setVisible(false);
    this.prompt = this.add.text(W / 2, H - 170, '', {
      fontFamily: 'Georgia, serif', fontSize: '16px', color: '#fff2d0',
      backgroundColor: '#00000090', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(400).setVisible(false);
    this.promptBarBg = this.add.rectangle(W / 2, H - 152, 60, 5, 0x000000, 0.7)
      .setStrokeStyle(1, 0xffffff, 0.6).setDepth(400).setVisible(false);
    this.promptBarFill = this.add.rectangle(W / 2 - 29, H - 152, 1, 3, 0xe8c07d, 1)
      .setOrigin(0, 0.5).setDepth(401).setVisible(false);

    // ---- caption (time-skip narration) ----
    this.captionText = this.add.text(W / 2, H / 2, '', {
      fontFamily: 'Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#e9e4d8',
      align: 'center', wordWrap: { width: W - 220 },
    }).setOrigin(0.5).setDepth(510).setAlpha(0);

    // ---- save toast ----
    this.saveToastText = this.add.text(20, H - 26, '', {
      fontFamily: '"Courier New", monospace', fontSize: '13px', color: '#9be29b',
    }).setOrigin(0, 0.5).setDepth(510).setAlpha(0);

    // ---- quiet life HUD / personal memory album ----
    this.lifeText = this.add.text(W - 18, 16, '', {
      fontFamily: 'Georgia, serif', fontSize: '14px', color: '#fff2d0', fontStyle: 'italic',
      backgroundColor: '#00000090', padding: { x: 8, y: 5 }, align: 'right',
    }).setOrigin(1, 0).setDepth(410).setVisible(false);
    this.memoryContainer = this.add.container(W / 2, H / 2).setDepth(535).setVisible(false);
    const memoryBg = this.add.rectangle(0, 0, 700, 420, 0x0e0e18, 0.97).setStrokeStyle(2, 0xe8c07d, 0.7);
    this.memoryTitle = this.add.text(0, -184, 'АЛЬБОМ ЖИЗНИ  (M — закрыть)', {
      fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#e8c07d',
    }).setOrigin(0.5);
    this.memoryText = this.add.text(-320, -152, '', {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#e9e4d8', wordWrap: { width: 640 }, lineSpacing: 8,
    }).setOrigin(0, 0);
    this.memoryContainer.add([memoryBg, this.memoryTitle, this.memoryText]);

    // ---- dialogue backlog (press L) ----
    this.logContainer = this.add.container(W / 2, H / 2).setDepth(530).setVisible(false);
    const logBg = this.add.rectangle(0, 0, 720, 420, 0x000000, 0.95).setStrokeStyle(2, 0xffffff, 1);
    this.logTitle = this.add.text(0, -190, 'ЖУРНАЛ ДИАЛОГОВ  (L — закрыть)', {
      fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#8a8a8a',
    }).setOrigin(0.5);
    this.logText = this.add.text(-340, -165, '', {
      fontFamily: '"Courier New", monospace', fontSize: '14px', color: '#e9e4d8', wordWrap: { width: 680 }, lineSpacing: 6,
    }).setOrigin(0, 0);
    this.logContainer.add([logBg, this.logTitle, this.logText]);

    this._conversationQueue = Promise.resolve();
    this._conversationPending = 0;
    this._conversationGeneration = 0;
    this._presentationTasks = new Map();
    this._cancelConversationWait = null;
    this._dialogueLine = null;
    this._dialogueEnterDown = false;
    this._dialogueNextPointer = null;
    this.input.keyboard.on('keydown-ENTER', (event) => {
      const freshPress = !this._dialogueEnterDown && !(event && event.repeat);
      this._dialogueEnterDown = true;
      if (freshPress) this._continueDialogue();
    });
    this.input.keyboard.on('keyup-ENTER', () => { this._dialogueEnterDown = false; });
    this.input.keyboard.on('keydown-L', () => this.toggleLog());
    this.input.keyboard.on('keydown-M', () => this.toggleMemory());

    this.buildTouchControls();
  }

  // -------------------------------------------------------------
  // Touch controls — a virtual joystick (bottom-left) and interact /
  // pause buttons (bottom-right / top-right). Only shown on touch
  // devices, and only while a gameplay scene requests them.
  // -------------------------------------------------------------
  buildTouchControls() {
    const W = CFG.WIDTH, H = CFG.HEIGHT;
    const uaIsMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
    const hasCoarsePointer = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    this.isTouchDevice = uaIsMobile && hasTouch;
    if (!this.isTouchDevice && hasTouch && hasCoarsePointer) this.isTouchDevice = true;
    this.touchContainer = this.add.container(0, 0).setDepth(600).setVisible(false).setScrollFactor(0);

    const baseX = 110, baseY = H - 120;
    this.joyBase = this.add.circle(baseX, baseY, 52, 0x000000, 0.35).setStrokeStyle(2, 0xffffff, 0.6);
    this.joyKnob = this.add.circle(baseX, baseY, 24, 0xffffff, 0.5);
    this.joyBase.setInteractive({ useHandCursor: false });
    this.joyOrigin = { x: baseX, y: baseY };
    this.joyPointerId = null;

    const interactBtn = this.add.circle(W - 90, H - 120, 42, 0x000000, 0.4).setStrokeStyle(2, 0xffffff, 0.7);
    const interactLbl = this.add.text(W - 90, H - 120, 'E', {
      fontFamily: '"Courier New", monospace', fontSize: '26px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    interactBtn.setInteractive({ useHandCursor: false });
    interactBtn.on('pointerdown', () => { this._touchInteract = true; this._touchInteractHeld = true; });
    interactBtn.on('pointerup', () => { this._touchInteractHeld = false; });
    interactBtn.on('pointerout', () => { this._touchInteractHeld = false; });

    const pauseBtn = this.add.circle(W - 36, 36, 22, 0x000000, 0.4).setStrokeStyle(2, 0xffffff, 0.7);
    const pauseLbl = this.add.text(W - 36, 36, '⏸', {
      fontFamily: '"Courier New", monospace', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5);
    pauseBtn.setInteractive({ useHandCursor: false });
    pauseBtn.on('pointerdown', () => { this._touchPause = true; });

    this.touchContainer.add([this.joyBase, this.joyKnob, interactBtn, interactLbl, pauseBtn, pauseLbl]);
    this._touchInteractBtn = interactBtn;
    this._touchPauseBtn = pauseBtn;
    interactBtn.disableInteractive();
    pauseBtn.disableInteractive();

    this.input.on('pointerdown', (p) => {
      if (!this.touchContainer.visible) return;
      if (this.joyPointerId === null && p.x < W / 2) {
        this.joyPointerId = p.id;
        this._updateJoystick(p);
      }
    });
    this.input.on('pointermove', (p) => {
      if (!this.touchContainer.visible) return;
      if (p.id === this.joyPointerId) this._updateJoystick(p);
    });
    this.input.on('pointerup', (p) => {
      if (p.id === this.joyPointerId) {
        this.joyPointerId = null;
        this.joyKnob.setPosition(this.joyOrigin.x, this.joyOrigin.y);
        TouchInput.dx = 0; TouchInput.dy = 0;
      }
    });
  }

  _updateJoystick(p) {
    const dx = p.x - this.joyOrigin.x, dy = p.y - this.joyOrigin.y;
    const dist = Math.min(45, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx);
    const kx = this.joyOrigin.x + Math.cos(ang) * dist;
    const ky = this.joyOrigin.y + Math.sin(ang) * dist;
    this.joyKnob.setPosition(kx, ky);
    TouchInput.dx = dist > 8 ? Math.cos(ang) : 0;
    TouchInput.dy = dist > 8 ? Math.sin(ang) : 0;
  }

  showTouchControls() {
    if (!this.isTouchDevice) return;
    this.touchContainer.setVisible(true);
    if (this._touchInteractBtn && !this._touchInteractBtn.input) this._touchInteractBtn.setInteractive({ useHandCursor: false });
    if (this._touchPauseBtn && !this._touchPauseBtn.input) this._touchPauseBtn.setInteractive({ useHandCursor: false });
  }
  hideTouchControls() {
    this.touchContainer.setVisible(false);
    this.joyPointerId = null;
    TouchInput.dx = 0; TouchInput.dy = 0;
    if (this._touchInteractBtn) this._touchInteractBtn.disableInteractive();
    if (this._touchPauseBtn) this._touchPauseBtn.disableInteractive();
  }

  toggleLog() {
    if (this.logContainer.visible) { this.logContainer.setVisible(false); return; }
    const recent = this.dialogueLog.slice(-12);
    this.logText.setText(recent.length
      ? recent.map((l) => (l.who ? `${l.who}: ${l.text}` : l.text)).join('\n\n')
      : 'Пока ничего не сказано.');
    this.logContainer.setVisible(true);
  }

  setLifeStatus(text) {
    if (!this.lifeText) return;
    this.lifeText.setText(text || '').setVisible(!!text);
  }

  toggleMemory() {
    if (!this.memoryContainer) return;
    if (this.memoryContainer.visible) { this.memoryContainer.setVisible(false); return; }
    const life = (GameState && GameState.life) || {};
    const photos = Array.isArray(life.photos) ? life.photos : [];
    const memories = Array.isArray(life.memories) ? life.memories : [];
    const latest = memories.slice(-8).reverse();
    const lines = [];
    if (photos.length) lines.push('СНИМКИ\n' + photos.slice(-4).reverse().map((p) => `▣ ${p.title}`).join('\n'));
    if (latest.length) lines.push('ЗАПОМНИЛОСЬ\n' + latest.map((m) => `• ${m.title}`).join('\n'));
    if (!lines.length) lines.push('Пока здесь пусто.\n\nЖизнь начинается с вещей, которые кажутся слишком маленькими, чтобы их сохранить.');
    this.memoryText.setText(lines.join('\n\n'));
    this.memoryContainer.setVisible(true);
  }

  saveToast(msg = 'Сохранено') {
    Audio.playSaveChime();
    this.saveToastText.setText('💾 ' + msg).setAlpha(0);
    this.tweens.add({
      targets: this.saveToastText, alpha: 1, duration: 300,
      onComplete: () => {
        this.time.delayedCall(1400, () => {
          this.tweens.add({ targets: this.saveToastText, alpha: 0, duration: 500 });
        });
      },
    });
  }

  achievementToast(title) {
    const W = CFG.WIDTH;
    const container = this.add.container(W / 2, 70).setDepth(540).setAlpha(0);
    const bg = this.add.rectangle(0, 0, 380, 50, 0x000000, 0.92).setStrokeStyle(2, 0xe8c07d, 1);
    const t1 = this.add.text(0, -12, '★ ДОСТИЖЕНИЕ ОТКРЫТО', {
      fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#e8c07d',
    }).setOrigin(0.5);
    const t2 = this.add.text(0, 9, title, {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#ffffff',
    }).setOrigin(0.5);
    container.add([bg, t1, t2]);
    Audio.playChime();
    this.tweens.add({
      targets: container, alpha: 1, y: 90, duration: 500, ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(2600, () => {
          this.tweens.add({ targets: container, alpha: 0, y: 70, duration: 500, onComplete: () => container.destroy() });
        });
      },
    });
  }

  update(time, delta = 16.67) {
    if (!this._dialogueLine) return;
    const line = this._dialogueLine;
    if (line.index < line.characters.length && !this.logContainer.visible && !this.memoryContainer.visible) {
      line.elapsed += Math.min(delta, 100);
      const previousIndex = line.index;
      let voiced = false;
      while (line.elapsed >= line.speed && line.index < line.characters.length) {
        line.elapsed -= line.speed;
        const ch = line.characters[line.index++];
        if (!voiced && ch.trim()) { Audio.playTextBlip(ch); voiced = true; }
      }
      if (line.index !== previousIndex) this.dlgText.setText(line.characters.slice(0, line.index).join(''));
      if (line.index === line.characters.length) this._dialogueReadyAt = this.time.now + 160;
    }
    const ready = this._canContinueDialogue();
    this.dlgNextButton.setVisible(ready).setAlpha(1);
    this.dlgHint.setVisible(ready).setAlpha(1);
  }

  isConversationActive() { return this._conversationPending > 0; }

  _queueConversation(show) {
    const generation = this._conversationGeneration;
    this._conversationPending++;
    this.hidePrompt();
    const pending = this._conversationQueue.then(() => {
      if (generation !== this._conversationGeneration) throw this._conversationCancelled();
      return show();
    });
    this._conversationQueue = pending.catch(() => {});
    return pending.finally(() => {
      if (generation === this._conversationGeneration) this._conversationPending--;
    });
  }

  _conversationCancelled() {
    const error = new Error('Conversation ended with its scene');
    error.code = 'DIALOGUE_CANCELLED';
    return error;
  }

  cancelConversations() {
    this._conversationGeneration++;
    this._conversationPending = 0;
    this._conversationQueue = Promise.resolve();
    this.tweens.killTweensOf(this.dlgContainer);
    const cancel = this._cancelConversationWait;
    this._cancelConversationWait = null;
    this._dialogueLine = null;
    this._dialogueNextPointer = null;
    if (cancel) cancel(this._conversationCancelled());
    this.dlgContainer.setVisible(false);
    this.choiceContainer.setVisible(false);
  }

  _canContinueDialogue() {
    return !!this._dialogueLine && this._dialogueLine.index === this._dialogueLine.characters.length && this.time.now >= this._dialogueReadyAt &&
      !this.choiceContainer.visible && !this.logContainer.visible && !this.memoryContainer.visible;
  }

  _continueDialogue() {
    if (!this._canContinueDialogue()) return;
    const line = this._dialogueLine;
    this._dialogueLine = null;
    this._dialogueNextPointer = null;
    this._cancelConversationWait = null;
    line.resolve();
  }

  // -------------------------------------------------------------
  _present(key, run) {
    // A single owner for each shared UI animation. Cancelling rejects the
    // obsolete story continuation, so it cannot darken a later chapter.
    this._presentationTasks.get(key)?.();
    const pending = new Promise((resolve, reject) => {
      let ended = false, cleanup = () => {};
      const finish = () => {
        if (ended) return;
        ended = true;
        this._presentationTasks.delete(key);
        resolve();
      };
      const cancel = () => {
        if (ended) return;
        ended = true;
        cleanup();
        this._presentationTasks.delete(key);
        reject(this._conversationCancelled());
      };
      this._presentationTasks.set(key, cancel);
      cleanup = run(finish) || cleanup;
    });
    // Some entry fades/captions are intentionally fire-and-forget. Awaited
    // cutscenes still receive cancellation and stop their obsolete chain.
    pending.catch(() => {});
    return pending;
  }

  resetForScene() {
    for (const cancel of [...this._presentationTasks.values()]) cancel();
    this.cancelConversations();
    this.scene.setVisible(true);
    this.input.enabled = true;
    this.input.keyboard.enabled = true;
    this._dialogueEnterDown = false;
    this.fadeRect.setAlpha(0);
    this.captionText.setText('').setAlpha(0);
    this.barTop.setY(-64);
    this.barBottom.setY(CFG.HEIGHT + 64);
    this.memoryContainer.setVisible(false);
    this.logContainer.setVisible(false);
    this.clearQuest();
    this.hidePrompt();
  }

  fadeOut(duration = 500) {
    return this._present('fade', (resolve) => {
      this.tweens.add({ targets: this.fadeRect, alpha: 1, duration, onComplete: resolve });
      return () => this.tweens.killTweensOf(this.fadeRect);
    });
  }
  fadeIn(duration = 500) {
    return this._present('fade', (resolve) => {
      this.tweens.add({ targets: this.fadeRect, alpha: 0, duration, onComplete: resolve });
      return () => this.tweens.killTweensOf(this.fadeRect);
    });
  }

  letterboxOn(duration = 400) {
    return this._present('letterbox', (resolve) => {
      this.tweens.add({ targets: this.barTop, y: 0, duration, ease: 'Sine.easeOut' });
      this.tweens.add({ targets: this.barBottom, y: CFG.HEIGHT, duration, ease: 'Sine.easeOut', onComplete: resolve });
      return () => this.tweens.killTweensOf([this.barTop, this.barBottom]);
    });
  }
  letterboxOff(duration = 400) {
    return this._present('letterbox', (resolve) => {
      this.tweens.add({ targets: this.barTop, y: -64, duration, ease: 'Sine.easeIn' });
      this.tweens.add({ targets: this.barBottom, y: CFG.HEIGHT + 64, duration, ease: 'Sine.easeIn', onComplete: resolve });
      return () => this.tweens.killTweensOf([this.barTop, this.barBottom]);
    });
  }

  showPrompt(text) {
    this.prompt.setText(text).setVisible(true);
    this.promptBarBg.setVisible(true);
    this.promptBarFill.setVisible(true).setSize(1, 3);
  }
  hidePrompt() {
    this.prompt.setVisible(false);
    this.promptBarBg.setVisible(false);
    this.promptBarFill.setVisible(false);
  }
  setPromptProgress(frac) {
    const w = Math.max(1, Math.min(58, Math.round(58 * frac)));
    this.promptBarFill.setSize(w, 3);
  }

  setQuest(text) {
    const changed = this.questText.text !== text;
    this.questText.setText(text);
    const w = Math.max(160, this.questText.width + 20);
    this.questBg.width = w;
    this.questContainer.setVisible(true);
    if (changed) Audio.playQuestBlip();
  }
  clearQuest() { this.questContainer.setVisible(false); }

  caption(text, hold = 1600) {
    return this._present('caption', (resolve) => {
      let delay;
      this.captionText.setText(text).setAlpha(0);
      this.tweens.add({
        targets: this.captionText, alpha: 1, duration: 500,
        onComplete: () => {
          delay = this.time.delayedCall(hold, () => {
            this.tweens.add({ targets: this.captionText, alpha: 0, duration: 500, onComplete: resolve });
          });
        },
      });
      return () => { delay?.remove(false); this.tweens.killTweensOf(this.captionText); };
    });
  }

  // A proper, clearly visible chapter title card (used for chapter
  // breaks / "end of chapter" moments) — always rendered above the
  // fade-to-black overlay so it never disappears into a black screen.
  chapterCard(title, subtitle, hold = 3000) {
    return this._present('chapter', (resolve) => {
      let delay;
      const W = CFG.WIDTH, H = CFG.HEIGHT;
      const container = this.add.container(W / 2, H / 2).setDepth(520).setAlpha(0);
      this.chapterTitleCard = container;
      const line = this.add.rectangle(0, -6, 220, 2, 0xffffff, 0.85);
      const t1 = this.add.text(0, -42, title, {
        fontFamily: '"Courier New", monospace', fontSize: '30px', color: '#ffffff', fontStyle: 'bold', align: 'center',
      }).setOrigin(0.5);
      const t2 = this.add.text(0, 26, subtitle, {
        fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#cfc7b8', align: 'center',
        wordWrap: { width: 560 },
      }).setOrigin(0.5);
      container.add([t1, line, t2]);
      this.tweens.add({
        targets: container, alpha: 1, duration: 700,
        onComplete: () => {
          delay = this.time.delayedCall(hold, () => {
            this.tweens.add({ targets: container, alpha: 0, duration: 700, onComplete: () => { container.destroy(); resolve(); } });
          });
        },
      });
      return () => { delay?.remove(false); this.tweens.killTweensOf(container); container.destroy(); };
    });
  }

  // -------------------------------------------------------------
  // dialogue(lines) — lines: [{who, text, mood}] ; who='' for narration
  // -------------------------------------------------------------
  dialogue(lines) {
    return this._queueConversation(() => this._showDialogue(lines));
  }

  async _showDialogue(lines) {
    const generation = this._conversationGeneration;
    this.tweens.killTweensOf(this.dlgContainer);
    this.dlgContainer.setVisible(true);
    this.tweens.add({ targets: this.dlgContainer, y: CFG.HEIGHT - 18, duration: 220, ease: 'Back.easeOut' });
    for (const line of lines) {
      if (generation !== this._conversationGeneration) throw this._conversationCancelled();
      this.dialogueLog.push({ who: line.who || '', text: line.text });
      if (this.dialogueLog.length > 200) this.dialogueLog.shift();
      await this._typeLine(line.who || '', line.text, line.mood || 'neutral');
    }
    if (generation !== this._conversationGeneration) throw this._conversationCancelled();
    await new Promise((resolve, reject) => {
      this._cancelConversationWait = reject;
      this.tweens.add({
        targets: this.dlgContainer, y: CFG.HEIGHT, duration: 200,
        onComplete: () => { this._cancelConversationWait = null; this.dlgContainer.setVisible(false); resolve(); },
      });
    });
  }

  _portraitKeyFor(who) {
    const old = GameState.ageStage === 'old';
    if (who === 'Настя') return old ? 'nastya_old' : 'nastya';
    if (who === 'Тамир') return old ? 'tamir_old' : 'tamir';
    if (who === 'Белла') return 'bella';
    if (who === 'Ния') return 'nia';
    if (typeof CAST_BY_NAME !== 'undefined' && CAST_BY_NAME[who]) return CAST_BY_NAME[who];
    return null;
  }

  _typeLine(who, text, mood = 'neutral') {
    return new Promise((resolve, reject) => {
      this._cancelConversationWait = reject;
      this.dlgName.setText(who);
      this.dlgName.setVisible(!!who);
      const pk = this._portraitKeyFor(who);
      if (pk) {
        this.dlgPortrait.setTexture(this.textures.exists(`portrait_${pk}_${mood}`) ? `portrait_${pk}_${mood}` : `portrait_${pk}_neutral`).setVisible(true);
        this.dlgPortraitFrame.setVisible(true);
        this.dlgName.setX(this.dlgTextXWithPortrait); this.dlgText.setX(this.dlgTextXWithPortrait);
        this.dlgText.setWordWrapWidth(CFG.WIDTH - 64 - this.dlgTextXWithPortrait - 32);
      } else {
        this.dlgPortrait.setVisible(false);
        this.dlgPortraitFrame.setVisible(false);
        this.dlgName.setX(this.dlgTextXNoPortrait); this.dlgText.setX(this.dlgTextXNoPortrait);
        this.dlgText.setWordWrapWidth(CFG.WIDTH - 160);
      }
      // Measure and wrap the complete line first so words and the panel do not
      // jump while letters appear. Typing cannot be fast-forwarded or skipped.
      this.dlgText.setText(text);
      const boxH = Math.max(132, this.dlgText.height + 88);
      const characters = Array.from(this.dlgText.getWrappedText(text).join('\n'));
      this.dlgPanel.setSize(CFG.WIDTH - 64, boxH).setY(-boxH / 2);
      this.dlgName.setY(-boxH + 14);
      this.dlgText.setY(-boxH + 44);
      this.dlgPortrait.setY(-boxH + 34);
      this.dlgPortraitFrame.setY(-boxH + 34);
      this.dlgText.setText('');
      this._dialogueReadyAt = characters.length ? Infinity : this.time.now + 160;
      this._dialogueNextPointer = null;
      this._dialogueLine = { resolve, characters, index: 0, elapsed: 0, speed: textSpeedMs() };
      this.dlgNextButton.setVisible(false);
      this.dlgHint.setVisible(false);
    });
  }

  // -------------------------------------------------------------
  choice(promptText, options) {
    return this._queueConversation(() => this._showChoice(promptText, options));
  }

  _showChoice(promptText, options) {
    return new Promise((resolve, reject) => {
      this.choiceContainer.removeAll(true);
      this.choiceContainer.setVisible(true);
      const W = 440;
      const label = this.add.text(0, -70 - (options.length * 30), promptText, {
        fontFamily: '"Courier New", monospace', fontSize: '17px', fontStyle: 'italic', color: '#ffffff',
        align: 'center', wordWrap: { width: W }, backgroundColor: '#000000',
      }).setOrigin(0.5).setPadding(8, 4, 8, 4);
      this.choiceContainer.add(label);

      let chosen = false;
      this._cancelConversationWait = (error) => { chosen = true; reject(error); };
      options.forEach((opt, idx) => {
        const y = -30 + idx * 46 - ((options.length - 1) * 23);
        const bg = this.add.rectangle(0, y, W, 38, 0x000000, 0.96)
          .setStrokeStyle(2, 0xffffff, 1).setInteractive({ useHandCursor: true });
        const txt = this.add.text(0, y, opt, {
          fontFamily: '"Courier New", monospace', fontSize: '16px', color: '#ffffff',
        }).setOrigin(0.5);
        bg.on('pointerover', () => { bg.setFillStyle(0xffffff, 1); txt.setColor('#000000'); });
        bg.on('pointerout', () => { bg.setFillStyle(0x000000, 0.96); txt.setColor('#ffffff'); });
        bg.on('pointerdown', () => {
          if (chosen) return;
          chosen = true;
          this._cancelConversationWait = null;
          Audio.playBlip(440);
          this.choiceContainer.setVisible(false);
          resolve(idx);
        });
        this.choiceContainer.add([bg, txt]);
      });
    });
  }
}
/* =====================================================================
   InteractionSystem — register world objects the player can walk up
   to and press E on. Each frame we find the closest in-range target
   and show a context prompt; the scene simply calls .update() and
   asks .consumeInteract() after checking the input manager.
   ===================================================================== */
