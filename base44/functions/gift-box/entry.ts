import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { ensureGiftWallet, giftBalance } from '../../shared/giftWallet.ts';
import { COINS_PER_DOLLAR, findByMemberId, giftBoxSummary } from '../../shared/giftBox.ts';
import { upsertNotification } from '../../shared/upsertNotification.ts';

const ACTIONS = ['summary', 'lookup', 'send', 'withdraw'];
const MIN_SEND_DOLLARS = 1;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    if (!ACTIONS.includes(action)) return Response.json({ error: 'geçersiz istek' }, { status: 400 });

    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const displayName = me?.username || me?.full_name || user.full_name || 'Kullanıcı';
    const account = { id: user.id, role: me?.role || user.role, full_name: user.full_name };

    // Hediye kutusu durumu
    if (action === 'summary') {
      const summary = await giftBoxSummary(base44, account);
      return Response.json({ ok: true, member_id: me?.member_id || '', ...summary });
    }

    // Kimlik numarasıyla kişi arama
    if (action === 'lookup') {
      const target = await findByMemberId(base44, body?.member_id);
      if (!target) return Response.json({ error: 'Bu numaraya ait üye bulunamadı.' }, { status: 404 });
      if (target.id === user.id) return Response.json({ error: 'Kendi numaranı girdin.' }, { status: 400 });
      return Response.json({
        ok: true,
        person: {
          user_id: target.id,
          name: target.username || target.full_name || 'Kullanıcı',
          avatar: target.avatar || '',
          member_id: target.member_id || '',
        },
      });
    }

    // Bakiye gönderimi: 1 dolar = 5.000 coin
    if (action === 'send') {
      const dollars = Math.round((Number(body?.dollars) || 0) * 100) / 100;
      if (dollars < MIN_SEND_DOLLARS) {
        return Response.json({ error: `En az ${MIN_SEND_DOLLARS} dolar gönderilebilir.` }, { status: 400 });
      }
      const target = await findByMemberId(base44, body?.member_id);
      if (!target) return Response.json({ error: 'Bu numaraya ait üye bulunamadı.' }, { status: 404 });
      if (target.id === user.id) return Response.json({ error: 'Kendine gönderemezsin.' }, { status: 400 });

      const rl = await rateLimit(base44, 'gift-box-send:' + user.id, user.id, 20, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla gönderim yaptın, biraz bekleyin.' }, { status: 429 });

      const summary = await giftBoxSummary(base44, account);
      if (dollars > summary.available_dollars) {
        return Response.json({
          error: `Bakiyen yetersiz. Kullanılabilir: ${summary.available_dollars.toFixed(2)} $`,
          available_dollars: summary.available_dollars,
        }, { status: 400 });
      }

      const coins = Math.round(dollars * COINS_PER_DOLLAR);
      const recipientName = target.username || target.full_name || 'Kullanıcı';
      await base44.asServiceRole.entities.GiftTransfer.create({
        kind: 'send',
        status: 'completed',
        sender_id: user.id,
        sender_name: displayName,
        recipient_id: target.id,
        recipient_name: recipientName,
        dollars,
        coins,
      });

      const wallet = await ensureGiftWallet(base44, { id: target.id, role: target.role, full_name: target.full_name });
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: Math.max(0, Number(wallet.coins) || 0) + coins,
      });

      await upsertNotification(base44, {
        user_id: target.id,
        title: 'Hediye kutusu',
        type: 'gift_box_send',
        body: `${displayName} sana ${dollars.toFixed(2)} $ değerinde ${coins.toLocaleString('tr-TR')} coin gönderdi.`,
        link: '/profil',
        ref_id: user.id,
      });

      return Response.json({
        ok: true,
        dollars,
        coins,
        recipient_name: recipientName,
        recipient_coins: Math.max(0, Number(updated?.coins) || 0),
        balance: await giftBoxSummary(base44, account),
      });
    }

    // Çekim talebi: talep kaydı oluşur ve yöneticilere bildirim düşer
    if (action === 'withdraw') {
      const rl = await rateLimit(base44, 'gift-box-withdraw:' + user.id, user.id, 5, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla talep, biraz bekleyin.' }, { status: 429 });

      const summary = await giftBoxSummary(base44, account);
      const requested = Math.round((Number(body?.dollars) || summary.available_dollars) * 100) / 100;
      if (requested <= 0) return Response.json({ error: 'Çekilecek bakiye yok.' }, { status: 400 });
      if (requested > summary.available_dollars) {
        return Response.json({ error: 'Çekilebilir bakiyeden fazlasını çekemezsin.' }, { status: 400 });
      }

      await base44.asServiceRole.entities.GiftTransfer.create({
        kind: 'withdraw',
        status: 'pending',
        sender_id: user.id,
        sender_name: displayName,
        recipient_id: '',
        recipient_name: '',
        dollars: requested,
        coins: 0,
      });

      const admins = await base44.asServiceRole.entities.User
        .filter({ role: 'admin' }, '-created_date', 20)
        .catch(() => []);
      await Promise.all(admins.map((admin) => upsertNotification(base44, {
        user_id: admin.id,
        title: 'Çekim talebi',
        type: 'gift_box_withdraw:' + user.id,
        body: `${displayName} ${requested.toFixed(2)} $ çekim talebi oluşturdu.`,
        link: '/admin',
        ref_id: user.id,
      })));

      return Response.json({
        ok: true,
        dollars: requested,
        balance: await giftBoxSummary(base44, account),
      });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}