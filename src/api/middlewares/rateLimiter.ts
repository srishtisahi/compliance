import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { logger } from '../../utils/logger';

/**
 * Rate limiting middleware factory function
 * 
 * @param key Identifier for the rate limiter (e.g., 'perplexity', 'gemini')
 * @param points Number of requests allowed in the duration
 * @param duration Duration in seconds
 * @returns Express middleware for rate limiting
 */
export function rateLimiter(
  key: string, 
  points: number = 10, 
  duration: number = 60
) {
  // Create rate limiter instance
  const limiter = new RateLimiterMemory({
    keyPrefix: `ratelimit:${key}`,
    points,
    duration
  });
  
  // Return middleware function
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use IP address as consumer identifier
      // In production, you might want to use authenticated user ID
      const identifier = req.ip || 'unknown';
      
      // Try to consume a point from the rate limiter
      await limiter.consume(identifier);
      
      // If successful, proceed to the next middleware
      next();
    } catch (error) {
      // If rate limit is exceeded
      logger.warn(`Rate limit exceeded for ${key} by ${req.ip}`);
      
      // Calculate retry after time
      const retryAfter = Math.ceil((error as any).msBeforeNext / 1000) || 60;
      
      // Set headers and return error response
      res.set('Retry-After', String(retryAfter));
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
      });
    }
  };
} 