import { config } from '../config.js';
import { runRead, selectFrom } from '../db/supabase.js';
import { AppError } from '../errors.js';

const PUBLIC_COLUMNS = config.roomsPublicColumns;

/**
 * Oda kaydını yalnızca herkese açık kolonlarla döndürür.
 * Parola, moderatör listesi, banlı kullanıcılar gibi alanlar hiçbir koşulda
 * dışarı çıkmaz: tablo hiçbir yerde `select('*')` ile okunmaz.
 */
const toPublicRoom = (row) =>
  Object.fromEntries(PUBLIC_COLUMNS.map((column) => [column, row[column] ?? null]));

export async function listRooms({ limit, offset, status }) {
  const filters =
    status === 'active'
      ? [{ op: 'eq', column: config.ROOMS_STATUS_COLUMN, value: config.ROOMS_STATUS_ACTIVE }]
      : [];

  const { rows, total } = await runRead(
    selectFrom(config.ROOMS_TABLE, {
      columns: PUBLIC_COLUMNS,
      filters,
      orderBy: config.ROOMS_ORDER_COLUMN,
      ascending: false,
      limit,
      offset,
    })
  );

  return { items: rows.map(toPublicRoom), total, limit, offset };
}

export async function getRoom(ref) {
  const { rows } = await runRead(
    selectFrom(config.ROOMS_TABLE, {
      columns: PUBLIC_COLUMNS,
      filters: [{ op: 'eq', column: config.ROOMS_ID_COLUMN, value: ref }],
      limit: 1,
    })
  );

  if (!rows.length) throw AppError.notFound('Oda bulunamadı.');
  return toPublicRoom(rows[0]);
}