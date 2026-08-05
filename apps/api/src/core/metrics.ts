/**
 * Metrics Service
 * 
 * Collecte et expose les métriques de l'application.
 * Pour les Workers, on utilise un stockage KV pour l'agrégation.
 */

import { Logger } from './logger';

const logger = new Logger('Metrics');

export interface MetricValue {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  values: number[];
}

export class MetricsService {
  private metrics: Map<string, number[]>;
  private counters: Map<string, number>;
  
  constructor() {
    this.metrics = new Map();
    this.counters = new Map();
  }
  
  // ─── Timer ───────────────────────────────────────────
  timing(name: string, durationMs: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(durationMs);
  }
  
  // ─── Counter ─────────────────────────────────────────
  increment(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + value);
  }
  
  decrement(name: string, value = 1): void {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, Math.max(0, current - value));
  }
  
  // ─── Gauge ───────────────────────────────────────────
  gauge(name: string, value: number): void {
    this.counters.set(name, value);
  }
  
  // ─── Histogram ───────────────────────────────────────
  histogram(name: string, value: number, buckets?: number[]): void {
    this.timing(name, value);
  }
  
  // ─── Get Metrics ─────────────────────────────────────
  getMetric(name: string): MetricValue | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count,
      sum,
      min: sorted[0]!,
      max: sorted[count - 1]!,
      avg: sum / count,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      values,
    };
  }
  
  getCounter(name: string): number {
    return this.counters.get(name) || 0;
  }
  
  getAllMetrics(): Record<string, MetricValue | number> {
    const result: Record<string, MetricValue | number> = {};
    
    for (const [name] of this.metrics) {
      const metric = this.getMetric(name);
      if (metric) result[name] = metric;
    }
    
    for (const [name, value] of this.counters) {
      result[name] = value;
    }
    
    return result;
  }
  
  // ─── HTTP Metrics ────────────────────────────────────
  recordRequest(method: string, path: string, statusCode: number, durationMs: number): void {
    this.increment('http.requests.total');
    this.increment(`http.requests.${statusCode}`);
    this.timing('http.request.duration', durationMs);
    
    if (statusCode >= 400) {
      this.increment('http.requests.errors');
    }
  }
  
  // ─── Business Metrics ────────────────────────────────
  recordLinkCreated(): void {
    this.increment('links.created');
  }
  
  recordClick(country?: string): void {
    this.increment('clicks.total');
    if (country) {
      this.increment(`clicks.country.${country.toLowerCase()}`);
    }
  }
  
  recordEarning(amount: number): void {
    this.increment('earnings.count');
    this.timing('earnings.amount', amount);
  }
  
  recordWithdrawal(amount: number): void {
    this.increment('withdrawals.count');
    this.timing('withdrawals.amount', amount);
  }
  
  // ─── Helpers ─────────────────────────────────────────
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))]!;
  }
  
  // ─── Reset ───────────────────────────────────────────
  reset(): void {
    this.metrics.clear();
    this.counters.clear();
  }
}

// Singleton
let metricsInstance: MetricsService | null = null;

export function getMetricsService(): MetricsService {
  if (!metricsInstance) {
    metricsInstance = new MetricsService();
  }
  return metricsInstance;
}
