/**
 * Özel sohbet kuralları: arkadaş olmayanlar da yazabilir.
 * Engel varsa ya da alıcı "Rahatsız Etme"yi açtıysa yalnızca arkadaşlar yazabilir.
 * Arkadaş olmayan bir erkeğin bir kadına gönderdiği her mesaj 100 coin: ücret gönderenden
 * düşülür ve alıcının elmas kotasına hediye akışıyla aynı yoldan işlenir.
 */
import { waitUntil } from 'base44:runtime';
import { ensureGiftWallet, K_UNIT } from './giftWallet.ts';
import { syncQuotaRewards } from './agency.ts';

export const MESSAGE_FEE_COINS = 100;
// 100 coin = 0,1K elmas.
const FEE_K = MESSAGE_FEE_COINS / K_UNIT;

/** İki kişi arasındaki arkadaşlık kaydı (en son kayıt). */
export async function directRelation(base44: any, firstId: string, secondId: string) {
  const rows = await base44.asServiceRole.entities.Friendship.filter({
    $or: [
      { requester_id: firstId, recipient_id: secondId },
      { requester_id: secondId, recipient_id: firstId },
    ],
  }, '-created_date', 10).catch(() => []);
  return rows?.[0] || null;
}

/**
 * Mesajı engelleyen bir durum varsa gerekçesini döner; yazışma serbestse boş döner.
 * Admin sohbetlerinde kural işlemez.
 */
export function directMessageBlock(sender: any, receiver: any, relation: any, isAdminChat = false) {
  if (isAdminChat) return '';
  const blocked = relation?.status === 'blocked'
    || (receiver?.blocked_users || []).includes(sender?.id)
    || (sender?.blocked_users || []).includes(receiver?.id);
  if (blocked) return 'Bu kullanıcıyla mesajlaşamazsınız.';
  if (relation?.status !== 'accepted' && receiver?.dnd_messages === true) {
    return 'Bu kullanıcı şu anda yalnızca arkadaşlarından mesaj kabul ediyor.';
  }
  return '';
}

/**
 * Arkadaş olmayan erkek → kadın mesajının ücretini gönderenden düşer, alıcının
 * elmasına yazar. Bakiye yetmezse `error` dolu döner ve mesaj gönderilmez.
 * Sistem bildirimi üretilmez; ücret yalnızca mesajın altındaki "coins hediye"
 * etiketiyle görünür.
 */
export async function chargeDirectMessageFee(base44: any, sender: any, receiver: any) {
  if (sender?.gender !== 'erkek' || receiver?.gender !== 'kadın') return { coins: 0, error: '' };
  const wallet = await ensureGiftWallet(base44, sender);
  const balance = Math.max(0, Number(wallet?.coins) || 0);
  if (balance < MESSAGE_FEE_COINS) {
    return {
      coins: 0,
      error: `Arkadaşın olmadığın birine mesaj göndermek ${MESSAGE_FEE_COINS} coin. Bakiyen: ${balance} coin.`,
    };
  }
  await base44.asServiceRole.entities.GameWallet.update(wallet.id, { coins: balance - MESSAGE_FEE_COINS });

  // Elmas kotası: hediye kaydı aylık elması (kota kademesi) besler,
  // alıcının toplam elmas sayacı da aynı oranda artar.
  await base44.asServiceRole.entities.GiftSend.create({
    room_id: '',
    sender_id: sender.id, sender_name: sender.username || sender.full_name || 'Kullanıcı',
    recipient_id: receiver.id, recipient_name: receiver.username || receiver.full_name || 'Kullanıcı',
    gift_id: 'message-fee', gift_name: 'Mesaj Hediyesi', gift_emoji: '💬', gift_image_url: '',
    k_value: FEE_K, total_k: FEE_K, recipient_count: 1, mode: 'single', status: 'success',
  }).catch(() => {});
  const receivedK = Math.round(((Number(receiver.gift_received_k) || 0) + FEE_K) * 100) / 100;
  waitUntil(base44.asServiceRole.entities.User.update(receiver.id, { gift_received_k: receivedK }).catch(() => {}));
  waitUntil(syncQuotaRewards(base44, receiver.id).catch(() => {}));

  return { coins: MESSAGE_FEE_COINS, error: '' };
}