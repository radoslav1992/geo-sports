// Second ground import from the same pinned snapshot. Usage: node scripts/build-ground-expansion.mjs SoccerStadiums.json
// Adds sites the first 500-ground release did not use. grounds.json stays frozen; this writes grounds-expansion.json.
import {readFileSync, writeFileSync} from 'node:fs';
import {geoContains, geoDistance} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-50m.json' with {type:'json'};
import grounds from '../src/data/grounds.json' with {type:'json'};
import {legacyQuestions} from '../src/data/legacy-questions.js';
import {display, cities, norm, capacity} from './stadium-source.mjs';

const MIN_CAPACITY = 2000;      // real club grounds, not training pitches
const MAX_PER_NATION = 120;     // keeps daily sets varied: no nation dominates the calendar
const COASTAL_TOLERANCE_KM = 5; // 1:50m coastlines can clip seaside grounds
const [stadiumsPath] = process.argv.slice(2);
if (!stadiumsPath) throw new Error('Provide the pinned SoccerStadiums.json snapshot. See docs/QUESTION-BANK.md.');
const raw = JSON.parse(readFileSync(stadiumsPath, 'utf8'));
const countries = feature(world, world.objects.countries).features;
const boundaryNames = {'USA':'United States of America','England':'United Kingdom','Scotland':'United Kingdom','Wales':'United Kingdom','Northern Ireland':'United Kingdom','Gibraltar':'United Kingdom','Czech Republic':'Czechia','FYR of Macedonia':'Macedonia','Bosnia and Herzegovina':'Bosnia and Herz.','Faroe Islands':'Faeroe Is.'};
// Training grounds, annex pitches and artificial practice fields are not fair "find the ground" clues.
const notAGround = /kunstrasen|rasenplatz|nebenplatz|trainings?|übungs|anexo|annex|akadem|academ|jugend|youth|reserve|complex|kompleks|complejo|centre|center|campo \d|platz \d|field \d|pitch \d|\b[2-9]$|sportanlage|sportplatz|ciudad deportiva/i;
const km = (a, b) => geoDistance(a, b) * 6371;
const boundaryCheck = (boundary, [lon, lat]) => {
  if (geoContains(boundary, [lon, lat])) return 'inside';
  const step = COASTAL_TOLERANCE_KM / 111.2;
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI / 8;
    if (geoContains(boundary, [lon + step * Math.cos(angle) / Math.cos(lat * Math.PI / 180), lat + step * Math.sin(angle)])) return `within-${COASTAL_TOLERANCE_KM}km`;
  }
  return null;
};

const names = new Map();
for (const r of raw) {const key = r.Nation + ':' + norm(r.Name); if (!names.has(key)) names.set(key, new Set()); names.get(key).add(norm(r.Town || ''));}
const used = new Set(grounds.map(g => g.id));
const sites = [...grounds, ...legacyQuestions].map(q => q.coords);
const perNation = new Map(), selected = [];
for (const r of [...raw].sort((a, b) => capacity(b) - capacity(a) || a.Id - b.Id)) {
  const id = `ground-${r.Id}`, coords = [r.Longitude, r.Latitude];
  if (used.has(id) || !r.Town || !r.Latitude || !r.Longitude || Math.abs(r.Latitude) > 85) continue;
  if (capacity(r) < MIN_CAPACITY || /[?]/.test(r.Name + r.Town) || notAGround.test(r.Name)) continue;
  if (/\(\d{4}[-–]/.test(r.Name)) continue; // superseded buildings on the same stadium site
  if (names.get(r.Nation + ':' + norm(r.Name)).size > 1) continue; // ambiguous within a football nation
  // The first release only admitted US grounds with a second coordinate source (to exclude
  // American-football venues). That source is not part of this import, so US records are skipped.
  if (r.Nation === 'USA' || (perNation.get(r.Nation) || 0) >= MAX_PER_NATION) continue;
  const boundary = countries.find(c => c.properties.name === (boundaryNames[r.Nation] || r.Nation));
  const check = boundary && boundaryCheck(boundary, coords);
  if (!check) continue;
  if (sites.some(site => km(site, coords) < .7)) continue; // one question per stadium site
  // Argentine records append the province; the town alone is the answer.
  const city = cities[r.Town] || r.Town.replace(/, [A-Z]{2}$/, '').replace(/ \(Buenos Aires\)$|, Santa Fé$/, '');
  selected.push({id, name: r.Name, city, country: display[r.Nation] || r.Nation, coords: coords.map(n => Number(n.toFixed(5))), capacity: capacity(r), check});
  sites.push(coords);
  perNation.set(r.Nation, (perNation.get(r.Nation) || 0) + 1);
}
const data = selected.map(({id, name, city, country, coords}) => ({id, name, city, country, coords}));
writeFileSync('src/data/grounds-expansion.json', JSON.stringify(data, null, 2) + '\n');
writeFileSync('docs/ground-expansion-provenance.json', JSON.stringify(selected.map(({id, capacity, check}) => ({id, sourceRecord: Number(id.slice(7)), recordedCapacity: capacity, boundaryCheck: check})), null, 2) + '\n');
console.log(JSON.stringify({grounds: data.length, nations: perNation.size, largest: [...perNation].sort((a, b) => b[1] - a[1]).slice(0, 5), nearCoast: selected.filter(r => r.check !== 'inside').length}));
