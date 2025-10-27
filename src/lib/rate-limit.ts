import { NextRequest, NextResponse } from 'next/server';
import { sanitizeRateLimitKey } from './validation';

/**
 * ? Rate Limiting & Throttling Library
 * 
 * Provides rate limiting functionality to prevent abuse and DDoS attacks.
 * Uses in-memory storage for development and Redis for production.
 */

// ================================================================================
// IN-MEMORY RATE LIMITER (Development)
// ================================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now();
  const toDelete: string[] = [];
  
  inMemoryStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      toDelete.push(key);
    }
  });
  
  toDelete.forEach((key) => inMemoryStore.delete(key));
}, 60000); // Run every minute

// ================================================================================
// REDIS RATE LIMITER (Production)
// ================================================================================

let redisClient: any = null;

/**
 * Initialize Redis client for rate limiting
 */
async function getRedisClient() {
  if (redisClient) return redisClient;
  
  // Only use Redis in production
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    try {
      const { createClient } = await import('redis');
      redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      console.log('? Redis connected for rate limiting');
    } catch (error) {
      console.warn('?? Redis connection failed, falling back to in-memory rate limiting:', error);
    }
  }
  
  return redisClient;
}

// ================================================================================
// RATE LIMIT CONFIGURATIONS
// ================================================================================

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Error message to return when rate limit is exceeded
   */
  message?: string;
  
  /**
   * Whether to skip rate limiting for certain conditions
   */
  skip?: (req: NextRequest) => boolean;
  
  /**
   * Custom key generator
   */
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  /**
   * Strict: 10 requests per minute
   */
  strict: {
    maxRequests: 10,
    windowMs: 60 * 1000,
    message: 'Too many requests, please try again later.',
  } as RateLimitConfig,
  
  /**
   * Moderate: 30 requests per minute
   */
  moderate: {
    maxRequests: 30,
    windowMs: 60 * 1000,
    message: 'Too many requests, please try again later.',
  } as RateLimitConfig,
  
  /**
   * Generous: 100 requests per minute
   */
  generous: {
    maxRequests: 100,
    windowMs: 60 * 1000,
    message: 'Too many requests, please try again later.',
  } as RateLimitConfig,
  
  /**
   * Auth endpoints: 5 requests per 15 minutes
   */
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts, please try again later.',
  } as RateLimitConfig,
  
  /**
   * Public API: 1000 requests per hour
   */
  publicAPI: {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000,
    message: 'API rate limit exceeded, please try again later.',
  } as RateLimitConfig,
};

// ================================================================================
// RATE LIMITER IMPLEMENTATION
// ================================================================================

/**
 * Check rate limit using in-memory storage
 */
async function checkRateLimitInMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  
  // No entry or expired
  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    inMemoryStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  // Increment count
  entry.count += 1;
  
  // Check if limit exceeded
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }
  
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const redis = await getRedisClient();
  
  if (!redis) {
    // Fallback to in-memory if Redis is unavailable
    return checkRateLimitInMemory(key, maxRequests, windowMs);
  }
  
  const now = Date.now();
  const resetAt = now + windowMs;
  
  try {
    // Use Redis INCR with EXPIRE for atomic rate limiting
    const count = await redis.incr(key);
    
    if (count === 1) {
      // First request in this window, set expiration
      await redis.pExpire(key, windowMs);
    }
    
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);
    
    return { allowed, remaining, resetAt };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fallback to in-memory on error
    return checkRateLimitInMemory(key, maxRequests, windowMs);
  }
}

/**
 * Main rate limit check function
 */
async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const useRedis = process.env.NODE_ENV === 'production' && process.env.REDIS_URL;
  
  if (useRedis) {
    return checkRateLimitRedis(key, config.maxRequests, config.windowMs);
  } else {
    return checkRateLimitInMemory(key, config.maxRequests, config.windowMs);
  }
}

// ================================================================================
// RATE LIMIT MIDDLEWARE
// ================================================================================

/**
 * Default key generator (uses IP address)
 */
function defaultKeyGenerator(req: NextRequest): string {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
             req.headers.get('x-real-ip') || 
             'unknown';
  
  const path = req.nextUrl.pathname;
  return sanitizeRateLimitKey(`ratelimit:${path}:${ip}`);
}

/**
 * Rate limit middleware for API routes
 */
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig = RateLimitPresets.moderate
): Promise<NextResponse | null> {
  // Skip if configured
  if (config.skip?.(req)) {
    return null;
  }
  
  // Generate key
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const key = keyGenerator(req);
  
  // Check rate limit
  const { allowed, remaining, resetAt } = await checkRateLimit(key, config);
  
  // Add rate limit headers
  const headers = new Headers({
    'X-RateLimit-Limit': config.maxRequests.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': new Date(resetAt).toISOString(),
  });
  
  // If limit exceeded, return 429
  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    headers.set('Retry-After', retryAfter.toString());
    
    return NextResponse.json(
      {
        error: config.message || 'Too many requests',
        retryAfter,
      },
      { status: 429, headers }
    );
  }
  
  // Return null to allow request (caller should add headers to response)
  return null;
}

/**
 * Rate limit helper for Next.js API routes
 */
export async function withRateLimit<T>(
  req: NextRequest,
  handler: () => Promise<T>,
  config: RateLimitConfig = RateLimitPresets.moderate
): Promise<NextResponse | T> {
  const limitResponse = await rateLimit(req, config);
  
  if (limitResponse) {
    return limitResponse;
  }
  
  return handler();
}

// ================================================================================
// USER-BASED RATE LIMITING
// ================================================================================

/**
 * Rate limit by user ID (for authenticated endpoints)
 */
export function rateLimitByUser(userId: string, config: RateLimitConfig): RateLimitConfig {
  return {
    ...config,
    keyGenerator: (req: NextRequest) => {
      return sanitizeRateLimitKey(`ratelimit:user:${userId}:${req.nextUrl.pathname}`);
    },
  };
}

/**
 * Rate limit by tenant/organization
 */
export function rateLimitByTenant(tenantId: string, config: RateLimitConfig): RateLimitConfig {
  return {
    ...config,
    keyGenerator: (req: NextRequest) => {
      return sanitizeRateLimitKey(`ratelimit:tenant:${tenantId}:${req.nextUrl.pathname}`);
    },
  };
}

// ================================================================================
// DISTRIBUTED RATE LIMITING (for horizontal scaling)
// ================================================================================

/**
 * Sliding window rate limiter (more accurate than fixed window)
 */
export async function slidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redis = await getRedisClient();
  
  if (!redis) {
    // Fallback to fixed window in-memory
    const result = await checkRateLimitInMemory(key, maxRequests, windowMs);
    return { allowed: result.allowed, remaining: result.remaining };
  }
  
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    // Remove old entries
    await redis.zRemRangeByScore(key, 0, windowStart);
    
    // Count requests in window
    const count = await redis.zCard(key);
    
    if (count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }
    
    // Add current request
    await redis.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    await redis.expire(key, Math.ceil(windowMs / 1000));
    
    return { allowed: true, remaining: maxRequests - count - 1 };
  } catch (error) {
    console.error('Sliding window rate limit error:', error);
    // Allow on error (fail open)
    return { allowed: true, remaining: maxRequests };
  }
}

// ================================================================================
// CLEANUP
// ================================================================================

/**
 * Cleanup rate limiting resources
 */
export async function cleanupRateLimiting(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
  inMemoryStore.clear();
  console.log('? Rate limiting resources cleaned up');
}

