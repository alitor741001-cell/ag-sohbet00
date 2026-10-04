// Sesli oda koltuk düzeni — sabit kapasiteler (tekli koltuk dahil).
export const SEAT_OPTIONS = [1, 2, 5, 8, 9, 12, 15, 20, 24];

const LAYOUTS = {
  1: [1],
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

const emptySeat = (index, locked = false) => ({ index, user_id: '', name: '', avatar: '', frame: '', frame_scale: 100, locked, muted: false });

/**
 * Koltuk sayısını değiştirir: yeri kalan herkes kendi koltuğunda kalır, oda sahibi her
 * koşulda bir koltuk alır, dışarıda kalanların hepsi tek hamlede izleyiciye düşer.
 */
export function resizeSeats(seats = [], count, keepId = '') {
  const total = Math.max(0, Number(count) || 0);
  const current = Array.isArray(seats) ? seats : [];
  const occupied = current.filter((seat) => seat.user_id);
  const slots = Array.from({ length: total }, (_, index) => {
    const seat = occupied.find((item) => item.index === index);
    return seat ? { ...seat, index } : null;
  });
  // Sığmayanlar boşalan yerlere sırayla taşınır: oda sahibi ilk sırada.
  const overflow = occupied
    .filter((seat) => seat.index >= total)
    .sort((a, b) => (a.user_id === keepId ? -1 : b.user_id === keepId ? 1 : a.index - b.index));
  overflow.forEach((person) => {
    let spot = slots.findIndex((slot) => !slot);
    if (spot < 0) {
      // Yer kalmadıysa oda sahibi son koltuğu alır, diğerleri izleyiciye düşer.
      if (person.user_id !== keepId) return;
      spot = slots.length - 1;
    }
    slots[spot] = { ...person, index: spot };
  });
  return slots.map((slot, index) => {
    const locked = !!current.find((seat) => seat.index === index)?.locked;
    return slot ? { ...slot, index, locked } : emptySeat(index, locked);
  });
}