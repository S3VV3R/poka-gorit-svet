// Phone portrait is a blocking start screen, not an alternative gameplay layout.
const OrientationGate = {
  blocked() { return DeviceProfile.current?.portraitBlocked || false; },
  startWhenReady(start) {
    const gate = document.getElementById('orientation-gate');
    let started = false;
    const paused = new Set();
    const update = () => {
      const device = DeviceProfile.refresh();
      const label = document.getElementById('orientation-device');
      if (label) label.textContent = 'Устройство: ' + device.label.toLowerCase();
      const blocked = this.blocked();
      gate.hidden = !blocked;
      document.body.classList.toggle('orientation-blocked', blocked);
      if (typeof AdaptiveUI !== 'undefined') AdaptiveUI.releaseControls();
      const game = window.__phaserGame;
      if (blocked && game) {
        for (const scene of game.scene.getScenes(true)) {
          const key = scene.scene.key;
          paused.add(key); game.scene.pause(key);
        }
        if (Audio.ctx?.state === 'running') Audio.ctx.suspend().catch(() => {});
      } else if (!blocked) {
        if (!started) {
          started = true; start();
          // Also catch a scene that finishes loading after the phone was rotated.
          window.__phaserGame?.events?.on('poststep', () => {
            if (this.blocked() && window.__phaserGame.scene.getScenes(true).length) update();
          });
        }
        else if (game) {
          for (const key of paused) if (game.scene.isPaused(key)) game.scene.resume(key);
          paused.clear();
          if (Audio.ready && Audio.ctx?.state === 'suspended') Audio.ctx.resume().catch(() => {});
        }
      }
    };
    window.addEventListener('resize', update);
    window.matchMedia('(orientation: portrait)').addEventListener('change', update);
    window.matchMedia('(pointer: coarse)').addEventListener('change', update);
    update();
  },
};
