// Roket çakılma sesi: tur bittiği an tek bir patlama çalar.
// Aynı tur için ikinci kez çalınmaz; oyun ekranı ve oda aynı sesi paylaşır.
let ctx = null;
let noiseBuffer = null;
let lastRound = null;
let lastAt = 0;

function context() {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Tarayıcı sesi ilk dokunuştan sonra açar; odadayken bir kez çağrılır. */
export function unlockRocketSound() {
  context();
}

function noise(audio) {
  if (noiseBuffer) return noiseBuffer;
  const length = Math.floor(audio.sampleRate * 1.2);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  noiseBuffer = buffer;
  return buffer;
}

/** Patlama: kısa çatlak, gürültü gövdesi ve alçalan bas vuruş. */
export function playRocketCrash(roundNo) {
  const now = Date.now();
  if (roundNo != null && lastRound === roundNo && now - lastAt < 4000) return;
  if (now - lastAt < 700) return;
  lastRound = roundNo ?? lastRound;
  lastAt = now;
  const audio = context();
  if (!audio) return;
  const t = audio.currentTime;

  const body = audio.createBufferSource();
  body.buffer = noise(audio);
  const lowpass = audio.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1600, t);
  lowpass.frequency.exponentialRampToValueAtTime(180, t + 0.9);
  const bodyGain = audio.createGain();
  bodyGain.gain.setValueAtTime(0.45, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  body.connect(lowpass).connect(bodyGain).connect(audio.destination);
  body.start(t);
  body.stop(t + 1.2);

  const boom = audio.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(150, t);
  boom.frequency.exponentialRampToValueAtTime(35, t + 0.7);
  const boomGain = audio.createGain();
  boomGain.gain.setValueAtTime(0.5, t);
  boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  boom.connect(boomGain).connect(audio.destination);
  boom.start(t);
  boom.stop(t + 0.95);

  const crack = audio.createOscillator();
  crack.type = 'square';
  crack.frequency.setValueAtTime(900, t);
  crack.frequency.exponentialRampToValueAtTime(120, t + 0.18);
  const crackGain = audio.createGain();
  crackGain.gain.setValueAtTime(0.12, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  crack.connect(crackGain).connect(audio.destination);
  crack.start(t);
  crack.stop(t + 0.22);
}