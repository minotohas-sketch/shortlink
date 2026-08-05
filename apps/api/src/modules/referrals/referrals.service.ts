import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql, eq, and, desc, count, sum } from 'drizzle-orm';
import { users } from '../auth/auth.schema';
import { generateUUID } from '../../utils/crypto';
import { nowISO, startOfMonth } from '../../utils/date';
import { Environment } from '../../core/env';

const logger = new Logger('ReferralsService');

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

export async function createReferral(referrerId: string, referredUserId: string, referralCode: string): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(referrals).where(eq(referrals.referredUserId, referredUserId)).get();
  if (existing || referrerId === referredUserId) return;
  
  const commissionRate = Environment.get().REFERRAL_COMMISSION_PERCENT;
  await (db.insert as any)(referrals).values({
    id: generateUUID(), referrerId, referredUserId, referralCode,
    status: 'active', commissionRate, totalCommission: 0, createdAt: nowISO(),
  });
  logger.info('Referral created', { referrerId, referredUserId });
}

export async function addReferralCommission(
  referrerId: string, referredUserId: string, amount: number,
  source: 'click' | 'earning' | 'bonus', sourceId?: string
): Promise<void> {
  const db = getDb();
  const referral = await db.select().from(referrals)
    .where(and(eq(referrals.referrerId, referrerId), eq(referrals.referredUserId, referredUserId), eq(referrals.status, 'active')))
    .get();
  if (!referral) return;
  
  const commission = amount * (referral.commissionRate / 100);
  if (commission <= 0) return;
  
  await (db.insert as any)(referralCommissions).values({
    id: generateUUID(), referralId: referral.id, referrerId, referredUserId,
    amount: commission, source, sourceId: sourceId || null, status: 'approved', createdAt: nowISO(),
  });
  
  await (db.update as any)(referrals).set({ totalCommission: sql`total_commission + ${commission}` }).where(eq(referrals.id, referral.id));
  logger.info('Referral commission added', { referrerId, amount: commission });
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const db = getDb();
  const totalResult = await db.select({ total: count() }).from(referrals).where(eq(referrals.referrerId, userId)).get();
  const activeResult = await db.select({ total: count() }).from(referrals).where(and(eq(referrals.referrerId, userId), eq(referrals.status, 'active'))).get();
  const commissionResult = await db.select({
    total: sum(referralCommissions.amount),
    thisMonth: sum(sql`CASE WHEN ${referralCommissions.createdAt} >= ${startOfMonth().toISOString()} THEN ${referralCommissions.amount} ELSE 0 END`),
  }).from(referralCommissions).where(eq(referralCommissions.referrerId, userId)).get();
  
  return {
    totalReferrals: Number(totalResult?.total ?? 0),
    activeReferrals: Number(activeResult?.total ?? 0),
    totalCommission: Number(commissionResult?.total ?? 0),
    commissionThisMonth: Number(commissionResult?.thisMonth ?? 0),
    referralCode: '',
  };
}

export async function getReferralList(userId: string, page = 1, limit = 20): Promise<{ referrals: ReferralEntry[]; total: number }> {
  const db = getDb();
  const totalResult = await db.select({ total: count() }).from(referrals).where(eq(referrals.referrerId, userId)).get();
  const results = await db.select({
    id: referrals.id, referredUserId: referrals.referredUserId,
    referralCode: referrals.referralCode, status: referrals.status,
    totalCommission: referrals.totalCommission, createdAt: referrals.createdAt,
    referredEmail: users.email, referredUsername: users.username,
  }).from(referrals).leftJoin(users, eq(referrals.referredUserId, users.id))
    .where(eq(referrals.referrerId, userId)).orderBy(desc(referrals.createdAt)).limit(limit).offset((page - 1) * limit).all();
  
  return {
    referrals: results.map((r: any) => ({
      id: r.id, referredUserId: r.referredUserId,
      referredEmail: r.referredEmail || 'Unknown',
      referredUsername: r.referredUsername || 'Unknown',
      status: r.status as any, totalCommission: r.totalCommission, createdAt: r.createdAt,
    })),
    total: Number(totalResult?.total ?? 0),
  };
}

export async function getReferralCode(userId: string): Promise<string> {
  const db = getDb();
  const user = await db.select({ referralCode: users.referralCode }).from(users).where(eq(users.id, userId)).get();
  return user?.referralCode || '';
}

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalCommission: number;
  commissionThisMonth: number;
  referralCode: string;
}

export interface ReferralEntry {
  id: string;
  referredUserId: string;
  referredEmail: string;
  referredUsername: string;
  status: 'pending' | 'active' | 'inactive' | 'rewarded';
  totalCommission: number;
  createdAt: string;
}
