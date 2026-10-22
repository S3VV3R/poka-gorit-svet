function makeGrid(w, h, fillIdx) {
  const data = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) row.push(fillIdx);
    data.push(row);
  }
  return data;
}

function fillRect(data, x0, y0, x1, y1, idx) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (data[y] && data[y][x] !== undefined) data[y][x] = idx;
    }
  }
}

function buildTilemap(scene, data, tilesetKey, tileW = 16, tileH = 16) {
  const map = scene.make.tilemap({ data, tileWidth: tileW, tileHeight: tileH });
  const tileset = map.addTilesetImage(tilesetKey, tilesetKey);
  const layer = map.createLayer(0, tileset, 0, 0);
  return { map, layer };
}

function addTint(scene, w, h, color, alpha, blend) {
  const r = scene.add.rectangle(0, 0, w, h, color, alpha).setOrigin(0, 0);
  r.setDepth(1000);
  if (blend) r.setBlendMode(blend);
  return r;
}

function addGlow(scene, x, y, scale = 1) {
  const g = scene.add.image(x, y, 'glow').setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.8).setScale(scale);
  scene.tweens.add({ targets: g, alpha: 0.55, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return g;
}

function addRain(scene, worldW, worldH, count = 40) {
  const drops = [];
  for (let i = 0; i < count; i++) {
    const d = scene.add.image(
      Phaser.Math.Between(0, worldW),
      Phaser.Math.Between(-worldH, worldH),
      'raindrop'
    ).setOrigin(0.5, 0).setDepth(950).setAlpha(0.55).setScale(1, 1.6);
    drops.push(d);
    scene.tweens.add({
      targets: d, y: worldH + 20,
      duration: Phaser.Math.Between(700, 1200),
      delay: Phaser.Math.Between(0, 1500),
      repeat: -1,
      onRepeat: () => { d.x = Phaser.Math.Between(0, worldW); d.y = -20; },
    });
  }
  return drops;
}
/* =====================================================================
   BootScene — every texture in the game is embedded as a base64 data
   URI in window.ASSET_DATA (generated offline, no network requests),
   so the whole game is a single portable HTML file.
   ===================================================================== */
