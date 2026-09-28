// Single source for the public address and the indexable pages (sitemap, robots, canonical tags).
export const SITE = 'https://geofootball.net';
export const SITE_NAME = 'Geo Football';
export const PAGES = [
  {path: '/', changefreq: 'daily', priority: '1.0'},
  {path: '/how-to-play/', changefreq: 'monthly', priority: '0.8'},
  {path: '/about/', changefreq: 'monthly', priority: '0.6'},
];
export const absolute = path => new URL(path, SITE).href;
const escape = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapXml(pages = PAGES, lastmod = new Date().toISOString().slice(0, 10)) {
  const urls = pages.map(page => `  <url>\n    <loc>${escape(absolute(page.path))}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
export const robotsTxt = () => `User-agent: *\nAllow: /\n\nSitemap: ${absolute('/sitemap.xml')}\n`;
