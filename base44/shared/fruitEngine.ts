// Meyve şeker oyunu motoru: 6 sütun x 5 satır, "ekranın her yerinde öde" kuralı.
// Aynı sembolden 8 ve üzeri gelince küme öder; komşuluk gerekmez.
export const REELS = 6;
export const ROWS = 5;

// Toplam bahis = bahis x 20 (referanstaki 20X kademesi).
export const LINES = 20;

// Bahis kademeleri.
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];

// Ödeme oranı: tablodaki her kazanca uygulanır. Meyve oyunu slot oyunuyla
// aynı ekonomiye sahiptir (tur başına ortalama ~%82 geri dönüş).
export const PAYOUT_RATE = 0.6;

// Toplam bahsin bu katı ve üzeri kazançlar "büyük kazanç" sayılır.
export const BIG_WIN_MULTIPLE = 10;

// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const CLUSTER_MIN = 8;

// Muz: serbest tur tetikleyen skatter sembolü.
export const SCATTER_ID = 'banana';
export const SCATTER_MIN = 4;
export const FREE_SPINS = 10;
// Skatter ödemesi: 4, 5 ve 6+ muz için bahis katı.
export const SCATTER_PAYS = [54, 108, 216];

// pays: 8-9, 10-11 ve 12+ sembol kümesi için bahis katı.
export const SYMBOLS = [
  { id: 'lollipop', name: 'Lolipop', weight: 8, pays: [144, 450, 1440] },
  { id: 'plum', name: 'Erik', weight: 10, pays: [90, 270, 900] },
  { id: 'grapes', name: 'Üzüm', weight: 12, pays: [72, 216, 630] },
  { id: 'melon', name: 'Karpuz', weight: 14, pays: [54, 162, 450] },
  { id: 'apple', name: 'Elma', weight: 16, pays: [36, 108, 324] },
  { id: 'candy', name: 'Şeker', weight: 18, pays: [27, 72, 216] },
  { id: 'cherry', name: 'Kiraz', weight: 20, pays: [18, 54, 162] },
];

// Makara torbası: her sembol ağırlığı kadar yazılır.
function buildPool() {
  const pool = [];
  SYMBOLS.forEach((symbol) => {
    for (let index = 0; index < symbol.weight; index += 1) pool.push(symbol.id);
  });
  const scatter = SYMBOLS.find((symbol) => symbol.id === SCATTER_ID);
  const scatterWeight = scatter ? scatter.weight : 3;
  for (let index = 0; index < scatterWeight; index += 1) pool.push(SCATTER_ID);
  return pool;
}

const POOL = buildPool();

// 6 sütun x 5 satır sonuç: grid[sütun][satır].
export function spinFruit() {
  const grid = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const column = [];
    for (let row = 0; row < ROWS; row += 1) {
      column.push(POOL[Math.floor(Math.random() * POOL.length)]);
    }
    grid.push(column);
  }
  return grid;
}

function clusterTier(count, pays) {
  if (count >= 12) return pays[2];
  if (count >= 10) return pays[1];
  return pays[0];
}

// Ekrandaki bütün eşleşmeler: kümeler ve skatter.
export function evaluateFruit(grid, bet) {
  const wins = [];
  const counts = {};
  const cells = {};
  let total = 0;

  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      counts[symbol] = (counts[symbol] || 0) + 1;
      if (!cells[symbol]) cells[symbol] = [];
      cells[symbol].push({ reel, row });
    });
  });

  SYMBOLS.forEach((definition) => {
    const count = counts[definition.id] || 0;
    if (count < CLUSTER_MIN) return;
    const amount = Math.round(clusterTier(count, definition.pays) * bet * PAYOUT_RATE);
    total += amount;
    wins.push({ symbol: definition.id, count, amount, cells: cells[definition.id], scatter: false });
  });

  const scatterCount = counts[SCATTER_ID] || 0;
  if (scatterCount >= SCATTER_MIN) {
    const tier = Math.min(scatterCount, SCATTER_MIN + 2) - SCATTER_MIN;
    const amount = Math.round(SCATTER_PAYS[tier] * bet * PAYOUT_RATE);
    total += amount;
    wins.push({
      symbol: SCATTER_ID,
      count: scatterCount,
      amount,
      cells: cells[SCATTER_ID],
      scatter: true,
    });
  }

  return { total, wins };
}