// ŞEKERLİ MEYVE ses efektleri: tarayıcıda sentezlenir, ayrı ses dosyası yoktur.
// Ses kapalıysa hiç çağrılmaz; tarayıcı ses bağlamı ilk dokunuşta açılır.

let ctx = null;
let master = null;

function context() {
  if (typeof window === 'undefined') return null;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  if (!ctx) {
    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** İlk kullanıcı dokunuşunda ses bağlamını hazırlar. */
export function unlockAudio() {
  context();
}

function tone(freq, duration, { type = 'sine', gain = 0.06, delay = 0, glideTo = 0 } = {}) {
  const audio = context();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(env).connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function noise(duration, { gain = 0.05, delay = 0, from = 2200, to = 400 } = {}) {
  const audio = context();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const frames = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, frames, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(from, start);
  filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  const env = audio.createGain();
  env.gain.setValueAtTime(gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter).connect(env).connect(master);
  src.start(start);
}

export const sekerliSound = {
  spin() {
    noise(0.42, { gain: 0.05, from: 2600, to: 500 });
    tone(220, 0.3, { type: 'triangle', gain: 0.05, glideTo: 620 });
  },
  stop(index = 0) {
    tone(760 + index * 70, 0.07, { type: 'square', gain: 0.035 });
    noise(0.07, { gain: 0.03, from: 1400, to: 300 });
  },
  pop() {
    noise(0.16, { gain: 0.06, from: 1800, to: 200 });
    tone(320, 0.12, { type: 'triangle', gain: 0.045, glideTo: 120 });
  },
  win(multiplier = 1) {
    const notes = multiplier >= 5 ? [660, 880, 1175, 1568] : [660, 880, 1175];
    notes.forEach((freq, index) => tone(freq, 0.22, { type: 'triangle', gain: 0.06, delay: index * 0.085 }));
  },
  big() {
    [523, 659, 784, 1047, 1319].forEach((freq, index) =>
      tone(freq, 0.32, { type: 'sawtooth', gain: 0.05, delay: index * 0.12 }));
    [1047, 1319, 1568].forEach((freq) =>
      tone(freq, 0.9, { type: 'triangle', gain: 0.045, delay: 0.62 }));
    noise(0.7, { gain: 0.04, from: 3200, to: 900, delay: 0.6 });
  },
  free() {
    [523, 659, 784, 1047, 1319, 1568].forEach((freq, index) =>
      tone(freq, 0.28, { type: 'triangle', gain: 0.055, delay: index * 0.075 }));
    noise(0.5, { gain: 0.035, from: 2800, to: 1200, delay: 0.1 });
  },
  click() {
    tone(880, 0.05, { type: 'square', gain: 0.028 });
  },
};