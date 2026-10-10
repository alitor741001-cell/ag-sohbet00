/* global process, module, require */
'use strict';
/**
 * api-idempotency.js — request_id tabanlı tek işlem garantisi.
 *
 * Aynı (principal, işlem, request_id) üçlüsü ikinci kez geldiğinde işlem TEKRAR
 * ÇALIŞMAZ; ilk çalışmanın yanıtı aynen döner ve "tekrar: true" ile işaretlenir.
 * Böylece ağ tekrar denemesi, çift dokunuş veya yeniden bağlanma; çift hediye,
 * çift bakiye düşmesi ya da çift oyun sonucu üretmez.
 *
 * Doğru kullanım: idempotency satırı ile iş mantığı (bakiye + hareket + denetim)
 * AYNI transaction içinde yazılır. Aksi halde "kayıt var ama iş yok" durumu doğar.
 */

const crypto = require('node:crypto');

const REQUEST_ID_DESENI = /^[\w-]{8,64}$/;
const VARSAYILAN_TTL_SN = 86400; // 24 saat
const BEKLEME_ADIM_MS = 120;
const BEKLEME_DENEME = 25; // ~3 saniye

/** Anahtar doğrulaması + istek gövdesi parmak izi. */
function anahtarUret({ principal, islem, requestId, istekGovdesi } = {}) {
  if (!principal || !principal.kind) return { ok: false, mesaj: 'kimlik yok' };
  if (typeof islem !== 'string' || !islem.length) return { ok: false, mesaj: 'işlem adı zorunlu' };
  if (typeof requestId !== 'string' || !REQUEST_ID_DESENI.test(requestId)) {
    return { ok: false, mesaj: 'request_id 8-64 karakter olmalı (harf, rakam, - ve _)' };
  }
  return {
    ok: true,
    anahtar: {
      principalKimlik: String(principal.userId || principal.kind),
      islem,
      requestId,
      istekHash: crypto
        .createHash('sha256')
        .update(typeof istekGovdesi === 'string' ? istekGovdesi : JSON.stringify(istekGovdesi || {}))
        .digest('hex'),
    },
  };
}

/**
 * İşlemi tek seferlik çalıştırır.
 * @param {{ depo: object, anahtar: object, islemFn: () => Promise<object>, ttlSn?: number, bekle?: (ms:number)=>Promise<void> }} girdi
 * @returns {Promise<{ ok: boolean, kod?: string, mesaj?: string, yanit?: object, tekrar?: boolean }>}
 */
async function islemCalistir({ depo, anahtar, islemFn, ttlSn = VARSAYILAN_TTL_SN, bekle } = {}) {
  const sahiplik = await depo.baslat(anahtar, ttlSn);

  if (!sahipligim(sahiplik)) {
    // Aynı istek başka bir çağrıda: kaydı oku.
    let kayit = sahiplik.kayit || (await depo.oku(anahtar));
    if (kayit && kayit.istek_hash && kayit.istek_hash !== anahtar.istekHash) {
      return { ok: false, kod: 'TEKRAR_KULLANIM', mesaj: 'Bu istek numarası farklı bir istekle kullanılmış.' };
    }

    if (kayit && kayit.durum === 'tamam') {
      return { ok: true, tekrar: true, yanit: kayit.yanit_govdesi || {}, kod: kayit.yanit_kodu || 200 };
    }

    // Kayıt hazırlanıyor: kısa süre bekle, sonra tekrar oku.
    const bekleFn = typeof bekle === 'function' ? bekle : (ms) => new Promise((coz) => setTimeout(coz, ms));
    for (let deneme = 0; deneme < BEKLEME_DENEME; deneme += 1) {
      await bekleFn(BEKLEME_ADIM_MS);
      kayit = await depo.oku(anahtar);
      if (kayit && kayit.durum === 'tamam') {
        return { ok: true, tekrar: true, yanit: kayit.yanit_govdesi || {}, kod: kayit.yanit_kodu || 200 };
      }
      if (!kayit) break; // işlem geri alındı, yeniden denemek serbest
    }
    return { ok: false, kod: 'TEKRAR_ISLENIYOR', mesaj: 'Aynı istek şu anda işleniyor.' };
  }

  try {
    const yanit = await islemFn();
    await depo.tamamla(anahtar, yanit.kod || 200, yanit.govde || {});
    return { ok: true, tekrar: false, yanit: yanit.govde || {}, kod: yanit.kod || 200 };
  } catch (hata) {
    // İşlem geri alındıysa kilit bırakılır; aynı request_id ile tekrar denenebilir.
    await depo.birak(anahtar);
    throw hata;
  }
}

const sahipligim = (sonuc) => Boolean(sonuc && sonuc.sahip === true);

/** SQL deposu için hazır ifadeler (transaction içinde kullanılır). */
const SQL = Object.freeze({
  basla: `INSERT INTO idempotency_kayitlari
            (principal_kimlik, islem, request_id, durum, istek_hash, olusturma, son_kullanma)
          VALUES ($1, $2, $3, 'bekliyor', $4, now(), now() + ($5::text || ' seconds')::interval)
          ON CONFLICT (principal_kimlik, islem, request_id) DO NOTHING
          RETURNING principal_kimlik`,
  oku: `SELECT durum, istek_hash, yanit_kodu, yanit_govdesi
          FROM idempotency_kayitlari
         WHERE principal_kimlik = $1 AND islem = $2 AND request_id = $3`,
  tamamla: `UPDATE idempotency_kayitlari
               SET durum = 'tamam', yanit_kodu = $4, yanit_govdesi = $5
             WHERE principal_kimlik = $1 AND islem = $2 AND request_id = $3`,
  birak: `DELETE FROM idempotency_kayitlari
           WHERE principal_kimlik = $1 AND islem = $2 AND request_id = $3 AND durum = 'bekliyor'`,
  temizle: `DELETE FROM idempotency_kayitlari WHERE son_kullanma < now()`,
  // Bakiye düşme örneği: koşullu, atomik; 0 satır dönerse bakiye yetersiz.
  bakiyeDus: `UPDATE cuzdanlar SET bakiye = bakiye - $2, surum = surum + 1, guncelleme = now()
               WHERE kullanici_id = $1 AND bakiye >= $2`,
  hareketYaz: `INSERT INTO cuzdan_hareketleri
                 (request_id, kullanici_id, tur, tutar, bakiye_sonrasi, referans_tur, referans_id, aciklama)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
});

/**
 * Bellek deposu — YALNIZCA test ve yerel geliştirme içindir.
 * Canlıda SQL deposu kullanılmalıdır: süreç yeniden başlarsa bellek kaydı kaybolur
 * ve tek işlem garantisi ortadan kalkar.
 */
function bellekDeposu({ ttlSn = VARSAYILAN_TTL_SN } = {}) {
  const kayitlar = new Map();
  const anahtarMetni = (a) => `${a.principalKimlik}|${a.islem}|${a.requestId}`;

  return {
    async baslat(anahtar) {
      const kilit = anahtarMetni(anahtar);
      const mevcut = kayitlar.get(kilit);
      if (mevcut && mevcut.son_kullanma > Date.now()) return { sahip: false, kayit: mevcut };
      const yeni = {
        durum: 'bekliyor',
        istek_hash: anahtar.istekHash,
        yanit_kodu: null,
        yanit_govdesi: null,
        son_kullanma: Date.now() + ttlSn * 1000,
      };
      kayitlar.set(kilit, yeni);
      if (kayitlar.size > 10000) {
        for (const [k, v] of kayitlar) if (v.son_kullanma <= Date.now()) kayitlar.delete(k);
      }
      return { sahip: true };
    },
    async oku(anahtar) {
      const kayit = kayitlar.get(anahtarMetni(anahtar));
      return kayit && kayit.son_kullanma > Date.now() ? kayit : null;
    },
    async tamamla(anahtar, kod, govde) {
      const kayit = kayitlar.get(anahtarMetni(anahtar));
      if (!kayit) return;
      kayit.durum = 'tamam';
      kayit.yanit_kodu = kod;
      kayit.yanit_govdesi = govde;
    },
    async birak(anahtar) {
      kayitlar.delete(anahtarMetni(anahtar));
    },
  };
}

module.exports = {
  BEKLEME_ADIM_MS,
  BEKLEME_DENEME,
  SQL,
  VARSAYILAN_TTL_SN,
  anahtarUret,
  bellekDeposu,
  islemCalistir,
};