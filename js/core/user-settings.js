// Preferences do not overwrite story checkpoints when changed in the menu.
const UserSettings = {
  key: 'pgs_preferences_v1',
  sanitize(input = {}) {
    const d = DEFAULT_STATE().settings;
    for (const key of ['music','sfx']) if (Number.isFinite(input[key])) d[key] = Math.max(0, Math.min(1, input[key]));
    if (['slow','normal','fast'].includes(input.textSpeed)) d.textSpeed = input.textSpeed;
    if (['normal','large','largest'].includes(input.textSize)) d.textSize = input.textSize;
    return d;
  },
  restore() {
    let stored;
    try { stored = JSON.parse(localStorage.getItem(this.key)); } catch {}
    GameState.settings = this.sanitize(stored || GameState.settings); this.apply();
  },
  apply() {
    if (typeof Audio !== 'undefined' && Audio.setMusicVolume) {
      Audio.setMusicVolume(GameState.settings.music); Audio.setSfxVolume(GameState.settings.sfx);
    }
    const size = { normal:22, large:26, largest:30 }[GameState.settings.textSize] || 22;
    document.documentElement?.style?.setProperty?.('--dialogue-size', size + 'px');
  },
  save() {
    GameState.settings = this.sanitize(GameState.settings); this.apply();
    try { localStorage.setItem(this.key, JSON.stringify(GameState.settings)); return true; }
    catch { return false; }
  },
};
