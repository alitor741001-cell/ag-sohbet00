import { syncQuotaRewards } from './agency.ts';
import { mirrorRecord } from './supabaseMirror.ts';
import { coinsForK } from './giftWallet.ts';

export async function giftAftercare(base44, { user, room, gift, recipients, quantity, name, avatar, hidden, me, progression }) {
  const sr = base44.asServiceRole.entities;
  const notices = [];
  if (progression?.sender) {
    const synced = progression.roomLevel;
    if (synced?.leveledUp) notices.push({ room_id: room.id, user_id: hidden ? '' : user.id, user_name: name, user_avatar: avatar, text: `${name} ${synced.level} lvl atladı`, type: 'system' });
  }
  for (const person of progression?.recipients || []) {
    if (person.after > person.before) notices.push({ room_id: room.id, user_id: person.user_id, user_name: person.name, text: `${person.name} ${person.after} hediye lvl atladı`, type: 'system' });
  }
  if (notices.length) await Promise.all(notices.map(notice => sr.RoomMessage.create(notice)));
  for (let i = 0; i < recipients.length; i += 4) {
    await Promise.all(recipients.slice(i, i + 4).map(p => syncQuotaRewards(base44, p.user_id)));
  }
  if (coinsForK(gift.k_value) * quantity >= 1000000) {
    const primary = recipients[0];
    const recipient = await sr.User.get(primary.user_id);
    const alert = await sr.BigGiftAlert.create({ room_id: room.id, room_name: room.name || '', sender_id: user.id, sender_name: name, sender_avatar: avatar, sender_frame: hidden ? '' : (me?.profile_frame || ''), sender_frame_scale: Number(me?.profile_frame_scale) || 100, recipient_id: primary.user_id, recipient_name: primary.name, recipient_avatar: recipient.avatar || '', recipient_frame: recipient.profile_frame || '', recipient_frame_scale: Number(recipient.profile_frame_scale) || 100, gift_id: gift.id, gift_name: gift.name, gift_emoji: gift.emoji || '🎁', gift_image_url: gift.image_url || '', score: coinsForK(gift.k_value) * quantity });
    await mirrorRecord(base44, 'BigGiftAlert', alert);
  }
}