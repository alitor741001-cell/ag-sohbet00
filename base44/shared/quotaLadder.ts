/**
 * Kota kademeleri: elmas seviyesine karşılık gelen yayıncı kazancı.
 * Tutarlar kümülatiftir — 800.000 elmasa ulaşan yayıncının aylık kazancı 60 $ olur,
 * 1.200.000 elmasa ulaşınca 86 $'a yükselir; kademeler toplanmaz.
 * Aynı değer hem yayıncı kazancında hem hediye kutusu bakiyesinde kullanılır,
 * böylece kota tablosu tek kaynak olur.
 */

/** Kota tablosunun başlangıç değerleri: [elmas, yayıncı kazancı]. */
export const DEFAULT_QUOTA_TIERS: [number, number][] = [
  [200000, 15], [300000, 23], [500000, 39], [800000, 60], [1200000, 86], [1600000, 104],
  [2200000, 132], [2800000, 168], [3600000, 216], [5000000, 300], [6250000, 375], [7500000, 470],
  [10000000, 630], [12500000, 790], [15000000, 950], [20000000, 1350], [25000000, 1688],
  [30000000, 2025], [35000000, 2362], [40000000, 2700], [45000000, 3038], [50000000, 3375],
  [75000000, 5062], [100000000, 6750], [125000000, 8438], [150000000, 10125], [200000000, 13500],
  [250000000, 16875],
];

/** Varsayılan kademeler kayıt biçiminde (tablo boşsa hesap bu değerlerle yapılır). */
export const defaultQuotaTiers = () => DEFAULT_QUOTA_TIERS.map(([diamonds, dollars], index) => ({
  diamonds, broadcaster_dollars: dollars, active: true, sort_order: index + 1,
}));

/** Admin panelinden düzenlenen kota kademelerini okur. */
export async function loadQuotaTiers(base44: any) {
  return await base44.asServiceRole.entities.QuotaTier.filter({}, 'sort_order', 500).catch(() => []);
}

/**
 * Ulaşılan en yüksek kademenin yayıncı kazancı (tam dolar).
 * Hiçbir kademeye ulaşılmadıysa null döner — çağıran taraf ne yapacağına karar verir.
 * kValue: elmas miktarı (K = bin elmas).
 */
export function quotaDollarsFromK(kValue: any, tiers: any[] = []) {
  const diamonds = Math.max(0, Number(kValue) || 0) * 1000;
  const source = tiers && tiers.length ? tiers : defaultQuotaTiers();
  const reached = source.filter((tier: any) => tier?.active !== false && Number(tier?.diamonds) > 0 && Number(tier.diamonds) <= diamonds);
  if (!reached.length) return null;
  const top = reached.reduce((best: any, tier: any) => (Number(tier.diamonds) > Number(best.diamonds) ? tier : best), reached[0]);
  return Math.round(Number(top.broadcaster_dollars) || 0);
}