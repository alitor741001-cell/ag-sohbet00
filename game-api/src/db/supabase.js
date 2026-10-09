import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { logger } from '../logger.js';

/**
 * Supabase istemcisi YALNIZCA okuma için kullanılır.
 * Servis anahtarı yalnızca sunucuda durur; bu dosya dışında hiçbir yerde
 * insert/update/delete/upsert/rpc çağrısı yapılmaz.
 */
export const db = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  db: { schema: config.SUPABASE_SCHEMA },
  global: { headers: { 'x-application-name': config.SERVICE_NAME } },
});

const MAX_ROWS = 200;

const FILTERS = {
  eq: (query, column, value) => query.eq(column, value),
  neq: (query, column, value) => query.neq(column, value),
  gt: (query, column, value) => query.gt(column, value),
  gte: (query, column, value) => query.gte(column, value),
  lt: (query, column, value) => query.lt(column, value),
  lte: (query, column, value) => query.lte(column, value),
  ilike: (query, column, value) => query.ilike(column, value),
  in: (query, column, value) => query.in(column, value),
};

/**
 * Okuma sorgusu kurar. Dönen değer await edilebilir; sonucu `runRead` ile alın.
 * Kolon ve filtre adları config doğrulamasından geçmiş güvenli adlardır.
 */
export function selectFrom(table, { columns, filters = [], orderBy, ascending = false, limit = 20, offset = 0 } = {}) {
  let query = db.from(table).select(columns.join(','), { count: 'exact' });

  for (const filter of filters) {
    const apply = FILTERS[filter.op];
    if (!apply) throw AppError.internal(`Desteklenmeyen filtre: ${filter.op}`);
    query = apply(query, filter.column, filter.value);
  }

  if (orderBy) query = query.order(orderBy, { ascending });

  const size = Math.min(Math.max(Math.trunc(limit) || 1, 1), MAX_ROWS);
  const from = Math.max(Math.trunc(offset) || 0, 0);
  return query.range(from, from + size - 1);
}

/** Sorguyu çalıştırır; ham veritabanı hataları istemciye sızdırılmaz. */
export async function runRead(query) {
  const { data, error, count } = await query;
  if (error) {
    logger.error('supabase okuma hatası', {
      code: error.code ?? null,
      detail: error.message ?? null,
    });
    throw AppError.unavailable('Veritabanı şu anda yanıt vermiyor.');
  }
  return { rows: data ?? [], total: typeof count === 'number' ? count : null };
}

/** Sağlık kontrolü: yalnızca bağlantıyı doğrular, satır çekmez. */
export async function pingDatabase() {
  const started = Date.now();
  const { error } = await db
    .from(config.USERS_TABLE)
    .select('*', { count: 'exact', head: true });

  if (error) {
    logger.warn('sağlık kontrolü başarısız', { code: error.code ?? null, detail: error.message ?? null });
    throw AppError.unavailable('Veritabanı bağlantısı kurulamadı.');
  }
  return Date.now() - started;
}