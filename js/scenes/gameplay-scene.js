class GameplayScene extends Phaser.Scene {
  commonCreate() {
    this.ui = this.scene.get('UI');
    if (this.ui.scene.isPaused()) this.ui.scene.resume();
    if (this.ui.scene.isSleeping()) this.ui.scene.wake();
    if (!this.scene.isActive('UI')) this.scene.launch('UI');
    this.ui.resetForScene();
    this.input2 = createInput(this);
    this.interactions = new InteractionSystem(this, this.ui);
    this.cats = [];
    this.locked = false;
    if (this.ui.showTouchControls) this.ui.showTouchControls();
    // населяем сцену, когда её create() отработал полностью
    this.events.once('create', () => { try { if (typeof populateScene === 'function') populateScene(this); } catch (e) { console.error('populate', e); } });
    this.events.once('shutdown', () => { if (this.ui && this.ui.hideTouchControls) this.ui.hideTouchControls(); });
  }

  addCollider(x, y, w, h) {
    if (!this._colliders) this._colliders = this.physics.add.staticGroup();
    const r = this.add.rectangle(x, y, w, h).setVisible(false);
    if (!this._colRects) this._colRects = [];
    this._colRects.push([x, y, w, h]);
    this.physics.add.existing(r, true);
    this._colliders.add(r);
    if (this.player) this.physics.add.collider(this.player.sprite, r);
    return r;
  }

  collidersReadyFor(sprite) {
    if (this._colliders) this.physics.add.collider(sprite, this._colliders);
  }

  lockInput() { this.locked = true; if (this.player) this.player.locked = true; }
  unlockInput() { this.locked = false; if (this.player) this.player.locked = false; }

  // Runs an async cutscene safely: if anything throws, we log it and
  // recover the game to a playable state instead of hanging forever
  // on a black screen or a frozen player.
  safeRun(fn) {
    Promise.resolve().then(fn).catch((err) => {
      if (err && err.code === 'DIALOGUE_CANCELLED') return;
      console.error('Cutscene error — recovering:', err);
      this.unlockInput();
      if (this.player) { this.player.scripted = false; this.player.sprite.setVelocity(0, 0); }
      if (this.ui) {
        this.ui.cancelConversations();
        this.ui.fadeIn(400);
        this.ui.hidePrompt();
        if (this.ui.dlgContainer) this.ui.dlgContainer.setVisible(false);
        if (this.ui.choiceContainer) this.ui.choiceContainer.setVisible(false);
        this.ui.letterboxOff(200);
      }
    });
  }

  update(time, delta) {
    const reading = this.ui && this.ui.isConversationActive && this.ui.isConversationActive();
    if (this.input2 && this.input2.pauseJustDown() && !this.locked && !reading) {
      this.scene.pause();
      this.scene.launch('Pause', { returnKey: this.scene.key });
      return;
    }
    if (this.player) {
      if (reading && !this.player.scripted) this.player.sprite.setVelocity(0, 0);
      else this.player.update(this.input2, delta);
      this.player.sprite.setDepth(this.player.sprite.y);
    }
    if (this.npc) { this.npc.update(); this.npc.sprite.setDepth(this.npc.sprite.y); }
    this.cats.forEach((c) => { c.update(); c.sprite.setDepth(c.sprite.y - 4); });
    if (typeof worldUpdate === 'function') worldUpdate(this, time, delta);
    if (this.interactions) {
      if (this.locked || reading || !this.player) {
        this.interactions.holdMs = 0;
        this.interactions.needRelease = true;
        this.interactions.active = null;
        this.ui.hidePrompt();
      } else {
        this.interactions.update(this.player, this.input2.interactIsDown(), delta);
      }
    }
    if (this.tick) this.tick(time, delta);
  }
}
/* =====================================================================
   Map builder helpers — small utilities for laying out the simple
   rectangular tile grids used by each location, plus a dusk/night
   tint overlay helper shared by outdoor scenes.
   ===================================================================== */
