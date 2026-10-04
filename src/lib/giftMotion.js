// Her hediye kendine özel bir hareket ve ışıltı tonu alır: hediye kimliğinden sabit üretilir,
// böylece aynı hediye her zaman aynı şekilde hareket eder.

const MOTIONS = [
  'gift-bounce',
  'gift-float',
  'gift-wiggle',
  'gift-swing',
  'gift-pulse',
  'gift-spin',
  'gift-heartbeat',
  'gift-tilt',
];

const TONES = ['#facc15', '#f472b6', '#38bdf8', '#a78bfa', '#4ade80', '#fb923c'];

const hash = (value) => {
  const text = String(value || '');
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    total = (total * 31 + text.charCodeAt(index)) % 99991;
  }
  return total;
};

/** Hediyenin kendine özel hareket sınıfı ve ışıltı rengi. */
export function giftMotion(gift) {
  const seed = hash(gift?.id || gift?.name || gift?.emoji || 'gift');
  return {
    motion: MOTIONS[seed % MOTIONS.length],
    tone: TONES[Math.floor(seed / 7) % TONES.length],
  };
}