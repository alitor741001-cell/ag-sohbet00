import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getClientIp, parseUserAgent } from '../../shared/sessionInfo.ts';

// Oturum satırı tutulmaz: yalnızca tek cihaz kuralı (active_session_id) ve
// şüpheli giriş bildirimi işlenir. Böylece her girişte gereksiz kayıt yazılmaz.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const deviceSession = String(body?.device_session || '');
    const sessionId = crypto.randomUUID();
    const prevSession = user.active_session_id || '';
    const userName = user.username || user.full_name || 'Kullanıcı';

    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || '';
    const dev = parseUserAgent(ua);

    // Önceki aktif oturum varsa ve bu cihazın oturumu değilse — hesap başka cihazdan açılıyor, admin paneline bildir
    // Admin hesapları ve çoklu cihaz muaf e-postalar için bu bildirim atlanır
    const MULTI_DEVICE_EMAILS = ['alitor7474@gmail.com'];
    const isAdmin = user.role === 'admin';
    const isMultiDevice = isAdmin || MULTI_DEVICE_EMAILS.includes((user.email || '').toLowerCase());
    if (!isMultiDevice && prevSession && deviceSession !== prevSession) {
      await base44.asServiceRole.entities.AdminLog.create({
        admin_id: user.id, admin_name: userName,
        action: 'Hesap başka cihazdan açıldı', target: user.email || user.id,
        details: `IP: ${ip || 'bilinmiyor'} · ${dev.deviceType} · ${dev.os} · ${dev.browser}`
      }).catch(() => {});
      await base44.asServiceRole.entities.Notification.create({
        user_id: 'admin', title: 'Şüpheli giriş: hesap paylaşımı',
        body: `${userName} hesabına başka bir cihazdan giriş yapıldı. Önceki oturum kapatıldı.`,
        type: 'security'
      }).catch(() => {});
    }

    // Çoklu cihaz muaf hesaplar birden fazla cihazdan aynı anda giriş yapabilir:
    // bu hesaplarda aktif oturum kilidi güncellenmez.
    await base44.asServiceRole.entities.User.update(user.id, isMultiDevice
      ? { last_login: new Date().toISOString() }
      : { active_session_id: sessionId, last_login: new Date().toISOString() });

    return Response.json({ session_id: sessionId });
  } catch (e) {
    return Response.json({ error: 'işlem başarısız' }, { status: 500 });
  }
}