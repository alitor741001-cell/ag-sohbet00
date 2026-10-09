// ZAR motoru: üç zarla oynanan Küçük / Büyük / Kaplan masası.
// Zarlar sunucuda atılır; toplam 4-10 küçük, 11-17 büyük, 3 ve 18 kaplandır.

export const CHIP_LEVELS = [10, 100, 1000, 10000];
// Jetonlar bu birimin katıdır; daha küçük tutar masaya konamaz.
export const CHIP_UNIT = CHIP_LEVELS[0];
// Tek turda toplam bahis üst sınırı.
export const MAX_STAKE = 5000000;

// Bahis alanları ve ödeme katları.
export const ZONE_IDS = ['kucuk', 'buyuk', 'kaplan'];
export const ZONE_MULTIPLIER = { kucuk: 2, buyuk: 2, kaplan: 35 };

/** Zar toplamının alanı: 3 ve 18 kaplan, 4-10 küçük, 11-17 büyük. */
export function outcomeOf(sum) {
  if (sum === 3 || sum === 18) return 'kaplan';
  if (sum <= 10) return 'kucuk';
  if (sum <= 17) return 'buyuk';
  return '';
}

/** Üç zar atılır: her zar 1-6 arasında eşit olasılıklıdır. */
export function rollDice() {
  const dice = [0, 1, 2].map(() => 1 + Math.floor(Math.random() * 6));
  const sum = dice[0] + dice[1] + dice[2];
  return { dice, sum, outcome: outcomeOf(sum) };
}

/** Bahsin tur toplamına göre kazancı: kazanan alanın katı, diğerleri sıfır. */
export function winningMultiplier(kind, sum) {
  if (!ZONE_IDS.includes(kind)) return 0;
  return outcomeOf(sum) === kind ? ZONE_MULTIPLIER[kind] : 0;
}

/** İstemciden gelen bahisleri temizler: yalnızca tanımlı alanlar ve jeton katı tutarlar. */
export function sanitizeBets(raw) {
  const bets = [];
  if (!Array.isArray(raw)) return bets;
  raw.slice(0, ZONE_IDS.length).forEach((entry) => {
    const kind = String(entry?.kind || entry?.id || '');
    const amount = Math.round(Number(entry?.amount));
    if (!ZONE_IDS.includes(kind)) return;
    if (!Number.isFinite(amount) || amount < CHIP_UNIT) return;
    bets.push({ kind, amount: Math.round(amount / CHIP_UNIT) * CHIP_UNIT });
  });
  return bets;
}

/** Tur sonucu: toplam bahis, kazanan alanlar ve toplam ödeme. */
export function settle(bets, sum) {
  let stake = 0;
  let payout = 0;
  const wins = [];
  bets.forEach((bet) => {
    stake += bet.amount;
    const multiplier = winningMultiplier(bet.kind, sum);
    if (!multiplier) return;
    const amount = bet.amount * multiplier;
    payout += amount;
    wins.push({ kind: bet.kind, stake: bet.amount, multiplier, payout: amount });
  });
  return { stake, payout, wins };
}