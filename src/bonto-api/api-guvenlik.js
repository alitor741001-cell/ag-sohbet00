/* global process, module, require, Buffer */
'use strict';
/**
 * api-guvenlik.js — istek kimliği, CORS, hız sınırı ve token doğrulaması.
 *
 * Harici paket kullanmaz: yalnızca Node.js'in kendi modülleri (node:crypto).
 * Token doğrulaması HMAC-SHA256 (HS256) imzasını, süresini (exp), hedef kitleyi
 * (aud) ve vereni (iss) denetler. Karşılaştırmalar zamanlama saldırısına kapalıdır.
 */

const crypto = require('node:crypto');
const {
  settings,
  authConfigured,
  serviceKeyUsable,
  staticKeyUsable,
  userTokenUsable,
  userTokenAyar,
} = require('./api-ayar');
const { kullaniciTokeniDogrula } = require('./api-kullanici-token');

const MAX_TOKEN_LENGTH = 4096;
const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/;

const fromBase64Url = (value) => Buffer.from(value, 'base64url');
const jsonHeaders = () => ({
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
});

function safeEqual(a, b) {
  const left = Buffer.from(String(a), 'utf8');
  const right = Buffer.from(String(b), 'utf8');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

/** HS256 imzalı servis tokenı üretir (Aşama 2'de Base44 arka ucu kullanacak). */
function signServiceToken({ userId, role = 'user', ttlSeconds = 900, key = settings.serviceKey }) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      typ: 'service',
      sub: String(userId),
      role,
      iss: settings.tokenIssuer,
      aud: settings.tokenAudience,
      iat: now,
      exp: now + Math.max(60, Math.trunc(ttlSeconds)),
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', key)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyServiceToken(token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > MAX_TOKEN_LENGTH) {
    return { ok: false, reason: 'uzunluk' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'bicim' };

  let header;
  let payload;
  try {
    header = JSON.parse(fromBase64Url(parts[0]).toString('utf8'));
    payload = JSON.parse(fromBase64Url(parts[1]).toString('utf8'));
  } catch {
    return { ok: false, reason: 'cozumlenemedi' };
  }

  if (!header || header.alg !== 'HS256') return { ok: false, reason: 'algoritma' };
  // Tür ayrımı iki yönlüdür: kullanıcı tokenı (typ=user) servis kimliği kazanamaz —
  // servis anahtarıyla imzalı olsa bile servis ucu olarak kabul edilmez.
  if (payload.typ === 'user') return { ok: false, reason: 'token_turu' };

  const expected = crypto
    .createHmac('sha256', settings.serviceKey)
    .update(`${parts[0]}.${parts[1]}`)
    .digest();
  const given = fromBase64Url(parts[2]);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'imza' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    return { ok: false, reason: 'suresi_dolmus' };
  }
  if (payload.aud && payload.aud !== settings.tokenAudience) {
    return { ok: false, reason: 'hedef_kitle' };
  }
  if (payload.iss && payload.iss !== settings.tokenIssuer) {
    return { ok: false, reason: 'veren' };
  }

  return {
    ok: true,
    principal: {
      kind: 'service',
      userId: payload.sub ? String(payload.sub) : null,
      role: typeof payload.role === 'string' ? payload.role : null,
    },
  };
}

/** Token veya statik test anahtarıyla kimlik doğrulama. Eksikse kapalı devre (503). */
function authenticate(req) {
  if (!authConfigured) {
    return {
      ok: false,
      status: 503,
      code: 'AUTH_NOT_CONFIGURED',
      message:
        'API anahtarı tanımlı değil. Ortam değişkenlerine API_SERVICE_KEY veya STATIC_TEST_KEY ekleyin.',
    };
  }

  const header = String(req.headers.authorization || '');
  const match = /^Bearer\s+(.+)$/i.exec(header);

  if (match) {
    const belirtec = match[1].trim();

    // 1) Kullanıcı tokenı (typ=user). Yalnızca kendi imza anahtarıyla doğrulanır;
    //    servis tokenı buradan geçemez, kullanıcı tokenı da servis yetkisi kazanmaz.
    if (userTokenUsable) {
      const kullanici = kullaniciTokeniDogrula(belirtec, { ayar: userTokenAyar });
      if (kullanici.ok) return { ok: true, principal: kullanici.principal };
    }

    // 2) Servis tokenı (Base44 arka ucu).
    if (serviceKeyUsable) {
      const result = verifyServiceToken(belirtec);
      if (result.ok) return result;
      return {
        ok: false,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'Token doğrulanamadı.',
        details: { reason: result.reason },
      };
    }

    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Token doğrulanamadı.' };
  }

  const staticKey = req.headers['x-api-key'];
  if (typeof staticKey === 'string' && staticKey.length) {
    if (!staticKeyUsable) {
      return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'Statik test anahtarı kapalı.' };
    }
    if (safeEqual(staticKey, settings.staticTestKey)) {
      return { ok: true, principal: { kind: 'static-test-key', userId: null, role: 'test' } };
    }
    return { ok: false, status: 401, code: 'UNAUTHORIZED', message: 'API anahtarı geçersiz.' };
  }

  return {
    ok: false,
    status: 401,
    code: 'UNAUTHORIZED',
    message: 'Authorization: Bearer <token> veya X-API-Key başlığı gerekli.',
  };
}

function requestIdOf(req) {
  const incoming = req.headers['x-request-id'];
  if (typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming)) return incoming;
  return crypto.randomUUID();
}

function clientAddress(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) return forwarded.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || 'bilinmiyor';
}

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (typeof origin !== 'string' || !origin.length) return false;
  const allowed = settings.corsOrigins.includes('*') || settings.corsOrigins.includes(origin);
  if (!allowed) return false;
  res.setHeader('access-control-allow-origin', origin);
  res.setHeader('vary', 'Origin');
  res.setHeader('access-control-allow-headers', 'authorization, content-type, x-api-key, x-request-id');
  res.setHeader('access-control-allow-methods', 'GET, HEAD, OPTIONS');
  res.setHeader('access-control-max-age', '600');
  return true;
}

/** OPTIONS ön kontrolü: gövdeli yanıt dönmez, yalnızca başlıklar. */
function handlePreflight(req, res) {
  if (req.method !== 'OPTIONS') return false;
  applyCors(req, res);
  res.statusCode = 204;
  res.end();
  return true;
}

const buckets = new Map();

function rateLimit(req) {
  const now = Date.now();
  if (buckets.size > 5000) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
  }

  const key = clientAddress(req);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + settings.rateWindowMs });
    return { limited: false };
  }

  current.count += 1;
  if (current.count > settings.rateMax) {
    return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  return { limited: false };
}

function sendJson(req, res, status, body, extraHeaders) {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader('content-type', jsonHeaders()['content-type']);
  res.setHeader('cache-control', 'no-store');
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) res.setHeader(name, value);
  }
  res.setHeader('content-length', Buffer.byteLength(payload));
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  res.end(payload);
}

function sendError(req, res, status, code, message, details, extraHeaders) {
  const body = { error: { code, message, requestId: req.apiRequestId || null } };
  if (details) body.error.details = details;
  sendJson(req, res, status, body, extraHeaders);
}

function logRequest(req, res, startedAt) {
  if (!settings.logRequests) return;
  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  const line = {
    severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
    message: 'istek',
    service: settings.serviceName,
    requestId: req.apiRequestId || null,
    method: req.method,
    path: req.apiPath || req.url,
    status: res.statusCode,
    durationMs: Math.round(durationMs),
    ip: clientAddress(req),
    principal: req.apiPrincipal ? req.apiPrincipal.kind : null,
    time: new Date().toISOString(),
  };
  process.stdout.write(`${JSON.stringify(line)}\n`);
}

module.exports = {
  applyCors,
  authenticate,
  clientAddress,
  handlePreflight,
  logRequest,
  rateLimit,
  requestIdOf,
  safeEqual,
  sendError,
  sendJson,
  signServiceToken,
  verifyServiceToken,
};