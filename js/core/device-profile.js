// Capability hints, not a benchmark or a device fingerprint. Nothing is sent out.
const DeviceProfile = {
  read(env = window) {
    const nav = env.navigator || {}, screen = env.screen || {};
    const matches = query => !!env.matchMedia?.(query).matches;
    const width = env.innerWidth || 960, height = env.innerHeight || 540;
    const shortSide = Math.min(screen.width || width, screen.height || height);
    const touch = (nav.maxTouchPoints || 0) > 0 || matches('(any-pointer: coarse)');
    const ua = nav.userAgent || '';
    const tablet = /iPad|Tablet/i.test(ua) || (/Macintosh/i.test(ua) && (nav.maxTouchPoints || 0) > 1);
    const mobile = nav.userAgentData?.mobile || /Android|iPhone|iPod|Mobile/i.test(ua);
    const handheld = tablet || mobile || (touch && matches('(pointer: coarse)') && !/Windows|CrOS/i.test(ua));
    const type = !handheld ? 'desktop' : tablet || shortSide >= 600 ? 'tablet' : 'phone';
    const number = value => Number.isFinite(value) && value > 0 ? value : null;
    const cores = number(nav.hardwareConcurrency), memory = number(nav.deviceMemory);
    return { type, touch, width, height, cores, memory,
      label: { desktop: 'Компьютер', tablet: 'Планшет', phone: 'Телефон' }[type],
      portraitBlocked: handheld && height > width,
      reducedMotion: matches('(prefers-reduced-motion: reduce)'),
      // Hints only reduce decorative effects initially; they never force 30 FPS.
      modest: (cores !== null && cores <= 2) || (memory !== null && memory <= 2),
    };
  },
  refresh() {
    this.current = this.read();
    const data = document.documentElement.dataset;
    if (data) {
      data.device = this.current.type;
      data.orientationBlocked = String(this.current.portraitBlocked);
    }
    return this.current;
  },
};
