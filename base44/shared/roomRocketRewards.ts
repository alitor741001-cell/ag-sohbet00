import { ensureGiftWallet } from './giftWallet.ts';
import { upsertNotification } from './upsertNotification.ts';
import { giftLock } from './supabaseMirror.ts';
import { ROCKET_VIP_LEVELS } from './roomRocketRules.ts';
import { vipDurationLabel } from './vip.ts';
import { getVipCatalog } from './vipCatalog.ts';

/**
 * Roket ödülü VIP'i: her seviyede 1. sıradaki kişiye VIP6 / VIP7 / VIP9 / VIP11.
 * Tur başına bir kez verilir; vip_granted işareti tekrar denemelerde ikinci kez vermeyi önler.
 */
export async function grantRocketVip(base44, round) {
  const sr = base44.asServiceRole.entities;
  const vipLevel = ROCKET_VIP_LEVELS[round.level - 1] || 0;
  if (round.vip_granted || !vipLevel) return round;
  const winner = (round.recipients || []).find(recipient => recipient.rank === 1 && !recipient.unavailable);
  const target = winner ? await sr.User.get(winner.user_id).catch(() => null) : null;
  if (!target?.id) return sr.RoomRocketRound.update(round.id, { vip_level: vipLevel, vip_granted: true });
  const catalog = await getVipCatalog(base44);
  const days = catalog.levels.find(level => level.level === vipLevel)?.days || 30;
  const receipt = `rocket:${round.id}`;
  const existing = await sr.VipItem.filter({ owner_id: target.id, source: 'rocket', purchase_request_id: receipt }, 'created_date', 1);
  if (!existing[0]) await sr.VipItem.create({
    owner_id: target.id,
    owner_name: target.username || target.full_name || winner?.name || '',
    level: vipLevel,
    days,
    source: 'rocket',
    status: 'bag',
    purchase_request_id: receipt,
  });
  await upsertNotification(base44, {
    user_id: target.id,
    title: `LVL ${round.level} roketi · VIP${vipLevel}`,
    body: `Roket ödülünde 1. sırada yer aldın. VIP${vipLevel} (${vipDurationLabel(days)}) profilindeki Çanta > VIP Üyelik bölümüne eklendi. Otomatik etkinleştirilmez; istediğinde kullanabilirsin.`,
    type: 'vip',
    link: '/profil',
    ref_id: round.id,
  });
  return sr.RoomRocketRound.update(round.id, { vip_level: vipLevel, vip_user_id: target.id, vip_user_name: winner?.name || '', vip_granted: true });
}

export async function payRocketRound(base44, round) {
  const sr = base44.asServiceRole.entities;
  const key = round.id;
  const recipients = round.recipients || [];
  for (let i = 0; i < recipients.length; i += 4) {
    await Promise.all(recipients.slice(i, i + 4).map(async recipient => {
      if (recipient.paid || recipient.unavailable) return;
      const token = crypto.randomUUID();
      if (!await giftLock(base44, [`wallet:${recipient.user_id}`], token)) return;
      try {
      const person = await sr.User.get(recipient.user_id);
      const wallet = await ensureGiftWallet(base44, person);
      // The receipt and increment are a single conditional database write.
      // Retrying a workflow can never pay the same round to this wallet twice.
      await sr.GameWallet.updateMany({ id: wallet.id, room_rocket_rewards: { $ne: key } }, { $inc: { coins: recipient.amount }, $addToSet: { room_rocket_rewards: key } });
      const confirmed = await sr.GameWallet.get(wallet.id);
      if (!(confirmed.room_rocket_rewards || []).includes(key)) throw new Error('Roket ödülü cüzdana işlenemedi.');
      // Emit the wallet event without writing an old balance over concurrent gifts.
      await sr.GameWallet.update(wallet.id, { user_name: wallet.user_name || person.username || person.full_name || '' });
      recipient.paid = true;
      await upsertNotification(base44, { user_id: recipient.user_id, title: `LVL ${round.level} roket ödülü`, body: `${recipient.rank ? `${recipient.rank}. sırada` : 'Çekilişte'} ${recipient.amount.toLocaleString('tr-TR')} coin kazandın. Ödül bakiyene eklendi.`, type: 'room_rocket_reward', link: `/sesli-oda/${round.room_id}`, ref_id: round.id });
      } finally {
        await giftLock(base44, [], token, true);
      }
    }));
    await sr.RoomRocketRound.update(round.id, { recipients });
  }
  const pending = recipients.some(recipient => !recipient.paid && !recipient.unavailable);
  const finished = await sr.RoomRocketRound.update(round.id, { recipients, status: pending ? 'paying' : 'complete', ...(pending ? {} : { finished_at: new Date().toISOString() }) });
  return pending ? finished : grantRocketVip(base44, finished);
}