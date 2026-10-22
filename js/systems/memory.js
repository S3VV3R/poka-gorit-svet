const MemorySystem = {
  life() {
    LifeSystem.ensure();
    return GameState.life;
  },

  remember(id, title, text = '') {
    const life = this.life();
    if (life.memories.some((m) => m.id === id)) return false;
    life.memories.push({ id, title, text, day: life.day, year: life.year, season: life.season });
    addStat('memories');
    return true;
  },

  snapshot(id, title) {
    const life = this.life();
    if (life.photos.some((p) => p.id === id)) return false;
    life.photos.push({ id, title, day: life.day, year: life.year, season: life.season });
    this.remember('photo:' + id, 'Снимок: ' + title);
    return true;
  },

  finaleLines() {
    const life = this.life();
    const chosen = life.memories.slice(-4).map((m) => m.title);
    const photos = life.photos.slice(-2).map((p) => 'Снимок: ' + p.title);
    return chosen.concat(photos).slice(-5);
  },
};
