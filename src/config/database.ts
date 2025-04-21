import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { config } from './env';

/**
 * MongoDB connection options for all environments
 */
const connectionOptions: mongoose.ConnectOptions = {
  autoIndex: true,
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5, // Maintain at least 5 socket connections
  retryWrites: true, // Enable retryable writes
  retryReads: true, // Enable retryable reads
  // Use the WriteConcern type for w property
  writeConcern: {
    w: 'majority',
  },
};

/**
 * Environment-specific database configuration
 */
interface DatabaseConfig {
  uri: string;
  options: mongoose.ConnectOptions;
}

/**
 * Get the database configuration based on the current environment
 */
const getDatabaseConfig = (): DatabaseConfig => {
  // Use the URI from our config which already handles environment selection
  return {
    uri: config.MONGODB_URI,
    options: config.NODE_ENV === 'production' 
      ? { ...connectionOptions, autoIndex: false }
      : connectionOptions,
  };
};

/**
 * Connect to MongoDB
 */
export const connectDB = async (): Promise<void> => {
  try {
    const dbConfig = getDatabaseConfig();
    
    mongoose.connection.on('connected', () => {
      logger.info(`MongoDB connected successfully to ${maskConnectionString(dbConfig.uri)}`);
    });
    
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.info('MongoDB disconnected');
    });
    
    await mongoose.connect(dbConfig.uri, dbConfig.options);
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    // Exit process with failure in non-test environments
    if (config.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Mask the connection string for logging purposes
 */
const maskConnectionString = (connectionString: string): string => {
  try {
    const url = new URL(connectionString);
    // Mask username and password if present
    if (url.username || url.password) {
      return connectionString.replace(
        `${url.username}:${url.password}@`,
        '***:***@'
      );
    }
    return url.toString();
  } catch {
    // If parsing fails, return a generic masked string
    return connectionString.includes('@')
      ? connectionString.replace(/\/\/.*@/, '//***:***@')
      : connectionString;
  }
};

/**
 * Get MongoDB connection status
 */
export const getConnectionStatus = (): {
  connected: boolean;
  status: number;
  dbName?: string;
} => {
  const status = mongoose.connection.readyState;
  return {
    connected: status === 1,
    status,
    dbName: mongoose.connection.db?.databaseName,
  };
}; 