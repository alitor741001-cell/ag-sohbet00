import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit } from '../../shared/security.ts';
import { purgeAccount } from '../../shared/accountPurge.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: 3 deneme / saat
    const rl = await rateLimit(base44, 'delete-account:' + user.id, user.id, 3, 3600000);
    if (!rl.allowed) return Response.json({ error: 'çok fazla deneme, daha sonra tekrar deneyin' }, { status: 429 });

    // Kişisel veriler temizlenir, veda e-postası gönderilir ve hesap silinir.
    await purgeAccount(base44, {
      userId: user.id,
      email: user.email,
      name: user.username || user.full_name || user.email,
    });

    return Response.json({ ok: true });
  } catch (e) {
    console.error('[delete-account error]', e?.message || String(e), e?.stack || '');
    return Response.json({ error: 'Hesap silinemedi. Lütfen destek ile iletişime geçin.' }, { status: 500 });
  }
}