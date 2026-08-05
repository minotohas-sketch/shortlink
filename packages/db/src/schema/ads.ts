import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './auth';

export const adCampaigns = sqliteTable('ad_campaigns', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type', { enum: ['banner', 'interstitial', 'popup', 'native'] }).notNull(),
  status: text('status', { enum: ['active', 'paused', 'ended', 'rejected'] }).notNull().default('active'),
  budget: real('budget').notNull(),
  spentBudget: real('spent_budget').notNull().default(0),
  cpmBid: real('cpm_bid').notNull(),
  targetingCountries: text('targeting_countries', { mode: 'json' }),
  targetingDevices: text('targeting_devices', { mode: 'json' }),
  creativeUrl: text('creative_url'),
  destinationUrl: text('destination_url').notNull(),
  impressions: integer('impressions').notNull().default(0),
  clicks: integer('clicks').notNull().default(0),
  startDate: text('start_date').notNull(),
  endDate: text('end_date'),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('ad_campaigns_user_id_idx').on(table.userId),
  statusIdx: index('ad_campaigns_status_idx').on(table.status),
}));

export const adImpressions = sqliteTable('ad_impressions', {
  id: text('id').primaryKey(),
  campaignId: text('campaign_id').notNull().references(() => adCampaigns.id, { onDelete: 'cascade' }),
  linkId: text('link_id'),
  country: text('country'),
  countryCode: text('country_code'),
  device: text('device'),
  deviceType: text('device_type'),
  browser: text('browser'),
  clicked: integer('clicked', { mode: 'boolean' }).notNull().default(false),
  earnedAmount: real('earned_amount').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  campaignIdIdx: index('ad_impressions_campaign_id_idx').on(table.campaignId),
  createdAtIdx: index('ad_impressions_created_at_idx').on(table.createdAt),
}));

export type AdCampaign = typeof adCampaigns.$inferSelect;
export type AdImpression = typeof adImpressions.$inferSelect;
