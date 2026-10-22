import { waitUntil } from 'base44:runtime';
import { VIP_COIN_PRICES, VIP_PURCHASE_DAYS, VIP_LEVELS } from './vipCatalog.ts';
import { applyVipToUser, effectiveVipLevel, nextVipExpiry } from './vip.ts';
import { ensureGiftWallet } from './giftWallet.ts';
import { giftLock, mirrorRecord, writeProfileSummary } from './supabaseMirror.ts';

export async function purchaseVip(base44, user, body) {
  const level = body.level;
  const requestId = String(body.request_id || '');
  if (!VIP_LEVELS.includes(level) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
    return { status: 400, data: { error: 'Geçerli bir VIP seviyesi ve satın alma kimliği gerekli.' } };
  }
  const token = crypto.randomUUID();
  if (!await giftLock(base44, [`wallet:${user.id}`, `vip:${user.id}`], token)) {
    return { status: 409, data: { error: 'Devam eden işlemin var; biraz sonra tekrar dene.' } };
  }
  try {
    const sr = base44.asServiceRole.entities;
    const me = await sr.User.get(user.id);
    if (me.is_banned || me.is_suspended || me.role === 'banned' || ['banned', 'suspended'].includes(me.account_status)) {
      return { status: 403, data: { error: 'Bu hesap satın alma yapamaz.' } };
    }
    let [wallet, records] = await Promise.all([
      ensureGiftWallet(base44, me),
      sr.VipItem.filter({ owner_id: user.id, purchase_request_id: requestId }, '-created_date', 1),
    ]);
    let item = records[0];
    if (item && item.level !== level) return { status: 400, data: { error: 'Bu satın alma kimliği başka bir VIP seviyesine ait.' } };
    if (item?.used_at) return { data: { ok: true, level: effectiveVipLevel(me), expires_at: me.vip_expires_at || '', coins: wallet.coins, purchased_level: item.level } };
    const cost = item?.coins_spent || VIP_COIN_PRICES[level];
    const key = `vip:${user.id}:${requestId}`;
    if (!item?.purchase_paid_at && !(wallet.gift_requests || []).includes(key) && Number(wallet.coins) < cost) {
      return { status: 402, data: { error: `Yetersiz jeton. VIP ${level} için ${cost.toLocaleString('tr-TR')} Coins gerekli.`, coins: wallet.coins } };
    }
    if (!item) item = await sr.VipItem.create({
      owner_id: user.id, owner_name: me.username || me.full_name || 'Kullanıcı', level,
      days: VIP_PURCHASE_DAYS, source: 'purchase', status: 'used', used_at: '',
      purchase_request_id: requestId, coins_spent: cost,
      purchase_expires_at: nextVipExpiry(me, level, VIP_PURCHASE_DAYS),
    });
    if (!item.purchase_paid_at) {
      await sr.GameWallet.updateMany({ id: wallet.id, user_id: user.id, coins: { $gte: cost }, gift_requests: { $ne: key } }, {
        $inc: { coins: -cost }, $push: { gift_requests: { $each: [key], $slice: -500 } },
      });
      wallet = await sr.GameWallet.get(wallet.id);
      if (!(wallet.gift_requests || []).includes(key)) {
        return { status: 402, data: { error: 'Jeton bakiyen değişti; satın alma için yeterli jeton yok.', coins: wallet.coins } };
      }
      item = await sr.VipItem.update(item.id, { purchase_paid_at: new Date().toISOString() });
    }
    const applied = await applyVipToUser(base44, me, level, VIP_PURCHASE_DAYS, { vip_source: 'purchase' }, { expiresAt: item.purchase_expires_at });
    item = await sr.VipItem.update(item.id, { used_at: new Date().toISOString() });
    wallet = await sr.GameWallet.update(wallet.id, { user_name: me.username || me.full_name || '' });
    waitUntil(Promise.all([
      mirrorRecord(base44, 'GameWallet', wallet), mirrorRecord(base44, 'VipItem', item),
      writeProfileSummary(base44, user.id, { wallet }),
    ]));
    return { data: { ok: true, level: applied.level, expires_at: applied.expires_at, coins: wallet.coins, purchased_level: level, days: VIP_PURCHASE_DAYS } };
  } finally {
    await giftLock(base44, [], token, true);
  }
}