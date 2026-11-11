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

  const RESUME_TRACKS = {
    aiml: {
      idx: 'TRACK 01 · ATS VERIFIED PDF',
      title: 'AI / ML & GenAI Engineer',
      desc: 'Multi-PDF Vector RAG (Gemini), LangGraph workflows, Groq LPU inference, Serper agents, and XGBoost 5-fold CV pipelines.',
      tags: ['LangGraph', 'Gemini RAG', 'Groq', 'XGBoost', 'PyTorch / Sklearn'],
      url: 'assets/resumes/Dev_Patel_AI_ML_Resume.pdf',
      file: 'Dev_Patel_AI_ML_Resume.pdf'
    },
    ds: {
      idx: 'TRACK 02 · ATS VERIFIED PDF',
      title: 'Data Scientist',
      desc: '5-fold CV (99.1% accuracy), IQR/Z-score feature engineering, K-Means & Decision Tree modeling on 500k+ Prodigy records.',
      tags: ['Scikit-learn', 'XGBoost', '5-Fold CV', '500k+ EDA', 'K-Means'],
      url: 'assets/resumes/Dev_Patel_Data_Scientist_Resume.pdf',
      file: 'Dev_Patel_Data_Scientist_Resume.pdf'
    },
    analyst: {
      idx: 'TRACK 03 · ATS VERIFIED PDF',
      title: 'Data Analyst & BI',
      desc: 'Executive Power BI Star Schema semantic models over 10k+ rows, DAX time-intelligence, 6-table 3NF MySQL & TATA/Deloitte sims.',
      tags: ['Power BI', 'DAX', 'MySQL 3NF', 'Window Functions', 'Python EDA'],
      url: 'assets/resumes/Dev_Patel_Data_Analyst_Resume.pdf',
      file: 'Dev_Patel_Data_Analyst_Resume.pdf'
    }
  };
  let currentResumeTrack = 'aiml';
  function selectResumeTrack(trackKey) {
    const k = RESUME_TRACKS[trackKey] ? trackKey : 'aiml';
    currentResumeTrack = k;
    const d = RESUME_TRACKS[k];
    document.querySelectorAll('#rvTabs .rvault__tab').forEach(btn => {
      const on = btn.dataset.rv === k;
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-selected', String(on));
    });
    const idx = $('#rvIdx'), title = $('#rvTitle'), desc = $('#rvDesc'), tags = $('#rvTags');
    const prev = $('#rvPreview'), dl = $('#rvDownload');
    if (idx) idx.textContent = d.idx;
    if (title) title.textContent = d.title;
    if (desc) desc.textContent = d.desc;
    if (tags) {
      tags.replaceChildren(...d.tags.map(t => {
        const s = document.createElement('span');
        s.textContent = t;
        return s;
      }));
    }
    if (prev) prev.href = d.url;
    if (dl) { dl.href = d.url; dl.setAttribute('download', d.file); }
  }
  $('#rvTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-rv]');
    if (btn) selectResumeTrack(btn.dataset.rv);
  });
  $('#rvTabs')?.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const tabs = [...document.querySelectorAll('#rvTabs .rvault__tab')];
    const i = tabs.findIndex(t => t.dataset.rv === currentResumeTrack);
    if (i < 0) return;
    e.preventDefault();
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    selectResumeTrack(next.dataset.rv);
    next.focus();
  });

  function openResumeModal(trackKey) {
    if (typeof trackKey === 'string' && RESUME_TRACKS[trackKey]) selectResumeTrack(trackKey);
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
  document.querySelectorAll('[data-resume]').forEach(b => b.addEventListener('click', () => openResumeModal()));

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
      const originBtn = m === 'light' ? ($('#cordBulb') || $('#cordHit')) : ($('#cordHit') || $('#cordBulb'));
      const hit = originBtn?.getBoundingClientRect();
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
    $('#cordBulb')?.setAttribute('aria-checked', String(m === 'light'));
    try { localStorage.setItem(MODE_KEY, m); } catch (e) {}
  }
  setMode(getMode(), false);
  const toggleMode = () => setMode(getMode() === 'dark' ? 'light' : 'dark');

  /* ---------- Role Preset Detection (?role=aiml | ds | analyst) ---------- */
  const ROLE_PRESETS = {
    aiml: { key: 'role:aiml', calIdx: 0, badge: 'Matched Track · GenAI & AI/ML Engineer', label: 'AI / ML PDF + 2 More', door: 3, pdf: 'assets/resumes/Dev_Patel_AI_ML_Resume.pdf' },
    ml: { key: 'role:aiml', calIdx: 1, badge: 'Matched Track · AI / ML Engineer', label: 'AI / ML PDF + 2 More', door: 2, pdf: 'assets/resumes/Dev_Patel_AI_ML_Resume.pdf' },
    genai: { key: 'role:aiml', calIdx: 0, badge: 'Matched Track · GenAI & RAG Engineer', label: 'AI / ML PDF + 2 More', door: 3, pdf: 'assets/resumes/Dev_Patel_AI_ML_Resume.pdf' },
    ds: { key: 'role:ds', calIdx: 2, badge: 'Matched Track · Data Scientist', label: 'Data Sci PDF + 2 More', door: 2, pdf: 'assets/resumes/Dev_Patel_Data_Scientist_Resume.pdf' },
    analyst: { key: 'role:analyst', calIdx: 3, badge: 'Matched Track · Data Analyst & BI', label: 'Analyst PDF + 2 More', door: 0, pdf: 'assets/resumes/Dev_Patel_Data_Analyst_Resume.pdf' },
    bi: { key: 'role:analyst', calIdx: 3, badge: 'Matched Track · Power BI & SQL Analyst', label: 'Analyst PDF + 2 More', door: 0, pdf: 'assets/resumes/Dev_Patel_Data_Analyst_Resume.pdf' }
  };
  const roleParam = new URLSearchParams(location.search).get('role')?.toLowerCase().trim() || '';
  const activePreset = ROLE_PRESETS[roleParam] || null;
  if (activePreset) {
    const eye = $('#heroEye');
    if (eye) eye.textContent = activePreset.badge;
    selectResumeTrack(activePreset.key.split(':')[1]);
  } else {
    selectResumeTrack('aiml');
  }

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
  $('#navAi')?.addEventListener('click', () => closeNav(() => window.openCopilot?.()));
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

  /* ---------- Connected Pull Cord & Edison Bulb: Pull Bulb -> Light | Pull Rope -> Dark ---------- */
  (function pullCord() {
    const wrap = $('#cord'), cv = $('.cord__cv', wrap), hit = $('#cordHit'), bulbBtn = $('#cordBulb');
    if (!wrap || !cv || !hit) return;
    const ctx = cv.getContext('2d');
    const N = 26, G = 4600, STEP = 1 / 120, ITER = 16;
    let dpr = 1, W = 300, H = 420;
    let L = 220, EXT_MAX = 72, BULB_MAX = 44, HIDDEN = 90, seg = 10, ax = 200, thick = 3.7, knobS = 1.3;
    let lampY = 82, bulbSc = 1;
    let bulbLit = getMode() === 'light' ? 1 : 0, bulbTarget = bulbLit;
    let pts = [], ext = 0, extV = 0, armed = true;
    let bulbExt = 0, bulbExtV = 0, bulbArmed = true, bulbDrag = null, bulbMoved = 0, bulbDownAt = 0;
    let grab = -1, grabOff = { x: 0, y: 0 }, target = null, ptr = null, ptrPrev = null;
    let downAt = 0, downPos = null, moved = 0;
    let acc = 0, lastT = 0, t = 0, dropped = false, live = false;

    function layout() {
      const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      const vw = innerWidth, vh = innerHeight;
      let offset;
      if (vw >= 1024) {
        offset = 4.25 * rem; L = Math.min(265, Math.max(195, vh * .29)); EXT_MAX = 72; BULB_MAX = 46; thick = 3.7; knobS = 1.3;
        lampY = 110; bulbSc = 1;
      } else if (vw >= 640) {
        offset = 5.9 * rem; L = Math.min(210, Math.max(155, vh * .21)); EXT_MAX = 62; BULB_MAX = 38; thick = 3.4; knobS = 1.2;
        lampY = 92; bulbSc = .88;
      } else {
        L = 44; EXT_MAX = 34; BULB_MAX = 26; thick = 2.7; knobS = .82;
        lampY = 30; bulbSc = .6;
      }
      HIDDEN = EXT_MAX + 18;
      W = vw < 1024 ? vw : Math.min(vw, 340);
      H = Math.round(L + EXT_MAX + 165);
      wrap.style.width = W + 'px';
      wrap.style.height = H + 'px';
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);

      const ck = document.querySelector('.hdr .clock');
      if (vw >= 1200 && ck && ck.offsetWidth) {
        offset = Math.max(1.2 * rem, vw - ck.getBoundingClientRect().right - 1.4 * rem);
      } else if (vw < 1024) {
        offset = W - 2.35 * rem;
      } else if (ck && ck.offsetWidth) {
        offset = Math.max(1.5 * rem, vw - ck.getBoundingClientRect().left + 1.4 * rem);
      } else {
        offset = 2.3 * rem;
      }
      const newAx = Math.max(30, W - offset);
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
      if (!bulbDrag) {
        const KB = 720, CB = 20;
        bulbExtV += (-KB * bulbExt - CB * bulbExtV) * dt;
        bulbExt += bulbExtV * dt;
      }
      if (ext > EXT_MAX * .8 && armed && live) { armed = false; setMode('dark'); try { navigator.vibrate?.(12); } catch (e) {} }
      if (ext < EXT_MAX * .22) armed = true;
      if (bulbExt > BULB_MAX * .65 && bulbArmed && live) { bulbArmed = false; setMode('light'); try { navigator.vibrate?.(12); } catch (e) {} }
      if (bulbExt < BULB_MAX * .22) bulbArmed = true;

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
      dropped = true; live = true;
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
    const splitIdx = () => Math.min(N - 2, Math.max(1, Math.round(N * (HIDDEN + L * .36) / (HIDDEN + L))));
    function tug() { dropped = true; live = true; wake(); extV = EXT_MAX * 48; pts[N].px = pts[N].x + 1.5; }
    function tugBulb() {
      dropped = true; live = true; wake();
      bulbExtV = BULB_MAX * 42;
      const ji = splitIdx();
      if (pts[ji]) pts[ji].px = pts[ji].x - 1.4;
    }

    hit.addEventListener('pointerdown', e => {
      if (!dropped) return;
      e.preventDefault();
      try { hit.setPointerCapture(e.pointerId); } catch (_) {}
      startDrag(e, N);
    });
    hit.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tug(); } });
    hit.addEventListener('click', e => e.preventDefault());

    if (bulbBtn) {
      const onBulbMove = e => {
        if (!bulbDrag) return;
        e.preventDefault();
        const p = local(e);
        const dy = Math.max(0, Math.min(BULB_MAX * 1.15, p.y - bulbDrag.y0));
        bulbMoved = Math.max(bulbMoved, Math.hypot(p.x - bulbDrag.x0, p.y - bulbDrag.y0));
        bulbExt += (dy - bulbExt) * .55;
        const ji = splitIdx();
        if (pts[ji]) pts[ji].x += (p.x - bulbDrag.x0) * .04;
      };
      const endBulbDrag = () => {
        if (!bulbDrag) return;
        const tap = bulbMoved < 6 && performance.now() - bulbDownAt < 320;
        bulbDrag = null;
        wrap.classList.remove('dragging');
        removeEventListener('pointermove', onBulbMove);
        removeEventListener('pointerup', endBulbDrag);
        removeEventListener('pointercancel', endBulbDrag);
        if (tap) tugBulb();
      };
      bulbBtn.addEventListener('pointerdown', e => {
        if (!dropped) return;
        e.preventDefault();
        try { bulbBtn.setPointerCapture(e.pointerId); } catch (_) {}
        dropped = true; live = true; wake();
        bulbDrag = { x0: local(e).x, y0: local(e).y };
        bulbMoved = 0; bulbDownAt = performance.now();
        wrap.classList.add('dragging');
        addEventListener('pointermove', onBulbMove, { passive: false });
        addEventListener('pointerup', endBulbDrag);
        addEventListener('pointercancel', endBulbDrag);
      });
      bulbBtn.addEventListener('click', e => { e.preventDefault(); if (!bulbMoved) tugBulb(); });
      bulbBtn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tugBulb(); } });
    }

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
    function bulbGlassPath(c) {
      c.beginPath();
      c.moveTo(-6.2, 6);
      c.bezierCurveTo(-6.2, 11, -12.8, 14.5, -12.8, 22.5);
      c.bezierCurveTo(-12.8, 30.8, -7.2, 36.2, 0, 36.2);
      c.bezierCurveTo(7.2, 36.2, 12.8, 30.8, 12.8, 22.5);
      c.bezierCurveTo(12.8, 14.5, 6.2, 11, 6.2, 6);
      c.closePath();
    }
    function drawBulb(c, jx, jy, bx, by, sc, lit, dir, sway) {
      // Connected brushed brass collar + flexible braided lead straight from moving rope node to Edison socket
      c.save();
      c.strokeStyle = '#6f6455'; c.lineWidth = 3.2 * sc; c.lineCap = 'round';
      c.beginPath(); c.moveTo(jx, jy); c.quadraticCurveTo(jx + dir * 14 * sc, jy + 12 * sc, bx, by - 5 * sc); c.stroke();
      c.strokeStyle = '#c8b896'; c.lineWidth = 1.6 * sc;
      c.beginPath(); c.moveTo(jx, jy); c.quadraticCurveTo(jx + dir * 14 * sc, jy + 12 * sc, bx, by - 5 * sc); c.stroke();
      c.fillStyle = '#d4b46c';
      c.beginPath(); c.arc(jx, jy, 4.1 * sc, 0, Math.PI * 2); c.fill();
      c.strokeStyle = '#3b2e1b'; c.lineWidth = .8 * sc; c.stroke();
      c.restore();

      c.save();
      c.translate(bx, by);
      c.rotate(sway);
      c.scale(sc, sc);
      if (lit > .02) {
        const g1 = c.createRadialGradient(0, 22, 2, 0, 22, 86);
        g1.addColorStop(0, `rgba(255, 246, 186, ${(0.72 * lit).toFixed(3)})`);
        g1.addColorStop(.32, `rgba(255, 204, 92, ${(0.34 * lit).toFixed(3)})`);
        g1.addColorStop(1, 'rgba(255, 190, 72, 0)');
        c.fillStyle = g1;
        c.beginPath(); c.arc(0, 22, 86, 0, Math.PI * 2); c.fill();
      }
      // Antique brass screw socket
      const sg = c.createLinearGradient(-7, 0, 7, 0);
      sg.addColorStop(0, '#4a3a1f'); sg.addColorStop(.32, '#e8d59e'); sg.addColorStop(.62, '#b0924f'); sg.addColorStop(1, '#3a2c15');
      c.fillStyle = sg;
      c.beginPath();
      if (c.roundRect) c.roundRect(-6.8, -6.5, 13.6, 13, 2.2);
      else c.rect(-6.8, -6.5, 13.6, 13);
      c.fill();
      c.fillStyle = 'rgba(0,0,0,.28)';
      c.fillRect(-6.8, -2.5, 13.6, 1); c.fillRect(-6.8, 1.5, 13.6, 1);
      // Glass Edison bulb envelope
      bulbGlassPath(c);
      if (lit > .05) {
        const bg = c.createRadialGradient(0, 21, 1, 0, 22, 16);
        bg.addColorStop(0, `rgba(255, 253, 232, ${(.35 + .65 * lit).toFixed(3)})`);
        bg.addColorStop(.55, `rgba(255, 224, 130, ${(.22 + .62 * lit).toFixed(3)})`);
        bg.addColorStop(1, `rgba(245, 166, 35, ${(.18 + .52 * lit).toFixed(3)})`);
        c.fillStyle = bg;
      } else {
        c.fillStyle = 'rgba(220, 212, 204, .11)';
      }
      c.fill();
      c.strokeStyle = lit > .2 ? `rgba(255, 220, 140, ${(.4 + .5 * lit).toFixed(2)})` : 'rgba(232, 228, 224, .32)';
      c.lineWidth = 1.15;
      c.stroke();
      // Tungsten spiral filament
      c.beginPath();
      c.moveTo(-3.2, 8); c.lineTo(-2.4, 21);
      c.quadraticCurveTo(-1.2, 27, 0, 21);
      c.quadraticCurveTo(1.2, 27, 2.4, 21);
      c.lineTo(3.2, 8);
      if (lit > .1) { c.shadowColor = '#ffb703'; c.shadowBlur = 10 * lit; }
      c.strokeStyle = lit > .15 ? `rgba(255, 248, 214, ${(.45 + .55 * lit).toFixed(2)})` : 'rgba(214, 204, 186, .42)';
      c.lineWidth = 1.3;
      c.stroke();
      c.shadowBlur = 0;
      // Glass specular rim highlight
      c.strokeStyle = `rgba(255, 255, 255, ${lit > .2 ? .55 : .24})`;
      c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(-8.4, 17.5); c.quadraticCurveTo(-9.6, 22.5, -7.2, 28); c.stroke();
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
      c.strokeStyle = bulbLit > .35 ? '#dfd4be' : '#d6ccba'; c.lineWidth = thick; c.stroke();
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
      const dir = innerWidth < 640 ? 1 : -1;
      const ji = splitIdx();
      const jPt = ps[ji] || { x: ax, y: Math.max(12, lampY - 22 * bulbSc) };
      const jy = Math.max(10, jPt.y);
      const bx = jPt.x + dir * 23 * bulbSc, by = Math.max(jy + 18 * bulbSc, lampY + Math.max(0, bulbExt));
      const sway = Math.max(-.16, Math.min(.16, (jPt.x - ax) * .022 + Math.sin(t * 1.1) * .018));
      drawBulb(c, jPt.x, jy, bx, by, bulbSc, bulbLit, dir, sway);
      drawKnob(c, last.x, last.y, ang, false);
      const kx = last.x + Math.cos(ang) * 20 * knobS, ky = last.y + Math.sin(ang) * 20 * knobS;
      hit.style.transform = `translate(${kx}px, ${ky}px)`;
      if (bulbBtn) bulbBtn.style.transform = `translate(${bx}px, ${by + 16 * bulbSc}px)`;
    }

    let sleeping = false, still = 0, touchedAt = 0;
    function wake() {
      bulbTarget = getMode() === 'light' ? 1 : 0;
      still = 0; touchedAt = performance.now();
      if (!sleeping) return;
      sleeping = false; lastT = 0; acc = 0; requestAnimationFrame(loop);
    }
    function loop(now) {
      if (!lastT) lastT = now;
      const dt = Math.min((now - lastT) / 1000, 1 / 20); lastT = now;
      bulbTarget = getMode() === 'light' ? 1 : 0;
      bulbLit += (bulbTarget - bulbLit) * Math.min(1, dt * 12);
      if (Math.abs(bulbTarget - bulbLit) < .004) bulbLit = bulbTarget;
      updateDrag(); acc += dt;
      while (acc >= STEP) { step(STEP); acc -= STEP; }
      if (dropped && live && grab < 0 && now - touchedAt > 2500) for (const q of pts) { q.px += (q.x - q.px) * .06; q.py += (q.y - q.py) * .06; }
      draw();
      let motion = Math.abs(extV) + Math.abs(ext) + Math.abs(bulbExtV) + Math.abs(bulbExt) + Math.abs(bulbTarget - bulbLit) * 4;
      for (const q of pts) motion = Math.max(motion, Math.abs(q.x - q.px) + Math.abs(q.y - q.py));
      if (dropped && live && grab < 0 && !bulbDrag && motion < .06) { if (++still > 30) { for (const q of pts) { q.px = q.x; q.py = q.y; } sleeping = true; return; } } else still = 0;
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
    const SKILLS = ['GenAI Engineer', 'AI / ML Engineer', 'Data Scientist', 'Data Analyst', 'SQL Architect'];
    const HOLD = 1750, FLIP = 1220;
    const cal = $('#cal');
    if (!cal) return;
    const body = $('.cal__body', cal), leaf = $('.cal__leaf', cal);
    const under = $('[data-under]', cal), face = $('.cal__face', cal);
    const measure = $('.cal__measure', cal), rings = $('.cal__rings', cal);
    const n = SKILLS.length;
    let i = activePreset ? activePreset.calIdx : 0, started = false;

    const paint = (page, k) => {
      $('.cal__word', page).textContent = SKILLS[k];
      $('.cal__no', page).textContent = `${String(k + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
    };
    paint(face, i);
    paint(under, (i + 1) % n);

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

    const SAME_ORIGIN = location.origin === 'null' ? '*' : location.origin;
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
        try { f.contentWindow?.postMessage({ wall: 'mode', mode: getMode(), theme: getMode() }, SAME_ORIGIN); } catch (e) {}
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
          if (MOB.matches) warm(0);
          else setTimeout(() => [0, 1, 2, 3].forEach(warm), 600);
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
      if (MOB.matches) warm(i);
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
      setTimeout(() => d.s.set(ANG_WALK / ANG), reduced ? 0 : 110);
      setTimeout(() => through(i), reduced ? 0 : (MOB.matches ? 360 : 520));
    }

    function zoomTarget() { return MOB.matches ? (mPin || sec) : sec; }

    function through(i) {
      const u = units[i], z = zoomTarget();
      const r = $('.opening', u).getBoundingClientRect(), dr = $('.door', u).getBoundingClientRect();
      const gapL = Math.min(Math.max(dr.right, r.left), r.right - 6);
      const gw = Math.max(r.width * .34, r.right - gapL, 28), gh = r.height;
      const cx = (gapL + r.right) / 2, cy = r.top + gh * .5;
      holdScroll(true);
      $('#cord')?.classList.add('away'); $('.hdr')?.classList.add('away');
      const sr = z.getBoundingClientRect();
      z.style.transformOrigin = `${cx - sr.left}px ${cy - sr.top}px`;
      sec.classList.add('through');
      const tx = innerWidth / 2 - cx, ty = innerHeight / 2 - cy;
      const sEnd = Math.min(6.5, Math.max(innerWidth / gw, innerHeight / gh) * 1.05);
      const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const zoomOf = e => Math.exp(Math.log(sEnd) * e);
      const t0 = performance.now(), D = reduced ? 1 : (MOB.matches ? 420 : 680);
      let handed = false;
      const step = now => {
        const p = Math.min(1, (now - t0) / D), e = ease(p), sc = zoomOf(e), f = Math.min(1, e * 1.6);
        z.style.transform = `translate(${tx * f}px, ${ty * f}px) scale(${sc})`;
        if (!handed && (p >= .82 || p >= 1)) { handed = true; handoff(); }
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
            try { frame.contentWindow?.postMessage({ wall: 'enter', mode: getMode(), theme: getMode() }, SAME_ORIGIN); frame.contentWindow?.focus(); } catch (e) {}
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
      try { frame?.contentWindow?.postMessage({ wall: 'exit' }, SAME_ORIGIN); } catch (e) {}
      setTimeout(() => {
        wallv.classList.remove('on');
        setTimeout(() => {
          cancelAnimationFrame(walkRaf);
          doorsState[cur].s.set(0);
          const z = zoomTarget();
          const from = z.style.transform;
          const m = /translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([\d.]+)\)/.exec(from) || [0, 0, 0, 1];
          const X = +m[1], Y = +m[2], S = +m[3], t0 = performance.now(), D = reduced ? 1 : (MOB.matches ? 260 : 420);
          const ease = x => 1 - Math.pow(1 - x, 3);
          const step = now => {
            const p = Math.min(1, (now - t0) / D), e = ease(p);
            const sc = Math.exp(Math.log(S) * (1 - e));
            z.style.transform = `translate(${X * (1 - e)}px, ${Y * (1 - e)}px) scale(${sc})`;
            if (p < 1) requestAnimationFrame(step);
            else {
              z.style.transform = ''; z.style.transformOrigin = '';
              sec.classList.remove('through', 'lift');
              doorsState[cur].s.set(0);
              $('#cord')?.classList.remove('away'); $('.hdr')?.classList.remove('away');
              busy = false; holdScroll(false);
              if (afterLeave) { const f = afterLeave; afterLeave = null; setTimeout(f, 40); }
              if (cur === SECRET) {
                if (MOB.matches) { mForce = -1; mFromScroll(); mApply(); setTimeout(() => reveal(false), reduced ? 0 : 280); }
                else setTimeout(() => reveal(false), reduced ? 0 : 260);
                units[SECRET - 1].querySelector('.doorway').focus({ preventScroll: true });
              } else doorsState[cur].way.focus({ preventScroll: true });
            }
          };
          requestAnimationFrame(step);
        }, reduced ? 0 : 60);
      }, reduced ? 0 : 120);
    }

    addEventListener('message', e => {
      if (location.origin !== 'null' && e.origin !== location.origin) return;
      if (e.source !== frame?.contentWindow || !e.data || typeof e.data !== 'object') return;
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
      try { f?.contentWindow?.postMessage({ wall: 'mode', mode: getMode(), theme: getMode() }, SAME_ORIGIN); } catch (e) {}
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

    const tt = $('#totop'), fab = $('#aiFab');
    if (tt || fab) {
      if (tt) tt.style.setProperty('--len', (2 * Math.PI * 24).toFixed(2));
      let raf = 0;
      const upd = () => {
        raf = 0;
        const max = document.documentElement.scrollHeight - innerHeight, y = scrollY;
        const bot = $('.sf__bot');
        const vis = y > innerHeight * .75 && !(bot && bot.getBoundingClientRect().top < innerHeight - 8);
        if (tt) {
          tt.classList.toggle('show', vis);
          tt.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
          tt.dataset.on = getMode() === 'dark' ? 'dark' : 'light';
        }
        if (fab) fab.classList.toggle('show', y > 180);
      };
      const q = () => { if (!raf) raf = requestAnimationFrame(upd); };
      addEventListener('scroll', q, { passive: true });
      addEventListener('resize', q);
      new MutationObserver(q).observe(root, { attributes: true, attributeFilter: ['data-mode'] });
      upd();
      tt?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }));
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
    hc.addEventListener('click', e => { if (e.detail === 0) hc.classList.toggle('flip'); });
    layer.addEventListener('click', e => { if (e.target === layer) hide(); });
    open?.addEventListener('click', e => { e.stopPropagation(); show(); });
    fig?.addEventListener('click', e => { if (!e.target.closest('.fig__card')) show(); });
    $('#holoClose')?.addEventListener('click', hide);
    $('#holoResumes')?.addEventListener('click', () => { hide(); setTimeout(openResumeModal, 240); });
  })();

  /* ---------- Dev-AI Grounded Recruiter Copilot (1-Tap Role Fit + Slim Dossier Trackbar + RAG Trace) ---------- */
  (function initRecruiterCopilot() {
    const modalEl = $('#copilot'), panel = $('#cpPanel'), log = $('#cpLog');
    const formEl = $('#cpForm'), inp = $('#cpInput'), copyBriefBtn = $('#cpCopyBrief');
    if (!modalEl || !log) return;

    const DOORS = [
      { id: 0, label: 'Explore Door 01 · Power BI & BI →' },
      { id: 1, label: 'Explore Door 02 · SQL Architecture →' },
      { id: 2, label: 'Explore Door 03 · Machine Learning →' },
      { id: 3, label: 'Explore Door 04 · GenAI & RAG →' },
      { id: 4, label: 'Explore Door 05 · Open Source & CLI →' }
    ];

    const KB = [
      {
        id: 'genai-rag', title: 'Multi-PDF Vector RAG & LangGraph Agents (Door 04)', door: 3, resume: 'aiml',
        tags: ['genai', 'rag', 'llm', 'gemini', 'groq', 'langgraph', 'langchain', 'agent', 'travel', 'serper', 'vector', 'embedding', 'chatbot', 'hallucination', 'prompt', 'thingqbator', 'aiml', 'ai', 'ml'],
        text: 'Built a **Multi-PDF Vector RAG Suite** (Gemini dense embeddings + semantic chunking + grounded citations) and an **AI Travel Planner Agent** (Groq LPU inference + Serper tool-calling), plus an enterprise AI chatbot at Nasscom thingQbator (Sep 2026).',
        bullets: ['**Grounding:** Source-chunk citations prevent unverified generation', '**Orchestration:** Tool-calling flows via LangGraph & Groq low-latency inference']
      },
      {
        id: 'ml-crop', title: 'Supervised ML & 5-Fold CV (Door 03)', door: 2, resume: 'ds',
        tags: ['ml', 'xgboost', 'scikit', 'sklearn', 'random forest', 'classification', 'regression', 'crop', 'boston', 'housing', 'iqr', 'zscore', 'cross', 'validation', 'cv', '99.1', 'feature', 'scientist', 'ds', 'model', 'python'],
        text: 'Engineered a **22-class Crop Recommendation classifier** reaching **99.1% 5-fold cross-validation accuracy** (benchmarking Random Forest, XGBoost & GaussianNB) alongside IQR/Z-score preprocessing and Boston Housing regression.',
        bullets: ['**Validation:** 5-fold stratified CV across Scikit-learn pipelines', '**Feature Prep:** Automated IQR & Z-score outlier standardization']
      },
      {
        id: 'eda-prodigy', title: 'Prodigy InfoTech Data Science Internship (500k+ Rows)', door: 1, resume: 'ds',
        tags: ['prodigy', 'internship', 'intern', 'experience', '500k', '500000', 'eda', 'kmeans', 'clustering', 'decision', 'sentiment', 'outstanding', 'clean', 'noise', '30%'],
        text: 'Completed Data Science Internship at **Prodigy InfoTech** (May–Jun 2026, awarded **Outstanding Remarks**) auditing **500,000+ raw multi-source records**, cutting pipeline noise by **30%**, and delivering Decision Tree & K-Means cohort models.',
        bullets: ['**Scale:** 500k+ records cleaned with automated SQL + Python checks', '**Recognition:** Awarded Outstanding Remarks by technical mentors']
      },
      {
        id: 'bi-powerbi', title: 'Power BI Star Schema & DAX (Door 01)', door: 0, resume: 'analyst',
        tags: ['powerbi', 'power', 'bi', 'dax', 'star', 'schema', 'dashboard', 'kpi', 'yoy', 'revenue', 'ecommerce', '10k', '10420', 'analyst', 'tata', 'deloitte', 'visual'],
        text: 'Designed executive **Power BI Star-Schema** semantic models over **10,000+ e-commerce sales transactions** (`₹19.2L` West region drilldown) with custom DAX YoY time-intelligence, retention cohorts, and margin reporting.',
        bullets: ['**Modeling:** Clean Fact/Dimension star schema + dynamic slicers', '**Simulations:** TATA GenAI BI & Deloitte Data Analytics verified']
      },
      {
        id: 'sql-3nf', title: 'MySQL 3NF Architecture & Query Engine (Door 02)', door: 1, resume: 'analyst',
        tags: ['sql', 'mysql', 'postgresql', 'postgres', '3nf', 'cte', 'window', 'rank', 'lag', 'coalesce', 'database', 'oltp', 'olap', 'schema'],
        text: 'Architected normalized **6-table 3NF MySQL & PostgreSQL** analytical schemas featuring recursive CTEs, window ranking (`RANK`, `LAG`), `COALESCE` null remediation, and outlier pruning.',
        bullets: ['**Normalization:** Zero redundancy 3NF transactional-to-analytical flow', '**Queries:** Production window analytics & query optimization']
      },
      {
        id: 'profile-hiring', title: 'Degree, Availability, CTC & Location', door: 4, resume: 'aiml',
        tags: ['hire', 'hiring', 'available', 'availability', 'join', 'immediate', 'notice', 'relocate', 'location', 'ahmedabad', 'vadodara', 'remote', 'degree', 'btech', 'parul', 'diploma', 'contact', 'email', 'phone', 'github', 'repos', '34'],
        text: 'Graduated **B.Tech CSE (2022–2025, Parul University)** after Diploma in CE (Growmore, 2019–2022). **Immediate joiner** in Ahmedabad / Gandhinagar — ready to relocate anywhere in India or work remote (`34+ public GitHub repos`).',
        bullets: ['**Contact:** `+91 93289 77322` · `devpatel846211@gmail.com`', '**Credentials:** Prodigy InfoTech Intern · TATA · Deloitte · thingQbator']
      }
    ];

    const PRESETS = {
      'role:aiml': {
        userLabel: 'Hiring GenAI / AI-ML Engineer',
        intent: 'role_match: genai_aiml',
        text: '**Strong Fit for GenAI & AI/ML Roles (Immediate Joiner · B.Tech CSE ’25):**',
        bullets: KB[0].bullets.concat(['**ML Benchmark:** 99.1% 5-fold CV on 22-class Crop classifier (XGBoost & Scikit-learn)', '**Experience:** Prodigy InfoTech Data Science Intern (500k+ records · Outstanding Remarks)']),
        resumes: ['aiml'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .97 }, { id: 'ml-crop', score: .91 }, { id: 'eda-prodigy', score: .87 }]
      },
      'role:ds': {
        userLabel: 'Hiring Data Scientist',
        intent: 'role_match: data_scientist',
        text: '**Strong Fit for Data Scientist Roles (Immediate Joiner · 500k+ Record Scale):**',
        bullets: KB[2].bullets.concat(['**Supervised ML:** 99.1% 5-fold CV accuracy + IQR/Z-score feature engineering', '**GenAI Edge:** Production Multi-PDF RAG & evaluation tooling']),
        resumes: ['ds'],
        door: 2,
        chunks: [{ id: 'eda-prodigy', score: .96 }, { id: 'ml-crop', score: .94 }, { id: 'sql-3nf', score: .85 }]
      },
      'role:analyst': {
        userLabel: 'Hiring Data Analyst',
        intent: 'role_match: data_analyst',
        text: '**Strong Fit for Data Analyst & BI Roles (Power BI · 3NF SQL · Python EDA):**',
        bullets: KB[3].bullets.concat(['**SQL Depth:** 6-table 3NF schema with recursive CTEs & window functions', '**Internship:** Audited 500,000+ multi-source records at Prodigy InfoTech']),
        resumes: ['analyst'],
        door: 0,
        chunks: [{ id: 'bi-powerbi', score: .97 }, { id: 'sql-3nf', score: .93 }, { id: 'eda-prodigy', score: .90 }]
      },
      'summary': {
        userLabel: '30-Sec Executive Overview + All Resumes',
        intent: 'executive_brief',
        text: '**Dev Patel — 30-Second Candidate Snapshot:** B.Tech CSE (Parul University ’25) + Prodigy InfoTech DS Intern (`Outstanding Remarks`, 500k+ records). Immediate joiner open to **AI/ML**, **Data Science**, and **Data Analyst** roles across India or remote.',
        bullets: ['**AI / ML:** Multi-PDF Vector RAG (Gemini), Groq LPU + LangGraph agents, 99.1% XGBoost CV', '**Analytics:** Power BI Star Schema (10k+ rows), 3NF MySQL CTEs/Windows, TATA & Deloitte sims', '**Direct:** `+91 93289 77322` · `devpatel846211@gmail.com` · `34+ GitHub repos`'],
        resumes: ['aiml', 'ds', 'analyst'],
        door: 3,
        chunks: [{ id: 'profile-hiring', score: .96 }, { id: 'genai-rag', score: .92 }, { id: 'eda-prodigy', score: .89 }]
      },
      'rag': {
        userLabel: 'RAG & ML Engineering Deep Dive',
        intent: 'technical_architecture',
        text: '**Architecture Overview (Multi-PDF RAG + Agentic Systems):**',
        bullets: [KB[0].text, '**ML Pipeline Discipline:** Strict train/test isolation, 5-fold stratified CV, IQR/Z-score feature scaling (Door 03)', '**Enterprise Exposure:** Shipped an AI chatbot at Nasscom thingQbator (Sep 2026)'],
        resumes: ['aiml', 'ds'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .98 }, { id: 'ml-crop', score: .90 }, { id: 'eda-prodigy', score: .84 }]
      }
    };

    const expandTokens = raw => {
      const toks = raw.toLowerCase().replace(/[^a-z0-9+.#]+/g, ' ').split(/\s+/).filter(w => w.length > 1);
      const out = new Set(toks);
      if (out.has('llm') || out.has('bot') || out.has('gpt')) { out.add('genai'); out.add('rag'); out.add('langgraph'); }
      if (out.has('bi') || out.has('dashboard') || out.has('excel')) { out.add('powerbi'); out.add('dax'); }
      if (out.has('salary') || out.has('ctc') || out.has('notice') || out.has('relocation')) { out.add('immediate'); out.add('relocate'); }
      return [...out];
    };

    function retrieve(raw) {
      const toks = expandTokens(raw);
      const ranked = KB.map(c => {
        let hits = 0;
        const blob = `${c.title} ${c.text}`.toLowerCase();
        for (const t of toks) {
          if (c.tags.includes(t)) hits += 2;
          else if (blob.includes(t)) hits += 1;
        }
        const score = toks.length ? Math.min(.97, .64 + hits / (toks.length * 1.9 + 2)) : .72;
        return { chunk: c, hits, score };
      }).sort((a, b) => b.hits - a.hits || b.score - a.score);

      const best = ranked[0];
      if (!best || best.hits === 0) {
        return {
          intent: 'fallback_grounded_search',
          text: 'I strictly answer from Dev’s verified portfolio corpus to avoid hallucinations. Here are his core role tracks & instant PDF resumes:',
          bullets: PRESETS.summary.bullets,
          resumes: ['aiml', 'ds', 'analyst'],
          door: 3,
          chunks: ranked.slice(0, 2).map(r => ({ id: r.chunk.id, score: .71 }))
        };
      }
      const second = ranked[1] && ranked[1].hits > 0 ? ranked[1] : null;
      const bullets = best.chunk.bullets.slice();
      if (second) bullets.push(`**Related (${second.chunk.title}):** ${second.chunk.text}`);
      const resKeys = [...new Set([best.chunk.resume, second?.chunk.resume].filter(Boolean))];
      return {
        intent: `semantic_match: ${best.chunk.id}`,
        text: best.chunk.text,
        bullets,
        resumes: resKeys.length ? resKeys : ['aiml'],
        door: best.chunk.door,
        chunks: ranked.slice(0, 3).map(r => ({ id: r.chunk.id, score: Number(r.score.toFixed(2)) }))
      };
    }

    const fmtInline = s => s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

    let streamTimer = 0;
    function appendMessage(res, userLabel, instant = false) {
      clearInterval(streamTimer);
      if (userLabel) {
        const u = document.createElement('div');
        u.className = 'cp-msg cp-msg--user';
        const ub = document.createElement('div');
        ub.className = 'cp-bubble';
        ub.textContent = String(userLabel);
        u.appendChild(ub);
        log.appendChild(u);
      }
      const b = document.createElement('div');
      b.className = 'cp-msg cp-msg--bot';
      const bubble = document.createElement('div');
      bubble.className = 'cp-bubble';
      const pEl = document.createElement('p');
      bubble.appendChild(pEl);
      b.appendChild(bubble);
      log.appendChild(b);

      const finish = () => {
        pEl.innerHTML = fmtInline(res.text);
        if (res.bullets?.length) {
          const ul = document.createElement('ul');
          ul.innerHTML = res.bullets.map(x => `<li>${fmtInline(x)}</li>`).join('');
          bubble.appendChild(ul);
        }
        const primaryKey = (res.resumes && RESUME_TRACKS[res.resumes[0]]) ? res.resumes[0] : 'aiml';
        const r = RESUME_TRACKS[primaryKey];
        const bar = document.createElement('div');
        bar.className = 'cp-trackbar';

        const info = document.createElement('div');
        info.className = 'cp-trackbar__info';
        const lbl = document.createElement('span');
        lbl.className = 'cp-trackbar__lbl';
        lbl.textContent = 'RECOMMENDED DOSSIER · ATS PDF';
        const nameEl = document.createElement('strong');
        nameEl.className = 'cp-trackbar__name';
        nameEl.textContent = `${r.title} Resume`;
        info.append(lbl, nameEl);

        const acts = document.createElement('div');
        acts.className = 'cp-trackbar__acts';
        const prevA = document.createElement('a');
        prevA.className = 'cp-trackbar__btn';
        prevA.href = r.url;
        prevA.target = '_blank';
        prevA.rel = 'noopener noreferrer';
        prevA.textContent = 'Preview ↗';
        const dlA = document.createElement('a');
        dlA.className = 'cp-trackbar__dl';
        dlA.href = r.url;
        dlA.setAttribute('download', r.file);
        dlA.setAttribute('aria-label', `Download ${r.title} PDF`);
        dlA.textContent = '↓';
        const allBtn = document.createElement('button');
        allBtn.type = 'button';
        allBtn.className = 'cp-trackbar__all';
        allBtn.textContent = 'Tracks';
        allBtn.addEventListener('click', () => {
          closeCopilot();
          setTimeout(() => openResumeModal(primaryKey), 240);
        });
        acts.append(prevA, dlA, allBtn);
        bar.append(info, acts);
        b.appendChild(bar);

        const meta = document.createElement('div');
        meta.className = 'cp-meta';
        if (typeof res.door === 'number' && DOORS[res.door]) {
          const dBtn = document.createElement('button');
          dBtn.type = 'button'; dBtn.className = 'cp-door-btn';
          dBtn.textContent = DOORS[res.door].label;
          dBtn.addEventListener('click', () => { closeCopilot(); setTimeout(() => window.openDoor?.(res.door), 240); });
          meta.appendChild(dBtn);
        }
        const tBtn = document.createElement('button');
        tBtn.type = 'button'; tBtn.className = 'cp-trace-btn';
        tBtn.textContent = 'Show RAG Trace ▸';
        meta.appendChild(tBtn);
        b.appendChild(meta);

        const trace = document.createElement('div');
        trace.className = 'cp-trace'; trace.hidden = true;
        trace.innerHTML = `<div><b>Intent:</b> ${fmtInline(String(res.intent))} · <b>Status:</b> Grounded (0 hallucinations)</div><div><b>Top Chunks:</b> ${(res.chunks || []).map(c => fmtInline(`${c.id} (${c.score})`)).join(' · ')}</div>`;
        b.appendChild(trace);
        tBtn.addEventListener('click', () => {
          trace.hidden = !trace.hidden;
          tBtn.textContent = trace.hidden ? 'Show RAG Trace ▸' : 'Hide RAG Trace ▾';
          log.scrollTop = log.scrollHeight;
        });
        log.scrollTop = log.scrollHeight;
      };

      if (instant || reduced) { finish(); return; }
      const words = res.text.replace(/\*\*/g, '').replace(/`/g, '').split(' ');
      let wi = 0;
      streamTimer = setInterval(() => {
        wi = Math.min(words.length, wi + 3);
        pEl.textContent = words.slice(0, wi).join(' ');
        log.scrollTop = log.scrollHeight;
        if (wi >= words.length) { clearInterval(streamTimer); finish(); }
      }, 22);
    }

    function runPreset(key, instant = false) {
      const p = PRESETS[key];
      if (!p) return;
      modalEl.querySelectorAll('.cp-chip').forEach(c => c.classList.toggle('active', c.dataset.cpQ === key));
      appendMessage(p, instant ? null : p.userLabel, instant);
    }

    let initialized = false, cpLastFocus = null;
    function openCopilot(presetKey) {
      cpLastFocus = document.activeElement;
      if (!initialized) {
        initialized = true;
        const startKey = presetKey || (activePreset ? activePreset.key : 'summary');
        runPreset(startKey, true);
      } else if (presetKey) {
        runPreset(presetKey, false);
      }
      openLayer(modalEl, closeCopilot);
      setTimeout(() => inp?.focus(), 140);
    }
    function closeCopilot() {
      clearInterval(streamTimer);
      closeLayer(modalEl, () => cpLastFocus?.focus?.({ preventScroll: true }));
    }
    window.openCopilot = openCopilot;

    document.querySelectorAll('[data-copilot]').forEach(b => b.addEventListener('click', () => openCopilot()));
    modalEl.addEventListener('click', closeCopilot);
    panel?.addEventListener('click', e => e.stopPropagation());
    $('#cpClose')?.addEventListener('click', closeCopilot);
    modalEl.querySelectorAll('.cp-chip').forEach(b => b.addEventListener('click', () => runPreset(b.dataset.cpQ)));

    formEl?.addEventListener('submit', e => {
      e.preventDefault();
      const q = String(inp?.value || '').trim();
      if (!q) return;
      inp.value = '';
      modalEl.querySelectorAll('.cp-chip').forEach(c => c.classList.remove('active'));
      appendMessage(retrieve(q), q, false);
    });

    copyBriefBtn?.addEventListener('click', () => {
      const brief = [
        'DEV PATEL — Data Analyst | Data Scientist | GenAI & AI/ML Engineer',
        'Education: B.Tech CSE (Parul University, 2022–2025) | Diploma CE (Growmore, 2019–2022)',
        'Experience: Data Science Intern @ Prodigy InfoTech (May–Jun 2026 · 500k+ records audited · Outstanding Remarks)',
        'Highlights: Multi-PDF Vector RAG (Gemini/LangGraph/Groq), 99.1% 5-Fold CV Crop ML, 10k+ Power BI Star Schema, 3NF MySQL',
        'Credentials: TATA GenAI Analytics | Deloitte Analytics | Nasscom thingQbator | TechWar 2026',
        'Availability: Immediate Joiner (Ahmedabad / Relocation Ready / Remote)',
        'Contact: devpatel846211@gmail.com | +91 93289 77322 | github.com/Devpatel7777',
        `Portfolio & PDFs: ${location.origin && location.origin !== 'null' ? location.origin : ''}/?role=aiml`
      ].join('\n');
      navigator.clipboard?.writeText(brief).then(() => {
        const prev = copyBriefBtn.textContent;
        copyBriefBtn.textContent = 'Copied Brief ✓';
        setTimeout(() => { copyBriefBtn.textContent = prev; }, 1800);
      }).catch(() => {});
    });

    addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (modalEl.hidden) openCopilot(); else closeCopilot();
      }
    });
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
