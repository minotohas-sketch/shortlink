/**
 * Database Schema — Centralized
 * 
 * Point d'entrée unique pour tous les schémas Drizzle ORM.
 * Importé par l'API et les scripts de migration.
 */

// ─── Auth ──────────────────────────────────────────────
export {
  users,
  sessions,
  emailVerifications,
  passwordResets,
  apiKeys,
  auditLogs,
} from './auth';

// ─── Links ─────────────────────────────────────────────
export {
  links,
  clicks,
  domains,
} from './links';

// ─── Earnings ──────────────────────────────────────────
export {
  earnings,
  userBalances,
} from './earnings';

// ─── Withdrawals ───────────────────────────────────────
export {
  withdrawals,
} from './withdrawals';

// ─── Referrals ─────────────────────────────────────────
export {
  referrals,
  referralCommissions,
} from './referrals';

// ─── Notifications ─────────────────────────────────────
export {
  notifications,
  notificationPreferences,
} from './notifications';

// ─── Payments ──────────────────────────────────────────
export {
  paymentMethods,
  paymentTransactions,
  paymentWebhooks,
} from './payments';

// ─── Ads ───────────────────────────────────────────────
export {
  adCampaigns,
  adImpressions,
} from './ads';

// ─── Type Exports ──────────────────────────────────────
export type { User, NewUser } from './auth';
export type { Link, NewLink, Click, Domain } from './links';
export type { Earning, UserBalance } from './earnings';
export type { Withdrawal } from './withdrawals';
export type { Referral, ReferralCommission } from './referrals';
