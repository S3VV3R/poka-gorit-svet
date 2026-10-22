Object.assign(AdaptiveUI, {
  createTutorial() {
    this.tutorial = this.node('aside', 'ad-tutorial'); this.tutorial.hidden = true;
    this.tutorial.setAttribute('aria-label', 'Обучение');
    this.tutorialTitle = this.node('strong'); this.tutorialText = this.node('p');
    const hide = this.button('Скрыть обучение', () => Tutorial.complete('dismissed'));
    this.tutorial.append(this.tutorialTitle, this.tutorialText, hide); this.root.append(this.tutorial);
  },
  syncTutorial() {
    const available = !!this.playScene && !this.menuOpen && this.modal.hidden && this.reader.hidden && this.choice.hidden &&
      this.caption.hidden && this.utility.hidden && !(Chronicle.panel && !Chronicle.panel.hidden) && !this.playScene.locked;
    Tutorial.observe(this.playScene, available);
    const step = Tutorial.step(), copy = Tutorial.copy(this.touch);
    this.show(this.tutorial, available && !!copy);
    if (copy) { this.text(this.tutorialTitle, copy[0]); this.text(this.tutorialText, copy[1]); }
    const target = this.tutorial.hidden ? null : step === 'moved' && this.touch ? this.joystick : step === 'interacted' && this.touch ? this.action :
      step === 'activities' ? Chronicle.controls?.querySelector('.life-primary') : null;
    if (this.tutorialTarget !== target) {
      this.tutorialTarget?.classList.remove('ad-coach-target'); target?.classList.add('ad-coach-target'); this.tutorialTarget = target;
    }
  },
});
