/**
 * Utilitaires de date/time
 * Gestion des timezones, formats, périodes
 */

// ─── Constants ─────────────────────────────────────────
export const ONE_SECOND_MS = 1000;
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS;
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;
export const ONE_WEEK_MS = 7 * ONE_DAY_MS;
export const ONE_MONTH_MS = 30 * ONE_DAY_MS;
export const ONE_YEAR_MS = 365 * ONE_DAY_MS;

// ─── Current Time ──────────────────────────────────────
export function now(): Date {
  return new Date();
}

export function nowISO(): string {
  return new Date().toISOString();
}

export function nowTimestamp(): number {
  return Date.now();
}

export function nowUnix(): number {
  return Math.floor(Date.now() / 1000);
}

// ─── Date Creation ─────────────────────────────────────
export function fromUnix(timestamp: number): Date {
  return new Date(timestamp * 1000);
}

export function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

// ─── Date Manipulation ─────────────────────────────────
export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * ONE_SECOND_MS);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * ONE_MINUTE_MS);
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * ONE_HOUR_MS);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * ONE_DAY_MS);
}

export function addWeeks(date: Date, weeks: number): Date {
  return new Date(date.getTime() + weeks * ONE_WEEK_MS);
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

// ─── Start/End of Period ───────────────────────────────
export function startOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfWeek(date: Date = new Date()): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Lundi
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfWeek(date: Date = new Date()): Date {
  const result = startOfWeek(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfMonth(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfMonth(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

export function startOfYear(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(0, 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfYear(date: Date = new Date()): Date {
  const result = new Date(date);
  result.setMonth(11, 31);
  result.setHours(23, 59, 59, 999);
  return result;
}

// ─── Date Comparison ───────────────────────────────────
export function isBefore(date1: Date, date2: Date): boolean {
  return date1.getTime() < date2.getTime();
}

export function isAfter(date1: Date, date2: Date): boolean {
  return date1.getTime() > date2.getTime();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function isExpired(date: Date): boolean {
  return isBefore(date, new Date());
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isYesterday(date: Date): boolean {
  return isSameDay(date, addDays(new Date(), -1));
}

// ─── Date Difference ───────────────────────────────────
export function diffInSeconds(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / ONE_SECOND_MS;
}

export function diffInMinutes(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / ONE_MINUTE_MS;
}

export function diffInHours(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / ONE_HOUR_MS;
}

export function diffInDays(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / ONE_DAY_MS;
}

// ─── Formatting ────────────────────────────────────────
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function formatRelative(date: Date, base: Date = new Date()): string {
  const seconds = diffInSeconds(date, base);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// ─── Duration Parsing ──────────────────────────────────
export function parseDuration(duration: string): number {
  const durationStr = duration || '0s';
  const match = durationStr.match(/^(\d+)\s*(s|m|h|d|w|mo|y)$/i);
  if (!match) throw new Error(`Invalid duration: ${duration}`);
  
  const value = parseInt(match[1]);
  const unit = match[2] || "s".toLowerCase();
  
  const multipliers: Record<string, number> = {
    s: ONE_SECOND_MS,
    m: ONE_MINUTE_MS,
    h: ONE_HOUR_MS,
    d: ONE_DAY_MS,
    w: ONE_WEEK_MS,
    mo: ONE_MONTH_MS,
    y: ONE_YEAR_MS,
  };
  
  return value * multipliers[unit];
}

// ─── Date Range ────────────────────────────────────────
export interface DateRange {
  start: Date;
  end: Date;
}

export function getDateRange(period: 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'last7days' | 'last30days' | 'last90days'): DateRange {
  const now = new Date();
  
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      return { start: startOfDay(addDays(now, -1)), end: endOfDay(addDays(now, -1)) };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'year':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'last7days':
      return { start: startOfDay(addDays(now, -6)), end: endOfDay(now) };
    case 'last30days':
      return { start: startOfDay(addDays(now, -29)), end: endOfDay(now) };
    case 'last90days':
      return { start: startOfDay(addDays(now, -89)), end: endOfDay(now) };
  }
}
