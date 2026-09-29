// Question-and-answer copy for the visible FAQs and their FAQPage structured data. Each answer stands on its own,
// so search and AI answers can quote it without the rest of the page. Home and guide sets don't overlap.
import {questions} from './questions.js';
import {DAILY_REPEAT_DAYS} from '../lib/game.js';

const total = questions.length.toLocaleString('en-US'), countries = new Set(questions.map(q => q.country)).size;
export const siteStats = {questions: questions.length, countries, repeatDays: DAILY_REPEAT_DAYS};

export const homeFaq = [
  ['What is Geo Football?', 'Geo Football is a free daily football geography quiz. Every day it sets five clues about famous stadiums, the birthplaces of football legends and the venues of historic matches, and you pin each place on a world map. The closer your pin, the more points you score, up to 5,000 a day.'],
  ['How does Geo Football scoring work?', 'Each question is worth up to 1,000 points. A pin within 10 km of the answer scores the full 1,000, and points fall smoothly with distance after that, so a guess in the right region still scores well. Taking an assist caps that question at 800 points.'],
  ['When does a new Geo Football quiz come out?', 'A new matchday of five questions starts every day at 00:00 UTC. Everyone in the world plays the same five questions that day, so you can compare scores with friends.'],
  ['How many questions are there, and do they repeat?', `There are ${total} questions from ${countries} countries and territories. The daily calendar works through all of them before any comes back, so no daily question repeats for ${DAILY_REPEAT_DAYS} days.`],
  ['Do I need an account or an app to play?', 'No. Geo Football runs in any modern browser on a phone or computer, with no sign-up and no download. Your streak and stats are saved in your own browser.'],
];

export const guideFaq = [
  ['What does an assist do?', 'An assist tells you where to look, usually the country or region and the first letter of the place, and caps that question at 800 points instead of 1,000. Your shared result shows how many assists you used.'],
  ['How do streaks work?', 'Your streak counts the days in a row on which you finished the daily matchday. Miss a day and it starts again from zero; your best streak is kept in your stats.'],
  ['Can I share my score without spoiling the answers?', 'Yes. The shared result shows the matchday number, five coloured tiles, your total points and your streak, but never the clues, answers or places.'],
  ['Where are my stats saved?', 'In your own browser. Streaks, best score and average stay on the device you play on; your answers and scores are never uploaded.'],
  ['Can I practise?', 'Yes. The training ground serves new questions you haven’t seen in this browser, as often as you like, without affecting your daily stats.'],
];

export const faqJsonLd = faq => faq.map(([name, text]) => ({'@type': 'Question', name, acceptedAnswer: {'@type': 'Answer', text}}));
