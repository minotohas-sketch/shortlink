import type { Context } from 'hono';
import { Logger } from '../core/logger';

const logger = new Logger('Geo');

// ─── Types ─────────────────────────────────────────────
export interface GeoInfo {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  continent: string;
}

export interface DeviceInfo {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
}

// ─── CPM Tiers ─────────────────────────────────────────
const CPM_TIERS: Record<string, number> = {
  // Tier 1 — Pays premium ($4.00 CPM)
  US: 1, GB: 1, CA: 1, AU: 1, NZ: 1, IE: 1,
  DE: 1, FR: 1, NL: 1, BE: 1, LU: 1, CH: 1,
  AT: 1, DK: 1, NO: 1, SE: 1, FI: 1, IS: 1,
  
  // Tier 2 — Pays intermédiaires ($2.00 CPM)
  ES: 2, IT: 2, PT: 2, GR: 2, CY: 2, MT: 2,
  CZ: 2, SK: 2, PL: 2, HU: 2, RO: 2, BG: 2,
  HR: 2, SI: 2, EE: 2, LV: 2, LT: 2,
  JP: 2, KR: 2, SG: 2, HK: 2, TW: 2,
  AE: 2, QA: 2, KW: 2, SA: 2, IL: 2,
  
  // Tier 3 — Pays émergents ($0.50 CPM)
  BR: 3, MX: 3, AR: 3, CL: 3, CO: 3, PE: 3,
  IN: 3, ID: 3, PH: 3, VN: 3, TH: 3, MY: 3,
  ZA: 3, TR: 3, EG: 3, NG: 3, KE: 3,
  
  // Tier 4 — Reste du monde ($0.10 CPM)
  // Tout ce qui n'est pas listé ci-dessus
};

// ─── Extract Geo from Cloudflare Headers ───────────────
export function getGeoInfo(c: Context): GeoInfo {
  const cf = (c.req.raw as any).cf || {};
  
  return {
    country: cf.country || 'Unknown',
    countryCode: cf.country || 'XX',
    region: cf.region || '',
    city: cf.city || '',
    latitude: parseFloat(cf.latitude) || 0,
    longitude: parseFloat(cf.longitude) || 0,
    timezone: cf.timezone || 'UTC',
    continent: cf.continent || 'Unknown',
  };
}

// ─── Extract Device Info from User-Agent ───────────────
export function getDeviceInfo(userAgent?: string): DeviceInfo {
  if (!userAgent) {
    return {
      browser: 'Unknown',
      browserVersion: '',
      os: 'Unknown',
      osVersion: '',
      device: 'Unknown',
      deviceType: 'unknown',
    };
  }
  
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let osVersion = '';
  let device = 'Unknown';
  let deviceType: DeviceInfo['deviceType'] = 'unknown';
  
  // Détection du navigateur
  if (ua.includes('firefox/')) {
    browser = 'Firefox';
    browserVersion = ua.match(/firefox\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('edg/')) {
    browser = 'Edge';
    browserVersion = ua.match(/edg\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    browser = 'Chrome';
    browserVersion = ua.match(/chrome\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    browser = 'Safari';
    browserVersion = ua.match(/version\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:opera|opr)\/([\d.]+)/)?.[1] || '';
  }
  
  // Détection de l'OS
  if (ua.includes('windows nt 10')) {
    os = 'Windows 10/11';
    osVersion = '10/11';
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows 8.1';
    osVersion = '8.1';
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows 7';
    osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    osVersion = ua.match(/mac os x ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.includes('android')) {
    os = 'Android';
    osVersion = ua.match(/android ([\d.]+)/)?.[1] || '';
  } else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    osVersion = ua.match(/os ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }
  
  // Détection du type d'appareil
  if (ua.includes('mobile') || ua.includes('android')) {
    deviceType = 'mobile';
    if (ua.includes('android')) device = 'Android Phone';
    else if (ua.includes('iphone')) device = 'iPhone';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
    if (ua.includes('ipad')) device = 'iPad';
    else device = 'Tablet';
  } else {
    deviceType = 'desktop';
    device = 'Desktop';
  }
  
  return { browser, browserVersion, os, osVersion, device, deviceType };
}

// ─── Get CPM Tier ──────────────────────────────────────
export function getCpmTier(countryCode: string): number {
  return CPM_TIERS[countryCode?.toUpperCase()] || 4;
}

export function getCpmRate(countryCode: string, rates?: Record<number, number>): number {
  const tier = getCpmTier(countryCode);
  
  const defaultRates: Record<number, number> = {
    1: 4.0,
    2: 2.0,
    3: 0.5,
    4: 0.1,
  };
  
  const rateTable = rates || defaultRates;
  return rateTable[tier] || rateTable[4] || 0.1;
}

// ─── IP Utilities ──────────────────────────────────────
export function getClientIP(c: Context): string {
  return c.req.header('CF-Connecting-IP') 
    || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim()
    || c.req.header('X-Real-IP')
    || '127.0.0.1';
}

export function isEUCountry(countryCode: string): boolean {
  const euCountries = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ]);
  
  return euCountries.has(countryCode.toUpperCase());
}
