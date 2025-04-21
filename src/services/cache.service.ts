import Redis from 'ioredis';
import { promisify } from 'util';
import { logger } from '../utils/logger';

/**
 * Cache configuration options
 */
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  ttl: number; // Time to live in seconds
  enabled: boolean;
}

/**
 * Service for document processing cache
 */
export class CacheService {
  private client: Redis;
  private defaultTtl: number;
  private enabled: boolean;

  constructor() {
    const config: CacheConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      ttl: parseInt(process.env.REDIS_CACHE_TTL || '86400', 10), // Default: 1 day
      enabled: process.env.CACHE_ENABLED === 'true'
    };

    this.defaultTtl = config.ttl;
    this.enabled = config.enabled;

    // Initialize Redis client
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password,
      lazyConnect: !this.enabled
    });

    if (!this.enabled) {
      logger.warn('Document caching is disabled. Set CACHE_ENABLED=true to enable it');
      return;
    }

    try {
      this.client.on('connect', () => {
        logger.info('Connected to Redis server for document caching');
      });

      this.client.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });
    } catch (error) {
      logger.error('Failed to initialize Redis client:', error);
      this.enabled = false;
    }
  }

  /**
   * Generate a cache key from document identifiers
   * @param documentId Document ID
   * @param userId User ID (optional)
   * @returns Formatted cache key
   */
  generateCacheKey(documentId: string, userId?: string): string {
    if (userId) {
      return `doc:${documentId}:user:${userId}`;
    }
    return `doc:${documentId}`;
  }

  /**
   * Generate a hash key for document contents 
   * @param fileBuffer The file buffer to hash
   * @returns Hash of the file contents
   */
  generateContentHash(fileBuffer: Buffer): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in seconds
   * @returns Promise resolving to success
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const serializedValue = JSON.stringify(value);
      const expiry = ttl || this.defaultTtl;
      
      await this.client.set(key, serializedValue, 'EX', expiry);
      return true;
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Promise resolving to the cached value or null
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const result = await this.client.get(key);
      if (!result) return null;
      
      return JSON.parse(result) as T;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   * @returns Promise resolving to success
   */
  async delete(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern Key pattern to match (e.g., "doc:*")
   * @returns Promise resolving to number of keys deleted
   */
  async deleteByPattern(pattern: string): Promise<number> {
    if (!this.enabled) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      
      const result = await this.client.del(...keys);
      return result;
    } catch (error) {
      logger.error(`Error deleting cache by pattern ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns Promise resolving to existence
   */
  async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Error checking existence for key ${key}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const cacheService = new CacheService(); 