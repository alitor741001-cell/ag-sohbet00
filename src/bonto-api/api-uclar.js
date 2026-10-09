/* global process, module, require */
'use strict';
/**
 * api-uclar.js — Aşama 1 uç noktaları.
 *
 * Yalnızca sağlık kontrolü ve SALT OKUNUR test uçları vardır.
 * Gerçek oda, mesaj, hediye veya coin verisine bağlanmaz; dönen bütün
 * liste örnekleri statiktir ve yanıtta "ornek: true" olarak işaretlidir.
 *
 * Çerçeveden bağımsızdır: düz Node (http) ile de Express içinde de çalışır.
 * Yakalanan istekte true, yakalanmayanda false döner.
 */

const { settings, featureFlags, blockedRequests, authConfigured } = require('./api-ayar');
const {
  applyCors,
  authenticate,
  handlePreflight,
  logRequest,
  rateLimit,
  requestIdOf,
  sendError,
  sendJson,
} = require('./api-guvenlik');
const { TEST_SAYFASI } = require('./api-test-sayfasi');

const ORNEK_ODALAR = [
  {
    id: 'ornek-oda-1',
    kod: 'ODA-1001',
    ad: 'Sinema Keyfi',
    tur: 'watch',
    durum: 'active',
    gizli: false,
    kilitli: false,
    kapasite: 10,
    uyeSayisi: 4,
    olusturmaTarihi: '2026-10-01T18:00:00.000Z',
  },
  {
    id: 'ornek-oda-2',
    kod: 'ODA-1002',
    ad: 'Sesli Sohbet',
    tur: 'voice',
    durum: 'active',
    gizli: true,
    kilitli: true,
    kapasite: 8,
    uyeSayisi: 6,
    olusturmaTarihi: '2026-10-02T20:30:00.000Z',
  },
];

const ORNEK_MESAJLAR = [
  {
    id: 'ornek-mesaj-1',
    tur: 'user',
    gonderen: { id: 'ornek-kullanici-1', ad: 'Ornek Kullanici' },
    metin: 'Bu bir statik test mesajidir; gercek sohbet verisi degildir.',
    gonderimTarihi: '2026-10-05T19:12:04.000Z',
  },
  {
    id: 'ornek-mesaj-2',
    tur: 'system',
    gonderen: { id: null, ad: 'Sistem' },
    metin: 'Ornek sistem mesaji.',
    gonderimTarihi: '2026-10-05T19:12:20.000Z',
  },
  {
    id: 'ornek-mesaj-3',
    tur: 'user',
    gonderen: { id: 'ornek-kullanici-2', ad: 'Ikinci Ornek' },
    metin: 'Sayfalama ve alan bicimi bu ornekte gosterilir.',
    gonderimTarihi: '2026-10-05T19:13:01.000Z',
  },
];

const SAYFA_BASLIKLARI = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' };

const dogrulaMetin = (value, min, max) => {
  if (value === null || value === undefined) return { ok: false, mesaj: 'zorunlu alan' };
  const text = String(value).trim();
  if (text.length < min) return { ok: false, mesaj: `en az ${min} karakter olmalı` };
  if (text.length > max) return { ok: false, mesaj: `en fazla ${max} karakter olabilir` };
  return { ok: true, deger: text };
};

const dogrulaTamSayi = (value, min, max) => {
  if (value === null || value === undefined || value === '') return { ok: false, mesaj: 'zorunlu alan' };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return { ok: false, mesaj: 'tam sayı olmalı' };
  if (parsed < min || parsed > max) return { ok: false, mesaj: `${min} ile ${max} arasında olmalı` };
  return { ok: true, deger: parsed };
};

const ODA_KIMLIGI = /^[A-Za-z0-9_-]{3,64}$/;

const bagliDurum = () => ({
  database: 'not_configured',
  liveData: 'disabled',
  voice: 'livekit_disinda_tutuldu',
});

const saglik = (req, res, extra) => {
  sendJson(req, res, 200, {
    ok: true,
    service: settings.serviceName,
    version: settings.serviceVersion,
    contractVersion: settings.contractVersion,
    environment: settings.environment,
    startedAt: settings.startedAt,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    phase: 1,
    authConfigured,
    dependencies: bagliDurum(),
    features: {
      liveRooms: featureFlags.FEATURE_LIVE_ROOMS,
      liveMessages: featureFlags.FEATURE_LIVE_MESSAGES,
      shadowRead: featureFlags.FEATURE_SHADOW_READ,
      games: featureFlags.FEATURE_GAMES,
      gifts: featureFlags.FEATURE_GIFTS,
      coins: featureFlags.FEATURE_COINS,
      ignoredFlagRequests: blockedRequests,
    },
    ...(extra || {}),
  });
};

const ROUTES = [
  {
    method: 'GET',
    path: '/health',
    auth: false,
    rateLimit: false,
    handler: (req, res) => saglik(req, res),
  },
  {
    method: 'GET',
    path: '/health/ready',
    auth: false,
    rateLimit: false,
    handler: (req, res) => {
      sendJson(req, res, 200, {
        ready: true,
        apiReady: authConfigured,
        checks: {
          process: 'up',
          auth: authConfigured ? 'configured' : 'missing_key',
          database: 'not_configured',
          liveData: 'disabled',
        },
        notes: authConfigured
          ? ['Aşama 1: canlı veriye bağlanılmadı.']
          : ['API_SERVICE_KEY veya STATIC_TEST_KEY tanımlanmalı; aksi halde /v1 uçları 503 döner.'],
        timestamp: new Date().toISOString(),
      });
    },
  },
  {
    method: 'GET',
    path: '/v1/sozlesme',
    auth: true,
    handler: (req, res) => {
      sendJson(req, res, 200, {
        ok: true,
        contractVersion: settings.contractVersion,
        phase: 1,
        liveDataConnected: false,
        auth: {
          accepted: ['Authorization: Bearer <HS256 servis tokenı>', 'X-API-Key: <statik test anahtarı>'],
          audience: settings.tokenAudience,
          issuer: settings.tokenIssuer,
        },
        endpoints: [
          { method: 'GET', path: '/health', auth: false, aciklama: 'Servis ayakta mı.' },
          { method: 'GET', path: '/health/ready', auth: false, aciklama: 'Kimlik doğrulama ve bağımlılık durumu.' },
          { method: 'GET', path: '/v1/sozlesme', auth: true, aciklama: 'Bu sözleşmenin özetI.' },
          { method: 'GET', path: '/v1/ping', auth: true, aciklama: 'Kimlik doğrulama denemesi.' },
          { method: 'GET', path: '/v1/echo', auth: true, aciklama: 'İstek doğrulama denemesi (mesaj, adet).' },
          { method: 'GET', path: '/v1/test/odalar', auth: true, aciklama: 'Statik oda listesi örneği.' },
          { method: 'GET', path: '/v1/test/mesajlar?oda=...', auth: true, aciklama: 'Statik mesaj listesi örneği.' },
        ],
      });
    },
  },
  {
    method: 'GET',
    path: '/v1/ping',
    auth: true,
    handler: (req, res) => {
      sendJson(req, res, 200, {
        ok: true,
        pong: true,
        requestId: req.apiRequestId,
        serverTime: new Date().toISOString(),
        principal: req.apiPrincipal,
      });
    },
  },
  {
    method: 'GET',
    path: '/v1/echo',
    auth: true,
    handler: (req, res) => {
      const alanlar = {
        mesaj: dogrulaMetin(req.apiQuery.get('mesaj'), 1, 140),
        adet: dogrulaTamSayi(req.apiQuery.get('adet'), 1, 10),
      };
      const hatalar = Object.entries(alanlar)
        .filter(([, sonuc]) => !sonuc.ok)
        .map(([alan, sonuc]) => ({ alan, mesaj: sonuc.mesaj }));

      if (hatalar.length) {
        sendError(req, res, 400, 'BAD_REQUEST', 'İstek doğrulaması başarısız.', { alanlar: hatalar });
        return;
      }

      sendJson(req, res, 200, {
        ok: true,
        dogrulandi: true,
        alinan: { mesaj: alanlar.mesaj.deger, adet: alanlar.adet.deger },
        canliVeri: false,
      });
    },
  },
  {
    method: 'GET',
    path: '/v1/test/odalar',
    auth: true,
    handler: (req, res) => {
      sendJson(req, res, 200, {
        ornek: true,
        kaynak: 'statik-test-verisi',
        canliVeri: false,
        adet: ORNEK_ODALAR.length,
        odalar: ORNEK_ODALAR,
      });
    },
  },
  {
    method: 'GET',
    path: '/v1/test/mesajlar',
    auth: true,
    handler: (req, res) => {
      const oda = dogrulaMetin(req.apiQuery.get('oda'), 3, 64);
      if (!oda.ok) {
        sendError(req, res, 400, 'BAD_REQUEST', 'İstek doğrulaması başarısız.', {
          alanlar: [{ alan: 'oda', mesaj: oda.mesaj }],
        });
        return;
      }
      if (!ODA_KIMLIGI.test(oda.deger)) {
        sendError(req, res, 400, 'BAD_REQUEST', 'İstek doğrulaması başarısız.', {
          alanlar: [{ alan: 'oda', mesaj: 'yalnızca harf, rakam, tire ve alt çizgi kullanılabilir' }],
        });
        return;
      }
      sendJson(req, res, 200, {
        ornek: true,
        kaynak: 'statik-test-verisi',
        canliVeri: false,
        oda: oda.deger,
        adet: ORNEK_MESAJLAR.length,
        mesajlar: ORNEK_MESAJLAR.map((mesaj) => ({ ...mesaj, odaId: oda.deger })),
      });
    },
  },
];

const findRoute = (method, path) => {
  const target = method === 'HEAD' ? 'GET' : method;
  return ROUTES.find((route) => route.method === target && route.path === path) || null;
};

function handle(req, res) {
  const startedAt = process.hrtime.bigint();
  const raw = req.url || '/';
  const queryIndex = raw.indexOf('?');
  const path = decodeURIComponent(queryIndex === -1 ? raw : raw.slice(0, queryIndex));
  const isApiPath = path === '/health' || path === '/health/ready' || path.startsWith('/v1/');

  // Aşama 1 test sayfası ve ön kontrol yanıtları
  if (path === '/test' && settings.enableTestPage) {
    req.apiRequestId = requestIdOf(req);
    res.setHeader('x-request-id', req.apiRequestId);
    res.statusCode = 200;
    res.setHeader('content-type', SAYFA_BASLIKLARI['content-type']);
    res.setHeader('cache-control', SAYFA_BASLIKLARI['cache-control']);
    if (req.method === 'HEAD') {
      res.end();
    } else {
      res.end(TEST_SAYFASI);
    }
    logRequest(req, res, startedAt);
    return true;
  }

  if (handlePreflight(req, res)) {
    logRequest(req, res, startedAt);
    return true;
  }

  const route = findRoute(req.method, path);

  if (!route) {
    if (!isApiPath) return false; // giriş dosyası kendi sayfasına/404'üne bırakır
    req.apiRequestId = requestIdOf(req);
    res.setHeader('x-request-id', req.apiRequestId);
    applyCors(req, res);
    sendError(req, res, 404, 'NOT_FOUND', `${req.method} ${path} için uç nokta yok.`);
    req.apiPath = path;
    logRequest(req, res, startedAt);
    return true;
  }

  req.apiRequestId = requestIdOf(req);
  req.apiPath = path;
  req.apiQuery = new URLSearchParams(queryIndex === -1 ? '' : raw.slice(queryIndex + 1));
  res.setHeader('x-request-id', req.apiRequestId);
  applyCors(req, res);

  if (route.rateLimit !== false) {
    const limit = rateLimit(req);
    if (limit.limited) {
      sendError(
        req,
        res,
        429,
        'RATE_LIMITED',
        'Çok fazla istek gönderildi, lütfen biraz sonra tekrar deneyin.',
        { retryAfterSeconds: limit.retryAfterSeconds },
        { 'retry-after': String(limit.retryAfterSeconds) }
      );
      logRequest(req, res, startedAt);
      return true;
    }
  }

  if (route.auth) {
    const auth = authenticate(req);
    if (!auth.ok) {
      sendError(req, res, auth.status, auth.code, auth.message, auth.details);
      logRequest(req, res, startedAt);
      return true;
    }
    req.apiPrincipal = auth.principal;
  }

  try {
    route.handler(req, res);
  } catch (error) {
    process.stderr.write(
      `${JSON.stringify({
        severity: 'ERROR',
        message: 'uç nokta hatası',
        service: settings.serviceName,
        path,
        detail: error && error.message ? error.message : String(error),
      })}\n`
    );
    if (!res.headersSent) {
      sendError(req, res, 500, 'INTERNAL', 'Beklenmeyen bir hata oluştu.');
    }
  }

  logRequest(req, res, startedAt);
  return true;
}

module.exports = { handle, ROUTES, ORNEK_ODALAR, ORNEK_MESAJLAR };