# Quizo integration

The owner supplied the purchased **Quizo — Questionnaire Multistep & Quiz Form Wizard** archive. This end product adapts the normal-version **version-6** layout:

- A single active question panel using the `multisteps_form` structure.
- Adapted `question_number` badge and `next_btn` control, restyled in lime green for Geo Football.
- Short question entrance transition, with reduced-motion support.
- The map replaces the multiple-choice answer area.

The custom Geo Football theme is a floodlit night match: a dark navy stadium backdrop with floodlight beams, a club-style crest, and a world map laid over a mown pitch with fixed chalk markings. The scoreboard is a striped pitch strip, numbered shirt progress markers turn lime, yellow or orange by how close each guess landed, the guess is a football pin and the answer a gold target. Answer details sit below the map so they cannot cover a guessed location. Help, results, stats, the 404 page, the PNG scorecard and the mobile layout share the same palette. Layout, controls and design tokens live in `src/styles/global.css`; the matchday decoration lives in `src/styles/football-theme.css`.

The template's decorative background, illustrations, timer, PHP submission flow, jQuery wizard, and full Bootstrap dependency are not needed for this focused geography game. Astro and small JavaScript modules implement the real game state and map interactions. `src/styles/quizo-adapted.css` contains the selected, adapted template styles; the remaining app code and styling are custom.

The purchased archive, all other demo layouts, and unmodified template source are intentionally excluded. Keep the purchase/license documentation with the owner. This repository does not grant a standalone license to redistribute the Quizo template. Geo Football is a working product name, distinct from the reference application.
