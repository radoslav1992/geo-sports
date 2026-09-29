import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {SITE, PAGES, LAUNCH_DATE, absolute, sitemapXml, robotsTxt, llmsTxt, longDate} from '../src/lib/seo.js';
import {homeFaq, guideFaq, faqJsonLd, siteStats} from '../src/data/faq.js';
import {questions} from '../src/data/questions.js';
import {DAILY_REPEAT_DAYS} from '../src/lib/game.js';

test('sitemap lists every indexable page once with absolute https URLs', () => {
  const xml = sitemapXml(PAGES);
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(locs, PAGES.map(page => absolute(page.path)));
  assert.equal(new Set(locs).size, locs.length);
  for (const loc of locs) assert.ok(loc.startsWith(`${SITE}/`) && SITE.startsWith('https://'));
  assert.deepEqual([...xml.matchAll(/<lastmod>(.*?)<\/lastmod>/g)].map(m => m[1]), PAGES.map(page => page.updated));
});

test('every sitemap page has a source page, and robots.txt points crawlers at the sitemap', () => {
  for (const {path} of PAGES) {
    const file = path === '/' ? 'src/pages/index.astro' : `src/pages${path.replace(/\/$/, '')}.astro`;
    assert.ok(existsSync(file), `${path} has no page at ${file}`);
    assert.ok(path.endsWith('/'), `${path} should use the trailing-slash form Cloudflare serves`);
  }
  assert.equal(robotsTxt(), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
});

test('every page has real publish and update dates for bylines, structured data and the sitemap', () => {
  const today = new Date().toISOString().slice(0, 10);
  for (const {path, published, updated, title, summary} of PAGES) {
    for (const date of [published, updated]) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, `${path} date ${date}`);
      assert.equal(new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10), date, `${path} has an impossible date ${date}`);
    }
    assert.ok(published <= updated, `${path} is updated before it was published`);
    assert.ok(updated <= today, `${path} claims an update in the future (${updated})`);
    assert.ok(title && summary, `${path} needs a title and summary for llms.txt`);
  }
  assert.equal(longDate('2026-09-29'), '29 September 2026');
});

test('llms.txt follows the llmstxt.org layout and links every indexable page', () => {
  const text = llmsTxt(siteStats);
  assert.match(text, /^# Geo Football\n\n> Geo Football \(https:\/\/geofootball\.net\/\) is a free daily football geography quiz\./);
  assert.equal(text.match(/^# /gm).length, 1);
  assert.deepEqual(text.match(/^## .*/gm), ['## Pages', '## Optional']);
  for (const {path} of PAGES) assert.ok(text.includes(`](${absolute(path)}): `), `llms.txt misses ${path}`);
  for (const [, url] of text.matchAll(/\]\((.*?)\)/g)) assert.ok(url.startsWith(`${SITE}/`), `${url} should be absolute`);
  assert.ok(text.includes(`${questions.length.toLocaleString('en-US')} questions from ${new Set(questions.map(q => q.country)).size} countries`));
  assert.ok(text.includes(`repeats for ${DAILY_REPEAT_DAYS} days`) && text.includes(longDate(LAUNCH_DATE)));
});

test('FAQ answers stand alone, never repeat across pages, and map to FAQPage questions', () => {
  const all = [...homeFaq, ...guideFaq];
  assert.equal(new Set(all.map(([q]) => q)).size, all.length, 'a question appears on two pages');
  for (const [q, a] of all) {
    assert.ok(q.endsWith('?'), `${q} should be phrased as a question`);
    assert.ok(a.length >= 60 && a.length <= 320 && /[.!]$/.test(a), `answer to "${q}" should be one or two full sentences`);
  }
  assert.deepEqual(faqJsonLd(homeFaq.slice(0, 1)), [{'@type': 'Question', name: homeFaq[0][0], acceptedAnswer: {'@type': 'Answer', text: homeFaq[0][1]}}]);
  assert.ok(homeFaq.some(([, a]) => a.includes(questions.length.toLocaleString('en-US'))), 'the home FAQ quotes the live question count');
});
