import { Request, Response, NextFunction } from 'express';
import { 
  errorHandler, 
  ApiError, 
  PerplexityApiError, 
  MistralApiError, 
  GeminiApiError 
} from '../../../../src/api/middlewares/errorHandler';
import { logger } from '../../../../src/utils/logger';
import axios from 'axios';

// Mock the logger to avoid actual console output during tests
jest.mock('../../../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    debug: jest.fn(),
  }
}));

describe('Error Handler Middleware', () => {
  // Setup mock request, response, and next function
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;

  beforeEach(() => {
    jsonSpy = jest.fn().mockReturnThis();
    statusSpy = jest.fn().mockReturnValue({ json: jsonSpy });
    
    mockRequest = {
      originalUrl: '/api/test',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {}
    };
    
    mockResponse = {
      status: statusSpy,
      json: jsonSpy
    };
    
    mockNext = jest.fn();
    
    // Clear mock calls
    jest.clearAllMocks();
  });
  
  test('handles ApiError correctly', () => {
    const apiError = new ApiError(400, 'Bad Request');
    
    errorHandler(apiError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 400,
      message: 'Bad Request'
    }));
    expect(logger.error).toHaveBeenCalled();
  });
  
  test('handles PerplexityApiError correctly', () => {
    const perplexityError = new PerplexityApiError('Perplexity API error', 503, 'SERVICE_UNAVAILABLE');
    
    errorHandler(perplexityError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(503);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 503,
      message: 'Perplexity API error',
      source: 'Perplexity API',
      code: 'SERVICE_UNAVAILABLE'
    }));
  });
  
  test('handles MistralApiError correctly', () => {
    const mistralError = new MistralApiError('File not found', 400, 'FILE_NOT_FOUND');
    
    errorHandler(mistralError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 400,
      message: 'File not found',
      source: 'Mistral OCR API',
      code: 'FILE_NOT_FOUND'
    }));
  });
  
  test('handles GeminiApiError correctly', () => {
    const geminiError = new GeminiApiError('Invalid input', 400, 'INVALID_ARGUMENT');
    
    errorHandler(geminiError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 400,
      message: 'Invalid input',
      source: 'Google Gemini API',
      code: 'INVALID_ARGUMENT'
    }));
  });
  
  test('handles Axios errors correctly', () => {
    const axiosError = new Error('Network Error') as any;
    axiosError.isAxiosError = true;
    axiosError.config = { url: 'https://api.perplexity.ai/endpoint' };
    axiosError.response = {
      status: 429,
      data: {
        error: {
          message: 'Too Many Requests',
          code: 'RATE_LIMIT_EXCEEDED'
        }
      }
    };
    
    errorHandler(axiosError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(429);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 429,
      message: 'External API Error',
      source: 'Perplexity API',
      details: expect.objectContaining({
        apiMessage: 'Too Many Requests',
        apiStatusCode: 429
      })
    }));
  });
  
  test('handles Mongoose validation errors correctly', () => {
    const validationError = new Error('Validation failed') as any;
    validationError.name = 'ValidationError';
    
    errorHandler(validationError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 400,
      message: 'Validation Error',
      details: expect.objectContaining({
        error: 'Validation failed'
      })
    }));
  });
  
  test('handles MongoDB duplicate key errors correctly', () => {
    const duplicateKeyError = new Error('Duplicate key error') as any;
    duplicateKeyError.name = 'MongoServerError';
    duplicateKeyError.code = 11000;
    duplicateKeyError.keyValue = { email: 'test@example.com' };
    
    errorHandler(duplicateKeyError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(409);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 409,
      message: 'Duplicate key error',
      details: expect.objectContaining({
        duplicateKey: { email: 'test@example.com' }
      })
    }));
  });
  
  test('handles multer file upload errors correctly', () => {
    const multerError = new Error('File too large') as any;
    multerError.name = 'MulterError';
    
    errorHandler(multerError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 400,
      message: 'File upload error: File too large'
    }));
  });
  
  test('handles JSON parse errors correctly', () => {
    const syntaxError = new SyntaxError('Unexpected token in JSON') as any;
    syntaxError.type = 'entity.parse.failed';
    
    errorHandler(syntaxError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(400);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 400,
      message: 'Invalid JSON in request body'
    }));
  });
  
  test('handles unknown errors correctly with 500 status code', () => {
    const unknownError = new Error('Something went wrong');
    
    errorHandler(unknownError, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(statusSpy).toHaveBeenCalledWith(500);
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      status: 500,
      message: 'Internal Server Error'
    }));
  });
  
  test('includes stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const error = new Error('Development error');
    error.stack = 'Error stack trace';
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(jsonSpy).toHaveBeenCalledWith(expect.objectContaining({
      stack: 'Error stack trace'
    }));
    
    // Reset environment
    process.env.NODE_ENV = originalEnv;
  });
  
  test('does not include stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    const error = new Error('Production error');
    error.stack = 'Error stack trace';
    
    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
    
    expect(jsonSpy).toHaveBeenCalledWith(expect.not.objectContaining({
      stack: expect.anything()
    }));
    
    // Reset environment
    process.env.NODE_ENV = originalEnv;
  });
}); 