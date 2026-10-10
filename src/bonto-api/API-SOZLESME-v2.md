# BONTO API SÖZLEŞMESİ v2 (TASARIM)

Aşama 1 sözleşmesi (`API-SOZLESME.md`) ve `/v1/test/*` uçları **korunur**.
Bu belge, modüllerin ilerideki gerçek uçlarını tanımlar. Uçlar yazıldıkça
tek tek açılır; varsayılan olarak hepsi **kapalıdır**.

Sürüm öneki: `/v1`. Geriye dönük uyumsuz değişiklik yeni önek gerektirir.

## Ortak kurallar

**Başlıklar**

| Başlık | Zorunlu | Not |
| --- | --- | --- |
| `Authorization: Bearer <kullanıcı tokenı>` | kullanıcı uçlarında | `typ: 'user'` |
| `X-API-Key: <servis anahtarı>` | servis uçlarında | Kullanıcı uçlarında **reddedilir** |
| `X-Request-Id` | hayır | Yoksa sunucu üretir; yanıtta `requestId` döner |
| `Idempotency-Key` | yazma uçlarında (bakiye/hediye/oyun/admin) | `request_id` ile aynı değer |

**Sayfalama**: `?cursor=<opak>&limit=<1..100>`; yanıt `{ items, nextCursor, hasMore }`.
**Yanıt gövdesi**: `{ ok: true, ... }`; hatada ortak zarf (bkz. `ASAMA-2-MIMARI.md` §6).
**Yazma yanıtı**: idempotency tekrarında aynı gövde + `"tekrar": true`.

## Kimlik ve profil

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/me` | user | – | Kendi profili, seviye, çerçeve, rol |
| `GET /v1/users/:id` | user | – | Herkese açık profil (e-posta dönmez) |
| `PATCH /v1/users/:id` | user (kendi) | ✅ | Ad, avatar, cinsiyet, doğum yılı, biyografi |
| `GET /v1/users/:id/relations` | user | – | Arkadaşlık durumu, engel durumu |
| `POST /v1/presence/heartbeat` | user | ✅ | Çevrimiçi damgası (oda dahil/hariç) |
| `GET /v1/presence?ids=a,b,c` | user | – | Toplu çevrimiçi durumu |

## Sesli odalar

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/rooms` | user | – | Görünür odalar (gizli + davetli filtresi) |
| `POST /v1/rooms` | user (yayıncı) | ✅ | Oda oluştur (ad, tür, kapasite, parola, kategori) |
| `GET /v1/rooms/:id` | user | – | Oda, koltuklar, yetkililer, banlar (yetkiye göre alan kırpılır) |
| `PATCH /v1/rooms/:id` | sahip | ✅ | Ad, duyuru, sohbet ayarları, kilit, gizleme |
| `POST /v1/rooms/:id/join` \| `/leave` | user | ✅ | Katılma/ayrılma; kapasite ve ban kontrolü |
| `POST /v1/rooms/:id/seats/:no` | user | ✅ | Koltuk al; `DELETE` ile bırak |
| `POST /v1/rooms/:id/seats/:no/mute` | yetkili | ✅ | Sustur |
| `POST /v1/rooms/:id/moderators` | sahip | ✅ | Yönetici ata / kaldır |
| `POST /v1/rooms/:id/bans` | sahip / yönetici | ✅ | At, banla, engelle |
| `POST /v1/rooms/:id/close` | sahip / admin | ✅ | Odayı kapat |

> Ses akışı **LiveKit** üzerinden yürümeye devam eder. Bu uçlar yalnızca oda
> kaydını ve yetkileri yönetir; ses taşıma değişmez.

## Sohbet

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/rooms/:id/messages?since=<seq>&limit=` | user (görür) | – | Arttırımlı mesaj geçmişi |
| `POST /v1/rooms/:id/messages` | user (koltuk/yetki) | ✅ | Metin, dosya, hediye bildirimi |
| `POST /v1/rooms/:id/messages/read` | user | ✅ | Okundu işareti (`lastSeq`) |
| `GET /v1/dm/:userId/messages` | katılımcı | – | Özel mesaj geçmişi |
| `POST /v1/dm/:userId/messages` | katılımcı | ✅ | Özel mesaj gönder |
| `GET /v1/ws` | user | – | WebSocket yükseltmesi (yayın kanalı) |

## Hediye

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/gifts` | user | – | Katalog (ad, değer, görsel, animasyon) |
| `POST /v1/gifts/send` | user | ✅ zorunlu | Tek veya toplu gönderim; bakiye koşullu düşer |
| `GET /v1/gifts/board?room=:id` | user | – | Hediye tahtası (tur/toplam) |
| `GET /v1/gifts/history?userId=` | user (kendi) | – | Gönderim/alım geçmişi |

Gönderim gövdesi: `{ requestId, giftId, toUserIds[], quantity, roomId?, note? }`.
Yanıt: `{ ok, sent, totalK, balance, tekrar }`. Aynı `requestId` ikinci kez gelirse
**ikinci gönderim yapılmaz**.

## Jeton, bakiye ve ekonomi

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/wallet` | user | – | Bakiye, bekleyen talepler, özet |
| `GET /v1/wallet/ledger?cursor=` | user | – | İşlem geçmişi (yalnızca kendi) |
| `POST /v1/wallet/requests` | user | ✅ | Jeton talebi / banka havalesi bildirimi |
| `POST /v1/admin/wallet/adjust` | admin | ✅ zorunlu | Düzeltme; sebep + denetim kaydı zorunlu |

Değişmezler: bakiye **yalnızca** sunucu tarafında değişir; istemci tutar öneremez,
yalnızca ürün/talep seçer. Negatif bakiye imkânsız (koşullu düşme).

## Oyunlar

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/games` | user | – | Oyun listesi ve durumu |
| `GET /v1/games/:slug/state` | user | – | Tur durumu, bahis, süre |
| `POST /v1/games/:slug/action` | user | ✅ zorunlu | `bet`, `spin`, `play`, `action` (oyun başına) |
| `GET /v1/games/:slug/rounds?limit=` | user | – | Tur geçmişi |
| `POST /v1/games/:slug/room/join` | user | ✅ | Oyun odasına oturma |

Kurallar: her oyunun mevcut işleyişi aynen korunur (slot, fruit, dede, şeker,
şekerli, elimin, roket, rulet, futbol, okey, zar, mafya). Tur sonucu sunucu
tarafında üretilir, tek kez yazılır, `seq`/`tur_no` ile sıralanır.

## Seviye, rozet, çerçeve

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/level` | user | – | XP, seviye, sonraki eşik, rozetler |
| `GET /v1/frames` | user | – | Sahip olunan ve aktif çerçeveler |
| `POST /v1/frames/active` | user | ✅ | Aktif çerçeve seçimi |

## Ajans ve yayıncı

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/agencies` / `POST /v1/agencies` | user | ✅ | Liste / oluştur |
| `GET /v1/agencies/:id` | üye | – | Ajans bilgisi, üyeler, kotalar |
| `POST /v1/agencies/:id/invites` | sahip / asistan | ✅ | Davet gönder |
| `POST /v1/agencies/invites/:id/accept` \| `/reject` | davetli | ✅ | Davet yanıtı |
| `POST /v1/agencies/transfers` \| `/transfers/:id/approve` | sahip | ✅ | Devir talebi ve onayı |
| `GET /v1/agencies/:id/earnings` | sahip / asistan | – | Kazanç kayıtları |
| `GET /v1/quota/tiers` | user | – | Kota kademeleri ve ödüller |

Kazanç kayıtları para değeri taşır: sunucu tarafında hesaplanır, denetim kaydı zorunlu.

## Bildirim ve arkadaşlık

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/notifications?cursor=` | user | – | Bildirim listesi, okunmamış sayısı |
| `POST /v1/notifications/read` | user | ✅ | Okundu işareti |
| `GET /v1/friends` | user | – | Arkadaş listesi + çevrimiçi durumu |
| `POST /v1/friends/requests` | user | ✅ | İstek gönder |
| `POST /v1/friends/requests/:id/accept` \| `/reject` | alıcı | ✅ | Yanıtla |
| `DELETE /v1/friends/:id` | user | ✅ | Arkadaşlıktan çıkar / engelle |

## Ödeme ve abonelik

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/payments/packages` | user | – | Paketler (yalnızca sunucudan) |
| `POST /v1/payments/bank-transfer` | user | ✅ zorunlu | Havale bildirimi + dekont |
| `GET /v1/payments/history` | user | – | Kendi ödeme geçmişi |
| `POST /v1/admin/payments/:id/approve` \| `/reject` | admin | ✅ zorunlu | Onay/red + denetim kaydı |
| `GET /v1/subscription` | user | – | Abonelik durumu |

Gerçek para akışı en son aşamadır; sağlayıcı test modu ve mutabakat olmadan açılmaz.

## Yönetici ve denetim

| Uç | Yetki | Idempotent | Açıklama |
| --- | --- | --- | --- |
| `GET /v1/admin/users?cursor=` | admin | – | Kullanıcı listesi (sayfalı) |
| `POST /v1/admin/users/:id/role` | admin | ✅ zorunlu | Rol değişimi + denetim |
| `GET /v1/admin/rooms` | admin | – | Oda listesi, zorla kapatma |
| `GET /v1/admin/audit?cursor=` | admin | – | Denetim kayıtları |
| `GET /v1/admin/health` | admin | – | Şema sürümü, bağımlılık durumu |

## Test uçları (Aşama 1, korunur)

`/v1/test/odalar`, `/v1/test/mesajlar?oda=` statik örnek veri döndürmeye devam eder
ve `canliVeri: false` işaretini taşır. Bu uçlar hiçbir zaman canlı kaynak sayılmaz.