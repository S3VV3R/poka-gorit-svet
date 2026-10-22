const TouchInput = { dx: 0, dy: 0 };

/* =====================================================================
   InputManager — thin wrapper around Phaser keyboard input, shared
   shape used by every gameplay scene. Supports multiple physical keys
   mapped to one logical action (WASD + arrows, E/Space/Enter, etc),
   merged with the on-screen touch joystick / buttons when present.
   ===================================================================== */

function createInput(scene) {
  const kb = scene.input.keyboard;
  const KC = Phaser.Input.Keyboard.KeyCodes;

  const bind = (...codes) => codes.map((c) => kb.addKey(c));

  const map = {
    up: bind(KC.W, KC.UP),
    down: bind(KC.S, KC.DOWN),
    left: bind(KC.A, KC.LEFT),
    right: bind(KC.D, KC.RIGHT),
    interact: bind(KC.E, KC.SPACE, KC.ENTER),
    pause: bind(KC.ESC),
  };

  const isDown = (name) => map[name].some((k) => k.isDown);
  const justDown = (name) =>
    map[name].some((k) => Phaser.Input.Keyboard.JustDown(k));

  const ui = () => (scene.scene.isActive('UI') ? scene.scene.get('UI') : null);
  // Gamepad plugin is disabled in game config (see gameConfig comment),
  // so scene.input.gamepad should simply be undefined here — but this
  // stays defensive (try/catch) in case that ever changes, since a
  // thrown SecurityError from navigator.getGamepads() must never be
  // allowed to break input handling for keyboard/touch users.
  const pad = () => {
    try {
      return scene.input.gamepad && scene.input.gamepad.total > 0 ? scene.input.gamepad.getPad(0) : null;
    } catch (e) {
      return null;
    }
  };
  let padInteractPrev = false, padPausePrev = false;

  return {
    vector() {
      let x = 0, y = 0;
      if (isDown('left')) x -= 1;
      if (isDown('right')) x += 1;
      if (isDown('up')) y -= 1;
      if (isDown('down')) y += 1;
      if (x === 0 && y === 0 && (TouchInput.dx || TouchInput.dy)) {
        x = TouchInput.dx; y = TouchInput.dy;
      }
      if (x === 0 && y === 0) {
        const p = pad();
        if (p) {
          const ax = p.axes.length > 0 ? p.axes[0].getValue() : 0;
          const ay = p.axes.length > 1 ? p.axes[1].getValue() : 0;
          if (Math.abs(ax) > 0.25 || Math.abs(ay) > 0.25) { x = ax; y = ay; }
          else if (p.left) x = -1; else if (p.right) x = 1;
          if (p.up) y = -1; else if (p.down) y = 1;
        }
      }
      return { x, y };
    },
    interactJustDown() {
      if (justDown('interact')) return true;
      const u = ui();
      if (u && u._touchInteract) { u._touchInteract = false; return true; }
      const p = pad();
      if (p) {
        const down = p.A || (p.buttons[0] && p.buttons[0].pressed);
        const edge = down && !padInteractPrev;
        padInteractPrev = !!down;
        if (edge) return true;
      }
      return false;
    },
    interactIsDown() {
      if (isDown('interact')) return true;
      const u = ui();
      if (u && u._touchInteractHeld) return true;
      const p = pad();
      if (p && (p.A || (p.buttons[0] && p.buttons[0].pressed))) return true;
      return false;
    },
    pauseJustDown() {
      if (justDown('pause')) return true;
      const u = ui();
      if (u && u._touchPause) { u._touchPause = false; return true; }
      const p = pad();
      if (p) {
        const down = p.buttons[9] && p.buttons[9].pressed; // Start/Options
        const edge = down && !padPausePrev;
        padPausePrev = !!down;
        if (edge) return true;
      }
      return false;
    },
  };
}
/* =====================================================================
   Entities — Player (Настя), NPC (Тамир / generic), Cat (Марс / Абилка)
   All share the same 4-direction animation convention:
     row 0 = down, row 1 = up, row 2 = left  (right = flipX of left)
   ===================================================================== */
