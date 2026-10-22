const CFG = {
  WIDTH: 960,
  HEIGHT: 540,
  ZOOM: 3,
  TILE: 16,
  SAVE_KEY: 'pgs_save_v1',
};

// ---------------------------------------------------------------------
// GameState — the single source of truth for progress & relationship
// flags. Kept intentionally small: a slice of the full "hidden
// parameters" system described in the design doc (trust, closeness,
// shared humor, etc). Persists via SaveSystem to localStorage.
// ---------------------------------------------------------------------
