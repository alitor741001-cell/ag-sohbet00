// DEDE oyunu görselleri.
const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

// Oyun merkezindeki kapak: altın çerçeveli DEDE kapak resmi.
export const DEDE_COVER = `${MEDIA_BASE}/9a29944a2_generated_image.png`;
export const DEDE_COVER_WIDTH = 1024;
export const DEDE_COVER_HEIGHT = 1024;

// Sahnede çerçevenin arkasında duran dede karakteri (siyah zemini tarayıcıda kesilir).
export const DEDE_DEITY = `${MEDIA_BASE}/8484dbf0d_generated_image.png`;

// Sembol kartları: gönderilen referans tasarımdaki nesnelerin birebir aynısı —
// taç, kum saati, yüzük, kupa, elmas ve yakut yıldız; bonus kartı Zeus kabartmasıdır.
export const DEDE_ART = {
  crown: `${MEDIA_BASE}/76e6d916f_generated_image.png`,
  // Yeni iki madalyon: kullanıcının referans tasarımından üretilen mor damla ve altın sekizgen.
  amethyst: `${MEDIA_BASE}/dd3dc2ec1_generated_image.png`,
  gem: `${MEDIA_BASE}/d330a3b46_generated_image.png`,
  topaz: `${MEDIA_BASE}/a9dfeb2ce_generated_image.png`,
  ring: `${MEDIA_BASE}/17cc1dfab_generated_image.png`,
  hour: `${MEDIA_BASE}/e133f6756_generated_image.png`,
  chalice: `${MEDIA_BASE}/9dddaf2c3_generated_image.png`,
  bolt: `${MEDIA_BASE}/a7ed41d1e_generated_image.png`,
  dede: `${MEDIA_BASE}/eb0a5a12d_generated_image.png`,
};

export const DEDE_ART_SIZE = 1024;

// Çarpan küreleri: kanatlı küre tasarımı. Değer görsele gömülü değildir;
// kürenin ortasına yazıyla bindirilir, böylece her kademe aynı tasarımı kullanır.
// Renkler: yeşil 3x · 4x · 30x · 100x, mavi 20x, kırmızı 50x ve 500x.
const DEDE_ORB_GREEN = `${MEDIA_BASE}/3ad9d677c_generated_image.png`;
const DEDE_ORB_BLUE = `${MEDIA_BASE}/9ad3847d8_generated_image.png`;
const DEDE_ORB_RED = `${MEDIA_BASE}/019ce0ef4_generated_image.png`;
export const DEDE_ORB_ART = {
  3: DEDE_ORB_GREEN,
  4: DEDE_ORB_GREEN,
  20: DEDE_ORB_BLUE,
  30: DEDE_ORB_GREEN,
  50: DEDE_ORB_RED,
  100: DEDE_ORB_GREEN,
  500: DEDE_ORB_RED,
};