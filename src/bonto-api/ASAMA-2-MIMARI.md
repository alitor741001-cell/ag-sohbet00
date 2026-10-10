# AŞAMA 2 — BONTO GÜVENLİ ALTYAPI TASARIMI

Amaç: Base44 canlı sistemine dokunmadan, Bonto tarafında bütün modülleri ileride
taşıyabilecek güvenli altyapıyı tasarlamak; doğrulama, yetki ve idempotency
parçalarını **kod olarak** hazırlamak.

Bu aşamada **yapılmayanlar**: canlı veri kopyalama, canlı yazma açma, Base44
trafiğini yönlendirme, Base44 tablo/fonksiyon/görev silme veya değiştirme,
LiveKit ses altyapısını değiştirme. Base44 doğruluk kaynağı olmaya devam eder.

---

## 1. Ölçülen mevcut durum (canlı sunucu)

| Yol | Durum | Not |
| --- | --- | --- |
| `/health` | 200 | "API çalışıyor" |
| `/health/ready` | 200 | `apiReady: true`, `features.liveRooms/messages/gifts/coins/games: false` |
| `/v1/ping` | 200 | Yalnızca `X-API-Key: servis anahtarı` ile |
| `Authorization: Bearer <HS256>` | **401** | Sunucu Bearer kabul etmiyor |
| `/api/rooms` | 200 | `rooms: []` — "oda veritabanı henüz bağlanmadı" |
| `/v1/test/odalar`, `/v1/test/mesajlar?oda=` | 200 | Statik örnek veri (`canliVeri: false`) |
| `/v1/contract`, `/v1/rooms`, `/v1/me`, `/api/messages`, `/api/games` | 404 | Yok |

Sonuç: depoda (`src/bonto-api`) imzalı token doğrulaması **yazılı** ama canlı
sunucuda **devrede değil**. Kullanıcı kimliği, oda veritabanı, mesaj/hediye/
jeton/oyun uçları ve ses taşıma yok.

---

## 2. Kimlik doğrulama mimarisi

### 2.1 Üç principal türü (karışması yasak)

| Tür | Nasıl gelir | Yetki sınırı |
| --- | --- | --- |
| `service` | `X-API-Key: servis anahtarı` veya HS256 **servis** tokenı | Yalnızca servis uçları (zamanlanmış işler, aynalama, rapor). Kullanıcı adına yazma yapamaz. |
| `user` | `Authorization: Bearer <kullanıcı tokenı>` | Yalnızca o kullanıcının kendi yetkileri ve kendi kaynakları. |
| `test` | `X-API-Key: statik test anahtarı` | Yalnızca `/v1/test/*`. Yazma uçlarına giremez. |

Kullanıcı oturumu ile API anahtarı **asla** karıştırılmaz: servis anahtarı bir
kullanıcının kimliği yerine kullanılmaz.

### 2.2 Kullanıcı tokenı (`api-kullanici-token.js`)

| Claim | Zorunlu | Kural |
| --- | --- | --- |
| `typ` | ✅ | `'user'` olmalı. Servis tokenı `'service'`. Tür uyuşmazlığı reddedilir. |
| `sub` | ✅ | Kullanıcı kimliği, `[\w-]{8,64}` |
| `role` | ✅ | Sunucu tarafında belirlenmiş temel rol (`user` \| `admin`) |
| `iss` / `aud` | ✅ | Veren ve hedef kitle birebir eşleşmeli |
| `iat` / `exp` | ✅ | Ömür **600 sn** (en fazla 3600). `iat` gelecekte olamaz (±60 sn kayma). |
| `jti` | ✅ | Tek kullanımlık kimlik; iptal listesi için |

Değişmezler: yalnızca `HS256` (`none` ve diğer algoritmalar reddedilir), en fazla
4096 karakter, sabit zamanlı imza karşılaştırması, süre bitiminde red.

### 2.3 İmzalama anahtarı — **gereken bilgi**

Bugün tek bir anahtar var: `API_SERVICE_KEY`. Bu anahtarı hem servis çağrısı hem
kullanıcı tokenı imzalamak için kullanmak ayrımı zayıflatır: anahtar sızarsa
herkes her kullanıcı adına token üretebilir.

- **Önerilen**: kullanıcı tokenı için ayrı bir `USER_TOKEN_SECRET` (en az 32 rastgele bayt).
  Bu değer hem Base44 gizli değişkenlerine hem Bonto ortam değişkenlerine **aynı** konur.
- **Bugünkü durum**: Base44 üretici fonksiyonu (`bontoUserToken`) servis anahtarıyla
  imzalar; Bonto tarafındaki doğrulama modülü `USER_TOKEN_SECRET` tanımlıysa onu,
  değilse servis anahtarını kullanır. Ayrı anahtar kararı verilirse değer hem Base44
  gizli değişkenlerine hem Bonto ortam değişkenlerine eklenir.
- **Karar sizde**: ayrı anahtar kullanılacak mı, yoksa tek anahtarla mı devam edilecek?
  Bu bilgi gelmeden canlı yazma açılmaz.

### 2.4 KRİTİK DAĞITIM KAPISI

`api-guvenlik.js` içindeki `authenticate`, Bearer tokenı **`kind: 'service'`
olarak** kabul ediyor. Bu dosya Bonto'ya olduğu gibi dağıtılırsa, üretilen
kullanıcı tokenı **servis yetkisi** kazanır — yani kullanıcı kendini servis gibi
tanıtabilir.

Bu yüzden sıra zorunludur:

1. Önce `api-kullanici-token.js` + `api-yetki.js` Bonto'ya kurulur (tür ayrımı devrede).
2. Ancak ondan sonra `authenticate` içinde **kullanıcı tokenı** yolu açılır.
3. Servis tokenı kullanıcı uçlarında, kullanıcı tokenı servis uçlarında reddedilir.

---

## 3. Yetkilendirme (`api-yetki.js`)

Kural: **rol claim'i tek başına yetki vermez.** Her yazma işlemi dört kapıdan geçer:

1. **Principal türü** — `user` ucu yalnızca kullanıcı tokenıyla çalışır.
2. **Rol politikası** — uç nokta hangi rollere açık (`POLITIKALAR` tablosu).
3. **Kaynak sahipliği** — oda sahibi, oda yöneticisi, ajans sahibi (veritabanından okunur).
4. **Kaynak durumu** — kapalı oda, banlı kullanıcı, bitmiş tur, süresi dolmuş çerçeve.

Ek zorunluluklar:
- İstemciden gelen bakiye, tutar, rol veya oyun sonucu **doğrudan kabul edilmez**;
  sunucu kendi kaydından doğrular.
- Para, hediye, oyun ve yönetici işlemleri **denetim kaydı** üretmeden tamamlanmaz.
- Politika tanımsızsa **kapalı devre** (fail-closed) reddedilir.

---

## 4. Idempotency ve işlem tutarlılığı (`api-idempotency.js`)

Anahtar: `(principal, işlem, request_id)`. `request_id` biçimi `[\w-]{8,64}`;
para, hediye, oyun ve yönetici yazmalarında **zorunlu**.

Akış (tek transaction):
1. `INSERT ... ON CONFLICT DO NOTHING` → satırı yaratan tek istek kilidi alır.
2. İş mantığı + bakiye/hareket/denetim kaydı **aynı transaction** içinde.
3. Yanıt gövdesi ve durum kodu satıra yazılır, `COMMIT`.
4. Aynı üçlü tekrar gelirse işlem **çalışmaz**; ilk yanıt `tekrar: true` ile döner.

Ayrıntılar:
- Aynı `request_id` **farklı gövdeyle** gelirse → `409 TEKRAR_KULLANIM`.
- Kayıt hâlâ `bekliyor` ise → kısa bekleme, sonra `409 TEKRAR_ISLENIYOR`.
- İşlem hata ile geri alındıysa satır silinir; aynı `request_id` ile tekrar denenebilir.
- Kayıt ömrü 24 saat; süresi geçenler temizlenir.
- Bakiye: `UPDATE cuzdanlar SET bakiye = bakiye - :tutar WHERE user_id = :id AND bakiye >= :tutar`
  → koşullu atomik düşme; etkilenen satır 0 ise `409 BAKIYE_YETERSIZ`.
- Oyun turu: tur satırı `SELECT ... FOR UPDATE` ile kilitlenir; tur sonucu tek kez yazılır.
- Tutar doğrulaması: pozitif, sonlu, üst sınır içinde (bkz. `api-yetki.js → tutarDogrula`).

---

## 5. Veritabanı, şema sürümleme, indeksler

**Varsayım (doğrulanmadı):** PostgreSQL 13+ ve `gen_random_uuid()`. Bonto'nun
gerçek veritabanı bilinmiyor — bu bilgi gelmeden `sema-v1.sql` uygulanmaz.

- `sema_surumu` tablosu: her migration uygulandığında bir satır.
- Uygulama açılışında sürüm kontrolü: beklenen sürümden farklıysa **başlatmayı reddet**
  (yanlış şemayla yazma yapmaktansa durmak doğrudur).
- Para alanları `numeric(18,2)`; kimlikler `uuid`; mesaj sırası `bigint` `seq`.
- Yazma ve rapor okuma için ayrı veritabanı kullanıcıları (okuma kullanıcısı `SELECT`).
- `statement_timeout` 5 sn, bağlantı havuzu sınırlı, yavaş sorgu logu zorunlu.

Kritik indeksler: `oda_mesajlari(oda_id, seq)`, `cuzdan_hareketleri(user_id, olusturma)`,
`hediye_gonderimleri(request_id) unique`, `cuzdan_hareketleri(request_id) unique`,
`oyun_turlari(slug, tur_no) unique`, `denetim_kayitlari(hedef_tur, hedef_id, olusturma)`,
`idempotency_kayitlari(principal_kimlik, islem, request_id) primary key`.

---

## 6. Hata yönetimi ve loglar

Ortak hata zarfı (Aşama 1 ile aynı):

```json
{ "error": { "code": "YETKI_YOK", "message": "Bu işlem için yetkiniz yok.", "requestId": "...", "details": {} } }
```

| Kod | HTTP | Anlam |
| --- | --- | --- |
| `BAD_REQUEST` | 400 | Doğrulama hatası (`details.alanlar` ile alan alan) |
| `KIMLIK_YOK` | 401 | Token yok / geçersiz / süresi dolmuş |
| `YETKI_TURU` | 403 | Token türü bu uç için yanlış |
| `YETKI_YOK` | 403 | Rol veya sahiplik yetersiz |
| `BULUNAMADI` | 404 | Kaynak yok |
| `CAKISMA` | 409 | Durum çakışması (koltuk dolu, tur bitmiş) |
| `TEKRAR_KULLANIM` | 409 | Aynı `request_id`, farklı gövde |
| `TEKRAR_ISLENIYOR` | 409 | Aynı istek şu an işleniyor |
| `BAKIYE_YETERSIZ` | 409 | Koşullu düşme başarısız |
| `HIZ_SINIRI` | 429 | `retry-after` başlığı ile |
| `SERVIS_HATASI` | 503 | Bağımlılık kapalı (DB yok, özellik kapalı) |

Loglar: `api-guvenlik.js → logRequest` biçimi korunur; alanlara `principalTurk`,
`principalKimlik`, `islem`, `tekrar`, `idempotencyDurum` eklenir.
**Asla loglanmaz**: token, API anahtarı, parola, kart/IBAN, tam e-posta.
Denetim kayıtları ayrı tabloda tutulur (90 gün).

---

## 7. Gerçek zamanlı akış (WebSocket)

- Tek uç: `GET /v1/ws` (upgrade). Kimlik: ilk frame'de `{ tip: 'kimlik', token }`
  veya `Authorization` başlığı; token doğrulanmadan hiçbir kanala abone olunamaz.
- Kanallar: `oda:<id>`, `kullanici:<id>`, `oyun:<slug>:<tur>`.
- Mesaj sırası: oda başına monoton `seq`. İstemci son aldığı `seq` ile yeniden
  bağlanır (`?since=seq`) → kayıp mesaj geri gelir, tekrar üretilmez.
- Haberleşme: 30 sn ping/pong; 90 sn sessizlikte bağlantı kapatılır; istemci
  1 sn→30 sn üstel geri çekilmeyle yeniden bağlanır.
- **Otorite HTTP'de kalır**: yazılar (mesaj, hediye, oyun aksiyonu) HTTP + idempotency
  ile gider; WebSocket yalnızca yayın/olay kanalıdır. WS düşse de sohbet bozulmaz.
- Çok süreçli çalışma için yayın katmanı gerekir (PostgreSQL `NOTIFY/LISTEN` veya Redis).
  **Gereken bilgi**: Bonto'da Redis var mı, kaç süreç çalışıyor?
- **LiveKit'e dokunulmaz**: ses kanalı, token üretimi ve oda ses akışı aynı kalır.
  WebSocket yalnızca metin ve olay taşır.

---

## 8. Modül gereksinimleri (özet)

| Modül | Tablolar | Ana uçlar | Yazma yetkisi | Idempotent |
| --- | --- | --- | --- | --- |
| Kullanıcı / profil | `kullanicilar`, `kullanici_cerceveleri`, `seviye_ayarlari` | `/v1/me`, `/v1/users/:id` | kendi kaydı | ✅ |
| Arkadaş / presence | `arkadasliklar`, `kullanici_durumlari` | `/v1/friends*`, `/v1/presence` | kendi | ✅ |
| Sesli oda | `odalar`, `oda_koltuklari`, `oda_yetkilileri`, `oda_banlari` | `/v1/rooms*` | sahip / yönetici | ✅ |
| Oda sohbeti | `oda_mesajlari` | `/v1/rooms/:id/messages` | koltukta / yetkili | ✅ |
| Özel mesaj | `ozel_sohbetler`, `ozel_mesajlar` | `/v1/dm/:userId` | katılımcı | ✅ |
| Hediye | `hediye_katalogu`, `hediye_gonderimleri`, `hediye_tasimalari` | `/v1/gifts*` | kendi bakiyesi | ✅ zorunlu |
| Jeton / ekonomi | `cuzdanlar`, `cuzdan_hareketleri`, `jeton_talepleri` | `/v1/wallet*` | sunucu + admin onayı | ✅ zorunlu |
| Seviye / rozet | `kullanicilar`, `kullanici_cerceveleri` | `/v1/level`, `/v1/frames` | sunucu | ✅ |
| Oyunlar | `oyun_turlari`, `oyun_katilimlari`, `oyun_sonuclari` | `/v1/games/:slug/*` | sunucu tur motoru | ✅ zorunlu |
| Ajans | `ajanlar`, `ajan_uyeleri`, `ajan_davetleri`, `ajan_kazanclari`, `kota_kademeleri` | `/v1/agencies*` | sahip / asistan | ✅ |
| Bildirim | `bildirimler` | `/v1/notifications*` | sunucu üretir | ✅ |
| Ödeme / abonelik | `odeme_kayitlari`, `abonelikler`, `odeme_yontemleri` | `/v1/payments*` | yalnızca admin onayı | ✅ zorunlu |
| Yönetici / denetim | `denetim_kayitlari`, `idempotency_kayitlari` | `/v1/admin/*` | admin | ✅ zorunlu |

---

## 9. Aşamalı geçiş, test ve geri dönüş

| Aşama | İş | Ön koşul | Geri dönüş |
| --- | --- | --- | --- |
| 3 | Kullanıcı tokenı + `/v1/me` (yalnızca okuma) | Ayrı imzalama anahtarı kararı | Token yolu kapatılır |
| 4 | Oda/mesaj **okuma** aynası | Oda DB bağlı | Okuma anahtarı kapatılır |
| 5 | Oda yazma (yalnızca test odaları) | Idempotency + yetki devrede | Yazma anahtarı kapatılır |
| 6 | Sohbet (WS yayın) | Çok süreçli yayın kararı | WS kapatılır, otorite Base44 |
| 7 | Hediye + jeton | Ayrı anahtar + denetim | Anahtar kapatılır |
| 8 | Oyunlar | Tur motoru testleri | Anahtar kapatılır |
| 9 | Ödeme / abonelik | Sağlayıcı test modu | Anahtar kapatılır |

Test kuralları: her aşama için (a) birim testleri (token, yetki, idempotency),
(b) uç sözleşme testleri (durum kodu + gövde), (c) **çift işlem testi** (aynı
`request_id` iki kez → tek kayıt), (d) yetki testi (başka kullanıcının kaynağı → 403),
(e) yük testi (oda başına eşzamanlı katılım).

Geri dönüş garantisi: veri Base44'te kaldığı sürece Bonto modülü kapatmak kayıp
üretmez. Bonto tamamen kapatılabilsin diye her modülün kendi anahtarı vardır ve
varsayılan **kapalı**dır. Bonto'ya geçiş kararı için eşik: 7 gün boyunca %100 uç
tutarlılığı ve sıfır çift kayıt.

---

## 10. Açık kararlar ve gereken bilgiler

1. **İmzalama anahtarı**: ayrı `USER_TOKEN_SECRET` mı, servis anahtarı mı?
2. **Veritabanı**: Bonto'da hangi veritabanı var (PostgreSQL sürümü)? `sema-v1.sql` uyarlanmalı.
3. **Yayın katmanı**: Redis var mı, kaç süreç/konteyner çalışıyor?
4. **Roller**: Bonto'da hangi roller zorunlu (yayıncı, ajans sahibi, asistan, oda yöneticisi)?
5. **Barındırma**: ortam değişkenleri Bonto panelinde nasıl yönetiliyor, dağıtım nasıl yapılıyor?
6. **Ödeme sağlayıcısı**: hangi sağlayıcı (Shopier gizli değişkenleri kodda hiç kullanılmıyor).
7. **E-posta/telefon** gibi kişisel veriler Bonto'ya taşınacak mı (öneri: hayır).