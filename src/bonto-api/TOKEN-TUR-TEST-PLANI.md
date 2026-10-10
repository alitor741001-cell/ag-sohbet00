# TOKEN TÜRÜ AYRIMI — GÜVENLİ TEST PLANI

Amaç: kullanıcı tokenının **servis yetkisi kazanamadığını** ve servis anahtarının
kullanıcı kimliği yerine geçemediğini kanıtlamak. Bütün adımlar **canlıya zarar
vermez**: yazma yok, veri kopyalama yok, trafik yönlendirme yok, gerçek kullanıcı
verisi yok.

Sıra zorunludur: **A → B → C**. C'deki adımlar yalnızca Bonto'da kullanıcı tokenı
doğrulaması kurulduktan sonra yapılır.

---

## A. Çevrimdışı testler (ağ yok, veritabanı yok)

Bonto'ya kopyaladıktan sonra (veya Base44 tarafında) tek komut:

```bash
node test-token-ayrim.js
```

Beklenen: **21/21 GECTI**, çıkış kodu `0`. Kapı olarak kullanılabilir: kalan varsa
çıkış kodu `1` olur ve dağıtım durdurulur.

Kapsanan başlıklar:

| Konu | Doğrulanan |
| --- | --- |
| Tür ayrımı | `typ=service` tokenı kullanıcı doğrulamasından geçmez |
| Anahtar ayrımı | Servis anahtarıyla imzalanmış token kabul edilmez (`imza`) |
| Anahtar ayrımı kapısı | Anahtar yoksa veya iki anahtar aynıysa doğrulama kapalı |
| Ömür | Süresi dolmuş, gelecek `iat`, 2 saatlik ömür reddedilir |
| Bağlam | Yanlış `aud`, yanlış `iss`, `alg:none` reddedilir |
| Bütünlük | Bozulmuş imza ve iptal listesindeki `jti` reddedilir |
| Yetki | Kullanıcı tokenı servis ucunda `YETKI_TURU`, yönetici ucunda `YETKI_YOK` |
| Kapalı devre | Tanımsız politika reddedilir; kilitli modül özellik kapalıyken `SERVIS_HATASI` |

Ayrıca `node --check` her dosya için hatasız olmalıdır:

```bash
node --check api-kullanici-token.js && node --check api-yetki.js && node --check api-idempotency.js
```

## B. Canlı ama SALT OKUNUR testler (doğrulama kurulmadan da yapılabilir)

Yalnızca servis anahtarıyla, kimseye zarar vermeyen okuma çağrıları:

| # | İstek | Beklenen |
| --- | --- | --- |
| 1 | `GET /health` (`X-API-Key: <servis anahtarı>`) | `200` |
| 2 | `GET /health/ready` | `200`, `apiReady: true` |
| 3 | `GET /v1/ping` | `200` |
| 4 | `GET /v1/test/odalar` | `200`, `canliVeri: false` |
| 5 | Herhangi bir uca `Authorization: Bearer <örnek kullanıcı tokenı>` | Doğrulama kurulmadıysa **401** (beklenen) |

Adım 5 önemlidir: **401, canlı bağlantının henüz açılmadığının kanıtıdır.** 200
dönerse doğrulama habersiz açılmış demektir; o durumda dağıtım durdurulur ve
`authenticate` içindeki Bearer yolunun hâlâ `kind: 'service'` ürettiği kontrol edilir.

## C. Doğrulama kurulduktan SONRA (yalnızca salt okunur uçla)

Önce Bonto'da yalnızca **okuma** yapan tek bir uç açılır (örnek: `GET /v1/me`).
Yazma uçları kapalı kalır.

| # | Test | Beklenen |
| --- | --- | --- |
| 1 | Kendi geçerli tokenı ile `GET /v1/me` | `200`, dönen `userId` tokenın `sub` değeriyle aynı |
| 2 | Süresi dolmuş token | `401 KIMLIK_YOK` |
| 3 | Servis anahtarıyla `GET /v1/me` (`X-API-Key`) | `401/403` — servis kimliği kullanıcı ucu açmaz |
| 4 | Bozulmuş imzalı token | `401 KIMLIK_YOK` |
| 5 | A kullanıcısının tokenı ile B kullanıcısının kaynağı | `403 YETKI_YOK` |
| 6 | `typ=service` tokenı ile kullanıcı ucu | `401/403`, asla `200` |
| 7 | Aynı `request_id` ile iki yazma denemesi (**yalnızca test ortamı**) | Tek kayıt; ikinci yanıt `tekrar: true` |

## D. Yasak testler

- Canlı hediye, jeton, oyun, ödeme veya mesaj yazma uçlarına istek atmak.
- Gerçek kullanıcı verisiyle örnek üretmek.
- Özellik anahtarlarını açıp canlı yazmayı denemek.
- `sema-v1.sql` çalıştırmak.

## E. Kayıt ve geri dönüş

- Her adımın durum kodu ve `requestId` değeri kaydedilir; başarısızlıkta dağıtım durur.
- Geri dönüş: yeni dosyalar kaldırılır, özellik anahtarları kapalı kalır, Bearer
  yolu kapatılır. `index.js` ve Aşama 1 uçları değişmediği için trafik Base44'te
  kalmaya devam eder; veri kaybı olmaz.