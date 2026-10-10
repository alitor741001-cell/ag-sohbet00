/**
 * Bonto API bağlantı testi (Aşama 1 — yalnızca okuma).
 *
 * • Anahtar YALNIZCA sunucu tarafında, gizli ortam değişkeninden okunur.
 *   Tarayıcıya, sayfaya veya herhangi bir istemci koduna asla gitmez.
 * • Çağrılan yollar sabittir: çağıran kişi yol veya başlık seçemez.
 * • Yalnızca /health/ready ve /v1/ping denenir. Canlı oda, mesaj, coin,
 *   hediye veya oyun verisine dokunulmaz.
 * • Anahtar değeri veya hassas başlıklar günlüğe yazılmaz, yanıtta dönmez.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const BASE_URL = 'https://ag-sohbet.bonto.run';
const TIMEOUT_MS = 10000;

/** Tek bir uç noktayı çağırır; hata durumunda bile yanıt döner. */
async function probe(path, headers) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    let body = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { ad: `GET ${path}`, basarili: response.ok, durum: response.status, yanit: body };
  } catch (error) {
    const reason = error?.name === 'TimeoutError' ? 'zaman aşımı' : 'bağlantı kurulamadı';
    return { ad: `GET ${path}`, basarili: false, durum: 0, hata: reason };
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const serviceKey = secrets.get('BONTO_API_SERVICE_KEY');
    const staticKey = secrets.get('BONTO_STATIC_TEST_KEY');

    let headers;
    let authMode;
    if (serviceKey) {
      // Canlı Bonto sunucusu servis anahtarını X-API-Key başlığında bekliyor.
      headers = { 'X-API-Key': serviceKey };
      authMode = 'x-api-key-servis-anahtari';
    } else if (staticKey) {
      headers = { 'X-API-Key': staticKey };
      authMode = 'statik-test-anahtari';
    } else {
      return Response.json({ error: 'Bonto API anahtarı tanımlı değil.' }, { status: 503 });
    }

    const [hazirlik, ping] = await Promise.all([
      probe('/health/ready', {}),
      probe('/v1/ping', headers),
    ]);

    const tests = [hazirlik, ping];
    return Response.json({
      baseUrl: BASE_URL,
      kimlikYontemi: authMode,
      canliVeri: false,
      basarili: tests.filter((test) => test.basarili).length,
      toplam: tests.length,
      tests,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}