Object.assign(AdaptiveUI, {
  createControls() {
    const controls = this.node('div', 'ad-controls'); controls.hidden = true;
    this.controls = controls;
    const joystick = this.node('div', 'ad-joystick');
    joystick.setAttribute('role', 'group'); joystick.setAttribute('aria-label', 'Джойстик движения');
    const knob = this.node('span', 'ad-knob'); joystick.append(knob);
    this.joystick = joystick; this.knob = knob;
    const move = e => {
      if (this.joyId !== e.pointerId) return;
      const r = joystick.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      const distance = Math.hypot(x, y), radius = 32, scale = Math.min(1, radius / (distance || 1));
      knob.style.transform = `translate(${x * scale}px,${y * scale}px)`;
      TouchInput.dx = distance > 9 ? x / distance : 0;
      TouchInput.dy = distance > 9 ? y / distance : 0;
    };
    joystick.addEventListener('pointerdown', e => {
      if (this.joyId != null) return;
      e.preventDefault(); this.joyId = e.pointerId; joystick.setPointerCapture(e.pointerId); move(e); Audio.unlock();
    });
    joystick.addEventListener('pointermove', move);
    const endMove = e => {
      if (this.joyId !== e.pointerId) return;
      this.joyId = null; TouchInput.dx = TouchInput.dy = 0; knob.style.transform = '';
    };
    for (const name of ['pointerup','pointercancel','lostpointercapture']) joystick.addEventListener(name, endMove);
    const action = this.button('Действие', () => {}, controls); action.className = 'ad-action';
    action.setAttribute('aria-label', 'Действие: нажать или удерживать'); this.action = action;
    action.addEventListener('pointerdown', e => {
      if (this.actionId != null || action.disabled) return;
      e.preventDefault(); this.actionId = e.pointerId; action.setPointerCapture(e.pointerId);
      Audio.unlock(); this.ui._touchInteract = true; this.ui._touchInteractHeld = true;
    });
    const endAction = e => {
      if (this.actionId !== e.pointerId) return;
      this.actionId = null; if (this.ui) this.ui._touchInteractHeld = false;
    };
    for (const name of ['pointerup','pointercancel','lostpointercapture']) action.addEventListener(name, endAction);
    // Keyboard activation for an explicitly focused button remains available.
    action.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); this.ui._touchInteract = true; this.ui._touchInteractHeld = true; }
    });
    action.addEventListener('keyup', () => { if (this.ui) this.ui._touchInteractHeld = false; });
    action.addEventListener('blur', () => { if (this.ui) this.ui._touchInteractHeld = false; });
    controls.append(joystick); this.root.append(controls);
    this.hud = this.node('div', 'ad-hud'); this.hud.hidden = true;
    this.hudText = this.node('div', 'ad-hud-text');
    this.quest = this.node('div', 'ad-quest'); this.status = this.node('div', 'ad-status');
    this.hudText.append(this.quest, this.status); this.hud.append(this.hudText);
    this.pause = this.button('Пауза', () => { if (this.ui) this.ui._touchPause = true; }, this.hud);
    this.free = this.button('Продолжить историю →', () => this.playScene?._homeLife?.freeText?.emit('pointerdown'), this.hudText);
    this.root.append(this.hud);
    this.promptNode = this.node('div', 'ad-prompt'); this.promptNode.hidden = true; this.root.append(this.promptNode);
    this.progress = this.node('progress'); this.progress.max = 58; this.promptNode.append(this.progress);
    this.promptLabel = this.node('div'); this.promptNode.prepend(this.promptLabel);
  },
  releaseControls() {
    this.joyId = this.actionId = null; TouchInput.dx = TouchInput.dy = 0;
    if (this.knob) this.knob.style.transform = '';
    if (this.ui) { this.ui._touchInteract = false; this.ui._touchInteractHeld = false; this.ui._touchPause = false; this.ui._dialogueEnterDown = false; }
  },
  syncControls(ui) {
    const sc = this.playScene, modal = this.menuOpen || !this.modal.hidden || !this.reader.hidden || (this.utility && !this.utility.hidden) || (Chronicle.panel && !Chronicle.panel.hidden);
    const available = !!sc && !modal && !ui.isConversationActive();
    const enabled = available && !sc.locked;
    const shown = enabled && this.touch;
    if (!shown && !this.controls.hidden) this.releaseControls();
    this.show(this.controls, shown); this.show(this.hud, available);
    this.pause.disabled = !enabled;
    this.text(this.quest, ui.questContainer.visible ? ui.questText.text : '');
    this.text(this.status, ui.lifeText.visible ? ui.lifeText.text : '');
    this.show(this.free, !!sc?._homeLife?.freeText?.visible && enabled);
    this.show(this.promptNode, enabled && ui.prompt.visible);
    this.text(this.promptLabel, ui.prompt.text.replace(/\bE\b/g, this.touch ? '«Действие»' : 'E'));
    this.show(this.progress, ui.promptBarBg.visible);
    if (ui.promptBarBg.visible) this.progress.value = ui.promptBarFill.width;
  },
});
