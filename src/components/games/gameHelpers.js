// Oyun Merkezi görsel yardımcıları — burada yalnızca gösterim/animasyon vardır, coin hesabı yapılmaz.
export const formatCoins = (value) => Math.max(0, Math.floor(Number(value) || 0)).toLocaleString('tr-TR');

export const symbolMap = (symbols = []) => {
  const map = {};
  symbols.forEach((symbol) => { map[symbol.id] = symbol; });
  return map;
};

export const randomSymbolId = (symbols = []) => {
  if (!symbols.length) return 'star';
  const total = symbols.reduce((sum, symbol) => sum + (symbol.weight || 0), 0);
  if (!total) return symbols[0].id;
  let roll = Math.random() * total;
  for (const symbol of symbols) {
    roll -= symbol.weight || 0;
    if (roll <= 0) return symbol.id;
  }
  return symbols[symbols.length - 1].id;
};

export const randomColumn = (symbols = []) => [randomSymbolId(symbols), randomSymbolId(symbols), randomSymbolId(symbols)];

export const emptyColumns = () => Array.from({ length: 5 }, () => ['star', 'gem', 'crown']);

export const allowedBets = (steps = [], { minBet = 0, maxBet = Infinity, coins = 0 } = {}) => {
  const limit = Math.min(maxBet, coins);
  return steps.filter((step) => step >= minBet && step <= limit);
};

export const xpProgress = (levelInfo) => {
  if (!levelInfo) return { percent: 0, label: '', next: null };
  const { level, xp, level_xp: levelXp, next_xp: nextXp, next_level: nextLevel } = levelInfo;
  if (!nextXp) return { percent: 100, label: `${xp} XP`, next: null };
  const span = Math.max(1, nextXp - levelXp);
  return {
    percent: Math.min(100, Math.max(0, Math.round(((xp - levelXp) / span) * 100))),
    label: `${xp - levelXp} / ${nextXp - levelXp} XP`,
    next: nextLevel,
  };
};

export const gameLabel = (game) => ({ slot: 'Slot', jackpot: 'Jackpot', crash: 'Crash' }[game] || 'Oyun');