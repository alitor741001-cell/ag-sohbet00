// Sıralama dönemleri: sesli oda hediyeleri ve oyun kazanan tabloları aynı takvimi kullanır.
// Günlük dönem Türkiye saatiyle 00:00'da başlar; haftalık dönem sabit bir başlangıçtan
// itibaren 7 günde bir yenilenir (her pazartesi 00:00). Toplam hiç sıfırlanmaz.
const TZ = 'Europe/Istanbul';
// Haftalık dönemlerin başlangıç noktası (pazartesi): her 7 günde bir yeni dönem açılır.
const WEEK_ANCHOR = Date.UTC(2026, 0, 5);
const DAY_MS = 24 * 60 * 60 * 1000;

/** Türkiye saatine göre günün tarihi (YYYY-MM-DD). */
export const trDayKey = (date = new Date()) => date.toLocaleDateString('sv-SE', { timeZone: TZ });

/** İçinde bulunulan 7 günlük dönemin ilk günü (YYYY-MM-DD, Türkiye saatiyle). */
export function trWeekKey(date = new Date()) {
  const day = Date.parse(`${trDayKey(date)}T00:00:00Z`);
  const offset = ((Math.floor((day - WEEK_ANCHOR) / DAY_MS) % 7) + 7) % 7;
  return new Date(day - offset * DAY_MS).toISOString().slice(0, 10);
}

/** Günün başladığı an (UTC, saniyeye kadar): Türkiye saatiyle 00:00. */
export const trDayStartIso = (date = new Date()) =>
  new Date(`${trDayKey(date)}T00:00:00+03:00`).toISOString().slice(0, 19);

/** İçinde bulunulan haftalık dönemin başladığı an (UTC, saniyeye kadar). */
export const trWeekStartIso = (date = new Date()) =>
  new Date(`${trWeekKey(date)}T00:00:00+03:00`).toISOString().slice(0, 19);