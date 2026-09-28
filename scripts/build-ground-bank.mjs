// Reproducible import. Usage: node scripts/build-ground-bank.mjs SoccerStadiums.json Wikidata_stadium_lat_long.tsv
// The checked-in snapshot is the release input; never fetch or rebuild this on deploy.
import {readFileSync, writeFileSync} from 'node:fs';
import {geoContains, geoDistance} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-110m.json' with {type:'json'};
import {legacyQuestions} from '../src/data/legacy-questions.js';
import {display, cities, norm, capacity} from './stadium-source.mjs';
const [stadiumsPath, wikidataPath] = process.argv.slice(2);
if (!stadiumsPath || !wikidataPath) throw new Error('Provide both source snapshots. See docs/QUESTION-BANK.md.');
const raw=JSON.parse(readFileSync(stadiumsPath,'utf8'));
const lines=readFileSync(wikidataPath,'utf8').trim().split('\n');
const wiki=lines.slice(1).map(line=>line.split('\t')).filter(r=>r[4]&&r[5]).map(r=>({name:r[3],coords:[Number(r[5]),Number(r[4])]}));
const countries=feature(world,world.objects.countries).features;
const aliases={'USA':'United States of America','England':'United Kingdom','Scotland':'United Kingdom','Wales':'United Kingdom','Northern Ireland':'United Kingdom','Czech Republic':'Czechia','FYR of Macedonia':'Macedonia','Bosnia and Herzegovina':'Bosnia and Herz.','Hong Kong':'China','Macao':'China'};
const km=(a,b)=>geoDistance(a,b)*6371;
// Ambiguous same-name grounds in the same football nation are not fair clues.
const names=new Map();
for(const r of raw){const key=r.Nation+':'+norm(r.Name);if(!names.has(key))names.set(key,new Set());names.get(key).add(norm(r.Town));}
const candidates=[];
for(const r of [...raw].sort((a,b)=>capacity(b)-capacity(a)||a.Id-b.Id)){
 const coords=[r.Longitude,r.Latitude];
 if(capacity(r)<8000||!r.Town||/[?]/.test(r.Name+r.Town)||!r.Latitude||!r.Longitude||Math.abs(r.Latitude)>85||Math.abs(r.Longitude)>180)continue;
 if(/\(\d{4}[-–]/.test(r.Name))continue; // superseded buildings on the same stadium site
 if(names.get(r.Nation+':'+norm(r.Name)).size>1)continue;
 const boundary=countries.find(c=>c.properties.name===(aliases[r.Nation]||r.Nation));
 if(!boundary||!geoContains(boundary,coords))continue; // conservative: omit uncertain border/coastal points
 if(legacyQuestions.some(q=>km(q.coords,coords)<.7)||candidates.some(q=>km(q.coords,coords)<.7))continue;
 const corroboration=wiki.map(w=>({name:w.name,distance:km(w.coords,coords),coords:w.coords})).filter(w=>w.distance<.5).sort((a,b)=>a.distance-b.distance)[0];
 // Avoid importing American-football-only grounds from multi-sport lists.
 if(r.Nation==='USA'&&!corroboration)continue;
 let city=cities[r.Town]||r.Town.replace(/, [A-Z]{2}$/, '');
 if(r.Name==='Kashima Soccer Stadium')city='Kashima';
 if(r.Name==='Ajinomoto Stadium')city='Chofu';
 if(r.Name==='Deportivo Cali')city='Palmira';
 if(r.Name==='Estádio Nacional'&&r.Nation==='Portugal')city='Oeiras';
 candidates.push({id:`ground-${r.Id}`,name:r.Name,city,country:display[r.Nation]||r.Nation,coords:coords.map(n=>Number(n.toFixed(5))),capacity:capacity(r),corroboration});
}
// Spread the bank over countries; prefer independently corroborated coordinates within each country.
const groups=new Map();
for(const r of candidates){if(!groups.has(r.country))groups.set(r.country,[]);groups.get(r.country).push(r);}
for(const group of groups.values())group.sort((a,b)=>Number(!!b.corroboration)-Number(!!a.corroboration)||b.capacity-a.capacity||a.id.localeCompare(b.id));
const selected=[];
while(selected.length<500){let added=0;for(const [,group] of [...groups].sort(([a],[b])=>a.localeCompare(b))){if(group.length&&selected.length<500){selected.push(group.shift());added++;}}if(!added)throw new Error('Not enough distinct qualifying grounds.');}
const data=selected.map(({id,name,city,country,coords})=>({id,name,city,country,coords}));
writeFileSync('src/data/grounds.json',JSON.stringify(data,null,2)+'\n');
writeFileSync('docs/ground-provenance.json',JSON.stringify(selected.map(({id,corroboration})=>({id,sourceRecord:Number(id.slice(7)),...(corroboration?{coordinateCheck:{source:'wikidata-archive',...corroboration,distance:Number(corroboration.distance.toFixed(3))}}:{})})),null,2)+'\n');
console.log(JSON.stringify({newGrounds:data.length,countries:new Set(data.map(r=>r.country)).size,coordinateCrossChecks:selected.filter(r=>r.corroboration).length,eligible:candidates.length}));
