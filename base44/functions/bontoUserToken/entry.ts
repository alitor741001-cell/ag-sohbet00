/**
 * bontoUserToken — Bonto için kısa ömürlü, imzalı KULLANICI kimliği tokenı üretir.
 *
 * AŞAMA 3 DURUMU: Yalnızca altyapı hazırlığıdır. Hiçbir canlı akışa bağlı DEĞİLDİR:
 * hiçbir sayfa bu fonksiyonu çağırmaz, üretilen token hiçbir isteğe eklenmez ve
 * Bonto tarafında HENÜZ DOĞRULANMAZ (canlı /v1/ping Bearer başlığını 401 ile reddediyor).
 * Doğrulama Bonto'ya kurulup test edilene kadar canlı bağlantı açılmaz.
 *
 * Kurallar:
 * • Yalnızca giriş yapmış kullanıcının kendi kimliği için üretilir (sub = kendi id).
 * • Rol istemciden alınmaz; Base44 kullanıcı kaydından okunur.
 * • İmzalama anahtarı yalnızca sunucu tarafındaki gizli ortam değişkeninden gelir;
 *   istemciye, günlüğe veya herkese açık bir değişkene yazılmaz.
 * • Servis anahtarı kullanıcı kimliği yerine geçmez; token türü 'user' olarak işaretlenir,
 *   böylece servis uçlarında kullanılamaz.
 * • İmzalama YALNIZCA ayrı kullanıcı tokenı anahtarıyla (USER_TOKEN_SECRET) yapılır.
 *   Servis anahtarı kullanıcı kimliği için asla kullanılmaz: anahtarlar farklı olduğu
 *   için üretilen token servis doğrulamasından da geçemez, servis yetkisi kazanamaz.
 * • Anahtar tanımlı değilse veya çok kısaysa üretim güvenli biçimde durur (503) ve
 *   açık hata döner. Anahtarın kendisi hiçbir koşulda yanıta, günlüğe veya istemciye yazılmaz.
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

    const anahtar = secrets.get('USER_TOKEN_SECRET');
    if (!anahtar || anahtar.length < 32) {
      // Üretim durdurulur. Anahtarın kendisi ve değeri hiçbir yere yazılmaz.
      return Response.json(
        {
          ok: false,
          kod: 'ANAHTAR_TANIMSIZ',
          mesaj: 'Kullanıcı tokenı imzalama anahtarı tanımlı değil veya çok kısa; token üretimi durduruldu.',
        },
        { status: 503 },
      );
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
      imzaAnahtari: 'kullanici-tokeni-anahtari',
      bontoDogrulama: 'hazir-degil',
      not: 'Bonto tarafında kullanıcı tokenı doğrulaması (typ=user) kurulup test edilene kadar bu token hiçbir isteğe eklenmez.',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}