import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { incrementFriendshipProgression } from '../../shared/friendshipProgression.ts';
import { chargeDirectMessageFee, directMessageBlock, directRelation } from '../../shared/directMessage.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from '../../shared/vip.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { file_url, context, context_id, text } = body || {};
    if (!file_url || !context || !context_id) return Response.json({ error: 'eksik parametre' }, { status: 400 });
    const caption = typeof text === 'string' ? text.slice(0, 500) : '';
    const senderName = user.username || user.full_name || 'Kullanıcı';

    // Görsel moderasyonu — çıplaklık/cinsel içerik tespiti
    let safe = true;
    let reason = '';
    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: 'Bu görseli incele. Görselde çıplaklık, cinsel içerik, pornografi veya uygunsuz sahne var mı? Sadece JSON döndür: { "safe": true/false, "reason": "kısa açıklama" }. Güvenli/gözlü görüntüler için safe=true.',
        file_urls: [file_url],
        response_json_schema: { type: 'object', properties: { safe: { type: 'boolean' }, reason: { type: 'string' } }, required: ['safe', 'reason'] },
        model: 'gemini_3_flash'
      });
      safe = res?.safe !== false;
      reason = res?.reason || '';
    } catch { safe = true; }

    if (!safe) {
      await base44.asServiceRole.entities.Report.create({
        reporter_id: user.id, reporter_name: senderName,
        target_id: user.id, target_name: senderName,
        context, context_id,
        reason: `Uygunsuz görsel filtre: ${reason || 'çıplaklık/cinsel içerik'}`,
        file_url, status: 'pending'
      }).catch(() => {});
      return Response.json({ error: 'Görsel uygunsuz içerik tespit edildiği için engellendi.', filtered: true }, { status: 400 });
    }

    if (context === 'room') {
      const room = await base44.asServiceRole.entities.Room.get(context_id).catch(() => null);
      if (!room) return Response.json({ error: 'oda bulunamadı' }, { status: 404 });
      const isMod = user.role === 'admin' || user.role === 'moderator';
      const isOwner = room.owner_id === user.id;
      const isParticipant = (room.participants || []).some((p) => p.user_id === user.id);
      if (!isParticipant && !isOwner && !isMod) return Response.json({ error: 'bu odada mesaj gönderemezsiniz' }, { status: 403 });
      if (!room.chat_enabled && !isMod) return Response.json({ error: 'sohbet kapalı' }, { status: 403 });
      const isSeated = (Array.isArray(room.seats) ? room.seats : []).some((seat) => seat.user_id === user.id);
      if (room.chat_seated_only === true && !isSeated && !isMod) {
        return Response.json({ error: 'Sohbet yasağı var — yazmak için bir koltuğa otur.' }, { status: 403 });
      }
      // Gizli kullanıcı (VIP10+): görsel de takma adla ve maskeli profille paylaşılır.
      const hiddenUser = isHiddenUser(user);
      await base44.asServiceRole.entities.RoomMessage.create({
        room_id: context_id, user_id: hiddenUser ? '' : user.id,
        user_name: hiddenUser ? hiddenDisplayName(user) : senderName,
        user_avatar: hiddenUser ? HIDDEN_AVATAR_URL : (user.avatar || ''),
        text: caption, file_url, type: 'user'
      });
      return Response.json({ ok: true });
    }

    if (context === 'dm') {
      const conversation = await base44.asServiceRole.entities.Conversation.get(context_id).catch(() => null);
      if (!conversation || !(conversation.members || []).includes(user.id)) {
        return Response.json({ error: 'Sohbet bulunamadı veya yetkisiz' }, { status: 403 });
      }
      if ((conversation.deleted_for || []).includes(user.id)) {
        return Response.json({ error: 'Bu sohbeti sildiniz' }, { status: 403 });
      }
      const receiverId = conversation.user1_id === user.id ? conversation.user2_id : conversation.user1_id;
      const receiverName = conversation.user1_id === user.id ? conversation.user2_name : conversation.user1_name;
      const receiver = await base44.asServiceRole.entities.User.get(receiverId).catch(() => null);
      if (!receiver) return Response.json({ error: 'Bu hesap yönetici tarafından silinmiştir.' }, { status: 404 });
      if (receiver.is_banned || receiver.role === 'banned' || receiver.membership_status === 'blocked') return Response.json({ error: 'Bu hesap yönetici tarafından engellenmiştir.' }, { status: 403 });
      // Arkadaşlık şartı yok: engel ve karşı tarafın "Rahatsız Etme" ayarı belirler.
      const relation = await directRelation(base44, user.id, receiverId);
      const friendChat = user.role === 'admin' || receiver.role === 'admin' || relation?.status === 'accepted';
      const blockedReason = directMessageBlock(user, receiver, relation, user.role === 'admin' || receiver.role === 'admin');
      if (blockedReason) return Response.json({ error: blockedReason }, { status: 403 });

      // Arkadaş olmayan erkek → kadın görseli de mesaj sayılır: aynı ücret işlenir.
      let giftCoins = 0;
      if (!friendChat) {
        const fee = await chargeDirectMessageFee(base44, user, receiver);
        if (fee.error) return Response.json({ error: fee.error }, { status: 400 });
        giftCoins = fee.coins;
      }

      const message = await base44.asServiceRole.entities.ChatMessage.create({
        conversation_id: context_id,
        sender_id: user.id, sender_name: senderName,
        receiver_id: receiverId,
        content: caption, file_url, gift_coins: giftCoins,
        deleted_for: [], read_by: [user.id]
      });
      const updates: any = {
        deleted_for: (conversation.deleted_for || []).filter((id) => id !== receiverId),
        last_message_text: caption || '[Görsel]',
        last_message_at: new Date().toISOString(),
        last_sender_id: user.id, last_sender_name: senderName
      };
      if (conversation.user1_id === user.id) {
        updates.unread_user2 = (conversation.unread_user2 || 0) + 1;
      } else {
        updates.unread_user1 = (conversation.unread_user1 || 0) + 1;
      }
      await base44.asServiceRole.entities.Conversation.update(context_id, updates);
      const isAdminChat = user.role === 'admin' || receiver?.role === 'admin';
      const progression = isAdminChat ? null : await incrementFriendshipProgression(base44, user.id, receiverId, message.id);
      return Response.json({ ok: true, message, progression });
    }

    return Response.json({ error: 'geçersiz bağlam' }, { status: 400 });
  } catch (e) {
    return Response.json({ error: 'işlem başarısız' }, { status: 500 });
  }
}