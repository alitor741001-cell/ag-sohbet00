import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { applyVipToUser, vipDurationLabel } from '../../shared/vip.ts';
import { findByMemberId } from '../../shared/giftBox.ts';

const ACTIONS = ['list', 'use', 'send'];

/**
 * Mavi Çanta: coin yüklemesinden kazanılan VIP'ler burada bekler.
 * Kişi isterse kendisi kullanır (profilinde anında aktif olur), isterse
 * kimlik numarasıyla bir arkadaşına gönderir — gönderilen VIP alıcıda anında aktif olur.
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
    const displayName = me?.username || me?.full_name || user.full_name || 'Kullanıcı';

    const view = (item: any) => ({
      id: item.id,
      level: Math.max(0, Math.floor(Number(item.level) || 0)),
      days: Math.max(0, Math.floor(Number(item.days) || 0)),
      duration_label: vipDurationLabel(item.days),
      source: item.source || 'coin',
      sender_name: item.sender_name || '',
      recipient_name: item.recipient_name || '',
      status: item.status || 'bag',
      created_date: item.created_date || '',
    });

    // Çantadaki VIP'ler ve son hareketler.
    if (action === 'list') {
      const [bag, history] = await Promise.all([
        base44.asServiceRole.entities.VipItem.filter({ owner_id: user.id, status: 'bag' }, '-created_date', 50).catch(() => []),
        base44.asServiceRole.entities.VipItem.filter({ owner_id: user.id, status: { $ne: 'bag' } }, '-created_date', 20).catch(() => []),
      ]);
      return Response.json({ ok: true, items: bag.map(view), history: history.map(view) });
    }

    const picked = await base44.asServiceRole.entities.VipItem.get(String(body?.item_id || '')).catch(() => null);
    if (!picked || picked.owner_id !== user.id) return Response.json({ error: 'Bu VIP senin çantanda değil.' }, { status: 404 });
    if (picked.status !== 'bag') return Response.json({ error: 'Bu VIP zaten kullanıldı.' }, { status: 400 });

    // Kendi çantasından kendisi kullanır: seviye ve süre profilinde anında geçerli olur.
    if (action === 'use') {
      const rl = await rateLimit(base44, 'vip-bag-use:' + user.id, user.id, 20, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla işlem yaptın, biraz bekleyin.' }, { status: 429 });

      const applied = await applyVipToUser(base44, me, picked.level, picked.days, { vip_source: 'bag' });
      await base44.asServiceRole.entities.VipItem.update(picked.id, {
        status: 'used',
        used_at: new Date().toISOString(),
      });

      return Response.json({ ok: true, level: applied?.level || 0, days: picked.days });
    }

    // Kimlik numarasıyla bir arkadaşına gönderir: VIP alıcıda anında aktif olur.
    const rl = await rateLimit(base44, 'vip-bag-send:' + user.id, user.id, 20, 60000);
    if (!rl.allowed) return Response.json({ error: 'Çok fazla gönderim yaptın, biraz bekleyin.' }, { status: 429 });

    const target = await findByMemberId(base44, body?.member_id);
    if (!target) return Response.json({ error: 'Bu numaraya ait üye bulunamadı.' }, { status: 404 });
    if (target.id === user.id) {
      return Response.json({ error: 'Kendi numaranı girdin — "Kendim kullan" ile aktif edebilirsin.' }, { status: 400 });
    }

    const recipientName = target.username || target.full_name || 'Kullanıcı';
    await applyVipToUser(base44, target, picked.level, picked.days, { vip_source: 'gift' });
    await base44.asServiceRole.entities.VipItem.update(picked.id, {
      status: 'sent',
      recipient_id: target.id,
      recipient_name: recipientName,
      sent_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Notification.create({
      user_id: target.id,
      title: `VIP${picked.level} hediye edildi`,
      type: 'vip',
      body: `${displayName} sana VIP${picked.level} (${vipDurationLabel(picked.days)}) hediye etti — VIP'in anında aktif edildi.`,
      link: '/profil',
      ref_id: user.id,
    }).catch(() => {});

    return Response.json({ ok: true, level: picked.level, days: picked.days, recipient_name: recipientName });
  } catch (error) {
    return safeErrorResponse(error, 'VIP işlemi tamamlanamadı.');
  }
}