(() => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace('portal.html?v=20260802-2');
    return;
  }

  document.documentElement.classList.remove('auth-pending');
  document.getElementById('startLogout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
    location.replace('portal.html?v=20260802-2');
  });
})();
