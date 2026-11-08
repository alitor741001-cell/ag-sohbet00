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

    // Görüntülü yayın: davet eden taraf yayını hemen açar, davetler yayın açıkken gönderilir.
    if (action === 'broadcast') {
      const roomId = String(body.room_id || '');
      if (!roomId) return Response.json({ error: 'room_id gerekli' }, { status: 400 });

      const open = await svc.PkMatch.filter({ room_id: roomId, status: { $in: ['invite', 'live'] } }, '-created_date', 20);
      const mine = open.find((item) => item.host_id === user.id && item.status === 'live');
      if (mine) return Response.json({ match: mine });

      // Aynı odada tek yayın olur: odadaki eski davetler ve karşılaşmalar kapanır.
      await Promise.all(open.map((item) => svc.PkMatch.update(item.id, { status: 'ended' }).catch(() => null)));

      const startedAt = new Date();
      const match = await svc.PkMatch.create({
        room_id: roomId,
        room_name: String(body.room_name || ''),
        status: 'live',
        host_id: user.id,
        host_name: user.full_name || 'Kullanıcı',
        host_avatar: user.avatar || '',
        guest_id: '',
        guest_name: '',
        guest_avatar: '',
        accepted: false,
        started_at: startedAt.toISOString(),
        ends_at: new Date(startedAt.getTime() + PK_DURATION_MS).toISOString(),
        round_no: 1,
        muted: [],
      });

      return Response.json({ match });
    }

    // Davet: davet eden kişi PK'nın sahibi olur, davet edilen taraf kabul eder.
    if (action === 'invite') {
      const roomId = String(body.room_id || '');
      const guestId = String(body.guest_id || '');
      if (!roomId || !guestId) return Response.json({ error: 'room_id ve guest_id gerekli' }, { status: 400 });
      if (guestId === user.id) return Response.json({ error: 'Kendine davet gönderemezsin' }, { status: 400 });

      const guest = await svc.User.get(guestId).catch(() => null);
      const open = await svc.PkMatch.filter({ room_id: roomId, status: { $in: ['invite', 'live'] } }, '-created_date', 20);

      // Yayın açıkken davet: kişi mevcut yayına eklenir, yayın kesilmez.
      const broadcasting = open.find((item) => item.host_id === user.id && item.status === 'live');
      if (broadcasting) {
        const joined = await svc.PkMatch.update(broadcasting.id, {
          guest_id: guestId,
          guest_name: guest?.full_name || String(body.guest_name || 'Kullanıcı'),
          guest_avatar: guest?.avatar || '',
          accepted: false,
          muted: [],
        });
        // Davet bildirim kaydına yazılmaz: davet edilen kişinin ekranına anlık kart olarak gelir.
        return Response.json({ match: joined });
      }

      // Aynı odada tek aktif PK olur: önceki davet ve karşılaşmalar kapanır.
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

      return Response.json({ match });
    }

    // Kabul / ret: yalnızca davet edilen kişi yanıtlar.
    if (action === 'accept' || action === 'decline') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (match.guest_id !== user.id) return Response.json({ error: 'Bu davet sana ait değil' }, { status: 403 });
      if (match.status !== 'invite' && match.status !== 'live') {
        return Response.json({ error: 'Davet artık geçerli değil' }, { status: 400 });
      }

      const now = new Date();
      const freshEnd = new Date(now.getTime() + PK_DURATION_MS).toISOString();

      // Reddeden kişi yayına katılmaz; yayın açıksa yayın sahibi yayında kalır.
      if (action === 'decline') {
        if (match.status === 'live') {
          const cleared = await svc.PkMatch.update(match.id, {
            guest_id: '',
            guest_name: '',
            guest_avatar: '',
            accepted: false,
            muted: [],
          });
          return Response.json({ match: cleared });
        }
        const ended = await svc.PkMatch.update(match.id, { status: 'ended', left_id: user.id });
        return Response.json({ match: ended });
      }

      // Kabul eden kişi doğrudan yayına katılır: bekleme adımı yok, süre bu anda başlar.
      if (match.status === 'live') {
        const joined = await svc.PkMatch.update(match.id, { accepted: true, ends_at: freshEnd });
        return Response.json({ match: joined });
      }
      const updated = await svc.PkMatch.update(match.id, {
        accepted: true,
        status: 'live',
        started_at: now.toISOString(),
        ends_at: freshEnd,
        muted: [],
      });
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
      return Response.json({ match: updated });
    }

    // Bitir: tur kapanır, rakibe rövanş seçeneği kalır.
    if (action === 'finish') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      const updated = await svc.PkMatch.update(match.id, { status: 'ended', left_id: '' });
      return Response.json({ match: updated });
    }

    // Ayrıl: konuk ayrılırsa yayıncı tek başına yayında kalır; yayıncı ayrılırsa yayın kapanır.
    if (action === 'leave') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });

      if (match.status === 'live' && match.guest_id === user.id) {
        const cleared = await svc.PkMatch.update(match.id, {
          guest_id: '',
          guest_name: '',
          guest_avatar: '',
          accepted: false,
          muted: [],
        });
        return Response.json({ match: cleared });
      }

      const updated = await svc.PkMatch.update(match.id, { status: 'ended', left_id: user.id });
      return Response.json({ match: updated });
    }

    // Saatlik sıralama: bu odada son bir saatte en çok hediye alan kişiler.
    if (action === 'ranking') {
      const roomId = String(body.room_id || '');
      if (!roomId) return Response.json({ error: 'room_id gerekli' }, { status: 400 });
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const result = await svc.GiftSend.aggregate({
        query: { room_id: roomId, status: 'success', created_date: { $gte: since } },
        groupBy: 'recipient_id',
        sum: ['total_k'],
      }).catch(() => ({ rows: [] }));

      const rows = [...(result?.rows || [])]
        .map((row) => ({ user_id: String(row.recipient_id || ''), score: Number(row.sum_total_k) || 0 }))
        .filter((row) => !!row.user_id && row.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const ranking = await Promise.all(rows.map(async (row) => {
        const member = await svc.User.get(row.user_id).catch(() => null);
        return {
          user_id: row.user_id,
          name: member?.full_name || 'Kullanıcı',
          avatar: member?.avatar || '',
          score: row.score,
        };
      }));

      return Response.json({ ranking });
    }

    return Response.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}