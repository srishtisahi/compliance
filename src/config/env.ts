import { logger } from '../utils/logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable configuration with validation
 */
export interface EnvConfig {
  // Server
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  API_PREFIX: string;
  
  // Database
  MONGODB_URI: string;
  
  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // Logging
  LOG_LEVEL: string;
  USE_MORGAN_LOGGER: boolean;
  
  // External APIs
  PERPLEXITY_API_KEY: string;
  MISTRAL_API_KEY: string;
  GEMINI_API_KEY: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // CORS
  CORS_ORIGIN: string;
}

/**
 * Gets the appropriate MongoDB URI based on the current environment
 * And securely replaces the password placeholder
 */
function getMongoDbUri(): string {
  const env = process.env.NODE_ENV || 'development';
  
  // Define environment-specific URIs
  const uriEnvVars = {
    development: 'MONGODB_URI_DEV',
    test: 'MONGODB_URI_TEST',
    production: 'MONGODB_URI_PROD',
  };
  
  // Get the appropriate URI environment variable
  const uriEnvVar = uriEnvVars[env as keyof typeof uriEnvVars];
  const uri = process.env[uriEnvVar];
  
  if (!uri) {
    throw new Error(`MongoDB URI for "${env}" environment is not defined in ${uriEnvVar}`);
  }
  
  // Get password from environment variable
  const password = process.env.MONGODB_PASSWORD;
  
  if (!password) {
    throw new Error('MongoDB password is not defined in MONGODB_PASSWORD');
  }
  
  // Replace password placeholder with actual password
  // This handles both <db_password> and other placeholder formats
  try {
    // First try to parse as URL to safely replace password
    const url = new URL(uri);
    
    // Check if the username:password part exists and contains a placeholder
    if (url.username && url.password.includes('<')) {
      // Replace entire auth part to ensure security
      const newAuth = `${url.username}:${encodeURIComponent(password)}`;
      return uri.replace(`${url.username}:${url.password}`, newAuth);
    } else {
      // If no placeholder in URL format, try regex replacement
      return uri.replace(/<db_password>|<password>|{password}|{{password}}/, encodeURIComponent(password));
    }
  } catch (error) {
    // Not a valid URL format, fall back to simple replacement
    // This handles standard connection strings that aren't valid URLs
    return uri.replace(/<db_password>|<password>|{password}|{{password}}/, encodeURIComponent(password));
  }
}

/**
 * Required API keys that must be present for the application to start
 */
const REQUIRED_API_KEYS = [
  'PERPLEXITY_API_KEY',
  'MISTRAL_API_KEY',
  'GEMINI_API_KEY',
];

/**
 * Validates that all required environment variables are present
 */
function validateEnv(): void {
  const missingVars: string[] = [];
  
  // Validate API keys
  REQUIRED_API_KEYS.forEach(key => {
    if (!process.env[key]) {
      missingVars.push(key);
    }
  });
  
  // Validate other required variables
  if (!process.env.JWT_SECRET) {
    missingVars.push('JWT_SECRET');
  }
  
  if (!process.env.MONGODB_PASSWORD) {
    missingVars.push('MONGODB_PASSWORD');
  }
  
  // Validate MongoDB URI for current environment
  const env = process.env.NODE_ENV || 'development';
  const uriEnvVar = env === 'development' ? 'MONGODB_URI_DEV' : 
                    env === 'test' ? 'MONGODB_URI_TEST' : 'MONGODB_URI_PROD';
                   
  if (!process.env[uriEnvVar]) {
    missingVars.push(uriEnvVar);
  }
  
  // Log and throw error if missing variables
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Parse boolean environment variables
 */
function parseBoolean(value: string | undefined): boolean {
  return value?.toLowerCase() === 'true';
}

/**
 * Parse number environment variables
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Validate environment variables
validateEnv();

// Create and export config object
export const config: EnvConfig = {
  // Server
  NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
  PORT: parseNumber(process.env.PORT, 3001),
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  
  // Database
  MONGODB_URI: getMongoDbUri(),
  
  // Authentication
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  USE_MORGAN_LOGGER: parseBoolean(process.env.USE_MORGAN_LOGGER),
  
  // External APIs
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY!,
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY!,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY!,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  
  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3001',
}; 