import { getDb } from '../../core/db';
import { Logger } from '../../core/logger';
import { sqliteTable, text, real, integer, index } from 'drizzle-orm/sqlite-core';
import { sql, eq, and, desc, count, sum } from 'drizzle-orm';
import { users } from '../auth/auth.schema';
import { earnings } from '../earnings/earnings.service';
import { generateUUID } from '../../utils/crypto';
import { nowISO, addDays } from '../../utils/date';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors';

const logger = new Logger('WithdrawalsService');

// ─── Withdrawals Schema ────────────────────────────────
export const withdrawals = sqliteTable('withdrawals', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  amount: real('amount').notNull(),
  method: text('method', { enum: ['paypal', 'stripe', 'bank_transfer', 'crypto'] })
    .notNull(),
  status: text('status', { 
    enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'] 
  })
    .notNull()
    .default('pending'),
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
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  userIdIdx: index('withdrawals_user_id_idx').on(table.userId),
  statusIdx: index('withdrawals_status_idx').on(table.status),
  createdAtIdx: index('withdrawals_created_at_idx').on(table.createdAt),
}));

// ─── Withdrawal Methods ────────────────────────────────
export const WITHDRAWAL_METHODS = [
  { 
    id: 'paypal', 
    name: 'PayPal', 
    fee: 0, 
    feePercent: 0, 
    minAmount: 10, 
    maxAmount: 5000,
    processingDays: '1-3 business days',
    currency: 'USD',
  },
  { 
    id: 'bank_transfer', 
    name: 'Bank Transfer', 
    fee: 2, 
    feePercent: 0, 
    minAmount: 50, 
    maxAmount: 10000,
    processingDays: '3-5 business days',
    currency: 'USD',
  },
  { 
    id: 'crypto', 
    name: 'Cryptocurrency (USDT)', 
    fee: 0, 
    feePercent: 0, 
    minAmount: 25, 
    maxAmount: 5000,
    processingDays: '1-2 business days',
    currency: 'USDT',
  },
];

// ─── Request Withdrawal ────────────────────────────────
export async function requestWithdrawal(
  userId: string,
  amount: number,
  method: string,
  paymentEmail?: string,
  paymentDetails?: Record<string, unknown>
): Promise<WithdrawalResponse> {
  const db = getDb();
  
  // Valider le montant
  if (amount < 10) {
    throw new BadRequestError('Minimum withdrawal amount is $10', 'AMOUNT_TOO_LOW');
  }
  
  if (amount > 5000) {
    throw new BadRequestError('Maximum withdrawal amount is $5000', 'AMOUNT_TOO_HIGH');
  }
  
  // Valider la méthode
  const methodConfig = WITHDRAWAL_METHODS.find(m => m.id === method);
  if (!methodConfig) {
    throw new BadRequestError('Invalid withdrawal method', 'INVALID_METHOD');
  }
  
  if (amount < methodConfig.minAmount || amount > methodConfig.maxAmount) {
    throw new BadRequestError(
      `Amount must be between $${methodConfig.minAmount} and $${methodConfig.maxAmount} for ${methodConfig.name}`,
      'AMOUNT_LIMIT'
    );
  }
  
  // Vérifier le nombre de demandes en attente
  const pendingCount = await db.select({ count: count() })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.userId, userId),
        eq(withdrawals.status, 'pending')
      )
    )
    .get();
  
  if (pendingCount && pendingCount.count >= 3) {
    throw new BadRequestError(
      'You already have 3 pending withdrawal requests',
      'MAX_PENDING_REQUESTS'
    );
  }
  
  // Vérifier le solde disponible
  const balanceResult = await db.select({
    available: sql`SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END)`,
    withdrawn: sql`SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END)`,
  })
    .from(earnings)
    .where(eq(earnings.userId, userId))
    .get();
  
  const totalEarnings = Number(balanceResult?.available) || 0;
  const totalWithdrawn = Number(balanceResult?.withdrawn) || 0;
  const availableBalance = totalEarnings - totalWithdrawn;
  
  // Vérifier les retraits en attente
  const pendingWithdrawals = await db.select({
    total: sum(withdrawals.amount),
  })
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.userId, userId),
        sql`${withdrawals.status} IN ('pending', 'processing')`
      )
    )
    .get();
  
  const pendingAmount = Number(pendingWithdrawals?.total) || 0;
  const effectiveBalance = availableBalance - pendingAmount;
  
  if (amount > effectiveBalance) {
    throw new BadRequestError(
      `Insufficient balance. Available: $${effectiveBalance.toFixed(2)}`,
      'INSUFFICIENT_BALANCE'
    );
  }
  
  // Calculer les frais
  const fee = methodConfig.fee + (amount * methodConfig.feePercent / 100);
  const netAmount = amount - fee;
  
  // Créer la demande
  const withdrawalId = generateUUID();
  const now = nowISO();
  
  await (db.insert as any)(withdrawals).values({
    id: withdrawalId,
    userId,
    amount,
    method: method as any,
    status: 'pending',
    paymentEmail: paymentEmail || null,
    paymentDetails: paymentDetails || null,
    fee,
    netAmount,
    createdAt: now,
    updatedAt: now,
  });
  
  logger.info('Withdrawal requested', { 
    userId, 
    withdrawalId, 
    amount, 
    method,
    netAmount 
  });
  
  // TODO: Envoyer notification de confirmation
  // TODO: Mettre dans la queue de traitement
  
  const withdrawal = await db.select()
    .from(withdrawals)
    .where(eq(withdrawals.id, withdrawalId))
    .get();
  
  if (!withdrawal) throw new Error('Failed to create withdrawal');
  
  return toWithdrawalResponse(withdrawal);
}

// ─── Get Withdrawal ────────────────────────────────────
export async function getWithdrawal(
  withdrawalId: string,
  userId: string
): Promise<WithdrawalResponse> {
  const db = getDb();
  
  const withdrawal = await db.select()
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.id, withdrawalId),
        eq(withdrawals.userId, userId)
      )
    )
    .get();
  
  if (!withdrawal) {
    throw new NotFoundError('Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
  }
  
  return toWithdrawalResponse(withdrawal);
}

// ─── List Withdrawals ──────────────────────────────────
export async function listWithdrawals(
  userId: string,
  page = 1,
  limit = 20,
  status?: string
): Promise<{ withdrawals: WithdrawalResponse[]; total: number }> {
  const db = getDb();
  
  const conditions = [eq(withdrawals.userId, userId)];
  
  if (status) {
    conditions.push(eq(withdrawals.status, status as any));
  }
  
  const totalResult = await db.select({ total: count() })
    .from(withdrawals)
    .where(and(...conditions))
    .get();
  
  const results = await db.select()
    .from(withdrawals)
    .where(and(...conditions))
    .orderBy(desc(withdrawals.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)
    .all();
  
  return {
    withdrawals: results.map(toWithdrawalResponse),
    total: totalResult?.total || 0,
  };
}

// ─── Cancel Withdrawal ─────────────────────────────────
export async function cancelWithdrawal(
  withdrawalId: string,
  userId: string
): Promise<void> {
  const db = getDb();
  
  const withdrawal = await db.select()
    .from(withdrawals)
    .where(
      and(
        eq(withdrawals.id, withdrawalId),
        eq(withdrawals.userId, userId)
      )
    )
    .get();
  
  if (!withdrawal) {
    throw new NotFoundError('Withdrawal not found', 'WITHDRAWAL_NOT_FOUND');
  }
  
  if (withdrawal.status !== 'pending') {
    throw new BadRequestError(
      `Cannot cancel a withdrawal with status "${withdrawal.status}"`,
      'CANNOT_CANCEL'
    );
  }
  
  await (db.update as any)(withdrawals)
    .set({ 
      status: 'cancelled', 
      updatedAt: nowISO() 
    })
    .where(eq(withdrawals.id, withdrawalId));
  
  logger.info('Withdrawal cancelled', { withdrawalId, userId });
}

// ─── Get Withdrawal Methods ────────────────────────────
export function getWithdrawalMethods() {
  return WITHDRAWAL_METHODS;
}

// ─── Helpers ───────────────────────────────────────────
function toWithdrawalResponse(w: typeof withdrawals.$inferSelect): WithdrawalResponse {
  return {
    id: w.id,
    amount: w.amount,
    method: w.method,
    status: w.status,
    paymentEmail: w.paymentEmail,
    fee: w.fee,
    netAmount: w.netAmount,
    notes: w.notes,
    processedAt: w.processedAt,
    completedAt: w.completedAt,
    rejectedAt: w.rejectedAt,
    rejectionReason: w.rejectionReason,
    transactionId: w.transactionId,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

// ─── Types ─────────────────────────────────────────────
export interface WithdrawalResponse {
  id: string;
  amount: number;
  method: string;
  status: string;
  paymentEmail: string | null;
  fee: number;
  netAmount: number;
  notes: string | null;
  processedAt: string | null;
  completedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalMethod {
  id: string;
  name: string;
  fee: number;
  feePercent: number;
  minAmount: number;
  maxAmount: number;
  processingDays: string;
  currency: string;
}
