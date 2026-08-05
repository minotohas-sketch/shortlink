import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const referrals = sqliteTable('referrals', {
  id: text('id').primaryKey(),
  referrerId: text('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: text('referred_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referralCode: text('referral_code').notNull(),
  status: text('status', { enum: ['pending', 'active', 'inactive', 'rewarded'] }).notNull().default('active'),
  commissionRate: real('commission_rate').notNull(),
  totalCommission: real('total_commission').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  referrerIdIdx: index('referrals_referrer_id_idx').on(table.referrerId),
  referredUserIdIdx: index('referrals_referred_user_id_idx').on(table.referredUserId),
}));

export const referralCommissions = sqliteTable('referral_commissions', {
  id: text('id').primaryKey(),
  referralId: text('referral_id').notNull().references(() => referrals.id, { onDelete: 'cascade' }),
  referrerId: text('referrer_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: text('referred_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  source: text('source', { enum: ['click', 'earning', 'bonus'] }).notNull(),
  sourceId: text('source_id'),
  status: text('status', { enum: ['pending', 'approved', 'paid', 'cancelled'] }).notNull().default('approved'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  referralIdIdx: index('referral_commissions_referral_id_idx').on(table.referralId),
  referrerIdIdx: index('referral_commissions_referrer_id_idx').on(table.referrerId),
}));

export type Referral = typeof referrals.$inferSelect;
export type ReferralCommission = typeof referralCommissions.$inferSelect;
