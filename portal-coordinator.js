(async () => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const VERSION = '20260803-1';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }
  if (sessionStorage.getItem(COORDINATOR_SESSION_KEY) !== 'true' || !window.LEAP_PORTAL_STORE.hasCoordinatorToken()) {
    location.replace(`portal-coordinator-login.html?v=${VERSION}`);
    return;
  }

  const data = await window.LEAP_PORTAL_STORE.load();
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const personName = id => data.team.find(person => person.id === id)?.name || 'Nieprzypisano';
  const stationName = id => data.stations.find(station => station.id === id)?.name || id;
  const typeLabel = value => value === 'Mixed' ? 'Blok mieszany' : value;
  const formatDate = value => new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00`));
  const formatShortDate = value => new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));
  const syncStatus = document.getElementById('coordinatorSyncStatus');

  function renderSyncStatus() {
    const current = window.LEAP_PORTAL_STORE.getStatus();
    const updated = current.updatedAt
      ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(current.updatedAt))
      : '';
    syncStatus.textContent = current.online
      ? current.initialized
        ? `Wspólne dane aktualne${updated ? ` · ostatnia zmiana ${updated}` : ''}`
        : 'Wspólne dane oczekują na pierwszy zapis.'
      : `Brak połączenia · wyświetlam: ${current.source}`;
    syncStatus.classList.toggle('sync-warning', !current.online);
  }

  const today = new Date().toISOString().slice(0, 10);
  const sortedBlocks = [...data.blocks].sort((a, b) => a.date.localeCompare(b.date));
  const nextBlock = sortedBlocks.find(block => block.date >= today) || sortedBlocks[sortedBlocks.length - 1];
  const missingBackups = nextBlock.stationAssignments.filter(item => !item.backupMemberId);
  const invitedNames = (nextBlock.invitedMemberIds || []).map(personName);
  document.getElementById('coordinatorReadiness').textContent = `gotowość ${nextBlock.readinessScore}%`;
  document.getElementById('coordinatorNextDay').innerHTML = `<div class="item-row"><div><strong>${esc(formatDate(nextBlock.date))}, ${esc(nextBlock.startTime)}–${esc(nextBlock.endTime)}</strong><p>${esc(typeLabel(nextBlock.type))} · ${esc(nextBlock.location)}</p><p>Osoba prowadząca część kliniczną: <b>${esc(personName(nextBlock.clinicalLeadId))}</b></p><p>Zaproszony zespół: <b>${invitedNames.length ? invitedNames.map(esc).join(', ') : 'jeszcze nikt'}</b></p><p>${esc(nextBlock.notes)}</p></div><div class="item-meta"><span class="status ${nextBlock.readinessScore < 75 ? 'status-danger' : ''}">${esc(nextBlock.status === 'Ready with warnings' ? 'Gotowy z uwagami' : nextBlock.status)}</span><br>${invitedNames.length} ${invitedNames.length === 1 ? 'zaproszona osoba' : invitedNames.length < 5 ? 'zaproszone osoby' : 'zaproszonych osób'}<br>${nextBlock.participantIds.length} uczestników<br>${missingBackups.length} ${missingBackups.length === 1 ? 'brak zastępstwa' : 'braki zastępstw'}</div></div>`;

  function limitedList(items, renderItem, emptyText, limit = 3) {
    if (!items.length) return `<li><p class="empty-message">${esc(emptyText)}</p></li>`;
    const visible = items.slice(0, limit).map(renderItem).join('');
    const remaining = items.slice(limit);
    if (!remaining.length) return visible;
    return `${visible}<li><details class="more-items"><summary>Pokaż pozostałe (${remaining.length})</summary><ul class="plain-list">${remaining.map(renderItem).join('')}</ul></details></li>`;
  }

  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const tasks = data.tasks.filter(item => item.status !== 'Completed').sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9) || a.dueDate.localeCompare(b.dueDate));
  document.getElementById('coordinatorTaskCount').textContent = `${tasks.length} otwartych`;
  document.getElementById('coordinatorTasks').innerHTML = limitedList(tasks, item => `<li><div class="item-row"><div><strong>${esc(item.description)}</strong><p>Odpowiada: ${esc(personName(item.ownerId))} · ${esc(item.subject)}</p></div><div class="item-meta"><span class="status ${item.status === 'Overdue' || item.priority === 'Critical' ? 'status-danger' : ''}">${esc(item.status === 'Overdue' ? 'Po terminie' : item.priority === 'Critical' ? 'Pilne' : item.status === 'In progress' ? 'W trakcie' : 'Do zrobienia')}</span><br>termin ${esc(formatShortDate(item.dueDate))}</div></div></li>`, 'Brak otwartych zadań.');

  const decisions = [];
  data.blocks.filter(block => block.status === 'Staffing gap' || block.readinessScore < 70).forEach(block => decisions.push({ title: `${formatDate(block.date)} — gotowość ${block.readinessScore}%`, text: block.notes }));
  data.dataQueries.filter(query => query.status === 'Overdue').forEach(query => decisions.push({ title: `${query.fieldOrFile} — po terminie`, text: `${query.description} Odpowiada: ${personName(query.assignedToId)}.` }));
  const vacancy = data.team.find(person => person.status === 'Vacant');
  if (vacancy) decisions.push({ title: 'Nieobsadzona rola', text: `Koordynator danych i dokumentacji. ${vacancy.notesPublic}` });
  missingBackups.forEach(item => decisions.push({ title: `Brak zastępstwa: ${stationName(item.stationId)}`, text: `${formatDate(nextBlock.date)}, ${item.startTime}–${item.endTime}. Osoba główna: ${personName(item.memberId)}.` }));
  document.getElementById('coordinatorDecisionCount').textContent = decisions.length;
  document.getElementById('coordinatorDecisions').innerHTML = limitedList(decisions, item => `<li><strong>${esc(item.title)}</strong><p class="empty-message">${esc(item.text)}</p></li>`, 'Brak problemów wymagających decyzji.');

  const queries = data.dataQueries.filter(item => item.status !== 'Resolved').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  document.getElementById('coordinatorQueryCount').textContent = `${queries.length} do uzupełnienia`;
  document.getElementById('coordinatorQueries').innerHTML = limitedList(queries, item => `<li><div class="item-row"><div><strong>${esc(item.fieldOrFile)}</strong><p>${esc(item.description)} · Odpowiada: ${esc(personName(item.assignedToId))}</p></div><div class="item-meta"><span class="status ${item.status === 'Overdue' ? 'status-danger' : ''}">${esc(item.status === 'Overdue' ? 'Po terminie' : item.status === 'In progress' ? 'W trakcie' : 'Otwarte')}</span><br>termin ${esc(formatShortDate(item.dueDate))}</div></div></li>`, 'Brak otwartych braków danych.');

  document.getElementById('coordinatorLock').addEventListener('click', () => {
    sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
    window.LEAP_PORTAL_STORE.clearCoordinatorToken();
    location.replace(`portal-start.html?v=${VERSION}`);
  });

  window.addEventListener('storage', event => {
    if (event.key === window.LEAP_PORTAL_STORE.storageKey) location.reload();
  });

  window.LEAP_PORTAL_STORE.watch(() => location.reload());

  document.documentElement.classList.remove('auth-pending');
  renderSyncStatus();
})();
