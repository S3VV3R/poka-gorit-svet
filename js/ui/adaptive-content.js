Object.assign(AdaptiveUI, {
  createContent() {
    this.modal = this.node('section', 'ad-dialogue'); this.modal.hidden = true;
    this.modal.setAttribute('role', 'dialog'); this.modal.setAttribute('aria-label', 'Диалог');
    this.dialogueName = this.node('h2'); this.dialogueText = this.node('div', 'ad-dialogue-text');
    this.dialogueScroll = this.node('div', 'ad-dialogue-scroll');
    this.portrait = this.node('img', 'ad-portrait'); this.portrait.alt = '';
    this.dialogueScroll.append(this.portrait, this.dialogueName, this.dialogueText);
    this.next = this.button('Далее →', () => this.ui?._continueDialogue());
    this.next.disabled = true;
    this.next.addEventListener('keydown', e => { if (e.repeat) e.preventDefault(); });
    // Native form/button keys must not also reach Phaser's global keyboard handler.
    this.root.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if (this.utility && !this.utility.hidden) this.cancelUtility();
        else if (!this.reader.hidden) { this.ui.logContainer.setVisible(false); this.ui.memoryContainer.setVisible(false); }
        else if (this.menuOpen && this.menuScene?.scene.key === 'Pause') this.menuScene.resumeGame();
        else if (this.menuOpen) this.menuScene?.panels?.forEach(panel => panel.setVisible(false));
        e.preventDefault(); e.stopPropagation(); return;
      }
      if (e.key !== 'Tab' && ((this.utility && !this.utility.hidden) || e.target.closest('button,input,select'))) e.stopPropagation();
    });
    this.root.addEventListener('keyup', e => {
      if ((this.utility && !this.utility.hidden) || e.target.closest('button,input,select')) e.stopPropagation();
    });
    this.modal.append(this.dialogueScroll, this.next); this.root.append(this.modal);
    this.choice = this.node('section', 'ad-screen'); this.choice.hidden = true;
    this.choice.setAttribute('role', 'dialog'); this.choice.setAttribute('aria-label', 'Выбор');
    this.root.append(this.choice);
    this.reader = this.node('section', 'ad-screen ad-reader'); this.reader.hidden = true;
    this.reader.setAttribute('role', 'dialog'); this.reader.setAttribute('aria-label', 'Записи');
    this.root.append(this.reader);
    this.caption = this.node('div', 'ad-caption'); this.caption.hidden = true; this.root.append(this.caption);
    this.toast = this.node('div', 'ad-toast'); this.toast.setAttribute('role', 'status'); this.root.append(this.toast);
    // Native focus and scroll, with a focus loop for every open modal.
    document.addEventListener('keydown', e => {
      const surface = [this.utility, Chronicle.panel, this.reader, this.choice, this.modal, this.menu].find(el => el && !el.hidden);
      if (!surface || e.key !== 'Tab') return;
      const controls = [...surface.querySelectorAll('button:not(:disabled),input,select,summary,[tabindex="0"]')].filter(el => el.getClientRects().length);
      if (!controls.length) return;
      const index = controls.indexOf(document.activeElement);
      if (e.shiftKey && index <= 0) { e.preventDefault(); controls.at(-1).focus(); }
      else if (!e.shiftKey && (index < 0 || index === controls.length - 1)) { e.preventDefault(); controls[0].focus(); }
    });
  },
  syncContent(ui) {
    const book = !!Chronicle.panel && !Chronicle.panel.hidden;
    const log = ui.logContainer.visible, memory = ui.memoryContainer.visible;
    const readerKey = log ? 'log' : memory ? 'memory' : '';
    const readerChanged = readerKey !== this.readerKey;
    if (readerKey !== this.readerKey) {
      this.readerKey = readerKey; this.reader.replaceChildren();
      if (readerKey) {
        this.releaseControls();
        const card = this.node('div', 'ad-card');
        card.append(this.node('h2', '', log ? 'Журнал диалогов' : 'Альбом жизни'));
        this.button('Закрыть', () => { ui.logContainer.setVisible(false); ui.memoryContainer.setVisible(false); }, card);
        card.append(this.node('p', 'ad-reading', log ? ui.logText.text : ui.memoryText.text));
        this.reader.append(card);
      }
    }
    this.show(this.reader, !!readerKey && !book);
    this.menu.inert = !!readerKey || !!(this.utility && !this.utility.hidden);
    if (readerChanged && readerKey && !book) this.reader.querySelector('button')?.focus();
    else if (readerChanged && !readerKey && this.menuOpen) this.menu.querySelector('button')?.focus();
    const choosing = ui.choiceContainer.visible && !readerKey && !book;
    this.show(this.choice, choosing);
    const first = ui.choiceContainer.list[0];
    if (choosing && this.choiceKey !== first) {
      this.choiceKey = first; this.choice.replaceChildren(); this.releaseControls();
      const card = this.node('div', 'ad-card'); card.append(this.node('h2', '', first?.text || 'Выбор'));
      ui.choiceContainer.list.forEach((item, i, list) => {
        if (item.input) this.button(list[i + 1]?.text || 'Выбрать', () => item.emit('pointerdown'), card);
      });
      this.choice.append(card); card.querySelector('button')?.focus();
    }
    const talking = ui.dlgContainer.visible && !choosing && !readerKey && !this.menuOpen && !book;
    if (talking && this.modal.hidden) this.releaseControls();
    this.show(this.modal, talking);
    if (talking) {
      this.text(this.dialogueName, ui.dlgName.text);
      this.show(this.dialogueName, !!ui.dlgName.text);
      const text = ui.dlgText.text;
      if (this.dialogueText.textContent !== text) {
        const bottom = this.dialogueScroll.scrollTop + this.dialogueScroll.clientHeight >= this.dialogueScroll.scrollHeight - 28;
        this.text(this.dialogueText, text);
        if (bottom) this.dialogueScroll.scrollTop = this.dialogueScroll.scrollHeight;
      }
      if (this.lineKey !== ui._dialogueLine) { this.lineKey = ui._dialogueLine; this.dialogueScroll.scrollTop = 0; }
      const ready = ui._canContinueDialogue(); this.next.disabled = !ready;
      this.text(this.next, ready ? 'Далее →' : '…');
      const key = ui.dlgPortrait.texture?.key;
      this.show(this.portrait, !!ui.dlgPortrait.visible && !!ASSETS[key]);
      if (key && ASSETS[key] && this.portrait.dataset.key !== key) { this.portrait.dataset.key = key; this.portrait.src = ASSETS[key]; }
    }
    const chapter = ui.chapterTitleCard;
    const chapterVisible = chapter?.scene && chapter.alpha > .02;
    const captionVisible = ui.captionText.alpha > .02;
    this.show(this.caption, !this.menuOpen && !book && (chapterVisible || captionVisible));
    if (!this.caption.hidden) {
      this.text(this.caption, chapterVisible ? chapter.list.filter(o => o.text).map(o => o.text).join('\n\n') : ui.captionText.text);
      this.caption.style.opacity = chapterVisible ? chapter.alpha : ui.captionText.alpha;
    }
    this.text(this.toast, ui.saveToastText.alpha > .05 ? ui.saveToastText.text : '');
  },
});
