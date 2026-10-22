// Keep startup failures visible before Phaser and the remaining scripts load.
window.GameBoot = {
  ready: false,
  failed: false,
  fail(message) {
    this.failed = true;
    const notice = document.getElementById('boot-msg');
    if (notice) {
      notice.textContent = message;
      notice.setAttribute('role', 'alert');
    }
  },
  complete() {
    this.ready = true;
    document.getElementById('boot-msg')?.remove();
  },
};

if (window.location.protocol === 'file:') {
  window.GameBoot.fail('Откройте игру по ссылке сайта или через локальный сервер. Инструкция по запуску находится в README.md рядом с index.html.');
}

window.addEventListener('error', (event) => {
  if (window.GameBoot.ready) return;
  const resource = event.target?.getAttribute?.('src');
  window.GameBoot.fail(resource
    ? 'Не удалось загрузить файл: ' + resource + '. Проверьте, что загружена вся папка игры, и обновите страницу.'
    : 'Не удалось запустить игру. Обновите страницу и проверьте, что все файлы проекта загружены на сайт.');
}, true);
