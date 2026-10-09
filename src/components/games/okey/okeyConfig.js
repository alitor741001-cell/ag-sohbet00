import { formatCoins } from '@/lib/giftTone';

// 101 OKEY ekran sabitleri: koltuk düzeni, taş gösterimi ve bahis kademeleri.
export const OKEY_BETS = [1000, 5000, 25000, 100000];
// Elle başlatmak için gereken en az oyuncu.
export const OKEY_MIN_PLAYERS = 2;
// Koltuk sırası görünümü: 0 alt (ben), 1 sol, 2 üst, 3 sağ.
export const SLOT_BY_OFFSET = ['bottom', 'left', 'top', 'right'];
export const COLOR_ORDER = { R: 0, S: 1, M: 2, Y: 3, J: 4 };

export const numberOf = (tile) => (tile === 'J' ? 14 : Number(String(tile).slice(1)) || 0);
export const tileLabel = (tile) => (tile === 'J' ? '★' : String(Number(String(tile).slice(1)) || ''));
export const tileColor = (tile) => (tile === 'J' ? 'J' : String(tile).charAt(0));
export const isWild = (tile, okey) => tile === 'J' || (!!okey && tile === okey);

/** Taş puanı: 1 → 1, 2-9 → sayı, 10/11/12/13 → 10 puan, joker → 0. */
export const tilePoint = (tile) => {
  if (tile === 'J') return 0;
  const n = Number(String(tile).slice(1)) || 0;
  return n > 9 ? 10 : n;
};

/** Oturduğum yere göre koltuğun masa kenarı. */
export const slotOf = (seatIndex, mySeat) => SLOT_BY_OFFSET[(((seatIndex - mySeat) % 4) + 4) % 4];

/** Tahta dizilimi: satır başına en fazla 7 taş — 21 taş 7+7+7, 22 taş 7+7+8. */
export function rowSplit(tiles) {
  const rows = [];
  for (let start = 0; start < tiles.length; start += 7) rows.push(tiles.slice(start, start + 7));
  return rows.length ? rows : [[]];
}

export const formatBet = (value) => formatCoins(value);

/** Kalan tur süresini dakika:saniye olarak yazar. */
export function clockOf(deadline, now = Date.now()) {
  const at = Date.parse(deadline || '');
  if (!at) return '--:--';
  const left = Math.max(0, Math.round((at - now) / 1000));
  return `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
}