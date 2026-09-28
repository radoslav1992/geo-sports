// Matchday sounds, synthesised with Web Audio so there are no audio files to download.
// Browsers only allow audio after a user gesture; every sound here follows a tap or click.
const KEY = 'geo-football-sound-v1';

export function createSound() {
  let context = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === 'off'; } catch {}

  const audio = () => {
    if (muted) return null;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    context ||= new Context();
    if (context.state === 'suspended') context.resume();
    return context;
  };
  const vibrate = pattern => { try { if (!muted) navigator.vibrate?.(pattern); } catch {} };

  // One enveloped oscillator; optional pitch slide and vibrato (the referee's pea whistle).
  function tone(ctx, {freq, type = 'sine', at = 0, length = .15, volume = .12, slide, vibrato}) {
    const start = ctx.currentTime + at, osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slide) osc.frequency.exponentialRampToValueAtTime(slide, start + length);
    if (vibrato) {
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = vibrato.rate; depth.gain.value = vibrato.depth;
      lfo.connect(depth).connect(osc.frequency); lfo.start(start); lfo.stop(start + length);
    }
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, start + length);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start); osc.stop(start + length + .02);
  }
  // Filtered noise swell: a short crowd roar for a perfect guess.
  function roar(ctx, at = 0, length = 1.3) {
    const start = ctx.currentTime + at, buffer = ctx.createBuffer(1, ctx.sampleRate * length, ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    noise.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 900; filter.Q.value = .6;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(.14, start + .25);
    gain.gain.exponentialRampToValueAtTime(.0001, start + length);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(start); noise.stop(start + length);
  }
  const whistle = (ctx, at, length) => tone(ctx, {freq: 2750, at, length, volume: .06, vibrato: {rate: 34, depth: 170}});

  return {
    get muted() { return muted; },
    set muted(value) {
      muted = value;
      try { localStorage.setItem(KEY, value ? 'off' : 'on'); } catch {}
    },
    pin() { const ctx = audio(); vibrate(8); if (ctx) tone(ctx, {freq: 520, type: 'triangle', length: .09, volume: .16, slide: 300}); },
    lockIn() { const ctx = audio(); vibrate(15); if (ctx) whistle(ctx, 0, .26); },
    result(band, perfect = false) {
      const ctx = audio();
      vibrate(band === 'far' ? 30 : [20, 40, 20]);
      if (!ctx) return;
      if (band === 'good') {
        [523, 659, 784, 1047].forEach((freq, i) => tone(ctx, {freq, type: 'triangle', at: i * .07, length: .22, volume: .1}));
        if (perfect) roar(ctx, .05);
      } else if (band === 'close') {
        [440, 554].forEach((freq, i) => tone(ctx, {freq, type: 'triangle', at: i * .09, length: .2, volume: .1}));
      } else {
        tone(ctx, {freq: 330, type: 'sine', length: .35, volume: .11, slide: 196});
      }
    },
    fullTime() { const ctx = audio(); vibrate([40, 60, 40, 60, 120]); if (ctx) { whistle(ctx, 0, .22); whistle(ctx, .32, .22); whistle(ctx, .64, .7); } },
  };
}
