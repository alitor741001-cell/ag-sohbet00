import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

const OPEN_STATUSES = ['ringing', 'accepted'];
const STALE_MS = 90 * 1000;

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

      const callee = await base44.asServiceRole.entities.User.get(calleeId).catch(() => null);
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
        callee_id: calleeId,
        callee_name: calleeName,
        callee_avatar: callee.avatar || '',
        callee_frame: callee.profile_frame || '',
        callee_frame_scale: callee.profile_frame_scale || 100,
        conversation_id: conversationId,
        status: 'ringing',
        silent,
        started_at: new Date().toISOString(),
      });
      return Response.json({ call: created });
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
        return Response.json({ call: updated });
      }

      if (action === 'reject') {
        if (!isCallee) return Response.json({ error: 'yetkisiz' }, { status: 403 });
        if (call.status !== 'ringing') return Response.json({ call });
        const updated = await base44.asServiceRole.entities.DirectCall.update(callId, { status: 'rejected', ended_at: nowIso, ended_by: user.id });
        return Response.json({ call: updated });
      }

      if (action === 'cancel') {
        if (!isCaller) return Response.json({ error: 'yetkisiz' }, { status: 403 });
        const updated = await base44.asServiceRole.entities.DirectCall.update(callId, { status: 'cancelled', ended_at: nowIso, ended_by: user.id });
        return Response.json({ call: updated });
      }

      const updated = await base44.asServiceRole.entities.DirectCall.update(callId, { status: 'ended', ended_at: nowIso, ended_by: user.id });
      return Response.json({ call: updated });
    }

    return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'İşlem başarısız.' }, { status: 500 });
  }
}