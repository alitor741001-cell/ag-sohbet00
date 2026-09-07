import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { getVapidPublicKey, sendPushToAll } from '../../shared/webPush.ts';
import { rateLimit, safeErrorResponse, logSecurity, sanitizeText, validateUrl } from '../../shared/security.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action, subscription, title, body: msgBody, url } = body || {};

    if (action === 'get-key') {
      const publicKey = await getVapidPublicKey(base44);
      return Response.json({ publicKey });
    }

    if (action === 'subscribe') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (!subscription || !subscription.endpoint || typeof subscription.endpoint !== 'string') {
        return Response.json({ error: 'eksik bilgi' }, { status: 400 });
      }
      // Rate limit: 5 abonelik / saat
      const rl = await rateLimit(base44, 'push-sub:' + user.id, user.id, 5, 3600000);
      if (!rl.allowed) return Response.json({ error: 'çok fazla istek' }, { status: 429 });
      // Endpoint URL doğrula
      const ep = validateUrl(subscription.endpoint);
      if (!ep) return Response.json({ error: 'geçersiz endpoint' }, { status: 400 });
      const existing = await base44.asServiceRole.entities.PushSubscription.filter({ endpoint: ep });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.PushSubscription.create({
          user_id: user.id,
          endpoint: ep,
          p256dh: sanitizeText(subscription.keys?.p256dh || '', 200),
          auth: sanitizeText(subscription.keys?.auth || '', 100)
        });
      }
      return Response.json({ ok: true });
    }

    if (action === 'send') {
      // SADECE admin push gönderebilir
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      const me = await base44.asServiceRole.entities.User.get(user.id);
      if (me.role !== 'admin') {
        await logSecurity(base44, 'push_send_denied', user, 'non-admin', 'warning');
        return Response.json({ error: 'admin only' }, { status: 403 });
      }
      const cleanTitle = sanitizeText(title || 'FILMKEYFİ', 100);
      const cleanBody = sanitizeText(msgBody || '', 200);
      const cleanUrl = sanitizeText(url || '/', 200);
      const sent = await sendPushToAll(base44, cleanTitle, cleanBody, cleanUrl);
      await logSecurity(base44, 'push_sent', user, `to ${sent} users`, 'info');
      return Response.json({ ok: true, sent });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (e) {
    return safeErrorResponse(e);
  }
}