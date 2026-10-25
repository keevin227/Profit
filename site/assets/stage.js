// The single living world behind every slide: particles, the value monitor and scene drawing.
(() => {
  const W = 1920, H = 1080;
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = Math.min(screen.width, screen.height) < 700;
  const N = reduced ? 700 : small ? 1100 : 2000;

  const view = { dpr: 1, w: 0, h: 0, s: 1, ox: 0, oy: 0, x0: 0, y0: 0, x1: W, y1: H };

  // ---------- math ----------
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const approach = (cur, target, dt, rate) => cur + (target - cur) * (1 - Math.exp(-dt * rate));
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  const R = rng(20261025);

  // ---------- colors and sprites ----------
  const C = {
    gray: [150, 158, 172], gold: [242, 184, 75], goldHi: [255, 217, 138],
    ice: [124, 196, 255], red: [255, 93, 98], white: [238, 240, 244]
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  function sprite(c, ring) {
    const S = 48, cv = document.createElement('canvas');
    cv.width = cv.height = S;
    const g = cv.getContext('2d'), m = S / 2;
    const halo = g.createRadialGradient(m, m, 0, m, m, m);
    halo.addColorStop(0, rgba(c, ring ? 0.0 : 0.55));
    halo.addColorStop(ring ? 0.3 : 0.18, rgba(c, ring ? 0.05 : 0.35));
    halo.addColorStop(0.45, rgba(c, 0.12));
    halo.addColorStop(1, rgba(c, 0));
    g.fillStyle = halo; g.fillRect(0, 0, S, S);
    if (ring) {
      g.strokeStyle = rgba(c, 1); g.lineWidth = 3;
      g.beginPath(); g.arc(m, m, S * 0.15, 0, Math.PI * 2); g.stroke();
    } else {
      g.fillStyle = rgba(mix(c, [255, 255, 255], 0.25), 1);
      g.beginPath(); g.arc(m, m, S * 0.11, 0, Math.PI * 2); g.fill();
    }
    return cv;
  }
  const SPR = {
    gray: sprite(C.gray), ice: sprite(C.ice), red: sprite(C.red), white: sprite(C.white),
    gold: sprite(C.gold), goldRing: sprite(C.goldHi, true), iceRing: sprite(C.ice, true)
  };

  // ---------- particles ----------
  const P = [];
  for (let i = 0; i < N; i++) {
    const p = {
      i, x: 0, y: 0, fx: 0, fy: 0, dx: 0, dy: 0, bl: 1, bd: 0, bt: 1,
      g: 0, gT: 0, gk: 3, h: 0, a: 0, aT: 0, r: 2.2, rT: 2.2, tint: 'gray', owner: null,
      hx: 0, hy: 0, f1: 0.05 + R() * 0.12, f2: 0.05 + R() * 0.12, p1: R() * 6.28, p2: R() * 6.28,
      am: 14 + R() * 40, aa: 0.18 + R() * 0.35, rnd: R(), rnd2: R(), rnd3: R()
    };
    P.push(p);
  }

  function homeAll() {
    const x0 = view.x0 - 40, x1 = view.x1 + 40, y0 = view.y0 - 40, y1 = view.y1 + 40;
    for (const p of P) { p.hx = lerp(x0, x1, p.rnd); p.hy = lerp(y0, y1, p.rnd2); }
  }

  function startBlend(p, dur = 1.0, spread = 0.35) {
    p.fx = p.x; p.fy = p.y; p.bl = 0; p.bd = p.rnd3 * spread; p.bt = dur * (0.8 + p.rnd * 0.5);
  }

  // Ambient drift: activity everywhere, quietly gray.
  let ambientAlpha = 0.5;
  function ambientTarget(p, t) {
    p.dx = p.hx + Math.sin(t * p.f1 + p.p1) * p.am;
    p.dy = p.hy + Math.cos(t * p.f2 + p.p2) * p.am;
  }
  function toAmbient(p) {
    p.owner = null; p.tint = 'gray'; p.gT = 0; p.h = 0; p.rT = 1.6 + p.rnd * 1.2;
    p.aT = p.aa * ambientAlpha;
    startBlend(p, 1.6, 0.6);
  }

  // ---------- the value monitor ----------
  const M = {
    on: false, al: 0, x: 120, y: 880, w: 1680, h: 120, full: false,
    amp: 0, ampT: 0, gold: 0, n: 520, buf: new Float32Array(520), head: 0, acc: 0,
    speed: 520, period: 1.05, phase: 0, spike: 0, lastBeat: false, onBeat: null, label: null
  };
  function gauss(x, mu, s) { const d = (x - mu) / s; return Math.exp(-d * d); }
  function ecg(f) {
    return 0.12 * gauss(f, 0.12, 0.025) - 0.12 * gauss(f, 0.215, 0.008) + 1.0 * gauss(f, 0.24, 0.011)
      - 0.28 * gauss(f, 0.265, 0.01) + 0.28 * gauss(f, 0.45, 0.045);
  }
  M.set = o => { Object.assign(M, o); if (o.amp !== undefined) M.ampT = o.amp; };
  M.kick = (v = 1.4) => { M.spike = v; M.phase = 0.05; };
  M.reset = () => { M.buf.fill(0); M.head = 0; M.acc = 0; };
  function monitorUpdate(dt) {
    M.al = approach(M.al, M.on ? 1 : 0, dt, 4);
    M.ampT = M.ampT === undefined ? 0 : M.ampT;
    M.amp = approach(M.amp, M.ampT, dt, 3);
    M.gold = approach(M.gold, M.ampT > 0.03 || M.spike > 0.05 ? 1 : 0, dt, 4);
    if (M.full) { M.x = view.x0; M.w = view.x1 - view.x0; }
    const perSample = (M.w / M.speed) / M.n;
    M.acc += dt / perSample;
    let steps = Math.min(M.n, Math.floor(M.acc));
    M.acc -= steps;
    while (steps-- > 0) {
      const prev = M.phase;
      M.phase += perSample / M.period;
      if (M.phase >= 1) { M.phase -= 1; M.spike *= 0.35; }
      const amp = M.amp + M.spike;
      if (prev < 0.24 && M.phase >= 0.24 && amp > 0.05 && M.onBeat) M.onBeat(amp);
      M.head = (M.head + 1) % M.n;
      M.buf[M.head] = ecg(M.phase) * amp;
    }
  }
  function monitorDraw() {
    if (M.al < 0.01) return;
    const { x, y, w, h, n, buf, head } = M;
    const mid = y + h * 0.62, sx = w / (n - 1), k = h * 0.55;
    const col = mix(C.gray, C.gold, M.gold);
    ctx.save();
    ctx.globalAlpha = M.al * 0.25;
    ctx.strokeStyle = rgba(C.gray, 0.5); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, mid); ctx.lineTo(x + w, mid); ctx.stroke();
    const gap = 22, chunk = 26;
    for (let pass = 0; pass < 2; pass++) {
      ctx.lineWidth = pass ? 2.4 : 9;
      for (let c0 = 0; c0 < n - gap; c0 += chunk) {
        const age = c0 / (n - gap);
        ctx.globalAlpha = M.al * (pass ? 1 : 0.16) * (0.22 + 0.78 * (1 - age));
        ctx.strokeStyle = rgba(col, 1);
        ctx.beginPath();
        let started = false;
        for (let j = c0; j <= Math.min(c0 + chunk, n - gap); j++) {
          const idx = (head - j + n) % n;
          const px = x + idx * sx, py = mid - buf[idx] * k;
          if (!started) { ctx.moveTo(px, py); started = true; }
          else {
            const prevIdx = (head - j + 1 + n) % n;
            if (prevIdx < idx) { ctx.moveTo(px, py); } else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      }
    }
    const hx = x + head * sx, hy = mid - buf[head] * k;
    ctx.globalAlpha = M.al;
    const s = 46 + M.gold * 20;
    ctx.drawImage(M.gold > 0.5 ? SPR.gold : SPR.white, hx - s / 2, hy - s / 2, s, s);
    ctx.restore();
  }

  // ---------- scenes ----------
  const Stage = {
    W, H, view, P, M, C, SPR, ctx, rgba, mix, clamp, lerp, ease, easeOut, approach, rng, reduced,
    scenes: {}, cur: null, prev: null, curA: 1, prevA: 0, t: 0, sceneT: 0, stepT: 0, step: 0,
    set ambientAlpha(v) { ambientAlpha = v; for (const p of P) if (!p.owner) p.aT = p.aa * v; },
    get ambientAlpha() { return ambientAlpha; },
    claim(n, owner, blend = 1.0, spread = 0.35) {
      const out = [];
      for (const p of P) {
        if (out.length >= n) break;
        if (p.owner) continue;
        p.owner = owner; p.tint = 'gray'; p.h = 0; p.gk = 3;
        startBlend(p, blend, spread);
        out.push(p);
      }
      return out;
    },
    release(list) { for (const p of list) toAmbient(p); },
    reblend: startBlend,
    show(name, step, dir) {
      const sc = Stage.scenes[name];
      if (!sc) return;
      if (sc !== Stage.cur) {
        if (Stage.cur && Stage.cur.exit) Stage.cur.exit();
        Stage.prev = Stage.cur; Stage.prevA = Stage.curA; Stage.curA = 0;
        Stage.cur = sc; Stage.sceneT = 0;
        for (const p of P) toAmbient(p);
        M.on = false; M.ampT = 0; M.full = false;
        Stage.ambientAlpha = 0.5;
        if (window.Sound) Sound.flat(false);
        sc.enter(step, dir);
      }
      Stage.step = step; Stage.stepT = 0;
      if (sc.setStep) sc.setStep(step, dir);
    },
    key(k) { return Stage.cur && Stage.cur.key ? Stage.cur.key(k) : false; },
    text(str, x, y, o = {}) {
      ctx.font = o.font || '600 14px Inter, sans-serif';
      ctx.fillStyle = o.color || 'rgba(185,192,204,0.9)';
      ctx.textAlign = o.align || 'left';
      ctx.textBaseline = o.base || 'alphabetic';
      if (o.ls && 'letterSpacing' in ctx) ctx.letterSpacing = o.ls;
      ctx.fillText(str, x, y);
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    }
  };

  function resize() {
    view.dpr = Math.min(2, window.devicePixelRatio || 1);
    view.w = window.innerWidth; view.h = window.innerHeight;
    canvas.width = Math.round(view.w * view.dpr);
    canvas.height = Math.round(view.h * view.dpr);
    view.s = Math.min(view.w / W, view.h / H);
    view.ox = (view.w - W * view.s) / 2; view.oy = (view.h - H * view.s) / 2;
    view.x0 = -view.ox / view.s; view.y0 = -view.oy / view.s;
    view.x1 = view.x0 + view.w / view.s; view.y1 = view.y0 + view.h / view.s;
    homeAll();
    if (Stage.onResize) Stage.onResize(view);
  }
  window.addEventListener('resize', resize);
  resize();
  for (const p of P) { ambientTarget(p, 0); p.x = p.dx; p.y = p.dy; p.a = 0; p.aT = p.aa * ambientAlpha; p.rT = p.r = 1.6 + p.rnd * 1.2; }

  function drawParticles() {
    for (const p of P) {
      const a = p.a;
      if (a < 0.01) continue;
      const s = p.r * 6;
      const base = SPR[p.tint] || SPR.gray;
      if (p.g < 0.985) { ctx.globalAlpha = a * (1 - p.g); ctx.drawImage(base, p.x - s / 2, p.y - s / 2, s, s); }
      if (p.g > 0.015) {
        ctx.globalAlpha = a * p.g;
        const sp = p.h > 0.5 ? (p.tint === 'ice' ? SPR.iceRing : SPR.goldRing) : SPR.gold;
        const ss = p.h > 0.5 ? s * 1.15 : s;
        ctx.drawImage(sp, p.x - ss / 2, p.y - ss / 2, ss, ss);
      }
    }
    ctx.globalAlpha = 1;
  }

  const VIGNETTE = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, W * 0.75);
  VIGNETTE.addColorStop(0, 'rgba(242,184,75,0.035)'); VIGNETTE.addColorStop(1, 'rgba(0,0,0,0)');

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.05) dt = 0.05;
    Stage.t += dt; Stage.sceneT += dt; Stage.stepT += dt;
    const t = Stage.t;
    Stage.curA = approach(Stage.curA, 1, dt, 3);
    Stage.prevA = approach(Stage.prevA, 0, dt, 5);

    if (Stage.cur && Stage.cur.update) Stage.cur.update(dt, t);
    for (const p of P) {
      if (!p.owner) ambientTarget(p, t);
      if (p.bl < 1) {
        if (p.bd > 0) p.bd -= dt;
        else p.bl = Math.min(1, p.bl + dt / p.bt);
        const e = ease(p.bl);
        p.x = p.fx + (p.dx - p.fx) * e; p.y = p.fy + (p.dy - p.fy) * e;
      } else { p.x = p.dx; p.y = p.dy; }
      p.g = approach(p.g, p.gT, dt, p.gk);
      p.a = approach(p.a, p.aT, dt, 3);
      p.r = approach(p.r, p.rT, dt, 3);
    }
    monitorUpdate(dt);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const k = view.dpr * view.s;
    ctx.setTransform(k, 0, 0, k, view.dpr * view.ox, view.dpr * view.oy);
    // soft vignette glow
    ctx.fillStyle = VIGNETTE; ctx.fillRect(view.x0, view.y0, view.x1 - view.x0, view.y1 - view.y0);

    const sc = Stage.cur, pv = Stage.prev;
    if (pv && Stage.prevA > 0.01 && pv.drawUnder) { ctx.save(); ctx.globalAlpha = Stage.prevA; pv.drawUnder(ctx, Stage.prevA, t); ctx.restore(); }
    if (sc && sc.drawUnder) { ctx.save(); ctx.globalAlpha = Stage.curA; sc.drawUnder(ctx, Stage.curA, t); ctx.restore(); }
    drawParticles();
    if (pv && Stage.prevA > 0.01 && pv.drawOver) { ctx.save(); ctx.globalAlpha = Stage.prevA; pv.drawOver(ctx, Stage.prevA, t); ctx.restore(); }
    if (sc && sc.drawOver) { ctx.save(); ctx.globalAlpha = Stage.curA; sc.drawOver(ctx, Stage.curA, t); ctx.restore(); }
    monitorDraw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  window.Stage = Stage;
})();
