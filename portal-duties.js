(() => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const COORDINATOR_SESSION_KEY = 'leap-coordinator-authenticated';
  const VERSION = '20260802-4';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }

  const team = window.LEAP_PORTAL_STORE?.load().team || window.LEAP_DEMO_DATA?.team || [];
  const guides = window.LEAP_DUTY_GUIDES || {};
  const list = document.getElementById('researcherList');
  const search = document.getElementById('researcherSearch');
  const count = document.getElementById('teamCount');
  const expandButton = document.getElementById('expandAll');
  const requestedPersonId = new URLSearchParams(location.search).get('person');
  const requestedPerson = team.find(person => person.id === requestedPersonId);
  let expanded = false;

  const roleLabels = {
    pi: 'Kierownik projektu / nadzór naukowy i kliniczny',
    magda: 'Koordynatorka operacyjna projektu',
    karol: 'Starszy lider nadzoru klinicznego',
    'mateusz-nowosad': 'Starszy asesor kliniczny / zastępstwo kliniczne',
    filip: 'Lider interwencji fotobiomodulacyjnej',
    maciej: 'Koordynator akwizycji i integralności danych OpenCap',
    alicja: 'Liderka rehabilitacji zmian Osgood–Schlatter',
    natalia: 'Liderka rehabilitacji zmian Severa',
    weronika: 'Koordynatorka rekrutacji grupy kontrolnej i dziewcząt',
    julia: 'Osoba odpowiedzialna za kontakt kontrolny po zakończeniu programu',
    marta: 'Opiekunka kwestionariusza funkcjonowania kolana KOOS-Child',
    sandra: 'Opiekunka kwestionariusza funkcjonowania stopy i stawu skokowego OxAFQ-C',
    nikodem: 'Elastyczna pula pomiarowa / asesor rezerwowy',
    tymon: 'Elastyczna pula pomiarowa / asesor rezerwowy',
    'student-1': 'Badacz pierwszej wizyty i kontroli po 12 tygodniach',
    'student-2': 'Badacz pierwszej wizyty i kontroli po 12 tygodniach',
    'student-3': 'Badacz pierwszej wizyty i kontroli po 12 tygodniach',
    'student-4': 'Badacz pierwszej wizyty i kontroli po 12 tygodniach — w trakcie wdrożenia',
    'data-qc-vacant': 'Koordynator danych i dokumentacji — wakat'
  };

  const statusLabels = {
    Active: 'Aktywny', Conditional: 'Warunkowy', Backup: 'Zastępstwo',
    Onboarding: 'Wdrożenie', Vacant: 'Wakat'
  };

  const phraseLabels = {
    'Finalne decyzje protokołowe i amendments': 'Finalne decyzje protokołowe i zmiany w protokole',
    'Safety escalation i przypadki niejednoznaczne': 'Eskalacja kwestii bezpieczeństwa i przypadki niejednoznaczne',
    'Finalny sign-off metodologiczny': 'Ostateczne zatwierdzenie metodologiczne',
    'Miesięczny quality review': 'Miesięczny przegląd jakości',
    'Governance danych': 'Nadzór nad danymi',
    'Reliability substudy': 'Podbadanie rzetelności',
    'Adherence': 'Przestrzeganie harmonogramu interwencji',
    'AE i deviations interwencji': 'Zdarzenia niepożądane i odstępstwa w interwencji',
    'First-line QC': 'Wstępna kontrola jakości',
    'Matching candidates': 'Dobór dopasowanych kandydatów',
    'Return to sport i nawroty': 'Powrót do sportu i nawroty',
    'Pain provocation': 'Testy prowokujące ból',
    'CRF completeness': 'Kompletność formularza badawczego uczestnika',
    'Missing-data report': 'Raport brakujących danych',
    'Data queries': 'Zapytania do danych',
    'Deviation log': 'Rejestr odstępstw',
    'Database lock readiness': 'Gotowość do zamknięcia bazy danych',
    'Stała obecność na wszystkich blokach': 'Stała obecność podczas wszystkich bloków badawczych',
    'Finalna interpretacja biomechaniczna': 'Ostateczna interpretacja biomechaniczna',
    'Niezależne zarządzanie LLLT, REHAB lub follow-up': 'Samodzielne zarządzanie modułami LLLT, REHAB lub follow-up'
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const translate = value => phraseLabels[value] || value;
  const displayName = person => person.status === 'Vacant' ? 'Rola nieobsadzona' : person.name;
  const initials = person => person.status === 'Vacant'
    ? '—'
    : person.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const backupName = person => team.find(member => member.id === person.backupMemberId)?.name || 'Nie wyznaczono';
  const resultsLabel = number => {
    if (number === 1) return '1 wynik';
    if (number % 10 >= 2 && number % 10 <= 4 && (number % 100 < 12 || number % 100 > 14)) return `${number} wyniki`;
    return `${number} wyników`;
  };

  function card(person, index) {
    const role = roleLabels[person.id] || person.primaryRole;
    const status = statusLabels[person.status] || person.status;
    const guide = guides[person.id] || {
      inBrief: person.notesPublic,
      steps: person.responsibilities.map(item => [translate(item), `Wykonaj zadanie „${translate(item)}” zgodnie z aktualną instrukcją projektu i zapisz wynik przy właściwym identyfikatorze uczestnika.`]),
      records: ['Właściwy formularz lub arkusz wskazany przez lidera procesu'],
      done: ['Wynik jest zapisany, sprawdzony i nie pozostawia niewyjaśnionego braku.']
    };
    return `<details class="researcher-card" data-person="${esc(person.id)}">
      <summary>
        <span class="researcher-index">${String(index + 1).padStart(2, '0')}</span>
        <span class="researcher-avatar" aria-hidden="true">${esc(initials(person))}</span>
        <span class="researcher-identity"><strong>${esc(displayName(person))}</strong><small>${esc(role)}</small></span>
        <span class="researcher-toggle" aria-hidden="true"><span class="toggle-more">Więcej</span><span class="toggle-less">Mniej</span><b>+</b></span>
        <span class="role-status status-${esc(person.status.toLowerCase())}">${esc(status)}</span>
        <span class="researcher-preview">
          <span class="preview-summary">${esc(person.notesPublic)}</span>
          <span class="preview-title">Odpowiada za</span>
          <span class="researcher-preview-list" role="list">${person.responsibilities.map(item => `<span role="listitem">${esc(translate(item))}</span>`).join('')}</span>
        </span>
      </summary>
      <div class="researcher-body">
        <section class="work-guide-section">
          <p class="role-note"><strong>Najprościej:</strong> ${esc(guide.inBrief)}</p>
          <h2>Jak dokładnie wykonać te obowiązki — krok po kroku</h2>
          <ol class="work-guide-list">${guide.steps.map((step, stepIndex) => `<li>
            <span>${String(stepIndex + 1).padStart(2, '0')}</span>
            <div><h3>${esc(step[0])}</h3><p>${esc(step[1])}</p></div>
          </li>`).join('')}</ol>
        </section>
        <dl class="role-facts">
          <div><dt>Dostępność</dt><dd>${esc(person.availability.join(' · '))}</dd></div>
          <div><dt>Zastępstwo</dt><dd>${esc(backupName(person))}</dd></div>
        </dl>
        <div class="guide-footer-grid">
          <section class="record-section">
            <h2>Gdzie zapisujesz wyniki lub działania</h2>
            <ul class="record-list">${guide.records.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
          </section>
          <section class="completion-section">
            <h2>Kiedy zadanie jest zakończone</h2>
            <ul class="completion-list">${guide.done.map(item => `<li>${esc(item)}</li>`).join('')}</ul>
          </section>
        </div>
      </div>
    </details>`;
  }

  function render() {
    const query = normalize(search.value.trim());
    const filtered = team.filter(person => normalize([
      person.name, roleLabels[person.id], person.primaryRole, person.notesPublic,
      ...person.responsibilities.map(translate), guides[person.id]?.inBrief,
      ...(guides[person.id]?.steps || []).flat(), ...(guides[person.id]?.records || []), ...(guides[person.id]?.done || [])
    ].join(' ')).includes(query));

    list.innerHTML = filtered.length
      ? filtered.map(card).join('')
      : '<div class="empty-researchers"><strong>Brak wyników</strong><span>Spróbuj wpisać nazwisko, nazwę modułu lub konkretny obowiązek.</span></div>';
    count.textContent = query ? resultsLabel(filtered.length) : `${team.length} osób i ról`;
    expanded = false;
    expandButton.textContent = 'Rozwiń wszystkie';
  }

  search.addEventListener('input', render);
  expandButton.addEventListener('click', () => {
    expanded = !expanded;
    list.querySelectorAll('details').forEach(details => { details.open = expanded; });
    expandButton.textContent = expanded ? 'Zwiń wszystkie' : 'Rozwiń wszystkie';
  });
  document.getElementById('dutiesLogout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(COORDINATOR_SESSION_KEY);
    location.replace(`portal.html?v=${VERSION}`);
  });

  document.documentElement.classList.remove('auth-pending');
  if (requestedPerson) search.value = requestedPerson.name;
  render();
  if (requestedPerson) list.querySelector('details')?.setAttribute('open', '');
})();
