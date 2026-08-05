/**
 * Email Queue Worker
 * 
 * Consomme la file d'attente email et envoie les emails via Resend.
 */

import { Logger } from '../../core/logger';
import { getMailService, MailOptions } from '../../core/mail';

const logger = new Logger('EmailWorker');

export interface EmailJob {
  type: 'email';
  payload: MailOptions;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export async function processEmailBatch(
  batch: MessageBatch<EmailJob>
): Promise<void> {
  const mailService = getMailService();
  
  logger.info('Processing email batch', { count: batch.messages.length });
  
  for (const message of batch.messages) {
    try {
      const { payload } = message.body;
      
      const result = await mailService.send(payload);
      
      if (result.success) {
        logger.info('Email sent', { id: result.id, to: payload.to });
        message.ack();
      } else {
        logger.error('Email failed', new Error(result.error), { to: payload.to });
        message.retry({ delaySeconds: 60 });
      }
    } catch (error) {
      logger.error('Email processing error', error);
      message.retry({ delaySeconds: 120 });
    }
  }
}

// Export pour Cloudflare Queues
export default {
  async queue(batch: MessageBatch<EmailJob>, env: any): Promise<void> {
    await processEmailBatch(batch);
  },
};
