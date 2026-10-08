// Oyun ekranı, 1018 x 1545 boyutundaki referans görselin kendisidir.
// Konumlar görselin piksellerinden ölçüldü: canlı kontroller görselin kendi
// butonlarının, canlı değerler de görselin kendi rakam alanlarının üzerine gelir.
export const ART_WIDTH = 1018;
export const ART_HEIGHT = 1545;

// Görselin üstünde oyun başlığının başladığı yer: kazanan şeridi bu
// altın çizginin üzerine kadar iner, yazıyı kapatmaz.
export const LOGO_TOP = 0.06;

const frame = (x, y, w, h) => ({
  left: `${((x / ART_WIDTH) * 100).toFixed(2)}%`,
  top: `${((y / ART_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((w / ART_WIDTH) * 100).toFixed(2)}%`,
  height: `${((h / ART_HEIGHT) * 100).toFixed(2)}%`,
});

// Görselin kendi butonları — görünmez dokunma alanları.
export const SLOT_LAYOUT = {
  // Makara alanı — tur sırasında semboller burada kayar.
  reelWindow: frame(25, 435, 968, 670),
  spin: frame(760, 1264, 236, 248),
  auto: frame(596, 1352, 160, 140),
  max: frame(382, 1434, 200, 90),
  balance: frame(18, 1428, 320, 102),
  betMinus: frame(186, 1330, 100, 110),
  betPlus: frame(480, 1330, 104, 110),
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
const LABEL_HEIGHT = 34;
const poolLabel = (x, y, w, h) => frame(x - w * 0.025, y - LABEL_HEIGHT - 2, w * 1.05, LABEL_HEIGHT);

// Görselde yazılı olan rakam alanları — canlı değerler bu kutulara yazılır.
export const SLOT_FIELDS = {
  lines: frame(92, 1268, 126, 54),
  totalBet: frame(296, 1268, 144, 54),
  win: frame(585, 1268, 150, 54),
  bet: frame(330, 1370, 104, 56),
  // Bakiye alanı: altındaki altın şeride değmemesi için biraz daha kısa tutulur.
  balance: frame(90, 1460, 170, 46),
  // Ödül havuzları: kaybedilenler o anki bahis kademesinin havuzunda birikir.
  jackpots: [
    frame(168, 296, 200, 48),
    frame(402, 296, 222, 48),
    frame(662, 296, 192, 48),
    frame(24, 358, 158, 46),
    frame(851, 358, 147, 46),
  ],
};

// Görselin kendi rakam alanlarının zemin renkleri (görselden örneklendi): canlı değerler
// bu renge yazılır, böylece alanın üstüne siyah bir dikdörtgen konmuş gibi görünmez.
export const SLOT_FIELD_SKINS = {
  lines: '#050415',
  totalBet: '#01051d',
  win: '#010925',
  bet: '#050319',
  balance: '#000215',
  jackpots: ['#2b0117', '#180906', '#011345', '#5f0323', '#022802'],
};

// Görselde yazan havuz adlarının üzerine yazılan yeni adlar.
export const SLOT_POOL_LABELS = [
  { text: 'X MEGA', tone: 'text-slot-pink', box: poolLabel(24, 358, 158, 46), skin: '#610216' },
  { text: 'BIG', tone: 'text-slot-blue', box: poolLabel(662, 296, 192, 48), skin: '#111331' },
  { text: 'JACKPOT', tone: 'text-slot-gold', box: poolLabel(402, 296, 222, 48), skin: '#251615' },
];