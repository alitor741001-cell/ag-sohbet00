import { config } from '../config.js';
import { AppError } from '../errors.js';
import { logger } from '../logger.js';

export function notFoundHandler(req, _res, next) {
  next(new AppError(404, 'NOT_FOUND', `${req.method} ${req.path} için uç nokta bulunamadı.`));
}

const clientFacingMessage = (error, status) => {
  if (error.type === 'entity.parse.failed') return 'Gövde geçerli JSON değil.';
  if (error.type === 'entity.too.large') return 'İstek gövdesi çok büyük.';
  if (status >= 500 && !(error instanceof AppError)) return 'Beklenmeyen bir sunucu hatası oluştu.';
  return error.message;
};

/** Tek hata çıkışı: günlüğe ayrıntı, istemciye yalnızca güvenli mesaj. */
export function errorHandler(error, req, res, _next) {
  const known = error instanceof AppError;
  const status = known
    ? error.status
    : Number.isInteger(error.status) && error.status >= 400
      ? error.status
      : 500;

  const logFields = {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    status,
    code: error.code ?? 'UNKNOWN',
    userId: req.principal?.userId ?? null,
    detail: error.message,
  };

  if (status >= 500) {
    logger.error('istek başarısız', { ...logFields, stack: config.isProduction ? undefined : error.stack });
  } else {
    logger.warn('istek reddedildi', logFields);
  }

  const body = {
    error: {
      code: known ? error.code : (error.code ?? 'INTERNAL'),
      message: clientFacingMessage(error, status),
      requestId: req.id,
    },
  };
  if (known && error.details) body.error.details = error.details;

  res.status(status).json(body);
}