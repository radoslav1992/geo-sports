import test from 'node:test';
import assert from 'node:assert/strict';
import {buildShareResult, platformLinks, scoreTile} from '../src/lib/share.js';

const complete = {
  phase: 'complete', mode: 'daily', date: '2026-09-28',
  ids: ['secret-a', 'secret-b', 'secret-c', 'secret-d', 'secret-e'],
  results: [1000, 800, 799, 400, 0].map((points, i) => ({
    id: `secret-${i}`, guess: [-58.36, -34.63], points, hinted: i === 1,
  })),
};

test('shared result contains score, date, assists and no answers or private URL state', () => {
  const result = buildShareResult(complete, 'https://example.com/?token=private#answer');
  assert.equal(result.formattedScore, '2,999');
  assert.equal(result.tiles, '🟩🟩🟨🟨🟧');
  assert.equal(result.assistLabel, '1 assist');
  assert.equal(result.url, 'https://example.com/');
  assert.match(result.fullText, /2026-09-28/);
  assert.doesNotMatch(JSON.stringify(result), /secret|58\.36|34\.63|private|answer/);
  assert.equal(result.filename, 'geo-football-daily-2026-09-28.png');
});

test('platform intents preserve Unicode, newlines and exactly one game link', () => {
  const result = buildShareResult(complete, 'https://example.com/');
  const links = platformLinks(result);
  const x = new URL(links.x), whatsapp = new URL(links.whatsapp);
  assert.equal(x.origin, 'https://x.com');
  assert.equal(x.pathname, '/intent/tweet');
  assert.equal(x.searchParams.get('text'), result.text);
  assert.equal(x.searchParams.get('url'), result.url);
  assert.equal(whatsapp.origin, 'https://wa.me');
  assert.equal(whatsapp.searchParams.get('text'), result.fullText);
  assert.ok(result.text.length + 24 < 280);
});

test('practice is labelled separately and incomplete rounds cannot be shared', () => {
  const result = buildShareResult({...complete, mode: 'practice'}, 'https://example.com/');
  assert.match(result.text, /Training/);
  assert.doesNotMatch(result.text, /Can you beat/);
  assert.match(result.filename, /training/);
  assert.throws(() => buildShareResult({...complete, phase: 'reveal'}, 'https://example.com/'));
  assert.throws(() => buildShareResult({...complete, results: []}, 'https://example.com/'));
  assert.deepEqual([0, 399, 400, 799, 800, 1000].map(scoreTile), ['🟧', '🟧', '🟨', '🟨', '🟩', '🟩']);
});

test('daily shares carry the matchday number and a streak of two or more; training shares do not', () => {
  const daily = buildShareResult(complete, 'https://example.com/', {matchday: 104, streak: 3});
  assert.match(daily.text, /^⚽ Geo Football #104 · 2026-09-28\n/);
  assert.match(daily.text, /🔥 3/);
  assert.doesNotMatch(buildShareResult(complete, 'https://example.com/', {matchday: 104, streak: 1}).text, /🔥/);
  assert.doesNotMatch(buildShareResult(complete, 'https://example.com/', {matchday: 0}).text, /#/);
  const training = buildShareResult({...complete, mode: 'practice'}, 'https://example.com/', {matchday: 104, streak: 3});
  assert.doesNotMatch(training.text, /#104|🔥/);
  assert.ok(daily.text.length + 24 < 280);
});
