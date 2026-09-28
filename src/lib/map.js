import {geoNaturalEarth1,geoPath,geoInterpolate} from 'd3-geo';
import {validCoordinate} from './game.js';

const reduceMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ease=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2;
const frame=(duration,step)=>new Promise(resolve=>{
  if(reduceMotion()||duration<=0){step(1);resolve();return}
  const start=performance.now();
  const tick=()=>{const t=Math.min(1,(performance.now()-start)/duration);step(t);if(t<1)frame.id=requestAnimationFrame(tick);else resolve()};
  frame.id=requestAnimationFrame(tick);
});

export function createWorldMap({onGuess}) {
  const $=id=>document.getElementById(id), svg=$('world-map');
  const projection=geoNaturalEarth1().scale(177).translate([480,235]);
  const path=geoPath(projection);
  const labels=[...svg.querySelectorAll('.map-label')].map(el=>({el,x:+el.dataset.x,y:+el.dataset.y,zoom:+el.dataset.zoom}));
  let scale=1,tx=0,ty=0,guess=null,answer=null,locked=false,motion=0,finishReveal=null;
  const pointers=new Map();let drag=null,pinch=null,moved=false;
  const point=(x,y)=>{const p=svg.createSVGPoint();p.x=x;p.y=y;return p.matrixTransform(svg.getScreenCTM().inverse())};
  const position=(element,coords)=>{if(!coords){element.setAttribute('hidden','');return}const [x,y]=projection(coords);element.removeAttribute('hidden');element.setAttribute('transform',`translate(${x},${y}) scale(${1/scale})`)};
  function update(){
    tx=Math.max(-960*(scale-1)-240,Math.min(240,tx));ty=Math.max(-470*(scale-1)-160,Math.min(160,ty));
    $('map-transform').setAttribute('transform',`translate(${tx},${ty}) scale(${scale})`);
    position($('guess-marker'),guess);position($('answer-marker'),answer);
    // Map labels keep a constant on-screen size; country names appear progressively as the map zooms in.
    for(const label of labels){const show=scale>=label.zoom;label.el.style.display=show?'':'none';if(show)label.el.setAttribute('transform',`translate(${label.x},${label.y}) scale(${1/scale})`)}
  }
  // Any gesture stops camera motion; an interrupted reveal completes instantly instead of hanging.
  const stop=()=>{motion++;cancelAnimationFrame(frame.id);const finish=finishReveal;finishReveal=null;finish?.()};
  const setView=view=>{scale=view.scale;tx=view.tx;ty=view.ty};
  // Smoothly move the camera; a new gesture or render interrupts it.
  async function flyTo(view,duration=700){
    const ticket=++motion,from={scale,tx,ty};
    await frame(duration,t=>{if(ticket!==motion)return;const k=ease(t);scale=from.scale+(view.scale-from.scale)*k;tx=from.tx+(view.tx-from.tx)*k;ty=from.ty+(view.ty-from.ty)*k;update()});
    return ticket===motion;
  }
  // Frame a set of coordinates, zooming in further when they are close together.
  function viewOf(points){
    const xy=points.map(c=>projection(c)),xs=xy.map(p=>p[0]),ys=xy.map(p=>p[1]);
    const [x0,x1,y0,y1]=[Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)];
    const next=Math.min(5,Math.max(1,Math.min(960/((x1-x0)*1.8+110),470/((y1-y0)*1.8+90))));
    return {scale:next,tx:480-(x0+x1)/2*next,ty:235-(y0+y1)/2*next};
  }
  const world={scale:1,tx:0,ty:0};
  function reset(){stop();setView(world);update()}
  function zoom(factor,x=480,y=235){stop();const next=Math.min(10,Math.max(1,scale*factor));tx=x-(x-tx)*next/scale;ty=y-(y-ty)*next/scale;scale=next;if(scale===1){tx=0;ty=0}update()}
  function ripple(coords){
    if(reduceMotion())return;
    const ns='http://www.w3.org/2000/svg',[x,y]=projection(coords),ring=document.createElementNS(ns,'g'),circle=document.createElementNS(ns,'circle');
    ring.setAttribute('class','tap-ripple');ring.setAttribute('transform',`translate(${x},${y}) scale(${1/scale})`);circle.setAttribute('r','14');
    ring.append(circle);$('map-transform').append(ring);setTimeout(()=>ring.remove(),700);
  }
  function closeCoordinates(){$('coordinates-form').hidden=true;$('coordinates-toggle').setAttribute('aria-expanded','false')}
  function place(coords){if(locked||!validCoordinate(coords))return false;guess=coords;position($('guess-marker'),guess);ripple(coords);$('map-instruction').hidden=true;onGuess([...coords]);return true}
  function toggleCoordinates(){if(locked)return;const show=$('coordinates-form').hidden;$('coordinates-form').hidden=!show;$('coordinates-toggle').setAttribute('aria-expanded',String(show));if(show)$('latitude').focus()}
  svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;stop();svg.setPointerCapture(e.pointerId);const p=point(e.clientX,e.clientY);pointers.set(e.pointerId,p);if(pointers.size===1){drag={x:p.x,y:p.y,tx,ty};moved=false}else if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(b.x-a.x,b.y-a.y),scale,cx:(a.x+b.x)/2,cy:(a.y+b.y)/2,tx,ty};moved=true}});
  svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=point(e.clientX,e.clientY);pointers.set(e.pointerId,p);if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];const next=Math.min(10,Math.max(1,pinch.scale*Math.hypot(b.x-a.x,b.y-a.y)/Math.max(pinch.distance,1)));tx=(a.x+b.x)/2-(pinch.cx-pinch.tx)*next/pinch.scale;ty=(a.y+b.y)/2-(pinch.cy-pinch.ty)*next/pinch.scale;scale=next;update()}else if(pointers.size===1&&drag){if(Math.hypot(p.x-drag.x,p.y-drag.y)>5)moved=true;if(moved){tx=drag.tx+p.x-drag.x;ty=drag.ty+p.y-drag.y;update()}}});
  function release(e,cancel=false){if(!pointers.has(e.pointerId))return;if(!cancel&&!moved&&pointers.size===1&&!locked){const p=point(e.clientX,e.clientY);const coords=projection.invert([(p.x-tx)/scale,(p.y-ty)/scale]);if(validCoordinate(coords)){const projected=projection(coords);if(Math.hypot(projected[0]-(p.x-tx)/scale,projected[1]-(p.y-ty)/scale)<2)place(coords)}}pointers.delete(e.pointerId);pinch=null;drag=null;if(pointers.size===1){const p=[...pointers.values()][0];drag={x:p.x,y:p.y,tx,ty};moved=true}}
  svg.addEventListener('pointerup',e=>release(e));svg.addEventListener('pointercancel',e=>release(e,true));
  svg.addEventListener('wheel',e=>{e.preventDefault();const p=point(e.clientX,e.clientY);zoom(e.deltaY<0?1.14:1/1.14,p.x,p.y)},{passive:false});
  svg.addEventListener('keydown',e=>{const deltas={ArrowLeft:[30,0],ArrowRight:[-30,0],ArrowUp:[0,30],ArrowDown:[0,-30]};if(deltas[e.key]){e.preventDefault();stop();tx+=deltas[e.key][0];ty+=deltas[e.key][1];update()}else if(['+','=','-','Enter',' '].includes(e.key)){e.preventDefault();if(['Enter',' '].includes(e.key))toggleCoordinates();else zoom(e.key==='-'?1/1.5:1.5)}});
  $('zoom-in').onclick=()=>zoom(1.5);$('zoom-out').onclick=()=>zoom(1/1.5);$('reset-map').onclick=()=>flyTo(world,450);
  $('coordinates-toggle').onclick=toggleCoordinates;
  $('coordinates-form').onsubmit=e=>{e.preventDefault();if(place([Number($('longitude').value),Number($('latitude').value)])){closeCoordinates();$('submit').focus()}};

  // Reveal: fly to frame both pins, draw the great-circle "pass" from guess to answer, then drop the answer pin.
  function land(pin,target,onLanded,drop=true){
    answer=target;update();
    $('connection').setAttribute('d',path({type:'LineString',coordinates:[pin,target]}));
    const marker=$('answer-marker');marker.classList.remove('landing');if(drop){void marker.getBBox();marker.classList.add('landing')}
    onLanded?.();
  }
  async function reveal(pin,target,onLanded){
    const ticket=motion+1,along=geoInterpolate(pin,target);
    finishReveal=()=>land(pin,target,onLanded);
    if(!await flyTo(viewOf([pin,target]),750))return;
    await frame(650,t=>{if(ticket===motion)$('connection').setAttribute('d',path({type:'LineString',coordinates:[pin,along(ease(t))]}))});
    if(ticket!==motion)return;
    finishReveal=null;land(pin,target,onLanded);
  }
  return {
    // animate: 'reveal' plays the guess-to-answer sequence, 'next' flies back out to the whole world.
    render({pin=null,target=null,revealed=false,animate=null,onLanded}={}){
      finishReveal=null;stop();guess=pin;answer=null;locked=revealed;closeCoordinates();
      $('map-instruction').hidden=!!guess||revealed;$('map-legend').hidden=!revealed;$('coordinates-toggle').disabled=revealed;
      $('connection').setAttribute('d','');$('answer-marker').classList.remove('landing');
      if(!revealed){if(animate==='next')flyTo(world,600);else{scale=1;tx=0;ty=0;update()}return}
      if(animate==='reveal'&&!reduceMotion()){update();reveal(pin,target,onLanded);return}
      setView(viewOf([pin,target]));land(pin,target,animate==='reveal'?onLanded:null,animate==='reveal');
    },
    clear:()=>{guess=null;answer=null;locked=false;reset()},
  };
}
