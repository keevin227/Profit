// Navigation, step reveals, deep links, presenter sync.
(() => {
  const S = window.Stage;
  const frame = document.querySelector('.frame');
  const slides = [...document.querySelectorAll('.slide')];
  const prog = document.querySelector('.progress');
  const pos = document.querySelector('.hud .pos');
  const snd = document.querySelector('.hud .snd');
  const help = document.querySelector('.help');
  const rotate = document.querySelector('.rotate');
  const chan = 'BroadcastChannel' in window ? new BroadcastChannel('vg-profit-deck') : null;
  let i = -1, step = 0;

  const maxStep = k => +(slides[k].dataset.steps || 0);

  function fit() {
    const v = S.view;
    frame.style.transform = `translate(${v.ox}px, ${v.oy}px) scale(${v.s})`;
  }
  S.onResize = fit;
  fit();

  function applySteps(s, st) {
    s.dataset.step = st;
    s.querySelectorAll('[data-from]').forEach(el => el.classList.toggle('on', st >= +el.dataset.from));
    s.querySelectorAll('[data-only]').forEach(el => el.classList.toggle('on', el.dataset.only.split(',').map(Number).includes(st)));
  }

  function go(ni, ns, dir = 0) {
    ni = Math.max(0, Math.min(slides.length - 1, ni));
    ns = Math.max(0, Math.min(maxStep(ni), ns));
    if (ni !== i) {
      if (i >= 0) slides[i].classList.remove('active');
      slides[ni].classList.add('active');
    }
    i = ni; step = ns;
    applySteps(slides[i], step);
    S.show(slides[i].dataset.scene, step, dir);
    const h = '#' + (i + 1) + (step ? '.' + step : '');
    if (location.hash !== h) history.replaceState(null, '', h);
    prog.style.width = (i / (slides.length - 1)) * 100 + '%';
    pos.textContent = String(i + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
    broadcast();
  }
  const next = () => (step < maxStep(i) ? go(i, step + 1, 1) : i < slides.length - 1 && go(i + 1, 0, 1));
  const prev = () => (step > 0 ? go(i, step - 1, -1) : i > 0 && go(i - 1, maxStep(i - 1), -1));

  function parse() {
    const m = location.hash.match(/^#(\d+)(?:\.(\d+))?/);
    return m ? [m[1] - 1, +(m[2] || 0)] : [0, 0];
  }
  window.addEventListener('hashchange', () => {
    const [a, b] = parse();
    if (a !== i || b !== step) go(a, b, 0);
  });

  function toggleSound() {
    const on = Sound.toggle();
    snd.textContent = on ? 'SOUND ON' : '';
  }
  S.M.onBeat = amp => Sound.beat(amp);

  function fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  }

  function broadcast() {
    if (!chan) return;
    const s = slides[i], n = slides[i + 1];
    chan.postMessage({
      type: 'state', i, step, max: maxStep(i), total: slides.length,
      title: s.dataset.title, next: n ? n.dataset.title : 'End',
      notes: (s.querySelector('.notes') || {}).textContent || ''
    });
  }
  if (chan) chan.onmessage = e => {
    const d = e.data || {};
    if (d.type === 'hello') broadcast();
    if (d.type === 'cmd') {
      if (d.cmd === 'next') next();
      else if (d.cmd === 'prev') prev();
      else if (d.cmd === 'goto') go(d.i, d.step || 0, 0);
      else if (d.cmd === 'sound') toggleSound();
    }
  };

  document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (help.classList.contains('show') && (k === 'Escape' || k === '?' || k === 'h')) { help.classList.remove('show'); return; }
    if (S.key(k)) { e.preventDefault(); return; }
    switch (k) {
      case 'ArrowRight': case 'PageDown': case ' ': case 'Enter': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': case 'Backspace': e.preventDefault(); prev(); break;
      case 'Home': go(0, 0, -1); break;
      case 'End': go(slides.length - 1, 0, 1); break;
      case 'f': case 'F': fullscreen(); break;
      case 's': case 'S': toggleSound(); break;
      case 'p': case 'P': window.open('presenter.html', 'vg-presenter', 'width=1100,height=760'); break;
      case '?': case 'h': case 'H': help.classList.toggle('show'); break;
    }
  });

  document.addEventListener('click', e => {
    if (help.classList.contains('show')) { help.classList.remove('show'); return; }
    if (rotate.classList.contains('show')) { rotate.classList.remove('show'); return; }
    (e.clientX < window.innerWidth / 3 ? prev : next)();
  });

  let tx = null, ty = null;
  document.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  document.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { e.preventDefault(); (dx < 0 ? next : prev)(); }
  });

  if (window.innerHeight > window.innerWidth && window.innerWidth < 820) rotate.classList.add('show');

  const [a, b] = parse();
  go(a, b, 0);
  window.Deck = { go, next, prev, get i() { return i; }, get step() { return step; }, count: slides.length, maxStep };
})();
