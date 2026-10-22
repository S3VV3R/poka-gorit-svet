function addStat(k, n = 1) {
  if (!GameState.stats) GameState.stats = DEFAULT_STATE().stats;
  GameState.stats[k] = (GameState.stats[k] || 0) + n;
}

function adjustRelationship(delta) {
  for (const k in delta) {
    if (GameState.relationship[k] !== undefined) {
      GameState.relationship[k] = Math.max(0, Math.min(10, GameState.relationship[k] + delta[k]));
    }
  }
}

function textSpeedMs() {
  return { slow: 38, normal: 22, fast: 10 }[GameState.settings.textSpeed] || 22;
}

/* =====================================================================
   LIVING LIFE LAYER
   The authored chapters remain the backbone of the game.  These systems
   add a small, optional layer of ordinary days, initiatives and memories
   between the large moments, so that the finale belongs to this playthrough.
   ===================================================================== */
