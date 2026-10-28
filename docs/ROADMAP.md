# TABLA — Roadmap (milestoneovi)

Na kraju svakog milestonea Claude Code staje, ažurira `docs/PROGRESS.md` i čeka da igrač isproba build.

## M0 — Postavljanje projekta
- Vite + TS strict, ESLint/Prettier, Vitest, Playwright, GitHub Actions CI.
- Struktura direktorija iz TECH_SPEC §2, i18n skelet (`bs`, `en`), `Platform` interfejs + web implementacija.
- Pixi aplikacija sa skaliranjem na virtualnu rezoluciju i praznim glavnim menijem.
- Prazni `docs/DECISIONS.md`, `docs/PROGRESS.md`, `ASSETS_LICENSES.md`.

**Prihvatanje:** `npm run dev` prikazuje meni koji se skalira; `typecheck`, `lint`, `test` i CI prolaze; ESLint pravilo blokira import iz `core` prema van.

## M1 — Jezgro pravila Tablića
- `rng.ts` (seeded, streamovi), `cards.ts`, `capture.ts` (enumeracija, validacija, asovi, divlje karte), `round.ts` (capture/lay, refill ruke i stola, limit stola, win/lose, prisilno spuštanje).

**Prihvatanje:** ≥40 unit testova uključujući rubne slučajeve iz GDD §3–4; property-based testovi za particiju; determinizam test (isti seed i akcije daju identično stanje).

## M2 — Bodovanje
- Tipovi nošenja, leveli, Tabla, `ScoreStep[]` pipeline po GDD §5.4, preview mod za UI.

**Prihvatanje:** testovi za svaki tip i redoslijed koraka; "golden" testovi s ručno izračunatim primjerima (najmanje 10).

## M3 — Igriva runda (greybox)
- Render stola, ruke i karata (proceduralno), interakcija nošenja i spuštanja (GDD §7.1) mišem, dodirom i gamepadom, prikaz Chips × Mult, animacijski red s osnovnim tweenovima.

**Prihvatanje:** cijela runda se može odigrati u browseru do pobjede ili poraza; NOSI je aktivan samo za validan izbor; NAJBOLJE radi; Playwright smoke test odigra rundu.

## M4 — Struktura partije
- Kafane, 3 runde, mapa kafane, Gazde (svih 12), ekonomija (GDD §4.3), Šank (slotovi, reroll, prodaja), ture, kraj partije, beskonačni mod.

**Prihvatanje:** cijela partija se može odigrati od kafane 1 do pobjede ili poraza (uz debug cheat za pare); svaki gazda ima test.

## M5 — Sav sadržaj
- 33 gosta, 6 rakija, 15 fildžana, poboljšanja, pečati, edicije, 8 investicija, 5 tura, prema CONTENT.md.
- Tooltipi s opisima, preraspoređivanje gostiju (drag i gamepad).

**Prihvatanje:** svaki unos iz CONTENT.md ima JSON, hook, i18n (bs+en) i ≥1 test; test konzistentnosti JSON ↔ registar prolazi; debug meni za dodavanje bilo kog predmeta.

## M6 — "Juice", art i zvuk
- Animacije brojanja, screen shake, čestice, Tabla sekvenca, trešnja multa, hover nagib karata, CRT filter (opcija).
- Finalni vizual karata, placeholder portreti gostiju zamijenjeni finalnim (ili kvalitetnim stiliziranim ikonama), UI tema kafane.
- Audio: SFX set, 3 muzičke numere, miksanje, slajderi jačine. Sve u `ASSETS_LICENSES.md`.

**Prihvatanje:** opcije brzine i smanjenih pokreta rade; svaki asset ima licencu; 60 FPS u Chrome Performance profilu na srednjem laptopu.

## M7 — Meta, snimanje, tutorijal
- Autosave i nastavak, migracije, meta stanje: otključavanja, kolekcija, statistika, dostignuća (lokalno), špilovi i uloge, seed unos i prikaz, podešavanja (GDD §7), tutorijal (3 vođene runde), ekran Pravila.

**Prihvatanje:** zatvaranje taba usred runde i ponovno otvaranje vraća igru na isto mjesto; test migracije; tutorijal se može završiti bez prethodnog znanja Tablića (provjera s 2 testna igrača).

## M8 — Balans
- Simulator i botovi (TECH_SPEC §10), izvještaj u `docs/BALANCE.md`, podešavanje brojki u `data/` dok se ne postignu ciljevi. Svaka promjena brojke se bilježi u BALANCE.md.

**Prihvatanje:** ciljevi iz TECH_SPEC §10 su ispunjeni na 10.000 simuliranih partija; nijedan gost nije "obavezan" ni "mrtav".

## M9 — Platforme
- Electron build (Win/Mac/Linux), Steamworks: dostignuća, Steam Cloud, Rich Presence, overlay; fullscreen/prozor; Steam Deck: kontrole, rezolucija 1280×800, čitljivost teksta, virtuelna tastatura za seed.
- Web demo build (DEMO flag: kafane 1–2, zatim CTA "Wishlist na Steamu"), deploy na Vercel ili itch.io.

**Prihvatanje:** build se pokreće na sve 3 platforme; dostignuće se otključava u Steam test okruženju (App ID iz `.env`, nikad u repozitoriju); demo se završava nakon kafane 2 i progres se ne prenosi u punu igru (ili se prenosi, odluka u DECISIONS).

## M10 — Priprema za lansiranje
- Prolazak kroz `docs/RELEASE_CHECKLIST.md`, QA prolaz (lista bugova u PROGRESS), crash/error handling, verzija u meniju, credits ekran, "Pošalji povratnu informaciju" link.
- Generisanje materijala za Steam stranicu iz igre: skripta za screenshote u 1920×1080, snimanje trailer sekvenci (seed s velikim kombom).

**Prihvatanje:** svi stavovi u RELEASE_CHECKLIST označeni ili s razlogom odloženi; 0 poznatih blocker bugova.

## Post-launch (v1.1+)
Mobile (Capacitor, portretni layout, premium), dnevni izazov s leaderboardom, dodatni jezici, novi gosti i gazde kao besplatni update.
