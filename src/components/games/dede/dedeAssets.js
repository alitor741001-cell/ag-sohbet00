// DEDE oyunu görselleri.
const MEDIA_BASE = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62';

// Oyun merkezindeki kapak: altın çerçeveli DEDE kapak resmi.
export const DEDE_COVER = `${MEDIA_BASE}/9a29944a2_generated_image.png`;
export const DEDE_COVER_WIDTH = 1024;
export const DEDE_COVER_HEIGHT = 1024;

// Referans fotoğraftan oluşturulan gerçek alfa kanallı karakter ve bağımsız asa.
export const DEDE_DEITY = `${MEDIA_BASE}/1b33c80ee_generated_6378ea70.png`;
export const DEDE_STAFF = `${MEDIA_BASE}/c134764c7_generated_9337375d.png`;
export const DEDE_STAFF_VIDEO = 'https://media.base44.com/videos/public/6a77d66e4da6de214628ee62/5cfa2a014_Dede_Asa_Vuruu.mp4';

// Sembol kartları: gönderilen referans tasarımdaki nesnelerin birebir aynısı —
// taç, kum saati, yüzük, kupa, elmas ve yakut yıldız; bonus kartı Zeus kabartmasıdır.
const SYMBOL_BASE = 'https://base44.app/api/apps/6a77d66e4da6de214628ee62/files/mp/public/6a77d66e4da6de214628ee62';
export const DEDE_ART = {
  crown: `${SYMBOL_BASE}/b9e0c75ad_dede-crown.png`,
  amethyst: `${SYMBOL_BASE}/54ffa8f51_dede-amethyst.png`,
  gem: `${SYMBOL_BASE}/13d34d931_dede-gem.png`,
  topaz: `${SYMBOL_BASE}/c91fb7fcf_dede-topaz.png`,
  ring: `${SYMBOL_BASE}/abb150778_dede-ring.png`,
  hour: `${SYMBOL_BASE}/40eba4798_dede-hour.png`,
  chalice: `${SYMBOL_BASE}/188ae19ca_dede-chalice.png`,
  bolt: `${SYMBOL_BASE}/57292ad22_dede-bolt.png`,
  dede: `${SYMBOL_BASE}/377bec11a_dede-dede.png`,
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