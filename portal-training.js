(() => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const VERSION = '20260802-3';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }

  document.querySelector('[data-training-logout]')?.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('leap-coordinator-authenticated');
    location.replace(`portal.html?v=${VERSION}`);
  });

  document.querySelectorAll('.test-procedure').forEach(item => {
    item.addEventListener('toggle', () => {
      const label = item.querySelector('.details-toggle');
      if (label && !item.classList.contains('test-pending')) label.textContent = item.open ? 'Zwiń' : 'Rozwiń';
    });
  });

  document.documentElement.classList.remove('auth-pending');
})();
