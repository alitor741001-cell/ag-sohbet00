import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from '../config.js';
import { logger } from '../logger.js';

/** JSON API için güvenlik başlıkları (CSP gerekmez). */
export const securityHeaders = helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/**
 * Tarayıcı erişimi yalnızca izinli kaynaklara açılır; liste boşsa yalnızca
 * sunucudan sunucuya çağrılara izin verilir (mobil uygulama CORS istemez).
 */
export const corsPolicy = cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (config.CORS_ORIGINS.includes('*') || config.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    logger.warn('izin verilmeyen kaynak', { origin });
    return callback(null, false);
  },
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  credentials: false,
  maxAge: 600,
});

/** Kaba kuvvet ve kötüye kullanım sınırı. Sağlık kontrolü hariç tutulur. */
export const globalLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: (req) => req.path === '/health',
  keyGenerator: (req) => req.principal?.userId ?? req.ip,
  handler: (req, res) => {
    res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: 'Çok fazla istek gönderildi, lütfen biraz sonra tekrar deneyin.',
        requestId: req.id,
      },
    });
  },
});