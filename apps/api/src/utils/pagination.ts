import type { Context } from 'hono';
import { z } from 'zod';

// ─── Pagination Schema ─────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  cursor: z.string().optional(),
});

export type PaginationParams = z.infer<typeof paginationSchema>;

// ─── Pagination Meta ───────────────────────────────────
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  nextCursor: string | null;
  hasNext: boolean;
}

// ─── Extract Pagination from Request ───────────────────
export function getPaginationParams(c: Context): PaginationParams {
  const query = c.req.query();
  
  const parsed = paginationSchema.safeParse({
    page: query.page,
    limit: query.limit,
    sort: query.sort,
    order: query.order,
    cursor: query.cursor,
  });
  
  if (!parsed.success) {
    return { page: 1, limit: 20, order: 'desc' };
  }
  
  return parsed.data;
}

// ─── Offset Pagination ─────────────────────────────────
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function createPaginationMeta(
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

// ─── Cursor Pagination ─────────────────────────────────
export function decodeCursor(cursor: string): string {
  try {
    return atob(cursor);
  } catch {
    return cursor;
  }
}

export function encodeCursor(value: string): string {
  return btoa(value);
}

export function createCursorMeta(
  data: unknown[],
  limit: number,
  nextCursorValue?: string
): CursorPaginationMeta {
  const hasNext = data.length > limit;
  
  // Enlever l'élément en trop
  if (hasNext) {
    data.pop();
  }
  
  return {
    limit,
    nextCursor: hasNext && nextCursorValue ? encodeCursor(nextCursorValue) : null,
    hasNext,
  };
}

// ─── Sort Builder ──────────────────────────────────────
export function buildSortClause(
  sort?: string,
  order: 'asc' | 'desc' = 'desc',
  allowedFields?: string[]
): Record<string, 'asc' | 'desc'> | undefined {
  if (!sort) return undefined;
  
  if (allowedFields && !allowedFields.includes(sort)) {
    return undefined;
  }
  
  return { [sort]: order };
}

// ─── Response Helpers ──────────────────────────────────
export function paginatedResponse<T>(
  c: Context,
  data: T[],
  meta: PaginationMeta | CursorPaginationMeta
) {
  return c.json({
    success: true,
    data,
    meta,
  }, 200);
}

export function addPaginationHeaders(c: Context, meta: PaginationMeta): void {
  c.header('X-Page', String(meta.page));
  c.header('X-Limit', String(meta.limit));
  c.header('X-Total', String(meta.total));
  c.header('X-Total-Pages', String(meta.totalPages));
  c.header('X-Has-Next', String(meta.hasNext));
  c.header('X-Has-Previous', String(meta.hasPrevious));
}
