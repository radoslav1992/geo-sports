import grounds from './grounds.json' with {type: 'json'};
import groundsExpansion from './grounds-expansion.json' with {type: 'json'};
import legends from './legends.json' with {type: 'json'};
import {legacyQuestions} from './legacy-questions.js';
import {groundStories} from './ground-stories.js';

// “in the Netherlands”, not “in Netherlands”, when a country name reads mid-sentence.
export const inCountry = country => /^(Netherlands|United |Philippines|Maldives|Faroe Islands|DR Congo)/.test(country) ? `the ${country}` : country;

// One clue per stadium site, not multiple phrasings counted as extra questions.
// Ground names can be historical; we do not assert current sponsorship or tenants.
const prompts = [
  (name, country) => `Find the football ground known as ${name} in ${country}. Which city is it associated with?`,
  (name, country) => `${name} is a name from ${country}${country.endsWith('s') ? '’' : '’s'} football map. Pin its city.`,
  (name, country) => `An away day in ${country}: find the city of the ground known as ${name}.`,
  (name, country) => `Where in ${country} is the stadium site known as ${name}?`,
  (name, country) => `Groundhopping challenge: locate ${name} in ${country}.`,
];
export const questions = [
  ...legacyQuestions,
  // The expansion continues the same phrasing rotation, so existing clues keep their wording.
  ...[...grounds, ...groundsExpansion].map((ground, index) => ({
    id: ground.id,
    sport: 'Football',
    year: groundStories[ground.id]?.year ?? 'GROUNDS · PAST & PRESENT',
    question: groundStories[ground.id]?.question ?? prompts[index % prompts.length](ground.name, inCountry(ground.country)),
    city: ground.city,
    country: ground.country,
    coords: ground.coords,
    hint: `Look in ${inCountry(ground.country)}. The place name starts with “${ground.city[0].toUpperCase()}”.`,
    fact: groundStories[ground.id]?.fact ?? `The ground known as ${ground.name} is associated with ${ground.city}, ${ground.country}. Aim for the stadium site on the map.`,
  })),
  // Birthplaces of famous players; pins come from the GeoNames gazetteer (see docs/QUESTION-BANK.md).
  ...legends.map(({id, question, city, country, coords, hint, fact}) => ({id, sport: 'Football', year: 'LEGENDS · BIRTHPLACES', question, city, country, coords, hint, fact})),
];
