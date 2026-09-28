import dailySchedule from '../data/daily-schedule-v2.json' with {type: 'json'};

export const ROUND_SIZE = 5;
export const CONTENT_VERSION = 'football-v1';
export const DAILY_SCHEDULE_START = dailySchedule.startsOn;
export const DAILY_REPEAT_DAYS = dailySchedule.days.length;
export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);
export function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
export function shuffle(items, seed) {
  const result = [...items];
  let state = seed >>> 0;
  const random = () => {state = (state + 0x6D2B79F5) | 0;let t = Math.imul(state ^ state >>> 15, 1 | state);t ^= t + Math.imul(t ^ t >>> 7, 61 | t);return ((t ^ t >>> 14) >>> 0) / 4294967296;};
  for (let i = result.length - 1; i > 0; i--) {const j = Math.floor(random() * (i + 1));[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
export function dailyQuestions(pool, date) {
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(timestamp) || dayKey(new Date(timestamp)) !== date) {
    throw new RangeError('Use a valid UTC date in YYYY-MM-DD format.');
  }
  const byId = new Map(pool.map(q => [q.id, q]));
  const day = Math.floor((timestamp - Date.parse(`${DAILY_SCHEDULE_START}T00:00:00Z`)) / 86400000);
  // Preserve already-played rounds during the rollout, including today's saves.
  const ids = day < 0
    ? shuffle(dailySchedule.legacyIds, hashSeed(`${CONTENT_VERSION}:${date}`)).slice(0, ROUND_SIZE)
    : shuffle(dailySchedule.days[day % DAILY_REPEAT_DAYS], hashSeed(`${dailySchedule.version}:${date}`));
  return ids.map(id => {
    if (!byId.has(id)) throw new Error(`Scheduled question is missing: ${id}`);
    return byId.get(id);
  });
}

// Local training history is separate from the shared daily calendar.
export function practiceQuestions(pool, history, seed, excludeIds = []) {
  const available = new Map(pool.map(q => [q.id, q]));
  const seen = [...new Set((Array.isArray(history) ? history : []).filter(id => available.has(id)))];
  const recency = new Map(seen.map((id, index) => [id, index]));
  const excluded = new Set(excludeIds);
  const candidates = shuffle(pool.filter(q => !excluded.has(q.id)), seed);
  if (candidates.length < ROUND_SIZE) throw new Error('Not enough questions for a training round.');
  // Unseen first; after exhaustion, revisit the least recently selected questions.
  candidates.sort((a, b) => (recency.get(a.id) ?? -1) - (recency.get(b.id) ?? -1));
  const items = candidates.slice(0, ROUND_SIZE), selected = new Set(items.map(q => q.id));
  return {questions: items, history: [...seen.filter(id => !selected.has(id)), ...selected]};
}
export function validCoordinate(value) {return Array.isArray(value) && value.length === 2 && value.every(Number.isFinite) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 85;}
export function distanceKm(a,b) {
  if(!validCoordinate(a)||!validCoordinate(b)) throw new RangeError('Invalid map coordinates.');
  const rad = Math.PI / 180;
  const deltaLat = (b[1]-a[1])*rad, deltaLon = (b[0]-a[0])*rad;
  const h = Math.sin(deltaLat/2)**2 + Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(deltaLon/2)**2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
export function scoreGuess(guess,answer,hinted=false) {
  const distance = distanceKm(guess,answer);
  const maximum = hinted ? 800 : 1000;
  return {distance,points:distance <= 10 ? maximum : Math.round(maximum * Math.exp(-(distance - 10)/1800))};
}
export function newRound(items,date,mode='daily') {return {version:CONTENT_VERSION,date,mode,ids:items.map(q=>q.id),results:[],guess:null,hinted:false,phase:'guess'};}
export function validateRound(raw,pool,date) {
  if(!raw || raw.version !== CONTENT_VERSION || raw.mode !== 'daily' || raw.date !== date || !Array.isArray(raw.ids) || raw.ids.length !== ROUND_SIZE || new Set(raw.ids).size !== ROUND_SIZE || !Array.isArray(raw.results) || raw.results.length > ROUND_SIZE || !['guess','reveal','complete'].includes(raw.phase) || typeof raw.hinted !== 'boolean') return null;
  const byId = new Map(pool.map(q=>[q.id,q]));
  if(raw.ids.some(id=>!byId.has(id)) || (raw.guess !== null && !validCoordinate(raw.guess))) return null;
  const expected = dailyQuestions(pool, date).map(q => q.id);
  if(raw.ids.some((id, index) => id !== expected[index])) return null;
  const results=[];
  for(let i=0;i<raw.results.length;i++) {
    const r=raw.results[i];if(!r||r.id!==raw.ids[i]||!validCoordinate(r.guess)||typeof r.hinted!=='boolean')return null;
    results.push({id:r.id,guess:r.guess,hinted:r.hinted,...scoreGuess(r.guess,byId.get(r.id).coords,r.hinted)});
  }
  if((raw.phase==='reveal'&&results.length===0)||(raw.phase==='complete'&&results.length!==ROUND_SIZE)||(raw.phase==='guess'&&results.length===ROUND_SIZE))return null;
  return {...raw,results};
}
export function completeGuess(round,question) {
  if(round.phase!=='guess'||!validCoordinate(round.guess)||round.results.length>=ROUND_SIZE||question.id!==round.ids[round.results.length])throw new Error('Place a pin on the current question first.');
  const result={id:question.id,guess:[...round.guess],hinted:round.hinted,...scoreGuess(round.guess,question.coords,round.hinted)};
  return {...round,phase:'reveal',results:[...round.results,result]};
}
export function advanceRound(round) {
  if(round.phase!=='reveal')throw new Error('Reveal the current answer first.');
  return {...round,phase:round.results.length===ROUND_SIZE?'complete':'guess',guess:null,hinted:false};
}
export const totalPoints = round => round.results.reduce((sum,r)=>sum+r.points,0);
