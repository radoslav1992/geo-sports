// Run deliberately for a NEW schedule release, never automatically during build.
// The committed calendar freezes the daily sets, even when the bank grows.
import {writeFileSync, existsSync, readFileSync} from 'node:fs';
import {geoDistance} from 'd3-geo';
import {questions} from '../src/data/questions.js';
import {legacyQuestions} from '../src/data/legacy-questions.js';
import grounds from '../src/data/grounds.json' with {type:'json'};
// v2 covers the legacy clues and the first 500 grounds; later additions are appended by extend-daily-schedule.mjs.
const legacyIds=legacyQuestions.map(q=>q.id), v2Grounds=new Set(grounds.map(g=>g.id));
const fresh=questions.filter(q=>v2Grounds.has(q.id)).sort((a,b)=>a.id<b.id?-1:1);
function mix(items,seed){const a=[...items];let state=seed;for(let i=a.length-1;i>0;i--){state=(Math.imul(state,1664525)+1013904223)>>>0;const j=state%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
let days;
for(let attempt=0;attempt<1000;attempt++){
 const remaining=mix(fresh,20260929+attempt),candidate=[];
 while(remaining.length){
  const day=[];
  for(let i=0;i<5;i++){
   const index=remaining.findIndex(q=>day.every(other=>other.country!==q.country&&geoDistance(other.coords,q.coords)*6371>25));
   if(index<0)break;
   day.push(remaining.splice(index,1)[0]);
  }
  if(day.length!==5)break;
  candidate.push(day.map(q=>q.id));
 }
 if(candidate.length*5===fresh.length){days=candidate;break;}
}
if(!days)throw new Error('Could not construct geographically diverse daily sets.');
// New content first: even the most recently played legacy question gets 100+ days off.
for(let i=0;i<legacyIds.length;i+=5)days.push(legacyIds.slice(i,i+5));
if(days.some(day=>day.length!==5))throw new Error('Question count must be a multiple of five.');
const schedule={version:'football-daily-v2',startsOn:'2026-09-29',roundSize:5,legacyIds,days};
const path='src/data/daily-schedule-v2.json', content=JSON.stringify(schedule,null,2)+'\n';
if(existsSync(path)&&readFileSync(path,'utf8')!==content)throw new Error('Refusing to replace a published calendar. Create a new version and future start date.');
if(!existsSync(path))writeFileSync(path,content,{flag:'wx'});
console.log(`${days.length} daily rounds; ${days.flat().length} questions; repeats are ${days.length} days apart.`);
