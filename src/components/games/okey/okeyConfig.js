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

/**
 * Dizili taşların puanı: SERİ DİZ'de serileri, ÇİFTE DİZ'de çiftleri oluşturan taşlar
 * sayılır. Hiçbir gruba girmeyen tek taşlar puanlanmaz.
 */
export const arrangedScore = (tiles, mode, okey) =>
  mode === 'cift' ? ciftScore(tiles || [], okey) : seriScore(tiles || [], okey);

/** SERİ: aynı renkte ardışık en az 3 sayı. Eksik sayılar joker/okey ile kapatılır. */
function seriScore(tiles, okey) {
  const naturals = tiles.filter((tile) => !isWild(tile, okey));
  let wilds = tiles.length - naturals.length;
  let total = 0;
  for (const color of ['R', 'S', 'M', 'Y']) {
    // Aynı sayıdan iki taş aynı seriye girmez: renk başına sayılar tekilleştirilir.
    const numbers = [...new Set(naturals.filter((tile) => tileColor(tile) === color).map(numberOf))].sort((a, b) => a - b);
    let run = [];
    let gaps = 0;
    // Seriyi kapat: 3 sayı uzunluğunda olmalı. Eksik sayı jokerle kapatılır, iki taşlık
    // bir dizinin ucuna en fazla bir joker eklenir; tek taş seri sayılmaz.
    const flush = () => {
      const need = Math.max(0, 3 - run.length - gaps);
      if (need <= 1 && gaps + need <= wilds) {
        wilds -= gaps + need;
        total += run.reduce((sum, n) => sum + tilePoint(`${color}${n}`), 0);
      }
      run = [];
      gaps = 0;
    };
    numbers.forEach((n) => {
      const gap = run.length ? n - run[run.length - 1] : 1;
      if (gap > 2) flush();
      if (run.length) gaps += gap - 1;
      run.push(n);
    });
    flush();
  }
  return total;
}

/** ÇİFT: aynı sayıdan en az 2 taş — farklı renklerden; ikiz taşlar da çift sayılır. */
function ciftScore(tiles, okey) {
  const naturals = tiles.filter((tile) => !isWild(tile, okey));
  let total = 0;
  for (let n = 1; n <= 13; n += 1) {
    const counts = { R: 0, S: 0, M: 0, Y: 0 };
    naturals.forEach((tile) => {
      if (numberOf(tile) === n) counts[tileColor(tile)] += 1;
    });
    const point = tilePoint(`R${n}`);
    for (;;) {
      const colors = ['R', 'S', 'M', 'Y'].filter((color) => counts[color] > 0);
      if (colors.length >= 2) {
        colors.forEach((color) => { counts[color] -= 1; });
        total += point * colors.length;
      } else if (colors.length === 1 && counts[colors[0]] >= 2) {
        counts[colors[0]] -= 2;
        total += point * 2;
      } else break;
    }
  }
  return total;
}

/** Oturduğum yere göre koltuğun masa kenarı. */
export const slotOf = (seatIndex, mySeat) => SLOT_BY_OFFSET[(((seatIndex - mySeat) % 4) + 4) % 4];

/** Tahtadaki dizilim: seri (renk sırası) ya da çift (sayı sırası). */
export function arrangeTiles(tiles, mode) {
  const list = [...tiles];
  if (mode === 'cift') {
    return list.sort((a, b) => numberOf(a) - numberOf(b) || COLOR_ORDER[tileColor(a)] - COLOR_ORDER[tileColor(b)]);
  }
  return list.sort((a, b) => COLOR_ORDER[tileColor(a)] - COLOR_ORDER[tileColor(b)] || numberOf(a) - numberOf(b));
}

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