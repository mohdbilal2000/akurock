/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance deployment (Hostinger shared hosting).
 * No Redis or external dependency required.
 */

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, TokenBucket>();

const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const expiry = now - 120_000; // Remove entries older than 2 minutes
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < expiry) {
      buckets.delete(key);
    }
  }
}

export function rateLimit(
  identifier: string,
  options: { maxRequests?: number; windowMs?: number } = {}
): { success: boolean; remaining: number } {
  const { maxRequests = 10, windowMs = 60_000 } = options;
  cleanup();

  const now = Date.now();
  const bucket = buckets.get(identifier);

  if (!bucket) {
    buckets.set(identifier, { tokens: maxRequests - 1, lastRefill: now });
    return { success: true, remaining: maxRequests - 1 };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor((elapsed / windowMs) * maxRequests);
  if (refill > 0) {
    bucket.tokens = Math.min(maxRequests, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return { success: false, remaining: 0 };
  }

  bucket.tokens--;
  return { success: true, remaining: bucket.tokens };
}

/**
 * Extract client IP from request headers.
 * Works with proxied requests (X-Forwarded-For, X-Real-IP).
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
