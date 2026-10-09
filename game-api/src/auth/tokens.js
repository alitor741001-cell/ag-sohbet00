import { randomUUID } from 'node:crypto';
import { createRemoteJWKSet, jwtVerify, SignJWT } from 'jose';
import { config } from '../config.js';
import { AppError } from '../errors.js';

const encoder = new TextEncoder();

/** Servis tokenları: Base44 arka ucu bu imzayla kısa ömürlü token üretir. */
export const SERVICE_AUDIENCE = 'game-api';
export const SERVICE_ISSUER = 'base44-app';

const MAX_TOKEN_LENGTH = 4096;
const serviceKey = () => encoder.encode(config.GAME_API_KEY);

let remoteJwks = null;
const remoteKey = () => {
  remoteJwks ??= createRemoteJWKSet(new URL(config.SUPABASE_JWKS_URL));
  return remoteJwks;
};

/** Supabase kullanıcı tokenı: asimetrik (JWKS) veya simetrik (HS256) doğrulanır. */
async function verifySupabaseToken(token) {
  const options = { audience: config.SUPABASE_JWT_AUDIENCE };
  if (config.SUPABASE_JWT_ISSUER) options.issuer = config.SUPABASE_JWT_ISSUER;

  if (config.SUPABASE_JWKS_URL) {
    return jwtVerify(token, remoteKey(), options);
  }
  return jwtVerify(token, encoder.encode(config.SUPABASE_JWT_SECRET), {
    ...options,
    algorithms: ['HS256'],
  });
}

const principal = ({ kind, subject, email, claimedRole }) => ({
  kind,
  userId: String(subject),
  email: email ? String(email) : null,
  claimedRole: typeof claimedRole === 'string' ? claimedRole : null,
});

export async function verifyUserToken(token) {
  let payload;
  try {
    ({ payload } = await verifySupabaseToken(token));
  } catch (error) {
    throw AppError.unauthorized('Kullanıcı tokenı geçersiz veya süresi dolmuş.', {
      reason: error.code ?? 'invalid_token',
    });
  }

  if (!payload.sub) throw AppError.unauthorized('Token içinde kullanıcı kimliği yok.');

  return principal({
    kind: 'user',
    subject: payload.sub,
    email: payload.email,
    claimedRole: payload.role,
  });
}

export async function verifyServiceToken(token) {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, serviceKey(), {
      algorithms: ['HS256'],
      audience: SERVICE_AUDIENCE,
      issuer: SERVICE_ISSUER,
    }));
  } catch (error) {
    throw AppError.unauthorized('Servis tokenı geçersiz veya süresi dolmuş.', {
      reason: error.code ?? 'invalid_token',
    });
  }

  if (!payload.sub) throw AppError.unauthorized('Servis tokenında kullanıcı kimliği yok.');

  return principal({ kind: 'service', subject: payload.sub, claimedRole: payload.role });
}

/** AUTH_MODE'e göre tokenı doğrular. "both" modunda iki imza da denenir. */
export async function verifyBearer(token) {
  if (typeof token !== 'string' || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    throw AppError.unauthorized('Geçersiz token.');
  }

  if (config.AUTH_MODE === 'supabase') return verifyUserToken(token);
  if (config.AUTH_MODE === 'service') return verifyServiceToken(token);

  try {
    return await verifyUserToken(token);
  } catch (userError) {
    try {
      return await verifyServiceToken(token);
    } catch {
      // Hangi doğrulamanın başarısız olduğu istemciye söylenmez.
      throw AppError.unauthorized('Kimlik doğrulama başarısız.', {
        reason: userError.details?.reason ?? 'invalid_token',
      });
    }
  }
}

/** Servis tokenı imzalar (Base44 arka ucu ve yerel doğrulama aracı kullanır). */
export async function signServiceToken({ userId, role = 'user', ttlSeconds = 900 }) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(String(userId))
    .setIssuer(SERVICE_ISSUER)
    .setAudience(SERVICE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${Math.max(60, Math.trunc(ttlSeconds))}s`)
    .setJti(randomUUID())
    .sign(serviceKey());
}