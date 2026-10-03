// FilmKeyfi Oyun Merkezi — tüm oyun matematiği sunucu tarafında bu modülden hesaplanır.
// Coin/ödeme kararları yalnızca game-service fonksiyonunda, bu tablolar kullanılarak verilir.

export const GAME_SYMBOLS = [
  { id: 'wild', label: 'FilmKeyfi', icon: '🎬', weight: 4, pays: { 3: 12, 4: 45, 5: 220 } },
  { id: 'bonus', label: 'Bonus', icon: '🎁', weight: 5, pays: { 3: 1, 4: 3, 5: 12 } },
  { id: 'crown', label: 'Taç', icon: '👑', weight: 6, pays: { 3: 5, 4: 18, 5: 72 } },
  { id: 'gem', label: 'Mücevher', icon: '💎', weight: 8, pays: { 3: 3, 4: 10, 5: 36 } },
  { id: 'crystal', label: 'Kristal', icon: '🔮', weight: 9, pays: { 3: 2, 4: 8, 5: 29 } },
  { id: 'ring', label: 'Altın Yüzük', icon: '💍', weight: 10, pays: { 3: 2, 4: 6, 5: 23 } },
  { id: 'star', label: 'Yıldız', icon: '⭐', weight: 11, pays: { 3: 1, 4: 4, 5: 16 } },
  { id: 'clock', label: 'Saat', icon: '⏰', weight: 12, pays: { 3: 1, 4: 4, 5: 13 } },
];

export const SYMBOL_WEIGHT_TOTAL = GAME_SYMBOLS.reduce((sum, symbol) => sum + symbol.weight, 0);

// Jackpot yalnızca bu bahis ve üzerinde açılır (havuzlar sabit coin havuzu olduğu için).
export const JACKPOT_MIN_BET = 1000;

export const JACKPOT_TIERS = [
  { tier: 'mega', symbol: 'crown', pool: 'jackpot_mega', base: 'jackpot_mega_base', label: 'Mega Jackpot', share: 0.3 },
  { tier: 'major', symbol: 'gem', pool: 'jackpot_major', base: 'jackpot_major_base', label: 'Major Jackpot', share: 0.3 },
  { tier: 'mini', symbol: 'star', pool: 'jackpot_mini', base: 'jackpot_mini_base', label: 'Mini Jackpot', share: 0.4 },
];

export const BET_STEPS = [100, 500, 1000, 2000, 5000, 10000, 25000, 50000, 100000];

// Seviye eşikleri ve her seviyede açılan maksimum bahis.
export const LEVELS = [
  { level: 1, xp: 0, bet_cap: 1000 },
  { level: 2, xp: 200, bet_cap: 5000 },
  { level: 3, xp: 800, bet_cap: 10000 },
  { level: 4, xp: 2500, bet_cap: 25000 },
  { level: 5, xp: 7000, bet_cap: 50000 },
  { level: 6, xp: 18000, bet_cap: 100000 },
];

export const CRASH_RATE = 0.11;
export const CRASH_ROUND_COOLDOWN_MS = 4000;

export const DEFAULT_CONFIG = {
  key: 'main',
  min_bet: 100,
  max_bet: 100000,
  bet_steps: BET_STEPS,
  start_coins: 1000,
  jackpot_mini: 250000,
  jackpot_mini_base: 250000,
  jackpot_major: 1250000,
  jackpot_major_base: 1250000,
  jackpot_mega: 5000000,
  jackpot_mega_base: 5000000,
  jackpot_growth: 0.05,
  slot_enabled: true,
  crash_enabled: true,
  jackpot_enabled: true,
  auto_max: 100,
  crash_min: 1.01,
  crash_max: 20,
  crash_wait_seconds: 8,
  daily_limit: 0,
  xp_per_bet: 0.01,
};

export function levelForXp(xp) {
  let current = LEVELS[0];
  for (const step of LEVELS) if (Number(xp) >= step.xp) current = step;
  return current.level;
}

export function levelInfo(xp) {
  const value = Math.max(0, Math.round(Number(xp) || 0));
  let current = LEVELS[0];
  for (const step of LEVELS) if (value >= step.xp) current = step;
  const next = LEVELS.find((step) => step.level === current.level + 1) || null;
  return {
    level: current.level,
    xp: value,
    level_xp: current.xp,
    next_level: next ? next.level : null,
    next_xp: next ? next.xp : null,
    bet_cap: current.bet_cap,
  };
}

export function betCapForLevel(level, config) {
  const step = LEVELS.find((row) => row.level === Number(level)) || LEVELS[0];
  const cap = Number(config?.max_bet) > 0 ? Math.min(step.bet_cap, Number(config.max_bet)) : step.bet_cap;
  return cap;
}

export function sanitizeBet(rawBet, { coins, level, config }) {
  const bet = Math.floor(Number(rawBet));
  const min = Math.max(1, Math.floor(Number(config?.min_bet) || 100));
  const cap = betCapForLevel(level, config);
  if (!Number.isFinite(bet) || bet <= 0) return { ok: false, error: 'Geçersiz bahis miktarı' };
  if (bet < min) return { ok: false, error: `Minimum bahis ${min} coin` };
  if (bet > cap) return { ok: false, error: `Bu seviyede maksimum bahis ${cap} coin` };
  if (bet > Math.max(0, Math.floor(Number(coins) || 0))) return { ok: false, error: 'Yeterli coin yok' };
  return { ok: true, bet };
}

const pickWeighted = (random = Math.random) => {
  let roll = random() * SYMBOL_WEIGHT_TOTAL;
  for (const symbol of GAME_SYMBOLS) {
    roll -= symbol.weight;
    if (roll <= 0) return symbol.id;
  }
  return GAME_SYMBOLS[GAME_SYMBOLS.length - 1].id;
};

/** 5 makara × 3 sıra ızgara üretir. */
export function createGrid(random = Math.random) {
  const columns = [];
  for (let reel = 0; reel < 5; reel++) {
    columns.push([pickWeighted(random), pickWeighted(random), pickWeighted(random)]);
  }
  return columns;
}

const payFor = (symbolId, count) => {
  const symbol = GAME_SYMBOLS.find((row) => row.id === symbolId);
  return symbol?.pays?.[count] || 0;
};

/**
 * Izgarayı değerlendirir: 3 yatay hatta soldan eşleşme, bonus scatter ve jackpot adayı.
 * Kazanç katsayıları bahis ile çarpılır (bahis = 1 birim kabul edilir).
 */
export function evaluateGrid(grid, bet) {
  const unit = Math.max(1, Math.floor(Number(bet) || 1));
  const lines = [];
  let multiplier = 0;
  let jackpotTier = null;

  for (let row = 0; row < 3; row++) {
    const line = grid.map((column) => column[row]);
    let symbol = line[0] === 'wild' ? null : line[0];
    let count = 0;
    for (let index = 0; index < 5; index++) {
      const cell = line[index];
      if (symbol === null) {
        if (cell === 'wild') count += 1;
        else { symbol = cell; count += 1; }
        continue;
      }
      if (cell === symbol || cell === 'wild') count += 1;
      else break;
    }
    const resolved = symbol || 'wild';
    if (count >= 3) {
      const pay = payFor(resolved, count);
      if (pay > 0) {
        multiplier += pay;
        lines.push({ row, symbol: resolved, count, amount: pay * unit });
      }
    }
    if (row === 1 && line.every((cell) => cell === line[0]) && line[0] !== 'wild') jackpotTier = line[0];
  }

  let bonusCount = 0;
  grid.forEach((column) => column.forEach((cell) => { if (cell === 'bonus') bonusCount += 1; }));
  let bonus = null;
  if (bonusCount >= 3) {
    const pay = payFor('bonus', Math.min(5, bonusCount));
    if (pay > 0) {
      multiplier += pay;
      bonus = { count: bonusCount, amount: pay * unit };
    }
  }

  const tier = jackpotTier ? JACKPOT_TIERS.find((entry) => entry.symbol === jackpotTier)?.tier || null : null;

  return {
    win: Math.floor(multiplier * unit),
    multiplier: Number(multiplier.toFixed(2)),
    lines,
    bonus,
    jackpotTier: tier,
  };
}

/** Çarpan eğrisi: t saniye sonunda kaç kat. */
export function multiplierAt(elapsedMs) {
  const seconds = Math.max(0, Number(elapsedMs) || 0) / 1000;
  return Math.max(1, Math.floor(Math.exp(CRASH_RATE * seconds) * 100) / 100);
}

export function msForMultiplier(multiplier) {
  return Math.round((Math.log(Math.max(1.0001, Number(multiplier) || 1)) / CRASH_RATE) * 1000);
}

/** Sunucu tarafı crash noktası: P(patlamaz) ≈ 0.97/x, yani %3 oyun payı. */
export function crashPointFor(config, random = Math.random) {
  const min = Math.max(1.01, Number(config?.crash_min) || 1.01);
  const max = Math.max(min, Number(config?.crash_max) || 20);
  const roll = random() * 0.97;
  const raw = 0.97 / (1 - roll);
  const value = Math.min(max, Math.max(min, raw));
  return Math.floor(value * 100) / 100;
}