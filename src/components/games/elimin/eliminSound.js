// ELİMİNSLOT sesleri tarayıcıda üretilir: dosya indirilmez, Web Audio ile çalınır.

let ctx = null;

/** İlk dokunuşta ses motoru açılır (mobil tarayıcılar kullanıcı etkileşimi bekler). */
export function unlockAudio() {
  try {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (error) {
    return null;
  }
}

/** Kısa bir ton: frekans, süre, dalga biçimi ve ses seviyesi. */
function tone(frequency, duration, type = 'sine', volume = 0.16, delay = 0) {
  const audio = unlockAudio();
  if (!audio) return;
  const start = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

export const eliminSound = {
  // Tur: makaraların akışı boyunca kısa bir tık.
  spin() {
    tone(320, 0.12, 'triangle', 0.09);
    tone(240, 0.16, 'triangle', 0.06, 0.06);
  },
  // Semboller yerine otururken ince bir vuruş.
  landing() {
    tone(520, 0.1, 'square', 0.05);
  },
  // Kazanç: üç notalı parlak akor.
  win() {
    tone(660, 0.14, 'sine', 0.14);
    tone(880, 0.16, 'sine', 0.12, 0.09);
    tone(1180, 0.2, 'sine', 0.1, 0.18);
  },
  // Altın muz bonusu: yükselen dizi.
  bonus() {
    [520, 660, 780, 1040].forEach((note, index) => tone(note, 0.16, 'triangle', 0.12, index * 0.09));
  },
  // Büyük kazanç: kalın ve parlak kutlama.
  bigWin() {
    [400, 500, 640, 820, 1040].forEach((note, index) => tone(note, 0.24, 'sawtooth', 0.09, index * 0.08));
  },
};