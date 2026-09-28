import {createIcons,ChartNoAxesColumnIncreasing,CircleHelp,Trophy,Flag,MousePointer2,Plus,Minus,Maximize,LocateFixed,Check,MapPin,ArrowRight,Lightbulb,RotateCcw,X,Copy,Share2,Download,MessageCircle,CalendarDays,Volume2,VolumeX} from 'lucide';
import {createSharing} from './lib/share-ui.js';
import {scoreBand} from './lib/share.js';
import {createSound} from './lib/sound.js';
import {questions} from './data/questions.js';
import {dailyQuestions,dayKey,newRound,validateRound,completeGuess,advanceRound,totalPoints,practiceQuestions,matchdayNumber,streaks} from './lib/game.js';
import {createWorldMap} from './lib/map.js';
const icons={ChartNoAxesColumnIncreasing,CircleHelp,Trophy,Flag,MousePointer2,Plus,Minus,Maximize,LocateFixed,Check,MapPin,ArrowRight,Lightbulb,RotateCcw,X,Copy,Share2,Download,MessageCircle,CalendarDays,Volume2,VolumeX};
const $=id=>document.getElementById(id),text=(id,value)=>$(id).textContent=value,fmt=n=>Math.round(n).toLocaleString('en-US');
const renderIcons=()=>createIcons({icons});renderIcons();
const sharing=createSharing(),sound=createSound();
const storage={read(key){try{return JSON.parse(localStorage.getItem(key))}catch{return null}},write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}};
const byId=new Map(questions.map(q=>[q.id,q]));let activeDate=dayKey(),mode='daily',practice=null,toastTimer,countdownTimer;
let daily=validateRound(storage.read('geo-football-daily-v1'),questions,activeDate)||newRound(dailyQuestions(questions,activeDate),activeDate);
let round=daily;
let storageNoticeShown=false;
// One tap locks a guess in unless the player asks to confirm first.
const settings={confirm:false,...storage.read('geo-football-settings-v1')};
function toast(message){clearTimeout(toastTimer);text('toast',message);$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,4000)}
function persist(){if(mode==='daily'){daily=round;if(!storage.write('geo-football-daily-v1',daily)&&!storageNoticeShown){storageNoticeShown=true;toast('Progress cannot be saved in this browser. You can still play.')}}else practice=round}
const currentIndex=()=>round.phase==='guess'?round.results.length:Math.max(0,round.results.length-1);
const currentQuestion=()=>byId.get(round.ids[currentIndex()]);
const history=()=>{const raw=storage.read('geo-football-history-v1');return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{}};
const map=createWorldMap({onGuess(coords){if(round.phase!=='guess')return;round={...round,guess:coords};persist();sound.pin();renderPin();if(!settings.confirm)lockIn()}});
function renderPin(){const pin=round.guess;const revealed=round.phase!=='guess';$('submit').disabled=!revealed&&!pin;document.querySelector('.pin-state').classList.toggle('placed',!!pin||revealed);if(revealed)text('pin-status',round.phase==='complete'?'Full-time. Nicely played.':'Answer revealed. Ready for the next one?');else text('pin-status',pin?`${Math.abs(pin[1]).toFixed(1)}° ${pin[1]>=0?'N':'S'} · ${Math.abs(pin[0]).toFixed(1)}° ${pin[0]>=0?'E':'W'} — ready to lock in`:settings.confirm?'Choose a spot on the map':'Tap the map to lock in your guess');if(!revealed)text('submit-label','Lock in guess');document.body.classList.toggle('tap-to-lock',!revealed&&!pin&&!settings.confirm);}
// The scoreboard counts up when a result lands.
function countTo(value){const node=$('total'),from=Number(node.textContent.replace(/,/g,''))||0,start=performance.now();const tick=()=>{const t=Math.min(1,(performance.now()-start)/650);node.textContent=fmt(from+(value-from)*(1-(1-t)**3));if(t<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
function render(animate=null){
 const q=currentQuestion(),index=currentIndex(),revealed=round.phase!=='guess';
 document.body.classList.toggle('revealed',revealed);text('q-number',`QUESTION ${index+1} / 5`);text('sport',q.sport);text('year',q.year);text('question',q.question);
 const number=matchdayNumber(round.date);
 text('round-number',mode==='daily'&&number>=1?`#${number}`:'');text('round-date',mode==='daily'?new Date(round.date+'T12:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}):'Free play');
 text('round-note',mode==='daily'?'Same five questions for everyone · Resets at 00:00 UTC':'Training ground · Practice your football geography');
 for(const name of ['daily','practice']){$(name+'-tab').classList.toggle('active',mode===name);$(name+'-tab').setAttribute('aria-pressed',String(mode===name))}
 [...$('steps').children].forEach((el,i)=>{const done=i<round.results.length;el.className='step'+(done?' done':i===index?' current':'');if(done)el.dataset.band=scoreBand(round.results[i].points);else delete el.dataset.band;el.setAttribute('aria-label',`Question ${i+1}${done?' completed':i===index?' current':''}`)});
 $('hint').hidden=!round.hinted||revealed;text('hint',q.hint);$('hint-button').hidden=revealed;$('hint-button').disabled=round.hinted;$('hint-button').style.opacity=round.hinted?'.5':'1';$('new-practice').hidden=mode!=='practice';
 if(revealed){
  const result=round.results[index],band=scoreBand(result.points);$('reveal').dataset.band=band;text('result-kicker',result.distance<=10?'TOP CORNER. PERFECT PLACEMENT.':{good:'GOAL! GREAT STRIKE',close:'OFF THE POST. SO CLOSE',far:'WIDE OF THE MARK'}[band]);text('answer-city',q.city===q.country?q.city:`${q.city}, ${q.country}`);text('round-points',`+${fmt(result.points)} pts`);text('distance',`${result.distance<1?'<1':fmt(result.distance)} km away`);text('answer-fact',q.fact);
  // A fresh reveal holds the result back until the "pass" reaches the answer pin.
  const landed=()=>{$('reveal').hidden=false;countTo(totalPoints(round));sound.result(band,result.distance<=10);$('reveal').scrollIntoView({behavior:'smooth',block:'nearest'})};
  $('reveal').hidden=animate==='reveal';if(animate!=='reveal')text('total',fmt(totalPoints(round)));
  map.render({pin:result.guess,target:q.coords,revealed:true,animate,onLanded:landed});
 }else{$('reveal').hidden=true;text('total',fmt(totalPoints(round)));map.render({pin:round.guess,animate})}
 if(revealed)text('submit-label',round.phase==='complete'?'View results':round.results.length===5?'See my results':'Next question');renderPin();
}
function lockIn(){if(ensureDate()||round.phase!=='guess'||!round.guess)return;round=completeGuess(round,currentQuestion());persist();sound.lockIn();render('reveal')}
function recordDaily(){if(mode!=='daily'||round.phase!=='complete')return;const saved=history();saved[round.date]=totalPoints(round);const dates=Object.keys(saved).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort().slice(-366);storage.write('geo-football-history-v1',Object.fromEntries(dates.map(d=>[d,saved[d]])));}
function stats(){const saved=history(),scores=Object.values(saved).filter(n=>Number.isFinite(n)&&n>=0&&n<=5000),streak=streaks(saved,dayKey());text('stat-played',scores.length);text('stat-streak',`${streak.current}${streak.current?' 🔥':''}`);text('stat-best-streak',streak.best);text('stat-best',fmt(Math.max(0,...scores)));text('stat-average',scores.length?fmt(scores.reduce((a,b)=>a+b,0)/scores.length):'0');$('stats-dialog').showModal();}
function nextRoundNote(){if(mode!=='daily'){text('next-round-note','Practice scores are separate from your daily stats.');return}const left=Date.parse(`${dayKey()}T00:00:00Z`)+86400000-Date.now(),hours=Math.floor(left/3600000),minutes=Math.floor(left%3600000/60000);text('next-round-note',`Next matchday in ${hours}h ${String(minutes).padStart(2,'0')}m · 00:00 UTC`)}
function resultBar(r,i){
 const q=byId.get(r.id),row=document.createElement('div');row.className='result-bar';row.dataset.band=scoreBand(r.points);row.style.setProperty('--fill',`${Math.max(3,r.points/10)}%`);
 const label=document.createElement('span');label.className='result-q';label.textContent=`Q${i+1}`;
 const place=document.createElement('span');place.className='result-place';place.textContent=q.city;
 const distance=document.createElement('small');distance.textContent=`${r.distance<1?'<1':fmt(r.distance)} km${r.hinted?' · assist':''}`;
 const points=document.createElement('strong');points.textContent=fmt(r.points);
 row.append(label,place,distance,points);return row;
}
function showResults(){recordDaily();const score=totalPoints(round),number=matchdayNumber(round.date),streak=mode==='daily'?streaks(history(),dayKey()):{current:0,best:0};
 text('finish-score',fmt(score));text('finish-mode',mode==='daily'?`FULL-TIME · ${number>=1?`MATCHDAY #${number}`:'DAILY MATCHDAY'}`:'FULL-TIME · TRAINING GROUND');text('finish-title',score>=4000?'World-class instincts.':score>=2500?'A strong performance.':'Every match makes you better.');text('play-again','Back to the training ground');
 $('finish-streak').hidden=!streak.current;text('finish-streak',`🔥 ${streak.current}-day streak${streak.best>streak.current?` · best ${streak.best}`:''}`);
 $('round-results').classList.remove('filled');$('round-results').replaceChildren(...round.results.map(resultBar));
 nextRoundNote();clearInterval(countdownTimer);countdownTimer=setInterval(nextRoundNote,30000);
 sharing.prepare(round,{matchday:mode==='daily'?number:0,streak:streak.current});$('results-dialog').showModal();requestAnimationFrame(()=>requestAnimationFrame(()=>$('round-results').classList.add('filled')));}
$('results-dialog').addEventListener('close',()=>clearInterval(countdownTimer));
function ensureDate(){if(mode!=='daily'||dayKey()===activeDate)return false;activeDate=dayKey();daily=newRound(dailyQuestions(questions,activeDate),activeDate);round=daily;persist();render();toast('A new daily round is ready. It’s midnight UTC.');return true;}
$('submit').onclick=()=>{if(ensureDate())return;if(round.phase==='complete'){showResults();return}if(round.phase==='guess'){lockIn();return}round=advanceRound(round);persist();if(round.phase==='complete'){render();sound.fullTime();showResults()}else{render('next');$('question').focus({preventScroll:true});$('question-panel').scrollIntoView({behavior:'smooth',block:'nearest'})}};
$('hint-button').onclick=()=>{if(ensureDate()||round.phase!=='guess'||round.hinted)return;round={...round,hinted:true};persist();$('hint').hidden=false;text('hint',currentQuestion().hint);$('hint-button').disabled=true;$('hint-button').style.opacity='.5';};
function switchMode(target,fresh=false){if(target===mode&&!fresh)return;persist();mode=target;if(target==='daily'){if(dayKey()!==activeDate){activeDate=dayKey();daily=newRound(dailyQuestions(questions,activeDate),activeDate)}round=daily}else{if(!practice||fresh){const seed=crypto.getRandomValues(new Uint32Array(1))[0];const selection=practiceQuestions(questions,storage.read('geo-football-practice-history-v1'),seed,dailyQuestions(questions,dayKey()).map(q=>q.id));storage.write('geo-football-practice-history-v1',selection.history);practice=newRound(selection.questions,dayKey(),'practice')}round=practice}render();if(round.phase==='complete')showResults();}
$('daily-tab').onclick=()=>switchMode('daily');$('practice-tab').onclick=()=>switchMode('practice');$('new-practice').onclick=()=>$('switch-dialog').showModal();$('confirm-practice').onclick=()=>{$('switch-dialog').close();switchMode('practice',true)};$('play-again').onclick=()=>{$('results-dialog').close();switchMode('practice',true);window.scrollTo({top:0,behavior:'smooth'})};
$('help-button').onclick=()=>$('help-dialog').showModal();$('stats-button').onclick=stats;
const renderSound=()=>{$('sound-button').setAttribute('aria-pressed',String(sound.muted));$('sound-button').setAttribute('aria-label',sound.muted?'Turn sounds on':'Mute sounds')};
$('sound-button').onclick=()=>{sound.muted=!sound.muted;renderSound();if(!sound.muted)sound.pin()};renderSound();
$('confirm-toggle').checked=settings.confirm;$('confirm-toggle').onchange=e=>{settings.confirm=e.target.checked;storage.write('geo-football-settings-v1',settings);renderPin()};
for(const btn of document.querySelectorAll('[data-close]'))btn.onclick=()=>$(btn.dataset.close).close();
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode==='daily')ensureDate()});
render();if(round.phase==='complete')showResults();
