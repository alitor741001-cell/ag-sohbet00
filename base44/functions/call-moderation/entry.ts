import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';
import { rateLimit, logSecurity, sanitizeText } from '../../shared/security.ts';
import { upsertNotification } from '../../shared/upsertNotification.ts';
import { notifyAdmins } from '../../shared/adminNotify.ts';
import { purgeAccount } from '../../shared/accountPurge.ts';

const MAX_STRIKES = 3;

// Görüntülü aramadan alınan kare, yapay zekâ ile çıplaklık/cinsel içerik açısından denetlenir.
const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    explicit: { type: 'boolean' },
    parts: { type: 'array', items: { type: 'string' } },
  },
  required: ['explicit', 'parts'],
};

const PROMPT = `Bu görüntü, canlı görüntülü görüşmeden alınmış tek bir karedir. Görevin: karede cinsel içerik/çıplaklık olup olmadığını tespit etmek.
explicit=true olması gereken durumlar: açıkça görünen cinsel organ (penis, vajina), anüs veya çıplak kalça, çıplak meme/göğüs ucu, tam çıplaklık, cinsel eylem.
explicit=false olması gereken durumlar: yüz, giysili insanlar, mayo/bikini/atlet gibi giysiler, üstsüz erkek göğsü (cinsel bağlam yoksa), oda/nesne/ekran görüntüsü, bulanık, karanlık veya belirsiz görüntü.
Kararsız kaldığın her durumda false döndür. parts alanına gördüğün uygunsuz bölgeleri kısa Türkçe kelimelerle yaz (ör. "göğüs", "cinsel organ", "kalça"), yoksa boş liste bırak.`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const callId = sanitizeText(body.call_id, 80);
    const frameUri = sanitizeText(body.frame_uri, 500);
    if (!callId || !frameUri) return Response.json({ error: 'Eksik bilgi.' }, { status: 400 });
    // Kare yalnızca uygulamanın özel depolamasından gelebilir; dış adresler kabul edilmez.
    if (/^https?:/i.test(frameUri)) return Response.json({ error: 'Geçersiz görüntü.' }, { status: 400 });

    const rl = await rateLimit(base44, 'call-moderation:' + user.id, user.id, 40, 60000);
    if (!rl.allowed) return Response.json({ error: 'Çok fazla denetim isteği.' }, { status: 429 });

    const call = await base44.asServiceRole.entities.DirectCall.get(callId).catch(() => null);
    if (!call) return Response.json({ error: 'Arama bulunamadı.' }, { status: 404 });
    if (call.caller_id !== user.id && call.callee_id !== user.id) return Response.json({ error: 'Yetkisiz.' }, { status: 403 });

    const strikes = Number(user.nsfw_strikes) || 0;
    // Yalnızca sürmekte olan görüşmede denetim yapılır.
    if (call.status !== 'accepted') return Response.json({ ok: true, flagged: false, strikes });

    // Özel kareyi modele göstermek için kısa ömürlü imzalı bağlantı üretilir.
    const signed = await base44.asServiceRole.integrations.Core
      .CreateFileSignedUrl({ file_uri: frameUri, expires_in: 300 }).catch(() => null);
    const signedUrl = signed?.signed_url || '';
    if (!signedUrl) return Response.json({ error: 'Görüntü okunamadı.' }, { status: 400 });

    // Varsayılan model seçilir: hem metin hem yüklenen görsel desteği vardır.
    const verdict = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: PROMPT,
      file_urls: [signedUrl],
      response_json_schema: VERDICT_SCHEMA,
    });

    if (!verdict?.explicit) return Response.json({ ok: true, flagged: false, strikes });

    const nextStrikes = strikes + 1;
    const now = new Date().toISOString();
    const parts = Array.isArray(verdict.parts)
      ? verdict.parts.map((part) => sanitizeText(part, 40)).filter(Boolean).slice(0, 5)
      : [];
    const deleting = nextStrikes >= MAX_STRIKES;
    const message = deleting
      ? 'Uygunsuz görüntü paylaşımı 3. kez tespit edildi. Hesabınız kalıcı olarak silindi.'
      : `Görüntülü aramada uygunsuz görüntü paylaştığınız tespit edildi ve arama kapatıldı. Uyarı: ${nextStrikes}/${MAX_STRIKES}. ${MAX_STRIKES}. ihlalde hesabınız kalıcı olarak silinir.`;

    // Arama derhal kapatılır: iki tarafın istemcisi de kaydı canlı izlediği için görüşme anında biter.
    await base44.asServiceRole.entities.DirectCall.update(callId, {
      status: 'ended',
      ended_at: now,
      ended_by: 'moderation',
    }).catch(() => {});

    if (!deleting) {
      await base44.asServiceRole.entities.User.update(user.id, {
        nsfw_strikes: nextStrikes,
        nsfw_last_at: now,
      }).catch(() => {});
      // Hesaba anında uyarı düşer.
      await upsertNotification(base44, {
        user_id: user.id,
        title: 'Uyarı: uygunsuz görüntü paylaşımı',
        body: message,
        type: 'nsfw_violation',
        link: '/bildirimler',
      });
    }

    await logSecurity(
      base44,
      'nsfw_call_violation',
      user,
      `${nextStrikes}/${MAX_STRIKES} • ${parts.join(', ') || 'tespit'} • arama ${callId}`,
      'critical',
    );

    if (!deleting) {
      // Yöneticiler olaydan haberdar edilir.
      await notifyAdmins(base44, {
        event: 'nsfw_violation',
        title: 'Canlı görüntülü aramada uygunsuz görüntü',
        body: `${user.username || user.full_name || user.email} • ${nextStrikes}/${MAX_STRIKES} uyarı`,
        link: '/admin/guvenlik',
        telegram_data: { user: user.username || user.full_name || user.email, strikes: `${nextStrikes}/${MAX_STRIKES}`, parts: parts.join(', ') },
      }).catch(() => {});
    }

    if (deleting) {
      await purgeAccount(base44, {
        userId: user.id,
        email: user.email,
        name: user.username || user.full_name || user.email,
        subject: 'Hesabınız Kapatıldı - FILMKEYFİ',
      });
    }

    return Response.json({ ok: true, flagged: true, strikes: nextStrikes, deleted: deleting, parts, message });
  } catch (error) {
    console.error('[call-moderation error]', error?.message || String(error));
    return Response.json({ error: 'Denetim yapılamadı.' }, { status: 500 });
  }
}