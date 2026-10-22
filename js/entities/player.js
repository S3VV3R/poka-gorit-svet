class Player extends Actor {
  constructor(scene, x, y, tex = 'nastya') {
    super(scene, x, y, tex, { bodySize: [10, 8], bodyOffset: [3, 14], speed: 78 });
    this._stepTimer = 0;
    this._scriptTarget = null;
    this._onArriveScript = null;
  }

  // used by cutscenes: velocity-seek toward a point, independent of input
  moveToScripted(x, y, onArrive) {
    this.scripted = true;
    this._scriptT = this.scene.time.now;
    this._scriptTarget = { x, y };
    this._onArriveScript = onArrive || null;
  }

  releaseScript() {
    this.scripted = false;
    this._scriptTarget = null;
    this.sprite.setVelocity(0, 0);
  }

  update(input, dt) {
    if (this.scripted) {
      if (!this._scriptTarget) { this.sprite.setVelocity(0, 0); this.playDir('idle'); return; }
      const dx = this._scriptTarget.x - this.sprite.x;
      const dy = this._scriptTarget.y - this.sprite.y;
      let dist = Math.hypot(dx, dy);
      // страховка: если путь перекрыт мебелью/декором, не зависаем навсегда
      if (dist >= 3 && this._scriptT && this.scene.time.now - this._scriptT > 5000) {
        this.sprite.setPosition(this._scriptTarget.x, this._scriptTarget.y); dist = 0;
      }
      if (dist < 3) {
        this.sprite.setVelocity(0, 0);
        this._scriptTarget = null;
        this.playDir('idle');
        if (this._onArriveScript) { const cb = this._onArriveScript; this._onArriveScript = null; cb(); }
        return;
      }
      const vx = (dx / dist) * this.speed, vy = (dy / dist) * this.speed;
      this.sprite.setVelocity(vx, vy);
      if (Math.abs(vx) > Math.abs(vy)) this.dir = vx > 0 ? 'right' : 'left';
      else this.dir = vy > 0 ? 'down' : 'up';
      this.playDir('walk');
      return;
    }
    if (this.locked) {
      this.sprite.setVelocity(0, 0);
      this.playDir('idle');
      return;
    }
    const v = input.vector();
    const len = Math.hypot(v.x, v.y) || 1;
    const vx = (v.x / len) * this.speed;
    const vy = (v.y / len) * this.speed;
    this.sprite.setVelocity(vx, vy);

    if (v.x !== 0 || v.y !== 0) {
      this.moving = true;
      if (Math.abs(v.x) > Math.abs(v.y)) this.dir = v.x > 0 ? 'right' : 'left';
      else this.dir = v.y > 0 ? 'down' : 'up';
      this.playDir('walk');
      this._stepTimer -= dt;
      if (this._stepTimer <= 0) {
        if (this.scene._homeLife && typeof HomeLife !== 'undefined') HomeLife.footstep(this.scene, this.sprite.x, this.sprite.y);
        else Audio.playFootstep();
        this._stepTimer = 300;
      }
    } else {
      this.moving = false;
      this.playDir('idle');
    }
  }
}

// ---------------------------------------------------------------------
// NPC — Тамир or any human NPC. Can be driven directly by cutscene code
// (setTarget/moveTo) or left idle.
// ---------------------------------------------------------------------
