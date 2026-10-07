import { waitUntil } from 'base44:runtime';
import { giftBoxSummary } from './giftBox.ts';
import { readProfileSummary, writeProfileSummary } from './supabaseMirror.ts';

// Özet bu süreden eskiyse eski değer anında gösterilir, taze değer arka planda hazırlanır.
const STALE_MS = 60 * 1000;
// Çantadaki VIP rozetleri için okunacak en fazla kayıt.
const VIP_LIMIT = 50;

/** Çantadaki VIP rozet sayısı: profil sayfası yalnızca sayıyı gösterir. */
async function countVip(base44: any, userId: string) {
  const bag = await base44.asServiceRole.entities.VipItem
    .filter({ owner_id: userId, status: 'bag' }, '-created_date', VIP_LIMIT)
    .catch(() => []);
  return (bag || []).length;
}

/** Cüzdan özeti ve VIP sayısı: ağır hesaplama tek yerde yapılır, sonucu aynaya yazılır. */
async function compute(base44: any, account: any) {
  const [wallet, vipCount] = await Promise.all([
    giftBoxSummary(base44, account),
    countVip(base44, account.id),
  ]);
  return { wallet, vip_count: vipCount };
}

/**
 * Profil özeti Supabase aynasından okunur: profil sayfası cüzdan hesabını beklemez.
 * Aynada kayıt yoksa hesap yapılır ve yazılır; kayıt eskimişse eski değer hemen döner,
 * taze değer yanıttan sonra arka planda hazırlanır. Ayna erişilemezse kaynaktan hesaplanır.
 */
export async function profileSummary(base44: any, account: any) {
  const cached = await readProfileSummary(base44, account.id);
  if (cached?.wallet) {
    const age = Date.now() - Date.parse(cached.synced_at || 0);
    if (!(age < STALE_MS)) {
      waitUntil(
        compute(base44, account)
          .then((next) => writeProfileSummary(base44, account.id, next))
          .catch(() => {}),
      );
    }
    const stored = cached.vip_count;
    // Cüzdan tazeyken VIP sayısı henüz yazılmamışsa yalnızca sayı okunur.
    if (stored === null || stored === undefined) {
      const vipCount = await countVip(base44, account.id);
      waitUntil(writeProfileSummary(base44, account.id, { vip_count: vipCount }));
      return { wallet: cached.wallet, vip_count: vipCount };
    }
    return { wallet: cached.wallet, vip_count: Number(stored) || 0 };
  }
  const computed = await compute(base44, account);
  await writeProfileSummary(base44, account.id, computed);
  return computed;
}