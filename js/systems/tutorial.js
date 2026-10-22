const Tutorial = {
  state() { return GameState.tutorial ||= { moved:false, interacted:false, activities:false, dismissed:false }; },
  step() {
    const s = this.state();
    return s.dismissed ? null : !s.moved ? 'moved' : !s.interacted ? 'interacted' : !s.activities ? 'activities' : null;
  },
  complete(key) {
    if (!['moved','interacted','activities','dismissed'].includes(key) || this.state()[key]) return;
    this.state()[key] = true; SaveSystem.save();
  },
  restart() {
    GameState.tutorial = { moved:false, interacted:false, activities:false, dismissed:false };
    this.scene = null; this.origin = null;
    if (GameState.chapter !== 'menu') SaveSystem.save();
  },
  observe(scene, available) {
    const p = scene?.player;
    if (!available || !p || p.scripted || scene.locked) { this.origin = null; return; }
    if (scene !== this.scene || !this.origin) { this.scene = scene; this.origin = { x:p.sprite.x, y:p.sprite.y }; }
    if (p.moving && Math.hypot(p.sprite.x - this.origin.x, p.sprite.y - this.origin.y) >= 6) this.complete('moved');
  },
  copy(touch) {
    return { moved:['1 / 3 · Осмотритесь', touch ? 'Потяните джойстик слева и пройдите несколько шагов.' : 'Пройдите несколько шагов: WASD или стрелки.'],
      interacted:['2 / 3 · Попробуйте действие', touch ? 'Подойдите к предмету или человеку. Когда появится подсказка, удерживайте «Действие».' : 'Подойдите к предмету или человеку. Когда появится подсказка, удерживайте E.'],
      activities:['3 / 3 · Свободное время', touch ? 'Откройте кнопку «Чем заняться?» внизу экрана.' : 'Нажмите J или кнопку «Чем заняться?» внизу экрана.'] }[this.step()];
  },
};
