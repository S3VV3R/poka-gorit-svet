class NPC extends Actor {
  constructor(scene, x, y, texKey = 'tamir') {
    super(scene, x, y, texKey, { bodySize: [10, 8], bodyOffset: [3, 14], speed: 60 });
    this.target = null;
    this.onArrive = null;
  }

  moveTo(x, y, onArrive) {
    this.target = { x, y };
    this.onArrive = onArrive || null;
    this._tSet = this.scene.time.now;
  }

  update() {
    if (this.target) {
      const dx = this.target.x - this.sprite.x;
      const dy = this.target.y - this.sprite.y;
      let dist = Math.hypot(dx, dy);
      if (dist >= 3 && this.onArrive && this._tSet && this.scene.time.now - this._tSet > 6000) {
        this.sprite.setPosition(this.target.x, this.target.y); dist = 0;   // путь перекрыт — телепорт, чтобы сцена не зависла
      }
      if (dist < 3) {
        this.sprite.setVelocity(0, 0);
        this.target = null;
        this.playDir('idle');
        if (this.onArrive) { const cb = this.onArrive; this.onArrive = null; cb(); }
        return;
      }
      const vx = (dx / dist) * this.speed;
      const vy = (dy / dist) * this.speed;
      this.sprite.setVelocity(vx, vy);
      if (Math.abs(vx) > Math.abs(vy)) this.dir = vx > 0 ? 'right' : 'left';
      else this.dir = vy > 0 ? 'down' : 'up';
      this.playDir('walk');
    } else {
      this.sprite.setVelocity(0, 0);
      this.playDir('idle');
    }
  }
}

// ---------------------------------------------------------------------
// Cat — Марс / Абилка. Small wandering pet, 2-frame walk cycle.
// ---------------------------------------------------------------------
