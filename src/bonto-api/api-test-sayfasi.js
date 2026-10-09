/* global module */
'use strict';
/**
 * api-test-sayfasi.js — telefon tarayıcısından API'yi denemek için basit test sayfası.
 *
 * • Adres: /test
 * • Anahtar yalnızca tarayıcı hafızasında tutulur; hiçbir yere kaydedilmez, sayfaya gömülmez.
 * • Kapatmak için ortam değişkeni: ENABLE_TEST_PAGE=false
 */

const TEST_SAYFASI = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ag-backend API test</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0 auto; padding: 16px; max-width: 640px; color: #e0e0e0; background: #1a1a2e; }
    h1 { color: #00d4ff; font-size: 1.15rem; }
    h2 { font-size: 0.95rem; color: #9fb3c8; font-weight: 600; }
    label { display: block; font-size: 0.8rem; margin: 10px 0 4px; color: #9fb3c8; }
    input { width: 100%; box-sizing: border-box; padding: 10px; font-size: 16px; border-radius: 8px; border: 1px solid #2b3a55; background: #16213e; color: #e0e0e0; }
    .satir { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    button { flex: 1 1 46%; padding: 12px 10px; font-size: 0.85rem; border-radius: 8px; border: 1px solid #00d4ff55; background: #16213e; color: #00d4ff; }
    button:active { background: #0f2b4a; }
    pre { margin-top: 14px; padding: 12px; border-radius: 8px; background: #0d1526; border: 1px solid #2b3a55; font-size: 0.75rem; overflow-x: auto; white-space: pre-wrap; word-break: break-word; }
    .durum { font-size: 0.75rem; margin-top: 10px; }
    .ok { color: #4ade80; }
    .hata { color: #f87171; }
    p.ipucu { font-size: 0.72rem; color: #7f8ea3; }
  </style>
</head>
<body>
  <h1>ag-backend API test sayfası (Aşama 1)</h1>
  <p class="ipucu">Canlı oda, mesaj, hediye veya coin verisi kullanılmaz. Bütün yanıtlar statik test verisidir.</p>

  <label for="anahtar">API anahtarı (X-API-Key yerine Authorization: Bearer olarak gönderilir)</label>
  <input id="anahtar" type="password" autocomplete="off" placeholder="STATIC_TEST_KEY değeri">

  <label for="oda">Oda kimliği (mesaj örnekleri için)</label>
  <input id="oda" type="text" autocomplete="off" value="ornek-oda-1">

  <div class="satir">
    <button data-yol="/health" data-kimlik="hayir">/health</button>
    <button data-yol="/health/ready" data-kimlik="hayir">/health/ready</button>
    <button data-yol="/v1/sozlesme">/v1/sozlesme</button>
    <button data-yol="/v1/ping">/v1/ping</button>
    <button data-yol="/v1/echo?mesaj=merhaba&adet=3">/v1/echo</button>
    <button data-yol="/v1/echo?mesaj=&adet=99">/v1/echo (hatalı)</button>
    <button data-yol="/v1/test/odalar">/v1/test/odalar</button>
    <button id="mesaj-dugmesi">/v1/test/mesajlar</button>
  </div>

  <p class="durum" id="durum">Hazır.</p>
  <pre id="cikti">Bir uca dokunun.</pre>

  <script>
    var anahtarGirdi = document.getElementById('anahtar');
    var odaGirdi = document.getElementById('oda');
    var durum = document.getElementById('durum');
    var cikti = document.getElementById('cikti');

    function goster(metin, iyiMi) {
      durum.textContent = metin;
      durum.className = 'durum ' + (iyiMi ? 'ok' : 'hata');
    }

    async function cagir(yol, kimlikGerekli) {
      var basliklar = { 'accept': 'application/json' };
      if (kimlikGerekli !== 'hayir') {
        if (!anahtarGirdi.value) { goster('Önce API anahtarını yapıştırın.', false); return; }
        basliklar['Authorization'] = 'Bearer ' + anahtarGirdi.value;
      }
      goster('İstek gönderiliyor: ' + yol, true);
      try {
        var yanit = await fetch(yol, { headers: basliklar });
        var govde = await yanit.json();
        goster(yanit.status + ' ' + (yanit.ok ? 'başarılı' : 'hata') + ' · ' + yol, yanit.ok);
        cikti.textContent = JSON.stringify(govde, null, 2);
      } catch (hata) {
        goster('İstek başarısız: ' + yol, false);
        cikti.textContent = String(hata);
      }
    }

    var dugmeler = document.querySelectorAll('button[data-yol]');
    for (var i = 0; i < dugmeler.length; i += 1) {
      dugmeler[i].addEventListener('click', function () {
        cagir(this.getAttribute('data-yol'), this.getAttribute('data-kimlik'));
      });
    }

    document.getElementById('mesaj-dugmesi').addEventListener('click', function () {
      var oda = encodeURIComponent(odaGirdi.value || '');
      cagir('/v1/test/mesajlar?oda=' + oda, 'evet');
    });
  </script>
</body>
</html>`;

module.exports = { TEST_SAYFASI };