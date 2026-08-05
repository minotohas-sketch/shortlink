import { getDb } from '../../core/db';
import { getSecurityService } from '../../core/security';
import { Logger } from '../../core/logger';
import { Environment } from '../../core/env';
import { users, sessions, emailVerifications, passwordResets, apiKeys, auditLogs } from './auth.schema';
import { eq, and, lt, isNull } from 'drizzle-orm';
import type {
  RegisterInput, LoginInput, AuthTokens,
  UserResponse,
} from './auth.types';
import {
  ConflictError, UnauthorizedError, ForbiddenError,
  BadRequestError,
} from '../../utils/errors';
import { generateShortCode } from '../../utils/url';
import { generateUUID } from '../../utils/crypto';
import { nowISO } from '../../utils/date';

const logger = new Logger('AuthService');
const security = getSecurityService();

// ─── Registration ──────────────────────────────────────
export async function register(input: RegisterInput, ip?: string): Promise<{ user: any; tokens: AuthTokens }> {
  const db = getDb();
  
  const existingEmail = await db.select({ id: users.id })
    .from(users).where(eq(users.email, input.email.toLowerCase())).get();
  if (existingEmail) throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
  
  const existingUsername = await db.select({ id: users.id })
    .from(users).where(eq(users.username, input.username)).get();
  if (existingUsername) throw new ConflictError('Username already taken', 'USERNAME_EXISTS');
  
  const { hash, salt } = await security.hashWithSalt(input.password);
  const referralCode = generateShortCode(8);
  
  let referredBy: string | null = null;
  if (input.referralCode) {
    const referrer = await db.select({ id: users.id })
      .from(users).where(eq(users.referralCode, input.referralCode)).get();
    if (referrer) referredBy = referrer.id;
  }
  
  const userId = generateUUID();
  const now = nowISO();
  
  await (db.insert as any)(users).values({
    id: userId, email: input.email.toLowerCase(), username: input.username,
    passwordHash: hash, passwordSalt: salt, referralCode, referredBy,
    emailVerified: false, status: 'inactive', role: 'user', provider: 'email',
    lastLoginIp: ip, lastLoginAt: now, createdAt: now, updatedAt: now,
  });
  
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) throw new Error('Failed to create user');
  
  const tokens = await createTokens(user as any);
  await createSession(user.id, tokens);
  
  await (db.insert as any)(auditLogs).values({
    id: generateUUID(), userId: user.id, action: 'user.registered',
    resource: 'users', resourceId: user.id, ipAddress: ip, createdAt: now,
  });
  
  logger.info('User registered', { userId: user.id, email: user.email });
  return { user: toUserResponse(user as any), tokens };
}

// ─── Login ─────────────────────────────────────────────
export async function login(input: LoginInput, ip?: string, userAgent?: string): Promise<{ user: any; tokens: AuthTokens }> {
  const db = getDb();
  
  const user = await db.select().from(users)
    .where(eq(users.email, input.email.toLowerCase())).get();
  
  if (!user) throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  if (user.status === 'banned') throw new ForbiddenError('Account has been banned', 'ACCOUNT_BANNED');
  if (user.status === 'suspended') throw new ForbiddenError('Account has been suspended', 'ACCOUNT_SUSPENDED');
  
  const isValid = await security.verifyPassword(input.password, user.passwordHash, user.passwordSalt);
  
  if (!isValid) {
    await (db.insert as any)(auditLogs).values({
      id: generateUUID(), userId: user.id, action: 'user.login_failed',
      resource: 'users', resourceId: user.id, ipAddress: ip, userAgent, createdAt: nowISO(),
    });
    throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
  }
  
  const now = nowISO();
  await (db.update as any)(users)
    .set({ lastLoginAt: now, lastLoginIp: ip, updatedAt: now })
    .where(eq(users.id, user.id));
  
  const tokens = await createTokens(user as any, input.rememberMe);
  await createSession(user.id, tokens, userAgent, ip);
  
  await (db.insert as any)(auditLogs).values({
    id: generateUUID(), userId: user.id, action: 'user.logged_in',
    resource: 'users', resourceId: user.id, ipAddress: ip, userAgent, createdAt: now,
  });
  
  logger.info('User logged in', { userId: user.id });
  return { user: toUserResponse(user as any), tokens };
}

// ─── Refresh Token ─────────────────────────────────────
export async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const db = getDb();
  
  const session = await db.select().from(sessions)
    .where(and(eq(sessions.refreshToken, refreshToken))).get();
  
  if (!session) throw new UnauthorizedError('Invalid or expired refresh token', 'TOKEN_INVALID');
  
  const user = await db.select().from(users)
    .where(eq(users.id, session.userId)).get();
  
  if (!user) throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
  if (user.status !== 'active') throw new ForbiddenError('Account is not active', 'ACCOUNT_NOT_ACTIVE');
  
  const tokens = await createTokens(user as any);
  
  await (db.update as any)(sessions)
    .set({ token: tokens.accessToken, refreshToken: tokens.refreshToken, lastActivityAt: nowISO() })
    .where(eq(sessions.id, session.id));
  
  logger.info('Tokens refreshed', { userId: user.id, sessionId: session.id });
  return tokens;
}

// ─── Logout ────────────────────────────────────────────
export async function logout(sessionId: string): Promise<void> {
  const db = getDb();
  await (db.delete as any)(sessions).where(eq(sessions.id, sessionId));
  logger.info('User logged out', { sessionId });
}

// ─── Verify Email ──────────────────────────────────────
export async function verifyEmail(token: string): Promise<void> {
  const db = getDb();
  
  const verification = await db.select().from(emailVerifications)
    .where(and(eq(emailVerifications.token, token), isNull(emailVerifications.usedAt))).get();
  
  if (!verification) throw new BadRequestError('Invalid or expired verification token', 'TOKEN_INVALID');
  
  await (db.update as any)(emailVerifications).set({ usedAt: nowISO() }).where(eq(emailVerifications.id, verification.id));
  await (db.update as any)(users).set({ emailVerified: true, status: 'active', updatedAt: nowISO() }).where(eq(users.id, verification.userId));
  
  logger.info('Email verified', { userId: verification.userId });
}

// ─── Forgot Password ───────────────────────────────────
export async function forgotPassword(email: string): Promise<void> {
  const db = getDb();
  
  const user = await db.select({ id: users.id }).from(users)
    .where(eq(users.email, email.toLowerCase())).get();
  
  if (!user) { logger.info('Password reset requested for non-existent email', { email }); return; }
  
  const token = security.generateToken(64);
  const expiresAt = new Date(Date.now() + 3600000).toISOString();
  
  await (db.insert as any)(passwordResets).values({
    id: generateUUID(), userId: user.id, token, expiresAt, createdAt: nowISO(),
  });
  
  logger.info('Password reset token created', { userId: user.id });
}

// ─── Reset Password ────────────────────────────────────
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const db = getDb();
  
  const resetRequest = await db.select().from(passwordResets)
    .where(and(eq(passwordResets.token, token), isNull(passwordResets.usedAt))).get();
  
  if (!resetRequest) throw new BadRequestError('Invalid or expired reset token', 'TOKEN_INVALID');
  
  const { hash, salt } = await security.hashWithSalt(newPassword);
  
  await (db.update as any)(users).set({ passwordHash: hash, passwordSalt: salt, updatedAt: nowISO() }).where(eq(users.id, resetRequest.userId));
  await (db.update as any)(passwordResets).set({ usedAt: nowISO() }).where(eq(passwordResets.id, resetRequest.id));
  await (db.delete as any)(sessions).where(eq(sessions.userId, resetRequest.userId));
  
  logger.info('Password reset', { userId: resetRequest.userId });
}

// ─── Helpers ───────────────────────────────────────────
async function createTokens(user: any, rememberMe = false): Promise<AuthTokens> {
  const expiresIn = rememberMe ? 2592000 : 900;
  const payload = { sub: user.id, email: user.email, role: user.role };
  const accessToken = await security.signJWT(payload, `${expiresIn}s`);
  const refreshToken = security.generateToken(128);
  return { accessToken, refreshToken, expiresIn };
}

async function createSession(userId: string, tokens: AuthTokens, userAgent?: string, ip?: string): Promise<void> {
  const db = getDb();
  await (db.insert as any)(sessions).values({
    id: generateUUID(), userId, token: tokens.accessToken, refreshToken: tokens.refreshToken,
    userAgent: userAgent || null, ipAddress: ip || null,
    expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
    lastActivityAt: nowISO(), createdAt: nowISO(),
  });
}

function toUserResponse(user: any): any {
  return {
    id: user.id, email: user.email, username: user.username,
    role: user.role, emailVerified: user.emailVerified,
    avatarUrl: user.avatarUrl, referralCode: user.referralCode, createdAt: user.createdAt,
  };
}
