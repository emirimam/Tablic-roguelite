# Napredak

| Milestone | Status | Datum |
|---|---|---|
| M0 Postavljanje | ✅ (bez GitHub Actions CI) | 2026-10-28 |
| M1 Pravila | ✅ | 2026-10-28 |
| M2 Bodovanje | ✅ | 2026-10-28 |
| M3 Igriva runda | ✅ | 2026-10-28 |
| M4 Struktura partije | ✅ | 2026-10-28 |
| M5 Sadržaj | ✅ (bez debug menija) | 2026-10-28 |
| M6 Juice/art/zvuk | 🟡 placeholder portreti, sintetizovani zvuk | 2026-10-28 |
| M7 Meta/save/tutorijal | ✅ (bez provjere s 2 testna igrača) | 2026-10-28 |
| M8 Balans | 🟡 prvi krug, vidi `docs/BALANCE.md` | 2026-10-28 |
| M9 Platforme | 🟡 web na Vercelu; Electron/Steam nije rađen | 2026-10-28 |
| M10 Lansiranje | ⏳ | |

## Urađeno
- `src/core`: seeded RNG sa streamovima; pravila Tablića (particija u grupe, as 1/11, divlje karte, Mađioničar); bodovanje po GDD §5.4 sa `ScoreStep` događajima; runda (nošenje, spuštanje, prisilno spuštanje i odbacivanje, dopuna, gazde); partija (8 kafana, 12 gazda, beskonačni mod); Šank (reroll, prodaja, investicije); 5 vrsta tura; 33 gosta, 6 rakija, 15 fildžana, poboljšanja, pečati i edicije; 6 špilova, 5 uloga, 24 dostignuća; meta-progresija; snimanje s migracijama.
- 98 unit testova (golden bodovanje, property test particija, determinizam, gazde, šank, fildžani, tutorijal, i18n konzistentnost).
- UI (DOM): meni, prvo pokretanje ("Znaš li Tablić?"), tutorijal od 3 lekcije, nova partija (špil, uloga, seed), mapa kafane, runda s animacijom brojanja Chips × Mult, Tabla sekvenca, isplata, Šank, ture, kraj partije, kolekcija, statistika, podešavanja, pravila. Miš, dodir (dugo držanje = opis), tastatura i gamepad.
- Audio: sintetizovani SFX i proceduralna "tamburaška" muzika (3 teme).
- `npm run sim` (greedy i smart bot) i `npm run smoke` (E2E kroz pravi Chrome).

## Odstupanja od specifikacije
Vidi `docs/DECISIONS.md` (DOM umjesto Pixija, TS 6, CDP smoke umjesto Playwrighta, balans).

## Poznati bugovi i ograničenja
- Portreti gostiju su emoji placeholderi.
- Preraspoređivanje gostiju prevlačenjem radi samo mišem; na dodir i gamepadu se koriste strelice ◀ ▶.
- Nema CI (GitHub Actions) ni Electron builda.

## Playtest
