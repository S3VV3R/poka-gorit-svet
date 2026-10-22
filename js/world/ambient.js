const DIR_FRAME = { down: 0, up: 4, left: 8, right: 8 };
function makeCrowdMember(scene, x, y, tex, dir, opts = {}) {
  const s = scene.add.sprite(x, y, tex, DIR_FRAME[dir] || 0).setOrigin(0.5, 0.9);
  if (dir === 'right') s.setFlipX(true);
  s.setDepth(opts.depth !== undefined ? opts.depth : y + 1);
  scene.tweens.add({
    targets: s, y: y - 1, duration: 900 + Math.random() * 900, yoyo: true, repeat: -1,
    delay: Math.random() * 1500, ease: 'Sine.easeInOut',
  });
  if (opts.collide !== false) scene.addCollider(x, y - 2, 9, 7);
  return s;
}

// ---------------------------------------------------------------------
// Walkers (passers-by) — non-physical, walk a lane and vanish
// ---------------------------------------------------------------------
class Walker {
  constructor(scene, tex, x, y, dirSign, speed) {
    this.scene = scene;
    ensureAnims(scene, tex, 4);
    this.tex = tex;
    this.sprite = scene.add.sprite(x, y, tex, 8).setOrigin(0.5, 0.9);
    this.sign = dirSign; this.speed = speed; this.pause = 0; this.pausedOnce = false;
    this.sprite.setFlipX(dirSign > 0);
    this.sprite.play(tex + '_left_walk');
    this.dog = null;
  }
  update(dt) {
    if (this.pause > 0) {
      this.pause -= dt;
      this.sprite.anims.stop(); this.sprite.setFrame(8);
      if (this.pause <= 0) this.sprite.play(this.tex + '_left_walk');
    } else {
      this.sprite.x += this.sign * this.speed * dt / 1000;
    }
    this.sprite.setDepth(this.sprite.y);
    if (this.dog) this.dog.follow(this.sprite.x - this.sign * 14, this.sprite.y + 2, dt);
  }
  destroy() { this.sprite.destroy(); if (this.dog) this.dog.destroy(); }
}
class FollowDog {
  constructor(scene, tex, x, y) {
    this.scene = scene; this.tex = tex;
    ensureAnims(scene, tex, 2);
    this.sprite = scene.add.sprite(x, y, tex, 4).setOrigin(0.5, 0.9);
    this.sprite.play(tex + '_left_walk');
    this.lx = x;
  }
  follow(x, y, dt) {
    const dx = x - this.sprite.x, dy = y - this.sprite.y;
    this.sprite.x += dx * Math.min(1, dt / 220);
    this.sprite.y += dy * Math.min(1, dt / 220);
    this.sprite.setFlipX(dx > 0.2 ? true : (dx < -0.2 ? false : this.sprite.flipX));
    this.sprite.setDepth(this.sprite.y);
  }
  destroy() { this.sprite.destroy(); }
}

class Ambient {
  constructor(scene) {
    this.scene = scene;
    this.walkerSpecs = [];
    this.walkers = [];
    this.pigeons = [];
    this.flyers = [];
    this.leaves = [];
    this.pool = [];
    for (let i = 1; i <= 16; i++) this.pool.push('ped_' + i);
  }

  // lanes: [{ y, x0, x1 }]; options: { every, max, speed:[a,b], dogChance, kidChance }
  pedestrians(lanes, opts = {}) {
    this.walkerSpecs.push({ lanes, every: opts.every || 5200, max: opts.max || 4, speed: opts.speed || [18, 30],
      dogChance: opts.dogChance === undefined ? 0.18 : opts.dogChance, kidChance: opts.kidChance || 0.12,
      timer: Math.random() * 1500, count: 0 });
    // prime the street so it never starts empty
    const spec = this.walkerSpecs[this.walkerSpecs.length - 1];
    const n = Math.min(spec.max, 3);
    for (let i = 0; i < n; i++) this.spawn(spec, true);
  }

  spawn(spec, prime) {
    if (spec.count >= spec.max) return;
    const lane = spec.lanes[Math.floor(Math.random() * spec.lanes.length)];
    const sign = Math.random() < 0.5 ? 1 : -1;
    const x = prime ? lane.x0 + Math.random() * (lane.x1 - lane.x0) : (sign > 0 ? lane.x0 : lane.x1);
    const kid = Math.random() < spec.kidChance;
    const tex = kid ? 'kid_' + (1 + Math.floor(Math.random() * 4)) : this.pool[Math.floor(Math.random() * this.pool.length)];
    const sp = spec.speed[0] + Math.random() * (spec.speed[1] - spec.speed[0]);
    const w = new Walker(this.scene, tex, x, lane.y + (Math.random() * 8 - 4), sign, sp);
    w.spec = spec; w.lane = lane;
    if (!kid && Math.random() < spec.dogChance) {
      w.dog = new FollowDog(this.scene, ['dog_brown', 'dog_white', 'dog_black'][Math.floor(Math.random() * 3)], x - sign * 14, w.sprite.y + 2);
    }
    if (Math.random() < 0.3) w.pause = 0;
    w.pauseAt = lane.x0 + (lane.x1 - lane.x0) * (0.25 + Math.random() * 0.5);
    spec.count++;
    this.walkers.push(w);
  }

  // pigeons pecking around an area
  pigeonFlock(area, n) {
    for (let i = 0; i < n; i++) {
      const s = this.scene.add.sprite(area.x + Math.random() * area.w, area.y + Math.random() * area.h, 'pigeon', 0).setOrigin(0.5, 1);
      s.setDepth(s.y + 2);
      this.pigeons.push({ s, area, state: 'idle', t: 500 + Math.random() * 2500, flee: 0 });
    }
  }

  butterflies(area, n) {
    for (let i = 0; i < n; i++) {
      const s = this.scene.add.sprite(area.x + Math.random() * area.w, area.y + Math.random() * area.h, 'butterfly', 0).setDepth(900).setOrigin(0.5);
      const ph = Math.random() * 6.28;
      this.flyers.push({ s, area, kind: 'butterfly', ph, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 10, flap: Math.random() * 300 });
    }
  }

  fireflies(area, n) {
    for (let i = 0; i < n; i++) {
      const g = this.scene.add.image(area.x + Math.random() * area.w, area.y + Math.random() * area.h, 'glow')
        .setBlendMode(Phaser.BlendModes.ADD).setScale(0.12 + Math.random() * 0.1).setDepth(900).setTint(0xd8ff7a);
      this.flyers.push({ s: g, area, kind: 'firefly', ph: Math.random() * 6.28, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 6 });
    }
  }

  fallingLeaves(w, h, n, tints = [0xc8742e, 0xd9a03a, 0xa8482e]) {
    for (let i = 0; i < n; i++) {
      const l = this.scene.add.image(Math.random() * w, Math.random() * h, 'leaf').setDepth(940).setTint(tints[i % tints.length]);
      this.leaves.push({ s: l, w, h, ph: Math.random() * 6.28, sp: 8 + Math.random() * 10, sway: 10 + Math.random() * 14 });
    }
  }

  update(time, delta) {
    const dt = delta || 16;
    const reduced = typeof GamePerformance !== 'undefined' && GamePerformance.reducedEffects;
    if (this.reducedEffects !== reduced) {
      this.reducedEffects = reduced;
      // Only decorative particles change density. Residents, pets and interactions stay.
      [this.flyers, this.leaves].forEach(items => items.forEach((item, i) => item.s.setVisible(!reduced || i % 2 === 0)));
    }
    // spawn + move walkers
    this.walkerSpecs.forEach((sp) => {
      sp.timer -= dt;
      if (sp.timer <= 0) { sp.timer = sp.every * (0.6 + Math.random() * 0.9); this.spawn(sp, false); }
    });
    for (let i = this.walkers.length - 1; i >= 0; i--) {
      const w = this.walkers[i];
      if (!w.pausedOnce && w.pauseAt !== undefined && ((w.sign > 0 && w.sprite.x > w.pauseAt) || (w.sign < 0 && w.sprite.x < w.pauseAt))) {
        w.pausedOnce = true;
        if (Math.random() < 0.35) w.pause = 900 + Math.random() * 1800;
      }
      w.update(dt);
      if ((w.sign > 0 && w.sprite.x > w.lane.x1 + 10) || (w.sign < 0 && w.sprite.x < w.lane.x0 - 10)) {
        w.spec.count--; w.destroy(); this.walkers.splice(i, 1);
      }
    }
    // pigeons
    const pl = this.scene.player;
    this.pigeons.forEach((p) => {
      const s = p.s;
      if (p.state === 'fly') {
        p.flee -= dt;
        s.x += p.vx * dt / 1000; s.y += p.vy * dt / 1000;
        s.setFrame(2 + (Math.floor(time / 90) % 2));
        s.setFlipX(p.vx < 0);
        if (p.flee <= 0) { p.state = 'idle'; p.t = 1500 + Math.random() * 2500; s.setFrame(0); }
      } else {
        p.t -= dt;
        if (p.t <= 0) { p.t = 500 + Math.random() * 2200; s.setFrame(s.frame.name === 1 ? 0 : (Math.random() < 0.5 ? 1 : 0)); }
        if (pl) {
          const d = Phaser.Math.Distance.Between(pl.sprite.x, pl.sprite.y, s.x, s.y);
          if (d < 26) {
            p.state = 'fly'; p.flee = 900;
            const ang = Math.atan2(s.y - pl.sprite.y, s.x - pl.sprite.x);
            p.vx = Math.cos(ang) * 60 + (Math.random() - 0.5) * 20; p.vy = Math.sin(ang) * 30 - 14;
            // stay inside the pigeon's home area afterwards
            const a = p.area;
            if (s.x + p.vx * 0.9 < a.x - 30 || s.x + p.vx * 0.9 > a.x + a.w + 30) p.vx = -p.vx;
          }
        }
      }
      s.setDepth(s.y + 2);
    });
    // butterflies & fireflies
    this.flyers.forEach((f) => {
      if (!f.s.visible) return;
      f.ph += dt / 1000 * (f.kind === 'butterfly' ? 3 : 1.4);
      const a = f.area;
      f.s.x += (f.vx + Math.cos(f.ph) * (f.kind === 'butterfly' ? 14 : 6)) * dt / 1000;
      f.s.y += (f.vy + Math.sin(f.ph * 1.3) * (f.kind === 'butterfly' ? 10 : 5)) * dt / 1000;
      if (f.s.x < a.x) f.vx = Math.abs(f.vx) + 2; if (f.s.x > a.x + a.w) f.vx = -Math.abs(f.vx) - 2;
      if (f.s.y < a.y) f.vy = Math.abs(f.vy) + 1; if (f.s.y > a.y + a.h) f.vy = -Math.abs(f.vy) - 1;
      if (f.kind === 'butterfly') { f.flap += dt; f.s.setFrame(Math.floor(f.flap / 140) % 2); }
      else f.s.setAlpha(0.35 + 0.5 * Math.abs(Math.sin(f.ph * 1.1)));
    });
    // leaves
    this.leaves.forEach((l) => {
      if (!l.s.visible) return;
      l.ph += dt / 1000 * 1.6;
      l.s.y += l.sp * dt / 1000; l.s.x += Math.cos(l.ph) * l.sway * dt / 1000;
      l.s.setRotation(l.ph);
      if (l.s.y > l.h + 10) { l.s.y = -10; l.s.x = Math.random() * l.w; }
    });
  }
}

// butterflies need 8×6 frames — loaded as spritesheet in BootScene
// ---------------------------------------------------------------------
// Scene mix-ins (attached to GameplayScene.prototype)
// ---------------------------------------------------------------------
Object.assign(GameplayScene.prototype, {
  // is a point too close to collider rects / interactions / blocked?
  pointBlocked(x, y, margin = 8) {
    const rects = this._colRects || [];
    for (const r of rects) {
      if (Math.abs(x - r[0]) < r[2] / 2 + margin && Math.abs(y - r[1]) < r[3] / 2 + margin) return true;
    }
    return false;
  },

  refreshVillagers() {
    if (!this.villagers) return;
    const era = eraOf(this);
    this.villagers.forEach((v) => v.setSkin(castTexFor(v.id, era)));
  },

  ambientInit() {
    if (!this.ambient) this.ambient = new Ambient(this);
    return this.ambient;
  },

  addVillager(id, x, y, opts = {}) {
    const info = CAST[id];
    const v = new Villager(this, id, x, y, opts);
    this.collidersReadyFor(v.sprite);
    if (!this.villagers) this.villagers = [];
    this.villagers.push(v);
    if (opts.talk !== false && info) {
      v.talkItem = this.interactions.add(x, y, opts.radius || 26, 'поговорить с ' + info.with, () => {
        if (this.locked) return;
        this.safeRun(() => castTalk(this, id, v));
      });
      v.talkItem.follow = v;
    }
    return v;
  },

  // unnamed background person; optionally talkable with a pool of small-talk
  addExtra(x, y, tex, dir, opts = {}) {
    const s = makeCrowdMember(this, x, y, tex, dir, opts);
    if (opts.pool) {
      const pool = SMALLTALK[opts.pool] || SMALLTALK.generic;
      let n = Math.floor(Math.random() * pool.length);
      const it = this.interactions.add(x, y, opts.radius || 20, opts.label || 'поговорить', () => {
        if (this.locked) return;
        const line = pool[n++ % pool.length];
        this.safeRun(async () => {
          this.lockInput();
          await this.ui.dialogue(Array.isArray(line) ? line : [{ who: opts.who || '', text: line }]);
          this.unlockInput();
        });
      });
    }
    return s;
  },

  chatGroup(x, y, texes, opts = {}) {
    const r = opts.r || 9;
    const n = texes.length;
    const out = [];
    texes.forEach((tex, i) => {
      const a = (Math.PI * 2 * i) / n + (opts.rot || 0);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r * 0.7;
      const dx = x - px, dy = y - py;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      out.push(this.addExtra(px, py, tex, dir, { pool: i === 0 ? opts.pool : null, label: opts.label, who: opts.who }));
    });
    return out;
  },

  addPet(texKey, x, y, bounds) {
    const d = new Cat(this, x, y, texKey);
    d.speed = 40;
    this.collidersReadyFor(d.sprite);
    d.bounds = bounds;
    if (!this.pets) this.pets = [];
    this.pets.push(d);
    return d;
  },

  // scatter small decorations in free spots of a rectangle
  scatterDecor(area, kinds, count, opts = {}) {
    const rng = makeRng(this.scene.key + (opts.seed || '') + kinds.join(','));
    if (!this._decorSpots) this._decorSpots = [];
    const avoidItems = (this.interactions ? this.interactions.items : []);
    let placed = 0, tries = 0;
    while (placed < count && tries < count * 40) {
      tries++;
      const x = Math.round(area.x + rng() * area.w), y = Math.round(area.y + rng() * area.h);
      const kind = kinds[Math.floor(rng() * kinds.length)];
      const cfg = DECOR_CFG[kind] || {};
      const margin = opts.margin !== undefined ? opts.margin : (cfg.margin || 6);
      if (this.pointBlocked(x, y - (cfg.h || 4) / 2, margin + (cfg.w || 8) / 2)) continue;
      if (avoidItems.some((it) => Math.hypot(it.x - x, it.y - y) < 12)) continue;
      if (this._decorSpots.some((p) => Math.hypot(p[0] - x, p[1] - y) < (opts.spacing || 12))) continue;
      if (this.player && Math.hypot(this.player.sprite.x - x, this.player.sprite.y - y) < 14) continue;
      if (opts.skip && opts.skip(x, y)) continue;
      if (opts.edge) {   // держимся у границ прямоугольника (стены, углы), а не посреди прохода
        const dEdge = Math.min(x - area.x, area.x + area.w - x, y - area.y, area.y + area.h - y);
        if (dEdge > opts.edge) continue;
      }
      const im = this.add.image(x, y, kind).setOrigin(0.5, 1);
      im.setDepth(cfg.flat ? 3 + y / 1000 : y);
      if (cfg.collide) this.addCollider(x, y - (cfg.ch || 3), cfg.cw || cfg.w || 8, cfg.chh || 5);
      this._decorSpots.push([x, y]);
      placed++;
    }
    return placed;
  },
});

// flat = drawn on the ground (never hides characters); collide = blocks movement
