FramePacing.install(Phaser);
const gameConfig = {
  type: Phaser.AUTO,
  width: CFG.WIDTH,
  height: CFG.HEIGHT,
  parent: 'game-root',
  backgroundColor: '#0a0a12',
  pixelArt: true,
  // Gamepad support is intentionally left off: Phaser's gamepad plugin
  // polls navigator.getGamepads() as soon as it's enabled, and some
  // browsers/embeds block that API entirely via Permissions-Policy —
  // which throws an uncaught SecurityError and can crash the whole
  // game before it ever renders. Not worth it for an optional extra.
  input: { gamepad: false, activePointers: 3 },
  fps: { target: 60, limit: 60, smoothStep: false },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false, fixedStep: false },
  },
  scene: [
    BootScene, MainMenuScene,
    StreetScene, DateScene, TripScene, ApartmentScene,
    ProposalScene, WeddingScene, YoungFamilyScene,
    BabyScene, KidsScene, EmptyNestScene, LateYearsScene, EndingScene, BalconyPreviewScene, CompactHomePreviewScene,
    UIScene,
    PauseScene,
  ],
};

function startGame() {
  if (window.GameBoot?.failed) return;
  const game = new Phaser.Game(gameConfig);
  window.__phaserGame = game;
  GamePerformance.attach(game);
  AdaptiveUI.attach(game);
  const unlock = () => Audio.unlock();
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  // Last-resort safety net: if any cutscene promise rejects, or any
  // uncaught synchronous error fires anywhere (like the gamepad
  // SecurityError this build used to hit), never leave the player
  // stuck on a black/frozen screen — log it and force every gameplay
  // scene back open and playable.
  const recover = (label, reason) => {
    if (reason && reason.code === 'DIALOGUE_CANCELLED') return;
    console.error(label, reason);
    try {
      const ui = game.scene.getScene('UI');
      if (ui) {
        ui.cancelConversations();
        ui.fadeIn(400);
        ui.hidePrompt();
        if (ui.dlgContainer) ui.dlgContainer.setVisible(false);
        if (ui.choiceContainer) ui.choiceContainer.setVisible(false);
        ui.letterboxOff(200);
      }
      ['Street', 'DateScene', 'TripScene', 'Apartment', 'Proposal', 'Wedding', 'YoungFamily', 'Baby', 'Kids', 'EmptyNest', 'LateYears', 'Ending'].forEach((key) => {
        const sc = game.scene.getScene(key);
        if (sc && sc.scene.isActive(key)) {
          sc.unlockInput();
          if (sc.player) { sc.player.scripted = false; sc.player.sprite.setVelocity(0, 0); }
        }
      });
    } catch (err) { console.error('Recovery failed:', err); }
  };
  window.addEventListener('unhandledrejection', (e) => recover('Unhandled rejection — forcing recovery:', e.reason));
  window.addEventListener('error', (e) => recover('Uncaught error — forcing recovery:', e.error || e.message));
}

window.addEventListener('load', () => OrientationGate.startWhenReady(startGame));
