import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {SITE, PAGES, absolute, sitemapXml, robotsTxt} from '../src/lib/seo.js';

test('sitemap lists every indexable page once with absolute https URLs', () => {
  const xml = sitemapXml(PAGES, '2026-10-01');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.deepEqual(locs, PAGES.map(page => absolute(page.path)));
  assert.equal(new Set(locs).size, locs.length);
  for (const loc of locs) assert.ok(loc.startsWith(`${SITE}/`) && SITE.startsWith('https://'));
  assert.equal([...xml.matchAll(/<lastmod>2026-10-01<\/lastmod>/g)].length, PAGES.length);
});

test('every sitemap page has a source page, and robots.txt points crawlers at the sitemap', () => {
  for (const {path} of PAGES) {
    const file = path === '/' ? 'src/pages/index.astro' : `src/pages${path.replace(/\/$/, '')}.astro`;
    assert.ok(existsSync(file), `${path} has no page at ${file}`);
    assert.ok(path.endsWith('/'), `${path} should use the trailing-slash form Cloudflare serves`);
  }
  assert.equal(robotsTxt(), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
});
