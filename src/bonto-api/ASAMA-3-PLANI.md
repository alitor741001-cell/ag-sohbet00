# AŞAMA 3 PLANI — SOHBET, SESLİ ODALAR, OYUNLAR

Bu belge **yalnızca analiz ve planlama** içerir. Hiçbir dosya silinmedi, hiçbir
dağıtım yapılmadı, veritabanına dokunulmadı, canlı trafik Bonto'ya yönlendirilmedi.

Öncelik sırası: **1) sohbet mesajları → 2) sesli odalar ve LiveKit uyumu → 3) oyunlar ve coin işlemleri.**

---

## 1. Doğrulanan mevcut durum

### Base44 (canlı, çalışıyor)

| Alan | Kanıt |
| --- | --- |
| Oda mesajı | `send-room-message` (84 satır): katılımcı kontrolü (IDOR), `chat_enabled`, `chat_seated_only`, 15 mesaj/30 sn hız sınırı, küfür filtresi (Report kaydı), XSS temizliği, gizli kullanıcı (VIP10+), XP, Supabase aynası |
| Özel mesaj | `dm-service` (293 satır), 12 işlem: start/send/history/delete_conversation/delete_message/mark_read/typing + okundu, çevrimdışı, rahatsız etme, arama ayarları; geçmiş **Supabase aynasından** okunur, ayna boşsa kaynaktan |
| Mesaj tekrar önleme | İstemci: `seenRef` (id tabanlı), `temp-` mesaj eşleştirme, `sortMessages`; realtime tek bağlantı |
| Sesli oda | `voice-room` (559 satır) 25 işlem: koltuk al/ayrıl/kilit/sustur/indir, koltuk sayısı, davet, hediye (K bakiyesi), sayı tahtası, sohbet yasağı, oda müziği |
| Oda yaşam döngüsü | `room-presence` (46 çağrı) 22 işlem: get/join/leave/kick/ban/unban, şifre, isim, anons, kategori, gizle, ses aç/kapat, mod ver/al, oda sil |
| Canlı ses (LiveKit) | `livekitToken`: katılımcı/sahip/admin doğrulaması + `voice_enabled` şartı, 2 saatlik token, oda adı `filmkeyfi-<roomId>` |
| Oda şifresi | `create-room`: şifre `RoomSecret` içinde tuzlu SHA-256, oda kaydında yalnızca `'protected'` |
| Oyunlar | **12 oyun, 12 arka uç fonksiyonu**: slot, meyve, dede, şeker, şekerli meyve, elimin, rocket, rulet, futbol, 101 okey, okey klasik, zar, mafya (istemci ekranı + sunucu fonksiyonu eşleşiyor) |
| Coin | `GameWallet` tek kaynak; yalnızca `asServiceRole` yazar (RLS: create/update admin), istemci bakiyeyi doğrudan değiştiremez; `loadWallet` sunucuda |
| Tur bazlı tekrar koruması | Rulet/Zar: aynı `round_no` + `user_id` için kayıt varsa işlem tekrar çalışmaz, ilk sonuç döner |

### Bonto (ölçüldü — hazır değil)

- Var olan uçlar: `/health` (200, `status`+`message`), `/health/ready` (200, `ok`+`apiReady`+`features`), `/v1/ping` (200, `ok`+`message`), `/v1/test/odalar` (200, `ok`+`canliVeri:false`+`odalar`), `/api/rooms` (200).
- **Yok**: `/v1/sozlesme` (404) ve canlı oda/mesaj/oyun ucu — hiçbiri yok.
- Canlı yanıt şekilleri depodaki Aşama 1 koduyla **örtüşmüyor** → canlıda başka/eskı bir kod tabanı çalışıyor.
- Bonto'da yaşayan veri yok: oda, mesaj, hediye, coin, oyun tabloları bağlı değil.

---

## 2. Tablo

### 2.1 Sohbet mesajları (öncelik 1)

| Özellik | Base44'te çalışıyor mu? | Bonto'da gerçekten hazır mı? | Eksik olanlar | Güvenli geçiş için sonraki adım |
| --- | --- | --- | --- | --- |
| Oda mesajı gönderme | Evet | **Hayır** (uç yok) | Bonto'da mesaj ucu + `room_messages` tablosu; `request_id` tekrar koruması (entity'de alan var, sunucu üretmiyor); aynı hız sınırı ve küfür filtresi | `oda.mesaj.gonder` sözleşmesi + `request_id` zorunluluğu; Base44 akışı değişmeden kalır |
| Oda mesajı listeleme/sıralama | Evet (realtime abonelik) | **Hayır** | Bonto'da sayfalı okuma ucu (cursor) + sıra garantisi (`created_date`, `id`) | Salt okunur ayna ucu; istemci yalnızca okuma için dener |
| Özel mesaj gönderme | Evet | **Hayır** | Bonto ucu; gönderim idempotency (`request_id`); ücret/engel kurallarının sunucuda kalması | `ozel.mesaj.gonder` politikası + `anahtarUret`/`islemCalistir` bağlama |
| Özel mesaj geçmişi | Evet (Supabase aynasından) | **Hayır** | `chat_messages` tablosu + `payload` JSON yapısı | Ayna ucu; ayna boşsa kaynağa düşme davranışı korunur |
| Okunma durumu | Evet (`read_by`, `Conversation.unread_*`) | **Hayır** | Unread sayacının **tek atomik yazımla** güncellenmesi | `mark_read` ucu idempotent olmalı (aynı çağrı sayaç bozmaz) |
| Tekrar mesaj oluşması | Evet — istemci `seenRef` + optimistik eşleştirme | **Hayır** | Sunucu tarafı tekilleştirme; iki cihazdan eşzamanlı gönderim | Sunucu `request_id` ile tek kayıt; istemci davranışı korunur |
| Typing / çevrimdışı / DND | Evet | **Hayır** | Bonto'da karşılık yok; WebSocket yok | Bu ayarlar Aşama 4'e bırakılır (şimdilik Base44'te kalır) |

### 2.2 Sesli odalar ve LiveKit (öncelik 2)

| Özellik | Base44'te çalışıyor mu? | Bonto'da gerçekten hazır mı? | Eksik olanlar | Güvenli geçiş için sonraki adım |
| --- | --- | --- | --- | --- |
| Oda oluşturma | Evet (`create-room`, şifre hash'li) | **Hayır** | Bonto'da oda ucu/tablosu yok | `oda.olustur` sözleşmesi; şifre hash'i sunucuda kalır |
| Odaya katılma / ayrılma | Evet (`room-presence`) | **Hayır** | Katılım listesi, son katılımcılar, yasak kontrolü | `oda.koltuk.al` + katılım ucu tasarımı |
| Oda kilitleme / gizleme | Evet (koltuk kilidi, `hidden`, şifre) | **Hayır** | Sunucu tarafı yetki (sahip/mod) | `oda.guncelle` politikası + sahiplik (`oda.sahip_id`) |
| Mikrofon durumu | Evet (koltuğa özel `seat-mute`, LiveKit grant) | **Hayır** | Bonto'da mikrofon kavramı yok; **ses LiveKit'te kalır** | Bonto'ya ses yetkisi verilmez; yalnızca durum aynası tasarlanır |
| Oda sahibi / moderatör | Evet (`assign-mod`, `remove-mod`, `room_moderators`) | **Hayır** | Rol eşlemesi: `room_moderator`, `agency_owner` | `api-yetki.js` politikaları hazır; uç yok |
| Kullanıcı atma / yasak | Evet (`kick`, `ban` 24 saat, `banned_users`) | **Hayır** | Ban kaydı + süre kontrolü sunucuda | `oda.banla` (denetim kaydı zorunlu) + `banned_users` tablosu |
| LiveKit ses konuşması | Evet (korunuyor) | Kapsam dışı | — | **Değiştirilmez.** Bonto yalnızca metin durum tutar |
| Sayı tahtası / hediye / müzik | Evet (`voice-room`) | **Hayır** | Bonto'da karşılık yok | Aşama 4'e bırakılır |

### 2.3 Oyunlar ve coin işlemleri (öncelik 3)

| Özellik | Base44'te çalışıyor mu? | Bonto'da gerçekten hazır mı? | Eksik olanlar | Güvenli geçiş için sonraki adım |
| --- | --- | --- | --- | --- |
| Slot (249 satır) | Evet | **Hayır** | `request_id` idempotency; oyun hız sınırı | Aşama 3D-1: bakiye yazımını `islemCalistir` içine al |
| Şeker (129) / Şekerli meyve (108) / Meyve (129) | Evet | **Hayır** | Aynı | Aşama 3D-1 |
| Dede (139) | Evet | **Hayır** | Aynı | Aşama 3D-1 |
| Elimin (231) | Evet | **Hayır** | Aynı | Aşama 3D-1 |
| Rulet (124) | Evet | **Hayır** | Tur bazlı koruma var; `request_id` yok | Aşama 3D-2: turu Bonto'da üretme tasarımı |
| Zar (123) | Evet | **Hayır** | Tur bazlı koruma var; `request_id` yok | Aşama 3D-2 |
| Rocket (486) | Evet | **Hayır** | Havuz/yörünge durumu Bonto'da yok | Aşama 3D-3 (en karmaşık) |
| Futbol (233) | Evet | **Hayır** | Aynı | Aşama 3D-3 |
| 101 Okey (731) / Okey klasik | Evet | **Hayır** | Taş dağıtımı, sıra, `OkeySecret`; çok kiracılı oda | Aşama 3D-4 (en büyük) |
| Mafya (536) | Evet | **Hayır** | Rol dağıtımı, gece/gündüz, oylama; `MafyaSecret` | Aşama 3D-4 |
| Coin bakiyesi okuma | Evet (`GameWallet`, sunucu) | **Hayır** | Bonto'da cüzdan tablosu yok | Ayna okuma; yazma açılmaz |
| Coin düşme / kazanç | Evet — sunucu tarafı, RLS ile istemciye kapalı | **Hayır** | Atomik koşullu düşme (`bakiyeDus` hazır), hareket kaydı (`hareketYaz` hazır) | Aşama 3D-0: cüzdan yazımını tek transaction'a al |
| Tekrar işlem koruması | **Kısmi** — tur bazlı; `request_id` hiçbir oyun fonksiyonunda yok | **Hayır** | `api-idempotency.js` bağlanmalı | Her oyun yazımı `request_id` ile |
| Oyun denetim kaydı | Var (`RouletteSpin`, `ZarBet`, `RocketBet`, `GameSpin`, Supabase aynası) | **Hayır** | `denetim_kayitlari` yalnızca şemada | `denetimKaydiOlustur` ile zorunlu kıl |

### 2.4 Güvenlik ve geçiş

| Konu | Durum | Sonraki adım |
| --- | --- | --- |
| Kullanıcı tokenı ↔ servis anahtarı ayrımı | **Hazır** (`api-kullanici-token.js` 21/21 test geçiyor) | Canlıda doğrulama **kapalı** kalır |
| Kullanıcı token doğrulaması | Yazıldı, hiçbir canlı akışa bağlı değil | Bonto'ya kurulduktan sonra yalnızca salt okunur uçla denenir |
| Gizli değerler | Kodda/yanıtta yok (test anahtarları sahte) | Değer yalnızca ortam değişkeninde |
| SQL şeması | Taslak; **çalıştırılmadı** | DB türü/sürümü + yedek doğrulanmadan çalıştırılmaz |
| Karşılaştırmalı test | `test-token-ayrim.js` + `TOKEN-TUR-TEST-PLANI.md` hazır | Aşama 3 için aynı yaklaşımla test listesi |

---

## 3. Aşamalı plan (her adım kapılı)

| Aşama | İş | Kapı (geçilmeden sonrakine başlanmaz) |
| --- | --- | --- |
| **A** | Sohbet sözleşmesi: oda mesajı + özel mesaj (gönder, geçmiş, okundu) — yalnızca tasarım | Sözleşme yazılı ve hız sınırı/tekrar koruması tanımlı |
| **B** | Bonto'da `request_id` idempotency + denetim kaydı altyapısı (dosyalar hazır) | Aynı istek iki kez: tek kayıt |
| **C** | Kullanıcı tokenı doğrulaması devrede | `test-token-ayrim.js` 21/21 + canlıda `Bearer` 401→200 kontrolü |
| **D** | Sesli oda durum aynası (katılım, koltuk, mod, yasak) — **ses LiveKit'te kalır** | Base44 davranışı birebir aynı |
| **E** | Oyunlar tek tek: 3D-0 cüzdan/transaction → 3D-1 basit slot grubu → 3D-2 tur bazlı (rulet, zar) → 3D-3 rocket/futbol → 3D-4 okey/mafya | Her oyun için ayrı karşılaştırma testi |

**Kural:** hiçbir aşamada Base44 trafiği yönlendirilmez; Bonto yalnızca **yansı** olarak yazılır/okunur. Yazma açılışı en son ve tek oyunla denenir.

## 4. Yasaklar (bu aşamada)

- Base44'te mevcut giriş, profil, oda, arkadaş, DM, hediye, coin ve oyun kodunu değiştirmek/silmek.
- LiveKit yapılandırmasına, sesli odaya veya `livekitToken` akışına dokunmak.
- Bonto'da var olmayan uçları çağırmak veya varmış gibi göstermek.
- `sema-v1.sql` çalıştırmak (DB türü doğrulanmadı).
- Kullanıcı trafiğini Bonto'ya yönlendirmek; kullanıcı token doğrulamasını canlıya açmak.

## 5. Açık sorular (cevap gelmeden ilerlenmez)

1. Canlı `ag-sohbet.bonto.run` hangi kod tabanını çalıştırıyor? Depodaki Aşama 1 dosyaları orada mı?
2. Bonto'da veritabanı var mı; türü ve sürümü ne? (Yalnızca PostgreSQL sürücüsü varsayımı yapıldı.)
3. Oyunlar için hedef: Bonto'da **tam oyun motoru** mu kurulacak, yoksa yalnızca **bakiye + kayıt** mı tutulacak? (İkincisi çok daha güvenli ve hızlı.)