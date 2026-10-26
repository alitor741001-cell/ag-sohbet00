import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isAgOfficial } from '../../shared/agOfficial.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Zamanlanmış akış yetkili adına çalışır; admin veya AG yetkilisi olabilir, servis çağrısında kullanıcı yoktur.
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin' && !await isAgOfficial(base44, user)) return Response.json({ error: 'Yetkiniz yok' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    if (typeof body.ticket_id !== 'string' || !body.ticket_id) return Response.json({ error: 'Görüşme gerekli' }, { status: 400 });
    const entities = base44.asServiceRole.entities;
    const page = await entities.SupportTicket.filter({ id: body.ticket_id, status: 'closed' }, { limit: 1 });
    const ticket = page.items[0];
    if (!ticket) return Response.json({ ok: true, deleted: false });
    const expiresAt = Date.parse(ticket.delete_after || '');
    if (!Number.isFinite(expiresAt) || expiresAt > Date.now()) return Response.json({ error: 'Silme süresi henüz dolmadı' }, { status: 409 });
    await entities.SupportMessage.deleteMany({ ticket_id: ticket.id });
    await entities.SupportTicket.delete(ticket.id);
    return Response.json({ ok: true, deleted: true });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}