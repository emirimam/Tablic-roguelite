# TABLA — kafanski roguelite

Roguelike deckbuilder baziran na balkanskoj kartaškoj igri **Tablić**. Nosiš karte sa stola po zbiru, skupljaš ekscentrične stalne goste kafane koji množe bodove (Chips × Mult) i pokušavaš preživjeti 8 kafana i njihove gazde.

Brzi početak u pregledniku: `/#play` (odmah partija), `/#tutorial` (tutorijal), `/#play=SEED` (partija sa seedom).

## Razvoj
```bash
npm install
npm run dev                               # dev server
npm test                                  # unit testovi (src/core + i18n)
npm run typecheck && npm run lint
npm run build                             # web build u dist/
npm run sim -- --runs 500 --bot smart     # simulator za balans
npx vite preview --port 4173 & npm run smoke   # E2E kroz pravi Chrome
```

## Struktura
| Putanja | Sadržaj |
|---|---|
| `src/core` | čista logika (pravila, bodovanje, partija, šank, meta, save), bez DOM-a; sav random ide kroz seeded RNG |
| `src/render`, `src/ui` | proceduralne karte, ekrani, animacije, tooltipi, navigacija tastaturom i gamepadom |
| `src/audio` | sintetizovani zvuk i muzika |
| `src/i18n` | bs/en prevodi |
| `data/*.json` | sav sadržaj i brojke |
| `sim/` | headless simulator i botovi |
| `tests/e2e` | E2E smoke test |

## Dokumentacija
| Datoteka | Sadržaj |
|---|---|
| `CLAUDE.md` | Pravila i konvencije za Claude Code |
| `docs/GDD.md`, `docs/CONTENT.md`, `docs/TECH_SPEC.md`, `docs/ROADMAP.md` | Dizajn, sadržaj, arhitektura, milestoneovi |
| `docs/DESIGN_REVIEW.md` | Rješenja nejasnoća, scenarij tutorijala, rizici balansa (Game Designer agent) |
| `docs/ART_PROMPTS.md` | Stilski vodič i promptovi za portrete gostiju i gazda (Image Prompt Engineer agent) |
| `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/BALANCE.md` | Odluke, napredak, mjerenja balansa |

## Kontrole
Miš ili dodir (dugo držanje = opis). Tastatura: strelice, Enter, **C** NOSI, **V** SPUSTI, **B** NAJBOLJE, Esc nazad. Gamepad: A izbor, X NOSI, Y SPUSTI, B nazad, LB/RB ruka/sto.

## Slash komande (`.claude/commands/`)
- `/next-milestone`, `/balance`, `/playtest-report`
