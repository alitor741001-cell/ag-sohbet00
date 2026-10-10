# AŞAMA 2 — CÜZDAN, JETON (COİN) VE HEDİYE SÖZLEŞMESİ

**Durum: tasarım.** Hiçbir uç açılmadı, hiçbir tablo oluşturulmadı, hiçbir istek Bonto'ya
gitmiyor. Base44 tek kaynak olmaya devam ediyor. **Bağımlılık:** Aşama 1'in 9 kapı testi
geçmeden bu aşamanın hiçbir parçası canlıya alınmaz.

Bu sözleşme, depoda **hazır bekleyen** güvenlik katmanını (politika + idempotency + denetim)
ve şemadaki mevcut tabloları kullanır; yeni güvenlik mekanizması icat etmez.

---

## 1. Değişmezler (hiçbir koşulda ihlal edilmez)

1. **Bakiye yalnızca sunucuda değişir.** İstemciden gelen bakiye, jeton miktarı, hediye K
   değeri veya indirim kabul edilmez; gövdedeki bu alanlar yok sayılır.
2. **Jeton değeri sunucuda hesaplanır.** İstemci yalnızca *hangi hediye* ve *kaç adet*
   gönderdiğini söyler; K katsayısı sunucudaki `hediye_katalogu` kaydından okunur.
3. **Her yazma işlemi `request_id` ister** (idempotency). Aynı `request_id` ile ikinci istek
   yeni işlem yaratmaz; ilk yanıt aynen döner.
4. **Aynı `request_id` farklı gövdeyle** gelirse → **409 TEKRAR_KULLANIM** (istek numarası
   başka bir istekle kullanılmış).
5. **Atomik koşullu düşme:** bakiye güncellemesi koşullu tek SQL ifadesidir; yetersiz bakiyede
   hiçbir satır etkilenmez ve **hiçbir yazma yapılmaz**.
6. **Bakiye negatife düşemez** — hem uygulama katmanında hem şemada:
   `cuzdanlar.bakiye numeric(18,2) CHECK (bakiye >= 0)`.
7. **Her işlem iki kayıt üretir:** `cuzdan_hareketleri` (bakiye_sonrasi ile) ve
   politika `denetim: 'zorunlu'` ise `denetim_kayitlari`.
8. **Mutabakat kuralı:** bir cüzdanın hareket toplamı, bakiyesine eşit olmalıdır.
9. **Para birimi tek:** jeton (coin). Elmas ayrı cüzdan değildir (bkz. §6).
10. **Kilitli modül:** özellik bayrağı kapalıyken ilgili uç **503** döner (sessizce çalışmaz).

## 2. Uçlar ve politika eşlemesi

Politika anahtarları depoda **zaten tanımlı**; uçlar bunlara bağlanır:

| Bonto ucu | Politika anahtarı | Kimlik | Rol | Yazma | Denetim | Kilitli |
| --- | --- | --- | --- | --- | --- | --- |
| `GET /v1/cuzdan` | — (okuma) | user | kullanıcı/yayıncı | — | — | — |
| `GET /v1/cuzdan/hareketler` | — (okuma, yalnız kendi) | user | kullanıcı/yayıncı | — | — | — |
| `POST /v1/hediye/gonder` | `hediye.gonder` | user | kullanıcı/yayıncı | ✔ | **zorunlu** | ✔ |
| `POST /v1/cuzdan/talep` | `cuzdan.talep` | user | kullanıcı/yayıncı | ✔ | — | — |
| `POST /v1/admin/cuzdan/duzeltme` | `cuzdan.duzeltme` | user | **yönetici** | ✔ | **zorunlu** | — |
| `POST /v1/oyun/aksiyon` | `oyun.aksiyon` | user | kullanıcı/yayıncı | ✔ | **zorunlu** | ✔ |
| `POST /v1/servis/cuzdan/ayna` | `servis.ayna` | **service** | — | ✔ | **zorunlu** | — |

Yönetici işlemlerinde **rol, token claim'inden değil** veritabanından teyit edilir; kullanıcı
tokenı yönetici uçlarında **401** alır (servis anahtarı da kullanıcı uçlarında geçmez).

## 3. İstek akışı (sıra zorunlu)

Her yazma ucu için:

1. **Kimlik:** token doğrulanır (Aşama 1 kuralları) → `principal` oluşur.
2. **Politika:** `yetkiKontrol({ principal, policy, kaynak, ozellikAcik })` → kapalı devre;
   kural yoksa işlem yapılmaz.
3. **Tutar:** `tutarDogrula(tutar)` → pozitif, tam sayı, `TUTAR_UST_SINIR` (10.000.000) üstü reddedilir.
4. **Tekrar koruması:** `anahtarUret({ principal, islem, requestId, istekGovdesi })` →
   `islemCalistir({ depo, anahtar, islemFn })`.
   - İşlem tamamlanmışsa: **kaydedilmiş yanıt** döner (`tekrar: true`) — ikinci kez para gitmez.
   - İşlem sürüyorsa: kısa bekleme sonrası **409 TEKRAR_ISLENİYOR**.
   - Gövde farklıysa: **409 TEKRAR_KULLANIM**.
5. **Bakiye (tek işlem içinde):**
   ```sql
   UPDATE cuzdanlar SET bakiye = bakiye - $1, guncelleme = now()
    WHERE kullanici_id = $2 AND bakiye >= $1
    RETURNING bakiye;   -- etkilenen satır yoksa → 402 yetersiz bakiye
   ```
6. Alıcı tarafı (hediye) aynı işlem içinde artırılır.
7. `cuzdan_hareketleri` (gönderen + alıcı) ve `denetim_kayitlari` yazılır.
8. `islemCalistir` sonucu kaydedilir (yanıt gövdesi) → sonraki tekrarlar bu yanıtı alır.
9. Yanıt döner: `{ ok, bakiye, hareket_id, tekrar }`.

**Kritik sıra notu:** ödeme/düşme ile hediye dağıtımı **aynı transaction** içinde olmalıdır;
yarıya kalan işlem (para düştü, hediye gitmedi) kabul edilmez.

## 4. Hata kodları

| Durum | Kod |
| --- | --- |
| Yetersiz bakiye | **402** |
| Aynı `request_id` başka gövdeyle | **409** TEKRAR_KULLANIM |
| Aynı `request_id` hâlâ işleniyor | **409** TEKRAR_ISLENIYOR |
| Tutar geçersiz / üst sınır aşımı | **400** |
| Kullanıcı tokenı yönetici ucu / servis tokenı kullanıcı ucu | **401** |
| Rol yetersiz (banlı/askıda) | **403** |
| Özellik bayrağı kapalı | **503** |
| Politika tanımsız | **403** (kapalı devre) |
| Hız sınırı | **429** |

## 5. Tablolar (şemada hazır)

`cuzdanlar`, `cuzdan_hareketleri`, `idempotency_kayitlari`, `denetim_kayitlari`,
`hediye_katalogu`, `hediye_gonderimleri`, `buyuk_hediye_duyurulari`, `jeton_talepleri`.

- `cuzdan_hareketleri.bakiye_sonrasi` → mutabakat sorgusu bu alandan yürür.
- `idempotency_kayitlari` → `son_kullanma` indeksiyle temizlenir.
- Ayrı bir "kilitli bakiye" tablosu **yok**; gerekirse ayrı onayla eklenir.

## 6. Elmas ayrımı (önemli)

Base44'te elmas **ayrı bir cüzdan değildir**: `User.diamond_month` aylık sayacı ve ajans kotası
üzerinden yaşar. Aşama 2 kapsamında elmas **jeton cüzdanına karıştırılmaz**; aylık sayaç olarak
ayrı aynalanır (`kullanici_*` alanları + ajans tabloları). Karıştırma, bakiye mutabakatını bozar.

## 7. Hediye kataloğu ve fiyat tek kaynağı

Katalog ve K katsayıları **tek kaynakta (Base44)** tutulur; Bonto'ya **salt okunur kopya**
aktarılır. Kural:

- Bonto, katalog satırlarını **yalnızca okur**; Bonto'da fiyat düzenlenemez.
- Aktarım zamanlanmış görevle yapılır; katalog sürümü (versiyon) kaydı tutulur.
- Aktarım başarısızsa son başarılı sürüm kullanılır; **fiyat uydurulmaz**.

## 8. Hız sınırı ve kötüye kullanım

- Hediye gönderimi: kişi başı dakikalık üst sınır (depodaki `rateLimit` kullanılır).
- Aynı alıcıya art arda gönderimde üst üste binme kontrolü.
- Tek işlem üst sınırı: 10.000.000 jeton (`TUTAR_UST_SINIR`).
- Yönetici düzeltmesi tek başına kullanılamaz: her kayıt gerekçe + denetim kaydı ister.

## 9. Kapı testleri (canlıya açılmadan önce hepsi geçmeli)

| # | Test | Beklenen |
| --- | --- | --- |
| 1 | Yeterli bakiyeyle hediye | Düşer, alıcı artar, 2 hareket + 1 denetim kaydı |
| 2 | Yetersiz bakiye | **402**, hiçbir yazma yok, bakiye değişmez |
| 3 | Aynı `request_id` iki kez (aynı gövde) | **Tek** düşme, ikinci yanıt `tekrar: true` |
| 4 | Aynı `request_id`, farklı gövde | **409 TEKRAR_KULLANIM** |
| 5 | Eşzamanlı iki istek (tam bakiye sınırı) | Yalnız biri geçer; toplam bakiye korunur |
| 6 | İstemci K/tutar gönderirse | Yok sayılır; sunucu kendi K'sını uygular |
| 7 | Başka kullanıcının cüzdanını okuma | **403 / 404** (sahiplik) |
| 8 | Kullanıcı tokenı ile yönetici ucu | **401** |
| 9 | Servis anahtarı ile kullanıcı ucu | **401** |
| 10 | Her yazma için denetim kaydı | Politika `zorunlu` olanlarda kayıt **var** |
| 11 | Mutabakat sorgusu | Σ hareket = bakiye (tüm test hesaplarında) |
| 12 | Özellik bayrağı kapalı | **503**, yazma yok |
| 13 | Hız sınırı aşımı | **429** |
| 14 | Yarıda kesilen işlem (hata enjeksiyonu) | Ne bakiye ne hediye değişir (transaction) |

## 10. Geçiş ve geri dönüş

1. Bonto tarafı **salt okuma** aynasıyla başlar (bakiye/hareket okuma) — yazma kapalı.
2. Tek modül açılır: **hediye gönderimi** (en yüksek risk, en net kurallar).
3. Mutabakat: Base44 ↔ Bonto hareket toplamları karşılaştırılır; fark **0** olmalı.
4. Fark çıkarsa: bayrak kapatılır, Base44 tek kaynak olarak yazmaya devam eder.
5. Ancak mutabakat **0** kaldıktan sonra coin/oyun uçları açılır.

**Geri dönüş:** bayrağı kapatmak yeterlidir; veri taşınmadığı için geri alınacak veri yoktur.

## 11. Base44 tarafında değişiklik

Bu aşama için **Base44'te kod değişikliği gerekmez**: mevcut `gift-box`, `coin-request`,
`coin-admin` ve oyun fonksiyonları olduğu gibi çalışmaya devam eder. İsteğe bağlı iyileştirme
(ayrı onay ister): Base44 coin/oyun yazımlarına da `request_id` zorunluluğu eklemek — bu,
Base44 tarafında canlı davranışı değiştirdiği için bu aşamaya **dahil değildir**.

## 12. Sıradaki adım

Bonto API'nizde §2'deki okuma uçları (cüzdan + hareket) açılır ve §9'daki 14 test
çalıştırılır. Ardından **Aşama 3: sohbet mesajları ve özel mesajlar** sözleşmesi yazılır.