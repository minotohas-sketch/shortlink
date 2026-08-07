import { createApp } from './core/app';
import { Environment, validateEnv } from './core/env';
import { Logger } from './core/logger';
import { getDb } from './core/db';

// ─── Route imports ─────────────────────────────────────
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { linksRoutes } from './modules/links/links.routes';

const logger = new Logger('Main');

// ─── Application Factory ───────────────────────────────
export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    // Initialiser l'environnement validé
    const validatedEnv = validateEnv(env);
    Environment.init(validatedEnv);
    
    // BUG FIX: getDb() a un cache interne (dbInstance) pensé pour être
    // amorcé UNE fois avec le binding D1 réel, puis réutilisé par tous les
    // `getDb()` appelés sans argument dans les services (auth, links...).
    // Rien n'appelait jamais getDb(d1Binding) nulle part : le tout premier
    // appel (au sein de authService.register/login) tombait donc sur
    // `throw new Error('D1 binding required for first initialization')`.
    // Ceci suppose un binding nommé `D1` dans wrangler.jsonc (voir
    // d1_databases) — c'est le nom déjà attendu par health.controller.ts.
    const d1 = (env as any)?.D1;
    if (!d1) {
      logger.error('D1 binding missing — check wrangler.jsonc d1_databases and the Cloudflare dashboard bindings for this Worker');
    } else {
      getDb(d1);
    }
    
    // Créer l'application
    const app = createApp();
    
    // ─── Monter les routes ───────────────────────────
    app.route('/health', healthRoutes);
    app.route('/api/auth', authRoutes);
    app.route('/api/links', linksRoutes);
    
    // TODO: monter les modules restants au fur et à mesure qu'ils sont
    // réellement implémentés (controller + routes + schema non vides) :
    // usersRoutes, domainsRoutes, adminRoutes, adsRoutes, campaignsRoutes,
    // earningsRoutes, notificationsRoutes, paymentsRoutes, referralsRoutes,
    // reportsRoutes, webhooksRoutes, withdrawalsRoutes.
    // Ces modules n'ont aujourd'hui qu'un *.service.ts : pas de controller/
    // routes/schema, donc rien à monter tant qu'ils ne sont pas complétés.
    
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
    
    const d1 = (env as any)?.D1;
    if (d1) getDb(d1);
    
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
    
    const d1 = (env as any)?.D1;
    if (d1) getDb(d1);
    
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
