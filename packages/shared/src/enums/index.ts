// ─── User ──────────────────────────────────────────────
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export enum AuthProvider {
  EMAIL = 'email',
  GOOGLE = 'google',
  GITHUB = 'github',
}

// ─── Link ──────────────────────────────────────────────
export enum LinkStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
  DELETED = 'deleted',
}

export enum LinkType {
  DIRECT = 'direct',
  CAMPAIGN = 'campaign',
  DYNAMIC = 'dynamic',
}

// ─── Earnings ──────────────────────────────────────────
export enum EarningsSource {
  CLICK = 'click',
  REFERRAL = 'referral',
  BONUS = 'bonus',
  ADJUSTMENT = 'adjustment',
}

export enum EarningsStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

// ─── Withdrawal ────────────────────────────────────────
export enum WithdrawalStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum WithdrawalMethod {
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  CRYPTO = 'crypto',
}

// ─── Notification ──────────────────────────────────────
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

// ─── Payment ───────────────────────────────────────────
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  REFUND = 'refund',
  PAYOUT = 'payout',
}

// ─── Ad ────────────────────────────────────────────────
export enum AdType {
  BANNER = 'banner',
  INTERSTITIAL = 'interstitial',
  POPUP = 'popup',
  NATIVE = 'native',
}

export enum AdStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ENDED = 'ended',
  REJECTED = 'rejected',
}

// ─── Domain ────────────────────────────────────────────
export enum DomainStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  FAILED = 'failed',
}

export enum VerificationMethod {
  DNS = 'dns',
  FILE = 'file',
}

// ─── Device ────────────────────────────────────────────
export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  UNKNOWN = 'unknown',
}

// ─── Referral ──────────────────────────────────────────
export enum ReferralStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  REWARDED = 'rewarded',
}
