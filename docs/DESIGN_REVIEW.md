# TABLA — Dizajnerski pregled (Design Review) v1.0

> Datum: 2026-10-28 · Obuhvat: `CLAUDE.md`, `docs/GDD.md`, `docs/CONTENT.md`, `docs/TECH_SPEC.md`, `docs/ROADMAP.md`.
> Ovaj dokument ne mijenja nijednu brojku u `data/`. Svako rješenje iz §1 je **pojašnjenje** koje developer može odmah implementirati i upisati u `docs/DECISIONS.md` (jedan red po stavci, npr. `K12`). Prijedlozi koji mijenjaju brojke označeni su s **[PRIJEDLOG]** i čekaju odluku (ili M8 simulator).

Pojmovi koji se koriste kroz cijeli dokument:
- **Bodovane karte** = karta iz ruke koja nosi + sve nošene karte sa stola (sve karte koje prolaze kroz GDD §5.4 korak 2).
- **Držane karte** = karte u ruci *nakon* što je karta koja nosi uklonjena, a *prije* dopune ruke i prije efekta gazde Pijani gost.
- **Fleksibilna karta** = karta koja može imati više Tablić vrijednosti (as, Divlja karta, as uz Mađioničara).

---

## 1. Kontradikcije i nejasnoće

### A. Vrijednosti karata i validacija nošenja

**K1. As u ruci: jedna ili više vrijednosti?**
GDD §3.2 kaže "svaki as nezavisno vrijedi 1 ili 11", što bi moglo značiti da as u ruci vrijedi 1 za jednu grupu, a 11 za drugu.
**Rješenje:** karta iz ruke ima tačno **jednu** vrijednost V za cijelo nošenje. Svaki as na stolu bira svoju vrijednost nezavisno, ali jednu po nošenju. Chips asa je uvijek 11, bez obzira na izabranu vrijednost (i kad vrijedi 1).

**K2. As, Divlja karta i Mađioničar: kako se slažu?**
**Rješenje:** svaka karta ima *domenu vrijednosti*:

| Karta | Domena |
|---|---|
| obična karta 2–K | {nominalna} (J=12, Q=13, K=14) |
| as | {1, 11} |
| as uz aktivnog Mađioničara | {1, …, 14} |
| bilo koja karta s enhancementom Divlja | {1, …, 14} (Divlja ima prednost nad asom) |

- Domena utiče **samo na validaciju**. Chips se uvijek računa po ranku (Divlja sedmica daje 7 chips, Divlji as 11, Divlji kralj 10).
- Boja i status figure se ne mijenjaju: Divlja J♥ je i dalje figura i ♥ (Švaler, Zaljubljeni, Penzija je gledaju kao figuru).
- Mađioničar je idempotentan: dva izvora (npr. Mađioničar + Dvojnik) ne rade ništa dodatno.

**K3. Kad selekcija ima više mogućih particija, koja se boduje?**
TECH_SPEC §4 kaže "bira onu s više grupa". Uočiti: za fiksnu dodjelu vrijednosti broj grupa je određen (k = zbir izabranih / V), pa se particije razlikuju samo kad postoje fleksibilne karte. Ali "više grupa" nije uvijek bolje za igrača (npr. Zbir na levelu 5 = 80 chips / 6 mult je jači od Duple na levelu 1 = 30/3; Penzioner traži Par).
**Rješenje:** `validateSelection` enumeriše sve validne dodjele vrijednosti i bira onu s **najvećim deterministički predviđenim bodovima** (preview, bez nasumičnih efekata). Tie-break: (1) više grupa, (2) manji zbir dodijeljenih vrijednosti, (3) leksikografski po poziciji na stolu. Preview UI prikazuje dodjelu ("A = 11", "Divlja = 7"). Ovo zamjenjuje rečenicu u TECH_SPEC §4 i treba ići u DECISIONS.
Dodatno: dvije grupe od po jedne karte (npr. 7 nosi 7 i 7) su **Dupla**, ne Par. Par je isključivo 1 grupa od 1 karte.

**K4. Rank naspram vrijednosti; Ključ (`cup_key`) i specijalni bonusi.**
`Rank` u TECH_SPEC je 1–13, a vrijednost u Tabliću je J=12, Q=13, K=14 (vrijednost 11 postoji samo za asa).
**Rješenje:** Ključ mijenja **rank** za +1 (10→J, J→Q, Q→K, K→A, A→2). Bonusi Velika desetka i Mala dvojka računaju se po **trenutnom** ranku i boji u trenutku bodovanja: Ključ na 10♦ gubi bonus, a Fildžan "Dijamant" na 10♥ ga stvara. Asovski i Polovni špil nemaju 2♣ (namjerno).

**K5. Karte licem dole (Nestanak struje) u validaciji.**
Ako NOSI postaje aktivno samo za validan izbor, igrač može besplatno "pipkati" i otkriti vrijednost skrivene karte. Ako ih ne može birati, Tabla postaje nemoguća.
**Rješenje ("Nošenje u mraku"):**
1. Skrivene karte se mogu birati, ali se **nikad** ne ističu, NAJBOLJE ih ignoriše, a preview prikazuje "?".
2. NOSI je aktivno ako je izbor validan pod pretpostavkom da svaka skrivena karta ima domenu {1…14}.
3. Pri potvrdi se sve izabrane skrivene karte otkrivaju i izbor se validira pravim vrijednostima.
4. Validno: normalno nošenje. Nevalidno ("Promašaj u mraku"): otkrivene karte ostaju na stolu licem gore, a karta iz ruke se **spušta** na sto (troši 1 spuštanje; ako ih nema, troši 1 nošenje; ako je sto pun, ide u kup). Ovo je lay događaj (K10).
5. Koje 2 karte su skrivene: 2 od 4 početne karte, birane iz `rng.stream('boss')`. Karte iz dopune su uvijek licem gore.

### B. Tok runde

**K6. Redoslijed dijeljenja i dopune (bitno za determinizam i tutorijal).**
**Rješenje:**
- Početak runde: miješanje (`rng.stream('deck')`), pa 4 karte na sto (s vrha špila, slijeva nadesno), pa H karata u ruku.
- Nakon nošenja: (1) bodovanje, (2) provjera pobjede (ako je cilj dostignut, runda se završava **odmah**, bez dopuna), (3) ako je na stolu < 2 karte, sto se dopunjava do 4, (4) ruka se dopunjava do H.
- Nakon spuštanja: spuštena karta ide na **krajnju desnu** poziciju stola, pa dopuna ruke.
- Nošene karte se uklanjaju, a preostale karte na stolu zadržavaju relativni redoslijed. Nove karte se uvijek dodaju desno.

**K7. Tabla: definicija i jedna skrivena posljedica.**
Tabla = sto je prazan **nakon nošenja, prije dopune**. Posljedica pravila "dopuni ako je < 2": na početku svake akcije na stolu su najmanje 2 karte (osim kad je špil prazan). Zato **Tabla s Parom je praktično nemoguća**, a Tabla najčešće traži da se pokupe 2 karte jednim Zbirom ili 4–5 karata Duplom. Ovo nije bug, ali direktno utiče na Komšiju, Gazdaricu, Kafedžiju, Legendu i dostignuće "5 Tabli u jednoj rundi" (vidi §3, prijedlog P5).

**K8. "Prisilno spuštanje" kad je sto pun.**
GDD §4.1 ne kaže šta se dešava kad nijedna karta ne može nositi, a sto ima 10 karata (spuštanje zabranjeno).
**Rješenje (stablo odluke kad nijedno nošenje nije moguće):**

| Stanje | Akcija | Cijena |
|---|---|---|
| sto < 10, spuštanja > 0 | obavezno spuštanje | 1 spuštanje |
| sto < 10, spuštanja = 0, nošenja > 0 | prisilno spuštanje | 1 nošenje |
| sto = 10 | **prisilno odbacivanje**: izabrana karta iz ruke ide direktno u kup | 1 spuštanje ako ga ima, inače 1 nošenje |

Prisilno odbacivanje nije lay događaj (ne okida `onLay`, Plavi pečat ni Nosača). UI prikazuje dugme "ODBACI" samo u tom stanju.

**K9. Uslov poraza je u kontradikciji s prisilnim spuštanjem.**
GDD kaže da je poraz i kad "nema validne akcije i špil je prazan", ali prisilno spuštanje garantuje da akcija uvijek postoji dok ima karata u ruci.
**Rješenje:** runda je izgubljena ako je bodova < cilj i vrijedi bilo šta od sljedećeg: (a) `capturesLeft == 0`, (b) ruka je prazna i špil je prazan. Ništa drugo nije poraz.

**K10. Da li prisilno spuštanje "broji" kao spuštanje (Nosač, Harmonikaš, dostignuće)?**
**Rješenje:** svaka karta koja iz ruke ode na sto bez nošenja je **lay događaj**: okida `onLay` (Nosač raste), Plavi pečat i statistiku. Dostignuće "Pobijedi partiju bez ijednog spuštanja" pada i na prisilnom spuštanju i na Promašaju u mraku. Prisilno odbacivanje (K8) nije lay. Harmonikaš čita `laysLeft` u trenutku nošenja.

**K11. Plavi pečat.**
**Rješenje:** vraća +1 spuštanje nakon što je karta spuštena (i kad je spuštanje bilo prisilno i platilo se nošenjem: vraća se spuštanje, ne nošenje). Jednom po rundi po karti, prati se u `round.flags['blue:<cardId>']`. Spuštanje i dalje traži `laysLeft > 0` (osim prisilnog).

### C. Bodovanje

**K12. Šta tačno ponavljaju retriggeri?**
GDD §5.4 doslovno kaže da retrigger ponavlja a–c, a `onCardScored` (e) ide jednom. Tada Stari majstor (legendarni) daje samo +20 chips po figuri, a Švaler, Zaljubljeni i Desetka i Dvojka ignorišu retrigger. To ubija fantaziju "milion bodova".
**Rješenje:** blok karte je `[a, b, c, e]` i izvršava se `1 + retriggers` puta. Retriggeri se sabiraju iz svih izvora (Crveni pečat +1, Stari majstor +2 za figure, Dvojnik koji kopira Starog majstora +2). Crveni pečat na **držanoj** karti ponavlja i korak 3 za tu kartu (Čelična s crvenim pečatom = ×1,5 dva puta). Promjena teksta GDD §5.4 tačke d) i test su obavezni.

**K13. Staklena karta i retriggeri.**
**Rješenje:** ×2 Mult se primjenjuje pri svakom okidanju (Staklena s crvenim pečatom = ×4). Bacanje za razbijanje se radi **jednom po nošenju po karti**, nakon koraka 6, redom kao u koraku 2, iz `rng.stream('scoring')`. Razbijena karta ide iz `run.deck` trajno (ne vraća se u špil na kraju runde). Bacanje se radi i kad gazda poništi bodove (Privatna proslava).

**K14. Pare tokom bodovanja (Zlatna, Zlatni pečat).**
**Rješenje:** oba efekta se izvršavaju u koraku b i ponavljaju se s retriggerom. Pare se dodaju odmah u `run.money` (ulaze u kamatu na kraju runde). Preview ih prikazuje, ali ih ne dodaje. Porezna: −1 para po nošenju nakon bodovanja, pare nikad ispod 0.

**K15. Gdje idu +40 chips od Table i kako zaokružiti.**
Chips se samo sabiraju, pa je pozicija chips dijela nebitna za rezultat; mult nije komutativan.
**Rješenje:** korak 5 emituje jedan `ScoreStep` s `+40 (+25 po levelu) chips` i `×(2 + 0,5·(lvl−1))`. Mult se čuva kao `number`, prikazuje `toFixed(1)`, a finalni rezultat je `Math.floor(chips * mult + 1e-9)` (epsilon protiv grešaka tipa 0,1+0,2).

**K16. "Nošena karta" u tekstovima gostiju uključuje li kartu iz ruke?**
**Rješenje:** "nošena karta" = **bodovana karta** (uključuje kartu iz ruke). Izuzetak su efekti koji kažu "sa stola" (Student). Važi za Zaljubljenog, Zlatara, Baštovana, Rudara, Ribara, Švalera, Učiteljicu, Kolekcionara, Desetku i Dvojku. Đedo, Kraljica kafane i Čelična gledaju **držane karte**.

**K17. Kad rastu gosti koji rastu (Učiteljica, Kolekcionar, Kafedžija, Legenda, Nosač)?**
**Rješenje:** `onCapture` čita trenutni brojač, a `afterScore` ga povećava. Trenutno nošenje se **ne** računa u svoj bonus (prva Tabla s Legendom boduje ×1, druga ×1,5). Učiteljica čuva ukupni broj karata u brojaču, a bonus je `floor(ukupno / 2)`, pa se ostatak ne gubi. Nosač raste u `onLay`, a chips daje u `onCapture`.

**K18. Nasumični efekti u previewu.**
**Rješenje:** preview (i NAJBOLJE) računa kao da Kockar i razbijanje Staklene **nisu** okinuli, a uz predviđene bodove prikazuje ikonicu kocke. Preview koristi klon RNG-a i ne troši stream.

### D. Gosti

**K19. Dvojnik: tekst je u kontradikciji sam sa sobom.**
CONTENT kaže da Dvojnik "ne može kopirati `modifyRules` efekte koji već važe globalno", a odmah zatim da kopija Pekara daje dodatno +1 nošenje.
**Rješenje:**
- Dvojnik izvršava **sve** hookove desnog susjeda, uključujući `modifyRules`, jer su to aditivne izmjene (Pekar +1 nošenje, Krojač +1 ruka, Trgovac +1 slot, Taksista +2 pare, Gatara drugi fildžan).
- `copyable: false` imaju samo Dvojnik i Mađioničar (idempotentan, kopija ne radi ništa). UI za njih prikazuje oznaku "nekompatibilno".
- **Dvojnik + Bekrija:** kopira oba dijela, dakle ×2 Mult još jednom **i** −1 nošenje (ukupno −2). Ovo je namjerni rizik.
- Rastući gosti: kopija čita brojače **originala**, a hookovi rasta (`afterScore` i `onLay`) se za kopiju ne izvršavaju, pa nema duplog rasta.
- Edicija Dvojnika je njegova. Ako je original onesposobljen (Vlasnik lanca), kopija ne radi ništa.

**K20. Redoslijed računanja `Rules` i donje granice.**
**Rješenje:** osnova → špil → uloga → investicije → `modifyRules` gostiju slijeva nadesno (onesposobljeni se preskaču) → gazda (uvijek posljednji). Nakon toga: nošenja ≥ 1, ruka ≥ 1, spuštanja ≥ 0, sto max 10. Policijski sat = `min(izračunato, 3)`. Konobar žuri = spuštanja 0.

**K21. Legendarni gosti nemaju cijenu ni oznaku hooka.**
**Rješenje:** `cost: 12` (služi samo za prodaju, prodaja 6). Hookovi: Stari majstor `onCardScored` (retrigger), Kraljica kafane `onHeldCard`, Legenda `onCapture + afterScore`.

### E. Gazde

**K22. Gazde koje "poništavaju" bodove.**
**Rješenje:** Privatna proslava i Škrti gazda puštaju cijeli pipeline (pare, razbijanje stakla, rast gostiju, statistika, Tabla se broji), a zatim dodaju posljednji `ScoreStep` "×0". Ruža na stolu: Tabla se i dalje **broji** (statistika, dostignuća, Kafedžija, Legenda), ali bazni Tabla bonus, Komšija i Gazdarica ne daju ništa.

**K23. Inspekcija i Penzija: šta znači "ne daju chips/efekte".**
**Rješenje:** Inspekcija: karta ♣ daje 0 chips iz svih izvora (nominalno, bonus 2♣, enhancement Bonus, Folija), ali mult efekti i hookovi rade. Penzija: figure (po ranku, uključujući Divlje figure) ne prolaze nijedan korak bloka karte ni korak 3 (nema chips, enhancementa, edicije, hookova; Kraljica kafane ne broji Dame). Validacija nošenja radi normalno.

**K24. Pijani gost.**
**Rješenje:** nakon bodovanja i provjere pobjede, prije dopune stola, 1 nasumična držana karta (`rng.stream('boss')`) ide u kup. Ne okida `onLay`.

**K25. Vlasnik lanca: da li je 100.000 već ×1,5?**
**Rješenje:** vrijednosti u GDD §4.2 su **bazne**. Vlasnik lanca množi: 100.000 × 1,5 = 150.000. To vraća rast između kafana 7 i 8 na nivo ranijih kafana (×2,1 umjesto ×1,43). Uloge se množe na to (Splav: 225.000). Svi ciljevi se zaokružuju naniže (`Math.floor`). Beskonačni mod: kafana N+1 = bazni ciljevi kafane N × 1,6 (od 50k/75k/100k, bez ×1,5 Vlasnika). Gazde u beskonačnom modu: nasumično iz bazena; kad se bazen isprazni, resetuje se. Vlasnik lanca se pojavljuje u svakoj kafani djeljivoj s 8.

### F. Ekonomija i Šank

**K26. Kamata u odnosu na nagrade.**
**Rješenje:** isplata na kraju pobijeđene runde ide ovim redom i prikazuje se red po red: (1) **kamata** = `min(floor(pare_u_trenutku_pobjede / 5), limit)`, računata **prije** svih ostalih isplata, (2) nagrada runde (3/4/5), (3) +1 po neiskorištenom nošenju, (4) `onRoundEnd` gostiju (Taksista). Primjer: 14 para pri pobjedi u Večernjoj smjeni, 2 nošenja ostala → +2 kamata, +4, +2 = 22.

**K27. Restoran ("Gazda ne daje pare").**
**Rješenje:** ukida samo baznu nagradu Gazde (5). Kamata, neiskorištena nošenja i Taksista se i dalje isplaćuju.

**K28. Cijene, popust i prodaja.**
**Rješenje:** `cijena = max(1, floor(bazna × (1 − popust))) + doplata_uloge` (Splav +1). Popust važi za predmete, ture, investicije i reroll. Prodaja = `max(1, floor(plaćena_cijena / 2))`, plaćena cijena se čuva na instanci. Švercer: +1 na prodajnu cijenu gosta i +3 pare po prodaji gosta (ukupno +4). Prodaja samog Švercera ne okida njegov efekat.

**K29. Šanse u Šanku.**
**Rješenje:** težine 70/20/10 (gost/rakija/fildžan). Destilerija udvostručuje težinu rakije: 70/40/10, normalizovano 58,3% / 33,3% / 8,3%. Gost kojeg igrač već ima se ne nudi. Legendarni: pri svakom slotu Ture gostiju prvo se baca 0,5% za legendarnog, inače 70/25/5.

**K30. Edicije na kartama nemaju izvor.**
CONTENT §4.3 definiše edicije za karte, ali ih ništa ne daje.
**Rješenje:** Tura karata: svaka karta ima 5% šanse za ediciju (Folija 3%, Holo 1,5%, Polikrom 0,5%), nezavisno od enhancementa i pečata.

**K31. Fildžani: kada i nad čim.**
**Rješenje:** fildžani koji ciljaju karte koriste se samo tokom runde, nad kartama u ruci, i ne troše akciju. Promjena je trajna (karta u ruci je instanca iz `run.deck`). Novčić i Sunce se mogu koristiti bilo kad. Krst uništava karte iz ruke, a ruka se odmah dopunjava. Ogledalo kopira rank, boju, enhancement, pečat i ediciju, a nova kopija dobija novi `id`. Sunce pravi kopiju u slot koji samo oslobodi. Rakija iz Ture rakija se računa kao "posljednja iskorištena". "Do 2 karte" znači 1 ili 2.

### G. Meta i sadržaj

**K32. Dostignuća: zbir je tačan (24), ali dva su suvišna.**
Brojanje: stavke 1–4 (4) + stavka 5 (5) = 9; stavke 6–10 (5) = 14; stavka 11 (6) = 20; stavke 12–15 (4) = **24**. ✔
Problemi: (a) "sve uloge" je isto što i pobjeda na Splavu, jer se uloge otključavaju redom; (b) "Pobijedi s Klasičnim špilom" se uvijek otključava zajedno s "Pobijedi partiju".
**Rješenje:** zadržati 24 i zamijeniti: (a) "sve uloge" → "Pobijedi partiju na Splavu s 3 različita špila"; (b) Klasični → "Pobijedi partiju bez ijednog Rijetkog ili Legendarnog gosta". "Kafana 12" znači *ući* u kafanu 12. Seeded partije ne otključavaju ni dostignuća (dosljedno GDD §6).

**K33. Asovski špil i jedinstveni ID-jevi.**
"8 asova (2 dodatna po boji ♥ i ♠)" znači 4 + 2×A♥ + 2×A♠ = 8 asova, bez 4 dvojke, dakle 52 karte.
**Rješenje:** `Card.id` je uvijek jedinstveni uid (npr. `c017`), nikad `AH`, jer postoje duplikati (Asovski špil, Ogledalo, Tura karata).

**K34. Prazna ruka i prazan špil.**
**Rješenje:** kad se špil isprazni, ruka se smanjuje i igra se nastavlja (K9 određuje kraj). Na kraju runde sve karte iz kupa, ruke, stola i špila vraćaju se u `run.deck`, osim razbijenih i uništenih.

---

## 2. Tutorijal (3 vođene runde)

**Tehnički okvir:** tutorijal koristi `createScriptedRound(script)` u `src/core`: isti reducer, ali špil nije miješan, nego zadan redoslijedom ispod. Bez gostiju, svi leveli 1, H = 6, 5 nošenja, 3 spuštanja, bez gazde, bez Šanka između rundi, pare se ne prenose. Unos je **zaključan**: aktivne su samo karte i dugmad iz trenutnog koraka (ostale karte su zatamnjene 40%). Ako igrač 20 s ništa ne uradi, pojavljuje se pulsirajuća ruka koja pokazuje sljedeći klik. Pozicije stola se broje slijeva nadesno. Redoslijed dopune je po K6 (pobjeda → sto → ruka).

### Runda 1 — "Par" (cilj 75)

| | Karte |
|---|---|
| Sto | 7♥, K♠, 3♦, 9♣ |
| Ruka | 7♣, K♦, 9♥, 2♠, 5♦, 4♣ |
| Špil (vrh prvi) | 6♠, 8♥, A♦, 10♣, 4♥, Q♣ … (ostatak fiksni seed `TUTOR001`) |

Provjera: na stolu su parovi zbirova 10 (3+7) i 12 (3+9), a u ruci nema ni 10 ni J. Jedina moguća nošenja su Parovi 7, K i 9.

| Korak | Tekst za igrača (bs) | Istaknuto u UI-ju | Rezultat |
|---|---|---|---|
| 1 | "Dobro došao u kafanu! Ovo je **sto**, a dolje je tvoja **ruka**. Cilj runde je skupiti **75 bodova**." | lijevi panel: cilj; sto; ruka | — |
| 2 | "Kartom iz ruke možeš **nositi** kartu iste vrijednosti sa stola. Boja nije bitna. Klikni na **7♣**." | 7♣ (puls) | 7♥ se istakne |
| 3 | "Sedmica na stolu svijetli jer je možeš nositi. Klikni na **7♥**, pa na **NOSI**." | 7♥, zatim NOSI | Par: (10 + 7 + 7) × 1 = **24** |
| 4 | "To je **Par**. Bodovi su uvijek **Chips × Mult**. Svaka karta daje chips, a tip nošenja daje osnovu." | traka Chips × Mult | ruka vuče 6♠ |
| 5 | "Figure imaju veće vrijednosti: **J = 12, Q = 13, K = 14**. Nosi **K♠** svojim **K♦**." | K♦, K♠, NOSI | Par: (10 + 10 + 10) × 1 = **30**, ukupno 54; ruka vuče 8♥ |
| 6 | "Još jedan. Nađi par sam." | samo 9♥ i 9♣ aktivni, bez pulsa | Par: (10 + 9 + 9) × 1 = **28**, ukupno **82 ≥ 75** |
| 7 | "Pobjeda! Ostala su ti **2 nošenja**, a svako neiskorišteno nošenje u pravoj partiji donosi **1 paru**." | brojač nošenja, ikonica para | kraj runde |

### Runda 2 — "Zbir" i as kao 1 ili 11 (cilj 180)

| | Karte |
|---|---|
| Sto | A♠, 7♦, 6♣, 4♥ |
| Ruka | K♦, A♥, 8♣, 3♠, J♥, 6♦ |
| Špil (vrh prvi) | 9♠, 2♥, 5♣ (dopuna stola), 7♣ (dopuna ruke), zatim Q♥, 3♣, 10♠ … (seed `TUTOR002`) |

Provjera koraka 3: K = 14 = A(1) + 7 + 6. Ovo je jedina particija za K (A kao 11 bi tražio 3 ili 2+1, a toga nema).

| Korak | Tekst za igrača (bs) | Istaknuto u UI-ju | Rezultat |
|---|---|---|---|
| 1 | "Nošenje može ići i **po zbiru**: više karata sa stola čiji je zbir jednak tvojoj karti." | animirani primjer 3 + 4 = 7 iznad stola | — |
| 2 | "**As** je poseban: vrijedi **1 ili 11**, šta god ti više odgovara. Igra bira sama i pokaže ti." | A♠ na stolu, A♥ u ruci (sjaj) | — |
| 3 | "Klikni **K♦** (vrijedi 14). Sada izaberi **A♠, 7♦ i 6♣**: 1 + 7 + 6 = 14." | K♦; zatim A♠, 7♦, 6♣ redom; uz A♠ oznaka "= 1" | — |
| 4 | "Pritisni **NOSI**." | NOSI; preview "Zbir 54 × 2" | Zbir: (20 + 10 + 11 + 7 + 6) × 2 = **108** |
| 5 | "Vidiš? As je vrijedio 1 za zbir, ali u bodovima uvijek daje **11 chips**. Na stolu je ostala jedna karta, pa se sto **dopunjava do 4**." | animacija dopune: 9♠, 2♥, 5♣ | sto: 4♥, 9♠, 2♥, 5♣; ruka vuče 7♣ |
| 6 | "Sad tvoj **A♥** vrijedi **11**. Nađi karte sa stola koje zajedno daju 11." | A♥; aktivni 4♥, 9♠, 2♥, 5♣ | — |
| 7 | (nakon validnog izbora) "Tačno! Nosi." | NOSI; uz A♥ oznaka "= 11" | prihvata se {9♠, 2♥} **ili** {4♥, 5♣, 2♥}: oba daju (20 + 11 + 11) × 2 = **84**, ukupno **192 ≥ 180** |
| 8 | "Odlično. **Zbir** ima veću osnovu od Para (20 chips × 2 mult), zato se isplati tražiti zbirove." | tabela tipova (Par/Zbir) | kraj runde |

### Runda 3 — Dupla, Spuštanje i TABLA (cilj 500)

| | Karte |
|---|---|
| Sto | 9♣, 4♦, 5♥, J♠ |
| Ruka | 9♥, K♣, 3♥, 8♦, Q♦, 4♠ |
| Špil (vrh prvi) | 2♠, 6♣, 5♦ (dopuna stola), 7♠ (ruka nakon koraka 3), 10♥ (ruka nakon spuštanja), zatim 3♠, 8♣ … (seed `TUTOR003`) |

Provjera: prije spuštanja K (14) može uzeti samo {J♠, 2♠} jer je 6 + 5 = 11. Nakon spuštanja 3♥ vrijedi 6 + 5 + 3 = 14, pa K čisti cijeli sto u 2 grupe.

| Korak | Tekst za igrača (bs) | Istaknuto u UI-ju | Rezultat |
|---|---|---|---|
| 1 | "Jednom kartom možeš nositi **više grupa** odjednom. Svaka grupa mora dati vrijednost tvoje karte." | — | — |
| 2 | "Klikni **9♥**, pa izaberi **9♣** (jedna grupa) i **4♦ + 5♥** (druga grupa)." | 9♥; 9♣; 4♦, 5♥; grupe se uokvire različitim bojama | — |
| 3 | "Dvije grupe su **Dupla**: 30 chips × 3 mult. NOSI!" | NOSI | Dupla: (30 + 9 + 9 + 4 + 5) × 3 = **171**; sto: J♠ + dopuna 2♠, 6♣, 5♦; ruka vuče 7♠ |
| 4 | "Sad pogledaj **K♣** (14). J♠ + 2♠ = 14, ali 6♣ + 5♦ = samo 11. Fali ti **3**." | K♣; J♠+2♠ zeleno, 6♣+5♦ crveno s natpisom "11" | — |
| 5 | "Zato postoji **SPUŠTANJE**: karta ide na sto bez bodova i namješta budući zbir. Imaš 3 spuštanja po rundi. Izaberi **3♥** i pritisni **SPUSTI**." | 3♥, SPUSTI, brojač spuštanja | 3♥ ide desno na sto; ruka vuče 10♥ |
| 6 | "Sad K♣ može uzeti **J♠ + 2♠** i **6♣ + 5♦ + 3♥**. To je cijeli sto!" | K♣; svih 5 karata stola | — |
| 7 | "Kad očistiš cijeli sto, to je **TABLA**: +40 chips i **×2 Mult**. NOSI!" | NOSI; preview "Dupla + TABLA" | (30 + 10 + 10 + 2 + 6 + 5 + 3 + 40) × (3 × 2) = 106 × 6 = **636**, ukupno **807 ≥ 500** |
| 8 | "**TABLA!** U pravoj partiji ćeš između rundi u **Šanku** kupovati Stalne goste koji množe ovakve brojke. Sretno!" | puna Tabla sekvenca (vidi §5), zatim dugme "Prva partija" | kraj tutorijala |

Napomena za QA: svaki skript treba imati golden test u `src/core` koji odigra korake i provjeri bodove 24/30/28, 108/84 i 171/636.

---

## 3. Rizici balansa

### 3.1 Prosječan chips po karti
Po boji: as 11 + (2 do 10 = 54) + 3 figure × 10 = 95, dakle **prosjek ≈ 7,3 chips po karti**. Kod Zbira je zbir chipsa nošenih brojnih karata jednak vrijednosti V (figure kao dijelovi zbira daju manje: J = 12 vrijednosti, ali 10 chips).

### 3.2 Tipično nošenje bez gostiju (svi leveli 1)
Oznaka: V = vrijednost karte iz ruke, tipično ~9–10.

| Tip | Račun | Bodovi |
|---|---|---|
| Par | (10 + 7,3 + 7,3) × 1 | **≈ 25** |
| Zbir (V = 10, npr. 10 nosi 3+7) | (20 + 10 + 10) × 2 | **80** |
| Zbir s K (npr. 2+5+7) | (20 + 10 + 14) × 2 | **88** |
| Dupla (V ≈ 9) | (30 + 9 + 2×9) × 3 = 57 × 3 | **≈ 171** |
| Trostruka (V = 10) | (50 + 10 + 3×10) × 4 = 90 × 4 | **360** |
| Zbir + Tabla (2 karte na stolu) | (20 + 40 + 10 + 10) × 2 × 2 = 80 × 4 | **320** |
| Dupla + Tabla (V ≈ 9) | (30 + 40 + 27) × 3 × 2 = 97 × 6 | **≈ 582** |

### 3.3 Da li je kafana 1 prolazna s 5 nošenja bez kupovine?

| Scenarij (5 nošenja) | Račun | Ukupno |
|---|---|---|
| Loš (5 Parova, bez spuštanja) | 5 × 25 | 125 |
| Tipičan (1 Par, 3 Zbira, 1 Dupla) | 25 + 3 × 80 + 171 | **≈ 436** |
| Dobar (2 Zbira, 2 Duple, 1 Dupla + Tabla) | 160 + 342 + 582 | ≈ 1.084 |

- **Rani gosti (300)** traže prosjek 60 po nošenju. Tipična igra (≈ 436) prolazi s rezervom. Rizik je samo loš raspored. ✔
- **Večernja smjena (450)** traži prosjek 90 po nošenju, što je *iznad* prosječnog Zbira (80). Bez kupovine je to ≈ 50/50 i zavisi od jedne Duple. ⚠
- **Gazda (600)** traži prosjek 120. Bez kupovine je potrebna Dupla + Tabla ili Trostruka. Grubo procjenjujem ispod 25% (provjeriti simulatorom). ✖ (Gazde Privatna proslava ili Tamburaši to dodatno spuštaju.)

**Ekonomija nakon runde 1:** 4 početne + 3 nagrada + ~1 neiskorišteno nošenje + kamata floor(4/5) = 0 → **≈ 8 para**. To je dovoljno za Konobara (4) + rakiju (3). S Konobarom (+4 Mult): Par 25 × 5 = 125, Zbir 40 × 6 = 240, Dupla 57 × 7 = 399, pa tipična runda daje 125 + 3 × 240 + 399 = **1.244**. Kafana 1 je tada trivijalna, a kafana 2 (800/1.200/1.600) dostižna. Zaključak: kriva je zdrava **ako** igrač kupi jednog gosta. Glavni rizik je novi igrač koji preskoči Šank (vidi §4, prvi Šank).

### 3.4 Gosti koji izgledaju prejaki
- **Matematičar** (Obični, 5): +8 Mult na Zbir ili jače (~80% nošenja). Zbir 40 × 10 = 400 (×5 u odnosu na bazu), Dupla 57 × 11 = 627. Tipična runda: 25 + 3 × 400 + 627 = **1.852**, što je prolaz Gazde kafane 2 s jednim običnim gostom. Dominira Konobarom (+4).
- **Učiteljica** (Neobična, 7): ~3 bodovane karte po nošenju = +1,5 Mult trajno po nošenju, ~6 po rundi. Poslije kafane 3 (9 rundi) to je **≈ +54 Mult**, više od 13 Konobara.
- **Kockar** (Neobični, 6): očekivano ×(0,75 + 0,25 × 4) = **×1,75** na svako nošenje, bolje od Kuma (×1,5 samo na Dupla+) koji je skuplji. Ne mijenjam brojku, ali pratiti u simulatoru.
- **Bekrija** (Rijetki): ×2 za −20% nošenja je jak, ali to je pošten trade-off. Opasan je samo s Dvojnikom (K19), što je namjerno.

### 3.5 Gosti koji izgledaju mrtvo
- **Penzioner:** +40 chips na Par daje (25 + 40) × 1 = 65. Par ima mult 1, pa chips skoro ništa ne vrijede.
- **Nosač:** +3 chips po spuštanju, max ~9 chips po rundi. Za 24 runde to je ~+216 chips na kraju partije, a to je prekasno.
- **Đedo:** P(nema figure u 5 držanih) ≈ (40/52)^5 ≈ 0,27, a uz to +60 chips dolazi bez multa.
- **Ribar, Desetka i Dvojka:** ciljaju 4 odnosno 2 karte od 52. Očekivano ~0,3–0,5 okidanja po rundi. Desetka i Dvojka je Rijetka (9) i skoro mrtva bez fildžana boje.
- **Kraljica kafane** (legendarna): prosječno ~0,4 Dame u ruci. Mrtva bez Ogledala ili Ture karata.
- **Komšija, Gazdarica, Kafedžija:** zavise od Table, a Tabla je rijetka (K7). Gazdarica ×3 na Tabli je ok kad se desi, ali Kafedžija raste presporo.
- **Stari majstor:** mrtav ako se ne usvoji K12. S K12 je ok.

### 3.6 Prijedlozi (najviše 6)
1. **[PRIJEDLOG] P1 — Matematičar:** +8 Mult → **+5 Mult**. Zbir 40 × 7 = 280, malo iznad Konobara (240), uz uslov.
2. **[PRIJEDLOG] P2 — Učiteljica:** "+1 Mult za svake 2 nošene karte" → **"+1 Mult za svake 3 karte nošene sa stola"**. Oko 2 karte sa stola po nošenju daje ~+3,3 Mult po rundi (~+30 poslije kafane 3).
3. **[PRIJEDLOG] P3 — Penzioner:** +40 Chips → **+30 Chips i +3 Mult ako je Par**. Par: (25 + 30) × 4 = 220, konkurentno Konobaru na Zbiru (240) za uži uslov i cijenu 4.
4. **[PRIJEDLOG] P4 — Nosač:** +3 → **+8 Chips po spuštanju**. ~24 po rundi, ~+200 do kafane 4, nagrađuje stub "Spuštanje je strategija".
5. **[PRIJEDLOG] P5 — Prag dopune stola:** "< 2 karte" → **"< 1 karta"** (dopuna samo kad je sto prazan). Omogućava Par-Tablu ((10 + 40 + 14,6) × 2 ≈ 129) i namjerno "ostavljanje jedne karte", što oživljava Komšiju, Gazdaricu, Kafedžiju, Legendu i dostignuće "5 Tabli u rundi". Rizik: više prisilnih spuštanja kad je na stolu 1 karta. Testirati simulatorom (stopa prisilnih spuštanja < 5% akcija).
6. **[PRIJEDLOG] P6 — Kafana 1, Večernja smjena:** 450 → **400**. Tipična igra bez kupovine (≈ 436) tada prolazi u većini slučajeva, a Gazda (600) ostaje prvi pravi zid koji uči igrača da kupuje.

Definicija "pokvarenog" za M8 (prije playtesta): gost s pick-rateom > 60% ili win-rate razlikom > ±15 p.p.; runda kafane 1 izgubljena u > 5% partija `smart` bota; nošenje > 10× cilja runde u kafanama 1–3 u > 10% rundi.

---

## 4. Prvih 10 minuta (igrač koji nikad nije igrao Tablić)

| Vrijeme | Beat | Šta igrač radi i osjeća | Napomena za implementaciju |
|---|---|---|---|
| 0:00 | Splash: neon "OTVORENO" treperi, tamburica | atmosfera, kafana iz 80-ih | ≤ 3 s, preskakanje bilo kojim tasterom |
| 0:10 | Prvo pokretanje: pitanje "Znaš li igrati Tablić?" [Ne, nauči me] [Znam] | osjećaj da igra poštuje iskustvo | "Znam" preskače runde 1–2 i ide na rundu 3 (Dupla/Tabla/Spuštanje) |
| 0:20 | Tutorijal runda 1 (Par) | prvi uspjeh u < 30 s, nemoguće pogriješiti | §2, zaključan unos |
| 1:30 | Runda 2 (Zbir, as) | "aha" trenutak: as kao 1 i kao 11 | dozvoljena dva rješenja u koraku 7, igrač otkriva sam |
| 3:00 | Runda 3 (Dupla, Spuštanje, Tabla) | prvi veliki broj (636) i puna Tabla sekvenca | najglasniji trenutak prvih 10 minuta |
| 4:30 | Prelaz: "Prva partija" (bez ekrana izbora špila, Klasični + Kafana uloga) | odmah u igru, bez menija | izbor špila se prikazuje tek od druge partije |
| 4:45 | Mapa kafane 1 | vidi 3 runde i Gazdu unaprijed | tooltip: "Gazda mijenja pravila. Pripremi se." |
| 5:00 | Rani gosti (300), slobodna igra | prvi put sam, s NAJBOLJE kao sigurnosnom mrežom | NAJBOLJE pulsira jednom ako igrač 15 s ne radi ništa |
| 5:30 | Kontekstualni savjet "Spuštanje" | igrač shvata strategiju | okida se prvi put kad nijedno nošenje nije bolje od Para, a spuštanje bi napravilo Zbir |
| 7:00 | Pobjeda i isplata red po red | razumije da štednja donosi kamatu | isplata po K26, svaki red s animacijom kase |
| 7:15 | **Prvi Šank** | prvi gost je "moj" | samo u prvoj partiji ikad: slot 1 je garantovano Konobar; strelica "Kupi gosta"; ako igrač napusti Šank s ≥ 4 pare i bez gosta, jedan podsjetnik "Siguran si?" |
| 7:45 | Prvo nošenje s gostom | vidi kako Konobar "udari" +4 Mult u istom pipelineu | gost se zatrese i prikaže "+4 Mult" iznad portreta |
| 8:30 | Večernja smjena (450) | osjeća napredak, brojke rastu | — |
| 9:30 | Šank 2: objašnjenje redoslijeda gostiju i Rakije (jedan tooltip) | otkriva da redoslijed ima značaj | samo ako je kupio ≥ 2 gosta |
| 10:00 | Najava Gazde na mapi | napetost, "još jedna runda" | ime i pravilo Gazde, cilj 600 |

Onboarding checklista: osnovni glagol (nošenje) u < 30 s ✔ · prvi uspjeh garantovan ✔ · svaka nova mehanika u sigurnom kontekstu ✔ · igrač sam otkriva jednu mehaniku (dvije validne opcije za as kao 11) ✔ · tutorijal završava hookom (Tabla + "Prva partija") ✔.

---

## 5. Juice lista (po prioritetu)

| # | Trenutak | Animacija / zvuk | Šta igrač treba osjetiti |
|---|---|---|---|
| 1 | Brojanje Chips × Mult (svaki `ScoreStep`) | broj iskoči iznad izvora (karta ili gost), leti u traku; ton raste za polustepen po koraku; ×Mult koraci imaju teži "udarac" i kratki zoom trake | "lanac se gradi", nagomilavanje |
| 2 | **TABLA** | sto se zatamni, karte odlete u kup spiralom, neon "TABLA!" udari, aplauz + "Opaaa!", trešnja ekrana 300 ms, ×2 se upiše kredom | vrhunac, trenutak za klip |
| 3 | Finalni rezultat nošenja | Chips i Mult se sudare u sredini, broj se otkotrlja do ukupnog, glasnoća i trešnja skaliraju s log10(bodova) | "koliko je to bilo?!" |
| 4 | Izbor karte i validan izbor | karta iz ruke se podigne i nagne; validne karte na stolu dobiju topli sjaj; kad izbor postane validan, NOSI "klikne" uz zvuk kafanske čaše | jasnoća, "znam šta mogu" |
| 5 | Okidanje gosta | portret se zatrese i odskoči, oblačić s efektom, kratki zvuk lika (uzvik, ne riječ) | gosti su živi likovi, "moj tim" |
| 6 | Pobjeda u rundi i isplata | brojač cilja pukne kao balon; svaki red isplate je "cink" kase; kamata ima poseban zvuk zveckanja | olakšanje, nagrada za štednju |
| 7 | Retrigger | karta se ponovo okrene uz duh-kopiju i natpis "Opet!", ton jednu oktavu više | "dobio sam to dva puta" |
| 8 | Razbijanje Staklene | karta pukne na čestice stakla, zvuk loma, kratka tišina | rizik se ostvario, gubitak sa stilom |
| 9 | Spuštanje | karta klizne i "lupi" o filc, a sumirani zbirovi s njom zasvijetle ("sad 6 + 5 + 3 = 14") | planiranje se isplatilo |
| 10 | Prijetnja porazom | ako je ostalo 1 nošenje i fali > 30% cilja, muzika se stiša, vinjeta se pojača, brojač nošenja pulsira crveno | napetost, fokus |
| 11 | Najava Gazde | svjetla trepnu, muzika prelazi na Gazda numeru, kartica s pravilom se zalijepi na sto | "ovo je drugačije", poštovanje prema bossu |
| 12 | Kupovina u Šanku | gost "ulazi" i sjeda u slot, flaša rakije se otvori ("plop") | vlasništvo, ulaganje |

Sve animacije poštuju brzinu 1×/2×/4×, preskakanje klikom i "smanjene pokrete" (trešnja ekrana i zoom se tada isključuju, a zadržavaju se boja i zvuk).
