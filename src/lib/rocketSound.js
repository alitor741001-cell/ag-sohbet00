// Roket sesleri: oyun çakılması, hediye roketinin uçuşu ve parlaması.
// Tur başına tek patlama çalar; oyun ekranı ve oda aynı ses kaynağını paylaşır.
let ctx = null;
let crashBuffer = null;
let engineBuffer = null;
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

function crashNoise(audio) {
  if (crashBuffer) return crashBuffer;
  const length = Math.floor(audio.sampleRate * 1.2);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
  crashBuffer = buffer;
  return buffer;
}

function engineNoise(audio) {
  if (engineBuffer) return engineBuffer;
  const length = Math.floor(audio.sampleRate);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  engineBuffer = buffer;
  return buffer;
}

/** Patlama: kısa çatlak, gürültü gövdesi ve alçalan bas vuruş. */
export function playRocketCrash(roundNo, volume = 1) {
  const now = Date.now();
  if (roundNo != null && lastRound === roundNo && now - lastAt < 4000) return;
  if (now - lastAt < 700) return;
  lastRound = roundNo ?? lastRound;
  lastAt = now;
  const audio = context();
  if (!audio) return;
  const t = audio.currentTime;

  const body = audio.createBufferSource();
  body.buffer = crashNoise(audio);
  const lowpass = audio.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(1600, t);
  lowpass.frequency.exponentialRampToValueAtTime(180, t + 0.9);
  const bodyGain = audio.createGain();
  bodyGain.gain.setValueAtTime(0.45 * volume, t);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
  body.connect(lowpass).connect(bodyGain).connect(audio.destination);
  body.start(t);
  body.stop(t + 1.2);

  const boom = audio.createOscillator();
  boom.type = 'sine';
  boom.frequency.setValueAtTime(150, t);
  boom.frequency.exponentialRampToValueAtTime(35, t + 0.7);
  const boomGain = audio.createGain();
  boomGain.gain.setValueAtTime(0.5 * volume, t);
  boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  boom.connect(boomGain).connect(audio.destination);
  boom.start(t);
  boom.stop(t + 0.95);

  const crack = audio.createOscillator();
  crack.type = 'square';
  crack.frequency.setValueAtTime(900, t);
  crack.frequency.exponentialRampToValueAtTime(120, t + 0.18);
  const crackGain = audio.createGain();
  crackGain.gain.setValueAtTime(0.12 * volume, t);
  crackGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  crack.connect(crackGain).connect(audio.destination);
  crack.start(t);
  crack.stop(t + 0.22);
}

// Hediye roketinin görsel animasyonu 4.6 saniye sürer; parlama %63'te başlar.
const FLIGHT_SECONDS = 2.95;

/**
 * Hediye roketi havalanırken motor sesi duyulur, parlama anında patlama çalar.
 * Dönen nesneyle ses erken kesilebilir.
 */
export function playRocketLaunchSound() {
  const audio = context();
  if (!audio) return { stop() {} };
  const t = audio.currentTime;
  const end = t + FLIGHT_SECONDS;

  const thrust = audio.createBufferSource();
  thrust.buffer = engineNoise(audio);
  thrust.loop = true;
  const band = audio.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.setValueAtTime(1.2, t);
  band.frequency.setValueAtTime(220, t);
  band.frequency.exponentialRampToValueAtTime(1700, end);
  const thrustGain = audio.createGain();
  thrustGain.gain.setValueAtTime(0.0001, t);
  thrustGain.gain.exponentialRampToValueAtTime(0.24, t + 0.25);
  thrustGain.gain.setValueAtTime(0.24, t + FLIGHT_SECONDS - 0.7);
  thrustGain.gain.exponentialRampToValueAtTime(0.001, end);
  thrust.connect(band).connect(thrustGain).connect(audio.destination);
  thrust.start(t);
  thrust.stop(end + 0.05);

  const rumble = audio.createOscillator();
  rumble.type = 'sawtooth';
  rumble.frequency.setValueAtTime(55, t);
  rumble.frequency.linearRampToValueAtTime(120, end);
  const rumbleFilter = audio.createBiquadFilter();
  rumbleFilter.type = 'lowpass';
  rumbleFilter.frequency.value = 320;
  const rumbleGain = audio.createGain();
  rumbleGain.gain.setValueAtTime(0.0001, t);
  rumbleGain.gain.exponentialRampToValueAtTime(0.18, t + 0.3);
  rumbleGain.gain.setValueAtTime(0.18, t + FLIGHT_SECONDS - 0.7);
  rumbleGain.gain.exponentialRampToValueAtTime(0.001, end);
  rumble.connect(rumbleFilter).connect(rumbleGain).connect(audio.destination);
  rumble.start(t);
  rumble.stop(end + 0.05);

  // Parlama anı: görseldeki patlamayla aynı anda, daha güçlü bir patlama.
  const timer = setTimeout(() => playRocketCrash(null, 1.6), FLIGHT_SECONDS * 1000);

  return {
    stop() {
      clearTimeout(timer);
      try {
        thrust.stop();
        rumble.stop();
      } catch {
        // Ses zaten bitmiş olabilir.
      }
      thrustGain.disconnect();
      rumbleGain.disconnect();
    },
  };
}