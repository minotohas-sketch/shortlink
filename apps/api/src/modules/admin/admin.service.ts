import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { users, sessions } from '../auth/auth.schema';
import { links, clicks } from '../links/links.schema';
import { earnings } from '../earnings/earnings.service';
import { withdrawals } from '../withdrawals/withdrawals.service';
import { eq, count, sum, desc, gte, sql } from 'drizzle-orm';
import { nowISO, startOfDay, addDays, startOfMonth } from '../../utils/date';
import { NotFoundError } from '../../utils/errors';

const logger = new Logger('AdminService');

export async function getDashboardStats(): Promise<any> {
  const db = getDb();
  const todayStart = startOfDay().toISOString();
  
  const totalUsers = await db.select({ total: count() }).from(users).get();
  const newUsersToday = await db.select({ total: count() }).from(users).where(gte(users.createdAt, todayStart)).get();
  const totalLinks = await db.select({ total: count() }).from(links).get();
  const totalClicks = await db.select({ total: count() }).from(clicks).get();
  const clicksToday = await db.select({ total: count() }).from(clicks).where(gte(clicks.createdAt, todayStart)).get();
  const totalEarnings = await db.select({ total: sum(earnings.amount) }).from(earnings).get();
  const pendingWithdrawals = await db.select({ total: count(), amount: sum(withdrawals.amount) }).from(withdrawals).where(eq(withdrawals.status, 'pending')).get();
  
  return {
    totalUsers: (totalUsers?.total ?? 0) as number,
    newUsersToday: (newUsersToday?.total ?? 0) as number,
    totalLinks: (totalLinks?.total ?? 0) as number,
    totalClicks: (totalClicks?.total ?? 0) as number,
    clicksToday: (clicksToday?.total ?? 0) as number,
    totalEarnings: (totalEarnings?.total ?? 0) as number,
    pendingWithdrawals: {
      count: (pendingWithdrawals?.total ?? 0) as number,
      amount: (pendingWithdrawals?.amount ?? 0) as number,
    },
    timestamp: nowISO(),
  };
}

export async function getUsersList(page = 1, limit = 50, filters?: any): Promise<any> {
  const db = getDb();
  const conditions: any[] = [];
  if (filters?.status) conditions.push(eq(users.status, filters.status));
  if (filters?.role) conditions.push(eq(users.role, filters.role));
  
  const totalResult = await db.select({ total: count() }).from(users).where(conditions.length > 0 ? conditions[0] : undefined).get();
  const results = await db.select({
    id: users.id, email: users.email, username: users.username,
    role: users.role, status: users.status, emailVerified: users.emailVerified,
    referralCode: users.referralCode, lastLoginAt: users.lastLoginAt, createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset((page - 1) * limit).all();
  
  return {
    users: results.map((u: any) => ({
      id: u.id, email: u.email, username: u.username, role: u.role,
      status: u.status, emailVerified: u.emailVerified,
      referralCode: u.referralCode, lastLoginAt: u.lastLoginAt, createdAt: u.createdAt,
    })),
    total: (totalResult?.total ?? 0) as number,
  };
}

export async function getUserDetails(userId: string): Promise<any> {
  const db = getDb();
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  
  const linkCount = await db.select({ total: count() }).from(links).where(eq(links.userId, userId)).get();
  const clickCount = await db.select({ total: count() }).from(clicks).where(sql`${clicks.linkId} IN (SELECT id FROM links WHERE user_id = ${userId})`).get();
  const userEarnings = await db.select({ total: sum(earnings.amount) }).from(earnings).where(eq(earnings.userId, userId)).get();
  const withdrawalCount = await db.select({ total: count() }).from(withdrawals).where(eq(withdrawals.userId, userId)).get();
  
  return {
    id: user.id, email: user.email, username: user.username,
    role: user.role, status: user.status, emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl, referralCode: user.referralCode,
    referredBy: user.referredBy, lastLoginAt: user.lastLoginAt,
    lastLoginIp: user.lastLoginIp, metadata: user.metadata,
    createdAt: user.createdAt, updatedAt: user.updatedAt,
    stats: {
      totalLinks: (linkCount?.total ?? 0) as number,
      totalClicks: (clickCount?.total ?? 0) as number,
      totalEarnings: (userEarnings?.total ?? 0) as number,
      totalWithdrawals: (withdrawalCount?.total ?? 0) as number,
    },
  };
}

export async function updateUserStatus(userId: string, status: string): Promise<void> {
  const db = getDb();
  await (db.update as any)(users).set({ status: status as any, updatedAt: nowISO() }).where(eq(users.id, userId));
  if (status === 'banned') {
    await (db.delete as any)(sessions).where(eq(sessions.userId, userId));
  }
  logger.info('User status updated', { userId, status });
}

export async function updateUserRole(userId: string, role: string): Promise<void> {
  const db = getDb();
  await (db.update as any)(users).set({ role: role as any, updatedAt: nowISO() }).where(eq(users.id, userId));
  logger.info('User role updated', { userId, role });
}

export async function getAnalyticsOverview(period: string = 'month'): Promise<any> {
  const db = getDb();
  const now = new Date();
  let startDate: string;
  switch (period) {
    case 'today': startDate = startOfDay(now).toISOString(); break;
    case 'week': startDate = addDays(now, -7).toISOString(); break;
    case 'month':
    default: startDate = startOfMonth(now).toISOString(); break;
  }
  
  const clicksByDate = await db.select({ date: sql`date(${clicks.createdAt})` as any, total: count() }).from(clicks).where(gte(clicks.createdAt, startDate)).groupBy(sql`date(${clicks.createdAt})` as any).orderBy(sql`date(${clicks.createdAt})` as any).all();
  const clicksByCountry = await db.select({ country: clicks.countryCode, total: count() }).from(clicks).where(gte(clicks.createdAt, startDate)).groupBy(clicks.countryCode).orderBy(desc(count())).limit(20).all();
  const usersByDate = await db.select({ date: sql`date(${users.createdAt})` as any, total: count() }).from(users).where(gte(users.createdAt, startDate)).groupBy(sql`date(${users.createdAt})` as any).orderBy(sql`date(${users.createdAt})` as any).all();
  
  return {
    period, startDate, endDate: now.toISOString(),
    clicksByDate: Object.fromEntries(clicksByDate.map((c: any) => [String(c.date), c.total])),
    clicksByCountry: Object.fromEntries(clicksByCountry.filter((c: any) => c.country).map((c: any) => [c.country, c.total])),
    usersByDate: Object.fromEntries(usersByDate.map((u: any) => [String(u.date), u.total])),
  };
}
