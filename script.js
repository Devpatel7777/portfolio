(() => {
  'use strict';

  const menuToggle = document.getElementById('menuToggle');
  const primaryNav = document.getElementById('primaryNav');
  const copyEmail = document.getElementById('copyEmail');
  const copyPhone = document.getElementById('copyPhone');
  const callBtn = document.getElementById('callBtn');
  const copyStatus = document.getElementById('copyStatus');
  const emailAddress = 'devpatel846211@gmail.com';
  const phoneNumber = '+91 93289 77322';

  function closeMenu() {
    primaryNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }

  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
    primaryNav.classList.toggle('is-open', !isOpen);
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (primaryNav.classList.contains('is-open') &&
        !primaryNav.contains(event.target) &&
        !menuToggle.contains(event.target)) {
      closeMenu();
    }
  });

  async function copyText(text, successMsg, fallbackMsg) {
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(text);
      copyStatus.textContent = successMsg;
    } catch (_error) {
      copyStatus.textContent = fallbackMsg;
    }
  }

  if (copyEmail) {
    copyEmail.addEventListener('click', () => {
      copyText(emailAddress, 'Email address copied.', 'devpatel846211@gmail.com');
    });
  }

  if (copyPhone) {
    copyPhone.addEventListener('click', () => {
      copyText(phoneNumber, 'Phone number copied: +91 93289 77322', 'Phone: +91 93289 77322');
    });
  }

  if (callBtn) {
    callBtn.addEventListener('click', () => {
      copyText(phoneNumber, 'Phone number copied (+91 93289 77322). Opening dialer...', 'Phone: +91 93289 77322');
    });
  }

  const year = document.getElementById('currentYear');
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }
})();
