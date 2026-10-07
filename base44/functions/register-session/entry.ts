import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getClientIp, parseUserAgent, geoLookup } from '../../shared/sessionInfo.ts';

// Tek kişi tek oturum kartı: her girişte yeni satır açılmaz, kişinin mevcut oturum
// satırı tazelenir. Böylece listede kişi başına tek kayıt kalır, veri birikmez.
async function saveSession(base44, user, fields) {
  const rows = await base44.asServiceRole.entities.UserSession
    .filter({ user_id: user.id }, '-last_active', 5)
    .catch(() => []);
  const current = rows[0];
  if (!current) {
    await base44.asServiceRole.entities.UserSession.create({
      user_id: user.id,
      user_name: user.username || user.full_name || 'Kullanıcı',
      ...fields,
    }).catch(() => {});
    return;
  }
  await base44.asServiceRole.entities.UserSession.update(current.id, {
    ...fields,
    // İlk giriş tarihi korunur, kapanış bilgisi temizlenir: satır yeniden kullanılır.
    first_login: current.first_login || fields.first_login,
    ended_at: '',
  }).catch(() => {});
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const deviceSession = String(body?.device_session || '');
    const connectionType = ['wifi', 'cellular', 'ethernet', 'unknown'].includes(body?.connection_type) ? body.connection_type : 'unknown';
    const sessionId = crypto.randomUUID();
    const prevSession = user.active_session_id || '';
    const userName = user.username || user.full_name || 'Kullanıcı';

    const ip = getClientIp(req);
    const ua = req.headers.get('user-agent') || '';
    const dev = parseUserAgent(ua);
    const geo = await geoLookup(ip);

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
        type: 'security', link: '/admin/oturumlar'
      }).catch(() => {});
    }

    // Admin hesapları ve çoklu cihaz muaf e-postalar için önceki oturumlar pasife çekilmez ve active_session_id güncellenmez
    // — bu hesaplar birden fazla cihazdan aynı anda giriş yapabilir
    if (!isMultiDevice) {
      if (prevSession) {
        await base44.asServiceRole.entities.UserSession.updateMany(
          { user_id: user.id, status: 'active' },
          { $set: { status: 'inactive', ended_at: new Date().toISOString() } }
        ).catch(() => {});
      }

      // Oturum kaydı kişi başına tek satırda tutulur.
      await saveSession(base44, user, {
        session_id: sessionId,
        ip, last_ip: ip,
        country: geo.country, city: geo.city, region: geo.region, isp: geo.isp,
        device_type: dev.deviceType, os: dev.os, browser: dev.browser,
        model: dev.model || '', connection_type: connectionType,
        first_login: new Date().toISOString(),
        last_active: new Date().toISOString(),
        status: 'active'
      });

      await base44.asServiceRole.entities.User.update(user.id, {
        active_session_id: sessionId,
        last_login: new Date().toISOString()
      });
    } else {
      // Çoklu cihaz muaf hesapta da kişi başına tek satır güncellenir.
      await saveSession(base44, user, {
        session_id: sessionId,
        ip, last_ip: ip,
        country: geo.country, city: geo.city, region: geo.region, isp: geo.isp,
        device_type: dev.deviceType, os: dev.os, browser: dev.browser,
        model: dev.model || '', connection_type: connectionType,
        first_login: new Date().toISOString(),
        last_active: new Date().toISOString(),
        status: 'active'
      });

      await base44.asServiceRole.entities.User.update(user.id, {
        last_login: new Date().toISOString()
      });
    }
    return Response.json({ session_id: sessionId });
  } catch (e) {
    return Response.json({ error: 'işlem başarısız' }, { status: 500 });
  }
}