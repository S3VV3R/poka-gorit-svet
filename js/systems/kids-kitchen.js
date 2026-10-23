// One active story task shared by the sink, table and activity menu.
const KidsKitchen = {
  steps: {
    dishes: { title:'Помыть посуду', method:'quarrelBella' },
    tidy: { title:'Закончить уборку на кухне', method:'quarrelParents' },
    together: { title:'Помыть кухню вместе', method:'washKitchen' },
  },
  clear(sc) {
    for (const item of sc.kitchenTask?.items || []) sc.interactions.remove(item);
    sc.kitchenTask = null;
  },
  set(sc, stage) {
    const step = this.steps[stage];
    if (!step) return;
    this.clear(sc);
    // Finished story hotspots must not win the nearest-interaction selection.
    for (const item of [...sc.interactions.items]) {
      if (['накрыть ужин','помыть посуду','вернуться к посуде','вместе помыть кухню'].includes(item.label)) sc.interactions.remove(item);
    }
    const task = sc.kitchenTask = { stage, ...step, running:false, items:[] };
    const start = () => {
      if (sc.locked || sc.ui.isConversationActive() || sc._chronicleBusy) return;
      sc.safeRun(() => this.run(sc));
    };
    for (const [x,y] of [[296.82,49.43],[309.76,127.43]]) {
      const item = sc.interactions.add(x,y,36,step.title.toLowerCase() + ' · сюжет',start);
      item.priority = 10; task.items.push(item);
    }
    GameState.flags.kidsKitchenStage = stage;
    sc.ui.setQuest(step.title + '\nУ раковины или стола · либо «Чем заняться?» → «Мыть посуду»');
    SaveSystem.save();
  },
  matches(sc, id) {
    return sc.scene.key === 'Kids' && !!sc.kitchenTask && [1,2,3,4,6].includes(id);
  },
  async run(sc) {
    const task = sc.kitchenTask;
    if (!task || task.running || !sc.scene.isActive()) return false;
    task.running = true;
    task.items.forEach(item => { item.enabled = false; });
    sc.lockInput();
    try {
      await sc[task.method]();
      return true;
    } catch (error) {
      // Do not strand a failed/cancelled action behind an already-set done flag.
      if (error?.code !== 'DIALOGUE_CANCELLED' && sc.scene.isActive() && sc.kitchenTask === task) {
        task.running = false; task.items.forEach(item => { item.enabled = true; });
        sc.unlockInput();
      }
      throw error;
    }
  },
  restore(sc) {
    const f = GameState.flags;
    if (f.graduationDone) return false;
    // Flags also recover the affected checkpoint from v1.1.3 saves.
    const stage = f.kitchenWashed ? 'graduation' : f.quarrelParents ? 'together' : f.quarrelBella ? 'tidy' :
      f.kidsKitchenStage === 'dishes' ? 'dishes' : null;
    if (!stage) return false;
    sc.setStage('mid'); sc.kidWander = null;
    sc.kids.forEach(k => k.destroy()); sc.kids = [];
    sc.bella = sc.spawnKid('bella_teen',167.41,165.14,'down');
    sc.nia = sc.spawnKid('nia_kid',232.12,165.14,'left'); sc.nia.sprite.setScale(1.15);
    sc.player.setPosition(296.82,148); sc.tamir.setPosition(322.71,103.43);
    // Older saves did not store this choice; never invent a reconciliation bonus.
    sc.reconcile = f.kidsKitchenReconcile === true;
    if (stage === 'graduation') { sc.lockInput(); sc.safeRun(() => sc.graduation()); }
    else { this.set(sc,stage); sc.ui.fadeIn(600); sc.unlockInput(); }
    return true;
  },
};
