# Geo Football / geo-sports

A focused football geography game built with Astro, adapted from the owner's purchased Quizo version-6 layout. One question, one map, one confirm button. No paid map API, database, account, or backend is needed for this release.

## Run locally

Use Node.js 22 or later.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Deploy to Cloudflare Workers (recommended)

Connect this GitHub repository in **Workers & Pages → Create → Import a repository**:

- Production branch: `main`
- Root directory: repository root
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Node version: `22` (also provided by `.node-version`)

The committed `wrangler.jsonc` serves `./dist` as static assets. This is an assets-only Worker; it does **not** need a JavaScript Worker entrypoint, D1/R2 bindings, API keys, or migrations. Keep the Worker name `geo-sports` in Cloudflare and the config aligned.

For CLI deployment after Cloudflare authentication:

```sh
npm run deploy
```

Validate packaging without publishing:

```sh
npm run check:deploy
```

Alternatively, Cloudflare **Pages** can build with `npm run build` and publish output directory `dist`. Use the Pages Git setup, not a Worker deploy command, for that option.

## Gameplay

- Five daily clues from a frozen 103-day calendar starting 29 September 2026. All 515 questions appear once per cycle, so daily repeats are exactly 103 days apart. Resets at 00:00 UTC without rebuilding.
- Training uses browser-local question history, selecting unseen questions before revisiting the oldest. It excludes the current daily set. Returning to Daily restores its saved progress.
- Within 10 km of the venue: 1,000 points. Beyond that: `round(1000 × exp(-(distanceKm - 10)/1800))`.
- A hint reduces that question's maximum to 800; no timer or speed bonus.
- Touch/drag map navigation, pinch or button zoom, mouse-wheel zoom, keyboard navigation, and a coordinate input alternative.
- Results show guess/answer pins, distance, points and a short explanation. Share a spoiler-free score on X, WhatsApp, or through the device share menu; copy text or download a branded PNG scorecard.
- Daily progress, stats, and training question history are browser-local (`localStorage`); the active training round is kept in memory. No cross-device accounts or leaderboard are implied.

## Content and release boundaries

`src/data/questions.js` contains **515 football questions**: the original 15 stadium/history clues and 500 additional ground-location questions across 103 football nations. One clue represents one stadium site; alternative wording is not counted as additional content. Ground clues explicitly cover past and present names, without claiming current sponsors or tenants.

The committed `src/data/daily-schedule-v2.json` fixes 103 five-question sets. The first 100 days use new content; the original 15 questions return only at the end of that first cycle. Dates before 29 September 2026 retain the original selection so the rollout preserves existing rounds. IDs and answers remain stable, and adding questions to the pool does not change any scheduled day. **Do not regenerate an active calendar**: use a new version with a future activation date and verify cooldowns across the transition.

The first 100 sets each contain five different football nations and stadiums at least 25 km apart. The 103-day guarantee is for daily play; training has a separate local history and cannot change the globally shared daily schedule. Clearing browser storage resets training history, but does not affect the daily guarantee.

Data provenance, historical-name caveats, coordinate checks, import commands, and maintenance rules are documented in [docs/QUESTION-BANK.md](docs/QUESTION-BANK.md).

Answers and scoring run in the browser. This release is suitable for casual play and the initial design launch; it is not cheat-resistant competitive scoring. A public leaderboard would require server-side answer validation and shared storage. No accounts, subscriptions, analytics, advertising, or tracking scripts are included.

The interactive map is built from Natural Earth's country boundaries through `world-atlas`, with D3 projection. It is an approximate low-resolution world map, not a street map. Fonts are bundled locally. There are no external font, tile or API requests during gameplay.

## Project structure

- `src/pages/index.astro` — focused play screen and dialogs
- `src/components/WorldMap.astro` — server-rendered geographic paths
- `src/styles/quizo-adapted.css` — selected purchased-template styles
- `src/styles/global.css` — responsive application design
- `src/lib/game.js` — deterministic rounds, distances, scores, validation
- `src/lib/map.js` — pointer, pinch, zoom and pin handling
- `src/app.js` — interface, browser persistence and results
- `src/data/daily-schedule-v2.json` — immutable 103-day daily calendar
- `tests/game.test.mjs` — scoring, UTC selection and state tests
- `tests/schedule.test.mjs` — ten-year repeat simulation, release transition, geographic variety, and training history

See `TEMPLATE-NOTES.md` for the purchased template adaptation and license provenance.

## Geo Football rebrand

All daily and practice clues cover association football: clubs, stadiums, rivalries, and men’s and women’s World Cup moments. The app title, header, help, shared results, 404 page and favicon use Geo Football. The existing repository and Cloudflare Worker retain `geo-sports` to preserve deployment continuity.

Football progress and stats use separate `geo-football-*-v1` browser keys. Earlier mixed-sport rounds and scores are left untouched but are not loaded into football play. The content version is `football-v1`.

## Score sharing

Completed daily and training rounds have separate share labels. Shared text includes the UTC date, five coloured result tiles, total points, assists used, and the current game URL without query parameters or fragments. It never includes question IDs, clues, answers, or coordinates.

- X and WhatsApp buttons open a prefilled composer; the player chooses whether to publish or send. These buttons share text and the link, not an automatic image attachment.
- On supported devices, **Share my score** opens the native share menu and includes the PNG when file sharing is supported. Browsers without native sharing use copy instead. Clipboard denial offers selectable text.
- **Save scorecard** downloads a 1080 × 1080 PNG for posts or stories. The preview and image are generated entirely in the browser; no upload, storage service, API key, or new Cloudflare configuration is required. Native destinations may handle text and images differently.
- Shared game links open the current daily game. The date is shown in the score; historical daily rounds and replayable practice challenge links are not implemented.

`src/lib/share.js` builds the public score payload and image, `src/lib/share-ui.js` handles browser sharing, and `tests/share.test.mjs` checks spoiler boundaries and link encoding.
