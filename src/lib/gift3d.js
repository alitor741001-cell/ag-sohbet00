// Hediyenin 3D model türü: önce kayıttaki model_kind, yoksa hediye adından çıkarılır.
// Böylece katalogdaki tüm hediyeler ek veri girilmeden de gerçek 3D önizlemeye sahip olur.

const RULES = [
  [/buket|bouquet/i, 'bouquet'],
  [/kalp|heart/i, 'heart'],
  [/gül|rose/i, 'rose'],
  [/yüzük|ring/i, 'ring'],
  [/ayı|bear/i, 'bear'],
  [/araba|car/i, 'car'],
  [/elmas|diamond/i, 'diamond'],
  [/şato|kale|villa|saray|castle/i, 'castle'],
  [/taç|crown/i, 'crown'],
  [/roket|rocket/i, 'rocket'],
  [/galaksi|galaxy/i, 'galaxy'],
  [/kutu|box/i, 'giftbox'],
  [/çikolata|chocolate/i, 'chocolate'],
  [/mektup|letter/i, 'letter'],
  [/pasta|cake/i, 'cake'],
  [/yıldız|star/i, 'star'],
  [/kupa|trophy/i, 'trophy'],
  [/havai fişek|firework/i, 'fireworks'],
  [/jet|uçak|plane/i, 'jet'],
  [/yat|gemi|boat/i, 'yacht'],
  [/ada|island/i, 'island'],
  [/kelebek|butterfly/i, 'butterfly'],
  [/saat|watch/i, 'watch'],
  [/külçe|ingot/i, 'ingot'],
  [/asa|wand/i, 'wand'],
];

/** Hediye için 3D model türü (ör. heart, rocket). */
export function giftModelKind(gift) {
  const declared = String(gift?.model_kind || '');
  if (declared && declared !== 'auto') return declared;
  const name = String(gift?.name || '');
  const rule = RULES.find(([pattern]) => pattern.test(name));
  return rule ? rule[1] : 'giftbox';
}

/** Gerçek GLB/GLTF dosyası yüklü mü? Yüklü değilse önizleme temsili 3D geometridir. */
export function hasRealModel(gift) {
  return !!String(gift?.model_url || '').trim();
}

export const MODEL_KIND_LABEL = {
  heart: 'Kalp',
  rose: 'Gül',
  bouquet: 'Çiçek buketi',
  ring: 'Yüzük',
  bear: 'Ayıcık',
  car: 'Spor araba',
  diamond: 'Elmas',
  castle: 'Şato',
  crown: 'Taç',
  rocket: 'Roket',
  galaxy: 'Galaksi',
  giftbox: 'Hediye kutusu',
  chocolate: 'Çikolata',
  letter: 'Mektup',
  cake: 'Pasta',
  star: 'Yıldız',
  trophy: 'Kupa',
  fireworks: 'Havai fişek',
  jet: 'Özel jet',
  yacht: 'Yat',
  island: 'Ada',
  butterfly: 'Kelebek',
  watch: 'Saat',
  ingot: 'Külçe',
  wand: 'Asa',
};