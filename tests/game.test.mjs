import test from 'node:test';
import assert from 'node:assert/strict';
import {questions} from '../src/data/questions.js';
import {groundStories} from '../src/data/ground-stories.js';
import {dayKey,dailyQuestions,newRound,scoreGuess,distanceKm,validateRound,completeGuess,advanceRound,totalPoints,matchdayNumber,streaks} from '../src/lib/game.js';
test('daily selection is stable, unique, and anchored to UTC',()=>{assert.equal(dayKey(new Date('2026-09-28T02:00:00+03:00')),'2026-09-27');const a=dailyQuestions(questions,'2026-09-27');assert.deepEqual(a,dailyQuestions(questions,'2026-09-27'));assert.equal(a.length,5);assert.equal(new Set(a.map(q=>q.id)).size,5);assert.notDeepEqual(a,dailyQuestions(questions,'2026-09-28'));});
test('distance and scoring handle perfect, far, and hinted guesses',()=>{assert.equal(scoreGuess([0,0],[0,0]).points,1000);assert.equal(scoreGuess([0,0],[0,0],true).points,800);assert.ok(Math.abs(distanceKm([0,0],[1,0])-111.195)<.1);assert.ok(scoreGuess([0,0],[10,0]).points>scoreGuess([0,0],[40,0]).points);assert.equal(scoreGuess([0,0],[180,0]).points,0);assert.throws(()=>scoreGuess([NaN,0],[0,0]));assert.throws(()=>scoreGuess([181,0],[0,0]));});
test('round state prevents duplicate submissions and premature advancement',()=>{const items=questions.slice(0,5);let r=newRound(items,'2026-09-27');assert.throws(()=>completeGuess(r,items[0]));assert.throws(()=>advanceRound(r));for(const q of items){r={...r,guess:q.coords};r=completeGuess(r,q);assert.throws(()=>completeGuess(r,q));r=advanceRound(r);}assert.equal(r.phase,'complete');assert.equal(totalPoints(r),5000);assert.throws(()=>completeGuess(r,items[4]));});
test('saved rounds restore safely and recalculate scores',()=>{const items=dailyQuestions(questions,'2026-09-27');let r=newRound(items,'2026-09-27');r=completeGuess({...r,guess:items[0].coords},items[0]);const raw=JSON.parse(JSON.stringify(r));raw.results[0].points=999999;assert.equal(validateRound(raw,questions,'2026-09-27').results[0].points,1000);assert.equal(validateRound(raw,questions,'2026-09-28'),null);assert.equal(validateRound({...raw,version:'v1'},questions,'2026-09-27'),null);assert.equal(validateRound({...raw,ids:['missing',...raw.ids.slice(1)]},questions,'2026-09-27'),null);assert.equal(validateRound({...raw,phase:'complete'},questions,'2026-09-27'),null);assert.equal(validateRound({...raw,results:[{...raw.results[0],guess:[null,0]}]},questions,'2026-09-27'),null);});
test('all questions have unique IDs and valid coordinates',()=>{assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);for(const q of questions){assert.equal(q.sport,"Football");assert.equal(scoreGuess(q.coords,q.coords).points,1000);assert.ok(q.question&&q.city&&q.fact&&q.hint)}});
test('story and legend clues point at real grounds and never name the answer city',()=>{
  const fold=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
  const byId=new Map(questions.map(q=>[q.id,q]));
  for(const id of Object.keys(groundStories)){assert.ok(byId.has(id),id);assert.equal(byId.get(id).question,groundStories[id].question)}
  for(const q of questions.filter(q=>groundStories[q.id]||q.id.startsWith('legend-')))assert.ok(!fold(q.question).includes(fold(q.city)),`${q.id} names ${q.city}`);
});
test('matchday numbers and streaks follow UTC calendar days',()=>{
  assert.equal(matchdayNumber('2026-09-29'),1);
  assert.equal(matchdayNumber('2027-01-10'),104);
  assert.ok(matchdayNumber('2026-09-28')<1);
  const played={'2027-01-01':1,'2027-01-02':1,'2027-01-03':1,'2027-01-05':1,'2027-01-06':1,'bad':1};
  assert.deepEqual(streaks(played,'2027-01-06'),{current:2,best:3});
  assert.deepEqual(streaks(played,'2027-01-07'),{current:2,best:3}); // today not played yet: streak still alive
  assert.deepEqual(streaks(played,'2027-01-08'),{current:0,best:3});
  assert.deepEqual(streaks(null,'2027-01-08'),{current:0,best:0});
  assert.deepEqual(streaks({'2026-12-31':1,'2027-01-01':1},'2027-01-01'),{current:2,best:2});
});
