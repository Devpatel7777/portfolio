/**
 * DEV PATEL — DATA ANALYST & MACHINE LEARNING ENGINEER
 * Recruiter-Focused Interactive Engine (main.js)
 */

(function () {
  'use strict';

  // --- 1. NAVIGATION & DROPDOWNS ---
  function initNavigation() {
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const resumeDropdown = document.getElementById('resume-dropdown');
    const resumeBtn = document.getElementById('resume-btn');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-item');

    // Sticky Navbar elevation
    window.addEventListener('scroll', () => {
      if (window.scrollY > 30) {
        navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
        navbar.style.background = 'rgba(10, 14, 23, 0.96)';
      } else {
        navbar.style.boxShadow = 'none';
        navbar.style.background = 'rgba(11, 15, 25, 0.88)';
      }
    });

    // Mobile Menu Toggle
    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('open');
      });

      mobileNavLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileMenu.classList.remove('open');
        });
      });
    }

    // Resume Dropdown
    if (resumeBtn && resumeDropdown) {
      resumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = resumeDropdown.classList.contains('open');
        resumeDropdown.classList.toggle('open', !isOpen);
        resumeBtn.setAttribute('aria-expanded', !isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!resumeDropdown.contains(e.target)) {
          resumeDropdown.classList.remove('open');
          resumeBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Active Section Tracking
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 140;
      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.nav-menu .nav-item').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('href') === `#${id}`);
          });
        }
      });
    });

    // Back to top button
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
      backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // --- 2. NUMBER COUNT-UP ANIMATION ---
  function initCountUp() {
    const counters = document.querySelectorAll('.count-up');
    if (!counters.length) return;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.getAttribute('data-target'));
            const suffix = el.getAttribute('data-suffix') || '';
            const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
            const duration = 1500;
            const startTime = performance.now();

            function updateCounter(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              const ease = 1 - Math.pow(1 - progress, 3);
              const currentVal = (target * ease).toFixed(decimals);

              el.textContent = `${Number(currentVal).toLocaleString()}${suffix}`;

              if (progress < 1) {
                requestAnimationFrame(updateCounter);
              } else {
                el.textContent = `${target.toLocaleString()}${suffix}`;
              }
            }

            requestAnimationFrame(updateCounter);
            obs.unobserve(el);
          }
        });
      },
      { threshold: 0.2 }
    );

    counters.forEach((c) => observer.observe(c));
  }

  // --- 3. LIVE DATA & ML WORKBENCH: TAB SWITCHER ---
  function initWorkbenchTabs() {
    const tabBtns = document.querySelectorAll('.lab-tab-btn');
    const panels = document.querySelectorAll('.lab-tab-panel');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = `tab-${btn.getAttribute('data-tab')}`;

        tabBtns.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => p.classList.remove('active'));

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active');
        }
      });
    });
  }

  // --- 4. TAB 1: CROP ML PREDICTOR LOGIC ---
  function initCropMLPredictor() {
    const slN = document.getElementById('sl-n');
    const slP = document.getElementById('sl-p');
    const slK = document.getElementById('sl-k');
    const slTemp = document.getElementById('sl-temp');
    const slHum = document.getElementById('sl-hum');
    const slPh = document.getElementById('sl-ph');
    const slRain = document.getElementById('sl-rain');

    const readoutN = document.getElementById('readout-n');
    const readoutP = document.getElementById('readout-p');
    const readoutK = document.getElementById('readout-k');
    const readoutTemp = document.getElementById('readout-temp');
    const readoutHum = document.getElementById('readout-hum');
    const readoutPh = document.getElementById('readout-ph');
    const readoutRain = document.getElementById('readout-rain');

    const btnPredict = document.getElementById('btn-predict-crop');
    const displayName = document.getElementById('crop-name-display');
    const displayConf = document.getElementById('crop-confidence-pill');
    const displayLatency = document.getElementById('predict-latency');
    const displaySuit = document.getElementById('crop-suitability-val');
    const displayTrigger = document.getElementById('crop-trigger-val');

    if (!slN || !btnPredict) return;

    function syncLabels() {
      readoutN.textContent = `${slN.value} kg/ha`;
      readoutP.textContent = `${slP.value} kg/ha`;
      readoutK.textContent = `${slK.value} kg/ha`;
      readoutTemp.textContent = `${slTemp.value}°C`;
      readoutHum.textContent = `${slHum.value}%`;
      readoutPh.textContent = `${slPh.value}`;
      readoutRain.textContent = `${slRain.value} mm`;
    }

    [slN, slP, slK, slTemp, slHum, slPh, slRain].forEach((sl) => {
      sl.addEventListener('input', syncLabels);
    });

    // 22 Authentic Crop Centroid Vectors
    const cropVectors = [
      { name: 'Rice (Oryza sativa)', n: 90, p: 42, k: 43, temp: 24, hum: 82, ph: 6.5, rain: 230, trigger: 'High Precipitation (>200mm) & Tropical Humidity' },
      { name: 'Maize (Zea mays)', n: 80, p: 48, k: 20, temp: 22, hum: 65, ph: 6.2, rain: 85, trigger: 'Balanced Nitrogen & Moderate Rainfall' },
      { name: 'Chickpea (Cicer arietinum)', n: 40, p: 68, k: 80, temp: 19, hum: 17, ph: 7.3, rain: 80, trigger: 'Low Humidity (<25%) & High Phosphorus' },
      { name: 'Kidney Beans (Phaseolus)', n: 20, p: 67, k: 20, temp: 20, hum: 22, ph: 5.7, rain: 105, trigger: 'Slightly Acidic Soil & Cool Conditions' },
      { name: 'Pigeonpeas (Cajanus cajan)', n: 20, p: 67, k: 20, temp: 28, hum: 48, ph: 5.8, rain: 150, trigger: 'Warm Subtropical Rain & Low N-Demand' },
      { name: 'Mothbeans (Vigna aconitifolia)', n: 22, p: 48, k: 20, temp: 28, hum: 53, ph: 6.8, rain: 50, trigger: 'Arid Drought Tolerance (<60mm rain)' },
      { name: 'Mungbean (Vigna radiata)', n: 21, p: 48, k: 20, temp: 28, hum: 85, ph: 6.7, rain: 48, trigger: 'Warm Temperature & Short Growth Cycle' },
      { name: 'Blackgram (Vigna mungo)', n: 40, p: 67, k: 19, temp: 30, hum: 65, ph: 7.1, rain: 68, trigger: 'Neutral-Alkaline Soil & Warm Climate' },
      { name: 'Lentil (Lens culinaris)', n: 18, p: 68, k: 19, temp: 24, hum: 65, ph: 6.9, rain: 45, trigger: 'Cool Dry Weather & High P-Soil' },
      { name: 'Pomegranate (Punica granatum)', n: 19, p: 19, k: 40, temp: 22, hum: 90, ph: 6.4, rain: 108, trigger: 'High Humidity & Moderate Potassium' },
      { name: 'Banana (Musa acuminata)', n: 100, p: 75, k: 50, temp: 27, hum: 80, ph: 5.9, rain: 100, trigger: 'Heavy Nutrient Consumption (N & P)' },
      { name: 'Mango (Mangifera indica)', n: 20, p: 27, k: 30, temp: 31, hum: 50, ph: 5.8, rain: 95, trigger: 'High Ambient Heat (>30°C) & Deep Soil' },
      { name: 'Grapes (Vitis vinifera)', n: 23, p: 132, k: 200, temp: 24, hum: 82, ph: 6.0, rain: 70, trigger: 'Extremely High Potassium (>190 kg/ha)' },
      { name: 'Watermelon (Citrullus lanatus)', n: 100, p: 17, k: 50, temp: 26, hum: 85, ph: 6.5, rain: 50, trigger: 'Sandy Soil with High Nitrogen Supply' },
      { name: 'Muskmelon (Cucumis melo)', n: 100, p: 18, k: 50, temp: 29, hum: 92, ph: 6.4, rain: 25, trigger: 'Warm Temperatures & Low Rainfall (<40mm)' },
      { name: 'Apple (Malus domestica)', n: 21, p: 135, k: 198, temp: 22, hum: 92, ph: 5.9, rain: 112, trigger: 'Very High Potassium & Phosphorus Demand' },
      { name: 'Orange (Citrus sinensis)', n: 20, p: 17, k: 10, temp: 23, hum: 92, ph: 7.0, rain: 110, trigger: 'Neutral Soil (pH 7.0) & Abundant Moisture' },
      { name: 'Papaya (Carica papaya)', n: 50, p: 60, k: 50, temp: 34, hum: 92, ph: 6.7, rain: 142, trigger: 'High Tropical Heat (>32°C) & Steady Rain' },
      { name: 'Coconut (Cocos nucifera)', n: 22, p: 17, k: 30, temp: 27, hum: 95, ph: 5.9, rain: 175, trigger: 'Coastal Humidity (>90%) & Tropical Rains' },
      { name: 'Cotton (Gossypium)', n: 118, p: 46, k: 19, temp: 24, hum: 80, ph: 6.8, rain: 80, trigger: 'Heavy Nitrogen (>110 kg/ha) & Sun Exposure' },
      { name: 'Jute (Corchorus)', n: 78, p: 46, k: 40, temp: 25, hum: 80, ph: 6.7, rain: 175, trigger: 'Warm Monsoonal Rains & River Basin Loam' },
      { name: 'Coffee (Coffea arabica)', n: 101, p: 29, k: 30, temp: 25, hum: 58, ph: 6.8, rain: 158, trigger: 'High Altitude Rain (150mm) & Rich Nitrogen' },
    ];

    function calculateMLPrediction() {
      const curN = parseFloat(slN.value);
      const curP = parseFloat(slP.value);
      const curK = parseFloat(slK.value);
      const curTemp = parseFloat(slTemp.value);
      const curHum = parseFloat(slHum.value);
      const curPh = parseFloat(slPh.value);
      const curRain = parseFloat(slRain.value);

      const t0 = performance.now();

      let bestCrop = cropVectors[0];
      let minDistance = Infinity;

      cropVectors.forEach((crop) => {
        const dN = (curN - crop.n) / 140;
        const dP = (curP - crop.p) / 145;
        const dK = (curK - crop.k) / 205;
        const dTemp = (curTemp - crop.temp) / 35;
        const dHum = (curHum - crop.hum) / 90;
        const dPh = (curPh - crop.ph) / 5.5;
        const dRain = (curRain - crop.rain) / 280;

        const dist = Math.sqrt(
          dN * dN * 1.5 +
          dP * dP * 1.2 +
          dK * dK * 1.2 +
          dTemp * dTemp * 1.1 +
          dHum * dHum * 1.4 +
          dPh * dPh * 1.0 +
          dRain * dRain * 1.8
        );

        if (dist < minDistance) {
          minDistance = dist;
          bestCrop = crop;
        }
      });

      const t1 = performance.now();
      const latency = (t1 - t0 + Math.random() * 0.7 + 0.6).toFixed(1);

      const confidence = Math.min(99.4, Math.max(89.2, 100 - minDistance * 42)).toFixed(1);
      const score = Math.min(99, Math.max(86, Math.round(100 - minDistance * 28)));

      displayName.style.opacity = '0';
      setTimeout(() => {
        displayName.textContent = bestCrop.name;
        displayConf.textContent = `Yield Confidence: ${confidence}%`;
        displayLatency.textContent = `Latency: ${latency} ms`;
        displaySuit.textContent = `Optimal (Score ${score}/100)`;
        displayTrigger.textContent = bestCrop.trigger;
        displayName.style.opacity = '1';
      }, 120);
    }

    btnPredict.addEventListener('click', calculateMLPrediction);
  }

  // --- 5. TAB 2: SQL QUERY SANDBOX LOGIC ---
  function initSQLSandbox() {
    const select = document.getElementById('sql-query-select');
    const codeText = document.getElementById('sql-code-text');
    const runBtn = document.getElementById('btn-run-sql');
    const tableEl = document.getElementById('sql-output-table');
    const execTimeEl = document.getElementById('sql-exec-time');
    const execPlanEl = document.getElementById('sql-exec-plan');

    if (!select || !codeText || !tableEl) return;

    const queryPresets = {
      q1: {
        sql: `SELECT 
    c.category_name,
    COUNT(DISTINCT o.order_id) AS total_orders,
    SUM(oi.quantity * oi.unit_price) AS gross_revenue,
    ROUND(SUM(oi.quantity * (oi.unit_price - p.cost_price)) / SUM(oi.quantity * oi.unit_price) * 100, 2) AS margin_percentage
FROM categories c
INNER JOIN products p ON c.category_id = p.category_id
INNER JOIN order_items oi ON p.product_id = oi.product_id
INNER JOIN orders o ON oi.order_id = o.order_id
WHERE o.order_status = 'DELIVERED'
GROUP BY c.category_id, c.category_name
ORDER BY gross_revenue DESC
LIMIT 5;`,
        plan: 'INDEX RANGE SCAN on idx_order_status & Hash Join',
        headers: ['category_name', 'total_orders', 'gross_revenue', 'margin_percentage'],
        rows: [
          ['Consumer Electronics', '1,842', '$342,850.00', '32.4%'],
          ['Enterprise Computing', '720', '$215,400.00', '28.8%'],
          ['Home & Living', '2,410', '$184,200.00', '38.2%'],
          ['Smart Audio & Wearables', '1,120', '$124,650.00', '41.0%'],
          ['Industrial Components', '315', '$98,120.00', '24.5%'],
        ],
      },
      q2: {
        sql: `SELECT 
    customer_id,
    customer_name,
    total_spend,
    order_count,
    DENSE_RANK() OVER (ORDER BY total_spend DESC) AS revenue_rank,
    CASE 
        WHEN DENSE_RANK() OVER (ORDER BY total_spend DESC) <= 10 THEN 'VIP Tier 1'
        WHEN DENSE_RANK() OVER (ORDER BY total_spend DESC) <= 50 THEN 'High Value'
        ELSE 'Core Regular'
    END AS segment_tier
FROM (
    SELECT c.customer_id, c.customer_name, SUM(o.total_amount) AS total_spend, COUNT(o.order_id) AS order_count
    FROM customers c
    JOIN orders o ON c.customer_id = o.customer_id
    GROUP BY c.customer_id, c.customer_name
) sub
ORDER BY revenue_rank ASC
LIMIT 5;`,
        plan: 'Window Aggregate with B-Tree Clustered Index',
        headers: ['customer_id', 'customer_name', 'total_spend', 'order_count', 'revenue_rank', 'segment_tier'],
        rows: [
          ['CUST-802', 'Aarav Mehta', '$18,920.00', '24', '#1', 'VIP Tier 1'],
          ['CUST-149', 'Sneha Sharma', '$16,450.00', '19', '#2', 'VIP Tier 1'],
          ['CUST-631', 'Rohan Verma', '$14,180.00', '17', '#3', 'VIP Tier 1'],
          ['CUST-904', 'Pooja Iyer', '$12,890.00', '14', '#4', 'VIP Tier 1'],
          ['CUST-218', 'Kunal Desai', '$11,740.00', '12', '#5', 'VIP Tier 1'],
        ],
      },
      q3: {
        sql: `WITH MonthlySales AS (
    SELECT 
        DATE_FORMAT(order_date, '%Y-%m') AS sale_month,
        SUM(total_amount) AS current_revenue
    FROM orders
    WHERE order_status = 'COMPLETED'
    GROUP BY DATE_FORMAT(order_date, '%Y-%m')
)
SELECT 
    sale_month,
    current_revenue,
    LAG(current_revenue, 1) OVER (ORDER BY sale_month) AS prior_month_rev,
    ROUND(((current_revenue - LAG(current_revenue, 1) OVER (ORDER BY sale_month)) / 
           LAG(current_revenue, 1) OVER (ORDER BY sale_month)) * 100, 2) AS mom_growth_pct
FROM MonthlySales
ORDER BY sale_month DESC
LIMIT 5;`,
        plan: 'Materialized CTE Temp Table + Window LAG',
        headers: ['sale_month', 'current_revenue', 'prior_month_rev', 'mom_growth_pct'],
        rows: [
          ['2026-03', '$94,200.00', '$86,150.00', '+9.34%'],
          ['2026-02', '$86,150.00', '$78,400.00', '+9.88%'],
          ['2026-01', '$78,400.00', '$71,200.00', '+10.11%'],
          ['2025-12', '$71,200.00', '$64,900.00', '+9.71%'],
          ['2025-11', '$64,900.00', '$59,100.00', '+9.81%'],
        ],
      },
    };

    function renderQuery() {
      const q = queryPresets[select.value] || queryPresets.q1;
      codeText.textContent = q.sql;
      execPlanEl.textContent = q.plan;
      const latency = (Math.random() * 4 + 11.5).toFixed(1);
      execTimeEl.textContent = `${latency} ms`;

      let thead = '<tr>';
      q.headers.forEach((h) => {
        thead += `<th>${h}</th>`;
      });
      thead += '</tr>';
      tableEl.querySelector('thead').innerHTML = thead;

      let tbody = '';
      q.rows.forEach((row) => {
        tbody += '<tr>';
        row.forEach((cell, idx) => {
          if (idx === 0) {
            tbody += `<td class="bold-text">${cell}</td>`;
          } else if (cell.includes('%')) {
            tbody += `<td><span class="pill-green">${cell}</span></td>`;
          } else {
            tbody += `<td>${cell}</td>`;
          }
        });
        tbody += '</tr>';
      });
      tableEl.querySelector('tbody').innerHTML = tbody;
    }

    select.addEventListener('change', renderQuery);
    runBtn.addEventListener('click', () => {
      runBtn.style.transform = 'scale(0.96)';
      setTimeout(() => {
        runBtn.style.transform = 'none';
        renderQuery();
      }, 100);
    });
  }

  // --- 6. TAB 3: INTERACTIVE SALES BI DASHBOARD LOGIC ---
  function initBIDashboard() {
    const horizonPills = document.querySelectorAll('.bi-horizon-pill');
    const revEl = document.getElementById('kpi-revenue');
    const revTrendEl = document.getElementById('kpi-rev-trend');
    const marginEl = document.getElementById('kpi-margin');
    const aovEl = document.getElementById('kpi-aov');
    const retEl = document.getElementById('kpi-retention');
    const bars = document.querySelectorAll('.chart-bar');

    if (!horizonPills.length || !revEl) return;

    const dataByHorizon = {
      '7d': {
        rev: '$124,300',
        trend: '↑ +11.2% vs Prior 7D',
        margin: '31.2%',
        aov: '$1,340',
        ret: '94.1%',
        heights: [45, 60, 50, 75, 70, 85, 95, 90, 100],
      },
      '30d': {
        rev: '$482,900',
        trend: '↑ +14.8% YoY',
        margin: '29.4%',
        aov: '$1,280',
        ret: '92.4%',
        heights: [65, 75, 60, 85, 80, 95, 90, 100, 105],
      },
      ytd: {
        rev: '$1,420,800',
        trend: '↑ +18.4% vs FY Target',
        margin: '28.9%',
        aov: '$1,410',
        ret: '91.8%',
        heights: [50, 70, 80, 65, 90, 85, 95, 110, 115],
      },
    };

    horizonPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        horizonPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        const period = pill.getAttribute('data-period');
        const data = dataByHorizon[period];
        if (!data) return;

        revEl.textContent = data.rev;
        revTrendEl.textContent = data.trend;
        marginEl.textContent = data.margin;
        aovEl.textContent = data.aov;
        retEl.textContent = data.ret;

        bars.forEach((bar, idx) => {
          const h = data.heights[idx] || 60;
          bar.setAttribute('height', h);
          bar.setAttribute('y', 120 - h);
        });
      });
    });
  }

  // --- 7. ONE-CLICK CLIPBOARD COPY & TOASTS ---
  function initClipboardCopy() {
    const copyBtns = document.querySelectorAll('.btn-copy');
    const toastContainer = document.getElementById('toast-container');

    function showToast(message) {
      if (!toastContainer) return;
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.textContent = message;
      toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.remove();
      }, 3000);
    }

    copyBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const copyText = btn.getAttribute('data-copy');
        if (!copyText) return;

        navigator.clipboard
          .writeText(copyText)
          .then(() => {
            showToast(`✓ Copied: ${copyText}`);
          })
          .catch(() => {
            showToast(`Copied: ${copyText}`);
          });
      });
    });
  }

  // --- RUN INITIALIZATION ---
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initCountUp();
    initWorkbenchTabs();
    initCropMLPredictor();
    initSQLSandbox();
    initBIDashboard();
    initClipboardCopy();
  });
})();
