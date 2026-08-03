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

  let data = await window.LEAP_PORTAL_STORE.load();
  const status = document.getElementById('editStatus');
  const notificationQueueStatus = document.getElementById('notificationQueueStatus');
  const activeTeam = data.team.filter(person => person.status !== 'Vacant');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const personName = id => data.team.find(person => person.id === id)?.name || 'Nieprzypisano';
  const typeLabel = value => value === 'Mixed' ? 'Blok mieszany' : value;
  const formatDate = value => value ? new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'bez terminu';

  async function save(message) {
    const buttons = [...document.querySelectorAll('.form-submit, .form-delete, .row-action')];
    buttons.forEach(button => { button.disabled = true; });
    status.textContent = 'Zapisywanie we wspólnym arkuszu…';
    try {
      await window.LEAP_PORTAL_STORE.save(data);
      renderNotificationQueue();
      status.textContent = message;
      clearTimeout(save.timeout);
      save.timeout = setTimeout(() => { status.textContent = ''; }, 5000);
      return true;
    } catch (error) {
      status.textContent = error?.message || 'Nie udało się zapisać zmiany.';
      if (error?.code === 'unauthorized') {
        sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
        setTimeout(() => location.replace(`portal-coordinator-login.html?v=${VERSION}`), 1800);
      } else {
        setTimeout(() => location.reload(), 2500);
      }
      return false;
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  function renderNotificationQueue() {
    const pending = (data.notificationOutbox || []).filter(item => item.status === 'waiting-for-mail-service').length;
    notificationQueueStatus.textContent = pending
      ? `Powiadomienia e-mail: ${pending} ${pending === 1 ? 'zdarzenie oczekuje' : 'zdarzeń oczekuje'} na podłączenie prywatnej skrzynki nadawczej.`
      : 'Powiadomienia e-mail: kolejka jest gotowa, ale prywatna skrzynka nadawcza nie została jeszcze podłączona.';
  }

  function queueNotification(eventType, recipientIds, payload) {
    const recipients = [...new Set(recipientIds.filter(Boolean))];
    if (!recipients.length) return;
    data.notificationOutbox ||= [];
    data.notificationOutbox.unshift({
      id: `notification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      recipientIds: recipients,
      payload,
      createdAt: new Date().toISOString(),
      status: 'waiting-for-mail-service'
    });
  }

  function dayNotificationPayload(block) {
    return {
      blockId: block.id,
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      type: block.type,
      location: block.location,
      clinicalLeadId: block.clinicalLeadId,
      notes: block.notes || ''
    };
  }

  function queueDayNotifications(previousBlock, block) {
    const currentIds = block.invitedMemberIds || [];
    if (!previousBlock) {
      queueNotification('research-day-created', currentIds, dayNotificationPayload(block));
      return;
    }

    const previousIds = previousBlock.invitedMemberIds || [];
    const previousSet = new Set(previousIds);
    const currentSet = new Set(currentIds);
    const addedIds = currentIds.filter(id => !previousSet.has(id));
    const removedIds = previousIds.filter(id => !currentSet.has(id));
    const scheduleChanged = ['date', 'startTime', 'endTime', 'type', 'location', 'clinicalLeadId', 'notes']
      .some(field => previousBlock[field] !== block[field]);

    if (scheduleChanged) {
      queueNotification('research-day-updated', currentIds, { ...dayNotificationPayload(block), addedRecipientIds: addedIds });
    } else if (addedIds.length) {
      queueNotification('research-day-invitation-added', addedIds, dayNotificationPayload(block));
    }
    if (removedIds.length) {
      queueNotification('research-day-invitation-removed', removedIds, dayNotificationPayload(block));
    }
  }

  function personOptions(includeAll = false) {
    return `${includeAll ? '<option value="all">Cały zespół</option>' : ''}${activeTeam.map(person => `<option value="${esc(person.id)}">${esc(person.name)}</option>`).join('')}`;
  }

  const dayAction = document.getElementById('dayAction');
  const dayBlock = document.getElementById('dayBlock');
  const dayExistingField = document.getElementById('dayExistingField');
  const daySubmit = document.getElementById('daySubmit');
  const dayDelete = document.getElementById('dayDelete');
  const dayType = document.getElementById('dayType');
  const dayLead = document.getElementById('dayLead');
  const dayInvitees = document.getElementById('dayInvitees');
  const dayInviteSummary = document.getElementById('dayInviteSummary');

  function selectedInviteIds() {
    const checkedIds = [...dayInvitees.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')]
      .map(input => input.value);
    return [...new Set([dayLead.value, ...checkedIds].filter(Boolean))];
  }

  function updateInviteSummary() {
    const count = selectedInviteIds().length;
    dayInviteSummary.textContent = count
      ? `Zaproszono ${count} ${count === 1 ? 'osobę' : count < 5 ? 'osoby' : 'osób'}.`
      : 'Nie wybrano jeszcze żadnej osoby.';
  }

  function renderInvitees(selectedIds = selectedInviteIds()) {
    const selected = new Set(selectedIds);
    const leadId = dayLead.value;
    dayInvitees.innerHTML = activeTeam.map(person => {
      const isLead = person.id === leadId;
      const checked = isLead || selected.has(person.id);
      return `<label class="invite-option${isLead ? ' is-lead' : ''}"><input type="checkbox" value="${esc(person.id)}" ${checked ? 'checked' : ''} ${isLead ? 'disabled' : ''} /><span>${esc(person.name)}${isLead ? '<small>prowadzi część kliniczną — dodano automatycznie</small>' : ''}</span></label>`;
    }).join('');
    updateInviteSummary();
  }

  function refreshDayOptions(selectedId = '') {
    dayBlock.innerHTML = [...data.blocks]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(block => `<option value="${esc(block.id)}">${esc(formatDate(block.date))} · ${esc(typeLabel(block.type))}</option>`).join('');
    if (selectedId) dayBlock.value = selectedId;
  }

  refreshDayOptions();
  document.getElementById('taskOwner').innerHTML = personOptions();
  document.getElementById('dutiesPerson').innerHTML = personOptions();
  document.getElementById('messageTarget').innerHTML = personOptions(true);
  dayLead.innerHTML = `<option value="">— wybierz osobę —</option>${personOptions()}`;

  function fillDay() {
    const block = data.blocks.find(item => item.id === dayBlock.value);
    if (!block) return;
    document.getElementById('dayDate').value = block.date;
    document.getElementById('dayStart').value = block.startTime;
    document.getElementById('dayEnd').value = block.endTime;
    document.getElementById('dayLocation').value = block.location;
    dayType.value = ['T0', 'W12', 'T1', 'Mixed'].includes(block.type) ? block.type : 'Mixed';
    dayLead.value = block.clinicalLeadId || '';
    renderInvitees(block.invitedMemberIds || [block.clinicalLeadId]);
    document.getElementById('dayNote').value = block.notes || '';
  }

  function prepareNewDay() {
    document.getElementById('dayDate').value = '';
    document.getElementById('dayStart').value = '09:00';
    document.getElementById('dayEnd').value = '13:00';
    document.getElementById('dayLocation').value = data.meta.location || '';
    document.getElementById('dayNote').value = '';
    dayType.value = 'T0';
    dayLead.value = '';
    renderInvitees([]);
  }

  function updateDayMode() {
    const editing = dayAction.value === 'edit';
    dayExistingField.hidden = !editing;
    dayBlock.required = editing;
    daySubmit.textContent = editing ? 'Zapisz zmiany dnia' : 'Dodaj dzień badawczy';
    dayDelete.hidden = !editing;
    if (editing) fillDay();
    else prepareNewDay();
  }

  function fillDuties() {
    const person = data.team.find(item => item.id === document.getElementById('dutiesPerson').value);
    if (!person) return;
    document.getElementById('dutiesSummary').value = person.notesPublic || '';
    document.getElementById('dutiesList').value = person.responsibilities.join('\n');
  }

  function renderTasks() {
    const tasks = data.tasks.filter(item => item.status !== 'Completed').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    document.getElementById('editableTasks').innerHTML = tasks.length
      ? tasks.map(item => `<li><div class="item-row"><div><strong>${esc(item.description)}</strong><p>${esc(personName(item.ownerId))} · termin ${esc(formatDate(item.dueDate))}</p></div><button class="row-action" type="button" data-complete-task="${esc(item.id)}">Zakończ</button></div></li>`).join('')
      : '<li><p class="empty-message">Brak otwartych zadań.</p></li>';
  }

  function renderMessages() {
    const messages = data.coordinatorMessages || [];
    document.getElementById('editableMessages').innerHTML = messages.length
      ? messages.map(item => `<li><div class="item-row"><div><strong>${esc(item.title)}</strong><p>${esc(item.targetId === 'all' ? 'Cały zespół' : personName(item.targetId))} · ${esc(item.text)}</p></div><button class="row-action" type="button" data-remove-message="${esc(item.id)}">Usuń</button></div></li>`).join('')
      : '<li><p class="empty-message">Brak komunikatów koordynatorów.</p></li>';
  }

  document.querySelector('.edit-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-edit-view]');
    if (!button) return;
    document.querySelectorAll('[data-edit-view]').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('[data-edit-panel]').forEach(panel => { panel.hidden = panel.dataset.editPanel !== button.dataset.editView; });
    status.textContent = '';
  });

  dayAction.addEventListener('change', updateDayMode);
  dayBlock.addEventListener('change', fillDay);
  dayLead.addEventListener('change', () => renderInvitees(selectedInviteIds()));
  dayInvitees.addEventListener('change', updateInviteSummary);
  document.getElementById('dayInviteAll').addEventListener('click', () => {
    dayInvitees.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(input => { input.checked = true; });
    updateInviteSummary();
  });
  document.getElementById('dayInviteNone').addEventListener('click', () => {
    dayInvitees.querySelectorAll('input[type="checkbox"]:not(:disabled)').forEach(input => { input.checked = false; });
    updateInviteSummary();
  });
  document.getElementById('dutiesPerson').addEventListener('change', fillDuties);

  document.getElementById('dayForm').addEventListener('submit', async event => {
    event.preventDefault();
    const editing = dayAction.value === 'edit';
    let block = editing ? data.blocks.find(item => item.id === dayBlock.value) : null;
    if (editing && !block) return;
    const previousBlock = block ? JSON.parse(JSON.stringify(block)) : null;
    if (!block) {
      block = {
        id: `block-${Date.now()}`,
        participantIds: [],
        rooms: 0,
        status: 'Planned',
        readinessScore: 0,
        invitedMemberIds: [],
        stationAssignments: []
      };
      data.blocks.push(block);
    }
    block.date = document.getElementById('dayDate').value;
    block.startTime = document.getElementById('dayStart').value;
    block.endTime = document.getElementById('dayEnd').value;
    block.type = dayType.value;
    block.location = document.getElementById('dayLocation').value.trim();
    block.clinicalLeadId = dayLead.value;
    block.invitedMemberIds = selectedInviteIds();
    block.notes = document.getElementById('dayNote').value.trim();
    queueDayNotifications(previousBlock, block);
    if (!await save(editing ? 'Zapisano zmiany dnia badawczego.' : 'Dodano nowy dzień badawczy.')) return;
    refreshDayOptions(block.id);
    dayAction.value = 'edit';
    updateDayMode();
  });

  dayDelete.addEventListener('click', async () => {
    const block = data.blocks.find(item => item.id === dayBlock.value);
    if (!block || !confirm(`Usunąć dzień ${formatDate(block.date)} (${typeLabel(block.type)})?`)) return;
    data.blocks = data.blocks.filter(item => item.id !== block.id);
    if (!await save('Usunięto dzień badawczy.')) return;
    refreshDayOptions();
    if (data.blocks.length) {
      dayAction.value = 'edit';
      updateDayMode();
    } else {
      dayAction.value = 'add';
      updateDayMode();
    }
  });

  document.getElementById('taskForm').addEventListener('submit', async event => {
    event.preventDefault();
    data.tasks.push({
      id: `task-${Date.now()}`,
      priority: 'High',
      subject: document.getElementById('taskSubject').value.trim(),
      description: document.getElementById('taskDescription').value.trim(),
      ownerId: document.getElementById('taskOwner').value,
      dueDate: document.getElementById('taskDue').value,
      status: 'Open',
      targetView: 'dashboard'
    });
    if (!await save('Dodano zadanie. Badacz zobaczy je w swoim panelu.')) return;
    event.target.reset();
    renderTasks();
  });

  document.getElementById('dutiesForm').addEventListener('submit', async event => {
    event.preventDefault();
    const person = data.team.find(item => item.id === document.getElementById('dutiesPerson').value);
    if (!person) return;
    person.notesPublic = document.getElementById('dutiesSummary').value.trim();
    person.responsibilities = document.getElementById('dutiesList').value.split('\n').map(item => item.trim()).filter(Boolean);
    await save(`Zapisano obowiązki: ${person.name}.`);
  });

  document.getElementById('messageForm').addEventListener('submit', async event => {
    event.preventDefault();
    data.coordinatorMessages ||= [];
    const message = {
      id: `message-${Date.now()}`,
      targetId: document.getElementById('messageTarget').value,
      title: document.getElementById('messageTitle').value.trim(),
      text: document.getElementById('messageText').value.trim(),
      expiresDate: document.getElementById('messageExpiry').value || null,
      createdAt: new Date().toISOString()
    };
    data.coordinatorMessages.unshift(message);
    const messageRecipients = message.targetId === 'all' ? activeTeam.map(person => person.id) : [message.targetId];
    queueNotification('general-message', messageRecipients, {
      messageId: message.id,
      title: message.title,
      text: message.text,
      expiresDate: message.expiresDate
    });
    if (!await save('Opublikowano komunikat. Powiadomienie e-mail dodano do kolejki.')) return;
    event.target.reset();
    renderMessages();
  });

  document.addEventListener('click', async event => {
    const taskButton = event.target.closest('[data-complete-task]');
    if (taskButton) {
      const task = data.tasks.find(item => item.id === taskButton.dataset.completeTask);
      if (task) task.status = 'Completed';
      if (!await save('Zadanie oznaczono jako zakończone.')) return;
      renderTasks();
      return;
    }
    const messageButton = event.target.closest('[data-remove-message]');
    if (messageButton) {
      data.coordinatorMessages = (data.coordinatorMessages || []).filter(item => item.id !== messageButton.dataset.removeMessage);
      if (!await save('Usunięto komunikat.')) return;
      renderMessages();
    }
  });

  updateDayMode();
  fillDuties();
  renderTasks();
  renderMessages();
  renderNotificationQueue();
  document.documentElement.classList.remove('auth-pending');
})();
