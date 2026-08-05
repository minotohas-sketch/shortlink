import { z } from 'zod';

const envSchema = z.object({
  APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  APP_NAME: z.string().default('Peage'),
  APP_URL: z.string().url(),
  API_URL: z.string().url(),
  D1_DATABASE_ID: z.string(),
  D1_DATABASE_NAME: z.string().default('peage-db'),
  KV_CACHE_ID: z.string(),
  KV_SESSIONS_ID: z.string(),
  KV_RATE_LIMIT_ID: z.string(),
  R2_BUCKET_NAME: z.string().default('peage-storage'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ENCRYPTION_KEY: z.string().min(32),
  RESEND_API_KEY: z.string(),
  EMAIL_FROM: z.string().email().default('noreply@peage.io'),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
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
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGINS: z.string().transform(v => v.split(',')),
  FEATURE_REGISTRATION: z.coerce.boolean().default(true),
  FEATURE_PAYMENTS: z.coerce.boolean().default(true),
  FEATURE_REFERRALS: z.coerce.boolean().default(true),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(env: unknown): Env {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    console.error('❌ Invalid env:', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}

export class Environment {
  private static instance: Environment;
  private env: Env;
  
  private constructor(env: Env) { this.env = env; }
  
  static init(rawEnv: unknown): Environment {
    if (!Environment.instance) {
      Environment.instance = new Environment(validateEnv(rawEnv));
    }
    return Environment.instance;
  }
  
  static get(): Env {
    if (!Environment.instance) {
      throw new Error('Environment not initialized. Call Environment.init() first.');
    }
    return Environment.instance.env;
  }
  
  static get isProduction(): boolean {
    return this.get().APP_ENV === 'production';
  }
  
  static get isDevelopment(): boolean {
    return this.get().APP_ENV === 'development';
  }
}
