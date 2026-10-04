import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { ensureGiftWallet } from '../../shared/giftWallet.ts';

const ACTIONS = ['lookup', 'grant', 'revert', 'list'];
// Tek seferde yüklenebilecek en yüksek coin — kazara devasa yükleme olmasın.
const MAX_GRANT = 50000000;

/**
 * Admin coin yükleme: kişiyi bulur, cüzdanına coin yükler, yanlış gönderileni geri çeker
 * ve son işlemleri listeler. Yalnızca yöneticiler çağırabilir.
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

    // Kimlik numarası, kullanıcı adı, e-posta ya da ID ile kişi arama.
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

    const personView = (record: any) => ({
      user_id: record.id,
      name: record.username || record.full_name || 'Kullanıcı',
      avatar: record.avatar || '',
      member_id: record.member_id || '',
    });

    // Kişiyi bul ve mevcut coin bakiyesiyle göster.
    if (action === 'lookup') {
      const found = await findPerson(body?.query);
      if (!found) return Response.json({ error: 'Bu bilgiyle bir kullanıcı bulunamadı.' }, { status: 404 });
      const wallet = await ensureGiftWallet(base44, found);
      return Response.json({
        ok: true,
        person: { ...personView(found), coins: Math.max(0, Number(wallet?.coins) || 0) },
      });
    }

    // Coin yükleme: cüzdan bakiyesine eklenir ve kayda geçilir.
    if (action === 'grant') {
      const amount = Math.floor(Number(body?.amount) || 0);
      if (!amount || amount < 1) return Response.json({ error: 'Geçersiz coin miktarı.' }, { status: 400 });
      if (amount > MAX_GRANT) {
        return Response.json({ error: `Tek seferde en fazla ${MAX_GRANT.toLocaleString('tr-TR')} coin yüklenebilir.` }, { status: 400 });
      }

      const target = body?.user_id
        ? await base44.asServiceRole.entities.User.get(String(body.user_id)).catch(() => null)
        : await findPerson(body?.query);
      if (!target?.id) return Response.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

      const rl = await rateLimit(base44, 'coin-grant:' + user.id, user.id, 60, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla işlem yaptın, biraz bekleyin.' }, { status: 429 });

      const wallet = await ensureGiftWallet(base44, target);
      const balance = Math.max(0, Number(wallet?.coins) || 0);
      const next = balance + amount;
      if (wallet?.id) await base44.asServiceRole.entities.GameWallet.update(wallet.id, { coins: next, admin_granted: true });

      const view = personView(target);
      const grant = await base44.asServiceRole.entities.CoinGrant.create({
        admin_id: user.id,
        admin_name: adminName,
        user_id: target.id,
        user_name: view.name,
        user_avatar: view.avatar,
        member_id: view.member_id,
        amount,
        coins_after: next,
        note: String(body?.note || '').slice(0, 300),
        status: 'active',
      });

      await base44.asServiceRole.entities.AdminLog.create({
        admin_id: user.id,
        admin_name: adminName,
        action: 'coin-grant',
        target: `${view.name} (${view.member_id || target.id})`,
        details: `+${amount.toLocaleString('tr-TR')} coin`,
      }).catch(() => {});

      // Yüklenen coin, üyenin bildirimlerine düşer.
      await base44.asServiceRole.entities.Notification.create({
        user_id: target.id,
        title: 'Coin yüklendi',
        type: 'coin_grant',
        body: `${adminName} hesabına ${amount.toLocaleString('tr-TR')} coin yükledi. Yeni bakiyen: ${next.toLocaleString('tr-TR')} coin.`,
        link: '/profil',
        ref_id: user.id,
      }).catch(() => {});

      return Response.json({ ok: true, grant, coins: next, person: { ...view, coins: next } });
    }

    // Yanlış gönderilen coini geri çek — yalnızca geri çekilmemiş son gönderimler için.
    if (action === 'revert') {
      let grant = null;
      if (body?.grant_id) {
        grant = await base44.asServiceRole.entities.CoinGrant.get(String(body.grant_id)).catch(() => null);
      } else {
        const recent = await base44.asServiceRole.entities.CoinGrant.list('-created_date', 20).catch(() => []);
        grant = recent.find((item: any) => item?.status === 'active') || null;
      }
      if (!grant) return Response.json({ error: 'Geri çekilecek gönderim bulunamadı.' }, { status: 404 });
      if (grant.status !== 'active') return Response.json({ error: 'Bu gönderim zaten geri çekildi.' }, { status: 400 });

      const wallets = await base44.asServiceRole.entities.GameWallet
        .filter({ user_id: grant.user_id }, '-created_date', 1)
        .catch(() => []);
      const wallet = wallets[0] || null;
      if (!wallet?.id) return Response.json({ error: 'Kullanıcının cüzdanı bulunamadı.' }, { status: 404 });

      const amount = Math.max(0, Number(grant.amount) || 0);
      const balance = Math.max(0, Number(wallet.coins) || 0);
      if (balance < amount) {
        return Response.json({ error: 'Kullanıcının bakiyesi yetersiz — coinler harcanmış olabilir.' }, { status: 400 });
      }

      const next = balance - amount;
      await base44.asServiceRole.entities.GameWallet.update(wallet.id, { coins: next });
      await base44.asServiceRole.entities.CoinGrant.update(grant.id, {
        status: 'reverted',
        reverted_at: new Date().toISOString(),
        reverted_by: adminName,
      });

      await base44.asServiceRole.entities.AdminLog.create({
        admin_id: user.id,
        admin_name: adminName,
        action: 'coin-revert',
        target: `${grant.user_name || 'Kullanıcı'} (${grant.member_id || grant.user_id})`,
        details: `-${amount.toLocaleString('tr-TR')} coin`,
      }).catch(() => {});

      return Response.json({ ok: true, reverted: amount, coins: next });
    }

    // Son işlemler.
    const limit = Math.min(60, Math.max(5, Number(body?.limit) || 30));
    const grants = await base44.asServiceRole.entities.CoinGrant.list('-created_date', limit).catch(() => []);
    return Response.json({ ok: true, grants });
  } catch (error) {
    return safeErrorResponse(error, 'İşlem tamamlanamadı.');
  }
}