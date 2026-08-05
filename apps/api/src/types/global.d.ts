/**
 * Global Type Declarations
 */

// ─── Cloudflare Environment ────────────────────────────
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_ENV: string;
      APP_NAME: string;
      APP_URL: string;
      API_URL: string;
    }
  }
}

// ─── Hono Context Extensions ───────────────────────────
declare module 'hono' {
  interface ContextVariableMap {
    requestId: string;
    userId: string;
    user: import('../modules/auth/auth.types').AuthUser;
    userRole: string;
    sessionId: string;
    apiKey: string;
    isApiKey: boolean;
    validatedBody: unknown;
    validatedQuery: unknown;
    validatedParams: unknown;
    validatedHeaders: unknown;
    startTime: number;
  }
}

// ─── Cloudflare Workers Types ──────────────────────────
declare interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

declare interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

declare interface MessageBatch<T = unknown> {
  queue: string;
  messages: Array<{
    id: string;
    body: T;
    timestamp: Date;
    ack(): void;
    retry(options?: { delaySeconds?: number }): void;
  }>;
}

// ─── Cloudflare Bindings ───────────────────────────────
declare interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
  exec(query: string): Promise<D1Result>;
}

declare interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T[]>>;
  raw<T = unknown>(): Promise<T[]>;
}

declare interface D1Result<T = unknown> {
  results?: T;
  success: boolean;
  meta?: any;
  error?: string;
  changes?: number;
}

declare interface KVNamespace {
  get(key: string, options?: { type: 'text' }): Promise<string | null>;
  get<T = unknown>(key: string, options: { type: 'json' }): Promise<T | null>;
  get(key: string, options?: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; cursor?: string }>;
}

declare interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: any;
}

declare interface R2Bucket {
  put(key: string, value: ArrayBuffer | Uint8Array | ReadableStream | string, options?: R2PutOptions): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<{ objects: Array<{ key: string }> }>;
}

declare interface R2PutOptions {
  httpMetadata?: {
    contentType?: string;
    cacheControl?: string;
    contentDisposition?: string;
  };
  customMetadata?: Record<string, string>;
}

declare interface R2Object {
  key: string;
  size: number;
  httpEtag: string;
}

declare interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

declare interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
}

declare interface Queue {
  send(message: unknown): Promise<void>;
  sendBatch(messages: Array<{ body: unknown }>): Promise<void>;
}

// ─── Drizzle extensions ────────────────────────────────
declare module 'drizzle-orm/sqlite-core' {
  interface SQLiteTableConfig {
    // Allow additional config
  }
}

export {};
