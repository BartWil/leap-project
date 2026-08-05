(() => {
  'use strict';

  const SESSION_KEY = 'leap-portal-authenticated';
  const VERSION = '20260805-3';

  if (sessionStorage.getItem(SESSION_KEY) !== 'true') {
    location.replace(`portal.html?v=${VERSION}`);
    return;
  }

  const terms = [
    { term: 'AE', alias: 'Zdarzenie niepożądane', definition: 'Każde niepożądane zdarzenie dotyczące uczestnika podczas udziału w projekcie. Trzeba je zapisać i przekazać osobie odpowiedzialnej za ocenę bezpieczeństwa.' },
    { term: 'Adherence', alias: 'Realizacja planu', definition: 'Informacja, w jakim stopniu uczestnik wykonał zaplanowane sesje, ćwiczenia lub zalecenia.' },
    { term: 'Badacz oceniający', alias: 'Assessor', definition: 'Osoba wykonująca pomiary i testy zgodnie z instrukcją projektu. Zapisuje wyniki, ale nie zmienia sposobu wykonania testu.' },
    { term: 'Beighton', alias: 'Ocena ruchomości stawów', definition: 'Zestaw prostych prób służących do oceny zwiększonej ruchomości stawów.' },
    { term: 'Clinical Lead', alias: 'Osoba prowadząca część kliniczną', definition: 'Osoba odpowiedzialna w danym dniu za prawidłowe i bezpieczne wykonanie części klinicznej badania.' },
    { term: 'Consent / assent', alias: 'Zgoda na udział', definition: 'Formalna zgoda rodzica lub opiekuna oraz odpowiednia do wieku zgoda dziecka na udział w projekcie.' },
    { term: 'CRF', alias: 'Formularz badania', definition: 'Formularz, w którym zapisujemy wszystkie wymagane dane z wizyty lub etapu badania.' },
    { term: 'Data query', alias: 'Pytanie do danych', definition: 'Prośba o sprawdzenie, uzupełnienie albo poprawienie konkretnego wpisu w danych.' },
    { term: 'Follow-up', alias: 'Późniejsza kontrola', definition: 'Kontakt po zakończeniu programu, który pozwala sprawdzić dalszy stan uczestnika, powrót do aktywności i ewentualny nawrót dolegliwości.' },
    { term: 'FPI', alias: 'Foot Posture Index', definition: 'Ocena ustawienia stopy wykonywana według ujednoliconej skali.' },
    { term: 'Grupa kontrolna', alias: 'Healthy control', definition: 'Młode osoby bez badanych zmian przeciążeniowych kończyn dolnych. Ich wyniki służą do porównania.' },
    { term: 'HHD', alias: 'Ręczny dynamometr', definition: 'Niewielkie urządzenie używane do pomiaru siły mięśni.' },
    { term: 'KOOS-Child', alias: 'Kwestionariusz kolana', definition: 'Kwestionariusz dla dzieci i młodzieży dotyczący objawów, funkcji kolana oraz codziennej aktywności.' },
    { term: 'Kwalifikacja lekarska', alias: 'Decyzja o udziale', definition: 'Ocena wykonywana przez lekarza, która potwierdza, czy kandydat spełnia wymagania i może bezpiecznie uczestniczyć w projekcie.' },
    { term: 'LLLT', alias: 'Terapia światłem o małej mocy', definition: 'Badana interwencja wykonywana według ustalonego protokołu projektu.' },
    { term: 'Moduł LTP', alias: 'Element projektu', definition: 'Element algorytmu projektu, który pomaga uporządkować informacje potrzebne do dalszego prowadzenia rehabilitacji.' },
    { term: 'NPRS', alias: 'Skala bólu 0–10', definition: 'Prosta skala, w której 0 oznacza brak bólu, a 10 najsilniejszy ból, jaki uczestnik potrafi sobie wyobrazić.' },
    { term: 'OpenCap', alias: 'Analiza ruchu', definition: 'System wykorzystujący nagrania z kamer do analizy sposobu poruszania się uczestnika.' },
    { term: 'OxAFQ-C', alias: 'Kwestionariusz stopy i stawu skokowego', definition: 'Kwestionariusz dla dzieci i rodziców dotyczący funkcjonowania stopy i stawu skokowego.' },
    { term: 'PI', alias: 'Kierownik projektu', definition: 'Osoba odpowiedzialna za całość projektu oraz najważniejsze decyzje naukowe, metodologiczne i dotyczące bezpieczeństwa.' },
    { term: 'Podbadanie rzetelności', alias: 'Reliability substudy', definition: 'Sprawdzenie, czy powtórzony pomiar albo pomiar wykonany przez różne osoby daje podobny wynik.' },
    { term: 'PROM', alias: 'Wynik zgłaszany przez uczestnika', definition: 'Kwestionariusz wypełniany przez dziecko lub rodzica, opisujący między innymi dolegliwości, funkcję i codzienną aktywność.' },
    { term: 'Randomizacja', alias: 'Losowy przydział', definition: 'Losowy przydział uczestnika do jednej z porównywanych procedur, wykonywany według zasad projektu.' },
    { term: 'REHAB', alias: 'Program rehabilitacji', definition: 'Ustalony w projekcie 12-tygodniowy program postępowania zachowawczego.' },
    { term: 'ROM', alias: 'Zakres ruchu', definition: 'Wielkość ruchu możliwego do wykonania w badanym stawie.' },
    { term: 'Screening', alias: 'Wstępne sprawdzenie', definition: 'Pierwsze sprawdzenie, czy kandydat może przejść do dalszej kwalifikacji do projektu.' },
    { term: 'Sham', alias: 'Procedura pozorowana', definition: 'Procedura wyglądająca tak samo jak badana interwencja, ale bez aktywnej dawki. Służy do rzetelnego porównania wyników.' },
    { term: 'SOP', alias: 'Standardowa instrukcja pracy', definition: 'Aktualna instrukcja opisująca krok po kroku, jak wykonać daną procedurę projektu.' },
    { term: 'T0', alias: 'Pomiar początkowy', definition: 'Pierwsza pełna ocena uczestnika, wykonywana przed rozpoczęciem interwencji i programu rehabilitacji.' },
    { term: 'T1', alias: 'Pomiar po interwencji', definition: 'Ocena wykonywana po zakończeniu 10 sesji LLLT lub sham, przed przejściem do kolejnego etapu projektu.' },
    { term: 'W0', alias: 'Początek rehabilitacji', definition: 'Moment rozpoczęcia 12-tygodniowego programu rehabilitacji.' },
    { term: 'W4', alias: 'Kontrola po 4 tygodniach', definition: 'Kontrola realizacji i postępu po czterech tygodniach programu rehabilitacji.' },
    { term: 'W8', alias: 'Kontrola po 8 tygodniach', definition: 'Kontrola realizacji i postępu po ośmiu tygodniach programu rehabilitacji.' },
    { term: 'W12', alias: 'Koniec rehabilitacji', definition: 'Końcowa ocena po 12 tygodniach programu rehabilitacji.' },
    { term: 'USG', alias: 'Badanie ultrasonograficzne', definition: 'Nieinwazyjne badanie obrazowe wykonywane według protokołu projektu.' },
    { term: 'YBT', alias: 'Y-Balance Test', definition: 'Test równowagi, w którym uczestnik stojąc na jednej nodze sięga drugą nogą w kilku kierunkach.' },
    { term: 'Zaślepienie', alias: 'Blinding', definition: 'Ograniczenie informacji o przydzielonej interwencji, aby wiedza ta nie wpływała na pomiary lub ocenę wyników.' },
    { term: 'Zmiany Osgood–Schlatter', alias: 'Okolica kolana', definition: 'Zmiany przeciążeniowe w okolicy guzowatości kości piszczelowej u rosnącej młodzieży.' },
    { term: 'Zmiany Severa', alias: 'Okolica pięty', definition: 'Zmiany przeciążeniowe apofizy kości piętowej u rosnącej młodzieży.' },
    { term: 'Zmiana względem protokołu', alias: 'Deviation', definition: 'Sytuacja, w której postępowanie odbiega od zatwierdzonego protokołu lub instrukcji. Wymaga zapisania i wyjaśnienia.' },
    { term: 'QC', alias: 'Kontrola jakości', definition: 'Sprawdzenie, czy dane i procedury są kompletne, spójne oraz wykonane zgodnie z aktualną instrukcją.' }
  ].sort((a, b) => a.term.localeCompare(b.term, 'pl', { numeric: true }));

  const list = document.getElementById('glossaryList');
  const search = document.getElementById('glossarySearch');
  const count = document.getElementById('glossaryCount');
  const empty = document.getElementById('glossaryEmpty');
  const normalize = value => value.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function render() {
    const query = normalize(search.value.trim());
    const visible = terms.filter(item => normalize(`${item.term} ${item.alias} ${item.definition}`).includes(query));

    list.innerHTML = visible.map(item => `
      <div class="glossary-item">
        <dt>${item.term}<small>${item.alias}</small></dt>
        <dd>${item.definition}</dd>
      </div>
    `).join('');

    count.textContent = query ? `Znaleziono: ${visible.length}` : `${terms.length} terminów i wyjaśnień`;
    empty.hidden = visible.length !== 0;
  }

  search.addEventListener('input', render);
  document.getElementById('glossaryLogout').addEventListener('click', () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('leap-coordinator-authenticated');
    location.replace(`portal.html?v=${VERSION}`);
  });

  render();
  document.documentElement.classList.remove('auth-pending');
})();
