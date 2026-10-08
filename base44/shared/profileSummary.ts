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
  // Parasal değerler aynadaki eski özetten değil, her zaman ana kayıttan okunur.
  const computed = await compute(base44, account);
  await writeProfileSummary(base44, account.id, computed);
  return computed;
}