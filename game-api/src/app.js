import express from 'express';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { requestContext } from './middleware/requestContext.js';
import { corsPolicy, globalLimiter, securityHeaders } from './middleware/security.js';
import { createRouter } from './routes/index.js';

/**
 * Bağımsız oyun API'si.
 *
 * Finansal uç noktalar (coin bakiyesi, bahis kesintisi, para çekme) bu API'de
 * bilinçli olarak YOKTUR ve config.js bu kapıyı FINANCIAL_OPERATIONS_ENABLED ile
 * zorlar: yasal uygunluk ve güvenlik incelemesi onaylanmadan açılamaz.
 *
 * Mevcut Base44 uygulaması bu API'yi çağırmaz; hiçbir oyun isteği buraya
 * yönlendirilmemiştir.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (config.TRUST_PROXY) app.set('trust proxy', 1);

  app.use(requestContext);
  app.use(securityHeaders);
  app.use(corsPolicy);
  app.use(express.json({ limit: '100kb' }));
  app.use(globalLimiter);

  app.use(createRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}