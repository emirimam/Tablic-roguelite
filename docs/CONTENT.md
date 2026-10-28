# TABLA — Sadržaj (v1.0)

Sve brojke su **početne vrijednosti**. Mijenjaju se tek u M8 na osnovu simulatora (`npm run sim`). Svaki unos dobija JSON zapis u `data/` i hook implementaciju u `src/core/content/`.

Oznake hookova: `onCardScored`, `onHeldCard`, `onCapture`, `afterScore`, `onLay`, `onRoundStart`, `onRoundEnd`, `onShopEnter`, `onSell`, `onBossDefeated`, `modifyRules` (pasivne izmjene pravila, npr. +1 nošenje).

## 1. Stalni gosti (33)
Rijetkost u Šanku: Obični 70%, Neobični 25%, Rijetki 5%. Legendarni se pojavljuju samo u Turi gostiju (0,5% po slotu).

### Obični (cijena 4–5)
| # | id | Ime | Efekat | Hook | Cijena |
|---|---|---|---|---|---|
| 1 | `waiter` | Konobar | +4 Mult | onCapture | 4 |
| 2 | `lover` | Zaljubljeni | +3 Mult za svaku nošenu kartu ♥ | onCardScored | 5 |
| 3 | `jeweler` | Zlatar | +3 Mult za svaku nošenu kartu ♦ | onCardScored | 5 |
| 4 | `gardener` | Baštovan | +3 Mult za svaku nošenu kartu ♣ | onCardScored | 5 |
| 5 | `miner` | Rudar | +3 Mult za svaku nošenu kartu ♠ | onCardScored | 5 |
| 6 | `pensioner` | Penzioner | +40 Chips ako je nošenje tipa Par | onCapture | 4 |
| 7 | `mathematician` | Matematičar | +8 Mult ako je nošenje Zbir ili jače | onCapture | 5 |
| 8 | `student` | Student | +60 Chips ako je sa stola nošeno tačno 3 karte | onCapture | 4 |
| 9 | `taxi_driver` | Taksista | +2 pare na kraju svake pobijeđene runde | onRoundEnd | 5 |
| 10 | `accordionist` | Harmonikaš | +2 Mult za svako preostalo spuštanje | onCapture | 4 |
| 11 | `fisherman` | Ribar | +30 Chips za svaku nošenu desetku | onCardScored | 5 |
| 12 | `charmer` | Švaler | +5 Mult za svaku nošenu figuru (J/Q/K) | onCardScored | 5 |
| 13 | `grandpa` | Đedo | +60 Chips ako u ruci (nakon nošenja) nema figura | onCapture | 4 |
| 14 | `porter` | Nosač | Svako spuštanje trajno dodaje +3 Chips ovom gostu (počinje od 0) | onLay + onCapture | 5 |

### Neobični (cijena 6–8)
| # | id | Ime | Efekat | Hook | Cijena |
|---|---|---|---|---|---|
| 15 | `fortune_teller` | Gatara | Kad pobijediš Gazdu, dobiješ nasumični Fildžan (ako ima mjesta) | onBossDefeated | 6 |
| 16 | `merchant` | Trgovac | Šank ima +1 slot za predmete | modifyRules | 7 |
| 17 | `godfather` | Kum | ×1,5 Mult ako je nošenje Dupla ili Trostruka | onCapture | 7 |
| 18 | `neighbor` | Komšija | Tabla daje dodatnih +15 Mult | onCapture | 6 |
| 19 | `magician` | Mađioničar | Asovi mogu vrijediti bilo koju vrijednost 1–14 | modifyRules | 8 |
| 20 | `baker` | Pekar | +1 nošenje po rundi | modifyRules | 7 |
| 21 | `tailor` | Krojač | +1 veličina ruke | modifyRules | 7 |
| 22 | `gambler` | Kockar | Šansa 1 u 4 da nošenje dobije ×4 Mult | onCapture | 6 |
| 23 | `smuggler` | Švercer | Kad prodaš gosta, +3 pare dodatno; prodajna cijena gostiju +1 | onSell | 6 |
| 24 | `teacher` | Učiteljica | Dobija trajno +1 Mult za svake 2 nošene karte (počinje od 0) | afterScore + onCapture | 7 |
| 25 | `collector` | Kolekcionar | Dobija trajno +2 Chips za svaku nošenu kartu (počinje od 0) | afterScore + onCapture | 6 |

### Rijetki (cijena 9–10)
| # | id | Ime | Efekat | Hook | Cijena |
|---|---|---|---|---|---|
| 26 | `landlady` | Gazdarica | ×3 Mult na Tabli | onCapture | 9 |
| 27 | `cafe_owner` | Kafedžija | ×1 Mult + ×0,25 za svaku Tablu u ovoj partiji (raste) | onCapture + afterScore | 9 |
| 28 | `double` | Dvojnik | Kopira efekat gosta desno od sebe (ako je kompatibilan) | kopira | 10 |
| 29 | `drunkard` | Bekrija | ×2 Mult, ali −1 nošenje po rundi | onCapture + modifyRules | 9 |
| 30 | `big_ten` | Desetka i Dvojka | 10♦ i 2♣ daju ×2 Mult svaki kad se nose | onCardScored | 9 |

### Legendarni (samo iz Ture gostiju)
| # | id | Ime | Efekat |
|---|---|---|---|
| 31 | `old_master` | Stari majstor | Sve nošene figure se retriggeruju 2 puta |
| 32 | `queen_of_kafana` | Kraljica kafane | ×1,5 Mult za svaku Damu u ruci |
| 33 | `legend` | Legenda | Svaka Tabla trajno dodaje ×0,5 Mult ovom gostu (počinje ×1) |

Pravila: gosti koji rastu čuvaju vrijednost u `state.regulars[i].counters`. Dvojnik ne može kopirati drugog Dvojnika ni `modifyRules` efekte koji već važe globalno (kopija `baker` daje dodatno +1, što je namjerno dozvoljeno).

## 2. Rakije (level-up tipova nošenja), cijena 3
| id | Ime | Efekat |
|---|---|---|
| `slivovitz` | Šljivovica | +1 level: Par |
| `loza` | Loza | +1 level: Zbir |
| `pear` | Kruškovača | +1 level: Dupla |
| `quince` | Dunjevača | +1 level: Trostruka |
| `herbal` | Travarica | +1 level: Tabla |
| `mead` | Medovača | +1 level svim tipovima (rijetka, samo iz ture, 3% šanse po slotu) |

## 3. Fildžani (mijenjaju karte), cijena 3
Koriste se tokom runde nad izabranim kartama u ruci, ili odmah pri otvaranju Fildžan ture (nad 6 nasumičnih karata iz špila).

| id | Ime | Efekat |
|---|---|---|
| `cup_luck` | Šoljica sreće | Do 2 karte postaju **Zlatne** |
| `cup_sediment` | Talog | 1 karta postaje **Staklena** |
| `cup_bird` | Ptica | Do 2 karte postaju **Bonus** |
| `cup_heart` | Srce | Do 2 karte postaju **Mult** |
| `cup_road` | Put | 1 karta postaje **Divlja** |
| `cup_ring` | Prsten | 1 karta postaje **Čelična** |
| `cup_clubs` / `cup_diamonds` / `cup_hearts` / `cup_spades` | Djetelina / Dijamant / Ljubav / Mač | Do 3 karte mijenjaju boju u ♣/♦/♥/♠ |
| `cup_key` | Ključ | Do 2 karte +1 vrijednost (K postaje A) |
| `cup_cross` | Krst | Uništi do 2 karte iz špila |
| `cup_mirror` | Ogledalo | Izaberi 2 karte: lijeva postaje kopija desne |
| `cup_coin` | Novčić | Udvostruči pare (najviše +20) |
| `cup_sun` | Sunce | Napravi kopiju posljednje iskorištene rakije ili fildžana (osim Sunca) |

## 4. Poboljšanja karata
### 4.1 Enhancement (najviše 1 po karti)
| id | Ime | Efekat |
|---|---|---|
| `gold` | Zlatna | +3 pare kad se nosi |
| `glass` | Staklena | ×2 Mult kad se nosi; 1 u 4 šanse da se razbije (uklanja se iz špila) |
| `bonus` | Bonus | +30 Chips |
| `mult` | Mult | +4 Mult |
| `wild` | Divlja | Vrijedi bilo koju vrijednost 1–14 (na stolu i u ruci) |
| `steel` | Čelična | ×1,5 Mult dok je u ruci tokom nošenja (onHeldCard) |

### 4.2 Pečati (najviše 1 po karti)
| id | Ime | Efekat |
|---|---|---|
| `red` | Crveni pečat | Karta se boduje još jednom (retrigger) |
| `gold_seal` | Zlatni pečat | +3 pare kad se nosi |
| `blue` | Plavi pečat | Kad se karta spusti na sto, vraća se 1 spuštanje (jednom po rundi po karti) |

### 4.3 Edicije (za karte i goste)
| id | Ime | Na karti | Na gostu |
|---|---|---|---|
| `foil` | Folija | +50 Chips | +50 Chips |
| `holo` | Holo | +10 Mult | +10 Mult |
| `poly` | Polikrom | ×1,5 Mult | ×1,5 Mult |
| `negative` | Negativ | — | +1 slot za goste (samo gosti) |

Šanse u Šanku za ediciju gosta: Folija 2%, Holo 1,4%, Polikrom 0,3%, Negativ 0,3%.

## 5. Ture (booster paketi)
| id | Ime | Sadržaj | Izbor | Cijena |
|---|---|---|---|---|
| `pack_regulars` | Tura gostiju | 3 gosta | 1 | 5 |
| `pack_brandy` | Tura rakija | 3 rakije | 1 (odmah se koristi) | 4 |
| `pack_cups` | Tura fildžana | 3 fildžana nad 6 karata iz špila | 1 | 4 |
| `pack_cards` | Tura karata | 3 karte (30% šanse za poboljšanje, 10% za pečat) | 1 (dodaje se u špil) | 4 |
| `pack_mega` | Velika tura | Bilo koja od gornjih s 5 opcija | 2 | 8 |

## 6. Gazde (bossovi)
Pojavljuju se u trećoj rundi svake kafane. Kafana 8 uvijek ima finalnog gazdu. Ostali se biraju nasumično i ne ponavljaju se u partiji.
| id | Ime | Pravilo | Min. kafana |
|---|---|---|---|
| `inspection` | Inspekcija | Karte ♣ ne daju chips | 1 |
| `curfew` | Policijski sat | Samo 3 nošenja | 2 |
| `darkness` | Nestanak struje | 2 karte na stolu su okrenute licem dole (otkrivaju se kad se nose) | 1 |
| `tamburitza` | Tamburaši | Veličina ruke −1 | 1 |
| `rush` | Konobar žuri | Nema spuštanja | 2 |
| `drunk_guest` | Pijani gost | Nakon svakog nošenja, 1 nasumična karta iz ruke se odbacuje | 3 |
| `private_party` | Zatvoreno za privatnu proslavu | Prvo nošenje boduje 0 | 1 |
| `retirement` | Penzija | Figure (J/Q/K) ne daju chips ni efekte | 2 |
| `rose_on_table` | Ruža na stolu | Tabla ne daje bonus | 3 |
| `tax` | Porezna | Gubiš 1 paru za svako nošenje | 2 |
| `stingy` | Škrti gazda | Par boduje 0 | 4 |
| **Finale** `chain_owner` | Vlasnik lanca | Cilj je ×1,5, a gost na krajnjoj lijevoj poziciji je onesposobljen | 8 |

Prije runde, na mapi kafane, prikazuje se ime i pravilo Gazde.

## 7. Investicije (voucheri), cijena 10, jedna po kafani
| id | Ime | Efekat |
|---|---|---|
| `v_counter` | Novi šank | +1 slot za predmete u Šanku |
| `v_discount` | Popust za stalne | Sve u Šanku je 25% jeftinije |
| `v_overtime` | Prekovremeni | +1 nošenje po rundi |
| `v_table` | Veći sto | +1 spuštanje po rundi |
| `v_hands` | Široka ruka | +1 veličina ruke |
| `v_distillery` | Destilerija | Rakije se 2× češće pojavljuju u Šanku |
| `v_annex` | Aneks | +1 slot za goste |
| `v_bank` | Štednja | Limit kamate se podiže s 5 na 10 |

## 8. Početni špilovi
| id | Ime | Efekat | Otključava se |
|---|---|---|---|
| `deck_classic` | Klasični | Standard | Odmah |
| `deck_kafana` | Kafanski | +1 nošenje po rundi | Pobijedi Gazdu kafane 2 |
| `deck_merchant` | Trgovački | Početak s 10 para | Imaj 30+ para odjednom |
| `deck_aces` | Asovski | 8 asova (2 dodatna po boji ♥ i ♠), bez dvojki | Napravi 10 Tabli u jednoj partiji |
| `deck_short` | Polovni | 40 karata (bez 2–4), ruka +1 | Pobijedi partiju |
| `deck_lucky` | Fildžanski | Početak s 2 nasumična fildžana | Iskoristi 30 fildžana ukupno |

## 9. Uloge (težine)
Svaka uloga uključuje sve prethodne. Otključava se pobjedom na prethodnoj.
1. **Kafana:** standardno.
2. **Restoran:** Gazda ne daje pare.
3. **Hotel:** ciljevi ×1,25.
4. **Kazino:** −1 spuštanje po rundi.
5. **Splav:** Šank je 1 para skuplji, ciljevi ×1,5 (umjesto ×1,25).

## 10. Dostignuća (24)
1. Prvo nošenje
2. Prva Tabla
3. Pobijedi prvog Gazdu
4. Pobijedi partiju
5. Pobijedi na svakoj ulozi (5 dostignuća: Restoran, Hotel, Kazino, Splav i "sve uloge")
6. Jedno nošenje ≥ 10.000
7. Jedno nošenje ≥ 1.000.000
8. 5 Tabli u jednoj rundi
9. Trostruka s 4+ grupe
10. Imaj 5 Rijetkih ili Legendarnih gostiju odjednom
11. Pobijedi partiju sa svakim špilom (6 dostignuća, jedno po špilu)
12. Kafana 12 u beskonačnom modu
13. Pobijedi partiju bez ijednog spuštanja
14. Razbij 5 staklenih karata u partiji
15. Iskoristi Medovaču

(Ukupno 24 Steam dostignuća. Tačnu listu ključeva generiše `data/achievements.json`.)
