import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// PK her turda 5 dakika sürer; süre "Başla" dendiği an başlar.
const PK_DURATION_MS = 5 * 60 * 1000;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const svc = base44.asServiceRole.entities;

    const getMatch = async (id) => {
      if (!id) return null;
      return svc.PkMatch.get(id).catch((error) => (error.status === 404 ? null : Promise.reject(error)));
    };
    const isPlayer = (match) => !!match && (match.host_id === user.id || match.guest_id === user.id);

    // Davet: davet eden kişi PK'nın sahibi olur, davet edilen taraf kabul eder.
    if (action === 'invite') {
      const roomId = String(body.room_id || '');
      const guestId = String(body.guest_id || '');
      if (!roomId || !guestId) return Response.json({ error: 'room_id ve guest_id gerekli' }, { status: 400 });
      if (guestId === user.id) return Response.json({ error: 'Kendine davet gönderemezsin' }, { status: 400 });

      const guest = await svc.User.get(guestId).catch(() => null);
      // Aynı odada tek aktif PK olur: önceki davet ve karşılaşmalar kapanır.
      const open = await svc.PkMatch.filter({ room_id: roomId, status: { $in: ['invite', 'live'] } }, '-created_date', 20);
      await Promise.all(open.map((item) => svc.PkMatch.update(item.id, { status: 'ended' }).catch(() => null)));

      const match = await svc.PkMatch.create({
        room_id: roomId,
        room_name: String(body.room_name || ''),
        status: 'invite',
        host_id: user.id,
        host_name: user.full_name || 'Kullanıcı',
        host_avatar: user.avatar || '',
        guest_id: guestId,
        guest_name: guest?.full_name || String(body.guest_name || 'Kullanıcı'),
        guest_avatar: guest?.avatar || '',
        accepted: false,
        round_no: 1,
        muted: [],
      });

      await svc.Notification.create({
        user_id: guestId,
        title: 'Görüntülü PK daveti',
        body: `${user.full_name || 'Bir kullanıcı'} seni görüntülü PK'ya davet etti.`,
        type: 'pk_invite',
        link: `/sesli-oda/${roomId}`,
        ref_id: match.id,
      }).catch(() => null);

      return Response.json({ match });
    }

    // Kabul / ret: yalnızca davet edilen kişi yanıtlar.
    if (action === 'accept' || action === 'decline') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (match.guest_id !== user.id) return Response.json({ error: 'Bu davet sana ait değil' }, { status: 403 });
      if (match.status !== 'invite') return Response.json({ error: 'Davet artık geçerli değil' }, { status: 400 });

      if (action === 'decline') {
        const ended = await svc.PkMatch.update(match.id, { status: 'ended', left_id: user.id });
        return Response.json({ match: ended });
      }
      const updated = await svc.PkMatch.update(match.id, { accepted: true });
      return Response.json({ match: updated });
    }

    // Başla: 5 dakikalık süre bu anda başlar.
    if (action === 'start') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (match.host_id !== user.id) return Response.json({ error: 'PK yalnızca davet eden tarafından başlatılır' }, { status: 403 });
      if (!match.accepted) return Response.json({ error: 'Rakip daveti henüz kabul etmedi' }, { status: 400 });
      if (match.status === 'live') return Response.json({ match });

      const startedAt = new Date();
      const updated = await svc.PkMatch.update(match.id, {
        status: 'live',
        started_at: startedAt.toISOString(),
        ends_at: new Date(startedAt.getTime() + PK_DURATION_MS).toISOString(),
      });
      return Response.json({ match: updated });
    }

    // Ses: taraflardan biri kendi mikrofonunu ya da karşı tarafın sesini kapatır.
    // Kapatılan ses odadaki herkes için susar.
    if (action === 'mute') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      const targetId = String(body.target_id || '');
      if (targetId !== match.host_id && targetId !== match.guest_id) {
        return Response.json({ error: 'Geçersiz katılımcı' }, { status: 400 });
      }
      const list = new Set(Array.isArray(match.muted) ? match.muted : []);
      if (body.muted) list.add(targetId);
      else list.delete(targetId);
      const updated = await svc.PkMatch.update(match.id, { muted: [...list] });
      return Response.json({ match: updated });
    }

    // Rövanş: aynı rakiple yeni tur, davet yeniden onaylanır.
    if (action === 'rematch') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (match.host_id !== user.id) return Response.json({ error: 'Rövanşı yalnızca davet eden taraf başlatır' }, { status: 403 });
      const updated = await svc.PkMatch.update(match.id, {
        status: 'invite',
        accepted: false,
        muted: [],
        round_no: (Number(match.round_no) || 1) + 1,
        left_id: '',
      });
      await svc.Notification.create({
        user_id: match.guest_id,
        title: 'Rövanş daveti',
        body: `${match.host_name || 'Rakibin'} rövanş istiyor.`,
        type: 'pk_invite',
        link: `/sesli-oda/${match.room_id}`,
        ref_id: match.id,
      }).catch(() => null);
      return Response.json({ match: updated });
    }

    // Bitir / ayrıl: karşılaşma kapanır, rakibe rövanş seçeneği kalır.
    if (action === 'finish' || action === 'leave') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      const updated = await svc.PkMatch.update(match.id, {
        status: 'ended',
        left_id: action === 'leave' ? user.id : '',
      });
      return Response.json({ match: updated });
    }

    return Response.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}