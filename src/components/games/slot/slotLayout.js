// Oyun ekranı, 1018 x 1545 boyutundaki referans görselin kendisidir.
// Makara sembolleri görselin kendi hücrelerinden kırpılır.
export const ART_WIDTH = 1018;
export const ART_HEIGHT = 1545;

// Görselin kendi üst jackpot paneli, hemen altındaki sayaç/rozet/ilerleme şeridi ve alt
// kontrol alanı kırpılır: ortada jackpot yazısı kalmaz, üstteki kendi konsolumuz kalır.
export const ART_HEAD_HEIGHT = 435;
export const ART_VIEW_HEIGHT = 1215;

// Görünen yükseklik: kırpılan bölgeler çıktıktan sonra kalan oyun ekranı.
export const ART_VISIBLE_HEIGHT = ART_VIEW_HEIGHT - ART_HEAD_HEIGHT;

const frame = (x, y, w, h) => ({
  left: `${((x / ART_WIDTH) * 100).toFixed(2)}%`,
  top: `${((y / ART_HEIGHT) * 100).toFixed(2)}%`,
  width: `${((w / ART_WIDTH) * 100).toFixed(2)}%`,
  height: `${((h / ART_HEIGHT) * 100).toFixed(2)}%`,
});

// Makara alanı — görselin makara panelinin tamamını kapatır, semboller burada kayar.
export const SLOT_LAYOUT = {
  reelWindow: frame(25, 530, 968, 670),
  // Makaraların altını üstteki kabin kenarı gibi kapatan alt kapak.
  reelSill: frame(25, 1105, 968, ART_VIEW_HEIGHT - 1105),
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

// Kazanç çizgileri katmanı pencerenin kendi koordinatlarında çizilir.
export const REEL_WINDOW = { width: Math.round(968), height: Math.round(670) };

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