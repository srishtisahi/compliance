import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { sanitizeError } from '../../utils/sanitizer';
import axios, { AxiosError } from 'axios';

// Custom error class with status code
export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  errorCode?: string;
  source?: string;

  constructor(
    statusCode: number, 
    message: string, 
    isOperational = true, 
    errorCode?: string,
    source?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.source = source;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Custom error classes for external APIs
export class PerplexityApiError extends ApiError {
  constructor(message: string, statusCode = 500, errorCode?: string) {
    super(statusCode, message, true, errorCode, 'Perplexity API');
  }
}

export class MistralApiError extends ApiError {
  constructor(message: string, statusCode = 500, errorCode?: string) {
    super(statusCode, message, true, errorCode, 'Mistral OCR API');
  }
}

export class GeminiApiError extends ApiError {
  constructor(message: string, statusCode = 500, errorCode?: string) {
    super(statusCode, message, true, errorCode, 'Google Gemini API');
  }
}

// API error factory to map axios errors to our custom error types
export const createApiErrorFromAxiosError = (error: unknown, apiType: 'perplexity' | 'mistral' | 'gemini'): ApiError => {
  let statusCode = 500;
  let message = 'External API error';
  let errorCode: string | undefined;
  
  if (axios.isAxiosError(error)) {
    statusCode = error.response?.status || 500;
    message = error.response?.data?.error?.message || error.message || 'External API error';
    errorCode = error.response?.data?.error?.code;
  } else if (error instanceof Error) {
    message = error.message || 'External API error';
  }
  
  switch (apiType) {
    case 'perplexity':
      return new PerplexityApiError(message, statusCode, errorCode);
    case 'mistral':
      return new MistralApiError(message, statusCode, errorCode);
    case 'gemini':
      return new GeminiApiError(message, statusCode, errorCode);
    default:
      return new ApiError(statusCode, message, true, errorCode);
  }
};

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError | AxiosError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorDetails: Record<string, any> = {};
  let errorSource: string | undefined;
  let errorCode: string | undefined;
  
  // If it's our custom ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSource = err.source;
    errorCode = err.errorCode;
  } else if (axios.isAxiosError(err)) {
    // Handle Axios errors (API requests)
    statusCode = err.response?.status || 500;
    message = 'External API Error';
    errorDetails = {
      apiMessage: err.response?.data?.error?.message || err.message,
      apiStatusCode: err.response?.status,
    };
    // Determine API source from URL if possible
    const url = err.config?.url || '';
    if (url.includes('perplexity')) errorSource = 'Perplexity API';
    else if (url.includes('mistral')) errorSource = 'Mistral OCR API';
    else if (url.includes('generativelanguage')) errorSource = 'Google Gemini API';
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    errorDetails = { error: err.message };
  } else if (err.name === 'CastError') {
    // Mongoose cast error
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate key error';
    const keyValue = (err as any).keyValue;
    errorDetails = { duplicateKey: keyValue };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    // Multer errors (file uploads)
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  } else if (err.name === 'SyntaxError' && (err as any).type === 'entity.parse.failed') {
    // JSON parse error
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }
  
  // Generate request identifier for tracking if not already set
  const requestId = req.requestId || 
                   req.headers['x-request-id'] || 
                   Math.random().toString(36).substring(2, 15);
  
  // Create sanitized error information for logging
  const sanitizedError = sanitizeError(err);
  
  // Log the error with context
  logger.error(`[${requestId}] ${statusCode} - ${message} - ${req.originalUrl} - ${req.method}`, {
    requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    errorSource,
    errorCode,
    error: sanitizedError,
    timestamp: new Date().toISOString()
  });
  
  // Send the error response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message,
    requestId,
    ...(errorSource && { source: errorSource }),
    ...(errorCode && { code: errorCode }),
    ...(Object.keys(errorDetails).length > 0 && { details: errorDetails }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}; 