class Cat extends Actor {
  constructor(scene, x, y, texKey) {
    super(scene, x, y, texKey, { bodySize: [10, 6], bodyOffset: [3, 5], speed: 34, frameCount: 2 });
    this.sprite.setScale(1);
    this.target = null;
    this.wanderTimer = 0;
    this.hidden = false;
  }

  moveTo(x, y, onArrive) {
    this.target = { x, y };
    this.onArrive = onArrive || null;
    this.targetSetAt = this.scene.time.now;
  }

  wander(bounds) {
    this.wanderTimer -= 16;
    if (this.wanderTimer <= 0 && !this.target) {
      this.wanderTimer = 1800 + Math.random() * 2600;
      if (Math.random() < 0.6) {
        const x = Phaser.Math.Between(bounds.x, bounds.x + bounds.w);
        const y = Phaser.Math.Between(bounds.y, bounds.y + bounds.h);
        this.moveTo(x, y);
      }
    }
  }

  update() {
    if (this.target) {
      // give up on a target that's been unreachable for too long (e.g.
      // blocked by furniture) so the cat doesn't get stuck forever
      if (this.targetSetAt && this.scene.time.now - this.targetSetAt > 3500) {
        this.sprite.setVelocity(0, 0);
        this.target = null;
        this.playDir('idle');
        return;
      }
      const dx = this.target.x - this.sprite.x;
      const dy = this.target.y - this.sprite.y;
      const dist = Math.hypot(dx, dy);
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
/* =====================================================================
   UIScene — a permanent overlay scene (zoom = 1, screen-space) that
   renders the dialogue box, choice buttons, interaction prompt,
   fade-to-black transitions and cinematic letterbox bars. Gameplay
   scenes grab a reference via `this.scene.get('UI')` and call its
   promise-based API instead of drawing any of this themselves.
   ===================================================================== */
