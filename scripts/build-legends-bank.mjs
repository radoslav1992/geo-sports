// Resolves hand-written legend clues to coordinates. Usage: node scripts/build-legends-bank.mjs path/to/cities.json-package
// Coordinates come only from the pinned GeoNames extract (npm cities.json@1.1.64), never from memory.
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {geoDistance} from 'd3-geo';
import grounds from '../src/data/grounds.json' with {type:'json'};
import expansion from '../src/data/grounds-expansion.json' with {type:'json'};
import {legacyQuestions} from '../src/data/legacy-questions.js';
import {legends} from './legends-source.mjs';
import {inCountry} from '../src/data/questions.js';

const [packageDir] = process.argv.slice(2);
if (!packageDir) throw new Error('Provide the unpacked cities.json@1.1.64 package directory. See docs/QUESTION-BANK.md.');
const places = JSON.parse(readFileSync(join(packageDir, 'cities.json'), 'utf8'));
const regions = new Map(JSON.parse(readFileSync(join(packageDir, 'admin1.json'), 'utf8')).map(r => [r.code, r.name]));
const fold = s => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const km = (a, b) => geoDistance(a, b) * 6371;
const index = new Map();
for (const p of places) {const key = `${p.country}:${fold(p.name)}`; if (!index.has(key)) index.set(key, []); index.get(key).push(p);}

const problems = [], sites = [...grounds, ...expansion, ...legacyQuestions].map(q => ({id: q.id, coords: q.coords})), data = [];
for (const entry of legends) {
  const [name, country, admin1] = entry.at;
  let matches = (index.get(`${country}:${fold(name)}`) || []).filter(p => !admin1 || p.admin1 === admin1);
  // `near` only chooses between same-name gazetteer entries; the pin still comes from the gazetteer.
  if (entry.near && matches.length > 1) {
    const distance = p => km([Number(p.lng), Number(p.lat)], entry.near);
    matches = matches.filter(p => distance(p) < 10).sort((a, b) => distance(a) - distance(b)).slice(0, 1);
  }
  if (matches.length !== 1) {problems.push(`${entry.id}: ${matches.length} gazetteer matches for ${entry.at.join('/')}`); continue;}
  const [place] = matches, coords = [Number(Number(place.lng).toFixed(5)), Number(Number(place.lat).toFixed(5))];
  const clash = sites.find(site => km(site.coords, coords) < .7);
  if (clash) {problems.push(`${entry.id}: within 0.7 km of ${clash.id}`); continue;}
  const region = regions.get(`${country}.${place.admin1}`);
  const city = entry.city || name;
  const area = region && fold(region) !== fold(entry.country) && fold(region) !== fold(city) ? `${region}, ${entry.country}` : inCountry(entry.country);
  data.push({id: `legend-${entry.id}`, question: entry.q, city, country: entry.country, coords, hint: `Look in ${area}. The place name starts with “${city[0].toUpperCase()}”.`, fact: entry.fact});
  sites.push({id: `legend-${entry.id}`, coords});
}
if (problems.length) throw new Error(`Fix these legend entries:\n${problems.join('\n')}`);
writeFileSync('src/data/legends.json', JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify({legends: data.length, countries: new Set(data.map(d => d.country)).size}));
