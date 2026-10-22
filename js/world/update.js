const DECOR_CFG = {
  flowers_red: { flat: true, w: 14, h: 9 }, flowers_yellow: { flat: true, w: 14, h: 9 },
  flowers_blue: { flat: true, w: 14, h: 9 }, flowers_white: { flat: true, w: 14, h: 9 },
  grass_tuft: { flat: true, w: 8, h: 6 }, stones: { flat: true, w: 14, h: 8 },
  mushroom: { flat: true, w: 7, h: 7 }, puddle_deco: { flat: true, w: 18, h: 8 },
  log: { collide: true, w: 20, h: 9, cw: 18, chh: 5 }, stump: { collide: true, w: 10, h: 9, cw: 8, chh: 5 },
  hedge: { collide: true, w: 26, h: 13, cw: 24, chh: 7 }, barrel: { collide: true, w: 10, h: 13, cw: 9, chh: 6 },
  crates: { collide: true, w: 15, h: 12, cw: 14, chh: 6 }, hydrant: { collide: true, w: 8, h: 11, cw: 6, chh: 5 },
  bush: { collide: true, w: 18, h: 14, cw: 14, chh: 6 }, recycle_bin: { collide: true, w: 9, h: 13, cw: 8, chh: 5 },
  trashcan: { collide: true, w: 10, h: 14, cw: 8, chh: 5 }, flowerbed: { collide: true, w: 24, h: 11, cw: 22, chh: 6 },
  shoes: { flat: true, w: 12, h: 6 }, books_stack: { flat: true, w: 9, h: 9 }, toy_cars: { flat: true, w: 12, h: 6 },
  pillow_pile: { flat: true, w: 14, h: 10 }, doormat: { flat: true, w: 16, h: 8 }, rug_round: { flat: true, w: 20, h: 14 },
  laundry_basket: { collide: true, w: 12, h: 11, cw: 10, chh: 5 }, plant_big: { collide: true, w: 16, h: 24, cw: 10, chh: 6 },
  floor_lamp: { collide: true, w: 8, h: 24, cw: 6, chh: 4 }, vase: { collide: false, w: 7, h: 11 },
  plant: { collide: true, w: 12, h: 14, cw: 10, chh: 5 }, candle: { w: 6, h: 9 }, radio: { w: 11, h: 9 },
  cat_tree: { collide: true, w: 14, h: 26, cw: 10, chh: 6 }, guitar: { collide: true, w: 8, h: 18, cw: 6, chh: 5 },
  coat_rack: { collide: true, w: 9, h: 22, cw: 6, chh: 4 }, chair: { collide: true, w: 9, h: 15, cw: 8, chh: 5 },
};

// patched into GameplayScene.update through this hook
function worldUpdate(scene, time, delta) {
  const dt = delta || 16;
  if (scene.villagers) scene.villagers.forEach((v) => v.step(dt));
  if (scene.pets) scene.pets.forEach((p) => { if (p.bounds && !scene.locked) p.wander(p.bounds); p.update(); p.sprite.setDepth(p.sprite.y - 2); });
  if (scene.ambient) scene.ambient.update(time, dt);
}

// ---------------------------------------------------------------------
// Conversation engine
// ---------------------------------------------------------------------
async function castTalk(scene, id, vill) {
  const info = CAST[id];
  const st = castState(id);
  scene.lockInput();
  if (vill) { vill.frozen = true; vill.faceTowards(scene.player.sprite.x, scene.player.sprite.y); vill.playDir('idle'); }
  if (scene.player && vill) scene.player.faceTowards(vill.sprite.x, vill.sprite.y);
  try {
    const era = eraOf(scene);
    if (!st.met) {
      st.met = true;
      if (scene.ui.saveToast) scene.ui.saveToast('Новое знакомство: ' + info.name);
      castCheckAchievements();
    }
    st.talks = (st.talks || 0) + 1;
    const beats = (ARCS[id] && ARCS[id][era]) || [];
    let played = false;
    for (let i = 0; i < beats.length; i++) {
      const key = era + ':' + i;
      if (st.beats[key]) continue;
      const b = beats[i];
      if (b.when && !b.when(GameState.flags, GameState.stats)) continue;
      st.beats[key] = true;
      await playBeat(scene, id, st, b);
      played = true;
      break;
    }
    if (!played) {
      const pool = (IDLE[id] && (IDLE[id][era] || IDLE[id].any)) || SMALLTALK.generic;
      const n = (st.idleN = (st.idleN || 0) + 1) - 1;
      const line = pool[n % pool.length];
      await scene.ui.dialogue(Array.isArray(line) ? line : (typeof line === 'string' ? [{ who: info.name, text: line, mood: 'neutral' }] : [line]));
    }
    SaveSystem.save();
  } finally {
    if (vill) vill.frozen = false;
    scene.unlockInput();
  }
}

async function playBeat(scene, id, st, b) {
  const lines = typeof b.lines === 'function' ? b.lines(GameState.flags, GameState.stats) : b.lines;
  await scene.ui.dialogue(lines);
  st.bond = Math.min(5, (st.bond || 0) + (b.bond === undefined ? 1 : b.bond));
  if (b.rel) adjustRelationship(b.rel);
  if (b.stat) applyStat(b.stat);
  if (b.flag) Object.assign(GameState.flags, b.flag);
  if (b.choice) {
    const pick = await scene.ui.choice(b.choice.prompt, b.choice.opts.map((o) => o.t));
    const o = b.choice.opts[pick];
    if (o.lines) await scene.ui.dialogue(typeof o.lines === 'function' ? o.lines(GameState.flags) : o.lines);
    if (o.rel) adjustRelationship(o.rel);
    if (o.stat) applyStat(o.stat);
    if (o.flag) Object.assign(GameState.flags, o.flag);
    if (o.bond) st.bond = Math.min(5, (st.bond || 0) + o.bond);
    st.choices = st.choices || {};
    st.choices[b.id || 'c'] = pick;
  }
  castCheckAchievements();
}
function applyStat(s) {
  if (typeof s === 'string') addStat(s);
  else Object.keys(s).forEach((k) => addStat(k, s[k]));
}
function castCheckAchievements() {
  const f = GameState.flags;
  const n = castMetCount();
  if (n >= 5) f.castMet5 = true;
  if (n >= 10) f.castMet10 = true;
  if (n >= Object.keys(CAST).length) f.castMetAll = true;
  if (castBestBond() >= 4) f.castFriend = true;
}

/* =====================================================================
   КАСТ — пятнадцать людей, которые делают этот мир живым
   ===================================================================== */
