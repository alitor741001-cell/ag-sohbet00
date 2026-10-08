// ROULETTE: tek sıfırlı Avrupa çarkı. Bahis blokları referans masadaki 4x2 düzeniyle aynıdır.

export const CHIP_LEVELS = [500, 1000, 10000, 100000];
// Jetonlar bu birimin katıdır; daha küçük tutar masaya konamaz.
export const CHIP_UNIT = CHIP_LEVELS[0];
// Tek turda toplam bahis üst sınırı.
export const MAX_STAKE = 5000000;

// Çarktaki cep sırası (saat yönü): 0-36 arası tüm sayılar bir kez geçer.
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5,
  24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26,
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function isRed(number) {
  return RED_NUMBERS.includes(number);
}

// Masadaki sekiz bahis bloğu: üst sıra sayı grupları, alt sıra dış bahisler.
export const BLOCKS = [
  { id: 'zero', label: '0', sub: 'x36' },
  { id: 'dozen1', label: '1-12', sub: 'x3' },
  { id: 'dozen2', label: '13-24', sub: 'x3' },
  { id: 'dozen3', label: '25-36', sub: 'x3' },
  { id: 'red', label: 'KIRMIZI', sub: 'x2' },
  { id: 'black', label: 'SİYAH', sub: 'x2' },
  { id: 'even', label: 'ÇİFT', sub: 'x2' },
  { id: 'odd', label: 'TEK', sub: 'x2' },
];

export const BLOCK_IDS = BLOCKS.map((block) => block.id);

// Bloğun kazanan çarpanı: sıfır her dış bahsi düşürür, çift/tek ve renkler sıfırı saymaz.
export function winningMultiplier(blockId, number) {
  switch (blockId) {
    case 'zero': return number === 0 ? 36 : 0;
    case 'dozen1': return number >= 1 && number <= 12 ? 3 : 0;
    case 'dozen2': return number >= 13 && number <= 24 ? 3 : 0;
    case 'dozen3': return number >= 25 && number <= 36 ? 3 : 0;
    case 'red': return number !== 0 && isRed(number) ? 2 : 0;
    case 'black': return number !== 0 && !isRed(number) ? 2 : 0;
    case 'even': return number !== 0 && number % 2 === 0 ? 2 : 0;
    case 'odd': return number !== 0 && number % 2 === 1 ? 2 : 0;
    default: return 0;
  }
}

// İstemciden gelen bahisleri temizler: yalnızca tanımlı bloklar ve jeton katı tutarlar.
export function sanitizeBets(raw) {
  const bets = [];
  if (!Array.isArray(raw)) return bets;
  raw.slice(0, BLOCKS.length).forEach((entry) => {
    const id = String(entry?.id || '');
    const amount = Math.round(Number(entry?.amount));
    if (!BLOCK_IDS.includes(id)) return;
    if (!Number.isFinite(amount) || amount < CHIP_UNIT) return;
    bets.push({ id, amount: Math.round(amount / CHIP_UNIT) * CHIP_UNIT });
  });
  return bets;
}

// Çark eşit olasılıklı 37 cepten birine düşer: her sayının şansı aynıdır.
export function spinWheel() {
  return Math.floor(Math.random() * WHEEL_ORDER.length);
}

// Tur sonucu: toplam bahis, kazanan bloklar ve toplam ödeme.
export function settle(bets, number) {
  let stake = 0;
  let payout = 0;
  const wins = [];
  bets.forEach((bet) => {
    stake += bet.amount;
    const multiplier = winningMultiplier(bet.id, number);
    if (!multiplier) return;
    const amount = bet.amount * multiplier;
    payout += amount;
    wins.push({ id: bet.id, stake: bet.amount, multiplier, payout: amount });
  });
  return { stake, payout, wins };
}