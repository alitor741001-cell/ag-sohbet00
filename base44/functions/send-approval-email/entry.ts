import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { membershipEmail } from '../../shared/membershipEmails.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me || me.role !== 'admin') return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { user_id } = body;
    if (!user_id) return Response.json({ error: 'user_id gerekli' }, { status: 400 });

    const target = await base44.asServiceRole.entities.User.get(user_id);
    if (!target) return Response.json({ error: 'kullanıcı bulunamadı' }, { status: 404 });

    const displayName = target.username || target.full_name || 'Kullanıcı';
    const htmlBody = membershipEmail({ name: displayName, status: 'active' });

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: target.email,
      from_name: 'FILMKEYFİ',
      subject: 'FILMKEYFİ - Üyeliğiniz Aktif Edilmiştir',
      body: htmlBody,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}