// ─── Application ───────────────────────────────────────
export const APP_NAME = 'Peage';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Modern URL Shortener with Monetization';
export const APP_URL = 'https://peage.io';
export const API_URL = 'https://api.peage.io';

// ─── CPM Tiers ─────────────────────────────────────────
export const CPM_TIERS = {
  TIER_1: 1,
  TIER_2: 2,
  TIER_3: 3,
  TIER_4: 4,
} as const;

export const CPM_TIER_COUNTRIES: Record<string, number> = {
  US: 1, GB: 1, CA: 1, AU: 1, NZ: 1, IE: 1,
  DE: 1, FR: 1, NL: 1, BE: 1, LU: 1, CH: 1,
  AT: 1, DK: 1, NO: 1, SE: 1, FI: 1, IS: 1,
  ES: 2, IT: 2, PT: 2, GR: 2, CY: 2, MT: 2,
  CZ: 2, SK: 2, PL: 2, HU: 2, RO: 2, BG: 2,
  HR: 2, SI: 2, EE: 2, LV: 2, LT: 2,
  JP: 2, KR: 2, SG: 2, HK: 2, TW: 2,
  AE: 2, QA: 2, KW: 2, SA: 2, IL: 2,
  BR: 3, MX: 3, AR: 3, CL: 3, CO: 3, PE: 3,
  IN: 3, ID: 3, PH: 3, VN: 3, TH: 3, MY: 3,
  ZA: 3, TR: 3, EG: 3, NG: 3, KE: 3,
};

export const DEFAULT_CPM_RATES = {
  1: 4.0,
  2: 2.0,
  3: 0.5,
  4: 0.1,
};

// ─── Withdrawal ────────────────────────────────────────
export const MIN_WITHDRAWAL_AMOUNT = 10;
export const MAX_WITHDRAWAL_AMOUNT = 5000;
export const MAX_PENDING_WITHDRAWALS = 3;
export const WITHDRAWAL_PROCESSING_DAYS = 7;

export const WITHDRAWAL_METHODS = [
  { id: 'paypal', name: 'PayPal', fee: 0, minAmount: 10, maxAmount: 5000 },
  { id: 'bank_transfer', name: 'Bank Transfer', fee: 2, minAmount: 50, maxAmount: 10000 },
  { id: 'crypto', name: 'Cryptocurrency', fee: 0, minAmount: 25, maxAmount: 5000 },
] as const;

// ─── Links ─────────────────────────────────────────────
export const SHORT_CODE_LENGTH = 7;
export const SHORT_CODE_MAX_LENGTH = 20;
export const SHORT_CODE_MIN_LENGTH = 3;
export const SHORT_CODE_PATTERN = /^[a-zA-Z0-9_-]+$/;
export const MAX_URL_LENGTH = 2048;
export const MAX_REDIRECTS = 5;
export const DEFAULT_EXPIRY_DAYS = 365;
export const MAX_CUSTOM_DOMAINS = 5;

// ─── Auth ──────────────────────────────────────────────
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const JWT_EXPIRY_SHORT = '15m';
export const JWT_EXPIRY_LONG = '30d';
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_SECONDS = 600;
export const MAX_LOGIN_ATTEMPTS = 5;
export const MAX_SESSIONS_PER_USER = 5;

// ─── Rate Limiting ─────────────────────────────────────
export const RATE_LIMITS = {
  GLOBAL: 1000,
  AUTH: 10,
  API: 100,
  CREATE_LINK: 30,
  WITHDRAWAL: 3,
} as const;

export const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

// ─── Pagination ────────────────────────────────────────
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;
export const DEFAULT_SORT_ORDER = 'desc' as const;

// ─── Cache ─────────────────────────────────────────────
export const CACHE_TTL = {
  LINK: 3600,
  ANALYTICS: 300,
  USER: 600,
  SESSION: 86400,
} as const;

// ─── File Upload ───────────────────────────────────────
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const AVATAR_MAX_SIZE = 2 * 1024 * 1024; // 2 MB

// ─── Referral ──────────────────────────────────────────
export const REFERRAL_COMMISSION_PERCENT = 10;
export const REFERRAL_CODE_LENGTH = 8;

// ─── User Roles ────────────────────────────────────────
export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
} as const;

// ─── User Status ───────────────────────────────────────
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
} as const;

// ─── Link Status ───────────────────────────────────────
export const LINK_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  DELETED: 'deleted',
} as const;

// ─── Withdrawal Status ─────────────────────────────────
export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

// ─── Earnings Source ───────────────────────────────────
export const EARNINGS_SOURCE = {
  CLICK: 'click',
  REFERRAL: 'referral',
  BONUS: 'bonus',
  ADJUSTMENT: 'adjustment',
} as const;

// ─── Currency ──────────────────────────────────────────
export const CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';
export const DECIMAL_PLACES = 2;
