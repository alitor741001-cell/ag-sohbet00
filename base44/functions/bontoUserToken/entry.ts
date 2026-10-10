/**
 * bontoUserToken — Bonto için kısa ömürlü, imzalı KULLANICI kimliği tokenı üretir.
 *
 * AŞAMA 2 DURUMU: Yalnızca altyapı hazırlığıdır. Hiçbir canlı akışa bağlı değildir:
 * hiçbir sayfa bu fonksiyonu çağırmaz, token hiçbir yere gönderilmez ve
 * Bonto tarafında HENÜZ DOĞRULANMAZ (canlı /v1/ping Bearer başlığını 401 ile reddediyor).
 *
 * Kurallar:
 * • Yalnızca giriş yapmış kullanıcının kendi kimliği için üretilir (sub = kendi id).
 * • Rol istemciden alınmaz; Base44 kullanıcı kaydından okunur.
 * • İmzalama anahtarı yalnızca sunucu tarafındaki gizli ortam değişkeninden gelir;
 *   istemciye, günlüğe veya herkese açık bir değişkene yazılmaz.
 * • Servis anahtarı kullanıcı kimliği yerine geçmez; token türü 'user' olarak işaretlenir,
 *   böylece servis uçlarında kullanılamaz.
 * • Ayrı anahtar (USER_TOKEN_SECRET) tanımlanana kadar servis anahtarıyla imzalar.
 *   Canlı yazma açılmadan önce ayrı anahtara geçilmelidir.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const TOKEN_OMRU_SN = 600;
const ISSUER = 'base44-ag-sohbet';
const AUDIENCE = 'bonto-api';

const base64urlBytes = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const base64urlJson = (nesne) => base64urlBytes(new TextEncoder().encode(JSON.stringify(nesne)));

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Aşama 2: imzalama mevcut servis anahtarıyla yapılır. Ayrı USER_TOKEN_SECRET'e
    // geçiş, karar verildikten sonra canlı yazma açılmadan önce yapılacaktır.
    const anahtar = secrets.get('BONTO_API_SERVICE_KEY');
    if (!anahtar) {
      return Response.json({ error: 'İmzalama anahtarı tanımlı değil.' }, { status: 503 });
    }

    const simdi = Math.floor(Date.now() / 1000);
    const tokenId = crypto.randomUUID();
    const header = base64urlJson({ alg: 'HS256', typ: 'JWT' });
    const payload = base64urlJson({
      typ: 'user',
      sub: user.id,
      role: user.role === 'admin' ? 'admin' : 'user',
      iss: ISSUER,
      aud: AUDIENCE,
      iat: simdi,
      exp: simdi + TOKEN_OMRU_SN,
      jti: tokenId,
    });

    const imzaAnahtari = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(anahtar),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const imza = await crypto.subtle.sign(
      'HMAC',
      imzaAnahtari,
      new TextEncoder().encode(`${header}.${payload}`),
    );

    return Response.json({
      ok: true,
      token: `${header}.${payload}.${base64urlBytes(imza)}`,
      exp: simdi + TOKEN_OMRU_SN,
      claims: { typ: 'user', sub: user.id, role: user.role === 'admin' ? 'admin' : 'user', aud: AUDIENCE, jti: tokenId },
      anahtarTuru: 'servis-anahtari',
      bontoDogrulama: 'bekleniyor',
      not: 'Bonto tarafında kullanıcı tokenı doğrulaması devreye girene kadar bu token kullanılmaz.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}