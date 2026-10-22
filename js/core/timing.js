function wait(scene, ms) {
  return new Promise((resolve) => scene.time.delayedCall(ms, resolve));
}
/* =====================================================================
   AudioManager — everything here is synthesised at runtime with the
   Web Audio API (no external sound files), so the whole game stays a
   single portable file. Footsteps, UI blips, soft chimes and looping
   ambience beds (wind / night / cosy-home hum) are all generated
   procedurally and mixed through master/music/sfx gain nodes.
   ===================================================================== */
