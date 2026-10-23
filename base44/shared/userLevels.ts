/**
 * N seviyesi, VIP ve hediye seviyeleri.
 * - N seviyesi (N1, N2 …): yükleme kademesiyle yükselir — 50k → N1, 200k → N2, 500k → N3,
 *   1M → N4, sonrası her 500k'da +1 (1,5M → N5)
 *   (admin yüklemesi, başvuru onayı, dolar bozdurma).
 * - Hediye seviyesi: gönderilen / alınan hediyelerin K toplamı ile yükselir.
 *   Eşikler geometrik artar, böylece seviye sayıları okunur aralıkta kalır.
 * - VIP: VIP Merkezi'nden süreli verilir; coin yüklemesinde otomatik atanır (bkz. vip.ts).
 */
import { effectiveVipLevel, grantAutoVip, vipDaysLeft } from './vip.ts';

export { VIP_MAX, VIP_MIN } from './vip.ts';

// N kademesi: 50k → N1, 200k → N2, 500k → N3, 1M → N4; sonrası her 500k'da bir seviye (1,5M → N5, en fazla N50).
const N_LADDER = [50000, 200000, 500000, 1000000];
const N_STEP = 500000;
const N_MAX = 50;
// Hediye seviyesi: 1 K'dan başlar, her seviyede eşik %30 artar.
const GIFT_LADDER_RATIO = 1.3;
const GIFT_MAX_LEVEL = 500;

/** N seviyesi: 50k → N1, 200k → N2, 500k → N3, 1M → N4, sonrası her 500k'da +1 (0 ise rozet gösterilmez). */
export const nLevel = (loadedCoins: any) => {
  const coins = Math.max(0, Number(loadedCoins) || 0);
  let level = 0;
  while (level < N_LADDER.length && coins >= N_LADDER[level]) level += 1;
  if (level < N_LADDER.length) return level;
  return Math.min(N_MAX, N_LADDER.length + Math.floor((coins - N_LADDER[N_LADDER.length - 1]) / N_STEP));
};

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
    vip_level: effectiveVipLevel(user),
    vip_days_left: vipDaysLeft(user) || 0,
    gift_sent_level: sent,
    gift_sent_tier: levelTier(sent),
    gift_received_level: received,
    gift_received_tier: levelTier(received),
  };
}

/** Yüklenen coin sayacını artırır; eşiği geçen yükleme VIP'i çantaya ekler. */
export async function addLoadedCoins(base44: any, userId: string, amount: any) {
  const add = Math.max(0, Math.floor(Number(amount) || 0));
  if (!userId || !add) return;
  const record = await base44.asServiceRole.entities.User.get(userId).catch(() => null);
  if (!record?.id) return;
  await base44.asServiceRole.entities.User.update(record.id, {
    loaded_coins: Math.max(0, Number(record.loaded_coins) || 0) + add,
  }).catch(() => {});
  // 1M+ yükleme VIP kazandırır (3M → VIP10, 5M → VIP11, 10M → VIP12).
  await grantAutoVip(base44, record, add).catch(() => null);
}

/**
 * Hediye sayaçları: gönderen kişi her alıcı için, alıcı kendi payı kadar artar.
 * kPerRecipient: tek bir alıcıya giden K (adet dahil).
 * Dönen değer, hediye seviyesinin önce → sonra değişimidir; seviye atlama duyurusu bununla kurulur.
 */
export async function addGiftTotals(base44: any, { senderId, recipientIds, kPerRecipient }: any) {
  const k = Math.max(0, Number(kPerRecipient) || 0);
  if (!k) return null;
  const ids = [...new Set((recipientIds || []).filter(Boolean))];
  let sender = null;
  if (senderId) {
    const record = await base44.asServiceRole.entities.User.get(senderId).catch(() => null);
    if (record?.id) {
      const sentK = Math.round(((Number(record.gift_sent_k) || 0) + k * ids.length) * 100) / 100;
      sender = {
        user_id: record.id,
        name: record.username || record.full_name || 'Kullanıcı',
        before: giftLevel(record.gift_sent_k),
        after: giftLevel(sentK),
      };
      await base44.asServiceRole.entities.User.updateMany({ id: record.id }, { $inc: { gift_sent_k: k * ids.length } });
    }
  }
  const recipients = [];
  for (const id of ids) {
    const person = await base44.asServiceRole.entities.User.get(id).catch(() => null);
    if (!person?.id) continue;
    const receivedK = Math.round(((Number(person.gift_received_k) || 0) + k) * 100) / 100;
    recipients.push({
      user_id: person.id,
      name: person.username || person.full_name || 'Kullanıcı',
      before: giftLevel(person.gift_received_k),
      after: giftLevel(receivedK),
    });
    await base44.asServiceRole.entities.User.updateMany({ id: person.id }, { $inc: { gift_received_k: k } });
  }
  return { sender, recipients };
}