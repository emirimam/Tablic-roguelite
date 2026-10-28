# Odluke

Format: `YYYY-MM-DD — Odluka — Razlog`

- 2026-10-28 — Stack TypeScript + PixiJS + Electron umjesto Godota — logika je čisti TS koji se lako testira i simulira headless, isti kod daje web demo (Vercel/itch), Steam (Electron) i kasnije mobile (Capacitor); autor već radi u web stacku.
- 2026-10-28 — Render sloj je DOM/CSS (proceduralne karte u HTML-u), ne PixiJS — za kartašku igru daje oštar tekst na svim rezolucijama, pristupačnost (fokus, skaliranje teksta), jednostavan fokus-graf za gamepad i 41 KB gzip web build. `src/core` je potpuno odvojen, pa se Pixi render može dodati kasnije bez diranja logike.
- 2026-10-28 — TypeScript 6.0 umjesto 7.0 — typescript-eslint još ne podržava TS 7 (peer `<6.1`). Vite 8.3.4, Vitest 5.0.4, ESLint 10.12 (verzije starije od 2 sedmice).
- 2026-10-28 — Rješenja K1–K34 iz `docs/DESIGN_REVIEW.md` usvojena su kako su napisana, osim K31 (Ogledalo zadržava id lijeve karte — jednostavnije za save, isti efekat za igrača). Najvažnije: K3 (bira se dodjela vrijednosti s najviše bodova), K5 (promašaj u mraku), K6 (dopuna: sto pa ruka), K8/K10 (prisilno spuštanje i odbacivanje), K12 (retrigger ponavlja i onCardScored), K19 (Dvojnik čita brojače originala), K26 (kamata se isplaćuje prva), K28 (prodaja po plaćenoj cijeni), K32 (2 zamjenska dostignuća: Kapetan splava, Raja).
- 2026-10-28 — Legendarni gosti koštaju 12 (K21) — CONTENT ih nije cijenio; cijena služi samo za prodaju.
- 2026-10-28 — Tutorijal po scenariju iz DESIGN_REVIEW §2 (3 lekcije; bodovi 24/30/28, 108/84 i 171/636 provjereni golden testovima).
- 2026-10-28 — Prisilno spuštanje ignoriše skrivene karte (Nestanak struje) — bez toga je igrač mogao biti primoran da pogađa u mraku jer je SPUSTI bio zaključan (bug pronađen simulatorom).
- 2026-10-28 — Balans na osnovu `npm run sim` (detalji u `docs/BALANCE.md`): niži ciljevi kafana i izravnan rast; Penzioner +30 Chips i +3 Mult na Par (P3); Nosač +8 Chips po spuštanju (P4); Nestanak struje tek od kafane 2. P1, P2, P5 i P6 čekaju bolji simulator jer bi nerfovi dodatno otežali igru.
- 2026-10-28 — Web build je puna igra (bez DEMO ograničenja), jer Steam stranica još ne postoji. DEMO režim postoji (`VITE_DEMO=1`, kraj nakon kafane 2).
- 2026-10-28 — Zvuk i muzika sintetizovani su u kodu (WebAudio, Karplus–Strong "tambura") — bez licenci trećih strana. Howler.js nije potreban dok nema audio fajlova.
- 2026-10-28 — E2E smoke test radi preko Chrome DevTools protokola (`npm run smoke`) umjesto Playwrighta — bez preuzimanja browsera od 150 MB. Pokriva tutorijal, 3 runde kroz UI, šank, sve menije i JS greške. Playwright ostaje opcija za CI.
- 2026-10-28 — Portreti gostiju su emoji na proceduralnom "portretu" (placeholder po GDD §8). Promptovi za finalne portrete su u `docs/ART_PROMPTS.md`.
- 2026-10-28 — Deep linkovi `#play`, `#play=SEED`, `#tutorial`, `#rules` za brzo dijeljenje i testove.
- 2026-10-28 — Electron/Steam (desktop dio M9) i Capacitor nisu rađeni u ovoj iteraciji; `Platform` interfejs je spreman za njih.
