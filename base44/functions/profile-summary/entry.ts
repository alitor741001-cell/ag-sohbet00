import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { profileSummary } from '../../shared/profileSummary.ts';

/**
 * Profil sayfasının tek veri çağrısı: cüzdan (elmas, gönderilebilir bakiye) ve VIP
 * rozet sayısı Supabase aynasından gelir; aynada kayıt yoksa hesaplanır ve yazılır.
 * Böylece profil ağır hesaplamayı beklemeden açılır.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const limited = await rateLimit(base44, 'profile-summary:' + user.id, user.id, 60, 60000);
    if (!limited.allowed) return Response.json({ error: 'çok fazla istek' }, { status: 429 });

    const summary = await profileSummary(base44, { id: user.id, role: user.role, full_name: user.full_name });
    return Response.json({ ok: true, ...summary.wallet, vip_count: summary.vip_count });
  } catch (e) {
    return safeErrorResponse(e);
  }
}