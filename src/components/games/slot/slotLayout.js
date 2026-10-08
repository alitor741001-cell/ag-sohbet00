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

// Makara ızgarası: 5 sütun x 3 satır, hücreler tam kare.
const CELL_WIDTH = 968 / 5;
const CELL_HEIGHT = CELL_WIDTH;
const GRID_WIDTH = CELL_WIDTH * 5;
const GRID_HEIGHT = CELL_HEIGHT * 3;
// Izgaranın görseldeki yeri: üst kenar makara panelinin başlangıcına hizalı kalır.
const GRID_X = 25;
const GRID_Y = 435;

// Sembol hücresinin yükseklik/genişlik oranı — küçük ikonlar da bu oranı kullanır.
export const CELL_ASPECT = CELL_HEIGHT / CELL_WIDTH;

// Makara penceresi — tur sırasında semboller burada kayar.
export const SLOT_LAYOUT = {
  reelWindow: frame(GRID_X, GRID_Y, GRID_WIDTH, GRID_HEIGHT),
  // Makaraların altındaki altın süslemeleri kapatan koyu yatak uzantısı.
  reelSkirt: frame(GRID_X - 10, GRID_Y + GRID_HEIGHT, GRID_WIDTH + 20,
    ART_VIEW_HEIGHT - (GRID_Y + GRID_HEIGHT)),
};

// Kazanç çizgileri katmanı pencerenin kendi koordinatlarında çizilir.
export const REEL_WINDOW = { width: Math.round(GRID_WIDTH), height: Math.round(GRID_HEIGHT) };

// Bir sembol hücresini görselden kırpıp gösteren arka plan ölçüleri.
export const CELL_STYLE = {
  backgroundSize: `${((ART_WIDTH / CELL_WIDTH) * 100).toFixed(1)}% ${((ART_HEIGHT / CELL_HEIGHT) * 100).toFixed(1)}%`,
  x: [0, 1, 2, 3, 4].map((index) => `${(((GRID_X + index * CELL_WIDTH) / (ART_WIDTH - CELL_WIDTH)) * 100).toFixed(2)}%`),
  y: [0, 1, 2].map((index) => `${(((GRID_Y + index * CELL_HEIGHT) / (ART_HEIGHT - CELL_HEIGHT)) * 100).toFixed(2)}%`),
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