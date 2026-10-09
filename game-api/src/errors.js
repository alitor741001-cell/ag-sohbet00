/** İstemciye gösterilebilecek, durum kodu taşıyan hata. */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Geçersiz istek.', details) {
    return new AppError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Kimlik doğrulama gerekli.', details) {
    return new AppError(401, 'UNAUTHORIZED', message, details);
  }

  static forbidden(message = 'Bu işlem için yetkiniz yok.', details) {
    return new AppError(403, 'FORBIDDEN', message, details);
  }

  static notFound(message = 'Kayıt bulunamadı.', details) {
    return new AppError(404, 'NOT_FOUND', message, details);
  }

  static unavailable(message = 'Servis geçici olarak kullanılamıyor.', details) {
    return new AppError(503, 'UNAVAILABLE', message, details);
  }

  static internal(message = 'Beklenmeyen bir hata oluştu.', details) {
    return new AppError(500, 'INTERNAL', message, details);
  }
}

/** Express 4 async hataları kendisi yakalamaz: her işleyici bu sarmalayıcıdan geçer. */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);