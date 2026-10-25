// DEDE oyunu görselleri.
const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

// Oyun merkezindeki kapak: altın çerçeveli DEDE kapak resmi.
export const DEDE_COVER = `${MEDIA_BASE}/9a29944a2_generated_image.png`;
export const DEDE_COVER_WIDTH = 1024;
export const DEDE_COVER_HEIGHT = 1024;

// Referans fotoğraftan oluşturulan gerçek alfa kanallı karakter ve bağımsız asa.
export const DEDE_DEITY = `${MEDIA_BASE}/1b33c80ee_generated_6378ea70.png`;
export const DEDE_STAFF = `${MEDIA_BASE}/c134764c7_generated_9337375d.png`;
export const DEDE_STAFF_VIDEO = 'https://media.base44.com/videos/public/6a77d66e4da6de214628ee62/42b2c3c7e_Dede_Asa_Videosu.mp4';

// Sembol kartları: gönderilen referans tasarımdaki nesnelerin birebir aynısı —
// taç, kum saati, yüzük, kupa, elmas ve yakut yıldız; bonus kartı Zeus kabartmasıdır.
export const DEDE_ART = {
  crown: `${MEDIA_BASE}/7aed271c8_generated_image.png`,
  amethyst: `${MEDIA_BASE}/d9abd22fb_generated_image.png`,
  gem: `${MEDIA_BASE}/9fea3d8be_generated_image.png`,
  topaz: `${MEDIA_BASE}/745f0ef6d_generated_image.png`,
  ring: `${MEDIA_BASE}/dc7c06c4d_generated_image.png`,
  hour: `${MEDIA_BASE}/0d9f641fd_generated_image.png`,
  chalice: `${MEDIA_BASE}/247ba5e9c_generated_image.png`,
  bolt: `${MEDIA_BASE}/9a487d745_generated_image.png`,
  dede: `${MEDIA_BASE}/1191e9e17_generated_image.png`,
};

export const DEDE_ART_SIZE = 1024;

// Çarpan küreleri: kanatlı küre tasarımı. Değer görsele gömülü değildir;
// kürenin ortasına yazıyla bindirilir, böylece her kademe aynı tasarımı kullanır.
// Renkler: yeşil 3x · 4x · 30x · 100x, mavi 20x, kırmızı 50x ve 500x.
const DEDE_ORB_GREEN = `${MEDIA_BASE}/3c61310b9_generated_image.png`;
const DEDE_ORB_BLUE = `${MEDIA_BASE}/fce0e88b9_generated_image.png`;
const DEDE_ORB_RED = `${MEDIA_BASE}/70cefb55e_generated_image.png`;
export const DEDE_ORB_ART = {
  3: DEDE_ORB_GREEN,
  4: DEDE_ORB_GREEN,
  20: DEDE_ORB_BLUE,
  30: DEDE_ORB_GREEN,
  50: DEDE_ORB_RED,
  100: DEDE_ORB_GREEN,
  500: DEDE_ORB_RED,
};