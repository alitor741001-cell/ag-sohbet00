# TAM SİSTEM ENTEGRASYON PLANI — BASE44 + BONTO

**Durum: yalnızca analiz, envanter ve planlama.** Hiçbir dosya silinmedi, hiçbir modül
canlıya alınmadı, veri taşınmadı, veritabanına dokunulmadı, canlı trafik yönlendirilmedi.
Bütün ifadeler koddan ve ölçümlerden gelir; tahmin yoktur. Ölçülemeyen yerler açıkça
"doğrulanmadı" olarak işaretlenmiştir.

---

## 1. Envanter (ölçüldü)

| Kalem | Sayı |
| --- | --- |
| Sayfa | 37 (`src/pages` + `admin/`, `agency/` alt klasörleri) |
| Bileşen | 371 (`.jsx`) |
| Entity | 66 (65'inde `rls` tanımlı; tanımsız olan yalnızca `User` — platformun yerleşik koruması) |
| Backend fonksiyonu | 53 klasör (platform kaydında 51; `face-verify` ve `zarrefcheck` kayıtlı değil) |
| Paylaşılan modül | 52 (`base44/shared`) |
| Zamanlanmış görev | 6 (`Oda Temizleme`, `Oda Temizleme 2`, `Admin Log Temizleme`, `Çerçeve Süresi Kontrol`, `Supabase Canlı Ayna`, `Supabase Tam Ayna`) |
| İstemciden çağrılan fonksiyon | 35 (en çok: `room-presence` 46, `dm-service` 20, `voice-room` 14, `friend-service` 11) |
| Canlı Bonto uçları | `/health`, `/health/ready`, `/v1/ping`, `/v1/test/odalar`, `/api/rooms` (hepsi 200) |

**Kritik ölçüm (güncel):** Canlı `ag-sohbet.bonto.run`, kullanıcının kendi yazdığı API'dir
(doğrulandı). Bugünkü durum:

- `/health` → `{"status":"ok","message":"API çalışıyor"}`
- `/health/ready` → `apiReady: true`, **beş özellik bayrağı da kapalı** (`liveRooms`, `messages`, `gifts`, `coins`, `games`)
- `/api/rooms` → `rooms: []` + *"oda veritabanı henüz bağlanmadı"* → **veritabanı bağlantısı yok**
- `/v1/sozlesme` → **404** (depodaki Aşama 1 uçları canlıda yok; iki kod tabanı ayrı)

Sonuç: **canlıda uygulama verisi taşıyan tek bir uç ve tek bir tablo yok**; çift yazma riski
bulunmuyor. Bonto hedef veritabanı **PostgreSQL (Supabase)**; depodaki `sema-v1.sql` (35 tablo)
PostgreSQL 13+ için yazılmış tasarımdır — hedefle uyumlu ama **henüz uygulanmadı**.

**Görev–fonksiyon eşleşmesi (doğrulandı):** `cleanup-rooms` (2 görev), `cleanup-admin-logs`,
`cleanup-frames`, `supabase-sync-full` zamanlanmış görevlerden çağrılır — "kullanılmıyor"
sanılmamalı. Bunların dışında hiçbir yerde geçmeyen **iki yetim fonksiyon** var:
`face-verify`, `zarrefcheck`. Silinmedi; yalnızca işaretlendi.

**İstemci yazma yolları (güvenlik açısından ölçüldü):**

- `GameWallet`: istemci **hiç dokunmuyor** — bakiye yalnızca sunucuda değişir. ✔
- `User`: istemci **doğrudan yazıyor** — `AdminUsers.jsx` üyelik durumu, `UserGenderDialog.jsx`
  cinsiyet. Bu yazımlar Bonto'da sunucu tarafına alınmalıdır.
- Hediye gönderiminde `request_id` **zaten kullanılıyor** (doğru örnek).
- Oyun fonksiyonlarının **hiçbirinde** `request_id` yok; koruma yalnızca tur bazlı
  (rulet/zar) ve oyunlarda hız sınırı hiç yok.

## 2. Modül tablosu

| Modül | Base44 durumu | Bonto durumu | Eksik işler | Güvenlik / veri riski | Geçiş için sonraki adım | Test yöntemi |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Kimlik doğrulama, oturum, roller | Çalışıyor (platform auth, oturum politikası, `User.role`, `custom_role`, `membership_status`; `admin-2fa` kapalı) | **Yok** | Bonto'da oturum/token ucu, rol okuma | **Kritik:** token↔servis ayrımı hazır ama canlıda kapalı; üyelik istemciden yazılıyor | Kullanıcı tokenı doğrulaması + rol okuma sözleşmesi (Aşama A) | `test-token-ayrim.js` 21/21; canlı `Bearer` → 401 kontrolü |
| 2. Profil, avatar, cinsiyet, yaş, seviye, rozet | Çalışıyor (`Profile`, `UserProfile`, `profile-summary`, `user-profile`, `update-profile`, XP/çerçeve/rozet bileşenleri) | **Yok** | Profil okuma + doğrulanmış yazma ucu | Orta: cinsiyet istemciden yazılıyor | Salt okunur profil aynası | Base44 ↔ Bonto alan karşılaştırması |
| 3. Coin: bakiye, yükleme, harcama, geçmiş, düzeltme | Çalışıyor (`GameWallet` sunucu, `coin-request`, `coin-admin`, `User.loaded_coins`) | **Yok** | Cüzdan tablosu, atomik düşme, hareket kaydı, idempotency | **Yüksek (para):** istemci cüzdana dokunamıyor ✔; oyunlarda `request_id` yok | 3D-0: cüzdanı tek işleme al | Aynı `request_id` iki kez → tek kayıt; bakiye toplamı değişmez |
| 4. Elmas | Çalışıyor ama **ayrı cüzdan değil**: `User.diamond_month` + dönem, ajans kotası üzerinden | **Yok** | Elmas geçmişi/harcama diye ayrı bir sistem yok | Orta: sayaç `agency.ts` içinde yazılıyor | Aylık sayaç olarak aynala | Dönem sınırı ve kota eşleşmesi |
| 5. Hediyeler (tekli/toplu/tahta/geçmiş) | Çalışıyor (`gift-box`, `giftDelivery`, `GiftSend`, `GiftTier`, hediye tahtası) | **Yok** | İdempotency (var, taşınmalı), denetim kaydı | **Yüksek:** K bakiyesi; `request_id` zaten kullanılıyor ✔ | Hediye yazımını idempotency + denetim ile taşı | Çift dokunuş → tek gönderim; bakiye tutarlı |
| 6. Sohbet: oda + özel mesaj | Çalışıyor (`send-room-message`, `dm-service` 12 işlem, realtime, Supabase aynası) | **Yok** | Mesaj uçları, okundu sayacı, sunucu tekilleştirme | Orta: IDOR + hız sınırı + küfür filtresi var ✔ | Mesaj sözleşmesi (Aşama A) | Gönderim/okuma/okundu karşılaştırması |
| 7. Arkadaşlar, takip, çevrimiçi, bildirimler, geçmiş | Çalışıyor (`friend-service`, `Friendship`, `FriendshipProgression`, `UserPresence`, `Notification`) | **Yok** | Uç yok | Düşük-orta | Sözleşme (Aşama D sonrası) | Rozet/okunmamış sayı eşleşmesi |
| 8. Sesli odalar + LiveKit | Çalışıyor (`voice-room` 25 işlem, `room-presence` 22 işlem, `livekitToken`) | **Yok — ve olmamalı** | Bonto'da yalnızca durum aynası; ses taşınmaz | **Yüksek risk:** sesi taşımak mevcut çalışan odayı bozar | Durum aynası tasarımı; LiveKit'e dokunulmaz | Oda akışı bozulmadı testi (katıl/otur/ayrıl) |
| 9. Admin paneli ve kullanıcı yönetimi | Çalışıyor (9 panel sayfası, `role-management`, `admin-notify`, `SecurityLog`, `AdminLog`) | **Yok** | Her yetkinin sunucu doğrulaması + denetim kaydı | **Kritik:** üyelik/cinsiyet istemciden yazılıyor | Admin yetkilerini `api-yetki.js` politikalarına bağla | Yetkisiz istek → 403; her admin işlemi denetim kaydı üretir |
| 10. Oyunlar (12) | Çalışıyor: zar, okey(2), futbol, rulet, slot, meyve, rocket, şeker, şekerli, dede, elimin | **Yok** | `request_id`, oyun hız sınırı, denetim kaydı | Orta-yüksek: sonuç sunucuda ✔; tekrar koruması kısmi | En son aşama; 3D-0 sonrası tek tek | Tur tekrarı → ödeme bir kez; bakiye farkı sıfır |
| 11. Ödemeler, paketler, abonelik, IBAN | **Kısmi:** `coin-request` + `coin-admin` + `Payment`/`PaymentMethod` + banka havalesi ekranı. **Shopier kodu yok**, **PayTR kodu yok** (Shopier anahtarları gizli değişkenlerde duruyor ama hiçbir kod kullanmıyor) | **Yok** | Sağlayıcı entegrasyonu, webhook, mutabakat | **Yüksek (para):** çalışan sağlayıcı yok; onay tamamen elle | Sağlayıcı kararı netleşmeden başlanmaz | Talep → onay → bakiye; çift onay engeli |
| 12. Ajans sistemi | Çalışıyor (`agency-service`, 7 sayfa, kota/komisyon, `QuotaTier`, `QuotaReward`) | **Yok** | Uç yok | Orta: kazanç yazımı `service` principal ile | Salt okunur rapor aynası | Kota/komisyon hesap karşılaştırması |
| 13. XP, seviye, VIP, çerçeve, görevler | Çalışıyor (XP, `UserXp`, `XpSettings`, `VipItem`, `SpecialFrame`). **Günlük ödül/görev modülü Base44'te de yok** | **Yok** | Görev/günlük ödül sistemi hiç yok | Düşük | Yalnızca mevcut XP/VIP aynalanır | Seviye/çerçeve eşleşmesi |
| 14. Altyapı: tablolar, fonksiyonlar, görevler, dosyalar | Çalışıyor; dosyalar özel/aleni depolamada | **Yok** | Bonto şeması doğrulanmadı | Orta: 2 yetim fonksiyon; SQL varsayımı | Şema doğrulanmadan SQL çalıştırılmaz | `node --check` + uç testi |
| 15. Supabase aynası ve performans | Çalışıyor: 2 ayna görevi, ağır okumalar aynadan | **Yok** | Tutarlılık denetimi | Orta-yüksek: üç kopya (Base44 + Supabase + Bonto) | Aynayı Bonto için referans al | Kayıt sayısı/özet karşılaştırması |

## 3. Güvenlik ve bakiye bütünlüğü (öncelik 1–2)

1. **Sunucu tarafı doğrulama:** bakiye, tutar, rol ve oyun sonucu istemciden kabul edilmez. `GameWallet` şu an doğru çalışıyor; Bonto'ya taşınırken aynı kural korunur.
2. **Tekrar koruması:** `request_id` hediye akışında var; coin, ödeme ve oyunlarda **yok**. Hedef: `api-idempotency.js` (`islemCalistir`) her yazma işlemine bağlanır.
3. **Kayıt tutma:** her para/hediye/oyun yazımı `denetim_kayitlari` satırı üretir (`denetimKaydiOlustur` hazır).
4. **Yetki:** politika tanımsızsa kapalı devre; rol claim'i tek başına yetki vermez; sahiplik kontrolü sunucuda.
5. **Kimlik ayrımı:** kullanıcı tokenı `typ=user` + `USER_TOKEN_SECRET`; servis anahtarı ayrı. Aynı anahtar kullanılırsa doğrulama kapalı (test edildi).
6. **İstemci yazımları:** `User` güncellemeleri (üyelik, cinsiyet) Bonto'da **sunucu ucu + denetim kaydı** olmalı; istemciye açık bırakılmaz.

## 4. Uygulama sırası (kapılı)

| Aşama | İş | Kapı |
| --- | --- | --- |
| **1** | Kimlik: kullanıcı tokenı doğrulaması + rol okuma | `test-token-ayrim.js` 21/21; canlıda `Bearer` reddediliyor |
| **2** | Para: cüzdan tek işlem, idempotency, denetim, hediye akışı | Aynı istek iki kez → tek kayıt; bakiye toplamı sabit |
| **3** | Sohbet: oda + özel mesaj, okundu, tekilleştirme | Mesaj akışı Base44 ile birebir |
| **4** | Sesli odalar: yalnızca durum aynası (ses LiveKit'te kalır) | Oda akışı bozulmadı |
| **5** | Admin: sunucu tarafı yetki + denetim kaydı | Yetkisiz istek 403; her işlem kayıtlı |
| **6** | Oyunlar: 3D-0 cüzdan → basit slotlar → tur bazlı → rocket/futbol → okey | Oyun başına ayrı karşılaştırma testi |
| **7** | Ödemeler (sağlayıcı kararı sonrası), ajans, diğer modüller | Mutabakat testi |
| **8** | Performans: gereksiz istek/sorgu ve yetim kod incelemesi | Ölçüm öncesi/sonrası karşılaştırma |

**Değişmez kural:** her aşamada Base44 tek kaynak olmaya devam eder; Bonto önce yalnızca
**okuma/ayna** olur. Yazma açılışı en son, tek modülle denenir; geri dönüş = yeni ucu kapat.

## 5. Yasaklar (onay alınmadan)

- Mevcut sayfa/bileşen/fonksiyon/entity silmek veya baştan yazmak.
- LiveKit, sesli oda veya `livekitToken` akışını değiştirmek.
- Bonto'ya veri yazmak, trafik yönlendirmek, kullanıcı tokenı doğrulamasını canlıya açmak.
- `sema-v1.sql` çalıştırmak (DB türü/sürümü doğrulanmadı).
- Supabase yapılandırmasını değiştirmek.
- Yetim görünen fonksiyonları doğrulamadan silmek.

## 6. Karara bağlananlar / açık kalanlar

**Karara bağlandı**

1. **Bonto hedefi: tam motor.** Bütün modüller Bonto'da tam olarak çalışacak şekilde planlanır.
   Tek istisna: **ses taşıma LiveKit'te kalır** — Bonto oda durumunu taşır, sesi taşımaz (teknik sınır).
2. **Bonto veritabanı: PostgreSQL (Supabase).** `sema-v1.sql` bu hedefle uyumlu; uygulanmadı.
3. **Canlı Bonto kodu: kullanıcının kendi API'si.** Depodaki Aşama 1 dosyaları canlıda yok;
   bayraklar kapalı, veritabanı bağlı değil.

**Açık kalan**

4. Bonto API'si hangi Supabase projesine bağlanacak — Base44 aynasının yazdığı proje ile **aynı mı**,
   ayrı mı? (Aynıysa ayna verisi Bonto için hazır referans olur.)
5. Ödeme sağlayıcısı (Aşama 7'de gerekli): Shopier anahtarları gizli değişkenlerde duruyor ama
   **hiçbir kod kullanmıyor**; PayTR kodu hiç yok; bölgede Stripe mevcut.
6. `face-verify` ve `zarrefcheck` kaldırılabilir mi, başka bir yerden çağrılıyor mu?

**Aşama 1 sözleşmesi ayrı dosyada:** `ASAMA-1-KIMLIK-SOZLESMESI.md`.