# BONTO DAĞITIM PAKETİ — AŞAMA 3

Bu paket **hazırdır, dağıtılmamıştır**. Bonto sunucusuna erişim ve dağıtım yetkisi
bu çalışmada yok; dosyaların Bonto'ya kurulması ve `USER_TOKEN_SECRET` değerinin
Bonto ortam değişkenlerine eklenmesi **sizin tarafınızda** yapılacaktır.

## 1. Paket içeriği

| Dosya | Amaç | Değiştirir mi? |
| --- | --- | --- |
| `api-kullanici-token.js` | Kullanıcı tokenı doğrulama (HS256, `typ=user`, `jti`, anahtar ayrımı) | Yeni dosya |
| `api-yetki.js` | Rol politikaları, sahiplik, tutar doğrulaması, denetim kaydı | Yeni dosya |
| `api-idempotency.js` | `(principal, işlem, request_id)` tek işlem garantisi + SQL ifadeleri | Yeni dosya |
| `sema-v1.sql` | Tablo/indeks/şema sürümü tasarımı | **Çalıştırılmaz** (bkz. §6) |
| `BONTO-DAGITIM.md` | Bu belge | – |
| `index.js`, `api-uclar.js`, `api-guvenlik.js`, `api-ayar.js`, `api-test-sayfasi.js` | Aşama 1 dosyaları | **DEĞİŞTİRİLMEZ** |

## 2. Bağımlılıklar

- **Node.js 18 veya üzeri** (Web Crypto/HMAC ve `node:crypto` için).
- **Harici npm paketi yoktur.** Yalnızca Node'un kendi modülleri kullanılır (`node:crypto`).
- Veritabanı sürücüsü yalnızca idempotency/denetim yazmaları açıldığında gerekir (henüz değil).

## 3. Ortam değişkenleri

| Değişken | Durum | Not |
| --- | --- | --- |
| `USER_TOKEN_SECRET` | **YENİ — zorunlu** | Base44 gizli değişkenlerine eklendi. Aynı değer Bonto ortamına da eklenmeli. En az 32 karakter. |
| `API_SERVICE_KEY` | Mevcut | Servis uçları için; kullanıcı tokenı ile **karıştırılmaz**. |
| `STATIC_TEST_KEY` | Mevcut | Yalnızca `/v1/test/*`. |
| `TOKEN_ISSUER` / `TOKEN_AUDIENCE` | Mevcut | Base44 üreticisi `base44-ag-sohbet` / `bonto-api` değerlerini kullanır; Bonto tarafında **birebir aynı** olmalı. |

Ayrılık kuralı (zorunlu): `USER_TOKEN_SECRET` ≠ `API_SERVICE_KEY`. İki değer aynı olursa
`api-kullanici-token.js` doğrulamayı kapalı tutar (`sebep: anahtar_ayrisimi_yok`) ve
kullanıcı tokenı üretilmez. Anahtar değeri kodda, günlükte veya yanıtta bulunmaz.

## 4. Entegrasyon adımları (mevcut dosyalara dokunmadan)

1. Dört dosyayı Bonto'daki API klasörüne kopyalayın.
2. Doğrulama için ayar nesnesini **mevcut `settings` ile birleştirin** (dosya değiştirmeden):

```js
const { settings } = require('./api-ayar');
const { bearerTokeni, kullaniciTokeniDogrula } = require('./api-kullanici-token');

const kullaniciAyari = { ...settings, userTokenSecret: process.env.USER_TOKEN_SECRET };
```

3. Kullanıcı uçlarında kimliği **yalnızca** şu yolla alın:

```js
const belirtec = bearerTokeni(req.headers.authorization);
const sonuc = kullaniciTokeniDogrula(belirtec, { ayar: kullaniciAyari });
if (!sonuc.ok) return sendError(req, res, 401, 'KIMLIK_YOK', 'Kimlik doğrulanamadı.');
// req.apiPrincipal = sonuc.principal  → { kind: 'user', userId, role, tokenId }
```

4. **`api-guvenlik.js` içindeki `authenticate` fonksiyonuna DOKUNMAYIN.** Oradaki Bearer
   yolu **servis** tokenını kabul eder ve principal'ı `kind: 'service'` yapar. Kullanıcı
   tokenı için ayrı fonksiyon çağrılır; böylece kullanıcı tokenı servis principal'ı olamaz.
5. Yazma uçlarında yetki ve idempotency'yi bağlayın:

```js
const karar = yetkiKontrol({ principal: req.apiPrincipal, policy: 'hediye.gonder', kaynak, ozellikAcik });
const anahtar = anahtarUret({ principal: req.apiPrincipal, islem: 'hediye.gonder', requestId, istekGovdesi: govde });
```

6. Canlı yazma uçları **kapalı** kalır: `yetkiKontrol` özellik anahtarı kapalıyken `503` döner.
7. **Kritik sıra (atlanırsa güvenlik delinir):** önce kullanıcı tokenı doğrulaması (§4.2–4.3)
   kurulur ve test edilir; **ancak ondan sonra** `/v1` canlı uçları açılır. Doğrulama
   devrede değilken canlı bağlantı açılmaz.

## 5. Doğrulama ve test adımları (canlı veriye dokunmadan)

| # | Adım | Beklenen |
| --- | --- | --- |
| 1 | Her dosya için `node --check` | Hatasız |
| 2 | `api-idempotency` birim testi: aynı `request_id` iki kez | İşlem **1 kez** çalışır, ikinci yanıt `tekrar: true` |
| 3 | `api-yetki`: kullanıcı tokenı servis ucunda | `403 YETKI_TURU` |
| 4 | `api-yetki`: admin olmayan kullanıcı admin ucunda | `403 YETKI_YOK` |
| 5 | `api-kullanici-token`: `typ=service` tokenı kullanıcı uçunda | `ok: false, sebep: token_turu` |
| 6 | `api-kullanici-token`: `exp` geçmiş token | `ok: false, sebep: suresi_dolmus` |
| 7 | `api-kullanici-token`: imzası bozuk token | `ok: false, sebep: imza` |
| 8 | `api-kullanici-token`: `USER_TOKEN_SECRET = API_SERVICE_KEY` | `ok: false, sebep: anahtar_ayrisimi_yok` |
| 9 | Bonto'da `GET /health` ve `GET /v1/ping` (X-API-Key) | **200** — Aşama 1 bozulmadı |
| 10 | Bonto'da `GET /v1/test/odalar` | `ornek: true`, `canliVeri: false` |
| 11 | Bonto'da `Authorization: Bearer <kullanıcı tokenı>` | Doğrulama kurulmadan **401** (beklenen: henüz açık değil) |

Adım 9–10 mevcut canlı davranışı doğrular; 11 ise canlı bağlantının **henüz açılmadığını**
teyit eder. Testler örnek veriyle yapılır; gerçek kullanıcı verisi kullanılmaz.

## 6. Veritabanı: doğrulanmadan uygulanmaz

`sema-v1.sql` **çalıştırılmaz**. Önce şu bilgiler doğrulanmalıdır:

1. Veritabanı türü ve sürümü (dosya PostgreSQL 13+ varsayar; varsayım doğrulanmadı).
2. `gen_random_uuid()` desteği (PostgreSQL 13+ / pgcrypto).
3. Migration aracı veya sürüm yönetimi alışkanlığı (varsa mevcut tablo adlarıyla çakışma kontrolü).
4. Yedekleme ve geri dönüş yöntemi.
5. `bigint`/`numeric` davranışı ve saat dilimi ayarı (`timestamptz` varsayımı).

Bu bilgiler gelmeden SQL çalıştırılmaz, veritabanı varsayımı yapılmaz.

## 7. Geri dönüş

- Kopyalanan dört dosya silinir; `index.js` ve Aşama 1 dosyaları değişmediği için
  API davranışı ilk günden farklı olmaz.
- Özellik anahtarları kapalı tutulur; canlı yazma ve trafik yönlendirme açılmaz.
- Base44 tarafında `bontoUserToken` hiçbir canlı akışa bağlı olmadığı için kaldırılması
  bile mevcut işleyişi etkilemez.

## 8. Yasaklar (bu aşamada)

- Base44 tablolarını/fonksiyonlarını/görevlerini değiştirmek (yapılmadı).
- Canlı kullanıcı verisini Bonto'ya kopyalamak (yapılmadı).
- Trafiği Bonto'ya yönlendirmek veya canlı yazmayı açmak (yapılmadı).
- `index.js` içindeki yönlendirmeyi değiştirmek (yapılmadı).
- `sema-v1.sql` çalıştırmak (yapılmadı).
- LiveKit ve ses akışına dokunmak (yapılmadı).