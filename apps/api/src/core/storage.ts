/**
 * Storage Service (R2)
 * 
 * Gestion du stockage de fichiers via Cloudflare R2.
 * Pour les avatars, exports CSV, images Open Graph, etc.
 */

import { Logger } from './logger';

const logger = new Logger('StorageService');

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export class StorageService {
  private bucket: R2Bucket;
  private publicUrl: string;
  
  constructor(bucket: R2Bucket, publicUrl?: string) {
    this.bucket = bucket;
    this.publicUrl = publicUrl || '';
  }
  
  async upload(
    key: string,
    data: ArrayBuffer | Uint8Array | ReadableStream | string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    try {
      const r2Options: R2PutOptions = {
        httpMetadata: {
          contentType: options?.contentType || 'application/octet-stream',
          cacheControl: options?.cacheControl || 'public, max-age=31536000',
        },
        customMetadata: options?.metadata,
      };
      
      const obj = await this.bucket.put(key, data, r2Options);
      
      logger.info('File uploaded to R2', {
        key,
        size: obj?.size,
        contentType: options?.contentType,
      });
      
      return {
        key,
        url: this.getPublicUrl(key),
        size: obj?.size || 0,
        contentType: options?.contentType || 'application/octet-stream',
      };
    } catch (error) {
      logger.error('Failed to upload to R2', error, { key });
      throw new Error('Failed to upload file');
    }
  }
  
  async get(key: string): Promise<R2ObjectBody | null> {
    try {
      const obj = await this.bucket.get(key);
      
      if (!obj) {
        logger.debug('File not found in R2', { key });
        return null;
      }
      
      return obj;
    } catch (error) {
      logger.error('Failed to get file from R2', error, { key });
      return null;
    }
  }
  
  async delete(key: string): Promise<void> {
    try {
      await this.bucket.delete(key);
      logger.info('File deleted from R2', { key });
    } catch (error) {
      logger.error('Failed to delete file from R2', error, { key });
    }
  }
  
  async list(prefix?: string, limit = 100): Promise<string[]> {
    try {
      const options: R2ListOptions = { limit };
      if (prefix) options.prefix = prefix;
      
      const result = await this.bucket.list(options);
      return result.objects.map((obj) => obj.key);
    } catch (error) {
      logger.error('Failed to list files in R2', error);
      return [];
    }
  }
  
  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return key;
  }
  
  // ─── Convenience methods ─────────────────────────────
  
  async uploadAvatar(userId: string, data: ArrayBuffer, contentType: string): Promise<string> {
    const key = `avatars/${userId}.${this.getExtension(contentType)}`;
    const result = await this.upload(key, data, { contentType });
    return result.url;
  }
  
  async uploadExport(userId: string, data: string, filename: string): Promise<string> {
    const key = `exports/${userId}/${filename}`;
    const result = await this.upload(key, data, {
      contentType: 'text/csv',
      cacheControl: 'private, max-age=3600',
    });
    return result.url;
  }
  
  // ─── Helpers ─────────────────────────────────────────
  private getExtension(contentType: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    return map[contentType] || 'bin';
  }
}

// Singleton
let storageServiceInstance: StorageService | null = null;

export function getStorageService(bucket?: R2Bucket, publicUrl?: string): StorageService {
  if (!storageServiceInstance && bucket) {
    storageServiceInstance = new StorageService(bucket, publicUrl);
  }
  if (!storageServiceInstance) {
    throw new Error('StorageService not initialized. Provide bucket on first call.');
  }
  return storageServiceInstance;
}
