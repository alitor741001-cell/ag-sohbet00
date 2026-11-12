// Sesli oda koltuk düzeni — sabit kapasiteler (tekli koltuk dahil).
export const SEAT_OPTIONS = [1, 2, 5, 8, 9, 12, 13, 15, 24];

// Görüntülü PK açıkken geçerli olan koltuk düzenleri: bunun dışındaki modlar seçilemez.
export const VIDEO_PK_SEAT_OPTIONS = [1, 2, 8];

// Satır düzeni referans görsellerle aynı: az koltukta satır başına 4, çok koltukta 5;
// artan koltuklar en üstteki ortalanmış satıra yazılır (5 → 1+4, 8 → 4+4, 12 → 2+5+5).
const LAYOUTS = {
  1: [1],
  2: [2],
  4: [4],
  5: [1, 4],
  6: [2, 4],
  8: [4, 4],
  9: [1, 4, 4],
  // Normal PK düzeni: sunucu + her takımda 3+3 koltuk.
  13: [1, 6, 6],
  12: [2, 5, 5],
  15: [5, 5, 5],
  20: [5, 5, 5, 5],
  // 24 mikrofon: 4 sıra, her sırada 6 koltuk — rakamlar 1'den 24'e sırayla okunur.
  24: [6, 6, 6, 6],
  // Eski 30 koltuklu odalar aynı düzeni korusun.
  30: [8, 8, 8, 6],
};

/** Koltuk sayısını satır başına koltuk adetlerine böler. */
export function seatRows(count) {
  const total = Math.max(0, Number(count) || 0);
  if (LAYOUTS[total]) return LAYOUTS[total];
  const perRow = total > 8 ? 5 : 4;
  const rows = [];
  let left = total;
  // Artan koltuklar en üste yazılır: üstteki satır ortalanır, alttaki satırlar tam doludur.
  while (left > 0) {
    rows.unshift(Math.min(perRow, left));
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