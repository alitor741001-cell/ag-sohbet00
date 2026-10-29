import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Maskelenmiş e-posta: kullanıcı adıyla giriş yapan kişi hangi adrese kayıtlı olduğunu görür,
// adresin kendisi anonim çağrılara verilmez.
function maskEmail(email) {
  const [local, domain] = String(email || '').split('@');
  if (!local || !domain) return '';
  const dot = domain.lastIndexOf('.');
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : '';
  return `${local[0]}***@${host[0]}***${tld}`;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || '').trim().slice(0, 60);
    if (!username) return Response.json({ error: 'Kullanıcı adı gerekli' }, { status: 400 });
    // E-posta adresi zaten verilmişse arama yapılmaz.
    if (username.includes('@')) return Response.json({ error: 'Kullanıcı adı gerekli' }, { status: 400 });

    // Toplu adres hasadını engelle: IP ve kullanıcı adı bazlı sıkı sınır.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const ipLimit = await rateLimitOnce(base44, 'lookup-username:ip:' + ip, 10, 600000);
    if (!ipLimit) return Response.json({ error: 'çok fazla deneme, sonra tekrar deneyin' }, { status: 429 });
    const nameLimit = await rateLimitOnce(base44, 'lookup-username:name:' + username.toLowerCase(), 5, 3600000);
    if (!nameLimit) return Response.json({ error: 'çok fazla deneme, sonra tekrar deneyin' }, { status: 429 });

    // Önce tam eşleşme; bulunamazsa büyük-küçük harf duyarsız eşleşme.
    const matches = await base44.asServiceRole.entities.User.filter({ username }, 'created_date', 5);
    let target = matches.find((u) => u.id);
    if (!target) {
      const allUsers = await base44.asServiceRole.entities.User.list(500);
      target = allUsers.find((u) => (u.username || '').toLowerCase() === username.toLowerCase());
    }

    if (!target) return Response.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });

    return Response.json({ found: true, masked: maskEmail(target.email) });
  } catch (error) {
    return Response.json({ error: error.message || 'İşlem başarısız' }, { status: 500 });
  }
}

// Basit sayaç: pencere dolunca sıfırlanır, sınır aşılırsa false döner.
async function rateLimitOnce(base44, key, max, windowMs) {
  try {
    const found = await base44.asServiceRole.entities.RateLimit.filter({ key }, '-created_date', 1);
    const rec = found[0];
    const now = Date.now();
    const start = rec?.window_start ? new Date(rec.window_start).getTime() : 0;
    if (!rec) {
      await base44.asServiceRole.entities.RateLimit.create({ key, user_id: '', count: 1, window_start: new Date().toISOString() });
      return true;
    }
    if (now - start > windowMs) {
      await base44.asServiceRole.entities.RateLimit.update(rec.id, { count: 1, window_start: new Date().toISOString() });
      return true;
    }
    if ((rec.count || 0) >= max) return false;
    await base44.asServiceRole.entities.RateLimit.update(rec.id, { count: (rec.count || 0) + 1 });
    return true;
  } catch {
    return true;
  }
}