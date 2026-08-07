import { drizzle } from 'drizzle-orm/d1';
import { Environment } from './env';
import { Logger } from './logger';

const logger = new Logger('DB');

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb(d1Binding?: D1Database) {
  if (dbInstance) return dbInstance;
  
  if (!d1Binding) {
    throw new Error('D1 binding required for first initialization');
  }
  
  logger.info('Initializing database connection');
  dbInstance = drizzle(d1Binding, {
    logger: Environment.isDevelopment ? {
      logQuery(query: string, params: unknown[]) {
        logger.debug('Query executed', { query, params });
      },
    } : undefined,
  });
  
  return dbInstance;
}

export function resetDb(): void {
  dbInstance = null;
  logger.info('Database connection reset');
}

export async function healthCheck(d1Binding: D1Database): Promise<boolean> {
  try {
    await d1Binding.prepare('SELECT 1').first();
    logger.info('Database health check passed');
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}
