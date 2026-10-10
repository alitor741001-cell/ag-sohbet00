-- BONTO ŞEMA v1 (TASARIM) — PostgreSQL 13+ varsayımı
--
-- DİKKAT: Bu dosya yalnızca tasarımdır. Bonto'nun gerçek veritabanı ve sürümü
-- doğrulanmadan UYGULANMAZ (bkz. ASAMA-2-MIMARI.md §5 ve §10).
-- Aşama 2'de hiçbir canlı veri kopyalanmaz; tablolar boş kalır.

CREATE TABLE IF NOT EXISTS sema_surumu (
  surum         integer PRIMARY KEY,
  aciklama      text NOT NULL,
  uygulandi_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- kimlik
CREATE TABLE IF NOT EXISTS kullanicilar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id      text UNIQUE NOT NULL,          -- Base44 kullanıcı kimliği (eşleştirme anahtarı)
  takma_ad       text NOT NULL,
  avatar_url     text,
  cinsiyet       text,
  dogum_yili     integer,
  biyografi      text,
  rol            text NOT NULL DEFAULT 'user',
  seviye         integer NOT NULL DEFAULT 1,
  xp             integer NOT NULL DEFAULT 0,
  durum          text NOT NULL DEFAULT 'active', -- active | banned | deleted
  olusturma      timestamptz NOT NULL DEFAULT now(),
  guncelleme     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS kullanicilar_rol_idx ON kullanicilar (rol);
CREATE INDEX IF NOT EXISTS kullanicilar_takma_ad_idx ON kullanicilar (lower(takma_ad));

CREATE TABLE IF NOT EXISTS kullanici_cerceveleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  cerceve_kodu   text NOT NULL,
  kaynak         text NOT NULL DEFAULT 'satin_alma',
  baslangic      timestamptz NOT NULL DEFAULT now(),
  bitis          timestamptz,
  aktif          boolean NOT NULL DEFAULT false
);
CREATE UNIQUE INDEX IF NOT EXISTS kullanici_cerceveleri_tek_aktif
  ON kullanici_cerceveleri (kullanici_id) WHERE aktif;

CREATE TABLE IF NOT EXISTS seviye_ayarlari (
  seviye         integer PRIMARY KEY,
  gerekli_xp     bigint NOT NULL,
  rozet_kodu     text,
  xp_carpani     numeric(6,2) NOT NULL DEFAULT 1.00
);

-- ---------------------------------------------------------------- sosyal
CREATE TABLE IF NOT EXISTS arkadasliklar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  hedef_id       uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  durum          text NOT NULL DEFAULT 'pending', -- pending | accepted | blocked
  ilerleme_puan  integer NOT NULL DEFAULT 0,
  olusturma      timestamptz NOT NULL DEFAULT now(),
  guncelleme     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT arkadasliklar_farkli CHECK (kullanici_id <> hedef_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS arkadasliklar_cift_idx
  ON arkadasliklar (least(kullanici_id, hedef_id), greatest(kullanici_id, hedef_id));

CREATE TABLE IF NOT EXISTS kullanici_durumlari (
  kullanici_id   uuid PRIMARY KEY REFERENCES kullanicilar(id) ON DELETE CASCADE,
  cevrimici      boolean NOT NULL DEFAULT false,
  oda_id         uuid,
  son_gorulme    timestamptz NOT NULL DEFAULT now(),
  ip_hash        text
);

-- ---------------------------------------------------------------- odalar
CREATE TABLE IF NOT EXISTS odalar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base44_id      text UNIQUE,                   -- taşıma sırasında eşleştirme
  kod            text UNIQUE NOT NULL,
  ad             text NOT NULL,
  tur            text NOT NULL DEFAULT 'voice', -- voice | watch
  sahip_id       uuid NOT NULL REFERENCES kullanicilar(id),
  durum          text NOT NULL DEFAULT 'active', -- active | closed
  gizli          boolean NOT NULL DEFAULT false,
  kilitli        boolean NOT NULL DEFAULT false,
  parola_hash    text,
  kapasite       integer NOT NULL DEFAULT 8,
  kategori       text,
  duyuru         text,
  sohbet_ayarlari jsonb NOT NULL DEFAULT '{}'::jsonb,
  seviye         integer NOT NULL DEFAULT 1,
  olusturma      timestamptz NOT NULL DEFAULT now(),
  guncelleme     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS odalar_durum_idx ON odalar (durum, gizli);
CREATE INDEX IF NOT EXISTS odalar_sahip_idx ON odalar (sahip_id);

CREATE TABLE IF NOT EXISTS oda_koltuklari (
  oda_id         uuid NOT NULL REFERENCES odalar(id) ON DELETE CASCADE,
  koltuk_no      integer NOT NULL,
  kullanici_id   uuid REFERENCES kullanicilar(id) ON DELETE SET NULL,
  susturuldu     boolean NOT NULL DEFAULT false,
  kilitli        boolean NOT NULL DEFAULT false,
  katilma        timestamptz,
  PRIMARY KEY (oda_id, koltuk_no)
);

CREATE TABLE IF NOT EXISTS oda_yetkilileri (
  oda_id         uuid NOT NULL REFERENCES odalar(id) ON DELETE CASCADE,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  rol            text NOT NULL DEFAULT 'moderator',
  olusturma      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (oda_id, kullanici_id)
);

CREATE TABLE IF NOT EXISTS oda_banlari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oda_id         uuid NOT NULL REFERENCES odalar(id) ON DELETE CASCADE,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  sebep          text,
  bitis          timestamptz,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oda_banlari_idx ON oda_banlari (oda_id, kullanici_id);

-- ---------------------------------------------------------------- sohbet
CREATE TABLE IF NOT EXISTS oda_mesajlari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  oda_id         uuid NOT NULL REFERENCES odalar(id) ON DELETE CASCADE,
  seq            bigint NOT NULL,
  gonderen_id    uuid REFERENCES kullanicilar(id) ON DELETE SET NULL,
  tur            text NOT NULL DEFAULT 'user',  -- user | system | gift | game
  metin          text,
  dosya_url      text,
  hediye_id      uuid,
  request_id     text,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS oda_mesajlari_seq_idx ON oda_mesajlari (oda_id, seq);
CREATE UNIQUE INDEX IF NOT EXISTS oda_mesajlari_request_idx
  ON oda_mesajlari (gonderen_id, request_id) WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS oda_okundu (
  oda_id         uuid NOT NULL REFERENCES odalar(id) ON DELETE CASCADE,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  son_seq        bigint NOT NULL DEFAULT 0,
  guncelleme     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (oda_id, kullanici_id)
);

CREATE TABLE IF NOT EXISTS ozel_sohbetler (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_a    uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  kullanici_b    uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  son_mesaj_at   timestamptz,
  CONSTRAINT ozel_sohbetler_sira CHECK (kullanici_a < kullanici_b)
);
CREATE UNIQUE INDEX IF NOT EXISTS ozel_sohbetler_cift_idx ON ozel_sohbetler (kullanici_a, kullanici_b);

CREATE TABLE IF NOT EXISTS ozel_mesajlar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sohbet_id      uuid NOT NULL REFERENCES ozel_sohbetler(id) ON DELETE CASCADE,
  gonderen_id    uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  alici_id       uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  icerik         text,
  dosya_url      text,
  okundu         boolean NOT NULL DEFAULT false,
  silindi         boolean NOT NULL DEFAULT false,
  request_id     text,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ozel_mesajlar_idx ON ozel_mesajlar (sohbet_id, olusturma);
CREATE UNIQUE INDEX IF NOT EXISTS ozel_mesajlar_request_idx
  ON ozel_mesajlar (gonderen_id, request_id) WHERE request_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS bildirimler (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  tur            text NOT NULL,
  baslik         text,
  metin          text,
  veri           jsonb NOT NULL DEFAULT '{}'::jsonb,
  okundu         boolean NOT NULL DEFAULT false,
  request_id     text,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bildirimler_idx ON bildirimler (kullanici_id, okundu, olusturma DESC);

-- ---------------------------------------------------------------- hediye
CREATE TABLE IF NOT EXISTS hediye_katalogu (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kod            text UNIQUE NOT NULL,
  ad             text NOT NULL,
  deger_k        numeric(18,2) NOT NULL,
  gorsel_url     text,
  animasyon      text,
  aktif          boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS hediye_gonderimleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,          -- çift gönderim koruması
  gonderen_id    uuid NOT NULL REFERENCES kullanicilar(id),
  alici_id       uuid NOT NULL REFERENCES kullanicilar(id),
  hediye_id      uuid NOT NULL REFERENCES hediye_katalogu(id),
  adet           integer NOT NULL DEFAULT 1 CHECK (adet > 0),
  toplam_k       numeric(18,2) NOT NULL CHECK (toplam_k > 0),
  oda_id         uuid REFERENCES odalar(id) ON DELETE SET NULL,
  kademe_atladi  boolean NOT NULL DEFAULT false,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hediye_gonderimleri_idx ON hediye_gonderimleri (alici_id, olusturma DESC);

CREATE TABLE IF NOT EXISTS buyuk_hediye_duyurulari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gonderim_id    uuid NOT NULL REFERENCES hediye_gonderimleri(id) ON DELETE CASCADE,
  kademe          text NOT NULL,
  gosterim_bitis timestamptz NOT NULL,
  olusturma      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- ekonomi
CREATE TABLE IF NOT EXISTS cuzdanlar (
  kullanici_id   uuid PRIMARY KEY REFERENCES kullanicilar(id) ON DELETE CASCADE,
  bakiye         numeric(18,2) NOT NULL DEFAULT 0 CHECK (bakiye >= 0),
  surum          bigint NOT NULL DEFAULT 0,     -- iyimser kilitleme
  guncelleme     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cuzdan_hareketleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id),
  tur            text NOT NULL,                 -- yukleme | harcama | hediye | oyun | transfer | duzeltme | iade
  tutar          numeric(18,2) NOT NULL,        -- + giriş, - çıkış
  bakiye_sonrasi numeric(18,2) NOT NULL,
  referans_tur   text,
  referans_id    text,
  aciklama       text,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cuzdan_hareketleri_idx ON cuzdan_hareketleri (kullanici_id, olusturma DESC);

CREATE TABLE IF NOT EXISTS jeton_talepleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id),
  paket_kodu     text NOT NULL,
  tutar_try      numeric(18,2),
  dekont_url     text,
  durum          text NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  inceleyen_id   uuid REFERENCES kullanicilar(id),
  inceleme_notu  text,
  olusturma      timestamptz NOT NULL DEFAULT now(),
  karar_at       timestamptz
);
CREATE INDEX IF NOT EXISTS jeton_talepleri_idx ON jeton_talepleri (durum, olusturma);

-- ---------------------------------------------------------------- oyun
CREATE TABLE IF NOT EXISTS oyun_turlari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL,                 -- slot | fruit | dede | seker | sekerli | elimin | rocket | roulette | futbol | okey | zar
  tur_no         bigint NOT NULL,
  durum          text NOT NULL DEFAULT 'betting',
  sonuc          jsonb,
  baslama        timestamptz NOT NULL DEFAULT now(),
  bitis          timestamptz,
  CONSTRAINT oyun_turlari_tek UNIQUE (slug, tur_no)
);

CREATE TABLE IF NOT EXISTS oyun_katilimlari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,
  tur_id         uuid NOT NULL REFERENCES oyun_turlari(id) ON DELETE CASCADE,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id),
  secim          jsonb NOT NULL DEFAULT '{}'::jsonb,
  bahis          numeric(18,2) NOT NULL CHECK (bahis > 0),
  odeme          numeric(18,2) NOT NULL DEFAULT 0,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS oyun_katilimlari_idx ON oyun_katilimlari (tur_id, kullanici_id);

CREATE TABLE IF NOT EXISTS oyun_sonuclari (
  tur_id         uuid PRIMARY KEY REFERENCES oyun_turlari(id) ON DELETE CASCADE,
  kazananlar     jsonb NOT NULL DEFAULT '[]'::jsonb,
  dagitilan      numeric(18,2) NOT NULL DEFAULT 0,
  kapanis_at     timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- ajans
CREATE TABLE IF NOT EXISTS ajanlar (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kod            text UNIQUE NOT NULL,
  ad             text NOT NULL,
  sahip_id       uuid NOT NULL REFERENCES kullanicilar(id),
  durum          text NOT NULL DEFAULT 'active',
  olusturma      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ajan_uyeleri (
  ajan_id        uuid NOT NULL REFERENCES ajanlar(id) ON DELETE CASCADE,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  rol            text NOT NULL DEFAULT 'broadcaster', -- owner | assistant | broadcaster
  katilma        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (ajan_id, kullanici_id)
);

CREATE TABLE IF NOT EXISTS ajan_davetleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,
  ajan_id        uuid NOT NULL REFERENCES ajanlar(id) ON DELETE CASCADE,
  hedef_id       uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  gonderen_id    uuid NOT NULL REFERENCES kullanicilar(id),
  durum          text NOT NULL DEFAULT 'pending',
  olusturma      timestamptz NOT NULL DEFAULT now(),
  karar_at       timestamptz
);

CREATE TABLE IF NOT EXISTS ajan_kazanclari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,
  ajan_id        uuid NOT NULL REFERENCES ajanlar(id) ON DELETE CASCADE,
  yayinci_id     uuid NOT NULL REFERENCES kullanicilar(id),
  donem          text NOT NULL,                 -- 2026-10 gibi
  hediye_k        numeric(18,2) NOT NULL DEFAULT 0,
  pay_k          numeric(18,2) NOT NULL DEFAULT 0,
  durum          text NOT NULL DEFAULT 'pending',
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ajan_kazanclari_idx ON ajan_kazanclari (ajan_id, donem);

CREATE TABLE IF NOT EXISTS kota_kademeleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kademe         integer NOT NULL UNIQUE,
  hedef_k        numeric(18,2) NOT NULL,
  odul_k         numeric(18,2) NOT NULL,
  aciklama       text
);

-- ---------------------------------------------------------------- ödeme
CREATE TABLE IF NOT EXISTS odeme_yontemleri (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  tur            text NOT NULL,                 -- banka | saglayici
  maskeli_bilgi  text NOT NULL,                 -- yalnızca maskeli (IBAN son 4, kart son 4)
  saglayici      text,
  olusturma      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS odeme_kayitlari (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id     text UNIQUE NOT NULL,
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id),
  paket_kodu     text,
  tutar          numeric(18,2) NOT NULL CHECK (tutar > 0),
  para_birimi    text NOT NULL DEFAULT 'TRY',
  yontem         text NOT NULL,                 -- banka | saglayici
  saglayici_ref  text,
  durum          text NOT NULL DEFAULT 'pending',
  onaylayan_id   uuid REFERENCES kullanicilar(id),
  olusturma      timestamptz NOT NULL DEFAULT now(),
  karar_at       timestamptz
);
CREATE INDEX IF NOT EXISTS odeme_kayitlari_idx ON odeme_kayitlari (durum, olusturma);

CREATE TABLE IF NOT EXISTS abonelikler (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id   uuid NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  plan_kodu      text NOT NULL,
  baslangic      timestamptz NOT NULL DEFAULT now(),
  bitis          timestamptz,
  durum          text NOT NULL DEFAULT 'active'
);

-- ---------------------------------------------------------------- güvenlik
CREATE TABLE IF NOT EXISTS idempotency_kayitlari (
  principal_kimlik text NOT NULL,
  islem            text NOT NULL,
  request_id       text NOT NULL,
  durum            text NOT NULL DEFAULT 'bekliyor', -- bekliyor | tamam
  istek_hash       text NOT NULL,                    -- aynı request_id farklı gövde kontrolü
  yanit_kodu       integer,
  yanit_govdesi    jsonb,
  olusturma        timestamptz NOT NULL DEFAULT now(),
  son_kullanma     timestamptz NOT NULL,
  PRIMARY KEY (principal_kimlik, islem, request_id)
);
CREATE INDEX IF NOT EXISTS idempotency_son_kullanma_idx ON idempotency_kayitlari (son_kullanma);

CREATE TABLE IF NOT EXISTS denetim_kayitlari (
  id             bigserial PRIMARY KEY,
  principal_kimlik text,
  rol            text,
  islem          text NOT NULL,
  hedef_tur      text,
  hedef_id       text,
  sonuc          text NOT NULL,                 -- basarili | reddedildi | hata
  sebep          text,
  request_id     text,
  ip_hash        text,
  ayrinti        jsonb NOT NULL DEFAULT '{}'::jsonb,
  olusturma      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS denetim_kayitlari_hedef_idx
  ON denetim_kayitlari (hedef_tur, hedef_id, olusturma DESC);

CREATE TABLE IF NOT EXISTS iptal_edilen_tokenlar (
  jti            text PRIMARY KEY,
  kullanici_id   uuid REFERENCES kullanicilar(id) ON DELETE CASCADE,
  sebep          text,
  son_kullanma   timestamptz NOT NULL,
  olusturma      timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------- sürüm
INSERT INTO sema_surumu (surum, aciklama)
VALUES (1, 'Aşama 2 tasarım şeması: kimlik, sosyal, oda, sohbet, hediye, ekonomi, oyun, ajans, ödeme, güvenlik')
ON CONFLICT (surum) DO NOTHING;