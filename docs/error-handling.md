# Error Handling Middleware

This document explains the error handling system in the compliance application. The system provides standardized error responses and proper logging for all types of errors.

## Overview

The error handling middleware intercepts all errors thrown during request processing and:

1. Logs detailed error information for debugging
2. Formats consistent error responses to clients
3. Handles different error types appropriately
4. Provides context about the error source (especially for external API errors)

## Error Response Format

All API errors follow this consistent format:

```json
{
  "success": false,
  "status": 400,                                // HTTP status code
  "message": "Error message for the client",    // User-friendly message
  "requestId": "abc123",                        // Unique identifier for tracking
  "source": "Perplexity API",                   // Optional: Error source (for API errors)
  "code": "RESOURCE_NOT_FOUND",                 // Optional: Error code
  "details": {                                  // Optional: Additional error details
    "field": "value",
    "reason": "specific reason"
  },
  "stack": "Error stack trace..."               // Development mode only
}
```

## Error Types

The system includes several custom error types:

### `ApiError`

Base error class for all API errors:

```typescript
new ApiError(statusCode, message, isOperational, errorCode, source)
```

Example:
```typescript
throw new ApiError(404, 'Resource not found', true, 'RESOURCE_NOT_FOUND');
```

### API-Specific Error Classes

For each external API integration:

- `PerplexityApiError`: Errors from Perplexity Sonar API
- `MistralApiError`: Errors from Mistral OCR API
- `GeminiApiError`: Errors from Google Gemini API

Example:
```typescript
throw new PerplexityApiError('API rate limit exceeded', 429, 'RATE_LIMIT_EXCEEDED');
```

## Error Handling Helpers

### API Error Factory

Convert Axios errors to custom error types:

```typescript
try {
  // API call
} catch (error) {
  throw createApiErrorFromAxiosError(error, 'perplexity');
}
```

## Handled Error Types

The middleware automatically handles these error types:

| Error Type | Status Code | Description |
|------------|-------------|-------------|
| `ApiError` and subclasses | From error | Custom application errors |
| Axios errors | From response | External API request errors |
| `ValidationError` | 400 | Mongoose validation errors |
| `CastError` | 400 | Mongoose invalid ID format |
| `MongoServerError` (code 11000) | 409 | MongoDB duplicate key errors |
| `JsonWebTokenError` | 401 | Invalid JWT token |
| `TokenExpiredError` | 401 | Expired JWT token |
| `MulterError` | 400 | File upload errors |
| `SyntaxError` (JSON parse) | 400 | Invalid JSON in request body |
| Other errors | 500 | Uncaught exceptions |

## Usage in Services

```typescript
import { PerplexityApiError, createApiErrorFromAxiosError } from '../api/middlewares/errorHandler';

async function serviceMethod() {
  try {
    // API call or other operations
    if (!someRequiredVariable) {
      throw new PerplexityApiError('Required data missing', 400, 'MISSING_DATA');
    }
    
    // External API call
    const response = await axios.get('https://api.example.com/data');
    return response.data;
  } catch (error) {
    // If it's an Axios error, convert it to the appropriate API error
    if (axios.isAxiosError(error)) {
      throw createApiErrorFromAxiosError(error, 'perplexity');
    }
    // If already a custom error, just rethrow
    if (error instanceof PerplexityApiError) {
      throw error;
    }
    // Otherwise, create a new API error
    throw new PerplexityApiError('Service operation failed', 500);
  }
}
```

## Error Codes

Recommended error codes for each API:

### Perplexity API
- `API_KEY_MISSING`: API key not configured
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INVALID_QUERY`: Invalid search query
- `SERVICE_UNAVAILABLE`: Perplexity API is unavailable

### Mistral OCR API
- `API_KEY_MISSING`: API key not configured
- `FILE_NOT_FOUND`: Document file not found
- `INVALID_FILE_FORMAT`: Unsupported file format
- `OCR_PROCESSING_FAILED`: Text extraction failed

### Gemini API
- `API_KEY_MISSING`: API key not configured
- `PROMPT_TOO_LONG`: Input prompt exceeds limits
- `CONTENT_FILTERED`: Content violated safety policies
- `MODEL_UNAVAILABLE`: Requested model is not available

## Testing

The error handler has comprehensive test coverage. Run the tests with:

```bash
npm test -- --testPathPattern=errorHandler
``` 