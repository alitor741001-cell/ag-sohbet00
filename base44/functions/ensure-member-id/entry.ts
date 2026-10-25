import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeErrorResponse } from '../../shared/security.ts';
import { membershipEmail } from '../../shared/membershipEmails.ts';

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

    if (isNewMember) {
      const displayName = me.username || me.full_name || 'Kullanıcı';
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: me.email,
        from_name: 'AG SOHBET',
        subject: 'AG SOHBET - Üyeliğiniz Aktif Edilmiştir',
        body: membershipEmail({ name: displayName, status: 'active' }),
      });
    }

    return Response.json({ member_id: memberId, payment_reference: paymentRef });
  } catch (e) {
    return safeErrorResponse(e);
  }
}