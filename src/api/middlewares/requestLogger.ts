import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { sanitizeData } from '../../utils/sanitizer';

/**
 * Middleware to log incoming requests with sanitized data
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate or use existing request ID
  const requestId = req.headers['x-request-id'] || 
                    req.headers['request-id'] || 
                    `req-${Math.random().toString(36).substring(2, 15)}`;
  
  // Add request ID to response headers for tracking
  res.setHeader('x-request-id', requestId as string);
  
  // Assign requestId to req object for use in other middleware
  req.requestId = requestId;
  
  // Log request details with sanitized data
  const sanitizedBody = sanitizeData(req.body);
  const sanitizedQuery = sanitizeData(req.query);
  
  // Log request start
  logger.http(
    `[${requestId}] Request: ${req.method} ${req.originalUrl} - IP: ${req.ip}`,
    {
      requestId,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: sanitizedBody,
      query: sanitizedQuery,
      timestamp: new Date().toISOString()
    }
  );
  
  // Track response time
  const startTime = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
    
    logger[logLevel](
      `[${requestId}] Response: ${statusCode} - ${responseTime}ms`,
      {
        requestId,
        method: req.method,
        url: req.originalUrl,
        statusCode, 
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      }
    );
  });
  
  next();
};

// Extend Express Request interface to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string | string[];
    }
  }
} 