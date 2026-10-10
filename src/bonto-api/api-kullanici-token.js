/* global process, module, require, Buffer */
'use strict';
/**
 * api-kullanici-token.js — kullanıcı kimliği tokenı (Base44 üretir, Bonto doğrular).
 *
 * Neden ayrı dosya: servis anahtarı Bonto'ya tam erişim verir. Kullanıcı istekleri
 * bu anahtarla taşınırsa "hangi kullanıcı" bilgisi kaybolur ve yetki kontrolü
 * yapılamaz. Bu yüzden her kullanıcı için kısa ömürlü, yalnızca o kullanıcı adına
 * geçerli, imzalı bir token kullanılır.
 *
 * Değişmezler:
 *   • alg yalnızca HS256; 'none' ve diğer algoritmalar reddedilir.
 *   • Token türü ZORUNLU: kullanıcı tokenı 'user', servis tokenı 'service'.
 *     Tür uyuşmazlığı reddedilir (kullanıcı tokenı servis yetkisi kazanamaz).
 *   • İmza anahtarı: ayar.userTokenSecret → yoksa ayar.serviceKey'e düşer.
 *     Canlı yazma açılmadan önce AYRI anahtara geçilmelidir (ASAMA-2-MIMARI.md §2.3).
 *   • İstemciden gelen rol/bakiye claim'i iş mantığında kullanılmaz; rol yalnızca
 *     Base44 kaydından okunup imzalanır.
 */

const crypto = require('node:crypto');

const KIMLIK_DESENI = /^[\w-]{8,64}$/;
const MAX_TOKEN_UZUNLUK = 4096;
const SAAT_KAYMASI_SN = 60;
const VARSAYILAN_OMUR_SN = 600;
const EN_UZUN_OMUR_SN = 3600;

const base64urlCoz = (deger) => Buffer.from(deger, 'base64url');

const tokenAnahtari = (ayar) =>
  (ayar && ayar.userTokenSecret) || (ayar && ayar.serviceKey) || '';

/** Ayrı kullanıcı tokenı anahtarı tanımlı mı (raporlama için). */
const ayriAnahtarTanimli = (ayar) => Boolean(ayar && ayar.userTokenSecret);

/**
 * Kullanıcı tokenı üretir. Yalnızca Base44 arka ucu çağırır.
 * @returns {{ token: string, exp: number, jti: string }}
 */
function kullaniciTokeniUret({ userId, role = 'user', ttlSeconds = VARSAYILAN_OMUR_SN, ayar, jti }) {
  const anahtar = tokenAnahtari(ayar);
  if (!anahtar) throw new Error('kullanıcı tokenı imzalama anahtarı tanımlı değil');
  if (!KIMLIK_DESENI.test(String(userId || ''))) throw new Error('geçersiz kullanıcı kimliği');
  if (!ayar || !ayar.tokenIssuer || !ayar.tokenAudience) throw new Error('iss/aud ayarı eksik');

  const simdi = Math.floor(Date.now() / 1000);
  const omur = Math.min(EN_UZUN_OMUR_SN, Math.max(60, Math.trunc(ttlSeconds) || VARSAYILAN_OMUR_SN));
  const tokenId = jti || crypto.randomUUID();

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      typ: 'user',
      sub: String(userId),
      role: typeof role === 'string' && role ? role : 'user',
      iss: ayar.tokenIssuer,
      aud: ayar.tokenAudience,
      iat: simdi,
      exp: simdi + omur,
      jti: tokenId,
    })
  ).toString('base64url');

  const imza = crypto
    .createHmac('sha256', anahtar)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return { token: `${header}.${payload}.${imza}`, exp: simdi + omur, jti: tokenId };
}

/**
 * Kullanıcı tokenını doğrular. Servis tokenı buradan GEÇMEZ.
 * @param {{ ayar: object, iptalListesi?: (payload: object) => boolean }} secenekler
 */
function kullaniciTokeniDogrula(token, secenekler = {}) {
  const { ayar, iptalListesi } = secenekler;
  const anahtar = tokenAnahtari(ayar);
  if (!anahtar) return { ok: false, sebep: 'anahtar_yok' };
  if (typeof token !== 'string' || token.length < 20 || token.length > MAX_TOKEN_UZUNLUK) {
    return { ok: false, sebep: 'uzunluk' };
  }

  const parcalar = token.split('.');
  if (parcalar.length !== 3) return { ok: false, sebep: 'bicim' };

  let header;
  let payload;
  try {
    header = JSON.parse(base64urlCoz(parcalar[0]).toString('utf8'));
    payload = JSON.parse(base64urlCoz(parcalar[1]).toString('utf8'));
  } catch {
    return { ok: false, sebep: 'cozumlenemedi' };
  }

  if (!header || header.alg !== 'HS256') return { ok: false, sebep: 'algoritma' };

  const beklenen = crypto
    .createHmac('sha256', anahtar)
    .update(`${parcalar[0]}.${parcalar[1]}`)
    .digest();
  const verilen = base64urlCoz(parcalar[2]);
  if (beklenen.length !== verilen.length || !crypto.timingSafeEqual(beklenen, verilen)) {
    return { ok: false, sebep: 'imza' };
  }

  if (!payload || typeof payload !== 'object') return { ok: false, sebep: 'cozumlenemedi' };
  if (payload.typ !== 'user') return { ok: false, sebep: 'token_turu' };
  if (!KIMLIK_DESENI.test(String(payload.sub || ''))) return { ok: false, sebep: 'kimlik' };

  const simdi = Math.floor(Date.now() / 1000);
  if (typeof payload.iat !== 'number' || payload.iat > simdi + SAAT_KAYMASI_SN) {
    return { ok: false, sebep: 'iat' };
  }
  if (typeof payload.exp !== 'number' || payload.exp <= simdi - SAAT_KAYMASI_SN) {
    return { ok: false, sebep: 'suresi_dolmus' };
  }
  if (payload.exp - payload.iat > EN_UZUN_OMUR_SN + SAAT_KAYMASI_SN) {
    return { ok: false, sebep: 'omur_cok_uzun' };
  }
  if (payload.aud !== ayar.tokenAudience) return { ok: false, sebep: 'hedef_kitle' };
  if (payload.iss !== ayar.tokenIssuer) return { ok: false, sebep: 'veren' };
  if (typeof iptalListesi === 'function' && iptalListesi(payload)) {
    return { ok: false, sebep: 'iptal' };
  }

  return {
    ok: true,
    principal: {
      kind: 'user',
      userId: String(payload.sub),
      role: typeof payload.role === 'string' && payload.role ? payload.role : 'user',
      tokenId: payload.jti || null,
      expiresAt: payload.exp,
    },
  };
}

/** Authorization başlığından Bearer değerini çıkarır. */
function bearerTokeni(headerDegeri) {
  const eslesme = /^Bearer\s+(.+)$/i.exec(String(headerDegeri || ''));
  return eslesme ? eslesme[1].trim() : null;
}

module.exports = {
  ayriAnahtarTanimli,
  bearerTokeni,
  kullaniciTokeniDogrula,
  kullaniciTokeniUret,
  EN_UZUN_OMUR_SN,
  VARSAYILAN_OMUR_SN,
};