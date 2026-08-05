import { relations } from 'drizzle-orm';
import { users, sessions, apiKeys } from '../schema/auth';
import { links, clicks, domains } from '../schema/links';
import { earnings } from '../schema/earnings';
import { withdrawals } from '../schema/withdrawals';
import { referrals, referralCommissions } from '../schema/referrals';
import { notifications } from '../schema/notifications';

// ─── Users Relations ───────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  links: many(links),
  sessions: many(sessions),
  apiKeys: many(apiKeys),
  earnings: many(earnings),
  withdrawals: many(withdrawals),
  referralsMade: many(referrals, { relationName: 'referrer' }),
  referralsReceived: many(referrals, { relationName: 'referred' }),
  notifications: many(notifications),
}));

// ─── Links Relations ───────────────────────────────────
export const linksRelations = relations(links, ({ one, many }) => ({
  user: one(users, {
    fields: [links.userId],
    references: [users.id],
  }),
  clicks: many(clicks),
  domain: one(domains, {
    fields: [links.domainId],
    references: [domains.id],
  }),
}));

// ─── Clicks Relations ──────────────────────────────────
export const clicksRelations = relations(clicks, ({ one }) => ({
  link: one(links, {
    fields: [clicks.linkId],
    references: [links.id],
  }),
}));

// ─── Earnings Relations ────────────────────────────────
export const earningsRelations = relations(earnings, ({ one }) => ({
  user: one(users, {
    fields: [earnings.userId],
    references: [users.id],
  }),
}));

// ─── Withdrawals Relations ─────────────────────────────
export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

// ─── Referrals Relations ───────────────────────────────
export const referralsRelations = relations(referrals, ({ one, many }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: 'referrer',
  }),
  referred: one(users, {
    fields: [referrals.referredUserId],
    references: [users.id],
    relationName: 'referred',
  }),
  commissions: many(referralCommissions),
}));

// ─── Notifications Relations ───────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
