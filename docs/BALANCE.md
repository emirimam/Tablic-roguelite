# Balans

Komanda: `npm run sim -- --runs 500 --bot smart` (Kafana uloga, Klasični špil). Opcija `--scale 0.8,0.7,...` množi ciljeve po kafani u memoriji (za eksperimente).

## Ciljevi (TECH_SPEC §10, smart bot)
Kafana 1 > 95% · Kafana 4 ~60% · pobjeda 15–25%.

## 2026-10-28 — prva mjerenja

| Mjerenje | Kafana 1 | Kafana 2 | Kafana 4 | Kafana 8 / pobjeda |
|---|---|---|---|---|
| Početne brojke iz CONTENT/GDD, greedy | 29,7% | 19,3% | 2,0% | 0,0% |
| Početne brojke, smart | 56,7% | 43,0% | 8,3% | 0,3% |
| Nova kriva ciljeva + P3 + P4, smart | 78,0% | 67,3% | 29,3% | 1,3% |
| + popravka prisilnog spuštanja u mraku | 79,7% | 69,7% | 30,7% | 1,3% |
| + Nestanak struje od kafane 2 (500 partija) | **84,6%** | **73,0%** | **33,6%** | **4,2%** |

### Izmjene brojki
| Šta | Prije | Poslije | Razlog |
|---|---|---|---|
| Ciljevi kafana 1–8 | 300/450/600 … 50k/75k/100k | 250/350/450, 600/900/1200, 1400/2100/2800, 3000/4500/6000, 5500/8250/11000, 9000/13500/18000, 14000/21000/28000, 20000/30000/40000 | prvobitna kriva: 0,3% pobjeda čak i za smart bota |
| Penzioner | +40 Chips na Par | +30 Chips i +3 Mult na Par | DESIGN_REVIEW P3 (gost je bio mrtav) |
| Nosač | +3 Chips po spuštanju | +8 Chips po spuštanju | DESIGN_REVIEW P4 |
| Nestanak struje | minAnte 1 | minAnte 2 | 38% svih poraza u kafani 1 |

### Otvoreno za sljedeći krug
- Smart bot je jednostavan: ne procjenjuje sinergije gostiju, ne otvara ture, ne koristi fildžane i ne prodaje slabe goste. Stvarni igrači su bolji od njega, pa ciljeve treba dodatno podesiti tek kad bot nauči te stvari (inače bi igra postala prelaka za ljude).
- Porazi u kafani 1 (500 partija): runde 1–2 ≈ 39 partija, Inspekcija 12, Tamburaši 13, Privatna proslava 13.
- Prijedlozi P1 (Matematičar +5), P2 (Učiteljica /3), P5 (dopuna stola tek kad je prazan) i P6 nisu primijenjeni.
