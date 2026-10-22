class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.ambience = null; // { source, gain, kind }
    this.ready = false;
  }

  unlock() {
    if (this.ready) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = GameState.settings.music;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = GameState.settings.sfx;
    this.sfxGain.connect(this.master);

    this.ready = true;
  }

  setMusicVolume(v) {
    GameState.settings.music = v;
    if (this.musicGain) this.musicGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setSfxVolume(v) {
    GameState.settings.sfx = v;
    if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  // ---- one-shot SFX -----------------------------------------------
  _noiseBuffer(duration) {
    const ctx = this.ctx;
    const n = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  playFootstep() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this._noiseBuffer(0.06);
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = 220 + Math.random() * 60;
    filt.Q.value = 0.9;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.22, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    src.connect(filt); filt.connect(g); g.connect(this.sfxGain);
    src.start();
    src.stop(ctx.currentTime + 0.1);
  }

  playBlip(freq = 520) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.connect(g); g.connect(this.sfxGain);
    o.start();
    o.stop(ctx.currentTime + 0.13);
  }

  playTextBlip(ch) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const code = ch ? ch.charCodeAt(0) : 65;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 260 + (code % 20) * 12;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);
    o.connect(g); g.connect(this.sfxGain);
    o.start();
    o.stop(ctx.currentTime + 0.05);
  }

  playChime() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.12;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.15, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t0); o.stop(t0 + 1);
    });
  }

  playPurr() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = 40;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 22;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 6;
    lfo.connect(lfoGain); lfoGain.connect(o.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.3);
    g.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 1.6);
    o.connect(g); g.connect(this.sfxGain);
    o.start(); lfo.start();
    o.stop(ctx.currentTime + 1.7); lfo.stop(ctx.currentTime + 1.7);
  }

  playDoor() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(180, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.16, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    o.connect(g); g.connect(this.sfxGain);
    o.start(); o.stop(ctx.currentTime + 0.32);
  }

  playQuestBlip() {
    if (!this.ready) return;
    const ctx = this.ctx;
    [660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = f;
      const g = ctx.createGain();
      const t0 = ctx.currentTime + i * 0.07;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.12, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      o.connect(g); g.connect(this.sfxGain);
      o.start(t0); o.stop(t0 + 0.22);
    });
  }

  playSaveChime() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = 740;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.connect(g); g.connect(this.sfxGain);
    o.start(); o.stop(ctx.currentTime + 0.5);
  }

  // ---- gentle recurring music-box motif, used at emotional beats ----
  startMelody() {
    if (!this.ready || this.melodyPlaying) return;
    this.melodyPlaying = true;
    const isFinale = window.__phaserGame?.scene?.isActive('Ending');
    const old = GameState.ageStage === 'old' && !isFinale;
    const family = !old && ['baby','kids','emptynest'].includes(GameState.chapter);
    const tempo = old ? 1280 : family ? 980 : 880;
    const notes = [523.25, 659.25, 587.33, 783.99, 659.25, 523.25, 587.33, 440.0];
    let i = 0;
    const playNote = () => {
      if (!this.melodyPlaying) return;
      const ctx = this.ctx;
      const o = ctx.createOscillator();
      o.type = old ? 'sine' : 'triangle';
      o.frequency.value = notes[i % notes.length] * (i % notes.length === 0 ? 1 : 1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
      o.connect(g); g.connect(this.musicGain);
      o.start(); o.stop(ctx.currentTime + 1.2);
      i++;
      if (family) {
        const harmony = ctx.createOscillator(), hg = ctx.createGain();
        harmony.type = 'sine'; harmony.frequency.value = notes[(i + 2) % notes.length] / 2;
        hg.gain.setValueAtTime(0.0001, ctx.currentTime);
        hg.gain.linearRampToValueAtTime(0.018, ctx.currentTime + 0.12);
        hg.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.3);
        harmony.connect(hg); hg.connect(this.musicGain); harmony.start(); harmony.stop(ctx.currentTime + 1.4);
      }
      this._melodyTimeout = setTimeout(playNote, tempo);
    };
    playNote();
  }

  stopMelody() {
    this.melodyPlaying = false;
    clearTimeout(this._melodyTimeout);
  }

  // ---- looping ambience beds ----------------------------------------
  startAmbience(kind) {
    if (!this.ready) return;
    if (this.ambience && this.ambience.kind === kind) return;
    this.stopAmbience(0.6);
    const ctx = this.ctx;
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(this.musicGain);

    let stopFns = [];

    if (kind === 'dusk') {
      // soft wind: filtered looping noise + slow LFO on filter freq
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuffer(4);
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 500;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;
      lfo.connect(lfoGain); lfoGain.connect(filt.frequency);
      src.connect(filt); filt.connect(g);
      src.start(); lfo.start();
      stopFns = [() => src.stop(), () => lfo.stop()];
    } else if (kind === 'night') {
      const src = ctx.createBufferSource();
      src.buffer = this._noiseBuffer(4);
      src.loop = true;
      const filt = ctx.createBiquadFilter();
      filt.type = 'lowpass';
      filt.frequency.value = 300;
      src.connect(filt); filt.connect(g);
      src.start();
      stopFns = [() => src.stop()];
      // occasional soft cricket-ish blips scheduled via interval
      const cricket = () => {
        if (!this.ambience || this.ambience.kind !== 'night') return;
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = 3200 + Math.random() * 400;
        const cg = ctx.createGain();
        cg.gain.setValueAtTime(0.0001, ctx.currentTime);
        cg.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.02);
        cg.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
        o.connect(cg); cg.connect(this.musicGain);
        o.start(); o.stop(ctx.currentTime + 0.2);
        this._cricketTimeout = setTimeout(cricket, 900 + Math.random() * 1400);
      };
      cricket();
    } else if (kind === 'home') {
      const o1 = ctx.createOscillator();
      o1.type = 'sine'; o1.frequency.value = 110;
      const o2 = ctx.createOscillator();
      o2.type = 'sine'; o2.frequency.value = 165;
      o1.connect(g); o2.connect(g);
      o1.start(); o2.start();
      stopFns = [() => o1.stop(), () => o2.stop()];
    }

    g.gain.linearRampToValueAtTime(kind === 'home' ? 0.05 : 0.12, ctx.currentTime + 1.2);
    this.ambience = { gain: g, kind, stopFns };
  }

  stopAmbience(fade = 0.6) {
    clearTimeout(this._cricketTimeout);
    if (!this.ambience) return;
    const { gain, stopFns } = this.ambience;
    const ctx = this.ctx;
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fade);
    setTimeout(() => stopFns.forEach((f) => { try { f(); } catch (e) {} }), fade * 1000 + 100);
    this.ambience = null;
  }
}

const Audio = new AudioManager();

// Shared by UIScene's virtual joystick and every gameplay scene's
// createInput() below — continuous axis state only (discrete taps for
// interact/pause are read+cleared directly from the UI scene instance).
