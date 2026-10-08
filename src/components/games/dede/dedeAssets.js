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
  gem: `${MEDIA_BASE}/d330a3b46_generated_image.png`,
  ring: `${MEDIA_BASE}/17cc1dfab_generated_image.png`,
  hour: `${MEDIA_BASE}/e133f6756_generated_image.png`,
  chalice: `${MEDIA_BASE}/9dddaf2c3_generated_image.png`,
  bolt: `${MEDIA_BASE}/a7ed41d1e_generated_image.png`,
  dede: `${MEDIA_BASE}/eb0a5a12d_generated_image.png`,
};

export const DEDE_ART_SIZE = 1024;

// Çarpan jetonları: referanstaki altın çerçeveli taşlar. Değer görsele gömülü değildir;
// jetonun ortasına yazıyla bindirilir, böylece her kademe aynı tasarımı kullanır.
// Taşın rengi kademeyi gösterir: mor düşük kademeler, mavi 50x, kırmızı 500x.
const DEDE_ORB_PURPLE = `${MEDIA_BASE}/29afc73db_generated_image.png`;
export const DEDE_ORB_ART = {
  3: DEDE_ORB_PURPLE,
  4: DEDE_ORB_PURPLE,
  30: DEDE_ORB_PURPLE,
  50: `${MEDIA_BASE}/5f1ccbc6a_generated_image.png`,
  100: DEDE_ORB_PURPLE,
  500: `${MEDIA_BASE}/b60997ed3_generated_image.png`,
};