import winston from 'winston';
// import { sanitizeData } from './sanitizer'; // TODO: Migrate or remove sanitizer if needed
import path from 'path';
import fs from 'fs';

// Create logs directory if it doesn't exist - May need adjustment for serverless environments
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
  } catch (err) {
    console.error('Failed to create log directory:', err); // Use console here as logger might not be ready
  }
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
  return isDevelopment ? 'debug' : 'warn'; // Keep debug for development
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

/**
 * Custom format for console output - friendly and colorized
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const message = typeof info.message === 'string' ? info.message : JSON.stringify(info.message);
    let logString = `${info.timestamp} ${info.level}: ${message}`;
    
    const metadata: Record<string, any> = {};
    Object.keys(info).forEach(key => {
      if (!['timestamp', 'level', 'message', 'ms', 'stack'].includes(key)) { // Added 'stack' to exclude
        metadata[key] = info[key];
      }
    });
    
    // Keep console logs clean
    // if (Object.keys(metadata).length > 0) { ... }
    
    // Include stack trace for errors if available
    if (info.stack) {
      logString += `\n${info.stack}`;
    } 

    return logString;
  })
);

/**
 * Custom format for file output - JSON with all metadata
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }), // Log stack traces to files
  winston.format.json()
  /* // Temporarily disable sanitizer
  winston.format(info => {
    const sanitizedInfo = { ...info };
    if (typeof info.message === 'object' && info.message !== null) {
      sanitizedInfo.message = sanitizeData(info.message);
    }
    Object.keys(sanitizedInfo).forEach(key => {
      if (key !== 'message') {
        sanitizedInfo[key] = sanitizeData(sanitizedInfo[key]);
      }
    });
    return sanitizedInfo;
  })()
  */
);

// Define transports - Adapt file paths if needed
const transports = [
  new winston.transports.Console({
    format: consoleFormat,
    level: level() // Ensure console respects the level setting
  }),
  /* // Disable file logging for now, focus on console for Next.js API routes
  new winston.transports.File({
    filename: path.join(logDir, 'error.log'),
    level: 'error',
    format: fileFormat
  }),
  new winston.transports.File({ 
    filename: path.join(logDir, 'all.log'),
    format: fileFormat
  }),
  */
];

// Create the logger instance
export const logger = winston.createLogger({
  level: level(),
  levels,
  format: winston.format.errors({ stack: true }), // Ensure errors are logged with stack
  transports,
  exitOnError: false,
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