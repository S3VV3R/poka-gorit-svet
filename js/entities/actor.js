function ensureAnims(scene, key, frameCount) {
  if (scene.anims.exists(key + '_down_walk')) return;
  const per = frameCount; // frames per row
  const mk = (name, row, rate, repeat) => {
    scene.anims.create({
      key: key + '_' + name,
      frames: scene.anims.generateFrameNumbers(key, { start: row * per, end: row * per + per - 1 }),
      frameRate: rate,
      repeat: repeat,
    });
  };
  mk('down_walk', 0, 7, -1);
  mk('up_walk', 1, 7, -1);
  mk('left_walk', 2, 7, -1);
  scene.anims.create({ key: key + '_down_idle', frames: [{ key, frame: 0 }], frameRate: 1 });
  scene.anims.create({ key: key + '_up_idle', frames: [{ key, frame: per }], frameRate: 1 });
  scene.anims.create({ key: key + '_left_idle', frames: [{ key, frame: per * 2 }], frameRate: 1 });
}

class Actor {
  constructor(scene, x, y, texKey, opts = {}) {
    this.scene = scene;
    this.texKey = texKey;
    this.frameCount = opts.frameCount || 4;
    ensureAnims(scene, texKey, this.frameCount);
    this.sprite = scene.physics.add.sprite(x, y, texKey, 0);
    this.sprite.setOrigin(0.5, 0.9);
    if (opts.bodySize) {
      this.sprite.body.setSize(opts.bodySize[0], opts.bodySize[1]);
      this.sprite.body.setOffset(opts.bodyOffset ? opts.bodyOffset[0] : 0, opts.bodyOffset ? opts.bodyOffset[1] : 0);
    }
    this.sprite.setCollideWorldBounds(true);
    this.dir = opts.dir || 'down';
    this.moving = false;
    this.locked = false;
    this.scripted = false; // when true, update() is fully skipped (cutscene owns the sprite)
    this.speed = opts.speed || 62;
    this.owner = this;
    this.sprite.actor = this;
  }

  playDir(prefix) {
    const anim = this.dir === 'right'
      ? this.texKey + '_left_' + prefix
      : this.texKey + '_' + this.dir + '_' + prefix;
    this.sprite.setFlipX(this.dir === 'right');
    if (this.sprite.anims.currentAnim && this.sprite.anims.currentAnim.key === anim && this.sprite.anims.isPlaying) return;
    this.sprite.play(anim);
  }

  faceTowards(x, y) {
    const dx = x - this.sprite.x, dy = y - this.sprite.y;
    if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left';
    else this.dir = dy > 0 ? 'down' : 'up';
  }

  setPosition(x, y) { this.sprite.setPosition(x, y); }
  setSkin(key) {
    ensureAnims(this.scene, key, this.frameCount);
    this.texKey = key;
    this.sprite.setTexture(key, 0);
  }
  destroy() { this.sprite.destroy(); }
}

// ---------------------------------------------------------------------
// Player — reads an InputManager each frame and moves accordingly.
// ---------------------------------------------------------------------
