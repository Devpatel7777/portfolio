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

  function openModal(presetRole) {
    lastFocus = document.activeElement;
    $('#mFormWrap').hidden = false;
    $('#mSuccess').hidden = true;
    const sel = form?.querySelector('[name="role"]');
    if (sel && typeof presetRole === 'string' && presetRole) sel.value = presetRole;
    openLayer(modal, closeModal);
    setTimeout(() => form?.querySelector('input')?.focus(), 140);
  }
  window.openContactForRole = openModal;
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
  $('#rvShareLink')?.addEventListener('click', () => {
    const shareUrl = `${location.origin}/?role=${encodeURIComponent(currentResumeTrack)}`;
    const btn = $('#rvShareLink');
    navigator.clipboard?.writeText(shareUrl).then(() => {
      if (!btn) return;
      const prev = btn.textContent;
      btn.textContent = 'Copied link ✓';
      setTimeout(() => { btn.textContent = prev; }, 1800);
    }).catch(() => {});
  });

  document.querySelectorAll('[data-contact]').forEach(b => b.addEventListener('click', openModal));
  document.querySelectorAll('[data-resume]').forEach(b => b.addEventListener('click', () => openResumeModal()));

  const EMAIL = 'devpatel846211@gmail.com';
  let lastMailText = '';
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const role = String(fd.get('role') || 'Full-Time Data / ML Role').trim();
    const message = String(fd.get('message') || '').trim();
    const submitBtn = form.querySelector('.mform__submit');
    const prevBtnTxt = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }

    const subject = `[Interview / Role] ${role} — ${name}`;
    const body = `Hi Dev,\n\n${message}\n\nRecruiter / Contact: ${name} (${email})\nTarget Role: ${role}\n`;
    lastMailText = `To: ${EMAIL}\nSubject: ${subject}\n\n${body}`;

    $('#eqGmailLink').href = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    $('#eqMailtoLink').href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    navigator.clipboard?.writeText(lastMailText).catch(() => {});

    try {
      await fetch('/api/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, message })
      });
    } catch (_) {}

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = prevBtnTxt; }
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
    $('#lampAmbient')?.classList.toggle('lit', m === 'light');
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

  /* ---------- Connected Braided Pull Cords (Shared Verlet Physics): Pull Bulb -> Light | Pull Rope -> Dark ---------- */
  (function pullCord() {
    const wrap = $('#cord'), cv = $('.cord__cv', wrap), hit = $('#cordHit'), bulbBtn = $('#cordBulb');
    if (!wrap || !cv || !hit) return;
    const ctx = cv.getContext('2d');
    const G = 4600, STEP = 1 / 120, ITER = 16;
    let dpr = 1, W = 380, H = 420;
    let thick = 3.7, knobS = 1.3, bulbSc = 1, dir = -1;
    let bulbLit = getMode() === 'light' ? 1 : 0, bulbTarget = bulbLit;
    let activeDrag = null, acc = 0, lastT = 0, t = 0, dropped = false, live = false;

    const makeCord = opts => ({
      ...opts,
      pts: [], L: 180, maxExt: 48, hidden: 72, seg: 10, ax: 200,
      ext: 0, extV: 0, armed: true, grab: -1, grabOff: { x: 0, y: 0 },
      target: null, ptr: null, ptrPrev: null, downAt: 0, downPos: null, moved: 0, usedPtr: false, ptrTimer: 0
    });
    const ropeCord = makeCord({ isBulb: false, mode: 'dark', btn: hit, N: 24, thresh: .68, tugMul: 50 });
    const bulbCord = makeCord({ isBulb: true, mode: 'light', btn: bulbBtn, N: 22, thresh: .64, tugMul: 50 });
    const cords = bulbBtn ? [ropeCord, bulbCord] : [ropeCord];

    function initOrShift(cr, newAx, newL, newMax) {
      cr.L = newL; cr.maxExt = newMax; cr.hidden = newMax + 18;
      cr.seg = (cr.L + cr.hidden) / cr.N;
      if (!cr.pts.length) {
        for (let i = 0; i <= cr.N; i++) {
          const x = newAx, y = -cr.hidden + i * cr.seg;
          cr.pts.push({ x, y, px: x, py: y, w: i === 0 ? 0 : i === cr.N ? .28 : 1 });
        }
      } else {
        const dx = newAx - cr.ax;
        for (const p of cr.pts) { p.x += dx; p.px += dx; }
      }
      cr.ax = newAx;
    }

    function layout() {
      const rem = parseFloat(getComputedStyle(root).fontSize) || 16;
      const vw = innerWidth, vh = innerHeight;
      let rL, rExt, bL, bExt, gap;
      if (vw >= 1024) {
        rL = Math.min(265, Math.max(195, vh * .29)); rExt = 72;
        bL = 110; bExt = 48; thick = 3.7; knobS = 1.3; bulbSc = 1; gap = 34; dir = -1;
      } else if (vw >= 640) {
        rL = Math.min(210, Math.max(155, vh * .21)); rExt = 62;
        bL = 86; bExt = 40; thick = 3.4; knobS = 1.2; bulbSc = .88; gap = 28; dir = 1;
      } else {
        rL = 74; rExt = 42;
        bL = 56; bExt = 36; thick = 3.0; knobS = .95; bulbSc = .76; gap = 26; dir = 1;
      }
      W = vw < 1024 ? vw : Math.min(vw, 440);
      H = Math.round(rL + rExt + 165);
      wrap.style.width = W + 'px';
      wrap.style.height = H + 'px';
      dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);

      const ck = document.querySelector('.hdr .clock');
      let offset;
      if (vw >= 1024) {
        const safeRight = (ck && ck.offsetWidth) ? ck.getBoundingClientRect().right : vw - 120;
        const maxOff = Math.max(1.55 * rem, vw - safeRight - (gap + 2.8 * rem));
        offset = Math.min(2.35 * rem, maxOff);
      } else {
        offset = W - 2.25 * rem;
      }
      const ropeAx = Math.max(30, W - offset);
      const bulbAx = ropeAx + dir * gap;
      initOrShift(ropeCord, ropeAx, rL, rExt);
      initOrShift(bulbCord, bulbAx, bL, bExt);
    }

    let audioCtx = null;
    function playSnapSound(toMode) {
      if (reduced) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = audioCtx || new AC();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(toMode === 'light' ? 1480 : 620, now);
        osc.frequency.exponentialRampToValueAtTime(toMode === 'light' ? 420 : 190, now + .042);
        gain.gain.setValueAtTime(.09, now);
        gain.gain.exponentialRampToValueAtTime(.0001, now + .048);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(now); osc.stop(now + .05);
      } catch (_) {}
    }

    function stepCord(cr, dt, wind) {
      if (cr.grab < 0) {
        const K = 760, C = 21;
        cr.extV += (-K * cr.ext - C * cr.extV) * dt;
        cr.ext += cr.extV * dt;
      }
      if (cr.ext > cr.maxExt * cr.thresh && cr.armed && live) {
        cr.armed = false;
        setMode(cr.mode);
        playSnapSound(cr.mode);
        try { if (navigator.userActivation?.isActive) navigator.vibrate?.(12); } catch (e) {}
      }
      if (cr.ext < cr.maxExt * .2) cr.armed = true;

      const a = cr.pts[0];
      a.x = a.px = cr.ax; a.y = a.py = -cr.hidden + cr.ext;
      const damp = cr.grab >= 0 ? .992 : .9875;
      for (let i = 1; i <= cr.N; i++) {
        if (i === cr.grab) continue;
        const p = cr.pts[i];
        const vx = (p.x - p.px) * damp, vy = (p.y - p.py) * damp;
        p.px = p.x; p.py = p.y;
        p.x += vx + wind * dt * dt * (i / cr.N);
        p.y += vy + G * dt * dt;
      }
      if (cr.grab >= 0 && cr.target) {
        const g = cr.pts[cr.grab];
        g.px = g.x; g.py = g.y; g.x = cr.target.x; g.y = cr.target.y;
      }
      for (let k = 0; k < ITER; k++) {
        for (let i = 0; i < cr.N; i++) {
          const p1 = cr.pts[i], p2 = cr.pts[i + 1];
          const w1 = (i === cr.grab) ? 0 : p1.w, w2 = (i + 1 === cr.grab) ? 0 : p2.w;
          const sw = w1 + w2; if (!sw) continue;
          const dx = p2.x - p1.x, dy = p2.y - p1.y, d = Math.hypot(dx, dy) || 1e-6;
          const diff = (d - cr.seg) / d / sw;
          p1.x += dx * diff * w1; p1.y += dy * diff * w1;
          p2.x -= dx * diff * w2; p2.y -= dy * diff * w2;
        }
      }
      for (let i = 1; i <= cr.N; i++) {
        const p = cr.pts[i];
        if (p.x < 16) p.x = 16; else if (p.x > W - 16) p.x = W - 16;
        if (p.y > H - 46) p.y = H - 46;
      }
    }

    function step(dt) {
      if (!dropped) return;
      t += dt;
      const wind = reduced ? 0 : (Math.sin(t * .63) * 14 + Math.sin(t * 1.71 + 1.3) * 6);
      cords.forEach((cr, idx) => stepCord(cr, dt, idx ? wind * .88 : wind));
    }

    function updateDrag() {
      const cr = activeDrag;
      if (!cr || cr.grab < 0 || !cr.ptr) return;
      let tx = cr.ptr.x - cr.grabOff.x, ty = cr.ptr.y - cr.grabOff.y;
      const bx = cr.ax, by = -cr.hidden, reach = cr.grab * cr.seg;
      const dx = tx - bx, dy = ty - by, d = Math.hypot(dx, dy) || 1e-6;
      let need = d - reach;
      if (need > cr.maxExt) {
        const over = need - cr.maxExt, allowed = reach + cr.maxExt + over * .14 / (1 + over / 160);
        tx = bx + dx / d * allowed; ty = by + dy / d * allowed;
        need = cr.maxExt;
      }
      const targetExt = Math.max(0, need), prevExt = cr.ext;
      cr.ext += (targetExt - cr.ext) * .55;
      cr.extV = (cr.ext - prevExt) * 60;
      cr.target = { x: Math.max(16, Math.min(W - 16, tx)), y: Math.min(H - 46, ty) };
    }

    const local = e => { const r = wrap.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    function onMove(e) {
      const cr = activeDrag;
      if (!cr || cr.grab < 0) return;
      e.preventDefault();
      cr.ptrPrev = cr.ptr; cr.ptr = local(e);
      cr.moved = Math.max(cr.moved, Math.hypot(cr.ptr.x - cr.downPos.x, cr.ptr.y - cr.downPos.y));
    }
    function endDrag(e) {
      const cr = activeDrag;
      if (!cr || cr.grab < 0) return;
      const g = cr.pts[cr.grab];
      if (cr.ptr && cr.ptrPrev) { g.px = g.x - (cr.ptr.x - cr.ptrPrev.x) * .52; g.py = g.y - (cr.ptr.y - cr.ptrPrev.y) * .52; }
      const tap = e?.type !== 'pointercancel' && cr.moved < 6 && performance.now() - cr.downAt < 320;
      cr.grab = -1; cr.target = null; cr.ptr = cr.ptrPrev = null; activeDrag = null;
      wrap.classList.remove('dragging');
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', endDrag);
      removeEventListener('pointercancel', endDrag);
      clearTimeout(cr.ptrTimer);
      cr.ptrTimer = setTimeout(() => { cr.usedPtr = false; }, 80);
      if (tap) tugCord(cr);
    }
    function startDrag(cr, e, idx) {
      dropped = true; live = true; wake();
      activeDrag = cr; cr.grab = idx;
      const p = local(e), g = cr.pts[idx];
      cr.grabOff = { x: p.x - g.x, y: p.y - g.y };
      cr.ptr = cr.ptrPrev = p; cr.target = { x: g.x, y: g.y };
      cr.downAt = performance.now(); cr.downPos = p; cr.moved = 0;
      wrap.classList.add('dragging');
      addEventListener('pointermove', onMove, { passive: false });
      addEventListener('pointerup', endDrag);
      addEventListener('pointercancel', endDrag);
    }
    function tugCord(cr) {
      dropped = true; live = true; wake();
      cr.extV = cr.maxExt * cr.tugMul;
      cr.pts[cr.N].px = cr.pts[cr.N].x + (cr.isBulb ? -1.4 : 1.5);
    }

    for (const cr of cords) {
      if (!cr.btn) continue;
      cr.btn.addEventListener('pointerdown', e => {
        if (!dropped) return;
        e.preventDefault();
        clearTimeout(cr.ptrTimer);
        cr.usedPtr = true;
        try { cr.btn.setPointerCapture(e.pointerId); } catch (_) {}
        startDrag(cr, e, cr.N);
      });
      cr.btn.addEventListener('mouseenter', () => {
        if (!dropped || activeDrag) return;
        wake();
        cr.pts[cr.N].px += (cr.isBulb ? .45 : -.45);
      });
      cr.btn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tugCord(cr); }
      });
      cr.btn.addEventListener('click', e => {
        e.preventDefault();
        clearTimeout(cr.ptrTimer);
        const skip = cr.usedPtr;
        cr.usedPtr = false;
        if (!skip) tugCord(cr);
      });
    }

    const brush = { last: null };
    addEventListener('pointermove', e => {
      if (activeDrag || e.pointerType !== 'mouse') return;
      const p = local(e);
      if (p.x < -20 || p.y < -20 || p.x > W + 20 || p.y > H + 20) { brush.last = null; return; }
      if (brush.last) {
        wake();
        const vx = p.x - brush.last.x, vy = p.y - brush.last.y;
        for (const cr of cords) {
          for (let i = 2; i <= cr.N; i++) {
            const q = cr.pts[i], d = Math.hypot(q.x - p.x, q.y - p.y);
            if (d < 20) { const f = (1 - d / 20) * .42; q.x += vx * f; q.y += vy * f * .55; }
          }
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
    function drawKnob(c, x, y, ang, shadowOnly, lit) {
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
      if (lit > .05) {
        const rimX = dir < 0 ? -7.5 : 7.5;
        const rim = c.createRadialGradient(rimX, 19, .5, rimX, 19, 12);
        rim.addColorStop(0, `rgba(255, 214, 120, ${(.55 * lit).toFixed(3)})`);
        rim.addColorStop(1, 'rgba(255, 200, 90, 0)');
        c.fillStyle = rim; c.fillRect(-10, 6, 20, 30);
      }
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
    function drawBulb(c, bx, by, ang, sc, lit, shadowOnly) {
      c.save();
      c.translate(bx, by);
      c.rotate(ang - Math.PI / 2);
      c.scale(sc, sc);
      if (shadowOnly) {
        c.fillRect(-6.8, -6.5, 13.6, 13);
        bulbGlassPath(c); c.fill();
        c.restore();
        return;
      }
      // Antique brass screw socket + cord-grip collar
      const sg = c.createLinearGradient(-7, 0, 7, 0);
      sg.addColorStop(0, '#4a3a1f'); sg.addColorStop(.32, '#e8d59e'); sg.addColorStop(.62, '#b0924f'); sg.addColorStop(1, '#3a2c15');
      c.fillStyle = sg;
      c.beginPath();
      if (c.roundRect) c.roundRect(-6.8, -6.5, 13.6, 13, 2.2);
      else c.rect(-6.8, -6.5, 13.6, 13);
      c.fill();
      c.fillStyle = 'rgba(0,0,0,.28)';
      c.fillRect(-6.8, -2.5, 13.6, 1); c.fillRect(-6.8, 1.5, 13.6, 1);
      // Glass Edison bulb envelope + inner reflection
      bulbGlassPath(c);
      if (lit > .05) {
        const bg = c.createRadialGradient(0, 21, 1, 0, 22, 17);
        bg.addColorStop(0, `rgba(255, 254, 238, ${(.45 + .55 * lit).toFixed(3)})`);
        bg.addColorStop(.52, `rgba(255, 222, 118, ${(.3 + .6 * lit).toFixed(3)})`);
        bg.addColorStop(1, `rgba(245, 162, 32, ${(.22 + .56 * lit).toFixed(3)})`);
        c.fillStyle = bg;
      } else {
        c.fillStyle = 'rgba(220, 212, 204, .11)';
      }
      c.fill();
      c.strokeStyle = lit > .2 ? `rgba(255, 218, 130, ${(.45 + .52 * lit).toFixed(2)})` : 'rgba(232, 228, 224, .32)';
      c.lineWidth = 1.15;
      c.stroke();
      // Tungsten spiral filament
      c.beginPath();
      c.moveTo(-3.2, 8); c.lineTo(-2.4, 21);
      c.quadraticCurveTo(-1.2, 27, 0, 21);
      c.quadraticCurveTo(1.2, 27, 2.4, 21);
      c.lineTo(3.2, 8);
      if (lit > .1) { c.shadowColor = '#ffb703'; c.shadowBlur = 12 * lit; }
      c.strokeStyle = lit > .15 ? `rgba(255, 250, 224, ${(.55 + .45 * lit).toFixed(2)})` : 'rgba(214, 204, 186, .42)';
      c.lineWidth = 1.35;
      c.stroke();
      c.shadowBlur = 0;
      // Glass specular rim + lower caustic crescent reflection
      c.strokeStyle = `rgba(255, 255, 255, ${lit > .2 ? .72 : .26})`;
      c.lineWidth = 1.15;
      c.beginPath(); c.moveTo(-8.4, 17.5); c.quadraticCurveTo(-9.6, 22.5, -7.2, 28); c.stroke();
      if (lit > .08) {
        c.strokeStyle = `rgba(255, 245, 195, ${(.48 * lit).toFixed(2)})`;
        c.lineWidth = 1.25;
        c.beginPath(); c.arc(0, 22.5, 9.8, .35 * Math.PI, .65 * Math.PI); c.stroke();
      }
      c.restore();
    }
    function drawBraidedStrands(c, ps, th, litTone, isLit) {
      c.lineCap = 'round'; c.lineJoin = 'round';
      pathThrough(c, ps);
      c.strokeStyle = '#6f6455'; c.lineWidth = th + 1.3; c.stroke();
      c.strokeStyle = litTone; c.lineWidth = th; c.stroke();
      const sm = samples(ps, th * 1.05);
      c.lineWidth = Math.max(.6, th * .24); c.strokeStyle = 'rgba(96,82,64,.55)';
      c.beginPath();
      for (const q of sm) {
        if (q.y < -2) continue;
        const nx = -q.ty, ny = q.tx, h = th * .5;
        c.moveTo(q.x - nx * h - q.tx * h * .7, q.y - ny * h - q.ty * h * .7);
        c.lineTo(q.x + nx * h + q.tx * h * .7, q.y + ny * h + q.ty * h * .7);
      }
      c.stroke();
      c.save(); c.translate(-th * .2, -th * .05); pathThrough(c, ps);
      c.strokeStyle = 'rgba(255,252,244,.58)'; c.lineWidth = th * .28; c.stroke();
      c.restore();
      if (isLit) {
        c.save(); c.translate(dir < 0 ? -th * .36 : th * .36, 0); pathThrough(c, ps);
        c.strokeStyle = `rgba(255, 214, 118, ${(0.5 * bulbLit).toFixed(3)})`;
        c.lineWidth = th * .34; c.stroke();
        c.restore();
      }
    }
    function drawBulbReflections(c, bx, by, sc, lit) {
      if (lit <= .02) return;
      const fx = bx, fy = by + 20 * sc;
      // Soft atmospheric amber bloom fading completely inside canvas boundaries
      const rEdge = dir < 0 ? Math.min(fx - 4, 210 * sc) : Math.min(W - fx - 4, 210 * sc);
      const rMain = Math.max(85 * sc, rEdge);
      const gWall = c.createRadialGradient(fx, fy, 4 * sc, fx, fy, rMain);
      gWall.addColorStop(0, `rgba(255, 246, 198, ${(0.76 * lit).toFixed(3)})`);
      gWall.addColorStop(.28, `rgba(255, 204, 88, ${(0.42 * lit).toFixed(3)})`);
      gWall.addColorStop(.62, `rgba(244, 168, 42, ${(0.18 * lit).toFixed(3)})`);
      gWall.addColorStop(1, 'rgba(244, 168, 42, 0)');
      c.fillStyle = gWall;
      c.beginPath(); c.arc(fx, fy, rMain, 0, Math.PI * 2); c.fill();

      // Ceiling bounce reflection directly above the Edison lamp & braided cords
      c.save();
      c.translate(fx, 8);
      c.scale(1.6, .42);
      const gCeil = c.createRadialGradient(0, 0, 2, 0, 0, 82 * sc);
      gCeil.addColorStop(0, `rgba(255, 216, 116, ${(0.38 * lit).toFixed(3)})`);
      gCeil.addColorStop(.55, `rgba(255, 190, 72, ${(0.14 * lit).toFixed(3)})`);
      gCeil.addColorStop(1, 'rgba(255, 190, 72, 0)');
      c.fillStyle = gCeil;
      c.beginPath(); c.arc(0, 0, 82 * sc, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    function draw() {
      const c = ctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, W, H);
      const rPs = ropeCord.pts, rLast = rPs[ropeCord.N], rPrev = rPs[ropeCord.N - 1];
      const rAng = Math.atan2(rLast.y - rPrev.y, rLast.x - rPrev.x);
      const bPs = bulbCord.pts, bLast = bPs[bulbCord.N], bPrev = bPs[bulbCord.N - 1];
      const bAng = Math.atan2(bLast.y - bPrev.y, bLast.x - bPrev.x);

      // 1. Cast bulb wall/ceiling reflection beneath physical strands & caps
      if (bulbBtn) drawBulbReflections(c, bLast.x, bLast.y, bulbSc, bulbLit);

      // 2. Soft wall drop shadows for all braided strands and end weights
      const sa = parseFloat(getComputedStyle(root).getPropertyValue('--cord-shadow')) || .24;
      c.save(); c.translate(7, 11);
      if ('filter' in c) c.filter = 'blur(3px)';
      c.strokeStyle = `rgba(0,0,0,${sa * .8})`; c.lineWidth = thick + 1; c.lineCap = 'round';
      for (const cr of cords) { pathThrough(c, cr.pts); c.stroke(); }
      c.fillStyle = `rgba(0,0,0,${sa})`;
      drawKnob(c, rLast.x, rLast.y, rAng, true, 0);
      if (bulbBtn) drawBulb(c, bLast.x, bLast.y, bAng, bulbSc, 0, true);
      c.restore();

      // 3. Shared braided cotton rope strands (with warm cross-light reflection when bulb is lit)
      const tone = bulbLit > .35 ? '#e4d9c2' : '#d6ccba';
      if (bulbBtn) drawBraidedStrands(c, bPs, thick, tone, bulbLit > .08);
      drawBraidedStrands(c, rPs, thick, tone, bulbLit > .08);

      // 4. End hardware: Edison bulb + Turned Walnut knob
      if (bulbBtn) {
        drawBulb(c, bLast.x, bLast.y, bAng, bulbSc, bulbLit, false);
        const bx = bLast.x + Math.cos(bAng) * 18 * bulbSc, by = bLast.y + Math.sin(bAng) * 18 * bulbSc;
        bulbBtn.style.transform = `translate(${bx}px, ${by}px)`;
      }
      drawKnob(c, rLast.x, rLast.y, rAng, false, bulbLit);
      const kx = rLast.x + Math.cos(rAng) * 20 * knobS, ky = rLast.y + Math.sin(rAng) * 20 * knobS;
      hit.style.transform = `translate(${kx}px, ${ky}px)`;
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
      const amb = $('#lampAmbient');
      if (amb) amb.classList.toggle('lit', bulbLit > 0.08);
      updateDrag(); acc += dt;
      while (acc >= STEP) { step(STEP); acc -= STEP; }
      if (dropped && live && !activeDrag && now - touchedAt > 2500) {
        for (const cr of cords) for (const q of cr.pts) { q.px += (q.x - q.px) * .06; q.py += (q.y - q.py) * .06; }
      }
      draw();
      let motion = Math.abs(bulbTarget - bulbLit) * 4;
      for (const cr of cords) {
        motion += Math.abs(cr.extV) + Math.abs(cr.ext);
        for (const q of cr.pts) motion = Math.max(motion, Math.abs(q.x - q.px) + Math.abs(q.y - q.py));
      }
      if (dropped && live && !activeDrag && motion < .06) {
        if (++still > 30) {
          for (const cr of cords) for (const q of cr.pts) { q.px = q.x; q.py = q.y; }
          sleeping = true; return;
        }
      } else still = 0;
      requestAnimationFrame(loop);
    }

    layout();
    for (const cr of cords) {
      cr.pts.forEach((p, i) => {
        p.y = p.py = -cr.hidden - i * cr.seg * .6;
        p.x = p.px = cr.ax + Math.sin(i * .5) * (cr.isBulb ? -1.2 : 1.2);
      });
    }
    const drop = () => {
      dropped = true;
      for (const cr of cords) for (const p of cr.pts) p.px = p.x + (cr.isBulb ? .45 : -.45);
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

    const DOOR_ACCENTS = ['#2DD4BF', '#D8B4FE', '#6EE7B7', '#FB923C', '#94A3B8'];
    const DOOR_ACCENTS_LIGHT = ['#0E7490', '#6B21A8', '#047857', '#C2410C', '#334155'];
    const dinfo = $('#dinfo'), wallEl = $('.doors__wall', sec), MOB = matchMedia('(max-width: 639.98px)');
    const setInfo = i => {
      dinfo.querySelector('.dinfo__h').textContent = INFO[i][0];
      dinfo.querySelector('.dinfo__t').textContent = INFO[i][1];
      dinfo.querySelector('.dinfo__p').innerHTML = INFO[i][2].map(s => `<li>${s}</li>`).join('');
      const col = getMode() === 'dark' ? DOOR_ACCENTS[i] : DOOR_ACCENTS_LIGHT[i];
      if (col) dinfo.style.setProperty('--dinfo-accent', col);
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
      addEventListener('pointermove', e => {
        px = e.clientX; py = e.clientY; set(under(e.target));
        const sr = sec.getBoundingClientRect();
        const inside = sr.top < innerHeight && sr.bottom > 0 && px >= sr.left && px <= sr.right && py >= sr.top && py <= sr.bottom;
        sec.classList.toggle('lit', inside);
        if (inside) {
          sec.style.setProperty('--lx', `${(px - sr.left).toFixed(1)}px`);
          sec.style.setProperty('--ly', `${(py - sr.top).toFixed(1)}px`);
        }
      }, { passive: true });
      addEventListener('scroll', () => { if (px >= 0) set(under(document.elementFromPoint(px, py))); }, { passive: true });
      document.documentElement.addEventListener('pointerleave', () => { set(-1); sec.classList.remove('lit'); });
      addEventListener('blur', () => { set(-1); sec.classList.remove('lit'); });
      window.__doorHover = set;
    }

    /* Mobile Doors Sticky Carousel */
    const mRow = $('.doors__row', sec), mPin = $('.doors__pin', sec), mDots = $('.doors__dots', sec);
    let mIdx = 0, mForce = -1, mShown = -1, mCur = 0, mRaf = 0, mLast = 0, swipeLock = 0, mStep = 0;
    const mSpan = () => Math.max(1, sec.offsetHeight - innerHeight);
    const mobY = i => sec.getBoundingClientRect().top + pageYOffset + (Math.min(4, Math.max(0, i)) / 4) * mSpan();
    const mDwell = f => { const i = Math.floor(f), t = f - i, u = Math.min(1, Math.max(0, (t - .2) / .6)); return i + u * u * (3 - 2 * u); };
    const mProgress = () => Math.min(1, Math.max(0, -sec.getBoundingClientRect().top / mSpan()));
    const mTarget = () => mForce >= 0 ? mForce : mDwell(mProgress() * 4);

    function mShow(i) {
      if (i === mShown) return;
      mShown = i; setInfo(i);
      if (!MOB.matches) warm(i);
      mDots?.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === Math.min(4, i)));
    }
    function mFrame(now) {
      mRaf = 0;
      if (!MOB.matches) { mRow.style.transform = ''; return; }
      const dt = Math.min(64, now - (mLast || now)); mLast = now;
      const t = mTarget();
      mCur = reduced ? t : mCur + (t - mCur) * Math.min(1, dt / 1000 * 22);
      mCur = Math.max(t - 1, Math.min(t + 1, mCur));
      if (Math.abs(t - mCur) < .002) mCur = t;
      const step = mStep || (units[1]?.offsetLeft - units[0]?.offsetLeft) || (innerWidth * 0.44);
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
      if (units[1] && units[0]) mStep = units[1].offsetLeft - units[0].offsetLeft;
      mApply();
    }
    mSize(); addEventListener('resize', mSize); document.fonts?.ready.then(mSize);
    function mFromScroll() {
      if (!MOB.matches || busy) return;
      mApply();
    }
    addEventListener('scroll', mFromScroll, { passive: true });
    let tx0 = 0, ty0 = 0, i0 = 0;
    sec.addEventListener('touchstart', e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; i0 = Math.round(mProgress() * 4); }, { passive: true });
    sec.addEventListener('touchend', e => {
      if (!MOB.matches || busy || mForce >= 0) return;
      const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
      if (Math.abs(dx) < 32 || Math.abs(dx) < Math.abs(dy) * 1.1) return;
      const to = Math.min(4, Math.max(0, i0 + (dx < 0 ? 1 : -1)));
      swipeLock = performance.now() + 380;
      window.__snapTo(mobY(to));
    }, { passive: true });
    mDots?.querySelectorAll('i').forEach((dot, k) => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', e => {
        e.stopPropagation();
        if (MOB.matches) window.__snapTo(mobY(k));
      });
    });
    if (MOB.matches) { mShow(0); dinfo.classList.add('on'); mCur = mTarget(); mApply(); }
    MOB.addEventListener?.('change', () => { mForce = -1; mShown = -1; mFromScroll(); mApply(); if (MOB.matches) dinfo.classList.add('on'); });

    const SECRET = 4, secretUnit = units[SECRET];
    function reveal(on) {
      sec.classList.toggle('reveal', on);
      if (secretUnit) { if (on) secretUnit.removeAttribute('inert'); else secretUnit.setAttribute('inert', ''); }
    }

    window.openDoor = i => {
      if (busy || inWall) return;
      if (MOB.matches) {
        location.href = ROUTES[i];
        return;
      }
      const top = sec.getBoundingClientRect().top + pageYOffset;
      if (Math.abs(pageYOffset - top) > 4) scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
      const t0 = performance.now();
      warm(i);
      const settle = () => {
        if (Math.abs(pageYOffset - top) > 24 && performance.now() - t0 < 1200) return requestAnimationFrame(settle);
        let wait = 0;
        if (i === SECRET && !sec.classList.contains('reveal')) { reveal(true); wait = reduced ? 0 : 750; }
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
      setTimeout(() => through(i), reduced ? 0 : (MOB.matches ? 160 : 520));
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
      sec.classList.add('through');

      if (MOB.matches) {
        // Instant native mobile navigation: zero memory leak, 100% native viewport
        u.style.transition = 'transform .18s ease, opacity .18s ease';
        u.style.transform = 'scale(0.96)';
        setTimeout(() => {
          location.href = ROUTES[i];
        }, 120);
        return;
      }

      const sr = z.getBoundingClientRect();
      z.style.transformOrigin = `${cx - sr.left}px ${cy - sr.top}px`;
      const tx = innerWidth / 2 - cx, ty = innerHeight / 2 - cy;
      const sEnd = Math.min(6.5, Math.max(innerWidth / gw, innerHeight / gh) * 1.05);
      const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
      const zoomOf = e => Math.exp(Math.log(sEnd) * e);
      const t0 = performance.now(), D = reduced ? 1 : 680;
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

          if (MOB.matches) {
            // Mobile: instant zero-lag reset to native 100% viewport scale
            z.style.transform = ''; z.style.transformOrigin = '';
            sec.classList.remove('through', 'lift');
            doorsState[cur].s.set(0);
            $('#cord')?.classList.remove('away'); $('.hdr')?.classList.remove('away');
            busy = false; holdScroll(false);
            if (afterLeave) { const f = afterLeave; afterLeave = null; setTimeout(f, 40); }
            units[cur]?.querySelector('.doorway')?.focus?.({ preventScroll: true });
            return;
          }

          const from = z.style.transform;
          const m = /translate\(([-\d.]+)px, ([-\d.]+)px\) scale\(([\d.]+)\)/.exec(from) || [0, 0, 0, 1];
          const X = +m[1], Y = +m[2], S = +m[3], t0 = performance.now(), D = reduced ? 1 : 420;
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
                units[SECRET - 1].querySelector('.doorway').focus({ preventScroll: true });
              } else doorsState[cur].way.focus({ preventScroll: true });
            }
          };
          requestAnimationFrame(step);
        }, reduced ? 0 : 40);
      }, reduced ? 0 : 80);
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
    window.openHolo = show;
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

    // Offline ISO-18004 SVG QR Code (Ver 1-4 Byte Mode L) + 1-Click .vcf Contact Card
    function buildQrSvg(text) {
      const bytes = [...new TextEncoder().encode(text)];
      const SPECS = [
        null,
        { size: 21, data: 19, ec: 7, align: [] },
        { size: 25, data: 34, ec: 10, align: [6, 18] },
        { size: 29, data: 55, ec: 15, align: [6, 22] },
        { size: 33, data: 80, ec: 20, align: [6, 26] }
      ];
      const spec = SPECS.find(s => s && bytes.length <= s.data - 2);
      if (!spec) return '';
      const { size: N, data: DATA_CW, ec: EC_CW, align } = spec;
      const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
      for (let i = 0, x = 1; i < 255; i++) { EXP[i] = EXP[i + 255] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
      const mul = (a, b) => (a && b) ? EXP[LOG[a] + LOG[b]] : 0;
      let gen = [1];
      for (let i = 0; i < EC_CW; i++) {
        const next = new Array(gen.length + 1).fill(0);
        for (let j = 0; j < gen.length; j++) { next[j] ^= gen[j]; next[j + 1] ^= mul(gen[j], EXP[i]); }
        gen = next;
      }
      const bits = [];
      const push = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >> i) & 1); };
      push(4, 4); push(bytes.length, 8); bytes.forEach(b => push(b, 8));
      for (let i = 0; i < 4 && bits.length < DATA_CW * 8; i++) bits.push(0);
      while (bits.length % 8) bits.push(0);
      const cw = [];
      for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; cw.push(b); }
      for (let pi = 0; cw.length < DATA_CW; pi ^= 1) cw.push(pi ? 0x11 : 0xec);
      const msg = cw.concat(new Array(EC_CW).fill(0));
      for (let i = 0; i < DATA_CW; i++) {
        const coef = msg[i];
        if (coef) for (let j = 0; j < gen.length; j++) msg[i + j] ^= mul(gen[j], coef);
      }
      const allBits = [];
      cw.concat(msg.slice(DATA_CW)).forEach(v => { for (let i = 7; i >= 0; i--) allBits.push((v >> i) & 1); });
      const mat = Array.from({ length: N }, () => new Int8Array(N));
      const fn = Array.from({ length: N }, () => new Uint8Array(N));
      const setFn = (r, c, v) => { if (r >= 0 && r < N && c >= 0 && c < N) { mat[r][c] = v ? 1 : 0; fn[r][c] = 1; } };
      const finder = (r0, c0) => {
        for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
          setFn(r0 + dr, c0 + dc, dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)));
        }
      };
      finder(0, 0); finder(0, N - 7); finder(N - 7, 0);
      for (let i = 8; i < N - 8; i++) { setFn(6, i, (i & 1) === 0); setFn(i, 6, (i & 1) === 0); }
      for (const ar of align) for (const ac of align) {
        if (fn[ar][ac]) continue;
        for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) setFn(ar + dr, ac + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
      }
      setFn(N - 8, 8, 1);
      for (let i = 0; i < 9; i++) { if (i !== 6) { setFn(8, i, 0); setFn(i, 8, 0); } }
      for (let i = 0; i < 8; i++) { setFn(8, N - 1 - i, 0); if (i < 7) setFn(N - 1 - i, 8, 0); }
      let bi = 0, dir = -1;
      for (let col = N - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        for (let k = 0; k < N; k++) {
          const r = dir < 0 ? N - 1 - k : k;
          for (const c of [col, col - 1]) if (!fn[r][c]) mat[r][c] = bi < allBits.length ? allBits[bi++] : 0;
        }
        dir *= -1;
      }
      const MASKS = [
        (r, c) => (r + c) % 2 === 0, r => r % 2 === 0, (_, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
        (r, c) => ((r >> 1) + ((c / 3) | 0)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
        (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0
      ];
      let bestG = null, bestPen = Infinity;
      for (let m = 0; m < 8; m++) {
        const g = mat.map((row, r) => row.map((v, c) => fn[r][c] ? v : (v ^ (MASKS[m](r, c) ? 1 : 0))));
        const d5 = (1 << 3) | m; let rem = d5 << 10;
        for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= (0x537 << (i - 10));
        const fmt = ((d5 << 10) | rem) ^ 0x5412;
        for (let i = 0; i < 15; i++) {
          const bit = (fmt >> (14 - i)) & 1;
          if (i < 6) g[8][i] = bit; else if (i === 6) g[8][7] = bit; else if (i === 7) g[8][8] = bit; else if (i === 8) g[7][8] = bit; else g[14 - i][8] = bit;
          if (i < 7) g[N - 1 - i][8] = bit; else g[8][N - 15 + i] = bit;
        }
        let pen = 0, dark = 0;
        for (let i = 0; i < N; i++) {
          let rc = 1, cc = 1;
          for (let j = 1; j < N; j++) {
            rc = g[i][j] === g[i][j - 1] ? rc + 1 : 1; if (rc === 5) pen += 3; else if (rc > 5) pen += 1;
            cc = g[j][i] === g[j - 1][i] ? cc + 1 : 1; if (cc === 5) pen += 3; else if (cc > 5) pen += 1;
          }
          for (let j = 0; j < N; j++) dark += g[i][j];
        }
        for (let r = 0; r < N - 1; r++) for (let c = 0; c < N - 1; c++) {
          const s = g[r][c] + g[r][c + 1] + g[r + 1][c] + g[r + 1][c + 1];
          if (s === 0 || s === 4) pen += 3;
        }
        pen += Math.floor(Math.abs(dark * 100 / (N * N) - 50) / 5) * 10;
        if (pen < bestPen) { bestPen = pen; bestG = g; }
      }
      let pathD = '';
      for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (bestG[r][c]) pathD += `M${c},${r}h1v1h-1z`;
      return `<svg viewBox="-1 -1 ${N + 2} ${N + 2}" shape-rendering="crispEdges" role="img" aria-label="QR Code for Dev Patel Portfolio"><rect x="-1" y="-1" width="${N + 2}" height="${N + 2}" fill="#f8f5ef"/><path d="${pathD}" fill="#1a1410"/></svg>`;
    }

    const qrSlot = $('#hcQr');
    const targetUrl = (location.protocol === 'https:' && location.origin.length <= 64)
      ? `${location.origin}/` : 'https://dev-7-patel-portfolio.vercel.app/';
    if (qrSlot) qrSlot.innerHTML = buildQrSvg(targetUrl);

    $('#holoVcf')?.addEventListener('click', () => {
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Patel;Dev;;;',
        'FN:Dev Patel',
        'TITLE:GenAI, AI/ML & Data Systems Engineer',
        'TEL;TYPE=CELL:+919328977322',
        'EMAIL;TYPE=INTERNET:devpatel846211@gmail.com',
        `URL:${targetUrl}`,
        'ADR;TYPE=HOME:;;Ahmedabad;Gujarat;;India',
        'NOTE:Power BI | 3NF MySQL | 99.1% Crop ML | Multi-PDF Vector RAG | github.com/Devpatel7777',
        'END:VCARD'
      ].join('\r\n');
      const a = document.createElement('a');
      a.href = 'data:text/vcard;charset=utf-8,' + encodeURIComponent(vcard);
      a.download = 'Dev_Patel.vcf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      const btn = $('#holoVcf');
      if (btn) {
        const prev = btn.textContent;
        btn.textContent = 'Saved Contact ✓';
        setTimeout(() => { btn.textContent = prev; }, 1800);
      }
    });
  })();

  /* ---------- Dev-AI Atelier Concierge Studio (Role Lenses, Match Scorecard, RAG Pipeline & Handoff) ---------- */
  (function initRecruiterCopilot() {
    const modalEl = $('#copilot'), panel = $('#cpPanel'), log = $('#cpLog');
    const formEl = $('#cpForm'), inp = $('#cpInput'), copyBriefBtn = $('#cpCopyBrief');
    if (!modalEl || !log) return;

    const DOORS = [
      { id: 0, label: 'Door 01 · Power BI' },
      { id: 1, label: 'Door 02 · SQL Systems' },
      { id: 2, label: 'Door 03 · ML Models' },
      { id: 3, label: 'Door 04 · GenAI & RAG' },
      { id: 4, label: 'Door 05 · CLI Lab' }
    ];
    const MODAL_ROLES = {
      analyst: 'Data Analyst / BI Role',
      ds: 'Data Scientist Role',
      aiml: 'ML / AI Engineering Role'
    };

    const KB = [
      {
        id: 'genai-rag', title: 'Multi-PDF Vector RAG & LangGraph Agents', door: 3, resume: 'aiml',
        tags: ['genai', 'rag', 'llm', 'gemini', 'groq', 'langgraph', 'langchain', 'agent', 'travel', 'serper', 'vector', 'embedding', 'chatbot', 'hallucination', 'prompt', 'thingqbator', 'aiml', 'ai', 'ml', 'fastapi', 'streamlit'],
        kpis: [['Top-k = 4', 'Grounded Chunks'], ['280ms', 'Serper Live Search'], ['410ms', 'Groq LPU Inference']],
        skills: ['Gemini Vector RAG', 'LangGraph', 'Groq LPU', 'Serper Agents'],
        followups: [['ml', 'Show 99.1% ML benchmarks'], ['hiring', 'Availability & notice period']],
        text: 'Dev builds **production GenAI systems** designed to eliminate hallucinations with mathematical grounding. His **Multi-PDF Vector RAG Suite** chunks documents via recursive `1000/150` token splits and Gemini embeddings with strict page-level citation anchors, while his **LangGraph Travel Planner** pairs Groq LPUs (~410ms turnaround) with live Serper search for sub-second multi-step tool orchestration.',
        bullets: ['**Deterministic Grounding:** Verifiable source citations stop unverified LLM generation', '**Autonomous Routing:** LangGraph state machine handles conditional tool branches and error recovery']
      },
      {
        id: 'ml-crop', title: 'Supervised ML & 5-Fold Cross-Validation', door: 2, resume: 'ds',
        tags: ['ml', 'xgboost', 'scikit', 'sklearn', 'random', 'forest', 'gaussian', 'classification', 'regression', 'crop', 'boston', 'housing', 'iqr', 'zscore', 'cross', 'validation', 'cv', '99.1', 'feature', 'scientist', 'ds', 'model', 'python'],
        kpis: [['99.1%', 'Gaussian NB 5-Fold CV'], ['99.0%', 'XGBoost 5-Fold CV'], ['22 Classes', 'Crop Classifier']],
        skills: ['XGBoost', 'Scikit-learn', '5-Fold CV', 'IQR / Z-Score'],
        followups: [['rag', 'Inspect Multi-PDF RAG stack'], ['eda', 'View 500k+ internship EDA']],
        text: 'Dev implements **zero-data-leakage ML pipelines** with strict statistical validation. He engineered a 22-class Crop Recommendation classifier achieving **99.1% 5-Fold Cross-Validation** (benchmarked across GaussianNB, XGBoost, KNN & LogReg), isolating StandardScaler and IQR bounds strictly inside each validation fold to guarantee high test-time generalization with sub-2.1ms CPU inference.',
        bullets: ['**Zero-Leak Protocol:** Feature scaling fit strictly on training folds to prevent target contamination', '**Production Inference:** Ultra-lightweight sub-2.1ms CPU latency served in an interactive Streamlit UI']
      },
      {
        id: 'eda-prodigy', title: 'Prodigy InfoTech Data Science Internship', door: 1, resume: 'ds',
        tags: ['prodigy', 'internship', 'intern', 'experience', '500k', '500000', 'eda', 'kmeans', 'clustering', 'decision', 'sentiment', 'outstanding', 'clean', 'noise', '30%', 'pandas', 'numpy'],
        kpis: [['500,000+', 'Records Audited'], ['99.8%', 'Anomaly Cleanup'], ['Outstanding', 'Mentor Remarks']],
        skills: ['500k+ Row EDA', 'Pandas & SQL', 'K-Means', 'Decision Trees'],
        followups: [['role:ds', 'View Data Scientist fit'], ['ml', 'See 99.1% ML benchmarks']],
        text: 'During his Data Science internship at **Prodigy InfoTech**, Dev earned **"Outstanding Remarks"** by auditing **500,000+ raw records**, creating automated Python/SQL sanitizers that slashed pipeline noise by **30%**, and deploying Decision Tree and K-Means segmentation models that delivered high-confidence cohort intelligence directly to engineering mentors.',
        bullets: ['**Scale Under Pressure:** Automated IQR & median imputation routines across high-cardinality feeds', '**Mentorship Recognition:** Awarded highest performance tier for data integrity and speed to insight']
      },
      {
        id: 'bi-powerbi', title: 'Power BI Star Schema & DAX Engine', door: 0, resume: 'analyst',
        tags: ['powerbi', 'power', 'bi', 'dax', 'star', 'schema', 'dashboard', 'kpi', 'yoy', 'revenue', 'ecommerce', '10k', '10420', 'analyst', 'tata', 'deloitte', 'visual'],
        kpis: [['10,420+', 'Orders Modeled'], ['₹48.6L', 'Tracked Revenue'], ['31.4%', 'Average Margin']],
        skills: ['Power BI', 'DAX YoY', 'Star Schema', 'TATA & Deloitte Sims'],
        followups: [['role:analyst', 'Analyst fit breakdown'], ['eda', '500k+ SQL & EDA proof']],
        text: 'Dev designs **executive decision portals** that replace spreadsheet guesswork with clean semantic modeling. He structured **10,420+ e-commerce transactions (₹48.6L revenue, 31.4% gross margin)** into an optimized Star Schema with custom DAX time-intelligence (YoY delta, AOV, cohort retention) aligned with TATA GenAI and Deloitte analytics standards.',
        bullets: ['**Star Architecture:** FactSales normalized with integer keys across Date, Product, and Customer dimensions', '**Instant Drilldown:** Sub-second filter propagation across West, South, and East regional cohorts']
      },
      {
        id: 'sql-3nf', title: 'MySQL 3NF Architecture & Query Engine', door: 1, resume: 'analyst',
        tags: ['sql', 'mysql', 'postgresql', 'postgres', '3nf', 'cte', 'window', 'rank', 'lag', 'coalesce', 'database', 'oltp', 'olap', 'schema'],
        kpis: [['6 Tables', 'ACID 3NF Model'], ['DENSE_RANK', 'Window Analytics'], ['38.4%', 'Peak Cohort Repeat']],
        skills: ['MySQL 8.0', 'Recursive CTEs', 'Window Functions', '3NF Modeling'],
        followups: [['role:analyst', 'Open Power BI + SQL fit'], ['eda', '500k+ Pandas & SQL audit']],
        text: 'Dev architects **high-performance relational backbones**. He modeled a normalized **6-table 3NF MySQL/PostgreSQL architecture** leveraging recursive CTEs, analytical window ranking (`DENSE_RANK`, `LAG`), defensive `COALESCE` null handling, and cohort repeat retention views that bridge high-frequency OLTP writes with sub-second analytical reporting.',
        bullets: ['**3NF Normalization:** Zero write anomalies with clean surrogate keys and transactional integrity', '**Analytical Depth:** Complex recursive CTEs calculate customer lifetime value and churn velocity']
      },
      {
        id: 'profile-hiring', title: 'Education, Notice Period & Direct Reach', door: 4, resume: 'aiml',
        tags: ['hire', 'hiring', 'available', 'availability', 'join', 'immediate', 'notice', 'relocate', 'location', 'ahmedabad', 'vadodara', 'remote', 'degree', 'btech', 'parul', 'diploma', 'contact', 'email', 'phone', 'github', 'repos', '34', 'ctc', 'who', 'dev', 'patel'],
        kpis: [['Immediate', 'Notice Period'], ['B.Tech ’25', 'Parul Univ. CSE'], ['34+ Repos', 'Public GitHub']],
        skills: ['Immediate Joiner', 'Ahmedabad / Remote', 'Relocation Ready'],
        followups: [['whyhire', 'Why hire Dev over other grads?'], ['rag', 'Inspect GenAI & RAG stack']],
        text: 'Dev Patel graduated **B.Tech CSE (2022–2025, Parul University)** following a Diploma in CE (Growmore, 2019–2022). He is an **immediate joiner (0-day notice)** based in Ahmedabad/Gandhinagar, fully open to relocate across India or contribute remotely. Backed by **34+ public GitHub repositories** and 3 specialized ATS single-page resumes, he brings immediate velocity.',
        bullets: ['**Direct Channel:** `+91 93289 77322` · `devpatel846211@gmail.com`', '**Verified Credentials:** Prodigy InfoTech Intern (Outstanding Remarks) · TATA · Deloitte · Nasscom thingQbator']
      }
    ];

    const PRESETS = {
      'role:aiml': {
        userLabel: 'Evaluate Dev for GenAI & AI/ML Engineer',
        intent: 'role_fit: genai_aiml',
        score: 97,
        text: '🚀 **High-Conviction Fit for GenAI & AI/ML Engineering Roles** — Dev bridges data science discipline with production agent engineering. He builds grounded Multi-PDF RAG suites (Gemini embeddings + page citations) and real-time LangGraph agents alongside mathematically rigorous 99.1% 5-fold CV classifiers.',
        bullets: [KB[0].text, '**ML Rigor:** 99.1% 5-fold CV Crop classifier + 500,000+ row internship data audit'],
        kpis: KB[0].kpis,
        skills: ['Gemini Vector RAG', 'LangGraph', 'Groq LPU', 'XGBoost', 'Python'],
        followups: KB[0].followups,
        resumes: ['aiml'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .97 }, { id: 'ml-crop', score: .91 }, { id: 'eda-prodigy', score: .87 }]
      },
      'role:ds': {
        userLabel: 'Evaluate Dev for Data Scientist',
        intent: 'role_fit: data_scientist',
        score: 96,
        text: '📊 **High-Conviction Fit for Data Scientist Roles** — Proven at scale with 500,000+ audited records during his Prodigy InfoTech internship (*Outstanding Remarks*), paired with zero-data-leakage 5-fold cross-validation modeling and production vector retrieval.',
        bullets: ['**Supervised ML:** 99.1% 5-fold CV accuracy with fold-isolated scaling + IQR/Z-score outlier gates', '**GenAI Edge:** Multi-PDF Vector RAG & LangGraph tool calling for automated document extraction'],
        kpis: KB[2].kpis,
        skills: ['500k+ Row EDA', 'Scikit-learn', 'XGBoost', 'K-Means', 'SQL'],
        followups: KB[2].followups,
        resumes: ['ds'],
        door: 2,
        chunks: [{ id: 'eda-prodigy', score: .96 }, { id: 'ml-crop', score: .94 }, { id: 'sql-3nf', score: .85 }]
      },
      'role:analyst': {
        userLabel: 'Evaluate Dev for Data Analyst & BI',
        intent: 'role_fit: data_analyst',
        score: 97,
        text: '📈 **High-Conviction Fit for Data Analyst & BI Roles** — Builds executive Power BI Star Schemas with custom DAX YoY time-intelligence, 6-table 3NF MySQL analytical models with recursive CTEs, and verified TATA & Deloitte simulation credentials.',
        bullets: ['**SQL Precision:** Recursive CTEs, `DENSE_RANK` window ranking & cohort retention aggregations', '**Scale & Cleanliness:** Audited 500k+ records, cutting pipeline noise by 30% with Python & SQL'],
        kpis: KB[3].kpis,
        skills: ['Power BI', 'DAX YoY', 'MySQL 3NF', 'Python EDA'],
        followups: KB[3].followups,
        resumes: ['analyst'],
        door: 0,
        chunks: [{ id: 'bi-powerbi', score: .97 }, { id: 'sql-3nf', score: .93 }, { id: 'eda-prodigy', score: .90 }]
      },
      'summary': {
        userLabel: null,
        intent: 'executive_brief',
        score: 98,
        text: '👋 **Dev Patel — High-Impact Technical Dossier:** B.Tech CSE (`Parul ’25`) & Prodigy InfoTech Data Science Intern (*Outstanding Remarks*, `500k+` records). Dev pairs **data engineering scale** with **zero-leakage ML (99.1% CV)** and **grounded GenAI RAG agents**. Immediate joiner ready to ship high-impact software on Day 1.',
        bullets: ['**GenAI & Agents:** Gemini Multi-PDF RAG with page citations + LangGraph tool routing (~410ms Groq turnaround)', '**ML Rigor:** 99.1% 5-fold CV Crop classifier with isolated StandardScaler (sub-2.1ms inference)', '**Data & BI:** 10,420+ row Power BI Star Schema (`₹48.6L` tracked) + 6-table 3NF MySQL CTEs'],
        kpis: [['Immediate', 'Notice Period'], ['500k+ Rows', 'Audited @ Prodigy'], ['99.1% CV', 'Zero Leakage ML']],
        skills: ['GenAI & RAG', 'LangGraph', 'Scikit-learn', 'Power BI / DAX', 'MySQL 3NF'],
        followups: [['whyhire', 'Why hire Dev over other grads?'], ['rag', 'How is Multi-PDF RAG built?'], ['hiring', 'Notice period & contact']],
        resumes: ['aiml', 'ds', 'analyst'],
        door: 3,
        chunks: [{ id: 'profile-hiring', score: .98 }, { id: 'genai-rag', score: .94 }, { id: 'eda-prodigy', score: .91 }]
      },
      'whyhire': {
        userLabel: 'Why should we hire Dev Patel?',
        intent: 'candidate_value_proposition',
        score: 99,
        text: '🔥 **3 Reasons Dev Patel delivers immediate ROI over typical junior engineers:**\n1. **Proven Scale:** In his Prodigy InfoTech internship, he didn’t just train toy models—he audited **500,000+ raw records**, cutting pipeline noise by **30%** with automated Python/SQL sanitizers (*Outstanding Remarks*).\n2. **Zero-Leakage ML & GenAI Systems:** He understands real-world machine learning pitfalls (strictly isolating StandardScaler and IQR bounds inside each CV fold for 99.1% accuracy) and builds production RAG pipelines with verifiable citations.\n3. **Full-Stack Data Fluency:** Seamless across 6-table 3NF databases, executive Power BI DAX dashboards, and autonomous LangGraph agents.',
        bullets: ['**Speed to Ship:** Immediate joiner (0-day notice), 34+ public GitHub repos, ready to contribute from week one', '**Dual Discipline:** Bridges backend data engineering with user-facing AI interfaces'],
        kpis: [['Immediate', '0-Day Notice'], ['500k+ Rows', 'Real Audit'], ['99.1% ML', 'Zero Data Leak']],
        skills: ['Immediate Value', 'Clean Code', 'Zero Leakage', 'Autonomous Agents'],
        followups: [['rag', 'Inspect Multi-PDF RAG stack'], ['ml', 'View 99.1% ML proof'], ['hiring', 'Notice & Contact Dev']],
        resumes: ['aiml', 'ds', 'analyst'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .99 }, { id: 'eda-prodigy', score: .97 }, { id: 'ml-crop', score: .95 }]
      },
      'rag': {
        userLabel: 'Multi-PDF RAG & Agent Architecture',
        intent: 'technical_architecture',
        score: 98,
        text: KB[0].text,
        bullets: KB[0].bullets,
        kpis: KB[0].kpis,
        skills: KB[0].skills,
        followups: KB[0].followups,
        resumes: ['aiml'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .98 }, { id: 'ml-crop', score: .89 }, { id: 'profile-hiring', score: .84 }]
      },
      'ml': {
        userLabel: '99.1% 5-Fold CV Crop ML Benchmarks',
        intent: 'ml_benchmarks',
        score: 96,
        text: KB[1].text,
        bullets: KB[1].bullets,
        kpis: KB[1].kpis,
        skills: KB[1].skills,
        followups: KB[1].followups,
        resumes: ['ds'],
        door: 2,
        chunks: [{ id: 'ml-crop', score: .96 }, { id: 'eda-prodigy', score: .90 }, { id: 'genai-rag', score: .84 }]
      },
      'eda': {
        userLabel: '500k+ Row Prodigy InfoTech Internship EDA',
        intent: 'internship_scale',
        score: 96,
        text: KB[2].text,
        bullets: KB[2].bullets,
        kpis: KB[2].kpis,
        skills: KB[2].skills,
        followups: KB[2].followups,
        resumes: ['ds'],
        door: 1,
        chunks: [{ id: 'eda-prodigy', score: .96 }, { id: 'sql-3nf', score: .91 }, { id: 'bi-powerbi', score: .85 }]
      },
      'hiring': {
        userLabel: 'Notice Period, Location & Education',
        intent: 'hiring_logistics',
        score: 97,
        text: KB[5].text,
        bullets: KB[5].bullets,
        kpis: KB[5].kpis,
        skills: KB[5].skills,
        followups: KB[5].followups,
        resumes: ['aiml', 'ds', 'analyst'],
        door: 4,
        chunks: [{ id: 'profile-hiring', score: .97 }, { id: 'eda-prodigy', score: .88 }, { id: 'genai-rag', score: .84 }]
      },
      'qna': {
        userLabel: 'Interview Cross-Questions & Architecture Trade-offs',
        intent: 'interview_cross_examination',
        score: 99,
        text: 'Ask Dev tough **engineering & design trade-off questions** before scheduling. Here are the sharpest system decisions across his 3 flagship stacks:',
        qna: [
          ['Why recursive 1000/150 chunking over semantic chunking in RAG?', 'Deterministic chunk bounds predictably fit Groq/Gemini context windows with 4 cited top-k spans (~410ms LPU turnaround), avoiding variable latency spikes from an extra embedding pass on every paragraph boundary.'],
          ['How did you verify 99.1% Crop ML had zero data leakage?', 'StandardScaler & IQR/Z-score statistics fit strictly inside each fold of 5-fold CV (never on global train+val). Crop N/P/K & rainfall clusters naturally separate 22 crops, with XGBoost (99.0%) confirming consistency.'],
          ['Why maintain 6-table 3NF MySQL AND a Power BI Star Schema?', 'OLTP writes normalize into 3NF to stop update anomalies; analytical slicing aggregates cleanly into FactSales + DimDate/Product/Region so DAX YoY measures run against clean integer joins.']
        ],
        kpis: [['Zero Leak', 'Fold-Isolated CV'], ['1000 / 150', 'Chunk / Overlap'], ['3NF → Star', 'OLTP to OLAP']],
        skills: ['System Trade-offs', 'Zero Leakage Proof', 'Citation Guardrails'],
        followups: [['rag', 'Multi-PDF RAG stack'], ['ml', '99.1% ML benchmarks']],
        resumes: ['aiml', 'ds', 'analyst'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .99 }, { id: 'ml-crop', score: .96 }, { id: 'sql-3nf', score: .94 }]
      },
      'ats': {
        userLabel: 'Scan Job Description (JD) & ATS Keyword Fit',
        intent: 'ats_keyword_matcher',
        score: 98,
        text: 'Dev’s technical profile scores a **98% ATS Match** across enterprise data analytics and GenAI engineering roles. All 3 tailored dossiers are ATS-verified single-page PDFs.',
        kpis: [['98% Match', 'JD Keyword Score'], ['3 Dossiers', 'ATS-Verified PDFs'], ['Immediate', 'Notice Period']],
        skills: ['Python / Pandas', 'LangGraph Agents', '99.1% Cross-Val', 'Power BI DAX', 'MySQL 3NF', 'FastAPI'],
        bullets: [
          '**Zero Graphical Blockers:** Single-column semantic text structures parsed cleanly by Workday, Greenhouse & Lever.',
          '**Keyword Density:** Multi-PDF RAG, Vector Search, 5-Fold CV, Star Schemas, CTEs, and 500k row EDA verified.'
        ],
        followups: [['rag', 'Multi-PDF RAG Stack'], ['hiring', 'Notice & Hire Dev']],
        resumes: ['aiml', 'ds', 'analyst'],
        door: 3,
        chunks: [{ id: 'genai-rag', score: .98 }, { id: 'ml-crop', score: .95 }, { id: 'profile-hiring', score: .92 }]
      }
    };

    const SKILL_MATCHERS = [
      ['Python', ['python', 'pandas', 'numpy']],
      ['Vector RAG', ['rag', 'vector', 'embedding', 'pdf', 'retrieval', 'gemini']],
      ['LangGraph / Agents', ['langgraph', 'langchain', 'agent', 'groq', 'serper', 'llm', 'genai']],
      ['XGBoost / Sklearn', ['xgboost', 'scikit', 'sklearn', 'ml', 'model', 'classification', 'regression', 'cv']],
      ['500k+ EDA', ['eda', 'prodigy', 'kmeans', 'clustering', 'clean']],
      ['MySQL / PostgreSQL', ['sql', 'mysql', 'postgres', 'postgresql', 'cte', '3nf', 'window']],
      ['Power BI / DAX', ['powerbi', 'power', 'bi', 'dax', 'dashboard', 'kpi', 'star']]
    ];

    const expandTokens = raw => {
      const toks = raw.toLowerCase().replace(/[^a-z0-9+.#]+/g, ' ').split(/\s+/).filter(w => w.length > 1);
      const out = new Set(toks);
      if (out.has('llm') || out.has('bot') || out.has('gpt') || out.has('ai') || out.has('agent') || out.has('agents')) { out.add('genai'); out.add('rag'); out.add('langgraph'); }
      if (out.has('bi') || out.has('dashboard') || out.has('excel') || out.has('powerbi') || out.has('report')) { out.add('powerbi'); out.add('dax'); }
      if (out.has('salary') || out.has('ctc') || out.has('notice') || out.has('relocation') || out.has('contact') || out.has('reach') || out.has('email') || out.has('phone') || out.has('call') || out.has('location') || out.has('ahmedabad')) { out.add('immediate'); out.add('hire'); out.add('contact'); out.add('relocate'); }
      if (out.has('who') || out.has('about') || out.has('dev') || out.has('patel') || out.has('intro') || out.has('introduction') || out.has('tell') || out.has('background') || out.has('degree') || out.has('college') || out.has('university')) { out.add('who'); out.add('btech'); out.add('parul'); out.add('dev'); }
      if (out.has('why') || out.has('hire') || out.has('strength') || out.has('strengths') || out.has('value') || out.has('standout') || out.has('skill') || out.has('skills')) { out.add('hire'); out.add('why'); }
      if (out.has('intern') || out.has('internship') || out.has('experience') || out.has('prodigy') || out.has('work') || out.has('company')) { out.add('prodigy'); out.add('internship'); out.add('500k'); out.add('eda'); }
      if (out.has('project') || out.has('projects') || out.has('github') || out.has('repo') || out.has('repos') || out.has('code')) { out.add('repos'); out.add('github'); out.add('34'); }
      if (out.has('ml') || out.has('machine') || out.has('model') || out.has('models') || out.has('crop') || out.has('xgboost') || out.has('accuracy')) { out.add('ml'); out.add('crop'); out.add('xgboost'); out.add('cv'); }
      if (out.has('sql') || out.has('query') || out.has('database') || out.has('mysql') || out.has('postgres')) { out.add('sql'); out.add('3nf'); out.add('cte'); }
      return [...out];
    };

    function retrieve(raw) {
      const toks = expandTokens(raw);
      const matchedSkills = SKILL_MATCHERS
        .filter(([, keys]) => keys.some(k => toks.includes(k)))
        .map(([lbl]) => `✓ ${lbl}`);

      const ranked = KB.map(c => {
        let hits = 0;
        const blob = `${c.title} ${c.text}`.toLowerCase();
        for (const t of toks) {
          if (c.tags.includes(t)) hits += 2;
          else if (blob.includes(t)) hits += 1;
        }
        const score = toks.length ? Math.min(.97, .64 + hits / (toks.length * 1.6 + 2)) : .72;
        return { chunk: c, hits, score };
      }).sort((a, b) => b.hits - a.hits || b.score - a.score);

      const best = ranked[0];
      if (!best || best.hits === 0) {
        return {
          intent: 'executive_overview',
          score: 95,
          tokens: toks,
          text: '👋 **Here is the executive takeaway on Dev Patel:** He is an immediate-joining CSE graduate who bridges **500,000+ row data engineering scale** (Prodigy InfoTech internship, *Outstanding Remarks*) with **production GenAI agents** (Multi-PDF RAG with Gemini + LangGraph + Groq) and **99.1% validated ML classifiers**. Explore his tailored dossiers or test his live simulators above!',
          bullets: PRESETS.summary.bullets,
          kpis: PRESETS.summary.kpis,
          skills: matchedSkills.length ? matchedSkills : PRESETS.summary.skills,
          followups: [['whyhire', 'Why hire Dev over other grads?'], ['rag', 'Multi-PDF RAG stack'], ['ml', '99.1% Crop ML benchmarks'], ['hiring', 'Notice & Contact Dev']],
          resumes: ['aiml', 'ds', 'analyst'],
          door: 3,
          chunks: ranked.slice(0, 2).map(r => ({ id: r.chunk.id, score: .85 }))
        };
      }
      const second = ranked[1] && ranked[1].hits > 0 ? ranked[1] : null;
      const bullets = best.chunk.bullets.slice();
      if (second) bullets.push(`**Related (${second.chunk.title}):** ${second.chunk.text}`);
      const resKeys = [...new Set([best.chunk.resume, second?.chunk.resume].filter(Boolean))];
      const pct = Math.min(98, Math.round(best.score * 100));
      return {
        intent: `semantic_match: ${best.chunk.id}`,
        score: pct,
        tokens: toks,
        text: best.chunk.text,
        bullets,
        kpis: best.chunk.kpis,
        skills: matchedSkills.length ? matchedSkills : best.chunk.skills,
        followups: best.chunk.followups,
        resumes: resKeys.length ? resKeys : ['aiml'],
        door: best.chunk.door,
        chunks: ranked.slice(0, 3).map(r => ({ id: r.chunk.id, score: Number(r.score.toFixed(2)) }))
      };
    }

    const fmtInline = s => s
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');

    function setActiveLens(lensKey) {
      modalEl.querySelectorAll('.cp-lens').forEach(btn => {
        const on = btn.dataset.cpLens === lensKey;
        btn.classList.toggle('active', on);
        btn.setAttribute('aria-selected', String(on));
      });
      if (lensKey && RESUME_TRACKS[lensKey]) selectResumeTrack(lensKey);
    }

    let streamTimer = 0;
    function appendMessage(res, userLabel, instant = false) {
      clearInterval(streamTimer);
      let uEl = null;
      if (userLabel) {
        uEl = document.createElement('div');
        uEl.className = 'cp-msg cp-msg--user';
        const ub = document.createElement('div');
        ub.className = 'cp-user-pill';
        ub.textContent = String(userLabel);
        uEl.appendChild(ub);
        log.appendChild(uEl);
      }

      const b = document.createElement('div');
      b.className = 'cp-msg cp-msg--bot';
      const card = document.createElement('article');
      card.className = 'cp-card';

      const pct = res.score || 94;
      const head = document.createElement('div');
      head.className = 'cp-card__head';
      const sig = document.createElement('span');
      sig.className = 'cp-sig';
      const sigTxt = document.createElement('span');
      sigTxt.textContent = res.live ? `LIVE LLM · GROUNDED` : `GROUNDED · ${pct}% MATCH`;
      const barMeter = document.createElement('span');
      barMeter.className = 'cp-sig__bar';
      const barFill = document.createElement('i');
      barFill.style.width = `${pct}%`;
      barMeter.appendChild(barFill);
      sig.append(sigTxt, barMeter);

      const tBtn = document.createElement('button');
      tBtn.type = 'button'; tBtn.className = 'cp-trace-btn';
      tBtn.textContent = 'RAG Pipeline ▸';
      head.append(sig, tBtn);

      const body = document.createElement('div');
      body.className = 'cp-card__body';
      const pEl = document.createElement('p');
      body.appendChild(pEl);
      card.append(head, body);
      b.appendChild(card);
      log.appendChild(b);

      const finish = () => {
        pEl.innerHTML = fmtInline(res.text);
        if (res.skills?.length) {
          const skWrap = document.createElement('div');
          skWrap.className = 'cp-skills';
          res.skills.forEach(s => {
            const pill = document.createElement('span');
            pill.className = 'cp-skill';
            pill.textContent = s;
            skWrap.appendChild(pill);
          });
          body.appendChild(skWrap);
        }
        if (res.kpis?.length) {
          const kpiGrid = document.createElement('div');
          kpiGrid.className = 'cp-kpis';
          res.kpis.forEach(([val, lbl]) => {
            const tile = document.createElement('div');
            tile.className = 'cp-kpi';
            const bv = document.createElement('b'); bv.textContent = val;
            const sp = document.createElement('span'); sp.textContent = lbl;
            tile.append(bv, sp);
            kpiGrid.appendChild(tile);
          });
          body.appendChild(kpiGrid);
        }
        if (res.qna?.length) {
          res.qna.forEach(([qq, ans]) => {
            const box = document.createElement('div');
            box.className = 'cp-qna-box';
            const qb = document.createElement('b'); qb.textContent = `Q: ${qq}`;
            const qa = document.createElement('span'); qa.textContent = ans;
            box.append(qb, qa);
            body.appendChild(box);
          });
        }
        if (res.bullets?.length) {
          const ul = document.createElement('ul');
          ul.innerHTML = res.bullets.map(x => `<li>${fmtInline(x)}</li>`).join('');
          body.appendChild(ul);
        }

        // Collapsible 3-stage RAG grounding trace
        const pipe = document.createElement('div');
        pipe.className = 'cp-pipe'; pipe.hidden = true;
        const r1 = document.createElement('div');
        r1.className = 'cp-pipe__row';
        const r1L = document.createElement('span');
        r1L.textContent = `INTENT: ${String(res.intent)}`;
        const r1R = document.createElement('span');
        r1R.textContent = res.tokens?.length ? `TOKENS: ${res.tokens.slice(0, 5).join(', ')}` : 'GUARDRAIL: 0 HALLUCINATIONS';
        r1.append(r1L, r1R);
        const r2 = document.createElement('div');
        r2.className = 'cp-pipe__chunks';
        (res.chunks || []).forEach(c => {
          const ch = document.createElement('span');
          ch.className = 'cp-chunk';
          const nm = document.createTextNode(`${c.id} `);
          const sc = document.createElement('b'); sc.textContent = String(c.score);
          ch.append(nm, sc);
          r2.appendChild(ch);
        });
        pipe.append(r1, r2);
        card.appendChild(pipe);

        tBtn.addEventListener('click', () => {
          pipe.hidden = !pipe.hidden;
          tBtn.textContent = pipe.hidden ? 'RAG Pipeline ▸' : 'RAG Pipeline ▾';
          log.scrollTop = log.scrollHeight;
        });

        // Integrated card dock: Resume PDF + Room Door + Schedule Interview
        const primaryKey = (res.resumes && RESUME_TRACKS[res.resumes[0]]) ? res.resumes[0] : 'aiml';
        const r = RESUME_TRACKS[primaryKey];
        const dock = document.createElement('div');
        dock.className = 'cp-card__dock';
        const rowTop = document.createElement('div');
        rowTop.className = 'cp-dock__row';
        const info = document.createElement('div');
        const lbl = document.createElement('span'); lbl.className = 'cp-dock__lbl'; lbl.textContent = 'RECOMMENDED DOSSIER · ATS PDF';
        const nm = document.createElement('strong'); nm.className = 'cp-dock__name'; nm.textContent = `${r.title} Resume`;
        info.append(lbl, nm);

        const acts = document.createElement('div');
        acts.className = 'cp-dock__acts';
        const prevA = document.createElement('a');
        prevA.className = 'cp-btn-prim'; prevA.href = r.url; prevA.target = '_blank'; prevA.rel = 'noopener noreferrer';
        prevA.textContent = 'Preview ↗';
        const dlA = document.createElement('a');
        dlA.className = 'cp-btn-sec'; dlA.href = r.url; dlA.setAttribute('download', r.file);
        dlA.setAttribute('aria-label', `Download ${r.title} PDF`); dlA.textContent = '↓';
        const allBtn = document.createElement('button');
        allBtn.type = 'button'; allBtn.className = 'cp-btn-sec'; allBtn.textContent = 'All 3';
        allBtn.addEventListener('click', () => { closeCopilot(); setTimeout(() => openResumeModal(primaryKey), 240); });
        acts.append(prevA, dlA, allBtn);
        rowTop.append(info, acts);
        dock.appendChild(rowTop);

        const rowNav = document.createElement('div');
        rowNav.className = 'cp-dock__row';
        if (typeof res.door === 'number' && DOORS[res.door]) {
          const dBtn = document.createElement('button');
          dBtn.type = 'button'; dBtn.className = 'cp-door-btn';
          dBtn.textContent = `Open ${DOORS[res.door].label} ↗`;
          dBtn.addEventListener('click', () => { closeCopilot(); setTimeout(() => window.openDoor?.(res.door), 240); });
          rowNav.appendChild(dBtn);
        }
        const hireBtn = document.createElement('button');
        hireBtn.type = 'button'; hireBtn.className = 'cp-btn-sec';
        hireBtn.textContent = 'Schedule Interview →';
        hireBtn.addEventListener('click', () => {
          closeCopilot();
          setTimeout(() => window.openContactForRole?.(MODAL_ROLES[primaryKey] || MODAL_ROLES.aiml), 240);
        });
        rowNav.appendChild(hireBtn);
        dock.appendChild(rowNav);
        card.appendChild(dock);

        if (res.followups?.length) {
          const fRow = document.createElement('div');
          fRow.className = 'cp-followups';
          res.followups.forEach(([key, label]) => {
            const fb = document.createElement('button');
            fb.type = 'button'; fb.className = 'cp-fup';
            fb.textContent = label + ' →';
            fb.addEventListener('click', () => runPreset(key, false));
            fRow.appendChild(fb);
          });
          b.appendChild(fRow);
        }
        const scrollFocus = () => {
          const anchor = (uEl && b.offsetHeight + uEl.offsetHeight + 16 <= log.clientHeight) ? uEl : b;
          log.scrollTop = Math.max(0, anchor.offsetTop - 8);
        };
        scrollFocus();
      };

      if (instant || reduced) { finish(); return; }
      const words = res.text.replace(/\*\*/g, '').replace(/`/g, '').split(' ');
      let wi = 0;
      streamTimer = setInterval(() => {
        wi = Math.min(words.length, wi + 4);
        pEl.textContent = words.slice(0, wi).join(' ');
        log.scrollTop = Math.max(0, b.offsetTop - 8);
        if (wi >= words.length) { clearInterval(streamTimer); finish(); }
      }, 18);
    }

    function runPreset(key, instant = false) {
      const p = PRESETS[key];
      if (!p) return;
      modalEl.querySelectorAll('.cp-chip').forEach(c => c.classList.toggle('active', c.dataset.cpQ === key));
      if (key.startsWith('role:')) setActiveLens(key.split(':')[1]);
      else if (p.resumes?.length === 1) setActiveLens(p.resumes[0]);
      appendMessage(p, instant ? null : p.userLabel, instant);
    }

    let initialized = false, cpLastFocus = null;
    function openCopilot(presetKey) {
      cpLastFocus = document.activeElement;
      if (!initialized) {
        initialized = true;
        const startKey = presetKey || (activePreset ? activePreset.key : 'summary');
        const lens = startKey.startsWith('role:') ? startKey.split(':')[1] : 'aiml';
        setActiveLens(lens);
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
    $('#cpHoloBtn')?.addEventListener('click', () => { closeCopilot(); setTimeout(() => window.openHolo?.(), 240); });
    modalEl.querySelectorAll('.cp-lens').forEach(b => b.addEventListener('click', () => runPreset(`role:${b.dataset.cpLens}`, false)));
    modalEl.querySelectorAll('.cp-chip').forEach(b => b.addEventListener('click', () => {
      if (b.id === 'cpAutopilot') {
        closeCopilot();
        setTimeout(() => {
          window.openDoor?.(3); // Autonomous walk-through into Door 04: GenAI & RAG
        }, 320);
        return;
      }
      runPreset(b.dataset.cpQ, false);
    }));

    let isPlayingAudio = false;
    $('#cpAudioPitch')?.addEventListener('click', () => {
      const btn = $('#cpAudioPitch');
      if (!('speechSynthesis' in window)) {
        if (btn) btn.querySelector('span').textContent = 'No Audio';
        return;
      }
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        isPlayingAudio = false;
        btn?.classList.remove('playing');
        if (btn) btn.querySelector('span').textContent = '▶ 60s Brief';
        return;
      }
      window.speechSynthesis.cancel();
      const pitchText = "Dev Patel is a GenAI and Data Systems Engineer based in Ahmedabad, graduating with B.Tech CSE from Parul University. During his Data Science Internship at Prodigy InfoTech, Dev audited over 500,000 multi-source records with Outstanding Remarks. His flagship systems include a Multi-PDF Vector RAG suite using Gemini dense embeddings, a 22-class Crop Recommendation classifier with 99.1% 5-fold cross-validation, 10,000+ row Power BI star schemas with custom DAX YoY metrics, and 6-table 3NF MySQL analytical architectures. Dev is available immediately with zero notice period, ready for full-time roles in Ahmedabad, remote, or relocation across India.";
      const utter = new SpeechSynthesisUtterance(pitchText);
      utter.rate = 1.04;
      utter.pitch = 1.0;
      utter.onstart = () => {
        isPlayingAudio = true;
        btn?.classList.add('playing');
        if (btn) btn.querySelector('span').textContent = '■ Stop';
      };
      utter.onend = utter.onerror = () => {
        isPlayingAudio = false;
        btn?.classList.remove('playing');
        if (btn) btn.querySelector('span').textContent = '▶ 60s Brief';
      };
      window.speechSynthesis.speak(utter);
    });

    formEl?.addEventListener('submit', async e => {
      e.preventDefault();
      const q = String(inp?.value || '').trim();
      if (!q) return;
      inp.value = '';
      modalEl.querySelectorAll('.cp-chip').forEach(c => c.classList.remove('active'));
      const low = q.toLowerCase();
      if (/\b(why\s+(should\s+(we|i)\s+)?hire|why\s+dev|strength|value|standout|whyhire)\b/.test(low)) {
        runPreset('whyhire', false);
        return;
      }
      if (/\b(tradeoff|trade-off|leakage|interview|cross.?question|weakness|challenge)\b/.test(low)) {
        runPreset('qna', false);
        return;
      }
      const res = retrieve(q);
      const lens = modalEl.querySelector('.cp-lens.active')?.dataset.cpLens || (res.resumes?.[0] || 'aiml');
      const isHosted = /^https?:$/i.test(location.protocol) && !/^(localhost|127\.0\.0\.1)$/i.test(location.hostname);
      if (isHosted) {
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 1800);
          const apiRes = await fetch('/api/chat/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, lens }),
            signal: ctrl.signal
          });
          clearTimeout(tid);
          if (apiRes.ok) {
            const data = await apiRes.json();
            if (data?.live && data.answer) {
              res.live = true;
              res.score = 99;
              res.intent = `live_llm:${data.model || 'edge'}`;
              res.text = data.answer;
            }
          }
        } catch (_) {}
      }
      if (res.resumes?.length) setActiveLens(res.resumes[0]);
      appendMessage(res, q, false);
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
