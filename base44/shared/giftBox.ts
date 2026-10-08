import { waitUntil } from 'base44:runtime';
import { writeProfileSummary } from './supabaseMirror.ts';
import { giftBalance } from './giftWallet.ts';
import { getUsdTry, tlFromDollars, tlRateFrom } from './exchangeRate.ts';
import { loadQuotaTiers, quotaDollarsFromK } from './quotaLadder.ts';
import { agencyCommissionTotals } from './agencyBalance.ts';

/**
 * Hediye kutusu: alınan hediyelerin değeri, gönderim ve çekim kayıtları.
 * Değer kuralı kota tablosudur: ay içinde ulaşılan kademenin yayıncı kazancı yazılır
 * (ör. 800.000 elmas → 60 $, 1.200.000 elmas → 86 $). Elmas her ayın 1'inde sıfırlandığı
 * için kademe de her ay baştan başlar: her ayın elması kendi kademesiyle hesaplanır, aylık
 * kazançlar toplanarak bakiyeye eklenir. İlk kademeye ulaşılmadan eski oran geçerlidir,
 * böylece küçük kazançlar sıfırlanmaz. Tutar her zaman tam dolar olarak gösterilir
 * (küsurat yazılmaz); TL, piyasa kuru eksi 2 TL ile hesaplanır.
 */

export const COINS_PER_DOLLAR = 9000;
// Puan: her 10K = 1 puan.
const K_PER_UNIT = 10;
// İlk kota kademesine ulaşılmadan geçerli eski oran: 200K'ya kadar her 15K = 1 $, sonrası her 30K = 1 $.
const LEGACY_MAX_K = 200;
const LEGACY_K_PER_DOLLAR = 15;
const LEGACY_K_PER_DOLLAR_AFTER = 30;
// Kişi başına okunacak en fazla hediye / transfer kaydı.
const MAX_RECORDS = 2000;

/** Kademe altı elmasların eski oranla dolar karşılığı. */
function legacyDollarsFromK(kValue: any) {
  const k = Math.max(0, Number(kValue) || 0);
  const base = Math.floor(Math.min(k, LEGACY_MAX_K) / LEGACY_K_PER_DOLLAR);
  const extra = Math.floor(Math.max(0, k - LEGACY_MAX_K) / LEGACY_K_PER_DOLLAR_AFTER);
  return base + extra;
}

/**
 * Bir ayın elmas (K) toplamının dolar karşılığı — her zaman tam sayı (küsurat yazılmaz).
 * Kota tablosu esastır: ulaşılan en yüksek kademenin tutarı yazılır (800K → 60 $, 1M → 60 $).
 * Hiçbir kademeye ulaşılmadıysa eski oran kullanılır.
 */
export function giftDollarsFromK(kValue: any, tiers: any[] = []) {
  const ladder = quotaDollarsFromK(kValue, tiers);
  return ladder === null ? legacyDollarsFromK(kValue) : ladder;
}

const TR_MONTH = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit' });

/**
 * Ayın 1'i (Türkiye saatiyle) — elmas yalnızca bu aydan itibaren sayılır.
 * Ay başında elmas sıfırlanır, bakiye (dolar/TL) ise tüm zamanların toplamıyla devam eder.
 */
export function monthStartIso(now = new Date()) {
  const [year, month] = TR_MONTH.format(now).split('-');
  return new Date(`${year}-${month}-01T00:00:00+03:00`).toISOString().slice(0, 19);
}

const TR_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul', year: 'numeric', month: '2-digit', day: '2-digit' });

/**
 * Bugünün başlangıcı (Türkiye saatiyle 00:00) — günlük listeler her gece 24:00'te sıfırlanır.
 * Elmasın ay başı kuralı ayrı kalır; yalnızca günlük listeler bu eşiği kullanır.
 */
export function dayStartIso(now = new Date()) {
  return new Date(`${TR_DAY.format(now)}T00:00:00+03:00`).toISOString().slice(0, 19);
}

/** Bir kaydın ait olduğu ayın başı — kademe aylık gruplandığı için anahtar olarak kullanılır. */
function monthStartOf(created: any) {
  const date = new Date(String(created || ''));
  if (Number.isNaN(date.getTime())) return '';
  return monthStartIso(date);
}

/** Aylık elmas toplamları: her ay kendi kademesiyle hesaplanır ve toplanır. */
function dollarsFromMonthlyTotals(totals: Map<string, number>, tiers: any[] = []) {
  let dollars = 0;
  totals.forEach((kValue) => { dollars += giftDollarsFromK(kValue, tiers); });
  return dollars;
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
  const tiers = await loadQuotaTiers(base44);
  const records = [];
  for (let skip = 0; ; skip += 500) {
    const batch = await base44.asServiceRole.entities.GiftSend.filter({ recipient_id: userId }, 'created_date', 500, skip);
    records.push(...batch);
    if (batch.length < 500) break;
  }
  const monthStart = monthStartIso();
  // Elmas; ay başı ile elle sıfırlama anından hangisi yeniyse ondan sonrasını sayar.
  const start = resetAt && resetAt > monthStart ? resetAt : monthStart;
  const round = (value: number) => Math.round(value * 100) / 100;
  let k = 0;
  let monthK = 0;
  // Kademe her ay baştan başlar: her ayın elması kendi kademesiyle dolara çevrilir.
  const months = new Map();
  const balanceMonths = new Map();
  records.forEach((record) => {
    const kValue = Math.max(0, Number(record?.k_value) || 0);
    const created = String(record?.created_date || '').slice(0, 19);
    if (!kValue || !created) return;
    k += kValue;
    const key = monthStartOf(created);
    months.set(key, (months.get(key) || 0) + kValue);
    if (created >= start) monthK += kValue;
    // Bakiye elle sıfırlandıysa kullanılabilir bakiyeye yalnızca sıfırlama sonrası hediyeler sayılır.
    if (!resetAt || created >= resetAt) balanceMonths.set(key, (balanceMonths.get(key) || 0) + kValue);
  });
  return {
    k: round(k),
    units: Math.floor(monthK / K_PER_UNIT),
    dollars: dollarsFromMonthlyTotals(months, tiers),
    reset_dollars: dollarsFromMonthlyTotals(balanceMonths, tiers),
    month_k: round(monthK),
    month_score: Math.round(monthK * 1000),
  };
}

/** Hediye kutusu durumu: coins, alınan hediye, harcanan ve kullanılabilir bakiye (TL). */
export async function giftBoxSummary(base44: any, user: any) {
  const resetAt = await giftResetAt(base44);
  const [received, transfers, coins, market, commission] = await Promise.all([
    receivedGiftTotals(base44, user.id, resetAt),
    base44.asServiceRole.entities.GiftTransfer
      .filter({ sender_id: user.id }, '-created_date', MAX_RECORDS)
      .catch(() => []),
    giftBalance(base44, user),
    getUsdTry(base44),
    agencyCommissionTotals(base44, user.id),
  ]);

  // Sıfırlama anından önceki harcamalar yeni bakiyeden düşülmez.
  const spent = Math.round(
    transfers
      .filter((record) => record?.status !== 'rejected')
      .filter((record) => !resetAt || String(record?.created_date || '').slice(0, 19) >= resetAt)
      .reduce((sum, record) => sum + Math.max(0, Number(record?.dollars) || 0), 0) * 100,
  ) / 100;
  // Bakiye tam dolar: küsurat gösterilmez. Ajans komisyonu ve asistanlık payı da
  // aynı bakiyeye yazılır — yayıncı kotayı tamamladığı an tutar kullanılabilir olur.
  const available = Math.max(0, Math.floor(received.reset_dollars + commission.total - spent));
  const tl_rate = tlRateFrom(market.rate);

  const summary = {
    received_k: received.k,
    received_score: Math.round(received.k * 1000),
    // Elmas her ayın 1'inde sıfırlanır: yalnızca bu ayın hediyeleri sayılır.
    month_k: received.month_k,
    month_score: received.month_score,
    units: received.units,
    dollars: received.dollars,
    commission_dollars: commission.total,
    spent_dollars: spent,
    available_dollars: available,
    coins,
    market_rate: market.rate,
    tl_rate,
    received_tl: tlFromDollars(received.dollars, tl_rate),
    available_tl: tlFromDollars(available, tl_rate),
    rate_stale: !!market.stale,
  };
  // Özet her hesaplandığında aynaya yazılır: profil sayfası hazır değeri okur.
  waitUntil(writeProfileSummary(base44, user.id, { wallet: summary }));
  return summary;
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