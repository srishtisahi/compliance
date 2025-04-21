# Logging System Documentation

## Overview

The compliance system implements a comprehensive logging system that captures request information, responses, and errors while ensuring sensitive data is properly sanitized. This logging system helps with debugging, monitoring, and auditing the application.

## Features

- **Structured Logging**: All logs include structured metadata for easier parsing and analysis
- **Sensitive Data Sanitization**: Automatically redacts sensitive information like passwords, tokens, and PII
- **Request/Response Logging**: Captures HTTP requests and responses with timing information
- **Error Tracking**: Detailed error logging with contextual information
- **Request ID Tracking**: Assigns unique IDs to requests for end-to-end tracing
- **Environment-aware**: Different log levels based on environment (development vs production)

## Components

The logging system consists of these main components:

1. **Logger Utility** (`src/utils/logger.ts`): Winston-based logger with console and file transports
2. **Request Logger Middleware** (`src/api/middlewares/requestLogger.ts`): Captures HTTP request/response details
3. **Data Sanitizer** (`src/utils/sanitizer.ts`): Removes sensitive information from logs
4. **Error Handler** (`src/api/middlewares/errorHandler.ts`): Formats and logs error information

## Usage

### Basic Logging

```typescript
import { logger } from '../utils/logger';

// Simple message logging
logger.info('User account created');

// Logging with metadata
logger.info('User logged in', {
  userId: '123',
  username: 'johndoe', 
  ipAddress: '192.168.1.1'
});

// Error logging
try {
  // Some operation that might fail
} catch (error) {
  logger.error('Failed to process document', {
    documentId: '456',
    error
  });
}
```

### Log Levels

The system uses the following log levels (in order of severity):

1. `error`: Critical errors requiring immediate attention
2. `warn`: Warning conditions that should be addressed
3. `info`: Informational messages about normal operations
4. `http`: HTTP request/response logging
5. `debug`: Detailed debugging information (only in development)

In production, only warnings and errors are logged by default. In development, all log levels are enabled.

## Log File Structure

Logs are stored in the `logs/` directory:

- `logs/error.log`: Contains only error-level logs
- `logs/all.log`: Contains all logs at configured levels

## Sensitive Data Protection

The sanitizer automatically redacts the following types of sensitive data:

- Authentication credentials (passwords, tokens, API keys)
- Personal Identifiable Information (PII) like email, phone, name, etc.
- Financial information (credit card, account numbers)

Fields are masked based on key names, not values, to ensure consistent protection.

## Configuration

Logging behavior can be configured via environment variables:

- `NODE_ENV`: Determines log level (`development` = all logs, other = warn and error only)
- `LOG_LEVEL`: Override default log level
- `USE_MORGAN_LOGGER`: Enable/disable Morgan HTTP request logger (default: false)

## Best Practices

1. **Never log sensitive information** like passwords or tokens
2. **Use structured logging** with metadata for easier analysis
3. **Include context** in log messages (IDs, operation types)
4. **Use appropriate log levels** for different types of events
5. **Include request IDs** when logging within request handling 