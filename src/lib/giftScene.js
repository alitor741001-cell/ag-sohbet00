// Hediye gönderildiğinde oynayan sahne: her hediye kimliğinden sabit üretilir,
// böylece aynı hediye her seferinde aynı sahneyle uçar.

const SCENES = ['rocket', 'boat', 'plane', 'balloon', 'car', 'fireworks'];

const hash = (value) => {
  const text = String(value || '');
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    total = (total * 33 + text.charCodeAt(index)) % 99991;
  }
  return total;
};

/** Hediye için sahne anahtarı: rocket | boat | plane | balloon | car | fireworks */
export function giftScene(gift) {
  // Adı araba olan hediye her zaman yol sahnesiyle geçer: spor araba gerçekten yolda görünür.
  if (/araba|car/i.test(String(gift?.name || ''))) return 'car';
  const seed = hash(gift?.id || gift?.name || gift?.emoji || 'gift');
  return SCENES[seed % SCENES.length];
}