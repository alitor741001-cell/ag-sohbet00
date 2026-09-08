import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeErrorResponse } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const me = await base44.asServiceRole.entities.User.get(user.id);

    let memberId = me.member_id;
    if (!memberId) {
      for (let i = 0; i < 12; i++) {
        const candidate = String(Math.floor(10000000 + Math.random() * 90000000));
        const existing = await base44.asServiceRole.entities.User.filter({ member_id: candidate }, null, 1);
        if (!existing || existing.length === 0) { memberId = candidate; break; }
      }
    }

    let paymentRef = me.payment_reference;
    if (!paymentRef) {
      for (let i = 0; i < 12; i++) {
        const candidate = String(Math.floor(10000000 + Math.random() * 90000000));
        const existing = await base44.asServiceRole.entities.User.filter({ payment_reference: candidate }, null, 1);
        if (!existing || existing.length === 0) { paymentRef = candidate; break; }
      }
    }

    if (!memberId || !paymentRef) {
      return Response.json({ error: 'Numara oluşturulamadı' }, { status: 500 });
    }

    const isNewMember = !me.member_id;
    const updates = {};
    if (!me.member_id) updates.member_id = memberId;
    if (!me.payment_reference) updates.payment_reference = paymentRef;
    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.User.update(user.id, updates);
    }

    // Yeni üye için hoş geldiniz e-postası gönder (sadece ilk kayıtta)
    if (isNewMember) {
      const displayName = me.username || me.full_name || 'Kullanıcı';
      const htmlBody = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background:#0a0a0f;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;min-height:100vh;"><tr><td align="center" style="padding:40px 20px;">
<table width="500" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a2e,#16213e);border-radius:24px;overflow:hidden;border:1px solid rgba(239,68,68,0.3);box-shadow:0 20px 60px rgba(0,0,0,0.5);">
<tr><td align="center" style="padding:40px 40px 20px;background:linear-gradient(135deg,rgba(239,68,68,0.15),rgba(220,38,38,0.05));">
<h1 style="margin:0;font-size:32px;font-weight:900;letter-spacing:2px;color:#ef4444;">FILMKEYFİ</h1>
<p style="margin:8px 0 0;font-size:12px;color:#6b7280;letter-spacing:3px;text-transform:uppercase;">Sinematik Deneyim</p>
</td></tr>
<tr><td style="padding:30px 40px;">
<div style="text-align:center;margin-bottom:24px;font-size:48px;">🎉</div>
<h2 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;text-align:center;">Hoş Geldiniz!</h2>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#9ca3af;text-align:center;">Merhaba <strong style="color:#ef4444;">${displayName}</strong>,<br>FILMKEYFİ ailesine katıldığınız için teşekkür ederiz! Film ve dizilere erişim, oda oluşturma, arkadaşlarınızla birlikte izleme ve daha fazlası sizi bekliyor.</p>
<table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center" style="background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:12px;">
<a href="https://flimkeyfii.base44.app/abonelik" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">Üyeliğimi Aktif Et</a>
</td></tr></table>
<p style="margin:24px 0 0;font-size:13px;color:#6b7280;text-align:center;line-height:1.5;">Üyelik numaranız: <strong style="color:#ef4444;">${memberId}</strong></p>
</td></tr>
<tr><td style="padding:24px 40px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(239,68,68,0.15);">
<p style="margin:0;font-size:12px;color:#4b5563;text-align:center;line-height:1.6;">Bu e-posta FILMKEYFİ tarafından gönderilmiştir.<br>flimkeyfii.base44.app</p>
</td></tr>
</table>
</td></tr></table></body></html>`;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: me.email,
        subject: '🎉 FILMKEYFİ\'ye Hoş Geldiniz!',
        body: htmlBody,
      }).catch(() => {});
    }

    return Response.json({ member_id: memberId, payment_reference: paymentRef });
  } catch (e) {
    return safeErrorResponse(e);
  }
}