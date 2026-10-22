class PauseScene extends Phaser.Scene {
  constructor() { super('Pause'); }

  init(data) { this.returnKey = data.returnKey; }

  create() {
    const W = CFG.WIDTH, H = CFG.HEIGHT;
    this.add.rectangle(0, 0, W, H, 0x05050a, 0.78).setOrigin(0, 0).setInteractive();
    if (this.scene.isActive('UI')) this.scene.get('UI').hideTouchControls();
    this.add.text(W / 2, 56, 'ПАУЗА', {
      fontFamily: 'Georgia, serif', fontSize: '32px', color: '#f4e9d8', fontStyle: 'bold',
    }).setOrigin(0.5);

    this.buildRelationshipBars(W / 2, 104);

    const makeButton = (y, label, onClick) => {
      const t = this.add.text(W / 2, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '19px', color: '#f1ece2',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#e8c07d'));
      t.on('pointerout', () => t.setColor('#f1ece2'));
      t.on('pointerdown', onClick);
      return t;
    };

    let y = 168;
    makeButton(y, 'Продолжить игру', () => this.resumeGame()); y += 38;
    makeButton(y, 'Журнал диалогов', () => this.scene.get('UI').toggleLog()); y += 38;
    makeButton(y, 'Сохранить', () => { if (SaveSystem.save()) this.scene.get('UI').saveToast('Игра сохранена'); }); y += 46;

    const panel = this.add.container(W / 2, y + 66);
    const panelBg = this.add.rectangle(0, 0, 460, 140, 0x0e0e18, 0.9).setStrokeStyle(2, 0x8a7ba0, 0.6);
    panel.add(panelBg);
    panel.add(buildVolumeRow(this, -80, -42, 'Музыка', () => GameState.settings.music, (v) => Audio.setMusicVolume(v)));
    panel.add(buildVolumeRow(this, -80, -6, 'Звуки', () => GameState.settings.sfx, (v) => Audio.setSfxVolume(v)));
    panel.add(this.add.text(0, 32, 'Диалоги: «Далее» или Enter', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#ffffff' }).setOrigin(0.5));
    y += 66 + 70 + 50;

    makeButton(y, 'Выйти в меню', () => this.toMenu());

    this.input.keyboard.once('keydown-ESC', () => this.resumeGame());
  }

  buildRelationshipBars(cx, cy) {
    const labels = [['trust', 'Доверие'], ['closeness', 'Близость'], ['warmth', 'Теплота']];
    const totalW = 400;
    labels.forEach(([key, label], i) => {
      const y = cy + i * 18;
      const lbl = this.add.text(cx - totalW / 2, y, label, {
        fontFamily: '"Courier New", monospace', fontSize: '12px', color: '#8a8496',
      }).setOrigin(0, 0.5);
      const trackX = cx - totalW / 2 + 90;
      const trackW = totalW - 90;
      this.add.rectangle(trackX, y, trackW, 8, 0x1c1c2a, 0.9).setOrigin(0, 0.5).setStrokeStyle(1, 0x555566, 0.7);
      const val = Math.max(0, Math.min(10, GameState.relationship[key] || 0));
      const fillW = Math.max(2, (val / 10) * trackW);
      this.add.rectangle(trackX, y, fillW, 8, 0xe8c07d, 0.9).setOrigin(0, 0.5);
    });
  }

  resumeGame() {
    this.scene.stop();
    this.scene.resume(this.returnKey);
    if (this.scene.isActive('UI')) this.scene.get('UI').showTouchControls();
  }

  toMenu() {
    if (!SaveSystem.save()) return false;
    this.scene.stop();
    this.scene.stop(this.returnKey);
    Audio.stopAmbience(0.3);
    this.scene.start('MainMenu');
  }
}
/* =====================================================================
   StreetScene — ЭТАП I: ЗНАКОМСТВО
   A quiet evening street. Настя runs into Тамир for the first time.
   ===================================================================== */
