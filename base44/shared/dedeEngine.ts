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

// Dede: 4 ve üzeri gelince bonus öder.
export const SCATTER_ID = 'dede';
export const SCATTER_MIN = 4;
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

// Skatter ağırlığı: 4+ dede seyrektir, tur başına ~%0,7 (yaklaşık 140 turda bir).
const SCATTER_WEIGHT = 2;
// Çevirme hakkı turlarında aynı seyrek oran korunur: ek 15 hak ortalama 10 hakkın birinde gelir.
const FREE_SCATTER_WEIGHT = 2;

// Çarpan jetonları: [değer, ağırlık]. Referans tasarımdaki 3x, 4x, 30x, 50x, 100x, 500x kademeleri.
const ORB_VALUES = [
  [3, 900],
  [4, 640],
  [30, 60],
  [50, 24],
  [100, 7],
  [500, 2],
];

// Jeton bir kareyi sembol gibi kaplar: kare başına inme şansı (ilk ızgara, tumbler, satın alınan tur).
// Oranlar düşük tutulur: çarpan jetonları her turda değil, seyrek anlarda gelir.
const INITIAL_ORB_CHANCE = 0.025;
const TUMBLE_ORB_CHANCE = 0.035;
const FREE_ORB_CHANCE = 0.045;

// Kare kimliğinden jeton değeri: 'orb30' -> 30; jeton değilse 0.
export function orbValue(cell) {
  const match = /^orb(\d+)$/.exec(cell || '');
  return match ? Number(match[1]) : 0;
}

// Tek kare: çoğunlukla sembol, bazen çarpan jetonu.
function randomCell(orbChance, pool) {
  if (orbChance > 0 && Math.random() < orbChance) return `orb${rollValue()}`;
  return randomId(pool);
}

function buildPool(scatterWeight) {
  const pool = [];
  SYMBOLS.forEach((symbol) => {
    for (let index = 0; index < symbol.weight; index += 1) pool.push(symbol.id);
  });
  for (let index = 0; index < scatterWeight; index += 1) pool.push(SCATTER_ID);
  return pool;
}

const POOL = buildPool(SCATTER_WEIGHT);
// Çevirme hakkı turlarında kullanılan seyrek skatter havuzu.
const FREE_POOL = buildPool(FREE_SCATTER_WEIGHT);

function randomId(pool = POOL) {
  return pool[Math.floor(Math.random() * pool.length)];
}

// 6 sütun x 5 satır sonuç: grid[sütun][satır], satır 0 en üst.
export function spinGrid(orbChance = 0, pool = POOL) {
  const grid = [];
  for (let reel = 0; reel < REELS; reel += 1) {
    const column = [];
    for (let row = 0; row < ROWS; row += 1) column.push(randomCell(orbChance, pool));
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
function collapse(grid, removing, orbChance, pool) {
  return grid.map((column, reel) => {
    const kept = column.filter((_, row) => !removing.has(`${reel}-${row}`));
    const fresh = [];
    for (let index = kept.length; index < ROWS; index += 1) fresh.push(randomCell(orbChance, pool));
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

// Izgaradaki çarpan jetonları: bu adımda karelerde duran jetonların listesi.
function gridOrbs(grid) {
  const orbs = [];
  grid.forEach((column, reel) => {
    column.forEach((cell, row) => {
      const value = orbValue(cell);
      if (value) orbs.push({ reel, row, value });
    });
  });
  return orbs;
}

/** Bir turun tamamı: ilk ızgara, tumbler adımları ve küre çarpanları.
    Her adım ekranda gösterilmek üzere ayrı ayrı döner. */
export function playDede(bet, isFree) {
  // Çevirme hakkı turlarında skatter seyrekleşir: ek 15 hakkın oranı düşük kalır.
  const pool = isFree ? FREE_POOL : POOL;
  let grid = spinGrid(INITIAL_ORB_CHANCE, pool);
  const scatterCells = [];
  grid.forEach((column, reel) => {
    column.forEach((symbol, row) => {
      if (symbol === SCATTER_ID) scatterCells.push({ reel, row });
    });
  });
  const scatterCount = scatterCells.length;
  const scatterTrigger = scatterCount >= SCATTER_MIN;
  const scatterTier = scatterTrigger ? Math.min(scatterCount, SCATTER_MIN + 2) - SCATTER_MIN : 0;
  const scatterWin = scatterTrigger ? Math.round(SCATTER_PAYS[scatterTier] * bet * PAYOUT_RATE) : 0;

  const ceiling = bet * MAX_WIN_MULTIPLE;
  const steps = [];
  let raw = 0;
  // Biriken çarpan: inen her küre değerini buraya ekler ve tur boyunca büyür.
  let accumulated = 0;
  let capped = false;
  const orbChance = isFree ? FREE_ORB_CHANCE : TUMBLE_ORB_CHANCE;

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
    // Izgaradaki çarpan jetonları: kazanç turunda toplanır ve birikime eklenir.
    const orbs = gridOrbs(grid);
    if (!wins.length) break;

    // İnen jetonlar birikir: her inişte biriken çarpana eklenir, tur boyunca büyür.
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
    const removing = new Set();
    wins.forEach((win) => {
      if (win.scatter) return;
      win.cells.forEach((cell) => removing.add(`${cell.reel}-${cell.row}`));
    });
    // Toplanan çarpan jetonları da yerinden kalkar: aynı jeton iki kez sayılmaz.
    orbs.forEach((orb) => removing.add(`${orb.reel}-${orb.row}`));
    if (!removing.size) break;

    grid = collapse(grid, removing, orbChance, pool);
  }

  // Turun tamamı biriken çarpanla çarpılır — orijinal oyundaki gibi.
  const factor = accumulated > 1 ? accumulated : 1;
  let total = Math.round(raw * factor);
  if (total > ceiling) {
    total = ceiling;
    capped = true;
  }

  return { steps, grid, total, capped, scatterCount, scatterTrigger };
}