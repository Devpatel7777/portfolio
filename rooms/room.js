/* ==========================================================================
   Dev Patel — Shared Room Navigation, Theme Sync & Reveal Controller
   ========================================================================== */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const embedded = params.get('embed') === '1' || window.parent !== window;
  const TARGET_ORIGIN = location.origin === 'null' ? '*' : location.origin;

  function applyTheme(mode) {
    if (mode === 'dark') {
      document.documentElement.dataset.mode = 'dark';
    } else {
      delete document.documentElement.dataset.mode;
    }
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

  // Notify parent frame immediately once interactive DOM + styles are painted
  if (embedded) {
    requestAnimationFrame(() => {
      try { window.parent.postMessage({ roomReady: true }, TARGET_ORIGIN); } catch (e) {}
    });
  }

  const backBtn = document.getElementById('backDoors');
  if (backBtn) {
    backBtn.addEventListener('click', e => {
      if (embedded) {
        e.preventDefault();
        window.parent.postMessage({ wall: 'go' }, TARGET_ORIGIN);
      }
    });
  }

  document.querySelectorAll('.rn__pill[data-door]').forEach(pill => {
    pill.addEventListener('click', e => {
      if (embedded) {
        e.preventDefault();
        window.parent.postMessage({
          wall: 'go',
          switchDoor: Number(pill.dataset.door)
        }, TARGET_ORIGIN);
      }
    });
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && embedded) {
      window.parent.postMessage({ wall: 'go' }, TARGET_ORIGIN);
    }
  });

  const cards = Array.from(document.querySelectorAll('.card'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('on');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.02, rootMargin: '80px 0px' });
    cards.forEach(c => io.observe(c));
  } else {
    cards.forEach(c => c.classList.add('on'));
  }
})();
