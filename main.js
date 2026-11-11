/* ==========================================================================
   Dev Patel — Architectural Portfolio Interactive Controller
   ========================================================================== */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Adaptive Grid above 1920px ---------- */
  function applyAdaptiveGrid() {
    const base = 16, refW = 1920, coef = 0.6666;
    const size = base - (base * (((refW - innerWidth) / refW) * 100 * coef)) / 100;
    if (size > base) root.style.fontSize = size + 'px';
    else root.style.removeProperty('font-size');
  }
  applyAdaptiveGrid();
  addEventListener('resize', applyAdaptiveGrid);

  /* ---------- Touch & Scroll Helpers ---------- */
  let locks = 0;
  window.__touching = false;
  addEventListener('touchstart', () => { window.__touching = true; }, { passive: true, capture: true });
  addEventListener('touchend', () => { window.__touching = false; }, { passive: true, capture: true });
  addEventListener('touchcancel', () => { window.__touching = false; }, { passive: true, capture: true });

  window.__snapTo = top => scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });

  function stopScroll() {
    locks++;
    Object.assign(root.style, { overflow: 'hidden', height: '100%' });
  }
  function startScroll() {
    locks = Math.max(0, locks - 1);
    if (locks) return;
    root.style.removeProperty('overflow');
    root.style.removeProperty('height');
  }
  function scrollToId(id) {
    if (id === 'home') { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); return; }
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + pageYOffset;
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }

  /* ---------- Spring Helper & Declarative Hover ---------- */
  function spring({ tension, friction }, render) {
    let x = 0, v = 0, target = 0, raf = 0;
    const step = () => {
      const dt = 1 / 60, a = tension * (target - x) - friction * v;
      v += a * dt; x += v * dt; render(x);
      if (Math.abs(target - x) < 0.001 && Math.abs(v) < 0.001) { x = target; v = 0; render(x); raf = 0; return; }
      raf = requestAnimationFrame(step);
    };
    render(0);
    return { set(t) { target = t; if (!raf) raf = requestAnimationFrame(step); } };
  }

  function bindHovers(scope = document) {
    scope.querySelectorAll('[data-h]').forEach(el => {
      if (el._h) return; el._h = 1;
      const props = el.dataset.h.split('|').map(p => { const [k, a, b] = p.trim().split(/\s+/); return { k, a: +a, b: +b }; });
      const [tension, friction] = (el.dataset.hs || '320 18').split(/\s+/).map(Number);
      const trig = el.dataset.ht ? el.closest(el.dataset.ht) || el : el;
      const render = p => {
        const v = { s: 1, x: 0, y: 0, r: 0 };
        let o = null;
        props.forEach(({ k, a, b }) => { const val = a + (b - a) * p; if (k === 'o') o = val; else v[k] = val; });
        el.style.transform = `translate(${v.x}px,${v.y}px) rotate(${v.r}deg) scale(${v.s})`;
        if (o !== null) el.style.opacity = o;
      };
      const s = spring({ tension, friction }, render);
      if (!canHover) return;
      trig.addEventListener('mouseenter', () => s.set(1));
      trig.addEventListener('mouseleave', () => s.set(0));
      trig.addEventListener('focusin', () => s.set(1));
      trig.addEventListener('focusout', () => s.set(0));
    });
  }
  bindHovers();

  /* ---------- Sticky Header & Live Local Clock ---------- */
  {
    const hdr = $('.hdr');
    const upd = () => hdr && hdr.classList.toggle('stuck', scrollY > 24);
    addEventListener('scroll', upd, { passive: true });
    upd();
  }

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function tickClock() {
    const d = new Date(), h = d.getHours();
    const time = `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;
    const date = `${d.getDate()} ${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
    document.querySelectorAll('[data-time]').forEach(e => e.textContent = time);
    document.querySelectorAll('[data-date]').forEach(e => e.textContent = date);
    document.querySelectorAll('[data-dshort]').forEach(e => e.textContent = `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`);
    document.querySelectorAll('[data-navtime]').forEach(e => e.textContent = ' — ' + time);
    document.querySelectorAll('[data-ftime]').forEach(e => e.textContent = time);
    document.querySelectorAll('[data-fyear]').forEach(e => e.textContent = d.getFullYear());
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* ---------- Overlays Helper ---------- */
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function openLayer(el, onKey) {
    if (!el) return;
    el.hidden = false;
    stopScroll();
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
    el._key = e => {
      if (e.key === 'Escape') { onKey(); return; }
      if (e.key !== 'Tab') return;
      const f = [...el.querySelectorAll(FOCUSABLE)].filter(n => n.offsetWidth || n.offsetHeight || n.getClientRects().length);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (!el.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    addEventListener('keydown', el._key);
  }
  function closeLayer(el, after) {
    if (!el || el.hidden) return;
    el.classList.remove('open');
    el.classList.add('closing');
    removeEventListener('keydown', el._key);
    setTimeout(() => { el.hidden = true; el.classList.remove('closing'); startScroll(); after?.(); }, 400);
  }

  /* ---------- Modals: Contact & Resumes ---------- */
  const modal = $('#modal'), form = $('#reqForm');
  const resumeModal = $('#resume-modal');
  let lastFocus = null;

  function openModal() {
    lastFocus = document.activeElement;
    $('#mFormWrap').hidden = false;
    $('#mSuccess').hidden = true;
    openLayer(modal, closeModal);
    setTimeout(() => form?.querySelector('input')?.focus(), 140);
  }
  function closeModal() {
    closeLayer(modal, () => {
      lastFocus?.focus?.({ preventScroll: true });
      form?.reset();
    });
  }
  modal?.addEventListener('click', closeModal);
  $('#mPanel')?.addEventListener('click', e => e.stopPropagation());
  $('#mClose')?.addEventListener('click', closeModal);
  $('#mDone')?.addEventListener('click', closeModal);

  function openResumeModal() {
    lastFocus = document.activeElement;
    openLayer(resumeModal, closeResumeModal);
    setTimeout(() => $('#rClose')?.focus(), 120);
  }
  function closeResumeModal() {
    closeLayer(resumeModal, () => lastFocus?.focus?.({ preventScroll: true }));
  }
  resumeModal?.addEventListener('click', closeResumeModal);
  $('#rPanel')?.addEventListener('click', e => e.stopPropagation());
  $('#rClose')?.addEventListener('click', closeResumeModal);

  document.querySelectorAll('[data-contact]').forEach(b => b.addEventListener('click', openModal));
  document.querySelectorAll('[data-resume]').forEach(b => b.addEventListener('click', openResumeModal));

  const EMAIL = 'devpatel846211@gmail.com';
  let lastMailText = '';
  form?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const role = String(fd.get('role') || 'Full-Time Data / ML Role').trim();
    const message = String(fd.get('message') || '').trim();
    const subject = `[Interview / Role] ${role} — ${name}`;
    const body = `Hi Dev,\n\n${message}\n\nRecruiter / Contact: ${name} (${email})\nTarget Role: ${role}\n`;
    lastMailText = `To: ${EMAIL}\nSubject: ${subject}\n\n${body}`;

    $('#eqGmailLink').href = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#eqMailtoLink').href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    navigator.clipboard?.writeText(lastMailText).catch(() => {});

    $('#mFormWrap').hidden = true;
    $('#mSuccess').hidden = false;
  });
  $('#eqCopyBtn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(lastMailText).then(() => {
      const btn = $('#eqCopyBtn');
      const prev = btn.textContent;
      btn.textContent = 'Copied ✓';
      setTimeout(() => btn.textContent = prev, 1800);
    }).catch(() => {});
  });

  /* ---------- Mode (Dark Charcoal default / Warm Stone toggle) ---------- */
  const MODE_KEY = 'dev-mode';
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function getMode() { return root.dataset.mode === 'dark' ? 'dark' : 'light'; }
  function setMode(m, animate = true) {
    if (animate && !reduced && document.startViewTransition) {
      const hit = $('#cordHit')?.getBoundingClientRect();
      if (hit && hit.width) {
        root.style.setProperty('--vt-x', Math.round(hit.left + hit.width / 2) + 'px');
        root.style.setProperty('--vt-y', Math.round(hit.top + hit.height / 2) + 'px');
      }
      document.startViewTransition(() => setMode(m, false));
      return;
    }
    if (m === 'dark') root.dataset.mode = 'dark';
    else delete root.dataset.mode;
    themeMeta?.setAttribute('content', m === 'dark' ? '#1A1818' : '#E8E4E0');
    $('#cordHit')?.setAttribute('aria-checked', String(m === 'dark'));
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
  }
  setMode(getMode(), false);
  const toggleMode = () => setMode(getMode() === 'dark' ? 'light' : 'dark');

  /* ---------- Mobile Nav Menu ---------- */
  const NAV = [
    ['Home', 'home'],
    ['Power BI & BI', 0],
    ['SQL Systems', 1],
    ['ML Engineer', 2],
    ['GenAI & RAG', 3],
    ['Open Source CLI', 4],
    ['My story', 'about'],
    ['Contact', null]
  ];
  const navm = $('#navm');
  $('#navList').innerHTML = NAV.map(([l, id], i) =>
    `<li><button type="button" class="navm__item" style="--d:${i * 40 + 60}ms" data-i="${i}"><small>0${i + 1}</small><span>${l}</span></button></li>`
  ).join('');
  const openNav = () => { openLayer(navm, closeNav); setTimeout(() => $('#navClose')?.focus(), 60); };
  const closeNav = after => closeLayer(navm, typeof after === 'function' ? after : () => $('#menuBtn')?.focus());
  $('#menuBtn')?.addEventListener('click', openNav);
  $('#navClose')?.addEventListener('click', closeNav);
  $('#navList')?.addEventListener('click', e => {
    const b = e.target.closest('.navm__item');
    if (!b) return;
    const id = NAV[+b.dataset.i][1];
    closeNav(() => typeof id === 'number' ? window.openDoor?.(id) : id ? scrollToId(id) : openModal());
  });
  $('#navTheme')?.addEventListener('click', () => { toggleMode(); });
  $('#navResumes')?.addEventListener('click', () => closeNav(() => openResumeModal()));
  $('#navStart')?.addEventListener('click', () => closeNav(() => openModal()));

  /* Global nav/CTA clicks */
  document.addEventListener('click', e => {
    const goBtn = e.target.closest('[data-go]');
    if (goBtn) {
      e.preventDefault();
      scrollToId(goBtn.dataset.go);
      return;
    }
    const doorBtn = e.target.closest('[data-door]');
    if (doorBtn && !e.target.closest('#wallv')) {
      e.preventDefault();
      window.openDoor?.(Number(doorBtn.dataset.door));
    }
  });

  /* ---------- Pull Cord: Braided Cotton Rope & Turned Walnut Knob ---------- */
  (function pullCord() {
    const wrap = $('#cord'), cv = $('.cord__cv', wrap), hit = $('#cordHit');
    if (!wrap || !cv || !hit) return;
    const ctx = cv.getContext('2d');
    const N = 26, G = 4600, STEP = 1 / 120, ITER = 16;
    let dpr = 1, W = 300, H = 420;
    let L = 220, EXT_MAX = 72, HIDDEN = 90, seg = 10, ax = 200, thick = 3.7, knobS = 1.3;
    let pts = [], ext = 0, extV = 0, armed = true;
    let grab = -1, grabOff = { x: 0, y: 0 }, target = null, ptr = null, ptrPrev = null;
    let downAt = 0, downPos = null, moved = 0;
    let acc = 0, lastT = 0, t = 0, dropped = false, live = false;

    function layout() {
      const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      const vw = innerWidth, vh = innerHeight;
      let offset;
      if (vw >= 1024) { offset = 4.25 * rem; L = Math.min(265, Math.max(185, vh * .29)); EXT_MAX = 72; thick = 3.7; knobS = 1.3; }
      else if (vw >= 640) { offset = 5.9 * rem; L = Math.min(210, Math.max(150, vh * .2)); EXT_MAX = 62; thick = 3.4; knobS = 1.2; }
      else { L = 24; EXT_MAX = 36; thick = 2.8; knobS = .86; }
      HIDDEN = EXT_MAX + 18;
      W = vw < 1024 ? vw : Math.min(vw, 340);
      H = Math.round(L + EXT_MAX + 160);
      wrap.style.width = W + 'px';
      wrap.style.height = H + 'px';
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);

      const ck = document.querySelector('.hdr .clock');
      if (vw >= 1200 && ck && ck.offsetWidth) {
        offset = Math.max(1.2 * rem, vw - ck.getBoundingClientRect().right - 1.4 * rem);
      } else if (vw < 1024) {
        /* Place on top-left open space clear of Local time & Menu button on mobile */
        offset = W - 2.35 * rem;
      } else if (ck && ck.offsetWidth) {
        offset = Math.max(1.5 * rem, vw - ck.getBoundingClientRect().left + 1.4 * rem);
      } else {
        offset = 2.3 * rem;
      }
      const newAx = Math.max(22, W - offset);
      const total = L + HIDDEN;
      seg = total / N;
      if (!pts.length) {
        for (let i = 0; i <= N; i++) {
          const x = newAx, y = -HIDDEN + i * seg;
          pts.push({ x, y, px: x, py: y, w: i === 0 ? 0 : i === N ? .28 : 1 });
        }
      } else {
        const dx = newAx - ax;
        for (const p of pts) { p.x += dx; p.px += dx; }
      }
      ax = newAx;
    }

    function step(dt) {
      if (!dropped) return;
      t += dt;
      if (grab < 0) {
        const K = 760, C = 21;
        extV += (-K * ext - C * extV) * dt;
        ext += extV * dt;
      }
      if (ext > EXT_MAX * .8 && armed && live) { armed = false; toggleMode(); try { navigator.vibrate?.(12); } catch (e) {} }
      if (ext < EXT_MAX * .22) armed = true;

      const a = pts[0];
      a.x = a.px = ax; a.y = a.py = -HIDDEN + ext;
      const wind = reduced ? 0 : (Math.sin(t * .63) * 14 + Math.sin(t * 1.71 + 1.3) * 6);
      const damp = grab >= 0 ? .992 : .9875;
      for (let i = 1; i <= N; i++) {
        if (i === grab) continue;
        const p = pts[i];
        const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
        p.px = p.x; p.py = p.y;
        p.x += vx + wind * dt * dt * (i / N);
        p.y += vy + G * dt * dt;
      }
      if (grab >= 0 && target) {
        const g = pts[grab]; g.px = g.x; g.py = g.y; g.x = target.x; g.y = target.y;
      }
      for (let k = 0; k < ITER; k++) {
        for (let i = 0; i < N; i++) {
          const p1 = pts[i], p2 = pts[i + 1];
          const w1 = (i === grab) ? 0 : p1.w, w2 = (i + 1 === grab) ? 0 : p2.w;
          const sw = w1 + w2; if (!sw) continue;
          const dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - seg) / d / sw;
          p1.x += dx * diff * w1; p1.y += dy * diff * w1;
          p2.x -= dx * diff * w2; p2.y -= dy * diff * w2;
        }
      }
      for (let i = 1; i <= N; i++) {
        const p = pts[i];
        if (p.x < 14) p.x = 14; else if (p.x > W - 14) p.x = W - 14;
        if (p.y > H - 46) p.y = H - 46;
      }
    }

    function updateDrag() {
      if (grab < 0 || !ptr) return;
      let tx = ptr.x - grabOff.x, ty = ptr.y - grabOff.y;
      const bx = ax, by = -HIDDEN, reach = grab * seg;
      const dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1e-6;
      let need = d - reach;
      if (need > EXT_MAX) {
        const over = need - EXT_MAX, allowed = reach + EXT_MAX + over * .14 / (1 + over / 160);
        tx = bx + dx / d * allowed; ty = by + dy / d * allowed;
        need = EXT_MAX;
      }
      const targetExt = Math.max(0, need), prevExt = ext;
      ext += (targetExt - ext) * .55;
      extV = (ext - prevExt) * 60;
      target = { x: Math.max(14, Math.min(W - 14, tx)), y: Math.min(H - 46, ty) };
    }

    const local = e => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function startDrag(e, idx) {
      wake();
      grab = idx;
      const p = local(e), g = pts[idx];
      grabOff = { x: p.x - g.x, y: p.y - g.y };
      ptr = ptrPrev = p; target = { x: g.x, y: g.y };
      downAt = performance.now(); downPos = p; moved = 0;
      wrap.classList.add('dragging');
      addEventListener('pointermove', onMove, { passive: false });
      addEventListener('pointerup', endDrag);
      addEventListener('pointercancel', endDrag);
    }
    function onMove(e) {
      if (grab < 0) return;
      e.preventDefault();
      ptrPrev = ptr; ptr = local(e);
      moved = Math.max(moved, Math.hypot(ptr.x - downPos.x, ptr.y - downPos.y));
    }
    function endDrag() {
      if (grab < 0) return;
      const g = pts[grab];
      if (ptr && ptrPrev) { g.px = g.x - (ptr.x - ptrPrev.x) * .5; g.py = g.y - (ptr.y - ptrPrev.y) * .5; }
      const tap = moved < 6 && performance.now() - downAt < 320;
      grab = -1; target = null; ptr = ptrPrev = null;
      wrap.classList.remove('dragging');
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', endDrag);
      removeEventListener('pointercancel', endDrag);
      if (tap) tug();
    }
    function tug() { wake(); extV = EXT_MAX * 44; pts[N].px = pts[N].x + 1.5; }

    hit.addEventListener('pointerdown', e => {
      if (!dropped) return;
      e.preventDefault();
      try { hit.setPointerCapture(e.pointerId); } catch (_) {}
      startDrag(e, N);
    });
    hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tug(); } });
    hit.addEventListener('click', e => e.preventDefault());

    const brush = { last: null };
    addEventListener('pointermove', e => {
      if (grab >= 0 || e.pointerType !== 'mouse') return;
      const p = local(e);
      if (p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20) { brush.last = null; return; }
      if (brush.last) {
        wake();
        const vx = p.x - brush.last.x, vy = p.y - brush.last.y;
        for (let i = 2; i <= N; i++) {
          const q = pts[i], d = Math.hypot(q.x - p.x, q.y - p.y);
          if (d < 16) { const f = (1 - d / 16) * .35; q.x += vx * f; q.y += vy * f * .5; }
        }
      }
      brush.last = p;
    }, { passive: true });

    function pathThrough(c, ps) {
      c.beginPath(); c.moveTo(ps[0].x, ps[0].y);
      for (let i = 1; i < ps.length - 1; i++) {
        c.quadraticCurveTo(ps[i].x, ps[i].y, (ps[i].x + ps[i + 1].x) / 2, (ps[i].y + ps[i + 1].y) / 2);
      }
      const l = ps[ps.length - 1]; c.lineTo(l.x, l.y);
    }
    function samples(ps, spacing) {
      const out = []; let carry = 0;
      for (let i = 0; i < ps.length - 1; i++) {
        const a = ps[i], b = ps[i + 1], dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1e-6;
        let s = carry;
        while (s < len) { out.push({ x: a.x + dx * s / len, y: a.y + dy * s / len, tx: dx / len, ty: dy / len }); s += spacing; }
        carry = s - len;
      }
      return out;
    }
    function knobPath(c) {
      c.beginPath();
      c.moveTo(-3.1, 6.2);
      c.bezierCurveTo(-3.6, 10.5, -9.6, 13.5, -9.6, 22.5);
      c.bezierCurveTo(-9.6, 30.5, -5.4, 35, 0, 35);
      c.bezierCurveTo(5.4, 35, 9.6, 30.5, 9.6, 22.5);
      c.bezierCurveTo(9.6, 13.5, 3.6, 10.5, 3.1, 6.2);
      c.closePath();
    }
    function drawKnob(c, x, y, ang, shadowOnly) {
      c.save(); c.translate(x, y); c.rotate(ang - Math.PI / 2); c.scale(knobS, knobS);
      if (shadowOnly) { knobPath(c); c.fill(); c.fillRect(-3.4, -.5, 6.8, 7.5); c.restore(); return; }
      const fg = c.createLinearGradient(-3.6, 0, 3.6, 0);
      fg.addColorStop(0, '#5b4a2c'); fg.addColorStop(.3, '#e8d59e'); fg.addColorStop(.55, '#b0924f'); fg.addColorStop(1, '#4a3a1f');
      c.fillStyle = fg;
      c.beginPath(); c.roundRect ? c.roundRect(-3.5, -.6, 7, 7.6, 1.2) : c.rect(-3.5, -.6, 7, 7.6); c.fill();
      c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-3.5, 2.6, 7, .7); c.fillRect(-3.5, 4.4, 7, .6);
      knobPath(c);
      const bg = c.createLinearGradient(-9.6, 0, 9.6, 0);
      bg.addColorStop(0, '#24150c'); bg.addColorStop(.22, '#6b3f22'); bg.addColorStop(.4, '#a8693d');
      bg.addColorStop(.58, '#7c4828'); bg.addColorStop(.85, '#3b2213'); bg.addColorStop(1, '#1d110a');
      c.fillStyle = bg; c.fill();
      c.save(); knobPath(c); c.clip();
      c.strokeStyle = 'rgba(30,14,6,.28)'; c.lineWidth = .55;
      for (let k = -3; k <= 3; k++) {
        c.beginPath(); c.moveTo(k * 2.4 - .6, 8); c.bezierCurveTo(k * 2.9 + 1, 16, k * 2.2 - 1, 26, k * 1.6, 35); c.stroke();
      }
      const hl = c.createRadialGradient(-3.6, 17, .5, -3.6, 17, 9);
      hl.addColorStop(0, 'rgba(255,226,190,.42)'); hl.addColorStop(1, 'rgba(255,226,190,0)');
      c.fillStyle = hl; c.fillRect(-10, 6, 20, 30);
      c.restore();
      c.fillStyle = 'rgba(255,240,220,.38)';
      c.beginPath(); c.ellipse(-4.4, 20.5, 1.1, 5.2, -.08, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    function draw() {
      const c = ctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const ps = pts, last = ps[N], prev = ps[N - 1], ang = Math.atan2(last.y - prev.y, last.x - prev.x);
      const sa = parseFloat(getComputedStyle(root).getPropertyValue('--cord-shadow')) || .24;
      c.save(); c.translate(7, 11);
      if ('filter' in c) c.filter = 'blur(3px)';
      c.strokeStyle = `rgba(0,0,0,${sa * .8})`; c.lineWidth = thick + 1; c.lineCap = 'round';
      pathThrough(c, ps); c.stroke();
      c.fillStyle = `rgba(0,0,0,${sa})`;
      drawKnob(c, last.x, last.y, ang, true);
      c.restore();

      c.lineCap = 'round'; c.lineJoin = 'round';
      pathThrough(c, ps);
      c.strokeStyle = '#6f6455'; c.lineWidth = thick + 1.3; c.stroke();
      c.strokeStyle = '#d6ccba'; c.lineWidth = thick; c.stroke();
      const sm = samples(ps, thick * 1.05);
      c.lineWidth = Math.max(.6, thick * .24); c.strokeStyle = 'rgba(96,82,64,.55)';
      c.beginPath();
      for (const q of sm) {
        if (q.y < -2) continue;
        const nx = -q.ty, ny = q.tx, h = thick * .5;
        c.moveTo(q.x - nx * h - q.tx * h * .7, q.y - ny * h - q.ty * h * .7);
        c.lineTo(q.x + nx * h + q.tx * h * .7, q.y + ny * h + q.ty * h * .7);
      }
      c.stroke();
      c.save(); c.translate(-thick * .2, -thick * .05); pathThrough(c, ps);
      c.strokeStyle = 'rgba(255,252,244,.55)'; c.lineWidth = thick * .28; c.stroke();
      c.restore();
      drawKnob(c, last.x, last.y, ang, false);
      const kx = last.x + Math.cos(ang) * 20 * knobS, ky = last.y + Math.sin(ang) * 20 * knobS;
      hit.style.transform = `translate(${kx}px, ${ky}px)`;
    }

    let sleeping = false, still = 0, touchedAt = 0;
    function wake() { still = 0; touchedAt = performance.now(); if (!sleeping) return; sleeping = false; lastT = 0; acc = 0; requestAnimationFrame(loop); }
    function loop(now) {
      if (!lastT) lastT = now;
      const dt = Math.min((now - lastT) / 1000, 1 / 20); lastT = now;
      updateDrag(); acc += dt;
      while (acc >= STEP) { step(STEP); acc -= STEP; }
      if (dropped && live && grab < 0 && now - touchedAt > 2500) for (const q of pts) { q.px += (q.x - q.px) * .06; q.py += (q.y - q.py) * .06; }
      draw();
      let motion = Math.abs(extV) + Math.abs(ext);
      for (const q of pts) motion = Math.max(motion, Math.abs(q.x - q.px) + Math.abs(q.y - q.py));
      if (dropped && live && grab < 0 && motion < .06) { if (++still > 30) { for (const q of pts) { q.px = q.x; q.py = q.y; } sleeping = true; return; } } else still = 0;
      requestAnimationFrame(loop);
    }

    layout();
    pts.forEach((p, i) => { p.y = p.py = -HIDDEN - i * seg * .6; p.x = p.px = ax + Math.sin(i * .5) * 1.2; });
    const drop = () => {
      dropped = true;
      for (const p of pts) p.px = p.x - .45;
      setTimeout(() => { live = true; }, 500);
    };
    if (document.body.classList.contains('ready')) drop();
    else addEventListener('intro:ready', drop, { once: true });
    addEventListener('resize', () => { wake(); clearTimeout(layout._t); layout._t = setTimeout(() => { layout(); wake(); }, 100); });
    new MutationObserver(wake).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
    requestAnimationFrame(loop);
  })();

  /* ---------- Flip Calendar ---------- */
  (function flipCalendar() {
    const SKILLS = ['Data Analyst', 'ML Engineer', 'Power BI Dev', 'SQL Architect', 'GenAI Builder'];
    const HOLD = 1750, FLIP = 1220;
    const cal = $('#cal');
    if (!cal) return;
    const body = $('.cal__body', cal), leaf = $('.cal__leaf', cal);
    const under = $('[data-under]', cal), face = $('.cal__face', cal);
    const measure = $('.cal__measure', cal), rings = $('.cal__rings', cal);
    const n = SKILLS.length;
    let i = 0, started = false;

    const paint = (page, k) => {
      $('.cal__word', page).textContent = SKILLS[k];
      $('.cal__no', page).textContent = `${String(k + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    };
    paint(face, 0);
    paint(under, 1);

    function fit() {
      cal.style.fontSize = '';
      const fs = parseFloat(getComputedStyle(cal).fontSize) || 36;
      let max = 0;
      for (const w of SKILLS) { measure.textContent = w; max = Math.max(max, measure.getBoundingClientRect().width); }
      const wEm = Math.max(7.6, max / fs + .85);
      body.style.setProperty('--cal-w', wEm.toFixed(3) + 'em');
      cal.style.setProperty('--cal-w', wEm.toFixed(3) + 'em');
      const avail = (cal.closest('.h1')?.getBoundingClientRect().width || innerWidth * .85) - fs * .25;
      const need = wEm * fs;
      if (need > avail) cal.style.fontSize = Math.max(20, fs * avail / need).toFixed(2) + 'px';
      const count = Math.max(8, Math.round((wEm - .55) / .62) + 1);
      rings.innerHTML = '<i></i>'.repeat(count);
      cal.querySelectorAll('.cal__holes').forEach(h => h.innerHTML = '<i></i>'.repeat(count));
    }
    fit();
    document.fonts?.ready.then(fit);
    addEventListener('resize', () => { clearTimeout(fit._t); fit._t = setTimeout(fit, 120); });

    function flip() {
      if (document.hidden) { setTimeout(flip, 600); return; }
      const next = (i + 1) % n;
      if (reduced) { i = next; paint(face, i); paint(under, (i + 1) % n); setTimeout(flip, HOLD + 600); return; }
      face.animate([{ opacity: 1 }, { opacity: 1, offset: .285 }, { opacity: 0, offset: .295 }, { opacity: 0 }], { duration: FLIP, easing: 'linear', fill: 'forwards' });
      $('.cal__rear', leaf).animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.02)', offset: .29 }, { filter: 'brightness(.96)', offset: .45 }, { filter: 'brightness(.9)' }], { duration: FLIP, easing: 'linear', fill: 'forwards' });
      const a = leaf.animate([{ transform: 'translateZ(.004em) rotateX(0deg)' }, { transform: 'translateZ(.004em) rotateX(352deg)' }], { duration: FLIP, easing: 'cubic-bezier(.5,.05,.2,1)', fill: 'forwards' });
      $('.cal__shade', face).animate([{ opacity: 0 }, { opacity: .45, offset: .2 }, { opacity: 0, offset: .275 }, { opacity: 0 }], { duration: FLIP, easing: 'linear', fill: 'forwards' });
      $('.cal__shade', under).animate([{ opacity: .7 }, { opacity: 0 }], { duration: FLIP * .9, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'forwards' });
      a.onfinish = () => {
        i = next;
        paint(face, i);
        leaf.getAnimations({ subtree: true }).forEach(x => x.cancel());
        cal.querySelectorAll('.cal__shade').forEach(sh => sh.getAnimations().forEach(x => x.cancel()));
        paint(under, (i + 1) % n);
        setTimeout(flip, HOLD);
      };
    }

    const start = () => { if (started) return; started = true; setTimeout(flip, 950); };
    if (document.body.classList.contains('ready')) start();
    else addEventListener('intro:ready', start, { once: true });
  })();

  /* ---------- LiquidReveal on Hero Portrait Stage ---------- */
  (function initPortraitReveal() {
    const stage = $('#fig'), canvas = $('#figCanvas'), base = $('#figBase');
    if (!stage || !canvas || !base) return;
    if (reduced || matchMedia('(max-width: 1023.98px), (hover: none)').matches) { canvas.remove(); return; }
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const colC = document.createElement('canvas'), colX = colC.getContext('2d');
    const mask = document.createElement('canvas'), mX = mask.getContext('2d');
    let W = 1, H = 1, radius = 140 * dpr, idle = 999, running = false, last = null;
    const points = [];

    function paintWarmColorLayer() {
      if (!base.naturalWidth) return;
      colX.clearRect(0, 0, W, H);
      const s = Math.min(W / base.naturalWidth, H / base.naturalHeight);
      const dw = base.naturalWidth * s, dh = base.naturalHeight * s;
      const dx = (W - dw) / 2, dy = H - dh;
      colX.save();
      colX.filter = 'contrast(1.06) saturate(1.22) brightness(1.03)';
      colX.drawImage(base, dx, dy, dw, dh);
      colX.restore();
    }
    function measure() {
      const r = stage.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      for (const c of [canvas, colC, mask]) { c.width = W; c.height = H; }
      radius = 140 * dpr;
      paintWarmColorLayer();
    }
    if (base.complete) paintWarmColorLayer();
    base.addEventListener('load', paintWarmColorLayer);
    new ResizeObserver(measure).observe(stage);
    measure();

    function stamp(x, y) {
      const g = mX.createRadialGradient(x, y, 0, x, y, radius);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(.55, 'rgba(255,255,255,.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      mX.globalCompositeOperation = 'source-over';
      mX.fillStyle = g;
      mX.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    function frame() {
      const drawing = points.length > 0;
      idle = drawing ? 0 : idle + 1;
      if (idle >= 100) { ctx.clearRect(0, 0, W, H); mX.clearRect(0, 0, W, H); running = false; return; }
      const fade = drawing ? 0.02 : Math.min(0.02 + idle * 0.005, 0.5);
      mX.globalCompositeOperation = 'destination-out';
      mX.fillStyle = `rgba(0,0,0,${fade})`;
      mX.fillRect(0, 0, W, H);
      if (drawing) { for (const p of points) stamp(p.x, p.y); points.length = 0; }
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(colC, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(mask, 0, 0);
      requestAnimationFrame(frame);
    }
    addEventListener('pointermove', e => {
      if (!base.naturalWidth) return;
      const r = stage.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr, y = (e.clientY - r.top) * dpr;
      if (x < -radius || y < -radius || x > W + radius || y > H + radius) { last = null; return; }
      if (last) {
        const dx = x - last.x, dy = y - last.y, dist = Math.hypot(dx, dy);
        const step = Math.max(radius * .3, 1), n = Math.min(Math.ceil(dist / step), 40);
        for (let i = 1; i <= n; i++) points.push({ x: last.x + dx * i / n, y: last.y + dy * i / n });
      } else points.push({ x, y });
      last = { x, y };
      if (!running) { running = true; idle = 0; requestAnimationFrame(frame); }
    }, { passive: true });
  })();

  /* ---------- Doors Engine (Desktop Hover Reveal + Mobile Pin + Walk-Through Portal) ---------- */
  (function doors() {
    const ROUTES = ['power-bi/', 'sql-analytics/', 'machine-learning/', 'genai-agents/', 'system-terminal/'];
    const SLUGS = ['power-bi', 'sql-analytics', 'machine-learning', 'genai-agents', 'system-terminal'];
    const TITLES = ['Power BI & BI', 'SQL Architecture', 'Machine Learning', 'GenAI & Agents', 'Open Source & CLI'];
    const INFO = [
      ['Power BI & BI', 'Star Schema · 10,000+ Sales Rows', ['10,000+ sales rows modeled', 'Star-schema tables & DAX', 'Time-intelligence YoY KPIs', 'Retention & margin drilldowns', 'Live telemetry simulator']],
      ['SQL Architecture', 'From 3NF Schemas to 500k EDA', ['6-table 3NF MySQL schema', 'Recursive CTEs & windows', '500,000+ Prodigy records audited', 'COALESCE & outlier pruning', 'Interactive MySQL query runner']],
      ['Machine Learning', '22-Class Crop Classification', ['Scikit-learn & XGBoost pipelines', '22-class Crop Recommendation', '5-fold cross-validation', 'IQR & Z-score scaling', 'Live Soil N-P-K predictor']],
      ['GenAI & Agents', 'Multi-PDF RAG · LangGraph', ['Multi-PDF Vector RAG suite', 'Gemini API dense embeddings', 'AI Travel Planner (Groq LPU)', 'Serper real-time search tools', 'thingQbator enterprise chatbot']],
      ['Open Source & CLI', '34+ Repos · DP-Systems Shell', ['Interactive DP-Systems CLI (~$)', '34+ public GitHub repos', 'TATA, Deloitte & TechWar 2026', 'Verified timeline 2019–2026', '3 tailored PDF resumes']]
    ];

    const sec = $('#works');
    if (!sec) return;
    const units = [...sec.querySelectorAll('.unit')];
    const veil = $('#veil'), wallv = $('#wallv');
    const ANG = 70, ANG_WALK = 70;
    let busy = false;

    const doorsState = units.map(u => {
      const door = $('.door', u);
      const s = spring({ tension: 120, friction: 14 }, o => {
        door.style.transform = `rotateY(${Math.max(0, o) * ANG}deg)`;
        u.style.setProperty('--o', Math.max(0, o).toFixed(4));
      });
      return { u, door, s, way: $('.doorway', u) };
    });

    if ('IntersectionObserver' in window && !reduced) {
      sec.classList.add('pre');
      const io = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) {
          sec.classList.add('in');
          requestAnimationFrame(() => sec.classList.remove('pre'));
          io.disconnect();
        }
      }, { threshold: .15 });
      io.observe(sec);
    }

    const badge = $('#doorCursor');
    let over = false;
    const placeBadge = e => { badge.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`; };
    const showBadge = on => { over = on; badge.classList.toggle('on', on); };
    if (canHover && badge) {
      addEventListener('pointermove', e => { if (over) placeBadge(e); }, { passive: true });
      units.forEach(u => {
        const w = $('.doorway', u);
        w.addEventListener('pointerenter', e => { placeBadge(e); if (!busy) showBadge(true); });
        w.addEventListener('pointerleave', () => showBadge(false));
      });
    }

    const frames = [], ready = [], warmed = new Set();
    let frame = null, frameReady = false, cur = 0, inWall = false, pushed = false;
    function loadRoom(i) {
      if (frames[i]) return;
      const f = document.createElement('iframe');
      f.src = ROUTES[i] + '?embed=1&theme=' + getMode();
      f.title = TITLES[i];
      f.tabIndex = -1;
      f.addEventListener('load', () => {
        ready[i] = true;
        if (i === cur) frameReady = true;
        try { f.contentWindow?.postMessage({ wall: 'mode', mode: getMode(), theme: getMode() }, '*'); } catch (e) {}
      }, { once: true });
      frames[i] = f;
      wallv.appendChild(f);
    }
    const warm = i => { if (!warmed.has(i)) { warmed.add(i); loadRoom(i); } };
    const pick = i => { cur = i; frame = frames[i]; frameReady = !!ready[i]; frames.forEach((f, k) => f && f.classList.toggle('cur', k === i)); };

    if ('IntersectionObserver' in window) {
      const near = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) {
          near.disconnect();
          setTimeout(() => [0, 1, 2, 3].forEach(warm), 600);
        }
      }, { rootMargin: '240px' });
      near.observe(sec);
    }

    const lift = () => { if (!sec.classList.contains('lift')) sec.classList.add('lift'); };
    sec.addEventListener('pointerenter', lift);
    doorsState.forEach((d, i) => {
      d.way.addEventListener('focus', () => { lift(); warm(i); });
      d.way.addEventListener('pointerenter', () => warm(i));
      if (canHover) {
        d.way.addEventListener('mouseenter', () => { if (!busy) d.s.set(.1); });
        d.way.addEventListener('mouseleave', () => { if (!busy) d.s.set(0); });
      }
      d.way.addEventListener('click', () => enter(i));
    });

    const dinfo = $('#dinfo'), wallEl = $('.doors__wall', sec), MOB = matchMedia('(max-width: 639.98px)');
    const setInfo = i => {
      dinfo.querySelector('.dinfo__h').textContent = INFO[i][0];
      dinfo.querySelector('.dinfo__t').textContent = INFO[i][1];
      dinfo.querySelector('.dinfo__p').innerHTML = INFO[i][2].map(s => `<li>${s}</li>`).join('');
    };

    if (canHover && dinfo && wallEl) {
      let active = -1, token = 0, px = -1, py = -1;
      const show = i => {
        const my = ++token;
        units.forEach((u, k) => u.classList.toggle('on', k === i));
        sec.classList.add('focus');
        const visible = units.filter(u => getComputedStyle(u).visibility !== 'hidden');
        const vi = visible.indexOf(units[i]);
        if (vi < 0) return;
        const wr = wallEl.getBoundingClientRect(), r = units[i].getBoundingClientRect();
        const toRight = vi < 2 && visible[vi + 2];
        const a = toRight ? visible[vi + 1].getBoundingClientRect() : (visible[vi - 2] || visible[vi - 1]).getBoundingClientRect();
        const b = toRight ? visible[vi + 2].getBoundingClientRect() : visible[vi - 1].getBoundingClientRect();
        const left = Math.min(a.left, b.left), right = Math.max(a.right, b.right);
        const place = () => {
          if (my !== token || active !== i) return;
          setInfo(i);
          const w = Math.min(right - left, 22 * 16);
          dinfo.style.width = w + 'px';
          dinfo.style.left = (left - wr.left + (right - left - w) / 2) + 'px';
          dinfo.style.top = (r.top - wr.top + r.height * .5 - dinfo.offsetHeight / 2) + 'px';
          dinfo.classList.add('on');
        };
        if (dinfo.classList.contains('on')) { dinfo.classList.remove('on'); setTimeout(place, 120); } else place();
      };
      const hide = () => { token++; sec.classList.remove('focus'); units.forEach(u => u.classList.remove('on')); dinfo.classList.remove('on'); };
      const set = i => { if (busy) i = -1; if (i === active) return; active = i; if (i < 0) hide(); else show(i); };
      const under = el => { const w = el && el.closest ? el.closest('.doorway') : null; return w ? units.findIndex(u => u.contains(w)) : -1; };
      addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; set(under(e.target)); }, { passive: true });
      addEventListener('scroll', () => { if (px >= 0) set(under(document.elementFromPoint(px, py))); }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => set(-1));
      addEventListener('blur', () => set(-1));
      window.__doorHover = set;
    }

    /* Mobile Doors Sticky Carousel */
    const mRow = $('.doors__row', sec), mPin = $('.doors__pin', sec), mDots = $('.doors__dots', sec);
    let mIdx = 0, mForce = -1, mShown = -1, mCur = 0, mRaf = 0, mLast = 0, mSettle = 0, swipeLock = 0;
    const mSpan = () => Math.max(1, sec.offsetHeight - innerHeight);
    const mobY = i => sec.getBoundingClientRect().top + pageYOffset + (Math.min(3, Math.max(0, i)) / 3) * mSpan();
    const mDwell = f => { const i = Math.floor(f), t = f - i, u = Math.min(1, Math.max(0, (t - .2) / .6)); return i + u * u * (3 - 2 * u); };
    const mProgress = () => Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / mSpan()));
    const mTarget = () => mForce >= 0 ? mForce : mDwell(mProgress() * 3);

    function mShow(i) {
      if (i === mShown) return;
      mShown = i; setInfo(i);
      mDots?.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === Math.min(3, i)));
    }
    function mFrame(now) {
      mRaf = 0;
      if (!MOB.matches) { mRow.style.transform = ''; return; }
      const dt = Math.min(64, now - (mLast || now)); mLast = now;
      const t = mTarget();
      mCur = reduced ? t : mCur + (t - mCur) * Math.min(1, dt / 1000 * 10);
      mCur = Math.max(t - 1, Math.min(t + 1, mCur));
      if (Math.abs(t - mCur) < .001) mCur = t;
      const step = units[1].offsetLeft - units[0].offsetLeft;
      mRow.style.transform = `translate3d(${(-mCur * step).toFixed(2)}px,0,0)`;
      mIdx = Math.round(t); mShow(mForce >= 0 ? mForce : mIdx);
      if (mCur !== t) mRaf = requestAnimationFrame(mFrame);
    }
    function mApply() { if (!mRaf) mRaf = requestAnimationFrame(mFrame); }
    function mSize() {
      if (!MOB.matches) { mPin.style.removeProperty('--uw'); sec.classList.remove('compact'); return; }
      const fit = () => {
        const pr = mPin.getBoundingClientRect(), rr = mRow.getBoundingClientRect();
        const avail = pr.bottom - rr.top - parseFloat(getComputedStyle(mRow).paddingTop) - 2;
        return Math.min(innerWidth * .6, avail / 2.25);
      };
      sec.classList.remove('compact');
      let w = fit();
      if (w < 150) { sec.classList.add('compact'); w = fit(); }
      mPin.style.setProperty('--uw', Math.max(110, w).toFixed(1) + 'px');
      mApply();
    }
    mSize(); addEventListener('resize', mSize); document.fonts?.ready.then(mSize);
    function mFromScroll() {
      if (!MOB.matches || busy) return;
      mApply();
      clearTimeout(mSettle);
      mSettle = setTimeout(function settle() {
        if (window.__touching) { mSettle = setTimeout(settle, 120); return; }
        if (busy || mForce >= 0 || performance.now() < swipeLock) return;
        const r = sec.getBoundingClientRect();
        if (r.top > 0 || r.bottom < innerHeight) return;
        const want = mobY(Math.round(mProgress() * 3));
        if (Math.abs(pageYOffset - want) > 2) window.__snapTo(want);
      }, 220);
    }
    addEventListener('scroll', mFromScroll, { passive: true });
    let tx0 = 0, ty0 = 0, i0 = 0;
    sec.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; i0 = Math.round(mProgress() * 3); }, { passive: true });
    sec.addEventListener('touchend', e => {
      if (!MOB.matches || busy || mForce >= 0) return;
      const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      const to = Math.min(3, Math.max(0, i0 + (dx < 0 ? 1 : -1)));
      swipeLock = performance.now() + 700;
      window.__snapTo(mobY(to));
    }, { passive: true });
    if (MOB.matches) { mShow(0); dinfo.classList.add('on'); mCur = mTarget(); mApply(); }
    MOB.addEventListener?.('change', () => { mForce = -1; mShown = -1; mFromScroll(); mApply(); if (MOB.matches) dinfo.classList.add('on'); });

    const SECRET = 4, secretUnit = units[SECRET];
    function reveal(on) {
      sec.classList.toggle('reveal', on);
      if (secretUnit) { if (on) secretUnit.removeAttribute('inert'); else secretUnit.setAttribute('inert', ''); }
    }

    window.openDoor = i => {
      if (busy || inWall) return;
      const top = MOB.matches ? mobY(Math.min(i, 3)) : sec.getBoundingClientRect().top + pageYOffset;
      if (Math.abs(pageYOffset - top) > 4) scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      const t0 = performance.now();
      warm(i);
      const settle = () => {
        if (Math.abs(pageYOffset - top) > 24 && performance.now() - t0 < 1200) return requestAnimationFrame(settle);
        let wait = 0;
        if (MOB.matches) {
          const want = i === SECRET ? SECRET : i, before = mForce >= 0 ? mForce : mIdx;
          if (i === SECRET) { reveal(true); mForce = SECRET; } else mIdx = i;
          mApply();
          if (want !== before) wait = reduced ? 0 : 480;
        } else if (i === SECRET && !sec.classList.contains('reveal')) { reveal(true); wait = reduced ? 0 : 750; }
        setTimeout(() => enter(i), wait);
      };
      requestAnimationFrame(settle);
    };

    const swallow = e => e.preventDefault();
    const keysStop = e => { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'].includes(e.key) && !inWall) e.preventDefault(); };
    function holdScroll(on) {
      if (on) { addEventListener('wheel', swallow, { passive: false }); addEventListener('touchmove', swallow, { passive: false }); addEventListener('keydown', keysStop); }
      else { removeEventListener('wheel', swallow); removeEventListener('touchmove', swallow); removeEventListener('keydown', keysStop); }
    }

    let walkRaf = 0, afterLeave = null;
    const DOC_TITLE = document.title;

    function enter(i) {
      if (busy) return;
      busy = true; warm(i); lift(); showBadge(false);
      window.__doorHover?.(-1);
      sec.classList.remove('focus'); units.forEach(u => u.classList.remove('on')); dinfo.classList.remove('on');
      const d = doorsState[i];
      doorsState.forEach((o, k) => { if (k !== i) o.s.set(0); });
      d.u.classList.add('press');
      setTimeout(() => d.u.classList.remove('press'), 350);
      setTimeout(() => d.s.set(ANG_WALK / ANG), reduced ? 0 : 150);
      setTimeout(() => through(i), reduced ? 0 : 680);
    }

    function through(i) {
      const u = units[i];
      const r = $('.opening', u).getBoundingClientRect(), dr = $('.door', u).getBoundingClientRect();
      const gapL = Math.min(Math.max(dr.right, r.left), r.right - 6);
      const gw = Math.max(r.right - gapL, 10), gh = r.height;
      const cx = (gapL + r.right) / 2, cy = r.top + gh * .5;
      holdScroll(true);
      $('#cord')?.classList.add('away'); $('.hdr')?.classList.add('away');
      const sr = sec.getBoundingClientRect();
      sec.style.transformOrigin = `${cx - sr.left}px ${cy - sr.top}px`;
      sec.classList.add('through');
      const tx = innerWidth / 2 - cx, ty = innerHeight / 2 - cy;
      const sEnd = Math.max(innerWidth / gw, innerHeight / gh) * 1.15;
      const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const zoomOf = e => Math.exp(Math.log(sEnd) * e);
      const t0 = performance.now(), D = reduced ? 1 : 1200;
      let handed = false;
      const step = now => {
        const p = Math.min(1, (now - t0) / D), e = ease(p), sc = zoomOf(e), f = Math.min(1, e * 1.6);
        sec.style.transform = `translate(${tx * f}px, ${ty * f}px) scale(${sc})`;
        if (!handed && (sc >= sEnd / 1.15 || p >= 1)) { handed = true; handoff(); }
        if (p < 1) walkRaf = requestAnimationFrame(step);
      };
      walkRaf = requestAnimationFrame(step);

      function handoff() {
        pick(i);
        if (frameReady) {
          wallv.classList.add('on');
          setTimeout(() => {
            inWall = true; wallv.classList.add('live');
            try { history.pushState({ wall: 1 }, '', ROUTES[i]); pushed = true; } catch (e) { pushed = false; }
            document.title = TITLES[i] + ' — Dev Patel';
            try { frame.contentWindow?.postMessage({ wall: 'enter', mode: getMode(), theme: getMode() }, '*'); frame.contentWindow?.focus(); } catch (e) {}
          }, 0);
        } else {
          veil.className = 'veil veil--glow'; veil.style.clipPath = 'none'; veil.hidden = false;
          requestAnimationFrame(() => { location.href = ROUTES[i]; });
        }
      }
    }

    function leaveWall() {
      if (!inWall) return;
      inWall = false;
      wallv.classList.remove('live');
      document.title = DOC_TITLE;
      try { frame?.contentWindow?.postMessage({ wall: 'exit' }, '*'); } catch (e) {}
      setTimeout(() => {
        wallv.classList.remove('on');
        setTimeout(() => {
          cancelAnimationFrame(walkRaf);
          const from = sec.style.transform;
          const m = /translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([\d.]+)\)/.exec(from) || [0, 0, 0, 1];
          const X = +m[1], Y = +m[2], S = +m[3], t0 = performance.now(), D = reduced ? 1 : 900;
          const ease = x => 1 - Math.pow(1 - x, 3);
          const step = now => {
            const p = Math.min(1, (now - t0) / D), e = ease(p);
            const sc = Math.exp(Math.log(S) * (1 - e));
            sec.style.transform = `translate(${X * (1 - e)}px, ${Y * (1 - e)}px) scale(${sc})`;
            if (p < 1) requestAnimationFrame(step);
            else {
              sec.style.transform = '';
              sec.classList.remove('through', 'lift'); sec.style.transformOrigin = '';
              doorsState[cur].s.set(0);
              $('#cord')?.classList.remove('away'); $('.hdr')?.classList.remove('away');
              busy = false; holdScroll(false);
              if (afterLeave) { const f = afterLeave; afterLeave = null; setTimeout(f, 60); }
              if (cur === SECRET) {
                if (MOB.matches) { mForce = -1; mFromScroll(); mApply(); setTimeout(() => reveal(false), reduced ? 0 : 480); }
                else setTimeout(() => reveal(false), reduced ? 0 : 400);
                units[SECRET - 1].querySelector('.doorway').focus({ preventScroll: true });
              } else doorsState[cur].way.focus({ preventScroll: true });
            }
          };
          requestAnimationFrame(step);
        }, reduced ? 0 : 180);
      }, reduced ? 0 : 240);
    }

    addEventListener('message', e => {
      if (e.source !== frame?.contentWindow || !e.data) return;
      if (e.data.wall === 'go') {
        if (typeof e.data.switchDoor === 'number' && e.data.switchDoor !== cur) {
          const targetIdx = e.data.switchDoor;
          afterLeave = () => window.openDoor(targetIdx);
        } else if (e.data.to) {
          const to = String(e.data.to);
          if (to === 'contact') { openModal(); return; }
          const n = to.startsWith('door:') ? +to.slice(5) : -1;
          if (n === cur) return;
          afterLeave = () => { if (n >= 0) window.openDoor(n); else scrollToId(to === 'about' ? 'about' : 'home'); };
        }
      } else if (e.data.wall !== 'close') return;
      if (pushed) { pushed = false; history.back(); } else leaveWall();
    });
    addEventListener('popstate', () => { if (inWall && !(history.state && history.state.wall)) { pushed = false; leaveWall(); } });
    addEventListener('keydown', e => { if (e.key === 'Escape' && inWall && modal.hidden && navm.hidden) { if (pushed) { pushed = false; history.back(); } else leaveWall(); } });
    new MutationObserver(() => frames.forEach(f => {
      try { f?.contentWindow?.postMessage({ wall: 'mode', mode: getMode(), theme: getMode() }, '*'); } catch (e) {}
    })).observe(root, { attributes: true, attributeFilter: ['data-mode'] });

    const hashSlug = SLUGS.indexOf(decodeURIComponent(location.hash.slice(1)));
    if (hashSlug >= 0) {
      addEventListener('intro:ready', () => { warm(hashSlug); setTimeout(() => window.openDoor(hashSlug), 500); }, { once: true });
    }
  })();

  /* ---------- Story Odometer, Progress Rail & Reverse Clock Tunnel ---------- */
  (function story() {
    const sec = $('.story');
    if (!sec) return;
    const line = $('.story__line', sec), list = $('.story__list', sec);
    const chs = [...list.querySelectorAll('.ch')], N = chs.length;
    const cols = [...sec.querySelectorAll('.dg__c')], when = $('.story__when', sec), count = $('.story__count', sec);
    const rail = $('.story__rail', sec), cv = $('.story__bg', sec), ctx = cv?.getContext('2d');
    let shownYear = '', shown = -1;

    const setYear = y => {
      if (y === shownYear) return; shownYear = y;
      String(y).split('').forEach((d, k) => cols[k] && cols[k].style.setProperty('--d', d));
    };
    const show = i => {
      if (i === shown) return; shown = i;
      chs.forEach((c, k) => c.classList.toggle('on', k === i));
      setYear(chs[i].dataset.y);
      when.textContent = chs[i].dataset.when;
      count.textContent = String(i + 1).padStart(2, '0');
      sec.dataset.ch = i;
    };

    let W = 0, H = 0, dpr = 1, rgb = '232,228,224';
    const size = () => { if (!cv) return; dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; };
    const readRgb = () => { rgb = (getComputedStyle(root).getPropertyValue('--fg-rgb') || '232,228,224').trim(); };
    new MutationObserver(readRgb).observe(root, { attributes: true, attributeFilter: ['data-mode'] });

    const RINGS = 16, GAP = 340, FOCAL = 520, R = 620, TICKS = 60;
    function tunnel(p) {
      if (!ctx || !W) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W * .5, cy = H * .55, k = Math.min(W, H) / 900;
      const camZ = p * (N - 1) * GAP * 1.6, spin = -p * Math.PI * 1.5, len = RINGS * GAP;
      ctx.lineCap = 'round';
      for (let i = 0; i < RINGS; i++) {
        const z = ((i * GAP - camZ) % len + len) % len + 60;
        const s = FOCAL / z * k, fog = Math.min(1, Math.max(0, (z - 260) / 1100)) * Math.max(0, 1 - z / len);
        if (fog <= .01) continue;
        const rr = R * s, rot = spin + i * .21;
        ctx.strokeStyle = `rgba(${rgb},${(fog * .11).toFixed(3)})`; ctx.lineWidth = Math.max(.5, 1.2 * s);
        ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
        const T = 36, every = 3;
        for (const hour of [false, true]) {
          const l = (hour ? 44 : 16) * s;
          ctx.beginPath();
          for (let j = 0; j < T; j++) {
            if ((j % every === 0) !== hour) continue;
            const a = rot + j / T * Math.PI * 2, c = Math.cos(a), d = Math.sin(a);
            ctx.moveTo(cx + c * (rr - l), cy + d * (rr - l));
            ctx.lineTo(cx + c * rr, cy + d * rr);
          }
          ctx.strokeStyle = `rgba(${rgb},${(fog * (hour ? .26 : .12)).toFixed(3)})`;
          ctx.lineWidth = Math.max(.5, (hour ? 2.6 : 1.2) * s);
          ctx.stroke();
        }
      }
    }

    let firstY = 0, lastY = 0, endY = 0, raf = 0;
    const measure = () => {
      const mark = c => list.offsetTop + c.offsetTop + c.firstElementChild.offsetTop + 8;
      firstY = mark(chs[0]);
      lastY = mark(chs[N - 1]);
      endY = list.offsetTop + chs[N - 1].offsetTop + chs[N - 1].offsetHeight - 16;
      [rail, $('.story__dtrack', sec), $('.story__ttrack', sec)].forEach(el => {
        if (el) { el.style.setProperty('--r0', firstY + 'px'); el.style.setProperty('--rh', Math.max(40, endY - firstY) + 'px'); }
      });
      if (innerWidth >= 1024) size();
    };
    function update() {
      raf = 0;
      const lr = line.getBoundingClientRect(), mid = innerHeight * .5;
      const y = Math.min(lastY, Math.max(firstY, mid - lr.top));
      const p = (y - firstY) / Math.max(1, lastY - firstY);
      sec.style.setProperty('--p', p.toFixed(4));
      let i = 0;
      for (let k = 0; k < N; k++) if (lr.top + list.offsetTop + chs[k].offsetTop < mid + 40) i = k;
      show(i);
      if (innerWidth >= 1024 && !reduced) tunnel(p);
    }
    const q = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', q, { passive: true });
    addEventListener('resize', () => { measure(); q(); });
    new MutationObserver(() => { readRgb(); q(); }).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
    readRgb(); measure(); show(0); update();
    document.fonts?.ready.then(() => { measure(); q(); });
  })();

  /* ---------- Footer Wordmark & Back to Top Ring ---------- */
  (function footerAndTop() {
    const fitWord = () => document.querySelectorAll('.sf').forEach(f => {
      const w = f.querySelector('.sf__word'); if (!w) return;
      const span = [...w.children].find(s => getComputedStyle(s).display !== 'none'); if (!span) return;
      w.style.setProperty('--wf', '100px');
      const k = (f.clientWidth * .95) / Math.max(1, span.getBoundingClientRect().width);
      f.style.setProperty('--wf', (100 * k).toFixed(2) + 'px');
      w.style.removeProperty('--wf');
    });
    fitWord(); addEventListener('resize', fitWord); document.fonts?.ready.then(fitWord);

    const sfw = $('.sfw');
    const above = () => {
      if (!sfw) return;
      const prev = sfw.previousElementSibling;
      const bg = getComputedStyle(document.body).backgroundColor;
      sfw.style.setProperty('--above', prev ? getComputedStyle(document.body).backgroundColor : bg);
      sfw.classList.toggle('sfw--dark', getMode() === 'dark');
    };
    above(); addEventListener('resize', above);
    new MutationObserver(above).observe(root, { attributes: true, attributeFilter: ['data-mode'] });

    const tt = $('#totop');
    if (tt) {
      tt.style.setProperty('--len', (2 * Math.PI * 24).toFixed(2));
      let raf = 0;
      const upd = () => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight, y = scrollY;
        const bot = $('.sf__bot');
        tt.classList.toggle('show', y > innerHeight * .75 && !(bot && bot.getBoundingClientRect().top < innerHeight - 8));
        tt.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
        tt.dataset.on = getMode() === 'dark' ? 'dark' : 'light';
      };
      const q = () => { if (!raf) raf = requestAnimationFrame(upd); };
      addEventListener('scroll', q, { passive: true });
      addEventListener('resize', q);
      new MutationObserver(q).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
      upd();
      tt.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
    }
    $('#sfTop')?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
  })();

  /* ---------- Ability Card 3D Tilt & Flip (#holo) ---------- */
  (function abilityCard() {
    const layer = $('#holo'), open = $('#holoOpen'), fig = $('#fig'), hc = $('#hc');
    if (!layer || !hc) return;
    let isOpen = false, tx = 0, ty = 0, cx = 0, cy = 0, held = false, loop = 0, t0 = 0;
    const RX = 11, RY = 14;
    const clamp = v => Math.max(-1, Math.min(1, v));

    function step(now) {
      const sway = (held || reduced) ? 0 : 1, t = (now - t0) / 1000;
      cx += ((tx + sway * Math.sin(t * .62) * .34) - cx) * .12;
      cy += ((ty + sway * Math.sin(t * .47 + 1.1) * .22) - cy) * .12;
      hc.style.setProperty('--px', cx.toFixed(4));
      hc.style.setProperty('--py', cy.toFixed(4));
      hc.style.setProperty('--ry', (cx * RY).toFixed(2) + 'deg');
      hc.style.setProperty('--rx', (-cy * RX).toFixed(2) + 'deg');
      hc.style.setProperty('--lift', Math.min(1, Math.hypot(cx, cy) * 1.3).toFixed(3));
      loop = requestAnimationFrame(step);
    }
    const spin = on => { cancelAnimationFrame(loop); loop = 0; if (on) { t0 = performance.now(); loop = requestAnimationFrame(step); } };

    function show() {
      isOpen = true;
      hc.classList.remove('flip');
      openLayer(layer, hide);
      spin(true);
      startSparks(true);
      setTimeout(() => hc.focus(), 100);
    }
    function hide() {
      isOpen = false; spin(false); startSparks(false);
      closeLayer(layer, () => open?.focus());
    }

    const sparkCv = $('#holoSparks');
    const sparkCtx = sparkCv?.getContext?.('2d');
    const motes = Array.from({ length: 44 }, (_, idx) => ({
      x: (idx * 73) % 100 / 100,
      y: (idx * 37) % 100 / 100,
      r: 0.9 + (idx % 4) * 0.65,
      vy: 0.014 + (idx % 5) * 0.006,
      vx: ((idx % 3) - 1) * 0.005,
      a: 0.28 + (idx % 4) * 0.16,
      ph: idx * 0.8
    }));
    let sparkRaf = 0, sparkLast = 0;
    function startSparks(on) {
      cancelAnimationFrame(sparkRaf); sparkRaf = 0;
      if (!on || !sparkCtx || reduced) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const fit = () => {
        if (!sparkCv) return;
        sparkCv.width = Math.max(1, Math.round(innerWidth * dpr));
        sparkCv.height = Math.max(1, Math.round(innerHeight * dpr));
      };
      fit();
      sparkLast = performance.now();
      sparkRaf = requestAnimationFrame(function drawSparks(now) {
        if (!isOpen) return;
        const dt = Math.min(.05, (now - sparkLast) / 1000); sparkLast = now;
        const w = sparkCv.width, h = sparkCv.height;
        sparkCtx.clearRect(0, 0, w, h);
        for (const m of motes) {
          m.y -= m.vy * dt; m.x += (m.vx + Math.sin(now * .0008 + m.ph) * .004) * dt;
          if (m.y < -0.05) { m.y = 1.05; }
          if (m.x < 0) m.x += 1; if (m.x > 1) m.x -= 1;
          const tw = 0.65 + 0.35 * Math.sin(now * .002 + m.ph);
          const x = m.x * w, y = m.y * h, r = m.r * dpr;
          const g = sparkCtx.createRadialGradient(x, y, 0, x, y, r * 2.4);
          g.addColorStop(0, `rgba(255, 224, 152, ${(m.a * tw).toFixed(3)})`);
          g.addColorStop(1, 'rgba(255, 200, 110, 0)');
          sparkCtx.fillStyle = g;
          sparkCtx.beginPath(); sparkCtx.arc(x, y, r * 2.4, 0, Math.PI * 2); sparkCtx.fill();
        }
        sparkRaf = requestAnimationFrame(drawSparks);
      });
    }

    layer.addEventListener('pointermove', e => {
      const r = hc.getBoundingClientRect(); if (!r.width) return;
      const u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      if (u < -.35 || u > 1.35 || v < -.35 || v > 1.35) { held = false; tx = ty = 0; return; }
      held = true; tx = clamp((u - .5) * 2); ty = clamp((v - .5) * 2);
    }, { passive: true });
    layer.addEventListener('pointerleave', () => { held = false; tx = ty = 0; });

    let from = null;
    hc.addEventListener('pointerdown', e => { from = [e.clientX, e.clientY]; });
    hc.addEventListener('pointerup', e => {
      if (from && Math.hypot(e.clientX - from[0], e.clientY - from[1]) < 10) hc.classList.toggle('flip');
      from = null;
    });
    layer.addEventListener('click', e => { if (e.target === layer) hide(); });
    open?.addEventListener('click', e => { e.stopPropagation(); show(); });
    fig?.addEventListener('click', e => { if (!e.target.closest('.fig__card')) show(); });
    $('#holoClose')?.addEventListener('click', hide);
    $('#holoResumes')?.addEventListener('click', () => { hide(); setTimeout(openResumeModal, 240); });
  })();

  /* ---------- PageLoader (Fast Stacked Pill Reveal) ---------- */
  (function pageLoader() {
    const loader = $('#loader');
    const seen = (() => { try { return sessionStorage.getItem('dev-seen'); } catch (e) { return null; } })();
    const hashJump = ['#works', '#about', '#contact'].includes(location.hash);
    if (!loader || reduced || seen || hashJump) {
      loader?.remove();
      document.body.classList.add('ready');
      requestAnimationFrame(() => {
        if (location.hash === '#contact') setTimeout(openModal, 350);
        else if (location.hash === '#works' || location.hash === '#about') scrollToId(location.hash.slice(1));
        dispatchEvent(new Event('intro:ready'));
      });
      return;
    }

    stopScroll();
    let done = false;
    const bailOut = () => {
      if (done) return; done = true;
      try { sessionStorage.setItem('dev-seen', '1'); } catch (e) {}
      loader.remove();
      document.body.classList.add('ready');
      startScroll();
      dispatchEvent(new Event('intro:ready'));
    };
    setTimeout(bailOut, 4000);

    const num = $('#ldCount'), pills = [...loader.querySelectorAll('.ld__pill')];
    const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const FILL = 540;
    let t0 = null;
    function tick(now) {
      if (done) return;
      if (t0 === null) t0 = now;
      const p = ease(Math.min(1, (now - t0) / FILL));
      loader.style.setProperty('--p', p.toFixed(3));
      pills.forEach((el, k) => el.classList.toggle('on', p >= k / 6 + .01 || p >= .98));
      num.textContent = String(Math.round(p * 100)).padStart(3, '0');
      if (p < 1) requestAnimationFrame(tick);
      else {
        setTimeout(() => {
          loader.classList.add('out');
          document.body.classList.add('ready');
          setTimeout(bailOut, 380);
        }, 140);
      }
    }
    requestAnimationFrame(tick);
  })();
})();
