import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { isModerator } from '../../shared/roles.ts';
import { upsertNotification } from '../../shared/upsertNotification.ts';
import { scoresAfterSeatLeave, withStep } from '../../shared/numberBoard.ts';
import { appendRoomLog } from '../../shared/roomLog.ts';
import { coinsForK, ensureGiftWallet, formatK, giftBalance } from '../../shared/giftWallet.ts';
import { giftBoard } from '../../shared/giftBoard.ts';
import { addGiftTotals } from '../../shared/userLevels.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenUser } from '../../shared/vip.ts';

const SEAT_OPTIONS = [2, 5, 8, 9, 12, 15, 20, 24];
// Bu değerin (coin) üzerindeki hediyeler bütün sesli odalara duyurulur.
const BIG_GIFT_SCORE = 1000000;
const ACTIONS = ['seat-take', 'seat-leave', 'seat-lock', 'seat-kick', 'set-seat-count', 'invite', 'seat-invite', 'seat-invite-clear', 'gift-state', 'gift-send', 'gift-board', 'number-board-open', 'number-board-close', 'number-step', 'number-reset', 'number-settings', 'chat-ban'];

const emptySeat = (index, locked = false) => ({
  index, user_id: '', name: '', avatar: '', frame: '', frame_scale: 100, locked, muted: false,
});

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json();
    const { action, room_id, seat_index, target_id, seat_count, locked, target_ids, gift, gift_id, delta, banned, reset_on_seat_leave, reset_on_room_leave } = body || {};
    if (!room_id || !ACTIONS.includes(action)) {
      return Response.json({ error: 'geçersiz istek' }, { status: 400 });
    }

    const room = await base44.asServiceRole.entities.Room.get(room_id).catch(() => null);
    // Sesli odalar ve sesli moda alınmış film odaları aynı özellikleri kullanır.
    if (!room || (room.room_type !== 'voice' && room.voice_mode !== true)) return Response.json({ error: 'Sesli oda bulunamadı.' }, { status: 404 });
    if (room.status === 'closed') return Response.json({ error: 'Oda kapatıldı.' }, { status: 403 });

    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const displayName = me?.username || me?.full_name || user.full_name || 'Kullanıcı';
    // Gizli kullanıcı (VIP10+): odada ismi, avatarı ve çerçevesi görünmez — takma adla kullanılır.
    const hiddenUser = isHiddenUser(me);
    const shownName = hiddenUser ? hiddenDisplayName(me) : displayName;
    const shownAvatar = hiddenUser ? HIDDEN_AVATAR_URL : (me?.avatar || user.avatar || '');
    const isOwner = room.owner_id === user.id;
    const isRoomMod = (room.room_moderators || []).includes(user.id);
    const canMod = isOwner || isRoomMod || ['admin', 'moderator'].includes(me?.role) || isModerator(me);
    const isParticipant = (room.participants || []).some((p) => p.user_id === user.id);
    const seats = (Array.isArray(room.seats) ? room.seats : []).map((seat, index) => ({ ...emptySeat(index), ...seat, index }));
    const mySeat = seats.find((seat) => seat.user_id === user.id);

    const persist = async (next) => {
      await base44.asServiceRole.entities.Room.update(room_id, { seats: next, seat_count: next.length });
      return next;
    };
    const say = (text) => base44.asServiceRole.entities.RoomMessage.create({
      room_id, user_id: hiddenUser ? '' : user.id, user_name: shownName, text, type: 'system',
    }).catch(() => {});
    const respond = (next) => Response.json({ ok: true, seats: next, seat_count: next.length });

    // Koltuğa otur — herkes sese çıkabilir, kilitli koltuğa yöneticiler oturabilir.
    if (action === 'seat-take') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const index = Number(seat_index);
      if (!Number.isInteger(index) || index < 0 || index >= seats.length) {
        return Response.json({ error: 'Geçersiz koltuk.' }, { status: 400 });
      }
      const target = seats[index];
      if (target.user_id && target.user_id !== user.id) return Response.json({ error: 'Bu koltuk dolu.' }, { status: 409 });
      if (target.locked && !canMod) return Response.json({ error: 'Bu koltuk kilitli.' }, { status: 403 });
      if (target.user_id === user.id) return respond(seats);

      const next = seats.map((seat) => (seat.user_id === user.id ? { ...emptySeat(seat.index), locked: seat.locked } : seat));
      next[index] = {
        ...emptySeat(index),
        user_id: user.id,
        name: shownName,
        avatar: shownAvatar,
        frame: hiddenUser ? '' : (me?.profile_frame || ''),
        frame_scale: Number(me?.profile_frame_scale) || 100,
      };
      await persist(next);
      const pendingInvites = (Array.isArray(room.seat_invites) ? room.seat_invites : []).filter((item) => item.user_id !== user.id);
      if (pendingInvites.length !== (Array.isArray(room.seat_invites) ? room.seat_invites : []).length) {
        await base44.asServiceRole.entities.Room.update(room_id, { seat_invites: pendingInvites });
      }
      await say(`${shownName} ${index + 1}. koltuğa oturdu.`);
      return respond(next);
    }

    // Koltuktan kalk — sayı tahtası ayarına göre sayı sıfırlanır
    if (action === 'seat-leave') {
      if (!mySeat) return respond(seats);
      const next = seats.map((seat) => (seat.user_id === user.id ? { ...emptySeat(seat.index), locked: seat.locked } : seat));
      await persist(next);
      const seatLeaveScores = scoresAfterSeatLeave(room, user.id);
      if (seatLeaveScores) await base44.asServiceRole.entities.Room.update(room_id, { number_scores: seatLeaveScores });
      await say(`${shownName} koltuğundan kalktı.`);
      return respond(next);
    }

    // Koltuk kilidi — yalnızca oda sahibi ve yöneticiler
    if (action === 'seat-lock') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const index = Number(seat_index);
      if (!Number.isInteger(index) || index < 0 || index >= seats.length) {
        return Response.json({ error: 'Geçersiz koltuk.' }, { status: 400 });
      }
      const next = seats.map((seat) => (seat.index === index ? { ...seat, locked: !!locked } : seat));
      await persist(next);
      await say(`${shownName} ${index + 1}. koltuğu ${locked ? 'kilitledi' : 'kilidini açtı'}.`);
      return respond(next);
    }

    // Kişiyi koltuğundan indir (odadan atma room-presence ile yapılır)
    if (action === 'seat-kick') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      if (!target_id) return Response.json({ error: 'kullanıcı gerekli' }, { status: 400 });
      const target = seats.find((seat) => seat.user_id === target_id);
      if (!target) return respond(seats);
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      const targetName = targetUser?.username || targetUser?.full_name || target.name || 'Kullanıcı';
      const next = seats.map((seat) => (seat.user_id === target_id ? { ...emptySeat(seat.index), locked: seat.locked } : seat));
      await persist(next);
      const kickScores = scoresAfterSeatLeave(room, target_id);
      if (kickScores) await base44.asServiceRole.entities.Room.update(room_id, { number_scores: kickScores });
      // Koltuktan indirme sohbete değil kayıt defterine yazılır.
      await base44.asServiceRole.entities.Room.update(room_id, {
        room_logs: appendRoomLog(room, {
          text: `${shownName}, ${targetName} kişisini koltuktan indirdi.`,
          kind: 'seat_kick',
          actor_id: hiddenUser ? '' : user.id, actor_name: shownName, target_id, target_name: targetName,
        }),
      });
      return respond(next);
    }

    // Koltuk sayısını büyüt / küçült
    if (action === 'set-seat-count') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const count = Number(seat_count);
      if (!SEAT_OPTIONS.includes(count)) return Response.json({ error: 'Geçersiz koltuk sayısı.' }, { status: 400 });
      const busy = seats.filter((seat) => seat.index >= count && seat.user_id);
      if (busy.length) return Response.json({ error: 'Önce yüksek numaralı koltukları boşaltın.' }, { status: 409 });

      const next = Array.from({ length: count }, (_, index) => {
        const existing = seats.find((seat) => seat.index === index);
        return existing ? { ...existing, index } : emptySeat(index);
      });
      await persist(next);
      await say(`${shownName} koltuk sayısını ${count} olarak ayarladı.`);
      return respond(next);
    }

    // Arkadaş daveti — koltukta oturanlar ve yöneticiler davet edebilir
    if (action === 'invite') {
      if (!mySeat && !canMod) return Response.json({ error: 'Davet etmek için bir koltuğa otur.' }, { status: 403 });
      const ids = Array.isArray(target_ids)
        ? target_ids.filter((id) => typeof id === 'string' && id && id !== user.id).slice(0, 20)
        : [];
      if (!ids.length) return Response.json({ error: 'Davet edilecek kişi seçilmedi.' }, { status: 400 });

      const rl = await rateLimit(base44, 'voice-invite:' + user.id, user.id, 20, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla davet gönderdiniz, biraz bekleyin.' }, { status: 429 });

      let invited = 0;
      for (const id of ids) {
        const target = await base44.asServiceRole.entities.User.get(id).catch(() => null);
        if (!target) continue;
        await upsertNotification(base44, {
          user_id: id,
          title: 'Sesli oda daveti',
          body: `${shownName} seni "${room.name}" sesli odasına davet etti.`,
          type: 'voice_room_invite',
          link: `/sesli-oda/${room_id}`,
          ref_id: room_id,
        });
        invited += 1;
      }
      if (!invited) return Response.json({ error: 'Davet edilecek kişi bulunamadı.' }, { status: 404 });
      return Response.json({ ok: true, invited });
    }

    // Koltuğa davet — davet edilenin ekranında "Otur / Aya kalk" seçeneği çıkar
    if (action === 'seat-invite') {
      if (!canMod && !mySeat) return Response.json({ error: 'Koltuk daveti için bir koltuğa otur.' }, { status: 403 });
      if (!target_id || target_id === user.id) return Response.json({ error: 'Geçersiz kişi.' }, { status: 400 });
      if (seats.some((seat) => seat.user_id === target_id)) return Response.json({ error: 'Kişi zaten bir koltukta.' }, { status: 409 });
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      if (!targetUser) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

      const requested = Number(seat_index);
      let index = Number.isInteger(requested) ? requested : -1;
      if (index < 0 || index >= seats.length || seats[index].user_id || seats[index].locked) {
        index = seats.findIndex((seat) => !seat.user_id && !seat.locked);
      }
      if (index < 0) return Response.json({ error: 'Boş koltuk yok.' }, { status: 409 });

      const invites = (Array.isArray(room.seat_invites) ? room.seat_invites : [])
        .filter((item) => item.user_id !== target_id)
        .concat({
          user_id: target_id,
          name: targetUser.username || targetUser.full_name || 'Kullanıcı',
          seat_index: index,
          invited_by: user.id,
          invited_by_name: shownName,
          created_at: new Date().toISOString(),
        });
      await base44.asServiceRole.entities.Room.update(room_id, { seat_invites: invites });
      return Response.json({ ok: true, seat_index: index });
    }

    // Daveti kapat — kişi oturmayı kabul etti ya da aya kalktı
    if (action === 'seat-invite-clear') {
      const invites = (Array.isArray(room.seat_invites) ? room.seat_invites : []).filter((item) => item.user_id !== user.id);
      await base44.asServiceRole.entities.Room.update(room_id, { seat_invites: invites });
      return Response.json({ ok: true });
    }

    // Hediye tahtası için K bakiyesi
    if (action === 'gift-state') {
      const coins = await giftBalance(base44, { id: user.id, role: me?.role || user.role });
      return Response.json({ ok: true, coins });
    }

    // Hediye gönder — tekli ya da toplu; bakiye düşer, her alıcı ayrı kaydedilir
    if (action === 'gift-send') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      // Paket boyutu sınırlıdır, toplam seri gönderim sayısı sınırlı değildir.
      const quantity = body.quantity === undefined ? 1 : Number(body.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
        return Response.json({ error: 'Geçersiz hediye adedi.' }, { status: 400 });
      }
      const wantedGiftId = typeof gift_id === 'string' && gift_id ? gift_id : (typeof gift === 'string' ? gift : '');
      const giftRecord = wantedGiftId
        ? await base44.asServiceRole.entities.Gift.get(wantedGiftId)
        : null;
      if (!giftRecord || giftRecord.active === false) {
        return Response.json({ error: 'Hediye bulunamadı.' }, { status: 404 });
      }

      const people = new Map([[user.id, shownName]]);
      seats.forEach((seat) => { if (seat.user_id) people.set(seat.user_id, seat.name || 'Kullanıcı'); });
      (room.participants || []).forEach((person) => { if (person.user_id) people.set(person.user_id, person.name || 'Kullanıcı'); });

      // Kişi kendine de hediye gönderebilir.
      const ids = Array.isArray(target_ids) ? target_ids.filter((value) => typeof value === 'string' && value) : [];
      const recipients = [...new Set(ids)].slice(0, 30)
        .filter((value) => people.has(value))
        .map((value) => ({ user_id: value, name: people.get(value) || 'Kullanıcı' }));
      if (!recipients.length) {
        return Response.json({ error: 'Hediye göndermek için en az bir kişi seç.' }, { status: 400 });
      }

      const rlGift = await rateLimit(base44, 'voice-gift:' + user.id, user.id, 240, 60000);
      if (!rlGift.allowed) return Response.json({ error: 'Gönderim sırada, kısa süre sonra devam edecek.', retry_after_ms: 60000 }, { status: 429 });

      const kValue = Math.max(0, Number(giftRecord.k_value) || 0);
      const totalK = kValue * recipients.length * quantity;
      const cost = coinsForK(kValue) * recipients.length * quantity;
      const wallet = await ensureGiftWallet(base44, { id: user.id, role: me?.role || user.role, full_name: user.full_name });
      const balance = Math.max(0, Number(wallet.coins) || 0);
      if (cost > balance) {
        return Response.json({
          error: `Yetersiz K bakiyesi. Gereken ${formatK(totalK)}, bakiyen ${formatK(Math.floor(balance / 1000))}.`,
          needed_k: totalK,
          available_k: Math.floor(balance / 1000),
        }, { status: 400 });
      }
      const spent = await base44.asServiceRole.entities.GameWallet.update(wallet.id, { coins: balance - cost });

      // Sayı tahtası: hediyenin K karşılığı yalnızca alıcıya eklenir.
      // Tahta kapalıyken gelen hediye tahtayı açar; o an tüm sayaçlar 1'den başlar.
      let numberScores = room.number_board === true && Array.isArray(room.number_scores) ? room.number_scores : [];
      recipients.forEach((recipient) => {
        numberScores = withStep(numberScores, recipient.user_id, coinsForK(kValue) * quantity);
      });
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: true, number_scores: numberScores });

      const mode = recipients.length > 1 ? 'bulk' : 'single';
      const giftEmoji = giftRecord.emoji || '🎁';
      const messageRecords = [];
      const records = [];
      for (const recipient of recipients) {
        messageRecords.push({
          room_id, user_id: hiddenUser ? '' : user.id, user_name: shownName, user_avatar: shownAvatar,
          text: `${shownName}, ${recipient.name} kişisine ${giftRecord.name}${quantity > 1 ? ` X${quantity}` : ''} gönderdi!`,
          type: 'gift', gift: giftRecord.id, gift_to_id: recipient.user_id, gift_to_name: recipient.name,
          gift_emoji: giftEmoji, gift_k: kValue * quantity,
        });
        for (let repeat = 0; repeat < quantity; repeat += 1) {
          records.push({
            room_id,
            sender_id: user.id, sender_name: shownName,
            recipient_id: recipient.user_id, recipient_name: recipient.name,
            gift_id: giftRecord.id, gift_name: giftRecord.name, gift_emoji: giftEmoji,
            gift_image_url: giftRecord.image_url || '',
            k_value: kValue, total_k: kValue * recipients.length, recipient_count: recipients.length, mode, status: 'success',
          });
        }
      }
      const [messages] = await Promise.all([
        Promise.all(messageRecords.map((message) => base44.asServiceRole.entities.RoomMessage.create(message))),
        base44.asServiceRole.entities.GiftSend.bulkCreate(records),
      ]);

      // Hediye seviyeleri: gönderen ve alan kişilerin K toplamları işlenir.
      await addGiftTotals(base44, {
        senderId: user.id,
        recipientIds: recipients.map((recipient) => recipient.user_id),
        kPerRecipient: kValue * quantity,
      });

      // Büyük hediye (1 milyon ve üzeri): tüm sesli odaların ekranına duyuru düşer.
      if (coinsForK(kValue) * quantity >= BIG_GIFT_SCORE) {
        const primary = recipients[0];
        const recipientUser = await base44.asServiceRole.entities.User.get(primary.user_id).catch(() => null);
        await base44.asServiceRole.entities.BigGiftAlert.create({
          room_id,
          room_name: room.name || '',
          sender_id: user.id,
          sender_name: shownName,
          sender_avatar: shownAvatar,
          sender_frame: hiddenUser ? '' : (me?.profile_frame || ''),
          sender_frame_scale: Number(me?.profile_frame_scale) || 100,
          recipient_id: primary.user_id,
          recipient_name: primary.name,
          recipient_avatar: recipientUser?.avatar || '',
          recipient_frame: recipientUser?.profile_frame || '',
          recipient_frame_scale: Number(recipientUser?.profile_frame_scale) || 100,
          gift_id: giftRecord.id,
          gift_name: giftRecord.name,
          gift_emoji: giftEmoji,
          gift_image_url: giftRecord.image_url || '',
          score: coinsForK(kValue) * quantity,
        }).catch(() => {});
      }

      return Response.json({
        ok: true,
        gift: { id: giftRecord.id, name: giftRecord.name, emoji: giftEmoji, image_url: giftRecord.image_url || '', k_value: kValue },
        recipients, count: recipients.length, quantity, total_k: totalK, mode,
        coins: Math.max(0, Number(spent.coins) || 0),
        messages, number_board: true, number_scores: numberScores,
      });
    }

    // Hediye kutusu — odada biriken hediyeler: son 24 saat ve tüm zamanlar sıralaması
    if (action === 'gift-board') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const board = await giftBoard(base44, room_id);
      return Response.json({ ok: true, ...board });
    }

    // Sohbet yasağı — açıkken yalnızca koltuktakiler yazabilir
    if (action === 'chat-ban') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const bannedNow = banned !== false;
      await base44.asServiceRole.entities.Room.update(room_id, { chat_seated_only: bannedNow });
      await say(bannedNow
        ? `${displayName} sohbet yasağını açtı — yalnızca koltuktakiler yazabilir.`
        : `${displayName} sohbet yasağını kaldırdı.`);
      return Response.json({ ok: true, chat_seated_only: bannedNow });
    }

    // Sayı tahtasını aç — sayaçlar 1'den başlar, eski sayılar temizlenir
    if (action === 'number-board-open') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: true, number_scores: [] });
      await say(`${displayName} sayı tahtasını açtı.`);
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board: true, number_scores: [] });
    }

    // Sayı tahtasını kapat — sayaçlar ve hediye puanları sıfırlanır
    if (action === 'number-board-close') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: false, number_scores: [] });
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board: false, number_scores: [] });
    }

    // Sayıyı bir artır / azalt — koltukta oturan herkes kendi sayısını, yöneticiler herkesi değiştirir
    if (action === 'number-step') {
      if (room.number_board !== true) return Response.json({ error: 'Sayı tahtası kapalı.' }, { status: 409 });
      const step = Number(delta);
      if (step !== 1 && step !== -1) return Response.json({ error: 'Geçersiz adım.' }, { status: 400 });
      if (!target_id || !seats.some((seat) => seat.user_id === target_id)) {
        return Response.json({ error: 'Kişi koltukta değil.' }, { status: 404 });
      }
      if (!canMod && target_id !== user.id) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const rlStep = await rateLimit(base44, 'voice-board:' + user.id, user.id, 120, 60000);
      if (!rlStep.allowed) return Response.json({ error: 'Çok hızlı, biraz bekleyin.' }, { status: 429 });

      const numberScores = withStep(room.number_scores, target_id, step);
      await base44.asServiceRole.entities.Room.update(room_id, { number_scores: numberScores });
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board: true, number_scores: numberScores });
    }

    // Tüm sayıları sıfırla
    if (action === 'number-reset') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: true, number_scores: [] });
      await say(`${displayName} sayı tahtasını sıfırladı.`);
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board: true, number_scores: [] });
    }

    // Sayı tahtası ayarları: koltuktan inince / odadan çıkınca sıfırlansın mı?
    if (action === 'number-settings') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const resetSeat = reset_on_seat_leave !== false;
      const resetRoom = reset_on_room_leave !== false;
      await base44.asServiceRole.entities.Room.update(room_id, {
        number_board_reset_seat: resetSeat,
        number_board_reset_room: resetRoom,
      });
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board_reset_seat: resetSeat, number_board_reset_room: resetRoom });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}