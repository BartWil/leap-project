(() => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const COORDINATOR_PASSWORD_HASH = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4';
  const VERSION = '20260802-2';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }

  if (sessionStorage.getItem(COORDINATOR_SESSION_KEY) === 'true') {
    location.replace(`portal-coordinator.html?v=${VERSION}`);
    return;
  }

  const form = document.getElementById('coordinatorLoginForm');
  const password = document.getElementById('coordinatorPassword');
  const toggle = document.getElementById('coordinatorPasswordToggle');
  const submit = document.getElementById('coordinatorLoginButton');
  const status = document.getElementById('coordinatorLoginStatus');

  async function hashPassword(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

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
      if (await hashPassword(password.value) === COORDINATOR_PASSWORD_HASH) {
        sessionStorage.setItem(COORDINATOR_SESSION_KEY, 'true');
        location.replace(`portal-coordinator.html?v=${VERSION}`);
      } else {
        status.textContent = 'Nieprawidłowe hasło. Spróbuj ponownie.';
        password.value = '';
        password.focus();
      }
    } catch {
      status.textContent = 'Nie udało się sprawdzić hasła. Odśwież stronę.';
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
