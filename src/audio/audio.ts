// Sav zvuk je sintetizovan u kodu (WebAudio) — bez eksternih fajlova i licenci.
// Muzika: Karplus–Strong "tambura" (trzana žica) u harmonijskom molu, tri teme.

let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxVol = 0.8, musicVol = 0.5;

export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') void ctx.resume(); return; }
  try {
    ctx = new AudioContext();
    sfxGain = ctx.createGain(); sfxGain.gain.value = sfxVol; sfxGain.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = musicVol * 0.35; musicGain.connect(ctx.destination);
  } catch { ctx = null; }
}

export function setVolumes(sfx: number, music: number) {
  sfxVol = sfx; musicVol = music;
  if (sfxGain) sfxGain.gain.value = sfx;
  if (musicGain && ctx) musicGain.gain.setTargetAtTime(music * 0.35, ctx.currentTime, 0.1);
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.2, when = 0, slide = 0) {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime + when;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(sfxGain); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur: number, vol = 0.2, filter = 2000, when = 0, q = 1) {
  if (!ctx || !sfxGain) return;
  const t = ctx.currentTime + when;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filter; f.Q.value = q;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(f).connect(g).connect(sfxGain); src.start(t);
}

export const sfx = {
  card() { noise(0.07, 0.25, 3200, 0, 0.8); },
  select() { tone(880, 0.05, 'triangle', 0.08); },
  deselect() { tone(600, 0.05, 'triangle', 0.06); },
  /** brojanje chipsa: ton raste s brojem koraka */
  chips(step: number) { tone(330 * Math.pow(2, Math.min(step, 24) / 12), 0.09, 'square', 0.06); },
  mult(step: number) { tone(220 * Math.pow(2, Math.min(step, 24) / 12), 0.14, 'sawtooth', 0.08); tone(110, 0.12, 'sine', 0.15); },
  xmult() { tone(110, 0.3, 'sawtooth', 0.12, 0, 0.5); tone(165, 0.3, 'square', 0.06); noise(0.15, 0.2, 200); },
  total(size: number) { const v = Math.min(0.3, 0.1 + size * 0.03); tone(523, 0.25, 'triangle', v); tone(659, 0.25, 'triangle', v, 0.06); tone(784, 0.35, 'triangle', v, 0.12); },
  glass() { noise(0.35, 0.3, 6000, 0, 4); tone(2600, 0.3, 'sine', 0.05, 0, 0.6); },
  cash() { tone(1318, 0.12, 'square', 0.06); tone(1760, 0.25, 'triangle', 0.08, 0.07); },
  coin() { tone(1568, 0.06, 'square', 0.05); tone(2093, 0.12, 'triangle', 0.06, 0.05); },
  error() { tone(140, 0.18, 'sawtooth', 0.08); },
  lay() { noise(0.09, 0.25, 900, 0, 0.6); tone(150, 0.08, 'sine', 0.12); },
  buy() { tone(784, 0.08, 'triangle', 0.1); tone(1046, 0.15, 'triangle', 0.1, 0.07); },
  pop() { tone(500, 0.06, 'sine', 0.15, 0, 2.2); },
  tabla() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.4, 'triangle', 0.12, i * 0.07));
    for (let i = 0; i < 14; i++) noise(0.06, 0.12, 2500 + Math.random() * 2500, 0.35 + i * 0.045 + Math.random() * 0.03, 0.7);
  },
  win() { [392, 523, 659, 784].forEach((f, i) => tone(f, 0.3, 'triangle', 0.12, i * 0.1)); },
  lose() { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.07, i * 0.18)); },
  boss() { tone(98, 0.8, 'sawtooth', 0.1, 0, 0.7); tone(147, 0.8, 'square', 0.05); },
};

// ---------- muzika ----------
function pluck(freq: number, when: number, dur: number, vol: number) {
  if (!ctx || !musicGain) return;
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  let idx = 0;
  for (let i = 0; i < len; i++) {
    const a = ring[idx]!, b = ring[(idx + 1) % period]!;
    const v = 0.498 * (a + b);
    ring[idx] = v;
    d[i] = v;
    idx = (idx + 1) % period;
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(g).connect(musicGain);
  src.start(ctx.currentTime + when);
}

type Theme = 'menu' | 'game' | 'boss';
const THEMES: Record<Theme, { bpm: number; root: number; prog: number[][]; mel: number[] }> = {
  // stupnjevi harmonijskog mola (0 = tonika), -1 = pauza
  menu: { bpm: 92, root: 220, prog: [[0, 3, 7], [5, 8, 12], [7, 11, 14], [0, 3, 7]], mel: [7, 8, 7, 5, 3, 5, 3, 2, 0, -1, 2, 3, 5, 3, 2, -1] },
  game: { bpm: 112, root: 196, prog: [[0, 3, 7], [0, 3, 7], [5, 8, 12], [7, 11, 14]], mel: [0, 3, 5, 7, 8, 7, 5, 3, 5, 7, 11, 12, 11, 8, 7, -1] },
  boss: { bpm: 132, root: 174.6, prog: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [7, 11, 13]], mel: [12, 11, 8, 7, 8, 7, 5, 3, 1, 3, 5, 7, 8, 7, 1, 0] },
};
let timer: number | null = null;
let current: Theme | null = null;

export function playMusic(theme: Theme) {
  if (!ctx || current === theme) return;
  stopMusic();
  current = theme;
  const th = THEMES[theme];
  const beat = 60 / th.bpm / 2;
  let step = 0;
  const semi = (n: number) => th.root * Math.pow(2, n / 12);
  const tick = () => {
    if (!ctx || current !== theme) return;
    // planiraj jedan takt (8 osmina) unaprijed
    for (let i = 0; i < 8; i++) {
      const s = step + i;
      const chord = th.prog[Math.floor(s / 8) % th.prog.length]!;
      const when = i * beat;
      if (i % 2 === 0) pluck(semi(chord[0]! - 12), when, 1.2, 0.5);
      else pluck(semi(chord[1 + (i >> 1) % 2]!), when, 0.6, 0.25);
      const m = th.mel[s % th.mel.length]!;
      if (m >= 0 && i % 2 === 0) pluck(semi(m + 12), when + (Math.random() * 0.01), 0.8, 0.32);
      if (m >= 0 && i % 4 === 3) pluck(semi(m + 12), when, 0.25, 0.15); // tremolo
    }
    step += 8;
    timer = window.setTimeout(tick, beat * 8 * 1000 - 20);
  };
  tick();
}

export function stopMusic() {
  if (timer !== null) clearTimeout(timer);
  timer = null;
  current = null;
}
