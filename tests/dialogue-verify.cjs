const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');

const html = require('./support/load-game.cjs').html();
const uiSource = html.slice(html.indexOf('class UIScene extends'), html.indexOf('/* =====================================================================\n   InteractionSystem'));
const gameplaySource = html.slice(html.indexOf('class GameplayScene extends'), html.indexOf('/* =====================================================================\n   Map builder helpers'));
let blips = 0;
const context = { Phaser: { Scene: class {} }, CFG: { WIDTH: 960, HEIGHT: 540 }, GameState: {}, textSpeedMs: () => 22, Audio: { playBlip() {}, playTextBlip() { blips++; } }, console, Promise };
vm.createContext(context);
vm.runInContext(uiSource + '\nglobalThis.UIScene = UIScene;', context);
vm.runInContext(gameplaySource + '\nglobalThis.GameplayScene = GameplayScene;', context);

function node() {
  const n = new EventEmitter();
  n.visible = true;
  n.text = '';
  n.height = 20;
  n.setVisible = v => (n.visible = v, n);
  n.setText = v => (n.text = v, n);
  n.getWrappedText = text => text.split('\n');
  n.setY = v => (n.y = v, n);
  n.setX = v => (n.x = v, n);
  n.setSize = (w, h) => (n.width = w, n.height = h, n);
  n.add = children => (n.children = (n.children || []).concat(children), n);
  n.removeAll = () => (n.children = [], n);
  ['setOrigin', 'setDepth', 'setScrollFactor', 'setStrokeStyle', 'setScale', 'setAlpha', 'setInteractive', 'setWordWrapWidth', 'setTexture', 'setPadding', 'setFillStyle', 'setColor'].forEach(name => n[name] = () => n);
  return n;
}

function setup() {
  const ui = new context.UIScene();
  ui.add = Object.fromEntries(['rectangle', 'image', 'text', 'container'].map(name => [name, (...args) => {
    const n = node();
    if (name === 'text') n.text = args[2];
    return n;
  }]));
  ui.input = new EventEmitter();
  ui.input.keyboard = new EventEmitter();
  ui.time = { now: 0 };
  ui.textures = { exists: () => false };
  ui.closingTweens = [];
  ui.tweens = {
    killTweensOf() {},
    add(config) {
      if (config.onComplete) ui.closingTweens.push(config);
      else if (config.y !== undefined) config.targets.y = config.y;
    },
  };
  ui.buildTouchControls = () => {};
  ui.create();
  return ui;
}
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const closeDialogue = ui => {
  const tween = ui.closingTweens.shift();
  assert.ok(tween, 'dialogue waits for its closing transition');
  tween.targets.y = tween.y;
  tween.onComplete();
};
const enter = (ui, repeat = false) => ui.input.keyboard.emit('keydown-ENTER', { repeat });
const release = ui => ui.input.keyboard.emit('keyup-ENTER', {});
const tick = (ui, ms = 22) => { ui.time.now += ms; ui.update(ui.time.now, ms); };
const finishTyping = ui => {
  for (let n = 0; n < 1000 && !ui._canContinueDialogue(); n++) tick(ui);
  assert.ok(ui._canContinueDialogue(), 'typing completes and enables explicit continuation');
};

(async () => {
  const ui = setup();
  const first = ui.dialogue([{ who: '', text: 'Полная первая строка.' }, { who: '', text: 'Вторая строка.' }]);
  const second = ui.dialogue([{ who: '', text: 'Другой разговор.' }]);
  await flush();
  assert.equal(ui.dlgText.text, '', 'a new line starts empty');
  assert.equal(ui.dlgNextButton.visible, false, 'next is hidden while typing');
  tick(ui);
  assert.equal(ui.dlgText.text, 'П', 'text appears one letter at a time');
  assert.equal(ui._conversationPending, 2, 'concurrent calls are queued synchronously');

  ui.input.keyboard.emit('keydown-E', {});
  ui.input.keyboard.emit('keydown-SPACE', {});
  ui.input.emit('pointerdown', { id: 1 });
  enter(ui, true);
  await flush();
  assert.equal(ui.dlgText.text, 'П', 'E, Space, world clicks and held keys never reveal or skip text');
  release(ui);
  enter(ui);
  assert.equal(ui.dlgText.text, 'П', 'fresh Enter during typing cannot fast-forward');
  ui.dlgNextButton.emit('pointerdown', { id: 1 });
  finishTyping(ui);
  ui.dlgNextButton.emit('pointerup', { id: 1 });
  await flush();
  assert.equal(ui.dlgText.text, 'Полная первая строка.', 'click started during debounce cannot advance later');

  enter(ui, true); await flush();
  assert.equal(ui.dlgText.text, 'Полная первая строка.', 'Enter held through typing cannot advance');
  release(ui); enter(ui);
  await flush();
  assert.equal(ui.dlgText.text, '');
  finishTyping(ui);
  enter(ui, true);
  await flush();
  assert.equal(ui.dlgText.text, 'Вторая строка.', 'held Enter cannot advance the next line');
  release(ui);
  ui.dlgNextButton.emit('pointerdown', { id: 2 });
  ui.dlgNextButton.emit('pointerup', { id: 2 });
  await flush();
  assert.equal(ui.dlgText.text, 'Вторая строка.', 'next conversation waits for previous hide transition');
  closeDialogue(ui);
  await first;
  await flush();
  assert.equal(ui.dlgText.text, '');
  finishTyping(ui);
  assert.equal(ui.dlgText.text, 'Другой разговор.');
  assert.equal(ui.dlgContainer.visible, true, 'old hide transition cannot hide new dialogue');
  enter(ui);
  await flush();
  closeDialogue(ui);
  await second;
  assert.equal(ui.isConversationActive(), false);

  const choice = ui.choice('Выбор', ['Первый', 'Второй']);
  const afterChoice = ui.dialogue([{ text: 'После выбора.' }]);
  await flush();
  assert.equal(ui.choiceContainer.visible, true);
  const option = ui.choiceContainer.children.find(child => child.listenerCount('pointerdown'));
  option.emit('pointerdown');
  assert.equal(await choice, 0);
  await flush();
  assert.equal(ui.dlgText.text, '');
  finishTyping(ui);
  release(ui);
  enter(ui);
  await flush();
  closeDialogue(ui);
  await afterChoice;

  const cancelled = ui.dialogue([{text:'Закрываемый разговор.'}]);
  const queued = ui.dialogue([{text:'Старая очередь.'}]);
  const cancellation = Promise.allSettled([cancelled, queued]);
  await flush();
  tick(ui);
  ui.cancelConversations();
  const cancelledText = ui.dlgText.text;
  tick(ui, 100);
  assert.equal(ui.dlgText.text, cancelledText, 'cancelled typewriter cannot keep writing');
  const outcomes = await cancellation;
  assert.ok(outcomes.every(result => result.status === 'rejected' && result.reason.code === 'DIALOGUE_CANCELLED'));
  assert.equal(ui.isConversationActive(), false, 'recovery clears old modal state');
  const newConversation = ui.dialogue([{text:'Новый разговор после восстановления.'}]);
  await flush();
  assert.equal(ui.dlgText.text, '');
  finishTyping(ui);
  assert.equal(ui.dlgText.text, 'Новый разговор после восстановления.');
  release(ui); enter(ui); await flush(); closeDialogue(ui);
  await newConversation;
  const cancelledChoice = ui.choice('Закрываемый выбор', ['Да','Нет']);
  const choiceCancellation = Promise.allSettled([cancelledChoice]);
  await flush(); ui.cancelConversations();
  assert.equal((await choiceCancellation)[0].status, 'rejected', 'cancel never selects an answer for the player');

  const gameplay = new context.GameplayScene();
  let interactions = 0;
  let stopped = 0;
  gameplay.ui = { isConversationActive: () => true, hidePrompt() {} };
  gameplay.input2 = { pauseJustDown: () => false, interactIsDown: () => true };
  gameplay.player = { sprite: { setVelocity() { stopped++; }, setDepth() {}, y: 0 }, update() { throw new Error('manual movement during dialogue'); } };
  gameplay.cats = [];
  gameplay.interactions = { update() { interactions++; }, holdMs: 250 };
  gameplay.update(0, 16);
  assert.equal(interactions, 0, 'world interactions cannot fire underneath dialogue');
  assert.equal(gameplay.interactions.holdMs, 0);
  assert.equal(gameplay.interactions.needRelease, true, 'E must be released after reading');
  assert.equal(stopped, 1);
  let scriptedUpdates = 0;
  let npcUpdates = 0;
  let storyTicks = 0;
  gameplay.locked = true;
  gameplay.player.scripted = true;
  gameplay.player.update = () => { scriptedUpdates++; };
  gameplay.npc = { update() { npcUpdates++; }, sprite: { y: 0, setDepth() {} } };
  gameplay.tick = () => { storyTicks++; };
  gameplay.update(16, 16);
  assert.equal(scriptedUpdates, 1, 'scripted movement continues while conversations are queued');
  assert.equal(npcUpdates, 1, 'cutscene NPC movement continues while reading');
  assert.equal(storyTicks, 1, 'story triggers and scripted updates are not paused by modal gating');
  assert.ok(blips > 0, 'letters have the original text sound');
  console.log('Dialogue regression checks passed: gradual text and sound, no reveal-all or skipping, fresh continuation, queues, cancellation and scripted cutscenes.');
})().catch(error => { console.error(error); process.exitCode = 1; });
