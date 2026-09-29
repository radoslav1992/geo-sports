// Single source for the public address, the publisher and the indexable pages (sitemap, robots, llms.txt, head tags).
export const SITE = 'https://geofootball.net';
export const SITE_NAME = 'Geo Football';
export const LAUNCH_DATE = '2026-09-29'; // matchday #1
// `published` and `updated` feed the visible bylines, structured data and sitemap <lastmod>: bump `updated` when a page's content changes.
export const PAGES = [
  {path: '/', changefreq: 'daily', priority: '1.0', published: '2026-09-29', updated: '2026-09-29',
    title: 'Play today’s matchday', summary: 'the daily five-question game, plus unlimited practice on the training ground'},
  {path: '/how-to-play/', changefreq: 'monthly', priority: '0.8', published: '2026-09-28', updated: '2026-09-29',
    title: 'How to play', summary: 'rules, the full scoring table, assists, streaks and a gameplay FAQ'},
  {path: '/about/', changefreq: 'monthly', priority: '0.6', published: '2026-09-28', updated: '2026-09-29',
    title: 'About the questions', summary: 'what the question bank covers, where the locations come from and how they are checked'},
];
export const absolute = path => new URL(path, SITE).href;
export const pageFor = path => PAGES.find(page => page.path === path);
// The site's author and publisher. To credit a person instead, make this {'@type': 'Person', name, url, sameAs: [profile URLs]}.
export const PUBLISHER = {'@type': 'Organization', '@id': `${SITE}/#organization`, name: SITE_NAME, url: absolute('/'),
  logo: {'@type': 'ImageObject', url: absolute('/icon-512.png'), width: 512, height: 512}};
export const longDate = iso => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', {day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'});
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapXml(pages = PAGES) {
  const urls = pages.map(page => `  <url>\n    <loc>${escape(absolute(page.path))}</loc>\n    <lastmod>${page.updated}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
export const robotsTxt = () => `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`;

// https://llmstxt.org: a plain summary for AI assistants, with links to the pages worth reading.
export function llmsTxt({questions, countries, repeatDays}) {
  const n = value => value.toLocaleString('en-US');
  return `# ${SITE_NAME}

> ${SITE_NAME} (${absolute('/')}) is a free daily football geography quiz. Every day it sets five clues about famous stadiums, the birthplaces of football legends and the venues of historic matches, and players pin each place on a world map. The closer the pin, the more points: up to 1,000 per question and 5,000 per day.

- ${n(questions)} questions from ${countries} countries and territories. No daily question repeats for ${repeatDays} days.
- A new matchday starts at 00:00 UTC, and everyone plays the same five questions.
- A pin within 10 km of the answer scores 1,000 points; points fall smoothly with distance after that. An assist reveals where to look and caps that question at 800.
- Free in any modern browser, with no account or download. Streaks and stats are stored in the player’s own browser.
- Matchday #1 was ${longDate(LAUNCH_DATE)}. ${SITE_NAME} is independent and not affiliated with any club, league, federation or stadium.

## Pages

${PAGES.map(page => `- [${page.title}](${absolute(page.path)}): ${page.summary}`).join('\n')}

## Optional

- [Data credits](${absolute('/data-licenses.txt')}): licences for the stadium, gazetteer and map data
- [Sitemap](${absolute('/sitemap.xml')})
`;
}
