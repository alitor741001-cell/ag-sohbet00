/* global process, module, require, Buffer */
'use strict';
/**
 * test-token-ayrim.js — ÇEVRİMDIŞI güvenlik testi.
 *
 * • Ağa çıkmaz, canlı sunucuya istek atmaz, veritabanı kullanmaz.
 * • Yalnızca yerel olarak üretilen örnek tokenlarla çalışır; gerçek kullanıcı verisi yoktur.
 * • Çalıştırma:  node test-token-ayrim.js
 *   Hepsi geçerse çıkış kodu 0, kalan olursa 1 döner (dağıtım öncesi kapı olarak kullanılabilir).
 */

const crypto = require('node:crypto');

// Test anahtarları: gerçek gizli değerler DEĞİLDİR, yalnızca bu dosyada geçerlidir.
const ANAHTAR = 'test-kullanici-tokeni-anahtari-0123456789';
const SERVIS_ANAHTARI = 'test-servis-anahtari-9876543210abcdef';
const STATIK_ANAHTAR = 'test-statik-anahtar-0123456789abcdef';

// Kimlik modülleri bu değerleri açılışta ortam değişkeninden okur; bu yüzden
// require'dan ÖNCE yazılır. Yalnızca bu test süreci içinde geçerlidir.
process.env.API_SERVICE_KEY = SERVIS_ANAHTARI;
process.env.USER_TOKEN_SECRET = ANAHTAR;
process.env.STATIC_TEST_KEY = STATIK_ANAHTAR;
process.env.AUTH_MODE = 'both';

const token = require('./api-kullanici-token');
const yetki = require('./api-yetki');
const guvenlik = require('./api-guvenlik');

/** Sahte istek nesnesi: yalnızca başlık taşır. */
const istek = (basliklar) => ({ headers: basliklar });

const AYAR = {
  userTokenSecret: ANAHTAR,
  serviceKey: SERVIS_ANAHTARI,
  tokenIssuer: 'base44-app',
  tokenAudience: 'ag-backend-api',
};

const b64 = (nesne) => Buffer.from(JSON.stringify(nesne)).toString('base64url');
const imzala = (h, p, anahtar) =>
  crypto.createHmac('sha256', anahtar).update(`${h}.${p}`).digest('base64url');
const BASLIK = b64({ alg: 'HS256', typ: 'JWT' });

// Varsayılan imza anahtarı kullanıcı tokenı anahtarıdır; servis anahtarıyla imzalamak
// isteyen test, anahtarı açıkça verir.
const yap = (payload, anahtar = ANAHTAR) => {
  const p = b64(payload);
  return `${BASLIK}.${p}.${imzala(BASLIK, p, anahtar)}`;
};

const sebep = (belirtec, secenek) => token.kullaniciTokeniDogrula(belirtec, secenek).sebep;
const payloadCoz = (belirtec) => JSON.parse(Buffer.from(belirtec.split('.')[1], 'base64url').toString('utf8'));

function testleriCalistir() {
  const simdi = Math.floor(Date.now() / 1000);
  const temel = {
    typ: 'user',
    sub: 'ornek-kullanici',
    role: 'user',
    iss: AYAR.tokenIssuer,
    aud: AYAR.tokenAudience,
    iat: simdi,
    exp: simdi + 600,
    jti: 'j-ornek',
  };

  const uretilen = token.kullaniciTokeniUret({ userId: 'ornek-kullanici', role: 'user', ayar: AYAR });
  const gecerli = token.kullaniciTokeniDogrula(uretilen.token, { ayar: AYAR });

  const sonuclar = [
    ['geçerli kullanıcı tokenı kabul edilmeli', gecerli.ok === true],
    ['kabul edilen principal kind=user olmalı', gecerli.principal && gecerli.principal.kind === 'user'],
    ['kullanıcı kimliği token konusuna yazılmalı', gecerli.principal && gecerli.principal.userId === 'ornek-kullanici'],
    ['token türü typ=user olarak işaretlenmeli', payloadCoz(uretilen.token).typ === 'user'],
    ['jti token içinde taşınmalı', gecerli.principal && gecerli.principal.tokenId === uretilen.jti],
    ['typ=service tokenı kıllanıcı uçunda reddedilmeli', sebep(yap({ ...temel, typ: 'service' }), { ayar: AYAR }) === 'token_turu'],
    ['servis anahtarıyla imzalı token reddedilmeli', sebep(yap(temel, SERVIS_ANAHTARI), { ayar: AYAR }) === 'imza'],
    ['süresi dolmuş token reddedilmeli', sebep(yap({ ...temel, iat: simdi - 2000, exp: simdi - 1000 }), { ayar: AYAR }) === 'suresi_dolmus'],
    ['gelecekten gelen iat reddedilmeli', sebep(yap({ ...temel, iat: simdi + 600, exp: simdi + 1200 }), { ayar: AYAR }) === 'iat'],
    ['çok uzun ömürlü token reddedilmeli', sebep(yap({ ...temel, exp: simdi + 7200 }), { ayar: AYAR }) === 'omur_cok_uzun'],
    ['yanlış hedef kitle reddedilmeli', sebep(yap({ ...temel, aud: 'baska-servis' }), { ayar: AYAR }) === 'hedef_kitle'],
    ['yanlış veren reddedilmeli', sebep(yap({ ...temel, iss: 'baska-veren' }), { ayar: AYAR }) === 'veren'],
    ['alg=none reddedilmeli', sebep(`${b64({ alg: 'none', typ: 'JWT' })}.${b64(temel)}.`, { ayar: AYAR }) === 'algoritma'],
    ['bozulmuş imza reddedilmeli', sebep(uretilen.token.slice(0, -3) + 'aaa', { ayar: AYAR }) === 'imza'],
    ['anahtar yoksa doğrulama kapalı olmalı', sebep(uretilen.token, { ayar: { ...AYAR, userTokenSecret: null } }) === 'anahtar_ayrisimi_yok'],
    ['iki anahtar aynıysa doğrulama kapalı olmalı', sebep(uretilen.token, { ayar: { ...AYAR, serviceKey: ANAHTAR } }) === 'anahtar_ayrisimi_yok'],
    ['iptal listesindeki token reddedilmeli', sebep(uretilen.token, { ayar: AYAR, iptalListesi: () => true }) === 'iptal'],
    ['kullanıcı tokenı servis ucunda reddedilmeli', yetki.yetkiKontrol({ principal: gecerli.principal, policy: 'servis.ayna' }).kod === 'YETKI_TURU'],
    ['kullanıcı tokenı yönetici ucunda reddedilmeli', yetki.yetkiKontrol({ principal: gecerli.principal, policy: 'admin.kullanici.rol' }).kod === 'YETKI_YOK'],
    ['tanımsız politika kapalı devre olmalı', yetki.yetkiKontrol({ principal: gecerli.principal, policy: 'yok.boyle.bir.uc' }).ok === false],
    ['kilitli modül özellik kapalıyken 503 vermeli', yetki.yetkiKontrol({ principal: gecerli.principal, policy: 'hediye.gonder', ozellikAcik: false }).kod === 'SERVIS_HATASI'],
    ['Bearer kullanıcı tokenı user kimliği vermeli', guvenlik.authenticate(istek({ authorization: `Bearer ${uretilen.token}` })).principal.kind === 'user'],
    ['Bearer kullanıcı kimliği token konusuyla aynı olmalı', guvenlik.authenticate(istek({ authorization: `Bearer ${uretilen.token}` })).principal.userId === 'ornek-kullanici'],
    ['Bearer servis tokenı service kimliği vermeli', guvenlik.authenticate(istek({ authorization: `Bearer ${guvenlik.signServiceToken({ userId: 'ornek-servis' })}` })).principal.kind === 'service'],
    ['servis anahtarıyla imzalı token kimlik vermemeli', guvenlik.authenticate(istek({ authorization: `Bearer ${yap(temel, SERVIS_ANAHTARI)}` })).ok === false],
    ['statik test anahtarı test kimliği vermeli', guvenlik.authenticate(istek({ 'x-api-key': STATIK_ANAHTAR })).principal.kind === 'static-test-key'],
    ['yanlış statik anahtar reddedilmeli', guvenlik.authenticate(istek({ 'x-api-key': 'yanlis-anahtar-0123456789abcdefghij' })).ok === false],
    ['başlıksız istek reddedilmeli', guvenlik.authenticate(istek({})).ok === false],
    ['/v1/ben politikası kullanıcı kimliğini kabul etmeli', yetki.yetkiKontrol({ principal: gecerli.principal, policy: 'kullanici.ben.oku' }).ok === true],
    ['/v1/ben politikası test kimliğini reddetmeli', yetki.yetkiKontrol({ principal: { kind: 'static-test-key', userId: null, role: 'test' }, policy: 'kullanici.ben.oku' }).kod === 'YETKI_TURU'],
    ['admin rolü yönetici ucuna girebilmeli', yetki.yetkiKontrol({ principal: { kind: 'user', userId: 'y1', role: 'admin' }, policy: 'admin.kullanici.rol' }).ok === true],
  ];

  const kalan = sonuclar.filter(([, gecti]) => !gecti);
  return {
    toplam: sonuclar.length,
    gecen: sonuclar.length - kalan.length,
    kalan: kalan.map(([ad]) => ad),
    sonuclar,
  };
}

if (require.main === module) {
  const sonuc = testleriCalistir();
  for (const [ad, gecti] of sonuc.sonuclar) {
    process.stdout.write(`${gecti ? 'GECTI' : 'KALDI'} — ${ad}\n`);
  }
  process.stdout.write(`\nSOZLESME: ${sonuc.gecen}/${sonuc.toplam} test geçti\n`);
  process.exit(sonuc.kalan.length ? 1 : 0);
}

module.exports = { testleriCalistir };