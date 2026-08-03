(() => {
  'use strict';

  const CACHE_KEY = 'leap-portal-shared-cache-v2';
  const LEGACY_KEY = 'leap-portal-coordinator-changes-v1';
  const COORDINATOR_TOKEN_KEY = 'leap-coordinator-sync-token';
  const base = window.LEAP_DEMO_DATA;
  const clone = value => JSON.parse(JSON.stringify(value));
  let currentState = null;
  let currentStatus = {
    online: false,
    initialized: false,
    source: 'dane początkowe',
    revision: 0,
    updatedAt: ''
  };

  function syncConfig() {
    return window.LEAP_SYNC_CONFIG || {};
  }

  function endpoint() {
    return String(syncConfig().endpoint || '').trim();
  }

  function isConfigured() {
    return /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(endpoint());
  }

  function normalizeBlock(block) {
    if (Array.isArray(block.invitedMemberIds)) return block;
    const invitedMemberIds = [...new Set([
      block.clinicalLeadId,
      ...(block.stationAssignments || []).flatMap(item => [item.memberId, item.backupMemberId])
    ].filter(Boolean))];
    return { ...block, invitedMemberIds };
  }

  function baseData() {
    if (!base) throw new Error('Brakuje danych początkowych portalu.');
    const data = clone(base);
    data.coordinatorMessages = [];
    data.notificationOutbox = [];
    return data;
  }

  function applyPayload(payload) {
    const data = baseData();
    if (!payload) return data;
    if (Array.isArray(payload.blocks)) data.blocks = clone(payload.blocks).map(normalizeBlock);
    if (Array.isArray(payload.tasks)) data.tasks = clone(payload.tasks);
    if (Array.isArray(payload.messages)) data.coordinatorMessages = clone(payload.messages);
    if (Array.isArray(payload.notificationOutbox)) data.notificationOutbox = clone(payload.notificationOutbox);
    if (Array.isArray(payload.teamOverrides)) {
      const overrides = new Map(payload.teamOverrides.map(item => [item.id, item]));
      data.team = data.team.map(person => ({ ...person, ...(overrides.get(person.id) || {}) }));
    }
    return data;
  }

  function payloadFromData(data) {
    return {
      blocks: clone(data.blocks || []),
      tasks: clone(data.tasks || []),
      messages: clone(data.coordinatorMessages || []),
      notificationOutbox: clone(data.notificationOutbox || []),
      teamOverrides: (data.team || []).map(person => ({
        id: person.id,
        notesPublic: person.notesPublic,
        responsibilities: clone(person.responsibilities || [])
      }))
    };
  }

  function readLegacyPayload() {
    try {
      const stored = JSON.parse(localStorage.getItem(LEGACY_KEY));
      if (stored?.schemaVersion !== 1) return null;
      return {
        blocks: Array.isArray(stored.blocks) ? clone(stored.blocks).map(normalizeBlock) : clone(base.blocks),
        tasks: Array.isArray(stored.tasks) ? clone(stored.tasks) : clone(base.tasks),
        messages: Array.isArray(stored.messages) ? clone(stored.messages) : [],
        notificationOutbox: Array.isArray(stored.notificationOutbox) ? clone(stored.notificationOutbox) : [],
        teamOverrides: Array.isArray(stored.teamOverrides) ? clone(stored.teamOverrides) : []
      };
    } catch {
      return null;
    }
  }

  function readCache() {
    try {
      const stored = JSON.parse(localStorage.getItem(CACHE_KEY));
      return stored?.schemaVersion === 2 && stored?.state?.initialized ? stored.state : null;
    } catch {
      return null;
    }
  }

  function writeCache(state) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      schemaVersion: 2,
      cachedAt: new Date().toISOString(),
      state
    }));
  }

  function requestId() {
    const values = new Uint32Array(4);
    crypto.getRandomValues(values);
    return `leap-${Date.now()}-${Array.from(values, value => value.toString(16).padStart(8, '0')).join('')}`;
  }

  function jsonp(action, parameters = {}) {
    if (!isConfigured()) return Promise.reject(new Error('Synchronizacja nie została jeszcze podłączona.'));
    const callbackName = `_leapSync${Date.now()}${Math.random().toString(36).slice(2)}`;
    const url = new URL(endpoint());
    url.searchParams.set('action', action);
    url.searchParams.set('prefix', callbackName);
    url.searchParams.set('_', String(Date.now()));
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timeout = setTimeout(() => finish(() => reject(new Error('Przekroczono czas oczekiwania na synchronizację.'))), Number(syncConfig().requestTimeoutMs || 15000));

      function finish(callback) {
        clearTimeout(timeout);
        script.remove();
        try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
        callback();
      }

      window[callbackName] = result => finish(() => resolve(result));
      script.onerror = () => finish(() => reject(new Error('Nie udało się połączyć ze wspólnymi danymi.')));
      script.src = url.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }

  async function post(request) {
    if (!isConfigured()) throw new Error('Synchronizacja nie została jeszcze podłączona.');
    await fetch(endpoint(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(request)
    });
  }

  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  async function waitForStatus(action, id) {
    const timeoutAt = Date.now() + Number(syncConfig().requestTimeoutMs || 15000);
    while (Date.now() < timeoutAt) {
      const result = await jsonp(action, { requestId: id });
      if (!result?.pending) return result;
      await wait(400);
    }
    throw new Error('Nie otrzymano potwierdzenia zapisu. Spróbuj ponownie.');
  }

  async function fetchRemoteState() {
    const result = await jsonp('state');
    if (!result?.ok || !result.state) throw new Error('Wspólne dane zwróciły nieprawidłową odpowiedź.');
    return result.state;
  }

  function rememberState(state, source = 'Google Drive') {
    currentState = clone(state);
    currentStatus = {
      online: true,
      initialized: Boolean(state.initialized),
      source,
      revision: Number(state.revision || 0),
      updatedAt: String(state.updatedAt || '')
    };
    if (state.initialized) {
      writeCache(state);
      localStorage.removeItem(LEGACY_KEY);
    }
  }

  async function load(options = {}) {
    if (!options.force && currentState?.initialized) return applyPayload(currentState.payload);

    if (isConfigured()) {
      try {
        const remote = await fetchRemoteState();
        rememberState(remote);
        return applyPayload(remote.initialized ? remote.payload : null);
      } catch (error) {
        const cached = readCache();
        if (cached) {
          currentState = cached;
          currentStatus = {
            online: false,
            initialized: true,
            source: 'ostatnia zsynchronizowana kopia',
            revision: Number(cached.revision || 0),
            updatedAt: String(cached.updatedAt || '')
          };
          return applyPayload(cached.payload);
        }
        currentStatus = { online: false, initialized: false, source: 'dane początkowe', revision: 0, updatedAt: '' };
        return baseData();
      }
    }

    currentStatus = { online: false, initialized: false, source: 'dane początkowe', revision: 0, updatedAt: '' };
    return baseData();
  }

  async function authenticateCoordinator(password) {
    const id = requestId();
    await post({ action: 'authenticate', requestId: id, password: String(password || '') });
    const result = await waitForStatus('auth-status', id);
    if (!result?.ok || !result.token) {
      const error = new Error(result?.error === 'invalid_credentials' ? 'Nieprawidłowe hasło.' : 'Nie udało się zalogować.');
      error.code = result?.error || 'authentication_failed';
      throw error;
    }
    sessionStorage.setItem(COORDINATOR_TOKEN_KEY, result.token);
    return result;
  }

  function coordinatorToken() {
    return sessionStorage.getItem(COORDINATOR_TOKEN_KEY) || '';
  }

  function hasCoordinatorToken() {
    return Boolean(coordinatorToken());
  }

  function clearCoordinatorToken() {
    sessionStorage.removeItem(COORDINATOR_TOKEN_KEY);
  }

  async function save(data) {
    const token = coordinatorToken();
    if (!token) {
      const error = new Error('Sesja koordynatora wygasła. Zaloguj się ponownie.');
      error.code = 'unauthorized';
      throw error;
    }

    if (!currentState) currentState = await fetchRemoteState();
    const id = requestId();
    const payload = payloadFromData(data);
    await post({
      action: 'save',
      requestId: id,
      token,
      expectedRevision: Number(currentState.revision || 0),
      payload
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      if (result?.error === 'revision_conflict') {
        const latest = await fetchRemoteState();
        rememberState(latest);
      }
      const messages = {
        unauthorized: 'Sesja koordynatora wygasła. Zaloguj się ponownie.',
        revision_conflict: 'Ktoś zapisał nowszą zmianę. Odśwież panel i spróbuj ponownie.',
        invalid_payload: 'Zmiana zawiera niedozwolone lub nieprawidłowe dane.',
        payload_too_large: 'Zakres zmian jest zbyt duży dla jednego zapisu.'
      };
      const error = new Error(messages[result?.error] || 'Nie udało się zapisać zmiany.');
      error.code = result?.error || 'save_failed';
      throw error;
    }

    const confirmed = {
      schemaVersion: 2,
      initialized: true,
      revision: Number(result.revision),
      updatedAt: String(result.updatedAt || new Date().toISOString()),
      updatedBy: 'koordynator',
      lastRequestId: id,
      payload
    };
    rememberState(confirmed);
    window.dispatchEvent(new CustomEvent('leap-data-updated', { detail: confirmed.updatedAt }));
    return clone(confirmed);
  }

  async function initializeSharedState() {
    const remote = await fetchRemoteState();
    rememberState(remote);
    if (remote.initialized) return { initialized: false, state: remote };

    const legacyPayload = readLegacyPayload();
    const data = applyPayload(legacyPayload);
    const state = await save(data);
    return { initialized: true, migratedLegacy: Boolean(legacyPayload), state };
  }

  function watch(onChange) {
    if (!isConfigured()) return () => {};
    let stopped = false;
    let running = false;
    const interval = setInterval(async () => {
      if (stopped || running) return;
      running = true;
      try {
        const remote = await fetchRemoteState();
        if (remote.initialized && Number(remote.revision || 0) !== Number(currentState?.revision || 0)) {
          rememberState(remote);
          onChange(clone(remote));
        } else {
          currentStatus.online = true;
        }
      } catch {
        currentStatus.online = false;
      } finally {
        running = false;
      }
    }, Number(syncConfig().pollIntervalMs || 30000));
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }

  function getStatus() {
    return clone(currentStatus);
  }

  window.LEAP_PORTAL_STORE = {
    load,
    save,
    watch,
    getStatus,
    isConfigured,
    authenticateCoordinator,
    initializeSharedState,
    hasCoordinatorToken,
    clearCoordinatorToken,
    storageKey: CACHE_KEY
  };
})();
