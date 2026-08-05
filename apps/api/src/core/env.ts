import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('Peage'),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  D1_DATABASE_ID: z.string().optional().default(''),
  D1_DATABASE_NAME: z.string().optional().default('peage-db'),
  KV_CACHE_ID: z.string().optional().default(''),
  KV_SESSIONS_ID: z.string().optional().default(''),
  KV_RATE_LIMIT_ID: z.string().optional().default(''),
  R2_BUCKET_NAME: z.string().optional().default('peage-storage'),
  JWT_SECRET: z.string().min(32).optional().default('dev-secret-32-chars-minimum-required!!'),
  JWT_EXPIRES_IN: z.string().optional().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32).optional().default('dev-refresh-secret-32-chars-minimum!!'),
  JWT_REFRESH_EXPIRES_IN: z.string().optional().default('7d'),
  ENCRYPTION_KEY: z.string().min(32).optional().default('dev-encryption-key-32-chars-here!'),
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().email().optional().default('noreply@peage.io'),
  STRIPE_SECRET_KEY: z.string().optional().default(''),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(''),
  PAYPAL_CLIENT_ID: z.string().optional().default(''),
  PAYPAL_CLIENT_SECRET: z.string().optional().default(''),
  RATE_LIMIT_GLOBAL: z.coerce.number().optional().default(1000),
  RATE_LIMIT_AUTH: z.coerce.number().optional().default(10),
  RATE_LIMIT_API: z.coerce.number().optional().default(100),
  CPM_TIER_1: z.coerce.number().optional().default(4.0),
  CPM_TIER_2: z.coerce.number().optional().default(2.0),
  CPM_TIER_3: z.coerce.number().optional().default(0.5),
  CPM_TIER_4: z.coerce.number().optional().default(0.1),
  REFERRAL_COMMISSION_PERCENT: z.coerce.number().optional().default(10),
  MIN_WITHDRAWAL_AMOUNT: z.coerce.number().optional().default(10),
  SHORT_CODE_LENGTH: z.coerce.number().optional().default(7),
  CACHE_TTL_LINK: z.coerce.number().optional().default(3600),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
  CORS_ORIGINS: z.string().optional().default('http://localhost:5173'),
  FEATURE_REGISTRATION: z.coerce.boolean().optional().default(true),
  FEATURE_PAYMENTS: z.coerce.boolean().optional().default(true),
  FEATURE_REFERRALS: z.coerce.boolean().optional().default(true),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function validateEnv(env: unknown): Env {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error('❌ Invalid env:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  }
  // Return parsed data or fallback to defaults
  return parsed.success ? parsed.data : envSchema.parse({});
}

export class Environment {
  private static instance: Environment;
  private env: Env;

  private constructor(env: Env) {
    this.env = env;
  }

  static init(rawEnv: unknown): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment(validateEnv(rawEnv));
    }
    return Environment.instance;
  }

  static get(): Env {
    if (!Environment.instance) {
      // Fallback: utiliser des valeurs par défaut
      console.warn('⚠️ Environment not initialized, using defaults');
      Environment.instance = new Environment(envSchema.parse({}));
    }
    return Environment.instance.env;
  }

  static get isProduction(): boolean {
    return Environment.get().APP_ENV === 'production';
  }

  static get isDevelopment(): boolean {
    return Environment.get().APP_ENV === 'development';
  }
}
