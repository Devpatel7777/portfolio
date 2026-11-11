/* ==========================================================================
   Dev Patel — Main Portfolio Controller
   Interactive Doors · Verlet Pull-Cord · Flip Calendar · Story Odometer · Holo
   ========================================================================== */

(function () {
  'use strict';

  const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const DOORS = [
    {
      title: 'Power BI & Executive BI',
      sub: 'Star-schema modeling, DAX time-intelligence metrics & 10,000+ sales rows',
      bullets: ['Star-schema data models', 'Time-intelligence DAX measures', 'Retention & margin KPIs', 'Interactive telemetry simulator'],
      href: 'power-bi/'
    },
    {
      title: 'Relational SQL & 500K EDA',
      sub: '6-table 3NF MySQL architecture & Prodigy InfoTech large-scale data audit',
      bullets: ['6-table 3NF MySQL schema', 'CTEs, Views & Window functions', '500,000+ dataset records cleaned', 'Live SQL query sandbox'],
      href: 'sql-analytics/'
    },
    {
      title: 'Predictive Machine Learning',
      sub: '22-class Crop Recommendation & Scikit-learn / XGBoost benchmark pipelines',
      bullets: ['22-class Crop classifier', 'XGBoost, NB, KNN benchmarks', 'IQR & Z-score preprocessing', 'Interactive N-P-K live predictor'],
      href: 'machine-learning/'
    },
    {
      title: 'GenAI & Multi-PDF RAG Agents',
      sub: 'LangChain retrieval, Gemini embeddings, Groq LPU inference & tool agents',
      bullets: ['Multi-PDF Vector RAG suite', 'AI Travel Planner (Groq + Serper)', 'thingQbator chatbot engineering', 'Interactive pipeline inspector'],
      href: 'genai-agents/'
    },
    {
      title: 'Open Source, CLI & Credentials',
      sub: '34+ public repositories, interactive terminal emulator & tailored resume PDFs',
      bullets: ['Interactive DP-Systems CLI (~$)', '34+ GitHub repositories', 'TATA, Deloitte & TechWar 2026', '3 PDF resume downloads'],
      href: 'system-terminal/'
    }
  ];

  /* ----------------------------------------------------------------------
     Scroll Lock Helper
     ---------------------------------------------------------------------- */
  let lockCount = 0;
  function lockScroll(on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    document.documentElement.style.overflow = lockCount > 0 ? 'hidden' : '';
  }

  /* ----------------------------------------------------------------------
     1. Preloader (#loader)
     ---------------------------------------------------------------------- */
  function initLoader() {
    const loader = $('#loader');
    const ready = () => {
      document.body.classList.add('ready');
      try { sessionStorage.setItem('dev-loaded', '1'); } catch (e) {}
      if (loader) {
        loader.classList.add('gone');
        setTimeout(() => loader.setAttribute('hidden', ''), 420);
      }
    };

    if (!loader || REDUCED || document.documentElement.dataset.skipLoader === '1') {
      ready();
      return;
    }

    const pills = $$('#loaderPills .loader__pill');
    const pctEl = $('#loaderPct');
    const fillEl = $('#loaderFill');
    const totalMs = 650;
    const start = performance.now();

    pills.forEach((p, idx) => {
      setTimeout(() => {
        p.classList.add('on');
        pills.forEach(x => x.classList.remove('active'));
        p.classList.add('active');
      }, idx * 80);
    });

    function tick(now) {
      const t = Math.min(1, (now - start) / totalMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(eased * 100);
      if (pctEl) pctEl.textContent = String(val).padStart(3, '0');
      if (fillEl) fillEl.style.width = val + '%';
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        setTimeout(ready, 90);
      }
    }
    requestAnimationFrame(tick);

    setTimeout(ready, 1600);
  }

  /* ----------------------------------------------------------------------
     2. Sticky Header & IST Clock
     ---------------------------------------------------------------------- */
  function initHeaderAndClock() {
    const hdr = $('#hdr');
    const onScroll = () => {
      if (hdr) hdr.classList.toggle('stuck', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const clockEl = $('#clock');
    const sfClockEl = $('#sfClock');
    const yrCopy = $('#yrCopy');
    if (yrCopy) yrCopy.textContent = String(new Date().getFullYear());

    function updateClock() {
      try {
        const now = new Date();
        const istTime = now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        const istDate = now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: '2-digit',
          month: 'short'
        });
        if (clockEl) clockEl.textContent = `AHM · ${istTime}`;
        if (sfClockEl) sfClockEl.textContent = `IST ${istTime} · ${istDate}`;
      } catch (e) {}
    }
    updateClock();
    setInterval(updateClock, 15000);
  }

  /* ----------------------------------------------------------------------
     3. Theme Mode & Verlet Pull-Cord (#cord)
     ---------------------------------------------------------------------- */
  function applyMode(mode, originX, originY) {
    const root = document.documentElement;
    const hint = $('#cordHint');
    const meta = $('#theme-meta');

    const commit = () => {
      if (mode === 'dark') {
        root.dataset.mode = 'dark';
        if (meta) meta.content = '#1A1818';
        if (hint) hint.textContent = 'Pull for light';
      } else {
        delete root.dataset.mode;
        if (meta) meta.content = '#E8E4E0';
        if (hint) hint.textContent = 'Pull for dark';
      }
      try { localStorage.setItem('dev-mode', mode); } catch (e) {}

      const fr = $('#wallvFr');
      if (fr && fr.contentWindow) {
        try { fr.contentWindow.postMessage({ theme: mode }, '*'); } catch (e) {}
      }
    };

    if (typeof document.startViewTransition === 'function' && !REDUCED && originX != null) {
      root.style.setProperty('--mode-x', originX + 'px');
      root.style.setProperty('--mode-y', originY + 'px');
      root.style.setProperty('--mode-r', Math.hypot(
        Math.max(originX, window.innerWidth - originX),
        Math.max(originY, window.innerHeight - originY)
      ) + 'px');
      document.startViewTransition(commit);
    } else {
      commit();
    }
  }

  function toggleMode(x, y) {
    const next = document.documentElement.dataset.mode === 'dark' ? 'light' : 'dark';
    applyMode(next, x, y);
  }

  function initCord() {
    const wrap = $('#cord');
    const cv = $('#cordCv');
    const hit = $('#cordHit');
    const mobileBtn = $('#modeToggleMobile');
    const navmBtn = $('#navmModeBtn');
    const hint = $('#cordHint');

    if (hint) {
      hint.textContent = document.documentElement.dataset.mode === 'dark' ? 'Pull for light' : 'Pull for dark';
    }

    if (mobileBtn) {
      mobileBtn.addEventListener('click', () => {
        const r = mobileBtn.getBoundingClientRect();
        toggleMode(r.left + r.width / 2, r.top + r.height / 2);
      });
    }

    if (navmBtn) {
      navmBtn.addEventListener('click', () => toggleMode(window.innerWidth / 2, 40));
    }

    if (!wrap || !cv || !hit) return;
    const ctx = cv.getContext('2d');
    const W = 78;
    const H = 220;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = W * dpr;
    cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    // 10-node Verlet rope
    const N = 10;
    const segLen = 9.5;
    const anchorX = 39;
    const anchorY = 0;
    const nodes = Array.from({ length: N }, (_, i) => ({
      x: anchorX,
      y: anchorY + i * segLen,
      px: anchorX,
      py: anchorY + i * segLen
    }));

    let dragging = false;
    let dragX = anchorX;
    let dragY = N * segLen;
    let pullTriggered = false;
    let pointerStartY = 0;

    function fireFromCord() {
      const r = wrap.getBoundingClientRect();
      const tip = nodes[N - 1];
      toggleMode(r.left + tip.x, r.top + tip.y);
    }

    hit.addEventListener('pointerdown', e => {
      dragging = true;
      pullTriggered = false;
      pointerStartY = e.clientY;
      hit.setPointerCapture(e.pointerId);
      const r = wrap.getBoundingClientRect();
      dragX = Math.max(12, Math.min(W - 12, e.clientX - r.left));
      dragY = Math.max(40, Math.min(H - 22, e.clientY - r.top));
    });

    hit.addEventListener('pointermove', e => {
      if (!dragging) return;
      const r = wrap.getBoundingClientRect();
      dragX = Math.max(10, Math.min(W - 10, e.clientX - r.left));
      dragY = Math.max(40, Math.min(H - 18, e.clientY - r.top));
      if (!pullTriggered && e.clientY - pointerStartY >= 16) {
        pullTriggered = true;
        fireFromCord();
      }
    });

    const releaseDrag = e => {
      if (!dragging) return;
      dragging = false;
      const deltaY = e.clientY - pointerStartY;
      if (!pullTriggered && (Math.abs(deltaY) < 16 || deltaY >= 12)) {
        nodes[N - 1].py -= 14;
        fireFromCord();
      }
    };

    hit.addEventListener('pointerup', releaseDrag);
    hit.addEventListener('pointercancel', releaseDrag);
    hit.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        nodes[N - 1].py -= 12;
        fireFromCord();
      }
    });

    let time = 0;
    function step() {
      time += 0.03;
      if (!REDUCED) {
        for (let i = 1; i < N; i++) {
          const n = nodes[i];
          const vx = (n.x - n.px) * 0.94;
          const vy = (n.y - n.py) * 0.94;
          n.px = n.x;
          n.py = n.y;
          n.x += vx + Math.sin(time + i * 0.4) * 0.03;
          n.y += vy + 0.58;
        }
        for (let k = 0; k < 6; k++) {
          nodes[0].x = anchorX;
          nodes[0].y = anchorY;
          if (dragging) {
            nodes[N - 1].x = dragX;
            nodes[N - 1].y = dragY;
          }
          for (let i = 0; i < N - 1; i++) {
            const a = nodes[i];
            const b = nodes[i + 1];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            const diff = (dist - segLen) / dist;
            if (i > 0) {
              a.x += dx * diff * 0.5;
              a.y += dy * diff * 0.5;
            }
            if (!(dragging && i + 1 === N - 1)) {
              b.x -= dx * diff * 0.5;
              b.y -= dy * diff * 0.5;
            }
          }
        }
      }

      const tip = nodes[N - 1];
      hit.style.left = (tip.x - 25) + 'px';
      hit.style.top = (tip.y - 20) + 'px';

      const dark = document.documentElement.dataset.mode === 'dark';
      ctx.clearRect(0, 0, W, H);

      // Cord string
      ctx.beginPath();
      ctx.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < N; i++) {
        ctx.lineTo(nodes[i].x, nodes[i].y);
      }
      ctx.strokeStyle = dark ? '#C4B0B0' : '#6B5C5C';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Tactile wooden/ceramic knob
      ctx.beginPath();
      ctx.roundRect(tip.x - 7, tip.y - 2, 14, 22, 7);
      ctx.fillStyle = dark ? '#E8E4E0' : '#1A1818';
      ctx.fill();
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();

      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ----------------------------------------------------------------------
     4. Hero Flip Calendar (#cal)
     ---------------------------------------------------------------------- */
  function initFlipCalendar() {
    const cal = $('#cal');
    const topNext = $('#calTopNext');
    const botCurr = $('#calBotCurr');
    const leafFront = $('#calLeafFront');
    const leafBack = $('#calLeafBack');
    if (!cal || !topNext || !botCurr || !leafFront || !leafBack) return;

    const roles = [
      'Data Analytics',
      'Power BI & DAX',
      'SQL Systems',
      'Machine Learning',
      'GenAI & RAG'
    ];
    let idx = 0;

    function measureWidth(text) {
      const cs = getComputedStyle(cal);
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
      probe.style.fontFamily = cs.fontFamily;
      probe.style.fontWeight = cs.fontWeight;
      probe.style.letterSpacing = cs.letterSpacing;
      probe.style.fontSize = cs.fontSize;
      probe.textContent = text;
      document.body.appendChild(probe);
      const px = probe.getBoundingClientRect().width;
      probe.remove();
      const pad = parseFloat(cs.fontSize) * 0.96;
      const maxPx = Math.max(220, window.innerWidth - 44);
      cal.style.setProperty('--cw', Math.min(maxPx, Math.ceil(px + pad)) + 'px');
    }

    measureWidth(roles[0]);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => measureWidth(roles[idx]));
    }
    window.addEventListener('resize', () => measureWidth(roles[idx]));

    if (REDUCED) return;

    setInterval(() => {
      const curr = roles[idx];
      const nextIdx = (idx + 1) % roles.length;
      const next = roles[nextIdx];

      topNext.textContent = next;
      leafFront.textContent = curr;
      leafBack.textContent = next;
      botCurr.textContent = curr;

      measureWidth(next.length > curr.length ? next : curr);
      cal.classList.remove('flipping');
      void cal.offsetWidth;
      cal.classList.add('flipping');

      let done = false;
      const finishFlip = () => {
        if (done) return;
        done = true;
        idx = nextIdx;
        botCurr.textContent = next;
        leafFront.textContent = next;
        measureWidth(next);
        cal.classList.remove('flipping');
      };

      const leaf = $('.cal__leaf', cal);
      if (leaf) leaf.addEventListener('animationend', finishFlip, { once: true });
      setTimeout(finishFlip, 720);
    }, 2800);
  }

  /* ----------------------------------------------------------------------
     5. Hero Interactive Specimen Canvas (#figCv)
     ---------------------------------------------------------------------- */
  function initFigCanvas() {
    const fig = $('#fig');
    const cv = $('#figCv');
    if (!fig || !cv) return;

    const ctx = cv.getContext('2d');
    let pointer = { x: -999, y: -999, tx: 0, ty: 0, active: false };

    function resize() {
      const r = fig.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, r.width * dpr);
      cv.height = Math.max(1, r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    fig.addEventListener('pointermove', e => {
      const r = fig.getBoundingClientRect();
      pointer.tx = e.clientX - r.left;
      pointer.ty = e.clientY - r.top;
      pointer.active = true;
    });
    fig.addEventListener('pointerleave', () => { pointer.active = false; });

    function draw() {
      const w = fig.clientWidth;
      const h = fig.clientHeight;
      ctx.clearRect(0, 0, w, h);

      if (pointer.active) {
        if (pointer.x < 0) {
          pointer.x = pointer.tx;
          pointer.y = pointer.ty;
        } else {
          pointer.x += (pointer.tx - pointer.x) * 0.16;
          pointer.y += (pointer.ty - pointer.y) * 0.16;
        }

        // Warm editorial reticle & telemetry rings
        const grad = ctx.createRadialGradient(pointer.x, pointer.y, 6, pointer.x, pointer.y, 130);
        grad.addColorStop(0, 'rgba(232, 228, 224, 0.24)');
        grad.addColorStop(0.55, 'rgba(196, 176, 176, 0.10)');
        grad.addColorStop(1, 'rgba(196, 176, 176, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = 'rgba(232, 228, 224, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 34, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(232, 228, 224, 0.16)';
        ctx.beginPath();
        ctx.moveTo(pointer.x - 46, pointer.y);
        ctx.lineTo(pointer.x + 46, pointer.y);
        ctx.moveTo(pointer.x, pointer.y - 46);
        ctx.lineTo(pointer.x, pointer.y + 46);
        ctx.stroke();
      }

      if (!REDUCED) requestAnimationFrame(draw);
    }
    draw();
  }

  /* ----------------------------------------------------------------------
     6. Doors Showcase & Walk-Through (#wall, #wallv, #dinfo)
     ---------------------------------------------------------------------- */
  function initDoors() {
    const wall = $('#wall');
    const units = $$('#wall .unit');
    const visibleUnits = units.filter(u => !u.dataset.secret);
    const dinfoTitle = $('#dinfoTitle');
    const dinfoSub = $('#dinfoSub');
    const dinfoList = $('#dinfoList');
    const dinfoGo = $('#dinfoGo');
    const cursor = $('#doorCursor');
    const dots = $$('#doorsDots .doors__dot');
    const wallv = $('#wallv');
    const wallvFr = $('#wallvFr');

    let activeIdx = 0;

    function renderDinfo(idx) {
      activeIdx = idx;
      const d = DOORS[idx] || DOORS[0];
      if (dinfoTitle) dinfoTitle.textContent = d.title;
      if (dinfoSub) dinfoSub.textContent = d.sub;
      if (dinfoList) {
        dinfoList.innerHTML = '';
        d.bullets.forEach(txt => {
          const li = document.createElement('li');
          li.textContent = txt;
          dinfoList.appendChild(li);
        });
      }
      dots.forEach((dot, i) => dot.classList.toggle('on', i === idx));
    }
    renderDinfo(0);

    function openRoom(idx) {
      const meta = DOORS[idx];
      if (!meta || !wallv || !wallvFr) return;

      const unit = units[idx];
      const isVisible = unit && unit.getBoundingClientRect().width > 0;
      if (cursor) cursor.classList.remove('on');

      const mode = document.documentElement.dataset.mode === 'dark' ? 'dark' : 'light';
      let shown = false;
      const revealRoom = () => {
        if (shown) return;
        shown = true;
        wallv.hidden = false;
        void wallv.offsetWidth;
        wallv.classList.add('on');
        lockScroll(true);
        wallvFr.focus();
        if (unit) setTimeout(() => unit.classList.remove('open'), 450);
      };

      const minSwing = isVisible && !REDUCED ? 260 : 0;
      const tStart = performance.now();
      const tryReveal = () => {
        const wait = Math.max(0, minSwing - (performance.now() - tStart));
        setTimeout(revealRoom, wait);
      };

      wallvFr.addEventListener('load', tryReveal, { once: true });
      setTimeout(revealRoom, 850);
      wallvFr.src = `${meta.href}?embed=1&theme=${mode}`;

      if (isVisible && !REDUCED) {
        unit.classList.add('open');
      }
    }

    function closeRoom() {
      if (!wallv || !wallv.classList.contains('on')) return;
      wallv.classList.remove('on');
      lockScroll(false);
      setTimeout(() => {
        if (!wallv.classList.contains('on')) {
          wallv.hidden = true;
          if (wallvFr) wallvFr.src = 'about:blank';
        }
      }, 460);
    }

    window.addEventListener('message', e => {
      if (e.data && e.data.wall === 'go') {
        closeRoom();
        if (typeof e.data.switchDoor === 'number') {
          setTimeout(() => openRoom(e.data.switchDoor), 160);
        }
      }
    });

    // Desktop Hover + Floating Cursor
    if (wall && cursor) {
      wall.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse') return;
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      });
      window.addEventListener('scroll', () => cursor.classList.remove('on'), { passive: true });
    }

    units.forEach((unit, idx) => {
      if (unit.dataset.secret) return;
      unit.addEventListener('mouseenter', () => {
        if (wall) wall.classList.add('dimmed');
        unit.classList.add('hover');
        if (cursor) cursor.classList.add('on');
        renderDinfo(idx);
      });
      unit.addEventListener('mouseleave', () => {
        if (wall) wall.classList.remove('dimmed');
        unit.classList.remove('hover');
        if (cursor) cursor.classList.remove('on');
      });
      unit.addEventListener('focus', () => renderDinfo(idx));
      unit.addEventListener('click', () => openRoom(idx));
      unit.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openRoom(idx);
        }
      });
    });

    if (dinfoGo) {
      dinfoGo.addEventListener('click', () => openRoom(activeIdx));
    }

    // Mobile Carousel Scroll Sync + Dot Jump
    if (wall) {
      let scrollTimer;
      wall.addEventListener('scroll', () => {
        if (window.innerWidth >= 900) return;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          const mid = wall.scrollLeft + wall.clientWidth / 2;
          let best = 0;
          let bestDist = Infinity;
          visibleUnits.forEach((u, i) => {
            const c = u.offsetLeft + u.offsetWidth / 2;
            const d = Math.abs(c - mid);
            if (d < bestDist) { bestDist = d; best = i; }
          });
          renderDinfo(best);
        }, 60);
      }, { passive: true });
    }

    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const i = Number(dot.dataset.dot);
        const u = visibleUnits[i];
        if (u && wall) {
          wall.scrollTo({ left: u.offsetLeft - (wall.clientWidth - u.offsetWidth) / 2, behavior: 'smooth' });
        }
        renderDinfo(i);
      });
    });

    // Global nav/footer triggers for entering a room smoothly inside `#wallv`
    $$('[data-enter]').forEach(el => {
      el.addEventListener('click', e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        closeAllModals();
        const i = Number(el.dataset.enter);
        openRoom(i);
      });
    });

    // Export close handler for Escape
    window.__closeRoom = closeRoom;
  }

  /* ----------------------------------------------------------------------
     7. Story Odometer & Reverse Clock Canvas (#about.story)
     ---------------------------------------------------------------------- */
  function initStory() {
    const story = $('#about');
    const chapters = $$('#storyList .ch');
    const digits = [$('#yr0'), $('#yr1'), $('#yr2'), $('#yr3')];
    const countEl = $('#storyCount');
    const dotEl = $('#storyDot');
    const cv = $('#storyCv');
    if (!story || chapters.length === 0) return;

    function setYear(yearStr) {
      const s = String(yearStr).padStart(4, '2');
      digits.forEach((col, i) => {
        if (!col) return;
        const d = Number(s[i]) || 0;
        col.style.transform = `translateY(-${d * 10}%)`;
      });
    }
    setYear(chapters[0].dataset.year || '2026');

    let progress = 0;
    function onScroll() {
      const midY = window.innerHeight * 0.44;
      let active = 0;
      chapters.forEach((ch, idx) => {
        const r = ch.getBoundingClientRect();
        if (r.top <= midY) active = idx;
      });

      chapters.forEach((ch, idx) => ch.classList.toggle('on', idx === active));
      const ch = chapters[active];
      setYear(ch.dataset.year || '2026');
      if (countEl) countEl.textContent = `${String(active + 1).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}`;
      story.style.setProperty('--story-wash', ch.dataset.wash || 'rgba(107,92,92,.08)');

      const sr = story.getBoundingClientRect();
      const total = Math.max(1, sr.height - window.innerHeight);
      progress = Math.max(0, Math.min(1, -sr.top / total));
      if (dotEl) dotEl.style.top = (progress * 100) + '%';
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Reverse Clock Dial Canvas
    if (cv) {
      const ctx = cv.getContext('2d');
      function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        cv.width = window.innerWidth * dpr;
        cv.height = window.innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      resize();
      window.addEventListener('resize', resize);

      function renderClock() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        ctx.clearRect(0, 0, w, h);

        const dark = document.documentElement.dataset.mode === 'dark';
        const stroke = dark ? 'rgba(232,228,224,0.16)' : 'rgba(26,24,24,0.12)';
        const cx = w * 0.25;
        const cy = h * 0.5;
        const maxR = Math.min(w, h) * 0.44;

        for (let ring = 0; ring < 5; ring++) {
          const r = maxR * (0.28 + ring * 0.18);
          const rot = -progress * Math.PI * 2 * (ring % 2 === 0 ? 1 : -0.6);
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(rot);
          ctx.strokeStyle = stroke;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();

          // Ticks
          const ticks = 12 + ring * 6;
          for (let t = 0; t < ticks; t++) {
            const a = (t / ticks) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * (r - 5), Math.sin(a) * (r - 5));
            ctx.lineTo(Math.cos(a) * (r + 5), Math.sin(a) * (r + 5));
            ctx.stroke();
          }
          ctx.restore();
        }
        if (!REDUCED) requestAnimationFrame(renderClock);
      }
      renderClock();
    }
  }

  /* ----------------------------------------------------------------------
     8. Footer Auto-Fit Wordmark & Circular Scroll-Top (.totop)
     ---------------------------------------------------------------------- */
  function initFooterAndTop() {
    const word = $('#sfWord');
    function fitWord() {
      if (!word || !word.parentElement) return;
      const cs = getComputedStyle(word.parentElement);
      const avail = word.parentElement.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      word.style.width = 'max-content';
      word.style.fontSize = '100px';
      const w = word.getBoundingClientRect().width || 1;
      const size = Math.max(40, Math.min(280, Math.floor((avail / w) * 98)));
      word.style.width = '';
      word.style.fontSize = size + 'px';
    }
    fitWord();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitWord);
    }
    window.addEventListener('resize', fitWord);

    const totop = $('#totop');
    const footer = $('#contact-footer');
    if (!totop) return;

    const ringLen = 164;
    const circle = totop.querySelector('circle');
    if (circle) circle.style.strokeDasharray = ringLen;

    function updateTop() {
      const y = window.scrollY;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.max(0, Math.min(1, y / max));
      totop.classList.toggle('show', y > 320);
      totop.style.setProperty('--p', p.toFixed(4));

      if (footer) {
        const fr = footer.getBoundingClientRect();
        const tr = totop.getBoundingClientRect();
        const overDark = tr.bottom > fr.top + 10;
        totop.dataset.on = overDark ? 'dark' : 'light';
      }
    }
    window.addEventListener('scroll', updateTop, { passive: true });
    updateTop();

    totop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: REDUCED ? 'auto' : 'smooth' });
    });
  }

  /* ----------------------------------------------------------------------
     9. Overlays: Holo Ability Card (#holo), Enquiry Modal (#modal), Resumes, Navm
     ---------------------------------------------------------------------- */
  function closeAllModals() {
    const ids = ['#holo', '#modal', '#resume-modal', '#navm'];
    let closedAny = false;
    ids.forEach(sel => {
      const el = $(sel);
      if (el && el.classList.contains('on')) {
        el.classList.remove('on');
        closedAny = true;
        setTimeout(() => {
          if (!el.classList.contains('on')) el.setAttribute('hidden', '');
        }, 360);
      }
    });
    if (closedAny) lockScroll(false);
    const menuOpen = $('#menuOpen');
    if (menuOpen) menuOpen.setAttribute('aria-expanded', 'false');
  }

  function openModalEl(el) {
    if (!el) return;
    closeAllModals();
    el.removeAttribute('hidden');
    void el.offsetWidth;
    el.classList.add('on');
    lockScroll(true);
  }

  function initModals() {
    // Nav Drawer (#navm)
    const navm = $('#navm');
    const menuOpen = $('#menuOpen');
    const menuClose = $('#menuClose');

    if (menuOpen && navm) {
      menuOpen.addEventListener('click', () => {
        openModalEl(navm);
        menuOpen.setAttribute('aria-expanded', 'true');
      });
    }
    if (menuClose) menuClose.addEventListener('click', closeAllModals);

    $$('[data-nav-scroll]').forEach(a => {
      a.addEventListener('click', closeAllModals);
    });

    // Holo Ability Card (#holo)
    const holo = $('#holo');
    const holoCard = $('#holoCard');
    const holoOpen = $('#holoOpen');
    const footerAbilityBtn = $('#footerAbilityBtn');
    const holoClose = $('#holoClose');
    const holoFlipBtn = $('#holoFlipBtn');
    const holoResumeBtn = $('#holoResumeBtn');

    if (holoOpen && holo) holoOpen.addEventListener('click', () => openModalEl(holo));
    if (footerAbilityBtn && holo) footerAbilityBtn.addEventListener('click', () => openModalEl(holo));
    if (holoClose) holoClose.addEventListener('click', closeAllModals);
    if (holo) {
      holo.addEventListener('click', e => {
        if (e.target === holo) closeAllModals();
      });
    }
    if (holoCard) {
      const flip = () => holoCard.classList.toggle('flipped');
      holoCard.addEventListener('click', flip);
      holoCard.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          flip();
        }
      });
      if (holoFlipBtn) holoFlipBtn.addEventListener('click', flip);

      holoCard.addEventListener('pointermove', e => {
        if (REDUCED || holoCard.classList.contains('flipped')) return;
        const r = holoCard.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        holoCard.style.setProperty('--rx', ((0.5 - py) * 14).toFixed(2) + 'deg');
        holoCard.style.setProperty('--ry', ((px - 0.5) * 18).toFixed(2) + 'deg');
        holoCard.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        holoCard.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      holoCard.addEventListener('pointerleave', () => {
        holoCard.style.setProperty('--rx', '0deg');
        holoCard.style.setProperty('--ry', '0deg');
      });
    }

    // Resume Modal (#resume-modal)
    const resumeModal = $('#resume-modal');
    const resumeClose = $('#resumeClose');
    $$('[data-open-resume]').forEach(btn => btn.addEventListener('click', () => openModalEl(resumeModal)));
    if (holoResumeBtn) holoResumeBtn.addEventListener('click', () => openModalEl(resumeModal));
    if (resumeClose) resumeClose.addEventListener('click', closeAllModals);
    if (resumeModal) {
      resumeModal.addEventListener('click', e => {
        if (e.target === resumeModal) closeAllModals();
      });
    }

    // Enquiry Modal (#modal)
    const modal = $('#modal');
    const modalClose = $('#modalClose');
    $$('[data-open-modal]').forEach(btn => btn.addEventListener('click', () => openModalEl(modal)));
    if (modalClose) modalClose.addEventListener('click', closeAllModals);
    if (modal) {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeAllModals();
      });
    }

    // Stepped Enquiry Form Logic
    const panes = $$('#enquiryForm .step-pane');
    const stepBars = $$('#modalSteps i');
    const backBtn = $('#eqBack');
    const nextBtn = $('#eqNext');
    const nextLbl = $('#eqNextLbl');
    let stepIdx = 0;

    function showStep(i) {
      stepIdx = Math.max(0, Math.min(panes.length - 1, i));
      panes.forEach((p, idx) => p.classList.toggle('on', idx === stepIdx));
      stepBars.forEach((b, idx) => b.classList.toggle('on', idx <= stepIdx));
      if (backBtn) backBtn.style.visibility = stepIdx === 0 ? 'hidden' : 'visible';
      if (nextLbl) nextLbl.textContent = stepIdx === panes.length - 1 ? 'Open Email Composer' : 'Continue';
    }
    showStep(0);

    $$('#enquiryForm .chips').forEach(group => {
      const multi = group.dataset.multi === '1';
      group.addEventListener('click', e => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        if (multi) {
          chip.classList.toggle('on');
        } else {
          $$('.chip', group).forEach(c => c.classList.remove('on'));
          chip.classList.add('on');
        }
      });
    });

    const fbBox = $('#eqFallback');
    const gmailLink = $('#eqGmailLink');

    if (backBtn) backBtn.addEventListener('click', () => showStep(stepIdx - 1));
    if (nextBtn) {
      nextBtn.addEventListener('click', async () => {
        if (stepIdx < panes.length - 1) {
          showStep(stepIdx + 1);
          return;
        }
        const nameEl = $('#eqName');
        const emailEl = $('#eqEmail');
        const name = (nameEl?.value || '').trim();
        const email = (emailEl?.value || '').trim();
        if (!name || !email) {
          if (!name && nameEl) nameEl.focus();
          else if (!email && emailEl) emailEl.focus();
          nextLbl.textContent = 'Enter name & email';
          setTimeout(() => { nextLbl.textContent = 'Open Email Composer'; }, 1800);
          return;
        }

        const intent = $('#enquiryForm [data-group="intent"] .chip.on')?.dataset.val || 'Hiring / Project Inquiry';
        const stacks = $$('#enquiryForm [data-group="stack"] .chip.on').map(c => c.dataset.val).join(', ') || 'General Data / ML';
        const msg = ($('#eqMsg')?.value || '').trim() || 'Looking forward to connecting.';

        const subjText = `[Portfolio] ${intent} — ${name}`;
        const bodyText = `Hi Dev,\n\nIntent: ${intent}\nFocus Stack: ${stacks}\nFrom: ${name} (${email})\n\n${msg}\n`;

        try { await navigator.clipboard.writeText(`${subjText}\n\n${bodyText}`); } catch (e) {}

        if (gmailLink) {
          gmailLink.href = `https://mail.google.com/mail/?view=cm&fs=1&to=devpatel846211@gmail.com&su=${encodeURIComponent(subjText)}&body=${encodeURIComponent(bodyText)}`;
        }
        if (fbBox) fbBox.hidden = false;

        window.location.href = `mailto:devpatel846211@gmail.com?subject=${encodeURIComponent(subjText)}&body=${encodeURIComponent(bodyText)}`;
        nextLbl.textContent = 'Ready · Copied ✓';
        setTimeout(() => { nextLbl.textContent = 'Open Email Composer'; }, 2800);
      });
    }

    // 1-click Clipboard Copy Pills
    $$('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const val = btn.dataset.copy;
        const orig = btn.textContent;
        try {
          await navigator.clipboard.writeText(val);
          btn.textContent = 'Copied ✓';
        } catch (e) {
          btn.textContent = val;
        }
        setTimeout(() => { btn.textContent = orig; }, 1600);
      });
    });

    // Global Escape Key
    window.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        if ($('#wallv')?.classList.contains('on') && window.__closeRoom) {
          window.__closeRoom();
        } else {
          closeAllModals();
        }
      }
    });
  }

  /* ----------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  initLoader();
  initHeaderAndClock();
  initCord();
  initFlipCalendar();
  initFigCanvas();
  initDoors();
  initStory();
  initFooterAndTop();
  initModals();
})();
