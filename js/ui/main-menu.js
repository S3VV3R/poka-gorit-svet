function buildVolumeRow(scene, x, y, label, getVal, setVal) {
  const container = scene.add.container(x, y);
  const txt = scene.add.text(-150, 0, label, {
    fontFamily: 'Georgia, serif', fontSize: '15px', color: '#e9e4d8',
  }).setOrigin(0, 0.5);
  container.add(txt);
  const blocks = [];
  const total = 10;
  for (let i = 0; i < total; i++) {
    const bx = 10 + i * 16;
    const filled = i < Math.round(getVal() * total);
    const b = scene.add.rectangle(bx, 0, 12, 18, filled ? 0xe8c07d : 0x2a2a3a, 1)
      .setStrokeStyle(1, 0x8a7ba0, 0.6).setInteractive({ useHandCursor: true });
    b.on('pointerdown', () => {
      setVal((i + 1) / total);
      refresh();
      Audio.playBlip(400 + i * 20);
    });
    blocks.push(b);
    container.add(b);
  }
  function refresh() {
    const lvl = Math.round(getVal() * total);
    blocks.forEach((b, i) => b.setFillStyle(i < lvl ? 0xe8c07d : 0x2a2a3a, 1));
  }
  return container;
}

class MainMenuScene extends Phaser.Scene {
  constructor() { super('MainMenu'); }

  create() {
    const W = CFG.WIDTH, H = CFG.HEIGHT;
    Audio.stopAmbience(0.4);
    if (this.scene.isActive('UI')) {
      const ui = this.scene.get('UI');
      ui.resetForScene();
      ui.clearQuest();
      ui.fadeIn(400);
      ui.hidePrompt();
      ui.hideTouchControls();
      if (ui.dlgContainer) ui.dlgContainer.setVisible(false);
      if (ui.choiceContainer) ui.choiceContainer.setVisible(false);
    }

    const bg = this.add.image(W / 2, H / 2, 'title');
    bg.setDisplaySize(W, H);

    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.18);

    this.add.text(W / 2, 78, 'ПОКА ГОРИТ СВЕТ', {
      fontFamily: 'Georgia, serif', fontSize: '44px', color: '#f4e9d8', fontStyle: 'bold',
    }).setOrigin(0.5).setShadow(0, 3, '#000000', 6, false, true);

    this.add.text(W / 2, 120, 'история о доме, который согревает', {
      fontFamily: 'Georgia, serif', fontSize: '16px', fontStyle: 'italic', color: '#c9bfae',
    }).setOrigin(0.5);

    const items = [];
    const makeButton = (y, label, onClick) => {
      const t = this.add.text(W / 2, y, label, {
        fontFamily: 'Georgia, serif', fontSize: '21px', color: '#f1ece2',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#e8c07d'));
      t.on('pointerout', () => t.setColor('#f1ece2'));
      t.on('pointerdown', () => { this.unlockAndPlay(); onClick(); });
      items.push(t);
      return t;
    };

    let y = 248;
    if (SaveSystem.hasSave()) {
      makeButton(y, 'Продолжить', () => this.continueGame()); y += 36;
    }
    makeButton(y, 'Новая игра', () => this.newGame()); y += 36;
    makeButton(y, 'Главы', () => this.showOnly(this.chapterPanel)); y += 36;
    makeButton(y, 'Достижения', () => this.showOnly(this.achPanel)); y += 36;
    makeButton(y, 'Воспоминания', () => this.showOnly(this.galleryPanel)); y += 36;
    makeButton(y, 'Настройки', () => this.showOnly(this.settingsPanel)); y += 36;
    makeButton(y, 'О главе', () => this.showOnly(this.aboutPanel));

    // ---- settings panel ----
    this.settingsPanel = this.add.container(W / 2, H - 110).setVisible(false);
    const panelBg = this.add.rectangle(0, 0, 460, 150, 0x0e0e18, 0.92).setStrokeStyle(2, 0x8a7ba0, 0.6);
    this.settingsPanel.add(panelBg);
    this.settingsPanel.add(buildVolumeRow(this, -80, -46, 'Музыка', () => GameState.settings.music, (v) => { Audio.setMusicVolume(v); UserSettings.save(); }));
    this.settingsPanel.add(buildVolumeRow(this, -80, -10, 'Звуки', () => GameState.settings.sfx, (v) => { Audio.setSfxVolume(v); UserSettings.save(); }));
    this.settingsPanel.add(this.add.text(0, 26, 'Диалоги: «Далее» или Enter', { fontFamily: 'Georgia, serif', fontSize: '13px', color: '#ffffff' }).setOrigin(0.5));
    const closeHint = this.add.text(0, 62, '(нажмите ещё раз «Настройки», чтобы закрыть)', {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: '#6a6478',
    }).setOrigin(0.5);
    this.settingsPanel.add(closeHint);

    // ---- about panel ----
    this.aboutPanel = this.add.container(W / 2, H / 2).setVisible(false);
    const aboutBg = this.add.rectangle(0, 0, 640, 280, 0x0e0e18, 0.92).setStrokeStyle(2, 0x8a7ba0, 0.6);
    const aboutTxt = this.add.text(0, 0,
      'Глава 1: «Три весны» — Знакомство • Начало отношений • Совместная жизнь\n' +
      'Глава 2: «Да, конечно да» — Предложение • Свадьба\n' +
      'Глава 3: «Обычный понедельник» — Молодая семья • Кризис • Беременность\n\n' +
      'Глава 4: «Девять месяцев и Белла» — Первая ночь • Рисунок • Ния\n' +
      'Глава 5: «Дом, полный голосов» — Школа • Подростки • Ссора • Выпускной\n' +
      'Глава 6: «Тихий дом» — Пустые комнаты • Коты • Время\n' +
      'Глава 7: «Пока горит свет» — Память • Балкон • Одна из восьми концовок',
      { fontFamily: 'Georgia, serif', fontSize: '14px', color: '#e9e4d8', align: 'center', lineSpacing: 8 }
    ).setOrigin(0.5);
    this.aboutPanel.add([aboutBg, aboutTxt]);

    // ---- chapter select panel ----
    this.chapterPanel = this.buildChapterPanel();

    // ---- achievements panel ----
    this.achPanel = this.buildListPanel('ДОСТИЖЕНИЯ', ACHIEVEMENTS.map((a) => ({
      unlocked: !!GameState.flags[a.flag], title: a.title, text: a.text,
    })));

    // ---- memory gallery panel ----
    this.galleryPanel = this.buildListPanel('ВОСПОМИНАНИЯ', MEMORY_GALLERY.map((m) => ({
      unlocked: !!GameState.flags[m.flag],
      title: m.title,
      text: m.dynamic ? m.dynamic(GameState.flags) : m.text,
    })));

    this.panels = [this.settingsPanel, this.aboutPanel, this.chapterPanel, this.achPanel, this.galleryPanel];

    this.add.text(W / 2, H - 20, 'WASD / стрелки — движение    E — взаимодействие    Enter / «Далее» — после появления текста    Esc — пауза    L — журнал', {
      fontFamily: 'Georgia, serif', fontSize: '11px', color: '#8a8496',
    }).setOrigin(0.5);
  }

  showOnly(panel) {
    const wasVisible = panel.visible;
    this.panels.forEach((p) => p.setVisible(false));
    panel.setVisible(!wasVisible);
  }

  buildChapterPanel() {
    const W = CFG.WIDTH, H = CFG.HEIGHT;
    const panel = this.add.container(W / 2, H / 2).setVisible(false);
    const bg = this.add.rectangle(0, 0, 520, 400, 0x0e0e18, 0.94).setStrokeStyle(2, 0x8a7ba0, 0.6);
    const title = this.add.text(0, -178, 'ВЫБОР ГЛАВЫ', {
      fontFamily: '"Courier New", monospace', fontSize: '16px', color: '#8a8a8a',
    }).setOrigin(0.5);
    panel.add([bg, title]);

    const chapters = [
      { key: 'street', label: 'Глава 1: Три весны', unlocked: () => true },
      { key: 'proposal', label: 'Глава 2: Да, конечно да', unlocked: () => GameState.flags.chapter1Complete },
      { key: 'youngfamily', label: 'Глава 3: Обычный понедельник', unlocked: () => GameState.flags.chapter2Complete },
      { key: 'baby', label: 'Глава 4: Девять месяцев и Белла', unlocked: () => GameState.flags.chapter3Complete },
      { key: 'kids', label: 'Глава 5: Дом, полный голосов', unlocked: () => GameState.flags.chapter4Complete },
      { key: 'emptynest', label: 'Глава 6: Тихий дом', unlocked: () => GameState.flags.chapter5Complete },
      { key: 'lateyears', label: 'Глава 7: Пока горит свет', unlocked: () => GameState.flags.chapter6Complete },
    ];
    chapters.forEach((c, i) => {
      const yy = -135 + i * 46;
      const unlocked = c.unlocked();
      const row = this.add.rectangle(0, yy, 460, 38, 0x000000, unlocked ? 0.5 : 0.25)
        .setStrokeStyle(1, unlocked ? 0xffffff : 0x555555, unlocked ? 0.8 : 0.4);
      const label = this.add.text(0, yy, unlocked ? c.label : `${c.label}  🔒`, {
        fontFamily: 'Georgia, serif', fontSize: '16px', color: unlocked ? '#f1ece2' : '#6a6478',
      }).setOrigin(0.5);
      if (unlocked) {
        row.setInteractive({ useHandCursor: true });
        row.on('pointerover', () => row.setFillStyle(0xffffff, 0.15));
        row.on('pointerout', () => row.setFillStyle(0x000000, 0.5));
        row.on('pointerdown', () => {
          Audio.unlock();
          Audio.stopMelody();
          GameState.chapter = c.key;
          this.scene.start({ street: 'Street', proposal: 'Proposal', youngfamily: 'YoungFamily',
            baby: 'Baby', kids: 'Kids', emptynest: 'EmptyNest', lateyears: 'LateYears' }[c.key]);
        });
      }
      panel.add([row, label]);
    });
    return panel;
  }

  buildListPanel(titleText, entries) {
    const W = CFG.WIDTH, H = CFG.HEIGHT;
    const panel = this.add.container(W / 2, H / 2).setVisible(false);
    const bg = this.add.rectangle(0, 0, 640, 360, 0x0e0e18, 0.95).setStrokeStyle(2, 0x8a7ba0, 0.6);
    const title = this.add.text(0, -160, titleText, {
      fontFamily: '"Courier New", monospace', fontSize: '16px', color: '#8a8a8a',
    }).setOrigin(0.5);
    panel.add([bg, title]);

    const unlockedCount = entries.filter((e) => e.unlocked).length;
    const counter = this.add.text(0, -134, `Открыто: ${unlockedCount} / ${entries.length}`, {
      fontFamily: 'Georgia, serif', fontSize: '12px', fontStyle: 'italic', color: '#8a8496',
    }).setOrigin(0.5);
    panel.add(counter);

    const fmt = (e) => (e.unlocked ? `★ ${e.title} — ${e.text}` : '🔒 ???');
    if (entries.length > 9) {
      bg.setSize(700, 440); title.setY(-200); counter.setY(-176);
      const half = Math.ceil(entries.length / 2);
      [entries.slice(0, half), entries.slice(half)].forEach((col, ci) => {
        const body = this.add.text(-330 + ci * 340, -150, col.map(fmt).join('\n\n'), {
          fontFamily: 'Georgia, serif', fontSize: '11px', color: '#e9e4d8', wordWrap: { width: 310 }, lineSpacing: 4,
        }).setOrigin(0, 0);
        panel.add(body);
      });
      return panel;
    }
    const lines = entries.map(fmt).join('\n\n');
    const body = this.add.text(-290, -108, lines, {
      fontFamily: 'Georgia, serif', fontSize: '13px', color: '#e9e4d8', wordWrap: { width: 580 }, lineSpacing: 8,
    }).setOrigin(0, 0);
    panel.add(body);
    return panel;
  }

  unlockAndPlay() {
    Audio.unlock();
  }

  update() {
    if (Audio.ready && !Audio.melodyPlaying && !this._menuMelodyStarted) {
      this._menuMelodyStarted = true;
      Audio.startMelody();
    }
  }

  newGame() {
    const begin = () => {
      if (!SaveSystem.reset()) return false;
      if (AdaptiveUI.utility) AdaptiveUI.closeUtility();
      Audio.stopMelody(); this.scene.start('Street'); return true;
    };
    if (SaveSystem.hasSave() || GameState.chapter !== 'menu') {
      if (!AdaptiveUI.utility) return false;
      AdaptiveUI.confirmAction('Начать новую игру?', 'Текущее прохождение будет заменено и останется в резервной копии. Ручные слоты сохранятся.', begin, null, 'Начать заново');
      return false;
    }
    return begin();
  }

  continueGame() {
    if (!SaveSystem.load()) { this.scene.get('UI')?.saveToast('Сохранение недоступно. Проверьте другие слоты в разделе «Сохранения».'); return false; }
    Audio.stopMelody(); this.scene.start(SaveSystem.targetScene()); return true;
  }
}
/* =====================================================================
   PauseScene — launched on top of a gameplay scene via Esc.
   ===================================================================== */
