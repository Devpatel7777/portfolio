/**
 * DEV PATEL — DATA ANALYST & MACHINE LEARNING PORTFOLIO
 * High-performance interactive client scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  initAudioSystem();
  initCustomCursor();
  initHeroCanvas();
  initScrollSpy();
  initKineticCycler();
  initContributionMatrix();
  initTerminal();
  initHandshakeConnection();
  initTransmissionForm();
  initClipboardButtons();
  initResumeModal();
  initScrollReveal();
  initCardSpotlightAndTilt();
  initTextDecrypt();
  initSubsystemsBootSequence();
  initGitSvgAnimation();
  initMetricCounters();
});

/* ==========================================================================
   1. NATIVE WEB AUDIO SYNTHESIZER (ZERO ASSET DEPENDENCIES)
   ========================================================================== */
let audioCtx = null;
let audioEnabled = false;

function initAudioSystem() {
  const toggleBtn = document.getElementById('audio-toggle-btn');
  const iconMuted = document.getElementById('audio-icon-muted');
  const iconUnmuted = document.getElementById('audio-icon-unmuted');

  if (!toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    audioEnabled = !audioEnabled;

    if (audioEnabled) {
      if (iconMuted) iconMuted.classList.add('hidden');
      if (iconUnmuted) iconUnmuted.classList.remove('hidden');
      playTone(880, 'sine', 0.08, 0.05);
      showToast('SFX Enabled: Cyber audio feedback active');
    } else {
      if (iconMuted) iconMuted.classList.remove('hidden');
      if (iconUnmuted) iconUnmuted.classList.add('hidden');
      showToast('SFX Muted');
    }
  });

  // Attach hover sounds to interactive elements
  const hoverTargets = document.querySelectorAll('a, button, .card-spotlight, .tech-badge, .kinetic-dot');
  hoverTargets.forEach((target) => {
    target.addEventListener('mouseenter', () => {
      if (audioEnabled) {
        playTone(1200, 'sine', 0.02, 0.015);
      }
    });
  });
}

function playTone(freq = 440, type = 'sine', duration = 0.05, gainLevel = 0.04) {
  if (!audioEnabled || !audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(gainLevel, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_e) {
    // Ignore audio context errors on background tabs
  }
}

function playConnectChime() {
  if (!audioEnabled || !audioCtx) return;
  const now = audioCtx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chord

  freqs.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'triangle', 0.12, 0.035);
    }, idx * 60);
  });
}

/* ==========================================================================
   2. CUSTOM CURSOR WITH SPRING INTERPOLATION
   ========================================================================== */
function initCustomCursor() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');

  if (!dot || !ring) return;

  // Disable on mobile/touch screens
  if (window.matchMedia('(pointer: coarse)').matches) {
    dot.style.display = 'none';
    ring.style.display = 'none';
    return;
  }

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
  });

  function renderCursor() {
    // Smooth lag interpolation
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);

  // Expand ring on interactive element hover
  const interactives = document.querySelectorAll('a, button, input, textarea, .card-spotlight');
  interactives.forEach((el) => {
    el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
    el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
  });
}

/* ==========================================================================
   3. HERO CANVAS: CONSTELLATION GRAPH & PARTICLE NETWORK
   ========================================================================== */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let width = (canvas.width = canvas.parentElement.offsetWidth);
  let height = (canvas.height = canvas.parentElement.offsetHeight);

  const particles = [];
  const particleCount = Math.min(Math.floor((width * height) / 12000), 75);
  const maxDistance = 120;

  let mouse = { x: null, y: null, radius: 140 };

  window.addEventListener('resize', () => {
    if (!canvas.parentElement) return;
    width = canvas.width = canvas.parentElement.offsetWidth;
    height = canvas.height = canvas.parentElement.offsetHeight;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  class Particle {
    constructor(index) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * 0.55;
      this.vy = (Math.random() - 0.5) * 0.55;
      this.radius = Math.random() * 1.8 + 0.8;
      this.baseAlpha = Math.random() * 0.45 + 0.2;
      // Alternate between Electric Cyan and Matrix Emerald
      this.color = (index || 0) % 2 === 0 ? '0, 240, 255' : '0, 245, 160';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;

      // Mouse collision repulsion
      if (mouse.x !== null && mouse.y !== null) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          const angle = Math.atan2(dy, dx);
          this.x -= Math.cos(angle) * force * 1.5;
          this.y -= Math.sin(angle) * force * 1.5;
        }
      }
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.baseAlpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(${this.color}, 0.5)`;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(i));
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      particles[i].update();
      particles[i].draw();

      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.hypot(dx, dy);

        if (dist < maxDistance) {
          const alpha = (1 - dist / maxDistance) * 0.22;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(render);
  }

  // Observe intersection to halt canvas animation when not in viewport
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (!animationId) render();
        } else {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(canvas);
}

/* ==========================================================================
   4. SCROLL SPY HUD & PROGRESS BAR
   ========================================================================== */
function initScrollSpy() {
  const progressBar = document.getElementById('scroll-progress');
  const hudNum = document.getElementById('hud-section-number');
  const hudLabel = document.getElementById('hud-section-label');
  const sections = document.querySelectorAll('section[data-section-index]');

  if (!progressBar && sections.length === 0) return;

  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progressPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) {
      progressBar.style.width = `${progressPercent}%`;
    }

    // Determine current active section
    let currentSection = sections[0];
    const triggerOffset = window.innerHeight * 0.35;

    sections.forEach((sec) => {
      const top = sec.offsetTop;
      if (scrollTop + triggerOffset >= top) {
        currentSection = sec;
      }
    });

    if (currentSection && hudNum && hudLabel) {
      const idx = currentSection.getAttribute('data-section-index') || '01';
      const name = currentSection.getAttribute('data-section-name') || 'HERO';

      if (hudNum.textContent !== idx) {
        hudNum.textContent = idx;
        hudLabel.textContent = name;
      }
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ==========================================================================
   5. KINETIC TEXT CYCLER
   ========================================================================== */
function initKineticCycler() {
  const cycler = document.getElementById('kinetic-cycler');
  if (!cycler) return;

  const items = cycler.querySelectorAll('.kinetic-item');
  const dots = document.querySelectorAll('.kinetic-dot');
  const prevBtn = document.getElementById('kinetic-prev');
  const nextBtn = document.getElementById('kinetic-next');

  if (items.length === 0) return;

  let currentIndex = 0;
  let timer = null;

  function showIndex(index) {
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    currentIndex = index;
    playTone(950, 'sine', 0.03, 0.02);
  }

  function advance() {
    const nextIdx = (currentIndex + 1) % items.length;
    showIndex(nextIdx);
  }

  function startTimer() {
    stopTimer();
    timer = setInterval(advance, 3600);
  }

  function stopTimer() {
    if (timer) clearInterval(timer);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const prevIdx = (currentIndex - 1 + items.length) % items.length;
      showIndex(prevIdx);
      startTimer();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      advance();
      startTimer();
    });
  }

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      const targetIdx = parseInt(e.target.getAttribute('data-target'), 10);
      if (!isNaN(targetIdx)) {
        showIndex(targetIdx);
        startTimer();
      }
    });
  });

  cycler.addEventListener('mouseenter', stopTimer);
  cycler.addEventListener('mouseleave', startTimer);

  startTimer();
}

/* ==========================================================================
   6. GITHUB CONTRIBUTION HEATMAP MATRIX GENERATOR
   ========================================================================== */
function initContributionMatrix() {
  const container = document.getElementById('matrix-container');
  if (!container) return;

  // 52 weeks x 7 days
  const totalWeeks = 52;
  const daysPerWeek = 7;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fragment = document.createDocumentFragment();

  for (let w = 0; w < totalWeeks; w++) {
    const col = document.createElement('div');
    col.className = 'matrix-week-col';
    col.style.transitionDelay = `${w * 10}ms`;

    for (let d = 0; d < daysPerWeek; d++) {
      const cell = document.createElement('div');
      cell.className = 'matrix-cell';

      // Realistic distribution of commit activity for Dev Patel
      const seed = (w * 7 + d * 13 + 37) % 100;
      let level = 0;
      let commits = 0;

      if (seed > 78) {
        level = 4;
        commits = Math.floor(Math.random() * 8) + 8;
      } else if (seed > 56) {
        level = 3;
        commits = Math.floor(Math.random() * 4) + 4;
      } else if (seed > 32) {
        level = 2;
        commits = Math.floor(Math.random() * 3) + 2;
      } else if (seed > 14) {
        level = 1;
        commits = 1;
      } else {
        level = 0;
        commits = 0;
      }

      cell.classList.add(`lvl-${level}`);

      const monthName = months[Math.floor((w / totalWeeks) * 12)];
      const dayNum = ((w * 7 + d) % 28) + 1;
      const tooltip = commits === 0 ? `No commits on ${monthName} ${dayNum}` : `${commits} commits on ${monthName} ${dayNum}`;
      cell.setAttribute('title', tooltip);

      cell.addEventListener('click', () => {
        playTone(700 + level * 100, 'sine', 0.05, 0.03);
        showToast(tooltip);
      });

      col.appendChild(cell);
    }
    fragment.appendChild(col);
  }

  container.innerHTML = '';
  container.appendChild(fragment);
  container.classList.add('matrix-container-anim');

  // Trigger cascade reveal
  const matrixObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          container.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  matrixObserver.observe(container);

  // Fallback to ensure it's always revealed
  setTimeout(() => {
    container.classList.add('revealed');
  }, 350);
}

/* ==========================================================================
   7. INTERACTIVE OPERATING SYSTEM TERMINAL (DEV PATEL OS)
   ========================================================================== */
function initTerminal() {
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-input');
  const output = document.getElementById('terminal-output');
  const terminalBody = document.getElementById('terminal-body');
  const clearBtn = document.getElementById('term-clear-btn');
  const quickCmdBtns = document.querySelectorAll('.quick-cmd-btn');

  if (!form || !input || !output) return;

  const commandHistory = [];
  let historyIndex = -1;

  const commandRegistry = {
    help: () => `DEV PATEL // QUANTUM ANALYTICS CORE (v2.6) — Commands:
  about       View developer background and systems profile
  projects    List key Machine Learning & Data Analytics case studies
  skills      Display verified Python, ML/AI, SQL & BI stack
  timeline    Print career milestones & education history
  contact     Open direct transmission channel & contact links
  resume      Open and view resume summary sheet
  matrix      Toggle digital rain animation mode
  date        Display system hardware clock
  whoami      Display current terminal caller permissions
  echo [text] Print input back to screen
  theme       Toggle terminal visual theme
  clear       Clear terminal screen history`,

    about: () => `Dev Patel — Data Analyst & Machine Learning Engineer
Focus: Business Intelligence, Relational SQL Architecture, Predictive ML Pipelines & GenAI/RAG Systems.
Location: Ahmedabad, Gujarat, India.
Passionate about turning messy raw data into actionable business intelligence and high-impact automated AI solutions.`,

    projects: () => `FEATURED CASE STUDIES & PRODUCTION PIPELINES:
1. SALES ANALYTICS DASHBOARD [FEATURED BI SYSTEM]
   Stack: Power BI, DAX, Relational Data Modeling, KPI Design
   Key: Interactive reporting across 10,000+ sales records, 4 product categories, 8 core business KPIs.
   Repo: https://github.com/Devpatel7777/power-bi-final

2. E-COMMERCE SALES & CUSTOMER SEGMENTATION
   Stack: MySQL, Advanced SQL Joins, Subqueries, Window Functions, RFM Analysis
   Key: 6-table normalized relational schema, monthly revenue trend analysis, repeat purchase retention.
   Repo: https://github.com/Devpatel7777/ecommerce-sql-analysis

3. CROP RECOMMENDATION SYSTEM
   Stack: Python, Scikit-learn, Streamlit, Multi-class Classification
   Key: 7 soil & climate features (N, P, K, Temp, Humidity, pH, Rainfall) predicting 22 agricultural crop classes.
   Repo: https://github.com/Devpatel7777/ML-Crop-Recommendation

4. GENAI APPLICATION SUITE & MULTI-PDF RAG
   Stack: LangChain, LangGraph, Gemini API Embeddings, In-Memory Vector Store, Streamlit
   Key: Multi-document retrieval-augmented generation assistant for instant question answering.
   Repo: https://github.com/Devpatel7777/Gen_AI

5. AI TRAVEL PLANNER AGENT
   Stack: LangChain, Groq LLM, Serper Search API, Tool-Calling Architecture
   Key: Autonomous multi-tool agent generating complete itineraries, live web search & budgets.
   Repo: https://github.com/Devpatel7777/AI-Travel-Planner`,

    skills: () => `VERIFIED TECHNICAL SUBSYSTEMS:
[PROGRAMMING & CORE]     Python • SQL • MySQL • JavaScript • HTML5 • CSS3
[DATA SCIENCE & EDA]     Pandas • NumPy • Exploratory Data Analysis (EDA) • Statistical Hypothesis Testing • Feature Engineering • Excel
[MACHINE LEARNING & AI]  Scikit-learn • Regression • Classification • Streamlit • LangChain • LangGraph • RAG • Gemini • Groq LLM
[VISUALIZATION & TOOLS]  Power BI • Matplotlib • Seaborn • Jupyter Notebook • Git & GitHub • Vercel • Netlify`,

    timeline: () => `CAREER & ACADEMIC TIMELINE:
2019 — 2022  Diploma in Computer Engineering (Growmore Engineering College, Gujarat)
2022 — 2025  B.Tech in Computer Science Engineering (Parul University, Vadodara, Gujarat)
MAY — JUN    Data Science Intern (Prodigy InfoTech — 500,000+ records EDA & statistical modeling)
2026         GenAI Powered Data Analytics Job Simulation (TATA via Forage)
2026         Data Visualisation Simulation (TATA via Forage)
2026         Data Analytics Job Simulation (Deloitte via Forage)
2026         Chatbot / Smart Assistant Development (thingQbator / Nasscom Foundation)
2026         Power BI Analytics Workshop (Tech Tip 24) & Python Analyzers (TechWar 2026)
NOW          Open to Data Analyst & Machine Learning Opportunities`,

    contact: () => {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      return `Targeting #contact channel.
Email: devpatel846211@gmail.com
Phone / WhatsApp: +91 93289 77322
GitHub: https://github.com/Devpatel7777
LinkedIn: https://linkedin.com/in/dev-patel-0a1291216
Location: Ahmedabad, Gujarat, India
Live Portfolio: https://dev-7-patel-portfolio.vercel.app`;
    },

    resume: () => {
      const modal = document.getElementById('resume-modal');
      if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
      return `Opening Resume Summary viewer...`;
    },

    whoami: () => `guest@dp-systems.internal (Role: Guest Explorer, Status: Verified)`,

    date: () => new Date().toUTCString(),

    sudo: () => `sudo: Permission denied. User 'guest' is not in the sudoers file. This incident has been logged.`,

    theme: () => {
      document.body.classList.toggle('neon-theme');
      return `Terminal theme toggled.`;
    },

    matrix: () => {
      runMatrixRainInTerminal(output, terminalBody);
      return `Matrix digital stream initialized. Press any key or scroll to stop.`;
    },

    clear: () => {
      output.innerHTML = '';
      return '';
    }
  };

  function executeCommand(rawCmd) {
    const trimmed = rawCmd.trim();
    if (!trimmed) return;

    commandHistory.push(trimmed);
    historyIndex = commandHistory.length;

    // Render user command line
    const cmdLine = document.createElement('div');
    cmdLine.className = 'term-line-cmd';
    cmdLine.innerHTML = `<span class="prompt">guest@dp-systems:~$</span> <span>${escapeHtml(trimmed)}</span>`;
    output.appendChild(cmdLine);

    playTone(900, 'sine', 0.03, 0.02);

    // Parse command
    const parts = trimmed.split(' ');
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    let responseText = '';

    if (cmdName === 'echo') {
      responseText = escapeHtml(args);
    } else if (commandRegistry[cmdName]) {
      responseText = commandRegistry[cmdName]();
    } else {
      responseText = `zsh: command not found: ${escapeHtml(cmdName)}. Type 'help' for recognized commands.`;
    }

    if (responseText) {
      const respLine = document.createElement('div');
      respLine.className = 'term-line-resp';
      respLine.innerHTML = `<pre>${responseText}</pre>`;
      output.appendChild(respLine);
    }

    // Auto-scroll to bottom
    if (terminalBody) {
      terminalBody.scrollTop = terminalBody.scrollHeight;
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    executeCommand(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex > 0) {
        historyIndex--;
        input.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        input.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        input.value = '';
      }
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      commandRegistry.clear();
      playTone(500, 'sine', 0.04, 0.02);
    });
  }

  quickCmdBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      if (cmd) {
        executeCommand(cmd);
      }
    });
  });
}

function runMatrixRainInTerminal(outputElem, containerElem) {
  const matrixDiv = document.createElement('div');
  matrixDiv.className = 'term-matrix-rain';
  outputElem.appendChild(matrixDiv);

  const chars = '01DEV PATEL DATA ML SQL PYTHON PANDAS POWERBI RAG';
  let running = true;

  const interval = setInterval(() => {
    if (!running) return;
    let line = '';
    for (let i = 0; i < 48; i++) {
      line += chars[Math.floor(Math.random() * chars.length)] + ' ';
    }
    const p = document.createElement('div');
    p.textContent = line;
    p.style.color = '#30d158';
    p.style.fontFamily = 'monospace';
    p.style.fontSize = '11px';
    p.style.opacity = '0.85';
    matrixDiv.appendChild(p);

    if (containerElem) containerElem.scrollTop = containerElem.scrollHeight;

    if (matrixDiv.childNodes.length > 25) {
      matrixDiv.removeChild(matrixDiv.firstChild);
    }
  }, 70);

  function stopMatrix() {
    running = false;
    clearInterval(interval);
    window.removeEventListener('keydown', stopMatrix);
    window.removeEventListener('scroll', stopMatrix);
  }

  window.addEventListener('keydown', stopMatrix, { once: true });
  window.addEventListener('scroll', stopMatrix, { once: true });
}

/* ==========================================================================
   8. SECURE CHANNEL CONTACT HANDSHAKE SIMULATOR
   ========================================================================== */
function initHandshakeConnection() {
  const triggerBtn = document.getElementById('establish-connection-btn');
  const triggerWrap = document.getElementById('connection-trigger-wrap');
  const simWrap = document.getElementById('handshake-simulation-wrap');
  const runner = document.getElementById('packet-runner');
  const logsContainer = document.getElementById('handshake-logs');
  const revealedWrap = document.getElementById('revealed-channels-wrap');

  if (!triggerBtn || !simWrap || !logsContainer) return;

  triggerBtn.addEventListener('click', () => {
    playTone(750, 'sine', 0.1, 0.06);

    triggerWrap.classList.add('hidden');
    simWrap.classList.remove('hidden');

    if (runner) runner.classList.add('active');

    const steps = [
      { text: 'Initializing secure telemetry channel via wss://gateway.dp-systems.internal...', delay: 350 },
      { text: 'Resolving endpoint DNS & establishing TLS 1.3 cryptographic session...', delay: 800 },
      { text: 'Verifying origin credentials: [Curve25519-AES-256-GCM authenticated]...', delay: 1300 },
      { text: 'Connection established: 200 OK — Direct channels unlocked.', delay: 1800 }
    ];

    logsContainer.innerHTML = '';

    steps.forEach((step, idx) => {
      setTimeout(() => {
        const logLine = document.createElement('div');
        logLine.className = 'log-entry';
        logLine.innerHTML = `<span class="check">✓</span> <span>${step.text}</span>`;
        logsContainer.appendChild(logLine);
        playTone(650 + idx * 120, 'sine', 0.06, 0.04);

        if (idx === steps.length - 1) {
          setTimeout(() => {
            if (runner) runner.classList.remove('active');
            if (revealedWrap) revealedWrap.classList.remove('hidden');
            playConnectChime();
            showToast('Secure Connection Established: Channels Unlocked');
          }, 400);
        }
      }, step.delay);
    });
  });
}

/* ==========================================================================
   9. DIRECT PACKET TRANSMISSION FORM
   ========================================================================== */
function initTransmissionForm() {
  const form = document.getElementById('transmission-form');
  const feedback = document.getElementById('tx-feedback-msg');
  const sendBtn = document.getElementById('tx-send-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const sender = document.getElementById('tx-sender-name').value.trim();
    const email = document.getElementById('tx-sender-email').value.trim();
    const subject = document.getElementById('tx-subject').value.trim();
    const message = document.getElementById('tx-message').value.trim();

    if (!sender || !email || !message) {
      showToast('Error: Complete all required telemetry packet fields');
      return;
    }

    if (sendBtn) {
      sendBtn.disabled = true;
      sendBtn.innerHTML = `<span>DISPATCHING...</span>`;
    }

    playTone(1050, 'sine', 0.15, 0.05);

    setTimeout(() => {
      const mailtoLink = `mailto:devpatel846211@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`From: ${sender} (${email})\n\n${message}`)}`;
      window.location.href = mailtoLink;

      if (feedback) {
        feedback.textContent = 'Transmission dispatched to email client.';
        feedback.style.color = '#30d158';
      }

      showToast('Payload dispatched successfully via mail client');

      if (sendBtn) {
        sendBtn.disabled = false;
        sendBtn.innerHTML = `<span>TRANSMIT PACKET</span>`;
      }
      form.reset();
    }, 900);
  });
}

/* ==========================================================================
   10. CLIPBOARD INTERACTION BUTTONS
   ========================================================================== */
function initClipboardButtons() {
  const copyBtns = document.querySelectorAll('.copy-val-btn, [data-copy]');

  copyBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(textToCopy).then(() => {
          playTone(1300, 'sine', 0.08, 0.04);
          showToast(`Copied to clipboard: ${textToCopy}`);
        }).catch(() => {
          fallbackCopyText(textToCopy);
        });
      } else {
        fallbackCopyText(textToCopy);
      }
    });
  });

  function fallbackCopyText(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    try {
      document.execCommand('copy');
      playTone(1300, 'sine', 0.08, 0.04);
      showToast(`Copied to clipboard: ${text}`);
    } catch (_err) {
      showToast(`Value: ${text}`);
    }
    document.body.removeChild(tempInput);
  }
}

/* ==========================================================================
   11. RESUME MODAL & PRINT HANDLER
   ========================================================================== */
function initResumeModal() {
  const modal = document.getElementById('resume-modal');
  const openBtn = document.getElementById('open-resume-btn');
  const mobileBtn = document.getElementById('mobile-resume-btn');
  const footerBtn = document.getElementById('footer-resume-btn');
  const heroResumeBtn = document.getElementById('hero-cta-resume');
  const closeBtn = document.getElementById('close-resume-modal');
  const downloadBtn = document.getElementById('download-cv-btn');

  if (!modal) return;

  function openModal() {
    modal.classList.remove('hidden');
    playTone(800, 'sine', 0.06, 0.03);
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modal.classList.add('hidden');
    playTone(500, 'sine', 0.05, 0.03);
    document.body.style.overflow = '';
  }

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (mobileBtn) mobileBtn.addEventListener('click', openModal);
  if (footerBtn) footerBtn.addEventListener('click', openModal);
  if (heroResumeBtn) heroResumeBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  const downloadDaBtn = document.getElementById('download-da-btn');
  const downloadDsBtn = document.getElementById('download-ds-btn');
  const downloadAiBtn = document.getElementById('download-ai-btn');

  if (downloadDaBtn) {
    downloadDaBtn.addEventListener('click', () => {
      playTone(1200, 'sine', 0.1, 0.05);
      showToast('Downloading Dev_Patel_Data_Analyst_Resume.pdf...');
    });
  }

  if (downloadDsBtn) {
    downloadDsBtn.addEventListener('click', () => {
      playTone(1100, 'sine', 0.1, 0.05);
      showToast('Downloading Dev_Patel_Data_Scientist_Resume.pdf...');
    });
  }

  if (downloadAiBtn) {
    downloadAiBtn.addEventListener('click', () => {
      playTone(1050, 'triangle', 0.1, 0.05);
      showToast('Downloading Dev_Patel_AI_ML_Resume.pdf...');
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      playTone(1100, 'sine', 0.08, 0.04);
      window.print();
    });
  }
}

/* ==========================================================================
   12. TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message, duration = 3200) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'hud-toast';
  toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
    }, 300);
  }, duration);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/* ==========================================================================
   13. SCROLL REVEAL (INTERSECTION OBSERVER)
   ========================================================================== */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-item');
  if (revealElements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  revealElements.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   14. CARD SPOTLIGHT & 3D TILT EFFECT
   ========================================================================== */
function initCardSpotlightAndTilt() {
  const cards = document.querySelectorAll('.card-spotlight');

  // Skip tilt on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update radial glow coordinates
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);

      // Gentle 3D perspective tilt
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -3;
      const rotateY = ((x - centerX) / centerX) * 3;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

/* ==========================================================================
   15. TEXT DECRYPT / SCRAMBLE ANIMATION
   ========================================================================== */
function initTextDecrypt() {
  const decryptTargets = document.querySelectorAll('.decrypt-text');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_#@$%-+';

  function scramble(element) {
    const originalText = element.getAttribute('data-value') || element.textContent;
    let iteration = 0;

    const interval = setInterval(() => {
      element.textContent = originalText
        .split('')
        .map((char, index) => {
          if (index < iteration) {
            return originalText[index];
          }
          if (char === ' ') return ' ';
          return chars[Math.floor(Math.random() * chars.length)];
        })
        .join('');

      if (iteration >= originalText.length) {
        clearInterval(interval);
        element.textContent = originalText;
      }
      iteration += 1 / 2;
    }, 28);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          scramble(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  decryptTargets.forEach((el) => observer.observe(el));
}

/* ==========================================================================
   16. SUBSYSTEMS BOOT SEQUENCE
   ========================================================================== */
function initSubsystemsBootSequence() {
  const subsystemRows = document.querySelectorAll('.subsystem-row');
  if (subsystemRows.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          subsystemRows.forEach((row, i) => {
            setTimeout(() => {
              const led = row.querySelector('.led-dot');
              if (led) {
                led.classList.remove('offline');
                led.classList.add('online');
              }
              playTone(600 + i * 150, 'sine', 0.04, 0.02);
            }, i * 220);
          });
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  const tree = document.querySelector('.subsystems-tree');
  if (tree) observer.observe(tree);
}

/* ==========================================================================
   17. SVG GIT BRANCH TELEMETRY ANIMATION
   ========================================================================== */
function initGitSvgAnimation() {
  const gitSvg = document.getElementById('git-dag-svg') || document.getElementById('git-telemetry-svg');
  const gitPaths = document.querySelectorAll('.git-branch-path');
  const livePacket = document.getElementById('git-live-packet');
  const featurePath = document.getElementById('git-feature-path');

  if (!gitSvg) return;

  function triggerDraw() {
    gitSvg.classList.add('drawn');
    gitPaths.forEach((path) => {
      path.style.strokeDashoffset = '0';
    });
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          triggerDraw();
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(gitSvg);
  setTimeout(triggerDraw, 350);

  // Continuous traveling packet animation along the active feature branch curve
  if (livePacket && featurePath && typeof featurePath.getTotalLength === 'function') {
    try {
      const totalLen = featurePath.getTotalLength();
      let startTime = null;
      const loopDuration = 3400; // ms per traversal

      function stepPacket(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = (timestamp - startTime) % loopDuration;
        const progress = elapsed / loopDuration;
        const pt = featurePath.getPointAtLength(progress * totalLen);
        if (pt) {
          livePacket.setAttribute('cx', pt.x.toFixed(1));
          livePacket.setAttribute('cy', pt.y.toFixed(1));
        }
        requestAnimationFrame(stepPacket);
      }
      requestAnimationFrame(stepPacket);
    } catch (e) {
      console.warn('Git DAG packet animation warning:', e);
    }
  }

  // Node tooltips & interactive sound
  const nodes = gitSvg.querySelectorAll('.git-node');
  nodes.forEach((node) => {
    const commitMsg = node.getAttribute('data-commit');
    if (commitMsg) {
      node.setAttribute('title', commitMsg);
      node.addEventListener('click', () => {
        if (typeof playTone === 'function') {
          playTone(880, 'sine', 0.08, 0.04);
        }
        if (typeof showToast === 'function') {
          showToast(`Commit: ${commitMsg}`);
        }
      });
    }
  });
}

/* ==========================================================================
   18. METRIC COUNTERS
   ========================================================================== */
function initMetricCounters() {
  const counters = document.querySelectorAll('.counter-value, .metric-value[data-target]');
  if (counters.length === 0) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        obs.unobserve(el);

        const rawTarget = el.getAttribute('data-target') || '0';
        const targetVal = parseFloat(rawTarget);
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';
        const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
        const duration = 1400; // ms
        const startTime = performance.now();
        const isNegative = targetVal < 0;
        const absTarget = Math.abs(targetVal);

        el.classList.add('counting');

        function updateCounter(now) {
          const progress = Math.min((now - startTime) / duration, 1);
          // Ease out exponential curve
          const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const current = (absTarget * ease).toFixed(decimals);
          el.textContent = `${prefix}${isNegative ? '-' : ''}${current}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            el.textContent = `${prefix}${isNegative ? '-' : ''}${absTarget.toFixed(decimals)}${suffix}`;
            el.classList.remove('counting');
          }
        }

        requestAnimationFrame(updateCounter);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px 50px 0px' });

  counters.forEach((c) => observer.observe(c));
}
