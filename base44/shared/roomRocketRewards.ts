import { ensureGiftWallet } from './giftWallet.ts';
import { upsertNotification } from './upsertNotification.ts';
import { giftLock } from './supabaseMirror.ts';

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
  return sr.RoomRocketRound.update(round.id, { recipients, status: pending ? 'paying' : 'complete', ...(pending ? {} : { finished_at: new Date().toISOString() }) });
}