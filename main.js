/* ==========================================================================
   Dev Patel — Original Data & ML Engineering Portfolio Runtime
   ========================================================================== */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Theme Toggle (dp-theme) ---------- */
  const root = document.documentElement;
  const THEME_KEY = 'dp-theme';
  const metaTheme = $('meta[name="theme-color"]');

  function applyTheme(theme) {
    if (theme === 'light') {
      root.dataset.theme = 'light';
      if (metaTheme) metaTheme.content = '#F8FAFC';
    } else {
      root.dataset.theme = 'dark';
      if (metaTheme) metaTheme.content = '#0B0F17';
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  }

  $('#themeToggle')?.addEventListener('click', () => {
    const next = root.dataset.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
  });

  /* ---------- Mobile Menu Drawer ---------- */
  const mobileNav = $('#mobileNav');
  const menuBtn = $('#menuBtn');
  function setMenu(open) {
    if (!mobileNav) return;
    mobileNav.hidden = !open;
    menuBtn?.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  menuBtn?.addEventListener('click', () => setMenu(true));
  $('#menuClose')?.addEventListener('click', () => setMenu(false));
  mobileNav?.addEventListener('click', e => { if (e.target === mobileNav) setMenu(false); });
  $$('[data-close-menu]').forEach(el => el.addEventListener('click', () => setMenu(false)));

  /* ---------- Target Role Track Switcher (Hero) ---------- */
  const tracks = {
    analyst: {
      title: 'Data Analyst Track',
      stack: 'Power BI (DAX, Star Schema) · MySQL 8.0 (3NF, CTEs, Windows) · Python EDA (500K+ rows)',
      pdf: 'assets/resumes/Dev_Patel_Data_Analyst_Resume.pdf',
      label: 'Analyst Resume PDF ↗'
    },
    scientist: {
      title: 'Data Scientist Track',
      stack: 'Statistical Modeling · Scikit-learn · Cohort Retention · Feature Engineering & Validation',
      pdf: 'assets/resumes/Dev_Patel_Data_Scientist_Resume.pdf',
      label: 'Data Scientist PDF ↗'
    },
    aiml: {
      title: 'AI / ML Engineer Track',
      stack: 'XGBoost · LangChain · LangGraph · Gemini Vector RAG · Groq LPU + Serper API',
      pdf: 'assets/resumes/Dev_Patel_AI_ML_Resume.pdf',
      label: 'AI / ML Resume PDF ↗'
    }
  };
  $$('[data-track]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cfg = tracks[btn.dataset.track] || tracks.analyst;
      $$('[data-track]').forEach(t => {
        const active = t === btn;
        t.classList.toggle('on', active);
        t.setAttribute('aria-selected', String(active));
      });
      if ($('#tbTitle')) $('#tbTitle').textContent = cfg.title;
      if ($('#tbStack')) $('#tbStack').textContent = cfg.stack;
      const link = $('#tbPdf');
      if (link) { link.href = cfg.pdf; link.textContent = cfg.label; }
    });
  });

  /* ---------- Live Engineering Workbench Tabs ---------- */
  $$('[data-wb]').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.wb;
      $$('[data-wb]').forEach(t => {
        const active = t === tab;
        t.classList.toggle('on', active);
        t.setAttribute('aria-selected', String(active));
      });
      $$('.wb__pane').forEach(p => {
        const show = p.id === `pane-${target}`;
        p.classList.toggle('on', show);
        p.hidden = !show;
      });
    });
  });

  /* Workbench Pane 1: Power BI Regional Slicer */
  const biZones = {
    ALL: { rev: '₹48.6L', ord: '10,420', mgn: '31.4%' },
    WEST: { rev: '₹19.2L', ord: '4,110', mgn: '33.8%' },
    SOUTH: { rev: '₹16.8L', ord: '3,590', mgn: '30.9%' },
    EAST: { rev: '₹12.6L', ord: '2,720', mgn: '28.5%' }
  };
  $('#biFilter')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-reg]');
    if (!btn) return;
    $$('#biFilter .chip').forEach(c => c.classList.toggle('on', c === btn));
    const d = biZones[btn.dataset.reg] || biZones.ALL;
    if ($('#biRev')) $('#biRev').textContent = d.rev;
    if ($('#biOrd')) $('#biOrd').textContent = d.ord;
    if ($('#biMgn')) $('#biMgn').textContent = d.mgn;
  });

  /* Workbench Pane 2: SQL Query Switcher */
  const sqlQueries = {
    ltv: {
      sql: `WITH ltv AS (\n  SELECT c.customer_id, c.city, SUM(oi.net_total) AS total_spent\n  FROM customers c JOIN orders o USING(customer_id)\n  JOIN order_items oi USING(order_id) GROUP BY 1, 2\n)\nSELECT city, COUNT(*) AS buyers, ROUND(AVG(total_spent),0) AS avg_ltv\nFROM ltv GROUP BY 1 ORDER BY avg_ltv DESC;`,
      head: ['City', 'Buyers', 'Avg LTV'],
      rows: [['Ahmedabad', '1,240', '₹14,820'], ['Bengaluru', '980', '₹13,950'], ['Pune', '745', '₹11,400']]
    },
    cat: {
      sql: `SELECT category, COUNT(DISTINCT order_id) AS orders,\n  DENSE_RANK() OVER(ORDER BY SUM(net_total) DESC) AS rk\nFROM order_items oi JOIN products p USING(product_id)\nGROUP BY category;`,
      head: ['Category', 'Orders', 'Rank'],
      rows: [['Electronics', '4,120', '#1'], ['Home & Living', '2,890', '#2'], ['Apparel', '1,910', '#3']]
    },
    ret: {
      sql: `SELECT DATE_FORMAT(first_order,'%Y-%m') AS cohort,\n  ROUND(100.0 * repeat_cnt / cohort_size, 1) AS repeat_pct\nFROM vw_cohort_retention ORDER BY cohort DESC LIMIT 3;`,
      head: ['Cohort', 'Repeat Rate'],
      rows: [['2026-08', '38.4%'], ['2026-07', '36.1%'], ['2026-06', '34.9%']]
    }
  };
  function renderSql(key) {
    const q = sqlQueries[key] || sqlQueries.ltv;
    if ($('#sqlCode')) $('#sqlCode').textContent = q.sql;
    const tbl = $('#sqlOut');
    if (!tbl) return;
    tbl.innerHTML = '';
    const thead = document.createElement('thead');
    const htr = document.createElement('tr');
    q.head.forEach(col => { const th = document.createElement('th'); th.textContent = col; htr.appendChild(th); });
    thead.appendChild(htr);
    const tbody = document.createElement('tbody');
    q.rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => { const td = document.createElement('td'); td.textContent = cell; tr.appendChild(td); });
      tbody.appendChild(tr);
    });
    tbl.appendChild(thead);
    tbl.appendChild(tbody);
  }
  renderSql('ltv');
  $('#sqlTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-q]');
    if (!btn) return;
    $$('#sqlTabs .chip').forEach(c => c.classList.toggle('on', c === btn));
    renderSql(btn.dataset.q);
  });

  /* Workbench Pane 3: Crop ML Simulator */
  const crops = [
    { name: 'Rice', n: 80, p: 48, ph: 6.4, rain: 220 },
    { name: 'Cotton', n: 115, p: 46, ph: 6.9, rain: 80 },
    { name: 'Maize', n: 78, p: 48, ph: 6.2, rain: 85 },
    { name: 'Chickpea', n: 40, p: 68, ph: 7.3, rain: 75 },
    { name: 'Coffee', n: 100, p: 28, ph: 6.8, rain: 165 },
    { name: 'Pomegranate', n: 18, p: 18, ph: 6.5, rain: 105 },
    { name: 'Apple', n: 20, p: 130, ph: 5.9, rain: 112 }
  ];
  function updateCrop() {
    const sN = $('#sN'), sP = $('#sP'), sPh = $('#sPh'), sRain = $('#sRain');
    if (!sN || !sP || !sPh || !sRain) return;
    const N = Number(sN.value), P = Number(sP.value), ph = Number(sPh.value), rain = Number(sRain.value);
    if ($('#vN')) $('#vN').textContent = N;
    if ($('#vP')) $('#vP').textContent = P;
    if ($('#vPh')) $('#vPh').textContent = ph.toFixed(1);
    if ($('#vRain')) $('#vRain').textContent = rain;
    let best = crops[0], bestDist = Infinity;
    for (const c of crops) {
      const dist = ((N - c.n) / 40) ** 2 + ((P - c.p) / 40) ** 2 + ((ph - c.ph) / 1.2) ** 2 + ((rain - c.rain) / 70) ** 2;
      if (dist < bestDist) { bestDist = dist; best = c; }
    }
    const conf = Math.max(82.4, Math.min(99.1, 98.4 - bestDist * 4.2));
    if ($('#cropPred')) $('#cropPred').textContent = best.name;
    if ($('#cropConf')) $('#cropConf').textContent = conf.toFixed(1) + '%';
  }
  ['sN', 'sP', 'sPh', 'sRain'].forEach(id => $('#' + id)?.addEventListener('input', updateCrop));
  updateCrop();

  /* Workbench Pane 4: RAG Views & Interactive Portfolio CLI */
  const ragViews = {
    arch: `[PDF Upload] -> RecursiveTextSplitter(chunk=1000, overlap=150)\n             -> GeminiEmbeddings -> VectorStore.similarity_search(k=4)\n             -> Grounded Prompt -> Cited Stream Response`,
    agent: `state = {"city": "Udaipur", "days": 3, "budget": "Moderate"}\n-> node_search_venues(Serper) [280ms]\n-> node_compose_itinerary(Groq Llama-3) [410ms]\n-> return structured_markdown_plan`,
    query: `Query: "Compare Q3 operating cash flow in the uploaded annual report."\nMatched Chunks: doc_01#p14 (score 0.91), doc_01#p27 (score 0.88)\nAnswer: Grounded strictly to retrieved tables [p.14, p.27].`
  };
  $('#ragTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-r]');
    if (!btn) return;
    $$('#ragTabs .chip').forEach(c => c.classList.toggle('on', c === btn));
    if ($('#ragOut')) $('#ragOut').textContent = ragViews[btn.dataset.r] || ragViews.arch;
  });

  const cliCmds = {
    help: 'Commands: about · skills · projects · certs · contact · clear',
    about: 'Dev Patel · B.Tech CSE (Parul University) · Data Analyst & ML Engineer · Prodigy InfoTech Intern (Outstanding Remarks).',
    skills: 'Power BI, DAX, MySQL (3NF), Python, Pandas, NumPy, Scikit-learn, XGBoost, LangChain, Gemini, Groq.',
    projects: '1) power-bi-final · 2) ecommerce-sql-analysis · 3) ML-Crop-Recommendation · 4) Gen_AI (Multi-PDF RAG) · 5) AI-Travel-Planner.',
    certs: 'TATA GenAI & Data Vis · Deloitte Data Analytics · Nasscom thingQbator · TechWar 2026.',
    contact: 'Email: devpatel846211@gmail.com | Phone: +91 93289 77322 | github.com/Devpatel7777'
  };
  $('#cliForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('#cliInput'), out = $('#cliOut');
    if (!inp || !out) return;
    const cmd = inp.value.trim().toLowerCase();
    inp.value = '';
    if (!cmd) return;
    if (cmd === 'clear') { out.innerHTML = ''; return; }
    const line1 = document.createElement('div');
    line1.textContent = `$ ${cmd}`;
    const line2 = document.createElement('div');
    line2.style.color = '#10B981';
    line2.textContent = cliCmds[cmd] || `Unknown command '${cmd}'. Try: help`;
    out.append(line1, line2);
    out.scrollTop = out.scrollHeight;
  });

  /* ---------- Project Domain Filter ---------- */
  $$('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('[data-filter]').forEach(b => b.classList.toggle('on', b === btn));
      $$('.proj-card').forEach(card => {
        const cats = (card.dataset.cat || '').split(/\s+/);
        card.hidden = !(f === 'all' || cats.includes(f));
      });
    });
  });

  /* ---------- Modals (Contact & 3 Resumes) ---------- */
  const modal = $('#modal');
  const resumeModal = $('#resume-modal');
  let activeModal = null, lastFocus = null;

  function openModal(el, focusTarget) {
    if (!el) return;
    lastFocus = document.activeElement;
    activeModal = el;
    el.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => $(focusTarget)?.focus(), 40);
  }
  function closeModal() {
    if (!activeModal) return;
    activeModal.hidden = true;
    activeModal = null;
    document.body.style.overflow = '';
    lastFocus?.focus?.();
  }

  $$('[data-contact]').forEach(btn => btn.addEventListener('click', () => {
    if ($('#mFormWrap')) $('#mFormWrap').hidden = false;
    if ($('#mSuccess')) $('#mSuccess').hidden = true;
    openModal(modal, '#mClose');
  }));
  $$('[data-resume]').forEach(btn => btn.addEventListener('click', () => openModal(resumeModal, '#rClose')));

  $('#mClose')?.addEventListener('click', closeModal);
  $('#mDone')?.addEventListener('click', closeModal);
  $('#rClose')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  resumeModal?.addEventListener('click', e => { if (e.target === resumeModal) closeModal(); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (activeModal) closeModal();
      else if (mobileNav && !mobileNav.hidden) setMenu(false);
    }
  });

  const EMAIL = 'devpatel846211@gmail.com';
  let formattedInquiry = '';
  $('#reqForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const role = String(fd.get('role') || 'Full-Time Data / ML Role').trim();
    const msg = String(fd.get('message') || '').trim();
    const subject = `[Interview / Role] ${role} — ${name}`;
    const body = `Hi Dev,\n\n${msg}\n\nRecruiter / Contact: ${name} (${email})\nTarget Role: ${role}\n`;
    formattedInquiry = `To: ${EMAIL}\nSubject: ${subject}\n\n${body}`;

    if ($('#eqGmailLink')) $('#eqGmailLink').href = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    if ($('#eqMailtoLink')) $('#eqMailtoLink').href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    navigator.clipboard?.writeText(formattedInquiry).catch(() => {});

    if ($('#mFormWrap')) $('#mFormWrap').hidden = true;
    if ($('#mSuccess')) $('#mSuccess').hidden = false;
  });

  $('#eqCopyBtn')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(formattedInquiry).then(() => {
      const b = $('#eqCopyBtn');
      const prev = b.textContent;
      b.textContent = 'Copied ✓';
      setTimeout(() => { b.textContent = prev; }, 1800);
    }).catch(() => {});
  });

  /* ---------- Misc Helpers ---------- */
  if ($('#fYear')) $('#fYear').textContent = String(new Date().getFullYear());
  $('#backToTop')?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
})();
