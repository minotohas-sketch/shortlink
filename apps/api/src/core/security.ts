import { Environment } from './env';
import { Logger } from './logger';

const logger = new Logger('Security');

export class SecurityService {
  private encoder: TextEncoder;
  private decoder: TextDecoder;
  
  constructor() {
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }
  
  async encrypt(text: string): Promise<string> {
    try {
      const key = await this.getKey();
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encoded = this.encoder.encode(text);
      const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
      const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }
  
  async decrypt(encryptedText: string): Promise<string> {
    try {
      const key = await this.getKey();
      const combined = Uint8Array.from(atob(encryptedText), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const data = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return this.decoder.decode(decrypted);
    } catch (error) {
      logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }
  
  async hash(text: string): Promise<string> {
    const encoded = this.encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async hashWithSalt(text: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const actualSalt = salt || this.generateSalt(32);
    const hash = await this.hashPassword(text, actualSalt);
    return { hash, salt: actualSalt };
  }
  
  async hashPassword(password: string, salt: string): Promise<string> {
    const key = await crypto.subtle.importKey('raw', this.encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: this.encoder.encode(salt), iterations: 600000, hash: 'SHA-256' },
      key, 256
    );
    return Array.from(new Uint8Array(derived)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  async verifyPassword(password: string, storedHash: string, storedSalt: string): Promise<boolean> {
    const hash = await this.hashPassword(password, storedSalt);
    return this.timingSafeEqual(hash, storedHash);
  }
  
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    const bufA = this.encoder.encode(a);
    const bufB = this.encoder.encode(b);
    for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
    return result === 0;
  }
  
  generateSalt(length = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  }
  
  generateToken(length = 64): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '').substring(0, length);
  }
  
  generateId(): string {
    return crypto.randomUUID();
  }
  
  generateShortCode(length?: number): string {
    const actualLength = length || Environment.get().SHORT_CODE_LENGTH;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.getRandomValues(new Uint8Array(actualLength));
    return Array.from(bytes, b => chars[b % chars.length]).join('');
  }
  
  async signJWT(payload: Record<string, unknown>, expiresIn?: string): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = expiresIn ? this.parseExpiry(expiresIn) : undefined;
    const fullPayload = { ...payload, iat: now, ...(exp ? { exp: now + exp } : {}) };
    const headerB64 = this.base64UrlEncode(JSON.stringify(header));
    const payloadB64 = this.base64UrlEncode(JSON.stringify(fullPayload));
    const signature = await this.hmacSign(`${headerB64}.${payloadB64}`);
    return `${headerB64}.${payloadB64}.${signature}`;
  }
  
  async verifyJWT(token: string): Promise<Record<string, unknown> | null> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const [headerB64, payloadB64, signature] = parts!;
      const expectedSig = await this.hmacSign(`${headerB64}.${payloadB64}`);
      if (signature !== expectedSig) return null;
      const payload = JSON.parse(this.base64UrlDecode(payloadB64!));
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
      return payload;
    } catch { return null; }
  }
  
  generateCSRFToken(): string {
    return this.generateToken(32);
  }
  
  private async getKey(): Promise<CryptoKey> {
    const envKey = Environment.get().ENCRYPTION_KEY;
    const keyMaterial = this.encoder.encode(envKey);
    const hash = await crypto.subtle.digest('SHA-256', keyMaterial);
    return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }
  
  private async hmacSign(data: string): Promise<string> {
    const jwtSecret = Environment.get().JWT_SECRET;
    const key = await crypto.subtle.importKey('raw', this.encoder.encode(jwtSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', key, this.encoder.encode(data));
    return this.base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  private base64UrlEncode(data: string): string {
    return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }
  
  private base64UrlDecode(data: string): string {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  }
  
  private parseExpiry(expiresIn: string): number {
    const match = (expiresIn || "15m").match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 900;
    const value = parseInt(match[1] || "0");
    const unit = match[2] || "s";
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}

let securityInstance: SecurityService | null = null;

export function getSecurityService(): SecurityService {
  if (!securityInstance) securityInstance = new SecurityService();
  return securityInstance;
}
