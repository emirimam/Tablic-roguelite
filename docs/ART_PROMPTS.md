# TABLA — Art prompti (AI generisanje slika)

> Dopuna za GDD §8 (Umjetnički pravac). Objašnjenja su na bosanskom, a sami prompti na engleskom jer modeli za slike najbolje razumiju engleski.
> Spisak likova prati CONTENT.md §1 (Stalni gosti) i §6 (Gazde). Kad se sadržaj u CONTENT.md promijeni, ažuriraj i ovaj fajl.

---

## 1. Stilski vodič

### 1.1 Jedna rečenica
**Topla kafanska karikatura iz 80-ih, slikana gvašom i tušem, kao da ju je stalni gost nacrtao na poleđini jelovnika pod žutom sijalicom.**

### 1.2 Tehnika
- **Medij:** gvaš (gouache) s tankim linijama tuša i laviranim tušem (ink-and-wash). Vidljivi potezi četke, malo zrnca papira, rubovi ponegdje nedovršeni.
- **Karikatura:** pretjerane, ali simpatične crte (veći nos, obrve, uši, brkovi, frizure), proporcije glave oko 1,3× realne. Lice mora biti izražajno i čitljivo na malom formatu (Steam Deck: portret je oko 120 px visok).
- **Ton:** toplo, duhovito, s ljubavlju. Smijemo se *sa* likovima, ne *njima*.

### 1.3 Paleta (ograničena, topla)
| Uloga | Boja | Hex |
|---|---|---|
| Svjetlo sijalice (glavni akcenat) | jantar | `#E8A84A` |
| Duhanski oker (sredina) | oker | `#B7863F` |
| Krem / papir / koža u svjetlu | krem | `#F1E3C6` |
| Zeleni filc (tamni) | filc | `#1F4D3A` |
| Zeleni filc (srednji) | filc svijetli | `#2E6B4F` |
| Vino / tamnocrvena (♥ ♦, odjeća) | bordo | `#7A2E2A` |
| Orahovo drvo / sjene | orah | `#4A2E1E` |
| Najdublja sjena | gotovo crna | `#1E1612` |
| Dim / izmaglica | dim | `#8C8577` |
| Neon akcenat (samo rijetko, rubno svjetlo) | neon crvena | `#E2445C` |

Pravilo: na svakom portretu dominiraju jantar, krem i orah; zelena i bordo su sekundarne; neon se koristi najviše kao tanko rubno svjetlo (npr. kod Gazda), nikad kao velika površina.

### 1.4 Svjetlo
- Jedan topli ključni izvor (volfram sijalica, ~2700 K) **odozgo lijevo**, meke sjene udesno-dolje.
- Blago toplo odbijeno svjetlo odozdo (sa stola).
- Lagana izmaglica dima iza lika, nikad preko lica.
- **Gazde** dobijaju dodatno tanko hladno ili neon rubno svjetlo s desne strane, da se odmah razlikuju od stalnih gostiju.

### 1.5 Kadar
- **Glava i ramena**, lik gleda prema kameri ili blago u tri četvrtine.
- Format **3:4 uspravno**. Lice u gornjoj trećini, oči otprilike na 38% visine.
- Ostaviti ~8% praznog prostora oko lika (UI stavlja okvir, ime i ediciju preko).
- **Pozadina:** jednostavna, topla vinjeta (jantar u centru prelazi u orah/gotovo crnu na rubovima). Bez detaljnog enterijera, da portreti stoje zajedno kao serija.
- Jedan rekvizit ili znak koji **komunicira efekat** gosta (npr. Rudar ima kacigu s lampom i značku pika ♠). Simboli boja karata su dozvoljeni kao *oblik* (značka, vez, tetovaža), ali **nikad kao tekst ili brojevi**.

### 1.6 Šta izbjegavati
- **Ne ličiti na Balatro ni bilo koju postojeću igru:** bez pikselarta, bez džoker karata, bez CRT-pikselastih okvira kartica, bez neon-psihodeličnih vrtloga, bez kartica-portreta s ukrasnim brojevima u ćoškovima. Bez stila Hearthstone/Slay the Spire/Inscryption.
- **Bez stvarnih osoba:** nijedan lik ne smije ličiti na poznatog pjevača, glumca, političara ili sportistu. Ne navoditi imena živih umjetnika kao stilsku referencu.
- **Bez logotipa, brendova, natpisa i teksta** (ni na flašama, ni na znakovima, ni na odjeći). Neon "OTVORENO" se dodaje kasnije kao zaseban, ručno složen element.
- **Bez stereotipa** koji ponižavaju bilo koju naciju, etničku grupu ili religiju; bez religijskih simbola na likovima; bez nacionalnih zastava i grbova.
- **Svi likovi su odrasli** (Student je mlad odrasli čovjek, 20+).
- Bez golotinje, oružja, krvi, droga. Cigarete samo kao dim u pozadini ili neupaljena cigareta iza uha, nikad u fokusu.
- Bez fotorealizma, 3D rendera, anime/manga stila, "glossy" digitalnog slikanja.

---

## 2. Glavni prompt-šablon

### 2.1 Šablon
```
Caricature portrait of {LIK: dob, spol, građa, karakteristične crte lica},
{IZRAZ LICA}, wearing {ODJEĆA iz 1980-ih}, {REKVIZIT koji komunicira efekat},
{SIMBOL boje karte kao značka/vez, ako treba}.
Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush
strokes, subtle paper grain, exaggerated but affectionate caricature proportions,
warm limited palette of amber #E8A84A, ochre #B7863F, cream #F1E3C6, walnut brown
#4A2E1E, felt green #1F4D3A and wine red #7A2E2A, single warm tungsten key light
from upper left, soft shadows, faint cigarette-smoke haze behind the figure,
1980s Balkan tavern mood, nostalgic and humorous,
head-and-shoulders framing, centered, 3:4 portrait, plain warm vignette background
fading from amber to dark walnut, {DODATAK: npr. thin red neon rim light from the right — samo za Gazde}
```

### 2.2 Stilski rep (kopiraj na kraj svakog prompta)
Svi prompti u §3 i §4 završavaju ovim istim repom, da serija ostane konzistentna:

**Stalni gosti:**
```
Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

**Gazde** (isti rep + rubno svjetlo i malo dramatičniji kontrast):
```
Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

### 2.3 Zajednički negativni prompt
Za modele koji podržavaju negativni prompt (Stable Diffusion, Flux preko ComfyUI, Midjourney `--no`):
```
text, letters, words, numbers, captions, signature, watermark, logo, brand names, label on bottle,
pixel art, 8-bit, voxel, joker card, playing card frame, card border, corner indices, tarot frame,
psychedelic swirl, CRT scanlines, glitch, Balatro style, Hearthstone style, anime, manga, chibi,
photorealistic, photograph, 3D render, CGI, plastic skin, glossy digital painting, airbrush,
real celebrity likeness, politician, national flag, coat of arms, religious symbol,
child, minor, nudity, weapon, gun, knife, blood, gore, drugs, lit cigarette in focus,
extra fingers, deformed hands, extra limbs, cropped head, busy detailed background,
cold blue color grading, oversaturated neon, multiple panels, collage
```
Midjourney skraćena verzija: `--no text, letters, logo, watermark, pixel art, joker, card frame, photo, 3d render, anime, flag`

---

## 3. Portreti 33 stalnih gostiju

Svaki prompt je spreman za kopiranje: opis lika + stilski rep za goste (§2.2) je već uključen. Predloženi naziv fajla: `assets/portraits/regulars/{id}.png`.

### Obični

#### 1. `waiter` — Konobar
Iskusni konobar s pladnjem, uvijek tu kad treba "još jedna" (+4 Mult).
```
Caricature portrait of a middle-aged tavern waiter, tall and lean, slicked-back dark hair, magnificent upturned mustache, confident half-smile and one raised eyebrow, crisp white shirt with black bow tie and black vest, white towel draped over one shoulder, balancing a round tray with four small glasses held up near his face. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 2. `lover` — Zaljubljeni
Mladić zaljubljen do ušiju, sve vidi kroz srca (♥).
```
Caricature portrait of a dreamy young adult man in his mid-twenties, big curly hair, enormous starry eyes gazing upward, blushing cheeks, lovesick goofy smile, wearing a wide-collared 1980s shirt in wine red, holding a single red carnation against his chest, a small heart-shaped enamel pin on his collar, tiny painted heart shapes floating around his head like a halo. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 3. `jeweler` — Zlatar
Zlatar s lupom na oku, procjenjuje svaki karo (♦).
```
Caricature portrait of a plump, bald middle-aged jeweler with a neat gray goatee, a jeweler's loupe screwed into one eye making it look huge, other eye squinting shrewdly, wearing a brown cardigan over a shirt and tie, holding up a sparkling diamond-shaped gemstone between thumb and finger, a diamond-shaped gold tie pin. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 4. `gardener` — Baštovan
Baštovan sa zemljom pod noktima i djetelinom za šeširom (♣).
```
Caricature portrait of a sun-tanned elderly gardener with a round weathered face, bushy white eyebrows and a big friendly grin with a gap tooth, wearing a frayed straw hat with a sprig of three-leaf clover tucked in the band, green work jacket with rolled sleeves, holding a small potted seedling near his cheek, a clover-shaped patch sewn on his chest pocket. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 5. `miner` — Rudar
Rudar tek izašao iz smjene, lampa na kacigi, pik na reveru (♠).
```
Caricature portrait of a broad-shouldered middle-aged coal miner with a soot-smudged face, bright white teeth in a proud grin, thick black mustache, wearing a hard hat with a glowing headlamp casting a warm beam, dark work overalls, a small spade-suit shaped metal pin on the strap, a short pick resting on his shoulder. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 6. `pensioner` — Penzioner
Penzioner koji voli sigurno: par po par (+Chips za Par).
```
Caricature portrait of a cheerful retired man in his seventies, thick-rimmed glasses, neatly combed white side-part, rosy cheeks, contented smile, wearing a beige flat cap and a knitted vest over a checked shirt, holding up two identical dominoes side by side as a symbol of a pair, a folded newspaper without visible text tucked under his arm. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 7. `mathematician` — Matematičar
Profesor matematike koji sabira zbirove u glavi (+Mult za Zbir i jače).
```
Caricature portrait of a wiry middle-aged mathematics professor with wild untamed gray hair sticking out in all directions, oversized round glasses, intense focused eyes, chalk dust on his cheek, wearing a tweed jacket with elbow patches, a pencil behind his ear, holding a wooden abacus up beside his face, faint chalk plus and equals symbols drawn as shapes floating in the haze. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 8. `student` — Student
Vječiti student, uvijek računa tačno tri (+Chips za tačno 3 nošene karte).
```
Caricature portrait of a scruffy young adult university student in his early twenties, shaggy hair and patchy beard, tired but clever smirk, wearing an oversized knitted sweater and a canvas backpack strap on his shoulder, holding up exactly three fingers, three textbooks stacked under his arm with blank spines, a cold coffee cup in the other hand. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 9. `taxi_driver` — Taksista
Taksista koji uvijek zaradi nešto sitno na kraju smjene (+2 pare).
```
Caricature portrait of a stocky middle-aged taxi driver with a round face, thick mustache, sunglasses pushed up on his forehead, knowing wink, wearing a brown leather jacket over a striped polo shirt, car keys on a big ring dangling from one finger, a few coins stacked between the fingers of the other hand, a small plain checkered taxi roof sign shape blurred behind his shoulder with no text. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 10. `accordionist` — Harmonikaš
Harmonikaš koji svira dok god ima pjesama u rezervi (+Mult za preostala spuštanja).
```
Caricature portrait of a jolly heavy-set accordion player in his fifties, sweaty forehead, eyes closed in musical bliss, wide open singing mouth, curly dark hair, wearing a shiny wine-red waistcoat over a white shirt with an open collar, a red-and-cream piano accordion pulled wide open across his chest with plain unbranded bellows. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 11. `fisherman` — Ribar
Ribar koji uvijek ulovi onu najveću, desetku (+Chips za desetke).
```
Caricature portrait of a weather-beaten old fisherman with a scruffy white beard, squinting sea-blue eyes, proud boastful grin, wearing a knitted navy fisherman's cap and a yellow oilskin jacket, holding up a large silver fish with both hands, exactly ten small fishing hooks pinned in a neat row across his cap band. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 12. `charmer` — Švaler
Šarmer kafane, slab na dame, kraljeve i žandare (+Mult za figure).
```
Caricature portrait of a smug charming man in his thirties, glossy pompadour hair, thin pencil mustache, half-lidded flirtatious eyes and a sly grin, wearing a cream 1980s suit jacket with wide lapels over an open-collared wine-red shirt, a thin gold chain, holding three painted playing cards fanned near his cheek showing only ornate royal crown and crest patterns, no letters or numbers. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 13. `grandpa` — Đedo
Đedo koji ne voli "fine gospodu" u ruci (+Chips kad nema figura).
```
Caricature portrait of a very old, wiry grandfather with a deeply wrinkled face, huge white walrus mustache, bushy eyebrows, skeptical squint and a grumpy-but-lovable frown, wearing a dark wool flat cap and a heavy brown wool coat, leaning on a gnarled wooden walking stick, waving away an unseen crowned card with a dismissive hand gesture. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 14. `porter` — Nosač
Nosač koji sa svakim spuštanjem postaje jači (raste kroz spuštanja).
```
Caricature portrait of a huge, muscular, good-natured porter in his forties, shaved head, thick neck, broad gentle smile, wearing a sleeveless undershirt and suspenders, a stack of wooden crates balanced on one shoulder, forearms with simple plain anchor-shaped tattoo, a small cloth sack slung on the other shoulder. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

### Neobični

#### 15. `fortune_teller` — Gatara
Komšinica koja gleda u fildžan i "vidi" nagradu nakon Gazde.
```
Caricature portrait of a warm, theatrical middle-aged neighborhood woman reading coffee grounds, big voluminous permed hair, large hoop earrings, knowing mysterious smile with one eyebrow raised, wearing a patterned wine-red cardigan over a blouse, holding up a small handleless coffee cup tilted toward the viewer showing swirling dark coffee sediment patterns, a copper coffee pot beside her. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 16. `merchant` — Trgovac
Trgovac koji uvijek ima "još nešto" za ponuditi (+1 slot u Šanku).
```
Caricature portrait of an energetic salesman in his forties, wide toothy salesman's grin, gelled side-parted hair, eager outstretched gesture, wearing a loud checked sports jacket and a wide tie, an open leather suitcase held up beside him overflowing with assorted trinkets, cassette tapes with blank labels, scarves and small boxes, nothing branded. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 17. `godfather` — Kum
Kum sa svadbe, velikodušan i ponosan, voli kad je duplo i trostruko.
```
Caricature portrait of a dignified, generous wedding godfather (kum, wedding sponsor, not a gangster) in his sixties, silver hair combed back, proud beaming smile, rosy cheeks, wearing a dark festive suit with a white carnation boutonniere and a sash-like ribbon of white lace, raising a small celebratory glass, a fan of paper banknotes in his breast pocket shown as plain unprinted paper. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 18. `neighbor` — Komšija
Komšija koji se raduje tvojoj Tabli više nego ti (+Mult na Tabli).
```
Caricature portrait of a friendly paunchy neighbor in his fifties, round face, bushy mustache, ecstatic open-mouthed cheer with both arms raised, wearing a striped tank top under an unbuttoned short-sleeve shirt and house slippers implied, leaning over a garden fence railing, a small round green felt table edge visible in the foreground completely empty and swept clean. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 19. `magician` — Mađioničar
Mađioničar čiji as može biti bilo šta (as vrijedi 1–14).
```
Caricature portrait of a theatrical stage magician in his forties, sharp pointed goatee, arched eyebrows, mischievous grin, wearing a slightly worn black tailcoat with a wine-red lining and a tall top hat, a single playing card appearing from his fingertips shown only from its plain patterned back, with a puff of sparkly smoke, a white rabbit peeking from the hat brim. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 20. `baker` — Pekar
Pekar koji ustaje rano i donese još jedno nošenje (+1 nošenje).
```
Caricature portrait of a round, rosy-cheeked baker in his fifties, flour dusted on his nose and thick mustache, warm sleepy-eyed smile, wearing a white baker's cap and white apron over a short-sleeved shirt, cradling an armful of fresh crusty bread loaves and a braided round loaf, warm steam rising from the bread. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 21. `tailor` — Krojač
Krojač koji ti proširi rukav, pa stane još jedna karta (+1 veličina ruke).
```
Caricature portrait of a slender, meticulous elderly tailor, tiny half-moon spectacles perched on a long nose, neat white mustache, concentrated pursed lips, wearing a waistcoat with a yellow measuring tape draped around his neck, pins stuck in a pincushion on his wrist, holding large tailor's scissors and a sleeve he is extending with a new strip of fabric. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 22. `gambler` — Kockar
Kockar koji vjeruje da je danas njegov dan (1 u 4 šanse za ×4).
```
Caricature portrait of a nervous, hopeful gambler in his forties, sweaty brow, one eye twitching, crossed fingers held up next to his face, a lucky horseshoe-shaped charm on a cord, wearing a rumpled loosened tie and an unbuttoned shirt, a green visor cap, four ivory dice frozen mid-air in front of him showing only dots. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 23. `smuggler` — Švercer
Švercer s kaputom punim robe, uvijek proda skuplje (bonus pri prodaji).
```
Caricature portrait of a shifty but likable smuggler in his thirties, darting sideways glance, conspiratorial grin, feathered 1980s mullet hair, wearing a long beige trench coat held open to reveal the lining packed with wristwatches, folded denim jeans, cassette tapes with blank labels and nylon stockings, nothing branded, one finger raised to his lips in a shushing gesture. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 24. `teacher` — Učiteljica
Učiteljica koja s vremenom sve više zna (raste kroz nošene karte).
```
Caricature portrait of a strict but kind schoolteacher woman in her fifties, tight gray bun, cat-eye glasses on a beaded chain, one eyebrow raised over a proud little smile, wearing a cream blouse with a brooch and a wine-red cardigan, holding a wooden pointer and a small chalk slate covered with tally marks only, a red apple on a stack of books. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 25. `collector` — Kolekcionar
Kolekcionar koji čuva svaku kartu (raste kroz nošene karte).
```
Caricature portrait of a fussy, delighted collector in his sixties, small round glasses, thin combed-over hair, giddy smile, wearing a corduroy jacket with many bulging pockets, holding open a thick leather album filled with neatly arranged miniature cards shown only as colorful patterned rectangles, stamps and bottle caps without any text, tweezers in his other hand. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

### Rijetki

#### 26. `landlady` — Gazdarica
Gazdarica kafane, kad ona kaže "Tabla", sto se trese (×3 Mult na Tabli).
```
Caricature portrait of a commanding, glamorous tavern landlady in her fifties, towering teased auburn hair, bold red lipstick, strong confident smirk, arms crossed, wearing a wine-red dress with shoulder pads and a gold necklace, a white bar towel over her shoulder, a polished bar counter edge and a ring of keys at her hip. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 27. `cafe_owner` — Kafedžija
Kafedžija čiji posao raste sa svakom Tablom (×Mult raste kroz partiju).
```
Caricature portrait of a serene, wise old coffee-house keeper in his late sixties, bald head with a white horseshoe of hair, thick white mustache, calm satisfied smile, wearing a white shirt with rolled sleeves and a dark vest, pouring dark coffee from a long-handled copper coffee pot into a small cup, a stack of many small coffee cups growing taller beside him. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 28. `double` — Dvojnik
Dvojnik koji imitira gosta do sebe (kopira efekat).
```
Caricature portrait of a man in his forties with a deliberately generic face, neat mustache and middle-parted hair, playful mimicking expression, wearing a plain gray suit, holding up an oval hand mirror in which his own reflection shows the same face but with a slightly different hat and grin, his free hand mirroring the reflection's gesture. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 29. `drunkard` — Bekrija
Bekrija, duplo jači ali sporiji (×2 Mult, −1 nošenje).
```
Caricature portrait of a jovial, tipsy man in his fifties, very red bulbous nose, flushed cheeks, droopy happy half-closed eyes, lopsided grin, tousled hair, wearing a loosened tie askew and an unbuttoned vest, cheerfully raising a small glass of clear fruit brandy in a toast, swaying slightly to one side, a plain unlabeled bottle tucked under his arm. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 30. `big_ten` — Desetka i Dvojka
Nerazdvojni drugari, visoki "Desetka" i mali "Dvojka" (10♦ i 2♣).
```
Caricature double portrait of two inseparable adult friends shoulder to shoulder: on the left a very tall, lanky man in his forties with a long face and a wine-red sweater bearing a large diamond-shaped knitted patch, on the right a very short, stocky man of the same age with a round face and a green sweater bearing a clover-shaped knitted patch, the tall one resting an elbow on the short one's head, both grinning broadly, no numbers or text. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

### Legendarni
Legendarni gosti dobijaju dodatak na kraju prompta: `subtle gold-leaf accents on clothing, soft golden glow around the figure` (vidljivo drugačiji, ali isti stil).

#### 31. `old_master` — Stari majstor
Stari majstor Tablića, svaka figura mu se vrati dvaput (retrigger figura).
```
Caricature portrait of a legendary old card master in his eighties, long flowing white beard and eyebrows, calm all-knowing smile, piercing twinkling eyes, wearing an elegant dark velvet jacket with a gold watch chain, his weathered hands effortlessly fanning a deck of cards that shows only ornate crowned royal figure illustrations, no letters or numbers, two faint ghostly echoes of the fan repeating behind it. Subtle gold-leaf accents on clothing, soft golden glow around the figure. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 32. `queen_of_kafana` — Kraljica kafane
Pjevačica, kraljica svake kafane, voli dame u ruci (×Mult po Dami).
```
Caricature portrait of a radiant, larger-than-life tavern singer in her forties (original character, not resembling any real singer), huge glossy dark curls, dramatic winged eyeliner, bold red lips mid-song, one hand raised theatrically, wearing a sequined wine-red gown with a fur stole, a small golden tiara, holding a vintage microphone with a coiled cable, a few red carnations thrown in the air around her. Subtle gold-leaf accents on clothing, soft golden glow around the figure. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

#### 33. `legend` — Legenda
Legenda kafane o kojoj se pričaju priče, sa svakom Tablom postaje veća.
```
Caricature portrait of a mythical tavern legend in his sixties, broad heroic build, magnificent silver mustache, warm confident smile, wearing a timeless dark suit with a wine-red pocket square, a long scarf, sitting like royalty, behind him a softly glowing halo-like ring of stacked swept-clean green felt tables receding upward, tiny admiring silhouettes of patrons in the haze. Subtle gold-leaf accents on clothing, soft golden glow around the figure. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, single warm tungsten key light from upper left, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain warm amber-to-walnut vignette background.
```

---

## 4. 12 Gazda portreta

Gazde koriste stilski rep za Gazde (§2.2): tamnija vinjeta i tanko neon rubno svjetlo. Predloženi naziv fajla: `assets/portraits/bosses/{id}.png`. Uniforme su uvijek **generičke, bez oznaka, grbova i natpisa**.

#### `inspection` — Inspekcija
Sanitarni inspektor koji je pronašao problem s trefovima (♣ ne daju chips).
```
Caricature portrait of a stern, pinched-faced sanitary inspector in his fifties, narrow suspicious eyes behind thin wire glasses, tight frown, combed-over hair, wearing a gray overcoat and a plain official cap without insignia, holding a clipboard and a big magnifying glass that enlarges a wilted clover leaf, a rubber stamp in his pocket. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `curfew` — Policijski sat
Noćni čuvar reda koji gleda na sat: samo još tri nošenja.
```
Caricature portrait of a strict, mustached night patrolman in his forties, heavy eyebrows, stern pursed lips, wearing a generic dark blue uniform jacket and peaked cap with no insignia or badges, holding up a large brass pocket watch toward the viewer with the hands near midnight, three fingers of his other hand raised in warning. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `darkness` — Nestanak struje
Električar u mraku sa svijećom, pola lica se ne vidi (karte okrenute licem dole).
```
Caricature portrait of a sheepish, apologetic electrician in his thirties, wide nervous eyes, guilty grimace, frizzled hair standing on end as if lightly shocked, wearing work overalls with a coil of wire over the shoulder, holding a single lit candle in a tin holder that lights only half of his face while the other half falls into deep darkness, a dead light bulb in his other hand. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, candle as the key light from below instead of the ceiling lamp plus a thin red neon rim light from the right, high contrast chiaroscuro, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain near-black vignette background.
```

#### `tamburitza` — Tamburaši
Tamburaški sastav koji je zauzeo pola stola (veličina ruke −1).
```
Caricature group portrait of three cheerful tamburica musicians squeezed tightly into the frame, all adult men in matching cream shirts with wine-red embroidered vests, the middle one with a big mustache singing loudly, the left one playing a small pear-shaped long-necked tamburica, the right one plucking a larger tamburica, elbows bumping, instruments crowding the space. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `rush` — Konobar žuri
Konobar u strci, nema vremena za spuštanje (nema spuštanja).
```
Caricature portrait of a frantic young adult waiter in his twenties, sweat flying off his forehead, panicked wide eyes, hair blown back as if by speed, wearing a white shirt with a crooked black bow tie, a tray of glasses tilting dangerously, motion streaks behind him, a stopwatch-like wall clock blurred in the haze. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `drunk_guest` — Pijani gost
Gost koji je pretjerao i ruši ti karte iz ruke (odbacuje nasumičnu kartu).
```
Caricature portrait of a clumsy, overly affectionate tipsy guest in his forties, unfocused crossed eyes, flushed face, lopsided singing grin, tie wrapped around his forehead like a headband, wearing a wrinkled white shirt half untucked, one arm flailing and knocking a few plain-backed playing cards flying through the air. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `private_party` — Zatvoreno za privatnu proslavu
Domaćin proslave na vratima: prvo nošenje ne računa se (prvo nošenje 0).
```
Caricature portrait of a smug, festive party host in his fifties, slicked hair, satisfied closed-eye smile, chin raised, wearing a shiny dark tuxedo with a big wine-red bow tie, a paper party hat, one palm raised firmly toward the viewer in a polite stop gesture, a velvet rope barrier and balloons and streamers behind him, no signs or text. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `retirement` — Penzija
Umorni kralj u penziji, figure više ne rade (J/Q/K bez chipsa i efekata).
```
Caricature portrait of a bored, sleepy elderly man dressed as a retired playing-card king, crooked oversized crown slipping over one eye, droopy jowls and a huge yawn, wearing a faded royal robe over striped pajamas and a knitted cardigan, slippers implied, holding a cup of chamomile tea, a rocking chair back visible behind him. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `rose_on_table` — Ruža na stolu
Romantični zavodnik koji je ostavio ružu na stolu, pa Tabla ne broji (Tabla bez bonusa).
```
Caricature portrait of a melodramatic romantic admirer in his forties, soulful heavy-lidded eyes, single tear on the cheek, dramatic wavy hair, wearing an open-collared black shirt and a white silk scarf, gently placing a single long-stemmed red rose on the green felt table in the foreground, as if claiming it. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `tax` — Porezna
Poreznik koji uzme paru za svako nošenje (−1 para po nošenju).
```
Caricature portrait of a dry, emotionless tax official in his fifties, long thin face, sunken cheeks, tiny reading glasses on the tip of his nose, perfectly flat unimpressed expression, wearing a drab brown suit with sleeve protectors, holding an enormous thick ledger and a fountain pen, a coin being dropped into a metal cash box beside him. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

#### `stingy` — Škrti gazda
Škrti vlasnik kafane kome ni par nije dovoljno dobar (Par boduje 0).
```
Caricature portrait of a miserly tavern owner in his sixties, hunched shoulders, beady narrow eyes, long hooked nose, thin scowling lips, sparse wispy hair, wearing a threadbare patched vest and fingerless gloves, clutching a tightly knotted coin purse to his chest with both hands, a single dim bare bulb above him. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a thin red neon rim light from the right, slightly higher contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```
Napomena: "kukasti nos" i škrtost su klasični karikaturni tropi koji se historijski koriste i za antisemitske karikature. Ako rezultat ijednom podsjeća na etničku karikaturu, zamijeniti nos s "small upturned nose" i dodati "comedic Scrooge-like miser, no ethnic features" — škrtost treba nositi poza i rekvizit, ne crte lica.

#### `chain_owner` — Vlasnik lanca (finale)
Bezlični vlasnik lanca kafana koji želi kupiti i tvoju (finalni boss).
```
Caricature portrait of an imposing, slick corporate tavern-chain tycoon in his fifties, perfectly sculpted silver hair, cold confident smile with very white teeth, mirrored aviator sunglasses reflecting rows of identical tiny taverns, wearing an expensive double-breasted 1980s power suit with huge shoulder pads and a heavy gold chain made of tiny linked tavern-shaped charms, steepled fingers with gold rings, a cigar box (closed) on the desk in front of him, no logos. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, subtle paper grain, exaggerated but affectionate caricature proportions, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, warm tungsten key light from upper left plus a strong red neon rim light from the right, high contrast, faint smoke haze behind, 1980s Balkan tavern mood, head-and-shoulders, centered, 3:4 portrait, plain dark walnut vignette background.
```

---

## 5. Ostali asseti

Svi koriste istu paletu i tehniku (gvaš + tuš), ali bez karikaturnog repa za portrete. Za sve važi zajednički negativni prompt iz §2.3.

### 5.1 Key art / Steam capsule
Glavna slika za Steam stranicu, trailer i press kit. Generisati **široko 16:9**, pa iz nje sjeći sve Steam formate.
```
Wide cinematic key art of a cozy 1980s Balkan tavern at night, seen from slightly above a round table covered in deep green felt, in the center a single dramatic moment: a hand slamming down one playing card as a fan of captured cards lifts off the felt in a burst of warm golden light, the table swept completely clean, around the table a lively crowd of caricatured regulars cheering — a mustached waiter with a tray, an accordion player mid-song, a miner with a helmet lamp, a glamorous landlady with arms crossed, a grandfather with a walking stick — wooden paneled walls, a single hanging tungsten lamp casting a warm pool of light, thick cigarette-smoke haze curling through the light, a blank glowing red neon tube sign shape on the far wall with no letters. Hand-painted gouache with fine ink linework and ink-and-wash shading, visible brush strokes, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red with a single red neon accent, nostalgic and humorous, 16:9 wide composition, clear empty dark area in the upper-left third for the game logo.
```
**Smjernice za sječenje:**
- Generisati na 16:9 (npr. 2560×1440 ili veće), zatim upscale ×2.
- **Header capsule 460×215** (i 920×430 za visoki DPI): odnos ~2,14:1. Iz key arta isjeći pojas s logom lijevo i jednim do dva lika desno. Na ovoj veličini vidljiva su samo 2–3 elementa, pa centralni kadar mora biti čitljiv i kao sličica: sto, ruka s kartom i jedan lik.
- **Main capsule 616×353**, **Small capsule 231×87** (samo logo i jedna boja pozadine), **Vertical capsule 374×448**, **Library hero 3840×1240** (bez loga, logo ide zasebno), **Library capsule 600×900** (zaseban vertikalni prompt: isti stil, stol u donjoj trećini, lik Gazdarice ili Konobara iznad).
- Logo se **uvijek** dodaje naknadno u editoru, nikad ga ne generisati.
- Provjeriti aktuelne dimenzije u Steamworks dokumentaciji prije uploada.

### 5.2 Pozadina glavnog menija
```
Atmospheric background painting of an empty 1980s Balkan tavern interior just before opening, viewed from the doorway, a round green felt card table in the lower center lit by a single warm hanging tungsten lamp, wooden bar counter with plain unlabeled bottles on shelves to the right, empty wooden chairs, a tamburica leaning against a chair, thick soft smoke haze drifting through the light beam, a blank red neon tube sign glowing on the back wall with no letters, deep walnut shadows at the edges. Hand-painted gouache with ink-and-wash, visible brush strokes, subtle paper grain, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, quiet nostalgic mood, no people, 16:9, darker left third left calm and low-detail for menu buttons.
```
Napomena: neon "OTVORENO" se dodaje kao zaseban sloj (font + glow shader) da bi mogao treperiti i da bi tekst bio tačan.

### 5.3 Poleđina karata (pattern)
```
Ornamental playing card back design, symmetrical repeating pattern inspired by traditional Balkan woven kilim and embroidery motifs abstracted into geometric diamonds and stylized carnation flowers, rendered in hand-painted gouache with fine ink outlines, colors wine red #7A2E2A and cream #F1E3C6 with thin ochre #B7863F accents, a narrow plain cream border, flat front view, perfectly centered and mirrored top-to-bottom, no text, no numbers, no logos, 5:7 portrait ratio.
```
Napomena: bez religijskih simbola i bez nacionalnih motiva vezanih za jednu zemlju. Za konačnu verziju preporučeno je generisati samo jedan uzorak (tile) i složiti ga ručno ili proceduralno, jer karte se crtaju proceduralno (GDD §8).

### 5.4 Tekstura zelenog filca (seamless)
```
Seamless tileable texture of worn green billiard-table felt, top-down flat orthographic view, fine woven fibers, subtle uneven nap, faint lighter rubbed patches and tiny lint specks, deep felt green #1F4D3A to #2E6B4F, evenly lit with no directional shadows and no vignette, no objects, no text, uniform density across the whole image, 1:1 square, tileable.
```
Tehnika: generisati 1024×1024 ili 2048×2048 s opcijom "tile/seamless" (SD/ComfyUI: circular padding; Midjourney: `--tile`). Provjeriti spoj pomakom 50% (offset) u editoru. Vinjetu i svjetlo sijalice dodaje shader u igri, ne tekstura.

### 5.5 Pozadina Šanka (prodavnica)
```
Background painting of a cozy 1980s Balkan tavern bar counter seen straight on from the customer's side, polished dark walnut counter running across the lower third with an empty clear surface for UI cards, behind it wooden shelves with rows of plain unlabeled brandy bottles in amber and clear glass, small handleless coffee cups and a copper coffee pot, a brass cash register without text, a hanging tungsten lamp casting warm pools of light, soft smoke haze, a thin red neon glow at the top edge. Hand-painted gouache with ink-and-wash, visible brush strokes, warm limited palette of amber, ochre, cream, walnut brown, felt green and wine red, no people, no text, no labels, 16:9, calm low-contrast center for overlaid UI.
```

### 5.6 Logo — smjernice (ne generisati!)
- **Tekst loga "TABLA" i podnaslov "kafanski roguelite" se slažu fontom**, ne generišu. AI modeli prave pogrešna slova i to se ne može zaštititi.
- Preporuka: display font s karakterom pod OFL licencom (npr. serif ili condensed s retro natpisnim osjećajem kafanskih tabli iz 80-ih), podnaslov u čitljivom sans fontu (vidi GDD §8). Licencu fonta upisati u ASSETS_LICENSES.md.
- Obrada: krem `#F1E3C6` slova s tankim orah `#4A2E1E` obrubom i blagom sjenom, ili neon varijanta (`#E2445C` cijev s glow efektom) za animirani splash.
- Dozvoljeno je generisati **samo ukrasni element bez teksta** (npr. ornament, karanfil, lepezu karata iza slova):
```
Small decorative emblem element for a game logo, a fan of five plain-backed playing cards spreading behind a single red carnation, hand-painted gouache with ink outlines, wine red, cream and ochre, isolated on a flat dark walnut background, centered, no text, no letters, no numbers.
```
- Prije finalizacije provjeriti da logo ne liči na postojeće žigove (GDD napomena o provjeri imena i žiga).

---

## 6. Tehničke napomene

### 6.1 Formati i rezolucija
| Asset | Odnos | Generisati | Finalno u igri |
|---|---|---|---|
| Portret gosta / Gazde | 3:4 | 1536×2048 (ili najbliže što model daje, npr. 896×1152) | 384×512 i 192×256 (WebP/PNG) |
| Key art | 16:9 | 2560×1440 + upscale ×2 | isječci po Steam formatima |
| Pozadina menija / Šanka | 16:9 | 2560×1440 | 1920×1080 (+ 3840×2160 opcionalno) |
| Poleđina karte | 5:7 | 1000×1400 | proceduralno / 250×350 |
| Filc tekstura | 1:1 | 2048×2048 seamless | 1024×1024 tile |

Midjourney parametri za portrete: `--ar 3:4 --style raw --stylize 100` (niži stylize = manje "MJ" izgleda, više prati prompt). Za pozadine `--ar 16:9`.

### 6.2 Konzistentan stil kroz cijelu seriju
1. **Napravi "zlatni standard" prvo.** Generiši 3–4 gosta (npr. Konobar, Rudar, Gazdarica, Đedo) dok stil ne bude tačno onakav kakav treba. Ti portreti postaju referenca za sve ostale.
2. **Stilska referenca:** u Midjourneyju koristi `--sref <URL zlatnog standarda>` (i `--sw 100–300`); u Fluxu/SD koristi IP-Adapter (style) s istom referencom; u DALL-E/GPT-image priloži referentnu sliku i napiši "match the painting style of the reference exactly".
3. **Ne koristi referencu lika (`--cref`, face IP-Adapter) između različitih gostiju**, jer će svi dobiti isto lice. Koristi samo stilsku referencu.
4. **Fiksni seed** za iteracije istog lika (`--seed 1980` u MJ, fiksni seed u SD/Flux). Mijenjaj samo opis lika, rep i negativni prompt ostaju identični.
5. **Isti model i ista verzija** za cijelu seriju. Ako se model promijeni usred projekta, ponovo generisati zlatni standard i provjeriti razliku.
6. **Kontaktni list:** stavi sve gotove portrete jedan pored drugog u mrežu na malom formatu (~120 px). Svaki koji iskače (drugačija svjetlina, pozadina, debljina linije) se regeneriše.
7. **Završna ručna obrada:** ujednačiti vinjetu i nivoe (Levels/Curves) u editoru, provjeriti ruke i prste, ukloniti slučajna "slova". Za obojeno/edicije (Folija, Holo, Polikrom, Negativ) koristiti **shader u igri**, ne posebne slike.
8. **Čitljivost:** provjeri svaki portret u sivoj skali i na 120 px. Siluete i glavni rekvizit moraju se prepoznati.

### 6.3 Pravna strana i Steam AI disclosure
- **Svaki AI-generisani asset mora biti upisan u `ASSETS_LICENSES.md`**: naziv fajla, alat i verzija modela, datum, prompt (ili referenca na sekciju ovog fajla), seed, uslovi korištenja alata i da li je ručno dorađen.
- Steam traži **AI Generated Content Disclosure** u Content Survey (pre-generated content). Opisati koji asseti su AI-generisani i kako se osigurava da ne krše tuđa prava (vidi RELEASE_CHECKLIST.md, "Pravno i licence").
- Koristiti samo alate čiji uslovi dozvoljavaju komercijalnu upotrebu na plaćenom planu; sačuvati dokaz pretplate za period generisanja.
- Ne koristiti slike drugih igara ili umjetnika kao referencu (`--sref`, img2img), samo vlastite zlatne standarde.
- Prije objave provjeriti da nijedan lik ne liči na stvarnu osobu.
