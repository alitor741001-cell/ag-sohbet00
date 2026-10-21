import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { safeErrorResponse } from '../../shared/security.ts';
import { effectiveVipLevel } from '../../shared/vip.ts';

/** VIP kimlik rozeti ürünleri: seviye yükseldikçe kendiliğinden açılır. */
const KINDS = ['badge', 'frame', 'banner', 'mic', 'bubble', 'card', 'ride', 'room-card', 'seat'];
const MIN_VIP = 5;
const ACTIONS = ['list', 'toggle'];

/**
 * VIP ürünleri: VIP5 ve üzeri hesapta rozet, çerçeve, giriş bannerı, mikrofon dalgası,
 * sohbet balonu, profil kartı, VIP aracı, oda kartı ve oda koltuğu otomatik olarak düşer.
 * Kişi istemediği ürünü kaldırabilir, tekrar etkinleştirebilir.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'list';
    if (!ACTIONS.includes(action)) return Response.json({ error: 'geçersiz istek' }, { status: 400 });

    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const level = effectiveVipLevel(me);

    if (action === 'toggle') {
      const kind = String(body?.kind || '');
      if (!KINDS.includes(kind)) return Response.json({ error: 'geçersiz ürün' }, { status: 400 });
      if (level < MIN_VIP) return Response.json({ error: `VIP ürünleri VIP${MIN_VIP} ve üzeri hesaplarda kullanılabilir.` }, { status: 403 });

      const rows = await base44.asServiceRole.entities.VipCosmetic.filter({ owner_id: user.id, kind }).catch(() => []);
      const record = rows[0];
      if (!record) return Response.json({ error: 'Ürün bulunamadı.' }, { status: 404 });
      await base44.asServiceRole.entities.VipCosmetic.update(record.id, { active: !!body?.active });
      return Response.json({ ok: true, kind, active: !!body?.active });
    }

    // Liste: VIP yoksa ürün de yok. Varsa eksik ürünler tamamlanır, seviye yükseldiyse ürünler tazelenir.
    if (level < MIN_VIP) return Response.json({ ok: true, level, items: [] });

    const rows = await base44.asServiceRole.entities.VipCosmetic.filter({ owner_id: user.id }, '-created_date', 50).catch(() => []);
    const byKind = new Map<string, any>(rows.map((row: any) => [row.kind, row]));
    const missing: any[] = [];
    const patches: any[] = [];
    for (const kind of KINDS) {
      const current = byKind.get(kind);
      if (!current) {
        missing.push({ owner_id: user.id, kind, level, active: true });
      } else if (Math.floor(Number(current.level) || 0) !== level) {
        const upgraded = level > Math.floor(Number(current.level) || 0);
        patches.push({ id: current.id, level, ...(upgraded ? { active: true } : {}) });
      }
    }
    if (missing.length) {
      const created = await base44.asServiceRole.entities.VipCosmetic.bulkCreate(missing).catch(() => []);
      (created || []).forEach((row: any) => { if (row?.kind) byKind.set(row.kind, row); });
    }
    if (patches.length) await base44.asServiceRole.entities.VipCosmetic.bulkUpdate(patches).catch(() => {});
    patches.forEach((patch) => {
      const row = [...byKind.values()].find((item: any) => item.id === patch.id);
      if (row) byKind.set(row.kind, { ...row, ...patch });
    });

    const items = KINDS.map((kind) => {
      const row = byKind.get(kind) || {};
      return { kind, level: Math.floor(Number(row.level) || level), active: row.active !== false };
    });

    return Response.json({ ok: true, level, items });
  } catch (error) {
    return safeErrorResponse(error, 'VIP ürünleri yüklenemedi.');
  }
}