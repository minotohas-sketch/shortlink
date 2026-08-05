/**
 * Click Tracker
 * 
 * Enregistre les informations de clic et les envoie à la queue d'analytics.
 */

export interface ClickEvent {
  linkId: string;
  shortCode: string;
  timestamp: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  continent: string;
  latitude: number;
  longitude: number;
  timezone: string;
  device: string;
  deviceType: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  referrer: string;
  referrerDomain: string;
  userAgent: string;
  language: string;
  screenResolution: string;
  isUnique: boolean;
  cpmRate: number;
  earnings: number;
}

export function extractClickData(request: Request, linkId: string, shortCode: string): ClickEvent {
  const cf = (request as any).cf || {};
  const userAgent = request.headers.get('User-Agent') || '';
  const referrer = request.headers.get('Referer') || '';
  const language = request.headers.get('Accept-Language')?.split(',')[0] || '';
  
  // Extraire le domaine du referrer
  let referrerDomain = '';
  try {
    if (referrer) {
      referrerDomain = new URL(referrer).hostname;
    }
  } catch {}
  
  // Parser le User-Agent
  const device = parseUserAgent(userAgent);
  
  // Calculer le CPM rate basé sur le pays
  const cpmRate = getCpmRate(cf.country || 'XX');
  const earnings = cpmRate / 1000;
  
  // Générer un hash unique
  const uniqueHash = generateUniqueHash(
    request.headers.get('CF-Connecting-IP') || '',
    userAgent,
    linkId
  );
  
  return {
    linkId,
    shortCode,
    timestamp: new Date().toISOString(),
    ip: request.headers.get('CF-Connecting-IP') || '',
    country: cf.country || 'Unknown',
    countryCode: cf.country || 'XX',
    city: cf.city || '',
    region: cf.region || '',
    continent: cf.continent || '',
    latitude: parseFloat(cf.latitude) || 0,
    longitude: parseFloat(cf.longitude) || 0,
    timezone: cf.timezone || 'UTC',
    device: device.device,
    deviceType: device.deviceType,
    browser: device.browser,
    browserVersion: device.browserVersion,
    os: device.os,
    osVersion: device.osVersion,
    referrer: referrer.substring(0, 2048),
    referrerDomain,
    userAgent: userAgent.substring(0, 500),
    language,
    screenResolution: '',
    isUnique: false, // Sera déterminé par le worker d'analytics
    cpmRate,
    earnings,
  };
}

function parseUserAgent(ua: string): {
  device: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
} {
  const uaLower = ua.toLowerCase();
  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let osVersion = '';
  let device = 'Unknown';
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  
  // Browser detection
  if (uaLower.includes('firefox/')) {
    browser = 'Firefox';
    browserVersion = uaLower.match(/firefox\/([\d.]+)/)?.[1] || '';
  } else if (uaLower.includes('edg/')) {
    browser = 'Edge';
    browserVersion = uaLower.match(/edg\/([\d.]+)/)?.[1] || '';
  } else if (uaLower.includes('chrome/')) {
    browser = 'Chrome';
    browserVersion = uaLower.match(/chrome\/([\d.]+)/)?.[1] || '';
  } else if (uaLower.includes('safari/')) {
    browser = 'Safari';
    browserVersion = uaLower.match(/version\/([\d.]+)/)?.[1] || '';
  }
  
  // OS detection
  if (uaLower.includes('windows')) {
    os = 'Windows';
  } else if (uaLower.includes('mac os x')) {
    os = 'macOS';
  } else if (uaLower.includes('android')) {
    os = 'Android';
    osVersion = uaLower.match(/android ([\d.]+)/)?.[1] || '';
  } else if (uaLower.includes('ios')) {
    os = 'iOS';
  } else if (uaLower.includes('linux')) {
    os = 'Linux';
  }
  
  // Device type detection
  if (uaLower.includes('mobile') || uaLower.includes('android')) {
    deviceType = 'mobile';
    device = uaLower.includes('iphone') ? 'iPhone' : 'Android Phone';
  } else if (uaLower.includes('tablet') || uaLower.includes('ipad')) {
    deviceType = 'tablet';
    device = uaLower.includes('ipad') ? 'iPad' : 'Tablet';
  } else {
    deviceType = 'desktop';
    device = 'Desktop';
  }
  
  return { device, deviceType, browser, browserVersion, os, osVersion };
}

function getCpmRate(countryCode: string): number {
  const tier1 = ['US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'DE', 'FR', 'NL', 'BE', 'LU', 'CH', 'AT', 'DK', 'NO', 'SE', 'FI', 'IS'];
  const tier2 = ['ES', 'IT', 'PT', 'GR', 'CY', 'MT', 'CZ', 'SK', 'PL', 'HU', 'RO', 'BG', 'HR', 'SI', 'EE', 'LV', 'LT', 'JP', 'KR', 'SG', 'HK', 'TW', 'AE', 'QA', 'KW', 'SA', 'IL'];
  const tier3 = ['BR', 'MX', 'AR', 'CL', 'CO', 'PE', 'IN', 'ID', 'PH', 'VN', 'TH', 'MY', 'ZA', 'TR', 'EG', 'NG', 'KE'];
  
  if (tier1.includes(countryCode)) return 4.0;
  if (tier2.includes(countryCode)) return 2.0;
  if (tier3.includes(countryCode)) return 0.5;
  return 0.1;
}

function generateUniqueHash(ip: string, userAgent: string, linkId: string): string {
  const data = `${ip}|${userAgent}|${linkId}|${new Date().toISOString().split('T')[0]}`;
  // Simple hash function (pas besoin de crypto pour un hash non-sécurisé)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
