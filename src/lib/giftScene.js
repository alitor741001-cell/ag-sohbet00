// Hediye gönderildiğinde oynayan sahne: her hediye kimliğinden sabit üretilir,
// böylece aynı hediye her seferinde aynı sahneyle uçar.

const SCENES = ['rocket', 'boat', 'plane', 'balloon', 'car', 'fireworks', 'heart', 'rose', 'galaxy', 'castle'];

// Adı belirli bir hediyeye benzeyen hediyeler kendi sahnesini alır: kalp atar, gül döner,
// galaksi döner, şato ışıldar, araba yolda geçer, roket fırlar, havai fişek patlar.
const NAMED = [
  [/havai fişek|firework/i, 'fireworks'],
  [/galaksi|galaxy/i, 'galaxy'],
  [/şato|kale|saray|castle/i, 'castle'],
  [/araba|car/i, 'car'],
  [/roket|rocket/i, 'rocket'],
  [/gül|rose/i, 'rose'],
  [/kalp|heart/i, 'heart'],
];

const hash = (value) => {
  const text = String(value || '');
  let total = 0;
  for (let index = 0; index < text.length; index += 1) {
    total = (total * 33 + text.charCodeAt(index)) % 99991;
  }
  return total;
};

/** Hediye için sahne anahtarı: rocket | boat | plane | balloon | car | fireworks | heart | rose | galaxy | castle */
export function giftScene(gift) {
  const name = String(gift?.name || '');
  const named = NAMED.find(([pattern]) => pattern.test(name));
  if (named) return named[1];
  const seed = hash(gift?.id || gift?.name || gift?.emoji || 'gift');
  return SCENES[seed % SCENES.length];
}