import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { notifyAdmins } from '../../shared/adminNotify.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { event, ref_id, title, body: msgBody, link, telegram_data } = body || {};

    if (!event || !title) return Response.json({ error: 'eksik bilgi' }, { status: 400 });

    // Yönetici olmayan kullanıcı yalnızca kendi akışlarının bildirimini tetikleyebilir:
    // olay türü ve bağlantı sunucuda belirlenir, istemciden gelen bağlantı kullanılmaz.
    const USER_EVENTS = {
      new_user: '/admin/kullanicilar',
      support: '/admin/destek',
      support_message: '/admin/destek',
    };
    let safeLink = link;
    if (user.role !== 'admin') {
      safeLink = USER_EVENTS[event];
      if (!safeLink) return Response.json({ error: 'yetkisiz' }, { status: 403 });
    } else if (typeof safeLink !== 'string' || !/^\/[a-z0-9\-/]*$/i.test(safeLink)) {
      safeLink = '/admin';
    }

    // Rate limit: 20 bildirim / dakika / kullanıcı
    const rl = await rateLimit(base44, 'admin-notify:' + user.id, user.id, 20, 60000);
    if (!rl.allowed) return Response.json({ error: 'rate limited' }, { status: 429 });

    const result = await notifyAdmins(base44, {
      event,
      ref_id,
      title,
      body: msgBody,
      link: safeLink,
      telegram_data,
    });

    return Response.json(result);
  } catch (e) {
    return safeErrorResponse(e);
  }
}