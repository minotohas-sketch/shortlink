export const limitsConfig = {
  // Rate Limiting
  rateLimit: {
    global: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_GLOBAL || '1000'),
    },
    auth: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_AUTH || '10'),
    },
    api: {
      windowMs: 60_000,
      max: parseInt(process.env.RATE_LIMIT_API || '100'),
    },
    createLink: {
      windowMs: 60_000,
      max: 30,
    },
    withdrawal: {
      windowMs: 3_600_000,
      max: 3,
    },
  },
  
  // Withdrawals
  withdrawals: {
    minAmount: 10,
    maxAmount: 5000,
    maxPending: 3,
    processingDays: 7,
  },
  
  // Links
  links: {
    shortCodeMin: 3,
    shortCodeMax: 20,
    maxUrlLength: 2048,
    maxCustomDomains: 5,
    maxTags: 10,
    maxBulkCreate: 50,
  },
  
  // Users
  users: {
    maxSessions: 5,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    passwordMaxLength: 128,
  },
  
  // Files
  files: {
    avatarMaxSize: 2 * 1024 * 1024,
    uploadMaxSize: 10 * 1024 * 1024,
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  // Pagination
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  
  // Cache TTLs (seconds)
  cache: {
    link: 3600,
    analytics: 300,
    user: 600,
    session: 86400,
  },
} as const;
