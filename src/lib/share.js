import {ROUND_SIZE, totalPoints} from './game.js';

export const scoreBand = points => points >= 800 ? 'good' : points >= 400 ? 'close' : 'far';
export const scoreTile = points => ({good: '🟩', close: '🟨', far: '🟧'})[scoreBand(points)];

// Only these spoiler-free fields leave the game. Never serialize the round itself.
export function buildShareResult(round, pageUrl) {
  if (round.phase !== 'complete' || round.results.length !== ROUND_SIZE) {
    throw new Error('Finish all five questions before sharing.');
  }
  const url = new URL(pageUrl);
  url.search = '';
  url.hash = '';
  const practice = round.mode === 'practice';
  const points = round.results.map(result => result.points);
  const score = totalPoints(round);
  const assists = round.results.filter(result => result.hinted).length;
  const formattedScore = score.toLocaleString('en-US');
  const tiles = points.map(scoreTile).join('');
  const assistLabel = assists === 0 ? 'No assists' : `${assists} assist${assists === 1 ? '' : 's'}`;
  const text = `⚽ Geo Football · ${practice ? 'Training · ' : ''}${round.date}\n${tiles}\n${formattedScore} / 5,000 pts · ${assistLabel}\n${practice ? 'Your turn. Give it a go!' : 'Can you beat my score?'}`;
  return {
    title: 'Geo Football — My score', text, url: url.href,
    fullText: `${text}\n${url.href}`,
    date: round.date, practice, points, score, formattedScore, tiles, assistLabel,
    filename: `geo-football-${practice ? 'training' : 'daily'}-${round.date}.png`,
  };
}

export function platformLinks(result) {
  const x = new URL('https://x.com/intent/tweet');
  x.search = new URLSearchParams({text: result.text, url: result.url}).toString();
  const whatsapp = new URL('https://wa.me/');
  whatsapp.search = new URLSearchParams({text: result.fullText}).toString();
  return {x: x.href, whatsapp: whatsapp.href};
}

export async function createScorecard(result) {
  await Promise.all([
    document.fonts.load('600 160px "Barlow Condensed"'),
    document.fonts.load('600 28px "DM Sans"'),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Scorecard rendering is unavailable.');
  const navy = '#0b1728', lime = '#b5f36a', white = '#f0f7ed';
  ctx.fillStyle = navy;
  ctx.fillRect(0, 0, 1080, 1080);
  // Pitch stripes and markings frame the result; this is a data graphic, not a screenshot.
  for (let x = 0; x < 1080; x += 120) {
    ctx.fillStyle = x % 240 ? '#12482f' : '#0f3f29';
    ctx.fillRect(x, 0, 120, 1080);
  }
  ctx.strokeStyle = '#ebfff066'; ctx.lineWidth = 3;
  ctx.strokeRect(35, 35, 1010, 1010);
  ctx.beginPath(); ctx.moveTo(35, 540); ctx.lineTo(1045, 540); ctx.stroke();
  ctx.beginPath(); ctx.arc(540, 540, 160, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeRect(350, 35, 380, 120); ctx.strokeRect(350, 925, 380, 120);
  ctx.fillStyle = '#0b1728f0'; ctx.beginPath(); ctx.roundRect(95, 90, 890, 900, 28); ctx.fill();
  const bar = ctx.createLinearGradient(95, 0, 985, 0);
  bar.addColorStop(0, lime); bar.addColorStop(1, '#5fd4ff');
  ctx.save(); ctx.clip(); ctx.fillStyle = bar; ctx.fillRect(95, 90, 890, 8); ctx.restore();
  const label = (text, y, size, color = white, condensed = false) => {
    ctx.textAlign = 'center'; ctx.fillStyle = color;
    ctx.font = `600 ${size}px "${condensed ? 'Barlow Condensed' : 'DM Sans'}", sans-serif`;
    ctx.fillText(text, 540, y, 790);
  };
  label('GEO FOOTBALL', 184, 62, lime, true);
  label(`${result.practice ? 'TRAINING GROUND' : 'DAILY MATCHDAY'}  /  ${result.date}`, 241, 23, '#a5bdc9');
  label('FULL-TIME', 336, 27, '#a5bdc9');
  label(result.formattedScore, 505, 184, white, true);
  label('OUT OF 5,000 POINTS', 555, 24, '#a5bdc9');
  result.points.forEach((points, index) => {
    const x = 188 + index * 145;
    ctx.fillStyle = points >= 800 ? lime : points >= 400 ? '#f4d67c' : '#efaa79';
    ctx.beginPath(); ctx.roundRect(x, 613, 124, 107, 10); ctx.fill();
    ctx.textAlign = 'center'; ctx.fillStyle = navy;
    ctx.font = '600 21px "DM Sans", sans-serif'; ctx.fillText(`0${index + 1}`, x + 62, 645);
    ctx.font = '600 38px "Barlow Condensed", sans-serif'; ctx.fillText(points.toLocaleString('en-US'), x + 62, 691);
  });
  label(result.assistLabel.toUpperCase(), 770, 22, '#a5bdc9');
  label(result.practice ? 'YOUR TURN. GIVE IT A GO.' : 'CAN YOU BEAT MY SCORE?', 848, 43, lime, true);
  label(new URL(result.url).host + new URL(result.url).pathname.replace(/\/$/, ''), 925, 27, white);
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (blob) resolve(blob); else reject(new Error('Could not create the scorecard.'));
  }, 'image/png'));
}
