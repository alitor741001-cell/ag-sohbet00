import { waitUntil } from 'base44:runtime';
import { giftLock, mirrorRecord, writeProfileSummary } from './supabaseMirror.ts';
import { effectiveVipLevel } from './vip.ts';

export async function buyCosmetic(base44, user, productId, requestId) {
  if (!/^[0-9a-f-]{36}$/i.test(requestId || '') || typeof productId !== 'string') return { status: 400, error: 'Geçersiz satın alma isteği.' };
  const token = crypto.randomUUID();
  if (!await giftLock(base44, [`wallet:${user.id}`, `cosmetics:${user.id}`], token)) return { status: 409, error: 'Devam eden işlemin var. Biraz sonra tekrar dene.' };
  try {
    const sr = base44.asServiceRole.entities;
    const [me, wallets, found, reused] = await Promise.all([
      sr.User.get(user.id), sr.GameWallet.filter({ user_id: user.id }, '-created_date', 1),
      sr.OwnedCosmetic.filter({ owner_id: user.id, product_id: productId }, '-created_date', 1),
      sr.OwnedCosmetic.filter({ owner_id: user.id, request_id: requestId }, '-created_date', 1),
    ]);
    if (me.is_banned || me.role === 'banned' || me.is_suspended) return { status: 403, error: 'Bu hesap alışveriş yapamaz.' };
    if (reused[0] && reused[0].product_id !== productId) return { status: 400, error: 'Bu işlem kimliği başka bir ürüne ait.' };
    let owned = found[0]; let wallet = wallets[0];
    if (owned?.status === 'owned') return { ok: true, already_owned: true, coins: wallet?.coins ?? 0 };
    const product = await sr.CosmeticProduct.get(productId).catch(() => null);
    if (!product || !['seat-frame', 'vip-frame'].includes(product.category) || (!owned?.paid_at && !product.published)) return { status: 404, error: 'Ürün satışta değil.' };
    if (!owned?.paid_at && effectiveVipLevel(me) < product.min_vip) return { status: 403, error: `Bu ürün için VIP ${product.min_vip} gerekli.` };
    const cost = owned ? owned.price : product.price;
    if (!Number.isSafeInteger(cost) || cost < 1) return { status: 400, error: 'Ürün fiyatı geçersiz.' };
    if (!wallet) return { status: 402, error: 'Coins cüzdanın henüz hazır değil. Mevcut Coins bölümünü açıp tekrar dene.' };
    const key = `cosmetic:${user.id}:${productId}`;
    if (!owned?.paid_at && !(wallet.gift_requests || []).includes(key) && wallet.coins < cost) return { status: 402, error: `Yetersiz bakiye. ${cost.toLocaleString('tr-TR')} Coins gerekli.` };
    if (!owned) owned = await sr.OwnedCosmetic.create({ owner_id: user.id, product_id: productId, request_id: requestId, name: product.name, category: product.category, image_url: product.image_url, crop: product.crop || {}, remove_white: product.remove_white, price: cost, status: 'pending' });
    if (!owned.paid_at) {
      await sr.GameWallet.updateMany({ id: wallet.id, user_id: user.id, coins: { $gte: cost }, gift_requests: { $ne: key } }, { $inc: { coins: -cost }, $push: { gift_requests: { $each: [key], $slice: -500 } } });
      wallet = await sr.GameWallet.get(wallet.id);
      if (!(wallet.gift_requests || []).includes(key)) return { status: 402, error: 'Bakiye değişti; yeterli Coins yok.' };
      owned = await sr.OwnedCosmetic.update(owned.id, { paid_at: new Date().toISOString() });
    }
    await sr.OwnedCosmetic.update(owned.id, { status: 'owned' });
    waitUntil(Promise.all([mirrorRecord(base44, 'GameWallet', wallet), writeProfileSummary(base44, user.id, { wallet })]));
    return { ok: true, coins: wallet.coins };
  } finally { await giftLock(base44, [], token, true); }
}