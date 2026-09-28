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

- Five daily clues from a frozen 395-day calendar starting 29 September 2026. All 1,975 questions appear once per cycle, so no daily question repeats for 395 days (more than a year). Resets at 00:00 UTC without rebuilding.
- Training uses browser-local question history, selecting unseen questions before revisiting the oldest. It excludes the current daily set. Returning to Daily restores its saved progress.
- Within 10 km of the venue: 1,000 points. Beyond that: `round(1000 × exp(-(distanceKm - 10)/1800))`.
- A hint reduces that question's maximum to 800; no timer or speed bonus.
- One tap locks a guess in. Players who prefer to adjust their pin first can tick **Confirm before locking in** (saved in the browser).
- Each reveal flies the map in to frame both pins, draws the great-circle "pass" from guess to answer, drops the answer pin, then shows the result and counts the score up. Any pan or zoom finishes the animation instantly; reduced-motion settings skip it.
- Country names appear progressively as the map zooms in (largest countries first) and keep a constant on-screen size.
- Synthesised sounds (no audio files): pin tap, referee's whistle on lock-in, result chimes by band, a crowd roar for a perfect guess and the full-time whistle, plus light haptics on phones. The header speaker button mutes them.
- Daily rounds are numbered as matchdays (#1 = 29 September 2026). Stats show the current and best daily streak; the results screen shows per-question bars, the streak and a countdown to the next matchday.
- Touch/drag map navigation, pinch or button zoom, mouse-wheel zoom, keyboard navigation, and a coordinate input alternative.
- Results show guess/answer pins, distance, points and a short explanation. Share a spoiler-free score on X, WhatsApp, or through the device share menu; copy text or download a branded PNG scorecard.
- Daily progress, stats, and training question history are browser-local (`localStorage`); the active training round is kept in memory. No cross-device accounts or leaderboard are implied.

## Content and release boundaries

`src/data/questions.js` contains **1,975 football questions**:

- 15 original stadium/history clues;
- 1,537 ground-location questions (the first 500 across 103 football nations, plus a 1,037-ground expansion from the same pinned dataset);
- 423 **Legends** clues asking where famous footballers were born, across 84 countries, with pins from the GeoNames gazetteer.

92 well-known grounds carry **story clues** (finals, famous matches, landmark facts) from `src/data/ground-stories.js` in place of the generic ground wording; their IDs, answers and pins are unchanged.

One clue represents one map site, and no two questions are within 0.7 km of each other; players who share a hometown share one clue. Alternative wording is not counted as additional content. Ground clues explicitly cover past and present names, without claiming current sponsors or tenants.

The committed `src/data/daily-schedule-v3.json` fixes 395 five-question sets. Its first 103 days are the published `daily-schedule-v2.json` calendar, unchanged and in the same in-day order; the 292 new days follow, so nothing from v2 returns before day 395. Dates before 29 September 2026 retain the original selection so the rollout preserves existing rounds. IDs and answers remain stable, and adding questions to the pool does not change any scheduled day. **Deploy v3 before 10 January 2027**, when v2 would otherwise start its second cycle. **Do not regenerate an active calendar**: extend it append-only before it wraps, or start a new version with a future activation date and verify cooldowns across the transition.

Every daily set except the three legacy days contains five different football nations with answers at least 25 km apart, and each nation's questions are spread evenly across the year. The 395-day guarantee is for daily play; training has a separate local history and cannot change the globally shared daily schedule. Clearing browser storage resets training history, but does not affect the daily guarantee.

Data provenance, historical-name caveats, coordinate checks, import commands, and maintenance rules are documented in [docs/QUESTION-BANK.md](docs/QUESTION-BANK.md).

Answers and scoring run in the browser. This release is suitable for casual play and the initial design launch; it is not cheat-resistant competitive scoring. A public leaderboard would require server-side answer validation and shared storage. No accounts, subscriptions, analytics, advertising, or tracking scripts are included.

The interactive map is built from Natural Earth's country boundaries through `world-atlas`, with D3 projection. It is an approximate low-resolution world map, not a street map. Fonts are bundled locally. There are no external font, tile or API requests during gameplay.

## Project structure

- `src/pages/index.astro` — focused play screen and dialogs
- `src/pages/how-to-play.astro`, `about.astro` — crawlable guide pages; `sitemap.xml.js`, `robots.txt.js` — generated from `src/lib/seo.js`
- `src/components/WorldMap.astro` — server-rendered geographic paths
- `src/styles/quizo-adapted.css` — selected purchased-template styles
- `src/styles/global.css` — responsive application design
- `src/lib/game.js` — deterministic rounds, distances, scores, validation
- `src/lib/map.js` — pointer, pinch, zoom and pin handling
- `src/app.js` — interface, browser persistence and results
- `src/data/grounds.json`, `grounds-expansion.json`, `legends.json` — committed question data
- `src/data/daily-schedule-v3.json` — immutable 395-day daily calendar (extends `daily-schedule-v2.json`)
- `scripts/` — reproducible imports and calendar builders (never run during deploy)
- `tests/game.test.mjs` — scoring, UTC selection and state tests
- `tests/schedule.test.mjs` — ten-year repeat simulation, v2 preservation, one-question-per-site check, geographic variety, and training history

See `TEMPLATE-NOTES.md` for the purchased template adaptation and license provenance.

## Geo Football rebrand

All daily and practice clues cover association football: clubs, stadiums, rivalries, and men’s and women’s World Cup moments. The app title, header, help, shared results, 404 page and favicon use Geo Football. The existing repository and Cloudflare Worker retain `geo-sports` to preserve deployment continuity.

Football progress and stats use separate `geo-football-*-v1` browser keys. Earlier mixed-sport rounds and scores are left untouched but are not loaded into football play. The content version is `football-v1`.

## SEO and discovery

The public address is set once in `src/lib/seo.js` (`https://geofootball.net`), which also lists the indexable pages. From it the build generates `/sitemap.xml` and `/robots.txt`, and every page gets a canonical URL, Open Graph and Twitter card tags (with a 1200×630 `og-image.png`), icons and a web app manifest. The game page adds `WebSite` and `WebApplication`/`VideoGame` structured data, a real page heading and a short crawlable introduction; `/how-to-play/` and `/about/` are static guide pages with breadcrumbs; the 404 page is `noindex`. To add a page, create it under `src/pages/` and add its path to `PAGES` (a test checks both). `scripts/build-social-images.mjs` re-renders the share image and icons with Playwright when the brand changes; the PNGs are committed.

After deploying, add the site to Google Search Console and Bing Webmaster Tools and submit `https://geofootball.net/sitemap.xml`.

## Score sharing

Completed daily and training rounds have separate share labels. Shared text includes the matchday number and UTC date, five coloured result tiles, total points, assists used, the daily streak (from two days), and the current game URL without query parameters or fragments. It never includes question IDs, clues, answers, or coordinates.

- X and WhatsApp buttons open a prefilled composer; the player chooses whether to publish or send. These buttons share text and the link, not an automatic image attachment.
- On supported devices, **Share my score** opens the native share menu and includes the PNG when file sharing is supported. Browsers without native sharing use copy instead. Clipboard denial offers selectable text.
- **Save scorecard** downloads a 1080 × 1080 PNG for posts or stories. The preview and image are generated entirely in the browser; no upload, storage service, API key, or new Cloudflare configuration is required. Native destinations may handle text and images differently.
- Shared game links open the current daily game. The date is shown in the score; historical daily rounds and replayable practice challenge links are not implemented.

`src/lib/share.js` builds the public score payload and image, `src/lib/share-ui.js` handles browser sharing, and `tests/share.test.mjs` checks spoiler boundaries and link encoding.
