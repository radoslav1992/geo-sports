// Renders the social preview (1200×630) and app icons into public/. Run after changing the brand:
//   PLAYWRIGHT=/path/to/playwright node scripts/build-social-images.mjs
// Needs a Playwright install with Chromium; the images are committed, so builds never run this.
import {readFileSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {geoNaturalEarth1, geoPath, geoGraticule10, geoInterpolate} from 'd3-geo';
import {feature} from 'topojson-client';
import world from 'world-atlas/countries-110m.json' with {type: 'json'};

const require = createRequire(import.meta.url);
const {chromium} = require(process.env.PLAYWRIGHT || 'playwright');
const font = (pkg, file) => `data:font/woff2;base64,${readFileSync(`node_modules/@fontsource/${pkg}/files/${file}`).toString('base64')}`;
const crest = readFileSync('public/favicon.svg', 'utf8');
const fonts = `@font-face{font-family:'Barlow Condensed';font-weight:700;src:url(${font('barlow-condensed', 'barlow-condensed-latin-700-normal.woff2')})}
@font-face{font-family:'DM Sans';font-weight:600;src:url(${font('dm-sans', 'dm-sans-latin-600-normal.woff2')})}
@font-face{font-family:'DM Sans';font-weight:700;src:url(${font('dm-sans', 'dm-sans-latin-700-normal.woff2')})}`;

// A pitch-striped world map with a guess, the answer and the "pass" between them, as in the game.
const projection = geoNaturalEarth1().scale(118).translate([330, 175]), path = geoPath(projection);
const countries = feature(world, world.objects.countries).features.filter(c => c.id !== '010');
const guess = [-4.5, 47.5], answer = [-3.68, 40.45];
const arc = path({type: 'LineString', coordinates: [guess, answer]});
const [gx, gy] = projection(guess), [ax, ay] = projection(answer);
// Framed on the pins (Europe and the Atlantic); pitch markings are a separate overlay on the card.
const [cx, cy] = [(gx + ax) / 2, (gy + ay) / 2 + 25];
const map = `<svg class="world" viewBox="${cx - 165} ${cy - 159} 330 318" preserveAspectRatio="xMidYMid slice">
<path d="${path(geoGraticule10())}" fill="none" stroke="rgba(191,243,207,.1)" stroke-width=".4"/>
<g fill="#0d2031" stroke="#5d86a3" stroke-width=".45">${countries.map(c => `<path d="${path(c)}"/>`).join('')}</g>
<path d="${arc}" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="4 3.5" stroke-linecap="round"/>
<circle cx="${ax}" cy="${ay}" r="10" fill="rgba(255,207,74,.25)" stroke="rgba(255,207,74,.85)" stroke-width="1"/><circle cx="${ax}" cy="${ay}" r="4.5" fill="#ffcf4a" stroke="#fff6d8" stroke-width="1.3"/>
<g transform="translate(${gx},${gy}) scale(.7)"><path d="M0 0C-4-6-12-13-12-22a12 12 0 0 1 24 0C12-13 4-6 0 0Z" fill="#5fd4ff" stroke="#effbff" stroke-width="2"/><circle cy="-22" r="7" fill="#f2ffe8"/></g>
</svg>
<svg class="pitch" viewBox="0 0 540 520" preserveAspectRatio="none"><g fill="none" stroke="rgba(235,255,240,.22)" stroke-width="1.5"><rect x="16" y="16" width="508" height="488" rx="6"/><path d="M16 260h508M150 16v70h240V16M150 504v-70h240v70"/><circle cx="270" cy="260" r="58"/></g></svg>`;
const og = `<html><head><style>${fonts}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;overflow:hidden;font-family:'DM Sans';color:#f3f8fc;
background:radial-gradient(60% 70% at 0 0,rgba(181,243,106,.16),transparent 70%),radial-gradient(60% 70% at 100% 0,rgba(95,212,255,.14),transparent 70%),linear-gradient(180deg,#081523,#050d16)}
.wrap{display:flex;height:100%;padding:56px 60px;gap:44px;align-items:center}.copy{flex:1}
.brand{display:flex;align-items:center;gap:18px}.brand svg{width:72px;height:81px;filter:drop-shadow(0 10px 24px rgba(181,243,106,.35))}
.word{font:700 64px/1 'Barlow Condensed';letter-spacing:1px}.word b{color:#b5f36a;margin-left:10px}
h1{margin:34px 0 16px;font:700 62px/1.02 'Barlow Condensed';letter-spacing:.3px}h1 em{font-style:normal;color:#b5f36a}
p{font-size:25px;line-height:1.45;color:#c9d7e3}.chips{display:flex;gap:12px;margin-top:30px}
.chips span{padding:10px 18px;border-radius:999px;border:1px solid #2d4b69;background:rgba(255,255,255,.04);font-weight:700;font-size:19px}
.chips span:first-child{background:#b5f36a;color:#10230d;border-color:#b5f36a}
.map{position:relative;width:540px;height:520px;border-radius:24px;overflow:hidden;border:1px solid #2c6b49;
background:radial-gradient(ellipse at 50% 50%,transparent 55%,rgba(2,10,8,.55)),repeating-linear-gradient(90deg,#0f3f29 0 33.75px,#12482f 33.75px 67.5px);box-shadow:0 30px 80px rgba(0,0,0,.6)}
.map svg{position:absolute;inset:0;width:100%;height:100%}.map .pitch{pointer-events:none}</style></head>
<body><div class="wrap"><div class="copy"><div class="brand">${crest}<div class="word">GEO<b>FOOTBALL</b></div></div>
<h1>The daily <em>football geography</em> quiz</h1><p>Five clues a day. Pin stadiums, legends’ hometowns and famous finals on the world map.</p>
<div class="chips"><span>Play free</span><span>1,975 questions</span><span>No sign-up</span></div></div>
<div class="map">${map}</div></div></body></html>`;
const icon = (size, crestScale) => `<html><head><style>*{margin:0}body{width:${size}px;height:${size}px;display:grid;place-items:center;
background:radial-gradient(70% 70% at 50% 30%,#12482f,#06101a 75%)}svg{width:${size * crestScale}px;height:${size * crestScale * 72 / 64}px}</style></head><body>${crest}</body></html>`;

const browser = await chromium.launch();
async function render(html, width, height, file) {
  const page = await browser.newPage({viewport: {width, height}});
  await page.setContent(html, {waitUntil: 'load'});
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(`public/${file}`, await page.screenshot({type: 'png'}));
  await page.close();
}
await render(og, 1200, 630, 'og-image.png');
await render(icon(180, .62), 180, 180, 'apple-touch-icon.png');
await render(icon(192, .62), 192, 192, 'icon-192.png');
await render(icon(512, .62), 512, 512, 'icon-512.png');
await render(icon(512, .48), 512, 512, 'icon-maskable-512.png'); // crest inside the maskable safe zone
await browser.close();
console.log('Wrote og-image.png and icons to public/.');
