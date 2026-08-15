(() => {
  'use strict';

  const TOKEN_KEY = 'leap-delegate-access-token-v1';
  const store = window.LEAP_PORTAL_STORE;
  const clone = value => JSON.parse(JSON.stringify(value));
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
  const tokenFromUrl = new URL(location.href).searchParams.get('access') || '';
  const previewMemberId = new URL(location.href).searchParams.get('preview') || '';
  const requestedMemberId = new URL(location.href).searchParams.get('member') || '';
  const demoRequested = new URL(location.href).searchParams.get('demo') === 'laser';
  const isCoordinatorPreview = /^(alicja|natalia|filip)$/.test(previewMemberId);
  const isDemoMode = isCoordinatorPreview && previewMemberId === 'filip' && demoRequested;
  const isPersonalEntry = /^(alicja|natalia|filip)$/.test(requestedMemberId);
  const memberTokenKey = memberId => `${TOKEN_KEY}:${memberId}`;
  const readStoredToken = key => {
    let value = '';
    try { value = localStorage.getItem(key) || ''; } catch {}
    if (!value) try { value = sessionStorage.getItem(key) || ''; } catch {}
    return /^[a-f0-9]{64}$/i.test(value) ? value : '';
  };
  const rememberToken = (key, token) => {
    try { localStorage.setItem(key, token); return true; } catch {}
    try { sessionStorage.setItem(key, token); return true; } catch {}
    return false;
  };
  let accessToken = '';
  if (/^[a-f0-9]{64}$/i.test(tokenFromUrl)) {
    accessToken = tokenFromUrl;
    const tokenSaved = rememberToken(TOKEN_KEY, tokenFromUrl);
    if (tokenSaved) {
      const cleanUrl = new URL(location.href);
      cleanUrl.searchParams.delete('access');
      history.replaceState(null, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    }
  } else {
    accessToken = isPersonalEntry ? readStoredToken(memberTokenKey(requestedMemberId)) : '';
    if (!accessToken) accessToken = readStoredToken(TOKEN_KEY);
  }
  let snapshot = null;
  let currentBlock = null;
  let lastChangeCategory = 'research-day-created';
  let mailDraft = null;
  let laserSeriesMode = false;
  let currentSeriesBlocks = [];

  const loading = document.getElementById('leadLoading');
  const errorPanel = document.getElementById('leadError');
  const errorText = document.getElementById('leadErrorText');
  const app = document.getElementById('leadApp');
  const message = document.getElementById('leadMessage');
  const editor = document.getElementById('leadEditor');
  const tabs = document.querySelector('.lead-tabs');
  const views = [...document.querySelectorAll('[data-lead-panel]')];
  const mailDialog = document.getElementById('leadMailDialog');

  function showError(text, revoke = false) {
    if (revoke) {
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
      try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
      if (isPersonalEntry) {
        try { localStorage.removeItem(memberTokenKey(requestedMemberId)); } catch {}
        try { sessionStorage.removeItem(memberTokenKey(requestedMemberId)); } catch {}
      }
    }
    loading.hidden = true;
    app.hidden = true;
    errorPanel.hidden = false;
    errorText.textContent = text;
  }

  function setMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('is-error', isError);
  }

  function typeLabel(type) {
    return type === 'LASER' ? 'Laser/sham' : type;
  }

  function formatDate(value, withWeekday = false) {
    if (!value) return '—';
    const date = new Date(`${value}T12:00:00`);
    return new Intl.DateTimeFormat('pl-PL', withWeekday
      ? { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  function formatResponseTime(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
  }

  function personName(id) {
    return snapshot?.team.find(person => person.id === id)?.name || id;
  }

  function newMessageId(prefix) {
    const random = crypto.getRandomValues(new Uint32Array(2));
    return `${prefix}-${Date.now()}-${random[0].toString(16)}${random[1].toString(16)}`;
  }

  function dayCard(block) {
    const counts = block.attendance?.counts || { yes: 0, no: 0, pending: block.invitedMemberIds?.length || 0 };
    const laserMeta = block.type === 'LASER' && block.interventionSessionNumber
      ? ` · zabieg ${block.interventionSessionNumber}/${block.interventionSessionTotal || 10}` : '';
    const participantMeta = block.type === 'LASER' && block.participantIds?.length
      ? `<small>Kody uczestników: ${esc(block.participantIds.join(', '))}</small>` : '';
    return `<article class="lead-day-card${block.status === 'Cancelled' ? ' is-cancelled' : ''}">
      <div class="lead-day-date"><strong>${esc(formatDate(block.date).slice(0, 5))}</strong><span>${esc(new Intl.DateTimeFormat('pl-PL', { weekday: 'long' }).format(new Date(`${block.date}T12:00:00`)))}</span></div>
      <div class="lead-day-copy"><strong>${esc(typeLabel(block.type))}${esc(laserMeta)} · ${esc(block.startTime)}–${esc(block.endTime)}</strong><p>${esc(block.location)}</p><small>Prowadzi: ${esc(block.clinicalLeadName || personName(block.clinicalLeadId))} · zaproszono ${block.invitedMemberIds.length} osób</small>${participantMeta}
        <div class="lead-day-counts"><span class="yes">${counts.yes} TAK</span><span class="no">${counts.no} NIE</span><span class="pending">${counts.pending} bez odpowiedzi</span></div>
      </div>
      <button class="lead-open-day" type="button" data-open-day="${esc(block.id)}">Otwórz termin</button>
    </article>`;
  }

  function renderLists() {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const upcoming = snapshot.blocks
      .filter(block => block.date >= today && block.status !== 'Cancelled')
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    const future = snapshot.blocks.filter(block => block.date >= today).sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
    const past = snapshot.blocks.filter(block => block.date < today).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
    document.getElementById('leadAttentionList').innerHTML = upcoming.length
      ? upcoming.map(dayCard).join('')
      : '<div class="lead-empty">Brak najbliższych terminów. Użyj przycisku „Dodaj termin”, kiedy ustalisz nowy dzień.</div>';
    document.getElementById('leadCalendarList').innerHTML = future.length || past.length
      ? [...future, ...past].map(dayCard).join('')
      : '<div class="lead-empty">W Twoim zakresie nie ma jeszcze żadnych terminów.</div>';
  }

  async function loadData(options = {}) {
    if (!accessToken && !isCoordinatorPreview) {
      showError('Otwórz indywidualny link otrzymany w wiadomości e-mail.');
      return false;
    }
    if (!options.quiet) {
      loading.hidden = false;
      errorPanel.hidden = true;
    }
    try {
      snapshot = isCoordinatorPreview
        ? await store.getCoordinatorDelegateData(previewMemberId)
        : await store.getDelegateData(accessToken);
      if (isPersonalEntry && snapshot.user.id !== requestedMemberId) {
        showError(`Na tym urządzeniu zapisano dostęp dla: ${snapshot.user.name}. Aby otworzyć panel wybranej osoby, trzeba jeden raz użyć jej indywidualnego linku z e-maila.`);
        return false;
      }
      if (!isCoordinatorPreview && accessToken) rememberToken(memberTokenKey(snapshot.user.id), accessToken);
      document.getElementById('leadGreeting').textContent = isCoordinatorPreview ? `Podgląd: ${snapshot.user.name}` : `Dzień dobry, ${snapshot.user.name.split(' ')[0]}`;
      document.getElementById('leadScope').textContent = `${isCoordinatorPreview ? 'Zakres tej osoby' : 'Twój zakres'}: ${snapshot.user.scopeLabel}. ${isCoordinatorPreview ? 'To bezpieczny widok tylko do odczytu.' : 'Widzisz tylko terminy i działania potrzebne do ich organizacji.'}`;
      document.getElementById('leadAddDay').textContent = `Dodaj termin: ${typeLabel(snapshot.user.allowedTypes[0])}`;
      document.getElementById('leadAddDay').hidden = isCoordinatorPreview && !isDemoMode;
      document.getElementById('leadLogout').hidden = false;
      document.getElementById('leadLogout').textContent = isCoordinatorPreview ? '← Wróć do Centrum kontroli' : 'Wyloguj z tego urządzenia';
      if (isCoordinatorPreview && !document.querySelector('.lead-preview-note')) {
        const note = document.createElement('p');
        note.className = 'lead-preview-note';
        note.textContent = isDemoMode
          ? 'Tryb próbny koordynatora — możesz przejść przez tworzenie serii laser/sham. Nic nie zostanie zapisane ani wysłane.'
          : 'Podgląd koordynatora — widzisz te same terminy i odpowiedzi, ale niczego tutaj nie zmienisz ani nie wyślesz.';
        document.querySelector('.lead-intro').after(note);
      }
      renderLists();
      loading.hidden = true;
      errorPanel.hidden = true;
      app.hidden = false;
      return true;
    } catch (loadError) {
      const revoked = ['invalid_delegate_access', 'delegate_access_expired'].includes(loadError.code);
      showError(loadError.message || 'Nie udało się pobrać panelu.', revoked);
      return false;
    }
  }

  function selectedInviteIds() {
    const leadId = document.getElementById('leadDayClinicalLead').value;
    const selected = [...document.querySelectorAll('#leadInvitees input:checked:not(:disabled)')].map(input => input.value);
    return [...new Set([leadId, ...selected].filter(Boolean))];
  }

  function updateInviteSummary() {
    const count = selectedInviteIds().length;
    document.getElementById('leadInviteSummary').textContent = `Zaproszono ${count} ${count === 1 ? 'osobę' : count < 5 ? 'osoby' : 'osób'}.`;
  }

  function renderInvitees(selectedIds = []) {
    const leadId = document.getElementById('leadDayClinicalLead').value;
    const selected = new Set(selectedIds);
    const isLaser = (currentBlock?.type || snapshot.user.allowedTypes[0]) === 'LASER';
    document.getElementById('leadInvitees').innerHTML = snapshot.team.map(person => {
      const isLead = person.id === leadId;
      return `<label class="invite-option${isLead ? ' is-lead' : ''}"><input type="checkbox" value="${esc(person.id)}" ${isLead || selected.has(person.id) ? 'checked' : ''} ${isLead ? 'disabled' : ''} /><span>${esc(person.name)}${isLead ? `<small>${isLaser ? 'odpowiada za serię' : 'prowadzi'} — dodano automatycznie</small>` : ''}</span></label>`;
    }).join('');
    updateInviteSummary();
  }

  function renderAttendance(block) {
    const section = document.getElementById('leadAttendance');
    if (!block?.id) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    const attendance = block.attendance || { counts: { yes: 0, no: 0, pending: 0 }, items: [] };
    const counts = attendance.counts;
    document.getElementById('leadAttendanceCounts').innerHTML = `<span class="attendance-count attendance-yes"><b>${counts.yes}</b> będzie</span><span class="attendance-count attendance-no"><b>${counts.no}</b> nie może</span><span class="attendance-count attendance-pending"><b>${counts.pending}</b> bez odpowiedzi</span>`;
    document.getElementById('leadAttendanceList').innerHTML = attendance.items.length
      ? attendance.items.map(item => `<li><span><strong>${esc(personName(item.memberId))}</strong>${item.respondedAt ? `<small>odpowiedź ${esc(formatResponseTime(item.respondedAt))}</small>` : ''}</span><span class="attendance-status is-${esc(item.status)}">${item.status === 'yes' ? 'Będzie' : item.status === 'no' ? 'Nie może' : 'Brak odpowiedzi'}</span></li>`).join('')
      : '<li><span>Nie zaproszono jeszcze żadnej osoby.</span></li>';
    const reminder = document.getElementById('leadPrepareReminder');
    reminder.disabled = counts.pending === 0 || block.status === 'Cancelled';
    reminder.textContent = counts.pending ? `Przygotuj przypomnienie (${counts.pending})` : 'Wszyscy już odpowiedzieli';
  }

  function showEditor() {
    tabs.hidden = true;
    views.forEach(view => { view.hidden = true; });
    editor.hidden = false;
    editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function participantCodes() {
    return [...new Set(document.getElementById('leadLaserParticipants').value
      .split(/[\s,;]+/)
      .map(value => value.trim().toUpperCase())
      .filter(Boolean))];
  }

  function laserDates(startDate, total = 10) {
    if (!startDate) return [];
    const date = new Date(`${startDate}T12:00:00Z`);
    if (Number.isNaN(date.getTime()) || date.getUTCDay() === 0) return [];
    const dates = [];
    while (dates.length < total) {
      if (date.getUTCDay() !== 0) dates.push(date.toISOString().slice(0, 10));
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return dates;
  }

  function renderLaserDates() {
    const target = document.getElementById('leadLaserDates');
    if (!laserSeriesMode) {
      target.innerHTML = '';
      return;
    }
    const dates = laserDates(document.getElementById('leadDayDate').value);
    target.innerHTML = dates.length
      ? dates.map((date, index) => `<span>${index + 1}. ${esc(formatDate(date))}</span>`).join('')
      : '<span>Wybierz pierwszy dzień od poniedziałku do soboty.</span>';
  }

  function applyReadOnlyMode() {
    const form = document.getElementById('leadDayForm');
    const interactiveDemo = isDemoMode && laserSeriesMode && !currentBlock;
    form.querySelectorAll('input, select, textarea, button').forEach(control => { control.disabled = isCoordinatorPreview && !interactiveDemo; });
    document.querySelector('.lead-form-actions').hidden = isCoordinatorPreview && !interactiveDemo;
    document.getElementById('leadDaySave').textContent = interactiveDemo ? 'Sprawdź serię bez zapisywania' : laserSeriesMode ? 'Zapisz serię 10 zabiegów' : 'Zapisz termin';
    document.getElementById('leadAfterSave').hidden = true;
    document.getElementById('leadPrepareReminder').hidden = isCoordinatorPreview;
  }

  function openEditor(block = null) {
    currentBlock = block ? clone(block) : null;
    currentSeriesBlocks = [];
    lastChangeCategory = block ? 'research-day-updated' : 'research-day-created';
    document.getElementById('leadDayForm').hidden = false;
    document.getElementById('leadAfterSave').hidden = true;
    laserSeriesMode = !block && snapshot.user.allowedTypes[0] === 'LASER';
    document.getElementById('leadEditorEyebrow').textContent = isCoordinatorPreview ? 'Podgląd terminu' : block ? 'Edycja terminu' : laserSeriesMode ? 'Nowa seria' : 'Nowy termin';
    document.getElementById('leadEditorTitle').textContent = block ? `${formatDate(block.date, true)} · ${typeLabel(block.type)}` : laserSeriesMode ? 'Dodaj serię 10 zabiegów' : `Dodaj ${typeLabel(snapshot.user.allowedTypes[0])}`;
    document.getElementById('leadDayTypeLabel').value = typeLabel(block?.type || snapshot.user.allowedTypes[0]);
    document.getElementById('leadDayDate').value = block?.date || '';
    document.getElementById('leadDayStart').value = block?.startTime || '09:00';
    document.getElementById('leadDayEnd').value = block?.endTime || '13:00';
    document.getElementById('leadDayLocation').value = block?.location || snapshot.blocks[0]?.location || '';
    document.getElementById('leadDayNotes').value = block?.notes || '';
    const isLaser = (block?.type || snapshot.user.allowedTypes[0]) === 'LASER';
    document.getElementById('leadClinicalLeadLabel').textContent = isLaser ? 'Osoba odpowiedzialna za serię zabiegów' : 'Osoba prowadząca część kliniczną';
    document.getElementById('leadLaserSeries').hidden = !isLaser;
    document.getElementById('leadLaserParticipants').value = (block?.participantIds || []).join(', ');
    document.querySelector('#leadLaserSeries h3').textContent = laserSeriesMode ? '10 zabiegów, automatycznie bez niedziel' : 'Uczestnicy tego zabiegu';
    document.getElementById('leadDateLabel').textContent = laserSeriesMode ? 'Pierwszy zabieg' : 'Data';
    document.getElementById('leadDateHint').textContent = isLaser ? 'poniedziałek–sobota, bez niedziel' : 'czwartek lub piątek';
    renderLaserDates();
    const leadSelect = document.getElementById('leadDayClinicalLead');
    leadSelect.innerHTML = snapshot.team.map(person => `<option value="${esc(person.id)}">${esc(person.name)}</option>`).join('');
    leadSelect.value = block?.clinicalLeadId || snapshot.user.id;
    renderInvitees(block?.invitedMemberIds || [snapshot.user.id]);
    const cancelButton = document.getElementById('leadDayCancel');
    cancelButton.hidden = !block;
    cancelButton.textContent = block?.status === 'Cancelled' ? 'Przywróć termin' : 'Odwołaj termin';
    cancelButton.classList.toggle('restore-button', block?.status === 'Cancelled');
    document.getElementById('leadDaySave').disabled = block?.status === 'Cancelled';
    renderAttendance(block);
    applyReadOnlyMode();
    showEditor();
  }

  function closeEditor() {
    editor.hidden = true;
    tabs.hidden = false;
    const active = tabs.querySelector('.active')?.dataset.leadView || 'attention';
    views.forEach(view => { view.hidden = view.dataset.leadPanel !== active; });
    currentBlock = null;
    currentSeriesBlocks = [];
    document.getElementById('leadDayForm').hidden = false;
  }

  function blockFromForm(status = currentBlock?.status || 'Planned') {
    return {
      id: currentBlock?.id || `delegate-${snapshot.user.id}-${Date.now()}`,
      type: currentBlock?.type || snapshot.user.allowedTypes[0],
      date: document.getElementById('leadDayDate').value,
      startTime: document.getElementById('leadDayStart').value,
      endTime: document.getElementById('leadDayEnd').value,
      location: document.getElementById('leadDayLocation').value.trim(),
      clinicalLeadId: document.getElementById('leadDayClinicalLead').value,
      invitedMemberIds: selectedInviteIds(),
      participantIds: (currentBlock?.type || snapshot.user.allowedTypes[0]) === 'LASER' ? participantCodes() : [],
      notes: document.getElementById('leadDayNotes').value.trim(),
      status
    };
  }

  async function persistBlock(block, category) {
    const saveButton = document.getElementById('leadDaySave');
    saveButton.disabled = true;
    setMessage('Zapisywanie terminu…');
    try {
      const oldBlock = currentBlock ? clone(currentBlock) : null;
      const result = await store.saveDelegateDay(accessToken, block, snapshot.revision);
      lastChangeCategory = category;
      await loadData({ quiet: true });
      currentBlock = snapshot.blocks.find(item => item.id === result.blockId) || block;
      openEditor(currentBlock);
      lastChangeCategory = category;
      document.getElementById('leadAfterSave').hidden = false;
      const changedDate = oldBlock && oldBlock.date !== currentBlock.date;
      setMessage(changedDate ? 'Zapisano nową datę. Pamiętaj o przygotowaniu wiadomości do zespołu.' : 'Termin zapisany. Nic nie zostało jeszcze wysłane.');
      return true;
    } catch (saveError) {
      setMessage(saveError.message || 'Nie udało się zapisać terminu.', true);
      if (saveError.code === 'revision_conflict') await loadData({ quiet: true });
      return false;
    } finally {
      saveButton.disabled = currentBlock?.status === 'Cancelled';
    }
  }

  async function persistLaserSeries() {
    const saveButton = document.getElementById('leadDaySave');
    const codes = participantCodes();
    if (!codes.length) {
      setMessage('Wpisz co najmniej jeden pseudonimizowany kod uczestnika.', true);
      return false;
    }
    saveButton.disabled = true;
    setMessage('Zapisywanie 10 terminów laser/sham…');
    try {
      const result = await store.saveDelegateSeries(accessToken, {
        id: `laser-series-${Date.now()}`,
        startDate: document.getElementById('leadDayDate').value,
        startTime: document.getElementById('leadDayStart').value,
        endTime: document.getElementById('leadDayEnd').value,
        location: document.getElementById('leadDayLocation').value.trim(),
        clinicalLeadId: document.getElementById('leadDayClinicalLead').value,
        invitedMemberIds: selectedInviteIds(),
        participantIds: codes,
        notes: document.getElementById('leadDayNotes').value.trim()
      }, snapshot.revision);
      await loadData({ quiet: true });
      currentSeriesBlocks = result.blockIds.map(id => snapshot.blocks.find(block => block.id === id)).filter(Boolean);
      document.getElementById('leadDayForm').hidden = true;
      document.getElementById('leadAfterSaveTitle').textContent = `Zapisano pełną serię: ${currentSeriesBlocks.length} zabiegów.`;
      document.getElementById('leadAfterSaveText').textContent = 'Nic nie zostało jeszcze wysłane. Przygotuj jedną wiadomość, aby każda osoba podała dostępność dla wszystkich swoich terminów.';
      document.getElementById('leadPrepareInvitation').textContent = 'Przygotuj jedną wiadomość o całej serii';
      document.getElementById('leadPrepareInvitation').hidden = false;
      document.getElementById('leadAfterSave').hidden = false;
      setMessage('Seria zapisana. Sprawdź podsumowanie przed wysłaniem wiadomości.');
      return true;
    } catch (saveError) {
      setMessage(saveError.message || 'Nie udało się zapisać serii.', true);
      if (saveError.code === 'revision_conflict') await loadData({ quiet: true });
      return false;
    } finally {
      saveButton.disabled = false;
    }
  }

  function previewLaserSeriesWithoutSaving() {
    const codes = participantCodes();
    const dates = laserDates(document.getElementById('leadDayDate').value);
    if (!codes.length || dates.length !== 10) {
      setMessage('Wpisz kod uczestnika i wybierz pierwszy dzień od poniedziałku do soboty.', true);
      return;
    }
    document.getElementById('leadDayForm').hidden = true;
    document.getElementById('leadAfterSaveTitle').textContent = 'Test zakończony — nic nie zapisano.';
    document.getElementById('leadAfterSaveText').textContent = `Portal utworzyłby 10 zabiegów od ${formatDate(dates[0])} do ${formatDate(dates[9])}, z pominięciem niedziel, dla kodów: ${codes.join(', ')}.`;
    document.getElementById('leadPrepareInvitation').hidden = true;
    document.getElementById('leadAfterSave').hidden = false;
    setMessage('To był wyłącznie podgląd. Kalendarz i e-maile pozostały bez zmian.');
  }

  function seriesInvitationDraft() {
    const blocks = currentSeriesBlocks.slice().sort((a, b) => a.date.localeCompare(b.date));
    const first = blocks[0];
    const last = blocks[blocks.length - 1];
    const schedule = blocks.map(block => `${block.interventionSessionNumber || ''}. ${formatDate(block.date)} · ${block.startTime}–${block.endTime}`).join('\n');
    return {
      clientMessageId: newMessageId('delegate-laser-series-mail'),
      seriesId: first.interventionSeriesId,
      category: 'laser-series-created',
      recipientIds: first.invitedMemberIds.slice(),
      subject: `LEAP — podaj dostępność: seria laser/sham ${formatDate(first.date)}–${formatDate(last.date)}`,
      body: ['Dzień dobry,', '', 'Prosimy o podanie dostępności dla serii zabiegów laser/sham w projekcie LEAP.', '', schedule, '', `Miejsce: ${first.location}`, `Prowadzący/a: ${personName(first.clinicalLeadId)}`, first.notes ? `Ważna informacja: ${first.notes}` : '', '', 'Na końcu wiadomości znajdziesz jeden przycisk. Otwórz go i zaznacz TAK/NIE osobno przy każdym terminie.', '', 'Pozdrawiamy,', 'Zespół LEAP'].join('\n')
    };
  }

  function invitationDraft(category) {
    const block = currentBlock;
    const title = category === 'research-day-created' ? 'nowy dzień badawczy'
      : category === 'research-day-cancelled' ? 'odwołany dzień badawczy'
        : 'zmiana dnia badawczego';
    const action = category === 'research-day-cancelled'
      ? 'Termin został odwołany. Nie przyjeżdżaj na badania w tym terminie.'
      : 'Na końcu wiadomości wybierz „TAK — będę” albo „NIE — nie mogę”.';
    return {
      clientMessageId: newMessageId('delegate-day-mail'),
      blockId: block.id,
      category,
      recipientIds: block.invitedMemberIds.slice(),
      subject: `LEAP — ${title}: ${formatDate(block.date)} (${typeLabel(block.type)})`,
      body: ['Dzień dobry,', '', category === 'research-day-created' ? 'Zapraszamy na dzień badawczy LEAP.' : category === 'research-day-cancelled' ? 'Informujemy o odwołaniu dnia badawczego LEAP.' : 'Zmieniliśmy szczegóły dnia badawczego LEAP.', '', `Data: ${formatDate(block.date)}`, `Godzina: ${block.startTime}–${block.endTime}`, `Rodzaj dnia: ${typeLabel(block.type)}`, `Miejsce: ${block.location}`, `Prowadzący/a: ${personName(block.clinicalLeadId)}`, block.notes ? `Ważna informacja: ${block.notes}` : '', '', action, '', 'Pozdrawiamy,', 'Zespół LEAP'].join('\n')
    };
  }

  function reminderDraft() {
    const pendingIds = (currentBlock.attendance?.items || []).filter(item => item.status === 'pending').map(item => item.memberId);
    return {
      clientMessageId: newMessageId('delegate-reminder-mail'),
      blockId: currentBlock.id,
      category: 'research-day-reminder',
      recipientIds: pendingIds,
      subject: `LEAP — prosimy o potwierdzenie obecności: ${formatDate(currentBlock.date)} (${typeLabel(currentBlock.type)})`,
      body: ['Dzień dobry,', '', 'Nie mamy jeszcze Twojej odpowiedzi dotyczącej dnia badawczego LEAP.', '', `Data: ${formatDate(currentBlock.date)}`, `Godzina: ${currentBlock.startTime}–${currentBlock.endTime}`, `Rodzaj dnia: ${typeLabel(currentBlock.type)}`, `Miejsce: ${currentBlock.location}`, `Prowadzący/a: ${personName(currentBlock.clinicalLeadId)}`, '', 'Na końcu wiadomości wybierz „TAK — będę” albo „NIE — nie mogę”.', '', 'Pozdrawiamy,', 'Zespół LEAP'].join('\n')
    };
  }

  function openMail(draft) {
    if (!draft?.recipientIds?.length) {
      setMessage('Brak osób, do których można przygotować tę wiadomość.', true);
      return;
    }
    mailDraft = draft;
    document.getElementById('leadMailRecipients').textContent = draft.recipientIds.map(personName).join(', ');
    document.getElementById('leadMailSubject').value = draft.subject;
    document.getElementById('leadMailBody').value = draft.body;
    document.getElementById('leadMailStatus').textContent = '';
    document.getElementById('leadMailSend').disabled = false;
    mailDialog.showModal();
  }

  function closeMail() {
    mailDialog.close();
    mailDraft = null;
  }

  document.getElementById('leadLogout').addEventListener('click', () => {
    if (isCoordinatorPreview) {
      location.href = 'portal-coordinator.html?v=20260813-4';
      return;
    }
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    try { sessionStorage.removeItem(TOKEN_KEY); } catch {}
    if (snapshot?.user?.id) {
      try { localStorage.removeItem(memberTokenKey(snapshot.user.id)); } catch {}
      try { sessionStorage.removeItem(memberTokenKey(snapshot.user.id)); } catch {}
    }
    accessToken = '';
    location.reload();
  });
  document.getElementById('leadAddDay').addEventListener('click', () => openEditor());
  document.getElementById('leadRefresh').addEventListener('click', async () => {
    setMessage('Odświeżanie…');
    if (await loadData({ quiet: true })) setMessage('Dane są aktualne.');
  });
  tabs.addEventListener('click', event => {
    const button = event.target.closest('[data-lead-view]');
    if (!button) return;
    tabs.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
    views.forEach(view => { view.hidden = view.dataset.leadPanel !== button.dataset.leadView; });
  });
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-open-day]');
    if (!button) return;
    const block = snapshot.blocks.find(item => item.id === button.dataset.openDay);
    if (block) openEditor(block);
  });
  document.getElementById('leadEditorClose').addEventListener('click', closeEditor);
  document.getElementById('leadDayClinicalLead').addEventListener('change', () => renderInvitees(selectedInviteIds()));
  document.getElementById('leadDayDate').addEventListener('change', renderLaserDates);
  document.getElementById('leadInvitees').addEventListener('change', updateInviteSummary);
  document.getElementById('leadInviteAll').addEventListener('click', () => {
    document.querySelectorAll('#leadInvitees input:not(:disabled)').forEach(input => { input.checked = true; });
    updateInviteSummary();
  });
  document.getElementById('leadInviteNone').addEventListener('click', () => {
    document.querySelectorAll('#leadInvitees input:not(:disabled)').forEach(input => { input.checked = false; });
    updateInviteSummary();
  });
  document.getElementById('leadDayForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (isCoordinatorPreview && !isDemoMode) return;
    if (!event.target.reportValidity()) return;
    if (isDemoMode) {
      previewLaserSeriesWithoutSaving();
      return;
    }
    if (laserSeriesMode) {
      await persistLaserSeries();
      return;
    }
    const block = blockFromForm();
    const category = currentBlock ? 'research-day-updated' : 'research-day-created';
    await persistBlock(block, category);
  });
  document.getElementById('leadDayCancel').addEventListener('click', async () => {
    if (!currentBlock) return;
    const restoring = currentBlock.status === 'Cancelled';
    const question = restoring
      ? `Przywrócić termin ${formatDate(currentBlock.date)}?`
      : `Odwołać termin ${formatDate(currentBlock.date)}? Termin pozostanie w historii.`;
    if (!confirm(question)) return;
    await persistBlock(blockFromForm(restoring ? 'Planned' : 'Cancelled'), restoring ? 'research-day-updated' : 'research-day-cancelled');
  });
  document.getElementById('leadPrepareInvitation').addEventListener('click', () => openMail(currentSeriesBlocks.length ? seriesInvitationDraft() : invitationDraft(lastChangeCategory)));
  document.getElementById('leadAttendanceRefresh').addEventListener('click', async () => {
    if (!currentBlock) return;
    try {
      if (isCoordinatorPreview) {
        const currentId = currentBlock.id;
        await loadData({ quiet: true });
        currentBlock = snapshot.blocks.find(block => block.id === currentId) || currentBlock;
        renderAttendance(currentBlock);
        setMessage('Lista obecności została odświeżona.');
        return;
      }
      const attendance = await store.getDelegateAttendance(accessToken, currentBlock.id);
      currentBlock.attendance = { items: attendance.items, counts: attendance.counts };
      renderAttendance(currentBlock);
      setMessage('Lista obecności została odświeżona.');
    } catch (attendanceError) {
      setMessage(attendanceError.message || 'Nie udało się odświeżyć odpowiedzi.', true);
    }
  });
  document.getElementById('leadPrepareReminder').addEventListener('click', () => openMail(reminderDraft()));
  document.getElementById('leadMailClose').addEventListener('click', closeMail);
  document.getElementById('leadMailCancel').addEventListener('click', closeMail);
  document.getElementById('leadMailForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!mailDraft || !event.target.reportValidity()) return;
    const sendButton = document.getElementById('leadMailSend');
    const mailStatus = document.getElementById('leadMailStatus');
    sendButton.disabled = true;
    mailStatus.textContent = 'Wysyłanie wiadomości…';
    try {
      const send = mailDraft.seriesId ? store.sendDelegateSeriesEmail : store.sendDelegateEmail;
      const result = await send(accessToken, {
        ...mailDraft,
        subject: document.getElementById('leadMailSubject').value.trim(),
        body: document.getElementById('leadMailBody').value.trim()
      });
      mailStatus.textContent = `Wysłano do ${result.sentCount} ${result.sentCount === 1 ? 'osoby' : 'osób'}.`;
      await loadData({ quiet: true });
      if (mailDraft.blockId) {
        currentBlock = snapshot.blocks.find(block => block.id === mailDraft.blockId) || currentBlock;
        renderAttendance(currentBlock);
      }
      setTimeout(closeMail, 1100);
    } catch (mailError) {
      mailStatus.textContent = mailError.message || 'Nie udało się wysłać wiadomości.';
      sendButton.disabled = false;
    }
  });

  loadData();
})();
