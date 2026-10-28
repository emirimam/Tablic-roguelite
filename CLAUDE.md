# CLAUDE.md — TABLA (kafanski roguelite)

## Šta pravimo
Single-player roguelike deckbuilder baziran na balkanskoj kartaškoj igri **Tablić**. Igrač "nosi" karte sa stola po pravilima Tablića (ista vrijednost ili zbir). Svako nošenje boduje se kao **Chips × Mult**. Između rundi igrač u Šanku kupuje **Stalne goste** (pasivni modifikatori), **Rakije** (level-up tipova nošenja) i **Fildžane** (mijenjaju karte u špilu). Cilj je proći 8 kafana, svaka ima 3 runde od kojih je posljednja Gazda (boss).

- Pune specifikacije: `docs/GDD.md` (dizajn), `docs/CONTENT.md` (sav sadržaj i brojke), `docs/TECH_SPEC.md` (arhitektura), `docs/ROADMAP.md` (milestoneovi), `docs/RELEASE_CHECKLIST.md`.
- Ako se ova datoteka i `docs/*` razlikuju, važi `docs/*`, a razliku zapiši u `docs/DECISIONS.md`.

## Stack (detalji u TECH_SPEC)
TypeScript (strict) · Vite · PixiJS v8 · Howler.js · Vitest · Playwright · Electron + Steamworks binding za Steam build · (kasnije Capacitor za mobile).

## Komande
- `npm run dev`: web dev server
- `npm test`: Vitest (core + logika)
- `npm run typecheck` / `npm run lint`
- `npm run sim -- --runs 10000 --seed 1`: headless simulator za balans (od M8)
- `npm run build:web`: web build (demo)
- `npm run build:desktop`: Electron build (od M9)

## Arhitektonska pravila (NE KRŠITI)
1. **`src/core` je čista logika**: bez DOM-a, Pixi-ja, `Math.random()`, `Date.now()` i I/O-a. Sav random ide kroz seeded RNG iz `src/core/rng.ts`.
2. **Logika i prikaz su odvojeni.** Core akcija vraća novo stanje i listu `GameEvent`/`ScoreStep` događaja. Render ih samo animira i nikad ne računa bodove.
3. **Stanje je serijalizabilno** (čisti JSON). Isti seed i ista lista akcija moraju dati identičan rezultat (replay/determinizam test).
4. **Sadržaj je data-driven.** Metapodaci (id, rarity, cijena, i18n ključevi) stoje u `data/*.json`, a ponašanje u registru hook implementacija `src/core/content/*`. Novi gost znači jedan JSON unos i jednu hook funkciju.
5. **Redoslijed bodovanja** je fiksan i dokumentovan u GDD §5.4. Svaka promjena traži test.
6. Nema hardkodiranih stringova u UI-ju, sve ide preko `t('key')`.
7. Gamepad/tastatura navigacija za svaki ekran.

## Konvencije
- Imena u kodu su na engleskom (`capture`, `table`, `hand`, `regular` za gosta, `brandy` za rakiju, `cup` za fildžan). Tekst za igrača je na bs/en.
- Mapiranje pojmova: Nošenje = Capture, Spuštanje = Lay, Sto = Table, Gost = Regular, Rakija = Brandy, Fildžan = Cup, Šank = Shop, Kafana = Ante, Gazda = Boss, Investicija = Voucher, Tura = Pack, Pare = money.
- Testovi stoje uz kod (`*.test.ts`). Svaka mehanika iz CONTENT.md ima barem jedan test.
- Commit po tasku, Conventional Commits.
- Odluke idu u `docs/DECISIONS.md`, napredak u `docs/PROGRESS.md`.

## Asseti i licence
- Karte se crtaju proceduralno (vektor u kodu). Ne kopirati tuđe dizajne karata.
- Audio i fontovi samo pod CC0/OFL ili vlastiti, i svaki se upisuje u `ASSETS_LICENSES.md`.
- Ne kopirati imena, tekstove ni vizuale iz Balatra ili drugih igara. Mehanički žanr je slobodan, ali izraz mora biti naš.
- Ako se koriste AI-generisani asseti, zabilježi to u `ASSETS_LICENSES.md` (potrebno za Steam AI disclosure).
