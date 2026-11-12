import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { waitUntil } from 'base44:runtime';
import { deliverGift, mirrorGiftDelivery } from '../../shared/giftDelivery.ts';
import { giftAftercare } from '../../shared/giftAftercare.ts';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { isModerator } from '../../shared/roles.ts';
import { upsertNotification } from '../../shared/upsertNotification.ts';
import { scoresAfterSeatLeave, withStep } from '../../shared/numberBoard.ts';
import { appendRoomLog } from '../../shared/roomLog.ts';
import { coinsForK, ensureGiftWallet, formatK, giftBalance } from '../../shared/giftWallet.ts';
import { giftBoard } from '../../shared/giftBoard.ts';
import { addGiftTotals } from '../../shared/userLevels.ts';
import { syncQuotaRewards } from '../../shared/agency.ts';
import { syncGiftRoomLevel } from '../../shared/roomLevels.ts';
import { HIDDEN_AVATAR_URL, hiddenDisplayName, isHiddenDisplayName, isHiddenUser } from '../../shared/vip.ts';
import { upsertRoomNotice } from '../../shared/roomNotice.ts';
import { isAgOfficial } from '../../shared/agOfficial.ts';

const SEAT_OPTIONS = [1, 2, 5, 8, 9, 12, 15, 24, 30];
// Bu değerin (coin) üzerindeki hediyeler bütün sesli odalara duyurulur.
const BIG_GIFT_SCORE = 1000000;
const ACTIONS = ['seat-take', 'seat-leave', 'seat-lock', 'seat-mute', 'seat-kick', 'set-seat-count', 'invite', 'seat-invite', 'seat-invite-clear', 'gift-state', 'gift-send', 'gift-finalize', 'gift-board', 'number-board-open', 'number-board-close', 'number-step', 'number-reset', 'number-settings', 'chat-ban', 'music-state', 'music-set', 'music-control', 'music-library', 'music-remove', 'music-add', 'team-pk-open', 'team-pk-start', 'team-pk-stop'];
// Normal (takım) PK turu 5 dakika sürer.
const TEAM_PK_MS = 30 * 60 * 1000;
const loadTeamPk = async (base44: any, roomId: string) => {
  const rows = await base44.asServiceRole.entities.TeamPkMatch.filter({ room_id: roomId, active: true }, '-updated_date', 1).catch(() => []);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
};

const emptySeat = (index, locked = false) => ({
  index, user_id: '', name: '', avatar: '', frame: '', frame_scale: 100, locked, muted: false,
});

/** Odanın açık şarkısı — oda başına tek kayıt tutulur. */
const loadRoomMusic = async (base44: any, roomId: string) => {
  const rows = await base44.asServiceRole.entities.RoomMusic.filter({ room_id: roomId }, '-updated_date', 1).catch(() => []);
  return Array.isArray(rows) && rows.length ? rows[0] : null;
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json();
    const { action, room_id, seat_index, target_id, seat_count, locked, muted, target_ids, gift, gift_id, delta, banned, reset_on_seat_leave, reset_on_room_leave } = body || {};
    if (!room_id || !ACTIONS.includes(action)) {
      return Response.json({ error: 'geçersiz istek' }, { status: 400 });
    }

    const [room, me] = await Promise.all([
      base44.asServiceRole.entities.Room.get(room_id).catch(() => null),
      base44.asServiceRole.entities.User.get(user.id).catch(() => null),
    ]);
    // Sesli odalar ve sesli moda alınmış film odaları aynı özellikleri kullanır.
    if (!room || (room.room_type !== 'voice' && room.voice_mode !== true)) return Response.json({ error: 'Sesli oda bulunamadı.' }, { status: 404 });
    if (room.status === 'closed') return Response.json({ error: 'Oda kapatıldı.' }, { status: 403 });

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
    // Sohbet notu yanıtı geciktirmez: kayıt arkadan yazılır, ekran yanıtı beklemez.
    // Sohbet notu kişi başına tek satırdır: aynı kişinin eylemleri aynı satırı günceller.
    const say = (text) => upsertRoomNotice(base44, room_id, {
      key: `presence:${hiddenUser ? 'hidden' : user.id}`,
      user_id: hiddenUser ? '' : user.id, user_name: shownName, user_avatar: shownAvatar, text,
    });
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
      // Koltuk değişimi sohbete yazılmaz: yer değiştirme sessizce yansır.
      return respond(next);
    }

    // Koltuktan kalk — sayı tahtası ayarına göre sayı sıfırlanır
    if (action === 'seat-leave') {
      if (!mySeat) return respond(seats);
      const next = seats.map((seat) => (seat.user_id === user.id ? { ...emptySeat(seat.index), locked: seat.locked } : seat));
      await persist(next);
      const seatLeaveScores = scoresAfterSeatLeave(room, user.id);
      if (seatLeaveScores) await base44.asServiceRole.entities.Room.update(room_id, { number_scores: seatLeaveScores });
      // Koltuktan kalkma da sohbete yazılmaz.
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
      // Koltuk kilidi sohbete yazılmaz: kilit ekranda görünür, sohbet temiz kalır.
      return respond(next);
    }

    // Koltuğun kendi mikrofonu: boş koltuğun mikini aç/kapat — kişinin kendi mikrofonunu etkilemez.
    if (action === 'seat-mute') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const index = Number(seat_index);
      if (!Number.isInteger(index) || index < 0 || index >= seats.length) {
        return Response.json({ error: 'Geçersiz koltuk.' }, { status: 400 });
      }
      const next = seats.map((seat) => (seat.index === index ? { ...seat, muted: !!muted } : seat));
      await persist(next);
      return respond(next);
    }

    // Kişiyi boş bir koltuğa oturt (yalnızca oda sahibi ve yöneticiler)
    if (action === 'seat-assign') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      if (!target_id) return Response.json({ error: 'kullanıcı gerekli' }, { status: 400 });
      const alreadySeated = seats.find((seat) => seat.user_id === target_id);
      if (alreadySeated) return respond(seats);
      const freeIndex = seats.findIndex((seat) => !seat.user_id && !seat.locked);
      if (freeIndex < 0) return Response.json({ error: 'Boş koltuk yok.' }, { status: 409 });
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      const targetName = targetUser?.username || targetUser?.full_name || 'Kullanıcı';
      const targetAvatar = targetUser?.avatar || '';
      const next = seats.map((seat) => seat.user_id === target_id ? { ...emptySeat(seat.index), locked: seat.locked } : seat);
      next[freeIndex] = { ...emptySeat(freeIndex), user_id: target_id, name: targetName, avatar: targetAvatar, frame: targetUser?.profile_frame || '', frame_scale: Number(targetUser?.profile_frame_scale) || 100 };
      await persist(next);
      await base44.asServiceRole.entities.Room.update(room_id, {
        room_logs: appendRoomLog(room, { text: `${shownName}, ${targetName} kişisini koltuğa oturttu.`, kind: 'seat_assign', actor_id: hiddenUser ? '' : user.id, actor_name: shownName, target_id, target_name: targetName }),
      });
      return respond(next);
    }

    // Kişiyi koltuğundan indir (odadan atma room-presence ile yapılır)
    if (action === 'seat-kick') {
      if (!target_id) return Response.json({ error: 'kullanıcı gerekli' }, { status: 400 });
      const target = seats.find((seat) => seat.user_id === target_id);
      if (!target) return respond(seats);
      // Koltuktan indirme: oda sahibi, oda moderatörleri ve admin/yönetici hesaplar herkesi indirebilir.
      if (!canMod) {
        return Response.json({ error: 'Koltuktan yalnızca oda sahibi ve yönetici hesaplar indirebilir.' }, { status: 403 });
      }
      const targetUser = await base44.asServiceRole.entities.User.get(target_id).catch(() => null);
      // Yönetici hesabı koltuğundan indirilemez: deneyen kişi uyarılır.
      if (targetUser?.role === 'admin') {
        return Response.json({ error: 'Yönetici koltuğundan indirilemez.', adminProtected: true }, { status: 403 });
      }
      if (await isAgOfficial(base44, targetUser)) return Response.json({ error: 'AG Yetkilisi koltuğundan indirilemez. Önce admin yetkiyi geri almalıdır.', officialProtected: true }, { status: 403 });
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
      // Koltuk sayısı düşürülürken kimse beklemez: yeri kalan herkes kendi koltuğunda kalır,
      // oda sahibi her koşulda bir koltuk alır, dışarıda kalanlar izleyiciye düşürülür.
      const occupied = seats.filter((seat) => seat.user_id);
      const slots = Array.from({ length: count }, (_, index) => {
        const seat = occupied.find((item) => item.index === index);
        return seat ? { ...seat, index } : null;
      });
      const dropped: any[] = [];
      const overflow = occupied
        .filter((seat) => seat.index >= count)
        .sort((a, b) => (a.user_id === room.owner_id ? -1 : b.user_id === room.owner_id ? 1 : a.index - b.index));
      for (const person of overflow) {
        let spot = slots.findIndex((slot) => !slot);
        if (spot < 0) {
          // Yer kalmadıysa oda sahibi son koltuğu alır, diğerleri izleyiciye düşer.
          if (person.user_id !== room.owner_id) { dropped.push(person); continue; }
          spot = slots.length - 1;
          if (slots[spot]) dropped.push(slots[spot]);
        }
        slots[spot] = { ...person, index: spot };
      }

      const next = slots.map((slot, index) => {
        const locked = !!seats.find((seat) => seat.index === index)?.locked;
        return slot ? { ...slot, index, locked } : emptySeat(index, locked);
      });

      if (dropped.length) {
        const protectedOfficials = await base44.asServiceRole.entities.AgOfficial.filter({ user_id: { $in: dropped.map(person => person.user_id) }, active: true }, '-created_date', 100);
        if (protectedOfficials.length) return Response.json({ error: 'Koltuk sayısı değiştirilemedi: AG Yetkilisi koltuğundan indirilemez. Önce admin yetkiyi geri almalıdır.', officialProtected: true }, { status: 403 });
      }
      const patch: Record<string, any> = { seats: next, seat_count: next.length };
      if (dropped.length) {
        // Koltuktan düşenlerin koltuk puanları temizlenir ve işlem kayıt defterine yazılır.
        let board = room.number_scores;
        for (const seat of dropped) {
          const cleared = scoresAfterSeatLeave({ ...room, number_scores: board }, seat.user_id);
          if (cleared) board = cleared;
        }
        if (board !== room.number_scores) patch.number_scores = board;
        patch.room_logs = appendRoomLog(room, {
          text: `${shownName} koltuk sayısını ${count} yaptı — ${dropped.map((seat) => seat.name || 'Kullanıcı').join(', ')} koltuktan indirildi.`,
          kind: 'seat_kick',
          actor_id: hiddenUser ? '' : user.id,
          actor_name: shownName,
        });
      }
      await base44.asServiceRole.entities.Room.update(room_id, patch);
      // Koltuktan düşenler sessizce izleyiciye düşmez: sebebini bildirimde görürler.
      for (const seat of dropped) {
        upsertNotification(base44, {
          user_id: seat.user_id,
          title: 'Koltuktan indirildin',
          body: `${shownName}, "${room.name}" odasında koltuk sayısını ${count} olarak ayarladı.`,
          type: 'voice_room_seat_dropped',
          link: `/sesli-oda/${room_id}`,
          ref_id: room_id,
        }).catch(() => {});
      }
      say(`${shownName} koltuk sayısını ${count} olarak ayarladı.`);
      return Response.json({
        ok: true,
        seats: next,
        seat_count: next.length,
        dropped: dropped.map((seat) => ({ user_id: seat.user_id, name: seat.name || 'Kullanıcı' })),
      });
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
          avatar: targetUser.avatar || '',
          frame: targetUser.profile_frame || '',
          frame_scale: Number(targetUser.profile_frame_scale) || 100,
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
    // Normal PK: üstte sunucu, solda mavi 4 koltuk, sağda kırmızı 4 koltuk. Yalnızca yöneticiler açar/kapatır.
    if (action === 'team-pk-open' || action === 'team-pk-start') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      if (seats.length !== 9) return Response.json({ error: 'Normal PK için koltuk sayısı 9 olmalı.' }, { status: 400 });
      const current = await loadTeamPk(base44, room_id);
      const opening = action === 'team-pk-open';
      if (opening && current) return Response.json({ ok: true, team_pk: current });
      if (!opening && current?.started_at && new Date(current.ends_at).getTime() > Date.now()) {
        return Response.json({ ok: true, team_pk: current });
      }
      const now = Date.now();
      const patch = {
        room_id, active: true, blue_score: 0, red_score: 0, started_by: user.id,
        ...(!opening ? { started_at: new Date(now).toISOString(), ends_at: new Date(now + TEAM_PK_MS).toISOString() } : {}),
      };
      const match = current
        ? await base44.asServiceRole.entities.TeamPkMatch.update(current.id, patch)
        : await base44.asServiceRole.entities.TeamPkMatch.create(patch);
      say(opening ? `${shownName} normal PK alanını açtı.` : `${shownName} normal PK başlattı.`);
      return Response.json({ ok: true, team_pk: match });
    }
    if (action === 'team-pk-stop') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const current = await loadTeamPk(base44, room_id);
      if (current) await base44.asServiceRole.entities.TeamPkMatch.update(current.id, { active: false });
      return Response.json({ ok: true });
    }

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

      // Görüntülü PK açıksa maç tarafları da hediye alabilir; aldıkları hediye PK puanına işler.
      // Maç iki odadan birinde olabilir: davet edenin odası (room_id) ya da kabul edenin odası (guest_room_id).
      // Rakibin odasında atılan hediye de böylece PK barına işler.
      const pkRows = await base44.asServiceRole.entities.PkMatch.filter(
        { status: 'live', $or: [{ room_id }, { guest_room_id: room_id }] }, '-created_date', 10,
      ).catch(() => []);
      const pkList = Array.isArray(pkRows) ? pkRows : [];
      const pkMatch = pkList.find((row) => !!row.host_id && row.accepted && !!row.guest_id)
        || pkList.find((row) => !!row.host_id) || null;
      if (pkMatch) {
        if (pkMatch.host_id) people.set(pkMatch.host_id, pkMatch.host_name || 'Kullanıcı');
        if (pkMatch.accepted && pkMatch.guest_id) people.set(pkMatch.guest_id, pkMatch.guest_name || 'Kullanıcı');
      }

      // Kişi kendine de hediye gönderebilir.
      const ids = Array.isArray(target_ids) ? target_ids.filter((value) => typeof value === 'string' && value) : [];
      const recipients = [...new Set(ids)].slice(0, 30)
        .filter((value) => people.has(value))
        .map((value) => ({ user_id: value, name: people.get(value) || 'Kullanıcı' }));
      if (!recipients.length) {
        return Response.json({ error: 'Hediye göndermek için en az bir kişi seç.' }, { status: 400 });
      }

      // Hediye sınırsız atılabilir: sınır yalnızca makine hızında gönderimi keser.
      const rlGift = await rateLimit(base44, 'voice-gift:' + user.id, user.id, 3000, 60000);
      if (!rlGift.allowed) return Response.json({ error: 'Gönderim sırada, kısa süre sonra devam edecek.', retry_after_ms: 60000 }, { status: 429 });

      const kValue = Math.max(0, Number(giftRecord.k_value) || 0);
      const totalK = kValue * recipients.length * quantity;
      const cost = coinsForK(kValue) * recipients.length * quantity;
      const requestId = String(body.request_id || crypto.randomUUID());
      if (!/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) return Response.json({ error: 'Geçersiz gönderim kimliği.' }, { status: 400 });
      const delivery = await deliverGift(base44, {
        roomId: room_id, user: { ...user, role: me?.role || user.role }, gift: giftRecord,
        recipients, quantity, name: shownName, avatar: shownAvatar, hidden: hiddenUser, requestId,
      });
      if (delivery.busy) return Response.json({ error: 'Gönderim sırada.', retry_after_ms: 700 }, { status: 429 });
      if (delivery.insufficient) return Response.json({ error: 'Yetersiz K bakiyesi.', needed_k: totalK, available_k: delivery.coins / 1000 }, { status: 400 });
      waitUntil(mirrorGiftDelivery(base44, delivery));
      // PK barı hediyeyle birlikte ilerler: puan maç kaydına yazılır, iki tarafta da aynı sayı görünür.
      if (pkMatch && pkMatch.accepted && pkMatch.guest_id) {
        const gain = kValue * quantity;
        let hostScore = Number(pkMatch.host_score) || 0;
        let guestScore = Number(pkMatch.guest_score) || 0;
        recipients.forEach((person) => {
          if (person.user_id === pkMatch.host_id) hostScore += gain;
          if (person.user_id === pkMatch.guest_id) guestScore += gain;
        });
        if (hostScore !== (Number(pkMatch.host_score) || 0) || guestScore !== (Number(pkMatch.guest_score) || 0)) {
          waitUntil(base44.asServiceRole.entities.PkMatch.update(pkMatch.id, { host_score: hostScore, guest_score: guestScore }).catch(() => null));
        }
      }
      // Normal PK: sol 4 koltuk (1-4) mavi, sağ 4 koltuk (5-8) kırmızı takıma puan yazar.
      // Üstteki sunucu koltuğuna (0) atılan hediyeler bara işlemez.
      if (seats.length === 9) {
        waitUntil((async () => {
          const teamPk = await loadTeamPk(base44, room_id);
          if (!teamPk?.started_at || !teamPk.ends_at || Date.now() >= new Date(teamPk.ends_at).getTime()) return;
          const gain = kValue * quantity;
          let blue = 0;
          let red = 0;
          recipients.forEach((person) => {
            const index = seats.findIndex((seat) => seat.user_id === person.user_id);
            if (index >= 1 && index <= 4) blue += gain;
            if (index >= 5 && index <= 8) red += gain;
          });
          if (!blue && !red) return;
          await base44.asServiceRole.entities.TeamPkMatch.update(teamPk.id, {
            blue_score: (Number(teamPk.blue_score) || 0) + blue,
            red_score: (Number(teamPk.red_score) || 0) + red,
          });
        })().catch(() => null));
      }
      if (delivery.first) waitUntil(giftAftercare(base44, { user, room: delivery.room, gift: giftRecord, recipients, quantity, name: shownName, avatar: shownAvatar, hidden: hiddenUser, me, progression: delivery.progression }).catch(error => console.error('Hediye kota/duyuru eşitlemesi:', error)));
      return Response.json({
        ok: true, gift: { id: giftRecord.id, name: giftRecord.name, emoji: giftRecord.emoji || '🎁', image_url: giftRecord.image_url || '', k_value: giftRecord.k_value },
        recipients, count: recipients.length, quantity, total_k: totalK,
        coins: Math.max(0, Number(delivery.wallet.coins) || 0),
        messages: delivery.messages, number_board: true, number_scores: delivery.room.number_scores,
        board_started_at: delivery.room.board_started_at, room_updated_at: delivery.room.updated_date,
      });
    }

    // Hediye sonrası ağır işler: hediye kayıtları, seviye/kota senkronu ve büyük hediye duyurusu.
    // Gönderim ekranını bekletmemek için gönderen tarafı bu adımı ayrı çağırır.
    if (action === 'gift-finalize') {
      // Eski istemcilerle uyum: ana gönderim hediyeyi zaten kalıcı kaydeder.
      return Response.json({ ok: true, finalized: true });
    }

    // Oda müziği: şarkı seçimi oda sahibi/yöneticilerde, çalma herkesin kendi cihazında.
    if (action === 'music-state') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      return Response.json({ ok: true, music: await loadRoomMusic(base44, room_id) });
    }

    // Şarkı listesi kişiye özeldir: yüklediğin şarkılar yalnızca senin listende görünür,
    // hangi odaya gidersen git kendi şarkıların listelenir.
    if (action === 'music-library') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const rows = await base44.asServiceRole.entities.RoomTrack.filter({ added_by: user.id }, '-created_date', 60).catch(() => []);
      const seen = new Set<string>();
      const tracks = (Array.isArray(rows) ? rows : []).filter((row: any) => {
        const uri = String(row?.file_uri || '');
        if (!uri || seen.has(uri)) return false;
        seen.add(uri);
        return true;
      }).slice(0, 30);
      return Response.json({ ok: true, tracks });
    }

    // Kendi listenden şarkı silme: yalnızca senin yüklediğin kayıt kaldırılır.
    if (action === 'music-remove') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const trackId = typeof body.track_id === 'string' ? body.track_id.trim() : '';
      if (!trackId) return Response.json({ error: 'Şarkı bulunamadı.' }, { status: 400 });
      const row = await base44.asServiceRole.entities.RoomTrack.get(trackId).catch(() => null);
      if (!row || row.added_by !== user.id) return Response.json({ error: 'Bu şarkı senin listende değil.' }, { status: 403 });
      await base44.asServiceRole.entities.RoomTrack.delete(trackId);
      return Response.json({ ok: true, removed: trackId });
    }

    // Telefondan yüklenen şarkılar yalnızca kendi listene eklenir; kendiliğinden çalmaz.
    // Çalma yalnızca listeden dokunulduğunda (music-set) başlar.
    if (action === 'music-add') {
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const raw = Array.isArray(body.tracks) ? body.tracks : [];
      const items = raw.slice(0, 20).map((item: any) => ({
        title: String(item?.title || '').trim().slice(0, 80) || 'Şarkı',
        file_uri: String(item?.file_uri || '').trim().slice(0, 400),
      })).filter((item: any) => item.file_uri);
      if (!items.length) return Response.json({ error: 'Şarkı dosyası geçersiz.' }, { status: 400 });
      const rlAdd = await rateLimit(base44, 'voice-music-add:' + user.id, user.id, 30, 60000);
      if (!rlAdd.allowed) return Response.json({ error: 'Çok sık şarkı yükleniyor.', retry_after_ms: 60000 }, { status: 429 });
      const mine = await base44.asServiceRole.entities.RoomTrack.filter({ added_by: user.id }, '-created_date', 100).catch(() => []);
      const known = new Set((Array.isArray(mine) ? mine : []).map((row: any) => row.file_uri));
      const created: any[] = [];
      for (const item of items) {
        if (known.has(item.file_uri)) continue;
        known.add(item.file_uri);
        const row = await base44.asServiceRole.entities.RoomTrack.create({
          room_id, title: item.title, file_uri: item.file_uri, added_by: user.id, added_by_name: shownName,
        }).catch(() => null);
        if (row) created.push(row);
      }
      return Response.json({ ok: true, created });
    }

    if (action === 'music-set') {
      // Herkes kendi şarkısını odada açabilir: şarkı odada ortak çalar, liste kişiye özeldir.
      if (!isParticipant && !canMod) return Response.json({ error: 'Önce odaya katılmalısın.' }, { status: 403 });
      const fileUri = typeof body.file_uri === 'string' ? body.file_uri.trim().slice(0, 400) : '';
      const fileUrl = typeof body.url === 'string' ? body.url.trim().slice(0, 1200) : '';
      if (!fileUri || !/^https?:\/\//.test(fileUrl)) return Response.json({ error: 'Şarkı dosyası geçersiz.' }, { status: 400 });
      const rlMusic = await rateLimit(base44, 'voice-music:' + user.id, user.id, 60, 60000);
      if (!rlMusic.allowed) return Response.json({ error: 'Çok sık şarkı değiştiriliyor.', retry_after_ms: 60000 }, { status: 429 });
      const title = String(body.title || '').trim().slice(0, 80) || 'Şarkı';
      const patch = {
        room_id, owner_id: user.id, owner_name: shownName, title,
        file_uri: fileUri, url: fileUrl,
        is_playing: true, position: 0, started_at: new Date().toISOString(),
      };
      const existing = await loadRoomMusic(base44, room_id);
      const record = existing
        ? await base44.asServiceRole.entities.RoomMusic.update(existing.id, patch)
        : await base44.asServiceRole.entities.RoomMusic.create(patch);
      await say(`${shownName}, odaya müzik açtı: ${title}`);
      // Şarkı listesi: aynı dosya ikinci kez eklenmez, her yeni şarkı listeye düşer.
      const known = await base44.asServiceRole.entities.RoomTrack.filter({ added_by: user.id, file_uri: fileUri }, '-created_date', 1).catch(() => []);
      if (!Array.isArray(known) || known.length === 0) {
        await base44.asServiceRole.entities.RoomTrack.create({
          room_id, title, file_uri: fileUri, added_by: user.id, added_by_name: shownName,
        }).catch(() => {});
      }
      return Response.json({ ok: true, music: record });
    }

    if (action === 'music-control') {
      const record = await loadRoomMusic(base44, room_id);
      if (!record) return Response.json({ error: 'Açık şarkı yok.' }, { status: 404 });
      // Şarkıyı açan kişi kendi şarkısını yönetir; oda sahibi ve adminler her şarkıyı yönetir.
      if (!canMod && record.owner_id !== user.id) {
        return Response.json({ error: 'Bu şarkıyı yalnızca açan kişi ve yöneticiler yönetir.' }, { status: 403 });
      }
      const op = String(body.op || '');
      const elapsed = record.is_playing && record.started_at
        ? Math.max(0, (Date.now() - new Date(record.started_at).getTime()) / 1000)
        : 0;
      const current = Math.max(0, (Number(record.position) || 0) + elapsed);
      let patch: any = null;
      if (op === 'pause') patch = { is_playing: false, position: current, started_at: '' };
      else if (op === 'play') patch = { is_playing: true, started_at: new Date().toISOString() };
      else if (op === 'stop') patch = { is_playing: false, position: 0, started_at: '' };
      if (!patch) return Response.json({ error: 'geçersiz istek' }, { status: 400 });
      const next = await base44.asServiceRole.entities.RoomMusic.update(record.id, patch);
      return Response.json({ ok: true, music: next });
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
      say(bannedNow
        ? `${displayName} sohbet yasağını açtı — yalnızca koltuktakiler yazabilir.`
        : `${displayName} sohbet yasağını kaldırdı.`);
      return Response.json({ ok: true, chat_seated_only: bannedNow });
    }

    // Sayı tahtasını aç — koltuk altındaki sayılar kaldığı yerden devam eder
    if (action === 'number-board-open') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const openScores = Array.isArray(room.number_scores) ? room.number_scores : [];
      // Sayaç başlar: koltukların altındaki "Devam Ediyor" sayacı bu andan itibaren ilerler.
      const startedAt = new Date().toISOString();
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: true, board_started_at: startedAt });
      // Sayı tahtası açma/kapama sohbete yazılmaz.
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board: true, number_scores: openScores, board_started_at: startedAt });
    }

    // Sayı tahtasını kapat — sayılar korunur, tahta yeniden açılınca devam eder
    if (action === 'number-board-close') {
      if (!canMod) return Response.json({ error: 'yetkisiz' }, { status: 403 });
      const closedScores = Array.isArray(room.number_scores) ? room.number_scores : [];
      // Sayaç durur: süre sayacı sıfırlanır, yeniden başlatılınca 1'den başlar.
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: false, board_started_at: '' });
      return Response.json({ ok: true, seats, seat_count: seats.length, number_board: false, number_scores: closedScores, board_started_at: '' });
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
      // Sıfırlama tahtayı yeniden açar; süre sayacı kaldığı yerden devam eder.
      const resetStartedAt = room.board_started_at || new Date().toISOString();
      await base44.asServiceRole.entities.Room.update(room_id, { number_board: true, number_scores: [], board_started_at: resetStartedAt });
      say(`${displayName} sayı tahtasını sıfırladı.`);
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