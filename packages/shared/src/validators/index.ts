import { z } from 'zod';

// ─── URL Validators ────────────────────────────────────
export const urlSchema = z.string()
  .min(1, 'URL is required')
  .max(2048, 'URL is too long')
  .url('Invalid URL format')
  .refine(
    (url) => url.startsWith('http://') || url.startsWith('https://'),
    'URL must start with http:// or https://'
  );

// ─── Email Validators ──────────────────────────────────
export const emailSchema = z.string()
  .email('Invalid email address')
  .max(255, 'Email is too long')
  .transform((email) => email.toLowerCase().trim());

// ─── Password Validators ───────────────────────────────
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Must contain a special character');

// ─── Username Validators ───────────────────────────────
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores')
  .transform((name) => name.toLowerCase().trim());

// ─── Short Code Validators ─────────────────────────────
export const shortCodeSchema = z.string()
  .min(3, 'Short code must be at least 3 characters')
  .max(20, 'Short code must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Only letters, numbers, hyphens, and underscores');

// ─── Pagination Validators ─────────────────────────────
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ─── ID Validators ─────────────────────────────────────
export const uuidSchema = z.string().uuid('Invalid ID format');

// ─── Amount Validators ─────────────────────────────────
export const amountSchema = z.number()
  .min(0.01, 'Amount must be at least $0.01')
  .max(5000, 'Amount must be at most $5,000')
  .refine(
    (amount) => Math.round(amount * 100) / 100 === amount,
    'Amount can have at most 2 decimal places'
  );

// ─── Date Validators ───────────────────────────────────
export const dateSchema = z.string().datetime('Invalid date format');

export const optionalDateSchema = z.string().datetime().optional().nullable();

// ─── Color Validators ──────────────────────────────────
export const hexColorSchema = z.string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex color');

// ─── Domain Validators ─────────────────────────────────
export const domainSchema = z.string()
  .min(4, 'Domain is too short')
  .max(253, 'Domain is too long')
  .regex(
    /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
    'Invalid domain format'
  );

// ─── Composite Schemas ─────────────────────────────────
export const registerSchema = z.object({
  email: emailSchema,
  username: usernameSchema,
  password: passwordSchema,
  referralCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export const createLinkSchema = z.object({
  originalUrl: urlSchema,
  shortCode: shortCodeSchema.optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  password: z.string().min(4).max(100).optional(),
  expiresAt: optionalDateSchema,
  maxClicks: z.number().int().min(1).optional(),
});
