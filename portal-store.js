(() => {
  'use strict';

  const CACHE_KEY = 'leap-portal-shared-cache-v2';
  const LEGACY_KEY = 'leap-portal-coordinator-changes-v1';
  const COORDINATOR_TOKEN_KEY = 'leap-coordinator-sync-token';
  const CONTROL_CENTER_CACHE_KEY = 'leap-control-center-cache-v1';
  const CONTROL_CENTER_CACHE_TTL_MS = 120000;
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

  function readControlCenterCache() {
    try {
      const cached = JSON.parse(sessionStorage.getItem(CONTROL_CENTER_CACHE_KEY));
      const token = coordinatorToken();
      if (!cached?.bundle?.ok || !token || cached.tokenSuffix !== token.slice(-12)) return null;
      if (Date.now() - Number(cached.cachedAt || 0) > CONTROL_CENTER_CACHE_TTL_MS) return null;
      if (cached.bundle.state?.initialized) rememberState(cached.bundle.state, 'Google Drive · przygotowane podczas logowania');
      return clone(cached.bundle);
    } catch {
      return null;
    }
  }

  function rememberControlCenterData(bundle) {
    try {
      sessionStorage.setItem(CONTROL_CENTER_CACHE_KEY, JSON.stringify({
        cachedAt: Date.now(),
        tokenSuffix: coordinatorToken().slice(-12),
        bundle
      }));
    } catch {}
  }

  function clearControlCenterCache() {
    try { sessionStorage.removeItem(CONTROL_CENTER_CACHE_KEY); } catch {}
  }

  function requestId() {
    const values = new Uint32Array(4);
    crypto.getRandomValues(values);
    return `leap-${Date.now()}-${Array.from(values, value => value.toString(16).padStart(8, '0')).join('')}`;
  }

  async function fetchJson(action, parameters = {}) {
    const url = new URL(endpoint());
    url.searchParams.set('action', action);
    url.searchParams.set('_', String(Date.now()));
    Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = setTimeout(() => controller?.abort(), Number(syncConfig().requestTimeoutMs || 15000));
    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        signal: controller?.signal
      });
      if (!response.ok) throw new Error(`Błąd połączenia: ${response.status}`);
      return await response.json();
    } catch (error) {
      throw new Error('Nie udało się połączyć ze wspólnymi danymi. Otwórz link w Chrome, Safari lub Edge i spróbuj ponownie.');
    } finally {
      clearTimeout(timeout);
    }
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
      const retryWithFetch = () => fetchJson(action, parameters).then(resolve, reject);
      const timeout = setTimeout(() => finish(retryWithFetch), Number(syncConfig().requestTimeoutMs || 15000));

      function finish(callback) {
        clearTimeout(timeout);
        script.remove();
        try { delete window[callbackName]; } catch { window[callbackName] = undefined; }
        callback();
      }

      window[callbackName] = result => finish(() => resolve(result));
      script.onerror = () => finish(retryWithFetch);
      script.src = url.toString();
      script.async = true;
      document.head.appendChild(script);
    });
  }

  async function post(request) {
    if (!isConfigured()) throw new Error('Synchronizacja nie została jeszcze podłączona.');
    const transport = fetch(endpoint(), {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(request)
    });
    const acknowledgement = await Promise.race([
      transport.then(() => ({ completed: true, error: null }), error => ({ completed: true, error })),
      new Promise(resolve => setTimeout(() => resolve({ completed: false, error: null }), 2500))
    ]);
    if (acknowledgement.error) {
      throw new Error('Nie udało się wysłać żądania do Google. Sprawdź połączenie i spróbuj ponownie.');
    }
    if (!acknowledgement.completed) transport.catch(() => {});
  }

  const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

  async function waitForStatus(action, id) {
    const timeoutAt = Date.now() + Number(syncConfig().operationTimeoutMs || 90000);
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
    clearControlCenterCache();
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
    clearControlCenterCache();
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
    clearControlCenterCache();
    window.dispatchEvent(new CustomEvent('leap-data-updated', { detail: confirmed.updatedAt }));
    return clone(confirmed);
  }

  async function sendEmail(draft) {
    const token = coordinatorToken();
    if (!token) {
      const error = new Error('Sesja koordynatora wygasła. Zaloguj się ponownie.');
      error.code = 'unauthorized';
      throw error;
    }

    const id = requestId();
    await post({
      action: 'send-email',
      requestId: id,
      token,
      clientMessageId: String(draft.clientMessageId || ''),
      recipientIds: Array.isArray(draft.recipientIds) ? draft.recipientIds : [],
      subject: String(draft.subject || ''),
      body: String(draft.body || ''),
      category: String(draft.category || 'general'),
      rsvpBlockId: String(draft.rsvpBlockId || ''),
      isTest: draft.isTest === true
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      const messages = {
        unauthorized: 'Sesja koordynatora wygasła. Zaloguj się ponownie.',
        invalid_email_draft: 'Uzupełnij odbiorców, temat i treść wiadomości.',
        missing_contacts: 'Nie wszystkie wybrane osoby mają zapisany adres e-mail.',
        mail_quota_exceeded: 'Dzisiejszy limit wysyłki Google został wyczerpany.',
        invalid_rsvp_request: 'Nie udało się utworzyć bezpiecznych linków potwierdzenia.',
        invalid_lead_access_request: 'Dostęp może zostać wysłany wyłącznie aktualnej osobie prowadzącej ten dzień.',
        rsvp_block_not_found: 'Nie znaleziono aktualnego dnia badawczego dla tej wiadomości.',
        mail_send_failed: 'Google nie potwierdził wysyłki. Najpierw sprawdź skrzynkę projektu i nie klikaj ponownie, aby uniknąć duplikatu.'
      };
      const error = new Error(messages[result?.error] || 'Nie udało się wysłać wiadomości.');
      error.code = result?.error || 'mail_send_failed';
      error.missingRecipientIds = Array.isArray(result?.missingRecipientIds) ? result.missingRecipientIds : [];
      throw error;
    }
    clearControlCenterCache();
    return result;
  }

  async function getAttendanceStatus(blockId) {
    const token = coordinatorToken();
    if (!token) {
      const error = new Error('Sesja koordynatora wygasła. Zaloguj się ponownie.');
      error.code = 'unauthorized';
      throw error;
    }
    const result = await jsonp('attendance-status', { token, blockId: String(blockId || '') });
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      const error = new Error(result?.error === 'rsvp_block_not_found'
        ? 'Nie znaleziono tego dnia badawczego.'
        : 'Nie udało się pobrać potwierdzeń obecności.');
      error.code = result?.error || 'attendance_failed';
      throw error;
    }
    return result;
  }

  async function getDelegateData(token) {
    const result = await jsonp('delegate-data', { token: String(token || '') });
    if (!result?.ok) throw delegateError(result?.error);
    return result;
  }

  async function getCoordinatorDelegateData(memberId) {
    const token = coordinatorToken();
    if (!token) throw delegateError('unauthorized');
    const result = await jsonp('coordinator-delegate-data', { token, memberId: String(memberId || '') });
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      throw delegateError(result?.error);
    }
    return result;
  }

  async function getDelegateAttendance(token, blockId) {
    const result = await jsonp('delegate-attendance', { token: String(token || ''), blockId: String(blockId || '') });
    if (!result?.ok) throw delegateError(result?.error);
    return result;
  }

  async function saveDelegateDay(token, block, expectedRevision) {
    const id = requestId();
    await post({
      action: 'delegate-save-day',
      requestId: id,
      token: String(token || ''),
      expectedRevision: Number(expectedRevision || 0),
      block
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) throw delegateError(result?.error);
    clearControlCenterCache();
    return result;
  }

  async function saveDelegateSeries(token, series, expectedRevision) {
    const id = requestId();
    await post({
      action: 'delegate-save-series',
      requestId: id,
      token: String(token || ''),
      expectedRevision: Number(expectedRevision || 0),
      series
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) throw delegateError(result?.error);
    clearControlCenterCache();
    return result;
  }

  async function sendDelegateEmail(token, draft) {
    const id = requestId();
    await post({
      action: 'delegate-send-email',
      requestId: id,
      token: String(token || ''),
      clientMessageId: String(draft.clientMessageId || ''),
      blockId: String(draft.blockId || ''),
      recipientIds: Array.isArray(draft.recipientIds) ? draft.recipientIds : [],
      subject: String(draft.subject || ''),
      body: String(draft.body || ''),
      category: String(draft.category || '')
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) throw delegateError(result?.error, result);
    clearControlCenterCache();
    return result;
  }

  async function sendDelegateSeriesEmail(token, draft) {
    const id = requestId();
    await post({
      action: 'delegate-send-series-email',
      requestId: id,
      token: String(token || ''),
      clientMessageId: String(draft.clientMessageId || ''),
      seriesId: String(draft.seriesId || ''),
      recipientIds: Array.isArray(draft.recipientIds) ? draft.recipientIds : [],
      subject: String(draft.subject || ''),
      body: String(draft.body || ''),
      category: String(draft.category || '')
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) throw delegateError(result?.error, result);
    clearControlCenterCache();
    return result;
  }

  async function sendCoordinatorSeriesTestEmail(draft) {
    const token = coordinatorToken();
    if (!token) throw delegateError('unauthorized');
    const id = requestId();
    await post({
      action: 'coordinator-send-series-test-email',
      requestId: id,
      token,
      clientMessageId: String(draft.clientMessageId || ''),
      startDate: String(draft.startDate || ''),
      startTime: String(draft.startTime || ''),
      endTime: String(draft.endTime || ''),
      location: String(draft.location || ''),
      participantIds: Array.isArray(draft.participantIds) ? draft.participantIds : [],
      subject: String(draft.subject || ''),
      body: String(draft.body || ''),
      category: String(draft.category || '')
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) throw delegateError(result?.error, result);
    clearControlCenterCache();
    return result;
  }

  function delegateError(code, details = {}) {
    const messages = {
      invalid_delegate_access: 'Ten link dostępu jest nieprawidłowy.',
      delegate_access_expired: 'Ten dostęp został wyłączony lub zastąpiony nowym linkiem.',
      forbidden_scope: 'Nie masz uprawnień do zmiany tego rodzaju dnia.',
      revision_conflict: 'Ktoś zapisał nowszą zmianę. Odśwież panel i spróbuj ponownie.',
      invalid_weekday: 'W12 musi przypadać w czwartek albo piątek. Zabieg laser/sham może odbyć się od poniedziałku do soboty.',
      invalid_participant_codes: 'Wpisz wyłącznie pseudonimizowane kody uczestników, np. 092 lub LEAP-092.',
      duplicate_series: 'Ta seria została już zapisana. Odśwież panel.',
      invalid_delegate_day: 'Sprawdź datę, godziny, miejsce, prowadzącego i zaproszony zespół.',
      invalid_email_draft: 'Sprawdź odbiorców, temat i treść wiadomości.',
      invalid_series: 'Nie znaleziono pełnej serii laser/sham. Odśwież panel i spróbuj ponownie.',
      invalid_series_test: 'Sprawdź datę, godziny, miejsce i pseudonimizowane kody w teście serii.',
      invalid_reminder_recipients: 'Przypomnienie może trafić wyłącznie do osób bez odpowiedzi.',
      missing_contacts: 'Nie wszystkie wybrane osoby mają aktywny adres e-mail.',
      mail_quota_exceeded: 'Dzisiejszy limit wysyłki Google został wyczerpany.',
      mail_send_failed: 'Google nie potwierdził wysyłki. Sprawdź skrzynkę projektu przed ponowną próbą.',
      rsvp_block_not_found: 'Nie znaleziono tego dnia badawczego.',
      state_not_initialized: 'Wspólne dane portalu nie są jeszcze gotowe.'
    };
    const error = new Error(messages[code] || 'Nie udało się wykonać tej operacji.');
    error.code = code || 'delegate_operation_failed';
    error.missingRecipientIds = Array.isArray(details?.missingRecipientIds) ? details.missingRecipientIds : [];
    return error;
  }

  async function getDelegateAccessList() {
    const token = coordinatorToken();
    if (!token) throw delegateError('unauthorized');
    const result = await jsonp('delegate-access-list', { token });
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      const error = result?.error === 'unauthorized'
        ? new Error('Sesja koordynatora wygasła. Zaloguj się ponownie.')
        : delegateError(result?.error);
      error.code = result?.error || 'delegate_access_list_failed';
      throw error;
    }
    return result;
  }

  async function getControlCenterData(options = {}) {
    const token = coordinatorToken();
    if (!token) {
      const error = new Error('Sesja koordynatora wygasła. Zaloguj się ponownie.');
      error.code = 'unauthorized';
      throw error;
    }
    if (options.preferCache) {
      const cached = readControlCenterCache();
      if (cached) return cached;
    }
    const result = await jsonp('control-center-data', { token });
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      const messages = {
        unauthorized: 'Sesja koordynatora wygasła. Zaloguj się ponownie.',
        state_not_initialized: 'Wspólne dane portalu nie są jeszcze gotowe.'
      };
      const error = new Error(messages[result?.error] || 'Nie udało się pobrać Centrum kontroli.');
      error.code = result?.error || 'control_center_failed';
      throw error;
    }
    if (!result.state?.initialized || !result.state?.payload) {
      const error = new Error('Wspólne dane portalu nie są jeszcze gotowe.');
      error.code = 'state_not_initialized';
      throw error;
    }
    rememberState(result.state);
    const bundle = { ...result, data: applyPayload(result.state.payload) };
    rememberControlCenterData(bundle);
    return bundle;
  }

  async function changeDelegateAccess(action, memberId) {
    const token = coordinatorToken();
    if (!token) {
      const error = new Error('Sesja koordynatora wygasła. Zaloguj się ponownie.');
      error.code = 'unauthorized';
      throw error;
    }
    const id = requestId();
    await post({
      action,
      requestId: id,
      token,
      memberId: String(memberId || ''),
      clientMessageId: action === 'issue-delegate-access' ? requestId() : ''
    });
    const result = await waitForStatus('operation-status', id);
    if (!result?.ok) {
      if (result?.error === 'unauthorized') clearCoordinatorToken();
      const messages = {
        unauthorized: 'Sesja koordynatora wygasła. Zaloguj się ponownie.',
        invalid_delegate: 'Ta osoba nie ma skonfigurowanego zakresu prowadzącego.',
        mail_quota_exceeded: 'Dzisiejszy limit wysyłki Google został wyczerpany.',
        mail_send_failed: 'Nie udało się wysłać indywidualnego linku. Poprzedni dostęp pozostał bez zmian.'
      };
      const error = new Error(messages[result?.error] || 'Nie udało się zmienić dostępu.');
      error.code = result?.error || 'delegate_access_change_failed';
      throw error;
    }
    clearControlCenterCache();
    return result;
  }

  const issueDelegateAccess = memberId => changeDelegateAccess('issue-delegate-access', memberId);
  const revokeDelegateAccess = memberId => changeDelegateAccess('revoke-delegate-access', memberId);

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
    sendEmail,
    getAttendanceStatus,
    getDelegateData,
    getCoordinatorDelegateData,
    getDelegateAttendance,
    saveDelegateDay,
    saveDelegateSeries,
    sendDelegateEmail,
    sendDelegateSeriesEmail,
    sendCoordinatorSeriesTestEmail,
    getDelegateAccessList,
    getControlCenterData,
    issueDelegateAccess,
    revokeDelegateAccess,
    watch,
    getStatus,
    isConfigured,
    authenticateCoordinator,
    initializeSharedState,
    hasCoordinatorToken,
    clearCoordinatorToken,
    clearControlCenterCache,
    storageKey: CACHE_KEY
  };
})();
