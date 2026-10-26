import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isAgOfficial } from '../../shared/agOfficial.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Giriş gerekli' }, { status: 401 });
    if (me.is_banned || me.role === 'banned' || (me.role !== 'admin' && !await isAgOfficial(base44, me))) return Response.json({ error: 'Yetkiniz yok' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const entities = base44.asServiceRole.entities;
    if (body.action === 'list') return Response.json(await entities.SupportTicket.list({ sort: '-updated_date', limit: 30, ...(typeof body.cursor === 'string' ? { cursor: body.cursor } : {}) }));
    if (!['messages', 'reply', 'close'].includes(body.action) || typeof body.ticket_id !== 'string' || !body.ticket_id) return Response.json({ error: 'Geçersiz işlem' }, { status: 400 });
    const ticket = await entities.SupportTicket.get(body.ticket_id);
    if (!ticket) return Response.json({ error: 'Görüşme bulunamadı' }, { status: 404 });
    if (body.action === 'messages') return Response.json(await entities.SupportMessage.filter({ ticket_id: ticket.id }, { sort: '-created_date', limit: 50, ...(typeof body.cursor === 'string' ? { cursor: body.cursor } : {}) }));
    if (body.action === 'reply') {
      if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 2000) return Response.json({ error: 'Mesaj 1–2000 karakter olmalıdır' }, { status: 400 });
      if (ticket.status === 'closed') return Response.json({ error: 'Görüşme kapalı' }, { status: 400 });
      await entities.SupportMessage.create({ ticket_id: ticket.id, owner_id: ticket.user_id, user_id: me.id, sender: 'admin', text: body.text.trim() });
      await entities.SupportTicket.update(ticket.id, { status: 'answered' });
    } else {
      await entities.SupportTicket.update(ticket.id, { status: 'closed' });
      await entities.SupportMessage.deleteMany({ ticket_id: ticket.id });
      await entities.SupportTicket.delete(ticket.id);
    }
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}