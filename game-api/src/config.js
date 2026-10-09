import { z } from 'zod';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const asBool = (fallback) =>
  z.string().optional().transform((value) => {
    if (value === undefined || value.trim() === '') return fallback;
    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
  });

const asInt = (fallback, min, max) =>
  z.string().optional().transform((value) => {
    const parsed = Number(value);
    if (value === undefined || value.trim() === '' || !Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(parsed)));
  });

const asList = (fallback) =>
  z.string().optional().transform((value) => {
    if (!value || !value.trim()) return fallback;
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  });

/** Tablo/kolon adları sorguya gömüldüğü için yalnızca güvenli adlar kabul edilir. */
const asIdentifier = (fallback) =>
  z.string().optional().transform((value, ctx) => {
    const name = value && value.trim() ? value.trim() : fallback;
    if (!IDENTIFIER.test(name)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `geçersiz tablo/kolon adı: "${name}" (harf, rakam ve alt çizgi kullanılmalı)`,
      });
    }
    return name;
  });

const asIdentifierList = (fallback) =>
  z.string().optional().transform((value, ctx) => {
    const source = value && value.trim() ? value : fallback.join(',');
    const items = source
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const invalid = items.filter((item) => !IDENTIFIER.test(item));
    if (invalid.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `geçersiz kolon adları: ${invalid.join(', ')}`,
      });
    }
    return items;
  });

const optionalText = () =>
  z.string().optional().transform((value) => (value && value.trim() ? value.trim() : undefined));

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: asInt(8080, 1, 65535),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    LOG_REQUESTS: asBool(true),
    SERVICE_NAME: z.string().default('game-api'),
    SERVICE_VERSION: z.string().default('0.1.0'),

    // Supabase — yalnızca sunucu tarafı.
    SUPABASE_URL: z
      .string({ required_error: 'SUPABASE_URL zorunludur' })
      .url('SUPABASE_URL geçerli bir https adresi olmalı'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string({ required_error: 'SUPABASE_SERVICE_ROLE_KEY zorunludur' })
      .min(20, 'SUPABASE_SERVICE_ROLE_KEY çok kısa'),
    SUPABASE_SCHEMA: asIdentifier('public'),
    SUPABASE_JWKS_URL: optionalText(),
    SUPABASE_JWT_SECRET: optionalText(),
    SUPABASE_JWT_AUDIENCE: z.string().default('authenticated'),
    SUPABASE_JWT_ISSUER: optionalText(),

    // Servis kimliği.
    GAME_API_KEY: z
      .string({ required_error: 'GAME_API_KEY zorunludur' })
      .min(32, 'GAME_API_KEY en az 32 karakter olmalı'),
    AUTH_MODE: z.enum(['supabase', 'service', 'both']).default('both'),

    // Rol çözümlemesi.
    ROLE_LOOKUP_ENABLED: asBool(true),
    ROLE_CACHE_TTL_MS: asInt(30000, 1000, 600000),
    USERS_TABLE: asIdentifier('users'),
    USERS_ID_COLUMN: asIdentifier('id'),
    USERS_ROLE_COLUMN: asIdentifier('role'),

    // Oyun tabloları (yalnızca okuma).
    ROOMS_TABLE: asIdentifier('rooms'),
    ROOMS_ID_COLUMN: asIdentifier('id'),
    ROOMS_STATUS_COLUMN: asIdentifier('status'),
    ROOMS_STATUS_ACTIVE: z.string().default('active'),
    ROOMS_ORDER_COLUMN: asIdentifier('created_date'),
    ROOMS_PUBLIC_COLUMNS: asIdentifierList([
      'id',
      'name',
      'status',
      'room_type',
      'seat_count',
      'max_users',
      'created_date',
    ]),

    // Ağ ve istek sınırları.
    CORS_ORIGINS: asList([]),
    RATE_LIMIT_WINDOW_MS: asInt(60000, 1000, 3600000),
    RATE_LIMIT_MAX: asInt(120, 10, 100000),
    TRUST_PROXY: asBool(true),
    MAX_PAGE_SIZE: asInt(50, 1, 200),
    ALLOW_INSECURE_DEV: asBool(false),

    // Finansal işlemler: iki anahtar birlikte olmadan açılamaz.
    FINANCIAL_OPERATIONS_ENABLED: asBool(false),
    FINANCIAL_LEGAL_REVIEW_APPROVED: asBool(false),
  })
  .superRefine((env, ctx) => {
    const production = env.NODE_ENV === 'production';

    if (env.AUTH_MODE !== 'service' && !env.SUPABASE_JWKS_URL && !env.SUPABASE_JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_JWT_SECRET'],
        message:
          'Kullanıcı tokenlarını doğrulamak için SUPABASE_JWKS_URL veya SUPABASE_JWT_SECRET gerekir.',
      });
    }

    if (production && env.ALLOW_INSECURE_DEV) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ALLOW_INSECURE_DEV'],
        message: 'ALLOW_INSECURE_DEV üretim ortamında açılamaz.',
      });
    }

    if (env.FINANCIAL_OPERATIONS_ENABLED && !env.FINANCIAL_LEGAL_REVIEW_APPROVED) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['FINANCIAL_OPERATIONS_ENABLED'],
        message:
          'Finansal işlemler, yasal uygunluk ve güvenlik incelemesi onaylanmadan açılamaz.',
      });
    }

    if (env.SUPABASE_JWKS_URL && !/^https:\/\//.test(env.SUPABASE_JWKS_URL)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_JWKS_URL'],
        message: 'SUPABASE_JWKS_URL https ile başlamalı.',
      });
    }

    if (env.SUPABASE_JWT_ISSUER && !/^https?:\/\//.test(env.SUPABASE_JWT_ISSUER)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['SUPABASE_JWT_ISSUER'],
        message: 'SUPABASE_JWT_ISSUER geçerli bir adres olmalı.',
      });
    }
  });

const parsed = environmentSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map(
    (issue) => `${issue.path.join('.') || '(kök)'}: ${issue.message}`
  );
  const error = new Error(`Ortam değişkenleri geçersiz:\n- ${details.join('\n- ')}`);
  error.code = 'INVALID_CONFIG';
  error.details = details;
  throw error;
}

const env = parsed.data;

export const config = Object.freeze({
  ...env,
  isProduction: env.NODE_ENV === 'production',
  /** Oda kayıtlarında dışarı verilebilecek kolonlar: kimlik her zaman dahildir. */
  roomsPublicColumns: [...new Set([env.ROOMS_ID_COLUMN, ...env.ROOMS_PUBLIC_COLUMNS])],
  /** Finansal uç noktalar yalnızca iki anahtar birlikteyken açılabilir. */
  financialOperationsEnabled:
    env.FINANCIAL_OPERATIONS_ENABLED && env.FINANCIAL_LEGAL_REVIEW_APPROVED,
});