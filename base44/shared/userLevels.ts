/**
 * N seviyesi, VIP ve hediye seviyeleri.
 * - N seviyesi (N1, N2 …): hesaba yüklenen toplam coin ile yükselir
 *   (admin yüklemesi, başvuru onayı, dolar bozdurma).
 * - Hediye seviyesi: gönderilen / alınan hediyelerin K toplamı ile yükselir.
 *   Eşikler geometrik artar, böylece seviye sayıları okunur aralıkta kalır.
 * - VIP: yalnızca yönetici verir (VIP Merkezi); 5–12 arası özellik taşır.
 */

// Yüklenen coin eşikleri — N1 … N12
const N_THRESHOLDS = [50000, 150000, 300000, 600000, 1000000, 2000000, 4000000, 7000000, 12000000, 20000000, 35000000, 60000000];
// Hediye seviyesi: 1 K'dan başlar, her seviyede eşik %30 artar.
const GIFT_LADDER_RATIO = 1.3;
const GIFT_MAX_LEVEL = 60;

export const VIP_MIN = 0;
export const VIP_MAX = 12;

const stepsPassed = (value: any, list: number[]) => {
  const amount = Math.max(0, Number(value) || 0);
  let level = 0;
  for (const threshold of list) {
    if (amount < threshold) break;
    level += 1;
  }
  return level;
};

/** N seviyesi: yüklenen coin karşılığı (0 ise rozet gösterilmez). */
export const nLevel = (loadedCoins: any) => stepsPassed(loadedCoins, N_THRESHOLDS);

/** Hediye seviyesi: hediye K toplamı karşılığı (1 K → 1. seviye). */
export const giftLevel = (kTotal: any) => {
  const k = Math.max(0, Number(kTotal) || 0);
  if (k < 1) return 0;
  return Math.min(GIFT_MAX_LEVEL, Math.floor(Math.log(k) / Math.log(GIFT_LADDER_RATIO)) + 1);
};

/** Seviye rengi: 20'ye kadar yeşil, 30'a kadar koyu yeşil, 40'ta mor, sonra mavi → altın → kırmızı. */
export const levelTier = (level: number) =>
  level >= 60 ? 'red'
    : level >= 50 ? 'gold'
      : level >= 40 ? 'blue'
        : level >= 30 ? 'purple'
          : level >= 20 ? 'dark'
            : 'green';

/** Rozet verisi: kullanıcı kaydından N, VIP ve hediye seviyelerini üretir. */
export function badgeLevels(user: any) {
  const n = nLevel(user?.loaded_coins);
  const sent = giftLevel(user?.gift_sent_k);
  const received = giftLevel(user?.gift_received_k);
  return {
    n_level: n,
    vip_level: Math.min(VIP_MAX, Math.max(VIP_MIN, Math.floor(Number(user?.vip_level) || 0))),
    gift_sent_level: sent,
    gift_sent_tier: levelTier(sent),
    gift_received_level: received,
    gift_received_tier: levelTier(received),
  };
}

/** Yüklenen coin sayacını artırır (en fazla 200 kayıt okunur). */
export async function addLoadedCoins(base44: any, userId: string, amount: any) {
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  if (!userId || !add) return;
  const record = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!record?.id) return;
  await base44.asServiceRole.entities.User.update(record.id, {
    loaded_coins: Math.max(0, Number(record.loaded_coins) || 0) + add,
  }).catch(() => {});
}

/**
 * Hediye sayaçları: gönderen kişi her alıcı için, alıcı kendi payı kadar artar.
 * kPerRecipient: tek bir alıcıya giden K (adet dahil).
 */
export async function addGiftTotals(base44: any, { senderId, recipientIds, kPerRecipient }: any) {
  const k = Math.max(0, Number(kPerRecipient) || 0);
  if (!k) return;
  const ids = [...new Set((recipientIds || []).filter(Boolean))];
  if (senderId) {
    const sender = await base44.asServiceRole.entities.User.get(senderId).catch(() => null);
    if (sender?.id) {
      await base44.asServiceRole.entities.User.update(sender.id, {
        gift_sent_k: Math.round(((Number(sender.gift_sent_k) || 0) + k * ids.length) * 100) / 100,
      }).catch(() => {});
    }
  }
  for (const id of ids) {
    const person = await base44.asServiceRole.entities.User.get(id).catch(() => null);
    if (!person?.id) continue;
    await base44.asServiceRole.entities.User.update(person.id, {
      gift_received_k: Math.round(((Number(person.gift_received_k) || 0) + k) * 100) / 100,
    }).catch(() => {});
  }
}