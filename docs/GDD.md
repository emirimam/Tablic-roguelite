# TABLA — Game Design Document (v1.0)

> Radni naziv: **TABLA — kafanski roguelite**. Prije Steam stranice treba provjeriti zauzetost imena i žiga.

## 1. Pitch
"Tablić, ali svako nošenje može eksplodirati u milion bodova."
Klasična balkanska kartaška igra pretvorena u roguelite sa scoring engineom. Igrač nosi karte sa stola po zbiru, skuplja ekscentrične stalne goste kafane koji lančano množe bodove i pokušava preživjeti 8 kafana i njihove gazde.

- **Platforme:** Steam (Win/Mac/Linux, Steam Deck Verified je cilj), besplatni web demo. Mobile (iOS/Android, premium) dolazi nakon PC lansiranja.
- **Cijena:** 7,99 USD (lansirni popust 10–15%).
- **Dužina partije:** 30–60 min. Sesija se može prekinuti u bilo kom trenutku jer se igra autosaveuje.
- **Ciljna publika:** fanovi Balatra i Slay the Spirea, ljubitelji kartaških igara i balkanska dijaspora (kulturni hook).
- **Ton:** topao, duhovit, nostalgičan. Kafana iz 80-ih, tamburica, dim, neon "OTVORENO".

## 2. Dizajnerski stubovi
1. **Pravila stanu u 30 sekundi.** Tablić je jednostavan. Dubina dolazi iz gostiju, ne iz komplikovanih pravila.
2. **Svako nošenje je mali spektakl.** Brojanje chipsa i multa, zvuk i trešnja ekrana. Ovo je igra za klipove.
3. **Spuštanje je strategija.** Kad igrač spusti kartu na sto, on namješta budući zbir. To je ono što nas razlikuje od Balatra.
4. **"Još jedna partija."** Kratke runde, seedovi za dijeljenje, otključavanja.

## 3. Osnovna pravila (Tablić)

### 3.1 Karte i vrijednosti
Standardni špil od 52 karte, 4 boje: Tref ♣, Karo ♦, Herc ♥, Pik ♠.

| Karta | Vrijednost u Tabliću | Chips (bodovanje) |
|---|---|---|
| As | 1 **ili** 11 (bira se za svako nošenje) | 11 |
| 2–10 | nominalna | nominalna |
| Žandar (J) | 12 | 10 |
| Dama (Q) | 13 | 10 |
| Kralj (K) | 14 | 10 |

Tradicionalni bonusi: **Velika desetka (10♦)** donosi +20 chips, a **Mala dvojka (2♣)** +15 chips (pored nominalnih).

### 3.2 Nošenje (Capture)
Igrač bira jednu kartu iz ruke vrijednosti **V** i skup karata sa stola. Skup je validan ako se može podijeliti u disjunktne grupe kod kojih **zbir svake grupe = V**. Grupa od jedne karte znači kartu iste vrijednosti.
- Svaki as (u ruci i na stolu) nezavisno vrijedi 1 ili 11.
- Primjer: u ruci je 10, na stolu 3, 7, 4, 6, 10, K. Moguće je nositi {3,7} + {4,6} + {10}, a K ostaje.
- Igrač ne mora nositi sve moguće. Bira podskup, a UI nudi "najbolje nošenje" kao prijedlog.
- Karta iz ruke i nošene karte idu u **kup**, odnosno van igre do kraja runde.

### 3.3 Spuštanje (Lay)
Igrač stavlja kartu iz ruke na sto bez nošenja. Ne boduje se (osim ako neki gost kaže drugačije). Služi da se namjesti zbir ili da se riješi loše karte.

### 3.4 Tabla
Ako nošenje očisti **cijeli sto**, to je **TABLA**: dodatni bonus (§5.2) i velika animacija.

## 4. Struktura partije

### 4.1 Runda
- Na početku runde špil se promiješa, na sto se dijele **4 karte**, a u ruku **6 karata** (veličina ruke H=6).
- Igrač ima po rundi **5 nošenja** i **3 spuštanja**.
- Nakon svake akcije ruka se dopunjava do H iz špila. Ako na stolu ostane **manje od 2 karte**, sto se dopunjava do 4.
- Maksimalno 10 karata na stolu. Kad je sto pun, spuštanje nije dozvoljeno.
- **Pobjeda:** ukupni bodovi runde ≥ cilj. Runda se završava odmah, a neiskorištena nošenja donose pare.
- **Poraz (kraj partije):** potrošena su sva nošenja, a cilj nije dostignut. Poraz je i kad nema validne akcije (nijedno nošenje nije moguće, nema spuštanja ili je sto pun) i špil je prazan.
- Ako igrač ima nošenja, ali nijedna karta iz ruke ne može ništa nositi, mora spustiti. Ako nema ni spuštanja, slijedi "Prisilno spuštanje": karta se spušta, ali košta 1 nošenje. Tako igra nikad ne zaglavi.

### 4.2 Kafane (ante) i runde
Partija ima **8 kafana**. Svaka kafana ima 3 runde: **Rani gosti** (mala), **Večernja smjena** (velika) i **Gazda** (boss sa specijalnim pravilom, CONTENT §6).
Ciljevi (početne vrijednosti, balansira se u M8):

| Kafana | Rani gosti | Večernja smjena | Gazda |
|---|---|---|---|
| 1 | 300 | 450 | 600 |
| 2 | 800 | 1.200 | 1.600 |
| 3 | 2.000 | 3.000 | 4.000 |
| 4 | 5.000 | 7.500 | 10.000 |
| 5 | 11.000 | 16.500 | 22.000 |
| 6 | 20.000 | 30.000 | 40.000 |
| 7 | 35.000 | 52.500 | 70.000 |
| 8 | 50.000 | 75.000 | 100.000 |

Pobjeda nad Gazdom kafane 8 znači **pobjedu u partiji**. Nakon toga se nudi **Beskonačni mod** u kome cilj svake sljedeće kafane raste ×1,6.

### 4.3 Ekonomija (Pare)
- Početak partije: 4 pare.
- Nagrada za pobijeđenu rundu: Rani gosti 3, Večernja 4, Gazda 5.
- +1 para za svako neiskorišteno nošenje.
- Kamata: +1 za svakih 5 para koje igrač drži, najviše +5 (Investicija podiže limit na 10).

### 4.4 Šank (prodavnica) nakon svake runde
- 2 slota za nasumične predmete (gost 70%, rakija 20%, fildžan 10%).
- 2 ture (booster paketa).
- 1 Investicija (voucher) po kafani, koja se obnavlja kad počne nova kafana.
- Reroll košta 5 para i poskupljuje za +1 nakon svakog rerolla. Cijena se resetuje sljedećeg posjeta.
- Prodaja vraća pola cijene (zaokruženo naniže, minimalno 1).

### 4.5 Slotovi
- **5 slotova za goste** (redoslijed je bitan, igrač ih može prerasporediti).
- **2 slota za potrošne predmete** (rakije i fildžani).

## 5. Bodovanje

### 5.1 Tipovi nošenja (određuje ih broj grupa)
| Tip | Uslov | Bazni Chips | Bazni Mult | Po levelu |
|---|---|---|---|---|
| **Par** | 1 grupa od 1 karte | 10 | 1 | +10 chips, +1 mult |
| **Zbir** | 1 grupa od 2+ karte | 20 | 2 | +15 chips, +1 mult |
| **Dupla** | tačno 2 grupe | 30 | 3 | +20 chips, +2 mult |
| **Trostruka** | 3+ grupe | 50 | 4 | +30 chips, +3 mult |

Kad postoje 2+ grupe, tip je Dupla ili Trostruka bez obzira na veličinu grupa.

### 5.2 Tabla (bonus koji se dodaje na tip)
Ako je sto nakon nošenja prazan: **+40 chips** i na kraju **×2 Mult**. Svaki level dodaje +25 chips i +0,5× (level 2 daje ×2,5).

### 5.3 Formula
`Bodovi = Chips × Mult`, zaokruženo naniže. Mult se prikazuje s jednom decimalom.

### 5.4 Redoslijed računanja (fiksan, mora imati testove)
1. Bazni chips i mult tipa nošenja (po levelu).
2. Karte, redom: prvo karta iz ruke, zatim nošene karte slijeva nadesno po poziciji na stolu. Za svaku kartu:
   a) chips karte (vrijednost + specijalni bonus 10♦/2♣),
   b) poboljšanje karte (enhancement),
   c) edicija karte,
   d) retriggeri (crveni pečat i gosti) ponavljaju korake a–c,
   e) hookovi gostiju tipa `onCardScored`, slijeva nadesno.
3. Efekti karata koje ostaju u ruci (npr. Čelična), pa hookovi `onHeldCard`.
4. Hookovi gostiju tipa `onCapture` (nezavisni efekti), slijeva nadesno, uključujući edicije gostiju.
5. Tabla bonus (×Mult).
6. Hookovi `afterScore` (npr. gosti koji rastu).

Svaki korak emituje `ScoreStep { source, chipsDelta, multDelta, xMult, text }`, a render ih animira redom.

## 6. Meta-progresija
- **Špilovi** (otključavaju se pobjedama, CONTENT §8) i **Uloge**, tj. težine (CONTENT §9).
- **Kolekcija:** sve viđene karte, gosti i Gazde, s opisima.
- **Statistika:** najveće nošenje, broj tabli, najdalja kafana, omiljeni gost.
- **Seed:** svaka partija ima seed od 8 znakova koji se prikazuje i može se unijeti ("izazovi prijatelja"). Seeded partije ne otključavaju ništa.
- **Dostignuća:** 24 (CONTENT §10), mapirana na Steam Achievements.

## 7. Ekrani i UX
1. **Splash, pa Glavni meni:** Nastavi, Nova partija, Kolekcija, Statistika, Podešavanja, Pravila, Izlaz.
2. **Nova partija:** izbor špila i uloga, opcionalni seed.
3. **Igra:** sto u centru, ruka dolje, gosti gore, potrošni predmeti gore desno. Lijevi panel prikazuje cilj, trenutne bodove, nošenja, spuštanja, pare, kafanu i rundu. Prikaz "Chips × Mult" je velik i centralni.
4. **Šank** između rundi.
5. **Mapa kafane** prije runde (3 runde i opis Gazde unaprijed).
6. **Kraj partije:** statistika, seed i dugme "Podijeli".
7. **Podešavanja:** jezik, zvuk (muzika i efekti), brzina animacija (1×/2×/4×), trešnja ekrana on/off, smanjeni pokreti, color-blind mod boja karata (4 boje: ♣ zelena, ♦ plava), fullscreen, VSync.

### 7.1 Interakcija nošenja
- Klik/tap na kartu u ruci istakne sve karte sa stola koje učestvuju u bilo kom validnom nošenju.
- Klikom na karte stola igrač gradi izbor. Dugme **NOSI** postaje aktivno tek kad je izbor validan, a uz njega se odmah prikazuje predviđeni tip i bodovi (Chips × Mult).
- Dugme **NAJBOLJE** automatski bira izbor s najvećim bodovima.
- Dugme **SPUSTI** spušta izabranu kartu iz ruke.
- Desni klik ili dugo držanje na bilo čemu otvara tooltip s punim opisom.
- Gamepad: D-pad/stick za navigaciju, A za izbor, X za NOSI, Y za SPUSTI, LB/RB za prelazak između ruke i stola.

### 7.2 Tutorijal
Mnogi igrači (posebno izvan Balkana) ne znaju Tablić. Zato je obavezan **interaktivni tutorijal** od 3 vođene runde: Par, Zbir, pa Dupla s Tablom. Pokreće se automatski pri prvom pokretanju, a kasnije iz menija. Ekran "Pravila" sadrži primjere s animacijom.

## 8. Umjetnički pravac
- **Vizual:** 2D, toplo i tamno. Zeleni filc stola, drvo, prigušeno žuto svjetlo i neon akcenti. Blagi CRT/film grain filter koji se može isključiti.
- **Karte:** proceduralno crtane, čiste, s velikim indeksima (čitljivost na Steam Decku). Poboljšanja imaju jasan vizualni znak (zlatni rub, staklo, žig).
- **Gosti:** portreti u stilu karikature, po jedan za svakog. U MVP-u su placeholderi (silueta, ime i ikonica).
- **UI font:** jedan display font s karakterom (OFL) i jedan čitljiv sans (OFL).

## 9. Zvuk
- **Muzika:** loop instrumental u stilu tamburice/sevdaha (3 numere: meni, igra, gazda) i dinamički intenzitet pri velikim bodovima. Licenca CC0 ili naručena.
- **SFX:** šuštanje karata, "tap" pri biranju, brojanje chipsa (rastući ton), udarac multa, staklo, kase za pare, aplauz i "Opaaa!" za Tablu.

## 10. Van opsega za v1.0 (post-launch)
Dnevni izazov s online leaderboardom, preskakanje rundi s nagradama, co-op ili versus, Steam Workshop, mobile verzija (v1.1), dodatni jezici (de, tr, pl, es, pt-BR).
