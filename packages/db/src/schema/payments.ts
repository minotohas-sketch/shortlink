import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const paymentMethods = sqliteTable('payment_methods', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['stripe', 'paypal'] }).notNull(),
  provider: text('provider').notNull(),
  last4: text('last4'),
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('payment_methods_user_id_idx').on(table.userId),
}));

export const paymentTransactions = sqliteTable('payment_transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),
  status: text('status', { enum: ['pending', 'completed', 'failed', 'refunded'] }).notNull().default('pending'),
  type: text('type', { enum: ['deposit', 'withdrawal', 'refund', 'payout'] }).notNull(),
  provider: text('provider', { enum: ['stripe', 'paypal'] }).notNull(),
  providerTransactionId: text('provider_transaction_id'),
  description: text('description'),
  metadata: text('metadata', { mode: 'json' }),
  completedAt: text('completed_at'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('payment_transactions_user_id_idx').on(table.userId),
  statusIdx: index('payment_transactions_status_idx').on(table.status),
  createdAtIdx: index('payment_transactions_created_at_idx').on(table.createdAt),
}));

export const paymentWebhooks = sqliteTable('payment_webhooks', {
  id: text('id').primaryKey(),
  provider: text('provider', { enum: ['stripe', 'paypal'] }).notNull(),
  eventType: text('event_type').notNull(),
  payload: text('payload', { mode: 'json' }).notNull(),
  signature: text('signature'),
  processed: integer('processed', { mode: 'boolean' }).notNull().default(false),
  processedAt: text('processed_at'),
  error: text('error'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  providerIdx: index('payment_webhooks_provider_idx').on(table.provider),
  processedIdx: index('payment_webhooks_processed_idx').on(table.processed),
}));

export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type PaymentWebhook = typeof paymentWebhooks.$inferSelect;
