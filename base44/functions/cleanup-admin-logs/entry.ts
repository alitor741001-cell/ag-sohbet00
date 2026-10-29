import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Admin paneli güvenlik olayları (SecurityLog) ve son aktiviteler (AdminLog)
// kayıtlarını 1 günden eski olanları otomatik siler. Zamanlanmış workflow çağırır.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Workflow çağrıları uygulama yöneticisi kimliğiyle gelir; anonim çağrı silme yapamaz.
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'yetkisiz' }, { status: 403 });

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const securityResult = await base44.asServiceRole.entities.SecurityLog.deleteMany({ created_date: { $lt: cutoff } }).catch(() => ({}));
    const adminResult = await base44.asServiceRole.entities.AdminLog.deleteMany({ created_date: { $lt: cutoff } }).catch(() => ({}));

    return Response.json({ ok: true, cutoff, security: securityResult, admin: adminResult });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}