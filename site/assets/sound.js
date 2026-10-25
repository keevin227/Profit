// Optional sound, off by default (S toggles): a soft heartbeat tone and a short flatline tone.
window.Sound = (() => {
  let ac = null, on = false, wantFlat = false, flatOsc = null, flatGain = null, flatTimer = 0;
  function ensure() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
  }
  function beat(amp) {
    if (!on) return;
    ensure();
    const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = 880;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.07 * Math.min(1.5, amp), t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 0.2);
  }
  function stopFlat() {
    if (!flatOsc) return;
    const t = ac.currentTime, g = flatGain, o = flatOsc;
    g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.linearRampToValueAtTime(0, t + 0.3);
    o.stop(t + 0.35);
    flatOsc = null; flatGain = null;
  }
  function apply() {
    clearTimeout(flatTimer);
    if (on && wantFlat) {
      ensure();
      if (!flatOsc) {
        flatOsc = ac.createOscillator(); flatGain = ac.createGain();
        flatOsc.type = 'sine'; flatOsc.frequency.value = 880; flatGain.gain.value = 0;
        flatOsc.connect(flatGain).connect(ac.destination); flatOsc.start();
        flatGain.gain.linearRampToValueAtTime(0.045, ac.currentTime + 0.25);
      }
      flatTimer = setTimeout(() => { wantFlat = false; stopFlat(); }, 2800);
    } else stopFlat();
  }
  return {
    beat,
    flat(v) { wantFlat = v; apply(); },
    toggle() { on = !on; if (on) ensure(); else stopFlat(); return on; },
    get on() { return on; }
  };
})();
