# TABLA — Checklista za objavu

Stavke označene sa 👤 radi Emir (račun, novac, pravni dio), a ostale radi Claude Code.

## Steam (administracija) 👤
- [ ] Steamworks partner račun, porezni i bankovni podaci, Steam Direct naknada za App ID
- [ ] Provjera zauzetosti imena "TABLA" na Steamu i u registru žigova; rezervno ime spremno
- [ ] Steam stranica "Coming Soon" što ranije (wishlistovi). Steam traži da stranica bude javna određeno vrijeme prije lansiranja, pa aktuelni rok treba provjeriti u Steamworks dokumentaciji.
- [ ] Popunjen upitnik o sadržaju (rating). Igra nema pravog kockanja ni pravog novca, ali tema rakije/kafane i mehanika "Kockar" se navode iskreno.
- [ ] AI disclosure ako su korišteni AI-generisani asseti
- [ ] Cijena i regionalne cijene (preporuka: 7,99 USD), lansirni popust
- [ ] Datum lansiranja koji se ne poklapa s velikim izdanjima u žanru
- [ ] Prijava na Steam Next Fest s demom

## Steam (materijali)
- [ ] Capsule slike u svim traženim dimenzijama (aktuelne dimenzije provjeriti u Steamworks dokumentaciji)
- [ ] 5–10 screenshota 1920×1080 (velika kombinacija, Šank, Tabla, Gazda, kolekcija)
- [ ] Trailer 30–60 s: hook u prve 3 sekunde (veliki broj koji eksplodira), pa pravila za 10 s, pa kombinacije, pa CTA
- [ ] Kratki i dugi opis (en + bs), tagovi: Roguelike Deckbuilder, Card Game, Roguelite, Casual, Strategy, Singleplayer, Replay Value
- [ ] Steam Deck: testirati i zatražiti kompatibilnost

## Tehnički
- [ ] Dostignuća konfigurisana u Steamworksu, ključevi se poklapaju s `data/achievements.json`
- [ ] Steam Cloud (Auto-Cloud za save folder) testiran na 2 računara
- [ ] Builds za Win/Mac/Linux uploadovani kroz SteamPipe (depoti po OS-u)
- [ ] macOS: potpisivanje i notarizacija (👤 Apple Developer račun) ili odluka da se Mac odloži
- [ ] Windows: SmartScreen upozorenje je prihvatljivo za Steam (Steam ne traži potpis)
- [ ] Crash log fajl lokalno + "Pošalji izvještaj" otvara email/formu (bez slanja podataka bez pristanka)
- [ ] Verzija i build broj u meniju
- [ ] Svi stringovi prevedeni (test prolazi)
- [ ] Nema `console.log` ni debug menija u release buildu (debug samo uz flag)

## Pravno i licence
- [ ] `ASSETS_LICENSES.md` je kompletan (fontovi, audio, biblioteke)
- [ ] Credits ekran s licencama open-source biblioteka (automatski generisano)
- [ ] Politika privatnosti (jednostavna: igra ne prikuplja lične podatke) 👤
- [ ] Nema imena, tekstova ni vizuala preuzetih iz drugih igara

## Marketing (paralelno s razvojem) 👤
- [ ] TikTok/YouTube Shorts: 2–3 klipa sedmično od M6 nadalje (najveće kombinacije, "objašnjavam Tablić strancima")
- [ ] Reddit: r/roguelites, r/incremental_games, r/IndieDev, regionalni subredditi
- [ ] Press kit stranica (presskit.html ili sličan servis)
- [ ] Lista 30–50 streamera i YouTubera koji igraju deckbuildere (uključujući regionalne) + ključevi 2 sedmice prije lansiranja
- [ ] Discord server za igrače

## Dan lansiranja
- [ ] Build označen kao default branch u Steamworksu
- [ ] Objave na svim kanalima, pinned post s poznatim problemima
- [ ] Plan za hotfix u prvih 72 sata
