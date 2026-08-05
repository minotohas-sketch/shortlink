import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql, eq, and, sum, desc, between } from 'drizzle-orm';
import { users } from '../auth/auth.schema';
import { generateUUID } from '../../utils/crypto';
import { nowISO, startOfMonth, endOfMonth, startOfDay, endOfDay, addDays } from '../../utils/date';

const logger = new Logger('EarningsService');

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
  userId: text('user_id').primaryKey(),
  availableBalance: real('available_balance').notNull().default(0),
  pendingBalance: real('pending_balance').notNull().default(0),
  lifetimeEarnings: real('lifetime_earnings').notNull().default(0),
  totalWithdrawn: real('total_withdrawn').notNull().default(0),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('user_balances_user_id_idx').on(table.userId),
}));

export async function addEarnings(userId: string, amount: number, source: string, description?: string, linkId?: string, clickId?: string, referralId?: string): Promise<void> {
  const db = getDb();
  const earningId = generateUUID();
  await (db.insert as any)(earnings).values({ id: earningId, userId, amount, source: source as any, description: description || null, linkId: linkId || null, clickId: clickId || null, referralId: referralId || null, status: 'approved', createdAt: nowISO() });
  await updateBalance(userId, amount);
  logger.info('Earnings added', { userId, amount, source });
}

export async function getUserBalance(userId: string): Promise<any> {
  const db = getDb();
  const balance = await db.select().from(userBalances).where(eq(userBalances.userId, userId)).get();
  if (!balance) {
    await (db.insert as any)(userBalances).values({ userId, availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0, totalWithdrawn: 0, updatedAt: nowISO() });
    return { availableBalance: 0, pendingBalance: 0, lifetimeEarnings: 0, totalWithdrawn: 0 };
  }
  return { availableBalance: balance.availableBalance, pendingBalance: balance.pendingBalance, lifetimeEarnings: balance.lifetimeEarnings, totalWithdrawn: balance.totalWithdrawn };
}

export async function getEarningsHistory(userId: string, page = 1, limit = 20): Promise<any> {
  const db = getDb();
  const totalResult = await db.select({ total: sum(earnings.id) as any }).from(earnings).where(eq(earnings.userId, userId)).get();
  const results = await db.select().from(earnings).where(eq(earnings.userId, userId)).orderBy(desc(earnings.createdAt)).limit(limit).offset((page - 1) * limit).all();
  return { earnings: results.map(toEarningEntry), total: (totalResult?.total as any) ?? 0 };
}

export async function getEarningsSummary(userId: string, period: string = 'month'): Promise<any> {
  const db = getDb();
  const now = new Date();
  let startDate: Date;
  switch (period) {
    case 'today': startDate = startOfDay(now); break;
    case 'week': startDate = addDays(now, -7); break;
    case 'month': startDate = startOfMonth(now); break;
    case 'year': startDate = new Date(now.getFullYear(), 0, 1); break;
    default: startDate = startOfMonth(now);
  }

  const sourceResults = await db.select({ source: earnings.source, total: sum(earnings.amount) }).from(earnings).where(and(eq(earnings.userId, userId), between(earnings.createdAt, startDate.toISOString(), now.toISOString()))).groupBy(earnings.source).all();
  const dailyResults = await db.select({ date: sql`date(${earnings.createdAt})` as any, total: sum(earnings.amount) }).from(earnings).where(and(eq(earnings.userId, userId), between(earnings.createdAt, startDate.toISOString(), now.toISOString()))).groupBy(sql`date(${earnings.createdAt})` as any).orderBy(sql`date(${earnings.createdAt})` as any).all();

  const bySource: any = {};
  sourceResults.forEach((r: any) => { if (r.source) bySource[r.source] = r.total || 0; });
  const byDate: any = {};
  dailyResults.forEach((r: any) => { if (r.date) byDate[String(r.date)] = r.total || 0; });
  const totalEarnings = Object.values(bySource).reduce((a: any, b: any) => (a as number) + (b as number), 0) as number;

  return { period, totalEarnings, earningsBySource: bySource, earningsByDate: byDate, startDate: startDate.toISOString(), endDate: now.toISOString() };
}

async function updateBalance(userId: string, amount: number): Promise<void> {
  const db = getDb();
  const existing = await db.select().from(userBalances).where(eq(userBalances.userId, userId)).get();
  if (existing) {
    await (db.update as any)(userBalances).set({ availableBalance: sql`available_balance + ${amount}`, lifetimeEarnings: sql`lifetime_earnings + ${amount}`, updatedAt: nowISO() }).where(eq(userBalances.userId, userId));
  } else {
    await (db.insert as any)(userBalances).values({ userId, availableBalance: amount, lifetimeEarnings: amount, totalWithdrawn: 0, updatedAt: nowISO() });
  }
}

function toEarningEntry(e: any): any {
  return { id: e.id, amount: e.amount, source: e.source, description: e.description, linkId: e.linkId, status: e.status, createdAt: e.createdAt };
}
