(async () => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const VERSION = '20260813-3';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }
  if (sessionStorage.getItem(COORDINATOR_SESSION_KEY) !== 'true' || !window.LEAP_PORTAL_STORE.hasCoordinatorToken()) {
    location.replace(`portal-coordinator-login.html?v=${VERSION}`);
    return;
  }

  const store = window.LEAP_PORTAL_STORE;
  const syncStatus = document.getElementById('coordinatorSyncStatus');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  let data;
  let control;
  let dayFilter = 'all';
  let activityFilter = 'changes';

  try {
    [data, control] = await Promise.all([store.load({ force: true }), store.getControlCenterData()]);
  } catch (error) {
    syncStatus.textContent = error.message || 'Nie udało się pobrać Centrum kontroli.';
    syncStatus.classList.add('sync-warning');
    if (error.code === 'unauthorized') {
      sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
      setTimeout(() => location.replace(`portal-coordinator-login.html?v=${VERSION}`), 1800);
    }
    document.documentElement.classList.remove('auth-pending');
    return;
  }

  const personName = id => data.team.find(person => person.id === id)?.name || id || 'Nieprzypisano';
  const typeLabel = value => value === 'Mixed' ? 'Blok mieszany' : value === 'LASER' ? 'Laser/sham' : value;
  const localDateKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  };
  const today = localDateKey();
  const formatDate = value => new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
  const formatMoment = value => value ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'brak danych';
  const daysUntil = value => Math.round((new Date(`${value}T12:00:00`) - new Date(`${today}T12:00:00`)) / 86400000);
  const attendanceFor = block => control.attendanceByBlock?.[block.id] || { counts: { yes: 0, no: 0, pending: (block.invitedMemberIds || []).length }, items: [] };
  const editDayUrl = blockId => `portal-coordinator-edit.html?v=${VERSION}&view=days&block=${encodeURIComponent(blockId)}`;

  function renderSyncStatus() {
    const status = store.getStatus();
    const updated = control.updatedAt ? formatMoment(control.updatedAt) : '';
    syncStatus.textContent = status.online
      ? `Wspólne dane aktualne${updated ? ` · ostatnia zmiana ${updated}` : ''}`
      : `Brak połączenia · wyświetlam: ${status.source}`;
    syncStatus.classList.toggle('sync-warning', !status.online);
  }

  const upcoming = data.blocks
    .filter(block => block.date >= today && block.status !== 'Cancelled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  function buildAlerts() {
    const alerts = [];
    upcoming.forEach(block => {
      const distance = daysUntil(block.date);
      const attendance = attendanceFor(block).counts;
      const invited = block.invitedMemberIds || [];
      const blockActivity = (control.activity || []).filter(item => item.blockId === block.id);
      const latestChange = blockActivity.find(item => ['day-created', 'day-updated', 'day-restored'].includes(item.event));
      const latestMail = blockActivity.find(item => item.event === 'email-sent');
      if (latestChange && (!latestMail || new Date(latestMail.createdAt) < new Date(latestChange.createdAt))) {
        alerts.push({ priority: 0, tone: 'danger', title: `${formatDate(block.date)} · zmiana bez potwierdzonej wysyłki`, text: 'Termin lub obsada zostały zapisane później niż ostatni e-mail. Sprawdź i przygotuj wiadomość do zespołu.', blockId: block.id });
      }
      if (distance <= 21 && invited.length <= 1) {
        alerts.push({ priority: 0, tone: 'danger', title: `${formatDate(block.date)} · ${typeLabel(block.type)} — obsada do uzupełnienia`, text: 'Zaproszona jest tylko osoba prowadząca. Sprawdź skład zespołu.', blockId: block.id });
      }
      if (distance <= 14 && attendance.no > 0) {
        alerts.push({ priority: 1, tone: 'danger', title: `${attendance.no} ${attendance.no === 1 ? 'osoba nie może przybyć' : 'osoby nie mogą przybyć'}`, text: `${formatDate(block.date)} · ${typeLabel(block.type)}. Sprawdź, czy obsada nadal wystarcza.`, blockId: block.id });
      }
      if (distance <= 7 && attendance.pending > 0) {
        alerts.push({ priority: 2, tone: 'warning', title: `${attendance.pending} ${attendance.pending === 1 ? 'osoba bez odpowiedzi' : 'osób bez odpowiedzi'}`, text: `${formatDate(block.date)} · ${typeLabel(block.type)}. Warto przygotować przypomnienie.`, blockId: block.id });
      }
    });
    return alerts.sort((a, b) => a.priority - b.priority || a.title.localeCompare(b.title));
  }

  const alerts = buildAlerts();
  const totalPending = upcoming.reduce((sum, block) => sum + Number(attendanceFor(block).counts.pending || 0), 0);
  const activeAccesses = (control.accesses || []).filter(item => item.active).length;
  document.getElementById('summaryUpcoming').textContent = upcoming.length;
  document.getElementById('summaryAttention').textContent = alerts.length;
  document.getElementById('summaryPending').textContent = totalPending;
  document.getElementById('summaryAccess').textContent = activeAccesses;
  document.getElementById('attentionCount').textContent = alerts.length ? `${alerts.length} spraw` : 'bez działania';
  document.getElementById('controlAttention').innerHTML = alerts.length
    ? alerts.map(alert => `<article class="control-alert is-${esc(alert.tone)}"><div><strong>${esc(alert.title)}</strong><p>${esc(alert.text)}</p></div><a href="${esc(alert.blockId ? editDayUrl(alert.blockId) : alert.href)}">Sprawdź</a></article>`).join('')
    : '<div class="control-all-good"><strong>Bez działania</strong><p>Na ten moment nie wykryto spraw wymagających pilnej reakcji.</p></div>';

  function dayMatches(block) {
    if (dayFilter === 'all') return true;
    if (dayFilter === 'other') return !['T0', 'W12', 'LASER'].includes(block.type);
    return block.type === dayFilter;
  }

  function renderDays() {
    const visible = upcoming.filter(dayMatches);
    document.getElementById('controlDays').innerHTML = visible.length
      ? visible.map(block => {
        const counts = attendanceFor(block).counts;
        const distance = daysUntil(block.date);
        const timeLabel = distance === 0 ? 'dzisiaj' : distance === 1 ? 'jutro' : `za ${distance} dni`;
        return `<article class="control-day"><div class="control-day-date"><strong>${esc(formatDate(block.date))}</strong><span>${esc(timeLabel)}</span></div><div class="control-day-main"><strong>${esc(typeLabel(block.type))} · ${esc(block.startTime)}–${esc(block.endTime)}</strong><p>${esc(block.location)} · prowadzi: ${esc(personName(block.clinicalLeadId))}</p><small>Zaproszono ${(block.invitedMemberIds || []).length} osób</small></div><div class="control-rsvp"><span class="yes"><b>${counts.yes}</b> TAK</span><span class="no"><b>${counts.no}</b> NIE</span><span class="pending"><b>${counts.pending}</b> brak</span></div><a class="control-open" href="${esc(editDayUrl(block.id))}">Otwórz</a></article>`;
      }).join('')
      : '<div class="control-empty">Brak najbliższych terminów w tym filtrze.</div>';
  }

  function renderActivity() {
    const list = document.getElementById('controlActivity');
    if (activityFilter === 'mail') {
      const mail = (control.mail || []).filter(item => !item.isTest).slice(0, 15);
      list.innerHTML = mail.length
        ? mail.map(item => `<li><time>${esc(formatMoment(item.sentAt))}</time><div><strong>${esc(item.subject)}</strong><p>Wysłano do ${item.recipientCount} ${item.recipientCount === 1 ? 'osoby' : 'osób'}.</p></div></li>`).join('')
        : '<li class="control-empty">Brak zarejestrowanych wysyłek.</li>';
      return;
    }
    const activity = (control.activity || []).slice(0, 15);
    list.innerHTML = activity.length
      ? activity.map(item => `<li><time>${esc(formatMoment(item.createdAt))}</time><div><strong>${esc(item.summary)}</strong><p>${esc(item.actorName || personName(item.actorId))}${item.details ? ` · ${esc(item.details)}` : ''}</p></div>${item.blockId ? `<a href="${esc(editDayUrl(item.blockId))}">Otwórz</a>` : ''}</li>`).join('')
      : '<li class="control-empty">Historia zmian zacznie się pojawiać po pierwszej zmianie wykonanej w nowej wersji.</li>';
  }

  function renderAccess() {
    const accesses = control.accesses || [];
    document.getElementById('controlAccess').innerHTML = accesses.length
      ? accesses.map(item => `<article class="control-access"><div><strong>${esc(item.name)}</strong><p>${esc(item.scopeLabel)}</p></div><span class="access-state${item.active ? ' is-active' : ''}">${item.active ? 'Aktywny' : 'Nieaktywny'}</span><small>Ostatnie użycie:<br><b>${esc(item.lastUsedAt ? formatMoment(item.lastUsedAt) : 'jeszcze nie użyto')}</b></small><a class="control-preview" href="portal-lead.html?v=20260813-4&amp;preview=${encodeURIComponent(item.memberId)}">Podgląd panelu →</a></article>`).join('')
      : '<div class="control-empty">Brak skonfigurowanych dostępów prowadzących.</div>';
  }

  document.getElementById('controlDayFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-day-filter]');
    if (!button) return;
    dayFilter = button.dataset.dayFilter;
    document.querySelectorAll('[data-day-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderDays();
  });
  document.getElementById('activityFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-activity-filter]');
    if (!button) return;
    activityFilter = button.dataset.activityFilter;
    document.querySelectorAll('[data-activity-filter]').forEach(item => item.classList.toggle('active', item === button));
    renderActivity();
  });
  document.getElementById('coordinatorRefresh').addEventListener('click', () => location.reload());
  document.getElementById('coordinatorLock').addEventListener('click', () => {
    sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
    store.clearCoordinatorToken();
    location.replace(`portal-start.html?v=${VERSION}`);
  });
  window.addEventListener('storage', event => { if (event.key === store.storageKey) location.reload(); });
  store.watch(() => location.reload());

  renderDays();
  renderActivity();
  renderAccess();
  renderSyncStatus();
  document.documentElement.classList.remove('auth-pending');
})();
