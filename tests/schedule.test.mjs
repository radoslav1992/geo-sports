import test from 'node:test';
import assert from 'node:assert/strict';
import {questions} from '../src/data/questions.js';
import {legacyQuestions} from '../src/data/legacy-questions.js';
import grounds from '../src/data/grounds.json' with {type: 'json'};
import schedule from '../src/data/daily-schedule-v2.json' with {type: 'json'};
import {dailyQuestions, DAILY_REPEAT_DAYS, DAILY_SCHEDULE_START, dayKey, distanceKm, practiceQuestions, newRound, validateRound, shuffle, hashSeed, CONTENT_VERSION} from '../src/lib/game.js';

const epoch=Date.parse(`${DAILY_SCHEDULE_START}T00:00:00Z`);
const dateAt=day=>dayKey(new Date(epoch+day*86400000));

test('the frozen calendar contains all 515 questions exactly once in 103 days',()=>{
  assert.equal(questions.length,515);
  assert.equal(grounds.length,500);
  assert.equal(DAILY_REPEAT_DAYS,103);
  assert.equal(schedule.roundSize,5);
  assert.ok(schedule.days.every(day=>day.length===5));
  assert.deepEqual([...schedule.days.flat()].sort(),questions.map(q=>q.id).sort());
  assert.equal(new Set(questions.map(q=>q.question)).size,515);
  const sites=[...grounds,...legacyQuestions];
  for(let i=0;i<sites.length;i++)for(let j=0;j<i;j++)assert.ok(distanceKm(sites[i].coords,sites[j].coords)>=.7,`Duplicate stadium site: ${sites[i].id}, ${sites[j].id}`);
});

test('ten years of daily play never repeat a question fewer than 103 days later',()=>{
  const seen=new Map();
  for(let day=0;day<3660;day++){
    const today=dailyQuestions(questions,dateAt(day));
    assert.equal(today.length,5);
    assert.equal(new Set(today.map(q=>q.id)).size,5);
    for(const q of today){
      if(seen.has(q.id))assert.equal(day-seen.get(q.id),103);
      seen.set(q.id,day);
    }
  }
  assert.equal(seen.size,515);
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
  for(let day=0;day<103;day++){
    const date=dateAt(day), selected=dailyQuestions(questions,date);
    assert.deepEqual(dailyQuestions(extended,date),selected);
    if(day<100){
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
  for(let round=0;round<102;round++){
    const next=practiceQuestions(questions,history,round+1,excluded);
    if(round===0)first=next.questions.map(q=>q.id);
    for(const q of next.questions){assert.ok(!excluded.includes(q.id));assert.ok(!seen.has(q.id));seen.add(q.id);}
    history=JSON.parse(JSON.stringify(next.history)); // represents a browser reload
  }
  assert.equal(seen.size,510);
  const next=practiceQuestions(questions,history,999,excluded);
  assert.deepEqual(next.questions.map(q=>q.id),first);
  assert.equal(new Set(next.history).size,510);
  assert.equal(practiceQuestions(questions,{bad:'storage'},1).questions.length,5);
});
