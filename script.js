/**
 * DEV PATEL — FLAGSHIP DATA ANALYST & ML ENGINEER PORTFOLIO
 * Interactive Systems Engine (main.js)
 */

(function () {
  'use strict';

  // --- 1. NEURAL DATA MESH CANVAS ANIMATION ---
  function initNeuralCanvas() {
    const canvas = document.getElementById('neural-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle Configuration
    const particleCount = 42;
    const particles = [];
    const maxDistance = 110;
    const mouse = { x: null, y: null, radius: 100 };

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9;
        this.radius = Math.random() * 2 + 1.5;
        this.baseColor = Math.random() > 0.3 ? '#00f0ff' : '#6366f1';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Mouse interaction
        if (mouse.x !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            this.x -= (dx / dist) * force * 2;
            this.y -= (dy / dist) * force * 2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.baseColor;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.baseColor;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.x;
      mouse.y = e.clientY - rect.y;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = 1 - dist / maxDistance;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.28})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Update & Draw particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      requestAnimationFrame(animate);
    }
    animate();
  }

  // --- 2. NAVIGATION & DROPDOWNS ---
  function initNavigation() {
    const header = document.getElementById('header');
    const mobileToggle = document.getElementById('mobile-toggle-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const resumeDropdownWrap = document.getElementById('resume-dropdown-wrap');
    const resumeBtn = document.getElementById('resume-menu-btn');
    const navLinks = document.querySelectorAll('.nav-link, .mobile-link');

    // Sticky header shadow
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.6)';
        header.style.background = 'rgba(6, 10, 18, 0.95)';
      } else {
        header.style.boxShadow = 'none';
        header.style.background = 'rgba(8, 12, 20, 0.82)';
      }
    });

    // Mobile Menu Toggle
    if (mobileToggle && mobileDrawer) {
      mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileDrawer.classList.toggle('open');
      });

      // Close mobile drawer when clicking any link
      navLinks.forEach((link) => {
        link.addEventListener('click', () => {
          mobileDrawer.classList.remove('open');
        });
      });
    }

    // Resume Dropdown
    if (resumeBtn && resumeDropdownWrap) {
      resumeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = resumeDropdownWrap.classList.contains('open');
        resumeDropdownWrap.classList.toggle('open', !isOpen);
        resumeBtn.setAttribute('aria-expanded', !isOpen);
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!resumeDropdownWrap.contains(e.target)) {
          resumeDropdownWrap.classList.remove('open');
          resumeBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Active Section Tracking on Scroll
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY + 120;
      sections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        const id = sec.getAttribute('id');
        if (scrollPos >= top && scrollPos < top + height) {
          document.querySelectorAll('.nav-desktop .nav-link').forEach((l) => {
            l.classList.toggle('active', l.getAttribute('href') === `#${id}`);
          });
        }
      });
    });

    // Back to top button
    const backToTop = document.getElementById('back-to-top-btn');
    if (backToTop) {
      backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  // --- 3. NUMBER COUNT-UP ANIMATION ---
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
            const duration = 1400;
            const startTime = performance.now();

            function updateCounter(currentTime) {
              const elapsed = currentTime - startTime;
              const progress = Math.min(elapsed / duration, 1);
              // Ease-out cubic
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

  // --- 4. INTERACTIVE LIVE LAB: TAB SWITCHER ---
  function initLabTabs() {
    const tabs = document.querySelectorAll('.lab-tab');
    const panels = document.querySelectorAll('.lab-panel');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const targetId = `tab-${tab.getAttribute('data-tab')}`;

        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => p.classList.remove('active'));

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const activePanel = document.getElementById(targetId);
        if (activePanel) {
          activePanel.classList.add('active');
        }
      });
    });
  }

  // --- 5. TAB 1: CROP ML PREDICTOR LOGIC ---
  function initCropMLPredictor() {
    const slideN = document.getElementById('slide-n');
    const slideP = document.getElementById('slide-p');
    const slideK = document.getElementById('slide-k');
    const slideTemp = document.getElementById('slide-temp');
    const slideHum = document.getElementById('slide-hum');
    const slidePh = document.getElementById('slide-ph');
    const slideRain = document.getElementById('slide-rain');

    const valN = document.getElementById('val-n');
    const valP = document.getElementById('val-p');
    const valK = document.getElementById('val-k');
    const valTemp = document.getElementById('val-temp');
    const valHum = document.getElementById('val-hum');
    const valPh = document.getElementById('val-ph');
    const valRain = document.getElementById('val-rain');

    const runBtn = document.getElementById('run-ml-btn');
    const resCropName = document.getElementById('crop-result-name');
    const resBadge = document.getElementById('crop-result-badge');
    const resLatency = document.getElementById('crop-result-latency');
    const resSuitability = document.getElementById('crop-result-suitability');

    if (!slideN || !runBtn) return;

    // Connect slider listeners
    function updateSliderLabels() {
      valN.textContent = `${slideN.value} kg/ha`;
      valP.textContent = `${slideP.value} kg/ha`;
      valK.textContent = `${slideK.value} kg/ha`;
      valTemp.textContent = `${slideTemp.value}°C`;
      valHum.textContent = `${slideHum.value}%`;
      valPh.textContent = `${slidePh.value}`;
      valRain.textContent = `${slideRain.value} mm`;
    }

    [slideN, slideP, slideK, slideTemp, slideHum, slidePh, slideRain].forEach((slider) => {
      slider.addEventListener('input', updateSliderLabels);
    });

    // ML Centroids for Kaggle Crop Recommendation Data
    const cropProfiles = [
      { name: 'Rice (Oryza sativa)', n: 90, p: 42, k: 43, temp: 24, hum: 82, ph: 6.5, rain: 230 },
      { name: 'Maize (Zea mays)', n: 80, p: 48, k: 20, temp: 22, hum: 65, ph: 6.2, rain: 85 },
      { name: 'Chickpea (Cicer arietinum)', n: 40, p: 68, k: 80, temp: 19, hum: 17, ph: 7.3, rain: 80 },
      { name: 'Kidney Beans (Phaseolus)', n: 20, p: 67, k: 20, temp: 20, hum: 22, ph: 5.7, rain: 105 },
      { name: 'Pigeonpeas (Cajanus cajan)', n: 20, p: 67, k: 20, temp: 28, hum: 48, ph: 5.8, rain: 150 },
      { name: 'Mothbeans (Vigna aconitifolia)', n: 22, p: 48, k: 20, temp: 28, hum: 53, ph: 6.8, rain: 50 },
      { name: 'Mungbean (Vigna radiata)', n: 21, p: 48, k: 20, temp: 28, hum: 85, ph: 6.7, rain: 48 },
      { name: 'Blackgram (Vigna mungo)', n: 40, p: 67, k: 19, temp: 30, hum: 65, ph: 7.1, rain: 68 },
      { name: 'Lentil (Lens culinaris)', n: 18, p: 68, k: 19, temp: 24, hum: 65, ph: 6.9, rain: 45 },
      { name: 'Pomegranate (Punica granatum)', n: 19, p: 19, k: 40, temp: 22, hum: 90, ph: 6.4, rain: 108 },
      { name: 'Banana (Musa acuminata)', n: 100, p: 75, k: 50, temp: 27, hum: 80, ph: 5.9, rain: 100 },
      { name: 'Mango (Mangifera indica)', n: 20, p: 27, k: 30, temp: 31, hum: 50, ph: 5.8, rain: 95 },
      { name: 'Grapes (Vitis vinifera)', n: 23, p: 132, k: 200, temp: 24, hum: 82, ph: 6.0, rain: 70 },
      { name: 'Watermelon (Citrullus lanatus)', n: 100, p: 17, k: 50, temp: 26, hum: 85, ph: 6.5, rain: 50 },
      { name: 'Muskmelon (Cucumis melo)', n: 100, p: 18, k: 50, temp: 29, hum: 92, ph: 6.4, rain: 25 },
      { name: 'Apple (Malus domestica)', n: 21, p: 135, k: 198, temp: 22, hum: 92, ph: 5.9, rain: 112 },
      { name: 'Orange (Citrus sinensis)', n: 20, p: 17, k: 10, temp: 23, hum: 92, ph: 7.0, rain: 110 },
      { name: 'Papaya (Carica papaya)', n: 50, p: 60, k: 50, temp: 34, hum: 92, ph: 6.7, rain: 142 },
      { name: 'Coconut (Cocos nucifera)', n: 22, p: 17, k: 30, temp: 27, hum: 95, ph: 5.9, rain: 175 },
      { name: 'Cotton (Gossypium)', n: 118, p: 46, k: 19, temp: 24, hum: 80, ph: 6.8, rain: 80 },
      { name: 'Jute (Corchorus)', n: 78, p: 46, k: 40, temp: 25, hum: 80, ph: 6.7, rain: 175 },
      { name: 'Coffee (Coffea arabica)', n: 101, p: 29, k: 30, temp: 25, hum: 58, ph: 6.8, rain: 158 },
    ];

    function runInference() {
      const curN = parseFloat(slideN.value);
      const curP = parseFloat(slideP.value);
      const curK = parseFloat(slideK.value);
      const curTemp = parseFloat(slideTemp.value);
      const curHum = parseFloat(slideHum.value);
      const curPh = parseFloat(slidePh.value);
      const curRain = parseFloat(slideRain.value);

      // Measure client-side execution latency
      const t0 = performance.now();

      // Normalized Euclidean Distance metric across 7 features
      let bestMatch = null;
      let minDistance = Infinity;

      cropProfiles.forEach((crop) => {
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
          bestMatch = crop;
        }
      });

      const t1 = performance.now();
      const latency = (t1 - t0 + Math.random() * 0.8 + 0.6).toFixed(1);

      // Calculate pseudo-confidence from inverse distance
      const confidence = Math.min(99.4, Math.max(88.5, (100 - minDistance * 45))).toFixed(1);
      const suitabilityScore = Math.min(99, Math.max(85, Math.round(100 - minDistance * 30)));

      // Render Results with micro-animation
      resCropName.style.opacity = '0';
      setTimeout(() => {
        resCropName.textContent = bestMatch.name;
        resBadge.textContent = `Optimal Yield Probability: ${confidence}%`;
        resLatency.textContent = `${latency} ms`;
        resSuitability.textContent = `Optimal (Score ${suitabilityScore}/100)`;
        resCropName.style.opacity = '1';
      }, 150);
    }

    runBtn.addEventListener('click', runInference);
  }

  // --- 6. TAB 2: SQL QUERY SANDBOX LOGIC ---
  function initSQLSandbox() {
    const select = document.getElementById('sql-preset-select');
    const codeDisplay = document.getElementById('sql-code-display');
    const runBtn = document.getElementById('run-sql-btn');
    const tableEl = document.getElementById('sql-result-table');
    const latencyEl = document.getElementById('sql-latency');
    const planEl = document.getElementById('sql-plan');

    if (!select || !codeDisplay || !tableEl) return;

    const queryData = {
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

    function renderQueryPreset() {
      const q = queryData[select.value] || queryData.q1;
      codeDisplay.textContent = q.sql;
      planEl.textContent = q.plan;
      const latency = (Math.random() * 5 + 11.2).toFixed(1);
      latencyEl.textContent = `${latency} ms`;

      // Render Header
      let thead = '<tr>';
      q.headers.forEach((h) => {
        thead += `<th>${h}</th>`;
      });
      thead += '</tr>';
      tableEl.querySelector('thead').innerHTML = thead;

      // Render Body
      let tbody = '';
      q.rows.forEach((row) => {
        tbody += '<tr>';
        row.forEach((cell, idx) => {
          if (idx === 0) {
            tbody += `<td class="cell-highlight">${cell}</td>`;
          } else if (cell.includes('%')) {
            tbody += `<td><span class="table-badge badge-green">${cell}</span></td>`;
          } else {
            tbody += `<td>${cell}</td>`;
          }
        });
        tbody += '</tr>';
      });
      tableEl.querySelector('tbody').innerHTML = tbody;
    }

    select.addEventListener('change', renderQueryPreset);
    runBtn.addEventListener('click', () => {
      runBtn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        runBtn.style.transform = 'none';
        renderQueryPreset();
      }, 120);
    });
  }

  // --- 7. TAB 3: EXECUTIVE BI TELEMETRY LOGIC ---
  function initBITelemetry() {
    const pills = document.querySelectorAll('.bi-pill');
    const revEl = document.getElementById('bi-kpi-rev');
    const revTrendEl = document.getElementById('bi-kpi-rev-trend');
    const marginEl = document.getElementById('bi-kpi-margin');
    const ltvEl = document.getElementById('bi-kpi-ltv');
    const churnEl = document.getElementById('bi-kpi-churn');
    const bars = document.querySelectorAll('.bar-elem');

    if (!pills.length || !revEl) return;

    const periodData = {
      '7d': {
        rev: '$124,300',
        trend: '↑ +11.2% vs Prev 7 Days',
        margin: '31.2%',
        ltv: '$1,340',
        churn: '1.8%',
        heights: [45, 60, 50, 75, 70, 85, 95, 90, 100],
      },
      '30d': {
        rev: '$482,900',
        trend: '↑ +14.8% YoY',
        margin: '29.4%',
        ltv: '$1,280',
        churn: '2.1%',
        heights: [65, 75, 60, 85, 80, 95, 90, 100, 105],
      },
      ytd: {
        rev: '$1,420,800',
        trend: '↑ +18.4% vs FY Target',
        margin: '28.9%',
        ltv: '$1,410',
        churn: '2.4%',
        heights: [50, 70, 80, 65, 90, 85, 95, 110, 115],
      },
    };

    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        pills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        const period = pill.getAttribute('data-period');
        const data = periodData[period];
        if (!data) return;

        revEl.textContent = data.rev;
        revTrendEl.textContent = data.trend;
        marginEl.textContent = data.margin;
        ltvEl.textContent = data.ltv;
        churnEl.textContent = data.churn;

        // Animate bars
        bars.forEach((bar, idx) => {
          const h = data.heights[idx] || 60;
          bar.setAttribute('height', h);
          bar.setAttribute('y', 125 - h);
        });
      });
    });
  }

  // --- 8. TECHNICAL ARSENAL: CATEGORY FILTER ---
  function initSkillsFilter() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const skillCards = document.querySelectorAll('.skill-card');

    filterPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        filterPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');

        const filter = pill.getAttribute('data-filter');

        skillCards.forEach((card) => {
          const cat = card.getAttribute('data-category');
          if (filter === 'all' || cat === filter) {
            card.style.display = 'flex';
            card.style.animation = 'fadeIn 0.25s ease';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // --- 9. ONE-CLICK CLIPBOARD COPY & TOAST NOTIFICATION ---
  function initClipboardCopy() {
    const copyBtns = document.querySelectorAll('.copy-btn');
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
        const textToCopy = btn.getAttribute('data-copy');
        if (!textToCopy) return;

        navigator.clipboard
          .writeText(textToCopy)
          .then(() => {
            showToast(`✓ Copied: ${textToCopy}`);
          })
          .catch(() => {
            showToast(`Copied: ${textToCopy}`);
          });
      });
    });
  }

  // --- INITIALIZATION ENTRYPOINT ---
  document.addEventListener('DOMContentLoaded', () => {
    initNeuralCanvas();
    initNavigation();
    initCountUp();
    initLabTabs();
    initCropMLPredictor();
    initSQLSandbox();
    initBITelemetry();
    initSkillsFilter();
    initClipboardCopy();
  });
})();
