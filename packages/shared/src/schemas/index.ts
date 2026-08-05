import { z } from 'zod';

// ─── Auth Schemas ──────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email().max(255).transform(v => v.toLowerCase()),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/),
  password: z.string().min(8).max(128)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

// ─── Link Schemas ──────────────────────────────────────
export const createLinkSchema = z.object({
  originalUrl: z.string().url().max(2048),
  shortCode: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  password: z.string().min(4).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
  maxClicks: z.number().int().min(1).optional(),
  domainId: z.string().uuid().optional(),
  utmSource: z.string().max(200).optional(),
  utmMedium: z.string().max(200).optional(),
  utmCampaign: z.string().max(200).optional(),
});

export const updateLinkSchema = createLinkSchema.partial().extend({
  status: z.enum(['active', 'inactive']).optional(),
});

// ─── Withdrawal Schemas ────────────────────────────────
export const createWithdrawalSchema = z.object({
  amount: z.number().min(10).max(5000),
  method: z.enum(['paypal', 'bank_transfer', 'crypto']),
  paymentEmail: z.string().email().optional(),
  paymentDetails: z.record(z.unknown()).optional(),
});

// ─── User Schemas ──────────────────────────────────────
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(30).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});

// ─── API Key Schemas ───────────────────────────────────
export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.string().datetime().optional(),
});

// ─── Domain Schemas ────────────────────────────────────
export const addDomainSchema = z.object({
  domain: z.string().regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Invalid domain format'
  ),
});

// ─── Pagination ────────────────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
  status: z.string().optional(),
});

// ─── Type exports ──────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
export type CreateWithdrawalInput = z.infer<typeof createWithdrawalSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type AddDomainInput = z.infer<typeof addDomainSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
