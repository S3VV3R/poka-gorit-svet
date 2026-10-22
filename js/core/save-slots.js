Object.assign(SaveSystem, {
  slotKey(slot) {
    if (![1,2,3].includes(slot)) throw new Error('Неизвестный слот.');
    return CFG.SAVE_KEY + '_slot_' + slot;
  },
  writeSlot(slot, state = GameState) {
    try {
      const key = this.slotKey(slot), next = SaveFormat.encode(state), old = this.read(key);
      if (old) localStorage.setItem(CFG.SAVE_KEY + '_backup', old.raw);
      localStorage.setItem(key, next); this.lastError = ''; return true;
    } catch (e) { return this.fail(e); }
  },
  entries() {
    return [{ key:CFG.SAVE_KEY, title:'Автосохранение' },
      ...[1,2,3].map(slot => ({ key:this.slotKey(slot), title:'Слот ' + slot, slot })),
      { key:CFG.SAVE_KEY + '_backup', title:'Перед заменой прогресса' },
      { key:CFG.SAVE_KEY + '_previous', title:'Предыдущее автосохранение' }]
      .map(entry => ({ ...entry, record:this.read(entry.key) }));
  },
});
