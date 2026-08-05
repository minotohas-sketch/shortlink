/**
 * Application Constants
 * 
 * Valeurs constantes utilisées dans toute l'application.
 */

// ─── Time ──────────────────────────────────────────────
export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;
export const ONE_WEEK_MS = 7 * ONE_DAY_MS;
export const ONE_MONTH_MS = 30 * ONE_DAY_MS;

// ─── TTLs ──────────────────────────────────────────────
export const TTL = {
  ACCESS_TOKEN: 15 * 60,        // 15 minutes
  REFRESH_TOKEN: 7 * ONE_DAY_MS / 1000,  // 7 jours
  EMAIL_VERIFICATION: 3600,     // 1 heure
  PASSWORD_RESET: 3600,         // 1 heure
  OTP: 600,                     // 10 minutes
  CACHE_LINK: 3600,            // 1 heure
  CACHE_ANALYTICS: 300,        // 5 minutes
  CACHE_USER: 600,             // 10 minutes
  RATE_LIMIT_WINDOW: 60,       // 1 minute
} as const;

// ─── Sizes ─────────────────────────────────────────────
export const SIZE = {
  MAX_URL_LENGTH: 2048,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_USERNAME_LENGTH: 30,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  SHORT_CODE_MIN: 3,
  SHORT_CODE_MAX: 20,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 50,
  MAX_BULK_LINKS: 50,
  AVATAR_MAX_SIZE: 2 * 1024 * 1024,  // 2 MB
  FILE_MAX_SIZE: 10 * 1024 * 1024,   // 10 MB
} as const;

// ─── Limits ────────────────────────────────────────────
export const LIMIT = {
  MAX_CUSTOM_DOMAINS: 5,
  MAX_API_KEYS: 10,
  MAX_PENDING_WITHDRAWALS: 3,
  MAX_SESSIONS_PER_USER: 5,
  MAX_LOGIN_ATTEMPTS: 5,
  MIN_WITHDRAWAL_AMOUNT: 10,
  MAX_WITHDRAWAL_AMOUNT: 5000,
} as const;

// ─── Pagination ────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_ORDER: 'desc' as const,
  DEFAULT_SORT: 'createdAt',
} as const;

// ─── Currency ──────────────────────────────────────────
export const CURRENCY = {
  CODE: 'USD',
  SYMBOL: '$',
  DECIMALS: 2,
} as const;

// ─── CPM Tiers ─────────────────────────────────────────
export const CPM = {
  TIER_1_COUNTRIES: ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'DE', 'FR', 'NL', 'BE', 'LU', 'CH', 'AT', 'DK', 'NO', 'SE', 'FI', 'IS'],
  TIER_2_COUNTRIES: ['ES', 'IT', 'PT', 'GR', 'CY', 'MT', 'CZ', 'SK', 'PL', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'JP', 'KR', 'SG', 'HK', 'TW', 'AE', 'QA', 'KW', 'SA', 'IL'],
  TIER_3_COUNTRIES: ['BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'IN', 'ID', 'PH', 'VN', 'TH', 'MY', 'ZA', 'TR', 'EG', 'NG', 'KE'],
  DEFAULT_RATE: 0.1,
  RATES: {
    1: 4.0,
    2: 2.0,
    3: 0.5,
    4: 0.1,
  },
} as const;

// ─── Feature Flags ─────────────────────────────────────
export const FEATURES = {
  REGISTRATION: 'FEATURE_REGISTRATION',
  PAYMENTS: 'FEATURE_PAYMENTS',
  REFERRALS: 'FEATURE_REFERRALS',
  CUSTOM_DOMAINS: 'FEATURE_CUSTOM_DOMAINS',
  API_ACCESS: 'FEATURE_API_ACCESS',
  ADS: 'FEATURE_ADS',
  ANALYTICS: 'FEATURE_ANALYTICS',
} as const;

// ─── Queue Names ───────────────────────────────────────
export const QUEUES = {
  EMAIL: 'EMAIL_QUEUE',
  ANALYTICS: 'ANALYTICS_QUEUE',
  PAYOUT: 'PAYOUT_QUEUE',
  NOTIFICATION: 'NOTIFICATION_QUEUE',
} as const;

// ─── Cache Keys ────────────────────────────────────────
export const CACHE_KEYS = {
  LINK: (code: string) => `link:${code}`,
  USER: (id: string) => `user:${id}`,
  SESSION: (token: string) => `session:${token}`,
  RATE_LIMIT: (key: string) => `ratelimit:${key}`,
  ANALYTICS: (date: string) => `aggregate:${date}`,
} as const;

// ─── Error Codes ───────────────────────────────────────
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  LINK_NOT_FOUND: 'LINK_NOT_FOUND',
  LINK_EXPIRED: 'LINK_EXPIRED',
  LINK_DISABLED: 'LINK_DISABLED',
  SHORT_CODE_TAKEN: 'SHORT_CODE_TAKEN',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  USERNAME_EXISTS: 'USERNAME_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
} as const;
