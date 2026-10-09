/* global process, module */
'use strict';
/**
 * api-ayar.js — Aşama 1 ayarları.
 *
 * • Bütün gizli değerler yalnızca ortam değişkenlerinden okunur; bu dosyada sır yoktur.
 * • Canlı veriye dokunan bütün özellik bayrakları KAPALIDIR ve bu dosya onları
 *   açmaya izin vermez (açık istenirse uyarı verilir ve yok sayılır).
 * • Hiçbir zaman dosya içine anahtar yazmayın.
 */

const readText = (name) => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
};

const readBool = (name, fallback) => {
  const value = readText(name);
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const readInt = (name, fallback, min, max) => {
  const value = Number(readText(name));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
};

const readList = (name) => {
  const value = readText(name);
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const MIN_KEY_LENGTH = 32;

const settings = Object.freeze({
  port: readInt('PORT', 3000, 1, 65535),
  host: readText('HOST') || '0.0.0.0',
  environment: readText('NODE_ENV') || 'production',
  serviceName: readText('SERVICE_NAME') || 'ag-backend',
  serviceVersion: readText('SERVICE_VERSION') || '0.1.0',
  contractVersion: readText('CONTRACT_VERSION') || 'asama-1',
  startedAt: new Date().toISOString(),

  // Kimlik doğrulama
  authMode: (readText('AUTH_MODE') || 'both').toLowerCase(), // service | static | both
  serviceKey: readText('API_SERVICE_KEY'),
  staticTestKey: readText('STATIC_TEST_KEY'),
  tokenAudience: readText('TOKEN_AUDIENCE') || 'ag-backend-api',
  tokenIssuer: readText('TOKEN_ISSUER') || 'base44-app',
  minKeyLength: MIN_KEY_LENGTH,

  // Ağ
  corsOrigins: readList('CORS_ORIGINS'),
  rateWindowMs: readInt('RATE_LIMIT_WINDOW_MS', 60000, 1000, 3600000),
  rateMax: readInt('RATE_LIMIT_MAX', 120, 5, 100000),
  logRequests: readBool('LOG_REQUESTS', true),
  enableTestPage: readBool('ENABLE_TEST_PAGE', true),
});

/**
 * Aşama 1 kilidi: bu bayraklar KAPALI başlar ve bu sürümde açılamaz.
 * Biri açık istekte bulunursa yok sayılır, /health yanıtında bildirilir.
 */
const GATED_FEATURES = [
  'FEATURE_LIVE_ROOMS',
  'FEATURE_LIVE_MESSAGES',
  'FEATURE_SHADOW_READ',
  'FEATURE_GAMES',
  'FEATURE_GIFTS',
  'FEATURE_COINS',
];

const featureFlags = Object.freeze(
  GATED_FEATURES.reduce((flags, name) => {
    flags[name] = false;
    return flags;
  }, {})
);

const blockedRequests = GATED_FEATURES.filter((name) => readBool(name, false));

const allowServiceToken = ['service', 'both'].includes(settings.authMode);
const allowStaticKey = ['static', 'both'].includes(settings.authMode);

const serviceKeyUsable = allowServiceToken &&
  typeof settings.serviceKey === 'string' &&
  settings.serviceKey.length >= MIN_KEY_LENGTH;

const staticKeyUsable = allowStaticKey &&
  typeof settings.staticTestKey === 'string' &&
  settings.staticTestKey.length >= MIN_KEY_LENGTH;

const authConfigured = serviceKeyUsable || staticKeyUsable;

const warnings = [];
if (blockedRequests.length) {
  warnings.push(
    `Aşama 1 kilidi: şu bayraklar açık istekte bulunuyor ve yok sayıldı → ${blockedRequests.join(', ')}`
  );
}
if (!authConfigured) {
  warnings.push(
    `API anahtarı tanımlı değil (en az ${MIN_KEY_LENGTH} karakter). /v1 uçları 503 döner; /health çalışmaya devam eder.`
  );
}
if (settings.corsOrigins.length === 0) {
  warnings.push('CORS_ORIGINS boş: tarayıcıdan yalnızca aynı adres (same-origin) çağrı yapılabilir.');
}
for (const warning of warnings) {
  console.warn(`[${settings.serviceName}] UYARI: ${warning}`);
}

module.exports = {
  settings,
  featureFlags,
  blockedRequests,
  authConfigured,
  serviceKeyUsable,
  staticKeyUsable,
  GATED_FEATURES,
  MIN_KEY_LENGTH,
  warnings,
};