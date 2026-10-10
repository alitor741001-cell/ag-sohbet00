# game-api — Bağımsız Oyun API'si (Google Cloud Run)

`filmkeyfi-game-api`, FILMKEYFİ için hazırlanmış **bağımsız** bir Node.js (Express) API'sidir.
Google Cloud Run üzerinde kendi konteynerinde çalışır ve Supabase'e **yalnızca okuma** amacıyla bağlanır.

## Bu klasör nedir / ne değildir

**Nedir**

- Kendi `package.json`, `Dockerfile` ve kaynak koduna sahip, ayrı dağıtılan bir servis.
- `/health` sağlık kontrolü, Bearer token doğrulaması, rol çözümlemesi ve istek doğrulaması (Zod).
- Oda listesi ve oda durumu gibi **salt okunur** uç noktalar.
- Sırlar yalnızca ortam değişkenlerinden / Secret Manager'dan okunur; kodda sır yoktur.

**Ne değildir**

- Mevcut Base44 uygulamasının bir parçası **değildir**: uygulamanın derlemesine girmez, `src/` ve `base44/` altındaki hiçbir dosyaya dokunmaz.
- Hiçbir oyun, oda veya oyuncu isteği bu API'ye **yönlendirilmemiştir**. Oyunlar eskisi gibi Base44 üzerinde çalışmaya devam eder.
- Veritabanında hiçbir tablo, kolon veya kayıt **değiştirilmemiştir**. Bu API yalnızca `SELECT` yapar.
- Coin bakiyesi, bahis kesintisi, bakiye transferi veya para çekme **yoktur** (aşağıdaki "Finansal işlemler kilidi" bölümü).

## Dosya yapısı

```
game-api/
├── package.json                 # bağımlılıklar ve komutlar
├── Dockerfile                   # Cloud Run konteyner imajı (node:20-alpine, kök olmayan kullanıcı)
├── .dockerignore / .gitignore
├── .env.example                 # tüm ortam değişkenleri (kopyalayıp .env yapın)
├── cloudbuild.yaml              # Cloud Build ile imaj + Cloud Run dağıtımı
├── README.md
├── src/
│   ├── server.js                # giriş noktası: 0.0.0.0:$PORT dinler, zarif kapanış
│   ├── app.js                   # Express uygulaması (ara katman sırası)
│   ├── config.js                # ortam değişkeni doğrulaması (eksikse süreç başlamaz)
│   ├── logger.js                # JSON günlük (Cloud Logging `severity`)
│   ├── errors.js                # AppError + async sarmalayıcı
│   ├── db/supabase.js           # Supabase istemcisi + yalnızca-okuma yardımcıları
│   ├── auth/
│   │   ├── tokens.js            # Supabase JWT / servis tokenı doğrulama + imzalama
│   │   └── roles.js             # rolü veritabanından çözme (önbellekli)
│   ├── middleware/
│   │   ├── requestContext.js    # istek kimliği + erişim günlüğü
│   │   ├── security.js          # helmet, CORS beyaz listesi, hız sınırı
│   │   ├── auth.js              # authenticate / requireRole
│   │   ├── validate.js          # Zod ile istek doğrulaması
│   │   └── errors.js            # 404 ve merkezî hata yakalayıcı
│   ├── schemas/requests.js      # istek şemaları
│   ├── services/roomsService.js # oda okuma servisi (herkese açık kolonlar)
│   ├── routes/                  # health · me · rooms
│   └── cli/mint-service-token.js# yerel deneme için servis tokenı üretir
└── test/api.test.js             # node:test ile uç nokta testleri
```

## Uç noktalar

| Yöntem | Yol | Kimlik doğrulama | Açıklama |
| --- | --- | --- | --- |
| GET | `/health` | Gerekmez | Süreç ayakta mı. `?deep=1` ile Supabase bağlantısı da kontrol edilir (kopuksa 503). |
| GET | `/v1/me` | Bearer | Tokenın sahibi ve sunucunun çözdüğü rol. |
| GET | `/v1/rooms` | Bearer | Oda listesi. `limit` (en fazla `MAX_PAGE_SIZE`), `offset`, `status=active\|all`. |
| GET | `/v1/rooms/:ref` | Bearer | Tek oda, yalnızca herkese açık kolonlar. |
| — | `/v1/**` diğer | — | Yoktur: finansal işlem uç noktaları bilinçli olarak eklenmemiştir. |

Tüm yanıtlar JSON'dur; hata yanıtı `{ "error": { "code", "message", "requestId", "details?" } }` biçimindedir.
Her yanıtta `x-request-id` başlığı bulunur (Cloud Run günlüklerinde aramak için kullanın).

## Kimlik doğrulama ve yetkilendirme

`AUTH_MODE` iki tür token kabul eder:

1. **Kullanıcı tokenı (`supabase`)** — Supabase Auth'un ürettiği JWT.
   İmza `SUPABASE_JWKS_URL` (asimetrik, önerilen) veya `SUPABASE_JWT_SECRET` (HS256) ile doğrulanır;
   `aud` (varsayılan `authenticated`) ve `exp` kontrol edilir. Kullanıcı kimliği `sub` alanından gelir.
2. **Servis tokenı (`service`)** — Base44 arka ucunun `GAME_API_KEY` ile imzaladığı kısa ömürlü HS256 tokenı
   (`iss: base44-app`, `aud: game-api`, `sub: <kullanıcı kimliği>`). Tarayıcıya verilmez, yalnızca sunucular arasında kullanılır.

Yetkilendirme kuralları:

- **Rol her zaman veritabanından okunur** (`USERS_TABLE.role`), token içindeki role güvenilmez.
- Veritabanı sorgusu başarısız olursa token rolü kullanılır ve bu **en fazla `user`** olur; böylece bir kesinti yetki yükseltmesine dönüşmez.
- `requireRole('admin', ...)` yardımcısı ile uç noktalara rol kısıtı eklenebilir (mevcut uç noktalar yalnızca oturum açmış kullanıcı ister).
- Rol önbelleği `ROLE_CACHE_TTL_MS` kadar tutulur.

İstek doğrulaması: her uç noktanın parametre/sorgu/gövde şeması Zod ile tanımlanır; şemaya uymayan istek `400` ve alan bazlı hata listesiyle reddedilir.

## Ortam değişkenleri

Tümü `.env.example` dosyasında açıklamalıdır. Zorunlu olanlar:

| Değişken | Açıklama |
| --- | --- |
| `SUPABASE_URL` | Ayna Supabase projesinin adresi. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yalnızca sunucuda tutulan anahtar (Secret Manager). |
| `GAME_API_KEY` | Servis tokenlarını imzalayan paylaşılan anahtar, en az 32 karakter (Secret Manager). |
| `SUPABASE_JWKS_URL` **veya** `SUPABASE_JWT_SECRET` | Kullanıcı tokenlarını doğrulamak için en az biri. |

Yapılandırma eksik veya geçersizse süreç **başlamaz** ve günlüğe eksik alanları tek satırda yazar.
Bu kasıtlıdır: yanlış yapılandırmayla açılan bir API, sessizce yanlış çalışan bir API'den iyidir.

## Yerel çalıştırma

```bash
cd game-api
npm install
cp .env.example .env      # değerleri doldurun
npm run dev               # http://localhost:8080

# sağlık kontrolü
curl -s localhost:8080/health
curl -s "localhost:8080/health?deep=1"   # Supabase bağlantısını da kontrol eder

# servis tokenı üretip uç noktaları deneyin
TOKEN=$(npm run --silent mint-token -- --user 11111111-1111-1111-1111-111111111111 --role user)
curl -s localhost:8080/v1/me -H "Authorization: Bearer $TOKEN"
curl -s "localhost:8080/v1/rooms?limit=5" -H "Authorization: Bearer $TOKEN"
```

Testler: `npm test` (ağa çıkmaz, gerçek sır kullanmaz).

> Not: `/v1/rooms` uç noktasının çalışması için `ROOMS_TABLE`, `ROOMS_ID_COLUMN`, `ROOMS_PUBLIC_COLUMNS` gibi
> değişkenlerin **kendi Supabase ayna şemanıza** göre ayarlanması gerekir. Bunlar ayarlanmadan `/health` ve `/v1/me`
> sorunsuz çalışır; oda uç noktaları boş liste ya da `503` dönebilir.

## Google Cloud Run'a dağıtım

### 1) Proje, bölge ve API'ler

```bash
export PROJECT_ID="<gcp-proje-id>"
export REGION="europe-west1"
export SERVICE="game-api"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com cloudbuild.googleapis.com
```

### 2) Sırları Secret Manager'a yükleyin (koda veya imaja asla yazmayın)

```bash
# Değerleri kendi güvenli kaynağınızdan yapıştırın.
printf '%s' "<supabase-service-role-key>" | gcloud secrets create game-api-supabase-key --data-file=-
printf '%s' "<en az 32 karakter rastgele jwt doğrulama anahtarı>" | gcloud secrets create game-api-jwt-secret --data-file=-
printf '%s' "<en az 32 karakter rastgele servis anahtarı>" | gcloud secrets create game-api-service-key --data-file=-

# Anahtar rotasyonu için sonraki sürümler:
# gcloud secrets versions add game-api-supabase-key --data-file=-
```

Cloud Run servis hesabına bu sırları okuma izni verin:

```bash
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
for S in game-api-supabase-key game-api-jwt-secret game-api-service-key; do
  gcloud secrets add-iam-policy-binding "$S" \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

### 3) Dağıtım (Dockerfile ile, kaynaktan)

```bash
gcloud run deploy "$SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 --memory 256Mi --concurrency 80 \
  --min-instances 0 --max-instances 4 \
  --timeout 30 \
  --set-env-vars "NODE_ENV=production,SUPABASE_URL=https://<proje-ref>.supabase.co,SUPABASE_SCHEMA=public,SUPABASE_JWKS_URL=https://<proje-ref>.supabase.co/auth/v1/.well-known/jwks.json,SUPABASE_JWT_AUDIENCE=authenticated,AUTH_MODE=both,ROLE_LOOKUP_ENABLED=true,USERS_TABLE=users,ROOMS_TABLE=rooms,CORS_ORIGINS=https://ag-sohbet.base44.app,RATE_LIMIT_MAX=120" \
  --set-secrets "SUPABASE_SERVICE_ROLE_KEY=game-api-supabase-key:latest,SUPABASE_JWT_SECRET=game-api-jwt-secret:latest,GAME_API_KEY=game-api-service-key:latest"
```

`--allow-unauthenticated` yalnızca Cloud Run'ın kendi IAM kapısını açar; API'nin kendi Bearer doğrulaması
`/v1/**` uç noktalarını korumaya devam eder (`/health` kasıtlı olarak açıktır).
Yalnızca Base44 arka ucu erişecekse bunun yerine `--no-allow-unauthenticated` kullanın; çağıran tarafın
Cloud Run kimliğiyle (ID token) erişmesi gerekir.

Alternatif olarak Cloud Build ile:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=europe-west1,_REPO=cloud-run-source-deploy,_SUPABASE_URL=https://<proje-ref>.supabase.co
```

### 4) Dağıtım sonrası doğrulama

```bash
URL=$(gcloud run services describe "$SERVICE" --region "$REGION" --format='value(status.url)')

curl -s "$URL/health"                 # {"ok":true, ...}
curl -s "$URL/health?deep=1"          # Supabase bağlantısı: up/down
curl -s -o /dev/null -w '%{http_code}\n' "$URL/v1/me"          # 401
TOKEN=$(npm run --silent mint-token -- --user <kullanıcı-uuid>)
curl -s "$URL/v1/me" -H "Authorization: Bearer $TOKEN"          # 200
```

Günlükler: `gcloud run services logs read "$SERVICE" --region "$REGION" --limit 50`
(uygulama günlükleri JSON'dur ve `requestId` alanı taşır).

### 5) Dağıtım işaret listesi

- [ ] `SUPABASE_SERVICE_ROLE_KEY` ve `GAME_API_KEY` yalnızca Secret Manager'da; imajda veya depoda yok.
- [ ] `CORS_ORIGINS` yalnızca gerçek uygulama adresini içeriyor (`*` kullanmayın).
- [ ] `--max-instances` sınırlı (ani maliyet artışını engeller).
- [ ] Yeni bir Supabase projesinde hız sınırı için ayrı bir okuma rolü planlandı.
- [ ] `gcloud run services describe` çıktısında gereksiz ortam değişkeni yok.

## Finansal işlemler kilidi

Coin bakiyesi okuma/yazma, bahis kesintisi, bakiye transferi ve para çekme uç noktaları bu API'de **yoktur**.
`config.js` iki koşul birlikte sağlanmadan finansal işlemleri açmaz:

```
FINANCIAL_OPERATIONS_ENABLED=true
FINANCIAL_LEGAL_REVIEW_APPROVED=true   # yasal uygunluk + güvenlik incelemesi tamamlandı
```

İki bayraktan biri eksikse süreç başlamaz ve `/health` yanıtındaki `features.financialOperations`
her zaman `false` görünür. Bu, gerçek parayla oynanan oyunlarda yasal uygunluk ve güvenlik incelemesi
tamamlanmadan finansal işlem yapılmaması kuralının koddaki karşılığıdır.

## Bilinçli olarak yapılmayanlar (sonraki adımlar)

- Mevcut oyunların isteklerini bu API'ye yönlendirmek **yapılmadı**; uygulama ve oyunlar değişmedi.
- Veritabanı tabloları/kolonları değiştirilmedi, yeni tablo oluşturulmadı.
- Coin bakiyesi ve para çekme akışları eklenmedi.
- Oyun motorları (zar, okey, rulet...) bu API'ye taşınmadı; `/v1` altında yalnızca salt okunur uçlar var.

Sıradaki adımlar önerisi: (1) ayna şemaya göre `ROOMS_*` değişkenlerini netleştirip oda uçlarını doğrulamak,
(2) Base44 arka ucunda servis tokenı üretip yalnızca bir "canary" oyunu bu API'ye bağlamak,
(3) finansal akışları ancak yasal inceleme sonrası ayrı bir serviste açmak.

## Sorun giderme

| Belirti | Neden / çözüm |
| --- | --- |
| Süreç hiç başlamıyor, günlükte `Ortam değişkenleri geçersiz` | Eksik/yanlış değişken. Günlükteki liste, ilgili değişkeni gösterir. |
| `/health?deep=1` → `503`, `supabase: "down"` | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` yanlış ya da `USERS_TABLE` mevcut değil. |
| `/v1/me` → `401` | `Authorization: Bearer <token>` başlığı yok/bozuk; token süresi dolmuş; `AUTH_MODE` bu token türünü kabul etmiyor. |
| `/v1/me` → rol `user` beklenirken `admin` | Rol veritabanından okunur: `ROLE_LOOKUP_ENABLED=false` iken token rolü kullanılır. |
| `/v1/rooms` → `503` | `ROOMS_TABLE` / kolon adları ayna şemayla uyuşmuyor. |
| Tarayıcıdan CORS hatası | `CORS_ORIGINS` içine tam kaynak adresi (`https://...`) eklenmeli. |
| `429 RATE_LIMITED` | `RATE_LIMIT_MAX` artırılabilir; sınır örnek başına uygulanır (çok örnekli yapıda toplam sınır örnek sayısıyla çarpılır). |