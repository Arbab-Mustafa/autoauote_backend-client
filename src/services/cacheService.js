require("dotenv").config();
const logger = require("../logger");
const redis = require("redis");
const { redisConfig } = require("../config");

/**
 * Cache service for storing and retrieving data
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.initialize();
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    try {
      this.client = redis.createClient({
        url: `redis://${redisConfig.host}:${redisConfig.port}`,
        password: redisConfig.password || undefined,
      });

      this.client.on("error", (err) => {
        // Only log once when Redis connection fails
        if (this.isConnected) {
          logger.warn("Redis connection lost, falling back to memory cache");
          this.isConnected = false;
        }
      });

      this.client.on("connect", () => {
        logger.info("Connected to Redis");
        this.isConnected = true;
      });

      await this.client.connect();
    } catch (error) {
      logger.warn("Redis not available, using in-memory cache");
      // Fallback to in-memory cache if Redis is not available
      this.memoryCache = new Map();
      this.isConnected = false;
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<string|null>} - Cached value or null if not found
   */
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        return await this.client.get(key);
      } else if (this.memoryCache) {
        return this.memoryCache.get(key) || null;
      }
      return null;
    } catch (error) {
      // Silent fallback to memory cache
      if (this.memoryCache) {
        return this.memoryCache.get(key) || null;
      }
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {string} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} - Success status
   */
  async set(key, value, ttl = redisConfig.ttl) {
    try {
      if (this.isConnected && this.client) {
        await this.client.set(key, value, { EX: ttl });
      } else if (this.memoryCache) {
        this.memoryCache.set(key, value);
        // Simple TTL for memory cache
        setTimeout(() => {
          this.memoryCache.delete(key);
        }, ttl * 1000);
      }
      return true;
    } catch (error) {
      // Silent fallback to memory cache
      if (this.memoryCache) {
        this.memoryCache.set(key, value);
        setTimeout(() => {
          this.memoryCache.delete(key);
        }, ttl * 1000);
        return true;
      }
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} - Success status
   */
  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else if (this.memoryCache) {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      // Silent fallback to memory cache
      if (this.memoryCache) {
        this.memoryCache.delete(key);
        return true;
      }
      return false;
    }
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} - Success status
   */
  async clear() {
    try {
      if (this.isConnected && this.client) {
        await this.client.flushAll();
      } else if (this.memoryCache) {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      // Silent fallback to memory cache
      if (this.memoryCache) {
        this.memoryCache.clear();
        return true;
      }
      return false;
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

module.exports = { cacheService };
