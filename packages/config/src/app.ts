export const appConfig = {
  name: 'Peage',
  version: '1.0.0',
  description: 'Modern URL Shortener with Monetization',
  
  urls: {
    app: process.env.APP_URL || 'https://peage.io',
    api: process.env.API_URL || 'https://api.peage.io',
    cdn: process.env.CDN_URL || 'https://cdn.peage.io',
  },
  
  environment: process.env.APP_ENV || 'development',
  isProduction: process.env.APP_ENV === 'production',
  isStaging: process.env.APP_ENV === 'staging',
  isDevelopment: process.env.APP_ENV === 'development' || !process.env.APP_ENV,
  
  features: {
    registration: process.env.FEATURE_REGISTRATION !== 'false',
    payments: process.env.FEATURE_PAYMENTS !== 'false',
    referrals: process.env.FEATURE_REFERRALS !== 'false',
    customDomains: process.env.FEATURE_CUSTOM_DOMAINS === 'true',
    apiAccess: process.env.FEATURE_API_ACCESS !== 'false',
  },
} as const;
