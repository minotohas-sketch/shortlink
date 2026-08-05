import { z } from 'zod';

// ─── Enums ─────────────────────────────────────────────
export type LinkStatus = 'active' | 'inactive' | 'expired' | 'deleted';
export type LinkType = 'direct' | 'campaign' | 'dynamic';

// ─── Link Interface ────────────────────────────────────
export interface Link {
  id: string;
  userId: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  status: LinkStatus;
  type: LinkType;
  domainId: string | null;
  customDomain: string | null;
  password: string | null;
  expiresAt: string | null;
  maxClicks: number | null;
  currentClicks: number;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Request Schemas ───────────────────────────────────
export const createLinkSchema = z.object({
  originalUrl: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL is too long'),
  shortCode: z.string()
    .min(3, 'Short code must be at least 3 characters')
    .max(20, 'Short code must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Short code can only contain letters, numbers, hyphens and underscores')
    .optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  password: z.string().min(4).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  maxClicks: z.number().int().min(1).max(1000000000).optional(),
  domainId: z.string().uuid().optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});

export const updateLinkSchema = z.object({
  originalUrl: z.string().min(1).max(2048).optional(),
  title: z.string().max(200).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(50)).max(10).optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
  password: z.string().min(4).max(100).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxClicks: z.number().int().min(1).optional().nullable(),
});

export const linkQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['createdAt', 'updatedAt', 'clicks', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(['active', 'inactive', 'expired']).optional(),
  search: z.string().max(100).optional(),
  tags: z.string().optional(),
  domainId: z.string().uuid().optional(),
});

// ─── Response Types ────────────────────────────────────
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type LinkQueryInput = z.infer<typeof linkQuerySchema>;

export interface LinkResponse {
  id: string;
  shortCode: string;
  shortUrl: string;
  originalUrl: string;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  status: LinkStatus;
  password: string | null;
  expiresAt: string | null;
  maxClicks: number | null;
  currentClicks: number;
  domainId: string | null;
  customDomain: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkStatsResponse {
  totalClicks: number;
  uniqueClicks: number;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByReferrer: Record<string, number>;
  clicksByDate: Record<string, number>;
  averageCpm: number;
  totalEarnings: number;
}
