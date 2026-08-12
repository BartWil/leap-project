(async () => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const VERSION = '20260812-2';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }

  if (sessionStorage.getItem(COORDINATOR_SESSION_KEY) === 'true' && window.LEAP_PORTAL_STORE.hasCoordinatorToken()) {
    location.replace(`portal-coordinator.html?v=${VERSION}`);
    return;
  }
  sessionStorage.removeItem(COORDINATOR_SESSION_KEY);

  const form = document.getElementById('coordinatorLoginForm');
  const password = document.getElementById('coordinatorPassword');
  const toggle = document.getElementById('coordinatorPasswordToggle');
  const submit = document.getElementById('coordinatorLoginButton');
  const status = document.getElementById('coordinatorLoginStatus');

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!password.value) {
      status.textContent = 'Wpisz hasło.';
      password.focus();
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Sprawdzanie…';
    status.textContent = '';
    try {
      await window.LEAP_PORTAL_STORE.authenticateCoordinator(password.value);
      submit.textContent = 'Łączenie danych…';
      await window.LEAP_PORTAL_STORE.initializeSharedState();
      sessionStorage.setItem(COORDINATOR_SESSION_KEY, 'true');
      location.replace(`portal-coordinator.html?v=${VERSION}`);
    } catch (error) {
      status.textContent = error?.message || 'Nie udało się sprawdzić hasła. Odśwież stronę.';
      if (error?.code === 'invalid_credentials') {
        password.value = '';
        password.focus();
      }
    } finally {
      submit.disabled = false;
      submit.textContent = 'Wejdź do panelu';
    }
  });

  toggle.addEventListener('click', () => {
    const reveal = password.type === 'password';
    password.type = reveal ? 'text' : 'password';
    toggle.textContent = reveal ? 'Ukryj' : 'Pokaż';
    toggle.setAttribute('aria-label', reveal ? 'Ukryj hasło' : 'Pokaż hasło');
  });

  document.documentElement.classList.remove('auth-pending');
  password.focus();
})();
