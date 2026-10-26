import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isAgOfficial } from '../../shared/agOfficial.ts';
import { routeSupport, supportPayload } from '../../shared/supportRouting.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Giriş gerekli' }, { status: 401 });
    if (me.is_banned || me.role === 'banned') return Response.json({ error: 'Yetkiniz yok' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const entities = base44.asServiceRole.entities;
    if (body.action === 'sendMember') {
      const payload = supportPayload(body);
      if (!payload) return Response.json({ error: 'Geçerli bir mesaj veya ek gönderin. Mesaj en fazla 2000 karakter olabilir.' }, { status: 400 });
      const existing = await entities.SupportTicket.filter({ user_id: me.id, status: { $ne: 'closed' } }, '-created_date', 1);
      const now = new Date().toISOString();
      const ticket = existing[0] || await entities.SupportTicket.create({ user_id: me.id, user_name: me.username || me.full_name, subject: (payload.text || (payload.media_type === 'video' ? 'Video' : 'Fotoğraf')).slice(0, 60), category: 'Genel', status: 'reviewing' });
      const message = await entities.SupportMessage.create({ ticket_id: ticket.id, owner_id: me.id, user_id: me.id, sender: 'user', ...payload });
      const updated = await entities.SupportTicket.update(ticket.id, { status: 'reviewing', last_message: payload.text || (payload.media_type === 'video' ? 'Video' : 'Fotoğraf'), last_message_at: now, last_member_message_at: now });
      await routeSupport(base44);
      return Response.json({ ticket: updated, message, is_new: !existing.length });
    }
    if (me.role !== 'admin' && !await isAgOfficial(base44, me)) return Response.json({ error: 'Yetkiniz yok' }, { status: 403 });
    if (['list', 'badge'].includes(body.action)) {
      await routeSupport(base44);
      const query = { status: { $ne: 'closed' }, ...(me.role !== 'admin' ? { assigned_official_id: me.id } : {}) };
      if (body.action === 'badge') {
        const since = typeof body.since === 'string' && Number.isFinite(Date.parse(body.since)) ? new Date(body.since).toISOString() : new Date(0).toISOString();
        return Response.json({ count: await entities.SupportTicket.count({ ...query, $or: [{ last_member_message_at: { $gt: since } }, { $and: [{ last_member_message_at: { $exists: false } }, { created_date: { $gt: since } }] }] }) });
      }
      if (typeof body.member_id === 'string' && body.member_id.trim()) {
        const memberId = body.member_id.trim().replace(/^#/, '');
        if (memberId.length > 64) return Response.json({ error: 'Geçersiz kimlik numarası' }, { status: 400 });
        const matches = await entities.User.filter({ member_id: memberId }, '-created_date', 1);
        if (!matches.length) return Response.json({ items: [], has_more: false });
        query.user_id = matches[0].id;
      }
      const page = await entities.SupportTicket.filter(query, { sort: '-updated_date', limit: 30, ...(typeof body.cursor === 'string' ? { cursor: body.cursor } : {}) });
      const ids = [...new Set(page.items.map(ticket => ticket.user_id).filter(id => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)))];
      const users = ids.length ? await entities.User.filter({ id: { $in: ids } }, '-created_date', ids.length) : [];
      const profiles = new Map(users.map(user => [user.id, user]));
      return Response.json({ ...page, items: page.items.map(ticket => {
        const user = profiles.get(ticket.user_id);
        return { ...ticket, user_name: user?.username || user?.full_name || ticket.user_name, user_avatar: user?.avatar || '', member_id: user?.member_id || '' };
      }) });
    }
    if (!['messages', 'reply', 'close'].includes(body.action) || typeof body.ticket_id !== 'string' || !body.ticket_id) return Response.json({ error: 'Geçersiz işlem' }, { status: 400 });
    const ticket = await entities.SupportTicket.get(body.ticket_id);
    if (!ticket) return Response.json({ error: 'Görüşme bulunamadı' }, { status: 404 });
    if (me.role !== 'admin' && ticket.assigned_official_id !== me.id) return Response.json({ error: 'Bu görüşme başka bir yetkiliye atanmış.' }, { status: 403 });
    if (ticket.status === 'closed') return body.action === 'close' ? Response.json({ ok: true }) : Response.json({ error: 'Konu kapandı' }, { status: 410 });
    if (body.action === 'messages') return Response.json(await entities.SupportMessage.filter({ ticket_id: ticket.id }, { sort: '-created_date', limit: 50, ...(typeof body.cursor === 'string' ? { cursor: body.cursor } : {}) }));
    if (body.action === 'reply') {
      const payload = supportPayload(body);
      if (!payload) return Response.json({ error: 'Geçerli bir mesaj veya ek gönderin. Mesaj en fazla 2000 karakter olabilir.' }, { status: 400 });
      await entities.SupportMessage.create({ ticket_id: ticket.id, owner_id: ticket.user_id, user_id: me.id, sender: 'admin', ...payload });
      await entities.SupportTicket.update(ticket.id, { status: 'answered', last_message: payload.text || (payload.media_type === 'video' ? 'Video' : 'Fotoğraf'), last_message_at: new Date().toISOString() });
    } else {
      const closedAt = new Date().toISOString();
      const deleteAfter = new Date(Date.now() + 60000).toISOString();
      await entities.SupportTicket.update(ticket.id, { status: 'closed', closed_at: closedAt, delete_after: deleteAfter });
      await entities.Notification.create({ user_id: ticket.user_id, title: 'Destek konusu kapandı', body: 'Konu kapandı. Görüşme mesajları bir dakika sonra otomatik silinecek.', type: 'info', link: '/destek', ref_id: `support-closed:${ticket.id}` });
    }
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}