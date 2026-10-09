import { AppError } from '../errors.js';

const PARTS = ['params', 'query', 'body'];

/**
 * İstek doğrulaması: şemaya uymayan alanlar reddedilir.
 * Doğrulanmış veri req.valid altında tutulur; ham istek nesnesi değiştirilmez.
 */
export const validate = (schemas) => (req, _res, next) => {
  const validated = {};

  for (const part of PARTS) {
    const schema = schemas[part];
    if (!schema) continue;

    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      return next(
        AppError.badRequest('İstek doğrulaması başarısız.', {
          part,
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join('.') || part,
            message: issue.message,
          })),
        })
      );
    }
    validated[part] = result.data;
  }

  req.valid = validated;
  return next();
};