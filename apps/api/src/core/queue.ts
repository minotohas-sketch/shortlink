/**
 * Queue Service
 * 
 * Gestionnaire de files d'attente Cloudflare Queues.
 * Centralise l'envoi de messages vers les différentes queues.
 */

import { Logger } from './logger';

const logger = new Logger('QueueService');

export interface QueueMessage<T = unknown> {
  type: string;
  payload: T;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export class QueueService {
  private queues: Map<string, Queue>;
  
  constructor(env: Record<string, unknown>) {
    this.queues = new Map();
    
    // Enregistrer les queues disponibles
    const queueNames = [
      'EMAIL_QUEUE',
      'ANALYTICS_QUEUE',
      'PAYOUT_QUEUE',
      'NOTIFICATION_QUEUE',
    ];
    
    for (const name of queueNames) {
      const queue = (env as any)[name] as Queue | undefined;
      if (queue) {
        this.queues.set(name, queue);
        logger.info(`Queue registered: ${name}`);
      }
    }
  }
  
  async send<T>(queueName: string, message: QueueMessage<T>): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      logger.error(`Queue not found: ${queueName}`, new Error('Queue not configured'));
      return;
    }
    
    try {
      const enrichedMessage = {
        ...message,
        timestamp: message.timestamp || new Date().toISOString(),
        metadata: {
          ...message.metadata,
          sentAt: new Date().toISOString(),
        },
      };
      
      await queue.send(enrichedMessage);
      logger.debug('Message sent to queue', { queue: queueName, type: message.type });
    } catch (error) {
      logger.error('Failed to send message to queue', error, {
        queue: queueName,
        type: message.type,
      });
      throw error;
    }
  }
  
  async sendBatch<T>(queueName: string, messages: QueueMessage<T>[]): Promise<void> {
    const queue = this.queues.get(queueName);
    
    if (!queue) {
      logger.error(`Queue not found: ${queueName}`);
      return;
    }
    
    try {
      const batch = messages.map((msg) => ({
        body: {
          ...msg,
          timestamp: msg.timestamp || new Date().toISOString(),
        },
      }));
      
      await queue.sendBatch(batch);
      logger.info('Batch sent to queue', {
        queue: queueName,
        count: messages.length,
      });
    } catch (error) {
      logger.error('Failed to send batch to queue', error, {
        queue: queueName,
        count: messages.length,
      });
    }
  }
  
  // ─── Convenience methods ─────────────────────────────
  
  async sendEmail<T>(payload: T): Promise<void> {
    await this.send<T>('EMAIL_QUEUE', {
      type: 'email',
      payload,
    });
  }
  
  async sendAnalytics<T>(payload: T): Promise<void> {
    await this.send<T>('ANALYTICS_QUEUE', {
      type: 'analytics',
      payload,
    });
  }
  
  async sendPayout<T>(payload: T): Promise<void> {
    await this.send<T>('PAYOUT_QUEUE', {
      type: 'payout',
      payload,
    });
  }
  
  async sendNotification<T>(payload: T): Promise<void> {
    await this.send<T>('NOTIFICATION_QUEUE', {
      type: 'notification',
      payload,
    });
  }
}

// Singleton
let queueServiceInstance: QueueService | null = null;

export function getQueueService(env?: Record<string, unknown>): QueueService {
  if (!queueServiceInstance && env) {
    queueServiceInstance = new QueueService(env);
  }
  if (!queueServiceInstance) {
    throw new Error('QueueService not initialized. Provide env on first call.');
  }
  return queueServiceInstance;
}
