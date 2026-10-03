export const LINES = 50;
// Bahis kademeleri: total bet = bahis x 50 satır.
export const BET_LEVELS = [10, 20, 50, 100, 500, 1000, 5000, 8000, 10000];
export const MIN_BET = BET_LEVELS[0];
export const MAX_BET = BET_LEVELS[BET_LEVELS.length - 1];

// Bahis kademesi adı: kaybedilenler bu kademenin havuzunda birikir.
export const tierOfBet = (bet, lines = LINES) => {
  const total = bet * lines;
  if (total >= 5000 && total <= 25000) return 'MINI';
  if (total > 25000 && total <= 50000) return 'BIG';
  if (total >= 250000 && total <= 400000) return 'MEGA';
  if (total > 400000) return 'X MEGA';
  return '';
};