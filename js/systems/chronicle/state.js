Object.assign(Chronicle, {
state() {
    const c = GameState.chronicle ||= {};
    const defaults = { version: 2, era: 1, day: 1, month: 3, year: 0, minute: 480, elapsedDays: 0,
      money: 3800, debt: 0, pantry: 8, food: 6, energy: 80, stress: 0, actionSerial: 0,
      actions: {}, decisions: {}, events: {}, milestones: {}, extraBonds: {}, reminders: [],
      journal: [], items: {}, repairs: {}, interests: { medicine: 0, science: 0, technology: 0, engineering: 0, music: 0, other: 0 },
      pendingVisits: [], phase: 'утро', spending: {}, paid: {}, trips: 0, quietUntil: -1, memories: {}, menuDiscovered: false };
    for (const [k,v] of Object.entries(defaults)) if (c[k] === undefined) c[k] = v;
    for (const k of ['respect','compatibility','openness','support','romance','conflicts','home'])
      if (GameState.relationship[k] === undefined) GameState.relationship[k] = k === 'conflicts' ? 0 : 2;
    LifeSystem.ensure();
    return c;
  },

era(sc) { return Number(((sc && sc.storyEra) || (sc && ERA_BY_SCENE[sc.scene.key]) || 'e' + this.state().era).slice(1)); },

note(title, text = '') {
    const c = this.state();
    c.journal.push({ title, text, date: this.date(), era: c.era });
    if (c.journal.length > 1200) c.journal.splice(0, c.journal.length - 1200);
  },

date() {
    const c = this.state(), bases = [0,0,2,4,6,8,13,31,48,55];
    return `${c.day}.${String(c.month).padStart(2,'0')}.${2030 + bases[c.era] + c.year} · ${String(Math.floor(c.minute/60)).padStart(2,'0')}:${String(c.minute%60).padStart(2,'0')}`;
  },

sync(sc) {
    const c = this.state(), e = this.era(sc);
    if (c.era !== e) { c.era = e; c.day = 1; c.month = 3; c.year = 0; c.minute = 480; }
    GameState.life.season = Math.floor(((c.month + 9) % 12) / 3);
    GameState.life.phase = c.minute < 720 ? 'утро' : c.minute < 1080 ? 'день' : c.minute < 1320 ? 'вечер' : 'ночь';
    c.phase = GameState.life.phase;
    if(sc.player)sc.player.speed=GameState.ageStage==='old'?44:62;
    GameState.life.day=c.day;
    GameState.life.year=2030+[0,0,2,4,6,8,13,31,48,55][c.era]+c.year;
    if (sc.ui) sc.ui.setLifeStatus(`${this.date()}\n${LifeSystem.seasons[GameState.life.season].name} · J — чем заняться?`);
    if(this.controls)this.controls.querySelector('.life-hint').hidden=!!c.menuDiscovered;
    this.refreshHome(sc);
  },

advance(sc, minutes = 30) {
    const c = this.state(); c.minute += minutes;
    c.energy = Math.max(0, c.energy - Math.ceil(minutes / 30));
    while(c.minute >= 1440) { c.minute -= 1440; this.newDay(sc); }
    this.sync(sc);
  },

newDay(sc) {
    const c = this.state(); c.elapsedDays++; c.day++; c.energy = 85; c.stress = Math.max(0,c.stress - 12);
    if(c.day > 30){ c.day=1; c.month++; if(c.month > 12){c.month=1;c.year++;} }
    GameState.life.day = c.day; GameState.life.year = c.year + 1; GameState.life.completedDays++;
    TamirLife.nextDay();
    if(c.elapsedDays % 7 === 0 && c.debt > 0){ const payment=Math.min(c.debt,250); c.debt-=payment; c.money-=payment; this.note('Платёж по кредиту', payment + ' ₽'); }
    if (sc) TamirLife.schedule(sc);
  },

availablePerson(id) { return this.state().era >= TOWN_PEOPLE[id][0]; },

async run(sc, fn) {
    if(sc._chronicleBusy) return;
    const wasLocked=sc.locked; sc._chronicleBusy=true; sc.lockInput();
    if(sc.interactions) sc.interactions.needRelease=true;
    try { await fn(); if(!sc.sys || sc.sys.isActive())SaveSystem.save(); }
    finally {
      sc._chronicleBusy=false;
      // A cancelled action must not write an old scene's era into the new scene.
      if(!sc.sys || sc.sys.isActive()){if(!wasLocked)sc.unlockInput();this.sync(sc);}
    }
  },

charge(sum, item) {
    const c=this.state(); if(c.money < sum) return false;
    c.money-=sum; c.spending[item]=(c.spending[item]||0)+sum; return true;
  },
});
