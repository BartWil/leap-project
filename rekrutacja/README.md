# Landing rekrutacyjny

Aktualna wersja kampanii jest dostępna po wdrożeniu pod adresem:

`https://bartwil.github.io/leap-project/rekrutacja/`

## Przed publikacją kampanii

1. Podglądy raportu są generowane z `demo-raport-sportowiec.html`, który zawiera wyłącznie dane demonstracyjne. Aby odtworzyć PNG, uruchom `node scripts/generate-recruitment-previews.cjs` z ustawioną zmienną `NODE_PATH` wskazującą na bundlowane moduły Codex (Playwright).
2. Sprawdź aktualne kryteria rekrutacji i edytuj tylko tekst w sekcji „Kogo obecnie szukamy?”.
3. CTA prowadzi do stałego formularza: `https://badaniasport.pl/formularz-zgloszeniowy-zdrowy-sportowiec`.

## Własna subdomena

GitHub Pages przypisuje domenę do katalogu głównego wdrożonej strony, a nie do podkatalogu. Aby użyć `rekrutacja.badaniasport.pl` bez `/rekrutacja/`, należy wdrożyć zawartość tego katalogu jako osobną stronę Pages (osobne repozytorium lub osobny artefakt wdrożeniowy) i w jej katalogu głównym dodać plik `CNAME` z treścią `rekrutacja.badaniasport.pl`. Następnie w DNS domeny `badaniasport.pl` dodać rekord CNAME subdomeny wskazujący adres Pages podany przez GitHub.
