# AŞAMA 1 — KİMLİK VE YETKİ SÖZLEŞMESİ (Bonto tarafı için)

**Durum: tasarım.** Hiçbir uç canlıya alınmadı, hiçbir istek Bonto'ya gitmiyor, hiçbir tablo
oluşturulmadı. Base44 tek kaynak olmaya devam ediyor. Bu dosya, Bonto'daki kendi API'nize
eklenecek ilk parçayı tanımlar.

---

## 0. Doğrulanan gerçekler

| Konu | Durum |
| --- | --- |
| Canlı API | Kendi API'niz. `/health` → "API çalışıyor", `/health/ready` → `apiReady: true` |
| Özellik bayrakları | `liveRooms`, `messages`, `gifts`, `coins`, `games` → **hepsi kapalı** |
| Veritabanı | `/api/rooms` → *"oda veritabanı henüz bağlanmadı"* → **bağlı değil** |
| Hedef DB | PostgreSQL (Supabase) — `sema-v1.sql` (35 tablo) bu hedefe uygun tasarım, uygulanmadı |
| Token üretimi | Base44 `bontoUserToken`: HS256, `typ=user`, `iss=base44-app`, `aud=ag-backend-api`, TTL 600 sn, `jti` |
| Anahtar ayrımı | Kullanıcı tokenı **yalnızca** `USER_TOKEN_SECRET` ile imzalanır; servis anahtarı kullanılmaz |
| Test sonucu | `test-token-ayrim.js` **21/21 geçiyor** (kullanıcı/servis tokenı birbirinin yerine geçemiyor) |

Gizli değerler bu dosyada, kodda ve yanıtlarda **yer almaz**.

## 1. Bonto API'sinin ekleyeceği uçlar

| Uç | Yetki | Döndürdüğü |
| --- | --- | --- |
| `GET /v1/ben` | Bearer **kullanıcı** tokenı | `{ ok, kullanici: { base44_id, rol, takma_ad, durum } }` |
| `GET /v1/test/kimlik` | **Servis** anahtarı (`X-API-Key`) | Doğrulayıcının kendi kendini testi — statik veri, yazma yok |

**Yazma uçları Aşama 1'de açılmaz.** Aşama 1 yalnızca "kim olduğunu doğru biliyor muyum?"
sorusunu yanıtlar.

## 2. Zorunlu doğrulama kuralları

1. `alg` yalnızca **HS256**; `none` ve diğer algoritmalar → **401**.
2. Token türü zorunlu: `typ=user`. Servis tokenı bu uçlardan **geçemez**.
3. Zaman: `iat` için gelecek yönünde 60 sn tolerans, `exp` için geçmiş yönünde 60 sn tolerans,
   toplam ömür ≤ 3600 sn.
4. `jti` tekrarı reddedilir (idempotency deposunda tutulur) → **401**.
5. `iss` = `base44-app`, `aud` = `ag-backend-api`; farklıysa **401**.
6. Rol claim'i tek başına yetki vermez; rol veritabanından teyit edilir.
7. Anahtarlar ayrılmamışsa (`userTokenSecret === serviceKey`) doğrulama **kapanır** ve
   uç **503** döner — sessizce zayıf doğrulamaya düşülmez.
8. Gelen isteklerde kullanıcı kimliği **yalnızca** token içinden okunur; gövdedeki `user_id`
   yok sayılır (kimlik istemciden kabul edilmez).

## 3. Hata kodları

| Durum | Kod |
| --- | --- |
| Token yok / biçim bozuk / imza hatalı | 401 |
| Süresi dolmuş / süre çok uzun / `iat` ileride | 401 |
| Tür uyuşmazlığı (`typ=service`) | 401 |
| `jti` tekrarı | 401 |
| `iss`/`aud` uyuşmazlığı | 401 |
| Hesap yasaklı / askıda | 403 |
| Anahtar tanımsız, doğrulama kapalı | 503 |

## 4. Kapı testleri (canlıya açılmadan önce hepsi geçmeli)

| # | Test | Beklenen |
| --- | --- | --- |
| 1 | Geçerli kullanıcı tokenıyla `/v1/ben` | 200 + doğru rol |
| 2 | İmzası bozulmuş token | 401 |
| 3 | Süresi dolmuş token | 401 |
| 4 | `typ=service` tokenı kullanıcı ucunda | 401 |
| 5 | Aynı `jti` ikinci kez | 401 |
| 6 | Token hiç yok | 401 |
| 7 | `USER_TOKEN_SECRET` kaldırıldı | 503, token üretilmez |
| 8 | Yasaklı hesap tokenı | 403 |
| 9 | Base44 tarafı `test-token-ayrim.js` | 21/21 |

Bu 9 test geçmeden **Aşama 2 (bakiye/hediye/coin) başlamaz**.

## 5. Base44 tarafında değişiklik

Aşama 1 için **kod değişikliği gerekmiyor**: token üretici hazır ve hiçbir sayfaya bağlı değil.
Hiçbir kullanıcı akışı Bonto'ya yönlenmez; uygulama bugünkü gibi çalışmaya devam eder.

## 6. Geri dönüş planı

Yeni uç kapatılır (bayrak kapalı) → Base44 tek kaynak olmaya devam eder. Veri taşınmadığı için
geri alınacak bir veri yoktur.

## 7. Sıradaki adım

Bonto API'nizde `GET /v1/ben` + `/v1/test/kimlik` eklenir, 9 kapı testi çalıştırılır.
Ardından **Aşama 2** için cüzdan (coin/hediye) sözleşmesi yazılır — o aşamada
`request_id` zorunluluğu, atomik bakiyе düşme ve denetim kaydı devreye girer.