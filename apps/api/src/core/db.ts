import { drizzle } from 'drizzle-orm/d1';

let dbInstance: ReturnType<typeof drizzle> | null = null;

export function getDb(d1Binding?: any) {
  if (dbInstance) return dbInstance;
  
  if (!d1Binding) {
    console.error('❌ D1 binding is undefined. Check Cloudflare Dashboard → Workers → Settings → D1 Bindings');
    throw new Error('D1 binding required for first initialization');
  }
  
  console.log('✅ D1 binding found, initializing database...');
  dbInstance = drizzle(d1Binding);
  return dbInstance;
}

export function resetDb(): void {
  dbInstance = null;
}
