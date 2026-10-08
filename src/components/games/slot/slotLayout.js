// Oyun ekranı, 1018 x 1545 boyutundaki referans görselin kendisidir.
// Konumlar görselin piksellerinden ölçüldü: canlı kontroller görselin kendi
// butonlarının, canlı değerler de görselin kendi rakam alanlarının üzerine gelir.
export const ART_WIDTH = 1018;
export const ART_HEIGHT = 1545;

// Görselin alt kontrol alanı (kendi tuşları ve rakam kutuları) kırpılır: o bölgenin
// yerini panelin kendi kontrol düzeni alır, görsel bu yükseklikte biter.
export const ART_VIEW_HEIGHT = 1215;

// Görselin üstünde oyun başlığının başladığı yer: kazanan şeridi bu
// altın çizginin üzerine kadar iner, yazıyı kapatmaz.
export const LOGO_TOP = 0.06;

// Görselde basılı oyun adı ("filmkeyfi") bu kutunun içinde kalır: kutu görselin
// aynı bölgesinin bulanık kopyasıyla doldurulup üstüne AG yazılır.
const TITLE = { x: 282, y: 70, w: 516, h: 176 };

const frame = (x, y, w, h) => ({
  left: `${((x / ART_WIDTH) * 100).toFixed(2)}%`,
  top: `${((y / ART_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((w / ART_WIDTH) * 100).toFixed(2)}%`,
  height: `${((h / ART_HEIGHT) * 100).toFixed(2)}%`,
});

// Basılı oyun adının kutusu: kapatma katmanı ve AG yazısı bu alana yerleşir.
export const SLOT_TITLE = { ...TITLE, box: frame(TITLE.x, TITLE.y, TITLE.w, TITLE.h) };

// Makara alanı — tur sırasında semboller burada kayar.
export const SLOT_LAYOUT = {
  reelWindow: frame(25, 435, 968, 670),
};

// Makara ızgarası: 5 sütun x 3 satır sembol hücresi.
const CELL_WIDTH = 968 / 5;
const CELL_HEIGHT = 670 / 3;
const CELL_X = 25;
const CELL_Y = 435;

// Sembol hücresinin yükseklik/genişlik oranı — küçük ikonlar da bu oranı kullanır.
export const CELL_ASPECT = CELL_HEIGHT / CELL_WIDTH;

// Bir sembol hücresini görselden kırpıp gösteren arka plan ölçüleri.
export const CELL_STYLE = {
  backgroundSize: `${((ART_WIDTH / CELL_WIDTH) * 100).toFixed(1)}% ${((ART_HEIGHT / CELL_HEIGHT) * 100).toFixed(1)}%`,
  x: [0, 1, 2, 3, 4].map((index) => `${(((CELL_X + index * CELL_WIDTH) / (ART_WIDTH - CELL_WIDTH)) * 100).toFixed(2)}%`),
  y: [0, 1, 2].map((index) => `${(((CELL_Y + index * CELL_HEIGHT) / (ART_HEIGHT - CELL_HEIGHT)) * 100).toFixed(2)}%`),
};

// Oyun motorunun sembolleri görseldeki hücrelerle birebir eşleşir.
export const SYMBOL_CELLS = {
  ten: { col: 0, row: 0 },
  jack: { col: 0, row: 1 },
  queen: { col: 0, row: 2 },
  king: { col: 1, row: 0 },
  ace: { col: 1, row: 1 },
  gem: { col: 1, row: 2 },
  eagle: { col: 2, row: 0 },
  tiger: { col: 2, row: 1 },
  lion: { col: 3, row: 1 },
  free: { col: 3, row: 0 },
  jackpot: { col: 3, row: 2 },
};

export const SYMBOL_IDS = Object.keys(SYMBOL_CELLS);

// Havuz etiketleri: görselde yazan adların üzerine yeni adlar yazılır.
// Şerit, görselin kendi adını tamamen kapatacak yükseklikte ve o ada göre ortalanır.
const LABEL_HEIGHT = 44;
const poolLabel = (x, y, w) => frame(x - w * 0.03, y - LABEL_HEIGHT - 4, w * 1.06, LABEL_HEIGHT);

// Görselde yazılı ödül havuzu alanları — canlı değerler bu kutulara yazılır.
export const SLOT_FIELDS = {
  // Ödül havuzları: kaybedilenler o anki bahis kademesinin havuzunda birikir.
  jackpots: [
    frame(168, 296, 200, 48),
    frame(402, 296, 222, 48),
    frame(662, 296, 192, 48),
    frame(24, 358, 158, 46),
    frame(851, 358, 147, 46),
  ],
};

// Havuz alanlarının görseldeki zemin renkleri (görselden örneklendi): canlı değerler
// bu renge yazılır, böylece alanın üstüne siyah bir dikdörtgen konmuş gibi görünmez.
export const SLOT_FIELD_SKINS = {
  jackpots: ['#2b0117', '#180906', '#011345', '#5f0323', '#022802'],
};

// Görselde yazan havuz adlarının üzerine yazılan yeni adlar.
export const SLOT_POOL_LABELS = [
  { text: 'X MEGA', tone: 'text-slot-pink', box: poolLabel(24, 358, 158) },
  { text: 'BIG', tone: 'text-slot-blue', box: poolLabel(662, 296, 192) },
  { text: 'JACKPOT', tone: 'text-slot-gold', box: poolLabel(402, 296, 222) },
];

// Görseldeki statik "2/20" göstergesi canlı bir değere karşılık gelmiyor: kapsülün kendi
// zeminiyle kapatılır, geriye temiz bir ilerleme çubuğu kalır.
export const SLOT_PROGRESS_TEXT = { box: frame(466, 380, 140, 32), skin: '#140235' };

// Havuz değerleri görselin kendi rakamlarıyla aynı boyutta çizilir (görsel pikseli).
export const SLOT_TEXT_PX = { pool: 44, label: 24 };