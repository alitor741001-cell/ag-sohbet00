// DEDE oyunu görselleri.
const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

// Oyun merkezindeki kapak: altın çerçeveli DEDE kapak resmi.
export const DEDE_COVER = `${MEDIA_BASE}/9a29944a2_generated_image.png`;
export const DEDE_COVER_WIDTH = 1024;
export const DEDE_COVER_HEIGHT = 1024;

// Sahnede çerçevenin arkasında duran dede karakteri (siyah zemini tarayıcıda kesilir).
export const DEDE_DEITY = `${MEDIA_BASE}/8484dbf0d_generated_image.png`;

// Sembol kartları: referans tasarımdaki nesneler — taç, mücevher, yüzük, kum saati, kupa, şimşek.
export const DEDE_ART = {
  crown: `${MEDIA_BASE}/8d7a6e6e4_generated_image.png`,
  gem: `${MEDIA_BASE}/3246cbcf2_generated_image.png`,
  ring: `${MEDIA_BASE}/397ab2b52_generated_image.png`,
  hour: `${MEDIA_BASE}/c002a52d5_generated_image.png`,
  chalice: `${MEDIA_BASE}/2b3627645_generated_image.png`,
  bolt: `${MEDIA_BASE}/16e5ed70d_generated_image.png`,
  dede: `${MEDIA_BASE}/55009f411_generated_image.png`,
};

export const DEDE_ART_SIZE = 1024;

// Çarpan madalyonları: kanatlı altın jeton, ortadaki küre değere göre renklenir.
export const DEDE_ORB_ART = {
  3: `${MEDIA_BASE}/a16db5abf_generated_image.png`,
  4: `${MEDIA_BASE}/d32a1121f_generated_image.png`,
  30: `${MEDIA_BASE}/9a8dfb86a_generated_image.png`,
  50: `${MEDIA_BASE}/8226bbd4f_generated_image.png`,
  100: `${MEDIA_BASE}/d4cb36352_generated_image.png`,
  500: `${MEDIA_BASE}/e5d60a0da_generated_image.png`,
};