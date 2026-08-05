import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

// ─── Types ─────────────────────────────────────────────
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginationMeta;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── Success Responses ─────────────────────────────────
export function ok<T>(c: Context, data: T, message?: string): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return c.json(body, 200);
}

export function created<T>(c: Context, data: T, message = 'Resource created successfully'): Response {
  const body: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  return c.json(body, 201);
}

export function accepted(c: Context, message = 'Request accepted', data?: unknown): Response {
  const body: ApiResponse = {
    success: true,
    data,
    message,
  };
  return c.json(body, 202);
}

export function noContent(c: Context): Response {
  return c.body(null, 204);
}

// ─── Paginated Response ────────────────────────────────
export function paginated<T>(
  c: Context,
  data: T[],
  meta: PaginationMeta
): Response {
  const body: ApiResponse<T[]> = {
    success: true,
    data,
    meta,
  };
  return c.json(body, 200);
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

// ─── Redirect Response ─────────────────────────────────
export function redirect(c: Context, url: string, status: 301 | 302 = 302): Response {
  return c.redirect(url, status);
}

// ─── Stream Response ───────────────────────────────────
export function stream(c: Context, readable: ReadableStream, contentType = 'application/octet-stream'): Response {
  c.header('Content-Type', contentType);
  return c.body(readable);
}

// ─── File Download ─────────────────────────────────────
export function download(
  c: Context,
  data: ArrayBuffer | Uint8Array,
  filename: string,
  contentType = 'application/octet-stream'
): Response {
  c.header('Content-Type', contentType);
  c.header('Content-Disposition', `attachment; filename="${filename}"`);
  return c.body(data as any);
}

// ─── Cached Response ───────────────────────────────────
export function cached<T>(
  c: Context,
  data: T,
  ttlSeconds: number,
  etag?: string
): Response {
  c.header('Cache-Control', `public, max-age=${ttlSeconds}`);
  
  if (etag) {
    c.header('ETag', etag);
  }
  
  const body: ApiResponse<T> = {
    success: true,
    data,
  };
  
  return c.json(body, 200);
}

// ─── Not Modified ──────────────────────────────────────
export function notModified(c: Context): Response {
  return c.body(null, 304);
}

// ─── Response Helpers ──────────────────────────────────
export function setCacheHeaders(c: Context, ttlSeconds: number): void {
  c.header('Cache-Control', `public, max-age=${ttlSeconds}`);
  c.header('Vary', 'Accept-Encoding, Authorization');
}

export function setNoCache(c: Context): void {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
}
