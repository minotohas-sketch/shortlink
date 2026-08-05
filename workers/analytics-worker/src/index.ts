/**
 * Analytics Worker
 * 
 * Worker dédié au traitement asynchrone des analytics.
 * Consomme la queue analytics et agrège les données.
 */

import { Logger } from './logger';
import { processClickEvent, ClickEvent } from './processor';
import { aggregateDailyStats } from './aggregator';

const logger = new Logger('AnalyticsWorker');

export default {
  // ─── Queue Consumer ──────────────────────────────────
  async queue(batch: MessageBatch<ClickEvent>, env: Env): Promise<void> {
    logger.info('Processing analytics batch', { 
      count: batch.messages.length,
      queue: batch.queue,
    });
    
    const results = {
      processed: 0,
      failed: 0,
      duplicates: 0,
    };
    
    for (const message of batch.messages) {
      try {
        const event = message.body;
        const result = await processClickEvent(event, env);
        
        if (result === 'duplicate') {
          results.duplicates++;
        } else {
          results.processed++;
        }
        
        message.ack();
      } catch (error) {
        results.failed++;
        logger.error('Failed to process click', error, { 
          messageId: message.id 
        });
        message.retry({ delaySeconds: 60 });
      }
    }
    
    logger.info('Batch processed', results);
  },
  
  // ─── Scheduled Tasks ─────────────────────────────────
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    logger.info('Scheduled analytics task', { cron: event.cron });
    
    switch (event.cron) {
      case '0 * * * *': // Toutes les heures
        await aggregateDailyStats(env);
        break;
      case '0 0 * * *': // Minuit
        await aggregateDailyStats(env);
        // await generateDailyReports(env);
        break;
      default:
        logger.warn('Unknown cron schedule', { cron: event.cron });
    }
  },
};

// ─── Environment ───────────────────────────────────────
interface Env {
  DB: D1Database;
  ANALYTICS_CACHE: KVNamespace;
  CLICKS_QUEUE: Queue;
}
