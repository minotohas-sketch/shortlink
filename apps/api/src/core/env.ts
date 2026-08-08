import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('production'),
  APP_NAME: z.string().default('Peage'),
  APP_URL: z.string().default('https://shortlink-7qt.pages.dev'),
  API_URL: z.string().default('https://peage-api-production.maconthys.workers.dev'),
  JWT_SECRET: z.string().default('dev-secret-32-chars-minimum-required!!'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret-32-chars-minimum!!'),
  ENCRYPTION_KEY: z.string().default('dev-encryption-key-32-chars-here!'),
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@peage.io'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
  CORS_ORIGINS: z.string().default('*'),
  RATE_LIMIT_GLOBAL: z.coerce.number().default(1000),
  RATE_LIMIT_AUTH: z.coerce.number().default(10),
  RATE_LIMIT_API: z.coerce.number().default(100),
  CPM_TIER_1: z.coerce.number().default(4.0),
  CPM_TIER_2: z.coerce.number().default(2.0),
  CPM_TIER_3: z.coerce.number().default(0.5),
  CPM_TIER_4: z.coerce.number().default(0.1),
  REFERRAL_COMMISSION_PERCENT: z.coerce.number().default(10),
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().default(10),
  SHORT_CODE_LENGTH: z.coerce.number().default(7),
  CACHE_TTL_LINK: z.coerce.number().default(3600),
  FEATURE_REGISTRATION: z.coerce.boolean().default(true),
  FEATURE_PAYMENTS: z.coerce.boolean().default(true),
  FEATURE_REFERRALS: z.coerce.boolean().default(true),
  STRIPE_SECRET_KEY: z.string().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().default(''),
  PAYPAL_CLIENT_ID: z.string().default(''),
  PAYPAL_CLIENT_SECRET: z.string().default(''),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;
const DEFAULT_ENV: Env = envSchema.parse({});

export function validateEnv(env: unknown): Env {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error('⚠️ Invalid env, using defaults:', JSON.stringify(parsed.error.flatten().fieldErrors));
    return { ...DEFAULT_ENV };
  }
  return parsed.data;
}

export class Environment {
  private static env: Env = DEFAULT_ENV;

  static init(rawEnv: unknown): void {
    Environment.env = validateEnv(rawEnv);
  }

  static get(): Env {
    return Environment.env;
  }

  static get isProduction(): boolean {
    return Environment.get().APP_ENV === 'production';
  }

  static get isDevelopment(): boolean {
    return Environment.get().APP_ENV === 'development';
  }
}
