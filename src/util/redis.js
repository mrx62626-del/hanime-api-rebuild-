// ─── IORedis Client ───────────────────────────────────────────────────────────
// Gracefully degrades: if REDIS_URL is not set, all cache calls are no-ops.

import Redis from "ioredis";
import { logger } from "./logger.js";

let redis = null;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      password:           process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 2,
      connectTimeout:     5000,
      lazyConnect:        true,
      enableReadyCheck:   true,
    });

    redis.on("connect",   ()    => logger.info("Redis connected"));
    redis.on("ready",     ()    => logger.info("Redis ready"));
    redis.on("error",     (err) => logger.warn({ err }, "Redis error — cache disabled"));
    redis.on("close",     ()    => logger.warn("Redis connection closed"));

    await redis.connect();
  } catch (err) {
    logger.warn({ err }, "Redis init failed — running without cache");
    redis = null;
  }
} else {
  logger.info("REDIS_URL not set — running without cache");
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

/**
 * Get a cached value (returns null on miss or when Redis unavailable).
 * @param {string} key
 * @returns {Promise<string|null>}
 */
export async function cacheGet(key) {
  if (!redis) return null;
  try {
    return await redis.get(key);
  } catch (err) {
    logger.warn({ err, key }, "Redis GET failed");
    return null;
  }
}

/**
 * Set a cached value with a TTL in seconds.
 * @param {string} key
 * @param {string} value
 * @param {number} ttlSeconds
 */
export async function cacheSet(key, value, ttlSeconds) {
  if (!redis || ttlSeconds <= 0) return;
  try {
    await redis.set(key, value, "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ err, key }, "Redis SET failed");
  }
}

/**
 * Delete a cached key.
 * @param {string} key
 */
export async function cacheDel(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    logger.warn({ err, key }, "Redis DEL failed");
  }
}

export { redis };
export default redis;
