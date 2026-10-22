const ERA_BY_SCENE = {
  Street: 'e1', DateScene: 'e1', TripScene: 'e1', Apartment: 'e2', Proposal: 'e2',
  Wedding: 'e3', YoungFamily: 'e4', Baby: 'e5', Kids: 'e6', EmptyNest: 'e7', LateYears: 'e8', Ending: 'e9',
};
function eraOf(scene) { return ERA_BY_SCENE[scene.scene.key] || 'e1'; }

function ageSheetStage() { return GameState.ageStage || 'young'; }
function castTex(id) { return `cast_${id}_${ageSheetStage()}`; }
// дети сами взрослеют вместе с эпохой, остальные — по возрасту Насти
function castTexFor(id, era) {
  const st = ageSheetStage();
  if (id === 'mila' || id === 'sofia' || id === 'maxim') {
    const map = { e6: st === 'mid' ? 'mid' : 'young', e7: 'mid', e8: 'old', e9: 'old' };
    return `cast_${id}_${map[era] || 'young'}`;
  }
  return `cast_${id}_${st}`;
}

// ---------------------------------------------------------------------
// seeded rng so every scene gets the same «random» layout each visit
// ---------------------------------------------------------------------
function makeRng(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------------------------------------------------------------------
// cast state (who the player has met, how close they are)
// ---------------------------------------------------------------------
function castState(id) {
  const f = GameState.flags;
  if (!f.cast) f.cast = {};
  if (!f.cast[id]) f.cast[id] = { met: false, beats: {}, bond: 0, talks: 0 };
  return f.cast[id];
}
function castMetCount() {
  const c = GameState.flags.cast || {};
  return Object.keys(c).filter((k) => c[k].met).length;
}
function castBestBond() {
  const c = GameState.flags.cast || {};
  return Object.keys(c).reduce((m, k) => Math.max(m, c[k].bond || 0), 0);
}

// ---------------------------------------------------------------------
// Villager — named, wandering, talkable
// ---------------------------------------------------------------------
class Villager extends NPC {
  constructor(scene, id, x, y, opts = {}) {
    super(scene, x, y, opts.tex || castTexFor(id, eraOf(scene)));
    this.id = id;
    this.mode = opts.mode || 'wander';          // 'wander' | 'stand'
    this.area = opts.area || { x: x - 30, y: y - 20, w: 60, h: 40 };
    this.speed = opts.speed || 20;
    this.idleMs = 400 + Math.random() * 2000;
    this.dir = opts.dir || 'down';
    this.targetSetAt = 0;
    this.sprite.body.setSize(8, 6).setOffset(4, 16);
  }

  moveTo(x, y, cb) { super.moveTo(x, y, cb); this.targetSetAt = this.scene.time.now; }

  pickSpot() {
    const sc = this.scene;
    for (let i = 0; i < 10; i++) {
      const x = this.area.x + Math.random() * this.area.w;
      const y = this.area.y + Math.random() * this.area.h;
      if (!sc.pointBlocked || !sc.pointBlocked(x, y, 9)) return { x, y };
    }
    return null;
  }

  step(dt) {
    const sc = this.scene;
    if (sc.locked || this.frozen) {
      this.sprite.setVelocity(0, 0); this.target = null; this.playDir('idle');
    } else {
      if (this.target && this.scene.time.now - this.targetSetAt > 4200) {
        this.sprite.setVelocity(0, 0); this.target = null;
      }
      if (this.target) this.update();
      else {
        this.sprite.setVelocity(0, 0);
        this.idleMs -= dt;
        // glance at the player when they stand close
        if (sc.player) {
          const d = Phaser.Math.Distance.Between(sc.player.sprite.x, sc.player.sprite.y, this.sprite.x, this.sprite.y);
          if (d < 34) this.faceTowards(sc.player.sprite.x, sc.player.sprite.y);
        }
        this.playDir('idle');
        if (this.mode === 'wander' && this.idleMs <= 0) {
          this.idleMs = 1800 + Math.random() * 3600;
          const p = this.pickSpot();
          if (p) this.moveTo(p.x, p.y);
        }
      }
    }
    this.sprite.setDepth(this.sprite.y);
  }
}

// ---------------------------------------------------------------------
// Static «crowd» member: a seated / standing extra with a gentle idle bob.
// ---------------------------------------------------------------------
