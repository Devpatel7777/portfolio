/* ==========================================================================
   Dev Patel — Shared Discipline Room Navigation, Simulators & Architecture Modal
   ========================================================================== */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const embedded = params.get('embed') === '1' || window.parent !== window;
  const TARGET_ORIGIN = location.origin === 'null' ? '*' : location.origin;

  function applyTheme(mode) {
    if (mode === 'dark') document.documentElement.dataset.mode = 'dark';
    else delete document.documentElement.dataset.mode;
  }

  try {
    const t = params.get('theme') || localStorage.getItem('dev-mode');
    if (t !== 'light') applyTheme('dark');
  } catch (e) {}

  window.addEventListener('message', e => {
    if (location.origin !== 'null' && e.origin !== location.origin) return;
    if (e.source !== window.parent || !e.data) return;
    if (e.data.wall === 'mode') applyTheme(e.data.mode);
    else if (e.data.theme) applyTheme(e.data.theme);
  });

  if (embedded) {
    requestAnimationFrame(() => {
      try { window.parent.postMessage({ roomReady: true }, TARGET_ORIGIN); } catch (e) {}
    });
  }

  document.getElementById('backDoors')?.addEventListener('click', e => {
    if (embedded) {
      e.preventDefault();
      window.parent.postMessage({ wall: 'go' }, TARGET_ORIGIN);
    }
  });

  document.querySelectorAll('.rn__pill[data-door]').forEach(pill => {
    pill.addEventListener('click', e => {
      if (embedded) {
        e.preventDefault();
        window.parent.postMessage({ wall: 'go', switchDoor: Number(pill.dataset.door) }, TARGET_ORIGIN);
      }
    });
  });

  const cards = Array.from(document.querySelectorAll('.card'));
  if (embedded) {
    // If running inside portal iframe, immediately show cards without IntersectionObserver delay
    cards.forEach(c => c.classList.add('on'));
  } else if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('on'); io.unobserve(en.target); }
      });
    }, { threshold: 0.02, rootMargin: '80px 0px' });
    cards.forEach(c => io.observe(c));
  } else {
    cards.forEach(c => c.classList.add('on'));
  }

  /* ---------- One-Click Architecture Diagram & Live Metrics Modal ---------- */
  const ARCH_SPECS = {
    powerbi: {
      eyebrow: 'DOOR 01 · STAR SCHEMA PIPELINE',
      title: 'Power BI Semantic Model & DAX Engine',
      steps: [
        ['01 / Ingestion', '10,420+ Sales Rows (CSV / ERP)'],
        ['02 / Power Query', 'Typed Schemas & Null Guards'],
        ['03 / Star Schema', 'FactSales + Date / Product / Region'],
        ['04 / DAX Engine', 'YoY Growth %, Margin & Retention']
      ],
      metrics: [
        ['10,420+', 'Orders Modeled'],
        ['₹48.6L', 'Tracked Revenue'],
        ['31.4%', 'Average Margin'],
        ['4 Zones', 'Star-Schema Slices']
      ]
    },
    sql: {
      eyebrow: 'DOOR 02 · RELATIONAL & 500K PIPELINE',
      title: '6-Table 3NF MySQL & Pandas Audit Flow',
      steps: [
        ['01 / Raw Dump', '500,000+ Internship Records'],
        ['02 / Pandas Audit', 'Header Norm, Median & IQR Clamp'],
        ['03 / 3NF Schema', '6 Indexed MySQL 8.0 Tables'],
        ['04 / Analytics', 'Recursive CTEs & DENSE_RANK Views']
      ],
      metrics: [
        ['500,000+', 'Rows Standardized'],
        ['99.8%', 'Anomaly Cleanup'],
        ['6 Tables', 'ACID 3NF Model'],
        ['Outstanding', 'Prodigy Evaluation']
      ]
    },
    ml: {
      eyebrow: 'DOOR 03 · SUPERVISED ML PIPELINE',
      title: '5-Fold Cross-Validation & Crop Inference',
      steps: [
        ['01 / Soil Inputs', 'N, P, K, Temp, Humidity, pH, Rain'],
        ['02 / Preprocess', 'IQR Check + StandardScaler (No Leak)'],
        ['03 / Benchmarks', 'Gaussian NB, XGBoost, KNN, LogReg'],
        ['04 / Serving', 'Streamlit 22-Class Real-Time API']
      ],
      metrics: [
        ['99.1%', 'Gaussian NB 5-Fold CV'],
        ['99.0%', 'XGBoost 5-Fold CV'],
        ['22 Crops', 'Multi-Class Target'],
        ['0.4–2.1ms', 'CPU Inference Time']
      ]
    },
    rag: {
      eyebrow: 'DOOR 04 · GENAI & AGENT GRAPH',
      title: 'Multi-PDF Vector RAG & LangGraph Orchestrator',
      steps: [
        ['01 / Document Split', 'Recursive Chunker (1000 / 150)'],
        ['02 / Embeddings', 'Gemini Vector Embedding Index'],
        ['03 / Retrieval', 'Top-k=4 Similarity Grounding'],
        ['04 / Tool Agents', 'LangGraph + Groq LPU + Serper API']
      ],
      metrics: [
        ['Top k=4', 'Grounded Chunks'],
        ['280ms', 'Serper Live Search'],
        ['410ms', 'Groq Llama Compose'],
        ['Cited PDFs', 'Page-Level Trace']
      ]
    }
  };

  let archModal = null;
  function closeArchModal() {
    if (!archModal || archModal.hidden) return;
    archModal.classList.remove('on');
    setTimeout(() => { archModal.hidden = true; }, 180);
  }
  function openArchModal(key) {
    const spec = ARCH_SPECS[key];
    if (!spec) return;
    if (!archModal) {
      archModal = document.createElement('div');
      archModal.className = 'arch-modal';
      archModal.hidden = true;
      archModal.setAttribute('role', 'dialog');
      archModal.setAttribute('aria-modal', 'true');
      archModal.id = 'archModal';
      const panel = document.createElement('div');
      panel.className = 'arch-modal__panel';
      panel.addEventListener('click', e => e.stopPropagation());
      const head = document.createElement('div');
      head.className = 'arch-modal__head';
      const hText = document.createElement('div');
      const eye = document.createElement('p'); eye.className = 'arch-modal__eye'; eye.id = 'archEye';
      const ttl = document.createElement('h2'); ttl.className = 'arch-modal__title'; ttl.id = 'archTitle';
      hText.append(eye, ttl);
      const x = document.createElement('button');
      x.type = 'button'; x.className = 'arch-modal__x'; x.id = 'archClose'; x.textContent = '×';
      x.setAttribute('aria-label', 'Close architecture diagram');
      x.addEventListener('click', closeArchModal);
      head.append(hText, x);
      const flow = document.createElement('div'); flow.className = 'arch-flow'; flow.id = 'archFlow';
      const mets = document.createElement('div'); mets.className = 'arch-metrics'; mets.id = 'archMetrics';
      panel.append(head, flow, mets);
      archModal.appendChild(panel);
      archModal.addEventListener('click', closeArchModal);
      document.body.appendChild(archModal);
    }
    document.getElementById('archEye').textContent = spec.eyebrow;
    document.getElementById('archTitle').textContent = spec.title;
    const flowEl = document.getElementById('archFlow');
    flowEl.replaceChildren(...spec.steps.map(([k, v]) => {
      const card = document.createElement('div'); card.className = 'arch-node';
      const sm = document.createElement('small'); sm.textContent = k;
      const st = document.createElement('strong'); st.textContent = v;
      card.append(sm, st);
      return card;
    }));
    const metEl = document.getElementById('archMetrics');
    metEl.replaceChildren(...spec.metrics.map(([val, lbl]) => {
      const m = document.createElement('div'); m.className = 'arch-metric';
      const b = document.createElement('b'); b.textContent = val;
      const sp = document.createElement('span'); sp.textContent = lbl;
      m.append(b, sp);
      return m;
    }));
    archModal.hidden = false;
    requestAnimationFrame(() => archModal.classList.add('on'));
    document.getElementById('archClose')?.focus();
  }
  document.querySelectorAll('[data-arch]').forEach(btn => {
    btn.addEventListener('click', () => openArchModal(btn.dataset.arch));
  });

  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (archModal && !archModal.hidden) { closeArchModal(); return; }
    if (embedded) window.parent.postMessage({ wall: 'go' }, TARGET_ORIGIN);
  });

  /* ---------- Room 1: Power BI Regional Slicer ---------- */
  const biWrap = document.getElementById('biFilter');
  if (biWrap) {
    const data = {
      ALL:   { rev: '₹48.6L', ord: '10,420', mgn: '31.4%' },
      WEST:  { rev: '₹19.2L', ord: '4,110',  mgn: '33.8%' },
      SOUTH: { rev: '₹16.8L', ord: '3,590',  mgn: '30.9%' },
      EAST:  { rev: '₹12.6L', ord: '2,720',  mgn: '28.5%' }
    };
    biWrap.addEventListener('click', e => {
      const b = e.target.closest('[data-reg]');
      if (!b) return;
      biWrap.querySelectorAll('.w-tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      const d = data[b.dataset.reg] || data.ALL;
      document.getElementById('biRev').textContent = d.rev;
      document.getElementById('biOrd').textContent = d.ord;
      document.getElementById('biMgn').textContent = d.mgn;
    });
  }

  /* ---------- Room 2: SQL Query Bench ---------- */
  const sqlTabs = document.getElementById('sqlTabs');
  if (sqlTabs) {
    const queries = {
      ltv: {
        sql: `WITH ltv AS (\n  SELECT c.customer_id, c.city, SUM(oi.net_total) AS total_spent\n  FROM customers c JOIN orders o USING(customer_id)\n  JOIN order_items oi USING(order_id) GROUP BY 1, 2\n)\nSELECT city, COUNT(*) AS buyers, ROUND(AVG(total_spent),0) AS avg_ltv\nFROM ltv GROUP BY 1 ORDER BY avg_ltv DESC;`,
        head: ['city', 'buyers', 'avg_ltv'],
        rows: [['Ahmedabad', '1,240', '₹14,820'], ['Bengaluru', '980', '₹13,950'], ['Pune', '745', '₹11,400']]
      },
      cat: {
        sql: `SELECT category, COUNT(DISTINCT order_id) AS orders,\n  DENSE_RANK() OVER(ORDER BY SUM(net_total) DESC) AS rk\nFROM order_items oi JOIN products p USING(product_id)\nGROUP BY category;`,
        head: ['category', 'orders', 'rk'],
        rows: [['Electronics', '4,120', '#1'], ['Home & Living', '2,890', '#2'], ['Apparel', '1,910', '#3']]
      },
      ret: {
        sql: `SELECT DATE_FORMAT(first_order,'%Y-%m') AS cohort,\n  ROUND(100.0 * repeat_cnt / cohort_size, 1) AS repeat_pct\nFROM vw_cohort_retention ORDER BY cohort DESC LIMIT 3;`,
        head: ['cohort', 'repeat_pct'],
        rows: [['2026-08', '38.4%'], ['2026-07', '36.1%'], ['2026-06', '34.9%']]
      }
    };
    const out = document.getElementById('sqlOut');
    const code = document.getElementById('sqlCode');
    const makeRow = (tag, cells) => {
      const tr = document.createElement('tr');
      cells.forEach(c => { const cell = document.createElement(tag); cell.textContent = c; tr.appendChild(cell); });
      return tr;
    };
    const renderSql = key => {
      const q = queries[key] || queries.ltv;
      if (code) code.textContent = q.sql;
      if (out) {
        const thead = document.createElement('thead'); thead.appendChild(makeRow('th', q.head));
        const tbody = document.createElement('tbody'); q.rows.forEach(r => tbody.appendChild(makeRow('td', r)));
        out.replaceChildren(thead, tbody);
      }
    };
    renderSql('ltv');
    sqlTabs.addEventListener('click', e => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      sqlTabs.querySelectorAll('.w-tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      renderSql(b.dataset.q);
    });
  }

  /* ---------- Room 3: Crop Recommendation ML Inference Simulator ---------- */
  if (document.getElementById('sN')) {
    const crops = [
      { name: 'Rice',        n: 80,  p: 48, ph: 6.4, rain: 220 },
      { name: 'Cotton',      n: 115, p: 46, ph: 6.9, rain: 80  },
      { name: 'Maize',       n: 78,  p: 48, ph: 6.2, rain: 85  },
      { name: 'Chickpea',    n: 40,  p: 68, ph: 7.3, rain: 75  },
      { name: 'Coffee',      n: 100, p: 28, ph: 6.8, rain: 165 },
      { name: 'Pomegranate', n: 18,  p: 18, ph: 6.5, rain: 105 },
      { name: 'Apple',       n: 20,  p: 130,ph: 5.9, rain: 112 }
    ];
    const predict = () => {
      const N = Number(document.getElementById('sN').value);
      const P = Number(document.getElementById('sP').value);
      const ph = Number(document.getElementById('sPh').value);
      const rain = Number(document.getElementById('sRain').value);
      document.getElementById('vN').textContent = N;
      document.getElementById('vP').textContent = P;
      document.getElementById('vPh').textContent = ph.toFixed(1);
      document.getElementById('vRain').textContent = rain;
      let best = crops[0], bestDist = Infinity;
      crops.forEach(c => {
        const d = Math.hypot((N - c.n) / 40, (P - c.p) / 40, (ph - c.ph) * 1.4, (rain - c.rain) / 80);
        if (d < bestDist) { bestDist = d; best = c; }
      });
      const conf = Math.max(76, Math.min(99.2, 98.8 - bestDist * 7.5));
      document.getElementById('cropPred').textContent = best.name;
      document.getElementById('cropConf').textContent = conf.toFixed(1) + '%';
    };
    ['sN', 'sP', 'sPh', 'sRain'].forEach(id => document.getElementById(id)?.addEventListener('input', predict));
    predict();
  }

  /* ---------- Room 4: GenAI RAG Architecture Tabs ---------- */
  const ragTabs = document.getElementById('ragTabs');
  const ragOut = document.getElementById('ragOut');
  if (ragTabs && ragOut) {
    const views = {
      arch: `[PDF Upload] -> RecursiveTextSplitter(chunk=1000, overlap=150)\n             -> GeminiEmbeddings -> VectorStore.similarity_search(k=4)\n             -> Grounded Prompt -> Cited Stream Response`,
      query: `Query: "Compare Q3 operating cash flow in the uploaded annual report."\nMatched Chunks: doc_01#p14 (score 0.91), doc_01#p27 (score 0.88)\nAnswer: Grounded strictly to retrieved tables [p.14, p.27].`
    };
    ragTabs.addEventListener('click', e => {
      const b = e.target.closest('[data-r]');
      if (!b) return;
      ragTabs.querySelectorAll('.w-tab').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      ragOut.textContent = views[b.dataset.r] || views.arch;
    });
  }

  /* ---------- Room 5: Interactive System CLI ---------- */
  const termForm = document.getElementById('termForm');
  const termOut = document.getElementById('termOut');
  const termInp = document.getElementById('termInput');
  if (termForm && termOut && termInp) {
    const cmds = {
      help: 'Commands: about · skills · projects · certs · contact · clear',
      about: 'Dev Patel · B.Tech CSE (Parul University) · Data Analyst & ML Engineer · Prodigy InfoTech Intern (Outstanding Remarks).',
      skills: 'Power BI, DAX, MySQL (3NF), Python, Pandas, NumPy, Scikit-learn, XGBoost, LangChain, Gemini, Groq.',
      projects: '1) power-bi-final (10K+ rows) · 2) ecommerce-sql-analysis (6-table 3NF) · 3) ML-Crop-Recommendation (22 classes) · 4) Gen_AI (Multi-PDF RAG) · 5) AI-Travel-Planner (Groq + Serper).',
      certs: 'TATA GenAI & Data Vis · Deloitte Data Analytics · Nasscom thingQbator Chatbot · TechWar 2026.',
      contact: 'Email: devpatel846211@gmail.com | Phone: +91 93289 77322 | github.com/Devpatel7777'
    };
    termForm.addEventListener('submit', e => {
      e.preventDefault();
      const raw = termInp.value.trim().toLowerCase();
      termInp.value = '';
      if (!raw) return;
      if (raw === 'clear') { termOut.replaceChildren(); return; }
      const echo = document.createElement('div');
      echo.textContent = `$ ${raw}`;
      const rep = document.createElement('div');
      rep.style.color = '#C4B0B0';
      rep.style.marginBottom = '6px';
      rep.textContent = cmds[raw] || `Unknown command '${raw}'. Try: help`;
      termOut.append(echo, rep);
      termOut.scrollTop = termOut.scrollHeight;
    });
  }
})();
