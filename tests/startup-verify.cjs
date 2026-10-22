const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'js/core/startup-guard.js'), 'utf8');

function setup(protocol = 'https:') {
  const notice = { textContent: 'Загрузка…', setAttribute() {}, remove() { this.removed = true; } };
  const listeners = {};
  const context = {
    window: { location: { protocol }, addEventListener(name, callback) { listeners[name] = callback; } },
    document: { getElementById() { return notice; } },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { context, notice, listeners, boot: context.window.GameBoot };
}

const local = setup('file:');
assert.equal(local.boot.failed, true);
assert.match(local.notice.textContent, /README/);
const missing = setup();
missing.listeners.error({ target: { getAttribute() { return './js/missing.js'; } } });
assert.equal(missing.boot.failed, true);
assert.match(missing.notice.textContent, /missing.js/);
const healthy = setup();
healthy.boot.complete();
assert.equal(healthy.notice.removed, true);
healthy.listeners.error({ message: 'Handled by gameplay recovery, not startup' });
assert.equal(healthy.boot.failed, false);

const assetFailure = setup();
Object.assign(assetFailure.context, { ASSETS: {}, Phaser: { Scene: class {} } });
vm.runInContext(fs.readFileSync(path.join(root, 'js/scenes/boot-scene.js'), 'utf8') + '; globalThis.TestBoot = BootScene;', assetFailure.context);
const scene = new assetFailure.context.TestBoot();
let onLoadError;
scene.load = { spritesheet() {}, image() {}, on(event, callback) { if (event === 'loaderror') onLoadError = callback; } };
scene.buildLoadingBar = () => {};
scene.preload();
onLoadError({ key: 'nastya' });
assert.equal(assetFailure.boot.failed, true);
assert.match(assetFailure.notice.textContent, /nastya/);
scene.create();
console.log('PASS: file URL guidance, missing script notice, missing texture protection and successful startup');
