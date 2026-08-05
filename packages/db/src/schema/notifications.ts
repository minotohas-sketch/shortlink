import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['info', 'success', 'warning', 'error'] }).notNull().default('info'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  link: text('link'),
  data: text('data', { mode: 'json' }),
  readAt: text('read_at'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  readIdx: index('notifications_read_idx').on(table.read),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
}));

export const notificationPreferences = sqliteTable('notification_preferences', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  emailEnabled: integer('email_enabled', { mode: 'boolean' }).notNull().default(true),
  pushEnabled: integer('push_enabled', { mode: 'boolean' }).notNull().default(true),
  inAppEnabled: integer('in_app_enabled', { mode: 'boolean' }).notNull().default(true),
  marketingEmails: integer('marketing_emails', { mode: 'boolean' }).notNull().default(false),
  withdrawalUpdates: integer('withdrawal_updates', { mode: 'boolean' }).notNull().default(true),
  earningsUpdates: integer('earnings_updates', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('notification_prefs_user_id_idx').on(table.userId),
}));

export type Notification = typeof notifications.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
