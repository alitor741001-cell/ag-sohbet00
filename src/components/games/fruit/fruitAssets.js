// Meyve oyunu görselleri.
const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

// Oyun merkezindeki kapak: altın sandıktan taşan gerçek meyveler.
export const FRUIT_COVER = `${MEDIA_BASE}/e5ba3ee33_generated_image.png`;
export const FRUIT_COVER_WIDTH = 1024;
export const FRUIT_COVER_HEIGHT = 1024;

// Sembol kartları: her meyve kendi kartında, ortada ve bol kenar boşluklu.
export const FRUIT_ART = {
  // Lolipop kartının yerini alan portakal sembolü (referans görselden üretildi).
  lollipop: `${MEDIA_BASE}/e1a05bbe7_generated_image.png`,
  plum: `${MEDIA_BASE}/fcf725055_generated_image.png`,
  // Üzüm kartı (referans görselden üretildi).
  grapes: `${MEDIA_BASE}/effc79a4f_generated_image.png`,
  melon: `${MEDIA_BASE}/f8c19f24e_generated_image.png`,
  apple: `${MEDIA_BASE}/7db26e924_generated_image.png`,
  // Şeker kartının yerini alan çilek sembolü (referans görselden üretildi).
  candy: `${MEDIA_BASE}/7331aba36_generated_image.png`,
  // Kiraz kartı (referans görselden üretildi).
  cherry: `${MEDIA_BASE}/96f2dea41_generated_image.png`,
  banana: `${MEDIA_BASE}/e82024769_generated_image.png`,
};

export const FRUIT_ART_SIZE = 1024;