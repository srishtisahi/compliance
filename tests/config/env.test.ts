import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import dotenv from 'dotenv';

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Environment Configuration', () => {
  // Save original process.env
  const originalEnv = { ...process.env };
  
  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset modules to ensure fresh instances
    jest.resetModules();
    
    // Setup basic required env variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/compliance-test';
    process.env.JWT_SECRET = 'test-secret';
    process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
    process.env.MISTRAL_API_KEY = 'test-mistral-key';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
  });
  
  afterEach(() => {
    // Restore original process.env
    process.env = originalEnv;
  });
  
  it('should load configuration successfully with all required variables', () => {
    // Import the config module
    const { config } = require('../../src/config/env');
    
    // Verify dotenv.config was called
    expect(dotenv.config).toHaveBeenCalled();
    
    // Verify config object has expected values
    expect(config).toEqual(expect.objectContaining({
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/compliance-test',
      JWT_SECRET: 'test-secret',
      PERPLEXITY_API_KEY: 'test-perplexity-key',
      MISTRAL_API_KEY: 'test-mistral-key',
      GEMINI_API_KEY: 'test-gemini-key',
    }));
  });
  
  it('should throw error when required API keys are missing', () => {
    // Remove required API keys
    delete process.env.PERPLEXITY_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    
    // Import should throw an error
    expect(() => {
      require('../../src/config/env');
    }).toThrow('Missing required environment variables: PERPLEXITY_API_KEY, MISTRAL_API_KEY');
  });
  
  it('should throw error when JWT_SECRET is missing', () => {
    // Remove JWT_SECRET
    delete process.env.JWT_SECRET;
    
    // Import should throw an error
    expect(() => {
      require('../../src/config/env');
    }).toThrow('Missing required environment variables: JWT_SECRET');
  });
  
  it('should throw error when MongoDB URI for current environment is missing', () => {
    // Remove MongoDB URI for test environment
    delete process.env.MONGODB_URI_TEST;
    
    // Import should throw an error
    expect(() => {
      require('../../src/config/env');
    }).toThrow('MongoDB URI for "test" environment is not defined');
  });
  
  it('should use development as default environment', () => {
    // Set NODE_ENV to undefined
    delete process.env.NODE_ENV;
    
    // Setup MongoDB URI for development
    process.env.MONGODB_URI_DEV = 'mongodb://localhost:27017/compliance-dev';
    
    // Import the config module
    const { config } = require('../../src/config/env');
    
    // Verify config object has development values
    expect(config.NODE_ENV).toBe('development');
    expect(config.MONGODB_URI).toBe('mongodb://localhost:27017/compliance-dev');
  });
  
  it('should parse boolean environment variables correctly', () => {
    // Set boolean environment variables
    process.env.USE_MORGAN_LOGGER = 'true';
    
    // Import the config module
    const { config } = require('../../src/config/env');
    
    // Verify boolean parsing
    expect(config.USE_MORGAN_LOGGER).toBe(true);
    
    // Reset modules
    jest.resetModules();
    
    // Set to false
    process.env.USE_MORGAN_LOGGER = 'false';
    
    // Import again
    const { config: updatedConfig } = require('../../src/config/env');
    
    // Verify boolean parsing
    expect(updatedConfig.USE_MORGAN_LOGGER).toBe(false);
  });
  
  it('should parse number environment variables correctly', () => {
    // Set number environment variables
    process.env.PORT = '4000';
    process.env.RATE_LIMIT_WINDOW_MS = '300000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '50';
    
    // Import the config module
    const { config } = require('../../src/config/env');
    
    // Verify number parsing
    expect(config.PORT).toBe(4000);
    expect(config.RATE_LIMIT_WINDOW_MS).toBe(300000);
    expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(50);
  });
}); 