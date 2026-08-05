import type { Config } from 'drizzle-kit';

export default {
  schema: './src/modules/**/*.schema.ts',
  out: './migrations',
  dialect: 'sqlite',
  driver: 'd1-http',
  dbCredentials: {
    databaseId: process.env.D1_DATABASE_ID!,
    accountId: process.env.CF_ACCOUNT_ID!,
    token: process.env.CF_API_TOKEN!,
  },
  verbose: true,
  strict: true,
  tablesFilter: ['!cloudflare_*'],
} satisfies Config;
