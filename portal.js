(() => {
  'use strict';

  const PASSWORD_HASH = 'fa2eb8dbb6273a2d1651d349b10d9e1beff7580bd89381a5b1e0d1a12fdd1b73';
  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const VERSION = '20260805-3';
  const COORDINATOR_VIEWS = new Set([
    'dashboard', 'participants', 'schedule', 'stations', 'modules', 'team',
    'competencies', 'data-quality', 'documents', 'admin'
  ]);
  const DATA_KEY = 'leap-portal-demo-data-v1';
  const ROLE_KEY = 'leap-portal-demo-role';
  const clone = value => JSON.parse(JSON.stringify(value));

  const viewTitles = {
    home: 'Start', 'research-days': 'Dni badawcze', duties: 'Obowiązki badaczy',
    dashboard: 'Panel koordynatorów', participants: 'Uczestnicy', schedule: 'Harmonogram szczegółowy',
    stations: 'T0 / W12', modules: 'Moduły', team: 'Zespół',
    competencies: 'Kompetencje', 'data-quality': 'Data Quality',
    documents: 'SOP i dokumenty', admin: 'Administracja'
  };

  const statusLabels = {
    Active: 'Aktywny', Conditional: 'Warunkowy', Backup: 'Zastępstwo',
    Onboarding: 'Wdrożenie', Unavailable: 'Niedostępny', Vacant: 'Wakat',
    'Not trained': 'Brak szkolenia', Training: 'Szkolenie', Observed: 'Obserwacja',
    Supervised: 'Nadzorowany', Certified: 'Certyfikowany',
    'Audit required': 'Wymaga audytu', Suspended: 'Zawieszony',
    'Not started': 'Nierozpoczęty', Planned: 'Zaplanowany', Confirmed: 'Potwierdzony',
    'In progress': 'W toku', Completed: 'Zakończony', Incomplete: 'Niekompletny',
    Overdue: 'Po terminie', Paused: 'Wstrzymany', Withdrawn: 'Wycofany',
    'Not applicable': 'Nie dotyczy', Open: 'Otwarte', Resolved: 'Rozwiązane',
    Screening: 'Screening', Candidate: 'Kandydat', Draft: 'Wersja robocza',
    Archived: 'Archiwalny', Mixed: 'Mieszany', 'Healthy control': 'Zdrowa kontrola',
    'Ready with warnings': 'Gotowy z ostrzeżeniami', 'Staffing gap': 'Braki obsady',
    Ready: 'Gotowy'
  };

  const els = {
    loginView: document.getElementById('loginView'),
    appShell: document.getElementById('appShell'),
    loginForm: document.getElementById('loginForm'),
    password: document.getElementById('portalPassword'),
    passwordToggle: document.getElementById('passwordToggle'),
    loginButton: document.getElementById('loginButton'),
    loginStatus: document.getElementById('loginStatus'),
    appContent: document.getElementById('appContent'),
    appNav: document.getElementById('appNav'),
    topbarTitle: document.getElementById('topbarTitle'),
    dateRange: document.getElementById('dateRange'),
    roleSwitcher: document.getElementById('roleSwitcher'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    userChip: document.getElementById('userChip'),
    search: document.getElementById('globalSearch'),
    searchResults: document.getElementById('searchResults'),
    notificationButton: document.getElementById('notificationButton'),
    notificationCount: document.getElementById('notificationCount'),
    dqNavCount: document.getElementById('dqNavCount'),
    sidebar: document.getElementById('sidebar'),
    menuButton: document.getElementById('menuButton'),
    sidebarClose: document.getElementById('sidebarClose'),
    sidebarBackdrop: document.getElementById('sidebarBackdrop'),
    drawer: document.getElementById('detailDrawer'),
    drawerContent: document.getElementById('drawerContent'),
    drawerClose: document.getElementById('drawerClose'),
    drawerBackdrop: document.getElementById('drawerBackdrop'),
    modalBackdrop: document.getElementById('modalBackdrop'),
    modalContent: document.getElementById('modalContent'),
    modalClose: document.getElementById('modalClose'),
    toastRegion: document.getElementById('toastRegion'),
    logoutButton: document.getElementById('logoutButton')
  };

  const loadData = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(DATA_KEY));
      if (stored?.version === window.LEAP_DEMO_DATA.version) return stored;
    } catch { /* use initial data */ }
    return clone(window.LEAP_DEMO_DATA);
  };

  const state = {
    data: loadData(), view: 'dashboard',
    roleId: localStorage.getItem(ROLE_KEY) || 'pi-admin',
    selectedBlockId: 'block-001', moduleTab: 'LLLT/sham',
    scheduleMode: 'list', competencyGroup: 'core',
    sort: { participants: ['id', 'asc'], queries: ['dueDate', 'asc'] },
    filters: {
      participantSearch: '', participantStatus: 'all', participantDiagnosis: 'all',
      teamStatus: 'all', teamCategory: 'all', queryStatus: 'all', queryType: 'all',
      documentStatus: 'Active', documentCategory: 'all'
    }
  };

  const saveData = () => localStorage.setItem(DATA_KEY, JSON.stringify(state.data));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const initials = name => name === 'VACANT' ? '—' : name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const member = id => state.data.team.find(item => item.id === id);
  const participant = id => state.data.participants.find(item => item.id === id);
  const station = id => state.data.stations.find(item => item.id === id) || ({ id, name: id, short: id.slice(0, 4).toUpperCase() });
  const memberName = id => member(id)?.name || 'Nieprzypisano';
  const formatDate = value => value ? new Intl.DateTimeFormat('pl-PL', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : '—';
  const formatDay = value => value ? new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(`${value}T12:00:00`)) : '—';
  const badgeClass = value => {
    if (['Active', 'Completed', 'Certified', 'Ready'].includes(value)) return 'badge-green';
    if (['Overdue', 'Critical', 'Suspended', 'Staffing gap'].includes(value)) return 'badge-red';
    if (['Conditional', 'Training', 'Observed', 'Supervised', 'Audit required', 'Ready with warnings', 'Incomplete'].includes(value)) return 'badge-amber';
    if (['In progress', 'Confirmed', 'Screening'].includes(value)) return 'badge-blue';
    if (['Backup', 'Planned', 'Draft'].includes(value)) return 'badge-purple';
    return 'badge-gray';
  };
  const badge = value => `<span class="status-badge ${badgeClass(value)}">${esc(statusLabels[value] || value)}</span>`;
  const avatar = person => `<span class="avatar">${esc(initials(person?.name || '—'))}</span>`;
  const personCell = id => {
    const person = member(id);
    return person ? `<div class="person-cell">${avatar(person)}<span><strong>${esc(person.name)}</strong><small>${esc(person.primaryRole)}</small></span></div>` : '<span class="muted">Nieprzypisano</span>';
  };
  const progress = (value, label = '', kind = '') => `<div class="progress-label"><span>${esc(label)}</span><strong>${Number(value)}%</strong></div><div class="progress ${kind}"><span style="width:${Math.max(0, Math.min(100, Number(value)))}%"></span></div>`;

  const permissions = {
    'pi-admin': new Set(['all']),
    operations: new Set(['create-block', 'assign-staff', 'add-task', 'add-query', 'update-stage', 'edit-schedule']),
    'module-owner': new Set(['add-task', 'add-query', 'edit-module', 'resolve-query', 'ack-sop']),
    assessor: new Set(['complete-assignment', 'add-query', 'ack-sop']),
    unblinded: new Set(['edit-lllt', 'add-query', 'ack-sop']),
    viewer: new Set(['read'])
  };
  const can = action => permissions[state.roleId]?.has('all') || permissions[state.roleId]?.has(action);
  const activeRole = () => state.data.roles.find(role => role.id === state.roleId) || state.data.roles[0];
  const activeUser = () => member(activeRole().memberId) || state.data.team[0];

  const pageHeader = (title, description, actions = '') => `
    <header class="page-header">
      <div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </header>`;

  const sortRows = (rows, field, direction) => [...rows].sort((a, b) => {
    const left = String(a[field] ?? '').toLocaleLowerCase('pl');
    const right = String(b[field] ?? '').toLocaleLowerCase('pl');
    return left.localeCompare(right, 'pl', { numeric: true }) * (direction === 'asc' ? 1 : -1);
  });

  const assignmentsFor = (block, memberId) => block.stationAssignments.filter(item =>
    item.memberId === memberId || item.backupMemberId === memberId
  );

  function renderResearchDays() {
    const user = activeUser();
    const actions = `<button class="secondary-button" data-view="schedule">Widok szczegółowy</button>
      ${can('create-block') ? '<button class="primary-button" data-action="create-block">＋ Dodaj blok</button>' : ''}`;
    return `
      ${pageHeader('Harmonogram dni badawczych', 'Prosty widok terminów dla całego zespołu. Rozwiń wybrany dzień, jeśli potrzebujesz obsady, uczestników lub uwag.', actions)}
      <section class="cadence-banner">
        <div><span>Stały rytm projektu</span><strong>Czwartki · 10:00–13:00</strong></div>
        <div><span>Drugi dzień badawczy</span><strong>Piątki · 09:00–13:00</strong><small>czasami do 14:00</small></div>
        <div><span>Lokalizacja</span><strong>GUMed · budynek 15</strong><small>II piętro</small></div>
      </section>
      <div class="research-days-list">
        ${state.data.blocks.map((block, index) => {
          const userAssignments = assignmentsFor(block, user.id);
          const isLead = block.clinicalLeadId === user.id;
          const assignmentText = isLead
            ? 'Pełnisz funkcję Clinical Leada tego bloku.'
            : userAssignments.length
              ? userAssignments.map(item => `${item.memberId === user.id ? 'Operator' : 'Zastępca'}: ${station(item.stationId).name} (${item.startTime}–${item.endTime})`).join(' · ')
              : 'Nie masz jeszcze przypisanej stacji w tym bloku.';
          return `<details class="research-day-card" ${index === 0 ? 'open' : ''}>
            <summary>
              <span class="research-date"><strong>${new Date(`${block.date}T12:00:00`).getDate()}</strong><small>${new Date(`${block.date}T12:00:00`).toLocaleDateString('pl-PL', { month: 'short' })}</small></span>
              <span class="research-summary"><small>${formatDay(block.date)}</small><strong>${esc(block.type)} · ${esc(block.startTime)}–${esc(block.endTime)}</strong><span>${block.participantIds.length} uczestników · ${esc(memberName(block.clinicalLeadId))}</span></span>
              <span class="research-status">${badge(block.status)}<small>${block.readinessScore}% gotowości</small></span>
              <span class="details-chevron">⌄</span>
            </summary>
            <div class="research-day-body">
              <div class="research-day-main">
                <div class="assignment-for-me ${(isLead || userAssignments.length) ? 'has-assignment' : ''}">
                  <span>Twój udział</span><strong>${esc(assignmentText)}</strong>
                </div>
                <div class="research-facts">
                  <div><span>Miejsce</span><strong>${esc(block.location)}</strong></div>
                  <div><span>Uczestnicy</span><strong class="mono">${block.participantIds.map(esc).join(', ')}</strong></div>
                  <div><span>Uwagi</span><strong>${esc(block.notes)}</strong></div>
                </div>
              </div>
              <div class="research-day-side">
                <span>Obsadzone stanowiska</span><strong>${block.stationAssignments.length}</strong>
                <span>Clinical lead</span><b>${esc(memberName(block.clinicalLeadId))}</b>
                <button class="secondary-button" data-block="${block.id}" data-view="stations">Zobacz pełną obsadę</button>
              </div>
            </div>
          </details>`;
        }).join('')}
      </div>`;
  }

  function renderDuties() {
    const user = activeUser();
    const backup = member(user.backupMemberId);
    const personalTasks = state.data.tasks.filter(task => task.ownerId === user.id && task.status !== 'Completed');
    const priority = ['pi','magda','karol','filip','maciej','alicja','natalia','weronika','julia','data-qc-vacant'];
    const people = [...state.data.team].sort((a, b) => {
      const left = priority.includes(a.id) ? priority.indexOf(a.id) : priority.length;
      const right = priority.includes(b.id) ? priority.indexOf(b.id) : priority.length;
      return left - right || a.name.localeCompare(b.name, 'pl');
    });
    return `
      ${pageHeader('Obowiązki badaczy', 'Najpierw Twój zakres i najbliższe zadania, niżej pełna mapa odpowiedzialności w projekcie.',
        '<button class="secondary-button" data-view="team">Pełny widok zespołu</button>')}
      <section class="my-duties-panel">
        <div class="my-duties-identity">
          ${avatar(user)}
          <div><span>Twój zakres w aktualnym widoku</span><h2>${esc(user.name)}</h2><p>${esc(user.primaryRole)}</p></div>
          ${badge(user.status)}
        </div>
        <div class="my-duties-columns">
          <div><h3>Za co odpowiadasz</h3><ul class="check-list">${user.responsibilities.map(item => `<li>${esc(item)}</li>`).join('')}</ul></div>
          <div><h3>Organizacja pracy</h3>
            <dl class="compact-definition">
              <div><dt>Dostępność</dt><dd>${esc(user.availability.join(' / '))}</dd></div>
              <div><dt>Zastępstwo</dt><dd>${esc(backup?.name || 'Nie wskazano')}</dd></div>
              <div><dt>Otwarte zadania</dt><dd>${personalTasks.length}</dd></div>
            </dl>
            ${personalTasks.length ? `<ul class="personal-task-list">${personalTasks.map(task => `<li><span class="priority priority-${task.priority.toLowerCase()}"></span><div><strong>${esc(task.subject)}</strong><small>${esc(task.description)} · do ${formatDate(task.dueDate)}</small></div></li>`).join('')}</ul>` : '<p class="muted tiny">Brak otwartych zadań przypisanych do tej osoby.</p>'}
          </div>
        </div>
      </section>

      <div class="section-heading"><div><h2>Kto za co odpowiada?</h2><p>Rozwiń wybraną osobę, aby zobaczyć zakres odpowiedzialności.</p></div><span class="status-badge badge-gray">${people.length} ról</span></div>
      <div class="responsibility-directory">
        ${people.map(person => `<details class="responsibility-card" ${person.id === user.id ? 'open' : ''}>
          <summary>${avatar(person)}<span><strong>${esc(person.name)}</strong><small>${esc(person.primaryRole)}</small></span>${badge(person.status)}<i>⌄</i></summary>
          <div class="responsibility-body">
            <p>${esc(person.notesPublic)}</p>
            <ul class="check-list compact">${person.responsibilities.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
            <div class="responsibility-footer"><span>Dostępność: <strong>${esc(person.availability.join(' / '))}</strong></span><span>Zastępca: <strong>${esc(memberName(person.backupMemberId))}</strong></span>
              <button class="text-button" data-member="${person.id}">Pełny profil →</button></div>
          </div>
        </details>`).join('')}
      </div>`;
  }

  function renderDashboard() {
    const active = state.data.participants.filter(item => item.status === 'Active').length;
    const screening = state.data.participants.filter(item => ['Screening', 'Candidate'].includes(item.status)).length;
    const visits = state.data.blocks.filter(block => block.date >= '2026-07-31' && block.date <= '2026-08-14').length;
    const lllt = state.data.moduleRecords.filter(record => record.moduleType === 'LLLT/sham' && record.status === 'In progress').length;
    const rehab = state.data.moduleRecords.filter(record => record.moduleType.startsWith('REHAB') && record.status === 'In progress').length;
    const w12 = state.data.participants.filter(item => item.currentStage === 'REHAB W12').length;
    const follow = state.data.moduleRecords.filter(record => record.moduleType === 'Follow-up' && record.status === 'Overdue').length;
    const queries = state.data.dataQueries.filter(query => query.status !== 'Resolved').length;
    const deviations = state.data.dataQueries.filter(query => query.issueType === 'protocol deviation' && query.status !== 'Resolved').length;
    const adverse = state.data.dataQueries.filter(query => query.issueType.includes('adverse event') && query.status !== 'Resolved').length;
    const metrics = [
      ['Aktywni uczestnicy', active, 'Łącznie w aktywnych ścieżkach', ''],
      ['Kandydaci w screeningu', screening, 'Wymagają kolejnego kroku', ''],
      ['Wizyty — 14 dni', visits, 'Czwartki i piątki', ''],
      ['W LLLT/sham', lllt, 'Aktywna interwencja', ''],
      ['W REHAB', rehab, 'OSD + Sever', ''],
      ['W12 do wykonania', w12, 'Najbliższe 14 dni', 'warning'],
      ['Follow-up overdue', follow, 'Poza oknem kontaktu', 'alert'],
      ['Otwarte braki danych', queries, 'Wszystkie moduły', queries ? 'warning' : ''],
      ['Protocol deviations', deviations, 'Nierozwiązane', deviations ? 'warning' : ''],
      ['Otwarte adverse events', adverse, 'Wymagają klasyfikacji', adverse ? 'alert' : '']
    ];
    const tasks = state.data.tasks.filter(task => task.status !== 'Completed');
    const quick = [
      ['create-block', 'Dodaj blok badawczy', 'create-block'],
      ['assign-staff', 'Przypisz badaczy', 'assign-staff'],
      ['add-task', 'Dodaj zadanie', 'add-task'],
      ['add-query', 'Zgłoś brak danych', 'add-query'],
      ['add-query', 'Zgłoś deviation', 'add-deviation'],
      ['add-sop', 'Dodaj SOP', 'add-sop'],
      ['manage-training', 'Oznacz szkolenie jako ukończone', 'manage-training']
    ].filter(([permission]) => can(permission)).map(([, label, action]) => `<button type="button" data-action="${action}">＋ ${esc(label)}</button>`).join('');
    return `
      ${pageHeader('Dashboard operacyjny', 'Co obecnie dzieje się w projekcie, co jest zaplanowane i co wymaga działania?')}
      <div class="metrics-grid">${metrics.map(([label, value, note, kind]) => `
        <article class="metric-card ${kind}"><div class="metric-top"><span class="metric-label">${esc(label)}</span><span class="metric-icon">·</span></div>
        <div class="metric-value">${value}</div><div class="metric-note">${esc(note)}</div></article>`).join('')}</div>
      <div class="dashboard-grid">
        <section class="card">
          <div class="card-header"><h2>Wymaga działania</h2><button class="text-button" data-view="data-quality">Wszystkie problemy →</button></div>
          <div class="card-body"><ul class="action-list">${tasks.slice(0, 6).map(task => `
            <li class="action-item"><span class="priority priority-${task.priority.toLowerCase()}"></span>
              <div class="action-main"><strong>${esc(task.subject)}</strong><p>${esc(task.description)}</p></div>
              <div class="action-owner">${esc(memberName(task.ownerId))}</div><div class="action-due">${formatDate(task.dueDate)}</div>
              <button class="secondary-button" data-task="${task.id}">Otwórz</button></li>`).join('')}</ul></div>
        </section>
        <div class="dashboard-stack">
          <section class="card"><div class="card-header"><h2>Szybkie akcje</h2></div><div class="card-body"><div class="quick-actions">${quick || '<p class="muted tiny">Brak akcji dla bieżącej roli.</p>'}</div></div></section>
          <section class="card"><div class="card-header"><h2>Weekly Operations · 20 min</h2><span class="status-badge badge-blue">Najbliższa: 3 sie</span></div>
            <div class="card-body"><ol class="weekly-list">${['Nowi kandydaci', 'Uczestnicy, którzy utknęli', 'Następne 14 dni', 'Braki danych', 'Staffing', 'AE / deviations'].map(item => `<li>${item}</li>`).join('')}</ol></div></section>
        </div>
      </div>
      <div class="section-heading"><h2>Najbliższe bloki badawcze</h2><button class="text-button" data-view="research-days">Harmonogram dla badaczy →</button></div>
      <div class="block-list">${state.data.blocks.slice(0, 5).map(blockCard).join('')}</div>`;
  }

  function blockCard(block) {
    const missing = Math.max(0, 8 - block.stationAssignments.length);
    const date = new Date(`${block.date}T12:00:00`);
    return `<article class="block-row">
      <div class="block-date"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString('pl-PL', { month: 'short' })}</span></div>
      <div class="block-main"><strong>${esc(block.type)} · ${esc(block.startTime)}–${esc(block.endTime)}</strong>
        <p>${block.participantIds.length} uczestników · Clinical lead: ${esc(memberName(block.clinicalLeadId))} · ${missing} nieobsadzonych stacji</p></div>
      <div class="block-readiness">${progress(block.readinessScore, 'Gotowość', block.readinessScore < 70 ? 'danger' : block.readinessScore < 85 ? 'warning' : '')}
        <button class="text-button" data-block="${block.id}" data-view="stations">Otwórz</button></div></article>`;
  }

  function renderParticipants() {
    const f = state.filters;
    let rows = state.data.participants.filter(item =>
      (!f.participantSearch || `${item.id} ${item.sport} ${item.currentStage}`.toLowerCase().includes(f.participantSearch.toLowerCase())) &&
      (f.participantStatus === 'all' || item.status === f.participantStatus) &&
      (f.participantDiagnosis === 'all' || item.diagnosis === f.participantDiagnosis)
    );
    rows = sortRows(rows, ...state.sort.participants);
    return `
      ${pageHeader('Uczestnicy', 'Operacyjny widok ścieżki uczestnika. Wyłącznie identyfikatory badania — bez danych osobowych.',
        can('add-task') ? '<button class="secondary-button" data-action="add-task">＋ Dodaj zadanie</button>' : '')}
      <div class="participant-summary">
        <div class="summary-tile"><strong>${state.data.participants.length}</strong><span>Wszystkie rekordy demo</span></div>
        <div class="summary-tile"><strong>${state.data.participants.filter(p => p.cohort === 'Clinical').length}</strong><span>Kohorta kliniczna</span></div>
        <div class="summary-tile"><strong>${state.data.participants.filter(p => p.cohort === 'Healthy control').length}</strong><span>Zdrowe kontrole</span></div>
        <div class="summary-tile"><strong>${state.data.participants.filter(p => p.alerts.length).length}</strong><span>Z alertami</span></div>
      </div>
      <div class="filter-bar">
        <label for="participantFilter">Szukaj</label><input id="participantFilter" data-filter="participantSearch" value="${esc(f.participantSearch)}" placeholder="ID, sport lub etap" />
        <label for="participantStatus">Status</label><select id="participantStatus" data-filter="participantStatus">${options(['all','Active','Screening','Candidate'], f.participantStatus)}</select>
        <label for="participantDiagnosis">Grupa</label><select id="participantDiagnosis" data-filter="participantDiagnosis">${options(['all','OSD','Sever','Healthy'], f.participantDiagnosis)}</select>
      </div>
      <section class="card"><div class="data-table-wrap"><table class="data-table">
        <thead><tr><th><button class="sortable" data-sort-view="participants" data-sort="id">ID ↕</button></th><th>Badanie</th><th>Grupa</th><th>Wiek / płeć</th><th>Sport</th><th>Aktualny etap</th><th>Właściciel</th><th>Kompletność</th><th>Alerty</th><th></th></tr></thead>
        <tbody>${rows.map(item => {
          const completed = item.timeline.filter(stage => stage.status === 'Completed').length;
          const completeness = Math.round(completed / item.timeline.length * 100);
          return `<tr><td><button class="link-button mono" data-participant="${item.id}">${esc(item.id)}</button></td>
            <td>${esc(item.studyId)}</td><td>${esc(item.diagnosis)}</td><td>${esc(item.ageBand)} · ${esc(item.sex)}</td><td>${esc(item.sport)}</td>
            <td>${badge(item.status)}<div class="tiny muted">${esc(item.currentStage)}</div></td><td>${esc(memberName(item.operationsCoordinatorId))}</td>
            <td style="min-width:120px">${progress(completeness, '')}</td><td><div class="alert-chips">${item.alerts.map(alert => `<span class="alert-chip">${esc(alert)}</span>`).join('') || '—'}</div></td>
            <td><button class="secondary-button" data-participant="${item.id}">Otwórz</button></td></tr>`;
        }).join('') || emptyRow(10, 'Brak uczestników spełniających kryteria.')}</tbody>
      </table></div></section>`;
  }

  function options(values, selected, labels = {}) {
    return values.map(value => `<option value="${esc(value)}" ${value === selected ? 'selected' : ''}>${esc(labels[value] || statusLabels[value] || (value === 'all' ? 'Wszystkie' : value))}</option>`).join('');
  }
  const emptyRow = (cols, text) => `<tr><td colspan="${cols}"><div class="empty-state"><strong>Brak wyników</strong><span>${esc(text)}</span></div></td></tr>`;

  function renderSchedule() {
    const actions = `${can('create-block') ? '<button class="primary-button" data-action="create-block">＋ Dodaj blok badawczy</button>' : ''}
      <div class="segmented"><button data-schedule-mode="list" class="${state.scheduleMode === 'list' ? 'active' : ''}">Lista</button><button data-schedule-mode="week" class="${state.scheduleMode === 'week' ? 'active' : ''}">Tydzień</button></div>`;
    const content = state.scheduleMode === 'week'
      ? `<div class="schedule-week">${state.data.blocks.map(block => `<section class="day-column"><header><strong>${formatDay(block.date)}</strong><span>${esc(block.startTime)}–${esc(block.endTime)}</span></header>
          <article class="calendar-block"><strong>${esc(block.type)}</strong><p>${block.participantIds.length} uczestników</p><p>${esc(memberName(block.clinicalLeadId))}</p>
          <button class="text-button" data-block="${block.id}" data-view="stations">Obsada →</button></article></section>`).join('')}</div>`
      : `<section class="card"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Data</th><th>Godziny</th><th>Typ</th><th>Uczestnicy</th><th>Clinical lead</th><th>Obsada</th><th>Gotowość</th><th>Status</th><th></th></tr></thead>
        <tbody>${state.data.blocks.map(block => `<tr><td><strong>${formatDay(block.date)}</strong></td><td class="mono">${block.startTime}–${block.endTime}</td><td>${esc(block.type)}</td>
          <td>${block.participantIds.length}</td><td>${personCell(block.clinicalLeadId)}</td><td>${block.stationAssignments.length} stacji</td>
          <td style="min-width:120px">${progress(block.readinessScore, '')}</td><td>${badge(block.status)}</td>
          <td><button class="secondary-button" data-block="${block.id}" data-view="stations">Otwórz</button></td></tr>`).join('')}</tbody></table></div></section>`;
    return `${pageHeader('Szczegółowy harmonogram bloków', 'Czwartki 10:00–13:00; piątki 09:00–13:00, czasami do 14:00.', actions)}
      <div class="card" style="margin-bottom:15px"><div class="card-body"><strong class="tiny">Stała lokalizacja</strong><p class="muted tiny">${esc(state.data.meta.location)}</p></div></div>${content}`;
  }

  function renderStations() {
    const selected = state.data.blocks.find(block => block.id === state.selectedBlockId) || state.data.blocks[0];
    const displayStations = ['registration','prom','anthropometry','rom','beighton','pain-provocation','ybt','hhd-q','opencap-recording','t1-blinded','crf'];
    return `
      ${pageHeader('Obsada stacji T0 / W12', 'Każda stacja ma konkretnego operatora, godziny i zastępcę. System sprawdza certyfikację i konflikty.',
        can('create-block') ? '<button class="primary-button" data-action="create-block">＋ Nowy blok</button>' : '')}
      <div class="block-selector">${state.data.blocks.map(block => `<button data-select-block="${block.id}" class="${block.id === selected.id ? 'active' : ''}">
        <strong>${formatDay(block.date)} · ${esc(block.type)}</strong><small>${esc(block.startTime)}–${esc(block.endTime)} · ${block.participantIds.length} uczestników</small></button>`).join('')}</div>
      <section class="block-overview"><div><h2>${formatDay(selected.date)} · ${esc(selected.type)} · ${esc(selected.startTime)}–${esc(selected.endTime)}</h2>
        <p>${esc(selected.location)}</p><p>Clinical lead: <strong>${esc(memberName(selected.clinicalLeadId))}</strong> · ${selected.rooms} pomieszczenia · ${esc(selected.notes)}</p>
        <div style="margin-top:8px">${badge(selected.status)}</div></div><div class="readiness-ring" style="--score:${selected.readinessScore}%"><strong>${selected.readinessScore}%</strong></div></section>
      <div class="station-board">${displayStations.map(stationId => {
        const item = station(stationId);
        const assignment = selected.stationAssignments.find(row => row.stationId === stationId);
        if (!assignment) return `<article class="station-row unfilled"><div class="station-name"><strong>${esc(item.name)}</strong><small>${esc(item.short)}</small></div>
          <div class="warning-line">⚠ Stacja nieobsadzona</div><span></span><span></span>
          ${can('assign-staff') ? `<button class="secondary-button" data-assign="${selected.id}:${stationId}">Przypisz</button>` : '<span class="muted tiny">Brak przydziału</span>'}</article>`;
        const comp = state.data.competencies.find(record => record.memberId === assignment.memberId && record.stationId === assignment.stationId);
        return `<article class="station-row"><div class="station-name"><strong>${esc(item.name)}</strong><small>${assignment.participantIds.map(esc).join(', ')}</small></div>
          <div class="station-person">${avatar(member(assignment.memberId))}<div><strong>${esc(memberName(assignment.memberId))}</strong><div>${badge(comp?.status || assignment.competencyStatusAtAssignment)}</div></div></div>
          <div class="station-time mono">${assignment.startTime}–${assignment.endTime}</div>
          <div class="station-backup"><span class="muted tiny">Zastępca</span><br>${esc(memberName(assignment.backupMemberId))}</div>
          ${can('assign-staff') ? `<button class="secondary-button" data-assign="${selected.id}:${stationId}">Edytuj</button>` : '<span></span>'}</article>`;
      }).join('')}</div>`;
  }

  function renderTeam() {
    const f = state.filters;
    const categories = ['Governance and clinical oversight', 'Core operations', 'Module owners', 'T0/W12 flexible assessment pool', 'Clinical backup / specialist support'];
    let people = state.data.team.filter(person =>
      (f.teamStatus === 'all' || person.status === f.teamStatus) &&
      (f.teamCategory === 'all' || person.teamCategories.includes(f.teamCategory))
    );
    const categoryContent = categories.map(category => {
      const members = people.filter(person => person.teamCategories.includes(category));
      if (!members.length) return '';
      return `<section class="category-block"><h2 class="category-title">${esc(category)}</h2><div class="team-grid">${members.map(teamCard).join('')}</div></section>`;
    }).join('');
    return `${pageHeader('Zespół i role', 'Właściciele procesów, zastępstwa, dostępność, zadania i status kompetencji.',
      can('all') ? '<button class="secondary-button" data-action="edit-roles">Edytuj role</button>' : '')}
      <div class="filter-bar"><label>Status</label><select data-filter="teamStatus">${options(['all','Active','Conditional','Backup','Onboarding','Vacant'], f.teamStatus)}</select>
        <label>Kategoria</label><select data-filter="teamCategory">${options(['all', ...categories], f.teamCategory)}</select></div>
      ${categoryContent || '<div class="empty-state"><strong>Brak osób</strong><span>Zmień filtry.</span></div>'}`;
  }

  function teamCard(person) {
    const backup = member(person.backupMemberId);
    return `<article class="card team-card"><div class="team-card-top">${avatar(person)}<div><h3>${esc(person.name)}</h3><p class="team-role">${esc(person.primaryRole)}</p>${badge(person.status)}</div></div>
      <div class="team-card-meta"><div><small>Dostępność</small><strong>${esc(person.availability.join(' / '))}</strong></div><div><small>Zastępca</small><strong>${esc(backup?.name || '—')}</strong></div>
        <div><small>Otwarte zadania</small><strong>${person.openTasksCount}</strong></div><div><small>Następny przydział</small><strong>${esc(person.nextAssignmentId || '—')}</strong></div></div>
      <div class="cert-list">${person.certifications.slice(0,3).map(item => `<span class="cert-chip">${esc(item)}</span>`).join('') || '<span class="muted tiny">Brak certyfikacji</span>'}</div>
      <div class="team-card-footer"><span class="muted tiny">${person.teamCategories.length} kategorie</span><button class="text-button" data-member="${person.id}">Zobacz profil →</button></div></article>`;
  }

  function renderCompetencies() {
    const groups = {
      core: ['screening','consent','prom','nprs','anthropometry','tanita','maturation','rom','muscle-length','beighton','fpi','ybt','hhd-q','hhd-h','hhd-pf','pain-provocation','movement-quality','opencap-setup','opencap-recording','opencap-files','crf'],
      modules: ['lllt','rehab-osd','rehab-sever','follow-up','data-qc','t1-blinded'],
      all: state.data.stations.map(item => item.id)
    };
    const stations = groups[state.competencyGroup] || groups.core;
    const people = state.data.team.filter(person => person.status !== 'Vacant');
    const letter = status => ({ Certified: 'C', Training: 'T', Observed: 'O', Supervised: 'S', 'Audit required': 'A', Suspended: 'X', 'Not trained': '—' })[status] || '—';
    return `${pageHeader('Macierz kompetencji', 'Status szkolenia, certyfikacji i audytu dla każdej osoby i stacji.',
      can('manage-training') ? '<button class="primary-button" data-action="manage-training">＋ Aktualizuj kompetencję</button>' : '')}
      <div class="filter-bar"><label>Zakres stacji</label><select data-competency-group>${options(['core','modules','all'], state.competencyGroup, { core:'Stacje podstawowe', modules:'Moduły specjalistyczne', all:'Wszystkie stacje' })}</select>
        <span class="muted tiny">Kliknij komórkę, aby zobaczyć szczegóły szkolenia.</span></div>
      <div class="matrix-wrap"><table class="competency-matrix"><thead><tr><th>Osoba</th>${stations.map(id => `<th title="${esc(station(id).name)}">${esc(station(id).short)}</th>`).join('')}</tr></thead>
        <tbody>${people.map(person => `<tr><td>${personCell(person.id)}</td>${stations.map(stationId => {
          const competency = state.data.competencies.find(item => item.memberId === person.id && item.stationId === stationId);
          const slug = (competency?.status || 'Not trained').toLowerCase().replaceAll(' ', '-');
          return `<td><button class="competency-cell cell-${slug}" data-competency="${person.id}:${stationId}" title="${esc(statusLabels[competency?.status] || competency?.status)}">${letter(competency?.status)}</button></td>`;
        }).join('')}</tr>`).join('')}</tbody></table></div>
      <div class="matrix-legend">${[['Certified','C'],['Training','T'],['Observed','O'],['Supervised','S'],['Audit required','A'],['Not trained','—']].map(([status, mark]) => `<span><i class="competency-cell cell-${status.toLowerCase().replaceAll(' ','-')}">${mark}</i>${esc(statusLabels[status])}</span>`).join('')}</div>`;
  }

  function renderModules() {
    const tabs = ['LLLT/sham','REHAB OSD','REHAB Sever','Healthy control','Follow-up'];
    const records = state.data.moduleRecords.filter(record => record.moduleType === state.moduleTab);
    const active = records.filter(record => ['In progress','Active'].includes(record.status)).length;
    const avgAdherence = records.filter(r => typeof r.adherence === 'number').length
      ? Math.round(records.filter(r => typeof r.adherence === 'number').reduce((sum, r) => sum + r.adherence, 0) / records.filter(r => typeof r.adherence === 'number').length) : 0;
    return `${pageHeader('Moduły badania', 'Operacyjne rekordy LLLT/sham, REHAB, kontroli zdrowych i follow-up.')}
      <div class="module-tabs">${tabs.map(tab => `<button data-module-tab="${esc(tab)}" class="${tab === state.moduleTab ? 'active' : ''}">${esc(tab)}</button>`).join('')}</div>
      <div class="module-summary-grid">
        <div class="module-summary"><strong>${records.length}</strong><span>Rekordy modułu</span></div>
        <div class="module-summary"><strong>${active}</strong><span>Aktywne</span></div>
        <div class="module-summary"><strong>${avgAdherence || '—'}${avgAdherence ? '%' : ''}</strong><span>Średnie adherence</span></div>
        <div class="module-summary"><strong>${records.reduce((sum,r) => sum + r.alerts.length,0)}</strong><span>Alerty</span></div>
      </div>
      <section class="card"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Uczestnik</th><th>Status</th><th>Właściciel</th><th>Postęp</th><th>Następny krok</th><th>Kompletność</th><th>Alerty</th><th></th></tr></thead>
        <tbody>${records.map(record => `<tr><td><button class="link-button mono" data-participant="${record.participantId}">${esc(record.participantId)}</button></td>
          <td>${badge(record.status)}</td><td>${personCell(record.ownerId)}</td><td>${moduleProgress(record)}</td>
          <td><strong>${esc(record.nextAction)}</strong><div class="tiny muted">${formatDate(record.nextActionDate)}</div></td>
          <td style="min-width:120px">${progress(record.dataCompleteness, '')}</td><td><div class="alert-chips">${record.alerts.map(a => `<span class="alert-chip">${esc(a)}</span>`).join('') || '—'}</div></td>
          <td><button class="secondary-button" data-module="${record.id}">Otwórz</button></td></tr>`).join('') || emptyRow(8, 'Brak rekordów w module.')}</tbody></table></div></section>`;
  }
  const moduleProgress = record => {
    if (record.moduleType === 'LLLT/sham') return `<strong>${record.sessions}/${record.totalSessions}</strong><div class="tiny muted">${record.adherence}% adherence</div>`;
    if (record.moduleType.startsWith('REHAB')) return `<strong>${esc(record.week)}</strong><div class="tiny muted">${record.adherence}% adherence · ${esc(record.deficitModule || 'moduł do wyboru')}</div>`;
    if (record.moduleType === 'Follow-up') return `<strong>Próba ${record.contactAttempt}/3</strong><div class="tiny muted">${esc(record.contactWindow)}</div>`;
    return `<strong>${esc(record.matchingStatus || '—')}</strong><div class="tiny muted">${esc(record.matchedCaseId || 'bez dopasowania')}</div>`;
  };

  function renderDataQuality() {
    const f = state.filters;
    let rows = state.data.dataQueries.filter(query =>
      (f.queryStatus === 'all' || query.status === f.queryStatus) &&
      (f.queryType === 'all' || query.issueType === f.queryType)
    );
    rows = sortRows(rows, ...state.sort.queries);
    const types = [...new Set(state.data.dataQueries.map(query => query.issueType))];
    const open = state.data.dataQueries.filter(q => q.status !== 'Resolved').length;
    const overdue = state.data.dataQueries.filter(q => q.status === 'Overdue').length;
    const completeness = Math.round(state.data.moduleRecords.reduce((sum,r) => sum + r.dataCompleteness,0) / state.data.moduleRecords.length);
    return `${pageHeader('Data Quality / Missing Data', 'Każdy brak ma właściciela i termin; query trafia do właściciela modułu lub wykonawcy.',
      can('add-query') ? '<button class="primary-button" data-action="add-query">＋ Zgłoś problem</button>' : '')}
      <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:15px">
        <div class="metric-card"><div class="metric-label">Otwarte queries</div><div class="metric-value">${open}</div></div>
        <div class="metric-card alert"><div class="metric-label">Po terminie</div><div class="metric-value">${overdue}</div></div>
        <div class="metric-card"><div class="metric-label">Kompletność modułów</div><div class="metric-value">${completeness}%</div></div>
        <div class="metric-card warning"><div class="metric-label">QC failures</div><div class="metric-value">${state.data.dataQueries.filter(q => q.issueType.includes('QC')).length}</div></div>
      </div>
      <div class="filter-bar"><label>Status</label><select data-filter="queryStatus">${options(['all','Open','In progress','Overdue','Resolved'], f.queryStatus)}</select>
        <label>Typ problemu</label><select data-filter="queryType">${options(['all',...types], f.queryType)}</select></div>
      <section class="card"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Uczestnik</th><th>Etap / moduł</th><th>Brakujące pole lub plik</th><th>Typ</th><th>Właściciel</th><th>Wykryto</th><th><button class="sortable" data-sort-view="queries" data-sort="dueDate">Termin ↕</button></th><th>Status</th><th>Przyp.</th><th></th></tr></thead>
        <tbody>${rows.map(query => `<tr><td><button class="link-button mono" data-participant="${query.participantId}">${esc(query.participantId)}</button></td><td>${esc(query.moduleType)}</td>
          <td><strong>${esc(query.fieldOrFile)}</strong><div class="tiny muted">${esc(query.description)}</div></td><td>${esc(query.issueType)}</td>
          <td>${personCell(query.assignedToId)}</td><td>${formatDate(query.createdAt)}</td><td>${formatDate(query.dueDate)}</td><td>${badge(query.status)}</td><td>${query.reminders}</td>
          <td><button class="secondary-button" data-query="${query.id}">Otwórz</button></td></tr>`).join('') || emptyRow(10, 'Brak queries spełniających kryteria.')}</tbody></table></div></section>
      ${renderMonthlyQuality()}`;
  }

  function renderMonthlyQuality() {
    const items = [['Recruitment',78],['Retention',92],['Adherence',81],['Data completeness',86],['Jakość pomiarów',89],['Status szkoleń',72]];
    return `<div class="section-heading"><h2>Monthly Quality Review</h2><p>Lipiec 2026</p></div>
      <section class="card"><div class="card-body"><div class="module-summary-grid">${items.map(([label,value]) => `<div class="module-summary">${progress(value,label,value < 75 ? 'warning' : '')}</div>`).join('')}</div>
      <p class="muted tiny">Najwięcej problemów: OpenCap file management (2) · HHD staffing (1) · Follow-up overdue (1). Audyt wymagany: Student 4 — YBT.</p></div></section>`;
  }

  function renderDocuments() {
    const f = state.filters;
    const categories = [...new Set(state.data.documents.map(doc => doc.category))];
    const rows = state.data.documents.filter(doc =>
      (f.documentStatus === 'all' || doc.status === f.documentStatus) &&
      (f.documentCategory === 'all' || doc.category === f.documentCategory)
    );
    const user = activeUser();
    return `${pageHeader('SOP i dokumenty', 'Wersje, daty obowiązywania, właściciele i potwierdzenia zapoznania się.',
      can('add-sop') ? '<button class="primary-button" data-action="add-sop">＋ Dodaj SOP</button>' : '')}
      <div class="filter-bar"><label>Status</label><select data-filter="documentStatus">${options(['all','Active','Draft','Archived'], f.documentStatus)}</select>
        <label>Kategoria</label><select data-filter="documentCategory">${options(['all',...categories], f.documentCategory)}</select>
        <span class="muted tiny">Dokumenty archiwalne nie są domyślnie wyświetlane.</span></div>
      <section class="card"><div class="data-table-wrap"><table class="data-table"><thead><tr><th>Dokument</th><th>Kategoria</th><th>Wersja</th><th>Obowiązuje od</th><th>Właściciel</th><th>Status</th><th>Potwierdzenia</th><th>Twój status</th><th></th></tr></thead>
        <tbody>${rows.map(doc => {
          const acknowledged = doc.acknowledgements.includes(user.id);
          const eligible = state.data.team.filter(m => m.status !== 'Vacant').length;
          return `<tr><td><strong>${esc(doc.title)}</strong><div class="tiny muted">Zmiana: ${formatDate(doc.lastModified)}</div></td><td>${esc(doc.category)}</td>
            <td class="mono">v${esc(doc.version)}</td><td>${formatDate(doc.effectiveDate)}</td><td>${esc(memberName(doc.ownerId))}</td><td>${badge(doc.status)}</td>
            <td>${doc.acknowledgements.length}/${eligible}</td><td>${acknowledged ? badge('Completed') : badge('Incomplete')}</td>
            <td>${!acknowledged && doc.status === 'Active' && can('ack-sop') ? `<button class="secondary-button" data-ack-doc="${doc.id}">Potwierdź</button>` : `<a class="text-button" href="${esc(doc.url)}" ${doc.url !== '#' ? 'target="_blank" rel="noopener"' : ''}>Otwórz</a>`}</td></tr>`;
        }).join('') || emptyRow(9, 'Brak dokumentów spełniających kryteria.')}</tbody></table></div></section>`;
  }

  function renderAdmin() {
    if (!can('all')) return `${pageHeader('Administracja', 'Widok dostępny dla PI / Admin.')}<div class="empty-state card"><strong>Brak uprawnień</strong><span>Przełącz rolę demonstracyjną na PI / Admin.</span></div>`;
    const critical = state.data.tasks.filter(t => t.priority === 'Critical' && t.status !== 'Completed').length;
    const auditRequired = state.data.competencies.filter(c => c.status === 'Audit required').length;
    const noBackup = state.data.team.filter(m => m.status !== 'Vacant' && !m.backupMemberId).length;
    const stalled = state.data.participants.filter(p => !p.currentStage).length;
    const cards = [
      ['Problemy krytyczne',critical,'Queries i zadania wymagające decyzji'],
      ['Adverse events',state.data.dataQueries.filter(q => q.issueType.includes('adverse event') && q.status !== 'Resolved').length,'Otwarte lub niekompletne'],
      ['Protocol deviations',state.data.dataQueries.filter(q => q.issueType === 'protocol deviation' && q.status !== 'Resolved').length,'Nierozwiązane'],
      ['Wakat Data/QC',1,'Tymczasowy nadzór PI'],
      ['Audit required',auditRequired,'Kompetencje wymagające ponownego audytu'],
      ['Moduły bez zastępcy',noBackup,'Do uzupełnienia'],
      ['Bez następnego kroku',stalled,'Uczestnicy bez planu'],
      ['Kompletność danych',86,'Procent wszystkich aktywnych modułów']
    ];
    return `${pageHeader('PI / Administracja', 'Przekrojowy nadzór nad ryzykiem, jakością, uprawnieniami i konfiguracją.',
      '<button class="secondary-button" data-action="reset-demo">Przywróć dane demo</button><button class="primary-button" data-action="edit-roles">Edytuj role</button>')}
      <div class="admin-grid">${cards.map(([title,value,note]) => `<article class="card admin-card"><h3>${esc(title)}</h3><div class="admin-number">${value}${title === 'Kompletność danych' ? '%' : ''}</div><p>${esc(note)}</p></article>`).join('')}</div>
      <div class="section-heading"><h2>Role i uprawnienia</h2></div>${renderPermissions()}
      <div class="dashboard-grid"><section class="card"><div class="card-header"><h2>Ostatnie zmiany</h2></div><div class="card-body"><ul class="audit-log">${state.data.auditLog.map(log => `<li><strong>${esc(log.action)}</strong><span>${esc(memberName(log.userId))}</span><time>${esc(log.at)}</time></li>`).join('')}</ul></div></section>
      <section class="card"><div class="card-header"><h2>Ryzyka organizacyjne</h2></div><div class="card-body"><ul class="responsibility-list">
        <li><strong>Data/QC:</strong> rola VACANT; tymczasowy nadzór PI.</li><li><strong>LLLT:</strong> brak potwierdzonego zastępcy na 7 sierpnia.</li>
        <li><strong>HHD:</strong> jedna nieobsadzona stacja w bloku piątkowym.</li><li><strong>Student 4:</strong> onboarding i audyt YBT.</li>
      </ul></div></section></div>`;
  }

  function renderPermissions() {
    const rows = [
      ['Edytuje wszystkie role',[1,0,0,0,0,0]],['Planuje wizyty i bloki',[1,1,0,0,0,0]],['Edytuje własny moduł',[1,0,1,0,1,0]],
      ['Wykonuje przydzielone stacje',[1,1,1,1,0,0]],['Dokumentuje LLLT/sham',[1,0,0,0,1,0]],['Zatwierdza SOP',[1,0,0,0,0,0]],
      ['Czyta przypisane treści',[1,1,1,1,1,1]]
    ];
    const labels = state.data.roles.map(r => r.label);
    return `<section class="card"><div class="permission-grid"><div class="head">Uprawnienie</div>${labels.map(l => `<div class="head">${esc(l)}</div>`).join('')}
      ${rows.map(([label,values]) => `<div class="row-label">${esc(label)}</div>${values.map(value => `<div class="${value ? 'check-yes' : 'check-no'}">${value ? '✓' : '—'}</div>`).join('')}`).join('')}</div></section>`;
  }

  function renderView() {
    const renderers = {
      'research-days': renderResearchDays, duties: renderDuties,
      dashboard: renderDashboard, participants: renderParticipants, schedule: renderSchedule,
      stations: renderStations, modules: renderModules, team: renderTeam,
      competencies: renderCompetencies, 'data-quality': renderDataQuality,
      documents: renderDocuments, admin: renderAdmin
    };
    els.appContent.innerHTML = (renderers[state.view] || renderDashboard)();
    els.topbarTitle.textContent = viewTitles[state.view];
    els.appNav.querySelectorAll('[data-view]').forEach(button => button.classList.toggle('active', button.dataset.view === state.view));
    const openQueries = state.data.dataQueries.filter(query => query.status !== 'Resolved').length;
    const openTasks = state.data.tasks.filter(task => task.status !== 'Completed').length;
    els.dqNavCount.textContent = openQueries;
    els.notificationCount.textContent = openTasks;
    els.appContent.focus({ preventScroll: true });
  }

  function navigate(view, blockId = null) {
    if (view === 'home') {
      location.href = `portal-start.html?v=${VERSION}`;
      return;
    }
    if (!viewTitles[view]) return;
    if (COORDINATOR_VIEWS.has(view) && sessionStorage.getItem(COORDINATOR_SESSION_KEY) !== 'true') {
      location.href = `portal-coordinator-login.html?v=${VERSION}`;
      return;
    }
    if (blockId) state.selectedBlockId = blockId;
    state.view = view;
    closeSidebar();
    closeDrawer();
    renderView();
    history.replaceState(null, '', `#${view}`);
  }

  function showParticipant(id) {
    const item = participant(id);
    if (!item) return;
    const ownerNames = item.moduleOwnerIds.map(memberName).join(', ');
    els.drawerContent.innerHTML = `<header class="drawer-header"><div class="eyebrow">Uczestnik demonstracyjny</div><h2 class="mono">${esc(item.id)}</h2>
      <p>${esc(item.studyId)} · ${esc(item.diagnosis)} · ${esc(item.ageBand)} · ${esc(item.sport)}</p></header>
      <div class="detail-grid"><div class="detail-item"><small>Status</small>${badge(item.status)}</div><div class="detail-item"><small>Aktualny etap</small><strong>${esc(item.currentStage)}</strong></div>
        <div class="detail-item"><small>Operations Coordinator</small><strong>${esc(memberName(item.operationsCoordinatorId))}</strong></div><div class="detail-item"><small>Module owner</small><strong>${esc(ownerNames)}</strong></div>
        <div class="detail-item"><small>Otwarte queries</small><strong>${item.openQueries}</strong></div><div class="detail-item"><small>Dane osobowe</small><strong>Nieprzechowywane w demo</strong></div></div>
      ${item.alerts.length ? `<div class="form-warning">${item.alerts.map(esc).join(' · ')}</div>` : ''}
      <section class="drawer-section"><h3>Ścieżka uczestnika</h3><div class="timeline">${item.timeline.map(stage => {
        const className = stage.status === 'Completed' ? 'completed' : stage.status === 'Overdue' ? 'overdue' : stage.status === 'In progress' ? 'current' : '';
        return `<div class="timeline-item ${className}"><span class="timeline-dot"></span><strong>${esc(stage.stageType)}</strong>
          <small>${esc(statusLabels[stage.status] || stage.status)} · ${stage.completedDate ? `wykonano ${formatDate(stage.completedDate)}` : stage.plannedDate ? `plan ${formatDate(stage.plannedDate)}` : 'bez terminu'} · ${esc(memberName(stage.ownerId))}</small>
          ${stage.status === 'In progress' ? `<div style="margin-top:5px">${progress(stage.completenessPercent, 'Kompletność')}</div>` : ''}</div>`;
      }).join('')}</div></section>`;
    openDrawer();
  }

  function showMember(id) {
    const person = member(id);
    if (!person) return;
    const comps = state.data.competencies.filter(c => c.memberId === id);
    const certified = comps.filter(c => c.status === 'Certified').length;
    els.drawerContent.innerHTML = `<header class="drawer-header">${avatar(person)}<div style="margin-top:12px">${badge(person.status)}</div><h2>${esc(person.name)}</h2><p>${esc(person.primaryRole)}</p></header>
      <div class="detail-grid"><div class="detail-item"><small>Kategorie</small><strong>${esc(person.teamCategories.join(', '))}</strong></div>
        <div class="detail-item"><small>Dostępność</small><strong>${esc(person.availability.join(' / '))}</strong></div>
        <div class="detail-item"><small>Zastępca</small><strong>${esc(memberName(person.backupMemberId))}</strong></div>
        <div class="detail-item"><small>Certyfikowane stacje</small><strong>${certified} / ${state.data.stations.length}</strong></div>
        <div class="detail-item"><small>Otwarte zadania</small><strong>${person.openTasksCount}</strong></div>
        <div class="detail-item"><small>Następny przydział</small><strong>${esc(person.nextAssignmentId || '—')}</strong></div></div>
      <section class="drawer-section"><h3>Zakres odpowiedzialności</h3><ul class="responsibility-list">${person.responsibilities.map(item => `<li>${esc(item)}</li>`).join('')}</ul></section>
      <section class="drawer-section"><h3>Certyfikacje i szkolenia</h3><div class="cert-list">${person.certifications.map(item => `<span class="cert-chip">${esc(item)}</span>`).join('') || '—'}</div></section>
      ${can('all') ? `<div class="form-actions"><button class="secondary-button" data-edit-member="${person.id}">Edytuj rolę i zakres</button></div>` : ''}`;
    openDrawer();
  }

  function showQuery(id) {
    const query = state.data.dataQueries.find(item => item.id === id);
    if (!query) return;
    els.drawerContent.innerHTML = `<header class="drawer-header"><div class="eyebrow">Data query</div><h2>${esc(query.fieldOrFile)}</h2><p>${esc(query.participantId)} · ${esc(query.moduleType)}</p></header>
      <div class="detail-grid"><div class="detail-item"><small>Status</small>${badge(query.status)}</div><div class="detail-item"><small>Typ</small><strong>${esc(query.issueType)}</strong></div>
        <div class="detail-item"><small>Właściciel</small><strong>${esc(memberName(query.assignedToId))}</strong></div><div class="detail-item"><small>Termin</small><strong>${formatDate(query.dueDate)}</strong></div>
        <div class="detail-item"><small>Utworzył</small><strong>${esc(memberName(query.createdById))}</strong></div><div class="detail-item"><small>Przypomnienia</small><strong>${query.reminders}</strong></div></div>
      <section class="drawer-section"><h3>Opis</h3><p class="muted">${esc(query.description)}</p></section>
      ${can('resolve-query') || can('all') ? `<div class="form-actions"><button class="primary-button" data-resolve-query="${query.id}" ${query.status === 'Resolved' ? 'disabled' : ''}>Oznacz jako rozwiązane</button></div>` : ''}`;
    openDrawer();
  }

  function showModule(id) {
    const record = state.data.moduleRecords.find(item => item.id === id);
    if (!record) return;
    els.drawerContent.innerHTML = `<header class="drawer-header"><div class="eyebrow">${esc(record.moduleType)}</div><h2 class="mono">${esc(record.participantId)}</h2>
      <p>Właściciel: ${esc(memberName(record.ownerId))}</p></header>
      <div class="detail-grid"><div class="detail-item"><small>Status</small>${badge(record.status)}</div>
        <div class="detail-item"><small>Kompletność danych</small><strong>${record.dataCompleteness}%</strong></div>
        <div class="detail-item"><small>Następny krok</small><strong>${esc(record.nextAction)}</strong></div>
        <div class="detail-item"><small>Termin</small><strong>${formatDate(record.nextActionDate)}</strong></div>
        ${typeof record.adherence === 'number' ? `<div class="detail-item"><small>Adherence</small><strong>${record.adherence}%</strong></div>` : ''}
        ${record.blinding ? `<div class="detail-item"><small>Zaślepienie</small><strong>${esc(record.blinding)}</strong></div>` : ''}</div>
      <section class="drawer-section"><h3>Postęp modułu</h3>${progress(record.dataCompleteness,'Kompletność')}</section>
      ${record.alerts.length ? `<div class="form-warning">${record.alerts.map(esc).join(' · ')}</div>` : ''}`;
    openDrawer();
  }

  function openDrawer() {
    els.drawerBackdrop.hidden = false;
    els.drawer.classList.add('open');
    els.drawer.setAttribute('aria-hidden', 'false');
    els.drawerClose.focus();
  }
  function closeDrawer() {
    els.drawer.classList.remove('open');
    els.drawer.setAttribute('aria-hidden', 'true');
    els.drawerBackdrop.hidden = true;
  }

  function openModal(content) {
    els.modalContent.innerHTML = content;
    els.modalBackdrop.hidden = false;
    setTimeout(() => els.modalContent.querySelector('input, select, textarea, button')?.focus(), 0);
  }
  function closeModal() { els.modalBackdrop.hidden = true; els.modalContent.innerHTML = ''; }

  function assignmentModal(blockId, stationId) {
    const block = state.data.blocks.find(item => item.id === blockId);
    const item = station(stationId);
    const existing = block.stationAssignments.find(row => row.stationId === stationId);
    const people = state.data.team.filter(person => !['Vacant','Unavailable'].includes(person.status));
    openModal(`<h2 id="modalTitle">${existing ? 'Edytuj przydział' : 'Przypisz operatora'}</h2><p class="modal-intro">${esc(item.name)} · ${formatDay(block.date)} · ${esc(block.type)}</p>
      <form id="assignmentForm" data-block-id="${block.id}" data-station-id="${item.id}">
        <div class="form-grid"><div class="form-field full"><label>Operator</label><select name="memberId" required><option value="">Wybierz osobę</option>${people.map(person => `<option value="${person.id}" ${existing?.memberId === person.id ? 'selected' : ''}>${esc(person.name)} — ${esc(person.status)}</option>`).join('')}</select></div>
        <div class="form-field"><label>Od</label><input type="time" name="startTime" value="${existing?.startTime || block.startTime}" required /></div>
        <div class="form-field"><label>Do</label><input type="time" name="endTime" value="${existing?.endTime || block.endTime}" required /></div>
        <div class="form-field full"><label>Zastępca</label><select name="backupMemberId"><option value="">Bez zastępcy</option>${people.map(person => `<option value="${person.id}" ${existing?.backupMemberId === person.id ? 'selected' : ''}>${esc(person.name)}</option>`).join('')}</select></div>
        <div class="form-field full"><label>Uczestnicy</label><select name="participantIds" multiple size="4">${block.participantIds.map(id => `<option value="${id}" ${existing?.participantIds.includes(id) ? 'selected' : ''}>${esc(id)}</option>`).join('')}</select></div>
        <div class="form-field full"><label><input type="checkbox" name="overrideTraining" style="width:auto;min-height:0"> Potwierdzam świadome przypisanie mimo ostrzeżenia kompetencyjnego (Admin / Clinical Lead)</label></div></div>
        <div id="assignmentFeedback"></div><div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Anuluj</button><button type="submit" class="primary-button">Zapisz przydział</button></div></form>`);
  }

  function createBlockModal() {
    const leads = state.data.team.filter(person => ['pi','karol','mateusz-nowosad'].includes(person.id));
    openModal(`<h2 id="modalTitle">Dodaj blok badawczy</h2><p class="modal-intro">Każdy blok musi mieć clinical lead. Po utworzeniu przejdź do obsady stacji.</p>
      <form id="blockForm"><div class="form-grid"><div class="form-field"><label>Data</label><input type="date" name="date" required /></div>
        <div class="form-field"><label>Typ</label><select name="type">${options(['T0','W12','Mixed'],'T0')}</select></div>
        <div class="form-field"><label>Od</label><input type="time" name="startTime" value="10:00" required /></div><div class="form-field"><label>Do</label><input type="time" name="endTime" value="13:00" required /></div>
        <div class="form-field full"><label>Clinical lead</label><select name="clinicalLeadId" required><option value="">Wybierz</option>${leads.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label>Liczba pomieszczeń</label><input type="number" name="rooms" min="1" max="10" value="3" /></div>
        <div class="form-field full"><label>Notatki logistyczne</label><textarea name="notes"></textarea></div></div>
        <div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Anuluj</button><button type="submit" class="primary-button">Utwórz blok</button></div></form>`);
  }

  function taskModal() {
    openModal(`<h2 id="modalTitle">Dodaj zadanie</h2><p class="modal-intro">Zadanie musi mieć właściciela i termin.</p>
      <form id="taskForm"><div class="form-grid"><div class="form-field"><label>Priorytet</label><select name="priority">${options(['Low','Medium','High','Critical'],'Medium')}</select></div>
        <div class="form-field"><label>Termin</label><input type="date" name="dueDate" required /></div>
        <div class="form-field full"><label>ID uczestnika lub proces</label><input name="subject" required /></div>
        <div class="form-field full"><label>Opis</label><textarea name="description" required></textarea></div>
        <div class="form-field full"><label>Właściciel</label><select name="ownerId" required><option value="">Wybierz</option>${state.data.team.filter(p=>p.status!=='Vacant').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div></div>
        <div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Anuluj</button><button type="submit" class="primary-button">Dodaj zadanie</button></div></form>`);
  }

  function queryModal(type = '') {
    const issueTypes = ['missing CRF','missing PROM','missing signature','incorrect date','impossible value','OpenCap file missing','OpenCap naming error','OpenCap QC failed','LLLT session documentation incomplete','follow-up overdue','protocol deviation','adverse event incomplete','unresolved eligibility issue'];
    openModal(`<h2 id="modalTitle">${type === 'protocol deviation' ? 'Zgłoś protocol deviation' : 'Zgłoś problem z danymi'}</h2><p class="modal-intro">Query musi mieć właściciela i termin odpowiedzi.</p>
      <form id="queryForm"><div class="form-grid"><div class="form-field"><label>Uczestnik</label><select name="participantId" required><option value="">Wybierz ID</option>${state.data.participants.map(p=>`<option value="${p.id}">${p.id}</option>`).join('')}</select></div>
        <div class="form-field"><label>Moduł</label><input name="moduleType" required /></div>
        <div class="form-field full"><label>Pole lub plik</label><input name="fieldOrFile" required /></div>
        <div class="form-field"><label>Typ problemu</label><select name="issueType">${options(issueTypes,type || issueTypes[0])}</select></div>
        <div class="form-field"><label>Termin</label><input type="date" name="dueDate" required /></div>
        <div class="form-field full"><label>Opis</label><textarea name="description" required></textarea></div>
        <div class="form-field full"><label>Właściciel</label><select name="assignedToId" required><option value="">Wybierz</option>${state.data.team.filter(p=>p.status!=='Vacant').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div></div>
        <div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Anuluj</button><button type="submit" class="primary-button">Utwórz query</button></div></form>`);
  }

  function competencyModal(memberId = 'student-1', stationId = 'anthropometry') {
    const record = state.data.competencies.find(item => item.memberId === memberId && item.stationId === stationId);
    const person = member(memberId);
    const item = station(stationId);
    const statuses = ['Not trained','Training','Observed','Supervised','Certified','Audit required','Suspended'];
    openModal(`<h2 id="modalTitle">${esc(person.name)} · ${esc(item.name)}</h2><p class="modal-intro">Proces: SOP → demonstracja → 5 prób → 2 sesje nadzorowane → ocena → dopuszczenie → audit.</p>
      <form id="competencyForm" data-competency-id="${record.id}"><div class="form-grid">
        <div class="form-field"><label>Status</label><select name="status">${options(statuses,record.status)}</select></div>
        <div class="form-field"><label>Osoba szkoląca</label><select name="trainerId"><option value="">—</option>${state.data.team.map(p=>`<option value="${p.id}" ${p.id===record.trainerId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
        <div class="form-field"><label>Data szkolenia</label><input type="date" name="trainingDate" value="${record.trainingDate || ''}" /></div>
        <div class="form-field"><label>Data certyfikacji</label><input type="date" name="certifiedDate" value="${record.certifiedDate || ''}" /></div>
        <div class="form-field"><label>Próby treningowe</label><input type="number" name="trainingTrials" min="0" value="${record.trainingTrials}" /></div>
        <div class="form-field"><label>Sesje nadzorowane</label><input type="number" name="supervisedSessions" min="0" value="${record.supervisedSessions}" /></div>
        <div class="form-field"><label>Ostatni audyt</label><input type="date" name="lastAuditDate" value="${record.lastAuditDate || ''}" /></div>
        <div class="form-field full"><label>Uwagi</label><textarea name="notes">${esc(record.notes)}</textarea></div></div>
        <div id="competencyFeedback"></div><div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Zamknij</button>${can('manage-training') ? '<button type="submit" class="primary-button">Zapisz</button>' : ''}</div></form>`);
  }

  function editMemberModal(id = 'pi') {
    const person = member(id);
    openModal(`<h2 id="modalTitle">Edytuj rolę · ${esc(person.name)}</h2><p class="modal-intro">Zmiana dotyczy centralnego modelu danych demonstracyjnych.</p>
      <form id="memberForm" data-member-id="${person.id}"><div class="form-grid"><div class="form-field full"><label>Główna rola</label><input name="primaryRole" value="${esc(person.primaryRole)}" required /></div>
        <div class="form-field"><label>Status</label><select name="status">${options(['Active','Conditional','Backup','Onboarding','Unavailable','Vacant'],person.status)}</select></div>
        <div class="form-field"><label>Zastępca</label><select name="backupMemberId"><option value="">—</option>${state.data.team.filter(p=>p.id!==person.id).map(p=>`<option value="${p.id}" ${p.id===person.backupMemberId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div>
        <div class="form-field full"><label>Odpowiedzialności — po jednej w wierszu</label><textarea name="responsibilities">${esc(person.responsibilities.join('\n'))}</textarea></div>
        <div class="form-field full"><label>Notatka widoczna dla zespołu</label><textarea name="notesPublic">${esc(person.notesPublic)}</textarea></div></div>
        <div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Anuluj</button><button type="submit" class="primary-button">Zapisz</button></div></form>`);
  }

  function documentModal() {
    openModal(`<h2 id="modalTitle">Dodaj SOP</h2><p class="modal-intro">Dodajesz rekord dokumentu; integracja z repozytorium plików nie jest jeszcze aktywna.</p>
      <form id="documentForm"><div class="form-grid"><div class="form-field full"><label>Tytuł</label><input name="title" required /></div>
        <div class="form-field"><label>Kategoria</label><input name="category" required /></div><div class="form-field"><label>Wersja</label><input name="version" value="0.1" required /></div>
        <div class="form-field"><label>Status</label><select name="status">${options(['Draft','Active'],'Draft')}</select></div><div class="form-field"><label>Data obowiązywania</label><input type="date" name="effectiveDate" required /></div>
        <div class="form-field full"><label>Właściciel</label><select name="ownerId" required>${state.data.team.filter(p=>p.status!=='Vacant').map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></div></div>
        <div class="form-actions"><button type="button" class="secondary-button" data-close-modal>Anuluj</button><button type="submit" class="primary-button">Dodaj dokument</button></div></form>`);
  }

  function overlaps(startA, endA, startB, endB) { return startA < endB && startB < endA; }
  function submitAssignment(form) {
    const data = new FormData(form);
    const block = state.data.blocks.find(item => item.id === form.dataset.blockId);
    const stationId = form.dataset.stationId;
    const memberId = data.get('memberId');
    const startTime = data.get('startTime');
    const endTime = data.get('endTime');
    const participantIds = data.getAll('participantIds');
    const feedback = form.querySelector('#assignmentFeedback');
    if (startTime >= endTime) { feedback.innerHTML = '<div class="form-error">Godzina zakończenia musi być późniejsza niż rozpoczęcia.</div>'; return; }
    const competency = state.data.competencies.find(item => item.memberId === memberId && item.stationId === stationId);
    const notReady = !competency || ['Not trained','Suspended','Audit required'].includes(competency.status);
    if (notReady && (!can('all') || data.get('overrideTraining') !== 'on')) {
      feedback.innerHTML = `<div class="form-error">Operator ma status „${esc(statusLabels[competency?.status || 'Not trained'])}”. Wymagane jest potwierdzenie Admin / Clinical Lead.</div>`; return;
    }
    const conflict = block.stationAssignments.find(row => row.memberId === memberId && row.stationId !== stationId && overlaps(startTime,endTime,row.startTime,row.endTime));
    if (conflict) { feedback.innerHTML = `<div class="form-error">Konflikt czasu: ${esc(memberName(memberId))} jest już przypisany do ${esc(station(conflict.stationId).name)} (${conflict.startTime}–${conflict.endTime}).</div>`; return; }
    const stationDef = station(stationId);
    const violatesBlinding = memberId === 'filip' && stationDef.blindedOutcome && participantIds.some(id =>
      state.data.moduleRecords.some(record => record.participantId === id && record.moduleType === 'LLLT/sham' && record.ownerId === 'filip')
    );
    if (violatesBlinding) { feedback.innerHTML = '<div class="form-error">Reguła zaślepienia: Filip nie może wykonywać zaślepionej oceny T1 uczestnika, którego interwencję prowadzi.</div>'; return; }
    let assignment = block.stationAssignments.find(row => row.stationId === stationId);
    const payload = { memberId, backupMemberId: data.get('backupMemberId') || null, startTime, endTime, participantIds, competencyStatusAtAssignment: competency?.status || 'Not trained' };
    if (assignment) Object.assign(assignment, payload);
    else block.stationAssignments.push({ id:`${block.id}-assignment-${Date.now()}`, blockId:block.id, stationId, ...payload, conflictWarnings:[], status:'Planned' });
    block.readinessScore = Math.min(100, Math.round(block.stationAssignments.length / 11 * 100));
    saveData(); closeModal(); toast('Przydział stacji został zapisany.'); renderView();
  }

  function handleFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    if (form.id === 'assignmentForm') return submitAssignment(form);
    if (form.id === 'blockForm') {
      const id = `block-${String(state.data.blocks.length + 1).padStart(3,'0')}`;
      state.data.blocks.push({ id, date:data.get('date'), startTime:data.get('startTime'), endTime:data.get('endTime'), location:state.data.meta.location, type:data.get('type'), participantIds:[], clinicalLeadId:data.get('clinicalLeadId'), rooms:Number(data.get('rooms') || 3), status:'Draft', readinessScore:15, notes:data.get('notes'), stationAssignments:[] });
      state.selectedBlockId = id; saveData(); closeModal(); toast('Utworzono blok badawczy. Uzupełnij uczestników i obsadę.'); navigate('stations'); return;
    }
    if (form.id === 'taskForm') {
      state.data.tasks.unshift({ id:`task-${Date.now()}`, priority:data.get('priority'), subject:data.get('subject'), description:data.get('description'), ownerId:data.get('ownerId'), dueDate:data.get('dueDate'), status:'Open', targetView:'dashboard' });
      saveData(); closeModal(); toast('Dodano zadanie.'); renderView(); return;
    }
    if (form.id === 'queryForm') {
      state.data.dataQueries.unshift({ id:`dq-${Date.now()}`, participantId:data.get('participantId'), moduleType:data.get('moduleType'), fieldOrFile:data.get('fieldOrFile'), issueType:data.get('issueType'), description:data.get('description'), assignedToId:data.get('assignedToId'), createdById:activeUser().id, createdAt:'2026-07-31', dueDate:data.get('dueDate'), status:'Open', reminders:0, resolution:'' });
      saveData(); closeModal(); toast('Utworzono data query.'); renderView(); return;
    }
    if (form.id === 'competencyForm') {
      const record = state.data.competencies.find(item => item.id === form.dataset.competencyId);
      const requestedStatus = data.get('status');
      const trials = Number(data.get('trainingTrials'));
      const supervised = Number(data.get('supervisedSessions'));
      if (requestedStatus === 'Certified' && (trials < 5 || supervised < 2 || !data.get('certifiedDate'))) {
        form.querySelector('#competencyFeedback').innerHTML = '<div class="form-error">Certyfikacja wymaga min. 5 prób, 2 sesji nadzorowanych i daty pisemnego dopuszczenia.</div>'; return;
      }
      Object.assign(record, { status:requestedStatus, trainerId:data.get('trainerId') || null, trainingDate:data.get('trainingDate') || null, certifiedDate:data.get('certifiedDate') || null, lastAuditDate:data.get('lastAuditDate') || null, trainingTrials:trials, supervisedSessions:supervised, notes:data.get('notes') });
      saveData(); closeModal(); toast('Zaktualizowano kompetencję.'); renderView(); return;
    }
    if (form.id === 'memberForm') {
      const person = member(form.dataset.memberId);
      Object.assign(person, { primaryRole:data.get('primaryRole'), status:data.get('status'), backupMemberId:data.get('backupMemberId') || null, responsibilities:String(data.get('responsibilities')).split('\n').map(x=>x.trim()).filter(Boolean), notesPublic:data.get('notesPublic') });
      saveData(); closeModal(); closeDrawer(); toast('Zaktualizowano rolę i zakres odpowiedzialności.'); renderView(); return;
    }
    if (form.id === 'documentForm') {
      state.data.documents.unshift({ id:`sop-${Date.now()}`, title:data.get('title'), category:data.get('category'), version:data.get('version'), status:data.get('status'), effectiveDate:data.get('effectiveDate'), ownerId:data.get('ownerId'), url:'#', lastModified:'2026-07-31', acknowledgements:[] });
      saveData(); closeModal(); toast('Dodano rekord SOP.'); renderView();
    }
  }

  function handleAction(action) {
    if (action === 'logout') {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
      sessionStorage.removeItem('leap-coordinator-sync-token');
      location.replace(`portal.html?v=${VERSION}`);
    }
    else if (action === 'create-block') createBlockModal();
    else if (action === 'assign-staff') navigate('stations');
    else if (action === 'add-task') taskModal();
    else if (action === 'add-query') queryModal();
    else if (action === 'add-deviation') queryModal('protocol deviation');
    else if (action === 'add-sop') documentModal();
    else if (action === 'manage-training') competencyModal();
    else if (action === 'edit-roles') editMemberModal();
    else if (action === 'reset-demo') {
      if (confirm('Przywrócić początkowe dane demonstracyjne? Lokalne zmiany zostaną utracone.')) {
        state.data = clone(window.LEAP_DEMO_DATA); saveData(); toast('Przywrócono dane demonstracyjne.'); renderView();
      }
    }
  }

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast ${type === 'error' ? 'error' : ''}`;
    node.textContent = message;
    els.toastRegion.appendChild(node);
    setTimeout(() => node.remove(), 3600);
  }

  function search(value) {
    const query = value.trim().toLowerCase();
    if (!query) { els.searchResults.hidden = true; return; }
    const people = state.data.team.filter(item => `${item.name} ${item.primaryRole}`.toLowerCase().includes(query)).slice(0,4);
    const participants = state.data.participants.filter(item => `${item.id} ${item.sport} ${item.currentStage}`.toLowerCase().includes(query)).slice(0,5);
    const modules = state.data.moduleRecords.filter(item => `${item.moduleType} ${item.participantId}`.toLowerCase().includes(query)).slice(0,3);
    const html = [
      ...participants.map(item => `<button data-participant="${item.id}"><span class="avatar">${initials(item.id)}</span><span><strong>${esc(item.id)}</strong><small>Uczestnik · ${esc(item.currentStage)}</small></span></button>`),
      ...people.map(item => `<button data-member="${item.id}">${avatar(item)}<span><strong>${esc(item.name)}</strong><small>${esc(item.primaryRole)}</small></span></button>`),
      ...modules.map(item => `<button data-module="${item.id}"><span class="avatar">M</span><span><strong>${esc(item.moduleType)}</strong><small>${esc(item.participantId)}</small></span></button>`)
    ].join('');
    els.searchResults.innerHTML = html || '<div class="empty-state"><span>Brak wyników.</span></div>';
    els.searchResults.hidden = false;
  }

  function updateUser() {
    const role = activeRole();
    const user = activeUser();
    els.userAvatar.textContent = initials(user.name);
    els.userName.textContent = user.name;
    els.userRole.textContent = role.label;
  }

  function initApp() {
    els.loginView.hidden = true;
    els.appShell.hidden = false;
    els.dateRange.textContent = state.data.meta.activeDateRange;
    els.roleSwitcher.innerHTML = state.data.roles.map(role => `<option value="${role.id}" ${role.id === state.roleId ? 'selected' : ''}>${esc(role.label)}</option>`).join('');
    updateUser();
    setTimeout(renderView, 180);
  }

  async function hashPassword(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function showLogin() {
    els.appShell.hidden = true;
    els.loginView.hidden = false;
    els.loginStatus.textContent = '';
    els.password.value = '';
    els.password.type = 'password';
    els.passwordToggle.textContent = 'Pokaż';
    els.password.focus();
  }

  function openSidebar() { els.sidebar.classList.add('open'); els.sidebarBackdrop.classList.add('visible'); }
  function closeSidebar() { els.sidebar.classList.remove('open'); els.sidebarBackdrop.classList.remove('visible'); }

  els.loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!els.password.value) { els.loginStatus.textContent = 'Wpisz hasło.'; return; }
    els.loginButton.disabled = true; els.loginButton.textContent = 'Sprawdzanie…'; els.loginStatus.textContent = '';
    try {
      if (await hashPassword(els.password.value) === PASSWORD_HASH) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        location.replace(`portal-start.html?v=${VERSION}`);
      } else { els.loginStatus.textContent = 'Nieprawidłowe hasło. Spróbuj ponownie.'; els.password.value = ''; els.password.focus(); }
    } catch { els.loginStatus.textContent = 'Nie udało się sprawdzić hasła. Odśwież stronę.'; }
    finally { els.loginButton.disabled = false; els.loginButton.textContent = 'Wejdź do portalu'; }
  });
  els.passwordToggle.addEventListener('click', () => {
    const reveal = els.password.type === 'password';
    els.password.type = reveal ? 'text' : 'password';
    els.passwordToggle.textContent = reveal ? 'Ukryj' : 'Pokaż';
    els.passwordToggle.setAttribute('aria-label', reveal ? 'Ukryj hasło' : 'Pokaż hasło');
  });
  els.logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
    sessionStorage.removeItem('leap-coordinator-sync-token');
    location.replace(`portal.html?v=${VERSION}`);
  });
  els.roleSwitcher.addEventListener('change', () => { state.roleId = els.roleSwitcher.value; localStorage.setItem(ROLE_KEY,state.roleId); updateUser(); renderView(); toast(`Aktywna rola demo: ${activeRole().label}`); });
  els.userChip.addEventListener('click', () => showMember(activeUser().id));
  els.menuButton.addEventListener('click', openSidebar);
  els.sidebarClose.addEventListener('click', closeSidebar);
  els.sidebarBackdrop.addEventListener('click', closeSidebar);
  els.drawerClose.addEventListener('click', closeDrawer);
  els.drawerBackdrop.addEventListener('click', closeDrawer);
  els.modalClose.addEventListener('click', closeModal);
  els.modalBackdrop.addEventListener('click', event => { if (event.target === els.modalBackdrop) closeModal(); });
  els.modalBackdrop.addEventListener('submit', handleFormSubmit);
  els.search.addEventListener('input', event => search(event.target.value));
  els.search.addEventListener('keydown', event => { if (event.key === 'Escape') els.searchResults.hidden = true; });
  els.notificationButton.addEventListener('click', () => navigate('dashboard'));
  document.addEventListener('keydown', event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); els.search.focus(); }
    if (event.key === 'Escape') { closeDrawer(); closeModal(); closeSidebar(); els.searchResults.hidden = true; }
  });

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-view]');
    if (nav) { navigate(nav.dataset.view, nav.dataset.block || null); return; }
    const action = event.target.closest('[data-action]');
    if (action) { handleAction(action.dataset.action); return; }
    const participantButton = event.target.closest('[data-participant]');
    if (participantButton) { els.searchResults.hidden = true; showParticipant(participantButton.dataset.participant); return; }
    const memberButton = event.target.closest('[data-member]');
    if (memberButton) { els.searchResults.hidden = true; showMember(memberButton.dataset.member); return; }
    const queryButton = event.target.closest('[data-query]');
    if (queryButton) { showQuery(queryButton.dataset.query); return; }
    const moduleButton = event.target.closest('[data-module]');
    if (moduleButton) { els.searchResults.hidden = true; showModule(moduleButton.dataset.module); return; }
    const assignButton = event.target.closest('[data-assign]');
    if (assignButton) { const [blockId,stationId] = assignButton.dataset.assign.split(':'); assignmentModal(blockId,stationId); return; }
    const selectBlock = event.target.closest('[data-select-block]');
    if (selectBlock) { state.selectedBlockId = selectBlock.dataset.selectBlock; renderView(); return; }
    const mode = event.target.closest('[data-schedule-mode]');
    if (mode) { state.scheduleMode = mode.dataset.scheduleMode; renderView(); return; }
    const tab = event.target.closest('[data-module-tab]');
    if (tab) { state.moduleTab = tab.dataset.moduleTab; renderView(); return; }
    const comp = event.target.closest('[data-competency]');
    if (comp) { const [memberId,stationId] = comp.dataset.competency.split(':'); competencyModal(memberId,stationId); return; }
    const taskButton = event.target.closest('[data-task]');
    if (taskButton) {
      const task = state.data.tasks.find(item => item.id === taskButton.dataset.task);
      if (task?.targetView) navigate(task.targetView);
      return;
    }
    const resolve = event.target.closest('[data-resolve-query]');
    if (resolve) { const query = state.data.dataQueries.find(item=>item.id===resolve.dataset.resolveQuery); query.status='Resolved'; query.resolution=`Rozwiązano przez ${activeUser().name}`; saveData(); closeDrawer(); toast('Query oznaczono jako rozwiązane.'); renderView(); return; }
    const ack = event.target.closest('[data-ack-doc]');
    if (ack) { const doc = state.data.documents.find(item=>item.id===ack.dataset.ackDoc); if (!doc.acknowledgements.includes(activeUser().id)) doc.acknowledgements.push(activeUser().id); saveData(); toast('Potwierdzono zapoznanie się z SOP.'); renderView(); return; }
    const edit = event.target.closest('[data-edit-member]');
    if (edit) { closeDrawer(); editMemberModal(edit.dataset.editMember); return; }
    const close = event.target.closest('[data-close-modal]');
    if (close) { closeModal(); return; }
    const sort = event.target.closest('[data-sort-view]');
    if (sort) { const key=sort.dataset.sortView; const [field,direction]=state.sort[key]; state.sort[key]=[sort.dataset.sort, field===sort.dataset.sort && direction==='asc'?'desc':'asc']; renderView(); return; }
    if (!event.target.closest('.global-search')) els.searchResults.hidden = true;
  });

  els.appContent.addEventListener('change', event => {
    const filter = event.target.dataset.filter;
    if (filter) { state.filters[filter] = event.target.value; renderView(); }
    if (event.target.hasAttribute('data-competency-group')) { state.competencyGroup = event.target.value; renderView(); }
  });
  els.appContent.addEventListener('input', event => {
    const filter = event.target.dataset.filter;
    if (filter === 'participantSearch') { state.filters[filter] = event.target.value; renderView(); document.getElementById('participantFilter')?.focus(); }
  });

  const initialView = location.hash.slice(1);
  const isAuthenticated = sessionStorage.getItem(SESSION_KEY) === 'true';
  if (isAuthenticated && initialView === 'home') {
    location.replace(`portal-start.html?v=${VERSION}`);
  } else if (isAuthenticated && COORDINATOR_VIEWS.has(initialView) && sessionStorage.getItem(COORDINATOR_SESSION_KEY) !== 'true') {
    location.replace(`portal-coordinator-login.html?v=${VERSION}`);
  } else if (isAuthenticated && initialView && viewTitles[initialView]) {
    state.view = initialView;
    initApp();
  } else {
    showLogin();
  }
})();
