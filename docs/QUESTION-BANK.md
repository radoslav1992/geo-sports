# Question bank and repeat policy

## Release

- 515 questions: 15 existing hand-written history/ground clues + 500 new ground-location clues.
- New ground records cover 103 football nations (including the separate UK football associations; this is not a count of sovereign states).
- One question per ground/site, with at least 700 metres between selected stadium sites. No question-count inflation through alternate versions of the same ground.
- Activation: **2026-09-29 at 00:00 UTC**. Earlier dates use the original 15-question selector and original ordering.
- The first 100 days use only the 500 new questions. The original questions are held until days 101–103.
- From activation, every question appears once per **103 days**: 102 intervening daily rounds before a repeat. The calendar loops indefinitely. Presentation order within a day's set varies deterministically with the date.
- The first 100 daily sets use five distinct football nations and no two sites within 25 km. This avoids a daily set concentrated in one city.
- Training prioritises unseen IDs in local history, then the least recently selected, and excludes the current daily set. Daily selection is shared globally and does not depend on training, device state, reloads, or whether a player missed a day.

## Source records and checks

The additional clues are ground-location questions, not 500 separately researched historical event stories. Wording is generated from a filtered, checked-in stadium dataset; the four-digit source ID gives each question a stable identity.

1. **WorldSoccerStadiums**, sorrentmutie, revision `f45cbe40550e74b2820f66ebce229e40e2dc42b0`:
   https://github.com/sorrentmutie/WorldSoccerStadiums/tree/f45cbe40550e74b2820f66ebce229e40e2dc42b0
   Fields used: stadium name, recorded town, nation and longitude/latitude. Capacity is only an import selection signal and is never presented as a current fact.
2. **Archived Wikidata stadium coordinates**, @deepxg / @dannypage, revision `58a46b086cd951cde3c0e00eb4b38a0713b4e45b`:
   https://gist.github.com/dannypage/6cd52ac0ad61216e81b4/58a46b086cd951cde3c0e00eb4b38a0713b4e45b
   Used solely to corroborate location: **215 of the 500 new sites** have another recorded stadium position within 500 metres. Club/tenant columns are deliberately not imported: those can be stale or erroneous.
3. Country-boundary checks use Natural Earth's country polygons through the existing `world-atlas` package. Records outside the expected polygon, absent coordinates, placeholders, ambiguous same-name grounds within a football nation, explicitly superseded buildings, and near-duplicate locations are omitted. Coastal/border exclusions are conservative; this is not a precise administrative-boundary audit.

`ground-provenance.json` records each imported source ID and any coordinate corroboration. **These checks are not a claim that all 500 venues received an independent manual fact-check.** The dataset is a historical snapshot: naming rights, demolitions, relocations and tenant changes must not be treated as current facts. New clues therefore ask about the site associated with a ground's recorded name, and the help text explains historical names. Coordinates mark stadium sites rather than city centres.

A small number of town labels were normalised to English spellings. Four municipality corrections were checked against primary sources:

- Kashima Soccer Stadium: Kashima, not the prefecture Ibaraki — https://www.antlers.co.jp/en/pages/mercari-stadium
- Ajinomoto Stadium: Chofu, not central Tokyo — https://www.fctokyo.co.jp/en/club/profile/
- Deportivo Cali stadium: Palmira, not central Cali — https://deportivocali.com.co/wp-content/uploads/2024/12/TYC-ABONOS-2025-I.pdf
- Estádio Nacional / Jamor: Oeiras, not central Lisbon — https://www.fpf.pt/pt/News/Todas-as-not%C3%ADcias/Not%C3%ADcia/news/47829

Licensing/credits are retained in `public/data-licenses.txt` and shipped with the site. Upstream declares the stadium data public domain and includes an MIT license; Wikidata structured data is CC0.

## Reproduction and future edits

Download the two pinned source files above outside the repository, then run:

```sh
node scripts/build-ground-bank.mjs /path/to/SoccerStadiums.json /path/to/Wikidata_stadium_lat_long.tsv
node scripts/build-daily-schedule.mjs
npm test
npm run build
```

The imported JSON and calendar are committed release inputs. Production builds perform **no network imports or random calendar regeneration**. The schedule generator accepts an identical existing calendar but refuses to replace it with different content.

Do not remove or rename a scheduled question ID. New bank additions may be used for training immediately, but entering them into daily play requires a new future-dated schedule version and a transition test against the preceding calendar. Changing the meaning/answer of an existing question requires considering saved-round compatibility (`CONTENT_VERSION`). Correcting a historical name without changing its site is preferable to silently changing its answer.

`tests/schedule.test.mjs` simulates 3,660 consecutive days, checks exact repeat intervals and complete coverage, tests rollout preservation and the legacy cooldown, proves pool reorder/additions cannot change dates, and verifies training exhausts all eligible unseen questions before reusing them.
