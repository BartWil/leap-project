(async () => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const RESEARCHER_KEY = 'leap-researcher-id';
  const VERSION = '20260813-3';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }

  const data = await window.LEAP_PORTAL_STORE.load();
  const select = document.getElementById('researcherSelect');
  const welcome = document.getElementById('researcherWelcome');
  const workspace = document.getElementById('researcherWorkspace');
  const daysList = document.getElementById('researcherDays');
  const tasksList = document.getElementById('researcherTasks');
  const duties = document.getElementById('researcherDuties');
  const messagesList = document.getElementById('researcherMessages');
  const taskCount = document.getElementById('researcherTaskCount');
  const syncStatus = document.getElementById('researcherSyncStatus');

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const personName = id => data.team.find(person => person.id === id)?.name || 'Nieprzypisano';
  const stationName = id => data.stations.find(station => station.id === id)?.name || id;
  const typeLabel = value => value === 'Mixed' ? 'Blok mieszany' : value === 'LASER' ? 'Laser/sham' : value;
  const formatDate = value => new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${value}T12:00:00`));
  const formatShortDate = value => new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit' }).format(new Date(`${value}T12:00:00`));

  function renderSyncStatus() {
    const current = window.LEAP_PORTAL_STORE.getStatus();
    const updated = current.updatedAt
      ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(current.updatedAt))
      : '';
    syncStatus.textContent = current.online
      ? current.initialized
        ? `Wspólne dane aktualne${updated ? ` · ostatnia zmiana ${updated}` : ''}`
        : 'Wspólne dane są gotowe do pierwszego zapisu koordynatora.'
      : `Brak połączenia · wyświetlam: ${current.source}`;
    syncStatus.classList.toggle('sync-warning', !current.online);
  }

  const activeTeam = data.team.filter(person => person.status !== 'Vacant');
  select.insertAdjacentHTML('beforeend', activeTeam.map(person => `<option value="${esc(person.id)}">${esc(person.name)}</option>`).join(''));

  function assignmentsFor(block, memberId) {
    const assignments = block.stationAssignments.filter(item => item.memberId === memberId || item.backupMemberId === memberId);
    const roles = assignments.map(item => {
      const role = item.memberId === memberId ? 'stanowisko' : 'zastępstwo';
      return `${stationName(item.stationId)} (${role}, ${item.startTime}–${item.endTime})`;
    });
    if (block.clinicalLeadId === memberId) roles.unshift('osoba prowadząca część kliniczną');
    return roles;
  }

  function isInvited(block, memberId) {
    return (block.invitedMemberIds || []).includes(memberId);
  }

  function isExpected(block, memberId) {
    return isInvited(block, memberId) || assignmentsFor(block, memberId).length > 0;
  }

  function renderDays(memberId) {
    const today = new Date().toISOString().slice(0, 10);
    const blocks = [...data.blocks]
      .filter(block => block.date >= today && isExpected(block, memberId))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);
    if (!blocks.length) {
      daysList.innerHTML = '<li><p class="empty-message">Nie masz obecnie zaplanowanej obecności w przyszłym dniu badawczym.</p></li>';
      return;
    }
    daysList.innerHTML = blocks.map(block => {
      const roles = assignmentsFor(block, memberId);
      const detail = roles.length
        ? `<b>Twój przydział:</b> ${roles.map(esc).join('; ')}`
        : 'Masz zaproszenie na ten dzień. Dokładny przydział może zostać uzupełniony później.';
      return `<li><div class="item-row"><div><strong>${esc(formatDate(block.date))}, ${esc(block.startTime)}–${esc(block.endTime)}</strong><p>${esc(typeLabel(block.type))} · ${esc(block.location)}</p><p>${detail}</p></div><div class="item-meta"><span class="status status-ok">${roles.length ? 'Masz przydział' : 'Zaproszenie'}</span></div></div></li>`;
    }).join('');
  }

  function renderTasks(memberId) {
    const tasks = [
      ...data.tasks.filter(item => item.ownerId === memberId && item.status !== 'Completed').map(item => ({ ...item, label: item.description })),
      ...data.dataQueries.filter(item => item.assignedToId === memberId && item.status !== 'Resolved').map(item => ({ ...item, label: item.description, subject: item.fieldOrFile }))
    ].sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    taskCount.textContent = tasks.length ? `${tasks.length} do sprawdzenia` : 'brak';
    tasksList.innerHTML = tasks.length
      ? tasks.map(item => `<li><div class="item-row"><div><strong>${esc(item.label)}</strong><p>${esc(item.subject)}</p></div><div class="item-meta"><span class="status ${item.status === 'Overdue' ? 'status-danger' : ''}">${esc(item.status === 'Overdue' ? 'Po terminie' : item.status === 'In progress' ? 'W trakcie' : 'Do zrobienia')}</span><br>termin ${esc(formatShortDate(item.dueDate))}</div></div></li>`).join('')
      : '<li><p class="empty-message">Nie masz obecnie przypisanych zadań wymagających reakcji.</p></li>';
    return tasks;
  }

  function renderDuties(person) {
    duties.innerHTML = `<p class="role-summary"><strong>${esc(person.name)}</strong><br>${esc(person.notesPublic)}</p><ul class="responsibility-list">${person.responsibilities.map(item => `<li>${esc(item)}</li>`).join('')}</ul><a class="primary-link" href="portal-duties.html?v=${VERSION}&amp;person=${encodeURIComponent(person.id)}">Zobacz dokładną instrukcję</a>`;
  }

  function renderMessages(memberId, tasks) {
    const messages = [];
    const today = new Date().toISOString().slice(0, 10);
    (data.coordinatorMessages || [])
      .filter(item => (item.targetId === 'all' || item.targetId === memberId) && (!item.expiresDate || item.expiresDate >= today))
      .forEach(item => messages.push({ title: item.title, text: item.text }));
    const assignedBlocks = [...data.blocks].sort((a, b) => a.date.localeCompare(b.date)).filter(block => isExpected(block, memberId));
    assignedBlocks.slice(0, 2).forEach(block => {
      if (block.notes) messages.push({ title: formatDate(block.date), text: block.notes });
    });
    const overdue = tasks.filter(task => task.status === 'Overdue').length;
    if (overdue) messages.unshift({ title: 'Zadania po terminie', text: `Masz ${overdue} ${overdue === 1 ? 'zadanie' : 'zadania'} wymagające pilnej reakcji.` });
    messagesList.innerHTML = messages.length
      ? messages.slice(0, 3).map(item => `<li><strong>${esc(item.title)}</strong><p class="empty-message">${esc(item.text)}</p></li>`).join('')
      : '<li><p class="empty-message">Brak nowych komunikatów dotyczących Twojej pracy.</p></li>';
  }

  function render(memberId) {
    const person = data.team.find(item => item.id === memberId && item.status !== 'Vacant');
    if (!person) {
      welcome.hidden = false;
      workspace.hidden = true;
      localStorage.removeItem(RESEARCHER_KEY);
      return;
    }
    welcome.hidden = true;
    workspace.hidden = false;
    localStorage.setItem(RESEARCHER_KEY, person.id);
    renderDays(person.id);
    const tasks = renderTasks(person.id);
    renderDuties(person);
    renderMessages(person.id, tasks);
  }

  select.addEventListener('change', () => render(select.value));
  document.getElementById('researcherLogout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
    window.LEAP_PORTAL_STORE.clearCoordinatorToken();
    location.replace(`portal.html?v=${VERSION}`);
  });

  window.addEventListener('storage', event => {
    if (event.key === window.LEAP_PORTAL_STORE.storageKey) location.reload();
  });

  window.LEAP_PORTAL_STORE.watch(() => location.reload());

  const savedPerson = localStorage.getItem(RESEARCHER_KEY);
  if (activeTeam.some(person => person.id === savedPerson)) {
    select.value = savedPerson;
    render(savedPerson);
  }

  document.documentElement.classList.remove('auth-pending');
  renderSyncStatus();
})();
