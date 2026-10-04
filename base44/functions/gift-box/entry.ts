import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { ensureGiftWallet, giftBalance } from '../../shared/giftWallet.ts';
import { COINS_PER_DOLLAR, findByMemberId, giftBoxSummary, giftDollarsFromK, monthStartIso } from '../../shared/giftBox.ts';
import { getUsdTry, tlFromDollars, tlRateFrom } from '../../shared/exchangeRate.ts';

const ACTIONS = ['summary', 'lookup', 'send', 'withdraw', 'convert', 'received'];
const MIN_CONVERT_DOLLARS = 1;
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

    // Hediye gönderenler: her ayın 1'inde sıfırlanır — yalnızca bu ayın gönderimleri listelenir.
    if (action === 'received') {
      const monthStart = monthStartIso();
      const allRecords = await base44.asServiceRole.entities.GiftSend
        .filter({ recipient_id: user.id }, '-created_date', 2000)
        .catch(() => []);
      const records = allRecords.filter((record) => {
        const created = String(record?.created_date || '');
        return created ? created.slice(0, 19) >= monthStart : false;
      });
      const grouped = new Map();
      records.forEach((record) => {
        const key = record.sender_id || 'bilinmeyen';
        if (!grouped.has(key)) {
          grouped.set(key, {
            sender_id: key,
            name: record.sender_name || 'Kullanıcı',
            member_id: '',
            avatar: '',
            count: 0,
            total_k: 0,
            dollars: 0,
            tl: 0,
            items: [],
          });
        }
        const entry = grouped.get(key);
        const kValue = Math.max(0, Number(record.k_value) || 0);
        entry.count += 1;
        entry.total_k = Math.round((entry.total_k + kValue) * 100) / 100;
        entry.items.push({
          id: record.id,
          gift_name: record.gift_name || 'Hediye',
          gift_emoji: record.gift_emoji || '🎁',
          gift_image_url: record.gift_image_url || '',
          k_value: kValue,
          count: Math.max(1, Number(record.recipient_count) || 1),
          mode: record.mode || 'single',
          room_id: record.room_id || '',
          created_date: record.created_date,
        });
      });

      const senders = [...grouped.values()];
      const ids = senders.map((item) => item.sender_id).filter(Boolean);
      if (ids.length) {
        const people = await base44.asServiceRole.entities.User
          .filter({ id: { $in: ids } }, '-created_date', ids.length)
          .catch(() => []);
        const byId = new Map(people.map((person) => [person.id, person]));
        senders.forEach((item) => {
          const person = byId.get(item.sender_id);
          if (!person) return;
          item.name = person.username || person.full_name || item.name;
          item.member_id = person.member_id || '';
          item.avatar = person.avatar || '';
        });
      }

      const market = await getUsdTry(base44);
      const tlRate = tlRateFrom(market.rate);
      let totalK = 0;
      senders.forEach((item) => {
        totalK += item.total_k;
        item.dollars = giftDollarsFromK(item.total_k);
        item.tl = tlFromDollars(item.dollars, tlRate);
        item.items.sort((a, b) => (String(a.created_date) < String(b.created_date) ? 1 : -1));
      });
      senders.sort((a, b) => b.total_k - a.total_k);

      return Response.json({
        ok: true,
        senders,
        total_k: Math.round(totalK * 100) / 100,
        total_dollars: giftDollarsFromK(totalK),
        total_tl: tlFromDollars(giftDollarsFromK(totalK), tlRate),
        tl_rate: tlRate,
      });
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
          error: `Bakiyen yetersiz. Kullanılabilir: ${summary.available_dollars} $`,
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

      // Her gönderimde, alıcının bildirimlerinin en üstüne yeni bir bildirim düşer.
      await base44.asServiceRole.entities.Notification.create({
        user_id: target.id,
        title: 'Coin gönderildi',
        type: 'gift_box_send',
        body: `${displayName} sana ${dollars.toFixed(2)} $ değerinde ${coins.toLocaleString('tr-TR')} coin gönderdi.`,
        link: '/profil',
        ref_id: user.id,
      }).catch(() => {});

      return Response.json({
        ok: true,
        dollars,
        coins,
        recipient_name: recipientName,
        recipient_coins: Math.max(0, Number(updated?.coins) || 0),
        balance: await giftBoxSummary(base44, account),
      });
    }

    // Doları bozdurma: kişi kendi kimlik numarasıyla bakiyesini coine çevirir (1 $ = 5.000 coin).
    if (action === 'convert') {
      const rl = await rateLimit(base44, 'gift-box-convert:' + user.id, user.id, 10, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla işlem yaptın, biraz bekleyin.' }, { status: 429 });

      const memberId = String(body?.member_id || '').trim();
      if (!memberId) return Response.json({ error: 'Kimlik numaranı girmeden bozduramazsın.' }, { status: 400 });
      const owner = await findByMemberId(base44, memberId);
      if (!owner || owner.id !== user.id) {
        return Response.json({ error: 'Kimlik numarası hesabınla eşleşmiyor.' }, { status: 400 });
      }

      const dollars = Math.round((Number(body?.dollars) || 0) * 100) / 100;
      if (dollars < MIN_CONVERT_DOLLARS) {
        return Response.json({ error: `En az ${MIN_CONVERT_DOLLARS} dolar bozdurulabilir.` }, { status: 400 });
      }

      const summary = await giftBoxSummary(base44, account);
      if (dollars > summary.available_dollars) {
        return Response.json({
          error: `Bozdurabileceğin bakiye yetersiz. Kullanılabilir: ${summary.available_dollars} $`,
          available_dollars: summary.available_dollars,
        }, { status: 400 });
      }

      const coins = Math.round(dollars * COINS_PER_DOLLAR);
      await base44.asServiceRole.entities.GiftTransfer.create({
        kind: 'convert',
        status: 'completed',
        sender_id: user.id,
        sender_name: displayName,
        dollars,
        coins,
        rate: summary.tl_rate,
      });

      const wallet = await ensureGiftWallet(base44, account);
      const updated = await base44.asServiceRole.entities.GameWallet.update(wallet.id, {
        coins: Math.max(0, Number(wallet.coins) || 0) + coins,
      });

      return Response.json({
        ok: true,
        dollars,
        coins,
        total_coins: Math.max(0, Number(updated?.coins) || 0),
        balance: await giftBoxSummary(base44, account),
      });
    }

    // Çekim talebi: kimlik numarası hesabı doğrulamadan ve tutar girilmeden talep oluşmaz.
    if (action === 'withdraw') {
      const rl = await rateLimit(base44, 'gift-box-withdraw:' + user.id, user.id, 5, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla talep, biraz bekleyin.' }, { status: 429 });

      const memberId = String(body?.member_id || '').trim();
      if (!memberId) return Response.json({ error: 'Kimlik numaranı girmeden bakiye çekemezsin.' }, { status: 400 });
      const owner = await findByMemberId(base44, memberId);
      if (!owner || owner.id !== user.id) {
        return Response.json({ error: 'Kimlik numarası hesabınla eşleşmiyor.' }, { status: 400 });
      }

      const requested = Math.round((Number(body?.dollars) || 0) * 100) / 100;
      if (requested <= 0) return Response.json({ error: 'Çekilecek tutarı gir.' }, { status: 400 });

      const summary = await giftBoxSummary(base44, account);
      if (requested > summary.available_dollars) {
        return Response.json({ error: 'Çekilebilir bakiyeden fazlasını çekemezsin.' }, { status: 400 });
      }

      const tlAmount = tlFromDollars(requested, summary.tl_rate);

      await base44.asServiceRole.entities.GiftTransfer.create({
        kind: 'withdraw',
        status: 'pending',
        sender_id: user.id,
        sender_name: displayName,
        recipient_id: '',
        recipient_name: '',
        dollars: requested,
        coins: 0,
        tl_amount: tlAmount,
        rate: summary.tl_rate,
      });

      // Talep, yönetici panelinde bekleyen kayıt olarak görünür; adminlere ayrıca uyarı gönderilmez.
      return Response.json({
        ok: true,
        dollars: requested,
        tl: tlAmount,
        balance: await giftBoxSummary(base44, account),
      });
    }

    return Response.json({ error: 'geçersiz işlem' }, { status: 400 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}