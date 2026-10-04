import { giftBalance } from './giftWallet.ts';
import { getUsdTry, tlFromDollars, tlRateFrom } from './exchangeRate.ts';

/**
 * Hediye kutusu: alınan hediyelerin değeri, gönderim ve çekim kayıtları.
 * Değer kuralı: 200K'ya kadar her 5K = 1 dolar, 200K'dan sonra her 10K = 1 dolar.
 * Tutar her zaman tam dolar olarak gösterilir (küsurat yazılmaz); TL, piyasa kuru eksi 2 TL ile hesaplanır.
 */

export const COINS_PER_DOLLAR = 5000;
const BASE_MAX_K = 200;
// Puan: her 10K = 1 puan — 200K'dan sonra da artmaya devam eder.
const K_PER_UNIT = 10;
const K_PER_DOLLAR = 5;
const K_PER_DOLLAR_AFTER = 10;
// Kişi başına okunacak en fazla hediye / transfer kaydı.
const MAX_RECORDS = 2000;

/**
 * Alınan hediye K toplamının dolar karşılığı — her zaman tam sayı (küsurat yazılmaz).
 * 200K'ya kadar her 5K'da 1 artar; 200K'dan sonra her 10K'da 1 artar.
 * Ara değerler bir üst basamağa yuvarlanmaz: 13K → 2, 14K → 2, tam 15K'da 3 olur.
 */
export function giftDollarsFromK(kValue: any) {
  const k = Math.max(0, Number(kValue) || 0);
  const base = Math.floor(Math.min(k, BASE_MAX_K) / K_PER_DOLLAR);
  const extra = Math.floor(Math.max(0, k - BASE_MAX_K) / K_PER_DOLLAR_AFTER);
  return base + extra;
}

/**
 * Ayın 1'i (Türkiye saatiyle) — elmas yalnızca bu aydan itibaren sayılır.
 * Ay başında elmas sıfırlanır, bakiye (dolar/TL) ise tüm zamanların toplamıyla devam eder.
 */
export function monthStartIso(now = new Date()) {
  const [year, month] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit' })
    .format(now)
    .split('-');
  return new Date(`${year}-${month}-01T00:00:00+03:00`).toISOString().slice(0, 19);
}

/**
 * Elle sıfırlama anı (AppConfig: gift_reset_at).
 * Bu andan önceki hediyeler ne elmasa ne de kullanılabilir bakiyeye sayılır;
 * ayrıca elmas ayın 1'inde kendiliğinden sıfırlanır.
 */
export async function giftResetAt(base44: any) {
  const config = await base44.asServiceRole.entities.AppConfig
    .filter({ key: 'gift_reset_at' }, '-created_date', 1)
    .catch(() => []);
  return String(config[0]?.value || '').slice(0, 19);
}

/** Kişinin aldığı hediyelerin K toplamı, bu ayın elması ve dolar değeri. */
export async function receivedGiftTotals(base44: any, userId: string, resetAt = '') {
  const records = await base44.asServiceRole.entities.GiftSend
    .filter({ recipient_id: userId }, '-created_date', MAX_RECORDS)
    .catch(() => []);
  const k = Math.round(records.reduce((sum, record) => sum + Math.max(0, Number(record?.k_value) || 0), 0) * 100) / 100;
  const monthStart = monthStartIso();
  // Elmas; ay başı ile elle sıfırlama anından hangisi yeniyse ondan sonrasını sayar.
  const start = resetAt && resetAt > monthStart ? resetAt : monthStart;
  const monthK = Math.round(records.reduce((sum, record) => {
    const created = String(record?.created_date || '');
    if (!created || created.slice(0, 19) < start) return sum;
    return sum + Math.max(0, Number(record?.k_value) || 0);
  }, 0) * 100) / 100;
  // Bakiye elle sıfırlandıysa kullanılabilir bakiyeye yalnızca sıfırlama sonrası hediyeler sayılır.
  const resetK = resetAt
    ? Math.round(records.reduce((sum, record) => {
        const created = String(record?.created_date || '');
        if (!created || created.slice(0, 19) < resetAt) return sum;
        return sum + Math.max(0, Number(record?.k_value) || 0);
      }, 0) * 100) / 100
    : k;
  return {
    k,
    units: Math.floor(monthK / K_PER_UNIT),
    dollars: giftDollarsFromK(k),
    reset_dollars: giftDollarsFromK(resetK),
    month_k: monthK,
    month_score: Math.round(monthK * 1000),
  };
}

/** Hediye kutusu durumu: coins, alınan hediye, harcanan ve kullanılabilir bakiye (TL). */
export async function giftBoxSummary(base44: any, user: any) {
  const resetAt = await giftResetAt(base44);
  const [received, transfers, coins, market] = await Promise.all([
    receivedGiftTotals(base44, user.id, resetAt),
    base44.asServiceRole.entities.GiftTransfer
      .filter({ sender_id: user.id }, '-created_date', MAX_RECORDS)
      .catch(() => []),
    giftBalance(base44, user),
    getUsdTry(base44),
  ]);

  // Sıfırlama anından önceki harcamalar yeni bakiyeden düşülmez.
  const spent = Math.round(
    transfers
      .filter((record) => record?.status !== 'rejected')
      .filter((record) => !resetAt || String(record?.created_date || '').slice(0, 19) >= resetAt)
      .reduce((sum, record) => sum + Math.max(0, Number(record?.dollars) || 0), 0) * 100,
  ) / 100;
  // Bakiye tam dolar: küsurat gösterilmez.
  const available = Math.max(0, Math.floor(received.reset_dollars - spent));
  const tl_rate = tlRateFrom(market.rate);

  return {
    received_k: received.k,
    received_score: Math.round(received.k * 1000),
    // Elmas her ayın 1'inde sıfırlanır: yalnızca bu ayın hediyeleri sayılır.
    month_k: received.month_k,
    month_score: received.month_score,
    units: received.units,
    dollars: received.dollars,
    spent_dollars: spent,
    available_dollars: available,
    coins,
    market_rate: market.rate,
    tl_rate,
    received_tl: tlFromDollars(received.dollars, tl_rate),
    available_tl: tlFromDollars(available, tl_rate),
    rate_stale: !!market.stale,
  };
}

/** Kimlik numarasına göre kişi: üye numarası ya da ödeme referansı. */
export async function findByMemberId(base44: any, memberId: any) {
  const query = String(memberId || '').trim();
  if (!query) return null;
  const byMember = await base44.asServiceRole.entities.User.filter({ member_id: query }, null, 1).catch(() => []);
  if (byMember[0]) return byMember[0];
  const byReference = await base44.asServiceRole.entities.User
    .filter({ payment_reference: query }, null, 1)
    .catch(() => []);
  return byReference[0] || null;
}