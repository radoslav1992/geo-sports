# Atlas Arena / geo-sports

A focused sports geography game built with Astro, adapted from the owner's purchased Quizo version-6 layout. One question, one map, one confirm button. No paid map API, database, account, or backend is needed for this release.

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

- Five daily clues, selected deterministically from the bundled question pool using the UTC date. Resets at 00:00 UTC without rebuilding.
- Practice mode draws another five-question set. Returning to Daily restores its saved progress.
- Within 10 km of the venue: 1,000 points. Beyond that: `round(1000 × exp(-(distanceKm - 10)/1800))`.
- A hint reduces that question's maximum to 800; no timer or speed bonus.
- Touch/drag map navigation, pinch or button zoom, mouse-wheel zoom, keyboard navigation, and a coordinate input alternative.
- Results show guess/answer pins, distance, points and a short explanation. Copy a compact score card.
- Daily progress and stats are browser-local (`localStorage`); practice is kept in memory. No cross-device accounts or leaderboard are implied.

## Content and release boundaries

`src/data/questions.js` contains **15 starter questions**. The daily selection is repeatable but not a unique editorial calendar: questions can recur on later days. Expand and editorially verify the pool before promoting it as a long-term daily service. IDs should remain stable; bump `CONTENT_VERSION` when changing existing question meanings or scoring rules.

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
- `tests/game.test.mjs` — scoring, UTC selection and state tests

See `TEMPLATE-NOTES.md` for the purchased template adaptation and license provenance.
