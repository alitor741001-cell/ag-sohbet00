import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

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
    const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;min-height:100vh;"><tr><td align="center" style="padding:40px 20px;">
<table width="500" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;overflow:hidden;border:1px solid rgba(239,68,68,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);">
<tr><td align="center" style="padding:40px 40px 20px;background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.05));">
<h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:2px;color:#ef4444;">FILMKEYFİ</h1>
<p style="margin:8px 0 0;font-size:12px;color:#6b7280;letter-spacing:3px;text-transform:uppercase;">Sinematik Deneyim</p>
</td></tr>
<tr><td style="padding:30px 40px;">
<div style="text-align:center;margin-bottom:24px;font-size:48px;">✅</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;text-align:center;">Üyeliğiniz Aktif Edilmiştir</h2>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#9ca3af;text-align:center;">Merhaba <strong style="color:#ef4444;">${displayName}</strong>,<br>Hesabınız yönetici tarafından onaylandı ve üyeliğiniz aktif edilmiştir. FILMKEYFİ'nin tüm premium içeriklerine, odalarına ve özelliklerine artık erişebilirsiniz. İyi seyirler! 🎬🍿</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" style="background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:12px;">
<a href="https://flimkeyfii.base44.app/" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">İzlemeye Başla</a>
</td></tr></table>
</td></tr>
<tr><td style="padding:24px 40px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(239,68,68,0.15);">
<p style="margin:0;font-size:12px;color:#4b5563;text-align:center;line-height:1.6;">Bu e-posta FILMKEYFİ tarafından gönderilmiştir.<br>flimkeyfii.base44.app</p>
</td></tr>
</table>
</td></tr></table></body></html>`;

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: target.email,
      subject: '✅ FILMKEYFİ — Üyeliğiniz Aktif Edilmiştir',
      body: htmlBody,
    });

    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: e?.message || 'error' }, { status: 500 });
  }
}