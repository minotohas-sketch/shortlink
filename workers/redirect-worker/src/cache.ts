/**
 * Cache Service for Redirect Worker
 */

export class CacheService {
  private kv: KVNamespace;
  private defaultTTL: number;
  
  constructor(kv: KVNamespace, defaultTTL = 3600) {
    this.kv = kv;
    this.defaultTTL = defaultTTL;
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(key, 'json');
      return value as T | null;
    } catch {
      return null;
    }
  }
  
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.kv.put(key, JSON.stringify(value), {
        expirationTtl: ttl || this.defaultTTL,
      });
    } catch {
      // Ignorer les erreurs de cache
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(key);
    } catch {
      // Ignorer
    }
  }
  
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }
  
  // Cache avec pattern: link:*
  async getLink(shortCode: string): Promise<unknown | null> {
    return this.get(`link:${shortCode}`);
  }
  
  async setLink(shortCode: string, data: unknown, ttl?: number): Promise<void> {
    await this.set(`link:${shortCode}`, data, ttl || this.defaultTTL);
  }
  
  async deleteLink(shortCode: string): Promise<void> {
    await this.delete(`link:${shortCode}`);
  }
}
