// One scene per slide. Every scene follows the visual grammar:
// gray = activity, hollow gold = modeled value, solid gold = proven value, ice = the instruments.
(() => {
  const S = window.Stage, M = S.M, D = window.VG_DATA;
  const { clamp, lerp, ease, easeOut, approach } = S;
  const $ = sel => document.querySelector(sel);
  const $$ = sel => [...document.querySelectorAll(sel)];
  const rand = Math.random;
  const TAU = Math.PI * 2;
  const fmt = v => '$' + Math.round(v).toLocaleString('en-US');
  const scene = (name, def) => (S.scenes[name] = def);

  const MUTE = 'rgba(125,134,150,1)';
  const GOLD = 'rgba(242,184,75,1)';
  const ICE = 'rgba(124,196,255,1)';
  const LBL = '600 13px Inter, sans-serif';

  function countUp(el, to, dur = 1.2) {
    if (!el) return;
    const t0 = performance.now();
    const tick = now => {
      const k = clamp((now - t0) / (dur * 1000));
      el.textContent = fmt(to * easeOut(k));
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  function drift(p, t, amp = 1) {
    p.dx = p.hx + Math.sin(t * p.f1 + p.p1) * p.am * amp;
    p.dy = p.hy + Math.cos(t * p.f2 + p.p2) * p.am * amp;
  }
  // Ambient particles near the monitor's write head flash gold as the pulse passes.
  function lightNearHead(cy, band) {
    const hx = M.x + M.head * (M.w / (M.n - 1));
    for (const p of S.P) {
      if (p.owner) continue;
      if (M.gold > 0.5 && Math.abs(p.x - hx) < 46 && Math.abs(p.y - cy) < band) { p.gT = 1; p.gk = 16; p.h = 0; }
      else if (p.gT > 0) { p.gT = 0; p.gk = 0.55; }
    }
  }
  function poly(ctx, pts, frac = 1) {
    if (pts.length < 2 || frac <= 0) return;
    const n = (pts.length - 1) * clamp(frac);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let k = 1; k <= Math.floor(n); k++) ctx.lineTo(pts[k][0], pts[k][1]);
    const f = n - Math.floor(n), a = pts[Math.floor(n)], b = pts[Math.min(pts.length - 1, Math.floor(n) + 1)];
    if (f > 0) ctx.lineTo(lerp(a[0], b[0], f), lerp(a[1], b[1], f));
    ctx.stroke();
  }
  function glowStroke(ctx, draw, color, w, glow = 0.18) {
    ctx.strokeStyle = color; ctx.globalAlpha *= 1;
    const ga = ctx.globalAlpha;
    ctx.lineWidth = w * 5; ctx.globalAlpha = ga * glow; draw();
    ctx.lineWidth = w; ctx.globalAlpha = ga; draw();
  }
  const along = (pts, k) => {
    const n = (pts.length - 1) * clamp(k), j = Math.min(pts.length - 2, Math.floor(n)), f = n - j;
    return [lerp(pts[j][0], pts[j + 1][0], f), lerp(pts[j][1], pts[j + 1][1], f)];
  };

  // ───────────────────────────── 01 Title
  scene('title', {
    enter() {
      S.ambientAlpha = 0.9;
      M.set({ on: true, full: true, y: 540, h: 150, amp: 0, speed: 600, period: 1.2 });
      M.reset();
    },
    update() {
      M.ampT = S.sceneT > 1.1 ? 0.8 : 0;
      lightNearHead(633, 320);
    }
  });

  // ───────────────────────────── 02 Blind spot
  scene('blind', {
    enter() {
      S.ambientAlpha = 0.32;
      M.set({ on: true, full: false, x: 210, y: 840, w: 1500, h: 120, amp: 0, speed: 520, period: 1.05 });
      M.reset();
      this.tiles = $$('.s-blind .tile');
      this.pct = $('#b-pct');
      this.burst = null;
    },
    setStep(s) {
      this.s = s;
      if (s === 0) { this.fillT = 0; this.tiles.forEach(t => t.classList.remove('done')); }
      else { this.tiles.forEach(t => t.classList.add('done')); this.pct.textContent = '100%'; }
      Sound.flat(s === 1);
      if (s === 2 && !this.burst) {
        M.on = false;
        this.burst = S.claim(1300, this, 2.6, 0.5);
        this.burst.forEach((p, k) => {
          const el = this.tiles[k % this.tiles.length];
          p.x = p.fx = +el.dataset.x + rand() * 230;
          p.y = p.fy = +el.dataset.y + rand() * 104;
          const gold = rand() < 0.06;
          p.a = 0.9; p.aT = gold ? 1 : 0.5; p.gT = gold ? 1 : 0; p.gk = 1.1; p.rT = gold ? 3.2 : 1.8;
          p.bd = 0.1 + p.rnd3 * 0.4;
        });
      } else if (s < 2 && this.burst) { S.release(this.burst); this.burst = null; M.on = true; }
      this.tiles.forEach(t => { t.style.opacity = s === 2 ? '0' : ''; t.style.transform = s === 2 ? 'scale(0.92)' : ''; });
      document.querySelectorAll('.s-blind .readout').forEach(r => { r.style.opacity = s === 2 ? '0' : ''; r.style.transition = 'opacity 0.6s'; });
    },
    update(dt, t) {
      if (this.s === 0) {
        this.fillT += dt;
        const n = clamp(Math.floor((this.fillT - 0.7) / 0.17), 0, 18);
        this.tiles.forEach((el, k) => el.classList.toggle('done', k < n));
        this.pct.textContent = Math.round((n / 18) * 100) + '%';
      }
      if (this.burst) for (const p of this.burst) drift(p, t);
    },
    exit() { this.tiles.forEach(t => { t.style.opacity = ''; t.style.transform = ''; }); }
  });

  // ───────────────────────────── 03 Goals become economic cases
  const GOAL = { x: 960, y: 540 };
  const FAC = [{ x: 360, y: 365 }, { x: 1560, y: 365 }, { x: 360, y: 805 }, { x: 1560, y: 805 }];
  scene('case', {
    enter() {
      S.ambientAlpha = 0.25;
      this.orb = S.claim(460, this, 1.3, 0.5);
      this.str = S.claim(260, this, 1.3, 0.5);
      this.orb.forEach(p => { p.ang = rand() * TAU; p.rad = 0.85 + rand() * 0.45; p.sp = 0.1 + rand() * 0.18; p.rT = 1.5 + rand() * 1.4; p.aT = 0.7; });
      this.str.forEach((p, k) => { p.f = k % 4; p.k = rand(); p.sp = 0.2 + rand() * 0.2; p.rT = 2; p.aT = 0; });
    },
    setStep(s) {
      this.s = s; this.lineT = 0;
      this.orb.forEach(p => { p.gT = s >= 1 ? 1 : 0; p.h = 1; });
      this.str.forEach(p => { p.aT = s >= 1 ? 0.85 : 0; p.gT = 1; p.h = 1; });
    },
    update(dt) {
      this.lineT += dt;
      for (const p of this.orb) {
        p.ang += p.sp * dt;
        p.dx = GOAL.x + Math.cos(p.ang) * 300 * p.rad;
        p.dy = GOAL.y + Math.sin(p.ang) * 150 * p.rad;
      }
      for (const p of this.str) {
        const f = FAC[p.f];
        if (this.s >= 1) { p.k += p.sp * dt; if (p.k > 1) p.k -= 1; }
        const nx = -(f.y - GOAL.y), ny = f.x - GOAL.x, L = Math.hypot(nx, ny);
        const w = Math.sin(p.k * Math.PI) * 22 * (p.rnd - 0.5) * 2;
        p.dx = lerp(GOAL.x, f.x, p.k) + (nx / L) * w;
        p.dy = lerp(GOAL.y, f.y, p.k) + (ny / L) * w;
      }
    },
    drawUnder(ctx) {
      if (this.s < 1) return;
      ctx.lineWidth = 1.5;
      FAC.forEach((f, k) => {
        const q = easeOut(clamp((this.lineT - 0.15 - k * 0.2) / 0.9));
        if (q <= 0) return;
        ctx.strokeStyle = 'rgba(242,184,75,0.3)';
        ctx.beginPath(); ctx.moveTo(GOAL.x, GOAL.y); ctx.lineTo(lerp(GOAL.x, f.x, q), lerp(GOAL.y, f.y, q)); ctx.stroke();
      });
    }
  });

  // ───────────────────────────── 04 The reveal: flow through constraint gates
  const CY = 660, HALF = 140, XA = 760, XB = 1200;
  scene('flow', {
    enter(step) {
      S.ambientAlpha = 0.14;
      const st = D.reveal.states[step];
      this.gA = this.tA = st.a; this.gB = this.tB = st.b;
      this.ps = S.claim(1050, this, 1.5, 0.9);
      this.ps.forEach(p => this.spawn(p, true));
      M.set({ on: true, full: false, x: 120, y: 880, w: 1680, h: 110, amp: 0, speed: 520, period: 1.0 });
      M.reset();
      this.lblA = $('#gl-a'); this.lblB = $('#gl-b'); this.bind = null;
    },
    spawn(p, initial) {
      const XS = S.view.x0 - 30, XE = S.view.x1 + 30;
      p.s = rand() * 2 - 1;
      p.v = 200 + rand() * 110;
      p.lane = CY + p.s * D.reveal.stream * HALF;
      p.st = 0; p.blk = 0; p.gT = 0; p.h = 1; p.aT = 0.55; p.rT = 1.7 + rand() * 0.9; p.tint = 'gray'; p.gk = 4;
      if (initial) {
        p.X = lerp(XS, XE, rand());
        const off = Math.abs(p.lane - CY);
        if (p.X > XA) { if (off > this.gA * HALF) p.X = lerp(XS, XA - 20, rand()); else p.st = 1; }
        if (p.st === 1 && p.X > XB) {
          if (off > this.gB * HALF) p.X = lerp(XA + 10, XB - 20, rand());
          else { p.st = 2; p.gT = 1; p.aT = 0.95; }
        }
      } else { p.X = XS - rand() * 80; p.g = 0; p.a = 0; }
      p.dx = p.X; p.dy = p.lane;
    },
    setStep(s) {
      const st = D.reveal.states[s];
      this.tA = st.a; this.tB = st.b; this.s = s;
      M.ampT = [0, 0.55, 0, 1, 1][s];
      if (s === 3) M.kick(1.8);
      Sound.flat(s === 2);
      if (s === 1) countUp($('#rv1'), 58400);
      if (s === 3) countUp($('#rv3'), 119600, 1.6);
    },
    update(dt, t) {
      this.gA = approach(this.gA, this.tA, dt, 1.6);
      this.gB = approach(this.gB, this.tB, dt, 1.6);
      const XE = S.view.x1 + 30, hA = this.gA * HALF, hB = this.gB * HALF;
      for (const p of this.ps) {
        if (p.st === 3) {
          p.blk += dt;
          p.aT = 0.5 * (1 - clamp(p.blk / 1.8));
          p.dx = p.X + Math.sin(t * 2 + p.rnd * 9) * 1.2;
          p.dy = p.lane + Math.cos(t * 1.7 + p.rnd2 * 9) * 1.2;
          if (p.blk > 1.9) this.spawn(p, false);
          continue;
        }
        p.X += p.v * dt;
        const off = p.lane - CY;
        if (p.st === 0 && p.X >= XA - 4) {
          if (Math.abs(off) > hA) { p.st = 3; p.X = XA - 6 - rand() * 46; p.blk = 0; } else p.st = 1;
        } else if (p.st === 1 && p.X >= XB - 4) {
          if (Math.abs(off) > hB) { p.st = 3; p.X = XB - 6 - rand() * 46; p.blk = 0; }
          else { p.st = 2; p.gT = 1; p.aT = 0.95; }
        }
        let y = p.lane;
        if (p.st === 2) y = CY + off * (1 - 0.55 * ease(clamp((p.X - XB) / 700)));
        p.dx = p.X; p.dy = y;
        if (p.X > XE) this.spawn(p, false);
      }
      const bind = this.gB <= this.gA + 0.002 ? 'b' : 'a';
      if (bind !== this.bind) {
        this.bind = bind;
        this.lblA.classList.toggle('binding', bind === 'a');
        this.lblB.classList.toggle('binding', bind === 'b');
      }
    },
    gate(ctx, x, g, bind, t) {
      const top = CY - HALF - 28, bot = CY + HALF + 28, h = g * HALF + 6, pulse = 0.6 + 0.4 * Math.sin(t * 4);
      const seg = () => { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, CY - h); ctx.moveTo(x, CY + h); ctx.lineTo(x, bot); ctx.stroke(); };
      const ga = ctx.globalAlpha;
      ctx.lineCap = 'round';
      if (bind) { ctx.strokeStyle = 'rgba(255,217,138,1)'; ctx.lineWidth = 28; ctx.globalAlpha = ga * 0.16 * pulse; seg(); ctx.globalAlpha = ga; }
      ctx.strokeStyle = bind ? 'rgba(255,217,138,0.95)' : 'rgba(185,192,204,0.55)';
      ctx.lineWidth = 6; seg();
      ctx.lineCap = 'butt';
    },
    drawUnder(ctx, a, t) {
      const x0 = S.view.x0, x1 = S.view.x1, top = CY - HALF - 28, hh = 2 * HALF + 56;
      ctx.fillStyle = 'rgba(255,255,255,0.018)'; ctx.fillRect(x0, top, x1 - x0, hh);
      const gr = ctx.createLinearGradient(XB, 0, x1, 0);
      gr.addColorStop(0, 'rgba(242,184,75,0)'); gr.addColorStop(1, 'rgba(242,184,75,0.08)');
      ctx.fillStyle = gr; ctx.fillRect(XB, top, x1 - XB, hh);
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
      [top, top + hh].forEach(y => { ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); });
      this.gate(ctx, XA, this.gA, this.bind === 'a', t);
      this.gate(ctx, XB, this.gB, this.bind === 'b', t);
    }
  });

  // ───────────────────────────── 05 The stopping point (live control)
  const KX0 = 780, KX1 = 1800, KY0 = 820, KY1 = 230, UMIN = 76, UMAX = 86, VMAX = 130000;
  const ux = u => KX0 + ((u - UMIN) / (UMAX - UMIN)) * (KX1 - KX0);
  const vy = v => KY0 - (v / VMAX) * (KY0 - KY1);
  const pw = (arr, u) => {
    if (u <= arr[0][0]) return arr[0][1];
    for (let k = 1; k < arr.length; k++) {
      if (u <= arr[k][0]) { const [a, va] = arr[k - 1], [b, vb] = arr[k]; return va + ((vb - va) * (u - a)) / (b - a); }
    }
    return arr[arr.length - 1][1];
  };
  const curvePts = (arr, from, to) => {
    const pts = [[ux(from), vy(pw(arr, from))]];
    for (const [u] of arr) if (u > from && u < to) pts.push([ux(u), vy(pw(arr, u))]);
    pts.push([ux(to), vy(pw(arr, to))]);
    return pts;
  };
  scene('knee', {
    enter(step) {
      S.ambientAlpha = 0.18;
      this.ps = S.claim(560, this, 1.2, 0.6);
      this.ps.forEach(p => { p.k = rand(); p.sp = 0.16 + rand() * 0.14; p.h = 1; p.rT = 1.8 + rand(); p.aT = 0; });
      this.el = { u: $('#k-u'), v: $('#k-v'), n: $('#k-n'), a: $('#k-a') };
      this.mode = step; this.u = 77;
    },
    setStep(s) { this.mode = s; this.u = 77; this.auto = true; this.autoT = 0; },
    key(k) {
      if (k === 'ArrowUp' || k === 'ArrowDown') { this.auto = false; this.u = clamp(this.u + (k === 'ArrowUp' ? 0.5 : -0.5), 77, 85.5); return true; }
      if (k === 'a' || k === 'A') { this.mode = this.mode ? 0 : 1; return true; }
      return false;
    },
    update(dt) {
      if (this.auto) { this.autoT += dt; this.u = 77 + (85.5 - 77) * ease(clamp((this.autoT - 0.9) / 7)); }
      const curve = this.mode ? D.knee.fast : D.knee.slow, stop = this.mode ? D.knee.stop.fast : D.knee.stop.slow;
      this.curve = curve; this.stop = stop;
      const u = this.u, v = pw(curve, u), pays = u < stop - 1e-6;
      this.el.u.textContent = u.toFixed(1) + '%';
      this.el.v.textContent = fmt(Math.round(v / 100) * 100);
      this.el.n.textContent = pays ? fmt(D.knee.perPoint) : '$0';
      this.el.n.style.color = pays ? 'var(--gold)' : 'var(--gray)';
      this.el.a.textContent = this.mode ? '20 days' : '37 days';
      for (const p of this.ps) {
        p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
        const uu = 77 + p.k * (u - 77), g = uu < stop;
        p.dx = ux(uu); p.dy = vy(pw(curve, uu)) + (p.rnd - 0.5) * 14 + (g ? 0 : p.k * 30 * p.rnd2);
        p.gT = g ? 1 : 0;
        p.aT = u > 77.05 ? (g ? 0.95 : 0.4) : 0;
      }
    },
    drawUnder(ctx) {
      const ga = ctx.globalAlpha;
      ctx.lineWidth = 1;
      for (const v of [40000, 80000, 120000]) {
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath(); ctx.moveTo(KX0, vy(v)); ctx.lineTo(KX1, vy(v)); ctx.stroke();
        S.text('$' + v / 1000 + 'k', KX0 - 16, vy(v) + 5, { align: 'right', color: MUTE, font: '500 15px Inter, sans-serif' });
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.beginPath(); ctx.moveTo(KX0, KY0); ctx.lineTo(KX1, KY0); ctx.stroke();
      for (let u = 77; u <= 85; u++) {
        ctx.beginPath(); ctx.moveTo(ux(u), KY0); ctx.lineTo(ux(u), KY0 + 8); ctx.stroke();
        S.text(u + '%', ux(u), KY0 + 32, { align: 'center', color: MUTE, font: '500 15px Inter, sans-serif' });
      }
      S.text('UTILIZATION', KX1, KY0 + 66, { align: 'right', color: MUTE, font: LBL, ls: '3px' });
      S.text('ADDED OPERATING PROFIT / YEAR · MODELED', KX0, KY1 - 40, { color: MUTE, font: LBL, ls: '3px' });
      if (this.mode) {
        ctx.setLineDash([6, 8]); ctx.strokeStyle = 'rgba(150,158,172,0.5)'; ctx.lineWidth = 2;
        poly(ctx, curvePts(D.knee.slow, 77, 85.5)); ctx.setLineDash([]);
        S.text('Approvals alone stop at 79%', ux(79) + 14, vy(58400) + 30, { color: MUTE, font: '500 16px Inter, sans-serif' });
      }
      const u = this.u, stop = this.stop;
      if (u > 77.01) {
        const pg = curvePts(this.curve, 77, Math.min(u, stop));
        glowStroke(ctx, () => poly(ctx, pg), GOAL_C, 3);
        if (u > stop) {
          ctx.globalAlpha = ga;
          const pr = curvePts(this.curve, stop, u);
          ctx.strokeStyle = 'rgba(150,158,172,0.75)'; ctx.lineWidth = 2.5; poly(ctx, pr);
          const kx = ux(stop), ky = vy(pw(this.curve, stop));
          ctx.strokeStyle = 'rgba(255,217,138,1)'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(kx, ky, 11, 0, TAU); ctx.stroke();
          S.text('Stops paying at ' + stop + '%', kx, ky - 26, { align: 'center', color: 'rgba(255,217,138,1)', font: '600 18px Inter, sans-serif' });
        }
        ctx.globalAlpha = ga;
        const hx = ux(u), hy = vy(pw(this.curve, u));
        ctx.drawImage(S.SPR.white, hx - 26, hy - 26, 52, 52);
      }
      ctx.globalAlpha = ga;
    }
  });
  const GOAL_C = 'rgba(242,184,75,1)';

  // ───────────────────────────── 06 Deal Desk
  const CX0 = 360, CY0 = 380, CW = 800, CH = 440, COLS = 32, ROWS = 18, SPX = CW / COLS, SPY = CH / ROWS;
  const cell = (c, r) => [CX0 + SPX / 2 + c * SPX, CY0 + SPY / 2 + r * SPY];
  scene('deal', {
    enter(step) {
      S.ambientAlpha = 0.14;
      this.ex = S.claim(COLS * ROWS, this, 1.3, 0.6);
      this.dl = S.claim(6 * ROWS, this, 1.3, 0.6);
      this.ex.forEach((p, k) => { p.col = k % COLS; p.row = Math.floor(k / COLS); });
      this.dl.forEach((p, k) => { p.col = k % 6; p.row = Math.floor(k / 6); });
      this.priceEl = $('#g-price');
      this.prevS = -1;
      this.apply(step, true);
    },
    setStep(s) { if (s !== this.s) this.apply(s, false); },
    apply(s, init) {
      if (s >= 1 && this.prevS < 1) this.fallT = init ? 6 : 0;
      this.prevS = s; this.s = s;
      this.ex.forEach(p => {
        const c = s >= 1 ? p.col + 6 : p.col, [x, y] = cell(Math.min(c, COLS - 1), p.row);
        p.disp = c >= COLS;
        p.tx = p.disp ? CX0 + CW + 34 + (c - COLS) * SPX : x; p.ty = y;
        p.gT = p.disp ? 0 : 1; p.h = 0; p.aT = p.disp ? 0.6 : 0.82; p.rT = 2.1;
        if (init) { p.dx = p.tx; p.dy = p.ty; }
      });
      this.dl.forEach(p => {
        const [x, y] = cell(p.col, p.row);
        p.tx = s >= 1 ? x : 152 + p.col * SPX; p.ty = y;
        p.tint = 'white'; p.gT = s >= 2 ? 1 : 0; p.h = 1; p.aT = 0.9; p.rT = 2.3;
        if (init) { p.dx = p.tx; p.dy = p.ty; }
      });
      this.priceT = s >= 2 ? 370 : 540;
      if (init) this.price = this.priceT;
      this.floorA = this.floorA || 0;
      this.priceEl.style.top = this.priceT + 'px';
      this.priceEl.style.color = s === 1 ? 'var(--mute)' : 'var(--ink-2)';
    },
    update(dt) {
      this.fallT += dt;
      this.price = approach(this.price, this.priceT, dt, 2.2);
      this.floorA = approach(this.floorA, this.s >= 1 ? 1 : 0, dt, 2.5);
      for (const p of this.ex) {
        let tx = p.tx, ty = p.ty;
        if (p.disp) {
          const f = Math.max(0, this.fallT - 0.9);
          ty = Math.min(1000 + p.rnd * 30, p.ty + f * f * 140 * (0.6 + p.rnd));
          tx = p.tx + f * 22 * p.rnd2;
          p.aT = 0.6 * (1 - clamp((this.fallT - 2.4) / 2)) + 0.12;
        }
        p.dx = approach(p.dx, tx, dt, 4); p.dy = approach(p.dy, ty, dt, p.disp ? 14 : 4);
      }
      for (const p of this.dl) { p.dx = approach(p.dx, p.tx, dt, 3); p.dy = approach(p.dy, p.ty, dt, 3); }
    },
    drawUnder(ctx) {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(CX0 - 8, CY0 - 8, CW + 16, CH + 16, 18) : ctx.rect(CX0 - 8, CY0 - 8, CW + 16, CH + 16); ctx.stroke();
      // the gauge
      const gx = 1430;
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(gx, 300, 30, 520);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.strokeRect(gx, 300, 30, 520);
      ctx.strokeStyle = 'rgba(150,158,172,0.8)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(gx - 14, 700); ctx.lineTo(gx + 44, 700); ctx.stroke();
      const ga = ctx.globalAlpha;
      if (this.floorA > 0.01) {
        ctx.globalAlpha = ga * this.floorA;
        ctx.setLineDash([8, 6]); ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(gx - 24, 430); ctx.lineTo(gx + 54, 430); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(242,184,75,0.08)'; ctx.fillRect(gx, 430, 30, 270);
        ctx.globalAlpha = ga;
      }
      const py = this.price, col = this.s === 1 ? 'rgba(150,158,172,1)' : GOLD;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.moveTo(gx + 40, py); ctx.lineTo(gx + 60, py - 11); ctx.lineTo(gx + 60, py + 11); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gx - 6, py); ctx.lineTo(gx + 36, py); ctx.stroke();
    }
  });

  // ───────────────────────────── 07 Monday morning
  const MC = { x: 1400, y: 560 }, MR = 250;
  const NODES = [-90, -18, 54, 126, 198].map(a => { const r = (a * Math.PI) / 180; return { x: MC.x + Math.cos(r) * MR, y: MC.y + Math.sin(r) * MR }; });
  scene('monday', {
    enter() {
      S.ambientAlpha = 0.2;
      this.ps = S.claim(380, this, 1.3, 0.6);
      this.ps.forEach((p, k) => { p.n = k % 5; p.k = rand(); p.sp = 0.25 + rand() * 0.25; p.ang = rand() * TAU; p.rr = MR * (0.88 + rand() * 0.24); p.rT = 1.7 + rand(); p.h = 1; });
      this.k = 0;
    },
    setStep(s) {
      if (this.s !== undefined && this.s !== s) this.ps.forEach(p => S.reblend(p, 1.1, 0.5));
      this.s = s;
      this.ps.forEach(p => { p.gT = s >= 1 ? 1 : 0; p.aT = s >= 1 ? 0.85 : 0.45; });
    },
    update(dt, t) {
      this.k = approach(this.k, this.s >= 1 ? 1 : 0, dt, 2.5);
      for (const p of this.ps) {
        if (this.s >= 1) {
          p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
          const n = NODES[p.n], w = Math.sin(p.k * Math.PI) * 14 * (p.rnd - 0.5);
          p.dx = lerp(n.x, MC.x, p.k) + w; p.dy = lerp(n.y, MC.y, p.k) - w;
        } else {
          p.ang += 0.07 * dt;
          p.dx = MC.x + Math.cos(p.ang) * p.rr; p.dy = MC.y + Math.sin(p.ang) * p.rr;
        }
      }
    },
    drawUnder(ctx, a, t) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(MC.x, MC.y, MR, 0, TAU); ctx.stroke();
      const ga = ctx.globalAlpha;
      if (this.k > 0.01) {
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.globalAlpha = ga * 0.3 * this.k;
        NODES.forEach(n => { ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(MC.x, MC.y); ctx.stroke(); });
      }
      ctx.globalAlpha = ga;
      NODES.forEach(n => {
        ctx.fillStyle = `rgba(238,240,244,${0.2 + 0.7 * this.k})`;
        ctx.beginPath(); ctx.arc(n.x, n.y, 8, 0, TAU); ctx.fill();
      });
      const glow = ctx.createRadialGradient(MC.x, MC.y, 0, MC.x, MC.y, 130);
      glow.addColorStop(0, `rgba(242,184,75,${0.16 + 0.1 * this.k})`); glow.addColorStop(1, 'rgba(242,184,75,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(MC.x, MC.y, 130, 0, TAU); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(MC.x, MC.y, 60, 0, TAU); ctx.stroke();
    },
    drawOver() { S.text('ONE DECISION', MC.x, MC.y + 5, { align: 'center', font: LBL, ls: '3px', color: 'rgba(255,217,138,1)' }); }
  });

  // ───────────────────────────── 08 Ask the engine
  const AY = 545, PX0 = 600, PX1 = 1350, GX = 720, EX = 1060, VX = 1290;
  scene('ask', {
    enter() {
      S.ambientAlpha = 0.16;
      this.ps = S.claim(420, this, 1.2, 0.6);
      this.ps.forEach(p => { p.k = rand(); p.sp = 0.11 + rand() * 0.1; p.rT = 1.5 + rand() * 1.1; p.h = 1; p.aT = 0; });
      this.q = 'What if approvals took 20 days?';
      this.bub = $('#ask-q');
      this.pulse = 0; this.flash = 0;
    },
    setStep(s) { this.s = s; },
    update(dt, t) {
      const typing = this.s === 0 ? clamp(((S.stepT - 0.4) * 20) / this.q.length) : 1;
      const n = Math.floor(typing * this.q.length);
      const html = this.q.slice(0, n) + (typing < 1 ? '<span class="cursor"></span>' : '');
      if (html !== this.last) { this.bub.innerHTML = html; this.last = html; }
      const flowOn = this.s > 0 || S.stepT > 1.9;
      this.pulse = approach(this.pulse, flowOn ? 1 : 0, dt, 1.5);
      const st = S.stepT;
      this.flash = this.s === 1 && st > 0.75 && st < 1.2 ? 1 : approach(this.flash, 0, dt, 4);
      for (const p of this.ps) {
        if (flowOn) { p.k += p.sp * dt; if (p.k > 1) p.k -= 1; }
        const x = lerp(PX0, PX1, p.k);
        const sq = Math.min(1, Math.abs(x - GX) / 90) * Math.min(1, Math.abs(x - EX) / 110) * Math.min(1, Math.abs(x - VX) / 40);
        p.dx = x;
        p.dy = AY + (p.rnd2 - 0.5) * 2 * (8 + 46 * sq) + Math.sin(t * 2 + p.rnd * 6) * 3;
        p.tint = 'ice'; p.gT = x > EX ? 1 : 0;
        p.aT = flowOn ? 0.85 : 0;
      }
    },
    drawUnder(ctx, a, t) {
      const ga = ctx.globalAlpha;
      // grounding ring
      ctx.strokeStyle = ICE; ctx.lineWidth = 2; ctx.setLineDash([10, 9]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.arc(GX, AY, 66, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha = ga * 0.35; ctx.beginPath(); ctx.arc(GX, AY, 84, 0, TAU); ctx.stroke(); ctx.globalAlpha = ga;
      // engine core
      const r = 80 + 8 * Math.sin(t * 3) * this.pulse;
      const g = ctx.createRadialGradient(EX, AY, 0, EX, AY, r * 1.6);
      g.addColorStop(0, `rgba(255,217,138,${0.5 * this.pulse + 0.1})`); g.addColorStop(0.45, `rgba(242,184,75,${0.18 * this.pulse + 0.05})`); g.addColorStop(1, 'rgba(242,184,75,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(EX, AY, r * 1.6, 0, TAU); ctx.fill();
      ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
      for (let k = 0; k < 12; k++) {
        const a0 = (k / 12) * TAU + t * 0.6;
        ctx.beginPath(); ctx.arc(EX, AY, 92, a0, a0 + 0.32); ctx.stroke();
      }
      // validation gate
      const fl = this.flash;
      ctx.strokeStyle = `rgba(${238},${240},${244},${0.5 + 0.5 * fl})`; ctx.lineWidth = 5 + 6 * fl; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(VX, AY - 90); ctx.lineTo(VX, AY - 24); ctx.moveTo(VX, AY + 24); ctx.lineTo(VX, AY + 90); ctx.stroke();
      ctx.lineCap = 'butt';
    }
  });

  // ───────────────────────────── 09 Value Ledger
  const LS = { cand: [220, 580], base: [600, 580], prov: [980, 580], win: [1500, 450], miss: [1500, 710] };
  const KA = [[0, 'cand'], [1.0, 'cand'], [2.0, 'base'], [2.8, 'base'], [3.8, 'prov'], [5.0, 'prov'], [6.0, 'win']];
  const KB = [[0, 'cand'], [2.0, 'cand'], [3.0, 'base'], [3.8, 'base'], [4.8, 'prov'], [6.0, 'prov'], [7.0, 'miss']];
  const keyPos = (keys, tl) => {
    if (tl <= keys[0][0]) return LS[keys[0][1]];
    for (let k = 1; k < keys.length; k++) {
      if (tl <= keys[k][0]) {
        const q = ease((tl - keys[k - 1][0]) / (keys[k][0] - keys[k - 1][0])), a = LS[keys[k - 1][1]], b = LS[keys[k][1]];
        return [lerp(a[0], b[0], q), lerp(a[1], b[1], q)];
      }
    }
    return LS[keys[keys.length - 1][1]];
  };
  const VX0 = 740, VX1 = 1180, VYB = 900, CAPY = 545, VCOLS = 27, VSP = 16, VSR = 16.3, SLOTS = 27 * 22;
  const SRC = [[520, 300], [960, 290], [1400, 300]];
  scene('ledger', {
    enter() {
      S.ambientAlpha = 0.14;
      this.A = S.claim(80, this, 1.2); this.B = S.claim(50, this, 1.2); this.V = S.claim(700, this, 1.2);
      [...this.A, ...this.B].forEach(p => { const r = Math.sqrt(rand()) * 28, a = rand() * TAU; p.ox = Math.cos(a) * r; p.oy = Math.sin(a) * r; p.rT = 2.2; });
      this.V.forEach((p, k) => { p.src = k % 3; p.rT = 2; p.aT = 0; p.st = 'idle'; });
      this.k0 = 0; this.k1 = 0;
    },
    setStep(s) {
      this.s = s; this.tl = 0; this.slots = 0;
      [...this.A, ...this.B].forEach(p => { p.aT = s === 0 ? 0.95 : 0; p.tint = 'gray'; p.gT = 1; p.h = 1; S.reblend(p, 0.9, 0.3); });
      this.V.forEach((p, k) => {
        if (s === 1) { p.st = 'wait'; p.wait = k * 0.006 + rand() * 0.25; p.aT = 0; }
        else { p.st = 'idle'; p.aT = 0; }
      });
    },
    update(dt, t) {
      this.tl += dt;
      this.k0 = approach(this.k0, this.s === 0 ? 1 : 0, dt, 4);
      this.k1 = approach(this.k1, this.s === 1 ? 1 : 0, dt, 4);
      if (this.s === 0) {
        const pa = keyPos(KA, this.tl), pb = keyPos(KB, this.tl);
        const breath = this.tl > 3.8 && this.tl < 5 ? 1 + 0.18 * Math.sin(t * 7) : 1;
        for (const p of this.A) {
          p.dx = pa[0] + p.ox * breath; p.dy = pa[1] + p.oy * breath;
          if (this.tl > 6.0) { p.h = 0; p.rT = 2.8; }
        }
        for (const p of this.B) {
          p.dx = pb[0] + p.ox * 0.8; p.dy = pb[1] + p.oy * 0.8;
          if (this.tl > 7.0) { p.tint = 'red'; p.gT = 0; }
        }
      }
      for (const p of this.V) {
        if (p.st === 'wait') {
          p.wait -= dt;
          if (p.wait <= 0) {
            p.st = 'fly'; p.k = 0; p.s0 = SRC[p.src]; p.ex = 960 + (rand() - 0.5) * 300; p.sp = 0.75 + rand() * 0.45;
            p.bl = 1; p.x = p.dx = p.s0[0]; p.y = p.dy = p.s0[1]; p.a = 0; p.aT = 0.9; p.g = 1; p.gT = 1; p.h = 1; p.tint = 'gray';
          }
        } else if (p.st === 'fly') {
          p.k += p.sp * dt;
          const k = clamp(p.k), cx = lerp(p.s0[0], p.ex, 0.5), cy = p.s0[1] - 50;
          p.dx = (1 - k) * (1 - k) * p.s0[0] + 2 * (1 - k) * k * cx + k * k * p.ex;
          p.dy = (1 - k) * (1 - k) * p.s0[1] + 2 * (1 - k) * k * cy + k * k * 470;
          if (p.k >= 1) {
            if (this.slots < SLOTS) {
              const sl = this.slots++;
              p.st = 'settle'; p.sx = VX0 + 12 + (sl % VCOLS) * VSP; p.sy = VYB - 10 - Math.floor(sl / VCOLS) * VSR; p.h = 0;
            } else { p.st = 'evap'; p.life = 0; p.vy = -50 - rand() * 50; p.gT = 0; }
          }
        } else if (p.st === 'settle') {
          p.dx = approach(p.dx, p.sx, dt, 7); p.dy = approach(p.dy, p.sy, dt, 7);
        } else if (p.st === 'evap') {
          p.life += dt; p.dy += p.vy * dt; p.dx += Math.sin(t * 3 + p.rnd * 9) * 0.6;
          p.aT = 0.6 * (1 - clamp(p.life / 1.3));
          if (p.life > 1.4) { p.st = 'wait'; p.wait = rand() * 0.4; }
        }
      }
    },
    drawUnder(ctx, a, t) {
      const ga = ctx.globalAlpha;
      if (this.k0 > 0.01) {
        ctx.globalAlpha = ga * this.k0;
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(...LS.cand); ctx.lineTo(...LS.prov); ctx.lineTo(...LS.win); ctx.moveTo(...LS.prov); ctx.lineTo(...LS.miss); ctx.stroke();
        for (const [key, c] of [['cand', 'rgba(185,192,204,0.7)'], ['base', 'rgba(185,192,204,0.7)'], ['prov', 'rgba(185,192,204,0.7)'], ['win', GOLD], ['miss', 'rgba(255,93,98,0.9)']]) {
          ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(LS[key][0], LS[key][1], 40, 0, TAU); ctx.stroke();
        }
        if (this.tl > 2.0) {
          const q = easeOut(clamp((this.tl - 2.0) / 0.5)), [bx, by] = LS.base;
          ctx.globalAlpha = ga * this.k0 * q;
          ctx.strokeStyle = GOLD; ctx.lineWidth = 2.5;
          ctx.strokeRect(bx - 11, by - 82, 22, 18);
          ctx.beginPath(); ctx.arc(bx, by - 82, 8, Math.PI, 0); ctx.stroke();
        }
        ctx.globalAlpha = ga;
      }
      if (this.k1 > 0.01) {
        ctx.globalAlpha = ga * this.k1;
        ctx.strokeStyle = 'rgba(238,240,244,0.5)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(VX0 - 6, 400); ctx.lineTo(VX0 - 6, VYB + 6); ctx.lineTo(VX1 + 6, VYB + 6); ctx.lineTo(VX1 + 6, 400); ctx.stroke();
        ctx.lineCap = 'butt';
        ctx.setLineDash([10, 8]); ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(VX0 - 30, CAPY); ctx.lineTo(VX1 + 20, CAPY); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = ga;
      }
    }
  });

  // ───────────────────────────── 10 Architecture
  const AX = 620, PY = [860, 730, 600, 470, 340], PHW = 290, PHD = 56;
  const PNAME = ['EVIDENCE', 'FINANCE', 'OPTIMIZATION', 'STATISTICS', 'AI'];
  const PCOL = [[242, 184, 75], [242, 184, 75], [242, 184, 75], [124, 196, 255], [124, 196, 255]];
  const RX = 980;
  scene('arch', {
    enter() {
      S.ambientAlpha = 0.14;
      this.ps = S.claim(760, this, 1.4, 0.7);
      this.ps.forEach(p => { p.k = rand(); p.sp = 0.045 + rand() * 0.035; p.ph = rand() * TAU; p.rr = 20 + rand() * 120; p.rT = 1.5 + rand() * 1.1; p.aT = 0.8; });
      this.hi = [0, 0, 0, 0, 0];
    },
    setStep(s) { this.s = s; },
    update(dt, t) {
      for (let k = 0; k < 5; k++) this.hi[k] = approach(this.hi[k], this.s === k + 1 ? 1 : this.s === 0 ? 0.35 : 0, dt, 4);
      for (const p of this.ps) {
        p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
        const k = p.k;
        let x, y, g, h;
        if (k < 0.6) { const q = k / 0.6; y = lerp(910, 290, q); x = AX + Math.sin(q * 12 + p.ph) * p.rr; g = clamp((q - 0.35) / 0.3); h = 1; }
        else if (k < 0.68) { const q = (k - 0.6) / 0.08; x = lerp(AX, RX, ease(q)); y = 290 + (p.rnd - 0.5) * 30; g = 1; h = 1; }
        else if (k < 0.92) { const q = (k - 0.68) / 0.24; x = RX + (p.rnd - 0.5) * 26; y = lerp(290, 910, q); g = 1; h = 0; }
        else { const q = (k - 0.92) / 0.08; x = lerp(RX, AX, ease(q)); y = 910 + (p.rnd2 - 0.5) * 30; g = 1 - q; h = 0; }
        p.dx = x; p.dy = y; p.gT = g; p.h = h;
      }
    },
    drawUnder(ctx, a, t) {
      const ga = ctx.globalAlpha;
      for (let k = 0; k < 5; k++) {
        const y = PY[k], hi = this.hi[k], c = PCOL[k];
        ctx.beginPath(); ctx.moveTo(AX - PHW, y); ctx.lineTo(AX, y - PHD); ctx.lineTo(AX + PHW, y); ctx.lineTo(AX, y + PHD); ctx.closePath();
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.03 + 0.12 * hi})`; ctx.fill();
        ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.18 + 0.75 * hi})`; ctx.lineWidth = 1.5 + 1.5 * hi; ctx.stroke();
        if (hi > 0.5) {
          ctx.globalAlpha = ga * 0.25 * (0.6 + 0.4 * Math.sin(t * 3)) * hi; ctx.lineWidth = 14; ctx.stroke(); ctx.globalAlpha = ga;
        }
      }
    },
    drawOver(ctx) {
      for (let k = 0; k < 5; k++) {
        const hi = this.hi[k], c = PCOL[k];
        S.text(PNAME[k], AX - PHW - 24, PY[k] + 5, { align: 'right', font: '600 15px Inter, sans-serif', ls: '3px', color: `rgba(${c[0]},${c[1]},${c[2]},${0.45 + 0.55 * hi})` });
      }
      ctx.save(); ctx.translate(RX + 30, 600); ctx.rotate(Math.PI / 2);
      S.text('OUTCOMES MEASURED', 0, 0, { align: 'center', font: LBL, ls: '3px', color: 'rgba(242,184,75,0.75)' });
      ctx.restore();
    }
  });

  // ───────────────────────────── 11 Statistical proof
  const PR = { x0: 190, x1: 1250, y0: 830, y1: 360, n: 48, vmin: 80, vmax: 190 };
  const xi = k => PR.x0 + (k * (PR.x1 - PR.x0)) / (PR.n - 1);
  const yv = v => PR.y0 - ((v - PR.vmin) / (PR.vmax - PR.vmin)) * (PR.y0 - PR.y1);
  const SER = (() => {
    const r = S.rng(7), base = k => 100 + 1.1 * k + 12 * Math.sin((2 * Math.PI * k) / 12);
    const noise = Array.from({ length: PR.n }, () => (r() - 0.5) * 7);
    const act = noise.map((e, k) => base(k) + e);
    const imp = act.map((v, k) => (k >= 30 ? v + 10 * clamp((k - 29) / 3) : v));
    return { base, act, imp };
  })();
  const pts = (fn, a, b) => { const o = []; for (let k = a; k <= b; k++) o.push([xi(k), yv(fn(k))]); return o; };
  scene('proof', {
    enter() {
      S.ambientAlpha = 0.14;
      this.ps = S.claim(240, this, 1.2, 0.6);
      this.ps.forEach(p => { p.k = rand(); p.sp = 0.05 + rand() * 0.05; p.rT = 1.5 + rand() * 0.9; p.h = 0; p.gT = 1; p.aT = 0; });
    },
    setStep(s) { this.s = s; this.ps.forEach(p => S.reblend(p, 1, 0.4)); },
    update(dt) {
      const st = S.stepT;
      let line, frac;
      if (this.s === 0) { line = pts(k => SER.act[k], 35, 47); frac = clamp((st - 2.4) / 1.6); }
      else { line = pts(k => SER.imp[k], 29, 47); frac = clamp((st - 0.3) / 1.4); }
      for (const p of this.ps) {
        p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
        const [x, y] = along(line, p.k * frac);
        p.dx = x + (p.rnd - 0.5) * 6; p.dy = y + (p.rnd2 - 0.5) * 10;
        p.aT = frac > 0.02 ? 0.85 : 0;
      }
    },
    drawUnder(ctx) {
      const st = S.stepT, ga = ctx.globalAlpha;
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PR.x0, PR.y0 + 10); ctx.lineTo(PR.x1, PR.y0 + 10); ctx.stroke();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (this.s === 0) {
        ctx.strokeStyle = 'rgba(150,158,172,0.85)'; ctx.lineWidth = 2.5;
        poly(ctx, pts(k => SER.act[k], 0, 35), st / 1.2);
        const fk = clamp((st - 1.2) / 1.0);
        if (fk > 0) {
          ctx.globalAlpha = ga * fk;
          ctx.setLineDash([4, 6]); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(xi(35), PR.y1 - 10); ctx.lineTo(xi(35), PR.y0 + 10); ctx.stroke();
          const up = [], lo = [];
          for (let k = 35; k <= 47; k++) { const hw = 3 + 1.4 * (k - 35); up.push([xi(k), yv(SER.base(k) + hw)]); lo.unshift([xi(k), yv(SER.base(k) - hw)]); }
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(124,196,255,0.16)'; ctx.beginPath(); [...up, ...lo].forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = ICE; ctx.lineWidth = 2; poly(ctx, pts(k => SER.base(k), 35, 47));
          ctx.setLineDash([7, 7]); ctx.strokeStyle = 'rgba(150,158,172,0.75)';
          poly(ctx, pts(k => (k === 35 ? SER.act[35] : SER.act[k - 12]), 35, 47)); ctx.setLineDash([]);
          ctx.globalAlpha = ga;
          S.text('NOW', xi(35), PR.y1 - 22, { align: 'center', font: LBL, ls: '3px', color: MUTE });
        }
        const ak = clamp((st - 2.4) / 1.6);
        if (ak > 0) glowStroke(ctx, () => poly(ctx, pts(k => SER.act[k], 35, 47), ak), GOLD, 3);
        ctx.globalAlpha = ga;
        const lg = [['History', 'rgba(150,158,172,1)', 0], ['Simple benchmark', 'rgba(150,158,172,1)', 1.2], ['Forecast range', ICE, 1.2], ['Actual', GOLD, 2.4]];
        let lx = PR.x0;
        for (const [txt, c, at] of lg) {
          ctx.globalAlpha = ga * clamp((st - at) / 0.5);
          ctx.fillStyle = c; ctx.fillRect(lx, PR.y1 - 64, 22, 4);
          S.text(txt, lx + 32, PR.y1 - 57, { font: '500 17px Inter, sans-serif', color: 'rgba(185,192,204,1)' });
          lx += 64 + txt.length * 9.5;
        }
        ctx.globalAlpha = ga;
      } else {
        ctx.strokeStyle = 'rgba(150,158,172,0.85)'; ctx.lineWidth = 2.5;
        poly(ctx, pts(k => SER.act[k], 0, 29));
        ctx.setLineDash([7, 7]); ctx.strokeStyle = ICE; ctx.lineWidth = 2;
        poly(ctx, pts(k => SER.base(k), 29, 47)); ctx.setLineDash([]);
        const ak = clamp((st - 0.3) / 1.4);
        if (ak > 0.3) {
          ctx.globalAlpha = ga * clamp((ak - 0.3) / 0.5) * 0.9;
          ctx.fillStyle = 'rgba(242,184,75,0.16)'; ctx.beginPath();
          const top = pts(k => SER.imp[k], 29, 47), bot = pts(k => SER.base(k), 29, 47).reverse();
          [...top, ...bot].forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = ga;
        }
        glowStroke(ctx, () => poly(ctx, pts(k => SER.imp[k], 29, 47), ak), GOLD, 3);
        ctx.globalAlpha = ga;
        ctx.strokeStyle = GOLD; ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(xi(29.5), PR.y1 - 10); ctx.lineTo(xi(29.5), PR.y0 + 10); ctx.stroke(); ctx.setLineDash([]);
        S.text('CHANGE', xi(29.5), PR.y1 - 22, { align: 'center', font: LBL, ls: '3px', color: GOLD });
        S.text('Measured impact', xi(39), yv(Math.max(SER.imp[38], SER.imp[39], SER.imp[40])) - 26, { align: 'center', font: '600 17px Inter, sans-serif', color: 'rgba(255,217,138,1)' });
        S.text('Pre-change pattern', xi(44), yv(SER.base(44)) + 40, { align: 'center', font: '500 16px Inter, sans-serif', color: ICE });
        [[12, 1.6], [20, 2.2]].forEach(([k, at]) => {
          const q = clamp((st - at) / 0.4);
          if (q <= 0) return;
          ctx.globalAlpha = ga * q * 0.85;
          ctx.strokeStyle = 'rgba(238,240,244,0.6)'; ctx.setLineDash([3, 6]); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(xi(k), PR.y1 + 40); ctx.lineTo(xi(k), PR.y0 + 10); ctx.stroke(); ctx.setLineDash([]);
          S.text('PLACEBO', xi(k), PR.y1 + 26, { align: 'center', font: LBL, ls: '2px', color: 'rgba(238,240,244,0.85)' });
          S.text('no effect', xi(k), PR.y1 + 46 + 4, { align: 'center', font: '500 14px Inter, sans-serif', color: MUTE });
          ctx.globalAlpha = ga;
        });
      }
      ctx.lineCap = 'butt';
    }
  });

  // ───────────────────────────── 12 Built to earn trust
  const TX = [360, 660, 960, 1260, 1560], TYC = 560;
  const GRADE = [{ a: 0.28, g: 0, h: 0, r: 1.6 }, { a: 0.5, g: 0.3, h: 0, r: 1.9 }, { a: 0.75, g: 1, h: 1, r: 2.2 }, { a: 0.9, g: 1, h: 0, r: 2.4 }, { a: 1, g: 1, h: 0, r: 3.0 }];
  scene('trust', {
    enter() {
      S.ambientAlpha = 0.14;
      this.ps = S.claim(600, this, 1.3, 0.6);
      this.ps.forEach((p, k) => { p.c = k % 5; p.ang = rand() * TAU; p.rad = Math.sqrt(rand()) * 85; p.bx = lerp(280, 1640, rand()); p.by = lerp(820, 960, rand()); p.sp = 0.3 + rand() * 0.7; });
      this.sw = $('#sw'); this.caps = $$('.swcap > div'); this.pos = -1;
    },
    setStep(s) {
      if (this.s !== undefined && this.s !== s) this.ps.forEach(p => S.reblend(p, 1.2, 0.5));
      this.s = s; this.pos = -1;
    },
    update(dt, t) {
      if (this.s === 1) {
        const st = S.stepT, pos = st < 1.4 ? 0 : st < 3.2 ? 1 : 2;
        if (pos !== this.pos) { this.pos = pos; this.sw.dataset.pos = pos; this.caps.forEach((c, k) => c.classList.toggle('on', k === pos)); }
      }
      for (const p of this.ps) {
        if (this.s === 0) {
          const G = GRADE[p.c];
          p.ang += 0.1 * dt;
          p.dx = TX[p.c] + Math.cos(p.ang) * p.rad; p.dy = TYC + Math.sin(p.ang) * p.rad;
          p.aT = G.a; p.gT = G.g; p.h = G.h; p.rT = G.r;
        } else {
          const pos = Math.max(0, this.pos);
          p.bx += (pos === 2 ? 70 : pos === 1 ? 20 : 6) * p.sp * dt;
          if (p.bx > 1640) p.bx = 280;
          const edge = clamp((p.bx - 280) / 90) * clamp((1640 - p.bx) / 90);
          p.dx = p.bx; p.dy = p.by + Math.sin(t * 0.8 + p.ang) * 6;
          p.aT = (pos === 0 ? 0.35 : pos === 1 ? 0.6 : 0.9) * edge;
          p.gT = pos === 0 ? 0 : 1; p.h = pos === 1 ? 1 : 0; p.rT = pos === 2 ? 2.4 : 1.9;
        }
      }
    }
  });

  // ───────────────────────────── 13 What comes next
  const ORG = (() => {
    const r = S.rng(11), nodes = [];
    for (let row = 0; row < 6; row++) for (let col = 0; col < 16; col++) nodes.push({ x: 230 + col * 98 + (r() - 0.5) * 40, y: 400 + row * 82 + (r() - 0.5) * 30, col, row });
    const links = [];
    nodes.forEach((n, k) => {
      if (n.col < 15) links.push([k, k + 1]);
      if (n.row < 5) links.push([k, k + 16]);
      if (n.col < 15 && n.row < 5 && r() < 0.3) links.push([k, k + 17]);
    });
    let row = 3;
    const thread = [];
    for (let col = 0; col < 16; col++) { thread.push(row * 16 + col); if (r() < 0.45) row = clamp(row + (r() < 0.5 ? -1 : 1), 0, 5); }
    return { nodes, links, thread };
  })();
  const ORIGIN = ORG.nodes.reduce((b, n, k) => (Math.hypot(n.x - 960, n.y - 600) < Math.hypot(ORG.nodes[b].x - 960, ORG.nodes[b].y - 600) ? k : b), 0);
  const FAN = (() => {
    const r = S.rng(23), paths = [];
    for (let j = 0; j < 36; j++) {
      let y = 610, d = (r() - 0.5) * 3.4;
      const p = [];
      for (let x = 260; x <= 1700; x += 20) { p.push([x, y]); y = clamp(y + d + (r() - 0.5) * 16, 330, 900); }
      paths.push(p);
    }
    const robust = [];
    for (let x = 260, k = 0; x <= 1700; x += 20, k++) robust.push([x, 610 - k * 0.4 + 12 * Math.sin(k / 9)]);
    return { paths, robust };
  })();
  const TL = { y: 650, x0: 240, x1: 1700 };
  const BARS = [{ x0: 240, x1: 880, y: 480 }, { x0: 520, x1: 1300, y: 545 }, { x0: 900, x1: 1700, y: 760 }, { x0: 1200, x1: 1500, y: 825 }];
  const GATES = [{ x: 520, label: 'FUND', go: true }, { x: 900, label: 'WAIT', go: false }, { x: 1200, label: 'EXPAND', go: true }, { x: 1500, label: 'STOP', go: false }];
  const TILES = [[420, 400], [780, 400], [1140, 400], [1500, 400], [420, 580], [780, 580], [1140, 580], [1500, 580], [420, 760], [780, 760], [1140, 760], [1500, 760]];
  scene('future', {
    enter() { S.ambientAlpha = 0.14; this.ps = []; this.tag = $('#fut-tag'); this.inds = $$('.s-future .ind'); },
    setStep(s) {
      this.s = s;
      S.release(this.ps);
      this.tag.textContent = s === 0 ? 'Vision' : 'Roadmap';
      this.inds.forEach((el, k) => el.classList.toggle('lit', false));
      if (s === 0) {
        this.ps = S.claim(96 + 300, this, 1.3, 0.6);
        this.ps.forEach((p, k) => {
          if (k < 96) { p.node = k; p.rT = 3.2; }
          else { p.node = -1; p.link = ORG.links[k % ORG.links.length]; p.k = rand(); p.sp = 0.4 + rand() * 0.5; p.rT = 1.5; p.h = 1; }
        });
      } else if (s === 1) {
        this.ps = S.claim(560, this, 1.3, 0.6);
        this.ps.forEach((p, k) => { p.rb = k < 130; p.path = p.rb ? FAN.robust : FAN.paths[k % 36]; p.k = rand(); p.sp = 0.06 + rand() * 0.06; p.rT = p.rb ? 2.4 : 1.5; });
      } else if (s === 2) {
        this.ps = S.claim(420, this, 1.3, 0.6);
        this.ps.forEach((p, k) => { p.bar = k % 5; p.k = rand(); p.sp = 0.08 + rand() * 0.08; p.rT = 1.9; });
      } else {
        this.ps = S.claim(380, this, 1.3, 0.6);
        this.ps.forEach((p, k) => { p.to = 1 + (k % 11); p.k = rand(); p.sp = 0.3 + rand() * 0.3; p.rT = 1.8; p.h = 1; });
      }
    },
    update(dt, t) {
      const st = S.stepT;
      if (this.s === 0) {
        const o = ORG.nodes[ORIGIN], wave = Math.max(0, st - 0.6) * 300;
        const lit = ORG.nodes.map(n => Math.hypot(n.x - o.x, n.y - o.y) < wave);
        this.lit = lit;
        for (const p of this.ps) {
          if (p.node >= 0) { const n = ORG.nodes[p.node]; p.dx = n.x; p.dy = n.y; p.gT = lit[p.node] ? 1 : 0; p.aT = lit[p.node] ? 1 : 0.55; }
          else {
            p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
            const a = ORG.nodes[p.link[0]], b = ORG.nodes[p.link[1]];
            p.dx = lerp(a.x, b.x, p.k); p.dy = lerp(a.y, b.y, p.k);
            const on = lit[p.link[0]] && lit[p.link[1]];
            p.gT = on ? 1 : 0; p.aT = on ? 0.8 : 0.2;
          }
        }
      } else if (this.s === 1) {
        const rk = clamp(st / 2.2);
        for (const p of this.ps) {
          p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
          const [x, y] = along(p.path, p.k * rk);
          p.dx = x; p.dy = y + (p.rnd - 0.5) * 6;
          p.gT = p.rb ? 1 : 0; p.h = 0; p.aT = rk > 0.02 ? (p.rb ? 0.95 : 0.4) : 0;
        }
      } else if (this.s === 2) {
        for (const p of this.ps) {
          p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
          if (p.bar === 4) { p.dx = lerp(TL.x0, TL.x1, p.k); p.dy = TL.y + (p.rnd - 0.5) * 10; p.gT = 1; p.h = 0; p.aT = 0.8; }
          else {
            const b = BARS[p.bar], x = lerp(b.x0, b.x1, p.k);
            const stopped = (p.bar === 3 && x > 1500) || (p.bar === 1 && x > 900 && st < 2.6 && st > 1.6);
            p.dx = x; p.dy = b.y + (p.rnd - 0.5) * 18; p.gT = stopped ? 0 : 1; p.h = 1; p.aT = 0.75;
          }
        }
      } else {
        const n = clamp(Math.floor((st - 0.5) / 0.22), 0, 11);
        this.inds.forEach((el, k) => el.classList.toggle('lit', k > 0 && k <= n));
        this.nLit = n;
        for (const p of this.ps) {
          const on = p.to <= n;
          if (on) { p.k += p.sp * dt; if (p.k > 1) p.k -= 1; }
          const a = TILES[0], b = TILES[p.to];
          p.dx = lerp(a[0], b[0], p.k); p.dy = lerp(a[1], b[1], p.k) + Math.sin(p.k * Math.PI) * -40;
          p.gT = 1; p.aT = on ? 0.75 : 0;
        }
      }
    },
    drawUnder(ctx, a, t) {
      const st = S.stepT, ga = ctx.globalAlpha;
      if (this.s === 0 && this.lit) {
        ctx.lineWidth = 1;
        for (const [i0, i1] of ORG.links) {
          const on = this.lit[i0] && this.lit[i1], n0 = ORG.nodes[i0], n1 = ORG.nodes[i1];
          ctx.strokeStyle = on ? 'rgba(242,184,75,0.3)' : 'rgba(255,255,255,0.07)';
          ctx.beginPath(); ctx.moveTo(n0.x, n0.y); ctx.lineTo(n1.x, n1.y); ctx.stroke();
        }
      } else if (this.s === 1) {
        const rk = clamp(st / 2.2);
        ctx.fillStyle = 'rgba(242,184,75,0.06)'; ctx.beginPath();
        FAN.robust.forEach(([x, y], j) => (j ? ctx.lineTo(x, y - 55) : ctx.moveTo(x, y - 55)));
        [...FAN.robust].reverse().forEach(([x, y]) => ctx.lineTo(x, y + 55)); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(150,158,172,0.22)'; ctx.lineWidth = 1.2;
        for (const p of FAN.paths) poly(ctx, p, rk);
        glowStroke(ctx, () => poly(ctx, FAN.robust, rk), GOLD, 3);
        ctx.globalAlpha = ga;
        if (rk > 0.95) {
          S.text('Robust plan', 1712, FAN.robust[FAN.robust.length - 1][1] + 6, { font: '600 18px Inter, sans-serif', color: 'rgba(255,217,138,1)' });
        }
        S.text('POSSIBLE FUTURES', 260, 330, { font: LBL, ls: '3px', color: MUTE });
      } else if (this.s === 2) {
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(TL.x0, TL.y); ctx.lineTo(TL.x1, TL.y); ctx.stroke();
        ['Now', '+3m', '+6m', '+9m', '+12m', '+18m', '+24m', '+36m'].forEach((lb, k) => {
          const x = lerp(TL.x0, TL.x1, k / 7);
          ctx.beginPath(); ctx.moveTo(x, TL.y - 6); ctx.lineTo(x, TL.y + 6); ctx.stroke();
          S.text(lb, x, TL.y + 30, { align: 'center', font: '500 14px Inter, sans-serif', color: MUTE });
        });
        BARS.forEach((b, k) => {
          ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(b.x0, b.y - 16, b.x1 - b.x0, 32, 10) : ctx.rect(b.x0, b.y - 16, b.x1 - b.x0, 32); ctx.stroke();
          S.text('Initiative ' + 'ABCD'[k], b.x0 + 12, b.y - 24, { font: '500 14px Inter, sans-serif', color: MUTE });
        });
        GATES.forEach((g, k) => {
          const q = clamp((st - 0.6 - k * 0.7) / 0.4), c = g.go ? `rgba(242,184,75,${0.3 + 0.7 * q})` : `rgba(150,158,172,${0.3 + 0.6 * q})`;
          ctx.fillStyle = c;
          ctx.beginPath(); ctx.moveTo(g.x, TL.y - 16); ctx.lineTo(g.x + 12, TL.y); ctx.lineTo(g.x, TL.y + 16); ctx.lineTo(g.x - 12, TL.y); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = ga * (0.3 + 0.7 * q);
          S.text(g.label, g.x, TL.y - 30, { align: 'center', font: '600 15px Inter, sans-serif', ls: '3px', color: g.go ? 'rgba(255,217,138,1)' : 'rgba(185,192,204,1)' });
          ctx.globalAlpha = ga;
        });
      } else if (this.s === 3 && this.nLit) {
        ctx.strokeStyle = 'rgba(242,184,75,0.22)'; ctx.lineWidth = 1.2;
        for (let k = 1; k <= this.nLit; k++) {
          const a0 = TILES[0], b = TILES[k];
          ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.quadraticCurveTo((a0[0] + b[0]) / 2, (a0[1] + b[1]) / 2 - 80, b[0], b[1]); ctx.stroke();
        }
      }
    }
  });

  // ───────────────────────────── 14 Close
  const PATH4 = [360, 760, 1160, 1560];
  scene('close', {
    enter() { S.ambientAlpha = 0.3; this.ps = []; },
    setStep(s) {
      this.s = s;
      S.release(this.ps); this.ps = [];
      M.on = false; S.ambientAlpha = 0.3;
      if (s === 0) {
        this.ps = S.claim(96 + 160, this, 1.3, 0.6);
        this.ps.forEach((p, k) => {
          if (k < 96) { p.node = k; p.rT = 3; p.gT = 0; p.aT = 0.55; }
          else { p.node = -1; p.k = rand(); p.sp = 0.05 + rand() * 0.04; p.rT = 2.2; p.gT = 1; p.h = 0; p.aT = 0.95; }
        });
      } else if (s === 1) {
        S.ambientAlpha = 0.85;
        M.set({ on: true, full: true, y: 520, h: 160, amp: 0.85, speed: 600, period: 1.15 });
      } else {
        this.ps = S.claim(260, this, 1.3, 0.6);
        this.ps.forEach(p => { p.k = rand(); p.sp = 0.08 + rand() * 0.06; p.rT = 2; p.gT = 1; p.h = 1; p.aT = 0.85; });
      }
    },
    update(dt, t) {
      if (this.s === 1) { lightNearHead(619, 330); return; }
      const thread = ORG.thread.map(k => [ORG.nodes[k].x, ORG.nodes[k].y]);
      for (const p of this.ps) {
        if (this.s === 0) {
          if (p.node >= 0) { const n = ORG.nodes[p.node]; p.dx = n.x; p.dy = n.y; p.gT = ORG.thread.includes(p.node) ? 1 : 0; p.aT = p.gT ? 1 : 0.5; }
          else { p.k += p.sp * dt; if (p.k > 1) p.k -= 1; const [x, y] = along(thread, p.k); p.dx = x; p.dy = y + (p.rnd - 0.5) * 5; }
        } else {
          p.k += p.sp * dt; if (p.k > 1) p.k -= 1;
          p.dx = lerp(PATH4[0], PATH4[3], p.k); p.dy = 600 + (p.rnd - 0.5) * 12;
          p.h = p.dx > PATH4[3] - 40 ? 0 : 1;
        }
      }
    },
    drawUnder(ctx) {
      if (this.s === 0) {
        ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        for (const [i0, i1] of ORG.links) { const a = ORG.nodes[i0], b = ORG.nodes[i1]; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        const thread = ORG.thread.map(k => [ORG.nodes[k].x, ORG.nodes[k].y]);
        glowStroke(ctx, () => poly(ctx, thread), GOLD, 2);
      } else if (this.s === 2) {
        ctx.strokeStyle = 'rgba(242,184,75,0.35)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(PATH4[0], 600); ctx.lineTo(PATH4[3], 600); ctx.stroke();
        PATH4.forEach((x, k) => {
          ctx.fillStyle = k === 3 ? GOLD : '#06070a'; ctx.strokeStyle = GOLD; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(x, 600, 14, 0, TAU); ctx.fill(); ctx.stroke();
        });
      }
    }
  });
})();
