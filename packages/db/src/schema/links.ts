import { sqliteTable, text, integer, real, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const links = sqliteTable('links', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  shortCode: text('short_code').notNull(),
  originalUrl: text('original_url').notNull(),
  title: text('title'),
  description: text('description'),
  tags: text('tags', { mode: 'json' }),
  status: text('status', { enum: ['active', 'inactive', 'expired', 'deleted'] }).notNull().default('active'),
  type: text('type', { enum: ['direct', 'campaign', 'dynamic'] }).notNull().default('direct'),
  domainId: text('domain_id'),
  customDomain: text('custom_domain'),
  password: text('password'),
  expiresAt: text('expires_at'),
  maxClicks: integer('max_clicks'),
  currentClicks: integer('current_clicks').notNull().default(0),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  shortCodeIdx: uniqueIndex('links_short_code_idx').on(table.shortCode),
  userIdIdx: index('links_user_id_idx').on(table.userId),
  statusIdx: index('links_status_idx').on(table.status),
  createdAtIdx: index('links_created_at_idx').on(table.createdAt),
}));

export const clicks = sqliteTable('clicks', {
  id: text('id').primaryKey(),
  linkId: text('link_id').notNull().references(() => links.id, { onDelete: 'cascade' }),
  ipAddress: text('ip_address'),
  country: text('country'),
  countryCode: text('country_code'),
  city: text('city'),
  region: text('region'),
  continent: text('continent'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  timezone: text('timezone'),
  device: text('device'),
  deviceType: text('device_type'),
  browser: text('browser'),
  browserVersion: text('browser_version'),
  os: text('os'),
  osVersion: text('os_version'),
  referrer: text('referrer'),
  referrerDomain: text('referrer_domain'),
  userAgent: text('user_agent'),
  language: text('language'),
  screenResolution: text('screen_resolution'),
  uniqueHash: text('unique_hash'),
  isUnique: integer('is_unique', { mode: 'boolean' }).notNull().default(false),
  cpmRate: real('cpm_rate').notNull().default(0),
  earnings: real('earnings').notNull().default(0),
  metadata: text('metadata', { mode: 'json' }),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  linkIdIdx: index('clicks_link_id_idx').on(table.linkId),
  countryCodeIdx: index('clicks_country_code_idx').on(table.countryCode),
  createdAtIdx: index('clicks_created_at_idx').on(table.createdAt),
  uniqueHashIdx: index('clicks_unique_hash_idx').on(table.uniqueHash),
}));

export const domains = sqliteTable('domains', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  domain: text('domain').notNull(),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  verificationToken: text('verification_token'),
  verificationMethod: text('verification_method', { enum: ['dns', 'file'] }),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['active', 'pending', 'failed'] }).notNull().default('pending'),
  sslEnabled: integer('ssl_enabled', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  domainIdx: uniqueIndex('domains_domain_idx').on(table.domain),
  userIdIdx: index('domains_user_id_idx').on(table.userId),
}));

export type Link = typeof links.$inferSelect;
export type NewLink = typeof links.$inferInsert;
export type Click = typeof clicks.$inferSelect;
export type Domain = typeof domains.$inferSelect;
