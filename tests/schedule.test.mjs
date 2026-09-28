import test from 'node:test';
import assert from 'node:assert/strict';
import {questions} from '../src/data/questions.js';
import {legacyQuestions} from '../src/data/legacy-questions.js';
import grounds from '../src/data/grounds.json' with {type: 'json'};
import expansion from '../src/data/grounds-expansion.json' with {type: 'json'};
import legends from '../src/data/legends.json' with {type: 'json'};
import schedule from '../src/data/daily-schedule-v3.json' with {type: 'json'};
import scheduleV2 from '../src/data/daily-schedule-v2.json' with {type: 'json'};
import {dailyQuestions, DAILY_REPEAT_DAYS, DAILY_SCHEDULE_START, dayKey, distanceKm, practiceQuestions, newRound, validateRound, shuffle, hashSeed, CONTENT_VERSION} from '../src/lib/game.js';

const epoch=Date.parse(`${DAILY_SCHEDULE_START}T00:00:00Z`);
const dateAt=day=>dayKey(new Date(epoch+day*86400000));
const V2_DAYS=scheduleV2.days.length, LEGACY_DAYS=[100,101,102];

test('the frozen calendar contains all 1,975 questions exactly once per 395-day cycle',()=>{
  assert.equal(questions.length,1975);
  assert.equal(grounds.length+expansion.length+legends.length+legacyQuestions.length,1975);
  assert.equal(DAILY_REPEAT_DAYS,395);
  assert.equal(schedule.roundSize,5);
  assert.ok(schedule.days.every(day=>day.length===5));
  assert.deepEqual([...schedule.days.flat()].sort(),questions.map(q=>q.id).sort());
  assert.equal(new Set(questions.map(q=>q.question)).size,1975);
  // One question per site: stadiums, legacy moments and birthplace pins never share a spot.
  for(let i=0;i<questions.length;i++)for(let j=0;j<i;j++)assert.ok(distanceKm(questions[i].coords,questions[j].coords)>=.7,`Duplicate site: ${questions[i].id}, ${questions[j].id}`);
});

test('ten years of daily play never repeat a question within a year',()=>{
  assert.ok(DAILY_REPEAT_DAYS>=365);
  const seen=new Map();
  for(let day=0;day<3660;day++){
    const today=dailyQuestions(questions,dateAt(day));
    assert.equal(today.length,5);
    assert.equal(new Set(today.map(q=>q.id)).size,5);
    for(const q of today){
      if(seen.has(q.id))assert.equal(day-seen.get(q.id),DAILY_REPEAT_DAYS);
      seen.set(q.id,day);
    }
  }
  assert.equal(seen.size,1975);
});

test('v3 extends v2 append-only: every published v2 day plays exactly as before',()=>{
  assert.equal(schedule.extends,scheduleV2.version);
  assert.equal(schedule.startsOn,scheduleV2.startsOn);
  assert.deepEqual(schedule.legacyIds,scheduleV2.legacyIds);
  assert.deepEqual(schedule.days.slice(0,V2_DAYS),scheduleV2.days);
  for(let day=0;day<V2_DAYS;day++){
    const date=dateAt(day);
    const published=shuffle(scheduleV2.days[day],hashSeed(`${scheduleV2.version}:${date}`));
    assert.deepEqual(dailyQuestions(questions,date).map(q=>q.id),published);
  }
  // New content follows v2's first cycle, so nothing played in v2 returns before day 395.
  const v2Ids=new Set(scheduleV2.days.flat());
  for(const day of schedule.days.slice(V2_DAYS))assert.ok(day.every(id=>!v2Ids.has(id)));
});

test('rollout preserves old daily sets and gives legacy clues at least 100 days off',()=>{
  for(let day=-30;day<0;day++){
    const date=dateAt(day);
    const old=shuffle(legacyQuestions,hashSeed(`${CONTENT_VERSION}:${date}`)).slice(0,5);
    assert.deepEqual(dailyQuestions(questions,date).map(q=>q.id),old.map(q=>q.id));
  }
  const legacy=new Set(legacyQuestions.map(q=>q.id));
  for(let day=0;day<100;day++)assert.ok(dailyQuestions(questions,dateAt(day)).every(q=>!legacy.has(q.id)));
  const oldSave=newRound(dailyQuestions(questions,'2026-09-28'),'2026-09-28');
  assert.ok(validateRound(oldSave,questions,'2026-09-28'));
});

test('bank reorder and additions cannot move existing dates; new daily sets have varied locations',()=>{
  const extended=[{...questions[0],id:'future-question'},...questions].reverse();
  for(let day=0;day<DAILY_REPEAT_DAYS;day++){
    const date=dateAt(day), selected=dailyQuestions(questions,date);
    assert.deepEqual(dailyQuestions(extended,date),selected);
    if(!LEGACY_DAYS.includes(day)){
      assert.equal(new Set(selected.map(q=>q.country)).size,5);
      for(let i=0;i<5;i++)for(let j=0;j<i;j++)assert.ok(distanceKm(selected[i].coords,selected[j].coords)>25);
    }
  }
  assert.throws(()=>dailyQuestions(questions,'2026-02-30'));
  assert.throws(()=>dailyQuestions(questions,'invalid'));
  assert.throws(()=>dailyQuestions([],dateAt(0)));
  const round=newRound(dailyQuestions(questions,dateAt(0)),dateAt(0));
  assert.equal(validateRound({...round,ids:round.ids.toReversed()},questions,dateAt(0)),null);
});

test('training exhausts unseen questions, avoids today’s daily set, then reuses oldest',()=>{
  const excluded=dailyQuestions(questions,dateAt(0)).map(q=>q.id);
  let history=['removed-question',null], seen=new Set(), first;
  const rounds=(questions.length-5)/5;
  for(let round=0;round<rounds;round++){
    const next=practiceQuestions(questions,history,round+1,excluded);
    if(round===0)first=next.questions.map(q=>q.id);
    for(const q of next.questions){assert.ok(!excluded.includes(q.id));assert.ok(!seen.has(q.id));seen.add(q.id);}
    history=JSON.parse(JSON.stringify(next.history)); // represents a browser reload
  }
  assert.equal(seen.size,questions.length-5);
  const next=practiceQuestions(questions,history,999,excluded);
  assert.deepEqual(next.questions.map(q=>q.id),first);
  assert.equal(new Set(next.history).size,questions.length-5);
  assert.equal(practiceQuestions(questions,{bad:'storage'},1).questions.length,5);
});
