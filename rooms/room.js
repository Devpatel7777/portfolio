/* ==========================================================================
   Dev Patel — Case Study Navigation, Theme Sync & Reveal Controller
   ========================================================================== */
(function () {
  'use strict';

  try {
    if (localStorage.getItem('dp-theme') === 'light') {
      document.documentElement.dataset.theme = 'light';
    }
  } catch (e) {}

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
