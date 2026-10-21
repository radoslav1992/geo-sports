import test from 'node:test';
import assert from 'node:assert/strict';
import {ads} from '../src/lib/ads.js';
import {SITE} from '../src/lib/seo.js';

test('Adsterra units are well-formed and only load on the production domain', () => {
  const keys = [ads.native, ads.leaderboard, ads.mobile, ads.rectangle];
  for (const key of keys) assert.match(key, /^[0-9a-f]{32}$/);
  assert.equal(new Set(keys).size, keys.length);
  assert.ok(ads.host.startsWith('https://'));
  assert.equal(ads.domain, new URL(SITE).hostname);
});
