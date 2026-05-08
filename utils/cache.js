// utils/cache.js
// ─── Simple in-memory TTL cache ───────────────────────────────────────────────
// Works on every runtime (Node / Vercel serverless / edge).
// Each entry stores the value + the absolute expiry timestamp.
// A periodic sweep removes stale entries so memory doesn't grow unbounded.

const store = new Map(); // key → { value, expiresAt }

// ─── TTL presets (seconds) ────────────────────────────────────────────────────
export const TTL = {
  HOME:     5  * 60,   //   5 min  – home / index pages change often
  SEARCH:   3  * 60,   //   3 min  – search results
  BROWSE:   5  * 60,   //   5 min  – browse / filter lists
  ANIME:    60 * 60,   //   1 hr   – anime detail (very stable)
  EPISODES: 30 * 60,   //  30 min  – episode list
  EPISODE:  30 * 60,   //  30 min  – single episode / sources
  GENRE:    10 * 60,   //  10 min  – genre / category / type pages
  AZLIST:   60 * 60,   //   1 hr   – A-Z list
  NAV:      60 * 60,   //   1 hr   – nav menu (rarely changes)
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

/**
 * Return the cached value for `key`, or undefined if absent / expired.
 * @param {string} key
 * @returns {*}
 */
export function cacheGet(key) {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

/**
 * Store `value` under `key` with a TTL in seconds.
 * @param {string} key
 * @param {*}      value
 * @param {number} ttlSeconds
 */
export function cacheSet(key, value, ttlSeconds) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/**
 * Delete a specific key (useful for manual invalidation).
 * @param {string} key
 */
export function cacheDel(key) {
  store.delete(key);
}

/**
 * Remove all entries whose TTL has expired.
 * Called automatically on a fixed interval, but also exported if you
 * want to trigger it manually.
 */
export function cachePurge() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now > v.expiresAt) store.delete(k);
  }
}

// Auto-purge every 10 minutes so the Map never grows stale forever.
// `unref()` ensures the timer doesn't keep the process alive on exit.
const purgeTimer = setInterval(cachePurge, 10 * 60 * 1000);
if (purgeTimer.unref) purgeTimer.unref();

// ─── Route helper ─────────────────────────────────────────────────────────────

/**
 * Cache-aware wrapper for Hono route handlers.
 *
 * Usage:
 *   return withCache(c, TTL.ANIME, () => provider.anime.getById(id));
 *
 * • Skips the cache when ?nocache=1 is in the query string.
 * • Sets X-Cache: HIT | MISS and X-Cache-TTL on the response.
 * • On a HIT the data object gets a `_cached: true` flag.
 * • On error the result is NOT cached so the next request tries fresh.
 *
 * @param {import('hono').Context} c          Hono context
 * @param {number}                 ttlSeconds Cache lifetime
 * @param {() => Promise<*>}       fn         Async function that fetches data
 * @returns {Promise<Response>}
 */
export async function withCache(c, ttlSeconds, fn) {
  // Allow callers to bypass cache for debugging.
  const bypass = c.req.query('nocache') === '1';
  const key = c.req.url; // full URL including query string → natural cache key

  if (!bypass) {
    const hit = cacheGet(key);
    if (hit !== undefined) {
      c.header('X-Cache', 'HIT');
      c.header('X-Cache-TTL', String(ttlSeconds));
      return c.json({ success: true, data: { ...hit, _cached: true } });
    }
  }

  // Cache miss – run the real fetch.
  c.header('X-Cache', 'MISS');
  c.header('X-Cache-TTL', String(ttlSeconds));

  const data = await fn(); // throws on error → caller's try/catch handles it
  if (!bypass) cacheSet(key, data, ttlSeconds);
  return c.json({ success: true, data });
}

// ─── Stats (optional, useful for a /cache/stats endpoint) ────────────────────

/** Return basic statistics about the current cache state. */
export function cacheStats() {
  const now = Date.now();
  let alive = 0;
  let expired = 0;
  for (const v of store.values()) {
    now > v.expiresAt ? expired++ : alive++;
  }
  return { totalKeys: store.size, aliveKeys: alive, expiredKeys: expired };
}
