import { giftBalance } from './giftWallet.ts';
import { getUsdTry, tlFromDollars, tlRateFrom } from './exchangeRate.ts';

/**
 * Hediye kutusu: alınan hediyelerin değeri, gönderim ve çekim kayıtları.
 * Değer kuralı: 200K'ya kadar her 10K = 1 puan, 20 puan = 1 dolar;
 * 200K'dan sonra her 17K = 1 dolar. Bakiye TL olarak, piyasa kuru eksi 2 TL ile gösterilir.
 */

export const COINS_PER_DOLLAR = 5000;
const BASE_MAX_K = 200;
const K_PER_UNIT = 10;
const UNITS_PER_DOLLAR = 20;
const K_PER_DOLLAR_AFTER = 17;
const UNIT_DOLLARS = 1 / UNITS_PER_DOLLAR;
// Kişi başına okunacak en fazla hediye / transfer kaydı.
const MAX_RECORDS = 2000;

/** Alınan hediye K toplamının dolar karşılığı. */
export function giftDollarsFromK(kValue: any) {
  const k = Math.max(0, Number(kValue) || 0);
  const base = (Math.min(k, BASE_MAX_K) / K_PER_UNIT) * UNIT_DOLLARS;
  const extra = Math.max(0, k - BASE_MAX_K) / K_PER_DOLLAR_AFTER;
  return Math.round((base + extra) * 100) / 100;
}

/** Kişinin aldığı hediyelerin K toplamı, puanı ve dolar değeri. */
export async function receivedGiftTotals(base44: any, userId: string) {
  const records = await base44.asServiceRole.entities.GiftSend
    .filter({ recipient_id: userId }, '-created_date', MAX_RECORDS)
    .catch(() => []);
  const k = Math.round(records.reduce((sum, record) => sum + Math.max(0, Number(record?.k_value) || 0), 0) * 100) / 100;
  return {
    k,
    units: Math.floor(Math.min(k, BASE_MAX_K) / K_PER_UNIT),
    dollars: giftDollarsFromK(k),
  };
}

/** Hediye kutusu durumu: coins, alınan hediye, harcanan ve kullanılabilir bakiye (TL). */
export async function giftBoxSummary(base44: any, user: any) {
  const [received, transfers, coins, market] = await Promise.all([
    receivedGiftTotals(base44, user.id),
    base44.asServiceRole.entities.GiftTransfer
      .filter({ sender_id: user.id }, '-created_date', MAX_RECORDS)
      .catch(() => []),
    giftBalance(base44, user),
    getUsdTry(base44),
  ]);

  const spent = Math.round(
    transfers
      .filter((record) => record?.status !== 'rejected')
      .reduce((sum, record) => sum + Math.max(0, Number(record?.dollars) || 0), 0) * 100,
  ) / 100;
  const available = Math.max(0, Math.round((received.dollars - spent) * 100) / 100);
  const tl_rate = tlRateFrom(market.rate);

  return {
    received_k: received.k,
    received_score: Math.round(received.k * 1000),
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