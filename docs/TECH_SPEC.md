# TABLA — Tehnička specifikacija

## 1. Stack
| Sloj | Izbor | Napomena |
|---|---|---|
| Jezik | TypeScript, `strict: true`, `noUncheckedIndexedAccess: true` | |
| Build | Vite | |
| Rendering | PixiJS v8 (WebGL/WebGPU) | Fiksna virtualna rezolucija 1920×1080, skaliranje s letterboxom. Layout mora raditi i na 1280×800 (Steam Deck). |
| Animacije | vlastiti tween sistem ili GSAP (licenca GSAP-a je danas besplatna, ali to treba provjeriti) | |
| Audio | Howler.js | |
| Testovi | Vitest (unit), Playwright (smoke/E2E na web buildu) | |
| Lint/format | ESLint + Prettier, plus `eslint-plugin-import` pravilo koje zabranjuje importe iz `src/core` prema van | |
| Desktop | Electron + Steamworks Node binding (steamworks.js ili aktuelna održavana zamjena) | Provjeriti status paketa prije M9 |
| Mobile (v1.1) | Capacitor | Van opsega v1.0, ali arhitektura ga ne smije onemogućiti |
| CI | GitHub Actions: typecheck, lint, test, build:web na svaki push; build:desktop na tag | |

Node LTS. Paket manager je npm.

## 2. Struktura repozitorija
```
/
├─ CLAUDE.md  KICKOFF_PROMPT.md  README.md  ASSETS_LICENSES.md
├─ docs/  (GDD, CONTENT, TECH_SPEC, ROADMAP, RELEASE_CHECKLIST, DECISIONS, PROGRESS)
├─ data/                     # JSON metapodaci sadržaja (validirani Zod shemom pri buildu i testu)
│  ├─ regulars.json  brandies.json  cups.json  bosses.json
│  ├─ vouchers.json  packs.json  decks.json  stakes.json  achievements.json
│  └─ antes.json             # ciljevi po kafani
├─ src/
│  ├─ core/                  # ČISTA LOGIKA (bez DOM-a i Pixi-ja)
│  │  ├─ rng.ts              # seeded PRNG (npr. sfc32/xoshiro128**), split streamovi po namjeni
│  │  ├─ types.ts            # Card, Table, Hand, RunState, RoundState...
│  │  ├─ cards.ts            # špil, vrijednosti, chips
│  │  ├─ capture.ts          # validacija i enumeracija nošenja (particija u grupe)
│  │  ├─ scoring.ts          # pipeline bodovanja → ScoreStep[]
│  │  ├─ round.ts            # tok runde (akcije capture/lay, refill, win/lose)
│  │  ├─ run.ts              # tok partije (kafane, gazde, šank, ekonomija)
│  │  ├─ shop.ts
│  │  ├─ actions.ts          # union svih akcija igrača + reducer `apply(state, action)`
│  │  ├─ content/            # registar hookova: regulars/, brandies, cups, bosses, vouchers
│  │  ├─ meta.ts             # otključavanja, statistika, dostignuća (čisto)
│  │  └─ save.ts             # serializacija, verzija sheme, migracije
│  ├─ render/                # Pixi scene, sprite fabrike, proceduralno crtanje karata
│  ├─ ui/                    # ekrani, fokus/navigacija (miš/dodir/gamepad), tooltipi
│  ├─ audio/
│  ├─ i18n/                  # bs.json, en.json + t()
│  ├─ platform/              # Platform interfejs: web.ts, electron.ts (steam), (capacitor.ts kasnije)
│  └─ main.ts
├─ sim/                      # headless simulator + botovi za balans
├─ electron/                 # main proces, preload, steam integracija
├─ tests/e2e/                # Playwright
└─ public/                   # fontovi, audio
```

## 3. Model stanja (skica)
```ts
type Suit = 'C' | 'D' | 'H' | 'S';
type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13; // 1=A, 11=J, 12=Q, 13=K (vrijednost u Tabliću: J=12, Q=13, K=14)
interface Card { id: string; suit: Suit; rank: Rank; enhancement?: EnhId; seal?: SealId; edition?: EditionId; faceDown?: boolean }
interface RegularInstance { id: RegularId; uid: string; edition?: EditionId; counters: Record<string, number>; disabled?: boolean }
interface RoundState { table: Card[]; hand: Card[]; drawPile: Card[]; pile: Card[]; capturesLeft: number; laysLeft: number; score: number; target: number; boss?: BossId; flags: Record<string, number> }
interface RunState { version: number; seed: string; rngState: RngState; deckId; stakeId; ante: number; roundIndex: 0|1|2; money: number; deck: Card[]; regulars: RegularInstance[]; consumables: ConsumableId[]; levels: Record<CaptureType|'tabla', number>; vouchers: VoucherId[]; usedBosses: BossId[]; phase: 'map'|'round'|'shop'|'pack'|'gameover'|'won'; round?: RoundState; shop?: ShopState; stats: RunStats; lastConsumable?: ConsumableId }
```
Sve je čisti JSON. `apply(state, action) => { state, events }` je jedini način promjene stanja.

## 4. Nošenje: algoritam
- `findCaptures(handCard, table, rules): CaptureOption[]` enumeriše sve validne skupove (sto ima ≤10 karata, pa je backtracking s memoizacijom dovoljan).
- Asovi i Divlje karte generišu više mogućih vrijednosti. Opcija bilježi izabranu dodjelu vrijednosti.
- `validateSelection(handCard, selected[], rules)` provjerava particiju, vraća tip nošenja i dodjelu vrijednosti, a ako ima više particija, bira onu s više grupa.
- `bestCapture` = opcija s maksimalnim predviđenim bodovima. Ide kroz isti scoring pipeline u "preview" modu, bez nuspojava i bez trošenja RNG-a (preview koristi klon RNG streama).
- **Property-based testovi** (fast-check): svaka vraćena opcija mora biti validna particija. `validateSelection` i `findCaptures` moraju se slagati.

## 5. Scoring pipeline
Implementira tačno GDD §5.4. Rezultat je `ScoreStep[]` i finalni broj. Bodovi se računaju u `number` do 2^53. Iznad toga se prelazi na prikaz u naučnoj notaciji (beskonačni mod), a logika koristi `number` sa zaštitom od `Infinity` (cap na 1e300).
Za determinizam je obavezno da svaka šansa (Kockar, Staklena) vuče iz `rng.stream('scoring')`.

## 6. Sistem sadržaja
```ts
interface RegularDef { id; rarity; cost; hooks: Partial<Hooks>; copyable?: boolean }
interface Hooks {
  onCardScored(ctx, card): Effect[]; onHeldCard(ctx, card): Effect[]; onCapture(ctx): Effect[];
  afterScore(ctx): void; onLay(ctx, card): void; onRoundStart(ctx): void; onRoundEnd(ctx): Effect[];
  onShopEnter(ctx): void; onSell(ctx, sold): Effect[]; onBossDefeated(ctx): void; modifyRules(rules): Rules;
}
type Effect = { chips?: number; mult?: number; xMult?: number; money?: number; retrigger?: number; text: I18nKey };
```
- `Rules` (veličina ruke, nošenja, spuštanja, slotovi, vrijednosti asa...) računaju se svaki put iz osnove, vouchera, špila, uloge, gazde i `modifyRules` gostiju. Nikad se ne mutiraju trajno.
- JSON u `data/` se validira Zod shemom, a test provjerava da svaki JSON id ima hook implementaciju i obrnuto.

## 7. Render i UI
- Render se pretplaćuje na `events` i pušta ih kroz **animacijski red** (sekvencijalno, ubrzanje 1×/2×/4×, preskakanje klikom).
- Karte se crtaju proceduralno (Pixi Graphics i tekst), keširane u teksture.
- **Fokus sistem:** svaki interaktivni element registruje se u navigacioni graf (gore/dolje/lijevo/desno). Gamepad API i tastatura idu kroz isti sistem. Fokus je uvijek vidljiv.
- Tooltipi na hover, dugo držanje i gamepad dugme.
- Responsive: 16:9 i 16:10 obavezno. Portretni layout je za mobile v1.1 i treba ga predvidjeti u layout sistemu (kontejneri, ne apsolutne koordinate rasute po kodu).

## 8. Snimanje (save)
- Autosave nakon svake akcije: `RunState` + `MetaState` (otključavanja, statistika, podešavanja).
- `Platform.storage`: web koristi `localStorage` (try/catch, fallback u memoriju), Electron koristi fajl u `app.getPath('userData')` i Steam Cloud (Auto-Cloud konfiguracija za tu putanju).
- Svaki save ima `version`. Migracije su lanac `migrate_vN_to_vN+1` i svaka ima test.
- Pokvaren save se ne ruši: prikazuje se poruka i nudi reset partije (meta se čuva odvojeno).

## 9. Platform sloj
```ts
interface Platform { storage; achievements: { unlock(id) }; richPresence?(text); openUrl(url); quit?(); isSteamDeck(): boolean; locale(): string }
```
Web implementacija ima no-op dostignuća (ili lokalnu listu). Electron implementacija koristi Steamworks. Kod igre zna samo za `Platform`.

## 10. Simulator (sim/)
- `npm run sim -- --runs N --seed S --bot greedy|smart --deck X --stake Y`
- Botovi: `greedy` uvijek bira bestCapture i spušta najmanju kartu. `smart` ima heuristiku za spuštanje (namješta zbirove), kupuje goste po jednostavnoj evaluaciji i koristi rakije.
- Izlaz je JSON + CSV: win rate po kafani, distribucija bodova po rundi, pick/win rate po gostu, prosječne pare.
- Ciljevi balansa (Kafana uloga, `smart` bot): kafana 1 se prolazi u >95% partija, kafana 4 u ~60%, pobjeda u partiji ~15–25%. Nijedan gost ne smije imati win-rate odstupanje veće od ±15 p.p. od prosjeka bez razloga.

## 11. Performanse i kvalitet
- 60 FPS na Steam Decku i integrisanoj grafici. Bez alokacija u hot loopu renderinga.
- Web build ≤ 15 MB (bez muzike), muzika se učitava lijeno.
- Pokretanje ≤ 3 s do menija.
- Pristupačnost: color-blind mod, smanjeni pokreti, skaliranje teksta (100/125/150%), bez informacija koje se prenose samo bojom.

## 12. Lokalizacija
- `bs` je primarni i služi kao izvorni tekst. `en` je obavezan za v1.0.
- Ključevi su hijerarhijski (`regular.waiter.name`, `regular.waiter.desc`).
- Opisi s parametrima: `"+{mult} Mult"`, a brojke dolaze iz JSON-a, ne iz teksta.
- Test provjerava da svi ključevi postoje u svim jezicima.
