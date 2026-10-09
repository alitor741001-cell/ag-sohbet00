# ag-backend API sözleşmesi — Aşama 1

- **Taban adres:** `https://ag-backend.bonto.run`
- **Sürüm:** `contractVersion = asama-1` (`CONTRACT_VERSION` ile değiştirilebilir)
- **Kapsam:** yalnızca sağlık kontrolü ve **salt okunur test uçları**
- **Canlı veri bağlı mı:** hayır (`canliVeri: false`)
- **Kaynak of truth:** Base44 (kimlik doğrulama, veritabanı, kullanıcı verileri). Bu sunucu başlangıçta yalnızca yardımcı servistir ve aynı veriye iki sistemden yazma yapılmaz.

---

## 1. Kimlik doğrulama

`/v1/*` uçları kimlik doğrulama ister. İki yol kabul edilir:

**A) İmzalı servis tokenı (Aşama 2'de Base44 arka ucu kullanacak)**

```
Authorization: Bearer <HS256 imzalı token>
```

Token talepleri: `alg = HS256`, `iss = base44-app`, `aud = ag-backend-api`, `sub = <kullanıcı kimliği>`,
`role = user|moderator|admin`, `exp` zorunlu (kısa ömür önerilir: 5–15 dakika).
İmza anahtarı: `API_SERVICE_KEY` (yalnızca sunucu tarafında).

**B) Statik test anahtarı (yalnızca elle deneme)**

```
X-API-Key: <STATIC_TEST_KEY>
```

**Doğrulama kuralları**

- İmza, `exp` (süre), `aud` ve `iss` denetlenir; karşılaştırmalar zamanlama saldırısına kapalıdır.
- Anahtar tanımlı değilse `/v1` uçları **503** döner (kapalı devre). Sessizce açık kalmaz.
- `/health` ve `/health/ready` kimlik istemez (Cloud Run / izleme için).
- Yanıt gövdesi hiçbir koşulda anahtar veya sır içermez.

---

## 2. Ortak kurallar

- Tüm yanıtlar JSON’dur (`content-type: application/json; charset=utf-8`); sağlık ve liste yanıtları `no-store`.
- Her yanıtta `x-request-id` başlığı bulunur (günlüklerde aramak için).
- Hata biçimi:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "İstek doğrulaması başarısız.",
    "requestId": "5e959661-2508-40b8-b229-b9da77b6d4f7",
    "details": { "alanlar": [{ "alan": "adet", "mesaj": "1 ile 10 arasında olmalı" }] }
  }
}
```

| Kod | HTTP | Anlamı |
| --- | --- | --- |
| `UNAUTHORIZED` | 401 | Kimlik yok/geçersiz |
| `FORBIDDEN` | 403 | Yetki yok (Aşama 2+) |
| `NOT_FOUND` | 404 | Uç nokta veya kayıt yok |
| `BAD_REQUEST` | 400 | İstek doğrulaması başarısız |
| `RATE_LIMITED` | 429 | Hız sınırı aşıldı (`retry-after` başlığı döner) |
| `AUTH_NOT_CONFIGURED` | 503 | Sunucuda anahtar tanımlı değil |
| `UNAVAILABLE` | 503 | Bağımlılık yanıt vermiyor (Aşama 2+) |
| `INTERNAL` | 500 | Beklenmeyen hata |

- Hız sınırı: IP başına, varsayılan 60 saniyede 120 istek.
- CORS: `CORS_ORIGINS` boşken yalnızca aynı adresten çağrı yapılabilir. Aşama 2'de uygulama adresi eklenecek.

---

## 3. Uç noktalar

| Yöntem | Yol | Kimlik | Açıklama |
| --- | --- | --- | --- |
| GET | `/` | — | Mevcut Bonto sayfası (değişmedi) |
| GET | `/health` | — | Süreç ayakta mı, yapılandırma durumu |
| GET | `/health/ready` | — | Kimlik doğrulama ve bağımlılık durumu |
| GET | `/test` | — | Telefondan denemek için test sayfası |
| GET | `/v1/sozlesme` | ✔ | Bu sözleşmenin makine okunur özeti |
| GET | `/v1/ping` | ✔ | Kimlik doğrulama denemesi |
| GET | `/v1/echo?mesaj=&adet=` | ✔ | İstek doğrulama denemesi |
| GET | `/v1/test/odalar` | ✔ | Statik oda listesi **örneği** |
| GET | `/v1/test/mesajlar?oda=` | ✔ | Statik mesaj listesi **örneği** |

### 3.1 `GET /health`

```json
{
  "ok": true,
  "service": "ag-backend",
  "version": "0.1.0",
  "contractVersion": "asama-1",
  "environment": "production",
  "startedAt": "2026-10-09T23:53:08.900Z",
  "uptimeSeconds": 12,
  "timestamp": "2026-10-09T23:53:09.012Z",
  "phase": 1,
  "authConfigured": true,
  "dependencies": { "database": "not_configured", "liveData": "disabled", "voice": "livekit_disinda_tutuldu" },
  "features": {
    "liveRooms": false,
    "liveMessages": false,
    "shadowRead": false,
    "games": false,
    "gifts": false,
    "coins": false,
    "ignoredFlagRequests": []
  }
}
```

`ignoredFlagRequests`: Aşama 1'de açık istenmiş ama yok sayılmış bayraklar (ör. `FEATURE_LIVE_MESSAGES`).

### 3.2 `GET /health/ready`

```json
{
  "ready": true,
  "apiReady": true,
  "checks": { "process": "up", "auth": "configured", "database": "not_configured", "liveData": "disabled" },
  "notes": ["Aşama 1: canlı veriye bağlanılmadı."],
  "timestamp": "2026-10-09T23:53:09.019Z"
}
```

### 3.3 `GET /v1/ping`

| Durum | Yanıt |
| --- | --- |
| Anahtarsız | `401` `{"error":{"code":"UNAUTHORIZED","message":"Authorization: Bearer <token> veya X-API-Key başlığı gerekli."}}` |
| Doğru statik anahtar | `200` `{"ok":true,"pong":true,"requestId":"20fd377e-…","serverTime":"2026-10-09T23:53:09.024Z","principal":{"kind":"static-test-key","userId":null,"role":"test"}}` |
| İmzalı servis tokenı | `200` `{"ok":true,"pong":true,…,"principal":{"kind":"service","userId":"kullanici-1","role":"admin"}}` |
| Taklit/bozuk token | `401` `{"error":{"code":"UNAUTHORIZED","message":"Token doğrulanamadı."}}` |

### 3.4 `GET /v1/echo?mesaj=<1-140>&adet=<1-10>`

Geçerli istek:

```json
{ "ok": true, "dogrulandi": true, "alinan": { "mesaj": "merhaba", "adet": 3 }, "canliVeri": false }
```

Geçersiz istek (`mesaj=` boş, `adet=99`):

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "İstek doğrulaması başarısız.",
    "requestId": "5e959661-…",
    "details": {
      "alanlar": [
        { "alan": "mesaj", "mesaj": "en az 1 karakter olmalı" },
        { "alan": "adet", "mesaj": "1 ile 10 arasında olmalı" }
      ]
    }
  }
}
```

### 3.5 `GET /v1/test/odalar` — **statik örnek** (gerçek oda verisi değil)

```json
{
  "ornek": true,
  "kaynak": "statik-test-verisi",
  "canliVeri": false,
  "adet": 2,
  "odalar": [
    {
      "id": "ornek-oda-1", "kod": "ODA-1001", "ad": "Sinema Keyfi", "tur": "watch",
      "durum": "active", "gizli": false, "kilitli": false,
      "kapasite": 10, "uyeSayisi": 4, "olusturmaTarihi": "2026-10-01T18:00:00.000Z"
    },
    {
      "id": "ornek-oda-2", "kod": "ODA-1002", "ad": "Sesli Sohbet", "tur": "voice",
      "durum": "active", "gizli": true, "kilitli": true,
      "kapasite": 8, "uyeSayisi": 6, "olusturmaTarihi": "2026-10-02T20:30:00.000Z"
    }
  ]
}
```

Bu alan kümesi, Aşama 2'de gerçek veriye bağlanacak **oda biçiminin önerisidir** (şimdilik uygulanmadı).

### 3.6 `GET /v1/test/mesajlar?oda=<3-64, harf/rakam/-/_>` — **statik örnek**

```json
{
  "ornek": true,
  "kaynak": "statik-test-verisi",
  "canliVeri": false,
  "oda": "ornek-oda-1",
  "adet": 3,
  "mesajlar": [
    {
      "id": "ornek-mesaj-1", "odaId": "ornek-oda-1", "tur": "user",
      "gonderen": { "id": "ornek-kullanici-1", "ad": "Ornek Kullanici" },
      "metin": "Bu bir statik test mesajidir; gercek sohbet verisi degildir.",
      "gonderimTarihi": "2026-10-05T19:12:04.000Z"
    }
  ]
}
```

`oda` eksik veya biçimi bozuksa: `400 BAD_REQUEST` + alan hatası.
Mesajlar **ilk canary alanıdır**; canlıya geçiş ancak gölge okuma testi ve açık onay ile yapılır.

---

## 4. Aşama 1'de bilinçli olarak YOK

| Alan | Durum | Neden |
| --- | --- | --- |
| Canlı oda listesi / oda açma, kapatma, kilitleme, gizleme | Yok | Aşama 4'te ayrı ayrı ele alınacak |
| Canlı mesaj gönderme/okuma | Yok | Önce gölge okuma; canlıya yönlendirme yok |
| Sesli sohbet | Dokunulmadı | LiveKit altyapısı aynen korunuyor |
| Oyunlar | Yok | En yüksek risk; adalet kanıtı ve denetim kaydı gerektirir |
| Hediye gönderme | Yok | Coin ile kesiştiği için kapalı |
| Coin bakiyesi yazma, coin gönderme, para yatırma/çekme | **Tamamen kapalı** | Yasal uygunluk ve güvenlik incelemesi tamamlanmadan açılmayacak |
| Veritabanı yazma | Yok | Aynı veriye iki sistemden yazma yapılmaz; Base44 tek kaynaktır |

---

## 5. Aşama 1 kilidi nasıl çalışır

`api-ayar.js` içindeki bütün özellik bayrakları sabit olarak `false`’tur:
`FEATURE_LIVE_ROOMS`, `FEATURE_LIVE_MESSAGES`, `FEATURE_SHADOW_READ`, `FEATURE_GAMES`, `FEATURE_GIFTS`, `FEATURE_COINS`.

Bir bayrak `true` yapılmaya çalışılırsa:

1. Sunucu başlarken uyarı yazar,
2. bayrak yine de `false` kalır,
3. `/health` yanıtındaki `features.ignoredFlagRequests` alanında bildirir.

Yani Aşama 1 kodu, canlı veriye veya finansal işleme kazara bağlanamaz.

---

## 6. Sürümleme ve değişiklik yönetimi

- `contractVersion` her kırıcı değişiklikte artırılır (`asama-1` → `asama-2` …).
- Yeni alan eklemek geriye dönük uyumludur; alan kaldırmak/değiştirmek yeni sürüm gerektirir.
- Aşama 2'de eklenecekler (şimdilik yok): `POST /v1/canli/mesajlar` (idempotency anahtarı ile),
  `GET /v1/canli/odalar` (sayfalı), gerçek zamanlı kanal, sağlık için bağımlılık denetimi.

---

## 7. Örnek istemci çağrıları

```bash
# Sağlık (anahtarsız)
curl -s https://ag-backend.bonto.run/health

# Kimlik denemesi
curl -s https://ag-backend.bonto.run/v1/ping -H "X-API-Key: <STATIC_TEST_KEY>"

# Örnek listeler
curl -s https://ag-backend.bonto.run/v1/test/odalar -H "X-API-Key: <STATIC_TEST_KEY>"
curl -s "https://ag-backend.bonto.run/v1/test/mesajlar?oda=ornek-oda-1" -H "X-API-Key: <STATIC_TEST_KEY>"
```

Telefonda: `https://ag-backend.bonto.run/test` sayfasını açıp anahtarı yapıştırmak yeterlidir.