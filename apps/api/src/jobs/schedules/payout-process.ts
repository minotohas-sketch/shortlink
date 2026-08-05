/**
 * Payout Process Scheduler
 * 
 * Traite les retraits en attente.
 * Exécuté tous les jours à 6h UTC.
 */

import { Logger } from '../../core/logger';
import { getDb } from '../../core/db';
import { getMailService } from '../../core/mail';
import { withdrawals } from '../../modules/withdrawals/withdrawals.service';
import { userBalances } from '../../modules/earnings/earnings.service';
import { users } from '../../modules/auth/auth.schema';
import { eq, and, count, sum, sql } from 'drizzle-orm';
import { nowISO } from '../../utils/date';

const logger = new Logger('PayoutProcess');

export async function runPayoutProcess(env: any): Promise<void> {
  logger.info('Starting payout process');
  
  const db = getDb();
  const mailService = getMailService();
  const now = nowISO();
  
  try {
    // Récupérer les retraits en attente depuis plus de 3 jours
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
    
    const pendingWithdrawals = await db.select()
      .from(withdrawals)
      .where(
        and(
          eq(withdrawals.status, 'pending'),
          sql`${withdrawals.createdAt} <= ${threeDaysAgo}`
        )
      )
      .all();
    
    if (pendingWithdrawals.length === 0) {
      logger.info('No pending withdrawals to process');
      return;
    }
    
    logger.info('Processing withdrawals', { count: pendingWithdrawals.length });
    
    let processedCount = 0;
    let failedCount = 0;
    
    for (const withdrawal of pendingWithdrawals) {
      try {
        // Marquer comme en cours
        await (db.update as any)(withdrawals)
          .set({ status: 'processing', processedAt: now, updatedAt: now })
          .where(eq(withdrawals.id, withdrawal.id));
        
        // TODO: Traiter le paiement via Stripe/PayPal
        // const paymentResult = await processPayment(withdrawal);
        
        // Pour l'instant, simuler un succès
        const transactionId = `txn_${Date.now()}_${withdrawal.id.substring(0, 8)}`;
        
        // Marquer comme complété
        await (db.update as any)(withdrawals)
          .set({
            status: 'completed',
            completedAt: now,
            transactionId,
            updatedAt: now,
          })
          .where(eq(withdrawals.id, withdrawal.id));
        
        // Mettre à jour le solde de l'utilisateur
        await (db.update as any)(userBalances)
          .set({
            totalWithdrawn: sql`total_withdrawn + ${withdrawal.netAmount}`,
            availableBalance: sql`available_balance - ${withdrawal.amount}`,
            updatedAt: now,
          })
          .where(eq(userBalances.userId, withdrawal.userId));
        
        // Envoyer l'email de confirmation
        const user = await db.select({ email: users.email, username: users.username })
          .from(users)
          .where(eq(users.id, withdrawal.userId))
          .get();
        
        if (user) {
          await mailService.send({
            to: user.email,
            subject: `Withdrawal Completed — $${withdrawal.netAmount.toFixed(2)}`,
            html: generatePayoutCompletedHtml(
              user.username,
              withdrawal.netAmount,
              withdrawal.method,
              transactionId
            ),
          });
        }
        
        processedCount++;
        logger.info('Withdrawal processed', {
          withdrawalId: withdrawal.id,
          userId: withdrawal.userId,
          amount: withdrawal.netAmount,
        });
      } catch (error) {
        logger.error('Failed to process withdrawal', error, {
          withdrawalId: withdrawal.id,
        });
        
        // Marquer l'erreur mais ne pas rejeter automatiquement
        await (db.update as any)(withdrawals)
          .set({
            notes: `Processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            updatedAt: now,
          })
          .where(eq(withdrawals.id, withdrawal.id));
        
        failedCount++;
      }
    }
    
    logger.info('Payout process completed', {
      processed: processedCount,
      failed: failedCount,
    });
  } catch (error) {
    logger.error('Payout process failed', error);
  }
}

function generatePayoutCompletedHtml(
  username: string,
  amount: number,
  method: string,
  transactionId: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #10b981;">✅ Withdrawal Completed!</h1>
      <p>Hi ${username},</p>
      <p>Your withdrawal has been processed successfully.</p>
      
      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        <p><strong>Method:</strong> ${method}</p>
        <p><strong>Transaction ID:</strong> ${transactionId}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">
        The funds should arrive in your account within 1-5 business days depending on your payment method.
      </p>
    </body>
    </html>
  `;
}
