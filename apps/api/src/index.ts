import { createApp } from './core/app';
import { Environment, validateEnv } from './core/env';
import { Logger } from './core/logger';

// ─── Route imports ─────────────────────────────────────
import { healthRoutes } from './modules/health/health.routes';

const logger = new Logger('Main');

// ─── Application Factory ───────────────────────────────
export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    // Initialiser l'environnement validé
    const validatedEnv = validateEnv(env);
    Environment.init(validatedEnv);
    
    // Créer l'application
    const app = createApp();
    
    // ─── Monter les routes ───────────────────────────
    app.route('/health', healthRoutes);
    
    // TODO: Monter les autres modules
    // app.route('/api/auth', authRoutes);
    // app.route('/api/users', usersRoutes);
    // app.route('/api/links', linksRoutes);
    // etc.
    
    // ─── Log de démarrage ────────────────────────────
    logger.info('Request received', {
      method: request.method,
      url: request.url,
      cf: (request as any).cf,
    });
    
    return app.fetch(request, env, ctx);
  },
  
  // ─── Scheduled Worker ────────────────────────────────
  async scheduled(event: ScheduledEvent, env: unknown, ctx: ExecutionContext): Promise<void> {
    const validatedEnv = validateEnv(env);
    Environment.init(validatedEnv);
    
    logger.info('Scheduled task running', { cron: event.cron });
    
    switch (event.cron) {
      case '0 0 * * *': // Minuit tous les jours
        // await runDailyReport();
        break;
      case '0 0 * * 0': // Dimanche minuit
        // await runWeeklyReport();
        break;
      case '0 0 1 * *': // 1er du mois
        // await runMonthlyReport();
        break;
      default:
        logger.warn('Unknown cron schedule', { cron: event.cron });
    }
  },
  
  // ─── Queue Consumer ──────────────────────────────────
  async queue(batch: MessageBatch<unknown>, env: unknown, ctx: ExecutionContext): Promise<void> {
    const validatedEnv = validateEnv(env);
    Environment.init(validatedEnv);
    
    logger.info('Processing queue batch', { 
      queue: batch.queue,
      messageCount: batch.messages.length 
    });
    
    for (const message of batch.messages) {
      try {
        // Traiter le message selon la queue
        logger.info('Processing message', { 
          id: message.id,
          body: message.body 
        });
        
        message.ack();
      } catch (error) {
        logger.error('Failed to process message', error, { 
          messageId: message.id 
        });
        message.retry();
      }
    }
  },
};
