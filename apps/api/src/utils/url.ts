import { Environment } from '../core/env';
import { BadRequestError } from './errors';

// ─── URL Validation ────────────────────────────────────
const DANGEROUS_TLDS = new Set([
  'localhost', 'local', 'internal', 'test',
]);

const BLOCKED_DOMAINS = new Set([
  '127.0.0.1', '0.0.0.0', '[::1]',
]);

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

export function parseUrl(url: string): URL {
  try {
    return new URL(url);
  } catch {
    throw new BadRequestError('Invalid URL format', 'INVALID_URL');
  }
}

export function validateAndSanitizeUrl(input: string): string {
  // Ajouter https:// si pas de protocole
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  
  const parsed = parseUrl(url);
  
  // Vérifier le protocole
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new BadRequestError(
      'Only HTTP and HTTPS URLs are allowed',
      'INVALID_PROTOCOL'
    );
  }
  
  // Vérifier le hostname
  const hostname = parsed.hostname.toLowerCase();
  
  if (BLOCKED_DOMAINS.has(hostname)) {
    throw new BadRequestError('This URL is not allowed', 'BLOCKED_URL');
  }
  
  // Vérifier les TLDs dangereux
  const tld = hostname.split('.').pop();
  if (tld && DANGEROUS_TLDS.has(tld)) {
    throw new BadRequestError('This URL is not allowed', 'BLOCKED_URL');
  }
  
  // BUG FIX: checkUrlSafety() existait déjà plus bas dans ce fichier (bloque
  // 127.x/192.168.x/10.x/172.16.x et *.local/*.internal) mais n'était jamais
  // appelée ici. BLOCKED_DOMAINS ci-dessus ne couvre que 3 adresses littérales
  // ('127.0.0.1', '0.0.0.0', '[::1]') : sans cet appel, un lien pouvait être
  // créé vers une IP privée (ex. http://192.168.1.1/admin).
  const safety = checkUrlSafety(parsed.toString());
  if (!safety.safe) {
    throw new BadRequestError(safety.reason || 'This URL is not allowed', 'BLOCKED_URL');
  }
  
  // Vérifier la longueur maximale
  if (url.length > 2048) {
    throw new BadRequestError('URL is too long (max 2048 characters)', 'URL_TOO_LONG');
  }
  
  return parsed.toString();
}

// ─── Short Code Generation ─────────────────────────────
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function generateShortCode(length?: number): string {
  const actualLength = length || Environment.get().SHORT_CODE_LENGTH;
  const bytes = crypto.getRandomValues(new Uint8Array(actualLength));
  return Array.from(bytes, b => CHARSET[b % CHARSET.length]).join('');
}

export function isValidShortCode(code: string): boolean {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(code);
}

export function sanitizeShortCode(code: string): string {
  return code.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
}

// ─── Short URL Builder ─────────────────────────────────
export function buildShortUrl(code: string, domain?: string): string {
  const base = domain 
    ? `https://${domain}`
    : Environment.get().APP_URL;
  
  return `${base}/go/${code}`;
}

// ─── UTM Parameters ────────────────────────────────────
export function parseUtmParams(url: string): Record<string, string> {
  try {
    const parsed = new URL(url);
    const utm: Record<string, string> = {};
    
    for (const [key, value] of parsed.searchParams.entries()) {
      if (key.startsWith('utm_')) {
        utm[key] = value;
      }
    }
    
    return utm;
  } catch {
    return {};
  }
}

// ─── Referrer Extraction ───────────────────────────────
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname;
  } catch {
    return 'unknown';
  }
}

// ─── URL Normalization ─────────────────────────────────
export function normalizeUrl(url: string): string {
  const parsed = parseUrl(url);
  
  // Normaliser: minuscules pour le hostname
  parsed.hostname = parsed.hostname.toLowerCase();
  
  // Supprimer le port par défaut
  if (
    (parsed.protocol === 'https:' && parsed.port === '443') ||
    (parsed.protocol === 'http:' && parsed.port === '80')
  ) {
    parsed.port = '';
  }
  
  // Supprimer le fragment (hash) pour la comparaison
  parsed.hash = '';
  
  // Trier les query params
  parsed.searchParams.sort();
  
  return parsed.toString();
}

// ─── URL Safety Checks ─────────────────────────────────
export interface UrlSafetyResult {
  safe: boolean;
  reason?: string;
}

export function checkUrlSafety(url: string): UrlSafetyResult {
  try {
    const parsed = new URL(url);
    
    // Bloquer les IPs privées
    if (
      parsed.hostname.startsWith('127.') ||
      parsed.hostname.startsWith('192.168.') ||
      parsed.hostname.startsWith('10.') ||
      parsed.hostname.startsWith('172.16.')
    ) {
      return { safe: false, reason: 'Private IP addresses are not allowed' };
    }
    
    // Bloquer les domaines locaux
    if (
      parsed.hostname === 'localhost' ||
      parsed.hostname.endsWith('.local') ||
      parsed.hostname.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Local domains are not allowed' };
    }
    
    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL' };
  }
}

// ─── QR Code URL ───────────────────────────────────────
export function qrCodeUrl(data: string, size = 300): string {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`;
}
