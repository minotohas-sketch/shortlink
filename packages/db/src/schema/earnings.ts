import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const earnings = sqliteTable('earnings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  source: text('source', { enum: ['click', 'referral', 'bonus', 'adjustment'] }).notNull(),
  description: text('description'),
  linkId: text('link_id'),
  clickId: text('click_id'),
  referralId: text('referral_id'),
  status: text('status', { enum: ['pending', 'approved', 'paid', 'cancelled'] }).notNull().default('approved'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('earnings_user_id_idx').on(table.userId),
  sourceIdx: index('earnings_source_idx').on(table.source),
  createdAtIdx: index('earnings_created_at_idx').on(table.createdAt),
  statusIdx: index('earnings_status_idx').on(table.status),
}));

export const userBalances = sqliteTable('user_balances', {
  userId: text('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  availableBalance: real('available_balance').notNull().default(0),
  pendingBalance: real('pending_balance').notNull().default(0),
  lifetimeEarnings: real('lifetime_earnings').notNull().default(0),
  totalWithdrawn: real('total_withdrawn').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Earning = typeof earnings.$inferSelect;
export type UserBalance = typeof userBalances.$inferSelect;
