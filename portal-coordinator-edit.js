(async () => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const VERSION = '20260805-3';

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

  const mailComposer = document.getElementById('mailComposer');
  const mailRecipients = document.getElementById('mailRecipients');
  const mailRecipientSummary = document.getElementById('mailRecipientSummary');
  const mailSubject = document.getElementById('mailSubject');
  const mailBody = document.getElementById('mailBody');
  const mailSendStatus = document.getElementById('mailSendStatus');
  const mailSend = document.getElementById('mailSend');
  const mailTest = document.getElementById('mailTest');
  let currentMailDraft = null;

  function newMailId(prefix) {
    const random = crypto.getRandomValues(new Uint32Array(2));
    return `${prefix}-${Date.now()}-${Array.from(random, value => value.toString(16)).join('')}`;
  }

  function selectedMailRecipientIds() {
    return [...mailRecipients.querySelectorAll('input[type="checkbox"]:checked')].map(input => input.value);
  }

  function updateMailRecipientSummary() {
    const count = selectedMailRecipientIds().length;
    mailRecipientSummary.textContent = count
      ? `Wiadomość otrzyma ${count} ${count === 1 ? 'osoba' : count < 5 ? 'osoby' : 'osób'}.`
      : 'Wybierz co najmniej jednego odbiorcę.';
  }

  function openMailComposer(draft) {
    currentMailDraft = { ...draft, sent: false };
    const selected = new Set(draft.recipientIds || []);
    mailRecipients.innerHTML = activeTeam.map(person => `<label class="mail-recipient-option"><input type="checkbox" value="${esc(person.id)}" ${selected.has(person.id) ? 'checked' : ''} /><span>${esc(person.name)}</span></label>`).join('');
    mailSubject.value = draft.subject;
    mailBody.value = draft.body;
    mailSendStatus.textContent = '';
    mailSend.disabled = false;
    mailTest.disabled = false;
    updateMailRecipientSummary();
    mailComposer.showModal();
  }

  function closeMailComposer() {
    if (mailComposer.open) mailComposer.close();
    currentMailDraft = null;
  }

  function dayMailDraft(previousBlock, block) {
    const currentIds = block.invitedMemberIds || [];
    const previousIds = previousBlock?.invitedMemberIds || [];
    const recipientIds = [...new Set([...currentIds, ...previousIds])];
    const isUpdate = Boolean(previousBlock);
    const currentNames = currentIds.map(personName).join(', ');
    const title = isUpdate ? 'zmiana dnia badawczego' : 'nowy dzień badawczy';
    const body = [
      'Dzień dobry,',
      '',
      isUpdate ? 'Zaktualizowaliśmy informacje dotyczące dnia badawczego LEAP.' : 'Zaplanowaliśmy nowy dzień badawczy LEAP.',
      '',
      `Data: ${formatDate(block.date)}`,
      `Godzina: ${block.startTime}–${block.endTime}`,
      `Rodzaj dnia: ${typeLabel(block.type)}`,
      `Miejsce: ${block.location}`,
      `Osoba prowadząca część kliniczną: ${personName(block.clinicalLeadId)}`,
      `Aktualnie zaproszone osoby: ${currentNames || 'brak'}`,
      block.notes ? `Ważna informacja: ${block.notes}` : '',
      '',
      isUpdate ? 'Sprawdź aktualną listę powyżej. Jeżeli nie ma na niej Twojego nazwiska, nie jesteś już przypisany/a do tego dnia.' : 'Prosimy o zapisanie terminu i potwierdzenie, że wiadomość dotarła.',
      '',
      'Pozdrawiamy,',
      'Zespół LEAP'
    ].filter((line, index, all) => line || (index > 0 && all[index - 1])).join('\n');
    return {
      id: newMailId('day-mail'),
      category: isUpdate ? 'research-day-updated' : 'research-day-created',
      recipientIds,
      subject: `LEAP — ${title}: ${formatDate(block.date)} (${typeLabel(block.type)})`,
      body
    };
  }

  function messageMailDraft(message, recipientIds) {
    return {
      id: newMailId('message-mail'),
      category: 'general-message',
      recipientIds,
      subject: `LEAP — ${message.title}`,
      body: `Dzień dobry,\n\n${message.text}\n\nPozdrawiamy,\nZespół LEAP`
    };
  }

  async function sendCurrentMail(isTest) {
    if (!currentMailDraft) return;
    if (!document.getElementById('mailComposerForm').reportValidity()) return;
    const recipientIds = isTest ? ['pi'] : selectedMailRecipientIds();
    if (!recipientIds.length) {
      mailSendStatus.textContent = 'Wybierz co najmniej jednego odbiorcę.';
      return;
    }
    mailSendStatus.textContent = isTest ? 'Wysyłanie testu…' : 'Wysyłanie wiadomości…';
    mailSend.disabled = true;
    mailTest.disabled = true;
    try {
      const result = await window.LEAP_PORTAL_STORE.sendEmail({
        clientMessageId: isTest ? newMailId('test-mail') : currentMailDraft.id,
        recipientIds,
        subject: `${isTest ? '[TEST] ' : ''}${mailSubject.value.trim()}`,
        body: mailBody.value.trim(),
        category: currentMailDraft.category,
        isTest
      });
      mailSendStatus.textContent = isTest
        ? `Test wysłany do konta projektu. Nadawca techniczny: ${result.sender}. Sprawdź skrzynkę przed właściwą wysyłką.${result.logSaved === false ? ' Uwaga: nie udało się zapisać rejestru wysyłki.' : ''}`
        : `Wysłano do ${result.sentCount} ${result.sentCount === 1 ? 'osoby' : 'osób'}. Nadawca techniczny: ${result.sender}.${result.logSaved === false ? ' Uwaga: nie udało się zapisać rejestru wysyłki.' : ''}`;
      if (!isTest) {
        currentMailDraft.sent = true;
        mailSend.disabled = true;
      }
    } catch (error) {
      const missingNames = (error.missingRecipientIds || []).map(personName);
      mailSendStatus.textContent = missingNames.length
        ? `Brak adresów e-mail dla: ${missingNames.join(', ')}. Wiadomość nie została wysłana.`
        : (error.message || 'Nie udało się wysłać wiadomości.');
      if (error.code === 'unauthorized') {
        sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
        setTimeout(() => location.replace(`portal-coordinator-login.html?v=${VERSION}`), 1800);
      }
    } finally {
      if (!currentMailDraft?.sent) mailSend.disabled = false;
      mailTest.disabled = false;
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
  document.getElementById('motivatorTarget').innerHTML = personOptions(true);
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
  mailRecipients.addEventListener('change', updateMailRecipientSummary);
  document.getElementById('mailClose').addEventListener('click', closeMailComposer);
  document.getElementById('mailCancel').addEventListener('click', closeMailComposer);
  mailComposer.addEventListener('close', () => { currentMailDraft = null; });
  document.getElementById('mailTest').addEventListener('click', () => sendCurrentMail(true));
  document.getElementById('mailComposerForm').addEventListener('submit', event => {
    event.preventDefault();
    sendCurrentMail(false);
  });

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
    const prepareEmail = document.getElementById('dayPrepareEmail').checked;
    if (!await save(editing ? 'Zapisano zmiany dnia badawczego.' : 'Dodano nowy dzień badawczy.')) return;
    refreshDayOptions(block.id);
    dayAction.value = 'edit';
    updateDayMode();
    document.getElementById('dayPrepareEmail').checked = false;
    if (prepareEmail) openMailComposer(dayMailDraft(previousBlock, block));
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
    const prepareEmail = document.getElementById('messagePrepareEmail').checked;
    if (!await save('Opublikowano komunikat.')) return;
    event.target.reset();
    renderMessages();
    if (prepareEmail) openMailComposer(messageMailDraft(message, messageRecipients));
  });

  document.getElementById('motivatorForm').addEventListener('submit', event => {
    event.preventDefault();
    const targetId = document.getElementById('motivatorTarget').value;
    const recipientIds = targetId === 'all' ? activeTeam.map(person => person.id) : [targetId];
    const link = document.getElementById('motivatorLink').value.trim();
    const text = document.getElementById('motivatorText').value.trim();
    openMailComposer({
      id: newMailId('motivator-mail'),
      category: 'project-motivator',
      recipientIds,
      subject: document.getElementById('motivatorSubject').value.trim(),
      body: `Dzień dobry,\n\n${text}${link ? `\n\nMateriał: ${link}` : ''}\n\nPozdrawiamy,\nZespół LEAP`
    });
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
  document.documentElement.classList.remove('auth-pending');
})();
