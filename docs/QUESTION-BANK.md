# Question bank and repeat policy

## Release 2: 1,975 questions, a 395-day calendar

- **1,975 questions**: the 515 below, plus 1,037 more grounds and 423 Legends birthplace clues.
- **Calendar v3** (`daily-schedule-v3.json`) extends v2 append-only. Days 1–103 are v2's sets in v2's in-day order (it keeps v2's order seed), so every v2 date plays and restores exactly as published. The 292 new days (1,460 new questions) follow, then the whole cycle loops: **every question returns exactly 395 days later**, never within a year.
- **Deadline:** deploy v3 before **2027-01-10**, v2's first wrap. The extension script refuses to create a calendar once its base has wrapped, because lengthening a cycle mid-play would move live dates.
- New days keep the v2 rules: five football nations per day and answers at least 25 km apart. Each nation's questions are spaced evenly through the new days (Germany, the largest, appears on about half of them), with Legends interleaved among each nation's grounds.
- No two questions in the bank are within 0.7 km of each other (tested across all 1,975). Players who share a hometown share one clue; six hometown pins that fell on an existing stadium site were dropped.

### Expansion grounds (1,037)

`scripts/build-ground-expansion.mjs` re-reads the same pinned WorldSoccerStadiums snapshot as the first release and keeps records that the first 500 did not use:

- recorded capacity of at least 2,000, skipping unknown capacities;
- names that are not training grounds, annex or practice pitches (e.g. *Kunstrasenplatz*, *Anexo*, *Training Centre*);
- unambiguous within a football nation, and not superseded buildings;
- coordinates inside the named country on Natural Earth's 1:50m polygons, or within 5 km of its coastline or border (43 grounds; recorded as `within-5km` in `ground-expansion-provenance.json`);
- at least 0.7 km from every earlier site, and at most 120 per nation (Germany alone had 286 candidates), taking the largest grounds first.

US records are skipped: the first release only admitted US grounds that a second coordinate source confirmed as association football venues, and that archive (the Wikidata gist) is not reachable from the build environment used for this release. As before, capacity is only an import signal, never shown as a current fact, and these grounds did not receive an individual manual fact-check.

### Legends (423)

`scripts/legends-source.mjs` holds hand-written clues about where famous players and coaches were born, men's and women's, across 84 countries. The facts stick to birthplace, birth year and widely documented milestones (titles, awards, records). Coordinates never come from memory: `scripts/build-legends-bank.mjs` resolves each town in the **GeoNames** gazetteer (npm `cities.json@1.1.64`, CC BY 4.0) by name, country and, where needed, region code. It refuses:

- towns with no match or several matches (a `near` hint only chooses among same-name gazetteer entries);
- any pin within 0.7 km of another question.

Hints name the GeoNames region. Villages absent from the gazetteer were left out rather than guessed.

## Release 1: 515 questions, a 103-day calendar

_From 2027-01-10 Release 2 takes over; these 103 days remain the first 103 days of the v3 calendar._

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

Release 2 needs only the stadium snapshot and the GeoNames extract (`npm pack cities.json@1.1.64`, then unpack it outside the repository):

```sh
node scripts/build-ground-expansion.mjs /path/to/SoccerStadiums.json
node scripts/build-legends-bank.mjs /path/to/cities.json-package
node scripts/build-daily-schedule.mjs   # verifies v2 is unchanged
node scripts/extend-daily-schedule.mjs  # verifies (or, before v2 wraps, creates) v3
npm test
```

The imported JSON and calendar are committed release inputs. Production builds perform **no network imports or random calendar regeneration**. The schedule generator accepts an identical existing calendar but refuses to replace it with different content.

Do not remove or rename a scheduled question ID. New bank additions may be used for training immediately. Entering them into daily play requires either an append-only extension created before the current calendar first wraps (as v3 did), or a new future-dated schedule version with a transition test against the preceding calendar. v3 first wraps on 2027-10-29, so an append-only v4 can be added any time before then. Changing the meaning/answer of an existing question requires considering saved-round compatibility (`CONTENT_VERSION`). Correcting a historical name without changing its site is preferable to silently changing its answer.

`tests/schedule.test.mjs` simulates 3,660 consecutive days, checks exact 395-day repeat intervals and complete coverage, proves every v2 date plays exactly as published, checks one question per site across the whole bank, tests rollout preservation and the legacy cooldown, proves pool reorder/additions cannot change dates, and verifies training exhausts all eligible unseen questions before reusing them.
