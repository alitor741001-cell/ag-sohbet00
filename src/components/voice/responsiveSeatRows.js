import { seatIndexRows } from '@/components/voice/seatLayout';

/** Reflow only rows whose smallest usable seats cannot fit the available width. */
export default function responsiveSeatRows(count, width) {
  const rows = seatIndexRows(count);
  const columns = Math.max(1, Math.floor((Math.max(0, width - 4) + 8) / 50));
  if (rows.every(row => row.length <= columns)) return rows;
  return Array.from({ length: Math.ceil(count / columns) }, (_, row) =>
    Array.from({ length: Math.min(columns, count - row * columns) }, (_, col) => row * columns + col));
}