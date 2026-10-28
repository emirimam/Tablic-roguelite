# TABLA — kafanski roguelite

Roguelike deckbuilder baziran na Tabliću. Steam (Win/Mac/Linux, Steam Deck) + web demo.

## Kako pokrenuti razvoj s Claude Codeom
1. Napravi prazan GitHub repo (npr. `tabla`) i raspakuj ovaj paket u njegov root.
2. `git init && git add . && git commit -m "docs: initial design package"`
3. Pokreni Claude Code u tom folderu.
4. Zalijepi sadržaj ispod linije iz `KICKOFF_PROMPT.md`.
5. Nakon svakog milestonea isprobaj build i odgovori Claude Codeu (ili koristi `/next-milestone`).

## Dokumentacija
| Datoteka | Sadržaj |
|---|---|
| `CLAUDE.md` | Pravila i konvencije koje Claude Code čita u svakoj sesiji |
| `docs/GDD.md` | Dizajn igre: pravila, bodovanje, struktura, UX, art, zvuk |
| `docs/CONTENT.md` | Svi gosti, rakije, fildžani, gazde, investicije, špilovi, dostignuća |
| `docs/TECH_SPEC.md` | Arhitektura, stack, model stanja, algoritmi, platforme |
| `docs/ROADMAP.md` | M0–M10 s kriterijima prihvatanja |
| `docs/RELEASE_CHECKLIST.md` | Sve za Steam lansiranje |
| `docs/DECISIONS.md` / `docs/PROGRESS.md` | Popunjava Claude Code tokom rada |

## Slash komande (`.claude/commands/`)
- `/next-milestone`: nastavi sljedeći milestone
- `/balance`: pokreni simulator i predloži izmjene balansa
- `/playtest-report`: obradi tvoje bilješke s playtesta u bugove i taskove
