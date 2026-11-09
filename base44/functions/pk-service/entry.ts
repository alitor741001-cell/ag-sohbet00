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

    // Tur skoru: tur başladıktan sonra bu odada ilgili kişiye gönderilen hediyelerin K toplamı.
    const scoresOf = async (match) => {
      const since = match.started_at ? new Date(match.started_at).getTime() : 0;
      const page = await svc.RoomMessage.filter({ room_id: match.room_id }, { sort: '-created_date', limit: 400 }).catch(() => null);
      const totals = {};
      (page?.items || []).forEach((row) => {
        const target = row.gift_to_id;
        const k = Number(row.gift_k) || 0;
        if (!target || !k) return;
        if (since && row.created_date && new Date(row.created_date).getTime() < since) return;
        totals[target] = (totals[target] || 0) + k;
      });
      return {
        host: totals[match.host_id] || 0,
        guest: match.guest_id ? (totals[match.guest_id] || 0) : 0,
      };
    };

    // Galibiyet serisi hesaba bağlı saklanır: galibiyet artırır, yenilgi sıfırlar, beraberlik korur.
    const bumpStreak = async (userId, userName, outcome) => {
      if (!userId) return;
      const page = await svc.PkStreak.filter({ user_id: userId }, { sort: '-created_date', limit: 1 }).catch(() => null);
      const current = page?.items?.[0] || null;
      const streak = Number(current?.streak) || 0;
      const base = {
        user_name: userName || current?.user_name || '',
        wins: Number(current?.wins) || 0,
        losses: Number(current?.losses) || 0,
        draws: Number(current?.draws) || 0,
        best_streak: Number(current?.best_streak) || 0,
      };
      if (outcome === 'win') {
        base.wins += 1;
        base.best_streak = Math.max(base.best_streak, streak + 1);
        base.streak = streak + 1;
      } else if (outcome === 'loss') {
        base.losses += 1;
        base.streak = 0;
      } else {
        base.draws += 1;
        base.streak = streak;
      }
      if (current) return svc.PkStreak.update(current.id, base);
      return svc.PkStreak.create({ user_id: userId, ...base });
    };

    // Görüntülü yayın: davet eden taraf yayını hemen açar, davetler yayın açıkken gönderilir.
    if (action === 'broadcast') {
      const roomId = String(body.room_id || '');
      if (!roomId) return Response.json({ error: 'room_id gerekli' }, { status: 400 });
      // 'video' = sesli odadan bağımsız görüntülü PK sayfası; 'room' = odanın içindeki eski yayın.
      const mode = body.mode === 'video' ? 'video' : 'room';

      const open = await svc.PkMatch.filter({ room_id: roomId, status: { $in: ['invite', 'live'] } }, '-created_date', 20);
      const mine = open.find((item) => item.host_id === user.id && item.status === 'live' && (item.mode || 'room') === mode);
      if (mine) return Response.json({ match: mine });

      // Aynı odada tek yayın olur: odadaki eski davetler ve karşılaşmalar kapanır.
      await Promise.all(open.map((item) => svc.PkMatch.update(item.id, { status: 'ended' }).catch(() => null)));

      const startedAt = new Date();
      const match = await svc.PkMatch.create({
        room_id: roomId,
        room_name: String(body.room_name || ''),
        mode,
        status: 'live',
        started: false,
        settled: false,
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

      // Davet edilen kişi başkasıyla PK'daysa davet gönderilmez: yayıncıya kiminle olduğu bildirilir.
      const busyRows = await svc.PkMatch.filter({ status: 'live', accepted: true }, '-created_date', 50).catch(() => []);
      const busy = (Array.isArray(busyRows) ? busyRows : busyRows?.items || []).find((row) => (
        row.host_id !== user.id
        && (row.guest_id === guestId || (row.host_id === guestId && !!row.guest_id))
      ));
      if (busy) {
        const busyName = busy.guest_id === guestId ? busy.guest_name : busy.host_name;
        const rivalName = busy.guest_id === guestId ? busy.host_name : busy.guest_name;
        return Response.json({
          error: `${busyName || 'Bu kişi'} şu an ${rivalName || 'başka biri'} ile PK'da.`,
        }, { status: 409 });
      }

      const open = await svc.PkMatch.filter({ room_id: roomId, status: { $in: ['invite', 'live'] } }, '-created_date', 20);

      // Aynı kişiye ikinci bir aktif davet gönderilmez: bekleyen davet olduğu gibi döner.
      const pending = open.find((item) => item.guest_id === guestId && !item.accepted);
      if (pending) return Response.json({ match: pending });

      // Başka bir odadan gelen bekleyen davet varsa üstüne yeni davet yazılmaz.
      const elsewhere = await svc.PkMatch.filter({ guest_id: guestId, accepted: false, status: { $in: ['invite', 'live'] } }, '-created_date', 5);
      const freshElsewhere = (Array.isArray(elsewhere) ? elsewhere : elsewhere?.items || [])
        .find((item) => item.room_id !== roomId && Date.now() - new Date(item.created_date || 0).getTime() < 10 * 60 * 1000);
      if (freshElsewhere) {
        return Response.json({ error: 'Bu kişiye zaten aktif bir PK daveti gönderildi' }, { status: 409 });
      }

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
        mode: body.mode === 'video' ? 'video' : 'room',
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

      // Görüntülü PK'da ret: davet sahibi durumu görsün diye davet reddeden kişiyle kapatılır.
      if (action === 'decline' && (match.mode || 'room') === 'video') {
        const ended = await svc.PkMatch.update(match.id, {
          status: 'ended',
          accepted: false,
          started: false,
          settled: false,
          left_id: user.id,
        });
        return Response.json({ match: ended });
      }

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

      // Kabul eden kişinin kendi görüntülü PK lobisi kapanır: aynı anda iki oturumda olunmaz.
      if ((match.mode || 'room') === 'video') {
        const own = await svc.PkMatch.filter({ host_id: user.id, status: { $in: ['invite', 'live'] } }, '-created_date', 10).catch(() => []);
        await Promise.all((Array.isArray(own) ? own : own?.items || [])
          .filter((row) => row.id !== match.id)
          .map((row) => svc.PkMatch.update(row.id, { status: 'ended' }).catch(() => null)));
      }

      // Kabul eden kişi yayına katılır: çift kamera açılır ve 5 dakikalık tur bu anda başlar.
      const updated = await svc.PkMatch.update(match.id, {
        status: 'live',
        accepted: true,
        started: true,
        settled: false,
        started_at: now.toISOString(),
        ends_at: freshEnd,
        host_score: 0,
        guest_score: 0,
        winner_id: '',
        left_id: '',
        muted: [],
      });
      return Response.json({ match: updated });
    }

    // Maçı başlat: 5 dakikalık süre bu anda başlar, iki taraf da başlatabilir.
    if (action === 'start') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      if (!match.guest_id) return Response.json({ error: 'Maç için rakip gerekiyor' }, { status: 400 });
      if (!match.accepted) return Response.json({ error: 'Rakip daveti henüz kabul etmedi' }, { status: 400 });
      if (match.started && match.status === 'live') return Response.json({ match });

      const startedAt = new Date();
      const updated = await svc.PkMatch.update(match.id, {
        status: 'live',
        started: true,
        settled: false,
        started_at: startedAt.toISOString(),
        ends_at: new Date(startedAt.getTime() + PK_DURATION_MS).toISOString(),
        host_score: 0,
        guest_score: 0,
        winner_id: '',
        left_id: '',
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

    // Rövanş: aynı iki kişi arasında skorlar sıfırlanır, yeni 5 dakikalık tur hemen başlar.
    if (action === 'rematch') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      if (!match.guest_id) return Response.json({ error: 'Rövanş için rakip gerekiyor' }, { status: 400 });

      const startedAt = new Date();
      const updated = await svc.PkMatch.update(match.id, {
        status: 'live',
        started: true,
        accepted: true,
        settled: false,
        muted: [],
        round_no: (Number(match.round_no) || 1) + 1,
        started_at: startedAt.toISOString(),
        ends_at: new Date(startedAt.getTime() + PK_DURATION_MS).toISOString(),
        host_score: 0,
        guest_score: 0,
        winner_id: '',
        left_id: '',
      });
      return Response.json({ match: updated });
    }

    // Bitir: sonuç sunucuda hesaplanır, galibiyet serisi bir kez işlenir ve ekran sonuçta kalır.
    if (action === 'finish') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      // Aynı maç ikinci kez işlenmez: seri yanlışlıkla artmaz.
      if (match.settled) return Response.json({ match });
      // Sonucu önce yayını açan taraf yazar; karşı taraf 4 saniye sonra devreye girer.
      const endsAt = match.ends_at ? new Date(match.ends_at).getTime() : 0;
      if (match.host_id !== user.id && endsAt && Date.now() < endsAt + 4000) {
        return Response.json({ match });
      }

      // Görüntülü PK'da skor her hediye gönderiminde sunucuda işlenir: herkes aynı sayıyı görür.
      const scores = (match.mode || 'room') === 'video'
        ? { host: Number(match.host_score) || 0, guest: match.guest_id ? (Number(match.guest_score) || 0) : 0 }
        : await scoresOf(match);
      const played = !!match.started && !!match.guest_id;
      const winnerId = scores.host === scores.guest ? '' : scores.host > scores.guest ? match.host_id : match.guest_id;

      if (played) {
        await bumpStreak(match.host_id, match.host_name, !winnerId ? 'draw' : winnerId === match.host_id ? 'win' : 'loss');
        await bumpStreak(match.guest_id, match.guest_name, !winnerId ? 'draw' : winnerId === match.guest_id ? 'win' : 'loss');
      }

      const updated = await svc.PkMatch.update(match.id, {
        status: 'ended',
        started: false,
        settled: true,
        winner_id: winnerId,
        host_score: scores.host,
        guest_score: scores.guest,
        left_id: '',
      });
      return Response.json({ match: updated });
    }

    // Maçtan ayrıl: yalnızca PK oturumu kapanır, oda sahibi tek kişilik yayında kalır.
    // end=true ise (yayın ekranı tamamen kapatıldı) yayın da kapanır.
    if (action === 'leave') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });

      if (body.end) {
        const ended = await svc.PkMatch.update(match.id, {
          status: 'ended',
          started: false,
          guest_id: '',
          guest_name: '',
          guest_avatar: '',
          accepted: false,
          muted: [],
          left_id: user.id,
        });
        return Response.json({ match: ended });
      }

      const now = new Date();
      const solo = await svc.PkMatch.update(match.id, {
        status: 'live',
        started: false,
        settled: false,
        guest_id: '',
        guest_name: '',
        guest_avatar: '',
        accepted: false,
        muted: [],
        host_score: 0,
        guest_score: 0,
        winner_id: '',
        started_at: now.toISOString(),
        ends_at: new Date(now.getTime() + PK_DURATION_MS).toISOString(),
        left_id: user.id,
      });
      return Response.json({ match: solo });
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

    // Daveti iptal et: davet edilen kişi listeden düşer, yayın tek kamera olarak devam eder.
    if (action === 'cancel-invite') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      const cleared = await svc.PkMatch.update(match.id, {
        guest_id: '',
        guest_name: '',
        guest_avatar: '',
        accepted: false,
        started: false,
        settled: false,
        left_id: '',
        host_score: 0,
        guest_score: 0,
        winner_id: '',
      });
      return Response.json({ match: cleared });
    }

    // Görüntülü PK hediyesi: coin bakiyeden düşer, puan maç kaydına yazılır.
    // Skor tek yerde (veritabanında) tutulduğu için her iki tarafta aynı sayı görünür.
    if (action === 'gift') {
      const match = await getMatch(String(body.id || ''));
      if (!match) return Response.json({ error: 'PK bulunamadı' }, { status: 404 });
      if (!isPlayer(match)) return Response.json({ error: 'Yetki yok' }, { status: 403 });
      if (!match.guest_id || !match.accepted) return Response.json({ error: 'PK başlamadan hediye gönderilemez' }, { status: 400 });

      const targetId = String(body.target_id || '');
      if (targetId !== match.host_id && targetId !== match.guest_id) {
        return Response.json({ error: 'Geçersiz katılımcı' }, { status: 400 });
      }
      const giftRecord = await svc.Gift.get(String(body.gift_id || '')).catch(() => null);
      if (!giftRecord || giftRecord.active === false) return Response.json({ error: 'Hediye bulunamadı' }, { status: 404 });

      const kValue = Math.max(0, Number(giftRecord.k_value) || 0);
      const cost = Math.round(kValue * 1000);

      const rows = await svc.GameWallet.filter({ user_id: user.id }, '-created_date', 1).catch(() => []);
      const wallet = (Array.isArray(rows) ? rows[0] : null)
        || await svc.GameWallet.create({
          user_id: user.id,
          user_name: user.full_name || '',
          coins: user.role === 'admin' ? 500000 : 100000,
          admin_granted: user.role === 'admin',
        });
      const coins = Math.max(0, Number(wallet.coins) || 0);
      if (coins < cost) {
        return Response.json({ error: 'Yetersiz K bakiyesi.', needed_k: kValue, available_k: coins / 1000 }, { status: 400 });
      }
      await svc.GameWallet.update(wallet.id, { coins: coins - cost });
      const nextCoins = coins - cost;

      const patch = targetId === match.host_id
        ? { host_score: (Number(match.host_score) || 0) + kValue }
        : { guest_score: (Number(match.guest_score) || 0) + kValue };
      const updated = await svc.PkMatch.update(match.id, patch);

      await svc.GiftSend.create({
        request_id: crypto.randomUUID(),
        quantity: 1,
        room_id: match.room_id,
        sender_id: user.id,
        sender_name: user.full_name || '',
        recipient_id: targetId,
        recipient_name: targetId === match.host_id ? match.host_name : match.guest_name,
        gift_id: giftRecord.id,
        gift_name: giftRecord.name,
        gift_emoji: giftRecord.emoji || '🎁',
        gift_image_url: giftRecord.image_url || '',
        k_value: kValue,
        total_k: kValue,
        recipient_count: 1,
        mode: 'single',
        status: 'success',
      }).catch(() => null);

      return Response.json({
        match: updated,
        coins: nextCoins,
        gift: { name: giftRecord.name, emoji: giftRecord.emoji || '🎁', image_url: giftRecord.image_url || '', k_value: kValue },
      });
    }

    return Response.json({ error: 'Bilinmeyen işlem' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}