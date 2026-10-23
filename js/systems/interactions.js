class InteractionSystem {
  constructor(scene, ui) {
    this.scene = scene;
    this.ui = ui;
    this.items = [];
    this.active = null;
    this.holdMs = 0;
    this.holdRequired = 380; // ms — the "timer" every interaction requires
  }

  add(x, y, radius, label, onInteract) {
    // Repeat visits to flavour spots show fresh, plot-aware lines instead of the same text.
    const item = { x, y, radius, label, enabled: true, uses: 0 };
    item.onInteract = () => {
      const pool = REPEAT_LINES[label];
      if (item.uses > 0 && pool && pool.length) {
        const entry = pool[(item.uses - 1) % pool.length];
        item.uses++;
        const lines = Array.isArray(entry) ? entry : [{ who: '', text: entry }];
        this.ui.dialogue(lines);
        return;
      }
      item.uses++;
      onInteract();
    };
    this.items.push(item);
    return item;
  }

  remove(item) {
    this.items = this.items.filter((i) => i !== item);
    if (this.active === item) { this.active = null; this.holdMs = 0; }
  }

  update(player, inputIsDown, delta) {
    let best = null, bestDist = Infinity;
    for (const item of this.items) {
      if (!item.enabled) continue;
      if (item.follow) { item.x = item.follow.sprite.x; item.y = item.follow.sprite.y; }
      const d = Phaser.Math.Distance.Between(player.sprite.x, player.sprite.y, item.x, item.y);
      const priority = item.priority || 0, currentPriority = best?.priority || 0;
      if (d <= item.radius && (!best || priority > currentPriority || (priority === currentPriority && d < bestDist))) { best = item; bestDist = d; }
    }
    if (best !== this.active) {
      this.active = best;
      this.holdMs = 0;
      if (best) { this.ui.showPrompt('Удержите E — ' + best.label); this.ui.setPromptProgress(0); }
      else this.ui.hidePrompt();
    }
    if (!best) return;

    if (!inputIsDown) this.needRelease = false;
    if (inputIsDown && !this.needRelease) {
      this.holdMs += delta || 16.7;
      this.ui.setPromptProgress(this.holdMs / this.holdRequired);
      if (this.holdMs >= this.holdRequired) {
        this.holdMs = 0;
        this.needRelease = true; // holding E must not retrigger or skip the dialogue that follows
        this.ui.setPromptProgress(0);
        if (typeof Tutorial !== 'undefined') Tutorial.complete('interacted');
        best.onInteract();
      }
    } else if (this.holdMs > 0) {
      this.holdMs = 0;
      this.ui.setPromptProgress(0);
    }
  }

  clear() { this.items = []; this.active = null; this.holdMs = 0; this.ui.hidePrompt(); }
}
/* =====================================================================
   GameplayScene — shared boilerplate for every playable location.
   Subclasses implement buildWorld() and optionally tick(dt).
   ===================================================================== */
