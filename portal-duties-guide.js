(() => {
  'use strict';

  const studentGuide = {
    inBrief: 'Wykonujesz pomiary podczas pierwszej wizyty i kontroli po 12 tygodniach. Pracujesz tylko na stanowiskach, do których masz potwierdzone przeszkolenie.',
    steps: [
      ['Przed dniem badawczym', 'Sprawdź w harmonogramie swoją stację, godziny i identyfikatory uczestników. Przeczytaj aktualną instrukcję wykonania pomiaru.'],
      ['Przygotuj stanowisko', 'Przygotuj sprzęt i formularze. Przed pierwszym pomiarem sprawdź identyfikator uczestnika oraz punkt badania: pierwsza wizyta albo kontrola po 12 tygodniach.'],
      ['Wykonaj pomiary', 'Wykonuj wyłącznie pomiary, do których masz potwierdzone przeszkolenie. Trzymaj się instrukcji i zapisuj wartości od razu, bez zapamiętywania ich na później.'],
      ['Sprawdź zapis', 'Porównaj wynik na urządzeniu z wynikiem w formularzu. Upewnij się, że jest jednostka, strona ciała, numer próby i informacja, czy pomiar był ważny.'],
      ['Zgłoś problem', 'Jeżeli brakuje wyniku, sprzęt nie działa albo pomiar budzi wątpliwość, zgłoś to liderowi dnia przed wyjściem uczestnika.']
    ],
    records: ['Formularz badawczy uczestnika — pierwsza wizyta lub kontrola po 12 tygodniach', 'Dysk Google projektu → arkusz „Wyniki pomiarów — pierwsza wizyta i kontrola po 12 tygodniach” → zakładka właściwej stacji', 'Lista kompletności przed zakończeniem wizyty'],
    done: ['Wszystkie przydzielone pola są uzupełnione i sprawdzone.', 'Każdy brak lub błąd został zgłoszony liderowi dnia.', 'Stanowisko i pliki są gotowe dla kolejnego uczestnika.']
  };

  window.LEAP_DUTY_GUIDES = {
    pi: {
      inBrief: 'Podejmujesz ostateczne decyzje naukowe, metodologiczne i dotyczące bezpieczeństwa projektu. Pilnujesz jakości całego badania, ale nie wykonujesz codziennej pracy za innych.',
      steps: [
        ['Rozstrzygaj problemy', 'Gdy zespół zgłasza niejasność dotyczącą protokołu, bezpieczeństwa lub metodologii, zbierz fakty i zapisz jednoznaczną decyzję dla zespołu.'],
        ['Zatwierdzaj zmiany', 'Sprawdź proponowaną zmianę w procedurze. Określ, czy wymaga ona aktualizacji protokołu, instrukcji badawczej albo zgody właściwej komisji.'],
        ['Raz w miesiącu sprawdzaj jakość', 'Przejrzyj braki danych, odstępstwa od procedur, zdarzenia niepożądane, kompletność modułów i problemy zgłoszone przez właścicieli procesów.'],
        ['Prowadź część naukową', 'Zatwierdzaj plan analiz, interpretację wyników, materiały konferencyjne i publikacje przed ich przekazaniem na zewnątrz.']
      ],
      records: ['Dysk Google projektu → „Rejestr decyzji kierownika projektu”', 'Dysk Google projektu → „Rejestr odstępstw i zdarzeń niepożądanych”', 'Dysk Google projektu → folder „Metodologia, analizy i publikacje”'],
      done: ['Decyzja ma datę, krótkie uzasadnienie i wskazaną osobę wykonującą kolejny krok.', 'Zmiana jest naniesiona we wszystkich dokumentach, których dotyczy.', 'Zespół otrzymał jasną informację, co ma zrobić.']
    },
    magda: {
      inBrief: 'Pilnujesz, aby każdy uczestnik wiedział, kiedy i gdzie ma przyjść, a każdy badacz wiedział, co ma zrobić. Jesteś właścicielką centralnego kalendarza i następnego kroku uczestnika.',
      steps: [
        ['Przyjmij potrzebę terminu', 'Badacz podaje Ci identyfikator uczestnika, rodzaj wizyty i możliwy przedział dat. Nie wystarczy informacja „trzeba umówić kontrolę”.'],
        ['Wpisz termin', 'Dodaj wizytę do centralnego kalendarza. W centralnym trackerze wpisz datę, rodzaj wizyty, status potwierdzenia i osobę odpowiedzialną.'],
        ['Potwierdź organizację', 'Potwierdź termin z rodziną i potrzebnymi badaczami. Sprawdź dostępność pomieszczenia, sprzętu i osoby prowadzącej część kliniczną.'],
        ['Wyślij przypomnienie', 'Przed wizytą przypomnij rodzinie oraz zespołowi o dacie, godzinie, miejscu i wymaganym przygotowaniu.'],
        ['Zamknij wizytę operacyjnie', 'Po wizycie zaznacz, co wykonano, czego brakuje i jaki jest kolejny krok uczestnika. Każdy uczestnik musi mieć właściciela następnego działania.']
      ],
      records: ['Dysk Google projektu → arkusz „Centralny tracker uczestników”', 'Kalendarz projektu LEAP → wszystkie wizyty i kontakty', 'Chroniony rejestr kontaktowy rodzin — poza portalem i bez kopiowania danych kontaktowych do zwykłych arkuszy'],
      done: ['Termin jest wpisany w kalendarzu i trackerze.', 'Rodzina oraz badacze otrzymali potwierdzenie.', 'Tracker pokazuje aktualny status i następny krok uczestnika.']
    },
    karol: {
      inBrief: 'Pilnujesz, aby część kliniczna pierwszej wizyty i kontroli po 12 tygodniach była wykonywana jednakowo, bezpiecznie i zgodnie z instrukcjami.',
      steps: [
        ['Przygotuj standard dnia', 'Przed blokiem sprawdź aktualne instrukcje, obsadę trudniejszych stanowisk i uczestników wymagających dodatkowej uwagi.'],
        ['Konsultuj trudne przypadki', 'Gdy screening lub wynik kliniczny budzi wątpliwość, przejrzyj informacje, zapisz zalecenie i wskaż, kto podejmuje kolejny krok.'],
        ['Szkol badaczy', 'Pokaż prawidłowe wykonanie pomiaru, obserwuj próby treningowe i sesje pod nadzorem, a następnie wpisz wynik szkolenia.'],
        ['Prowadź audyty', 'Okresowo porównuj wykonanie pomiarów z instrukcją. Zapisz błąd, działanie naprawcze i termin ponownego sprawdzenia.']
      ],
      records: ['Dysk Google projektu → „Checklista kliniczna pierwszej wizyty i kontroli po 12 tygodniach”', 'Dysk Google projektu → „Rejestr szkoleń i kompetencji badaczy”', 'Dysk Google projektu → „Rejestr audytów klinicznych”'],
      done: ['Trudny przypadek ma zapisane zalecenie i właściciela kolejnego kroku.', 'Szkolenie lub audyt ma datę, wynik i podpis osoby oceniającej.', 'Błąd ma zaplanowane działanie naprawcze.']
    },
    'mateusz-nowosad': {
      inBrief: 'Wspierasz trudniejsze pomiary kliniczne, powtarzalność wyników i szkolenie operatorów. Wchodzisz do pracy w wybranych blokach jako doświadczone zastępstwo.',
      steps: [
        ['Sprawdź przydział', 'Przed wybranym dniem potwierdź z Magdą godziny, stanowisko i uczestników, przy których potrzebne jest doświadczone wsparcie.'],
        ['Wykonaj trudniejsze testy', 'Przeprowadź przydzielone pomiary zgodnie z instrukcją i od razu wpisz wyniki do formularza badawczego.'],
        ['Wykonaj pomiary powtarzalności', 'Jeżeli uczestnik jest w podbadaniu powtarzalności, wykonaj niezależny pomiar i oznacz osobę mierzącą oraz kolejność pomiaru.'],
        ['Oceń operatora', 'Podczas szkolenia zapisz, co operator wykonał prawidłowo, co wymaga poprawy i czy może pracować samodzielnie.']
      ],
      records: ['Formularz badawczy uczestnika — właściwa stacja', 'Dysk Google projektu → arkusz „Podbadanie powtarzalności pomiarów”', 'Dysk Google projektu → „Rejestr szkoleń i audytów operatorów”'],
      done: ['Wynik zawiera identyfikator uczestnika, punkt badania i osobę mierzącą.', 'Ocena operatora kończy się jasną decyzją: dalsze szkolenie albo dopuszczenie.']
    },
    filip: {
      inBrief: 'Pilnujesz całej serii dziesięciu sesji z laserem lub zabiegiem pozorowanym: obsady, parametrów urządzenia, kompletności zapisów i bezpieczeństwa.',
      steps: [
        ['Podaj dostępne terminy', 'Przekaż Magdzie dostępność operatorów. Magda wpisuje uczestnika do centralnego kalendarza i potwierdza termin z rodziną.'],
        ['Przygotuj serię', 'Sprawdź, czy zaplanowano dziesięć sesji w ciągu dwóch tygodni, czy jest operator główny i zastępca oraz czy dokumentacja jest gotowa.'],
        ['Po każdej sesji wpisz dane', 'Zapisz numer sesji, datę, godzinę, operatora, ustawienia urządzenia, wykonanie pełnej procedury oraz ewentualny problem.'],
        ['Pilnuj zaślepienia', 'Nie ujawniaj przydziału uczestnikowi ani osobom wykonującym późniejszą ocenę. Każde możliwe naruszenie zaślepienia zgłoś od razu.'],
        ['Zamknij moduł', 'Po dziesiątej sesji sprawdź kompletność wszystkich wierszy, regularność udziału oraz zgłoszone zdarzenia i odstępstwa.']
      ],
      records: ['Dysk Google projektu → arkusz „Laser lub zabieg pozorowany — sesje 1–10”', 'Dysk Google projektu → formularz „Parametry urządzenia i wykonanie sesji”', 'Dysk Google projektu → „Rejestr zdarzeń niepożądanych i odstępstw”'],
      done: ['Każda sesja ma numer, datę, operatora i komplet parametrów.', 'Brak sesji albo problem ma opis i zaplanowane działanie.', 'Po zakończeniu serii arkusz ma potwierdzoną kompletność.']
    },
    maciej: {
      inBrief: 'Odpowiadasz za przygotowanie kamer OpenCap, poprawne nagrania, nazwy plików, kopię zapasową i pierwszą kontrolę jakości maksymalnie do 48 godzin.',
      steps: [
        ['Przed blokiem przygotuj sprzęt', 'Sprawdź kamery, statywy, zasilanie, wolne miejsce i akcesoria. Wykonaj kalibrację zgodnie z instrukcją.'],
        ['Przed nagraniem sprawdź oznaczenie', 'Używaj wyłącznie identyfikatora uczestnika oraz punktu badania, na przykład pierwsza wizyta albo kontrola po 12 tygodniach.'],
        ['Wykonaj i sprawdź nagranie', 'Po każdej próbie sprawdź, czy widać całe zadanie, wszystkie kamery nagrały materiał i plik ma prawidłową nazwę.'],
        ['Wyeksportuj i wykonaj kopię', 'Umieść pliki w folderze uczestnika, wykonaj kopię zapasową i zaznacz zakończenie eksportu na checkliście.'],
        ['Do 48 godzin wykonaj kontrolę jakości', 'Sprawdź kompletność prób i możliwość przetworzenia nagrań. Braki opisz konkretnie i zgłoś Magdzie oraz właścicielowi analizy.']
      ],
      records: ['Dysk Google projektu → folder „OpenCap” → identyfikator uczestnika → punkt badania', 'Dysk Google projektu → „Checklista gotowości i kalibracji OpenCap”', 'Dysk Google projektu → arkusz „Kontrola jakości OpenCap — do 48 godzin”'],
      done: ['Każda wymagana próba ma prawidłową nazwę i znajduje się w odpowiednim folderze.', 'Istnieje kopia zapasowa.', 'Kontrola jakości ma status: poprawne albo konkretny brak do naprawy.']
    },
    alicja: {
      inBrief: 'Prowadzisz 12-tygodniową rehabilitację uczestników ze zmianami Osgood–Schlatter i pilnujesz, aby każda wizyta oraz wynik były zapisane.',
      steps: [
        ['Rozpocznij program', 'Na wizycie początkowej oceń tolerancję obciążenia, wybierz główny obszar pracy i wyjaśnij uczestnikowi oraz rodzicowi plan rehabilitacji.'],
        ['Zaplanuj ćwiczenia', 'Zapisz podstawowy zestaw ćwiczeń, główny moduł wynikający z deficytu oraz ewentualny drugi moduł. Dodaj poziom startowy aktywności.'],
        ['Na każdej kontroli zbierz te same informacje', 'W tygodniu 4, 8 i 12 zapisz ból, tolerancję obciążenia, wykonanie ćwiczeń, poziom aktywności i powód każdej zmiany programu.'],
        ['Uzupełnij kwestionariusz funkcjonowania kolana KOOS-Child', 'Sprawdź kompletność odpowiedzi i wpisz wynik zgodnie z instrukcją punktacji tego kwestionariusza.'],
        ['Po każdym kontakcie zaktualizuj arkusz', 'Wpisz datę, etap programu, wykonane elementy, wyniki, zmianę planu i następny termin. Brak wpisu oznacza niezakończoną wizytę.']
      ],
      records: ['Dysk Google projektu → arkusz „Rehabilitacja — zmiany Osgood–Schlatter”', 'Dysk Google projektu → folder „Materiały i nagrania ćwiczeń — Osgood–Schlatter”', 'Dysk Google projektu → arkusz „Kwestionariusz funkcjonowania kolana KOOS-Child — wyniki”', 'Dysk Google projektu → „Dzienniczek aktywności i wykonania ćwiczeń”'],
      done: ['Każda wizyta ma datę, wyniki, opis wykonanych ćwiczeń i następny krok.', 'Wynik KOOS-Child jest policzony i sprawdzony.', 'Arkusz pokazuje kompletność programu do aktualnego tygodnia.']
    },
    natalia: {
      inBrief: 'Prowadzisz 12-tygodniową rehabilitację uczestników ze zmianami Severa i pilnujesz kompletnego zapisu każdej wizyty, ćwiczeń oraz wyników.',
      steps: [
        ['Rozpocznij program', 'Na wizycie początkowej oceń tolerancję obciążenia, wybierz główny obszar pracy i wyjaśnij uczestnikowi oraz rodzicowi plan rehabilitacji.'],
        ['Zaplanuj ćwiczenia', 'Zapisz podstawowy zestaw ćwiczeń, główny moduł wynikający z deficytu oraz ewentualny drugi moduł. Dodaj poziom startowy aktywności.'],
        ['Na każdej kontroli zbierz te same informacje', 'W tygodniu 4, 8 i 12 zapisz ból, tolerancję obciążenia, wykonanie ćwiczeń, poziom aktywności i powód każdej zmiany programu.'],
        ['Uzupełnij kwestionariusz funkcjonowania stopy i stawu skokowego OxAFQ-C', 'Sprawdź, czy użyto właściwej wersji kwestionariusza, zweryfikuj kompletność odpowiedzi i wpisz wynik zgodnie z instrukcją punktacji.'],
        ['Po każdym kontakcie zaktualizuj arkusz', 'Wpisz datę, etap programu, wykonane elementy, wyniki, zmianę planu i następny termin. Brak wpisu oznacza niezakończoną wizytę.']
      ],
      records: ['Dysk Google projektu → arkusz „Rehabilitacja — zmiany Severa”', 'Dysk Google projektu → folder „Materiały i nagrania ćwiczeń — Sever”', 'Dysk Google projektu → arkusz „Kwestionariusz funkcjonowania stopy i stawu skokowego OxAFQ-C — wyniki”', 'Dysk Google projektu → „Dzienniczek aktywności i wykonania ćwiczeń”'],
      done: ['Każda wizyta ma datę, wyniki, opis wykonanych ćwiczeń i następny krok.', 'Wynik OxAFQ-C jest policzony i sprawdzony.', 'Arkusz pokazuje kompletność programu do aktualnego tygodnia.']
    },
    weronika: {
      inBrief: 'Prowadzisz rekrutację zdrowej grupy kontrolnej i dziewcząt, pilnujesz kompletności ich pierwszych pomiarów oraz regularnie pomagasz przy stanowiskach pomiarowych.',
      steps: [
        ['Dodaj kandydata do chronionego rejestru', 'Zapisz wymagane kryteria rekrutacyjne i status kontaktu. W zwykłym portalu używaj wyłącznie identyfikatora, bez danych kontaktowych.'],
        ['Przygotuj dopasowanie', 'Zapisz cechy potrzebne do dobrania zdrowej osoby kontrolnej i wskaż, do którego uczestnika lub grupy może zostać dopasowana.'],
        ['Przekaż termin Magdzie', 'Podaj Magdzie identyfikator, rodzaj wizyty i możliwy termin. Magda umawia wizytę i wpisuje ją do centralnego kalendarza.'],
        ['Po pierwszej wizycie sprawdź kompletność', 'Upewnij się, że wykonano wszystkie wymagane pomiary zdrowej kontroli oraz że każdy brak ma właściciela i termin uzupełnienia.'],
        ['W dni badawcze wykonuj przydzieloną stację', 'Sprawdź w harmonogramie konkretną stację i wpisz wyniki tak samo jak pozostali przeszkoleni badacze.']
      ],
      records: ['Chroniony rejestr „Rekrutacja zdrowych kontroli i dziewcząt”', 'Dysk Google projektu → arkusz „Baza grupy kontrolnej”', 'Formularz badawczy uczestnika — pierwsza wizyta lub kontrola po 12 tygodniach', 'Dysk Google projektu → arkusz „Wyniki pomiarów — pierwsza wizyta i kontrola po 12 tygodniach”'],
      done: ['Kandydat ma aktualny status i kolejny krok.', 'Wizyta zdrowej kontroli ma sprawdzoną kompletność.', 'Postęp rekrutacji jest zaktualizowany w bazie.']
    },
    julia: {
      inBrief: 'Pilnujesz kontaktu kontrolnego po zakończeniu głównych etapów projektu oraz kompletności informacji o powrocie do sportu, nawrotach i dalszym leczeniu.',
      steps: [
        ['Sprawdź listę kontaktów do wykonania', 'Pracuj na identyfikatorach uczestników i terminach przekazanych przez Magdę. Nie kopiuj danych kontaktowych do zwykłych arkuszy.'],
        ['Przeprowadź kontakt według jednego skryptu', 'Zbierz informacje o powrocie do sportu, nawrocie dolegliwości, dalszym leczeniu, nowych urazach i aktualnym poziomie aktywności.'],
        ['Zapisz wynik kontaktu', 'Wpisz datę, sposób kontaktu, komplet odpowiedzi i ewentualną potrzebę ponownego kontaktu.'],
        ['Ponów kontakt według procedury', 'Po nieudanej próbie wpisz jej datę i zaplanuj kolejną. Nie zostawiaj uczestnika bez statusu.'],
        ['Sprawdź kompletność modułu', 'Przed zamknięciem rekordu upewnij się, że wszystkie wymagane pola są uzupełnione i gotowe do analizy.']
      ],
      records: ['Dysk Google projektu → arkusz „Baza kontaktów kontrolnych po zakończeniu programu”', 'Dysk Google projektu → „Rejestr prób kontaktu kontrolnego”', 'Dysk Google projektu → folder „Instrukcja i formularz kontaktu kontrolnego”'],
      done: ['Kontakt ma datę, wynik i status.', 'Brak kontaktu ma zaplanowaną kolejną próbę.', 'Zamknięty rekord zawiera wszystkie wymagane odpowiedzi.']
    },
    marta: {
      inBrief: 'Pilnujesz, aby kwestionariusz funkcjonowania kolana KOOS-Child był zawsze podawany w tej samej, właściwej wersji, a wynik był policzony i zapisany według jednej instrukcji.',
      steps: [
        ['Utrzymuj właściwą wersję', 'Oznacz aktualny formularz numerem wersji i datą. Wycofane wersje przenieś do archiwum, aby nie były używane przypadkowo.'],
        ['Przeszkol osoby zbierające skalę', 'Pokaż sposób przekazania instrukcji uczestnikowi i zasady sprawdzania brakujących odpowiedzi.'],
        ['Sprawdź formularz', 'Przed zakończeniem wizyty sprawdź, czy wszystkie odpowiedzi są zaznaczone. Braki wyjaśnij zgodnie z instrukcją, bez podpowiadania odpowiedzi.'],
        ['Policz i zapisz wynik', 'Zastosuj ustaloną punktację, zapisz wynik oraz informację o ewentualnych brakach. Druga osoba powinna sprawdzić nietypowy wynik.']
      ],
      records: ['Dysk Google projektu → folder „Narzędzia badawcze → KOOS-Child”', 'Dysk Google projektu → arkusz „KOOS-Child — wyniki”', 'Dysk Google projektu → „Rejestr wersji i szkoleń KOOS-Child”'],
      done: ['Użyto aktualnej wersji formularza.', 'Wynik jest policzony zgodnie z instrukcją i zapisany przy właściwym identyfikatorze.', 'Każdy brak odpowiedzi ma wyjaśniony status.']
    },
    sandra: {
      inBrief: 'Pilnujesz właściwej wersji kwestionariusza funkcjonowania stopy i stawu skokowego OxAFQ-C dla dziecka i rodzica, jednolitego sposobu jego podawania oraz poprawnego policzenia wyników.',
      steps: [
        ['Utrzymuj właściwe wersje', 'Oznacz aktualny formularz dla dziecka i formularz dla rodzica numerem wersji oraz datą. Wycofane wersje przenieś do archiwum.'],
        ['Przeszkol osoby zbierające skalę', 'Wyjaśnij, której wersji użyć, jak przekazać instrukcję i jak postąpić przy brakującej odpowiedzi.'],
        ['Sprawdź formularze', 'Przed zakończeniem wizyty upewnij się, że użyto właściwej wersji i sprawdzono wszystkie wymagane odpowiedzi.'],
        ['Policz i zapisz wynik', 'Zastosuj ustaloną punktację oddzielnie dla właściwej wersji i zapisz wynik przy poprawnym identyfikatorze uczestnika.']
      ],
      records: ['Dysk Google projektu → folder „Narzędzia badawcze → OxAFQ-C”', 'Dysk Google projektu → arkusz „OxAFQ-C — wyniki”', 'Dysk Google projektu → „Rejestr wersji i szkoleń OxAFQ-C”'],
      done: ['Użyto właściwej, aktualnej wersji skali.', 'Wynik jest policzony i zapisany przy właściwym identyfikatorze.', 'Każdy brak odpowiedzi ma wyjaśniony status.']
    },
    nikodem: {
      inBrief: 'W wybranych dniach wykonujesz pomiar siły dynamometrem ręcznym oraz testy prowokujące ból, zgodnie z konkretnym przydziałem i potwierdzonym przeszkoleniem.',
      steps: [
        ['Sprawdź konkretny przydział', 'Przed blokiem sprawdź godzinę, stanowisko, zastępcę i identyfikatory uczestników.'],
        ['Przygotuj sprzęt', 'Sprawdź dynamometr ręczny, ustawienia, pozycję badanego i wymaganą liczbę prób.'],
        ['Wykonaj i zapisz każdą próbę', 'Wpisz stronę ciała, wartość, jednostkę, numer próby i powód odrzucenia próby, jeśli wystąpił.'],
        ['Sprawdź kompletność', 'Porównaj wynik na urządzeniu z formularzem i zgłoś brak lub nietypowy wynik przed zakończeniem wizyty.']
      ],
      records: ['Formularz badawczy uczestnika → „Pomiar siły dynamometrem ręcznym” i „Testy prowokujące ból”', 'Dysk Google projektu → arkusz „Wyniki pomiarów — pierwsza wizyta i kontrola po 12 tygodniach” → zakładka „Siła i ból”', 'Lista kompletności wizyty'],
      done: ['Każda wymagana próba ma wartość, jednostkę i stronę ciała.', 'Odrzucona próba ma podany powód.', 'Wyniki w formularzu i arkuszu są zgodne.']
    },
    tymon: {
      inBrief: 'W wybranych dniach wykonujesz pomiary zakresu ruchu i antropometrii, zgodnie z konkretnym przydziałem i potwierdzonym przeszkoleniem.',
      steps: [
        ['Sprawdź konkretny przydział', 'Przed blokiem sprawdź godzinę, stanowisko, zastępcę i identyfikatory uczestników.'],
        ['Przygotuj stanowisko', 'Sprawdź przyrządy pomiarowe, ustawienie uczestnika i jednostki wymagane w formularzu.'],
        ['Wykonaj pomiary', 'Zapisuj każdy wynik od razu: stronę ciała, wartość, jednostkę i numer próby, jeśli wymagane są powtórzenia.'],
        ['Sprawdź kompletność', 'Porównaj zapis z formularzem i zgłoś brak lub nietypowy wynik przed zakończeniem wizyty.']
      ],
      records: ['Formularz badawczy uczestnika → „Zakres ruchu” i „Antropometria”', 'Dysk Google projektu → arkusz „Wyniki pomiarów — pierwsza wizyta i kontrola po 12 tygodniach” → zakładka „Zakres ruchu i antropometria”', 'Lista kompletności wizyty'],
      done: ['Każdy wynik ma stronę ciała i jednostkę.', 'Wymagane powtórzenia są kompletne.', 'Wyniki w formularzu i arkuszu są zgodne.']
    },
    'student-1': studentGuide,
    'student-2': studentGuide,
    'student-3': studentGuide,
    'student-4': studentGuide,
    'data-qc-vacant': {
      inBrief: 'To obecnie nieobsadzona rola. Do czasu wyznaczenia osoby kierownik projektu pilnuje raportu braków, zapytań do danych, wersji dokumentów i gotowości bazy.',
      steps: [
        ['Raz w tygodniu przygotuj raport braków', 'Sprawdź, które formularze, wyniki lub pliki są niekompletne. Każdy brak przypisz do konkretnej osoby i terminu.'],
        ['Prowadź zapytania do danych', 'Zapisz identyfikator uczestnika, pole lub plik, opis problemu, właściciela, termin i status rozwiązania.'],
        ['Sprawdzaj nazwy i identyfikatory', 'Upewnij się, że formularze i pliki używają właściwego identyfikatora oraz znajdują się w odpowiednim folderze.'],
        ['Kontroluj dokumenty', 'Pilnuj numeru wersji, daty obowiązywania i potwierdzenia zapoznania się zespołu z aktualną instrukcją.'],
        ['Przygotuj bazę do zamknięcia', 'Przed zamknięciem sprawdź, czy wszystkie braki i odstępstwa są rozwiązane albo formalnie opisane.']
      ],
      records: ['Dysk Google projektu → arkusz „Braki danych i zapytania do danych”', 'Dysk Google projektu → „Rejestr odstępstw”', 'Dysk Google projektu → „Rejestr wersji dokumentów i potwierdzeń”', 'Dysk Google projektu → checklista „Gotowość bazy do zamknięcia”'],
      done: ['Każdy brak ma właściciela, termin i status.', 'Aktualne instrukcje mają numer wersji oraz datę.', 'Nierozwiązane problemy są widoczne dla kierownika projektu.']
    }
  };
})();
