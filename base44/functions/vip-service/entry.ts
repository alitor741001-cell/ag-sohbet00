import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { badgeLevels, VIP_MAX } from '../../shared/userLevels.ts';
import { VIP_DAY_MS, VIP_DURATIONS, vipActive, vipDurationLabel, vipExpiryMs } from '../../shared/vip.ts';

const ACTIONS = ['list', 'search', 'set'];

/**
 * VIP Merkezi: yalnızca yöneticiler VIP seviyesi verir/kaldırır.
 * Liste VIP sahiplerini ve son kayıtları birlikte gösterir.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    if (!me || me.role !== 'admin') return Response.json({ error: 'Yetkisiz' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    if (!ACTIONS.includes(action)) return Response.json({ error: 'geçersiz istek' }, { status: 400 });

    const adminName = me.username || me.full_name || 'Yönetici';

    const view = (record: any) => ({
      user_id: record.id,
      name: record.username || record.full_name || 'Kullanıcı',
      avatar: record.avatar || '',
      member_id: record.member_id || '',
      ...badgeLevels(record),
    });

    const findPerson = async (rawQuery: any) => {
      const query = String(rawQuery || '').trim();
      if (!query) return null;
      const direct = await base44.asServiceRole.entities.User.get(query).catch(() => null);
      if (direct?.id) return direct;
      const fields = ['member_id', 'username', 'email', 'payment_reference'];
      for (const field of fields) {
        const value = field === 'email' ? query.toLowerCase() : query;
        const found = await base44.asServiceRole.entities.User.filter({ [field]: value }, '-created_date', 1).catch(() => []);
        if (found[0]) return found[0];
      }
      return null;
    };

    // Kişi arama: kimlik numarası, kullanıcı adı, e-posta ya da ID.
    if (action === 'search') {
      const found = await findPerson(body?.query);
      if (!found) return Response.json({ error: 'Bu bilgiyle bir kullanıcı bulunamadı.' }, { status: 404 });
      return Response.json({ ok: true, people: [view(found)] });
    }

    // VIP ver: 0 verilirse VIP kaldırılır. Süre: 1 hafta / 15 gün / 1 ay.
    if (action === 'set') {
      const target = await base44.asServiceRole.entities.User.get(String(body?.user_id || '')).catch(() => null);
      if (!target?.id) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

      const rl = await rateLimit(base44, 'vip-set:' + user.id, user.id, 60, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla işlem yaptın, biraz bekleyin.' }, { status: 429 });

      const level = Math.max(0, Math.min(VIP_MAX, Math.floor(Number(body?.vip_level) || 0)));
      const days = level > 0 ? VIP_DURATIONS[String(body?.duration || 'month')] || VIP_DURATIONS.month : 0;
      // Kişinin süresi henüz bitmediyse yeni süre onun üstüne eklenir.
      const currentExpiry = vipExpiryMs(target);
      const base = level > 0 && vipActive(target) && currentExpiry ? currentExpiry : Date.now();

      await base44.asServiceRole.entities.User.update(target.id, {
        vip_level: level,
        vip_expires_at: level > 0 ? new Date(base + days * VIP_DAY_MS).toISOString() : '',
        vip_source: 'admin',
        vip_granted_by: adminName,
        vip_granted_at: new Date().toISOString(),
      });

      const label = target.username || target.full_name || 'Kullanıcı';
      await base44.asServiceRole.entities.AdminLog.create({
        admin_id: user.id,
        admin_name: adminName,
        action: 'vip-set',
        target: `${label} (${target.member_id || target.id})`,
        details: level > 0 ? `VIP${level} verildi (${vipDurationLabel(days)})` : 'VIP kaldırıldı',
      }).catch(() => {});

      await base44.asServiceRole.entities.Notification.create({
        user_id: target.id,
        title: level > 0 ? `VIP${level} çantana eklendi` : 'VIP kaldırıldı',
        type: 'vip',
        body: level > 0
          ? `${adminName} hesabına VIP${level} verdi (${vipDurationLabel(days)}). Rozetin profilin ve odalarda görünür.`
          : `${adminName} hesabındaki VIP rozetini kaldırdı.`,
        link: '/profil',
        ref_id: user.id,
      }).catch(() => {});

      const updated = await base44.asServiceRole.entities.User.get(target.id).catch(() => target);
      return Response.json({ ok: true, person: view(updated) });
    }

    // Liste: VIP sahipleri önce, ardından son katılan üyeler.
    const [vipRows, recent] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ vip_level: { $gte: 5 } }, '-vip_level', 50).catch(() => []),
      base44.asServiceRole.entities.User.list('-created_date', 50).catch(() => []),
    ]);
    const merged = new Map();
    [...vipRows, ...recent].forEach((record: any) => { if (record?.id) merged.set(record.id, record); });
    const people = [...merged.values()]
      .map(view)
      .sort((a: any, b: any) => (b.vip_level - a.vip_level) || (a.name > b.name ? 1 : -1))
      .slice(0, 80);

    return Response.json({ ok: true, people });
  } catch (error) {
    return safeErrorResponse(error, 'VIP işlemi tamamlanamadı.');
  }
}