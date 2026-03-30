/**
 * Simple in-memory rate limiter
 * Production: consider Upstash Redis for multi-instance deployments
 */

interface RateLimitRecord {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitRecord>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key)
    }
  }
}, 10 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: number
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (e.g., 'send-pec:user-id' or 'delete:ip')
 * @param maxRequests - Maximum requests allowed in window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // No record or expired - reset
  if (!record || now > record.resetAt) {
    const resetAt = now + windowMs
    rateLimitMap.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    }
  }

  // Limit exceeded
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    }
  }

  // Increment counter
  record.count++
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  }
}

/**
 * Get client IP from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] ?? realIp ?? 'unknown'
}
