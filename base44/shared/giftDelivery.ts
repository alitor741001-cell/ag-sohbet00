import { giftLock, mirrorRecord } from './supabaseMirror.ts';
import { coinsForK, ensureGiftWallet } from './giftWallet.ts';
import { withStep } from './numberBoard.ts';
import { upsertRoomNotice } from './roomNotice.ts';

// Ana kayıtlar tamamlanmadan başarılı gönderim cevabı verilmez.
export async function deliverGift(base44, context) {
  const { roomId, user, gift, recipients, quantity, name, avatar, hidden, requestId } = context;
  const token = crypto.randomUUID();
  if (!await giftLock(base44, [`room:${roomId}`, `wallet:${user.id}`], token)) {
    return { busy: true };
  }
  try {
    const sr = base44.asServiceRole.entities;
    const key = `${user.id}:${requestId}`;
    let [records, wallet] = await Promise.all([
      sr.GiftSend.filter({ room_id: roomId, request_id: key }, 'created_date', 300),
      ensureGiftWallet(base44, user),
    ]);
    if (records.length && (records[0].gift_id !== gift.id || records[0].quantity !== quantity || records.length > recipients.length || records.some(r => !recipients.some(p => p.user_id === r.recipient_id)))) {
      throw new Error('Gönderim kimliği başka bir hediyeye ait.');
    }
    const cost = coinsForK(gift.k_value) * quantity * recipients.length;
    const alreadyPaid = records.length > 0 || (wallet.gift_requests || []).includes(key);
    if (!alreadyPaid) {
      await sr.GameWallet.updateMany({ id: wallet.id, coins: { $gte: cost }, gift_requests: { $ne: key } }, {
        $inc: { coins: -cost }, $push: { gift_requests: { $each: [key], $slice: -500 } },
      });
      wallet = await sr.GameWallet.get(wallet.id);
      if (!(wallet.gift_requests || []).includes(key)) return { insufficient: true, coins: wallet.coins, cost };
    }
    const missing = recipients.filter(p => !records.some(r => r.recipient_id === p.user_id));
    if (missing.length) records = [...records, ...await sr.GiftSend.bulkCreate(missing.map(p => ({
      room_id: roomId, request_id: key, quantity, sender_id: user.id, sender_name: name,
      recipient_id: p.user_id, recipient_name: p.name, gift_id: gift.id, gift_name: gift.name,
      gift_emoji: gift.emoji || '🎁', gift_image_url: gift.image_url || '',
      k_value: Number(gift.k_value) * quantity, total_k: Number(gift.k_value) * quantity * recipients.length,
      recipient_count: recipients.length, mode: recipients.length > 1 ? 'bulk' : 'single', status: 'success',
    })))];
    let room;
    for (let attempt = 0; attempt < 6; attempt++) {
      room = await sr.Room.get(roomId);
      if ((room.gift_requests || []).includes(key)) break;
      const scores = recipients.reduce((list, p) => withStep(list, p.user_id, coinsForK(gift.k_value) * quantity), room.number_scores || []);
      await sr.Room.updateMany({ id: roomId, updated_date: room.updated_date, gift_requests: { $ne: key } }, {
        $set: { number_scores: scores, number_board: true, board_started_at: room.board_started_at || new Date().toISOString() },
        $push: { gift_requests: { $each: [key], $slice: -500 } },
      });
      room = await sr.Room.get(roomId);
      if ((room.gift_requests || []).includes(key)) break;
    }
    if (!(room.gift_requests || []).includes(key)) throw new Error('Hediye kaydedildi, sayaç eşitlemesi tekrar denenmeli.');
    // Tekli güncelleme canlı oda yayınını tetikler; eski sayı dizisini geri yazmaz.
    const finalState = await Promise.all([
      sr.Room.update(roomId, { number_board: true }),
      sr.RoomMessage.filter({ room_id: roomId, request_id: key }, 'created_date', 30),
      sr.GameWallet.get(wallet.id),
    ]);
    room = finalState[0];
    let messages = finalState[1];
    wallet = finalState[2];
    const pending = recipients.filter(p => !messages.some(m => m.gift_to_id === p.user_id));
    // Canlı mesaj olayları korunur; alıcılar altışarlı paralel yazılır.
    for (let i = 0; i < pending.length; i += 6) {
      const created = await Promise.all(pending.slice(i, i + 6).map(p => sr.RoomMessage.create({
        room_id: roomId, request_id: key, user_id: hidden ? '' : user.id, user_name: name, user_avatar: avatar,
        text: `${name}, ${p.name} kişisine ${gift.name}${quantity > 1 ? ` X${quantity}` : ''} gönderdi!`,
        type: 'gift', gift: gift.id, gift_to_id: p.user_id, gift_to_name: p.name,
        gift_emoji: gift.emoji || '🎁', gift_k: Number(gift.k_value) * quantity,
      })));
      messages.push(...created);
    }
    // Sesli odada hediye haberi kişinin tek satırına eklenir: ayrı satır açılmaz.
    if (!hidden && (room.room_type === 'voice' || room.voice_mode === true)) {
      await upsertRoomNotice(base44, roomId, {
        key: `presence:${user.id}`,
        user_id: user.id, user_name: name, user_avatar: avatar,
        text: `${name}, ${recipients.map(p => p.name).join(', ')} kişisine ${gift.name}${quantity > 1 ? ` X${quantity}` : ''} gönderdi.`,
      });
    }
    if (room.room_type === 'voice' || room.voice_mode === true) {
      const signals = await sr.RoomRocketGift.filter({ room_id: roomId, request_id: key }, 'created_date', 1);
      if (!signals.length) {
        const total = await sr.RoomRocketGift.aggregate({ query: { room_id: roomId }, sum: ['coins'] });
        const giftAt = records.reduce((latest, record) => record.created_date > latest ? record.created_date : latest, records[0].created_date);
        await sr.RoomRocketGift.create({ room_id: roomId, request_id: key, coins: cost, total_after: (total.rows[0]?.sum_coins || 0) + cost, gift_at: giftAt });
      }
    }
    return { ok: true, records, wallet, room, messages, first: !alreadyPaid };
  } finally {
    await giftLock(base44, [], token, true);
  }
}

export async function mirrorGiftDelivery(base44, delivery) {
  const pairs = [['GameWallet', delivery.wallet], ['Room', delivery.room], ['GiftSend', delivery.records], ['RoomMessage', delivery.messages]];
  const result = await Promise.all(pairs.map(([entity, rows]) => mirrorRecord(base44, entity, rows)));
  if (result.some(ok => !ok)) console.warn('Hediye aynası sonraki eşitleme turunda tamamlanacak.');
}