import { config } from '../config.js';
import { runRead, selectFrom } from '../db/supabase.js';
import { logger } from '../logger.js';

const MAX_CACHE_ENTRIES = 5000;
const cache = new Map();

/** Token içindeki rol: tanınmayan değerler en az yetkiye (user) indirilir. */
const fromClaim = (claim) => {
  if (!claim) return 'user';
  if (claim === 'authenticated') return 'user';
  if (['user', 'moderator', 'admin'].includes(claim)) return claim;
  return 'user';
};

const prune = (now) => {
  if (cache.size < MAX_CACHE_ENTRIES) return;
  for (const [key, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(key);
  }
  if (cache.size >= MAX_CACHE_ENTRIES) cache.clear();
};

/**
 * Rolü yalnızca veritabanından okur (istemciden gelen hiçbir role güvenilmez).
 * Sorgu başarısız olursa token içindeki rol kullanılır ve bu en fazla "user" olur —
 * böylece bir kesinti yetki yükseltmesine dönüşmez.
 */
export async function resolveRole(principal) {
  const fallback = fromClaim(principal.claimedRole);

  if (!config.ROLE_LOOKUP_ENABLED) return fallback;

  const now = Date.now();
  const cached = cache.get(principal.userId);
  if (cached && cached.expiresAt > now) return cached.role;

  try {
    const { rows } = await runRead(
      selectFrom(config.USERS_TABLE, {
        columns: [config.USERS_ID_COLUMN, config.USERS_ROLE_COLUMN],
        filters: [{ op: 'eq', column: config.USERS_ID_COLUMN, value: principal.userId }],
        limit: 1,
      })
    );

    const stored = rows.length ? rows[0][config.USERS_ROLE_COLUMN] : null;
    const role = typeof stored === 'string' && stored.trim() ? stored.trim() : fallback;

    prune(now);
    cache.set(principal.userId, { role, expiresAt: now + config.ROLE_CACHE_TTL_MS });
    return role;
  } catch (error) {
    logger.warn('rol sorgusu başarısız, token rolü kullanıldı', {
      code: error.code ?? null,
      userId: principal.userId,
    });
    return fallback;
  }
}

export function clearRoleCache() {
  cache.clear();
}