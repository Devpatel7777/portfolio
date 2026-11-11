/* ==========================================================================
   Dev Patel — Shared Room Navigation, Theme Sync & Reveal Controller
   ========================================================================== */
(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const embedded = params.get('embed') === '1' || window.parent !== window;

  function applyTheme(mode) {
    if (mode === 'dark') {
      document.documentElement.dataset.mode = 'dark';
    } else {
      delete document.documentElement.dataset.mode;
    }
  }

  // Initial sync from query param or localStorage
  try {
    const t = params.get('theme') || localStorage.getItem('dev-mode');
    if (t) applyTheme(t);
  } catch (e) {}

  window.addEventListener('message', e => {
    if (e.data && e.data.theme) applyTheme(e.data.theme);
  });

  // "Back to the doors" handler
  const backBtn = document.getElementById('backDoors');
  if (backBtn) {
    backBtn.addEventListener('click', e => {
      if (embedded) {
        e.preventDefault();
        window.parent.postMessage({ wall: 'go' }, '*');
      }
    });
  }

  // Smooth room-to-room switching when embedded inside #wallv
  document.querySelectorAll('.rn__pill[data-door]').forEach(pill => {
    pill.addEventListener('click', e => {
      if (embedded) {
        e.preventDefault();
        window.parent.postMessage({
          wall: 'go',
          switchDoor: Number(pill.dataset.door)
        }, '*');
      }
    });
  });

  // Escape key returns to doors when embedded
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && embedded) {
      window.parent.postMessage({ wall: 'go' }, '*');
    }
  });

  // Scroll-reveal cards
  const cards = Array.from(document.querySelectorAll('.card'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add('on');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    cards.forEach(c => io.observe(c));
  } else {
    cards.forEach(c => c.classList.add('on'));
  }
})();
