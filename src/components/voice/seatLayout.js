// Sesli oda koltuk düzeni — görseldeki 8 sabit kapasite kullanılır.
export const SEAT_OPTIONS = [2, 5, 8, 9, 12, 15, 20, 24];

const LAYOUTS = {
  2: [2],
  4: [2, 2],
  5: [3, 2],
  6: [3, 3],
  8: [4, 4],
  9: [3, 3, 3],
  12: [4, 4, 4],
  15: [5, 5, 5],
  20: [5, 5, 5, 5],
  24: [6, 6, 6, 6],
};

/** Koltuk sayısını satır başına koltuk adetlerine böler. */
export function seatRows(count) {
  const total = Math.max(0, Number(count) || 0);
  if (LAYOUTS[total]) return LAYOUTS[total];
  const perRow = total > 16 ? 6 : total > 9 ? 5 : 4;
  const rows = [];
  let left = total;
  while (left > 0) {
    rows.push(Math.min(perRow, left));
    left -= perRow;
  }
  return rows;
}

/** Satırlara göre koltuk indeksleri (0 tabanlı). */
export function seatIndexRows(count) {
  let start = 0;
  return seatRows(count).map((size) => {
    const row = Array.from({ length: size }, (_, i) => start + i);
    start += size;
    return row;
  });
}

export const isSeatOption = (count) => SEAT_OPTIONS.includes(Number(count));