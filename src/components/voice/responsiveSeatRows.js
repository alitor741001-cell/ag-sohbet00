import { seatIndexRows } from '@/components/voice/seatLayout';

/**
 * Koltuk dizilimi sabittir: 2 → tek sıra, 5 → 1+4, 8 → 4+4, 9 → 1+4+4,
 * 12 → 2+5+5, 15 → 5+5+5, 24 → 6+6+6+6. Satırlar ekran genişliğine göre
 * bölünmez; dar ekranda koltuk boyutu küçülür, dizilim aynı kalır.
 */
export default function responsiveSeatRows(count) {
  return seatIndexRows(count);
}