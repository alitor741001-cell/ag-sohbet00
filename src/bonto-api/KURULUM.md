# Aşama 1 kurulumu — telefondan adım adım

Bu belge, `ag-backend.bonto.run` üzerinde **yalnızca sağlık kontrolü ve salt okunur test uçları** yayınlar.
Canlı oda, mesaj, hediye veya coin verisine bağlanılmaz; Base44 tarafında **hiçbir şey değişmez**.

Süre: yaklaşık 15 dakika. Gereken: Bonto editörü + bir not uygulaması (yedek için).

---

## Adım 0 — Yedek ve hazırlık (ATLAMAYIN)

1. Bonto editöründe **`index.js`** dosyasını açın.
2. İçeriğin tamamını seçip kopyalayın, notlar uygulamanıza yapıştırıp saklayın.
3. Aynı içerikle **`index.yedek.js`** adında yeni bir dosya oluşturup kaydedin.
   → Geri dönüş bu dosyayla tek adımda yapılır.
4. Ayrıca `index.js` içeriğini bana yapıştırın: böylece modül tipini (CommonJS/ESM) ve
   mevcut satırları birebir teyit edip, gerekiyorsa yeni sürümü ona göre düzenlerim.

> Bu paket **harici paket gerektirmez** (Express dahil). Yalnızca Node.js'in kendi modülleri kullanılır.

---

## Adım 1 — Ortam değişkenleri (anahtarlar)

Bonto panelinizde **Environment Variables / Env / Secrets** bölümünü bulun ve şunları ekleyin.
Böyle bir bölüm göremiyorsanız bana yazın; alternatif yolu (küçük bir `.env` okuyucu) hazırlarım.

| Değişken | Zorunlu | Değer / açıklama |
| --- | --- | --- |
| `API_SERVICE_KEY` | Önerilir | En az 32 karakter rastgele anahtar. Aşama 2'de Base44 arka ucu bu anahtarla imzalı token üretecek. |
| `STATIC_TEST_KEY` | Önerilir | En az 32 karakter rastgele anahtar. Yalnızca elle test için. |
| `SERVICE_NAME` | Hayır | Varsayılan `ag-backend`. |
| `CONTRACT_VERSION` | Hayır | Varsayılan `asama-1`. |
| `LOG_REQUESTS` | Hayır | Varsayılan `true`. İstek günlükleri JSON olarak yazılır. |
| `ENABLE_TEST_PAGE` | Hayır | Varsayılan `true`. Test sayfasını kapatmak için `false`. |
| `RATE_LIMIT_MAX` | Hayır | Varsayılan 120 (60 saniyede, IP başına). |
| `CORS_ORIGINS` | Hayır | Şimdilik **boş bırakın**. Aşama 2'de uygulama adresi eklenecek. |

**Kurallar**

- Anahtarları **hiçbir dosyanın içine yazmayın**; yalnızca ortam değişkeninde tutun.
- İki anahtar birbirinden farklı olsun ve ikisi de en az 32 karakter olsun (kısa anahtar yok sayılır).
- Anahtar tanımlı değilse API kapanır: `/v1` uçları **503** döner, `/health` çalışmaya devam eder (kapalı devre).

---

## Adım 2 — Dosyaları oluştur (bu sırayla, kopyala‑yapıştır)

Her dosya için: Bonto editöründe **yeni dosya** oluştur → adını tam olarak yaz → içeriği bu depodaki
aynı adlı dosyadan kopyalayıp yapıştır → kaydet.

| # | Bonto'daki dosya adı | Bu depodaki kaynak | Ne yapar | Zorunlu mu |
| --- | --- | --- | --- | --- |
| 1 | `api-ayar.js` | `src/bonto-api/api-ayar.js` | Ayarlar, anahtar denetimi, Aşama 1 kilidi | Evet |
| 2 | `api-guvenlik.js` | `src/bonto-api/api-guvenlik.js` | Token doğrulama, CORS, hız sınırı, istek kimliği | Evet |
| 3 | `api-test-sayfasi.js` | `src/bonto-api/api-test-sayfasi.js` | Telefondan denemek için `/test` sayfası | Evet |
| 4 | `api-uclar.js` | `src/bonto-api/api-uclar.js` | Sağlık ve `/v1` uç noktaları | Evet |
| 5 | `index.js` | `src/bonto-api/index.js` | Giriş dosyası: ana sayfa korunur + API bağlanır | Evet — **en son**, yedek aldıktan sonra |

> `package.json` oluşturmanıza gerek yoktur; Bonto tarafında yalnızca yukarıdaki 5 `.js` dosyası yeterlidir.
> (Bu depodaki `package.json` sadece yerel çalıştırma içindir.)

**Dosya boyutları küçük:** en büyüğü ~11 KB. Telefonda kopyalama zor olursa söyleyin; dosyaları daha da küçük parçalara bölerim.

---

## Adım 3 — Kaydet ve doğrula

Kaydettikten sonra (Bonto değişiklikleri otomatik yayınlar):

1. **Ana sayfa:** `https://ag-backend.bonto.run/`
   → "Hello from Bonto!" sayfası **aynı görünmeli** (hiçbir şey bozulmadı).
2. **Sağlık:** `https://ag-backend.bonto.run/health`
   → JSON dönmeli, içinde `"ok": true` ve bütün `features` değerleri `false` olmalı.
3. **Hazırlık:** `https://ag-backend.bonto.run/health/ready`
   → `"apiReady": true` (anahtar tanımlıysa).
4. **Test sayfası (telefon için):** `https://ag-backend.bonto.run/test`
   → `STATIC_TEST_KEY` değerini yapıştırın, düğmelere tek tek dokunun.
   Sayfa anahtarı hiçbir yere kaydetmez; yalnızca o an gönderir.

---

## Adım 4 — Doğrulanmış davranış (bu paketle test edildi)

Aşağıdaki 20 denetim, gerçek bir HTTP sunucusu üzerinde çalıştırılıp doğrulandı (sonuç: 20/20):

| Denetim | Beklenen | Sonuç |
| --- | --- | --- |
| `GET /` | 200, "Hello from Bonto!" sayfası aynen | ✅ |
| `GET /bilinmeyen-sayfa` | 404, eski HTML gövdeli 404 | ✅ |
| `GET /health` (anahtarsız) | 200, tüm bayraklar `false` | ✅ |
| `GET /health/ready` | 200, `apiReady` bilgisi | ✅ |
| `GET /v1/ping` (anahtarsız) | 401 `UNAUTHORIZED` | ✅ |
| `GET /v1/ping` (yanlış anahtar) | 401 | ✅ |
| `GET /v1/ping` (doğru anahtar) | 200, `principal.kind = static-test-key` | ✅ |
| `GET /v1/echo?mesaj=merhaba&adet=3` | 200, doğrulanmış değerler | ✅ |
| `GET /v1/echo?mesaj=&adet=99` | 400 + alan hataları | ✅ |
| `GET /v1/sozlesme` | 200, 7 uç listelenir | ✅ |
| `GET /v1/test/odalar` | 200, `ornek: true`, `canliVeri: false`, 2 örnek | ✅ |
| `GET /v1/test/mesajlar?oda=ornek-oda-1` | 200, 3 örnek mesaj | ✅ |
| `GET /v1/test/mesajlar` (oda eksik) | 400 | ✅ |
| `GET /v1/bilinmeyen` | 404 JSON | ✅ |
| `GET /test` | 200 HTML test sayfası | ✅ |
| `HEAD /health` | 200, gövdesiz | ✅ |
| `OPTIONS /v1/ping` | 204 | ✅ |
| İmzalı servis tokenı ile `/v1/ping` | 200, `principal.kind = service` | ✅ |
| Taklit edilmiş token | 401 | ✅ |
| Bozuk token | 401 | ✅ |
| Aşama 1 kilidi: `FEATURE_LIVE_MESSAGES=true` vb. | Yok sayılır, bayrak `false` kalır, `/health` içinde bildirilir | ✅ |

---

## Geri dönüş (rollback)

| Amaç | Yapılacak | Etki |
| --- | --- | --- |
| **Tam geri dönüş** | `index.yedek.js` içeriğini kopyalayıp `index.js`'e geri koyun, kaydedin | Sistem eski hâline döner (API tamamen kaybolur) |
| API'yi kapat, sayfayı koru | Ortam değişkeninden `API_SERVICE_KEY` ve `STATIC_TEST_KEY` silin | `/v1` uçları 503 döner; `/health` ve ana sayfa çalışır |
| Test sayfasını kapat | `ENABLE_TEST_PAGE=false` | `/test` 404 olur |
| Dosyaları temizle | `api-*.js` dosyalarını silin (index.js duruyorsa önce yedekle geri dönün) | Çağrılmadıkları için etkisizdir |

Hiçbir adımda veritabanına, Supabase'e veya Base44 tarafına dokunulmaz.

---

## Sorun giderme

| Belirti | Olası neden | Çözüm |
| --- | --- | --- |
| Site hiç açılmıyor / 502 | `index.js` hatalı kaydedilmiş | `index.yedek.js` içeriğini geri koyun |
| `/health` 404, ana sayfa çalışıyor | `index.js` kaydedilmemiş veya sunucu yenilenmemiş | Kaydedin, sayfayı yenileyin |
| `/v1/*` → 503 `AUTH_NOT_CONFIGURED` | Anahtar tanımlı değil veya 32 karakterden kısa | Ortam değişkenine uygun anahtar ekleyin |
| `/v1/*` → 401 | Anahtar yanlış ya da `Bearer` token süresi dolmuş | Test sayfasına doğru `STATIC_TEST_KEY` değerini yapıştırın |
| `/v1/*` → 429 | Hız sınırı aşıldı | 1 dakika bekleyin veya `RATE_LIMIT_MAX` artırın |
| Günlükte `Aşama 1 kilidi: ...` uyarısı | Bir özellik bayrağı açık istekte bulunuyor | Beklenen davranış: bayrak yok sayılır; değişkeni silin |
| `Cannot use import statement outside a module` veya `require is not defined` | Sunucu beklediğinden farklı modül tipi | Bana yazın: dosyaları diğer modül tipine çevireyim |

---

## Güvenlik notları

- Anahtarlar **yalnızca ortam değişkeninde**; hiçbir dosyada veya yanıtta görünmez.
- Test sayfası anahtarı tarayıcıda saklamaz, sayfaya gömmez; yalnızca isteğin başlığında gönderir.
- Statik dosya sunumu kapalı: `/package.json`, `/.env` gibi yollar 404 döner (denetlendi).
- Canlı veriye bağlanılmadı: bütün liste yanıtları `ornek: true` ve `canliVeri: false` işaretlidir.
- Sesli sohbet LiveKit'te kalır; bu API ses akışına dokunmaz.
- Coin bakiyesi yazma, coin gönderme, para yatırma/çekme bu pakette **yoktur** ve bayraklarla kilitlidir.