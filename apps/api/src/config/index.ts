import { Environment } from '../core/env';

// ─── Application ───────────────────────────────────────
export const appConfig = {
  name: 'Peage',
  version: '1.0.0',
  environment: Environment.get().APP_ENV,
  isProduction: Environment.isProduction,
  isDevelopment: Environment.isDevelopment,
  url: Environment.get().APP_URL,
  apiUrl: Environment.get().API_URL,
};

// ─── Auth ──────────────────────────────────────────────
export const authConfig = {
  jwt: {
    secret: Environment.get().JWT_SECRET,
    expiresIn: Environment.get().JWT_EXPIRES_IN,
    refreshSecret: Environment.get().JWT_REFRESH_SECRET,
    refreshExpiresIn: Environment.get().JWT_REFRESH_EXPIRES_IN,
  },
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  },
  otp: {
    length: 6,
    expiresIn: 600, // 10 minutes
    maxAttempts: 5,
  },
  session: {
    maxDevices: 5,
    inactivityTimeout: 30 * 24 * 3600, // 30 jours
  },
};

// ─── Rate Limiting ─────────────────────────────────────
export const rateLimitConfig = {
  global: {
    windowMs: 60000,
    max: Environment.get().RATE_LIMIT_GLOBAL,
  },
  auth: {
    windowMs: 60000,
    max: Environment.get().RATE_LIMIT_AUTH,
  },
  api: {
    windowMs: 60000,
    max: Environment.get().RATE_LIMIT_API,
  },
  createLink: {
    windowMs: 60000,
    max: 30,
  },
  withdrawal: {
    windowMs: 3600000,
    max: 3,
  },
};

// ─── Links ─────────────────────────────────────────────
export const linkConfig = {
  shortCodeLength: Environment.get().SHORT_CODE_LENGTH,
  maxRedirects: 5,
  defaultExpiryDays: 365,
  maxCustomDomains: 5,
  allowedProtocols: ['http:', 'https:'],
  maxUrlLength: 2048,
  bannedDomains: [
    '127.0.0.1',
    'localhost',
    '0.0.0.0',
  ],
};

// ─── Earnings & CPM ────────────────────────────────────
export const earningsConfig = {
  cpmRates: {
    tier1: Environment.get().CPM_TIER_1,
    tier2: Environment.get().CPM_TIER_2,
    tier3: Environment.get().CPM_TIER_3,
    tier4: Environment.get().CPM_TIER_4,
  },
  referralCommission: Environment.get().REFERRAL_COMMISSION_PERCENT,
  minPayout: 10,
  payoutMethods: ['paypal', 'stripe', 'bank_transfer'],
  payoutProcessingDays: 7,
};

// ─── Withdrawals ───────────────────────────────────────
export const withdrawalConfig = {
  minAmount: Environment.get().MIN_WITHDRAWAL_AMOUNT,
  maxAmount: 5000,
  processingDays: 7,
  maxPendingWithdrawals: 3,
  methods: [
    { id: 'paypal', name: 'PayPal', fee: 0, minAmount: 10 },
    { id: 'stripe', name: 'Bank Transfer', fee: 2, minAmount: 50 },
    { id: 'crypto', name: 'Cryptocurrency', fee: 0, minAmount: 25 },
  ],
};

// ─── Cache ─────────────────────────────────────────────
export const cacheConfig = {
  link: {
    ttl: Environment.get().CACHE_TTL_LINK,
  },
  analytics: {
    ttl: 300,
  },
  user: {
    ttl: 600,
  },
  session: {
    ttl: 86400,
  },
};

// ─── Pagination ────────────────────────────────────────
export const paginationConfig = {
  defaultLimit: 20,
  maxLimit: 100,
  defaultSort: 'createdAt',
  defaultOrder: 'desc' as const,
};

// ─── File Upload ───────────────────────────────────────
export const uploadConfig = {
  maxFileSize: 10 * 1024 * 1024, // 10 MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  allowedDocumentTypes: ['application/pdf', 'text/csv', 'application/json'],
  avatarMaxSize: 2 * 1024 * 1024, // 2 MB
};

// ─── Notifications ─────────────────────────────────────
export const notificationConfig = {
  email: {
    from: Environment.get().EMAIL_FROM,
    replyTo: Environment.get().EMAIL_FROM,
  },
  templates: {
    welcome: 'welcome',
    verifyEmail: 'verify-email',
    resetPassword: 'reset-password',
    withdrawalRequest: 'withdrawal-request',
    withdrawalApproved: 'withdrawal-approved',
    withdrawalRejected: 'withdrawal-rejected',
    paymentReceived: 'payment-received',
    linkDisabled: 'link-disabled',
  },
};

// ─── Feature Flags ─────────────────────────────────────
export const features = {
  registration: Environment.get().FEATURE_REGISTRATION,
  payments: Environment.get().FEATURE_PAYMENTS,
  referrals: Environment.get().FEATURE_REFERRALS,
  customDomains: false,
  apiAccess: true,
  ads: true,
  analytics: true,
};
