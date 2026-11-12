import { poolRules } from './gamePool.ts';

// Her satırın olasılıkları ve 15 sembollük scatter dağılımından hesaplanan ham ödeme.
export function slotPoolRules(pool, jackpotEnabled) {
  const raw = jackpotEnabled ? 0.8635792713341551 : 0.8430404852438941;
  const bonus = 0.013054424681241569;
  return poolRules(pool, { rb: raw, rf: raw, qb: bonus, qf: bonus });
}

// Alt havuz tabelaları tek ödeme fonunu gösterir; admin bakiye değişimi de yansır.
export function alignSlotPools(pools, balance) {
  const keys = ['mini', 'big', 'mega', 'xmega'];
  const sum = keys.reduce((total, key) => total + pools[key], 0);
  const target = Math.max(0, Math.floor(balance));
  const next = Object.fromEntries(keys.map(key => [key, sum > 0 ? Math.floor(pools[key] / sum * target) : 0]));
  next.mega += target - keys.reduce((total, key) => total + next[key], 0);
  return next;
}

// Görünen satır kazançları + jackpot, ödenen toplamla tam olarak aynı kalır.
export function slotPaidWins(wins, rawJackpot, payout, rawTotal) {
  const ratio = rawTotal > 0 ? payout / rawTotal : 0;
  const jackpot = Math.floor(rawJackpot * ratio);
  const scaled = wins.map(win => ({ ...win, amount: Math.floor(win.amount * ratio) }));
  const remainder = payout - jackpot - scaled.reduce((sum, win) => sum + win.amount, 0);
  if (scaled.length) scaled[0].amount += remainder;
  return { wins: scaled, jackpot: scaled.length ? jackpot : jackpot + remainder };
}