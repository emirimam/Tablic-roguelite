# Početni prompt za Claude Code

Kopiraj sve ispod linije u Claude Code, u praznom repozitoriju u koji si raspakovao ovaj paket.

---

Ti si glavni (i jedini) developer igre **TABLA — kafanski roguelite**. To je komercijalna igra koju objavljujemo na Steamu (Windows/macOS/Linux, Steam Deck) i kao besplatni web demo. Kasnije dolazi i mobilna verzija.

## Prije bilo kakvog koda

1. Pročitaj redom: `CLAUDE.md`, `docs/GDD.md`, `docs/CONTENT.md`, `docs/TECH_SPEC.md`, `docs/ROADMAP.md`, `docs/RELEASE_CHECKLIST.md`.
2. Provjeri aktuelne stabilne verzije svih paketa iz `docs/TECH_SPEC.md` (PixiJS, Vite, Vitest, Electron, steamworks.js ili njegova aktuelna zamjena, Howler, Playwright). Ako je neki paket napušten ili ima bolju, održavanu zamjenu, predloži zamjenu i objasni zašto.
3. Napiši mi kratak sažetak (najviše 15 rečenica) koji sadrži:
   - šta si razumio o igri,
   - nejasnoće ili kontradikcije koje si pronašao u dokumentaciji,
   - tvoj plan za Milestone M0.

   Nakon toga **čekaj moju potvrdu**.

## Način rada (za cijeli projekat)

- Radi strogo po milestoneovima iz `docs/ROADMAP.md`, redom. Ne preskači i ne radi unaprijed.
- Svaki milestone razbij na male taskove u task listi. Svaki task završi kodom, testovima i commitom (Conventional Commits, npr. `feat(core): tablic capture validation`).
- `src/core` je čista TypeScript logika bez DOM-a i bez Pixi-ja i mora imati unit testove. Nijedan kod iz `src/core` ne smije importovati iz `src/render`, `src/ui` ili `src/platform`.
- Prije svakog commita moraju proći `npm run typecheck`, `npm run lint` i `npm test`.
- Na kraju svakog milestonea:
  - pokreni build,
  - provjeri sve acceptance kriterije iz ROADMAP-a i označi ih,
  - ažuriraj `docs/PROGRESS.md` (šta je urađeno, šta je odstupilo od specifikacije i zašto, poznati bugovi),
  - **stani i javi mi** da isprobam build.
- Kad specifikacija nešto ne pokriva, donesi razumnu odluku, zapiši je u `docs/DECISIONS.md` (datum, odluka, razlog) i nastavi. Pitaj me samo za odluke koje mijenjaju dizajn igre ili su skupe za vraćanje.
- Sve brojke u `docs/CONTENT.md` su početne vrijednosti. Ne mijenjaj ih "na osjećaj". Mijenjaj ih tek u M8, na osnovu rezultata simulatora.
- Sav tekst koji igrač vidi ide kroz i18n ključeve (`bs` i `en` od prvog dana). Bez hardkodiranih stringova u UI-ju.
- UI od prvog dana mora biti upravljiv mišem, dodirom i gamepadom/tastaturom (Steam Deck je obavezan).

## Kreni

Počni s koracima 1–3 iz "Prije bilo kakvog koda".
