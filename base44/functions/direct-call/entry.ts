import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { rateLimit } from '../../shared/security.ts';
import { ensureGiftWallet } from '../../shared/giftWallet.ts';
import { addGiftTotals } from '../../shared/userLevels.ts';
import { syncQuotaRewards } from '../../shared/agency.ts';
import { mirrorRecord } from '../../shared/supabaseMirror.ts';

const OPEN_STATUSES = ['ringing', 'accepted'];
const STALE_MS = 90 * 1000;
// Görüntülü görüşme ücreti: yalnızca erkek → kadın aramada alınır (3.000 coin = 3K = 3.000 elmas).
const VIDEO_CALL_COINS = 3000;
const VIDEO_CALL_K = 3;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json();
    const action = String(body.action || '');
    const meName = user.username || user.full_name || 'Kullanıcı';
    const meAvatar = user.avatar || '';
    const isFresh = (record) => Date.now() - new Date(record.updated_date || record.created_date).getTime() < STALE_MS;

    const openCalls = async () => {
      const records = await base44.asServiceRole.entities.DirectCall.list('-created_date', 30).catch(() => []);
      return (records || []).filter((record) => OPEN_STATUSES.includes(record.status) && isFresh(record));
    };

    // start: yeni birebir arama başlat (yalnızca arkadaşlar / admin sohbetleri)
    if (action === 'start') {
      const calleeId = String(body.callee_id || '');
      const conversationId = String(body.conversation_id || '');
      if (!calleeId || calleeId === user.id) return Response.json({ error: 'Geçersiz kullanıcı.' }, { status: 400 });

      const [callee, caller] = await Promise.all([
        base44.asServiceRole.entities.User.get(calleeId).catch(() => null),
        base44.asServiceRole.entities.User.get(user.id).catch(() => null),
      ]);
      if (!callee) return Response.json({ error: 'Bu hesap bulunamadı.' }, { status: 404 });
      if (callee.is_banned || callee.role === 'banned' || callee.membership_status === 'blocked') return Response.json({ error: 'Bu hesap yönetici tarafından engellenmiştir.' }, { status: 403 });

      const calleeName = callee.username || callee.full_name || 'Kullanıcı';
      const isAdminChat = user.role === 'admin' || callee.role === 'admin';
      if (!isAdminChat) {
        const friendships = await base44.asServiceRole.entities.Friendship.filter({
          $or: [
            { requester_id: user.id, recipient_id: calleeId },
            { requester_id: calleeId, recipient_id: user.id },
          ],
          status: 'accepted',
        }, '-created_date', 1).catch(() => []);
        if (!friendships.length) return Response.json({ error: 'Yalnızca arkadaşlarınızı arayabilirsiniz.' }, { status: 403 });
      }

      const open = await openCalls();
      const existing = open.find((record) => record.caller_id === user.id && record.callee_id === calleeId);
      if (existing) return Response.json({ call: existing });
      if (open.some((record) => record.caller_id === user.id || record.callee_id === user.id)) {
        return Response.json({ error: 'Zaten devam eden bir aramanız var.' }, { status: 409 });
      }
      if (open.some((record) => record.caller_id === calleeId || record.callee_id === calleeId)) {
        return Response.json({ error: `${calleeName} şu an başka bir aramada.` }, { status: 409 });
      }

      // Aranan kişi bu sohbette rahatsız etme modunu açtıysa zil sessiz çalar
      const conversation = conversationId
        ? await base44.asServiceRole.entities.Conversation.get(conversationId).catch(() => null)
        : null;
      const silent = (conversation?.dnd_for || []).includes(calleeId);

      // Aranan kişi bu sohbette aramaları kapattıysa yalnızca yöneticiler arayabilir.
      if ((conversation?.call_disabled_for || []).includes(calleeId) && user.role !== 'admin') {
        return Response.json({ error: `${calleeName} bu sohbette aramaları kapattı.` }, { status: 403 });
      }

      const created = await base44.asServiceRole.entities.DirectCall.create({
        caller_id: user.id,
        caller_name: meName,
        caller_avatar: meAvatar,
        caller_frame: user.profile_frame || '',
        caller_frame_scale: user.profile_frame_scale || 100,
        // Cinsiyetler arama kaydında tutulur: görüntülü görüşme ücreti buna göre sorulur.
        caller_gender: caller?.gender || '',
        callee_id: calleeId,
        callee_name: calleeName,
        callee_avatar: callee.avatar || '',
        callee_frame: callee.profile_frame || '',
        callee_frame_scale: callee.profile_frame_scale || 100,
        callee_gender: callee.gender || '',
        conversation_id: conversationId,
        status: 'ringing',
        silent,
        started_at: new Date().toISOString(),
      });
      await mirrorRecord(base44, 'DirectCall', created);
      return Response.json({ call: created });
    }

    // video-request: görüntülü görüşme isteği. Ücret yalnızca erkek → kadın görüşmede alınır ve
    // KARŞI TARAF onayladığında tahsil edilir; onaylanmazsa isteyenden tek kuruş kesilmez.
    if (action === 'video-request') {
      const callId = String(body.call_id || '');
      const call = await base44.asServiceRole.entities.DirectCall.get(callId).catch(() => null);
      if (!call) return Response.json({ error: 'Arama bulunamadı.' }, { status: 404 });
      if (call.caller_id !== user.id && call.callee_id !== user.id) return Response.json({ error: 'Bu aramaya erişiminiz yok.' }, { status: 403 });
      if (call.status !== 'accepted') return Response.json({ error: 'Arama henüz başlamadı.' }, { status: 409 });

      const isCaller = call.caller_id === user.id;
      const otherId = isCaller ? call.callee_id : call.caller_id;
      // Ücret yalnızca erkek → kadın görüşmede alınır; diğer tüm eşleşmeler ücretsizdir.
      const needsPayment = (isCaller ? call.caller_gender : call.callee_gender) === 'erkek'
        && (isCaller ? call.callee_gender : call.caller_gender) === 'kadın';

      // Ücret bu aramada bir kez ödenir: görüntüyü kapatıp açmak yeniden coin istemez.
      if (call.video_fee_paid) return Response.json({ status: 'accepted', already_paid: true, call });

      if (!needsPayment) {
        const free = await base44.asServiceRole.entities.DirectCall.update(call.id, {
          video_fee_status: 'accepted', video_fee_by: user.id, video_fee_paid: false,
        }).catch(() => null);
        await mirrorRecord(base44, 'DirectCall', free);
        return Response.json({ status: 'accepted', coins: 0, call: free || { ...call, video_fee_status: 'accepted' } });
      }

      const pending = await base44.asServiceRole.entities.DirectCall.update(call.id, {
        video_fee_status: 'pending', video_fee_by: user.id, video_fee_paid: false,
      }).catch(() => null);
      await mirrorRecord(base44, 'DirectCall', pending);
      return Response.json({
        status: 'pending', coins: VIDEO_CALL_COINS, other_id: otherId,
        call: pending || { ...call, video_fee_status: 'pending', video_fee_by: user.id },
      });
    }

    // video-respond: gelen görüntülü isteği yanıtla. Onaylanırsa ücret isteyenden alınıp karşı
    // tarafın elmasına ve kotasına işlenir; reddedilirse hiçbir coin kesilmez.
    if (action === 'video-respond') {
      const callId = String(body.call_id || '');
      const accept = body.accept === true;
      const call = await base44.asServiceRole.entities.DirectCall.get(callId).catch(() => null);
      if (!call) return Response.json({ error: 'Arama bulunamadı.' }, { status: 404 });
      if (call.caller_id !== user.id && call.callee_id !== user.id) return Response.json({ error: 'Bu aramaya erişiminiz yok.' }, { status: 403 });
      const isPayer = !!call.video_fee_by && call.video_fee_by === user.id;
      if (!call.video_fee_by || call.video_fee_status !== 'pending') return Response.json({ call });

      // Red ya da isteği geri çekme: ücret alınmaz.
      if (!accept) {
        const rejected = await base44.asServiceRole.entities.DirectCall.update(call.id, { video_fee_status: 'rejected' });
        await mirrorRecord(base44, 'DirectCall', rejected);
        return Response.json({ call: rejected, charged: 0 });
      }

      // Onayı yalnızca isteği alan taraf verir; isteyen kendi isteğini yalnızca geri çekebilir.
      if (isPayer) return Response.json({ error: 'Onayı karşı taraf verir.' }, { status: 403 });
      if (call.video_fee_paid) return Response.json({ call, charged: 0 });

      const [payer, receiver] = await Promise.all([
        base44.asServiceRole.entities.User.get(call.video_fee_by).catch(() => null),
        base44.asServiceRole.entities.User.get(user.id).catch(() => null),
      ]);
      if (!payer || !receiver) return Response.json({ error: 'Hesap bulunamadı.' }, { status: 404 });

      // Kural yanıt anında yeniden doğrulanır: ücret yalnızca erkek → kadın görüşmede alınır.
      if (payer.gender !== 'erkek' || receiver.gender !== 'kadın') {
        const free = await base44.asServiceRole.entities.DirectCall.update(call.id, { video_fee_status: 'accepted', video_fee_paid: false });
        await mirrorRecord(base44, 'DirectCall', free);
        return Response.json({ call: free, charged: 0 });
      }

      const rl = await rateLimit(base44, 'video-fee:' + call.id, user.id, 20, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok hızlı denediniz, kısa süre sonra tekrar deneyin.' }, { status: 429 });

      const wallet = await ensureGiftWallet(base44, { id: payer.id, role: payer.role, full_name: payer.full_name || '' });
      const balance = Math.max(0, Number(wallet.coins) || 0);
      const payerName = payer.username || payer.full_name || 'Kullanıcı';
      const receiverName = receiver.username || receiver.full_name || 'Kullanıcı';
      if (balance < VIDEO_CALL_COINS) {
        const unpaid = await base44.asServiceRole.entities.DirectCall.update(call.id, { video_fee_status: 'rejected' }).catch(() => null);
        await mirrorRecord(base44, 'DirectCall', unpaid);
        return Response.json({
          error: `${payerName} kişisinin coin bakiyesi yetersiz. Görüntülü görüşme için ${VIDEO_CALL_COINS.toLocaleString('tr-TR')} coin gerekir.`,
        }, { status: 400 });
      }

      await base44.asServiceRole.entities.GameWallet.update(wallet.id, { coins: balance - VIDEO_CALL_COINS });
      // 3.000 coin = 3K = 3.000 elmas: karşı tarafın elmas bölümüne ve aylık kotasına işlenir.
      await base44.asServiceRole.entities.GiftSend.create({
        room_id: '',
        sender_id: payer.id, sender_name: payerName,
        recipient_id: receiver.id, recipient_name: receiverName,
        gift_id: 'video-call', gift_name: 'Görüntülü Görüşme', gift_emoji: '📹',
        gift_image_url: '', k_value: VIDEO_CALL_K, total_k: VIDEO_CALL_K,
        recipient_count: 1, mode: 'single', status: 'success',
      }).catch(() => {});
      await addGiftTotals(base44, { recipientIds: [receiver.id], kPerRecipient: VIDEO_CALL_K }).catch(() => null);
      // Elması kademeyi geçtiyse tamamlanan kota anında ödüllenir.
      await syncQuotaRewards(base44, receiver.id).catch(() => {});
      const updated = await base44.asServiceRole.entities.DirectCall.update(call.id, {
        video_fee_status: 'accepted', video_fee_paid: true,
      });
      await mirrorRecord(base44, 'DirectCall', updated);
      await base44.asServiceRole.entities.Notification.create({
        user_id: receiver.id,
        title: '📹 Görüntülü görüşme',
        type: 'video_call_coins',
        body: `${payerName}, görüntülü görüşme için ${VIDEO_CALL_COINS.toLocaleString('tr-TR')} coin gönderdi — elmaslarına eklendi.`,
        link: '/profil',
        ref_id: payer.id,
      }).catch(() => {});

      return Response.json({ call: updated, charged: VIDEO_CALL_COINS });
    }

    // get: süren aramanın güncel hâli — uygulama bunu 5 saniyede bir okuyup tazeler
    if (action === 'get') {
      const callId = String(body.call_id || '');
      const call = await base44.asServiceRole.entities.DirectCall.get(callId).catch(() => null);
      if (!call) return Response.json({ call: null });
      if (call.caller_id !== user.id && call.callee_id !== user.id) return Response.json({ error: 'Bu aramaya erişiminiz yok.' }, { status: 403 });
      return Response.json({ call });
    }

    // active: kaçırılan gelen aramayı yakalamak için yedek sorgu
    if (action === 'active') {
      const open = await openCalls();
      const mine = open.find((record) => record.caller_id === user.id || record.callee_id === user.id);
      return Response.json({ call: mine || null });
    }

    if (['accept', 'reject', 'cancel', 'end'].includes(action)) {
      const callId = String(body.call_id || '');
      const call = await base44.asServiceRole.entities.DirectCall.get(callId).catch(() => null);
      if (!call) return Response.json({ error: 'Arama bulunamadı.' }, { status: 404 });
      const isCaller = call.caller_id === user.id;
      const isCallee = call.callee_id === user.id;
      if (!isCaller && !isCallee) return Response.json({ error: 'Bu aramaya erişiminiz yok.' }, { status: 403 });
      const nowIso = new Date().toISOString();

      if (action === 'accept') {
        if (!isCallee) return Response.json({ error: 'Aramayı yalnızca aranan kişi yanıtlayabilir.' }, { status: 403 });
        if (call.status !== 'ringing') return Response.json({ call });
        const updated = await base44.asServiceRole.entities.DirectCall.update(callId, {
          status: 'accepted',
          accepted_at: nowIso,
          started_at: call.started_at || nowIso,
        });
        await mirrorRecord(base44, 'DirectCall', updated);
        return Response.json({ call: updated });
      }

      if (action === 'reject') {
        if (!isCallee) return Response.json({ error: 'yetkisiz' }, { status: 403 });
        if (call.status !== 'ringing') return Response.json({ call });
        const updated = await base44.asServiceRole.entities.DirectCall.update(callId, { status: 'rejected', ended_at: nowIso, ended_by: user.id });
        await mirrorRecord(base44, 'DirectCall', updated);
        return Response.json({ call: updated });
      }

      if (action === 'cancel') {
        if (!isCaller) return Response.json({ error: 'yetkisiz' }, { status: 403 });
        const updated = await base44.asServiceRole.entities.DirectCall.update(callId, { status: 'cancelled', ended_at: nowIso, ended_by: user.id });
        await mirrorRecord(base44, 'DirectCall', updated);
        return Response.json({ call: updated });
      }

      const updated = await base44.asServiceRole.entities.DirectCall.update(callId, { status: 'ended', ended_at: nowIso, ended_by: user.id });
      await mirrorRecord(base44, 'DirectCall', updated);
      return Response.json({ call: updated });
    }

    return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'İşlem başarısız.' }, { status: 500 });
  }
}