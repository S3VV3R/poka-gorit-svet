// Keep the fractional frame budget. Phaser 3.90's stock capped loop discards it,
// which can skip every other frame when a 60 Hz callback arrives just below 16.67 ms.
const FramePacing = {
  step(time) {
    this.now = time;
    const raw = Math.max(0, time - this.lastTime);
    this.rawDelta = raw; this.time += raw;
    this.delta += raw;
    this._frameBudget = (this._frameBudget || 0) + raw;
    const interval = this._limitRate;
    if (this._frameBudget + .5 >= interval) {
      // Never queue catch-up renders, or teleport after a long browser stall.
      this._frameBudget = Math.max(-.5, (this._frameBudget - interval) % interval);
      const elapsed = Math.min(this.delta, 100);
      this.delta = 0;
      this.callback(time, elapsed);
      this.framesThisSecond++;
    }
    if (time >= this.nextFpsUpdate) this.updateFPS(time);
    this.lastTime = time; this.frame++;
  },
  install(engine) {
    if (engine.Core?.TimeStep) engine.Core.TimeStep.prototype.stepLimitFPS = this.step;
  },
};
