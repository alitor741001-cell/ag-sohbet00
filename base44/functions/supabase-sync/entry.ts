import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { runSync } from '../../shared/supabaseMirror.ts';

/**
 * Canlı aynalama: oda, katılımcı, mesaj, arkadaşlık ve çevrim içi durum verisini
 * Supabase'e taşır. Zamanlanmış görevden (kullanıcı yok) veya yöneticiden çağrılır.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    const payload = await req.json().catch(() => ({}));
    const mode = payload?.mode === 'all' ? 'all' : 'live';

    // Canlı tur uygulama içinden de tetiklenir (oturum açmış kullanıcı yeterli);
    // tam tur yalnızca yöneticide. Oturum yoksa çağrı platformdan gelmiştir.
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (user && user.role !== 'admin' && mode === 'all') {
      return Response.json({ error: 'yetkisiz' }, { status: 403 });
    }

    const summary = await runSync(base44, mode);

    return Response.json({ ok: summary.errors.length === 0, ...summary });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}