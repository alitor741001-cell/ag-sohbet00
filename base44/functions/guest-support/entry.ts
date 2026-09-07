import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { waitUntil } from 'base44:runtime';
import { sendPushToAll } from '../../shared/webPush.ts';
import { sanitizeText, validateUploadUrl, rateLimit, safeErrorResponse } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, ticket_id, name, email, subject, text, file_url } = body || {};

    if (action === 'create') {
      if (!text && !file_url) return Response.json({ error: 'eksik bilgi' }, { status: 400 });

      // Rate limit: misafir ticket oluşturma — IP bazlı (user yok)
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
      const rl = await rateLimit(base44, 'guest-create:' + ip, '', 5, 300000);
      if (!rl.allowed) return Response.json({ error: 'çok fazla talep oluşturdunuz' }, { status: 429 });

      const guestId = 'guest:' + (email ? sanitizeText(email, 100).toLowerCase().trim() : Math.random().toString(36).slice(2, 10));
      const displayName = sanitizeText(name, 40) || 'Misafir';
      const cleanText = sanitizeText(text, 2000) || '📷 Fotoğraf';
      const cleanFile = file_url ? validateUploadUrl(file_url) : '';
      const cleanSubject = sanitizeText(subject, 100) || 'Canlı Destek';

      const ticket = await base44.asServiceRole.entities.SupportTicket.create({
        user_id: guestId,
        user_name: displayName,
        subject: cleanSubject,
        category: 'Genel',
        status: 'new'
      });
      await base44.asServiceRole.entities.SupportMessage.create({
        ticket_id: ticket.id,
        owner_id: guestId,
        user_id: guestId,
        sender: 'user',
        text: cleanText,
        file_url: cleanFile || ''
      });
      waitUntil(sendPushToAll(base44, '🎫 Yeni Destek Talebi', cleanText.slice(0, 100), '/admin/destek'));
      return Response.json({ ticket_id: ticket.id });
    }

    if (action === 'send') {
      if (!ticket_id || (!text && !file_url)) return Response.json({ error: 'eksik bilgi' }, { status: 400 });

      // Rate limit: mesaj gönderme — ticket bazlı
      const rl = await rateLimit(base44, 'guest-msg:' + ticket_id, '', 20, 60000);
      if (!rl.allowed) return Response.json({ error: 'çok hızlı mesaj gönderiyorsunuz' }, { status: 429 });

      const ticket = await base44.asServiceRole.entities.SupportTicket.get(ticket_id).catch(() => null);
      if (!ticket) return Response.json({ error: 'ticket bulunamadı' }, { status: 404 });
      if (ticket.status === 'closed') return Response.json({ error: 'destek talebi kapatıldı' }, { status: 403 });

      const ownerId = ticket.user_id || 'guest';
      const cleanText = sanitizeText(text, 2000) || '📷 Fotoğraf';
      const cleanFile = file_url ? validateUploadUrl(file_url) : '';

      await base44.asServiceRole.entities.SupportMessage.create({
        ticket_id,
        owner_id: ownerId,
        user_id: ownerId,
        sender: 'user',
        text: cleanText,
        file_url: cleanFile || ''
      });
      waitUntil(sendPushToAll(base44, '💬 Yeni Destek Mesajı', cleanText.slice(0, 100), '/admin/destek'));
      return Response.json({ ok: true });
    }

    if (action === 'poll') {
      if (!ticket_id) return Response.json({ error: 'eksik bilgi' }, { status: 400 });
      const messages = await base44.asServiceRole.entities.SupportMessage.filter({ ticket_id }, 'created_date', 200);
      let ticket_status = 'active';
      try {
        const ticket = await base44.asServiceRole.entities.SupportTicket.get(ticket_id);
        ticket_status = ticket?.status || 'active';
      } catch {}
      return Response.json({ messages, ticket_status });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (e) {
    return safeErrorResponse(e);
  }
}