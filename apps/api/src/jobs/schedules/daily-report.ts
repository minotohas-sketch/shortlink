/**
 * Daily Report Scheduler
 * 
 * Génère et envoie les rapports quotidiens aux utilisateurs.
 * Exécuté tous les jours à minuit UTC.
 */

import { Logger } from '../../core/logger';
import { getDb } from '../../core/db';
import { getMailService } from '../../core/mail';
import { clicks, links } from '../../modules/links/links.schema';
import { users } from '../../modules/auth/auth.schema';
import { eq, and, count, sum, gte, lte, sql } from 'drizzle-orm';
import { startOfDay, endOfDay, nowISO } from '../../utils/date';

const logger = new Logger('DailyReport');

export async function runDailyReport(env: any): Promise<void> {
  logger.info('Starting daily report generation');
  
  const db = getDb();
  const mailService = getMailService();
  
  const today = new Date();
  const dayStart = startOfDay(today).toISOString();
  const dayEnd = endOfDay(today).toISOString();
  
  try {
    // Récupérer tous les utilisateurs actifs
    const activeUsers = await db.select({
      id: users.id,
      email: users.email,
      username: users.username,
    })
      .from(users)
      .where(eq(users.status, 'active'))
      .all();
    
    logger.info('Processing daily reports', { userCount: activeUsers.length });
    
    let sentCount = 0;
    let errorCount = 0;
    
    for (const user of activeUsers) {
      try {
        // Récupérer les stats de la journée
        const linkIds = await db.select({ id: links.id })
          .from(links)
          .where(eq(links.userId, user.id))
          .all();
        
        if (linkIds.length === 0) continue;
        
        const linkIdList = linkIds.map(l => l.id);
        
        const stats = await db.select({
          totalClicks: count(),
          uniqueClicks: sql`SUM(CASE WHEN is_unique = 1 THEN 1 ELSE 0 END)`,
          totalEarnings: sum(clicks.earnings),
        })
          .from(clicks)
          .where(
            and(
              sql`${clicks.linkId} IN (${linkIdList.join(',')})`,
              gte(clicks.createdAt, dayStart),
              lte(clicks.createdAt, dayEnd)
            )
          )
          .get();
        
        const totalClicks = stats?.totalClicks || 0;
        
        if (totalClicks === 0) continue;
        
        // Envoyer l'email de rapport
        await mailService.send({
          to: user.email,
          subject: `📊 Daily Report — ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          html: generateDailyReportHtml(
            user.username,
            totalClicks,
            Number(stats?.uniqueClicks ?? 0) || 0,
            (stats?.totalEarnings ?? 0) as number || 0,
            today
          ),
        });
        
        sentCount++;
      } catch (error) {
        logger.error('Failed to send daily report', error, { userId: user.id });
        errorCount++;
      }
    }
    
    logger.info('Daily reports sent', { sent: sentCount, errors: errorCount });
  } catch (error) {
    logger.error('Daily report generation failed', error);
  }
}

function generateDailyReportHtml(
  username: string,
  totalClicks: number,
  uniqueClicks: number,
  earnings: number,
  date: Date
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #6366f1;">📊 Daily Report</h1>
        <p style="color: #6b7280;">${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
      </div>
      
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin: 20px 0;">
        <p style="font-size: 16px; color: #374151;">Hi ${username}, here's your daily summary:</p>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 24px 0;">
          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px;">
            <p style="font-size: 24px; font-weight: bold; color: #6366f1; margin: 0;">${totalClicks}</p>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Total Clicks</p>
          </div>
          <div style="text-align: center; padding: 16px; background: white; border-radius: 8px;">
            <p style="font-size: 24px; font-weight: bold; color: #10b981; margin: 0;">$${earnings.toFixed(4)}</p>
            <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">Earnings</p>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://peage.io/dashboard" 
           style="background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Full Dashboard
        </a>
      </div>
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        You're receiving this because you have an active Peage account.
        <br><a href="https://peage.io/settings/notifications" style="color: #6366f1;">Manage notifications</a>
      </p>
    </body>
    </html>
  `;
}
