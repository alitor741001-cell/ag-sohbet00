import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { runSync } from '../../shared/supabaseMirror.ts';

/**
 * Tam aynalama: tüm koleksiyonları Supabase'e taşır ve kaynağından silinmiş
 * kayıtları aynadan düşürür. Zamanlanmış görevden veya yöneticiden çağrılır.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    try {
      const user = await base44.auth.me();
      if (user && user.role !== 'admin') {
        return Response.json({ error: 'yetkisiz' }, { status: 403 });
      }
    } catch {
      // oturum yok — zamanlanmış görev çağrısı, devam edilir
    }

    const summary = await runSync(base44, 'all');

    return Response.json({ ok: summary.errors.length === 0, ...summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}