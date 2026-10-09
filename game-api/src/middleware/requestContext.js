import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { logger } from '../logger.js';

const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/;

/** Her isteğe kimlik verir ve tamamlandığında ölçülü bir günlük satırı yazar. */
export function requestContext(req, res, next) {
  const incoming = req.get('x-request-id');
  req.id = incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
  res.setHeader('x-request-id', req.id);

  if (!config.LOG_REQUESTS) return next();

  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
    logger.info('istek tamamlandı', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs),
      userId: req.principal?.userId ?? null,
      ip: req.ip,
    });
  });

  return next();
}