import grounds from './grounds.json' with {type: 'json'};
import {legacyQuestions} from './legacy-questions.js';

// One clue per stadium site, not multiple phrasings counted as extra questions.
// Ground names can be historical; we do not assert current sponsorship or tenants.
const prompts = [
  (name, country) => `Find the football ground known as ${name} in ${country}. Which city is it associated with?`,
  (name, country) => `${name} is a name from ${country}’s football map. Pin its city.`,
  (name, country) => `An away day in ${country}: find the city of the ground known as ${name}.`,
  (name, country) => `Where in ${country} is the stadium site known as ${name}?`,
  (name, country) => `Groundhopping challenge: locate ${name} in ${country}.`,
];
export const questions = [
  ...legacyQuestions,
  ...grounds.map((ground, index) => ({
    id: ground.id,
    sport: 'Football',
    year: 'GROUNDS · PAST & PRESENT',
    question: prompts[index % prompts.length](ground.name, ground.country),
    city: ground.city,
    country: ground.country,
    coords: ground.coords,
    hint: `Look in ${ground.country}. The place name starts with “${ground.city[0].toUpperCase()}”.`,
    fact: `The ground known as ${ground.name} is associated with ${ground.city}, ${ground.country}. Aim for the stadium site on the map.`,
  })),
];
