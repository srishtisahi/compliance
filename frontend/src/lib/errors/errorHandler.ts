import { NextRequest, NextResponse } from 'next/server'; // Use Next.js types if adapting middleware
import { logger } from '@/lib/utils/logger'; // Updated path
// import { sanitizeError } from '@/lib/utils/sanitizer'; // Comment out sanitizer
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

// Note: The Express middleware function itself is not directly used here, 
// but the error classes and factory function are needed by the service.
// If you wanted a global error handler for API routes, you'd implement it differently.

/* // Original Express middleware - Keep for reference or adaptation if needed
export const errorHandler = (
  err: Error | ApiError | AxiosError,
  req: Request, 
  res: Response,
  next: NextFunction
): void => {
  // ... original middleware logic ... 
};
*/ 