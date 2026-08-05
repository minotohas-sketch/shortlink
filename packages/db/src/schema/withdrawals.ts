import { sqliteTable, text, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const withdrawals = sqliteTable('withdrawals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  method: text('method', { enum: ['paypal', 'bank_transfer', 'crypto'] }).notNull(),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'] }).notNull().default('pending'),
  paymentEmail: text('payment_email'),
  paymentDetails: text('payment_details', { mode: 'json' }),
  fee: real('fee').notNull().default(0),
  netAmount: real('net_amount').notNull(),
  notes: text('notes'),
  processedAt: text('processed_at'),
  completedAt: text('completed_at'),
  rejectedAt: text('rejected_at'),
  rejectionReason: text('rejection_reason'),
  transactionId: text('transaction_id'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('withdrawals_user_id_idx').on(table.userId),
  statusIdx: index('withdrawals_status_idx').on(table.status),
  createdAtIdx: index('withdrawals_created_at_idx').on(table.createdAt),
}));

export type Withdrawal = typeof withdrawals.$inferSelect;
