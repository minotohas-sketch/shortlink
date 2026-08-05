// ─── User Types ────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl: string | null;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'user' | 'admin' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'banned';

// ─── Link Types ────────────────────────────────────────
export interface Link {
  id: string;
  userId: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  status: LinkStatus;
  expiresAt: string | null;
  maxClicks: number | null;
  currentClicks: number;
  createdAt: string;
}

export type LinkStatus = 'active' | 'inactive' | 'expired' | 'deleted';

// ─── Click Types ───────────────────────────────────────
export interface ClickInfo {
  country: string;
  countryCode: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  referrer: string | null;
}

// ─── Earnings Types ────────────────────────────────────
export interface EarningsEntry {
  id: string;
  amount: number;
  source: EarningsSource;
  description: string | null;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

export type EarningsSource = 'click' | 'referral' | 'bonus' | 'adjustment';

export interface Balance {
  available: number;
  pending: number;
  lifetime: number;
  withdrawn: number;
}

// ─── Withdrawal Types ──────────────────────────────────
export interface Withdrawal {
  id: string;
  amount: number;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  fee: number;
  netAmount: number;
  createdAt: string;
}

export type WithdrawalMethod = 'paypal' | 'bank_transfer' | 'crypto';
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'rejected' | 'cancelled';

// ─── Referral Types ────────────────────────────────────
export interface Referral {
  id: string;
  referredUserId: string;
  referredEmail: string;
  referredUsername: string;
  status: 'pending' | 'active' | 'inactive' | 'rewarded';
  totalCommission: number;
  createdAt: string;
}

// ─── API Response Types ────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ─── Auth Types ────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  referralCode?: string;
}

// ─── Analytics Types ───────────────────────────────────
export interface ClickStats {
  totalClicks: number;
  uniqueClicks: number;
  clicksByCountry: Record<string, number>;
  clicksByDevice: Record<string, number>;
  clicksByBrowser: Record<string, number>;
  clicksByDate: Record<string, number>;
}

export interface EarningsSummary {
  period: string;
  totalEarnings: number;
  earningsBySource: Record<string, number>;
  earningsByDate: Record<string, number>;
}

// ─── Dashboard Types ───────────────────────────────────
export interface UserDashboard {
  user: User;
  stats: {
    totalLinks: number;
    totalClicks: number;
    totalEarnings: number;
    pendingWithdrawals: number;
  };
  recentLinks: Link[];
  recentEarnings: EarningsEntry[];
}

// ─── Notification Types ────────────────────────────────
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

// ─── Domain Types ──────────────────────────────────────
export interface CustomDomain {
  id: string;
  domain: string;
  verified: boolean;
  status: 'active' | 'pending' | 'failed';
  createdAt: string;
}

// ─── API Key Types ─────────────────────────────────────
export interface ApiKeyInfo {
  id: string;
  name: string;
  key: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}
