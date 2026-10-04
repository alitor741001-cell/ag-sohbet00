/**
 * Dolar/TL kuru: piyasa kuru otomatik çekilir ve önbelleğe alınır.
 * Bakiye hesabında her zaman piyasa kuru eksi 2 TL kullanılır.
 */

const CACHE_KEY = 'usd_try_rate';
const CACHE_MS = 15 * 60 * 1000;
const MARGIN_TL = 2;
// Kaynaklara ulaşılamazsa kullanılacak değer (piyasa kuru).
const FALLBACK_MARKET_RATE = 47;
const SOURCES = [
  'https://open.er-api.com/v6/latest/USD',
  'https://api.frankfurter.app/latest?from=USD&to=TRY',
];

async function fetchMarketRate() {
  for (const url of SOURCES) {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json' } });
      if (!response.ok) continue;
      const data = await response.json();
      const rate = Number(data?.rates?.TRY) || 0;
      if (rate > 1) return rate;
    } catch {
      // Sıradaki kaynağı dene.
    }
  }
  return 0;
}

/** Güncel dolar kuru: taze değer önbellekten ya da kaynaktan gelir. */
export async function getUsdTry(base44: any) {
  const stored = await base44.asServiceRole.entities.AppConfig.filter({ key: CACHE_KEY }, null, 1).catch(() => []);
  const record = stored[0];
  let cached: any = {};
  try {
    cached = JSON.parse(record?.value || '{}') || {};
  } catch {
    cached = {};
  }
  const cachedRate = Number(cached?.rate) || 0;
  if (cachedRate > 1 && Date.now() - Number(cached?.at || 0) < CACHE_MS) {
    return { rate: cachedRate, cached: true };
  }

  const rate = await fetchMarketRate();
  if (rate > 1) {
    const value = JSON.stringify({ rate, at: Date.now() });
    if (record?.id) await base44.asServiceRole.entities.AppConfig.update(record.id, { value }).catch(() => {});
    else await base44.asServiceRole.entities.AppConfig.create({ key: CACHE_KEY, value }).catch(() => {});
    return { rate, cached: false };
  }

  return { rate: cachedRate > 1 ? cachedRate : FALLBACK_MARKET_RATE, cached: true, stale: true };
}

/** Bakiyede kullanılan kur: piyasa kuru eksi sabit 2 TL. */
export function tlRateFrom(marketRate: number) {
  return Math.max(0.5, Math.round((Number(marketRate) - MARGIN_TL) * 100) / 100);
}

/** Dolar tutarının TL karşılığı. */
export function tlFromDollars(dollars: number, tlRate: number) {
  return Math.round((Number(dollars) || 0) * (Number(tlRate) || 0) * 100) / 100;
}

export const TL_MARGIN = MARGIN_TL;