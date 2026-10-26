import { rocketBoundary } from './roomRocketRules.ts';

// Called under the room-rocket lock; one announcement per completed round.
export async function announceRocketRound(base44, room, round) {
  const sr = base44.asServiceRole.entities;
  const existing = await sr.BigGiftAlert.filter({ kind: 'rocket', gift_id: round.id }, 'created_date', 1);
  if (existing.length) return;
  const crossing = await sr.RoomRocketGift.filter({ room_id: room.id, total_after: { $gte: rocketBoundary(round.ordinal) } }, { sort: 'total_after', limit: 1 });
  const signal = crossing.items[0];
  if (!signal) throw new Error('Roket duyurusu için hediye kaydı bulunamadı.');
  const gifts = await sr.GiftSend.filter({ room_id: room.id, request_id: signal.request_id, status: 'success' }, 'created_date', 1);
  const gift = gifts[0];
  if (!gift) throw new Error('Roketi dolduran gönderen bulunamadı.');
  await sr.BigGiftAlert.create({
    kind: 'rocket', rocket_level: round.level,
    room_id: room.id, room_name: room.name || '',
    sender_id: gift.sender_id, sender_name: gift.sender_name || 'Kullanıcı',
    recipient_id: room.owner_id, recipient_name: room.owner_name || room.name || 'Oda sahibi',
    gift_id: round.id, gift_name: `LVL ${round.level} roket patlaması`,
    gift_emoji: '🚀', score: 0,
  });
}