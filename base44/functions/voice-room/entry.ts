import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { isModerator } from '../../shared/roles.ts';
import { upsertNotification } from '../../shared/upsertNotification.ts';

const SEAT_OPTIONS = [2, 5, 8, 9, 12, 15, 20, 30];
const ACTIONS = ['seat-take', 'seat-leave', 'seat-lock', 'seat-kick', 'set-seat-count', 'invite'];

const emptySeat = (index, locked = false) => ({
  index, user_id: '', name: '', avatar: '', frame: '', frame_scale: 100, locked, muted: false,
});

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json();
    const { action, room_id, seat_index, target_id, seat_count, locked, target_ids } = body || {};
    if (!room_id || !ACTIONS.includes(action)) {
      return Response.json({ error: 'geçersiz istek' }, { status: 400 });
    }

    const room = await base44.asServiceRole.entities.Room.get(room_id).catch(() => null);
    if (!room || room.room_type !== 'voice') return Response.json({ error: 'Sesli oda bulunamadı.' }, { status: 404 });
    if (room.status === 'closed') return Response.json({ error: 'Oda kapatıldı.' }, { status: 403 });

    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const displayName = me?.username || me?.full_name || user.full_name || 'Kullanıcı';
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
      room_id, user_id: user.id, user_name: displayName, text, type: 'system',
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
        name: displayName,
        avatar: me?.avatar || user.avatar || '',
        frame: me?.profile_frame || '',
        frame_scale: Number(me?.profile_frame_scale) || 100,
      };
      await persist(next);
      await say(`${displayName} ${index + 1}. koltuğa oturdu.`);
      return respond(next);
    }

    // Koltuktan kalk
    if (action === 'seat-leave') {
      if (!mySeat) return respond(seats);
      const next = seats.map((seat) => (seat.user_id === user.id ? { ...emptySeat(seat.index), locked: seat.locked } : seat));
      await persist(next);
      await say(`${displayName} koltuğundan kalktı.`);
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
      await say(`${displayName} ${index + 1}. koltuğu ${locked ? 'kilitledi' : 'kilidini açtı'}.`);
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
      await say(`${targetName} koltuğundan indirildi.`);
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
      await say(`${displayName} koltuk sayısını ${count} olarak ayarladı.`);
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
          body: `${displayName} seni "${room.name}" sesli odasına davet etti.`,
          type: 'voice_room_invite',
          link: `/sesli-oda/${room_id}`,
          ref_id: room_id,
        });
        invited += 1;
      }
      if (!invited) return Response.json({ error: 'Davet edilecek kişi bulunamadı.' }, { status: 404 });
      return Response.json({ ok: true, invited });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}