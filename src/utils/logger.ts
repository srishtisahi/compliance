import winston from 'winston';
import { sanitizeData } from './sanitizer';
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

/**
 * Custom format for console output - friendly and colorized
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    // Handle message with metadata
    const message = typeof info.message === 'string' ? info.message : JSON.stringify(info.message);
    let logString = `${info.timestamp} ${info.level}: ${message}`;
    
    // Add metadata if present (excluding standard fields)
    // Create a new object without the fields we want to exclude instead of using delete
    const metadata: Record<string, any> = {};
    Object.keys(info).forEach(key => {
      if (!['timestamp', 'level', 'message', 'ms'].includes(key)) {
        metadata[key] = info[key];
      }
    });
    
    if (Object.keys(metadata).length > 0) {
      // Don't include metadata in console format to keep it clean
      // But we could enable it with this line if needed:
      // logString += ` ${JSON.stringify(metadata)}`;
    }
    
    return logString;
  })
);

/**
 * Custom format for file output - JSON with all metadata
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.json(),
  winston.format(info => {
    // Sanitize sensitive data in metadata
    const sanitizedInfo = { ...info };
    
    // Sanitize the message if it's an object
    if (typeof info.message === 'object' && info.message !== null) {
      sanitizedInfo.message = sanitizeData(info.message);
    }
    
    // Sanitize all other metadata fields
    Object.keys(sanitizedInfo).forEach(key => {
      if (key !== 'message') {
        sanitizedInfo[key] = sanitizeData(sanitizedInfo[key]);
      }
    });
    
    return sanitizedInfo;
  })()
);

// Define which transports the logger must use
const transports = [
  // Console transport for all logs
  new winston.transports.Console({
    format: consoleFormat
  }),
  
  // File transport for error logs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: fileFormat
  }),
  
  // File transport for all logs
  new winston.transports.File({ 
    filename: 'logs/all.log',
    format: fileFormat
  }),
];

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  transports,
  exitOnError: false, // Don't exit on handled exceptions
});

/**
 * Extended logger interface with typed metadata support
 */
export interface LoggerWithMetadata {
  error(message: string | object, metadata?: Record<string, any>): void;
  warn(message: string | object, metadata?: Record<string, any>): void;
  info(message: string | object, metadata?: Record<string, any>): void;
  http(message: string | object, metadata?: Record<string, any>): void;
  debug(message: string | object, metadata?: Record<string, any>): void;
}

// Export logger as LoggerWithMetadata interface
export default logger as LoggerWithMetadata; 