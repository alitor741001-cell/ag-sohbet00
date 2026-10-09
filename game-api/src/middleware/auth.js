import { resolveRole } from '../auth/roles.js';
import { verifyBearer } from '../auth/tokens.js';
import { AppError, asyncHandler } from '../errors.js';

const BEARER = /^Bearer (.+)$/i;

/**
 * Bearer tokenı doğrular ve kullanıcının rolünü sunucu tarafında çözer.
 * optional: true olduğunda token yoksa istek reddedilmez (req.principal boş kalır).
 */
export const authenticate = ({ optional = false } = {}) =>
  asyncHandler(async (req, _res, next) => {
    const header = req.get('authorization') ?? '';
    const match = header.match(BEARER);

    if (!match) {
      if (optional) return next();
      throw AppError.unauthorized('Authorization: Bearer <token> başlığı gerekli.');
    }

    const principal = await verifyBearer(match[1].trim());
    principal.role = await resolveRole(principal);
    req.principal = principal;
    return next();
  });

/** Rol kontrolü: roller her zaman veritabanından çözülmüş değerdir. */
export const requireRole = (...allowed) => (req, _res, next) => {
  if (!req.principal) return next(AppError.unauthorized('Kimlik doğrulama gerekli.'));
  if (!allowed.includes(req.principal.role)) {
    return next(
      AppError.forbidden(`Bu işlem için gerekli rol: ${allowed.join(' veya ')}.`)
    );
  }
  return next();
};