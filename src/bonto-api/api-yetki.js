/* global module, require */
'use strict';
/**
 * api-yetki.js — sunucu tarafı yetkilendirme ve denetim kaydı.
 *
 * Kural: rol claim'i TEK BAŞINA yetki vermez. Her yazma işlemi dört kapıdan geçer:
 *   1) principal türü (user mı, service mi, test mi)
 *   2) uç nokta rol politikası
 *   3) kaynak sahipliği (oda sahibi / ajans sahibi / kendi kaydı)
 *   4) kaynak durumu (kapalı oda, banlı kullanıcı, bitmiş tur)
 *
 * Politika tanımsızsa KAPALI DEVRE reddedilir. İstemciden gelen bakiye, tutar,
 * rol veya oyun sonucu doğrudan kabul edilmez.
 */

const ROLLER = Object.freeze({
  KULLANICI: 'user',
  YAYINCI: 'broadcaster',
  AJANS_SAHIBI: 'agency_owner',
  AJANS_ASISTANI: 'agency_assistant',
  ODA_YONETICISI: 'room_moderator',
  YONETICI: 'admin',
  SERVIS: 'service',
  TEST: 'test',
});

const TUTAR_UST_SINIR = 10000000; // tek işlemde izin verilen en yüksek jeton tutarı

/**
 * Uç nokta politikaları.
 *   principal : hangi token türü geçerli ('user' | 'service' | 'test')
 *   roller    : izinli roller (principal.kind === 'user' iken)
 *   yazma     : true ise idempotency anahtarı (request_id) zorunlu
 *   sahiplik  : kaynak üzerindeki sahiplik yolu (nokta ile: 'oda.sahip_id')
 *   denetim   : 'zorunlu' ise denetim kaydı olmadan işlem tamamlanmaz
 *   kilitli   : true ise özellik anahtarı kapalıyken uç 503 döner
 */
const POLITIKALAR = Object.freeze({
  'kullanici.profil.guncelle': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, sahiplik: 'kullanici.kendi' },
  'durum.heartbeat': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true },

  'oda.olustur': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, kilitli: true },
  'oda.guncelle': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, sahiplik: 'oda.sahip_id', kilitli: true },
  'oda.kapat': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI, ROLLER.ODA_YONETICISI], yazma: true, sahiplik: 'oda.sahip_id', kilitli: true },
  'oda.koltuk.al': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, kilitli: true },
  'oda.koltuk.sustur': { principal: 'user', roller: [ROLLER.ODA_YONETICISI, ROLLER.YAYINCI], yazma: true, sahiplik: 'oda.yetkili', kilitli: true },
  'oda.kullanici.at': { principal: 'user', roller: [ROLLER.ODA_YONETICISI, ROLLER.YAYINCI], yazma: true, sahiplik: 'oda.yetkili', kilitli: true },
  'oda.banla': { principal: 'user', roller: [ROLLER.ODA_YONETICISI, ROLLER.YAYINCI], yazma: true, sahiplik: 'oda.yetkili', kilitli: true },

  'oda.mesaj.gonder': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, kilitli: true },
  'ozel.mesaj.gonder': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true },

  'hediye.gonder': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, kilitli: true, denetim: 'zorunlu' },
  'cuzdan.talep': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true },
  'cuzdan.duzeltme': { principal: 'user', roller: [ROLLER.YONETICI], yazma: true, denetim: 'zorunlu' },

  'oyun.aksiyon': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, kilitli: true, denetim: 'zorunlu' },

  'cerceve.aktif': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true },

  'ajan.olustur': { principal: 'user', roller: [ROLLER.KULLANICI], yazma: true },
  'ajan.davet': { principal: 'user', roller: [ROLLER.AJANS_SAHIBI, ROLLER.AJANS_ASISTANI], yazma: true, sahiplik: 'ajan.yetkili' },
  'ajan.devir.onay': { principal: 'user', roller: [ROLLER.AJANS_SAHIBI], yazma: true, sahiplik: 'ajan.sahip_id' },
  'ajan.kazanc.yaz': { principal: 'service', yazma: true, denetim: 'zorunlu' },

  'bildirim.oku': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true },
  'arkadaslik.istek': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true },
  'arkadaslik.yanit': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, hedefKullanici: true },

  'odeme.talep': { principal: 'user', roller: [ROLLER.KULLANICI, ROLLER.YAYINCI], yazma: true, denetim: 'zorunlu' },
  'odeme.onay': { principal: 'user', roller: [ROLLER.YONETICI], yazma: true, denetim: 'zorunlu' },

  'admin.kullanici.rol': { principal: 'user', roller: [ROLLER.YONETICI], yazma: true, denetim: 'zorunlu' },
  'admin.oda.kapat': { principal: 'user', roller: [ROLLER.YONETICI], yazma: true, denetim: 'zorunlu' },

  'servis.ayna': { principal: 'service', yazma: true, denetim: 'zorunlu' },
  'test.okuma': { principal: 'test', yazma: false },
});

const SESSIZ_RED = { ok: false, kod: 'YETKI_TURU', mesaj: 'Bu uç nokta için geçersiz kimlik türü.' };

/**
 * Yetki kararı verir.
 * @param {{ principal: object, policy: string, kaynak?: object, hedefKullaniciId?: string, ozellikAcik?: boolean }} girdi
 * @returns {{ ok: true } | { ok: false, kod: string, mesaj: string }}
 */
function yetkiKontrol(girdi = {}) {
  const { principal, policy, kaynak, hedefKullaniciId, ozellikAcik = false } = girdi;
  const kural = POLITIKALAR[policy];

  // 1) Politika tanımsızsa kapalı devre.
  if (!kural) return { ok: false, kod: 'YETKI_YOK', mesaj: 'Bu işlem için tanımlı bir yetki kuralı yok.' };
  if (!principal || !principal.kind) return { ok: false, kod: 'KIMLIK_YOK', mesaj: 'Kimlik bulunamadı.' };

  // 2) Principal türü.
  if (principal.kind !== kural.principal) return SESSIZ_RED;

  // 3) Özellik anahtarı.
  if (kural.kilitli && !ozellikAcik) {
    return { ok: false, kod: 'SERVIS_HATASI', mesaj: 'Bu modül henüz etkin değil.' };
  }

  // 4) Rol politikası (servis ve test principal'larında rol aranmaz).
  if (kural.principal === 'user' && Array.isArray(kural.roller)) {
    if (!kural.roller.includes(principal.role)) {
      return { ok: false, kod: 'YETKI_YOK', mesaj: 'Bu işlem için yetkiniz yok.' };
    }
  }

  // 5) Hedef kullanıcı: kendi kaydı ya da admin.
  if (kural.hedefKullanici && hedefKullaniciId && principal.kind === 'user') {
    if (principal.role !== ROLLER.YONETICI && String(hedefKullaniciId) !== String(principal.userId)) {
      return { ok: false, kod: 'YETKI_YOK', mesaj: 'Yalnızca kendi kaydınız üzerinde işlem yapabilirsiniz.' };
    }
  }

  // 6) Sahiplik: kaynak üzerindeki sahip/yetkili alanı principal ile eşleşmeli.
  if (kural.sahiplik) {
    if (principal.role !== ROLLER.YONETICI) {
      const deger = sahiplikDegeri(kaynak, kural.sahiplik);
      if (!deger) return { ok: false, kod: 'YETKI_YOK', mesaj: 'Bu işlem için yetkiniz yok.' };
      const sahipler = Array.isArray(deger) ? deger.map(String) : [String(deger)];
      if (!sahipler.includes(String(principal.userId))) {
        return { ok: false, kod: 'YETKI_YOK', mesaj: 'Bu kaynak üzerinde yetkiniz yok.' };
      }
    }
  }

  return { ok: true };
}

/** 'oda.sahip_id' gibi sahiplik yollarını okur. 'kendi' özel değerdir. */
function sahiplikDegeri(kaynak, yol) {
  if (!kaynak) return null;
  if (yol === 'kullanici.kendi') return kaynak.kullaniciId || null;
  const parcalar = String(yol).split('.');
  let deger = kaynak;
  for (const parca of parcalar) {
    if (deger === null || typeof deger !== 'object') return null;
    deger = deger[parca];
  }
  return deger === undefined ? null : deger;
}

/** İdempotency anahtarı gereken uç mu. */
const idempotencyGerekli = (policy) => Boolean(POLITIKALAR[policy] && POLITIKALAR[policy].yazma);

/** Denetim kaydı zorunlu mu. */
const denetimZorunlu = (policy) => Boolean(POLITIKALAR[policy] && POLITIKALAR[policy].denetim === 'zorunlu');

/**
 * Tutar doğrulaması: sonlu, pozitif, üst sınır içinde.
 * İstemciden gelen sayı doğrudan kullanılmaz.
 */
function tutarDogrula(deger, { ustSinir = TUTAR_UST_SINIR, enAz = 1 } = {}) {
  const sayi = Number(deger);
  if (!Number.isFinite(sayi)) return { ok: false, mesaj: 'tutar sayı olmalı' };
  if (sayi <= 0) return { ok: false, mesaj: 'tutar pozitif olmalı' };
  if (sayi < enAz) return { ok: false, mesaj: `en az ${enAz} olmalı` };
  if (sayi > ustSinir) return { ok: false, mesaj: `en fazla ${ustSinir} olabilir` };
  if (Math.round(sayi * 100) !== sayi * 100) return { ok: false, mesaj: 'en fazla iki ondalık basamak' };
  return { ok: true, deger: sayi };
}

/** Denetim kaydı satırı üretir (tablo: denetim_kayitlari). */
function denetimKaydiOlustur({
  principal,
  islem,
  hedefTur = null,
  hedefId = null,
  sonuc,
  sebep = null,
  requestId = null,
  ipHash = null,
  ayrinti = {},
} = {}) {
  return {
    principal_kimlik: principal ? String(principal.userId || principal.kind) : null,
    rol: principal ? principal.role || principal.kind : null,
    islem,
    hedef_tur: hedefTur,
    hedef_id: hedefId === null ? null : String(hedefId),
    sonuc,
    sebep,
    request_id: requestId,
    ip_hash: ipHash,
    ayrinti,
  };
}

module.exports = {
  POLITIKALAR,
  ROLLER,
  TUTAR_UST_SINIR,
  denetimKaydiOlustur,
  denetimZorunlu,
  idempotencyGerekli,
  sahiplikDegeri,
  tutarDogrula,
  yetkiKontrol,
};