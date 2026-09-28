// Append-only calendar extension. Usage: node scripts/extend-daily-schedule.mjs
// Every day of the base calendar stays exactly as published (same sets, same in-day order seed);
// questions the base never scheduled are appended as new days. Run it only before the base
// calendar first wraps: once a cycle has repeated, lengthening it would move the dates in play.
import {writeFileSync, existsSync, readFileSync} from 'node:fs';
import {geoDistance} from 'd3-geo';
import {questions} from '../src/data/questions.js';
import base from '../src/data/daily-schedule-v2.json' with {type: 'json'};

const VERSION = 'football-daily-v3', OUTPUT = 'src/data/daily-schedule-v3.json';
const km = (a, b) => geoDistance(a, b) * 6371;
const hash = value => {let h = 2166136261; for (const c of value) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0;};

const scheduled = new Set(base.days.flat());
const fresh = questions.filter(q => !scheduled.has(q.id));
if (fresh.length % base.roundSize) throw new Error(`New questions (${fresh.length}) must fill whole days of ${base.roundSize}.`);
const newDays = fresh.length / base.roundSize;

// Each nation's questions are spaced evenly across the new days, with legends interleaved among its grounds.
const nations = new Map();
for (const q of fresh) {if (!nations.has(q.country)) nations.set(q.country, []); nations.get(q.country).push(q);}
const queues = [...nations].sort(([a], [b]) => a.localeCompare(b)).map(([country, items]) => {
  if (items.length > newDays) throw new Error(`${country} has more questions than new days.`);
  const kinds = [items.filter(q => !q.id.startsWith('legend-')), items.filter(q => q.id.startsWith('legend-'))];
  const ordered = kinds.flatMap(list => list.map((q, i) => ({q, position: (i + .5) / list.length}))).sort((a, b) => a.position - b.position).map(x => x.q);
  const phase = hash(`${VERSION}:${country}`) / 2 ** 32;
  return {country, items: ordered.map((q, k) => ({q, due: (k + phase) * newDays / ordered.length})), next: 0};
});
const days = [];
for (let day = 0; day < newDays; day++) {
  // Most overdue nation first; nations with more left break ties so none falls behind.
  const ready = queues.filter(n => n.next < n.items.length)
    .sort((a, b) => a.items[a.next].due - b.items[b.next].due || (b.items.length - b.next) - (a.items.length - a.next) || a.country.localeCompare(b.country));
  const picked = [];
  for (const nation of ready) {
    const q = nation.items[nation.next].q;
    if (picked.every(other => km(other.q.coords, q.coords) > 25)) picked.push({nation, q});
    if (picked.length === base.roundSize) break;
  }
  if (picked.length !== base.roundSize) throw new Error(`Could not fill new day ${day} with five nations.`);
  for (const {nation} of picked) nation.next++;
  days.push(picked.map(({q}) => q.id));
}

const schedule = {version: VERSION, extends: base.version, orderSeed: base.version, startsOn: base.startsOn, roundSize: base.roundSize, legacyIds: base.legacyIds, days: [...base.days, ...days]};
const content = JSON.stringify(schedule, null, 2) + '\n';
if (existsSync(OUTPUT)) {
  if (readFileSync(OUTPUT, 'utf8') !== content) throw new Error('Refusing to replace a published calendar. Create a new version instead.');
} else {
  const wrap = Date.parse(`${base.startsOn}T00:00:00Z`) + base.days.length * 86400000;
  if (Date.now() >= wrap) throw new Error(`${base.version} has already wrapped; extending it would move live dates. Start a new calendar instead.`);
  writeFileSync(OUTPUT, content, {flag: 'wx'});
}
console.log(`${schedule.days.length} daily rounds (${days.length} new); ${schedule.days.flat().length} questions; repeats are ${schedule.days.length} days apart.`);
