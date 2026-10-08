// DEDE oyunu motoru: 6 sütun x 5 satır, "ekranın her yerinde öde" küme kuralı,
// patlayan sembollerin yerine yenilerinin düştüğü tumbler akışı ve çarpan küreleri.

export const REELS = 6;
export const ROWS = 5;

// Toplam bahis = bahis x 20 (referanstaki 20X kademesi).
export const LINES = 20;

// Bahis kademeleri.
export const BET_LEVELS = [10, 20, 50, 100, 250, 500, 1000, 2500, 5000];

// Ödeme oranı: tablodaki her kazanca uygulanır; oyun slot ve meyve ile aynı ekonomiye sahiptir.
export const PAYOUT_RATE = 0.6;

// Toplam bahsin bu katı ve üzeri kazançlar "büyük kazanç" sayılır.
export const BIG_WIN_MULTIPLE = 10;

// Tur başına kazanç tavanı (bahis katı): dev çarpanlar bakiyeyi uçurmasın.
export const MAX_WIN_MULTIPLE = 2000;

// Küme ödemesi: ekranda en az bu kadar aynı sembol olunca öder.
export const CLUSTER_MIN = 8;

// Bir turdaki en fazla tumbler adımı.
export const DROP_MAX = 8;

// Dede: bedava tur tetikleyen skatter sembolü.
export const SCATTER_ID = 'dede';
export const SCATTER_MIN = 4;
export const FREE_SPINS = 15;
export const FREE_RETRIGGER_MIN = 3;
export const FREE_RETRIGGER = 5;
// Skatter ödemesi: 4, 5 ve 6+ dede için bahis katı.
export const SCATTER_PAYS = [60, 150, 600];

// pays: 8-9, 10-11 ve 12+ sembol kümesi için bahis katı.
export const SYMBOLS = [
  { id: 'crown', name: 'Taç', weight: 8, pays: [60, 180, 540] },
  { id: 'gem', name: 'Elmas', weight: 10, pays: [40, 120, 360] },
  { id: 'ring', name: 'Yüzük', weight: 12, pays: [30, 90, 270] },
  { id: 'hour', name: 'Kum Saati', weight: 14, pays: [25, 75, 225] },
  { id: 'chalice', name: 'Kupa', weight: 16, pays: [20, 60, 180] },
  { id: 'bolt', name: 'Şimşek', weight: 18, pays: [10, 30, 90] },
];

// Skatter ağırlığı: 4+ dede ortalama her 40 turda bir gelir.
const SCATTER_WEIGHT = 3;

// Çarpan küreleri: [değer, ağırlık].
const ORB_VALUES = [
  [2, 400],
  [3, 200],
  [5, 150],
  [8, 100],
  [10, 80],
  [15, 40],
  [25, 20],
  [50, 7],
  [100, 2],
  [500, 1],
];

// Küre inme şansı: ilk ızgarada, tumblerda ve bedava turda.
const INITIAL_ORB_CHANCE = 0.16;
const TUMBLE_ORB_CHANCE = 0.34;
const FREE_ORB_CHANCE = 0.5;

function buildPool() {
  const pool = [];
  SYMBOLS.forEach((symbol) => {
    for (let index = 0; index < symbol.weight; index += 1) pool.push(symbol.id);
  });
  for (let index = 0; index < SCATTER_WEIGHT; index += 1) pool.push(SCATTER_ID);
  return pool;
}

const POOL = buildPool();

function randomId() {
  return POOL[Math.floor(Math.random() * POOL.length)];
}

// 6 sütun x 5 satır sonuç: grid[sütun][satır], satır 0 en üst.
export function spinGrid() {
  const grid = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const column = [];
    for (let row = 0; row < ROWS; row += 1) column.push(randomId());
    grid.push(column);
  }
  return grid;
}

function clusterTier(count, pays) {
  if (count >= 12) return pays[2];
  if (count >= 10) return pays[1];
  return pays[0];
}

// Ekrandaki küme kazançları; skatter ayrı hesaplanır.
export function evaluate(grid, bet) {
  const counts = {};
  const cells = {};
  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      counts[symbol] = (counts[symbol] || 0) + 1;
      if (!cells[symbol]) cells[symbol] = [];
      cells[symbol].push({ reel, row });
    });
  });

  const wins = [];
  let total = 0;
  SYMBOLS.forEach((definition) => {
    const count = counts[definition.id] || 0;
    if (count < CLUSTER_MIN) return;
    const amount = Math.round(clusterTier(count, definition.pays) * bet * PAYOUT_RATE);
    total += amount;
    wins.push({ symbol: definition.id, count, amount, cells: cells[definition.id] });
  });

  return { wins, total, counts, cells };
}

// Patlayan karoların yerine üstten yenileri düşer; kalanlar aşağı kayar.
function collapse(grid, winning) {
  return grid.map((column, reel) => {
    const kept = column.filter((_, row) => !winning.has(`${reel}-${row}`));
    const fresh = [];
    for (let index = kept.length; index < ROWS; index += 1) fresh.push(randomId());
    return [...fresh, ...kept];
  });
}

function rollValue() {
  const total = ORB_VALUES.reduce((sum, entry) => sum + entry[1], 0);
  let roll = Math.random() * total;
  for (let index = 0; index < ORB_VALUES.length; index += 1) {
    roll -= ORB_VALUES[index][1];
    if (roll <= 0) return ORB_VALUES[index][0];
  }
  return ORB_VALUES[0][0];
}

// Küreler rastgele hücrelere iner; aynı hücreye iki küre inmez.
function rollOrbs(chance, maxCount) {
  const orbs = [];
  if (Math.random() > chance) return orbs;
  const count = 1 + Math.floor(Math.random() * maxCount);
  const used = new Set();
  for (let index = 0; index < count; index += 1) {
    let reel = Math.floor(Math.random() * REELS);
    let row = Math.floor(Math.random() * ROWS);
    let guard = 0;
    while (used.has(`${reel}-${row}`) && guard < 30) {
      reel = Math.floor(Math.random() * REELS);
      row = Math.floor(Math.random() * ROWS);
      guard += 1;
    }
    const key = `${reel}-${row}`;
    if (used.has(key)) continue;
    used.add(key);
    orbs.push({ reel, row, value: rollValue() });
  }
  return orbs;
}

/** Bir turun tamamı: ilk ızgara, tumbler adımları ve küre çarpanları.
    Her adım ekranda gösterilmek üzere ayrı ayrı döner. */
export function playDede(bet, isFree) {
  let grid = spinGrid();
  const scatterCells = [];
  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      if (symbol === SCATTER_ID) scatterCells.push({ reel, row });
    });
  });
  const scatterCount = scatterCells.length;
  const freeTrigger = scatterCount >= SCATTER_MIN;
  const scatterTier = freeTrigger ? Math.min(scatterCount, SCATTER_MIN + 2) - SCATTER_MIN : 0;
  const scatterWin = freeTrigger ? Math.round(SCATTER_PAYS[scatterTier] * bet * PAYOUT_RATE) : 0;

  const ceiling = bet * MAX_WIN_MULTIPLE;
  const steps = [];
  let raw = 0;
  // Biriken çarpan: inen her küre değerini buraya ekler ve tur boyunca büyür.
  let accumulated = 0;
  let capped = false;
  let orbs = rollOrbs(INITIAL_ORB_CHANCE, 2);

  for (let step = 0; step < DROP_MAX; step += 1) {
    const result = evaluate(grid, bet);
    const wins = [...result.wins];
    let stepTotal = result.total;
    // Skatter ödemesi yalnızca ilk ızgarada bir kez verilir.
    if (step === 0 && scatterWin > 0) {
      wins.unshift({
        symbol: SCATTER_ID,
        count: scatterCount,
        amount: scatterWin,
        cells: scatterCells,
        scatter: true,
      });
      stepTotal += scatterWin;
    }
    if (!wins.length) break;

    // İnen küreler birikir: her inişte biriken çarpana eklenir, tur boyunca büyür.
    const orbSum = orbs.reduce((sum, orb) => sum + orb.value, 0);
    if (orbSum > 0) accumulated += orbSum;
    raw += stepTotal;
    steps.push({
      grid: grid.map((column) => [...column]),
      wins,
      orbs: orbs.map((orb) => ({ ...orb })),
      multiplier: accumulated || 1,
      amount: stepTotal,
    });
    if (raw >= ceiling) {
      capped = true;
      break;
    }

    // Skatter karoları patlamaz: dede yerinde kalır.
    const winning = new Set();
    wins.forEach((win) => {
      if (win.scatter) return;
      win.cells.forEach((cell) => winning.add(`${cell.reel}-${cell.row}`));
    });
    if (!winning.size) break;

    grid = collapse(grid, winning);
    orbs = rollOrbs(isFree ? FREE_ORB_CHANCE : TUMBLE_ORB_CHANCE, 3);
  }

  // Turun tamamı biriken çarpanla çarpılır — orijinal oyundaki gibi.
  const factor = accumulated > 1 ? accumulated : 1;
  let total = Math.round(raw * factor);
  if (total > ceiling) {
    total = ceiling;
    capped = true;
  }

  // Bedava turda 3+ dede turu uzatır.
  const retrigger = isFree && scatterCount >= FREE_RETRIGGER_MIN ? FREE_RETRIGGER : 0;

  return { steps, grid, total, capped, scatterCount, freeTrigger, retrigger };
}