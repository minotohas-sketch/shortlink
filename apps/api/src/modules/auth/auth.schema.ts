import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users Table ───────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  role: text('role', { enum: ['user', 'admin', 'moderator'] })
    .notNull()
    .default('user'),
  status: text('status', { enum: ['active', 'inactive', 'suspended', 'banned'] })
    .notNull()
    .default('inactive'),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .notNull()
    .default(false),
  avatarUrl: text('avatar_url'),
  provider: text('provider', { enum: ['email', 'google', 'github'] })
    .notNull()
    .default('email'),
  providerId: text('provider_id'),
  referralCode: text('referral_code').notNull(),
  referredBy: text('referred_by'),
  lastLoginAt: text('last_login_at'),
  lastLoginIp: text('last_login_ip'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  referralCodeIdx: uniqueIndex('users_referral_code_idx').on(table.referralCode),
  statusIdx: index('users_status_idx').on(table.status),
  roleIdx: index('users_role_idx').on(table.role),
  providerIdx: index('users_provider_idx').on(table.provider),
}));

// ─── Sessions Table ────────────────────────────────────
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  expiresAt: text('expires_at').notNull(),
  lastActivityAt: text('last_activity_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
  refreshTokenIdx: uniqueIndex('sessions_refresh_token_idx').on(table.refreshToken),
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt),
}));

// ─── Email Verifications Table ─────────────────────────
export const emailVerifications = sqliteTable('email_verifications', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  tokenIdx: uniqueIndex('email_verifications_token_idx').on(table.token),
  userIdIdx: index('email_verifications_user_id_idx').on(table.userId),
}));

// ─── Password Resets Table ─────────────────────────────
export const passwordResets = sqliteTable('password_resets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  tokenIdx: uniqueIndex('password_resets_token_idx').on(table.token),
  userIdIdx: index('password_resets_user_id_idx').on(table.userId),
}));

// ─── API Keys Table ────────────────────────────────────
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull(),
  lastUsedAt: text('last_used_at'),
  expiresAt: text('expires_at'),
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull()
    .default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  keyIdx: uniqueIndex('api_keys_key_idx').on(table.key),
  userIdIdx: index('api_keys_user_id_idx').on(table.userId),
}));

// ─── Audit Logs Table ──────────────────────────────────
export const auditLogs = sqliteTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resource_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  changes: text('changes', { mode: 'json' }),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  resourceIdx: index('audit_logs_resource_idx').on(table.resource),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
}));

// ─── Type exports ──────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type EmailVerification = typeof emailVerifications.$inferSelect;
export type PasswordReset = typeof passwordResets.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
