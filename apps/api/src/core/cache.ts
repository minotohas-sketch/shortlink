import { Environment } from './env';
import { Logger } from './logger';

const logger = new Logger('Cache');

export class CacheService {
  private kv: KVNamespace;
  private defaultTTL: number;
  
  constructor(kv: KVNamespace, defaultTTL?: number) {
    this.kv = kv;
    this.defaultTTL = defaultTTL || Environment.get().CACHE_TTL_LINK;
  }
  
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      if (value) logger.debug('Cache hit', { key });
      else logger.debug('Cache miss', { key });
      return value as T | null;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }
  
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), { expirationTtl: ttl || this.defaultTTL });
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Cache set error', error, { key });
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
      logger.debug('Cache delete', { key });
    } catch (error) {
      logger.error('Cache delete error', error, { key });
    }
  }
  
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
  
  async invalidatePattern(prefix: string): Promise<void> {
    try {
      let cursor: string | undefined;
      let count = 0;
      do {
        const list = await this.kv.list({ prefix, cursor: cursor as any, limit: 100 });
        for (const key of list.keys) {
          await this.kv.delete(key.name);
          count++;
        }
        cursor = (list as any).cursor as string | undefined;
      } while (cursor);
      logger.info('Cache pattern invalidated', { prefix, count });
    } catch (error) {
      logger.error('Cache invalidate pattern error', error, { prefix });
    }
  }
  
  async flush(): Promise<void> {
    await this.invalidatePattern('');
  }
}

export function createCacheService(kv: KVNamespace): CacheService {
  return new CacheService(kv);
}
